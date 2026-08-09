import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const CASHFREE_SECRET_KEY = Deno.env.get('CASHFREE_SECRET_KEY')!
const CASHFREE_APP_ID = Deno.env.get('CASHFREE_APP_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!

const CASHFREE_BASE_URL = 'https://sandbox.cashfree.com/pg'
const PLATFORM_FEE_BUYER_PERCENT = 0.05  // 5% added to buyer
const PLATFORM_FEE_SELLER_PERCENT = 0.02 // 2% deducted from seller

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

function calculateAmounts(offerPrice: number) {
  const buyerAmount = Math.round(offerPrice * (1 + PLATFORM_FEE_BUYER_PERCENT) * 100) / 100
  const sellerAmount = Math.round(offerPrice * (1 - PLATFORM_FEE_SELLER_PERCENT) * 100) / 100
  const platformFeeBuyer = Math.round((buyerAmount - offerPrice) * 100) / 100
  const platformFeeSeller = Math.round((offerPrice - sellerAmount) * 100) / 100
  const totalPlatformFee = Math.round((platformFeeBuyer + platformFeeSeller) * 100) / 100
  return {
    offer_price: offerPrice,
    buyer_amount: buyerAmount,
    seller_amount: sellerAmount,
    platform_fee_buyer: platformFeeBuyer,
    platform_fee_seller: platformFeeSeller,
    total_platform_fee: totalPlatformFee,
  }
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

  const { gig_offer_id } = payload
  if (!gig_offer_id) {
    return new Response(JSON.stringify({ error: 'gig_offer_id required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // Fetch the offer with gig and application details
    const { data: offer, error: offerError } = await supabase
      .from('gig_offers')
      .select(`
        *,
        gigs:gig_id (id, title, posted_by),
        gig_applications:gig_application_id (id, applicant_id, conversation_id)
      `)
      .eq('id', gig_offer_id)
      .eq('status', 'accepted')
      .single()

    if (offerError || !offer) {
      return new Response(JSON.stringify({ error: 'Offer not found or not accepted' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify the buyer is the one initiating payment
    if (offer.buyer_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: not the buyer' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Calculate amounts with commission
    const amounts = calculateAmounts(Number(offer.price))

    // Check if contract already exists for this offer
    const { data: existingContract } = await supabase
      .from('gig_contracts')
      .select('*')
      .eq('gig_offer_id', gig_offer_id)
      .single()

    // Guard: block payment if this offer is already paid — must run before any order creation
    if (existingContract?.payment_status === 'paid') {
      return new Response(JSON.stringify({ error: 'Payment already completed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Always create a fresh Cashfree order on every Pay Now click — never reuse an old
    // order_id or attempt to reuse an old payment_session_id.
    const orderId = `order_${gig_offer_id.slice(0, 8)}_${Date.now()}`
    const orderExpiryTime = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min from now, ISO 8601
    const orderResult = await cashfreeRequest('POST', '/orders', {
      order_id: orderId,
      order_amount: amounts.buyer_amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: user.id,
        customer_email: user.email,
        customer_phone: user.phone || '9999999999',
      },
      order_meta: {
        return_url: `${new URL(req.url).origin}/messages?id=${offer.gig_applications?.conversation_id}&payment=success`,
        notify_url: `${new URL(req.url).origin}/functions/v1/cashfree-webhook`,
        order_expiry_time: orderExpiryTime,
      },
      order_note: `Chavee gig payment - ${offer.gigs?.title}`,
    })

    const cashfreeOrderId = orderResult.order_id
    let contractId: string

    if (existingContract) {
      // Update the existing gig_contracts row with the fresh order — never insert a duplicate row
      const { data: updatedContract, error: updateError } = await supabase
        .from('gig_contracts')
        .update({
          cashfree_order_id: cashfreeOrderId,
          payment_status: 'pending',
        })
        .eq('id', existingContract.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update contract:', updateError)
        return new Response(JSON.stringify({ error: 'Failed to update contract' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      contractId = updatedContract.id
    } else {
      // Create gig_contracts record
      const { data: contract, error: contractError } = await supabase
        .from('gig_contracts')
        .insert({
          gig_offer_id,
          gig_id: offer.gig_id,
          buyer_id: offer.buyer_id,
          seller_id: offer.seller_id,
          gig_price: amounts.offer_price,
          buyer_total_paid: amounts.buyer_amount,
          seller_net_amount: amounts.seller_amount,
          buyer_fee_amount: amounts.platform_fee_buyer,
          seller_fee_amount: amounts.platform_fee_seller,
          cashfree_order_id: cashfreeOrderId,
          payment_status: 'pending',
        })
        .select()
        .single()

      if (contractError) {
        console.error('Failed to create contract:', contractError)
        return new Response(JSON.stringify({ error: 'Failed to create contract' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      contractId = contract.id
    }

    return new Response(JSON.stringify({
      message: 'Order created successfully',
      order_id: cashfreeOrderId,
      payment_session_id: orderResult.payment_session_id,
      amounts: {
        offer_price: amounts.offer_price,
        buyer_amount: amounts.buyer_amount,
        seller_amount: amounts.seller_amount,
        platform_fee_buyer: amounts.platform_fee_buyer,
        platform_fee_seller: amounts.platform_fee_seller,
        total_platform_fee: amounts.total_platform_fee,
      },
      contract_id: contractId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Cashfree order error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to create order' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})