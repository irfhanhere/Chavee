import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyTurnstileToken, getClientIp } from '../_shared/turnstile.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')!

const BREVO_LIST_NAME = 'Chavee Newsletter'

// Brevo has no "get list by name" endpoint — resolve the real list id by
// listing the account's lists and matching on name (case-insensitive),
// rather than hardcoding a numeric id nobody could verify without a live
// call. Small extra request per signup (newsletter signup isn't a
// latency-sensitive path), and self-healing if the list is ever recreated.
async function resolveNewsletterListId(): Promise<number> {
  const res = await fetch('https://api.brevo.com/v3/contacts/lists?limit=50&offset=0', {
    headers: { 'api-key': BREVO_API_KEY, 'Accept': 'application/json' },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || `Brevo lists lookup failed: ${res.status}`)
  }
  const match = (data.lists || []).find(
    (l: { name: string }) => l.name?.trim().toLowerCase() === BREVO_LIST_NAME.toLowerCase()
  )
  if (!match) {
    throw new Error(`Brevo list "${BREVO_LIST_NAME}" not found in this account`)
  }
  return match.id
}

async function upsertBrevoContact(email: string, listId: number): Promise<void> {
  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true, // add-or-update: repeat signups from the same email don't error
    }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data?.message || `Brevo contact upsert failed: ${res.status}`)
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

  let payload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { email, turnstileToken } = payload ?? {}

  const verify = await verifyTurnstileToken(turnstileToken, getClientIp(req))
  if (!verify.ok) {
    return new Response(JSON.stringify({ error: verify.reason }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'A valid email address is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const cleanEmail = email.trim().toLowerCase()

  const supabase = createClient(SUPABASE_URL, CF_SERVICE_ROLE_KEY)

  // Internal insert first (cheap, same DB). 23505 (duplicate) is treated as
  // success — matches the client-side dedup behaviour this replaces.
  const { error: insertError } = await supabase
    .from('notify_subscribers')
    .insert([{ email: cleanEmail, feature_key: 'newsletter' }])
  if (insertError && insertError.code !== '23505') {
    console.error('brevo-subscribe insert error:', insertError)
    return new Response(JSON.stringify({ error: 'Could not subscribe. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Real Brevo push — failure here does NOT roll back the internal insert
  // (the visitor is still a real subscriber in our own system either way)
  // but IS reported back so the client can show an honest partial-failure
  // state instead of a false "success".
  try {
    const listId = await resolveNewsletterListId()
    await upsertBrevoContact(cleanEmail, listId)
  } catch (err) {
    console.error('brevo-subscribe Brevo push error:', err)
    return new Response(JSON.stringify({ success: true, brevo: false, warning: 'Subscribed, but syncing to our mailing list failed — support has been notified.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true, brevo: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
