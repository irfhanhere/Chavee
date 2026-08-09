import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { PageLoader } from '../components/Spinner.jsx';
import Toast, { useToast } from '../components/Toast.jsx';

const formatDate = (value) => value
    ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const WITHDRAWAL_MIN_AMOUNT = 2000;
const WITHDRAWAL_MIN_DAYS = 7;

// ─────────────────────────────────────────────────────────────────────────
// MOCK / TEMPORARY — eligibility is computed client-side from already-fetched
// contract data using a placeholder rule (7 days since approval OR ₹2000
// total, whichever comes first). This is NOT a source of truth for real
// money. When real fund-holding is implemented (Chavee actually holding
// funds instead of Cashfree settling directly to the seller), this must be
// replaced with a server-side eligibility check against actual held/settled
// balances — this function must never be trusted to gate a real payout.
// ─────────────────────────────────────────────────────────────────────────
function calculateWithdrawalEligibility(earnings) {
    const now = new Date();
    const totalEarned = earnings.reduce((sum, e) => sum + (Number(e.seller_net_amount) || 0), 0);

    // Rule: if total approved earnings already reach the ₹2000 minimum, the whole
    // amount is eligible immediately regardless of age.
    if (totalEarned >= WITHDRAWAL_MIN_AMOUNT) {
        return { eligibleAmount: totalEarned, isEligible: true, reason: null };
    }

    // Otherwise, only entries that have aged past the 7-day mark are eligible.
    const agedEntries = earnings.filter(e => {
        if (!e.approved_at) return false;
        const ageMs = now - new Date(e.approved_at);
        return ageMs >= WITHDRAWAL_MIN_DAYS * 24 * 60 * 60 * 1000;
    });
    const eligibleAmount = agedEntries.reduce((sum, e) => sum + (Number(e.seller_net_amount) || 0), 0);

    if (eligibleAmount > 0) {
        return { eligibleAmount, isEligible: true, reason: null };
    }

    // Nothing eligible yet — figure out which condition is closer: reaching ₹2000,
    // or the soonest entry crossing the 7-day mark.
    const amountShort = WITHDRAWAL_MIN_AMOUNT - totalEarned;

    let daysUntilAged = null;
    earnings.forEach(e => {
        if (!e.approved_at) return;
        const ageMs = now - new Date(e.approved_at);
        const daysRemaining = Math.ceil((WITHDRAWAL_MIN_DAYS * 24 * 60 * 60 * 1000 - ageMs) / (24 * 60 * 60 * 1000));
        if (daysRemaining > 0 && (daysUntilAged === null || daysRemaining < daysUntilAged)) {
            daysUntilAged = daysRemaining;
        }
    });

    let reason;
    if (daysUntilAged !== null && totalEarned > 0) {
        reason = `Available in ${daysUntilAged} day${daysUntilAged === 1 ? '' : 's'}`;
    } else if (amountShort > 0) {
        reason = `₹${amountShort.toLocaleString('en-IN')} more to reach ₹${WITHDRAWAL_MIN_AMOUNT.toLocaleString('en-IN')} minimum`;
    } else {
        reason = 'No earnings yet';
    }

    return { eligibleAmount: 0, isEligible: false, reason };
}

export default function Earnings() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState([]);

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

    // ─────────────────────────────────────────────────────────────────────
    // MOCK / TEMPORARY — no real payout is triggered here, just a preview
    // toast. When real fund-holding is implemented, this must call a real
    // withdrawal-request endpoint/Edge Function instead of showing a toast.
    // ─────────────────────────────────────────────────────────────────────
    const handleWithdrawRequest = () => {
        showToast("Withdrawal requests aren't live yet — this is a preview of how it'll work.", 'info');
    };

    if (loading) return <PageLoader message="Loading earnings..." />;

    const totalEarned = earnings.reduce((sum, e) => sum + (Number(e.seller_net_amount) || 0), 0);
    const { eligibleAmount, isEligible, reason } = calculateWithdrawalEligibility(earnings);

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
                        This is a record of what you've earned from completed gigs — not a spendable balance. Actual bank/UPI settlement happens on Cashfree's payout schedule, based on the payout details you've set up.
                    </p>
                </div>

                {/* Withdraw section — MOCK / TEMPORARY, no real payout wired up yet */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Withdraw</h3>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#B45309', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', padding: '0.15rem 0.55rem', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            Preview — not live
                        </span>
                    </div>
                    <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        This is a preview of how withdrawals will work once available. Clicking the button below does not move any real money.
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem' }}>Withdrawable</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isEligible ? 'var(--peacock-green)' : 'var(--text-muted)' }}>
                                ₹{eligibleAmount.toLocaleString('en-IN')}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <button
                                onClick={handleWithdrawRequest}
                                disabled={!isEligible}
                                className="btn-primary"
                                style={{ padding: '0.6rem 1.25rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, opacity: isEligible ? 1 : 0.5, cursor: isEligible ? 'pointer' : 'not-allowed' }}
                            >
                                {isEligible ? `Withdraw ₹${eligibleAmount.toLocaleString('en-IN')}` : 'Withdraw'}
                            </button>
                            {!isEligible && reason && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{reason}</span>
                            )}
                        </div>
                    </div>
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
