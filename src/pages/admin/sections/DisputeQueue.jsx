import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
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
            maxWidth: 'calc(100vw - 2rem)',
        }}>{msg}</div>
    );
}

const CATEGORY_LABELS = {
    non_delivery: 'Non-delivery',
    quality_issue: 'Quality issue',
    post_approval_issue: 'Post-approval issue',
    other: 'Other',
};

const CONTRACT_STATUS_LABELS = {
    awaiting_payment: 'Awaiting Payment',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    approved: 'Approved',
};

const formatDateTime = (value) => value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
const formatCurrency = (amount) => amount != null ? `₹${Number(amount).toLocaleString('en-IN')}` : '—';

export default function DisputeQueue() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const [resolveModal, setResolveModal] = useState({ open: false, row: null });
    const [processing, setProcessing] = useState(false);

    const [contractModal, setContractModal] = useState({ open: false, loading: false, row: null, contract: null });

    // Oldest-first — same queue convention as GigModerationQueue / WithdrawalQueue.
    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const { data: disputes, error: dErr } = await supabase
                .from('disputes')
                .select('*')
                .eq('status', 'open')
                .order('created_at', { ascending: true });
            if (dErr) throw dErr;

            const contractIds = [...new Set((disputes || []).map(d => d.gig_contract_id).filter(Boolean))];
            const { data: contracts } = contractIds.length > 0
                ? await supabase.from('gig_contracts').select('id, gig_id, buyer_id, seller_id, status, buyer_total_paid, seller_net_amount').in('id', contractIds)
                : { data: [] };
            const contractMap = {};
            (contracts || []).forEach(c => { contractMap[c.id] = c; });

            const gigIds = [...new Set((contracts || []).map(c => c.gig_id).filter(Boolean))];
            const userIds = [...new Set((disputes || []).map(d => d.raised_by).concat(
                (contracts || []).flatMap(c => [c.buyer_id, c.seller_id])
            ).filter(Boolean))];

            const [{ data: gigs }, { data: profiles }] = await Promise.all([
                gigIds.length > 0 ? supabase.from('gigs').select('id, title').in('id', gigIds) : Promise.resolve({ data: [] }),
                userIds.length > 0 ? supabase.from('profiles').select('id, full_name, username').in('id', userIds) : Promise.resolve({ data: [] }),
            ]);
            const gigMap = {};
            (gigs || []).forEach(g => { gigMap[g.id] = g; });
            const profileMap = {};
            (profiles || []).forEach(p => { profileMap[p.id] = p; });

            const enriched = (disputes || []).map(d => {
                const contract = contractMap[d.gig_contract_id] || null;
                const buyer = contract ? profileMap[contract.buyer_id] : null;
                const seller = contract ? profileMap[contract.seller_id] : null;
                const raisedByProfile = profileMap[d.raised_by];
                return {
                    ...d,
                    contract,
                    gigTitle: contract ? (gigMap[contract.gig_id]?.title || 'Untitled Gig') : 'Unknown Gig',
                    buyerName: buyer?.full_name || buyer?.username || 'Unknown User',
                    sellerName: seller?.full_name || seller?.username || 'Unknown User',
                    raisedByName: raisedByProfile?.full_name || raisedByProfile?.username || 'Unknown User',
                };
            });

            setRows(enriched);
        } catch (err) {
            console.error('Failed to load dispute queue:', err);
            showToast('Failed to load queue: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadQueue(); }, [loadQueue]);

    const openContract = (row) => {
        setContractModal({ open: true, loading: false, row, contract: row.contract });
    };

    const performResolve = async (row, values) => {
        setProcessing(true);
        try {
            const { error } = await supabase.rpc('admin_resolve_dispute', {
                p_dispute_id: row.id,
                p_resolution: values.resolution.trim(),
            });
            if (error) throw error;

            showToast(`✅ Dispute resolved — ${row.gigTitle}`);
            setRows(prev => prev.filter(r => r.id !== row.id));
        } catch (err) {
            console.error('Resolve failed:', err);
            // admin_resolve_dispute raises a specific exception on a stale/already-resolved
            // id — surface it as-is, same pattern as admin_mark_withdrawal_paid.
            showToast(err.message || 'Resolve failed', 'error');
        } finally {
            setProcessing(false);
            setResolveModal({ open: false, row: null });
        }
    };

    const columns = [
        {
            key: 'dispute', label: 'Dispute', sortable: false,
            render: (_, row) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 260, maxWidth: 460 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{row.gigTitle}</span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)', padding: '0.15rem 0.5rem', borderRadius: 10 }}>
                            {CATEGORY_LABELS[row.category] || row.category}
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {row.description || '(no description)'}
                    </p>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Raised by <strong>{row.raisedByName}</strong> · Buyer: {row.buyerName} · Seller: {row.sellerName}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDateTime(row.created_at)}</div>
                    <button
                        onClick={() => openContract(row)}
                        style={{ alignSelf: 'flex-start', marginTop: '0.1rem', background: 'none', border: 'none', color: 'var(--peacock-green)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                        👁 View contract
                    </button>
                </div>
            )
        },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>⚠️ Dispute Queue</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {rows.length} dispute{rows.length === 1 ? '' : 's'} open, oldest first.
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
                    emptyMessage="No open disputes. 🎉"
                    searchKeys={['gigTitle', 'buyerName', 'sellerName', 'description']}
                    actions={(row) => (
                        <button
                            onClick={() => setResolveModal({ open: true, row })}
                            style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}
                        >
                            ✅ Resolve
                        </button>
                    )}
                />
            </div>

            <FormModal
                open={resolveModal.open}
                title={`Resolve dispute — ${resolveModal.row?.gigTitle || ''}`}
                fields={[
                    { key: 'resolution', label: 'Resolution Notes', type: 'textarea', required: true, hint: 'What was decided and why — visible in the dispute record.' },
                ]}
                initialValues={{}}
                onSubmit={(values) => performResolve(resolveModal.row, values)}
                onClose={() => setResolveModal({ open: false, row: null })}
                submitLabel="Resolve Dispute"
                loading={processing}
            />

            {/* Linked contract detail — read-only context for the admin's decision.
                Deliberately omits clearing_started_at / available_at / vendor_settled_at /
                vendor_settlement_status — confirmed 100% dormant Easy Split remnants. */}
            {contractModal.open && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={e => { if (e.target === e.currentTarget) setContractModal({ open: false, loading: false, row: null, contract: null }); }}
                >
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Linked Contract</h3>
                            <button
                                onClick={() => setContractModal({ open: false, loading: false, row: null, contract: null })}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}
                            >×</button>
                        </div>
                        {!contractModal.contract ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No linked contract found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                {[
                                    ['Status', CONTRACT_STATUS_LABELS[contractModal.contract.status] || contractModal.contract.status],
                                    ['Buyer Paid', formatCurrency(contractModal.contract.buyer_total_paid)],
                                    ['Seller Receives', formatCurrency(contractModal.contract.seller_net_amount)],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                                        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
