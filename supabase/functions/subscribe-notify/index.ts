import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { verifyTurnstileToken, getClientIp } from '../_shared/turnstile.ts'

// Single server-side write path for feature waitlist / "notify me" signups
// into public.notify_subscribers. Mirrors submit-contact-form / brevo-subscribe:
//   - anonymous callers must pass a valid Cloudflare Turnstile token
//   - signed-in callers are identified by their JWT (never a client-sent
//     user_id) and skip the captcha
//   - the row is written with the service role, so the table needs no
//     open INSERT policy for anon
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FEATURE_KEY_MAX = 200

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'Invalid JSON' }, 400)
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : ''
  const featureKey = typeof payload.feature_key === 'string' ? payload.feature_key.trim() : ''
  const turnstileToken = payload.turnstileToken

  if (!EMAIL_RE.test(email)) {
    return json({ error: 'A valid email address is required' }, 400)
  }
  if (!featureKey || featureKey.length > FEATURE_KEY_MAX) {
    return json({ error: 'A valid feature is required' }, 400)
  }

  const admin = createClient(SUPABASE_URL, CF_SERVICE_ROLE_KEY)

  // Signed-in caller? Trust the JWT for identity — never a client-sent
  // user_id — and skip the captcha. Anonymous callers must pass Turnstile.
  let userId: string | null = null
  const authHeader = req.headers.get('Authorization') ?? ''
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const { data } = await admin.auth.getUser(authHeader.slice(7))
    if (data?.user) userId = data.user.id
  }

  if (!userId) {
    const verify = await verifyTurnstileToken(turnstileToken, getClientIp(req))
    if (!verify.ok) return json({ error: verify.reason }, 400)
  }

  // Idempotent — do not stack duplicate waitlist rows. (The table's only
  // UNIQUE is (user_id, feature_key), and NULL user_ids are all distinct,
  // so the anonymous case needs this explicit check.)
  const base = admin
    .from('notify_subscribers')
    .select('id', { head: true, count: 'exact' })
    .eq('feature_key', featureKey)
  const { count } = userId
    ? await base.eq('user_id', userId)
    : await base.is('user_id', null).eq('email', email)

  if ((count ?? 0) > 0) {
    return json({ success: true, alreadySubscribed: true })
  }

  const { error } = await admin.from('notify_subscribers').insert({
    user_id: userId,
    email,
    feature_key: featureKey,
  })
  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return json({ success: true, alreadySubscribed: true })
    }
    console.error('subscribe-notify insert error:', error)
    return json({ error: 'Could not add you to the list. Please try again.' }, 500)
  }

  return json({ success: true })
})
