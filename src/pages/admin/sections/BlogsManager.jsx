import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const CATEGORY_OPTIONS = [
    { value: 'Freelancing', label: '💸 Freelancing' },
    { value: 'Languages',   label: '🗣️ Languages' },
    { value: 'Mentorship',  label: '🤝 Mentorship' },
    { value: 'Student Life', label: '🎓 Student Life' },
];

function Toast({ msg, type }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
            background: isErr ? 'rgba(30,15,15,0.97)' : 'rgba(15,30,25,0.97)',
            border: `1px solid ${isErr ? 'var(--accent-coral)' : 'var(--border-mint)'}`,
            borderRadius: 12, padding: '0.9rem 1.4rem', color: 'var(--text-primary)',
            fontSize: '0.875rem', fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeInUp 0.3s ease-out',
        }}>{msg}</div>
    );
}

const DEFAULT_BLOGS = [
    {
        id: 'b1',
        title: 'How to Earn Your First ₹10,000 as a College Student',
        summary: 'Freelancing in college is easier than you think. Here is a step-by-step guide to finding your first gig using your skills.',
        content: `Many college students in India want to make their own money but don't know where to start. Between classes, exams, and projects, full-time jobs are out of the question. That's where freelance gigs come in.\n\nIn this article, we outline exactly how to list your skills, price your services, and attract your first paying clients. Whether you do web development, UI/UX design, translation, or content writing, there is someone ready to pay for your work on Chavee.`,
        category: 'Freelancing',
        author: 'Rohan Das',
        created_at: '2026-07-15T10:00:00Z',
        image_url: 'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?w=800&auto=format&fit=crop&q=60',
        published: true
    },
    {
        id: 'b2',
        title: 'Mastering Korean: Why Indian Students are Learning Hangul',
        summary: 'From K-Pop to high-paying translation jobs, explore why Korean has become the hottest language to learn in India.',
        content: `Over the past few years, the Hallyu wave has swept across India. Students aren't just watching K-Dramas and listening to K-Pop; they are actively learning the Korean language.\n\nFluency in Korean opens doors to translation gigs, roles in multinational corporations, and study abroad scholarships in South Korea. At Chavee, our live sessions with native tutors April Kim and Leehan help students go from absolute beginners to fluent speakers fast.`,
        category: 'Languages',
        author: 'Keerthi Suresh',
        created_at: '2026-07-12T14:30:00Z',
        image_url: 'https://images.unsplash.com/photo-1543165796-5426273eaab3?w=800&auto=format&fit=crop&q=60',
        published: true
    }
];

const DEFAULT_PRESS = [
    {
        id: 'pr-1',
        title: 'Chavee Rolls Out Live Interactive Language Courses with Native Tutors Across Kerala',
        description: 'Chavee announced a major upgrade to its Education Tab, featuring structured courses in Korean, German, and Spanish tailored specifically for Indian students.',
        created_at: '2026-07-10T10:00:00Z',
        published: true
    },
    {
        id: 'pr-2',
        title: 'Chavee Surpasses Core Onboarding Milestones as the Premier Gen Z Student Marketplace Launch Approaches',
        description: 'With thousands of students registering across colleges, Chavee announces its zero-commission student marketplace to facilitate gig work and textbook exchange.',
        created_at: '2026-06-18T14:30:00Z',
        published: true
    }
];

export default function BlogsManager() {
    const [activeTab, setActiveTab] = useState('blogs'); // 'blogs' or 'press'

    const [rows, setRows] = useState([]);
    const [pressRows, setPressRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Dialog & Form states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Blog Form inputs
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('Student Life');
    const [imageUrl, setImageUrl] = useState('');
    const [author, setAuthor] = useState('');
    
    // Press Release Form inputs
    const [prTitle, setPrTitle] = useState('');
    const [prDescription, setPrDescription] = useState('');
    
    // Shared SEO inputs
    const [slug, setSlug] = useState('');
    const [seoTitle, setSeoTitle] = useState('');
    const [seoDescription, setSeoDescription] = useState('');
    const [seoKeywords, setSeoKeywords] = useState('');
    const [showSeoFields, setShowSeoFields] = useState(false);
    
    const [published, setPublished] = useState(true);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const loadBlogs = async () => {
        try {
            const { data, error } = await supabase
                .from('blogs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                setRows(data);
            } else {
                setRows(DEFAULT_BLOGS);
            }
        } catch (err) {
            console.warn('Using LocalStorage fallback for blogs:', err.message);
            const local = localStorage.getItem('chavee_blogs');
            if (local) {
                setRows(JSON.parse(local));
            } else {
                setRows(DEFAULT_BLOGS);
                localStorage.setItem('chavee_blogs', JSON.stringify(DEFAULT_BLOGS));
            }
        }
    };

    const loadPress = async () => {
        try {
            const { data, error } = await supabase
                .from('press_releases')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                setPressRows(data);
            } else {
                setPressRows(DEFAULT_PRESS);
            }
        } catch (err) {
            console.warn('Using LocalStorage fallback for press_releases:', err.message);
            const local = localStorage.getItem('chavee_press_releases');
            if (local) {
                setPressRows(JSON.parse(local));
            } else {
                setPressRows(DEFAULT_PRESS);
                localStorage.setItem('chavee_press_releases', JSON.stringify(DEFAULT_PRESS));
            }
        }
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        await Promise.all([loadBlogs(), loadPress()]);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const generateId = () => {
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    };

    const handleOpenForm = (item = null) => {
        setEditingItem(item);
        setShowSeoFields(false);
        if (activeTab === 'blogs') {
            if (item) {
                setTitle(item.title || '');
                setSummary(item.summary || '');
                setContent(item.content || '');
                setCategory(item.category || 'Student Life');
                setImageUrl(item.image_url || '');
                setAuthor(item.author || '');
                setPublished(item.published !== false);
                setSlug(item.slug || '');
                setSeoTitle(item.seo_title || '');
                setSeoDescription(item.seo_description || '');
                setSeoKeywords(item.seo_keywords || '');
            } else {
                setTitle('');
                setSummary('');
                setContent('');
                setCategory('Student Life');
                setImageUrl('');
                setAuthor('Chavee Team');
                setPublished(true);
                setSlug('');
                setSeoTitle('');
                setSeoDescription('');
                setSeoKeywords('');
            }
        } else {
            // Press Release Form
            if (item) {
                setPrTitle(item.title || '');
                setPrDescription(item.description || '');
                setImageUrl(item.image_url || '');
                setPublished(item.published !== false);
                setSlug(item.slug || '');
                setSeoTitle(item.seo_title || '');
                setSeoDescription(item.seo_description || '');
                setSeoKeywords(item.seo_keywords || '');
            } else {
                setPrTitle('');
                setPrDescription('');
                setImageUrl('');
                setPublished(true);
                setSlug('');
                setSeoTitle('');
                setSeoDescription('');
                setSeoKeywords('');
            }
        }
        setIsFormOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (activeTab === 'blogs') {
            const payload = {
                title: title.trim(),
                summary: summary.trim(),
                content: content.trim(),
                category,
                image_url: imageUrl.trim() || null,
                author: author.trim() || 'Chavee Team',
                published,
                slug: slug.trim() || null,
                seo_title: seoTitle.trim() || null,
                seo_description: seoDescription.trim() || null,
                seo_keywords: seoKeywords.trim() || null,
                created_at: editingItem ? editingItem.created_at : new Date().toISOString()
            };

            try {
                if (editingItem) {
                    const { error } = await supabase
                        .from('blogs')
                        .update(payload)
                        .eq('id', editingItem.id);
                    if (error) throw error;
                    showToast('Blog article updated.');
                } else {
                    const { error } = await supabase
                        .from('blogs')
                        .insert(payload); // Supabase auto-generates ID
                    if (error) throw error;
                    showToast('Blog article created.');
                }
                await loadBlogs();
            } catch (err) {
                console.warn('Saving blog locally:', err.message);
                let current = [...rows];
                if (editingItem) {
                    current = current.map(r => r.id === editingItem.id ? { ...r, ...payload } : r);
                } else {
                    current = [{ id: 'b-' + generateId(), ...payload }, ...current];
                }
                setRows(current);
                localStorage.setItem('chavee_blogs', JSON.stringify(current));
                showToast('Blog article saved (local fallback).');
            }
        } else {
            // Press Release
            const payload = {
                title: prTitle.trim(),
                description: prDescription.trim(),
                image_url: imageUrl.trim() || null,
                published,
                slug: slug.trim() || null,
                seo_title: seoTitle.trim() || null,
                seo_description: seoDescription.trim() || null,
                seo_keywords: seoKeywords.trim() || null,
                created_at: editingItem ? editingItem.created_at : new Date().toISOString()
            };

            try {
                if (editingItem) {
                    const { error } = await supabase
                        .from('press_releases')
                        .update(payload)
                        .eq('id', editingItem.id);
                    if (error) throw error;
                    showToast('Press news updated.');
                } else {
                    const { error } = await supabase
                        .from('press_releases')
                        .insert(payload);
                    if (error) throw error;
                    showToast('Press news created.');
                }
                await loadPress();
            } catch (err) {
                console.warn('Saving press news locally:', err.message);
                let current = [...pressRows];
                if (editingItem) {
                    current = current.map(r => r.id === editingItem.id ? { ...r, ...payload } : r);
                } else {
                    current = [{ id: 'pr-' + generateId(), ...payload }, ...current];
                }
                setPressRows(current);
                localStorage.setItem('chavee_press_releases', JSON.stringify(current));
                showToast('Press news saved (local fallback).');
            }
        }

        setIsFormOpen(false);
        setEditingItem(null);
    };

    const handleTogglePublish = async (item) => {
        const nextPub = !item.published;
        const targetTable = activeTab === 'blogs' ? 'blogs' : 'press_releases';
        
        try {
            const { error } = await supabase
                .from(targetTable)
                .update({ published: nextPub })
                .eq('id', item.id);
            if (error) throw error;
            showToast(nextPub ? 'Post published live.' : 'Post set to draft.');
            
            if (activeTab === 'blogs') await loadBlogs();
            else await loadPress();
        } catch (err) {
            if (activeTab === 'blogs') {
                const current = rows.map(r => r.id === item.id ? { ...r, published: nextPub } : r);
                setRows(current);
                localStorage.setItem('chavee_blogs', JSON.stringify(current));
            } else {
                const current = pressRows.map(r => r.id === item.id ? { ...r, published: nextPub } : r);
                setPressRows(current);
                localStorage.setItem('chavee_press_releases', JSON.stringify(current));
            }
            showToast(nextPub ? 'Post published (local).' : 'Post set to draft (local).');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        const targetTable = activeTab === 'blogs' ? 'blogs' : 'press_releases';

        try {
            const { error } = await supabase
                .from(targetTable)
                .delete()
                .eq('id', deleteTarget.id);
            if (error) throw error;
            showToast('Item deleted successfully.');
            
            if (activeTab === 'blogs') await loadBlogs();
            else await loadPress();
        } catch (err) {
            if (activeTab === 'blogs') {
                const current = rows.filter(r => r.id !== deleteTarget.id);
                setRows(current);
                localStorage.setItem('chavee_blogs', JSON.stringify(current));
            } else {
                const current = pressRows.filter(r => r.id !== deleteTarget.id);
                setPressRows(current);
                localStorage.setItem('chavee_press_releases', JSON.stringify(current));
            }
            showToast('Item deleted (local fallback).');
        } finally {
            setDeleteTarget(null);
        }
    };

    // Filters for display
    const displayedBlogs = rows.filter(r => {
        const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.author.toLowerCase().includes(search.toLowerCase());
        const matchCat = categoryFilter === 'All' || r.category === categoryFilter;
        return matchSearch && matchCat;
    });

    const displayedPress = pressRows.filter(r => {
        return r.title.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    });

    // Column Configs
    const blogColumns = [
        { key: 'title', label: 'Article Title', render: (val) => <div style={{ fontWeight: 700 }}>{val}</div> },
        { key: 'author', label: 'Author', render: (val) => <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{val}</span> },
        {
            key: 'category',
            label: 'Category',
            render: (val) => (
                <span style={{ padding: '0.15rem 0.5rem', borderRadius: 6, background: 'var(--bg-mint)', color: 'var(--peacock-green)', fontSize: '0.72rem', fontWeight: 700, border: '1px solid var(--border-mint)' }}>
                    {val}
                </span>
            )
        },
        { key: 'created_at', label: 'Created At', render: (val) => <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{val ? new Date(val).toLocaleDateString('en-IN') : '—'}</span> },
        {
            key: 'published',
            label: 'Publish Status',
            render: (val, row) => (
                <button onClick={() => handleTogglePublish(row)} style={{ padding: '0.25rem 0.75rem', borderRadius: 20, background: val ? 'var(--peacock-green)' : 'var(--bg-elevated)', color: val ? '#fff' : 'var(--text-secondary)', border: `1px solid ${val ? 'var(--peacock-green)' : 'var(--border-color)'}`, fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}>
                    {val ? '● Live' : '○ Draft'}
                </button>
            )
        }
    ];

    const pressColumns = [
        { key: 'title', label: 'Press Release Title', render: (val) => <div style={{ fontWeight: 700 }}>{val}</div> },
        { key: 'created_at', label: 'Publish Date', render: (val) => <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{val ? new Date(val).toLocaleDateString('en-IN') : '—'}</span> },
        {
            key: 'published',
            label: 'Publish Status',
            render: (val, row) => (
                <button onClick={() => handleTogglePublish(row)} style={{ padding: '0.25rem 0.75rem', borderRadius: 20, background: val ? 'var(--peacock-green)' : 'var(--bg-elevated)', color: val ? '#fff' : 'var(--text-secondary)', border: `1px solid ${val ? 'var(--peacock-green)' : 'var(--border-color)'}`, fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer' }}>
                    {val ? '● Live' : '○ Draft'}
                </button>
            )
        }
    ];

    const actionBtn = (color) => ({
        padding: '0.35rem 0.75rem', borderRadius: 7, border: `1px solid ${color}30`,
        background: `${color}12`, color, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
        transition: 'all 0.15s'
    });

    return (
        <div>
            <Toast msg={toast?.msg} type={toast?.type} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>📰 News & Press Manager</h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>Manage Chavee platform blogs and official press releases.</p>
                </div>
                <button onClick={() => handleOpenForm()} className="btn-primary" style={{ padding: '0.55rem 1.25rem', borderRadius: 9, fontSize: '0.85rem' }}>
                    {activeTab === 'blogs' ? '+ Create Article' : '+ Create Release'}
                </button>
            </div>

            {/* Tabs switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                {[
                    { key: 'blogs', label: '📝 Blog Articles', count: rows.length },
                    { key: 'press', label: '📢 Press Releases', count: pressRows.length }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                        style={{
                            padding: '0.5rem 1.25rem', borderRadius: '8px 8px 0 0',
                            background: activeTab === tab.key ? 'var(--bg-mint)' : 'transparent',
                            color: activeTab === tab.key ? 'var(--peacock-green)' : 'var(--text-muted)',
                            border: 'none', borderBottom: activeTab === tab.key ? '2px solid var(--peacock-green)' : 'none',
                            fontWeight: 700, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem'
                        }}
                    >
                        <span>{tab.label}</span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(17,94,89,0.08)', padding: '0.1rem 0.4rem', borderRadius: 10 }}>{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1rem',
                display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem'
            }}>
                <input
                    type="text"
                    placeholder={activeTab === 'blogs' ? 'Search title, author...' : 'Search release title...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                        background: 'var(--bg-base)', border: '1px solid var(--border-color)',
                        borderRadius: 8, color: 'var(--text-primary)', padding: '0.55rem 0.8rem',
                        fontSize: '0.84rem', outline: 'none', minWidth: 200, fontFamily: 'inherit'
                    }}
                />
                
                {activeTab === 'blogs' && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                        {['All', 'Freelancing', 'Languages', 'Mentorship', 'Student Life'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                style={{
                                    padding: '0.4rem 0.8rem', borderRadius: 20,
                                    background: categoryFilter === cat ? 'var(--peacock-green)' : 'var(--bg-elevated)',
                                    color: categoryFilter === cat ? '#fff' : 'var(--text-secondary)',
                                    border: `1px solid ${categoryFilter === cat ? 'var(--peacock-green)' : 'var(--border-color)'}`,
                                    fontWeight: 700, fontSize: '0.74rem', cursor: 'pointer'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            {activeTab === 'blogs' ? (
                <DataTable
                    columns={blogColumns}
                    rows={displayedBlogs}
                    loading={loading}
                    searchKeys={['title', 'author', 'category']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                                onClick={() => handleOpenForm(row)}
                                style={actionBtn('#6366F1')}
                                onMouseEnter={e => { e.currentTarget.style.background = '#6366F125'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#6366F112'; }}
                            >
                                Edit ✏️
                            </button>
                            <button
                                onClick={() => setDeleteTarget(row)}
                                style={actionBtn('#EF4444')}
                                onMouseEnter={e => { e.currentTarget.style.background = '#EF444425'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#EF444412'; }}
                            >
                                Delete 🗑️
                            </button>
                        </div>
                    )}
                />
            ) : (
                <DataTable
                    columns={pressColumns}
                    rows={displayedPress}
                    loading={loading}
                    searchKeys={['title', 'description']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                                onClick={() => handleOpenForm(row)}
                                style={actionBtn('#6366F1')}
                                onMouseEnter={e => { e.currentTarget.style.background = '#6366F125'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#6366F112'; }}
                            >
                                Edit ✏️
                            </button>
                            <button
                                onClick={() => setDeleteTarget(row)}
                                style={actionBtn('#EF4444')}
                                onMouseEnter={e => { e.currentTarget.style.background = '#EF444425'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#EF444412'; }}
                            >
                                Delete 🗑️
                            </button>
                        </div>
                    )}
                />
            )}

            {/* Form Modal */}
            {isFormOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9000,
                    background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }} onClick={() => setIsFormOpen(false)}>
                    <div style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 16,
                        padding: '2rem',
                        width: '100%', maxWidth: activeTab === 'blogs' ? 680 : 500,
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        animation: 'adminModalIn 0.2s ease-out',
                        boxShadow: 'var(--shadow-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 800 }}>
                                {activeTab === 'blogs'
                                    ? (editingItem ? 'Edit Blog Article' : 'Create Blog Article')
                                    : (editingItem ? 'Edit Press Release' : 'Create Press Release')}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer', outline: 'none' }}>✕</button>
                        </div>
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activeTab === 'blogs' ? (
                                /* Blog Form */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Article Title</label>
                                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. 5 Coding Projects to build in college" className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Author</label>
                                            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} required placeholder="Chavee Team" className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Category</label>
                                            <select value={category} onChange={e => setCategory(e.target.value)} className="dark-input" style={{ width: '100%', padding: '0.55rem', fontSize: '0.9rem', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                                                {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Image URL</label>
                                        <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Summary / Excerpt</label>
                                        <input type="text" value={summary} onChange={e => setSummary(e.target.value)} required placeholder="A short one-sentence teaser..." className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Article Content</label>
                                        <textarea rows={5} value={content} onChange={e => setContent(e.target.value)} required placeholder="Write the full post contents here..." className="dark-input" style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.84rem' }}>
                                        <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--peacock-green)' }} />
                                        <span>Publish immediately (Make Live)</span>
                                    </label>
                                </div>
                            ) : (
                                /* Press Release Form */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>News Title</label>
                                        <input type="text" value={prTitle} onChange={e => setPrTitle(e.target.value)} required placeholder="e.g. Chavee partners with Kerala Technology Hub" className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Image URL (Optional)</label>
                                        <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Full Description / Announcement</label>
                                        <textarea rows={6} value={prDescription} onChange={e => setPrDescription(e.target.value)} required placeholder="Write the official release content here..." className="dark-input" style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                                    </div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.84rem' }}>
                                        <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--peacock-green)' }} />
                                        <span>Publish immediately (Make Live)</span>
                                    </label>
                                </div>
                            )}

                            {/* Collapsible SEO & Metadata Settings */}
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden', marginTop: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowSeoFields(!showSeoFields)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 1rem',
                                        background: 'var(--bg-elevated)',
                                        border: 'none',
                                        color: 'var(--text-primary)',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        outline: 'none'
                                    }}
                                >
                                    <span>🔍 SEO & Metadata Settings (Optional)</span>
                                    <span>{showSeoFields ? '▲' : '▼'}</span>
                                </button>
                                
                                {showSeoFields && (
                                    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>Custom URL Slug</label>
                                            <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))} placeholder="e.g. my-awesome-post-title" className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>Only lowercase letters, numbers, hyphens, and underscores.</span>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>SEO Meta Title</label>
                                            <input type="text" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder="If empty, default title is used..." className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>SEO Meta Description</label>
                                            <textarea rows={2} value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="A brief summary for search engines (150-160 characters suggested)..." className="dark-input" style={{ width: '100%', resize: 'none', fontFamily: 'inherit', fontSize: '0.9rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.3rem' }}>SEO Keywords</label>
                                            <input type="text" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="e.g. education, freelance, student career, key-skills" className="dark-input" style={{ width: '100%', fontSize: '0.9rem' }} />
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>Comma-separated keywords.</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-ghost" style={{ padding: '0.6rem 1.25rem', borderRadius: 9, cursor: 'pointer' }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: 9, cursor: 'pointer' }}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Delete Item?"
                message={`Are you sure you want to permanently delete this item?`}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />
        </div>
    );
}
