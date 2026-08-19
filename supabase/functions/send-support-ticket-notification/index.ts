import { corsHeaders } from '../_shared/cors.ts'

// Server-to-server function, deployed with --no-verify-jwt: the caller is
// the support_tickets AFTER INSERT trigger via pg_net, not a logged-in
// user, so there's no Supabase JWT to verify. Auth instead comes from a
// shared secret header, matching the value stored in Supabase Vault
// (ticket_webhook_secret) that the trigger reads and sends.
const TICKET_WEBHOOK_SECRET = Deno.env.get('TICKET_WEBHOOK_SECRET')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPPORT_NOTIFICATION_EMAIL = Deno.env.get('SUPPORT_NOTIFICATION_EMAIL')!

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

  // Reject anything that doesn't carry the real shared secret — this is
  // the only auth this function has, since it runs with JWT verification
  // disabled.
  const incomingSecret = req.headers.get('x-webhook-secret')
  if (!incomingSecret || incomingSecret !== TICKET_WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
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

  const { ticket_id, subject, category, message, attachment_url, created_at } = payload ?? {}
  if (!ticket_id || !subject || !message) {
    return new Response(JSON.stringify({ error: 'ticket_id, subject and message are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const html = `
      <h2>New Support Ticket: ${ticket_id}</h2>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Category:</strong> ${category || 'Not specified'}</p>
      <p><strong>Message:</strong></p>
      <p>${String(message).replace(/\n/g, '<br />')}</p>
      ${attachment_url ? `<p><strong>Attachment:</strong> <a href="${attachment_url}">${attachment_url}</a></p>` : ''}
      <p><strong>Submitted:</strong> ${created_at || new Date().toISOString()}</p>
    `

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Chavee Support <notifications@chavee.in>',
        to: [SUPPORT_NOTIFICATION_EMAIL],
        subject: `[${ticket_id}] New Support Ticket — ${subject}`,
        html,
      }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) {
      throw new Error(resendData?.message || `Resend API error: ${resendRes.status}`)
    }

    return new Response(JSON.stringify({ sent: true, id: resendData.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-support-ticket-notification error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to send notification' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
