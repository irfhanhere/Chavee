import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import { fetchEmailMap } from '../../../utils/emailLookup.js';

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

const STATUS_LABELS = {
    awaiting_payment: 'Awaiting Payment',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    approved: 'Approved',
};
const STATUS_STYLES = {
    awaiting_payment: { background: 'rgba(245,158,11,0.1)', color: '#B45309', border: 'rgba(245,158,11,0.25)' },
    in_progress: { background: 'rgba(59,130,246,0.1)', color: '#2563EB', border: 'rgba(59,130,246,0.25)' },
    submitted: { background: 'rgba(245,158,11,0.1)', color: '#B45309', border: 'rgba(245,158,11,0.25)' },
    approved: { background: 'rgba(16,185,129,0.1)', color: 'var(--peacock-green)', border: 'rgba(16,185,129,0.25)' },
};
const PAYMENT_STATUS_STYLES = {
    pending: { background: 'rgba(245,158,11,0.1)', color: '#B45309', border: 'rgba(245,158,11,0.25)' },
    paid: { background: 'rgba(16,185,129,0.1)', color: 'var(--peacock-green)', border: 'rgba(16,185,129,0.25)' },
};
const PAYOUT_STATUS_STYLES = {
    unwithdrawn: { background: 'rgba(148,163,184,0.12)', color: 'var(--text-muted)', border: 'var(--border-color)' },
    requested: { background: 'rgba(245,158,11,0.1)', color: '#B45309', border: 'rgba(245,158,11,0.25)' },
    paid: { background: 'rgba(16,185,129,0.1)', color: 'var(--peacock-green)', border: 'rgba(16,185,129,0.25)' },
};

const Badge = ({ value, styles, labelMap }) => {
    const s = styles[value] || { background: 'rgba(148,163,184,0.12)', color: 'var(--text-muted)', border: 'var(--border-color)' };
    const label = labelMap?.[value] || value || '—';
    return (
        <span style={{
            fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10,
            background: s.background, color: s.color, border: `1px solid ${s.border}`,
            whiteSpace: 'nowrap', display: 'inline-block',
        }}>
            {label}
        </span>
    );
};

const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
const formatDateTime = (value) => value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';
const formatCurrency = (amount) => amount != null ? `₹${Number(amount).toLocaleString('en-IN')}` : '—';

export default function ContractsOverview() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [emailMap, setEmailMap] = useState({});
    const [emailLookupFailed, setEmailLookupFailed] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [detailModal, setDetailModal] = useState({ open: false, row: null });

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const loadContracts = useCallback(async () => {
        setLoading(true);
        try {
            const { data: contracts, error: cErr } = await supabase
                .from('gig_contracts')
                .select('*')
                .order('created_at', { ascending: false });
            if (cErr) throw cErr;

            const gigIds = [...new Set((contracts || []).map(c => c.gig_id).filter(Boolean))];
            const userIds = [...new Set((contracts || []).flatMap(c => [c.buyer_id, c.seller_id]).filter(Boolean))];

            const [{ data: gigs }, { data: profiles }] = await Promise.all([
                gigIds.length > 0 ? supabase.from('gigs').select('id, title').in('id', gigIds) : Promise.resolve({ data: [] }),
                // phone: real profiles.phone column (confirmed live — populated for only
                // ~1/36 profiles today). No email column exists on profiles at all — real
                // email lives in auth.users, which isn't readable from the client, so it's
                // deliberately not fetched here (see the dashed-border note in the detail
                // modal instead of faking/omitting it silently).
                userIds.length > 0 ? supabase.from('profiles').select('id, full_name, username, phone').in('id', userIds) : Promise.resolve({ data: [] }),
            ]);

            const gigMap = {};
            (gigs || []).forEach(g => { gigMap[g.id] = g; });
            const profileMap = {};
            (profiles || []).forEach(p => { profileMap[p.id] = p; });

            const now = new Date();
            const enriched = (contracts || []).map(c => {
                const buyer = profileMap[c.buyer_id];
                const seller = profileMap[c.seller_id];
                // Same overdue logic Messages.jsx / GigsTab.jsx already compute for their own
                // "Due by..." displays — reused here, not reinvented.
                const isOverdue = c.status === 'in_progress' && !!c.buyer_response_deadline && new Date(c.buyer_response_deadline) < now;
                return {
                    ...c,
                    gigTitle: gigMap[c.gig_id]?.title || 'Untitled Gig',
                    buyerName: buyer?.full_name || buyer?.username || 'Unknown User',
                    sellerName: seller?.full_name || seller?.username || 'Unknown User',
                    buyerPhone: buyer?.phone || null,
                    sellerPhone: seller?.phone || null,
                    isOverdue,
                };
            });

            setRows(enriched);

            // Real email, batched — same userIds already computed above, no
            // re-derivation. Runs after setRows so the table/stat cards render
            // immediately; emails fill in a beat later without blocking the page.
            fetchEmailMap(userIds).then(({ emails, failed }) => {
                setEmailMap(emails);
                setEmailLookupFailed(failed);
            });
        } catch (err) {
            console.error('Failed to load contracts:', err);
            showToast('Failed to load contracts: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadContracts(); }, [loadContracts]);

    const filteredRows = useMemo(() => {
        // dateFrom/dateTo are <input type="date"> values (YYYY-MM-DD, local).
        // Compare against created_at's calendar date so the end date is
        // inclusive (a contract created any time ON dateTo still matches).
        const fromTime = dateFrom ? new Date(dateFrom + 'T00:00:00').getTime() : null;
        const toTime = dateTo ? new Date(dateTo + 'T23:59:59.999').getTime() : null;
        return rows.filter(r => {
            if (statusFilter !== 'all' && r.status !== statusFilter) return false;
            if (paymentStatusFilter !== 'all' && r.payment_status !== paymentStatusFilter) return false;
            if (fromTime != null || toTime != null) {
                const createdTime = new Date(r.created_at).getTime();
                if (fromTime != null && createdTime < fromTime) return false;
                if (toTime != null && createdTime > toTime) return false;
            }
            return true;
        });
    }, [rows, statusFilter, paymentStatusFilter, dateFrom, dateTo]);

    // Stat cards intentionally sum over the full fetched `rows` array, not
    // filteredRows — matches the platform-wide-totals convention already
    // used by the admin Events stat cards (independent of the active status
    // tab). The date-range/status filters below scope the table + CSV
    // export only.
    const stats = useMemo(() => {
        let grossPaid = 0, platformFees = 0, outstandingPayouts = 0;
        rows.forEach(r => {
            grossPaid += Number(r.buyer_total_paid) || 0;
            platformFees += (Number(r.buyer_fee_amount) || 0) + (Number(r.seller_fee_amount) || 0);
            if (r.payout_status === 'unwithdrawn') outstandingPayouts += Number(r.seller_net_amount) || 0;
        });
        return { grossPaid, platformFees, outstandingPayouts };
    }, [rows]);

    const overdueCount = rows.filter(r => r.isOverdue).length;

    // Same client-side data:text/csv pattern already used in
    // SubscribersManager.jsx / MarketplaceManager.jsx — no Edge Function,
    // no library. Exports exactly what's on screen (filteredRows), so it
    // respects the active status/payment/date filters.
    const exportCsv = () => {
        if (filteredRows.length === 0) {
            showToast('No data to export', 'error');
            return;
        }
        const headers = [
            'gig_title', 'buyer_name', 'buyer_phone', 'seller_name', 'seller_phone',
            'status', 'payment_status', 'payout_status',
            'buyer_total_paid', 'buyer_fee_amount', 'seller_net_amount', 'seller_fee_amount',
            'cashfree_order_id', 'created_at', 'approved_at',
        ];
        const csvRow = r => [
            r.gigTitle, r.buyerName, r.buyerPhone || '', r.sellerName, r.sellerPhone || '',
            r.status, r.payment_status, r.payout_status,
            r.buyer_total_paid, r.buyer_fee_amount, r.seller_net_amount, r.seller_fee_amount,
            r.cashfree_order_id || '', r.created_at || '', r.approved_at || '',
        ].map(v => JSON.stringify(v ?? '')).join(',');
        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...filteredRows.map(csvRow)].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `contracts_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const columns = [
        { key: 'gigTitle', label: 'Gig', sortable: true, width: 200 },
        { key: 'buyerName', label: 'Buyer', sortable: true, width: 140 },
        { key: 'sellerName', label: 'Seller', sortable: true, width: 140 },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v) => <Badge value={v} styles={STATUS_STYLES} labelMap={STATUS_LABELS} />
        },
        {
            key: 'payment_status', label: 'Payment', sortable: true,
            render: (v) => <Badge value={v} styles={PAYMENT_STATUS_STYLES} />
        },
        {
            key: 'payout_status', label: 'Payout', sortable: true,
            render: (v) => <Badge value={v} styles={PAYOUT_STATUS_STYLES} />
        },
        {
            key: 'buyer_total_paid', label: 'Amount', sortable: true, align: 'right',
            render: (v) => <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(v)}</span>
        },
        {
            key: 'created_at', label: 'Created', sortable: true,
            render: (v) => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(v)}</span>
        },
        {
            key: 'isOverdue', label: 'Overdue', sortable: false, align: 'center',
            render: (v) => v ? (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#EF4444' }}>⚠️ Overdue</span>
            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>
        },
    ];

    const selectStyle = { padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)' };

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>📄 Contracts Overview</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {rows.length} contract{rows.length === 1 ? '' : 's'} total
                        {overdueCount > 0 && <span style={{ color: '#EF4444', fontWeight: 700 }}> · {overdueCount} overdue</span>}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={exportCsv}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                        ⬇ Export CSV
                    </button>
                    <button
                        onClick={loadContracts}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Stat cards — sums over the full fetched dataset (all contracts,
                independent of the filters below), same as EventsManager's stat
                cards. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Gross Paid', value: formatCurrency(stats.grossPaid), icon: '💰' },
                    { label: 'Total Platform Fees', value: formatCurrency(stats.platformFees), icon: '🏦' },
                    { label: 'Outstanding Payouts', value: formatCurrency(stats.outstandingPayouts), icon: '⏳' },
                ].map(card => (
                    <div key={card.label} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.1rem 1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.4rem' }}>{card.icon} {card.label}</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{card.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={selectStyle}>
                    <option value="all">All Statuses</option>
                    <option value="awaiting_payment">Awaiting Payment</option>
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="approved">Approved</option>
                </select>
                <select value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)} style={selectStyle}>
                    <option value="all">All Payment Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    From
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={selectStyle} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    To
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={selectStyle} />
                </label>
                {(dateFrom || dateTo) && (
                    <button
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        style={{ padding: '0.5rem 0.85rem', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Clear dates
                    </button>
                )}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    loading={loading}
                    emptyMessage="No contracts match these filters."
                    searchKeys={['gigTitle', 'buyerName', 'sellerName']}
                    actions={(row) => (
                        <button
                            onClick={() => setDetailModal({ open: true, row })}
                            style={{ padding: '0.4rem 0.7rem', fontSize: '0.78rem', fontWeight: 700, borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                        >
                            👁 Details
                        </button>
                    )}
                />
            </div>

            {/* Detail expand — read-only, admin verification/support context.
                Deliberately omits clearing_started_at / available_at / vendor_settled_at /
                vendor_settlement_status — confirmed 100% dormant Easy Split remnants, always
                null, would just show blank fields with no explanation. */}
            {detailModal.open && detailModal.row && (() => {
                const row = detailModal.row;
                const detailRow = (label, value) => value ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</span>
                    </div>
                ) : null;

                return (
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                        onClick={e => { if (e.target === e.currentTarget) setDetailModal({ open: false, row: null }); }}
                    >
                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{row.gigTitle}</h3>
                                    <Badge value={row.status} styles={STATUS_STYLES} labelMap={STATUS_LABELS} />
                                </div>
                                <button
                                    onClick={() => setDetailModal({ open: false, row: null })}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1 }}
                                >×</button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                {detailRow('Buyer', row.buyerName)}
                                {detailRow('Buyer Phone', row.buyerPhone || '—')}
                                {detailRow('Buyer Email', emailMap[row.buyer_id] || '—')}
                                {detailRow('Seller', row.sellerName)}
                                {detailRow('Seller Phone', row.sellerPhone || '—')}
                                {detailRow('Seller Email', emailMap[row.seller_id] || '—')}
                                {detailRow('Gig Price', formatCurrency(row.gig_price))}
                                {detailRow('Buyer Paid', formatCurrency(row.buyer_total_paid))}
                                {detailRow('Buyer Fee', formatCurrency(row.buyer_fee_amount))}
                                {detailRow('Seller Receives', formatCurrency(row.seller_net_amount))}
                                {detailRow('Seller Fee', formatCurrency(row.seller_fee_amount))}
                                {detailRow('Cashfree Order ID', row.cashfree_order_id)}
                                {detailRow('Created', formatDateTime(row.created_at))}
                                {detailRow('Delivery Deadline', formatDateTime(row.buyer_response_deadline))}
                                {detailRow('Work Submitted', formatDateTime(row.work_submitted_at))}
                                {detailRow('Approved', formatDateTime(row.approved_at))}
                                {detailRow('Revisions Used', row.revisions_used != null ? String(row.revisions_used) : null)}
                                {row.delivery_message && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Delivery Note</div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{row.delivery_message}</p>
                                    </div>
                                )}
                                {row.revision_notes && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', marginBottom: '0.3rem' }}>🔁 Revision Notes</div>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{row.revision_notes}</p>
                                    </div>
                                )}

                                {/* Buyer/Seller Email above are real (admin-email-lookup Edge
                                    Function, service-role auth.admin.getUserById, gated on the
                                    real admins table). This note only shows if that batch call
                                    itself failed — a genuine outage, not the normal "no email on
                                    file" case (which just shows — like phone does). */}
                                {emailLookupFailed && (
                                    <div style={{ marginTop: '0.75rem', padding: '0.85rem 1rem', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        ⚠️ Email lookup failed to load — showing — until you refresh.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
