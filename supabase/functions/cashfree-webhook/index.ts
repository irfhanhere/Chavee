import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY')!
const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!

// Base host is chosen by the CASHFREE_ENV secret:
//   npx supabase secrets set CASHFREE_ENV=production   (or: sandbox)
// Unset -> sandbox. Must match the environment the payment orders were
// created in. Re-check the production host against current Cashfree PG
// docs before the production cutover.
const CASHFREE_ENV = (Deno.env.get('CASHFREE_ENV') ?? 'sandbox').toLowerCase()
const CASHFREE_PG_BASE_URL = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg'

async function verifyCashfreeSignature(rawBody: string, timestamp: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const message = timestamp + rawBody
const keyData = encoder.encode(CASHFREE_SECRET_KEY)
const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
  return computedSignature === signature
}

// Fetches split details (per-vendor settlement info) for a given order.
// Used to confirm exactly which order a settlement webhook's settlement_id belongs to,
// since the settlement webhook payload itself does not include an order_id.
async function getOrderSplitDetails(orderId: string) {
  const response = await fetch(`${CASHFREE_PG_BASE_URL}/easy-split/orders/${orderId}`, {
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY,
      'x-api-version': '2023-08-01',
    },
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || `Cashfree split-details error: ${response.status}`)
  }
  return data
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature') ?? ''
  const timestamp = req.headers.get('x-webhook-timestamp') ?? ''

  if (!signature || !timestamp) {
    return new Response(JSON.stringify({ error: 'Missing signature headers' }), { status: 401 })
  }

  const isValid = await verifyCashfreeSignature(rawBody, timestamp, signature)
  if (!isValid) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
  }

  let payload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 })
  }

  const eventType = payload?.type

  console.log('Webhook received:', { eventType })

  const supabase = createClient(SUPABASE_URL, CF_SERVICE_ROLE_KEY)

  // ── Payment confirmation ────────────────────────────────────────────────
  if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
    const orderId = payload?.data?.order?.order_id
    const paymentStatus = payload?.data?.payment?.payment_status

    if (orderId && paymentStatus === 'SUCCESS') {
      // Look up delivery_days (via the linked gig_offer) so we can compute the delivery deadline.
      // Soft-fail: if this lookup fails, we still proceed with marking payment as paid —
      // payment confirmation must never be blocked by a secondary lookup failure.
      const { data: contractLookup, error: lookupError } = await supabase
        .from('gig_contracts')
        .select('*, gig_offers(delivery_days)')
        .eq('cashfree_order_id', orderId)
        .single()

      let buyerResponseDeadline: string | null = null
      if (lookupError || !contractLookup?.gig_offers?.delivery_days) {
        console.warn(`Could not compute buyer_response_deadline for gig_offer_id ${contractLookup?.gig_offer_id ?? 'unknown'} — gig_offers lookup failed`)
      } else {
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + contractLookup.gig_offers.delivery_days)
        buyerResponseDeadline = deadline.toISOString()
      }

      const { data, error } = await supabase
        .from('gig_contracts')
        .update({
          payment_status: 'paid',
          status: 'in_progress',
          buyer_response_deadline: buyerResponseDeadline,
        })
        .eq('cashfree_order_id', orderId)
        .select()

      if (error) {
        console.error('Failed to update gig_contracts:', error)
        return new Response(JSON.stringify({ error: 'Database update failed' }), { status: 500 })
      }

      console.log('Updated gig_contracts:', data)
      return new Response(JSON.stringify({ message: 'Payment recorded' }), { status: 200 })
    }
  }

  // ── Vendor settlement confirmation ──────────────────────────────────────
  // Fires when Cashfree actually settles funds to a vendor's bank account (either on the
  // natural deferred-settlement schedule, or after an early release we requested). The
  // webhook payload has no order_id, so we identify the affected order(s) by checking each
  // of the vendor's unsettled paid contracts against the order's own split-details, which
  // does carry a settlement_id we can match against this webhook's settlement_id.
  if (eventType === 'VENDOR_SETTLEMENT_SUCCESS' || eventType === 'VENDOR_SETTLEMENT_FAILED') {
    const vendorId = payload?.data?.settlement?.vendor_id
    const settlementId = payload?.data?.settlement?.settlement_id
    const settledOn = payload?.data?.settlement?.settled_on
    const isSuccess = eventType === 'VENDOR_SETTLEMENT_SUCCESS'

    console.log('Settlement webhook:', { eventType, vendorId, settlementId, settledOn })

    if (!vendorId || !settlementId) {
      console.warn('Settlement webhook missing vendor_id or settlement_id — skipping')
      return new Response(JSON.stringify({ message: 'Event ignored (missing identifiers)' }), { status: 200 })
    }

    // Find the seller profile for this Cashfree vendor
    const { data: sellerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('cashfree_vendor_id', vendorId)
      .single()

    if (profileError || !sellerProfile) {
      console.warn(`Settlement webhook: no profile found for cashfree_vendor_id ${vendorId} — skipping`)
      return new Response(JSON.stringify({ message: 'Event ignored (unknown vendor)' }), { status: 200 })
    }

    // Candidate contracts: paid, not yet marked settled, belonging to this seller
    const { data: candidates, error: candidatesError } = await supabase
      .from('gig_contracts')
      .select('id, cashfree_order_id')
      .eq('seller_id', sellerProfile.id)
      .eq('payment_status', 'paid')
      .is('vendor_settled_at', null)

    if (candidatesError || !candidates || candidates.length === 0) {
      console.warn(`Settlement webhook: no unsettled paid contracts found for seller ${sellerProfile.id}`)
      return new Response(JSON.stringify({ message: 'No matching contracts' }), { status: 200 })
    }

    // Check each candidate's order-level split details for a matching settlement_id.
    // Soft-fail per-contract — one lookup failure must not abort the rest.
    let matchedCount = 0
    for (const contract of candidates) {
      if (!contract.cashfree_order_id) continue
      try {
        const splitDetails = await getOrderSplitDetails(contract.cashfree_order_id)
        const vendorEntry = (splitDetails?.vendors || []).find((v: any) => v.vendor_id === vendorId)

        if (vendorEntry?.settlement_id === settlementId) {
          const { error: updateError } = await supabase
            .from('gig_contracts')
            .update({
              vendor_settled_at: isSuccess ? (settledOn || new Date().toISOString()) : null,
              vendor_settlement_status: isSuccess ? 'SUCCESS' : 'FAILED',
            })
            .eq('id', contract.id)

          if (updateError) {
            console.error(`Failed to update contract ${contract.id} settlement status:`, updateError)
          } else {
            matchedCount++
          }
        }
      } catch (err) {
        console.warn(`Failed to check split-details for order ${contract.cashfree_order_id}:`, err)
      }
    }

    console.log(`Settlement webhook: matched and updated ${matchedCount} contract(s)`)
    return new Response(JSON.stringify({ message: `Settlement recorded for ${matchedCount} contract(s)` }), { status: 200 })
  }

  return new Response(JSON.stringify({ message: 'Event ignored' }), { status: 200 })
})
