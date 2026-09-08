import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { useAuth } from '../../../hooks/useAuth.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';

function Toast({ msg, type }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
            background: isErr ? 'rgba(30,15,15,0.97)' : 'rgba(15,30,25,0.97)',
            border: `1px solid ${isErr ? 'var(--accent-coral)' : 'var(--border-mint)'}`,
            borderRadius: 12, padding: '0.9rem 1.4rem', color: '#fff',
            fontSize: '0.875rem', fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeInUp 0.3s ease-out',
        }}>{msg}</div>
    );
}

function StatCard({ title, count, color, icon, loading }) {
    return (
        <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            borderRadius: 16, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                {icon}
            </div>
            <div>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {loading ? <span style={{ color: 'var(--border-color)' }}>-</span> : count}
                </h3>
            </div>
        </div>
    );
}

const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'all', label: 'All Content' },
    { id: 'blog', label: 'Blogs' },
    { id: 'press_release', label: 'Press Releases' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'homepage_banner', label: 'Homepage Banners' },
    { id: 'faq', label: 'FAQ' },
    { id: 'guideline_section', label: 'Community Guidelines' },
    { id: 'perk', label: 'Student Perks' }
];

// Real, published-feature-grounded category taxonomies for the two
// structured editors below — matches the categories actually rendered
// on the public /faq and /perks pages.
const FAQ_CATEGORIES = ['General', 'Account', 'Jobs & Careers', 'Gigs', 'Communities', 'Events & Learning', 'Safety & Privacy'];
const GUIDELINE_ICONS = ['respect', 'relevant', 'harassment', 'spam', 'privacy', 'transactions', 'ip', 'report', 'consequences'];
const PERK_CATEGORIES = ['Learning', 'Career', 'Tools & Software', 'Entertainment', 'Health & Wellness', 'Finance'];

export default function ContentManager() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [activeTab, setActiveTab] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');

    // Stats
    const [stats, setStats] = useState({ 
        announcements: 0, blogs: 0, press: 0, banners: 0, 
        drafts: 0, published: 0, scheduled: 0, views: 0 
    });

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    // Modal state for Rich Text (Blogs, PR, Announcements)
    const [richModal, setRichModal] = useState({ open: false, row: null, type: 'blog' });
    // Modal state for Banners
    const [bannerModal, setBannerModal] = useState({ open: false, row: null });
    // Confirm Dialog for Delete
    const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });
    
    const [saving, setSaving] = useState(false);
    const { user } = useAuth();   // guarded upstream by <RequireAdmin>

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const content = data || [];
            setRows(content);

            setStats({
                announcements: content.filter(c => c.content_type === 'announcement').length,
                blogs: content.filter(c => c.content_type === 'blog').length,
                press: content.filter(c => c.content_type === 'press_release').length,
                banners: content.filter(c => c.content_type === 'homepage_banner').length,
                drafts: content.filter(c => c.status === 'draft').length,
                published: content.filter(c => c.status === 'published').length,
                scheduled: content.filter(c => c.status === 'scheduled').length,
                views: content.reduce((sum, c) => sum + (c.views || 0), 0)
            });

        } catch (err) {
            console.error(err);
            showToast('Failed to load content: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSaveRichContent = async (formData, submitType) => {
        setSaving(true);
        try {
            const type = richModal.type;
            
            // Build metadata
            let metadata = {};
            if (type === 'press_release') {
                metadata = { source: formData.source || '', external_link: formData.external_link || '' };
            } else if (type === 'announcement') {
                metadata = {
                    pinned: !!formData.pinned,
                    expiry_date: formData.expiry_date || null,
                    priority: Number(formData.priority) || 0,
                    button_text: formData.button_text || '',
                    button_link: formData.button_link || '',
                    color_theme: formData.color_theme || 'default'
                };
            } else if (type === 'faq') {
                metadata = { popular: !!formData.popular };
            } else if (type === 'guideline_section') {
                metadata = { icon: formData.icon || 'respect', order: Number(formData.order) || 0 };
            } else if (type === 'perk') {
                metadata = {
                    partner_name: formData.partner_name?.trim() || '',
                    discount_label: formData.discount_label?.trim() || '',
                    valid_till: formData.valid_till || null,
                    perk_link: formData.perk_link?.trim() || '',
                    brand_color: formData.brand_color?.trim() || ''
                };
            }

            // Target status
            let status = 'draft';
            let published = false;
            let scheduled_at = null;

            if (submitType === 'publish') {
                status = 'published';
                published = true;
            } else if (submitType === 'schedule') {
                status = 'scheduled';
                published = false;
                scheduled_at = formData.scheduled_at;
                if (!scheduled_at) throw new Error("Scheduled Date is required for scheduling.");
            }

            const payload = {
                content_type: type,
                title: formData.title?.trim(),
                slug: formData.slug?.trim().toLowerCase().replace(/\s+/g, '-'),
                summary: formData.summary?.trim(),
                body: formData.body,
                category: (type === 'blog' || type === 'faq' || type === 'perk') ? formData.category?.trim() : null,
                author: formData.author?.trim(),
                image_url: formData.image_url?.trim(),
                status,
                published,
                scheduled_at,
                seo_title: formData.seo_title?.trim(),
                seo_description: formData.seo_description?.trim(),
                seo_keywords: formData.seo_keywords?.trim(),
                metadata,
                updated_at: new Date().toISOString()
            };

            let error;
            if (richModal.row) {
                ({ error } = await supabase.from('content').update(payload).eq('id', richModal.row.id));
            } else {
                payload.created_by = user?.id;
                ({ error } = await supabase.from('content').insert(payload));
            }

            if (error) {
                if (error.code === '23505') throw new Error("Slug must be unique.");
                throw error;
            }

            showToast(richModal.row ? 'Updated successfully' : 'Created successfully');
            setRichModal({ open: false, row: null, type: 'blog' });
            loadData();
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveBanner = async (formData, submitType) => {
        setSaving(true);
        try {
            let status = submitType === 'publish' ? 'published' : 'draft';
            let published = submitType === 'publish';
            
            let metadata = {
                subtitle: formData.subtitle?.trim() || '',
                description: formData.description?.trim() || '',
                banner_position: formData.banner_position || 'hero',
                cta_text: formData.cta_text?.trim() || '',
                cta_link: formData.cta_link?.trim() || '',
                priority: Number(formData.priority) || 0,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                target_audience: formData.target_audience?.trim() || '',
                desktop_image_url: formData.desktop_image_url?.trim() || '',
                tablet_image_url: formData.tablet_image_url?.trim() || '',
                mobile_image_url: formData.mobile_image_url?.trim() || ''
            };

            const payload = {
                content_type: 'homepage_banner',
                title: formData.title?.trim() || 'Banner',
                status,
                published,
                metadata,
                updated_at: new Date().toISOString()
            };

            let error;
            if (bannerModal.row) {
                ({ error } = await supabase.from('content').update(payload).eq('id', bannerModal.row.id));
            } else {
                payload.created_by = user?.id;
                ({ error } = await supabase.from('content').insert(payload));
            }

            if (error) throw error;

            showToast(bannerModal.row ? 'Banner updated' : 'Banner created');
            setBannerModal({ open: false, row: null });
            loadData();
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDuplicate = async (row) => {
        try {
            const copy = { ...row };
            delete copy.id;
            delete copy.created_at;
            delete copy.updated_at;
            copy.title = `${copy.title} (Copy)`;
            copy.slug = copy.slug ? `${copy.slug}-copy-${Date.now()}` : null;
            copy.status = 'draft';
            copy.published = false;
            copy.views = 0;
            
            const { error } = await supabase.from('content').insert(copy);
            if (error) throw error;
            showToast('Item duplicated successfully');
            loadData();
        } catch (err) {
            showToast('Failed to duplicate: ' + err.message, 'error');
        }
    };

    const handleArchive = async (id) => {
        try {
            const { error } = await supabase.from('content').update({ status: 'archived', published: false }).eq('id', id);
            if (error) throw error;
            showToast('Item archived');
            loadData();
        } catch (err) {
            showToast('Failed to archive: ' + err.message, 'error');
        }
    };

    const handleHardDelete = async (id) => {
        try {
            const { error } = await supabase.from('content').delete().eq('id', id);
            if (error) throw error;
            showToast('Item permanently deleted');
            setConfirmDelete({ open: false, row: null });
            loadData();
        } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
        }
    };

    // Derived filtering
    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            if (activeTab !== 'all' && r.content_type !== activeTab) return false;
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (search) {
                const term = search.toLowerCase();
                if (!r.title?.toLowerCase().includes(term)) return false;
            }
            return true;
        });
    }, [rows, activeTab, statusFilter, search]);

    const columns = [
        {
            key: 'thumbnail', label: 'Item', sortable: false,
            render: (_, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-elevated)', overflow: 'hidden', flexShrink: 0 }}>
                        {row.image_url ? (
                            <img src={row.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : row.metadata?.desktop_image_url ? (
                            <img src={row.metadata.desktop_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', background: '#3B82F615' }}>
                                {row.content_type === 'blog' ? '📝' : row.content_type === 'press_release' ? '📰' : row.content_type === 'announcement' ? '📢' : row.content_type === 'faq' ? '❓' : row.content_type === 'guideline_section' ? '🛡️' : row.content_type === 'perk' ? '🎁' : '🖼'}
                            </div>
                        )}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{row.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {row.content_type.replace('_', ' ').toUpperCase()} {row.category ? `• ${row.category}` : ''}
                        </div>
                    </div>
                </div>
            )
        },
        { key: 'author', label: 'Author', sortable: true, render: v => <span style={{ fontSize: '0.8rem' }}>{v || '—'}</span> },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v) => {
                const colors = { 'published': '#10B981', 'draft': '#6B7280', 'scheduled': '#F59E0B', 'archived': '#EF4444' };
                const color = colors[v] || '#6B7280';
                return (
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${color}15`, color }}>
                        {v.toUpperCase()}
                    </span>
                );
            }
        },
        { key: 'views', label: 'Views', sortable: true, render: v => <span style={{ fontSize: '0.8rem' }}>👁 {v || 0}</span> },
        {
            key: 'created_at', label: 'Created', sortable: true,
            render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—',
        }
    ];

    const openRichModal = (type, row = null) => {
        setRichModal({ open: true, type, row });
    };

    const openBannerModal = (row = null) => {
        setBannerModal({ open: true, row });
    };

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>📚 Content Management</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage Blogs, Press Releases, Announcements, and Banners.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={loadData} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
                        ↻ Refresh
                    </button>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        {/* A simple dropdown for "Create New" would be better, but for MVP we just layout buttons */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button onClick={() => openRichModal('blog')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Blog</button>
                            <button onClick={() => openRichModal('press_release')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: '#3B82F6', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Press</button>
                            <button onClick={() => openRichModal('announcement')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: '#F59E0B', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Announce</button>
                            <button onClick={() => openBannerModal()} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: '#8B5CF6', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Banner</button>
                            <button onClick={() => openRichModal('faq')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: '#0EA5E9', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ FAQ</button>
                            <button onClick={() => openRichModal('guideline_section')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: '#14B8A6', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Guideline</button>
                            <button onClick={() => openRichModal('perk')} style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: '#EC4899', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Perk</button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <StatCard title="Blogs" count={stats.blogs} icon="📝" color="#10B981" loading={loading} />
                <StatCard title="Press Releases" count={stats.press} icon="📰" color="#3B82F6" loading={loading} />
                <StatCard title="Announcements" count={stats.announcements} icon="📢" color="#F59E0B" loading={loading} />
                <StatCard title="Banners" count={stats.banners} icon="🖼" color="#8B5CF6" loading={loading} />
                <StatCard title="Total Views" count={stats.views} icon="👁" color="#6366F1" loading={loading} />
            </div>

            {/* Tab Row */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 0',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `3px solid ${activeTab === tab.id ? 'var(--peacock-green)' : 'transparent'}`,
                            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === tab.id ? 800 : 600,
                            fontSize: '0.9rem',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' ? (
                <ContentOverview rows={rows} loading={loading} />
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="Search titles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 1, minWidth: 200, padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        >
                            <option value="all">All Statuses</option>
                            <option value="published">Published</option>
                            <option value="draft">Drafts</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                        <DataTable
                            columns={columns}
                            rows={filteredRows}
                            loading={loading}
                            emptyMessage="No content found."
                            actions={(row) => (
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => row.content_type === 'homepage_banner' ? openBannerModal(row) : openRichModal(row.content_type, row)}
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630', cursor: 'pointer' }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        onClick={() => handleDuplicate(row)}
                                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630', cursor: 'pointer' }}
                                    >
                                        Duplicate
                                    </button>

                                    {row.status !== 'archived' ? (
                                        <button
                                            onClick={() => handleArchive(row.id)}
                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30', cursor: 'pointer' }}
                                        >
                                            Archive
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmDelete({ open: true, row })}
                                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}
                                        >
                                            Delete Permanently
                                        </button>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </>
            )}

            {/* Rich Content Modal (Custom instead of FormModal to handle multiple submit buttons and custom rendering) */}
            {richModal.open && (
                <RichContentModal 
                    mode={richModal.row ? 'edit' : 'create'}
                    type={richModal.type}
                    initialValues={richModal.row || {}}
                    onClose={() => setRichModal({ open: false, row: null, type: 'blog' })}
                    onSave={handleSaveRichContent}
                    saving={saving}
                />
            )}

            {/* Banner Modal */}
            {bannerModal.open && (
                <BannerModal 
                    mode={bannerModal.row ? 'edit' : 'create'}
                    initialValues={bannerModal.row || {}}
                    onClose={() => setBannerModal({ open: false, row: null })}
                    onSave={handleSaveBanner}
                    saving={saving}
                />
            )}

            {/* Delete Confirmation */}
            {confirmDelete.open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, maxWidth: 400, width: '100%' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>Permanent Delete</h3>
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)' }}>Are you sure you want to permanently delete "{confirmDelete.row.title}"? This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmDelete({ open: false, row: null })} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}>Cancel</button>
                            <button onClick={() => handleHardDelete(confirmDelete.row.id)} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--accent-coral)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── CUSTOM MODAL FOR RICH CONTENT (Blogs, PR, Announcements) ──
function RichContentModal({ mode, type, initialValues, onClose, onSave, saving }) {
    const [formData, setFormData] = useState({
        title: initialValues.title || '',
        slug: initialValues.slug || '',
        summary: initialValues.summary || '',
        body: initialValues.body || '',
        category: initialValues.category || '',
        author: initialValues.author || '',
        image_url: initialValues.image_url || '',
        seo_title: initialValues.seo_title || '',
        seo_description: initialValues.seo_description || '',
        seo_keywords: initialValues.seo_keywords || '',
        scheduled_at: initialValues.scheduled_at ? new Date(initialValues.scheduled_at).toISOString().slice(0, 16) : '',
        // Metadata fields
        source: initialValues.metadata?.source || '',
        external_link: initialValues.metadata?.external_link || '',
        pinned: initialValues.metadata?.pinned || false,
        expiry_date: initialValues.metadata?.expiry_date ? new Date(initialValues.metadata?.expiry_date).toISOString().slice(0, 10) : '',
        priority: initialValues.metadata?.priority || 0,
        button_text: initialValues.metadata?.button_text || '',
        button_link: initialValues.metadata?.button_link || '',
        color_theme: initialValues.metadata?.color_theme || 'default',
        // FAQ
        popular: initialValues.metadata?.popular || false,
        // Community Guidelines section
        icon: initialValues.metadata?.icon || 'respect',
        order: initialValues.metadata?.order ?? 0,
        // Student Perk
        partner_name: initialValues.metadata?.partner_name || '',
        discount_label: initialValues.metadata?.discount_label || '',
        valid_till: initialValues.metadata?.valid_till ? new Date(initialValues.metadata.valid_till).toISOString().slice(0, 10) : '',
        perk_link: initialValues.metadata?.perk_link || '',
        brand_color: initialValues.metadata?.brand_color || '',
    });

    const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    const handleTitleChange = (e) => {
        const title = e.target.value;
        if (!initialValues.id) { // Only auto-slug on create
            update('slug', title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
        }
        update('title', title);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 16, width: '100%', maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
                
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{mode === 'create' ? 'Create' : 'Edit'} {type.replace('_', ' ').toUpperCase()}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Basic Info */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                {type === 'faq' ? 'Question *' : type === 'guideline_section' ? 'Section Title *' : type === 'perk' ? 'Perk Title *' : 'Title *'}
                            </label>
                            <input value={formData.title} onChange={handleTitleChange} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Slug (Unique) *</label>
                            <input value={formData.slug} onChange={e => update('slug', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                        </div>
                    </div>

                    {type === 'blog' && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category</label>
                                <input value={formData.category} onChange={e => update('category', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Author</label>
                                <input value={formData.author} onChange={e => update('author', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                            </div>
                        </div>
                    )}

                    {type === 'faq' && (
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category *</label>
                                <select value={formData.category} onChange={e => update('category', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
                                    <option value="">Select category...</option>
                                    {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, paddingBottom: '0.6rem', cursor: 'pointer' }}>
                                <input type="checkbox" checked={formData.popular} onChange={e => update('popular', e.target.checked)} />
                                Show in "Popular Questions"
                            </label>
                        </div>
                    )}

                    {type === 'perk' && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Category *</label>
                                <select value={formData.category} onChange={e => update('category', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
                                    <option value="">Select category...</option>
                                    {PERK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Partner Name *</label>
                                <input value={formData.partner_name} onChange={e => update('partner_name', e.target.value)} placeholder="e.g. Unacademy" style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                            </div>
                        </div>
                    )}

                    {type === 'guideline_section' && (
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Icon</label>
                                <select value={formData.icon} onChange={e => update('icon', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
                                    {GUIDELINE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Display Order</label>
                                <input type="number" value={formData.order} onChange={e => update('order', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                            </div>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            {type === 'guideline_section' ? 'Short Summary (shown collapsed)' : type === 'perk' ? 'Description (shown on card)' : 'Summary / Excerpt'}
                        </label>
                        <textarea value={formData.summary} onChange={e => update('summary', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: 60, resize: 'vertical' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            {type === 'perk' ? 'Logo Image URL' : 'Image URL'}
                        </label>
                        <input value={formData.image_url} onChange={e => update('image_url', e.target.value)} placeholder="https://... (or upload to storage)" style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)' }} />
                    </div>

                    {type === 'perk' && (
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, border: '1px dashed #10B98150' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#10B981', fontSize: '0.9rem' }}>Perk Details</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Discount Label (e.g. "20% OFF")</label>
                                    <input value={formData.discount_label} onChange={e => update('discount_label', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Valid Till</label>
                                    <input type="date" value={formData.valid_till} onChange={e => update('valid_till', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Perk Link (redeem URL)</label>
                                    <input value={formData.perk_link} onChange={e => update('perk_link', e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Brand Color (card header, e.g. #1DB954)</label>
                                    <input value={formData.brand_color} onChange={e => update('brand_color', e.target.value)} placeholder="#115E59" style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            {type === 'faq' ? 'Answer *' : type === 'guideline_section' ? 'Full Description *' : 'Body Content (HTML/Markdown supported) *'}
                        </label>
                        <textarea value={formData.body} onChange={e => update('body', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: 200, resize: 'vertical', fontFamily: 'monospace' }} />
                    </div>

                    {/* Metadata Fields based on type */}
                    {type === 'press_release' && (
                        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: 8, border: '1px dashed #3B82F650' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#3B82F6', fontSize: '0.9rem' }}>Press Release Data</h4>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Source (e.g. Times of India)</label>
                                    <input value={formData.source} onChange={e => update('source', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>External Link</label>
                                    <input value={formData.external_link} onChange={e => update('external_link', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {type === 'announcement' && (
                        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: 8, border: '1px dashed #F59E0B50' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#F59E0B', fontSize: '0.9rem' }}>Announcement Data</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={formData.pinned} onChange={e => update('pinned', e.target.checked)} />
                                        Pinned to top
                                    </label>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Priority</label>
                                    <input type="number" value={formData.priority} onChange={e => update('priority', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Expiry Date</label>
                                    <input type="date" value={formData.expiry_date} onChange={e => update('expiry_date', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Color Theme</label>
                                    <input value={formData.color_theme} onChange={e => update('color_theme', e.target.value)} placeholder="default" style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Button Text</label>
                                    <input value={formData.button_text} onChange={e => update('button_text', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Button Link</label>
                                    <input value={formData.button_link} onChange={e => update('button_link', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SEO Block */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>SEO Settings</h4>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <input placeholder="SEO Title" value={formData.seo_title} onChange={e => update('seo_title', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                            <input placeholder="SEO Description" value={formData.seo_description} onChange={e => update('seo_description', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                            <input placeholder="SEO Keywords (comma separated)" value={formData.seo_keywords} onChange={e => update('seo_keywords', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                        </div>
                    </div>
                    
                    {/* Scheduling */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Scheduling (Optional)</h4>
                        <input type="datetime-local" value={formData.scheduled_at} onChange={e => update('scheduled_at', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>If you click "Schedule", this date will be required.</p>
                    </div>

                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-elevated)', display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button onClick={onClose} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    
                    <button onClick={() => onSave(formData, 'draft')} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Save Draft</button>
                    
                    <button onClick={() => onSave(formData, 'schedule')} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: '#F59E0B15', border: '1px solid #F59E0B50', color: '#F59E0B', cursor: 'pointer', fontWeight: 600 }}>Schedule</button>
                    
                    <button onClick={() => onSave(formData, 'publish')} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Publish Now</button>
                </div>
            </div>
        </div>
    );
}

// ── CUSTOM MODAL FOR BANNERS ──
function BannerModal({ mode, initialValues, onClose, onSave, saving }) {
    const [formData, setFormData] = useState({
        title: initialValues.title || '',
        subtitle: initialValues.metadata?.subtitle || '',
        description: initialValues.metadata?.description || '',
        banner_position: initialValues.metadata?.banner_position || 'hero',
        cta_text: initialValues.metadata?.cta_text || '',
        cta_link: initialValues.metadata?.cta_link || '',
        priority: initialValues.metadata?.priority || 0,
        start_date: initialValues.metadata?.start_date ? new Date(initialValues.metadata?.start_date).toISOString().slice(0, 10) : '',
        end_date: initialValues.metadata?.end_date ? new Date(initialValues.metadata?.end_date).toISOString().slice(0, 10) : '',
        target_audience: initialValues.metadata?.target_audience || '',
        desktop_image_url: initialValues.metadata?.desktop_image_url || '',
        tablet_image_url: initialValues.metadata?.tablet_image_url || '',
        mobile_image_url: initialValues.metadata?.mobile_image_url || ''
    });

    const update = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'var(--bg-surface)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
                
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-elevated)' }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>{mode === 'create' ? 'Create' : 'Edit'} Banner</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                </div>

                <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Internal Title (Not public) *</label>
                            <input value={formData.title} onChange={e => update('title', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Position</label>
                            <select value={formData.banner_position} onChange={e => update('banner_position', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                <option value="hero">Hero</option>
                                <option value="secondary">Secondary</option>
                                <option value="promo">Promo Strip</option>
                            </select>
                        </div>
                    </div>

                    {/* Real gap found vs. the reference (adminpane-announcement-banner.png):
                        banners had no public-facing subtitle/description copy at all,
                        only a CTA. Added here — stored in the same metadata jsonb,
                        no migration needed. */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Subtitle (public)</label>
                        <input value={formData.subtitle} onChange={e => update('subtitle', e.target.value)} placeholder="Shown under the banner title" style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Description (public, optional)</label>
                        <textarea value={formData.description} onChange={e => update('description', e.target.value)} rows={2} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', resize: 'vertical', fontFamily: 'inherit' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Start Date</label>
                            <input type="date" value={formData.start_date} onChange={e => update('start_date', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>End Date</label>
                            <input type="date" value={formData.end_date} onChange={e => update('end_date', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>CTA Text</label>
                            <input value={formData.cta_text} onChange={e => update('cta_text', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>CTA Link</label>
                            <input value={formData.cta_link} onChange={e => update('cta_link', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Priority / Order (Number)</label>
                            <input type="number" value={formData.priority} onChange={e => update('priority', e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>Target Audience</label>
                            <input value={formData.target_audience} onChange={e => update('target_audience', e.target.value)} placeholder="e.g. all, premium" style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                    </div>

                    <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>Responsive Images</h4>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Desktop Image URL</label>
                                <input value={formData.desktop_image_url} onChange={e => update('desktop_image_url', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Tablet Image URL</label>
                                <input value={formData.tablet_image_url} onChange={e => update('tablet_image_url', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Mobile Image URL</label>
                                <input value={formData.mobile_image_url} onChange={e => update('mobile_image_url', e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)' }} />
                            </div>
                        </div>
                    </div>

                </div>

                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-elevated)', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                    
                    <button onClick={() => onSave(formData, 'draft')} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Save Draft</button>
                    
                    <button onClick={() => onSave(formData, 'publish')} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Publish Banner</button>
                </div>
            </div>
        </div>
    );
}

// ── CONTENT OVERVIEW TAB — real counts from `rows` (the same data every
// other tab already loads from `content`), no fabricated numbers or
// trend deltas (no time-series data exists to back those honestly). ──
const TYPE_META = {
    blog: { label: 'Blogs', color: '#10B981' },
    press_release: { label: 'Press Releases', color: '#3B82F6' },
    announcement: { label: 'Announcements', color: '#F59E0B' },
    homepage_banner: { label: 'Homepage Banners', color: '#8B5CF6' },
    faq: { label: 'FAQ', color: '#0EA5E9' },
    guideline_section: { label: 'Community Guidelines', color: '#14B8A6' },
    perk: { label: 'Student Perks', color: '#EC4899' },
};
const STATUS_META = {
    published: { label: 'Published', color: '#10B981' },
    draft: { label: 'Draft', color: '#F59E0B' },
    scheduled: { label: 'Scheduled', color: '#3B82F6' },
    archived: { label: 'Archived', color: '#6B7280' },
};

function relativeTime(dateStr) {
    if (!dateStr) return '—';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days <= 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ContentOverview({ rows, loading }) {
    const byType = useMemo(() => {
        const counts = {};
        rows.forEach(r => { counts[r.content_type] = (counts[r.content_type] || 0) + 1; });
        return counts;
    }, [rows]);

    const total = rows.length;

    // Real conic-gradient donut — no charting library needed, no invented
    // percentages: every slice is `count / total` from the real rows.
    const donutSlices = useMemo(() => {
        let acc = 0;
        return Object.entries(byType)
            .filter(([, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
                const start = acc;
                acc += pct;
                return { type, count, pct, start, end: acc, meta: TYPE_META[type] || { label: type, color: '#94A3B8' } };
            });
    }, [byType, total]);

    const gradientStops = donutSlices.map(s => `${s.meta.color} ${s.start}% ${s.end}%`).join(', ');

    const byStatus = useMemo(() => {
        const table = {};
        Object.keys(STATUS_META).forEach(status => {
            table[status] = { total: 0 };
            Object.keys(TYPE_META).forEach(type => { table[status][type] = 0; });
        });
        rows.forEach(r => {
            if (!table[r.status]) table[r.status] = { total: 0 };
            table[r.status][r.content_type] = (table[r.status][r.content_type] || 0) + 1;
            table[r.status].total += 1;
        });
        return table;
    }, [rows]);

    const recent = useMemo(() => {
        return [...rows]
            .filter(r => r.status === 'published')
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    }, [rows]);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading overview...</div>;
    }

    if (total === 0) {
        return (
            <div style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 14, padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No content exists yet — create a Blog, Press Release, Announcement, Banner, FAQ, Guideline or Perk to see real numbers here.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                {/* Donut */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Content Overview</h3>
                    <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real breakdown of all {total} content items by type.</p>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{
                            width: 160, height: 160, borderRadius: '50%', flexShrink: 0,
                            background: donutSlices.length > 0 ? `conic-gradient(${gradientStops})` : 'var(--bg-elevated)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>{total}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Total</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: 160 }}>
                            {donutSlices.map(s => (
                                <div key={s.type} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.meta.color, flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.meta.label}</span>
                                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.count} ({s.pct.toFixed(1)}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Content */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Recent Content</h3>
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Latest published items.</p>
                    {recent.length === 0 ? (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Nothing published yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            {recent.map(r => (
                                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{relativeTime(r.created_at)}</div>
                                    </div>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: (TYPE_META[r.content_type] || {}).color || '#94A3B8', background: `${(TYPE_META[r.content_type] || {}).color || '#94A3B8'}15`, padding: '0.2rem 0.55rem', borderRadius: 20, whiteSpace: 'nowrap' }}>
                                        {(TYPE_META[r.content_type] || {}).label || r.content_type}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Content by Status table */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)', overflowX: 'auto' }}>
                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Content by Status</h3>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real distribution of content across statuses.</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 560 }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <th style={{ textAlign: 'left', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>Status</th>
                            {Object.entries(TYPE_META).map(([type, meta]) => (
                                <th key={type} style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', fontWeight: 700 }}>{meta.label}</th>
                            ))}
                            <th style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-primary)', fontWeight: 800 }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(STATUS_META).map(([status, meta]) => (
                            <tr key={status} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '0.6rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                                    {meta.label}
                                </td>
                                {Object.keys(TYPE_META).map(type => (
                                    <td key={type} style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-secondary)' }}>{byStatus[status]?.[type] || 0}</td>
                                ))}
                                <td style={{ textAlign: 'center', padding: '0.6rem 0.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{byStatus[status]?.total || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
