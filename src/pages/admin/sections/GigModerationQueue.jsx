import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FormModal from '../components/FormModal.jsx';

// Exact copy from Step 2's REJECTION_REASON_COPY (Earn.jsx) — the dropdown
// values here are what actually get written to gigs.rejection_reason and
// read back by the poster's GigStatusView, so these must stay in sync.
const REJECTION_OPTIONS = [
    { value: 'academic_dishonesty', label: 'Academic dishonesty' },
    { value: 'illegal_or_prohibited', label: 'Illegal or prohibited' },
    { value: 'scope_unclear', label: 'Scope too unclear' },
    { value: 'suspected_scam', label: 'Suspected scam' },
    { value: 'off_platform_contact', label: 'Attempts off-platform contact' },
    { value: 'inappropriate_content', label: 'Inappropriate content' },
    { value: 'duplicate_posting', label: 'Duplicate posting' },
];

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
            maxWidth: 'calc(100vw - 2rem)',
        }}>{msg}</div>
    );
}

const accountAge = (createdAt) => {
    if (!createdAt) return 'Unknown account age';
    const days = Math.floor((new Date() - new Date(createdAt)) / 86400000);
    if (days < 1) return 'Joined today';
    if (days < 30) return `${days} day${days === 1 ? '' : 's'} old`;
    if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} old`;
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? '' : 's'} old`;
};

export default function GigModerationQueue() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const [confirmDialog, setConfirmDialog] = useState({ open: false, gig: null, trust: false });
    const [rejectModal, setRejectModal] = useState({ open: false, gig: null });
    const [processing, setProcessing] = useState(false);

    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            // Oldest-first — the whole point of a queue.
            const { data: gigs, error: gigsErr } = await supabase
                .from('gigs')
                .select('*')
                .eq('status', 'pending_review')
                .order('created_at', { ascending: true });
            if (gigsErr) throw gigsErr;

            const posterIds = [...new Set((gigs || []).map(g => g.posted_by).filter(Boolean))];

            let profileMap = {};
            if (posterIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, created_at, gig_auto_approve')
                    .in('id', posterIds);
                (profiles || []).forEach(p => { profileMap[p.id] = p; });
            }

            // Prior rejection count per poster — a pending_review gig is never
            // itself counted here (it's not status='rejected' yet), so no
            // exclusion of the current row is needed.
            let rejectionCounts = {};
            if (posterIds.length > 0) {
                const { data: rejected } = await supabase
                    .from('gigs')
                    .select('posted_by')
                    .in('posted_by', posterIds)
                    .eq('status', 'rejected');
                (rejected || []).forEach(g => { rejectionCounts[g.posted_by] = (rejectionCounts[g.posted_by] || 0) + 1; });
            }

            const enriched = (gigs || []).map(g => ({
                ...g,
                poster: profileMap[g.posted_by] || null,
                priorRejections: rejectionCounts[g.posted_by] || 0,
            }));

            setRows(enriched);
        } catch (err) {
            console.error('Failed to load moderation queue:', err);
            showToast('Failed to load queue: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadQueue(); }, [loadQueue]);

    // Approve (optionally + Trust). admin_moderate_gig's 'verify' action sets
    // verified/verified_at/verified_by correctly (reused, not reimplemented)
    // but never touches status — confirmed by direct testing, it was built
    // for the older verified-only moderation model. status must also move
    // to 'active' here: Step 4 found the public feed's real RLS-backed gate
    // is verified=true, but GigStatusView keys its "Under Review" banner off
    // status==='pending_review' — leaving status untouched would show an
    // approved, live gig as permanently pending to its own poster.
    const performApprove = async (gig, trust) => {
        setProcessing(true);
        try {
            const { error: rpcErr } = await supabase.rpc('admin_moderate_gig', { p_gig_id: gig.id, p_action: 'verify', p_reason: null });
            if (rpcErr) throw rpcErr;

            const { error: statusErr } = await supabase.from('gigs').update({ status: 'active' }).eq('id', gig.id);
            if (statusErr) throw statusErr;

            if (trust) {
                const { error: trustErr } = await supabase.from('profiles').update({ gig_auto_approve: true }).eq('id', gig.posted_by);
                if (trustErr) throw trustErr;
            }

            const { error: notifErr } = await supabase.from('notifications').insert({
                user_id: gig.posted_by,
                type: 'gig_approved',
                title: '💼 Gig Listing Approved!',
                body: `Your gig "${gig.title}" has been reviewed and approved. It is now visible on the marketplace.` + (trust ? ' Future gigs you post will go live immediately, without review.' : ''),
                link: '/earn',
                is_read: false,
            });
            if (notifErr) console.error('Failed to write approval notification:', notifErr);

            showToast(trust ? `✅ Approved — ${gig.poster?.full_name || 'poster'} is now trusted` : '✅ Gig approved and live');
            setRows(prev => prev.filter(r => r.id !== gig.id));
        } catch (err) {
            console.error('Approve failed:', err);
            showToast('Approve failed: ' + err.message, 'error');
        } finally {
            setProcessing(false);
            setConfirmDialog({ open: false, gig: null, trust: false });
        }
    };

    // Reject: admin_moderate_gig's 'reject' action only sets verified=false,
    // which a pending_review gig already is — no logic there worth calling
    // into, and it writes none of status/rejection_reason/rejection_note
    // (confirmed by direct testing: passing p_reason is silently discarded).
    // Written directly instead.
    const performReject = async (gig, values) => {
        setProcessing(true);
        try {
            const { error } = await supabase
                .from('gigs')
                .update({
                    status: 'rejected',
                    rejection_reason: values.rejection_reason,
                    rejection_note: values.rejection_note?.trim() || null,
                })
                .eq('id', gig.id);
            if (error) throw error;

            const { error: notifErr } = await supabase.from('notifications').insert({
                user_id: gig.posted_by,
                type: 'gig_rejected',
                title: '⚠️ Gig Listing Needs Changes',
                body: `Your gig "${gig.title}" wasn't approved this time. Open it from My Gigs → Needs Attention to see why and resubmit.`,
                link: '/earn',
                is_read: false,
            });
            if (notifErr) console.error('Failed to write rejection notification:', notifErr);

            showToast('🚫 Gig rejected');
            setRows(prev => prev.filter(r => r.id !== gig.id));
            setRejectModal({ open: false, gig: null });
        } catch (err) {
            console.error('Reject failed:', err);
            showToast('Reject failed: ' + err.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const columns = [
        {
            key: 'gig', label: 'Pending Gig', sortable: false,
            render: (_, row) => {
                const posterName = row.poster?.full_name || row.poster?.username || 'Unknown poster';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 260, maxWidth: 520 }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{row.title || '—'}</div>
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                {row.description || '(no description)'}
                            </p>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <span>📎</span>
                            {/* gigs has no attachment column/table — real "no attachments" rather than fabricating a file. */}
                            <span>No attachments</span>
                        </div>
                        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            <div><strong>{posterName}</strong> · {accountAge(row.poster?.created_at)}</div>
                            <div style={{ color: row.priorRejections > 0 ? 'var(--accent-coral)' : 'var(--text-muted)', fontWeight: row.priorRejections > 0 ? 700 : 400 }}>
                                {row.priorRejections} prior rejection{row.priorRejections === 1 ? '' : 's'}
                            </div>
                        </div>
                    </div>
                );
            }
        },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>🛡️ Gig Moderation Queue</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {rows.length} gig{rows.length === 1 ? '' : 's'} awaiting review, oldest first.
                    </p>
                </div>
                <button
                    onClick={loadQueue}
                    style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
                    ↻ Refresh
                </button>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    emptyMessage="Nothing pending review. 🎉"
                    searchKeys={['title', 'description']}
                    actions={(row) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 140 }}>
                            <button
                                onClick={() => setConfirmDialog({ open: true, gig: row, trust: false })}
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}
                            >
                                ✅ Approve
                            </button>
                            <button
                                onClick={() => setConfirmDialog({ open: true, gig: row, trust: true })}
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6, background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630', cursor: 'pointer' }}
                            >
                                ⭐ Approve & Trust
                            </button>
                            <button
                                onClick={() => setRejectModal({ open: true, gig: row })}
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}
                            >
                                🚫 Reject
                            </button>
                        </div>
                    )}
                />
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                title={confirmDialog.trust ? 'Approve & Trust this poster?' : 'Approve this gig?'}
                message={
                    confirmDialog.trust
                        ? `"${confirmDialog.gig?.title}" goes live immediately, and future gigs from ${confirmDialog.gig?.poster?.full_name || 'this poster'} will skip review entirely.`
                        : `"${confirmDialog.gig?.title}" goes live immediately on the public feed.`
                }
                confirmLabel={confirmDialog.trust ? 'Approve & Trust' : 'Approve'}
                onConfirm={() => performApprove(confirmDialog.gig, confirmDialog.trust)}
                onCancel={() => setConfirmDialog({ open: false, gig: null, trust: false })}
                loading={processing}
            />

            <FormModal
                open={rejectModal.open}
                title={`Reject "${rejectModal.gig?.title || ''}"`}
                fields={[
                    { key: 'rejection_reason', label: 'Reason', type: 'select', options: REJECTION_OPTIONS, required: true },
                    { key: 'rejection_note', label: 'Admin note (optional)', type: 'textarea', hint: 'Shown to the poster alongside the reason — use it for specifics.' },
                ]}
                initialValues={{}}
                onSubmit={(values) => performReject(rejectModal.gig, values)}
                onClose={() => setRejectModal({ open: false, gig: null })}
                submitLabel="Reject Gig"
                loading={processing}
            />
        </div>
    );
}
