import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SEO, { breadcrumbSchema, faqSchema } from '../components/SEO.jsx';

const CATEGORY_ICONS = {
    'General': '🌿',
    'Account': '👤',
    'Jobs & Careers': '💼',
    'Gigs': '⚡',
    'Communities': '🏘️',
    'Events & Learning': '🎓',
    'Safety & Privacy': '🛡️'
};

export default function FAQ() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All Topics');
    const [search, setSearch] = useState('');
    const [openId, setOpenId] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('content')
                    .select('*')
                    .eq('content_type', 'faq')
                    .eq('status', 'published')
                    .order('category', { ascending: true });
                if (error) throw error;
                setFaqs(data || []);
            } catch (err) {
                console.warn('Could not load FAQs:', err.message);
                setFaqs([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const categories = useMemo(() => {
        const map = {};
        faqs.forEach(f => { map[f.category] = (map[f.category] || 0) + 1; });
        return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
    }, [faqs]);

    const popular = useMemo(() => faqs.filter(f => f.metadata?.popular).slice(0, 8), [faqs]);

    const filtered = useMemo(() => {
        let list = faqs;
        if (activeCategory !== 'All Topics') list = list.filter(f => f.category === activeCategory);
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            list = list.filter(f => f.title?.toLowerCase().includes(term) || f.body?.toLowerCase().includes(term));
        }
        return list;
    }, [faqs, activeCategory, search]);

    const grouped = useMemo(() => {
        const map = {};
        filtered.forEach(f => {
            if (!map[f.category]) map[f.category] = [];
            map[f.category].push(f);
        });
        return map;
    }, [filtered]);

    const S = {
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.04) 0%, rgba(5,150,105,0.02) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '3.5rem 2rem 2.5rem',
            textAlign: 'center'
        },
        container: { maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, boxShadow: 'var(--shadow-sm)' },
        chip: (active) => ({
            padding: '0.55rem 1rem', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap',
            border: `1px solid ${active ? 'var(--peacock-green)' : 'var(--border-color)'}`,
            background: active ? 'var(--bg-mint)' : 'var(--bg-surface)',
            color: active ? 'var(--peacock-green)' : 'var(--text-primary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem', fontSize: '0.78rem', fontWeight: 700, minWidth: 92
        })
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO
                title="FAQ | Chavee"
                description="Answers to common questions about Chavee — account setup, jobs and gigs, communities, events, learning, and safety and privacy."
                path="/faq"
                schema={[
                    breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]),
                    faqSchema(faqs),
                ].filter(Boolean)}
            />
            <Navbar />

            <header style={S.hero}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link> <span style={{ margin: '0 0.3rem' }}>&gt;</span> FAQ
                </p>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.75rem 0' }}>Frequently Asked Questions</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 1.75rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Find quick answers about Chavee, student accounts, jobs, gigs, communities, events, and platform safety.
                </p>
                <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '0.85rem 1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>🔍</span>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search any question or topic..."
                        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.92rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                    />
                </div>
            </header>

            <div style={S.container}>
                {/* Category chips */}
                <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '2rem' }}>
                    <button onClick={() => setActiveCategory('All Topics')} style={{ ...S.chip(activeCategory === 'All Topics'), border: 'none', cursor: 'pointer' }}>
                        <span style={{ fontSize: '1.1rem' }}>🗂️</span>
                        All Topics
                        <span style={{ fontWeight: 900 }}>{faqs.length}</span>
                    </button>
                    {categories.map(([cat, count]) => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} style={{ ...S.chip(activeCategory === cat), border: 'none', cursor: 'pointer' }}>
                            <span style={{ fontSize: '1.1rem' }}>{CATEGORY_ICONS[cat] || '❓'}</span>
                            {cat}
                            <span style={{ fontWeight: 900 }}>{count}</span>
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}><ButtonSpinner label="Loading questions..." /></div>
                ) : faqs.length === 0 ? (
                    <div style={{ ...S.card, padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No FAQs published yet. Check back soon, or <Link to="/contact-us" style={{ color: 'var(--peacock-green)', fontWeight: 700 }}>contact us</Link> directly.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', alignItems: 'start', gap: '2rem' }}>
                        {/* Sidebar */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {popular.length > 0 && (
                                <div style={{ ...S.card, padding: '1.25rem' }}>
                                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>🔥 Popular Questions</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                        {popular.map(f => (
                                            <button
                                                key={f.id}
                                                onClick={() => { setActiveCategory(f.category); setOpenId(f.id); }}
                                                style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}
                                            >
                                                {f.title} <span style={{ color: 'var(--peacock-green)' }}>›</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Main list */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {Object.keys(grouped).length === 0 ? (
                                <div style={{ ...S.card, padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    No questions match "{search}".
                                </div>
                            ) : Object.entries(grouped).map(([cat, items]) => (
                                <div key={cat}>
                                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span>{CATEGORY_ICONS[cat] || '❓'}</span> {cat}
                                    </h2>
                                    <div style={{ ...S.card, overflow: 'hidden' }}>
                                        {items.map((f, i) => {
                                            const isOpen = openId === f.id;
                                            return (
                                                <div key={f.id} style={{ borderBottom: i < items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                                    <button
                                                        onClick={() => setOpenId(isOpen ? null : f.id)}
                                                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '1rem 1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                                                    >
                                                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{f.title}</span>
                                                        <span style={{ color: 'var(--text-muted)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>⌄</span>
                                                    </button>
                                                    {isOpen && (
                                                        <p style={{ margin: 0, padding: '0 1.25rem 1.15rem', fontSize: '0.86rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                                                            {f.body}
                                                        </p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
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
