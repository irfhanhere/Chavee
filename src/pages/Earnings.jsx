import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { PageLoader } from '../components/Spinner.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import WithdrawRequestForm from '../components/WithdrawRequestForm.jsx';

const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const formatDateTime = (value) => value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '—';

// Eligibility (7-day clearing wait, no minimum amount) is now enforced
// entirely server-side by the create_withdrawal_request RPC — nothing
// client-side computes or gates it. See WithdrawRequestForm.jsx.
const WITHDRAWAL_STATUS_STYLES = {
    requested: { background: 'rgba(245,158,11,0.1)', color: '#B45309', border: 'rgba(245,158,11,0.25)', label: 'Requested' },
    paid: { background: 'rgba(16,185,129,0.1)', color: 'var(--peacock-green)', border: 'rgba(16,185,129,0.25)', label: 'Paid' },
};
const withdrawalStatusStyle = (status) => WITHDRAWAL_STATUS_STYLES[status] || { background: 'rgba(148,163,184,0.12)', color: 'var(--text-muted)', border: 'var(--border-color)', label: status || 'Unknown' };

export default function Earnings() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState([]);
    const [withdrawals, setWithdrawals] = useState([]);
    const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUser(session.user);
        };
        init();
    }, [navigate]);

    useEffect(() => {
        const fetchEarnings = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // 1. Fetch approved gig_contracts where this user is the seller
                const { data: contractsData, error } = await supabase
                    .from('gig_contracts')
                    .select('*')
                    .eq('seller_id', user.id)
                    .eq('status', 'approved')
                    .order('approved_at', { ascending: false });

                if (error) throw error;
                if (!contractsData || contractsData.length === 0) {
                    setEarnings([]);
                    return;
                }

                // 2. Collect distinct gig_ids and buyer ids, fetch title + buyer name
                const gigIds = [...new Set(contractsData.map(c => c.gig_id).filter(Boolean))];
                const buyerIds = [...new Set(contractsData.map(c => c.buyer_id).filter(Boolean))];

                const [{ data: gigsData }, { data: profilesData }] = await Promise.all([
                    gigIds.length > 0
                        ? supabase.from('gigs').select('id, title').in('id', gigIds)
                        : Promise.resolve({ data: [] }),
                    buyerIds.length > 0
                        ? supabase.from('profiles').select('id, full_name, username').in('id', buyerIds)
                        : Promise.resolve({ data: [] }),
                ]);

                // 3. Merge client-side
                const merged = contractsData.map(c => {
                    const gig = (gigsData || []).find(g => g.id === c.gig_id);
                    const buyer = (profilesData || []).find(p => p.id === c.buyer_id);
                    return {
                        ...c,
                        gigTitle: gig?.title || 'Untitled Gig',
                        buyerName: buyer?.full_name || buyer?.username || 'Unknown Buyer',
                    };
                });

                setEarnings(merged);
            } catch (err) {
                console.error('Failed to load earnings', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEarnings();
    }, [user]);

    const fetchWithdrawals = async () => {
        if (!user) return;
        setWithdrawalsLoading(true);
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('seller_id', user.id)
                .order('requested_at', { ascending: false });
            if (error) throw error;
            setWithdrawals(data || []);
        } catch (err) {
            console.error('Failed to load withdrawals', err);
        } finally {
            setWithdrawalsLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    // Called after create_withdrawal_request succeeds — refresh the "My
    // Withdrawals" list and let the seller know via toast, on top of the
    // inline success message the form itself already shows.
    const handleWithdrawSuccess = ({ amount, contractCount }) => {
        showToast(`Withdrawal requested: ₹${amount.toLocaleString('en-IN')} across ${contractCount} gig${contractCount === 1 ? '' : 's'}`, 'success');
        fetchWithdrawals();
    };

    if (loading) return <PageLoader message="Loading earnings..." />;

    const totalEarned = earnings.reduce((sum, e) => sum + (Number(e.seller_net_amount) || 0), 0);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                <div>
                    <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>💰 Earnings</p>
                    <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, margin: 0 }}>Your Earnings</h1>
                </div>

                {/* Summary card */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Total Earned</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--peacock-green)' }}>
                        ₹{totalEarned.toLocaleString('en-IN')}
                    </div>
                    <p style={{ margin: '0.75rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        This is a record of what you've earned from completed gigs — not a spendable balance. Earnings become withdrawable 7 days after approval; once you request a withdrawal, we transfer to your UPI ID manually within 24 hours.
                    </p>
                </div>

                {/* Withdraw section — real UPI-only request, calls create_withdrawal_request RPC */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Withdraw</h3>
                    <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Enter the UPI ID to send your withdrawal to. This requests everything currently eligible — earnings from gigs approved 7+ days ago — there's no minimum amount.
                    </p>
                    <WithdrawRequestForm onSuccess={handleWithdrawSuccess} />
                </div>

                {/* My Withdrawals — real status list, not a duplicate of the Earnings summary above */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>My Withdrawals</h3>

                    {withdrawalsLoading ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>Loading…</div>
                    ) : withdrawals.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {withdrawals.map(w => {
                                const style = withdrawalStatusStyle(w.status);
                                return (
                                    <div key={w.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: '1rem 1.1rem', background: 'var(--bg-base)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>₹{Number(w.amount || 0).toLocaleString('en-IN')}</span>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: style.color, background: style.background, border: `1px solid ${style.border}`, padding: '0.15rem 0.55rem', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                                {style.label}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.15rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            <span>Requested {formatDateTime(w.requested_at)}</span>
                                            {w.status === 'paid' && w.paid_at && <span>Paid {formatDateTime(w.paid_at)}</span>}
                                            {w.utr_reference && <span>UTR: {w.utr_reference}</span>}
                                            {w.hold_reason && <span style={{ color: '#B45309' }}>On hold: {w.hold_reason}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem' }}>
                            No withdrawal requests yet.
                        </div>
                    )}
                </div>

                {/* History */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Earnings History</h3>

                    {earnings.length > 0 ? (
                        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                            {earnings.map(e => (
                                <div key={e.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: '1.1rem', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{e.gigTitle}</h4>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Buyer: {e.buyerName}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--peacock-green)' }}>
                                            ₹{Number(e.seller_net_amount || 0).toLocaleString('en-IN')}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Completed {formatDate(e.approved_at)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem' }}>
                            No earnings yet — completed gigs will show up here.
                        </div>
                    )}
                </div>
            </div>

            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}
