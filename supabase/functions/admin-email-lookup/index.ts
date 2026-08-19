import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const CF_SERVICE_ROLE_KEY = Deno.env.get('CF_SERVICE_ROLE_KEY')!

const MAX_USER_IDS = 200

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

  // Verify auth — same shell as cashfree-create-order/cashfree-create-vendor/
  // cashfree-release-settlement: resolve the real caller identity server-side
  // from their JWT via the service-role client, never trust anything the
  // client claims about who they are.
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

  // Admin check — NOT the is_admin() RPC. That function reads auth.uid(),
  // which only resolves inside a request carrying the user's own JWT
  // context; this function's Postgres client is authenticated with the
  // service-role key and has no such session, so auth.uid() would read as
  // null here. Instead, check the admins table directly against the
  // already-verified user.id above (real table, confirmed live: columns
  // user_id, added_at, role). Fail closed — zero email data whatsoever on
  // a non-admin caller.
  const { data: adminRow, error: adminError } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError) {
    console.error('Admin check failed:', adminError)
    return new Response(JSON.stringify({ error: 'Admin check failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!adminRow) {
    return new Response(JSON.stringify({ error: 'Forbidden: admin access required' }), {
      status: 403,
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

  const userIds: unknown = payload?.user_ids
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Response(JSON.stringify({ error: 'user_ids (non-empty array) required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (userIds.length > MAX_USER_IDS) {
    return new Response(JSON.stringify({ error: `Too many user_ids — max ${MAX_USER_IDS} per call` }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Dedup — no point looking the same id up twice in one batch.
  const uniqueIds = [...new Set(userIds.filter((id): id is string => typeof id === 'string' && id.length > 0))]

  try {
    // supabase-js has no native "get many users by id" call — auth.admin.getUserById
    // is per-id. The looping happens here, server-side, so the CLIENT still makes
    // exactly one request for the whole batch; this is what "batched" means from
    // its perspective, even though it's N admin API calls under the hood.
    const results = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const { data, error } = await supabase.auth.admin.getUserById(id)
          if (error || !data?.user) return [id, null] as const
          return [id, data.user.email ?? null] as const
        } catch {
          return [id, null] as const
        }
      })
    )

    const emailMap = Object.fromEntries(results)

    return new Response(JSON.stringify({ emails: emailMap }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('admin-email-lookup error:', err)
    return new Response(JSON.stringify({ error: err.message || 'Failed to look up emails' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
