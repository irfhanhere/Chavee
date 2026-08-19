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

// Real values, matching the live CHECK constraints exactly.
const STATUS_META = {
    new: { label: 'New', color: '#3B82F6' },
    in_review: { label: 'In Review', color: '#F59E0B' },
    waiting_for_user: { label: 'Waiting for User', color: '#8B5CF6' },
    resolved: { label: 'Resolved', color: '#10B981' },
    closed: { label: 'Closed', color: '#6B7280' },
};
const CATEGORY_META = {
    account_issue: 'Account Issue',
    technical_problem: 'Technical Problem',
    user_behaviour: 'User Behaviour',
    community_issue: 'Community Issue',
    job_listing: 'Job Listing',
    gig_transaction: 'Gig / Transaction',
    payment: 'Payment',
    content_violation: 'Content Violation',
    privacy_concern: 'Privacy Concern',
    security_concern: 'Security Concern',
    other: 'Other',
};

export default function SupportTicketsManager() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [detail, setDetail] = useState(null);
    const [savingReply, setSavingReply] = useState(false);
    const [replyDraft, setReplyDraft] = useState('');

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*, profiles(full_name, username)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setRows(data || []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load tickets: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const stats = useMemo(() => ({
        total: rows.length,
        new: rows.filter(r => r.status === 'new').length,
        inReview: rows.filter(r => r.status === 'in_review').length,
        waiting: rows.filter(r => r.status === 'waiting_for_user').length,
        resolved: rows.filter(r => r.status === 'resolved').length,
    }), [rows]);

    const filteredRows = useMemo(() => {
        return rows.filter(r => {
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
            return true;
        });
    }, [rows, statusFilter, categoryFilter]);

    const handleStatusChange = async (ticket, newStatus) => {
        try {
            const { error } = await supabase.from('support_tickets').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', ticket.id);
            if (error) throw error;
            setRows(prev => prev.map(r => r.id === ticket.id ? { ...r, status: newStatus } : r));
            if (detail?.id === ticket.id) setDetail(prev => ({ ...prev, status: newStatus }));
            showToast(`${ticket.ticket_id} marked ${STATUS_META[newStatus]?.label || newStatus}`);
        } catch (err) {
            showToast('Failed to update status: ' + err.message, 'error');
        }
    };

    const handleSaveReply = async () => {
        setSavingReply(true);
        try {
            const { error } = await supabase.from('support_tickets').update({ admin_reply: replyDraft.trim(), updated_at: new Date().toISOString() }).eq('id', detail.id);
            if (error) throw error;
            setRows(prev => prev.map(r => r.id === detail.id ? { ...r, admin_reply: replyDraft.trim() } : r));
            setDetail(prev => ({ ...prev, admin_reply: replyDraft.trim() }));
            showToast('Reply saved.');
        } catch (err) {
            showToast('Failed to save reply: ' + err.message, 'error');
        } finally {
            setSavingReply(false);
        }
    };

    const openDetail = (row) => {
        setDetail(row);
        setReplyDraft(row.admin_reply || '');
    };

    const attachmentSignedUrl = async (path) => {
        try {
            const { data, error } = await supabase.storage.from('support-attachments').createSignedUrl(path, 3600);
            if (error) throw error;
            window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            showToast('Could not open attachment: ' + err.message, 'error');
        }
    };

    const columns = [
        {
            key: 'ticket_id', label: 'Ticket', sortable: true,
            render: (v, row) => (
                <div>
                    <div style={{ fontWeight: 800, color: 'var(--peacock-green)', fontSize: '0.85rem' }}>{v}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700 }}>{row.subject}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{row.profiles?.full_name || 'Unknown user'}</div>
                </div>
            )
        },
        { key: 'category', label: 'Category', render: v => <span style={{ fontSize: '0.78rem' }}>{v ? (CATEGORY_META[v] || v) : '—'}</span> },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v) => {
                const m = STATUS_META[v] || { label: v, color: '#6B7280' };
                return <span style={{ padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: `${m.color}15`, color: m.color }}>{m.label}</span>;
            }
        },
        { key: 'created_at', label: 'Submitted', sortable: true, render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—' },
    ];

    if (detail) {
        return (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <Toast msg={toast?.msg} type={toast?.type} />
                <button onClick={() => setDetail(null)} style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.45rem 0.9rem', borderRadius: 8, color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
                    ← Back to Issue Reports
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--peacock-green)' }}>{detail.ticket_id}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>{detail.subject}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
                            <span>👤 {detail.profiles?.full_name || 'Unknown'} (@{detail.profiles?.username || 'unknown'})</span>
                            <span>📂 {detail.category ? (CATEGORY_META[detail.category] || detail.category) : 'No category'}</span>
                            <span>🕐 {new Date(detail.created_at).toLocaleString('en-IN')}</span>
                        </div>
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Message</h4>
                        <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.65, whiteSpace: 'pre-line', margin: '0 0 1.25rem' }}>{detail.message}</p>

                        {detail.attachment_url && (
                            <button onClick={() => attachmentSignedUrl(detail.attachment_url)} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1.25rem' }}>
                                📎 View Attachment
                            </button>
                        )}

                        <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Admin Reply (internal note / response)</h4>
                        <textarea
                            value={replyDraft}
                            onChange={e => setReplyDraft(e.target.value)}
                            rows={4}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                        />
                        <button onClick={handleSaveReply} disabled={savingReply} style={{ marginTop: '0.75rem', padding: '0.55rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: savingReply ? 'not-allowed' : 'pointer' }}>
                            {savingReply ? 'Saving...' : 'Save Reply'}
                        </button>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h4 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>Status Pipeline</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {Object.entries(STATUS_META).map(([value, meta]) => (
                                <button
                                    key={value}
                                    onClick={() => handleStatusChange(detail, value)}
                                    style={{
                                        padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                                        border: `1px solid ${detail.status === value ? meta.color : 'var(--border-color)'}`,
                                        background: detail.status === value ? `${meta.color}15` : 'var(--bg-base)',
                                        color: detail.status === value ? meta.color : 'var(--text-secondary)',
                                        fontWeight: detail.status === value ? 800 : 600, fontSize: '0.85rem',
                                    }}
                                >
                                    {detail.status === value ? '● ' : '○ '}{meta.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>🎫 Issue Reports</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real support tickets submitted through Help & Support.</p>
                </div>
                <button onClick={loadData} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>↻ Refresh</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <StatCard title="Total" count={stats.total} icon="🎫" color="#3B82F6" loading={loading} />
                <StatCard title="New" count={stats.new} icon="🆕" color="#3B82F6" loading={loading} />
                <StatCard title="In Review" count={stats.inReview} icon="🔍" color="#F59E0B" loading={loading} />
                <StatCard title="Waiting for User" count={stats.waiting} icon="⏳" color="#8B5CF6" loading={loading} />
                <StatCard title="Resolved" count={stats.resolved} icon="✅" color="#10B981" loading={loading} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    <option value="all">All Statuses</option>
                    {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
                </select>
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    <option value="all">All Categories</option>
                    {Object.entries(CATEGORY_META).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    loading={loading}
                    emptyMessage="No issue reports found."
                    actions={(row) => (
                        <button onClick={() => openDetail(row)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630', cursor: 'pointer' }}>
                            View
                        </button>
                    )}
                />
            </div>
        </div>
    );
}
