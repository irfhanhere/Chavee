import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient.js';
import { useAuth } from '../../../hooks/useAuth.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// ---- Shared Components ----

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

// ---- Main Manager Component ----

export default function CommunitiesManager() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters & Search
    const [activeTab, setActiveTab] = useState('all');
    const [search, setSearch] = useState('');

    // Stats
    const [stats, setStats] = useState({ 
        total: 0, live: 0, comingSoon: 0, members: 0, posts: 0, pendingReports: 0, pendingRequests: 0 
    });

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = useCallback((msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    }, []);

    // Modals
    const [formModal, setFormModal] = useState({ open: false, row: null });
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: '', row: null });
    const [viewingCommunity, setViewingCommunity] = useState(null);
    const [saving, setSaving] = useState(false);
    
    const { user } = useAuth();   // guarded upstream by <RequireAdmin>

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch communities
            const { data: commData, error: commErr } = await supabase
                .from('communities')
                .select('*, community_members(count), profiles!communities_created_by_fkey(full_name)')
                .order('created_at', { ascending: false });

            if (commErr) throw commErr;
            const communities = commData || [];

            // Fetch posts count globally
            const { count: postCounts } = await supabase
                .from('posts')
                .select('community_id', { count: 'exact', head: true })
                .not('community_id', 'is', null);

            // Fetch pending join requests globally
            const { count: pendingReqCount } = await supabase
                .from('community_join_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            // Fetch pending reports for community posts globally
            const { count: pendingRepCount } = await supabase
                .from('reports_moderation')
                .select('*, posts!inner(community_id)', { count: 'exact', head: true })
                .eq('status', 'Pending')
                .not('posts.community_id', 'is', null);

            // Also fetch posts per community to display in table (simplified approach, better with RPC in production)
            const { data: postsData } = await supabase
                .from('posts')
                .select('community_id')
                .not('community_id', 'is', null);
            
            const postMap = {};
            if (postsData) {
                postsData.forEach(p => {
                    postMap[p.community_id] = (postMap[p.community_id] || 0) + 1;
                });
            }

            const enriched = communities.map(c => ({
                ...c,
                member_count: c.community_members?.[0]?.count ?? 0,
                posts_count: postMap[c.id] || 0,
                owner_name: c.profiles?.full_name || 'Unknown'
            }));

            setRows(enriched);

            setStats({
                total: enriched.length,
                live: enriched.filter(c => c.status === 'Live').length,
                comingSoon: enriched.filter(c => c.status === 'Coming Soon').length,
                members: enriched.reduce((sum, c) => sum + (c.member_count), 0),
                posts: postCounts || 0,
                pendingReports: pendingRepCount || 0,
                pendingRequests: pendingReqCount || 0
            });

        } catch (err) {
            console.error(err);
            showToast('Failed to load communities: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (formData) => {
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                category: formData.category,
                guidelines: formData.guidelines,
                is_paid: formData.is_paid || false,
                price: formData.is_paid ? (formData.price || 0) : 0,
                status: formData.status || 'Coming Soon',
                visibility: formData.visibility || 'Public',
                emoji: formData.emoji || '🏘️'
            };

            let finalSlug = formData.slug;

            if (!formModal.row) {
                // Auto-generate slug on create
                finalSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                
                // Check uniqueness
                const { data: existing } = await supabase.from('communities').select('id').eq('slug', finalSlug).maybeSingle();
                if (existing) {
                    showToast('Error: A community with a similar name already exists (slug collision)', 'error');
                    return;
                }
                const { data: { session } } = await supabase.auth.getSession();
                payload.slug = finalSlug;
                payload.created_by = session?.user?.id;
            } else {
                // If they change the name when editing, should we update slug? 
                // The prompt says "On submit: insert into communities... slug auto-generated from name...". 
                // It doesn't specify on edit. We'll leave the slug untouched on edit, unless we want to allow editing.
                // Wait, if it's an edit, we don't send slug to avoid breaking links.
            }

            let error;
            if (formModal.row) {
                ({ error } = await supabase.from('communities').update(payload).eq('id', formModal.row.id));
            } else {
                ({ error } = await supabase.from('communities').insert(payload));
            }

            if (error) {
                if (error.code === '23505' && error.message.includes('slug')) {
                    showToast('Error: Slug must be unique', 'error');
                    return;
                }
                throw error;
            }

            showToast(formModal.row ? 'Community updated' : 'Community created', 'success');
            setFormModal({ open: false, row: null });
            loadData();
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleQuickStatus = async (id, status) => {
        // Returns a real success boolean (in addition to its existing toast/reload
        // side effects) so callers that need to know whether it actually worked —
        // like the Overview tab's local status mirror — don't optimistically update
        // on a call that silently failed. Existing call site (the list row's
        // Archive button) ignores the return value, unaffected.
        try {
            const { error } = await supabase.from('communities').update({ status }).eq('id', id);
            if (error) throw error;
            showToast('Status updated');
            loadData();
            return true;
        } catch (err) {
            showToast('Update failed: ' + err.message, 'error');
            return false;
        }
    };

    const handleDuplicate = async (row) => {
        try {
            const copy = { ...row };
            delete copy.id;
            delete copy.created_at;
            delete copy.community_members;
            delete copy.profiles;
            delete copy.member_count;
            delete copy.posts_count;
            delete copy.owner_name;
            
            copy.name = `${copy.name} (Copy)`;
            if (copy.slug) copy.slug = `${copy.slug}-copy-${Date.now()}`;
            copy.status = 'Coming Soon';
            
            const { error } = await supabase.from('communities').insert(copy);
            if (error) throw error;
            showToast('Duplicated successfully');
            loadData();
        } catch (err) {
            showToast('Duplicate failed: ' + err.message, 'error');
        }
    };

    const handleSoftDelete = async (id) => {
        handleQuickStatus(id, 'Archived');
    };

    const handleHardDelete = async (id) => {
        try {
            const { error } = await supabase.from('communities').delete().eq('id', id);
            if (error) throw error;
            showToast('Community permanently deleted');
            setConfirmDialog({ open: false, type: '', row: null });
            loadData();
        } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
        }
    };

    // Derived filtering
    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            if (activeTab === 'live' && r.status !== 'Live') return false;
            if (activeTab === 'coming_soon' && r.status !== 'Coming Soon') return false;
            if (activeTab === 'archived' && r.status !== 'Archived') return false;
            if (activeTab === 'hidden' && r.status !== 'Hidden') return false;
            if (search) {
                const term = search.toLowerCase();
                if (!r.name?.toLowerCase().includes(term) && !r.category?.toLowerCase().includes(term)) return false;
            }
            return true;
        });
    }, [rows, activeTab, search]);

    const topCommunities = useMemo(() => {
        return rows.filter(r => r.status === 'Live').sort((a, b) => b.member_count - a.member_count).slice(0, 5);
    }, [rows]);

    const columns = [
        {
            key: 'name', label: 'Community', sortable: true,
            render: (v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {row.emoji || '🏘️'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{v}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.category || 'General'} {row.is_paid ? '• Paid' : ''}</div>
                    </div>
                </div>
            )
        },
        { key: 'owner_name', label: 'Owner', sortable: true, render: v => <span style={{ fontSize: '0.85rem' }}>{v}</span> },
        { key: 'member_count', label: 'Members', sortable: true, render: v => <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>👥 {v}</span> },
        { key: 'posts_count', label: 'Posts', sortable: true, render: v => <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>📝 {v}</span> },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v) => {
                const map = { 'Live': '#10B981', 'Coming Soon': '#F59E0B', 'Hidden': '#6B7280', 'Archived': '#EF4444' };
                const color = map[v] || '#6B7280';
                return (
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, background: `${color}15`, color }}>
                        {v || 'Unknown'}
                    </span>
                );
            }
        },
        {
            key: 'created_at', label: 'Created', sortable: true,
            render: v => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        }
    ];

    if (viewingCommunity) {
        return <CommunityDetails comm={viewingCommunity} onBack={() => { setViewingCommunity(null); loadData(); }} showToast={showToast} onQuickStatus={handleQuickStatus} />;
    }

    // Pie chart slices calculation
    const totalStatus = stats.live + stats.comingSoon + (stats.total - stats.live - stats.comingSoon);
    const pLive = totalStatus ? (stats.live / totalStatus) * 100 : 0;
    const pSoon = totalStatus ? (stats.comingSoon / totalStatus) * 100 : 0;
    const pieGradient = totalStatus > 0 ? `conic-gradient(#10B981 0% ${pLive}%, #F59E0B ${pLive}% ${pLive + pSoon}%, #6B7280 ${pLive + pSoon}% 100%)` : '#e2e8f0';

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>🏘️ Communities</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage communities, members, and content.</p>
                </div>
                <button onClick={loadData} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>↻ Refresh</button>
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                
                {/* LEFT MAIN AREA */}
                <div style={{ flex: '1 1 0%', minWidth: 600 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                        <StatCard title="Communities" count={stats.total} icon="🏘️" color="#3B82F6" loading={loading} />
                        <StatCard title="Active" count={stats.live} icon="🟢" color="#10B981" loading={loading} />
                        <StatCard title="Coming Soon" count={stats.comingSoon} icon="⏳" color="#F59E0B" loading={loading} />
                        <StatCard title="Total Members" count={stats.members} icon="👥" color="#8B5CF6" loading={loading} />
                        <StatCard title="Total Posts" count={stats.posts} icon="📝" color="#6366F1" loading={loading} />
                        <StatCard title="Pending Reports" count={stats.pendingReports} icon="🚩" color="#EF4444" loading={loading} />
                        <StatCard title="Join Requests" count={stats.pendingRequests} icon="📬" color="#EC4899" loading={loading} />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        {[{id:'all', label: 'All'}, {id:'live', label: 'Live'}, {id:'coming_soon', label: 'Coming Soon'}, {id:'hidden', label: 'Hidden'}, {id:'archived', label: 'Archived'}].map(tab => (
                            <button
                                key={tab.id} onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '0.75rem 0', background: 'transparent', border: 'none',
                                    borderBottom: `3px solid ${activeTab === tab.id ? 'var(--peacock-green)' : 'transparent'}`,
                                    color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                    fontWeight: activeTab === tab.id ? 800 : 600, fontSize: '0.9rem', cursor: 'pointer'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <input 
                            type="text" placeholder="Search communities..." value={search} onChange={e => setSearch(e.target.value)}
                            style={{ width: '100%', maxWidth: 300, padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}
                        />
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                        <DataTable
                            columns={columns}
                            rows={filteredRows}
                            loading={loading}
                            emptyMessage="No communities found."
                            actions={(row) => (
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button onClick={() => setViewingCommunity(row)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630', cursor: 'pointer' }}>View</button>
                                    <button onClick={() => setFormModal({ open: true, row })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Edit</button>
                                    
                                    {row.status === 'Live' ? (
                                        <button onClick={() => handleQuickStatus(row.id, 'Hidden')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Hide</button>
                                    ) : (
                                        <button onClick={() => handleQuickStatus(row.id, 'Live')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30', cursor: 'pointer' }}>Go Live</button>
                                    )}

                                    <button onClick={() => handleDuplicate(row)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630', cursor: 'pointer' }}>Duplicate</button>

                                    {row.status !== 'Archived' ? (
                                        <button onClick={() => handleSoftDelete(row.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Archive</button>
                                    ) : (
                                        <button onClick={() => setConfirmDialog({ open: true, type: 'delete', row })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Hard Delete</button>
                                    )}
                                </div>
                            )}
                        />
                    </div>
                </div>

                {/* RIGHT RAIL */}
                <div style={{ width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Community Overview */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Community Overview</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: 100, height: 100, borderRadius: '50%', background: pieGradient, position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 15, left: 15, right: 15, bottom: 15, background: 'var(--bg-surface)', borderRadius: '50%' }} />
                            </div>
                            <div style={{ flex: 1, fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }}/> Live</span>
                                    <span style={{ fontWeight: 800 }}>{stats.live}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }}/> Coming Soon</span>
                                    <span style={{ fontWeight: 800 }}>{stats.comingSoon}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6B7280' }}/> Other</span>
                                    <span style={{ fontWeight: 800 }}>{stats.total - stats.live - stats.comingSoon}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button onClick={() => navigate('/admin/communities/new')} style={{ width: '100%', padding: '0.75rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span>+</span> Create Community
                            </button>
                        </div>
                    </div>

                    {/* Top Communities */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Top Communities</h3>
                        {topCommunities.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No live communities yet.</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {topCommunities.map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            {c.emoji || '🏘️'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{c.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.category}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                                        {c.member_count} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>m</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pending Approvals */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Pending Approvals</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 8, background: 'var(--bg-elevated)' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Join Requests</span>
                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800, background: stats.pendingRequests > 0 ? '#EC489920' : 'var(--bg-surface)', color: stats.pendingRequests > 0 ? '#EC4899' : 'var(--text-muted)' }}>
                                    {stats.pendingRequests}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderRadius: 8, background: 'var(--bg-elevated)' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Post Reports</span>
                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: 12, fontSize: '0.75rem', fontWeight: 800, background: stats.pendingReports > 0 ? '#EF444420' : 'var(--bg-surface)', color: stats.pendingReports > 0 ? '#EF4444' : 'var(--text-muted)' }}>
                                    {stats.pendingReports}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit modal — FormModal is edit-only here; create goes to /admin/communities/new */}
            <FormModal
                open={formModal.open}
                title="Edit Community"
                fields={[
                    { key: 'name', label: 'Name *', type: 'text', required: true },
                    { key: 'description', label: 'Description', type: 'textarea' },
                    { key: 'guidelines', label: 'Guidelines / Rules', type: 'textarea' },
                    { key: 'category', label: 'Category', type: 'text' },
                    { key: 'is_paid', label: 'Free or Paid', type: 'toggle', onLabel: 'Paid', offLabel: 'Free' },
                    { key: 'price', label: 'Price (if paid)', type: 'number', condition: (v) => v.is_paid, required: true },
                    { key: 'visibility', label: 'Visibility', type: 'select', options: [{value: 'Public', label: 'Public'}, {value: 'Private', label: 'Private'}, {value: 'Invite Only', label: 'Invite Only'}] },
                    { key: 'emoji', label: 'Emoji (Icon)', type: 'emoji' },
                    { key: 'logo_url', label: 'Logo URL', type: 'text' },
                    { key: 'status', label: 'Status', type: 'select', options: [{value: 'Live', label: 'Live'}, {value: 'Coming Soon', label: 'Coming Soon'}] }
                ]}
                initialValues={formModal.row || { status: 'Coming Soon', visibility: 'Public', is_paid: false, price: 0, emoji: '🏘️' }}
                onSubmit={handleSave}
                onClose={() => setFormModal({ open: false, row: null })}
                loading={saving}
            />

            {confirmDialog.open && (
                <ConfirmDialog
                    title="Confirm Permanent Deletion"
                    message={`Are you absolutely sure you want to hard-delete "${confirmDialog.row.name}"? This will cascade and delete all posts, members, and events tied to this community.`}
                    onConfirm={() => handleHardDelete(confirmDialog.row.id)}
                    onCancel={() => setConfirmDialog({ open: false, row: null })}
                    confirmText="Permanently Delete"
                    isDestructive={true}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// DETAILS COMPONENT & TABS
// ─────────────────────────────────────────────

function CommunityDetails({ comm, onBack, showToast, onQuickStatus }) {
    const [activeTab, setActiveTab] = useState('overview');
    // Local mirror of comm.status — onQuickStatus (the list page's real handler)
    // updates the LIST's data on success, not this already-opened comm object,
    // so without this the header/status card would show a stale status until
    // the admin backs out and reopens the page. Updated optimistically right
    // after a successful call so Archive/Change Status visibly reflect here.
    const [status, setStatus] = useState(comm.status);

    const handleStatusChange = async (newStatus) => {
        const ok = await onQuickStatus(comm.id, newStatus);
        if (ok) setStatus(newStatus); // don't reflect a call that actually failed
    };

    const TABS = [
        { id: 'overview', label: 'Overview' },
        { id: 'members', label: 'Members' },
        { id: 'posts', label: 'Posts' },
        { id: 'channels', label: 'Channels' },
        { id: 'events', label: 'Events' },
        { id: 'resources', label: 'Resources' },
        { id: 'analytics', label: 'Analytics' },
        { id: 'reports', label: 'Reports' },
        { id: 'settings', label: 'Settings' },
    ];

    return (
        <div style={{ animation: 'fadeInRight 0.3s ease-out' }}>
            <button onClick={onBack} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', marginBottom: '1.5rem' }}>
                ← Back to Communities
            </button>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', marginBottom: '2rem' }}>
                <div style={{ height: 120, width: '100%', background: 'linear-gradient(90deg, #10B98115, #3B82F615)' }} />
                
                <div style={{ padding: '0 2rem 2rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginTop: '-2rem' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 16, background: 'var(--bg-elevated)', border: '4px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                        {comm.emoji || '🏘️'}
                    </div>
                    <div style={{ paddingTop: '2.5rem', flex: 1 }}>
                        <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>{comm.name}</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {comm.category} • {comm.member_count} Members • Status: {status}
                        </p>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '0.75rem 0', background: 'transparent', border: 'none',
                            borderBottom: `3px solid ${activeTab === tab.id ? 'var(--peacock-green)' : 'transparent'}`,
                            color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                            fontWeight: activeTab === tab.id ? 800 : 600, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div>
                {activeTab === 'overview' && <OverviewTab comm={comm} status={status} onStatusChange={handleStatusChange} setActiveTab={setActiveTab} />}
                {activeTab === 'members' && <MembersTab comm={comm} showToast={showToast} />}
                {activeTab === 'posts' && <PostsTab comm={comm} showToast={showToast} />}
                {activeTab === 'channels' && <ChannelsTab comm={comm} showToast={showToast} />}
                {activeTab === 'events' && <EventsTab comm={comm} />}
                {activeTab === 'resources' && <ResourcesTab comm={comm} showToast={showToast} />}
                {activeTab === 'analytics' && <AnalyticsTab comm={comm} />}
                {activeTab === 'reports' && <ReportsTab comm={comm} showToast={showToast} />}
                {activeTab === 'settings' && <SettingsTab comm={comm} showToast={showToast} />}
            </div>
        </div>
    );
}

// ---- Sub Tabs ----

// Real card queries only. Active Members and Events This Month are
// intentionally omitted — confirmed no honest data source exists for
// either (profiles.last_active_at is never written by any real code path;
// zero real `events` rows have a non-null community_id anywhere, and no
// UI anywhere — admin or user-facing — can create one). Faking either
// with a placeholder would be worse than not showing the card at all.
const STAT_CARDS = [
    { key: 'members', label: 'Total Members', icon: '👥', color: '#8B5CF6' },
    { key: 'posts', label: 'Total Posts', icon: '📝', color: '#3B82F6' },
    { key: 'discussions', label: 'Total Discussions', icon: '💬', color: '#10B981' },
    { key: 'reportsPending', label: 'Reports Pending', icon: '🚩', color: '#EF4444' },
];

const TAB_HELP = [
    { icon: '🏠', label: 'Overview', desc: 'Community summary, stats, quick actions and danger zone.' },
    { icon: '👥', label: 'Members', desc: 'View all members, manage roles, remove or ban.' },
    { icon: '📝', label: 'Posts', desc: 'View all posts, pin or delete.' },
    { icon: '💬', label: 'Channels', desc: 'View discussion channels, delete inactive or spam ones.' },
    { icon: '📅', label: 'Events', desc: 'View events linked to this community.' },
    { icon: '📚', label: 'Resources', desc: 'Add or remove shared resources.' },
    { icon: '📈', label: 'Analytics', desc: 'Member growth and engagement aggregations.' },
    { icon: '🚩', label: 'Reports', desc: 'Review and resolve reported posts.' },
    { icon: '⚙️', label: 'Settings', desc: 'Edit details, change status, danger zone actions.' },
];

const WORKFLOW_STEPS = [
    { n: 1, label: 'Monitor', desc: 'Check stats and reports on this Overview tab regularly.' },
    { n: 2, label: 'Moderate', desc: 'Review flagged posts in Reports, remove spam channels in Channels.' },
    { n: 3, label: 'Support', desc: 'Approve members, help with issues via Manage Members.' },
    { n: 4, label: 'Adjust', desc: 'Change visibility or archive via Community Status when needed.' },
];

function OverviewTab({ comm, status, onStatusChange, setActiveTab }) {
    const [stats, setStats] = useState({ members: null, posts: null, discussions: null, reportsPending: null });
    const [topContributors, setTopContributors] = useState([]);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoadingStats(true);
            try {
                const [membersRes, postsRes, discussionsRes, reportsRes, postsForTopRes] = await Promise.all([
                    supabase.from('community_members').select('*', { count: 'exact', head: true }).eq('community_id', comm.id),
                    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('community_id', comm.id),
                    supabase.from('community_channels').select('*', { count: 'exact', head: true }).eq('community_id', comm.id),
                    supabase.from('reports_moderation').select('*, posts!inner(community_id)', { count: 'exact', head: true }).eq('posts.community_id', comm.id).eq('status', 'Pending'),
                    // Top Contributors — real grouping by posts.user_id in this community.
                    supabase.from('posts').select('user_id').eq('community_id', comm.id),
                ]);
                if (cancelled) return;

                setStats({
                    members: membersRes.count ?? 0,
                    posts: postsRes.count ?? 0,
                    discussions: discussionsRes.count ?? 0,
                    reportsPending: reportsRes.count ?? 0,
                });

                const counts = {};
                (postsForTopRes.data || []).forEach(p => { counts[p.user_id] = (counts[p.user_id] || 0) + 1; });
                const topIds = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                if (topIds.length) {
                    const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', topIds.map(([id]) => id));
                    if (cancelled) return;
                    const profileById = Object.fromEntries((profiles || []).map(p => [p.id, p]));
                    setTopContributors(topIds.map(([id, count]) => ({ id, count, profile: profileById[id] || null })));
                } else {
                    setTopContributors([]);
                }
            } catch (err) {
                console.error('Failed to load Overview stats:', err);
            } finally {
                if (!cancelled) setLoadingStats(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [comm.id]);

    const cardStyle = { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Main column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>
                {/* Stat cards — real only, 4 of them */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    {STAT_CARDS.map(card => (
                        <div key={card.key} style={cardStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                                <span style={{ width: 32, height: 32, borderRadius: 8, background: `${card.color}18`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>{card.icon}</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{card.label}</span>
                            </div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                {loadingStats ? '—' : stats[card.key]}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Community Workflow — static, describes how to use this admin page */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800 }}>Community Workflow</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {WORKFLOW_STEPS.map(step => (
                            <div key={step.n} style={{ flex: '1 1 200px', display: 'flex', gap: '0.75rem' }}>
                                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-mint)', color: 'var(--peacock-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{step.n}</span>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.88rem' }}>{step.label}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{step.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* What Each Tab Helps You Do — static */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800 }}>What Each Tab Helps You Do</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                        {TAB_HELP.map(t => (
                            <div key={t.label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                    <span>{t.icon}</span>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>{t.label}</span>
                                </div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Community Info — real, unchanged from before */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 800 }}>Community Info</h3>
                    <p><strong>Description:</strong> {comm.description || 'N/A'}</p>
                    <p><strong>Guidelines:</strong> {comm.guidelines || 'N/A'}</p>
                    <p><strong>Owner:</strong> {comm.owner_name}</p>
                    <p><strong>Created:</strong> {new Date(comm.created_at).toLocaleString('en-IN')}</p>
                    <p><strong>Paid:</strong> {comm.is_paid ? `Yes (₹${comm.price})` : 'No'}</p>
                </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Community Status */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 800 }}>Community Status</h3>
                    <div style={{ marginBottom: '0.9rem' }}>
                        <span style={{
                            display: 'inline-block', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800,
                            background: status === 'Live' ? '#10B98118' : status === 'Archived' ? '#EF444418' : '#F59E0B18',
                            color: status === 'Live' ? '#10B981' : status === 'Archived' ? '#EF4444' : '#F59E0B',
                        }}>
                            {status}
                        </span>
                    </div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Change Status</label>
                    <select
                        value={status}
                        onChange={e => onStatusChange(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                    >
                        <option value="Live">Live</option>
                        <option value="Coming Soon">Coming Soon</option>
                        <option value="Hidden">Hidden</option>
                        <option value="Archived">Archived</option>
                    </select>
                    {/* Same onQuickStatus call the list page's Archive action and this
                        dropdown both use — no separate implementation. */}
                </div>

                {/* Quick Actions — only the two with a real existing destination */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 0.9rem', fontSize: '0.95rem', fontWeight: 800 }}>Quick Actions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <button onClick={() => setActiveTab('members')} style={{ padding: '0.6rem', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>
                            👥 Manage Members
                        </button>
                        <button onClick={() => setActiveTab('reports')} style={{ padding: '0.6rem', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left' }}>
                            🚩 View Reports
                        </button>
                    </div>
                </div>

                {/* Top Contributors — real, posts grouped by user_id */}
                <div style={cardStyle}>
                    <h3 style={{ margin: '0 0 0.9rem', fontSize: '0.95rem', fontWeight: 800 }}>Top Contributors</h3>
                    {loadingStats ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Loading...</p>
                    ) : topContributors.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No posts yet in this community.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {topContributors.map(c => (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, overflow: 'hidden', flexShrink: 0 }}>
                                        {c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (c.profile?.full_name?.[0] || '?')}
                                    </div>
                                    <span style={{ flex: 1, fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.profile?.full_name || 'Unknown'}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{c.count} post{c.count === 1 ? '' : 's'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div style={{ ...cardStyle, border: '1px solid #EF444430' }}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 800, color: '#EF4444' }}>Danger Zone</h3>
                    <button
                        onClick={() => onStatusChange('Archived')}
                        disabled={status === 'Archived'}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: 8, background: '#EF444415', border: '1px solid #EF444430', color: '#EF4444', fontWeight: 700, fontSize: '0.85rem', cursor: status === 'Archived' ? 'not-allowed' : 'pointer', opacity: status === 'Archived' ? 0.6 : 1 }}
                    >
                        {status === 'Archived' ? 'Already Archived' : '🗄️ Archive Community'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MembersTab({ comm, showToast }) {
    const [members, setMembers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // community_members.user_id has no FK to profiles (points to auth.users only) —
            // same two-step fetch-then-merge pattern as the user-facing MembersTab
            // (CommunityLanding.jsx) and the channel messages fix.
            const { data: memData, error: memErr } = await supabase
                .from('community_members')
                .select('user_id, role, joined_at')
                .eq('community_id', comm.id);
            if (memErr) throw memErr;

            if (!memData || memData.length === 0) {
                setMembers([]);
            } else {
                const userIds = [...new Set(memData.map(m => m.user_id))];
                const { data: profData, error: profErr } = await supabase
                    .from('profiles')
                    .select('id, full_name, username')
                    .in('id', userIds);
                if (profErr) console.warn('Error fetching member profiles:', profErr);

                const profilesMap = {};
                (profData || []).forEach(p => { profilesMap[p.id] = p; });

                setMembers(memData.map(m => ({
                    ...m,
                    profiles: profilesMap[m.user_id] || {}
                })));
            }

            // community_join_requests_user_id_fkey -> profiles is confirmed correct, left as-is
            const { data: reqData, error: reqErr } = await supabase
                .from('community_join_requests')
                .select('id, user_id, status, requested_at, profiles!community_join_requests_user_id_fkey(full_name, username)')
                .eq('community_id', comm.id)
                .eq('status', 'pending');
            if (reqErr) throw reqErr;
            setRequests(reqData || []);
        } catch (err) {
            showToast('Failed to load members: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [comm.id, showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleReqAction = async (id, status) => {
        try {
            const { error } = await supabase.from('community_join_requests').update({ status }).eq('id', id);
            if (error) throw error;
            if (status === 'approved') {
                const req = requests.find(r => r.id === id);
                await supabase.from('community_members').insert({ community_id: comm.id, user_id: req.user_id, role: 'member' });
            }
            showToast(`Request ${status}`);
            loadData();
        } catch (err) {
            showToast('Action failed: ' + err.message, 'error');
        }
    };

    const handleBan = async (user_id) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            await supabase.from('community_members').delete().eq('community_id', comm.id).eq('user_id', user_id);
            await supabase.from('community_bans').insert({ community_id: comm.id, user_id, reason: 'Admin Ban', banned_by: session?.user?.id });
            showToast('User banned');
            loadData();
        } catch (err) {
            showToast('Ban failed: ' + err.message, 'error');
        }
    };

    const handleRole = async (user_id, role) => {
        try {
            await supabase.from('community_members').update({ role }).eq('community_id', comm.id).eq('user_id', user_id);
            showToast('Role updated');
            loadData();
        } catch (err) {
            showToast('Role update failed: ' + err.message, 'error');
        }
    };

    return (
        <div>
            {requests.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800 }}>Pending Requests</h3>
                    <DataTable
                        columns={[
                            { key: 'name', label: 'User', render: (_, r) => `${r.profiles?.full_name} (@${r.profiles?.username})` },
                            { key: 'requested_at', label: 'Requested', render: v => new Date(v).toLocaleDateString() }
                        ]}
                        rows={requests} loading={false}
                        actions={(r) => (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => handleReqAction(r.id, 'approved')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Approve</button>
                                <button onClick={() => handleReqAction(r.id, 'rejected')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Reject</button>
                            </div>
                        )}
                    />
                </div>
            )}

            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800 }}>Members</h3>
            <DataTable
                columns={[
                    { key: 'name', label: 'User', render: (_, r) => `${r.profiles?.full_name} (@${r.profiles?.username})` },
                    { key: 'role', label: 'Role', render: v => <span style={{ fontWeight: 700, color: v === 'admin' ? 'var(--peacock-green)' : (v === 'moderator' ? '#3B82F6' : 'inherit') }}>{v}</span> },
                    { key: 'joined_at', label: 'Joined', render: v => new Date(v).toLocaleDateString() }
                ]}
                rows={members} loading={loading}
                actions={(r) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {r.role !== 'admin' && (
                            <>
                                {r.role === 'member' ? (
                                    <button onClick={() => handleRole(r.user_id, 'moderator')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630', cursor: 'pointer' }}>Make Mod</button>
                                ) : (
                                    <button onClick={() => handleRole(r.user_id, 'member')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Remove Mod</button>
                                )}
                                <button onClick={() => handleBan(r.user_id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Ban</button>
                            </>
                        )}
                    </div>
                )}
            />
        </div>
    );
}

function PostsTab({ comm, showToast }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('id, content, is_featured, created_at, profiles!fk_posts_profiles(full_name)')
                .eq('community_id', comm.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            showToast('Failed to load posts: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [comm.id, showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const togglePin = async (id, current) => {
        try {
            const { error } = await supabase.from('posts').update({ is_featured: !current }).eq('id', id);
            if (error) throw error;
            showToast(current ? 'Post unpinned' : 'Post pinned');
            loadData();
        } catch(e) { showToast('Action failed', 'error'); }
    };

    const deletePost = async (id) => {
        try {
            const { error } = await supabase.from('posts').delete().eq('id', id);
            if (error) throw error;
            showToast('Post deleted');
            loadData();
        } catch(e) { showToast('Delete failed', 'error'); }
    };

    return (
        <DataTable
            columns={[
                { key: 'content', label: 'Snippet', render: v => v?.substring(0, 60) + '...' },
                { key: 'author', label: 'Author', render: (_, r) => r.profiles?.full_name },
                { key: 'is_featured', label: 'Pinned', render: v => v ? '📌 Yes' : 'No' },
                { key: 'created_at', label: 'Date', render: v => new Date(v).toLocaleDateString() }
            ]}
            rows={posts} loading={loading}
            actions={(r) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => togglePin(r.id, r.is_featured)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630', cursor: 'pointer' }}>{r.is_featured ? 'Unpin' : 'Pin'}</button>
                    <button onClick={() => deletePost(r.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Delete</button>
                </div>
            )}
        />
    );
}

// Delete-only, matching the existing real capability: community_channels
// already has a real created_by column, and CommunityLanding.jsx's own
// delete icon already calls the real delete_channel RPC, which (per its
// existing code comment) enforces "caller is the channel's creator or an
// admin" server-side. This tab reuses that same RPC — no new one needed.
// Every viewer of this page is already a confirmed platform admin (gated
// by AdminShell's own is_admin() check), so every row gets a Delete
// action — no per-row creator/admin branching needed here, unlike the
// community-facing UI where a regular member might view their own list.
function ChannelsTab({ comm, showToast }) {
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: chRows, error: chErr } = await supabase
                .from('community_channels')
                .select('id, name, description, created_by, created_at, conversation_id')
                .eq('community_id', comm.id)
                .order('created_at', { ascending: false });
            if (chErr) throw chErr;

            const creatorIds = [...new Set((chRows || []).map(c => c.created_by).filter(Boolean))];
            const { data: profiles } = creatorIds.length
                ? await supabase.from('profiles').select('id, full_name, username').in('id', creatorIds)
                : { data: [] };
            const profileById = Object.fromEntries((profiles || []).map(p => [p.id, p]));

            // Message counts — one batched query across all this community's channel
            // conversation_ids, tallied client-side, instead of one query per row.
            const convIds = (chRows || []).map(c => c.conversation_id).filter(Boolean);
            const { data: msgRows } = convIds.length
                ? await supabase.from('messages').select('conversation_id').in('conversation_id', convIds)
                : { data: [] };
            const msgCountByConv = {};
            (msgRows || []).forEach(m => { msgCountByConv[m.conversation_id] = (msgCountByConv[m.conversation_id] || 0) + 1; });

            setChannels((chRows || []).map(c => ({
                ...c,
                creator: c.created_by ? (profileById[c.created_by] || null) : null,
                messageCount: c.conversation_id ? (msgCountByConv[c.conversation_id] || 0) : 0,
            })));
        } catch (err) {
            showToast('Failed to load channels: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [comm.id, showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const deleteChannel = async (channel) => {
        if (!window.confirm(`Delete #${channel.name}? This cannot be undone.`)) return;
        setDeletingId(channel.id);
        try {
            const { data: ok, error } = await supabase.rpc('delete_channel', { p_channel_id: channel.id });
            if (error) throw error;
            // delete_channel returns a boolean rather than throwing on a denied delete.
            // Re-verified against a channel matching the REAL pre-seeded shape (real
            // conversation_id, created_by manually nulled after — not a channel with
            // both fields null, which the RPC's early-return treats as "doesn't
            // exist"): admins CAN delete created_by:null channels. A `false` return
            // here means something else — most likely a stale row already removed
            // elsewhere, or a channel missing its conversation_id entirely (which
            // shouldn't happen for a real channel created through the normal flow).
            // Still checking the return value, not just the absence of an error, so
            // that case doesn't show a false "deleted" toast.
            if (!ok) {
                showToast('Delete was not permitted for this channel — it may already be removed, or is missing its linked conversation.', 'error');
                return;
            }
            showToast('Channel deleted');
            setChannels(prev => prev.filter(c => c.id !== channel.id)); // remove locally, no reload
        } catch (err) {
            showToast('Delete failed: ' + err.message, 'error');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <DataTable
            columns={[
                { key: 'name', label: 'Channel', render: v => '#' + v },
                { key: 'creator', label: 'Created By', render: v => v ? (v.full_name || v.username) : '— (pre-seeded)' },
                { key: 'messageCount', label: 'Messages' },
                { key: 'created_at', label: 'Created', render: v => new Date(v).toLocaleDateString() },
            ]}
            rows={channels} loading={loading}
            actions={(r) => (
                <button
                    onClick={() => deleteChannel(r)}
                    disabled={deletingId === r.id}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: deletingId === r.id ? 'not-allowed' : 'pointer', opacity: deletingId === r.id ? 0.6 : 1 }}
                >
                    {deletingId === r.id ? 'Deleting...' : 'Delete'}
                </button>
            )}
        />
    );
}

function EventsTab({ comm }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            const { data } = await supabase.from('events').select('*').eq('community_id', comm.id).order('created_at', { ascending: false });
            setEvents(data || []);
            setLoading(false);
        };
        fetchEvents();
    }, [comm.id]);

    return (
        <DataTable
            columns={[
                { key: 'title', label: 'Title' },
                { key: 'event_date', label: 'Date', render: v => v ? new Date(v).toLocaleString() : 'TBA' },
                { key: 'status', label: 'Status' }
            ]}
            rows={events} loading={loading}
            emptyMessage="No events linked to this community."
        />
    );
}

function ResourcesTab({ comm, showToast }) {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('community_resources')
                .select('*, profiles!community_resources_uploaded_by_fkey(full_name)')
                .eq('community_id', comm.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setResources(data || []);
        } catch (err) {
            showToast('Failed to load resources: ' + err.message, 'error');
            console.warn(err);
        } finally {
            setLoading(false);
        }
    }, [comm.id, showToast]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (f) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const { error } = await supabase.from('community_resources').insert({
                community_id: comm.id, title: f.title, resource_type: f.resource_type, url: f.url, uploaded_by: session?.user?.id
            });
            if (error) throw error;
            showToast('Resource added');
            setModal({ open: false });
            loadData();
        } catch(e) { showToast('Add failed: ' + e.message, 'error'); }
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase.from('community_resources').delete().eq('id', id);
            if (error) throw error;
            showToast('Resource deleted');
            loadData();
        } catch(e) { showToast('Delete failed', 'error'); }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={() => setModal({ open: true })} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Add Resource</button>
            </div>
            <DataTable
                columns={[
                    { key: 'title', label: 'Title' },
                    { key: 'resource_type', label: 'Type' },
                    { key: 'url', label: 'URL', render: v => <a href={v} target="_blank" rel="noreferrer" style={{ color: 'var(--peacock-green)' }}>Link</a> },
                    { key: 'uploaded_by', label: 'Uploaded By', render: (_, r) => r.profiles?.full_name }
                ]}
                rows={resources} loading={loading}
                emptyMessage="No resources found."
                actions={(r) => <button onClick={() => handleDelete(r.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Delete</button>}
            />
            {modal.open && (
                <FormModal
                    title="Add Resource"
                    fields={[
                        { name: 'title', label: 'Title *', type: 'text', required: true },
                        { name: 'resource_type', label: 'Type', type: 'select', options: ['pdf', 'drive_link', 'external_url'] },
                        { name: 'url', label: 'URL *', type: 'text', required: true }
                    ]}
                    initialValues={{ resource_type: 'external_url' }}
                    onSubmit={handleSave} onClose={() => setModal({ open: false })}
                />
            )}
        </div>
    );
}

function AnalyticsTab() {
    return (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 16, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📈</span>
            <p>Advanced Analytics charts (Member Growth, Engagement) will be visualized here.</p>
            <p style={{ fontSize: '0.85rem' }}>Data is ready via standard aggregations on `community_members` and `posts` tables.</p>
        </div>
    );
}

function ReportsTab({ comm, showToast }) {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports_moderation')
                .select('*, posts!inner(id, content, community_id), reporter:profiles!reports_moderation_reporter_id_fkey(full_name)')
                .eq('posts.community_id', comm.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setReports(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [comm.id]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleDismiss = async (id) => {
        await supabase.from('reports_moderation').update({ status: 'Dismissed', resolved_at: new Date() }).eq('id', id);
        showToast('Report dismissed');
        loadData();
    };

    const handleDeletePost = async (report) => {
        await supabase.from('posts').delete().eq('id', report.post_id);
        await supabase.from('reports_moderation').update({ status: 'Resolved', resolved_at: new Date() }).eq('id', report.id);
        showToast('Post deleted & report resolved');
        loadData();
    };

    return (
        <DataTable
            columns={[
                { key: 'reason', label: 'Reason', render: (v) => typeof v === 'object' ? JSON.stringify(v) : (v || '') },
                { key: 'post_content', label: 'Post Snippet', render: (_, r) => r.posts?.content?.substring(0, 40) + '...' },
                { key: 'reporter', label: 'Reporter', render: (_, r) => r.reporter?.full_name },
                { key: 'status', label: 'Status', render: v => <span style={{ fontWeight: 700, color: v === 'Pending' ? '#F59E0B' : 'inherit' }}>{v}</span> }
            ]}
            rows={reports} loading={loading}
            actions={(r) => r.status === 'Pending' && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleDismiss(r.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Dismiss</button>
                    <button onClick={() => handleDeletePost(r)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Delete Post</button>
                </div>
            )}
        />
    );
}

function SettingsTab({ comm, showToast }) {
    const [saving, setSaving] = useState(false);

    const handleSave = async (formData) => {
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                category: formData.category,
                guidelines: formData.guidelines,
                is_paid: formData.is_paid || false,
                price: formData.price || 0,
                status: formData.status || 'Live',
                emoji: formData.emoji || '🏘️'
            };

            const { error } = await supabase.from('communities').update(payload).eq('id', comm.id);
            if (error) throw error;
            showToast('Settings updated. Refreshing...');
            window.location.reload(); // Simple way to refresh data in parent
        } catch (err) {
            showToast('Update failed: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, padding: '1rem 0' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.25rem', fontWeight: 800 }}>Community Settings</h3>
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                {/* Reusing FormModal conceptually, but rendering fields inline if we wanted. Since FormModal is a modal, let's just render a button to open it or build a simple form here. For simplicity and consistency, let's trigger the same FormModal but just specifically for edit. But wait, since it's a Settings tab, a real form is better. I will build a lightweight custom form. */}
                <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); handleSave(Object.fromEntries(fd.entries())); }}>
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Name *</label>
                            <input name="name" defaultValue={comm.name} required style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Slug</label>
                            <input name="slug" defaultValue={comm.slug} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Emoji</label>
                            <input name="emoji" defaultValue={comm.emoji} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Category</label>
                            <input name="category" defaultValue={comm.category} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Status</label>
                            <select name="status" defaultValue={comm.status} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                <option value="Live">Live</option>
                                <option value="Coming Soon">Coming Soon</option>
                                <option value="Hidden">Hidden</option>
                                <option value="Archived">Archived</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" name="is_paid" id="is_paid" defaultChecked={comm.is_paid} />
                            <label htmlFor="is_paid" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Is Paid Community?</label>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Price (if paid)</label>
                            <input name="price" type="number" defaultValue={comm.price || 0} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Description</label>
                            <textarea name="description" defaultValue={comm.description} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', minHeight: 80 }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>Guidelines</label>
                            <textarea name="guidelines" defaultValue={comm.guidelines} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', minHeight: 80 }} />
                        </div>
                    </div>
                    <button type="submit" disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </form>
            </div>
        </div>
    );
}
