import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SEO, { breadcrumbSchema } from '../components/SEO.jsx';

const CATEGORY_ICONS = {
    'Learning': '🎓', 'Career': '💼', 'Tools & Software': '🛠️',
    'Entertainment': '🎬', 'Health & Wellness': '❤️', 'Finance': '💳'
};

export default function StudentPerks() {
    const [perks, setPerks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All Perks');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('content')
                    .select('*')
                    .eq('content_type', 'perk')
                    .eq('status', 'published')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setPerks(data || []);
            } catch (err) {
                console.warn('Could not load student perks:', err.message);
                setPerks([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const categories = useMemo(() => {
        const map = {};
        perks.forEach(p => { map[p.category] = (map[p.category] || 0) + 1; });
        return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
    }, [perks]);

    const filtered = useMemo(() => {
        let list = perks;
        if (activeCategory !== 'All Perks') list = list.filter(p => p.category === activeCategory);
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            list = list.filter(p => p.title?.toLowerCase().includes(term) || p.metadata?.partner_name?.toLowerCase().includes(term));
        }
        return list;
    }, [perks, activeCategory, search]);

    const S = {
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.04) 0%, rgba(5,150,105,0.02) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '3.5rem 2rem 2.5rem',
            textAlign: 'center'
        },
        container: { maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, boxShadow: 'var(--shadow-sm)' },
        catRow: (active) => ({
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.6rem 0.75rem', borderRadius: 10, cursor: 'pointer',
            background: active ? 'var(--bg-mint)' : 'transparent',
            color: active ? 'var(--peacock-green)' : 'var(--text-secondary)',
            fontWeight: active ? 800 : 600, fontSize: '0.85rem'
        })
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO
                title="Student Perks | Chavee"
                description="Exclusive student discounts and perks on learning platforms, career tools, software, entertainment, wellness, and finance — free for Chavee students."
                path="/perks"
                schema={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Student Perks', path: '/perks' }])}
            />
            <Navbar />

            <header style={S.hero}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link> <span style={{ margin: '0 0.3rem' }}>&gt;</span> Student Perks
                </p>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.75rem 0' }}>Student Perks</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Exclusive benefits, discounts, and opportunities curated for Chavee students.
                </p>
            </header>

            <div style={S.container}>
                {/* Search + filter row */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <div style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: '0.6rem', ...S.card, padding: '0.75rem 1.1rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search perks, partners, categories..."
                            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.88rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                        />
                    </div>
                    <select
                        value={activeCategory}
                        onChange={e => setActiveCategory(e.target.value)}
                        style={{ padding: '0.75rem 1rem', borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        <option>All Perks</option>
                        {categories.map(([cat]) => <option key={cat}>{cat}</option>)}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'start', gap: '2rem' }}>
                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ ...S.card, padding: '1.25rem' }}>
                            <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: 800 }}>Categories</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <div style={S.catRow(activeCategory === 'All Perks')} onClick={() => setActiveCategory('All Perks')}>
                                    <span>🗂️ All Perks</span><span>{perks.length}</span>
                                </div>
                                {categories.map(([cat, count]) => (
                                    <div key={cat} style={S.catRow(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
                                        <span>{CATEGORY_ICONS[cat] || '🎁'} {cat}</span><span>{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ ...S.card, padding: '1.25rem' }}>
                            <h3 style={{ margin: '0 0 0.85rem', fontSize: '0.9rem', fontWeight: 800 }}>How It Works</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {[
                                    { n: 1, t: 'Join Chavee', d: 'Create your free student account.' },
                                    { n: 2, t: 'Verify (if required)', d: 'Some perks need student verification.' },
                                    { n: 3, t: 'Unlock Perks', d: 'Access exclusive benefits and offers.' },
                                ].map(step => (
                                    <div key={step.n} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--peacock-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>{step.n}</span>
                                        <div>
                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step.t}</div>
                                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{step.d}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ ...S.card, padding: '1.25rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 800 }}>Are you a brand?</h3>
                            <p style={{ margin: '0 0 0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                                Partner with Chavee and reach thousands of students.
                            </p>
                            <Link to="/contact-us" style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--peacock-green)', textDecoration: 'none' }}>
                                Partner With Us →
                            </Link>
                        </div>
                    </div>

                    {/* Main */}
                    <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '3rem' }}><ButtonSpinner label="Loading perks..." /></div>
                        ) : perks.length === 0 ? (
                            <div style={{ ...S.card, padding: '3.5rem 2rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎁</div>
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Perks coming soon</h2>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: 420, marginInline: 'auto', lineHeight: 1.6 }}>
                                    We're working on real partnerships with brands students actually use. Check back as we partner with more brands — no perks are live yet.
                                </p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div style={{ ...S.card, padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                No perks match your search.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                {filtered.map(p => (
                                    <div key={p.id} style={{ ...S.card, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ height: 90, background: p.metadata?.brand_color || 'var(--peacock-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            {p.image_url ? <img src={p.image_url} alt={p.metadata?.partner_name || p.title || 'Chavee perk partner'} style={{ height: 36 }} /> : <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>{p.metadata?.partner_name}</span>}
                                            {p.metadata?.discount_label && (
                                                <span style={{ position: 'absolute', top: 10, right: 10, background: 'var(--peacock-green)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: 20 }}>{p.metadata.discount_label}</span>
                                            )}
                                        </div>
                                        <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>{p.category}</span>
                                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{p.title}</h3>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{p.summary}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
                                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.metadata?.valid_till ? `Valid till ${new Date(p.metadata.valid_till).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</span>
                                                <a href={p.metadata?.perk_link || '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--peacock-green)', textDecoration: 'none' }}>View Details →</a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Always-honest "more coming" banner */}
                        <div style={{ ...S.card, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-mint)', border: '1px solid var(--border-mint)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <span style={{ fontSize: '1.4rem' }}>🛡️</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>More perks coming your way!</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>We're constantly adding new benefits and opportunities for Chavee students.</div>
                                </div>
                            </div>
                            <Link to="/contact-us" className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: 10, fontSize: '0.82rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                Stay Updated
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
