import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { PageLoader } from '../../components/Spinner.jsx';
import { getAttachmentSignedUrl } from '../../utils/attachmentStorage.js';

const STATUS_LABELS = {
    awaiting_payment: 'Awaiting Payment',
    in_progress: 'In Progress',
    submitted: 'Submitted — Awaiting Approval',
    approved: 'Approved ✓',
};

const STATUS_STYLES = {
    awaiting_payment: { background: 'rgba(245,158,11,0.1)', color: '#B45309', border: 'rgba(245,158,11,0.25)' },
    in_progress: { background: 'rgba(59,130,246,0.1)', color: '#2563EB', border: 'rgba(59,130,246,0.25)' },
    submitted: { background: 'rgba(245,158,11,0.1)', color: '#B45309', border: 'rgba(245,158,11,0.25)' },
    approved: { background: 'rgba(16,185,129,0.1)', color: 'var(--peacock-green)', border: 'rgba(16,185,129,0.25)' },
};

const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

// Resolves a delivery_file_url (a message-attachments storage path) to a signed URL for viewing/downloading
function DeliveryFileLink({ filePath }) {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        if (!filePath) return;
        getAttachmentSignedUrl(filePath).then(url => {
            if (url) setSignedUrl(url);
        });
    }, [filePath]);

    if (!filePath) return null;
    const fileName = filePath.split('/').pop() || 'Delivered file';

    return (
        <a
            href={signedUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--peacock-green)', textDecoration: 'underline' }}
        >
            📎 {signedUrl ? `View ${fileName}` : 'Loading file...'}
        </a>
    );
}

export default function GigsTab({ targetUserId }) {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subTab, setSubTab] = useState('working'); // 'working' | 'posted'
    const [selectedContract, setSelectedContract] = useState(null);

    useEffect(() => {
        const fetchGigContracts = async () => {
            if (!targetUserId) return;
            setLoading(true);
            try {
                // 1. Fetch all gig_contracts where this user is either buyer or seller
                const { data: contractsData, error } = await supabase
                    .from('gig_contracts')
                    .select('*')
                    .or(`buyer_id.eq.${targetUserId},seller_id.eq.${targetUserId}`)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (!contractsData || contractsData.length === 0) {
                    setContracts([]);
                    return;
                }

                // 2. Collect distinct gig_ids and counterparty ids (the OTHER party in each contract)
                const gigIds = [...new Set(contractsData.map(c => c.gig_id).filter(Boolean))];
                const counterpartyIds = [...new Set(
                    contractsData.map(c => c.buyer_id === targetUserId ? c.seller_id : c.buyer_id).filter(Boolean)
                )];

                const [{ data: gigsData }, { data: profilesData }] = await Promise.all([
                    gigIds.length > 0
                        ? supabase.from('gigs').select('id, title').in('id', gigIds)
                        : Promise.resolve({ data: [] }),
                    counterpartyIds.length > 0
                        ? supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', counterpartyIds)
                        : Promise.resolve({ data: [] }),
                ]);

                // 3. Merge client-side
                const merged = contractsData.map(c => {
                    const isBuyer = c.buyer_id === targetUserId;
                    const counterpartyId = isBuyer ? c.seller_id : c.buyer_id;
                    const counterparty = (profilesData || []).find(p => p.id === counterpartyId);
                    const gig = (gigsData || []).find(g => g.id === c.gig_id);
                    return {
                        ...c,
                        role: isBuyer ? 'buyer' : 'seller',
                        gigTitle: gig?.title || 'Untitled Gig',
                        counterpartyName: counterparty?.full_name || counterparty?.username || 'Unknown User',
                    };
                });

                setContracts(merged);
            } catch (err) {
                console.error('Failed to load gig contracts', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGigContracts();
    }, [targetUserId]);

    if (loading) return <PageLoader message="Loading gigs..." />;

    // "Working On" = this profile is the seller (doing gig work for someone else)
    // "Posted"     = this profile is the buyer (hired someone for a gig)
    const filteredContracts = contracts.filter(c => c.role === (subTab === 'working' ? 'seller' : 'buyer'));
    const emptyMessage = subTab === 'working'
        ? "You're not working on any gigs yet."
        : "You haven't hired anyone for a gig yet.";

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Gigs</h3>

            {/* Sub-tab switcher */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {[
                    { id: 'working', label: 'Working On' },
                    { id: 'posted', label: 'Posted' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 10,
                            background: subTab === tab.id ? 'var(--peacock-green)' : 'var(--bg-surface)',
                            color: subTab === tab.id ? '#fff' : 'var(--text-secondary)',
                            border: '1px solid',
                            borderColor: subTab === tab.id ? 'var(--peacock-green)' : 'var(--border-color)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {filteredContracts.length > 0 ? (
                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {filteredContracts.map(contract => {
                        const statusLabel = STATUS_LABELS[contract.status] || contract.status || 'Awaiting Payment';
                        const statusStyle = STATUS_STYLES[contract.status] || STATUS_STYLES.awaiting_payment;

                        // Date line: due date while in progress, submitted date once submitted/approved
                        let dateLine = null;
                        if (contract.status === 'in_progress' && contract.buyer_response_deadline) {
                            dateLine = `Due by ${formatDate(contract.buyer_response_deadline)}`;
                        } else if ((contract.status === 'submitted' || contract.status === 'approved') && contract.work_submitted_at) {
                            dateLine = `Submitted ${formatDate(contract.work_submitted_at)}`;
                        }

                        return (
                            <div
                                key={contract.id}
                                onClick={() => setSelectedContract(contract)}
                                style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: '1.25rem', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--peacock-green)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{contract.gigTitle}</h4>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {contract.role === 'buyer' ? 'Seller' : 'Buyer'}: {contract.counterpartyName}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: 12,
                                        background: statusStyle.background,
                                        color: statusStyle.color,
                                        border: `1px solid ${statusStyle.border}`,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {statusLabel}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--peacock-green)' }}>
                                        ₹{contract.gig_price || 0}
                                    </span>
                                    {dateLine && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{dateLine}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem' }}>
                    {emptyMessage}
                </div>
            )}

            {/* ── CONTRACT DETAIL MODAL ── */}
            {selectedContract && (() => {
                const contract = selectedContract;
                const statusLabel = STATUS_LABELS[contract.status] || contract.status || 'Awaiting Payment';
                const statusStyle = STATUS_STYLES[contract.status] || STATUS_STYLES.awaiting_payment;
                const isBuyer = contract.role === 'buyer';

                const detailRow = (label, value) => value ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 700, textAlign: 'right' }}>{value}</span>
                    </div>
                ) : null;

                return (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', animation: 'fadeIn 0.2s' }}>
                        <div style={{ background: 'var(--bg-surface)', width: '100%', maxWidth: 520, borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{contract.gigTitle}</h3>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 10,
                                        background: statusStyle.background, color: statusStyle.color, border: `1px solid ${statusStyle.border}`
                                    }}>
                                        {statusLabel}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedContract(null)}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                                >
                                    ×
                                </button>
                            </div>

                            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Parties */}
                                <div>
                                    {detailRow('Buyer', isBuyer ? 'You' : contract.counterpartyName)}
                                    {detailRow('Seller', !isBuyer ? 'You' : contract.counterpartyName)}
                                </div>

                                {/* Price breakdown — role-gated */}
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Price</h4>
                                    {detailRow('Gig Price', `₹${contract.gig_price || 0}`)}
                                    {isBuyer && detailRow('You Paid', contract.buyer_total_paid != null ? `₹${contract.buyer_total_paid}` : null)}
                                    {isBuyer && detailRow('Platform Fee (yours)', contract.buyer_fee_amount != null ? `₹${contract.buyer_fee_amount}` : null)}
                                    {!isBuyer && detailRow('You Receive', contract.seller_net_amount != null ? `₹${contract.seller_net_amount}` : null)}
                                    {!isBuyer && detailRow('Platform Fee (yours)', contract.seller_fee_amount != null ? `₹${contract.seller_fee_amount}` : null)}
                                </div>

                                {/* Delivery */}
                                {(contract.delivery_message || contract.delivery_file_url) && (
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Delivery Note</h4>
                                        {contract.delivery_message && (
                                            <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                {contract.delivery_message}
                                            </p>
                                        )}
                                        <DeliveryFileLink filePath={contract.delivery_file_url} />
                                    </div>
                                )}

                                {/* Timeline */}
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Timeline</h4>
                                    {detailRow('Created', formatDate(contract.created_at))}
                                    {detailRow('Delivery Deadline', formatDate(contract.buyer_response_deadline))}
                                    {detailRow('Work Submitted', formatDate(contract.work_submitted_at))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
