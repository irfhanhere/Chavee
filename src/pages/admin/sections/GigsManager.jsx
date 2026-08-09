import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
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

export default function GigsManager() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [tags, setTags] = useState([]);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    
    // Stats
    const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, reported: 0 });

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    // Actions & Modals
    const [actionDialog, setActionDialog] = useState({ open: false, row: null, actionName: '', requireReason: false });
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    
    const [catModalOpen, setCatModalOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Gigs
            const { data: gigsData, error: gigsErr } = await supabase.from('gigs').select('*').order('created_at', { ascending: false });
            if (gigsErr) throw gigsErr;

            // Fetch Categories
            const { data: catsData } = await supabase.from('gig_categories').select('*');
            setCategories(catsData || []);

            // Fetch Profiles
            const userIds = [...new Set((gigsData || []).map(g => g.posted_by).filter(Boolean))];
            let profilesMap = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase.from('public_profiles').select('id, full_name, username, avatar_url').in('id', userIds);
                if (profiles) profiles.forEach(p => profilesMap[p.id] = p);
            }

            // Fetch Proposals Count
            let proposalsMap = {};
            const { data: appsData } = await supabase.from('gig_applications').select('gig_id');
            if (appsData) {
                appsData.forEach(a => proposalsMap[a.gig_id] = (proposalsMap[a.gig_id] || 0) + 1);
            }

            // Fetch Reported Status
            let reportedSet = new Set();
            const { data: reportsData } = await supabase.from('reports_moderation').select('gig_id').eq('status', 'Pending').not('gig_id', 'is', null);
            if (reportsData) reportsData.forEach(r => reportedSet.add(r.gig_id));

            const enriched = (gigsData || []).map(g => ({
                ...g,
                profile: profilesMap[g.posted_by] || null,
                category_name: (catsData || []).find(c => c.id === g.category_id)?.name || 'Uncategorized',
                proposals_count: proposalsMap[g.id] || 0,
                is_reported: reportedSet.has(g.id)
            }));
            
            setRows(enriched);
            
            setStats({
                total: enriched.length,
                pending: enriched.filter(g => !g.verified).length,
                active: enriched.filter(g => g.verified && g.status === 'active' && !g.admin_hidden).length,
                reported: reportedSet.size
            });

        } catch (err) {
            console.error(err);
            showToast('Failed to load data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Handle Moderation Action
    const performAction = async () => {
        if (!actionDialog.row) return;
        setProcessing(true);
        try {
            const { error } = await supabase.rpc('admin_moderate_gig', {
                p_gig_id: actionDialog.row.id,
                p_action: actionDialog.actionName,
                p_reason: reason || null
            });
            if (error) throw error;
            
            showToast(`Successfully performed: ${actionDialog.actionName}`);
            setActionDialog({ open: false, row: null, actionName: '', requireReason: false });
            setReason('');
            loadData(); // Refresh list to reflect changes safely
        } catch (err) {
            showToast('Action failed: ' + err.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const confirmAction = (row, actionName, requireReason = false) => {
        setActionDialog({ open: true, row, actionName, requireReason });
        setReason('');
    };

    // Derived filtering
    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            if (categoryFilter !== 'all' && r.category_id !== categoryFilter) return false;
            
            if (statusFilter === 'pending') return !r.verified;
            if (statusFilter === 'verified') return !!r.verified;
            if (statusFilter === 'featured') return !!r.featured;
            if (statusFilter === 'hidden') return !!r.admin_hidden;
            if (statusFilter === 'reported') return r.is_reported;
            return true;
        });
    }, [rows, statusFilter, categoryFilter]);

    const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString('en-IN')}` : '';

    const columns = [
        {
            key: 'title', label: 'Gig Title', sortable: true,
            render: (v, row) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v || '—'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {row.is_reported && <span style={{ color: '#EF4444', fontWeight: 700, marginRight: '0.5rem' }}>🚩 Reported</span>}
                        {row.featured && <span style={{ color: '#F59E0B', fontWeight: 700, marginRight: '0.5rem' }}>⭐ Featured</span>}
                        {row.admin_hidden && <span style={{ color: '#6B7280', fontWeight: 700 }}>👁 Hidden</span>}
                    </span>
                </div>
            )
        },
        {
            key: 'posted_by', label: 'Posted By', sortable: true,
            render: (_, row) => {
                const name = row.profile?.full_name || row.profile?.username || 'Unknown User';
                const avatar = row.profile?.avatar_url;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {avatar ? (
                            <img src={avatar} alt="Avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                        ) : (
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800 }}>
                                {name[0].toUpperCase()}
                            </div>
                        )}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{name}</span>
                    </div>
                );
            }
        },
        { key: 'category_name', label: 'Category', sortable: true, render: v => <span style={{ fontSize: '0.8rem' }}>{v}</span> },
        { 
            key: 'budget', label: 'Budget Range', sortable: false,
            render: (_, row) => (
                <span style={{ fontWeight: 600, color: 'var(--emerald)', fontSize: '0.82rem' }}>
                    {row.budget_min || row.budget_max ? `${formatCurrency(row.budget_min)} - ${formatCurrency(row.budget_max)}` : 'Negotiable'}
                </span>
            )
        },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v) => (
                <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: v === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
                    color: v === 'active' ? '#10B981' : 'var(--text-muted)'
                }}>
                    {v === 'active' ? '● Active' : '○ ' + v}
                </span>
            )
        },
        {
            key: 'verified', label: 'Verification', sortable: true,
            render: (v) => (
                <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: v ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: v ? '#10B981' : '#F59E0B'
                }}>
                    {v ? '🟢 Verified' : '⏳ Pending'}
                </span>
            )
        },
        { key: 'views', label: 'Views', sortable: true, render: v => <span style={{ fontSize: '0.8rem' }}>👁 {v || 0}</span> },
        { key: 'proposals_count', label: 'Proposals', sortable: true, render: v => <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>📝 {v}</span> },
        {
            key: 'created_at', label: 'Posted', sortable: true,
            render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—',
        },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>🔧 Gigs Management</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verify, moderate, and manage student gigs.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={loadData}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
                        ↻ Refresh
                    </button>
                    <button 
                        onClick={() => setCatModalOpen(true)}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                        Manage Categories
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <StatCard title="Total Gigs" count={stats.total} icon="💼" color="#3B82F6" loading={loading} />
                <StatCard title="Pending Verify" count={stats.pending} icon="⏳" color="#F59E0B" loading={loading} />
                <StatCard title="Active Gigs" count={stats.active} icon="⚡" color="#10B981" loading={loading} />
                <StatCard title="Reported" count={stats.reported} icon="🚩" color="#EF4444" loading={loading} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)' }}
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending Verification</option>
                    <option value="verified">Verified</option>
                    <option value="featured">Featured</option>
                    <option value="hidden">Hidden</option>
                    <option value="reported">Reported</option>
                </select>
                
                <select 
                    value={categoryFilter} 
                    onChange={e => setCategoryFilter(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)' }}
                >
                    <option value="all">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    loading={loading}
                    emptyMessage="No gigs found matching criteria."
                    searchKeys={['title']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            {!row.verified ? (
                                <button onClick={() => confirmAction(row, 'verify')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Verify</button>
                            ) : (
                                <button onClick={() => confirmAction(row, 'reject')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30', cursor: 'pointer' }}>Reject</button>
                            )}
                            
                            {row.status !== 'suspended' ? (
                                <button onClick={() => confirmAction(row, 'suspend', true)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Suspend</button>
                            ) : (
                                <button onClick={() => confirmAction(row, 'unsuspend')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Unsuspend</button>
                            )}

                            {!row.featured ? (
                                <button onClick={() => confirmAction(row, 'feature')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630', cursor: 'pointer' }}>Feature</button>
                            ) : (
                                <button onClick={() => confirmAction(row, 'unfeature')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Unfeature</button>
                            )}

                            {!row.admin_hidden ? (
                                <button onClick={() => confirmAction(row, 'hide', true)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Hide</button>
                            ) : (
                                <button onClick={() => confirmAction(row, 'unhide')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Unhide</button>
                            )}
                        </div>
                    )}
                />
            </div>

            {/* Confirmation Dialog with optional Reason input */}
            {actionDialog.open && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, maxWidth: 400, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>Confirm Action</h3>
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)' }}>
                            Are you sure you want to <strong>{actionDialog.actionName}</strong> "{actionDialog.row?.title}"?
                        </p>
                        
                        {actionDialog.requireReason && (
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Reason (Optional)</label>
                                <textarea 
                                    value={reason} 
                                    onChange={e => setReason(e.target.value)} 
                                    placeholder="Enter reason for moderation log..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-base)', minHeight: 80, fontFamily: 'inherit' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setActionDialog({ open: false, row: null, actionName: '', requireReason: false })}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                Cancel
                            </button>
                            <button 
                                onClick={performAction}
                                disabled={processing}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer' }}>
                                {processing ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Extremely simple Category Manager Modal for MVP */}
            {catModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, maxWidth: 500, width: '100%', boxShadow: 'var(--shadow-lg)', maxHeight: '80vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Gig Categories</h3>
                            <button onClick={() => setCatModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {categories.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No categories found.</p> : categories.map(c => (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{c.slug}</span>
                                </div>
                            ))}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>* Full CRUD is accessible via direct table edits for now until a dedicated UI is requested.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
