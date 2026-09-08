import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

/**
 * Single source of truth for auth state.
 *
 * Design (see the pre-launch auth audit):
 *   - Resolve the session ONCE on mount. After that, state changes only in
 *     response to onAuthStateChange events — never from a fresh getSession()
 *     call on some page's mount (that was the logout-on-refresh bug: a
 *     transient null while a token refresh was in flight bounced the user
 *     to /login).
 *   - Distinguish "definitely signed out" from "couldn't read the session
 *     this instant":
 *       authenticated   — we have a session
 *       unauthenticated — INITIAL_SESSION/getSession() cleanly returned no
 *                         session, or SIGNED_OUT fired
 *       unknown         — getSession() threw/errored twice AND no
 *                         INITIAL_SESSION arrived. NOT a redirect signal —
 *                         guards show a spinner and wait for a real event.
 *   - One ~500ms retry before giving up on a failed getSession().
 */

const AuthContext = createContext(null);
const RETRY_DELAY_MS = 500;

export function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | authenticated | unauthenticated | unknown
    const settledRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const apply = (nextSession, nextStatus) => {
            if (cancelled) return;
            settledRef.current = true;
            setSession(nextSession ?? null);
            setStatus(nextStatus);
        };

        // Subscribe FIRST so we don't miss INITIAL_SESSION.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
            if (cancelled) return;
            switch (event) {
                case 'INITIAL_SESSION':
                    // The client's own considered first read of storage — the
                    // primary init path. A null here is a real "no session",
                    // not a refresh-race artifact.
                    apply(s, s ? 'authenticated' : 'unauthenticated');
                    break;
                case 'SIGNED_IN':
                case 'TOKEN_REFRESHED':
                case 'USER_UPDATED':
                    if (s) apply(s, 'authenticated');
                    break;
                case 'SIGNED_OUT':
                    apply(null, 'unauthenticated');
                    break;
                default:
                    break;
            }
        });

        // Fallback: some in-app webviews don't reliably emit INITIAL_SESSION.
        // Read once, with a single retry, and only if the event hasn't
        // already settled us.
        (async () => {
            for (let attempt = 0; attempt < 2 && !settledRef.current && !cancelled; attempt++) {
                if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
                try {
                    const { data, error } = await supabase.auth.getSession();
                    if (cancelled || settledRef.current) return;
                    if (!error) {
                        apply(data.session, data.session ? 'authenticated' : 'unauthenticated');
                        return;
                    }
                } catch {
                    /* network / navigator.locks contention — retry */
                }
            }
            // Couldn't determine it. Do NOT assume signed out.
            if (!settledRef.current && !cancelled) setStatus('unknown');
        })();

        return () => {
            cancelled = true;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch {
            /* even if the network call fails, the local session is cleared */
        }
        // SIGNED_OUT will flip status; send the user somewhere public.
        navigate('/login', { replace: true });
    };

    const value = {
        session,
        user: session?.user ?? null,
        status,
        // Back-compat + convenience: treat loading/unknown as "still deciding"
        // so consumers show a spinner instead of bouncing.
        loading: status === 'loading' || status === 'unknown',
        isAuthenticated: status === 'authenticated',
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
    return ctx;
}

export { AuthContext };
