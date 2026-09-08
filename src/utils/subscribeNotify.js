import { supabase } from '../supabaseClient.js';

/**
 * Single client entry point for feature waitlist / "notify me" signups.
 *
 * Routes through the `subscribe-notify` Edge Function instead of writing
 * to `notify_subscribers` directly:
 *   - anonymous callers pass a Cloudflare Turnstile token (verified
 *     server-side)
 *   - signed-in callers send their access token; the function derives
 *     user_id from the JWT (a client-sent user_id is never trusted)
 *   - the insert happens with the service role, so the table no longer
 *     needs an open anon INSERT policy
 *
 * @param {Object}  args
 * @param {string}  args.email          Subscriber email.
 * @param {string}  args.featureKey     e.g. 'resources_tab', 'data_export',
 *                                      `course_request:${topic}`.
 * @param {string} [args.turnstileToken] Required for anonymous callers.
 * @returns {Promise<{ success: true, alreadySubscribed?: boolean }>}
 * @throws {Error} with a user-safe message on validation / server failure.
 */
export async function subscribeNotify({ email, featureKey, turnstileToken }) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    // Attach the caller's access token when signed in, so the row is tied
    // to their user_id server-side.
    let authHeader;
    try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.access_token) authHeader = `Bearer ${data.session.access_token}`;
    } catch {
        /* treat as anonymous */
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/subscribe-notify`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
            email: (email || '').trim().toLowerCase(),
            feature_key: featureKey,
            ...(turnstileToken ? { turnstileToken } : {}),
        }),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(json.error || 'Could not add you to the list. Please try again.');
    }
    return json;
}

export default subscribeNotify;
