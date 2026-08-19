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

const formatDateTime = (value) => value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

export default function WithdrawalQueue() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const [markPaidModal, setMarkPaidModal] = useState({ open: false, row: null });
    const [processing, setProcessing] = useState(false);

    const [contractsModal, setContractsModal] = useState({ open: false, loading: false, row: null, contracts: [] });

    // Oldest-first — same queue convention as GigModerationQueue.
    const loadQueue = useCallback(async () => {
        setLoading(true);
        try {
            const { data: withdrawals, error: wErr } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('status', 'requested')
                .order('requested_at', { ascending: true });
            if (wErr) throw wErr;

            const sellerIds = [...new Set((withdrawals || []).map(w => w.seller_id).filter(Boolean))];
            let profileMap = {};
            if (sellerIds.length > 0) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, username')
                    .in('id', sellerIds);
                (profiles || []).forEach(p => { profileMap[p.id] = p; });
            }

            const now = new Date();
            const enriched = (withdrawals || []).map(w => ({
                ...w,
                seller: profileMap[w.seller_id] || null,
                upiId: w.bank_details_snapshot?.upi_id || null,
                isOverdue: !!w.expected_by && new Date(w.expected_by) < now,
            }));

            setRows(enriched);
        } catch (err) {
            console.error('Failed to load withdrawal queue:', err);
            showToast('Failed to load queue: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadQueue(); }, [loadQueue]);

    const openContracts = async (row) => {
        setContractsModal({ open: true, loading: true, row, contracts: [] });
        try {
            const { data: contracts, error } = await supabase
                .from('gig_contracts')
                .select('id, gig_id, buyer_id, seller_net_amount, approved_at')
                .eq('withdrawal_id', row.id);
            if (error) throw error;

            const gigIds = [...new Set((contracts || []).map(c => c.gig_id).filter(Boolean))];
            const { data: gigs } = gigIds.length > 0
                ? await supabase.from('gigs').select('id, title').in('id', gigIds)
                : { data: [] };
            const gigMap = {};
            (gigs || []).forEach(g => { gigMap[g.id] = g; });

            const merged = (contracts || []).map(c => ({ ...c, gigTitle: gigMap[c.gig_id]?.title || 'Untitled Gig' }));
            setContractsModal({ open: true, loading: false, row, contracts: merged });
        } catch (err) {
            console.error('Failed to load linked contracts:', err);
            showToast('Failed to load contracts: ' + err.message, 'error');
            setContractsModal({ open: false, loading: false, row: null, contracts: [] });
        }
    };

    const performMarkPaid = async (row, values) => {
        setProcessing(true);
        try {
            const { error } = await supabase.rpc('admin_mark_withdrawal_paid', {
                p_withdrawal_id: row.id,
                p_utr_reference: values.utr_reference.trim(),
            });
            if (error) throw error;

            showToast(`✅ Marked paid — ₹${Number(row.amount || 0).toLocaleString('en-IN')} to ${row.seller?.full_name || row.seller?.username || 'seller'}`);
            // Optimistic removal — admin_mark_withdrawal_paid only just succeeded for
            // this exact row, so it's no longer 'requested'. Nothing stays on screen
            // for a second accidental click to hit.
            setRows(prev => prev.filter(r => r.id !== row.id));
        } catch (err) {
            console.error('Mark Paid failed:', err);
            // admin_mark_withdrawal_paid is hardened to raise a specific exception
            // ("Withdrawal not found or already marked paid" for a stale/invalid/
            // already-paid id) — surface that text as-is rather than wrapping it in
            // a generic prefix that would bury the actual reason. Fall back to a
            // generic message only for errors with no text at all (e.g. network
            // failures never reaching the RPC).
            showToast(err.message || 'Mark Paid failed — please try again.', 'error');
        } finally {
            setProcessing(false);
            setMarkPaidModal({ open: false, row: null });
        }
    };

    const columns = [
        {
            key: 'seller', label: 'Withdrawal Request', sortable: false,
            render: (_, row) => {
                const sellerName = row.seller?.full_name || row.seller?.username || 'Unknown seller';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 260, maxWidth: 420 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{sellerName}</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--peacock-green)' }}>₹{Number(row.amount || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>📱</span>
                            <span style={{ fontFamily: 'monospace' }}>{row.upiId || '(no UPI id on file)'}</span>
                        </div>
                        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <div>Requested {formatDateTime(row.requested_at)}</div>
                            <div style={{ color: row.isOverdue ? 'var(--accent-coral)' : 'var(--text-muted)', fontWeight: row.isOverdue ? 700 : 400 }}>
                                {row.isOverdue ? '⚠ Overdue — ' : 'Due by '}{formatDateTime(row.expected_by)}
                            </div>
                        </div>
                        <button
                            onClick={() => openContracts(row)}
                            style={{ alignSelf: 'flex-start', marginTop: '0.15rem', background: 'none', border: 'none', color: 'var(--peacock-green)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                            👁 View linked gigs
                        </button>
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
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>💸 Withdrawal Queue</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {rows.length} request{rows.length === 1 ? '' : 's'} awaiting manual transfer, oldest first. 24h SLA from request time.
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
                    emptyMessage="No withdrawal requests pending. 🎉"
                    searchKeys={[]}
                    actions={(row) => (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: 130 }}>
                            <button
                                onClick={() => setMarkPaidModal({ open: true, row })}
                                style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}
                            >
                                ✅ Mark Paid
                            </button>
                        </div>
                    )}
                />
            </div>

            <FormModal
                open={markPaidModal.open}
                title={`Mark withdrawal paid — ₹${Number(markPaidModal.row?.amount || 0).toLocaleString('en-IN')}`}
                fields={[
                    { key: 'utr_reference', label: 'UTR Reference', type: 'text', required: true, hint: 'The UTR/reference number from the bank/UPI transfer you just made.' },
                ]}
                initialValues={{}}
                onSubmit={(values) => performMarkPaid(markPaidModal.row, values)}
                onClose={() => setMarkPaidModal({ open: false, row: null })}
                submitLabel="Mark Paid"
                loading={processing}
            />

            {/* Linked gig_contracts detail — read-only, for admin verification before marking paid */}
            {contractsModal.open && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={e => { if (e.target === e.currentTarget) setContractsModal({ open: false, loading: false, row: null, contracts: [] }); }}
                >
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Linked Gigs</h3>
                            <button
                                onClick={() => setContractsModal({ open: false, loading: false, row: null, contracts: [] })}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}
                            >×</button>
                        </div>
                        {contractsModal.loading ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Loading…</div>
                        ) : contractsModal.contracts.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No linked contracts found.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                {contractsModal.contracts.map(c => (
                                    <div key={c.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.75rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{c.gigTitle}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved {formatDateTime(c.approved_at)}</div>
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--peacock-green)' }}>₹{Number(c.seller_net_amount || 0).toLocaleString('en-IN')}</div>
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
