import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';

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

export default function ReportsManager() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    
    // Stats
    const [stats, setStats] = useState({ total: 0, pending: 0, inReview: 0, resolved: 0 });

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    // Actions Dialog
    const [actionDialog, setActionDialog] = useState({ open: false, row: null, actionName: '' });
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    
    // Expanded Row
    const [expandedId, setExpandedId] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Reports
            const { data: reportsData, error: reportsErr } = await supabase
                .from('reports_moderation')
                .select('*')
                .order('created_at', { ascending: false });
                
            if (reportsErr) throw reportsErr;

            if (!reportsData || reportsData.length === 0) {
                setRows([]);
                setStats({ total: 0, pending: 0, inReview: 0, resolved: 0 });
                setLoading(false);
                return;
            }

            // Collect IDs
            const userIds = new Set();
            const postIds = new Set();
            const gigIds = new Set();
            const jobIds = new Set();
            const messageIds = new Set();

            reportsData.forEach(r => {
                if (r.reporter_id) userIds.add(r.reporter_id);
                if (r.reported_user_id) userIds.add(r.reported_user_id);
                if (r.resolved_by) userIds.add(r.resolved_by);
                
                if (r.post_id) postIds.add(r.post_id);
                if (r.gig_id) gigIds.add(r.gig_id);
                if (r.job_id) jobIds.add(r.job_id);
                if (r.message_id) messageIds.add(r.message_id);
            });

            // Fetch Profiles
            let profilesMap = {};
            if (userIds.size > 0) {
                const { data: profiles } = await supabase.from('public_profiles').select('id, full_name, username, avatar_url').in('id', [...userIds]);
                if (profiles) profiles.forEach(p => profilesMap[p.id] = p);
            }

            // Fetch Content
            let postsMap = {};
            if (postIds.size > 0) {
                const { data: posts } = await supabase.from('posts').select('id, content, hidden_by_admin').in('id', [...postIds]);
                if (posts) posts.forEach(p => postsMap[p.id] = p);
            }
            let gigsMap = {};
            if (gigIds.size > 0) {
                const { data: gigs } = await supabase.from('gigs').select('id, title, admin_hidden').in('id', [...gigIds]);
                if (gigs) gigs.forEach(g => gigsMap[g.id] = g);
            }
            let jobsMap = {};
            if (jobIds.size > 0) {
                const { data: jobs } = await supabase.from('jobs').select('id, title, admin_hidden').in('id', [...jobIds]);
                if (jobs) jobs.forEach(j => jobsMap[j.id] = j);
            }
            let messagesMap = {};
            if (messageIds.size > 0) {
                const { data: msgs } = await supabase.from('messages').select('id, content').in('id', [...messageIds]);
                if (msgs) msgs.forEach(m => messagesMap[m.id] = m);
            }

            const enriched = reportsData.map(r => {
                let type = 'User';
                let preview = 'User Profile';
                let isHidden = false;
                let fullContent = '';
                
                if (r.post_id) {
                    type = 'Post';
                    preview = postsMap[r.post_id]?.content || 'Post deleted';
                    fullContent = preview;
                    isHidden = postsMap[r.post_id]?.hidden_by_admin || false;
                } else if (r.gig_id) {
                    type = 'Gig';
                    preview = gigsMap[r.gig_id]?.title || 'Gig deleted';
                    fullContent = preview;
                    isHidden = gigsMap[r.gig_id]?.admin_hidden || false;
                } else if (r.job_id) {
                    type = 'Job';
                    preview = jobsMap[r.job_id]?.title || 'Job deleted';
                    fullContent = preview;
                    isHidden = jobsMap[r.job_id]?.admin_hidden || false;
                } else if (r.message_id) {
                    type = 'Message';
                    preview = messagesMap[r.message_id]?.content || 'Message deleted';
                    fullContent = preview;
                } else {
                    const reportedUser = profilesMap[r.reported_user_id];
                    preview = reportedUser ? `User: ${reportedUser.full_name} (@${reportedUser.username})` : 'Unknown User';
                    fullContent = preview;
                }

                return {
                    ...r,
                    type,
                    preview,
                    fullContent,
                    isHidden,
                    reporter: profilesMap[r.reporter_id] || null,
                    reportedUser: profilesMap[r.reported_user_id] || null,
                    resolver: r.resolved_by ? profilesMap[r.resolved_by] : null
                };
            });
            
            setRows(enriched);
            
            setStats({
                total: enriched.length,
                pending: enriched.filter(r => r.status === 'Pending').length,
                inReview: enriched.filter(r => r.status === 'In Review').length,
                resolved: enriched.filter(r => r.status === 'Resolved' || r.status === 'Dismissed').length
            });

        } catch (err) {
            console.error(err);
            showToast('Failed to load data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleUpdateStatus = async (rowId, newStatus, resolutionNotes = null) => {
        try {
            const { error } = await supabase.rpc('admin_update_report_status', {
                p_report_id: rowId,
                p_status: newStatus,
                p_notes: resolutionNotes
            });
            if (error) throw error;
            showToast(`Report marked as ${newStatus}`);
            loadData();
        } catch (err) {
            showToast('Failed to update status: ' + err.message, 'error');
        }
    };

    const handleToggleVisibility = async (row, hide) => {
        try {
            const { error } = await supabase.rpc('admin_toggle_report_content', {
                p_report_id: row.id,
                p_hide: hide
            });
            if (error) throw error;
            showToast(hide ? 'Content hidden successfully' : 'Content unhidden successfully');
            loadData();
        } catch (err) {
            showToast('Failed to toggle content: ' + err.message, 'error');
        }
    };

    const confirmStatusAction = (row, actionName) => {
        setActionDialog({ open: true, row, actionName });
        setNotes(row.resolution_notes || '');
    };

    const submitStatusAction = async () => {
        setProcessing(true);
        await handleUpdateStatus(actionDialog.row.id, actionDialog.actionName, notes || null);
        setActionDialog({ open: false, row: null, actionName: '' });
        setProcessing(false);
    };

    // Derived filtering
    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (typeFilter !== 'all' && r.type.toLowerCase() !== typeFilter.toLowerCase()) return false;
            return true;
        });
    }, [rows, statusFilter, typeFilter]);

    const truncate = (str, n) => (str && str.length > n) ? str.substr(0, n - 1) + '...' : str;

    const columns = [
        {
            key: 'reason', label: 'Report Reason', sortable: true,
            render: (v) => <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{typeof v === 'object' ? JSON.stringify(v) : (v || 'No reason provided')}</span>
        },
        {
            key: 'type', label: 'Type', sortable: true,
            render: (v) => (
                <span style={{
                    padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)'
                }}>
                    {v}
                </span>
            )
        },
        { 
            key: 'preview', label: 'Content Preview', sortable: false,
            render: (v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{truncate(v, 40)}</span>
                    {row.isHidden && <span style={{ padding: '0.1rem 0.3rem', fontSize: '0.65rem', background: '#EF444415', color: '#EF4444', borderRadius: 4, fontWeight: 700 }}>Hidden</span>}
                </div>
            )
        },
        {
            key: 'reporter', label: 'Reporter', sortable: true,
            render: (v) => {
                const name = v?.full_name || v?.username || 'Unknown User';
                const avatar = v?.avatar_url;
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
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v) => {
                const colors = {
                    'Pending': '#EF4444',
                    'In Review': '#F59E0B',
                    'Resolved': '#10B981',
                    'Dismissed': '#6B7280'
                };
                const color = colors[v] || '#6B7280';
                return (
                    <span style={{
                        padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                        background: `${color}15`, color
                    }}>
                        {v}
                    </span>
                );
            }
        },
        {
            key: 'created_at', label: 'Date', sortable: true,
            render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—',
        }
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>🛡️ Reports & Moderation</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage flagged content and user reports.</p>
                </div>
                <button 
                    onClick={loadData}
                    style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
                    ↻ Refresh
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <StatCard title="Total Reports" count={stats.total} icon="📋" color="#3B82F6" loading={loading} />
                <StatCard title="Pending" count={stats.pending} icon="⏳" color="#EF4444" loading={loading} />
                <StatCard title="In Review" count={stats.inReview} icon="👁" color="#F59E0B" loading={loading} />
                <StatCard title="Resolved" count={stats.resolved} icon="✅" color="#10B981" loading={loading} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <select 
                    value={statusFilter} 
                    onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)' }}
                >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Review">In Review</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Dismissed">Dismissed</option>
                </select>
                
                <select 
                    value={typeFilter} 
                    onChange={e => setTypeFilter(e.target.value)}
                    style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)' }}
                >
                    <option value="all">All Content Types</option>
                    <option value="post">Posts</option>
                    <option value="gig">Gigs</option>
                    <option value="job">Jobs</option>
                    <option value="message">Messages</option>
                    <option value="user">Users</option>
                </select>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    loading={loading}
                    emptyMessage="No reports found."
                    searchKeys={['reason']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button 
                                onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                            >
                                {expandedId === row.id ? 'Close Details' : 'View Details'}
                            </button>
                            
                            {row.status === 'Pending' && (
                                <button onClick={() => handleUpdateStatus(row.id, 'In Review')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#F59E0B15', color: '#F59E0B', border: '1px solid #F59E0B30', cursor: 'pointer' }}>Mark In Review</button>
                            )}

                            {['post', 'gig', 'job'].includes(row.type.toLowerCase()) && (
                                !row.isHidden ? (
                                    <button onClick={() => handleToggleVisibility(row, true)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Hide Content</button>
                                ) : (
                                    <button onClick={() => handleToggleVisibility(row, false)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Unhide Content</button>
                                )
                            )}

                            {(row.status === 'Pending' || row.status === 'In Review') && (
                                <>
                                    <button onClick={() => confirmStatusAction(row, 'Resolved')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Resolve</button>
                                    <button onClick={() => confirmStatusAction(row, 'Dismissed')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Dismiss</button>
                                </>
                            )}
                        </div>
                    )}
                />
            </div>

            {/* Expanded Row Details */}
            {expandedId && (
                (() => {
                    const expandedReport = rows.find(r => r.id === expandedId);
                    if (!expandedReport) return null;
                    return (
                        <div style={{ marginTop: '1rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', animation: 'fadeInUp 0.2s ease-out' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Report Details</h3>
                                <button onClick={() => setExpandedId(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reporter</p>
                                    <p style={{ margin: 0, fontWeight: 600 }}>{expandedReport.reporter?.full_name || 'Unknown'}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{expandedReport.reporter?.username || 'unknown'}</p>
                                </div>
                                
                                {expandedReport.reportedUser && (
                                    <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reported User</p>
                                        <p style={{ margin: 0, fontWeight: 600 }}>{expandedReport.reportedUser.full_name}</p>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{expandedReport.reportedUser.username}</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full Content ({expandedReport.type})</p>
                                <div style={{ padding: '1rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                    {expandedReport.fullContent || 'No content available.'}
                                </div>
                            </div>
                            
                            {(expandedReport.status === 'Resolved' || expandedReport.status === 'Dismissed') && (
                                <div style={{ padding: '1rem', background: 'var(--bg-mint)', borderRadius: 8, border: '1px solid var(--border-mint)' }}>
                                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--peacock-green)', textTransform: 'uppercase' }}>Resolution Notes</p>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{expandedReport.resolution_notes || 'No notes provided.'}</p>
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        Resolved by {expandedReport.resolver?.full_name || 'Admin'} on {expandedReport.resolved_at ? new Date(expandedReport.resolved_at).toLocaleString() : 'Unknown date'}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })()
            )}

            {/* Action Confirmation Modal with Notes */}
            {actionDialog.open && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, maxWidth: 450, width: '100%', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 800 }}>Confirm: {actionDialog.actionName}</h3>
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            You are about to mark this report as <strong>{actionDialog.actionName}</strong>. 
                        </p>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Resolution Notes (Optional)</label>
                            <textarea 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                placeholder="Enter any notes regarding this decision..."
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-base)', minHeight: 100, fontFamily: 'inherit', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => setActionDialog({ open: false, row: null, actionName: '' })}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                Cancel
                            </button>
                            <button 
                                onClick={submitStatusAction}
                                disabled={processing}
                                style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer' }}>
                                {processing ? 'Processing...' : `Mark ${actionDialog.actionName}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
