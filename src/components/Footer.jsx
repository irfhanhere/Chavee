import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { ChaveeLogo } from '../Logo.jsx';

const FOOTER_LINKS = {
    Platform: [
        { label: 'Learn', href: '/learn' },
        { label: 'Network', href: '/network' },
        { label: 'Earn', href: '/earn' },
        { label: 'Events', href: '/events' },
    ],
    Company: [
        { label: 'About Us', href: '/about-us' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press Kit', href: '/press' },
        { label: 'Contact', href: '/contact-us' },
    ],
    Resources: [
        { label: 'Blog', href: '/blog' },
        { label: 'Help Center', href: '/help' },
        { label: 'Community Guidelines', href: '/guidelines' },
        { label: 'Student Perks', href: '/perks' },
    ],
    Support: [
        { label: 'Contact Us', href: '/contact-us' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Report an Issue', href: '/report' },
    ],
};

const SOCIAL = [
    { label: 'Instagram', href: 'https://instagram.com/chavee.in', icon: '📸' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/chavee', icon: '💼' },
    { label: 'Twitter', href: 'https://x.com/chavee_in', icon: '🐦' },
];

export default function Footer() {
    const year = new Date().getFullYear();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Turnstile — verified server-side inside the brevo-subscribe Edge
    // Function (which now does both the notify_subscribers insert and the
    // real Brevo contact push), not client-side. The direct anonymous
    // INSERT policies on notify_subscribers were revoked in favor of that
    // function being the only write path.
    const [captchaToken, setCaptchaToken] = useState('');
    const turnstileRef = useRef(null);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;
        if (!captchaToken) {
            setErrorMsg('Please complete the verification challenge.');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
            return;
        }
        setStatus('loading');
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/brevo-subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, turnstileToken: captchaToken }),
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || 'Something went wrong.');

            setStatus('success');
            setEmail('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('Subscription error:', err);
            setErrorMsg(err.message || 'Something went wrong. Try again.');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        } finally {
            turnstileRef.current?.reset();
            setCaptchaToken('');
        }
    };

    return (
        <footer style={{
            background: '#F8FAFC',
            borderTop: '1px solid #E5E7EB',
            color: '#6B7280',
            paddingTop: '5rem',
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '3rem',
                    paddingBottom: '4rem',
                    borderBottom: '1px solid #E5E7EB',
                }}>
                    {/* Brand column */}
                    <div className="footer-brand-col" style={{ gridColumn: '1 / -1', maxWidth: 320 }}>
                        <ChaveeLogo height={36} />
                        <p style={{ marginTop: '1.25rem', fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6 }}>
                            India's first student social platform. Learn, earn, and build meaningful connections.
                        </p>
                        
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                            {SOCIAL.map(s => (
                                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                                    title={s.label}
                                    style={{
                                        width: 40, height: 40,
                                        borderRadius: '10px',
                                        background: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#EAFBF3';
                                        e.currentTarget.style.borderColor = '#0B8F5A';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#FFFFFF';
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }}
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Nav link columns */}
                    {Object.entries(FOOTER_LINKS).map(([section, links]) => (
                        <div key={section}>
                            <h4 style={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                color: '#111827',
                                margin: '0 0 1.25rem 0',
                            }}>
                                {section}
                            </h4>
                            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {links.map(link => (
                                    <li key={link.label}>
                                        <Link to={link.href}
                                            style={{
                                                textDecoration: 'none',
                                                color: '#6B7280',
                                                fontSize: '0.9rem',
                                                transition: 'color 0.2s',
                                                fontWeight: 500,
                                            }}
                                            onMouseEnter={e => e.target.style.color = '#0B8F5A'}
                                            onMouseLeave={e => e.target.style.color = '#6B7280'}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Newsletter */}
                    <div className="footer-newsletter-col" style={{ gridColumn: '1 / -1' }}>
                        <h4 style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: '#111827',
                            margin: '0 0 1.25rem 0',
                        }}>
                            Subscribe to our Newsletter
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: '#6B7280', marginBottom: '1rem', lineHeight: 1.5 }}>
                            Get the latest updates on internships, events, and new features.
                        </p>
                        <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem 1rem',
                                        borderRadius: '10px',
                                        border: '1px solid #E5E7EB',
                                        background: '#FFFFFF',
                                        fontSize: '0.9rem',
                                        color: '#111827',
                                        outline: 'none',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={status === 'loading' || status === 'success' || !captchaToken}
                                    style={{
                                        padding: '0 1.25rem',
                                        borderRadius: '10px',
                                        background: status === 'success' ? '#10B981' : '#0B8F5A',
                                        color: '#FFFFFF',
                                        border: 'none',
                                        fontWeight: 600,
                                        cursor: (status === 'loading' || status === 'success' || !captchaToken) ? 'not-allowed' : 'pointer',
                                        opacity: !captchaToken && status === 'idle' ? 0.7 : 1,
                                        transition: 'background 0.2s',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    {status === 'loading' ? '...' : status === 'success' ? '✓' : 'Subscribe'}
                                </button>
                            </div>
                            <Turnstile
                                ref={turnstileRef}
                                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                onSuccess={setCaptchaToken}
                                onExpire={() => setCaptchaToken('')}
                                onError={() => setCaptchaToken('')}
                            />
                        </form>
                        {status === 'error' && <p style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>{errorMsg || 'Something went wrong. Try again.'}</p>}
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    padding: '2rem 0',
                    fontSize: '0.85rem',
                }}>
                    <span style={{ color: '#9CA3AF' }}>© {year} Chavee</span>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <Link to="/privacy-policy" style={{ color: '#6B7280', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color = '#0B8F5A'} onMouseLeave={e => e.target.style.color = '#6B7280'}>Privacy Policy</Link>
                        <Link to="/terms-and-conditions" style={{ color: '#6B7280', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color = '#0B8F5A'} onMouseLeave={e => e.target.style.color = '#6B7280'}>Terms</Link>
                        <Link to="/refund-and-cancellation" style={{ color: '#6B7280', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color = '#0B8F5A'} onMouseLeave={e => e.target.style.color = '#6B7280'}>Refund Policy</Link>
                        <Link to="/shipping-and-delivery" style={{ color: '#6B7280', textDecoration: 'none' }} onMouseEnter={e => e.target.style.color = '#0B8F5A'} onMouseLeave={e => e.target.style.color = '#6B7280'}>Shipping Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
