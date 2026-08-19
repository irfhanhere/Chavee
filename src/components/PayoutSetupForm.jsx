import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * PayoutSetupForm
 * Props:
 *   sellerProfileId  {string}   profiles.id of the seller
 *   onSuccess        {function} called with success message after 2xx from Edge Function
 *   onCancel         {function} called on "Skip for now" (omit to hide the button)
 *   submitLabel      {string}   override submit button text (default: "Set Up Payout")
 */
export default function PayoutSetupForm({ sellerProfileId, onSuccess, onCancel, submitLabel = 'Set Up Payout' }) {
    const [method, setMethod] = useState('bank'); // 'bank' | 'upi'

    const [email, setEmail] = useState('');

    const [bankForm, setBankForm] = useState({
        account_holder_name: '',
        account_number: '',
        ifsc_code: '',
        pan_number: '',
    });

    const [upiForm, setUpiForm] = useState({
        upi_vpa: '',
        pan_number: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null); // null | { success: bool, message: string }

    // Pre-fill email from the logged-in user's session, if available
    useEffect(() => {
        supabase.auth.getSession().then(({ data: sessionData }) => {
            const sessionEmail = sessionData?.session?.user?.email;
            if (sessionEmail) setEmail(sessionEmail);
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        if (!EMAIL_REGEX.test(trimmedEmail)) {
            setResult({ success: false, message: 'Please enter a valid email address.' });
            return;
        }

        setSubmitting(true);
        setResult(null);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

            const payload = method === 'bank'
                ? {
                    payout_method: 'bank',
                    seller_profile_id: sellerProfileId,
                    email: trimmedEmail,
                    account_holder_name: bankForm.account_holder_name.trim(),
                    account_number: bankForm.account_number.trim(),
                    ifsc_code: bankForm.ifsc_code.trim().toUpperCase(),
                    pan_number: bankForm.pan_number.trim().toUpperCase(),
                }
                : {
                    payout_method: 'upi',
                    seller_profile_id: sellerProfileId,
                    email: trimmedEmail,
                    upi_vpa: upiForm.upi_vpa.trim(),
                    pan_number: upiForm.pan_number.trim().toUpperCase(),
                };

            // This component is only reachable while PAYOUTS_LIVE is false-gated off
            // (see featureFlags.js) — before ever flipping that flag back to true,
            // re-verify this endpoint is still deployed and actually works end-to-end;
            // don't assume it still does just because it did the last time this ran.
            const response = await fetch(`${supabaseUrl}/functions/v1/cashfree-create-vendor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            const json = await response.json();

            if (!response.ok) {
                setResult({ success: false, message: json?.error || json?.message || `Server error (${response.status})` });
            } else {
                const msg = json?.message || "Payout setup submitted! We'll verify and activate your account.";
                setResult({ success: true, message: msg });
                if (onSuccess) onSuccess(msg);
            }
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

    // Success state
    if (result?.success) {
        return (
            <div style={{ background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 10, padding: '1.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '2.2rem' }}>&#x2705;</div>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--peacock-green)', fontSize: '0.9rem' }}>{result.message}</p>
                {onCancel && (
                    <button onClick={onCancel} className="btn-primary" style={{ marginTop: '0.25rem', padding: '0.5rem 1.5rem', borderRadius: 8, fontSize: '0.85rem' }}>Done</button>
                )}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

            {/* Method toggle */}
            <div style={{ display: 'inline-flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.25rem', gap: '0.25rem', alignSelf: 'flex-start' }}>
                {[
                    { id: 'bank', label: '\uD83C\uDFE6 Bank Account' },
                    { id: 'upi',  label: '\uD83D\uDCF1 UPI ID' },
                ].map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => { setMethod(id); setResult(null); }}
                        disabled={submitting}
                        style={{
                            padding: '0.4rem 0.9rem',
                            borderRadius: 7,
                            border: 'none',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            cursor: submitting ? 'not-allowed' : 'pointer',
                            background: method === id ? 'var(--bg-surface)' : 'transparent',
                            color: method === id ? 'var(--peacock-green)' : 'var(--text-muted)',
                            boxShadow: method === id ? 'var(--shadow-sm)' : 'none',
                            transition: 'all 0.15s',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Error banner */}
            {result?.success === false && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#EF4444', fontWeight: 600 }}>
                    &#x26A0;&#xFE0F; {result.message}
                </div>
            )}

            {/* Bank Account fields */}
            {method === 'bank' && (
                <>
                    <div style={fieldStyle}>
                        <label style={labelStyle} htmlFor="pof-holder-name">Account Holder Name *</label>
                        <input id="pof-holder-name" type="text" required placeholder="As per bank records"
                            value={bankForm.account_holder_name} onChange={e => setBankForm(f => ({ ...f, account_holder_name: e.target.value }))}
                            disabled={submitting} style={inputStyle} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div style={fieldStyle}>
                            <label style={labelStyle} htmlFor="pof-acc-number">Account Number *</label>
                            <input id="pof-acc-number" type="text" required placeholder="e.g. 001234567890"
                                value={bankForm.account_number} onChange={e => setBankForm(f => ({ ...f, account_number: e.target.value }))}
                                disabled={submitting} style={inputStyle} />
                        </div>
                        <div style={fieldStyle}>
                            <label style={labelStyle} htmlFor="pof-ifsc">IFSC Code *</label>
                            <input id="pof-ifsc" type="text" required placeholder="e.g. SBIN0001234"
                                value={bankForm.ifsc_code} onChange={e => setBankForm(f => ({ ...f, ifsc_code: e.target.value }))}
                                disabled={submitting} style={{ ...inputStyle, textTransform: 'uppercase' }} />
                        </div>
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle} htmlFor="pof-bank-pan">PAN Number *</label>
                        <input id="pof-bank-pan" type="text" required placeholder="e.g. ABCDE1234F" maxLength={10}
                            value={bankForm.pan_number} onChange={e => setBankForm(f => ({ ...f, pan_number: e.target.value }))}
                            disabled={submitting} style={{ ...inputStyle, textTransform: 'uppercase' }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>10-character PAN (e.g. ABCDE1234F)</span>
                    </div>
                </>
            )}

            {/* UPI fields */}
            {method === 'upi' && (
                <>
                    <div style={fieldStyle}>
                        <label style={labelStyle} htmlFor="pof-upi-vpa">UPI ID (VPA) *</label>
                        <input id="pof-upi-vpa" type="text" required placeholder="e.g. name@okicici"
                            value={upiForm.upi_vpa} onChange={e => setUpiForm(f => ({ ...f, upi_vpa: e.target.value }))}
                            disabled={submitting} style={inputStyle} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Your UPI handle, e.g. yourname@okaxis or 9876543210@paytm</span>
                    </div>
                    <div style={fieldStyle}>
                        <label style={labelStyle} htmlFor="pof-upi-pan">PAN Number *</label>
                        <input id="pof-upi-pan" type="text" required placeholder="e.g. ABCDE1234F" maxLength={10}
                            value={upiForm.pan_number} onChange={e => setUpiForm(f => ({ ...f, pan_number: e.target.value }))}
                            disabled={submitting} style={{ ...inputStyle, textTransform: 'uppercase' }} />
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Required for KYC verification regardless of payout method</span>
                    </div>
                </>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.1rem' }}>
                {onCancel && (
                    <button type="button" onClick={onCancel} disabled={submitting}
                        style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', cursor: submitting ? 'not-allowed' : 'pointer' }}>
                        Skip for now
                    </button>
                )}
                <button id="pof-submit-btn" type="submit" disabled={submitting} className="btn-primary"
                    style={{ flex: onCancel ? 2 : 1, padding: '0.6rem', borderRadius: 8, fontSize: '0.85rem', fontWeight: 700, opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    {submitting ? (
                        <>
                            <span style={{ width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                            Submitting...
                        </>
                    ) : submitLabel}
                </button>
            </div>
        </form>
    );
}
