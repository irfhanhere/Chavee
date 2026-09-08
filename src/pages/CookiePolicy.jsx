import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SEO from '../components/SEO.jsx';
import { openCookieSettings } from '../utils/cookieConsent.js';

export default function CookiePolicy() {
    const S = {
        wrapper: { background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.03) 0%, rgba(5,150,105,0.01) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '4.5rem 2rem',
            textAlign: 'center',
        },
        container: { maxWidth: 800, margin: '0 auto', padding: '3.5rem 1.5rem', width: '100%' },
        title: { fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.1 },
        subtitle: { color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '0.98rem', lineHeight: 1.6 },
        contentCard: {
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16,
            padding: '2.5rem', boxShadow: 'var(--shadow-sm)', fontSize: '0.95rem', lineHeight: 1.75, color: 'var(--text-secondary)',
        },
        h2: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' },
        p: { marginBottom: '1.25rem' },
        ul: { paddingLeft: '1.5rem', marginBottom: '1.25rem', listStyleType: 'disc' },
        li: { marginBottom: '0.5rem' },
        link: { color: 'var(--peacock-green)', fontWeight: 600, textDecoration: 'none' },
        strong: { fontWeight: 700, color: 'var(--text-primary)' },
        table: { width: '100%', borderCollapse: 'collapse', margin: '0 0 1.5rem 0', fontSize: '0.88rem' },
        th: { textAlign: 'left', padding: '0.6rem 0.75rem', borderBottom: '2px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700 },
        td: { padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border-color)', verticalAlign: 'top' },
        settingsBtn: {
            background: 'var(--peacock-green)', color: '#fff', border: 'none', borderRadius: 10,
            padding: '0.7rem 1.25rem', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem',
        },
    };

    return (
        <div style={S.wrapper}>
            <SEO
                title="Cookie Policy | Chavee"
                description="How Chavee uses cookies and local storage — essential, functional, and analytics — and how to change your consent."
                path="/cookie-policy"
            />
            <Navbar />

            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>🍪 Cookies &amp; storage</p>
                <h1 style={S.title}>Cookie Policy</h1>
                <p style={S.subtitle}>How Chavee uses cookies and browser storage, and how to control it.</p>
            </header>

            <main style={S.container}>
                <article style={S.contentCard}>
                    <h2 style={{ ...S.h2, marginTop: 0 }}>1. What this covers</h2>
                    <p style={S.p}>
                        &ldquo;Cookies&rdquo; here means cookies and equivalent browser storage
                        (<span style={S.strong}>localStorage</span>, <span style={S.strong}>sessionStorage</span>).
                        Chavee keeps its own footprint small and sets <span style={S.strong}>no advertising or
                        cross-site tracking cookies</span>.
                    </p>

                    <h2 style={S.h2}>2. Categories we use</h2>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>Category</th>
                                <th style={S.th}>Purpose</th>
                                <th style={S.th}>Examples</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={S.td}><span style={S.strong}>Essential</span><br />(always on)</td>
                                <td style={S.td}>Keeps you signed in and protects forms from bots. The site cannot function without these.</td>
                                <td style={S.td}>Supabase auth session (localStorage); Cloudflare Turnstile / bot-management cookies on sign-up, login and contact forms.</td>
                            </tr>
                            <tr>
                                <td style={S.td}><span style={S.strong}>Functional</span><br />(consent)</td>
                                <td style={S.td}>Remembers preferences so the app is consistent between visits.</td>
                                <td style={S.td}>Theme choice, last-used tab/filter, dismissed notices (localStorage).</td>
                            </tr>
                            <tr>
                                <td style={S.td}><span style={S.strong}>Analytics</span><br />(consent)</td>
                                <td style={S.td}>Would measure feature usage to help us improve. <span style={S.strong}>None are set today</span> — this category exists so that if we add analytics later, it stays off until you opt in.</td>
                                <td style={S.td}>—</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2 style={S.h2}>3. Third parties</h2>
                    <ul style={S.ul}>
                        <li style={S.li}><span style={S.strong}>Cloudflare</span> — bot protection (Turnstile) and CDN. Sets essential cookies during a challenge.</li>
                        <li style={S.li}><span style={S.strong}>Supabase</span> — our backend. The auth session is stored in your browser&rsquo;s localStorage, not sent to third parties.</li>
                        <li style={S.li}><span style={S.strong}>Cashfree</span> — payment provider. Its SDK loads <em>only</em> on pages where you start a payment, and may set cookies needed to complete the transaction.</li>
                        <li style={S.li}><span style={S.strong}>Fonts</span> — self-hosted. We do not call Google Fonts.</li>
                    </ul>

                    <h2 style={S.h2}>4. Changing your choice</h2>
                    <p style={S.p}>
                        You chose your preferences in the banner shown on your first visit. To change them at any time:
                    </p>
                    <button type="button" style={S.settingsBtn} onClick={openCookieSettings}>
                        Open cookie settings
                    </button>
                    <p style={{ ...S.p, marginTop: '1.25rem' }}>
                        You can also clear cookies and site data in your browser settings. Blocking essential
                        storage will sign you out and may break sign-in.
                    </p>

                    <h2 style={S.h2}>5. More information</h2>
                    <p style={S.p}>
                        See our <Link to="/privacy-policy" style={S.link}>Privacy Policy</Link> for how we handle
                        personal data, and our <Link to="/terms-and-conditions" style={S.link}>Terms</Link>.
                        Questions: <a href="mailto:privacy@chavee.in" style={S.link}>privacy@chavee.in</a>.
                    </p>
                </article>
            </main>

            <Footer />
        </div>
    );
}
