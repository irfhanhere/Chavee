import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY')!
const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!

// Cashfree's vendor-level settlement-eligibility API lives on a DIFFERENT base URL
// (api/v2) than the PG order/vendor APIs used elsewhere (sandbox.cashfree.com/pg) —
// confirmed via https://www.cashfree.com/docs/payments/split/settlements/delay/vendor-level
// Base host is chosen by the CASHFREE_ENV secret:
//   npx supabase secrets set CASHFREE_ENV=production   (or: sandbox)
// Unset -> test. Must match the CASHFREE_SECRET_KEY / CASHFREE_APP_ID
// environment. Re-check the production host against current Cashfree
// payout/settlement (api/v2) docs before the production cutover.
const CASHFREE_ENV = (Deno.env.get('CASHFREE_ENV') ?? 'sandbox').toLowerCase()
const CASHFREE_V2_BASE_URL = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/api/v2'
  : 'https://test.cashfree.com/api/v2'

const EARLY_RELEASE_THRESHOLD = 2000 // ₹ — matches the mock rule already shown on the Earnings page

// This API's success/error response shape differs from the PG endpoints
// ({ status, subCode, message } rather than the usual PG error body), so it gets its
// own small request helper rather than reusing the PG-shaped one from other functions.
async function cashfreeV2Request(method: string, path: string, body?: unknown) {
  const url = `${CASHFREE_V2_BASE_URL}${path}`
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Id': CASHFREE_APP_ID,
      'X-Client-Secret': CASHFREE_SECRET_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || `Cashfree v2 API error: ${response.status}`)
  }
  return data
}

// Cashfree's settlementEligibilityDateUpdate example has no timezone suffix and their docs
// say timestamps are stored in IST — formatting as IST "YYYY-MM-DD HH:MM:SS" to match.
function nowAsIstString(): string {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000) // UTC + 5:30
  return istNow.toISOString().slice(0, 19).replace('T', ' ')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, CF_SERVICE_ROLE_KEY)
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Resolve the caller's own vendor id — this function only ever acts on the
    // caller's own unsettled earnings, never an arbitrary seller_id from the request body.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('cashfree_vendor_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.cashfree_vendor_id) {
      return new Response(JSON.stringify({ message: 'No vendor account set up — nothing to release' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Unsettled, approved, paid earnings for this seller
    const { data: contracts, error: contractsError } = await supabase
      .from('gig_contracts')
      .select('id, cashfree_order_id, seller_net_amount')
      .eq('seller_id', user.id)
      .eq('payment_status', 'paid')
      .eq('status', 'approved')
      .is('vendor_settled_at', null)

    if (contractsError) {
      console.error('Failed to fetch unsettled contracts:', contractsError)
      return new Response(JSON.stringify({ error: 'Failed to check earnings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const eligibleContracts = (contracts || []).filter(c => c.cashfree_order_id)
    const totalUnsettled = eligibleContracts.reduce((sum, c) => sum + (Number(c.seller_net_amount) || 0), 0)

    if (totalUnsettled < EARLY_RELEASE_THRESHOLD) {
      return new Response(JSON.stringify({
        message: 'Threshold not reached — no early release requested',
        total_unsettled: totalUnsettled,
        threshold: EARLY_RELEASE_THRESHOLD,
        released: [],
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Threshold crossed — request early settlement eligibility for each qualifying order.
    // This only REQUESTS release; it does not mark anything as settled locally. Actual
    // confirmation comes back later via the VENDOR_SETTLEMENT_SUCCESS webhook, which is
    // what writes vendor_settled_at.
    const eligibilityDate = nowAsIstString()
    const released: string[] = []
    const failed: { orderId: string; error: string }[] = []

    for (const contract of eligibleContracts) {
      try {
        await cashfreeV2Request(
          'PUT',
          `/easy-split/orders/${contract.cashfree_order_id}/settlement-eligibility/vendors/${profile.cashfree_vendor_id}`,
          { settlementEligibilityDateUpdate: eligibilityDate }
        )
        released.push(contract.cashfree_order_id)
      } catch (err) {
        console.error(`Failed to release settlement for order ${contract.cashfree_order_id}:`, err)
        failed.push({ orderId: contract.cashfree_order_id, error: err.message || 'Unknown error' })
      }
    }

    console.log('Settlement release requested:', { seller: user.id, released, failed, totalUnsettled })

    return new Response(JSON.stringify({
      message: `Requested early release for ${released.length} order(s)`,
      total_unsettled: totalUnsettled,
      threshold: EARLY_RELEASE_THRESHOLD,
      released,
      failed,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('cashfree-release-settlement error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to process release request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
