import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SEO from '../components/SEO.jsx';

const PAGE_SIZE = 6;

export default function Blog() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [authorFilter, setAuthorFilter] = useState('All Authors');
    const [sort, setSort] = useState('latest');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const loadBlogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('content_type', 'blog')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBlogs(data || []);
        } catch (err) {
            console.warn('Could not load blogs:', err.message);
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBlogs();
    }, []);

    // Reactive, not imperative — Helmet just renders whatever these resolve
    // to on each render, so there's no manual "restore the original title"
    // cleanup needed the way the old direct-DOM-mutation version required.
    // Canonical always stays "/blog": there's no per-post route (posts open
    // in a modal, not a real URL), so a per-post canonical would be fake.
    const seoTitle = selectedBlog
        ? (selectedBlog.seo_title || `${selectedBlog.title} | Chavee Blog`)
        : 'Chavee Blog | Learn Earn Network Belong';
    const seoDescription = selectedBlog
        ? (selectedBlog.seo_description || selectedBlog.summary || '')
        : 'Real stories, guides and updates from the Chavee student community — career advice, gig-economy tips, campus life, and platform news.';
    const seoKeywords = selectedBlog
        ? (selectedBlog.seo_keywords || `chavee blog, student stories, ${selectedBlog.category}`)
        : undefined;

    // Real distinct categories/authors from the actual loaded posts — not
    // hardcoded lists (same lesson as Careers' department-filter fix).
    const categories = useMemo(() => ['All', ...new Set(blogs.map(b => b.category).filter(Boolean))], [blogs]);
    const authors = useMemo(() => ['All Authors', ...new Set(blogs.map(b => b.author).filter(Boolean))], [blogs]);

    // "Popular" ranking: by real views if any post actually has views > 0,
    // otherwise fall back to recency — never a fabricated popularity number.
    const viewsArePopulated = useMemo(() => blogs.some(b => (b.views || 0) > 0), [blogs]);
    const popularPosts = useMemo(() => {
        const sorted = [...blogs].sort((a, b) => viewsArePopulated
            ? (b.views || 0) - (a.views || 0)
            : new Date(b.created_at) - new Date(a.created_at));
        return sorted.slice(0, 5);
    }, [blogs, viewsArePopulated]);

    const filteredBlogs = useMemo(() => {
        let list = blogs;
        if (categoryFilter !== 'All') list = list.filter(b => b.category === categoryFilter);
        if (authorFilter !== 'All Authors') list = list.filter(b => b.author === authorFilter);
        if (search.trim()) {
            const term = search.trim().toLowerCase();
            list = list.filter(b => b.title?.toLowerCase().includes(term) || b.summary?.toLowerCase().includes(term));
        }
        list = [...list].sort((a, b) => {
            if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sort === 'most_viewed') return (b.views || 0) - (a.views || 0);
            return new Date(b.created_at) - new Date(a.created_at); // latest (default)
        });
        return list;
    }, [blogs, categoryFilter, authorFilter, search, sort]);

    // Real pagination over the real filtered count — resets to page 1 on
    // any filter/search/sort change so the user never lands on an empty page.
    useEffect(() => { setPage(1); }, [categoryFilter, authorFilter, search, sort]);
    const totalPages = Math.max(1, Math.ceil(filteredBlogs.length / PAGE_SIZE));
    const pagedBlogs = filteredBlogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const S = {
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.04) 0%, rgba(5,150,105,0.02) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '4rem 2rem',
            textAlign: 'center'
        },
        container: {
            maxWidth: 1200,
            margin: '0 auto',
            padding: '3rem 1.5rem'
        },
        card: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            flexDirection: 'column'
        },
        badge: {
            background: 'var(--bg-mint)',
            color: 'var(--peacock-green)',
            padding: '0.2rem 0.6rem',
            borderRadius: 6,
            fontSize: '0.74rem',
            fontWeight: 700,
            display: 'inline-block'
        },
        select: {
            padding: '0.5rem 0.85rem', borderRadius: 10, border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: 600
        }
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO title={seoTitle} description={seoDescription} keywords={seoKeywords} path="/blog" />
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>📰 Chavee Blog</p>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.5rem 0' }}>Student Stories & Insights</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Guides, case studies, and tips from peers and mentors to help you build your future.
                </p>
            </header>

            <div style={S.container}>
                {/* Search + Category + Author + Sort */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: '0.6rem', ...S.card, cursor: 'default', padding: '0.6rem 1rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search blogs..."
                            style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'inherit' }}
                        />
                    </div>
                    <select value={authorFilter} onChange={e => setAuthorFilter(e.target.value)} style={S.select}>
                        {authors.map(a => <option key={a}>{a}</option>)}
                    </select>
                    <select value={sort} onChange={e => setSort(e.target.value)} style={S.select}>
                        <option value="latest">Latest</option>
                        <option value="oldest">Oldest</option>
                        <option value="most_viewed">Most Viewed</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            style={{
                                padding: '0.45rem 1rem',
                                borderRadius: 20,
                                background: categoryFilter === cat ? 'var(--peacock-green)' : 'var(--bg-elevated)',
                                color: categoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                                border: `1px solid ${categoryFilter === cat ? 'var(--peacock-green)' : 'var(--border-color)'}`,
                                fontWeight: 700,
                                fontSize: '0.78rem',
                                cursor: 'pointer',
                                transition: 'all 0.18s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <ButtonSpinner label="Loading stories..." />
                    </div>
                ) : blogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No blog posts published yet. Check back soon.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                        {/* Main content */}
                        <div style={{ gridColumn: 'span 3', minWidth: 0 }}>
                            {filteredBlogs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                    No articles match your search or filters.
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                                        {pagedBlogs.map(b => (
                                            <div
                                                key={b.id}
                                                style={S.card}
                                                onClick={() => setSelectedBlog(b)}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.transform = 'none';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                }}
                                            >
                                                <div style={{ height: 180, width: '100%', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
                                                    <img
                                                        src={b.image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=60'}
                                                        alt={b.title}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={S.badge}>{b.category}</span>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                            {new Date(b.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, lineHeight: 1.4, color: 'var(--text-primary)' }}>{b.title}</h3>
                                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, flex: 1 }}>{b.summary}</p>
                                                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>By {b.author}</span>
                                                        <span style={{ fontSize: '0.78rem', color: 'var(--peacock-green)', fontWeight: 800 }}>Read Article →</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination — real, reflects the real filtered count */}
                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                                disabled={page === 1}
                                                style={{ padding: '0.5rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
                                            >‹</button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setPage(p)}
                                                    style={{
                                                        padding: '0.5rem 0.9rem', borderRadius: 8, border: `1px solid ${p === page ? 'var(--peacock-green)' : 'var(--border-color)'}`,
                                                        background: p === page ? 'var(--peacock-green)' : 'var(--bg-surface)', color: p === page ? '#fff' : 'var(--text-primary)',
                                                        fontWeight: 700, cursor: 'pointer'
                                                    }}
                                                >{p}</button>
                                            ))}
                                            <button
                                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                                disabled={page === totalPages}
                                                style={{ padding: '0.5rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}
                                            >›</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Popular Posts sidebar */}
                        <div style={{ ...S.card, cursor: 'default', padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                🔥 Popular Posts
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                {popularPosts.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedBlog(p)}
                                        style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}
                                    >
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{p.title}</span>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {viewsArePopulated ? `${p.views || 0} views` : new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Read Article Modal */}
            {selectedBlog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => setSelectedBlog(null)}>
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                        borderRadius: 16, maxWidth: 680, width: '100%', maxHeight: '85vh',
                        overflowY: 'auto', display: 'flex', flexDirection: 'column',
                        boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.25s ease-out'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ position: 'relative', height: 260, width: '100%' }}>
                            <img
                                src={selectedBlog.image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=60'}
                                alt={selectedBlog.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button
                                onClick={() => setSelectedBlog(null)}
                                style={{
                                    position: 'absolute', top: '1rem', right: '1rem',
                                    background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)', width: 32, height: 32, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800
                                }}
                            >✕</button>
                        </div>
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span style={S.badge}>{selectedBlog.category}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Published on {new Date(selectedBlog.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>{selectedBlog.title}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--peacock-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                                    {selectedBlog.author?.[0]}
                                </div>
                                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Written by {selectedBlog.author}</span>
                            </div>
                            <div style={{
                                fontSize: '0.94rem', lineHeight: 1.75, color: 'var(--text-primary)',
                                whiteSpace: 'pre-line', marginTop: '0.5rem'
                            }} dangerouslySetInnerHTML={{ __html: selectedBlog.body || selectedBlog.content }}>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
