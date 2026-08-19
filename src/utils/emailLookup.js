import { supabase } from '../supabaseClient.js';

// Real email lookup via the admin-email-lookup Edge Function (service-role
// auth.admin.getUserById, gated server-side on a real admins-table check —
// not the is_admin() RPC, which can't resolve auth.uid() from a service-role
// context). profiles has no email column at all (confirmed live) — real
// email only lives in Supabase Auth, unreadable by the client otherwise.
// Same raw fetch()+Bearer pattern already used in Messages.jsx/
// PayoutSetupForm.jsx for calling Edge Functions, not supabase.functions.invoke.
//
// Fails gracefully: any failure (no session, non-200, network error) returns
// an empty map with failed:true instead of throwing, so callers can degrade
// to "—" for every email rather than blocking their page load — same
// convention as learningStats etc. elsewhere in this app.
//
// Batched: one request for the whole array of ids, not one per id — the
// looping over auth.admin.getUserById happens server-side inside the
// function (supabase-js has no native "get many users by id" call).
export async function fetchEmailMap(userIds) {
    const uniqueIds = [...new Set((userIds || []).filter(Boolean))];
    if (uniqueIds.length === 0) return { emails: {}, failed: false };
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return { emails: {}, failed: true };
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const response = await fetch(`${supabaseUrl}/functions/v1/admin-email-lookup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ user_ids: uniqueIds }),
        });
        const json = await response.json();
        if (!response.ok) {
            console.error('admin-email-lookup failed:', json);
            return { emails: {}, failed: true };
        }
        return { emails: json.emails || {}, failed: false };
    } catch (err) {
        console.error('admin-email-lookup request failed:', err);
        return { emails: {}, failed: true };
    }
}
