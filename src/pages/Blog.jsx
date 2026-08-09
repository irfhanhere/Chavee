import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';

const MOCK_BLOGS = [
    {
        id: 'b1',
        title: 'How to Earn Your First ₹10,000 as a College Student',
        summary: 'Freelancing in college is easier than you think. Here is a step-by-step guide to finding your first gig using your skills.',
        body: `Many college students in India want to make their own money but don't know where to start. Between classes, exams, and projects, full-time jobs are out of the question. That's where freelance gigs come in.\n\nIn this article, we outline exactly how to list your skills, price your services, and attract your first paying clients. Whether you do web development, UI/UX design, translation, or content writing, there is someone ready to pay for your work on Chavee.`,
        category: 'Freelancing',
        author: 'Rohan Das',
        created_at: '2026-07-15T10:00:00Z',
        image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop&q=60'
    },
    {
        id: 'b2',
        title: 'Mastering Korean: Why Indian Students are Learning Hangul',
        summary: 'From K-Pop to high-paying translation jobs, explore why Korean has become the hottest language to learn in India.',
        body: `Over the past few years, the Hallyu wave has swept across India. Students aren't just watching K-Dramas and listening to K-Pop; they are actively learning the Korean language.\n\nFluency in Korean opens doors to translation gigs, roles in multinational corporations, and study abroad scholarships in South Korea. At Chavee, our live sessions with native tutors April Kim and Leehan help students go from absolute beginners to fluent speakers fast.`,
        category: 'Languages',
        author: 'Keerthi Suresh',
        created_at: '2026-07-12T14:30:00Z',
        image_url: 'https://images.unsplash.com/photo-1543165796-5426273eaab3?w=800&auto=format&fit=crop&q=60'
    },
    {
        id: 'b3',
        title: 'Study Sync: The Power of Peer-to-Peer Mentoring',
        summary: 'Why peer mentorship beats traditional tutoring and how to find the perfect study partner in your college circle.',
        body: `Struggling with engineering math or coding concepts? Sometimes, a professor's lecture isn't enough. Learning from a senior who recently aced the exact same course is often the fastest way to understand complex subjects.\n\nChavee's Study Sync matches you with verified peer mentors in your university within 24 hours. Learn together, practice problems, and level up your grades without spending a fortune.`,
        category: 'Mentorship',
        author: 'April Kim',
        created_at: '2026-07-09T09:15:00Z',
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=60'
    }
];

export default function Blog() {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBlog, setSelectedBlog] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState('All');

    const loadBlogs = async () => {
        setLoading(true);
        try {
            // Attempt to load from Supabase blogs table
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('content_type', 'blog')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (data && data.length > 0) {
                setBlogs(data);
            } else {
                setBlogs(MOCK_BLOGS);
            }
        } catch (err) {
            console.warn('Supabase blogs table not ready/found, loading local blogs:', err.message);
            // Fallback to local storage + mock data
            const local = localStorage.getItem('chavee_blogs');
            if (local) {
                setBlogs(JSON.parse(local));
            } else {
                setBlogs(MOCK_BLOGS);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBlogs();
        document.title = 'Chavee Blog | Learn Earn Network Belong';
    }, []);

    useEffect(() => {
        if (selectedBlog) {
            const originalTitle = document.title;
            const originalDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            const originalKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';

            // Update with custom SEO tags or fallback
            document.title = selectedBlog.seo_title || `${selectedBlog.title} | Chavee Blog`;
            
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', selectedBlog.seo_description || selectedBlog.summary || '');

            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement('meta');
                metaKeywords.setAttribute('name', 'keywords');
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', selectedBlog.seo_keywords || `chavee blog, student stories, ${selectedBlog.category}`);

            return () => {
                document.title = originalTitle;
                if (metaDesc) metaDesc.setAttribute('content', originalDesc);
                if (metaKeywords) metaKeywords.setAttribute('content', originalKeywords);
            };
        }
    }, [selectedBlog]);

    const categories = ['All', ...new Set(blogs.map(b => b.category))];
    const filteredBlogs = categoryFilter === 'All'
        ? blogs
        : blogs.filter(b => b.category === categoryFilter);

    const S = {
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.04) 0%, rgba(5,150,105,0.02) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '4rem 2rem',
            textAlign: 'center'
        },
        container: {
            maxWidth: 1100,
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
        }
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>📰 Chavee Blog</p>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.5rem 0' }}>Student Stories & Insights</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Guides, case studies, and tips from peers and mentors to help you build your future.
                </p>
            </header>

            {/* Filter tab */}
            <div style={S.container}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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

                {/* Blogs Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <ButtonSpinner label="Loading stories..." />
                    </div>
                ) : filteredBlogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        No articles found in this category.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '2rem' }}>
                        {filteredBlogs.map(b => (
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
                                    {selectedBlog.author[0]}
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
