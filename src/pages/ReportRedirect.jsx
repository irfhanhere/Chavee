import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { ChaveeLogo } from '../Logo.jsx';
import { PageLoader } from '../components/Spinner.jsx';
import SEO from '../components/SEO.jsx';

/**
 * /report — the footer's "Report an Issue" link.
 *
 * Deliberately NOT wrapped in AppShell: AppShell's own auth guard already
 * redirects a logged-out visitor to /login, but it does so instantly and
 * silently (no message, no return path — Login.jsx has no redirect-after-
 * login support anywhere in this app), so anyone landing here logged out
 * would just get bounced with zero explanation. This component checks
 * auth itself, before AppShell's guard would ever get the chance to:
 *
 *   Logged in  -> redirect to /help (the real Help & Support page — same
 *                 alias-redirect pattern already used by /learn and
 *                 /profile/edit in App.jsx).
 *   Logged out -> a real "log in to report an issue" prompt instead of a
 *                 silent bounce or a blank page.
 */
export default function ReportRedirect() {
    const [checking, setChecking] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        supabase.auth.getSession()
            .then(({ data: { session } }) => { setLoggedIn(!!session); setChecking(false); })
            .catch(() => setChecking(false));
    }, []);

    if (checking) return <PageLoader message="Loading..." />;
    if (loggedIn) return <Navigate to="/help" replace />;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-base)', textAlign: 'center' }}>
            <SEO
                title="Report an Issue | Chavee"
                description="Report an issue or contact Chavee support — log in to submit a support ticket and get help from our team."
                path="/report"
            />
            <Link to="/" style={{ marginBottom: '2rem', display: 'inline-flex' }}>
                <ChaveeLogo height={40} />
            </Link>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Log in to report an issue
            </h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 420, marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                You need a Chavee account to submit a support ticket, so our team can follow up with you directly.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/login" style={{ background: 'var(--peacock-green)', color: '#fff', padding: '0.8rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>
                    Log In
                </Link>
                <Link to="/signup" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.8rem 1.75rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>
                    Create Free Account
                </Link>
            </div>
        </div>
    );
}
