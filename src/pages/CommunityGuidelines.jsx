import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SEO, { breadcrumbSchema } from '../components/SEO.jsx';

const ICONS = {
    respect: '👥', relevant: '📄', harassment: '🛡️', spam: '✉️', privacy: '🔒',
    transactions: '💼', ip: '©️', report: '🚩', consequences: '⚠️'
};

export default function CommunityGuidelines() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('content')
                    .select('*')
                    .eq('content_type', 'guideline_section')
                    .eq('status', 'published')
                    .order('created_at', { ascending: true });
                if (error) throw error;
                const sorted = (data || []).sort((a, b) => (a.metadata?.order || 0) - (b.metadata?.order || 0));
                setSections(sorted);
            } catch (err) {
                console.warn('Could not load community guidelines:', err.message);
                setSections([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const lastUpdated = useMemo(() => {
        if (sections.length === 0) return null;
        const dates = sections.map(s => new Date(s.updated_at || s.created_at));
        return new Date(Math.max(...dates));
    }, [sections]);

    const S = {
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.04) 0%, rgba(5,150,105,0.02) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '3.5rem 2rem 2.5rem',
            textAlign: 'center'
        },
        container: { maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, boxShadow: 'var(--shadow-sm)' },
        iconBox: { width: 36, height: 36, borderRadius: 10, background: 'var(--bg-mint)', color: 'var(--peacock-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem', flexShrink: 0 }
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO
                title="Community Guidelines | Chavee"
                description="Chavee's community guidelines covering respectful conduct, content standards, harassment and spam policies, privacy, safe transactions, and how to report an issue."
                path="/guidelines"
                schema={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Community Guidelines', path: '/guidelines' }])}
            />
            <Navbar />

            <header style={S.hero}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link> <span style={{ margin: '0 0.3rem' }}>&gt;</span> Community Guidelines
                </p>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.75rem 0' }}>Community Guidelines</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 620, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Chavee is built for students to learn, connect, earn, and grow together. These guidelines help keep Chavee useful, respectful, and safe for everyone.
                </p>
            </header>

            <div style={S.container}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}><ButtonSpinner label="Loading guidelines..." /></div>
                ) : sections.length === 0 ? (
                    <div style={{ ...S.card, padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Guidelines haven't been published yet. Check back soon.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start', gap: '2rem' }}>
                        {/* Main sections */}
                        <div style={{ gridColumn: 'span 2', minWidth: 0, ...S.card, overflow: 'hidden' }}>
                            {sections.map((s, i) => {
                                const isOpen = openId === s.id;
                                return (
                                    <div key={s.id} style={{ borderBottom: i < sections.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                        <button
                                            onClick={() => setOpenId(isOpen ? null : s.id)}
                                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '1.1rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}
                                        >
                                            <span style={S.iconBox}>{ICONS[s.metadata?.icon] || '📌'}</span>
                                            <span style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{i + 1}. {s.title}</div>
                                                {!isOpen && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.summary}</div>}
                                            </span>
                                            <span style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>⌄</span>
                                        </button>
                                        {isOpen && (
                                            <p style={{ margin: 0, padding: '0 1.25rem 1.25rem 4.5rem', fontSize: '0.86rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                                                {s.body}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ ...S.card, padding: '1.5rem', background: 'var(--peacock-green)', color: '#fff', border: 'none' }}>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>🛡️ Our Commitment</h3>
                                <p style={{ margin: 0, fontSize: '0.82rem', lineHeight: 1.6, opacity: 0.9 }}>
                                    We're committed to building a safe, inclusive, and empowering platform where every student can learn, connect, and grow.
                                </p>
                            </div>

                            <div style={{ ...S.card, padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>Need to Report Something?</h3>
                                <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                    Help us keep Chavee better by reporting content or behavior that violates our guidelines.
                                </p>
                                <Link to="/help" className="btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.65rem', borderRadius: 10, fontSize: '0.85rem', textDecoration: 'none' }}>
                                    Report an Issue →
                                </Link>
                            </div>

                            <div style={{ ...S.card, padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.95rem' }}>Quick Links</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {[
                                        { label: 'Student Perks', icon: '🎁', to: '/perks' },
                                        { label: 'FAQ', icon: '❓', to: '/faq' },
                                        { label: 'Help Center', icon: '🛟', to: '/help' },
                                        { label: 'Contact Us', icon: '✉️', to: '/contact-us' },
                                    ].map(l => (
                                        <Link key={l.to} to={l.to} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                            <span>{l.icon} {l.label}</span> <span style={{ color: 'var(--text-muted)' }}>›</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {lastUpdated && (
                                <div style={{ ...S.card, padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    📅 Last Updated: {lastUpdated.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            )}
                        </div>

                        {/* Bottom banner */}
                        <div style={{ gridColumn: '1 / -1', ...S.card, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-mint)', border: '1px solid var(--border-mint)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>🛡️</span>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>Help us keep Chavee better.</div>
                                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>If you see something that violates these guidelines, report it to our team.</div>
                                </div>
                            </div>
                            <Link to="/help" className="btn-primary" style={{ padding: '0.7rem 1.5rem', borderRadius: 10, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                Report an Issue
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
