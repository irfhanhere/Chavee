// Shared Cloudflare Turnstile server-side verification, used by every
// public-facing function that needs bot protection on an anonymous form
// (submit-contact-form, brevo-subscribe). Auth flows (signup/login/reset)
// do NOT use this — those go through Supabase Auth's own native Bot and
// Abuse Protection integration (Dashboard-configured), which calls
// Cloudflare's siteverify itself server-side inside GoTrue.
//
// Real, current siteverify contract (Cloudflare docs): POST
// https://challenges.cloudflare.com/turnstile/v0/siteverify with
// secret/response(/remoteip) as form fields, returns { success: boolean, ... }.
const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY')!

export async function verifyTurnstileToken(token: unknown, remoteIp: string | null): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'Missing verification token' }
  }

  const body = new URLSearchParams()
  body.set('secret', TURNSTILE_SECRET_KEY)
  body.set('response', token)
  if (remoteIp) body.set('remoteip', remoteIp)

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = await res.json()
    if (!data?.success) {
      console.warn('Turnstile rejection:', data?.['error-codes'])
      return { ok: false, reason: 'Verification failed — please try again.' }
    }
    return { ok: true }
  } catch (err) {
    console.error('Turnstile siteverify request failed:', err)
    return { ok: false, reason: 'Verification service unavailable — please try again.' }
  }
}

// Best-effort real client IP, same header Cloudflare-fronted requests carry;
// falls back to the first x-forwarded-for hop, then null (siteverify treats
// a missing remoteip as optional, per Cloudflare's own docs).
export function getClientIp(req: Request): string | null {
  return req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? null
}
