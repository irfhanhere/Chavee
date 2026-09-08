import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY')!
const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!

// Base host is chosen by the CASHFREE_ENV secret:
//   npx supabase secrets set CASHFREE_ENV=production   (or: sandbox)
// Unset -> sandbox. The CASHFREE_SECRET_KEY / CASHFREE_APP_ID pair MUST
// belong to the same environment. Re-check the production host against
// current Cashfree PG docs before the production cutover.
const CASHFREE_ENV = (Deno.env.get('CASHFREE_ENV') ?? 'sandbox').toLowerCase()
const CASHFREE_BASE_URL = CASHFREE_ENV === 'production'
  ? 'https://api.cashfree.com/pg'
  : 'https://sandbox.cashfree.com/pg'

async function cashfreeRequest(method: string, path: string, body?: unknown) {
  const url = `${CASHFREE_BASE_URL}${path}`
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': CASHFREE_APP_ID,
      'x-client-secret': CASHFREE_SECRET_KEY,
      'x-api-version': '2023-08-01',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || `Cashfree API error: ${response.status}`)
  }
  return data
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

  // Verify auth
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

  let payload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { payout_method, seller_profile_id, email: bodyEmail, ...details } = payload

  // Verify the seller_profile_id matches the authenticated user
  if (seller_profile_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden: profile ID mismatch' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Prefer the email explicitly submitted with the form; fall back to the auth token's email
  const vendorEmail = bodyEmail || user.email

  if (!vendorEmail) {
    return new Response(JSON.stringify({ error: 'Please add an email to your account before setting up payout.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Check if vendor already exists for this profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('cashfree_vendor_id')
      .eq('id', seller_profile_id)
      .single()

    let vendorId = profile?.cashfree_vendor_id

    // Shared bank/upi shape — Cashfree's real schema uses top-level "bank"/"upi" objects,
    // with "account_holder" (not "account_holder_name"), no "bank_account" wrapper.
    const bankOrUpi = payout_method === 'bank'
      ? {
          bank: {
            account_number: details.account_number,
            account_holder: details.account_holder_name,
            ifsc: details.ifsc_code,
          },
        }
      : {
          upi: {
            vpa: details.upi_vpa,
            account_holder: details.account_holder_name,
          },
        }

    const kycDetails = {
      account_type: 'INDIVIDUAL',
      business_type: 'Education',
      pan: details.pan_number?.toUpperCase(),
    }

    if (vendorId) {
      // Update existing vendor — all fields top-level, no "vendor_details" wrapper.
      // No vendor_id here — it's in the URL path, and the real Update example never includes it in the body.
      await cashfreeRequest('PATCH', `/easy-split/vendors/${vendorId}`, {
        status: 'ACTIVE',
        name: details.account_holder_name || 'Chavee Seller',
        email: vendorEmail,
        phone: user.phone || '9999999999',
        verify_account: true,
        schedule_option: 1,
        kyc_details: kycDetails,
        ...bankOrUpi,
      })
    } else {
      // Create new vendor — all fields top-level, no "vendor_details" wrapper
      const vendorData = {
        vendor_id: `vendor_${seller_profile_id.slice(0, 8)}_${Date.now()}`,
        status: 'ACTIVE',
        name: details.account_holder_name || 'Chavee Seller',
        email: vendorEmail,
        phone: user.phone || '9999999999',
        verify_account: true,
        schedule_option: 1,
        kyc_details: kycDetails,
        ...bankOrUpi,
      }

      const result = await cashfreeRequest('POST', '/easy-split/vendors', vendorData)
      vendorId = result.vendor_id
    }

    // Fetch the real current vendor status from Cashfree (don't hardcode it)
    let vendorStatus = 'pending' // fallback if Get Vendor call fails
    try {
      const vendorDetails = await cashfreeRequest('GET', `/easy-split/vendors/${vendorId}`)
      vendorStatus = vendorDetails.status || 'pending'
    } catch (getErr) {
      console.error('Failed to fetch vendor status, defaulting to pending:', getErr)
    }

    // Update profile with vendor ID and KYC status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        cashfree_vendor_id: vendorId,
        cashfree_vendor_status: vendorStatus,
        cashfree_payout_method: payout_method,
        cashfree_pan_number: details.pan_number?.toUpperCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', seller_profile_id)

    if (updateError) {
      console.error('Failed to update profile:', updateError)
      return new Response(JSON.stringify({ error: 'Database update failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      message: 'Payout setup submitted! We\'ll verify and activate your account.',
      vendor_id: vendorId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Cashfree vendor error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to create vendor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})