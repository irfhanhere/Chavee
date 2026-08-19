import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Permissive VPA check — real UPI handles vary a lot (digits, dots, hyphens
// before the @, bank/PSP handle after) — this only rejects obviously-wrong
// input, the same light-touch level as PayoutSetupForm's EMAIL_REGEX. Real
// validity is enforced server-side by whoever actually moves the money
// (manual transfer, per the locked decision), not by this form.
const UPI_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$/;

/**
 * WithdrawRequestForm
 * Real UPI-only withdrawal request. Calls create_withdrawal_request(p_upi_id),
 * a SECURITY DEFINER RPC that scopes to auth.uid() internally and atomically
 * claims every currently-eligible gig_contracts row (status='approved',
 * payout_status='unwithdrawn', approved_at <= now()-7 days). The RPC is the
 * only source of eligibility truth — this form does not pre-compute or gate
 * anything client-side.
 *
 * Not a variant of PayoutSetupForm.jsx (that form is untouched, kept for a
 * future Cashfree-vendor flow) — this is a separate, new component that
 * reuses its UPI-field styling only.
 *
 * Props:
 *   onSuccess  {function} called with { withdrawalId, amount, contractCount }
 *              after a successful RPC call, so the parent can refresh its
 *              "My Withdrawals" list.
 */
export default function WithdrawRequestForm({ onSuccess }) {
    const [upiId, setUpiId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // null | { success: bool, message: string }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmed = upiId.trim();
        if (!UPI_REGEX.test(trimmed)) {
            setResult({ success: false, message: 'Please enter a valid UPI ID, e.g. yourname@okaxis.' });
            return;
        }

        setSubmitting(true);
        setResult(null);
        try {
            const { data, error } = await supabase.rpc('create_withdrawal_request', { p_upi_id: trimmed });

            if (error) {
                // The RPC raises a clear exception (e.g. "nothing eligible yet") —
                // surface that text directly rather than inventing a generic message.
                setResult({ success: false, message: error.message || 'Withdrawal request failed.' });
                return;
            }

            // supabase-js returns a single-row RPC result either as an object or
            // as a one-element array, depending on how the function is declared —
            // handle both rather than assuming.
            const row = Array.isArray(data) ? data[0] : data;
            const amount = Number(row?.amount) || 0;
            const contractCount = Number(row?.contract_count) || 0;
            const withdrawalId = row?.withdrawal_id;

            const msg = `Withdrawal requested: ₹${amount.toLocaleString('en-IN')} across ${contractCount} gig${contractCount === 1 ? '' : 's'}. We'll transfer to your UPI ID within 24 hours.`;
            setResult({ success: true, message: msg });
            setUpiId('');
            if (onSuccess) onSuccess({ withdrawalId, amount, contractCount });
        } catch (err) {
            setResult({ success: false, message: err.message || 'Network error — please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = {
        padding: '0.6rem 0.8rem',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        fontSize: '0.85rem',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
    };
    const labelStyle = { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem', display: 'block' };
    const fieldStyle = { display: 'flex', flexDirection: 'column', gap: '0.4rem' };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result?.success === false && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#EF4444', fontWeight: 600 }}>
                    &#x26A0;&#xFE0F; {result.message}
                </div>
            )}
            {result?.success === true && (
                <div style={{ background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 8, padding: '0.9rem 1rem', fontSize: '0.85rem', color: 'var(--peacock-green)', fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>&#x2705;</span>
                    <span>{result.message}</span>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ ...fieldStyle, flex: '1 1 220px' }}>
                    <label style={labelStyle} htmlFor="withdraw-upi-vpa">UPI ID</label>
                    <input
                        id="withdraw-upi-vpa"
                        type="text"
                        required
                        placeholder="e.g. name@okicici"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        disabled={submitting}
                        style={inputStyle}
                    />
                </div>
                <button
                    id="withdraw-submit-btn"
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ padding: '0.62rem 1.5rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                >
                    {submitting ? (
                        <>
                            <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                            Requesting...
                        </>
                    ) : 'Withdraw'}
                </button>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Your UPI handle, e.g. yourname@okaxis or 9876543210@paytm</span>
        </form>
    );
}
