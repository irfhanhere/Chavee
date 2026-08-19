import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SEO, { breadcrumbSchema } from '../components/SEO.jsx';

const QUERY_TYPES = [
    'General Inquiry',
    'Student Support',
    'Institution / College Partnership',
    'Business / Brand Inquiry',
    'Mentor / Educator Inquiry',
    'Press / Media Inquiry',
];

export default function ContactUs() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [queryType, setQueryType] = useState('');
    const [message, setMessage] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Turnstile — verified server-side inside the submit-contact-form Edge
    // Function (which now does the actual insert), not client-side, since
    // this page's direct-to-table anonymous insert policy was revoked in
    // favor of that function being the only write path.
    const [captchaToken, setCaptchaToken] = useState('');
    const turnstileRef = useRef(null);

    const [faqs, setFaqs] = useState([]);
    const [loadingFaqs, setLoadingFaqs] = useState(true);

    useEffect(() => {
        const loadFaqs = async () => {
            setLoadingFaqs(true);
            try {
                const { data, error } = await supabase
                    .from('content')
                    .select('id, title, body')
                    .eq('content_type', 'faq')
                    .eq('status', 'published')
                    .eq('metadata->>popular', 'true')
                    .limit(8);
                if (error) throw error;
                setFaqs(data || []);
            } catch (err) {
                console.warn('Could not load FAQs:', err.message);
                setFaqs([]);
            } finally {
                setLoadingFaqs(false);
            }
        };
        loadFaqs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!agreed) {
            setError('Please agree to the Privacy Policy and Terms of Service to continue.');
            return;
        }
        if (!captchaToken) {
            setError('Please complete the verification challenge.');
            return;
        }
        setSubmitting(true);
        try {
            // Real submit — routed through the submit-contact-form Edge
            // Function (verifies the Turnstile token server-side against
            // Cloudflare's siteverify, then inserts with the service role).
            // The direct anonymous INSERT policy on contact_submissions was
            // revoked; this function is now the only write path.
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const response = await fetch(`${supabaseUrl}/functions/v1/submit-contact-form`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: name.trim(),
                    email: email.trim().toLowerCase(),
                    query_type: queryType || null,
                    message: message.trim(),
                    agreed_to_terms: agreed,
                    turnstileToken: captchaToken,
                }),
            });
            const json = await response.json();
            if (!response.ok) throw new Error(json.error || 'Could not send your message. Please try again.');

            setSubmitted(true);
            setName(''); setEmail(''); setQueryType(''); setMessage(''); setAgreed(false);
        } catch (err) {
            setError(err.message || 'Could not send your message. Please try again.');
        } finally {
            setSubmitting(false);
            turnstileRef.current?.reset();
            setCaptchaToken('');
        }
    };

    const S = {
        wrapper: { background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.04) 0%, rgba(5,150,105,0.02) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '3.5rem 2rem',
            textAlign: 'center',
        },
        container: { maxWidth: 1180, margin: '0 auto', padding: '3rem 1.5rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: '1.75rem' },
        label: { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' },
        input: { width: '100%', padding: '0.7rem 0.9rem', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
    };

    const CONTACT_ITEMS = [
        { icon: '✉️', label: 'General Inquiries', value: 'info@chavee.in', href: 'mailto:info@chavee.in' },
        { icon: '✉️', label: 'Partnerships & Collaborations', value: 'akshaye@chavee.in', href: 'mailto:akshaye@chavee.in' },
        { icon: '🛟', label: 'Support', value: 'irfhan@chavee.in', href: 'mailto:irfhan@chavee.in' },
        { icon: '📞', label: 'Phone', value: '+91 8921 234 567', sub: '(Mon - Fri, 10:00 AM - 6:00 PM IST)', href: 'tel:+918921234567' },
        { icon: '🌐', label: 'Website', value: 'www.chavee.in', href: 'https://chavee.in' },
    ];

    return (
        <div style={S.wrapper}>
            <SEO
                title="Contact Chavee | Get in Touch with India's Student Social Platform"
                description="Have a question, feedback, or partnership inquiry? Reach out to the Chavee team directly."
                path="/contact-us"
                schema={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Contact Us', path: '/contact-us' }])}
            />
            <Navbar />

            <header style={S.hero}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link> <span style={{ margin: '0 0.3rem' }}>&gt;</span> Contact Us
                </p>
                <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 900, margin: '0 0 0.75rem' }}>Contact Us</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', fontSize: '0.96rem', lineHeight: 1.6 }}>
                    We'd love to hear from you. Reach out to us for any queries, support or collaboration opportunities.
                </p>
            </header>

            <div style={S.container}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'start', marginBottom: '3rem' }}>
                    {/* Get In Touch */}
                    <div style={S.card}>
                        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Get In Touch</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            {CONTACT_ITEMS.map(item => (
                                <div key={item.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                    <span style={{ fontSize: '1.05rem' }}>{item.icon}</span>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{item.label}</div>
                                        <a href={item.href} style={{ fontSize: '0.86rem', color: 'var(--peacock-green)', fontWeight: 700, textDecoration: 'none' }}>{item.value}</a>
                                        {item.sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.sub}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                            {[
                                { icon: '📸', href: 'https://instagram.com/chavee.in' },
                                { icon: '💼', href: 'https://linkedin.com/company/chavee' },
                                { icon: '🐦', href: 'https://x.com/chavee_in' },
                            ].map(s => (
                                <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                                    {s.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Send Us a Message — real form */}
                    <div style={{ ...S.card, gridColumn: 'span 1' }}>
                        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Send Us a Message</h2>
                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Fill out the form and our team will get back to you.</p>

                        {submitted ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                                <div style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>✅</div>
                                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Message sent!</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Thanks for reaching out — our team will get back to you soon.</p>
                                <button onClick={() => setSubmitted(false)} style={{ marginTop: '1.25rem', padding: '0.55rem 1.2rem', borderRadius: 10, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Send another message</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                                    <div>
                                        <label style={S.label}>Full Name</label>
                                        <input required value={name} onChange={e => setName(e.target.value)} style={S.input} />
                                    </div>
                                    <div>
                                        <label style={S.label}>Email Address</label>
                                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={S.input} />
                                    </div>
                                </div>
                                <div>
                                    <label style={S.label}>Query Type</label>
                                    <select value={queryType} onChange={e => setQueryType(e.target.value)} style={{ ...S.input, cursor: 'pointer' }}>
                                        <option value="">Select Query Type</option>
                                        {QUERY_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={S.label}>Your Message</label>
                                    <textarea required rows={4} value={message} onChange={e => setMessage(e.target.value)} style={{ ...S.input, resize: 'vertical' }} />
                                </div>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: '0.2rem' }} />
                                    <span>
                                        I agree to the <Link to="/privacy-policy" style={{ color: 'var(--peacock-green)', fontWeight: 700 }}>Privacy Policy</Link> and <Link to="/terms-and-conditions" style={{ color: 'var(--peacock-green)', fontWeight: 700 }}>Terms of Service</Link>.
                                    </span>
                                </label>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <Turnstile
                                        ref={turnstileRef}
                                        siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                        onSuccess={setCaptchaToken}
                                        onExpire={() => setCaptchaToken('')}
                                        onError={() => setCaptchaToken('')}
                                    />
                                </div>
                                {error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#EF4444' }}>⚠ {error}</p>}
                                <button type="submit" disabled={submitting || !captchaToken} className="btn-primary" style={{ padding: '0.8rem', borderRadius: 10, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: (submitting || !captchaToken) ? 0.7 : 1, cursor: (submitting || !captchaToken) ? 'not-allowed' : 'pointer' }}>
                                    {submitting ? <ButtonSpinner label="Sending..." /> : 'Send Message'}
                                </button>
                                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>By submitting this form, you agree that we may contact you.</p>
                            </form>
                        )}
                    </div>

                    {/* Registered Office */}
                    <div style={S.card}>
                        <h2 style={{ margin: '0 0 1.1rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Registered Office</h2>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <span style={{ fontSize: '1.05rem' }}>📍</span>
                            <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                <strong style={{ color: 'var(--text-primary)' }}>Chavee Technologies Pvt. Ltd.</strong><br />
                                2nd Floor, West End Tower,<br />
                                T. P. Road, Calicut,<br />
                                Kerala - 673004, India
                            </div>
                        </div>
                        <div style={{ background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 10, padding: '0.9rem 1rem', marginBottom: '1.25rem' }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--peacock-green)', marginBottom: '0.25rem' }}>✉️ We're here to help!</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Whether you're a student, organization, or partner — we're just an email away.</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                            <span>🕐</span>
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Response Time</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Within 24-48 business hours</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <span>🔒</span>
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>Privacy First</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Your information is safe with us</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FAQ — real questions pulled from the same live FAQ system
                    used on /faq, not a separate hardcoded duplicate. */}
                <div style={S.card}>
                    <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Frequently Asked Questions</h2>
                    {loadingFaqs ? (
                        <div style={{ textAlign: 'center', padding: '1.5rem' }}><ButtonSpinner label="Loading..." /></div>
                    ) : faqs.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No FAQs published yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
                            {faqs.map(f => (
                                <details key={f.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.75rem 1rem' }}>
                                    <summary style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}>{f.title}</summary>
                                    <p style={{ margin: '0.6rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.body}</p>
                                </details>
                            ))}
                        </div>
                    )}
                    <Link to="/faq" style={{ display: 'inline-block', marginTop: '1.25rem', fontSize: '0.82rem', fontWeight: 800, color: 'var(--peacock-green)', textDecoration: 'none' }}>View All FAQs →</Link>
                </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
