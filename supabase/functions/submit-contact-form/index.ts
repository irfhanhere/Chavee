import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyTurnstileToken, getClientIp } from '../_shared/turnstile.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!

// Matches the real QUERY_TYPES list in src/pages/ContactUs.jsx — kept in
// sync manually since contact_submissions.query_type has no DB CHECK
// constraint to enforce it.
const QUERY_TYPES = [
  'General Inquiry',
  'Student Support',
  'Institution / College Partnership',
  'Business / Brand Inquiry',
  'Mentor / Educator Inquiry',
  'Press / Media Inquiry',
]

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

  const { full_name, email, query_type, message, agreed_to_terms, turnstileToken } = payload ?? {}

  // Real bot check FIRST, before touching the database at all — a rejected
  // token never gets anywhere near contact_submissions.
  const verify = await verifyTurnstileToken(turnstileToken, getClientIp(req))
  if (!verify.ok) {
    return new Response(JSON.stringify({ error: verify.reason }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (typeof full_name !== 'string' || !full_name.trim()) {
    return new Response(JSON.stringify({ error: 'Full name is required' }), {
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
  if (typeof message !== 'string' || !message.trim()) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (!agreed_to_terms) {
    return new Response(JSON.stringify({ error: 'You must agree to the Privacy Policy and Terms of Service' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (query_type != null && !QUERY_TYPES.includes(query_type)) {
    return new Response(JSON.stringify({ error: 'Invalid query type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, CF_SERVICE_ROLE_KEY)

  try {
    const { error } = await supabase.from('contact_submissions').insert({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      query_type: query_type || null,
      message: message.trim(),
      agreed_to_terms: !!agreed_to_terms,
    })
    if (error) throw error

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('submit-contact-form insert error:', err)
    return new Response(JSON.stringify({ error: 'Could not send your message. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
