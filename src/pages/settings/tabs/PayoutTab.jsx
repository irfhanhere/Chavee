import React, { useState } from 'react';
import PayoutSetupForm from '../../../components/PayoutSetupForm.jsx';
import NotifyMeButton from '../../../components/NotifyMeButton.jsx';
import { PAYOUTS_LIVE } from '../../../featureFlags.js';

/**
 * PayoutTab — Settings tab for managing Cashfree payout setup.
 * Props: user, profile, setProfile, showToast
 *
 * Displays:
 *   - Connected status (green banner) if cashfree_vendor_id is set, with an
 *     "Update payout method" option to re-open the form.
 *   - Inline PayoutSetupForm if cashfree_vendor_id is null.
 *
 * When PAYOUTS_LIVE is false (see featureFlags.js), the form is replaced
 * entirely by an honest coming-soon card — cashfree-create-vendor has no
 * local source anymore, so PayoutSetupForm would just be fronting a dead
 * endpoint. This only gates the UI; PayoutSetupForm itself is untouched.
 */
export default function PayoutTab({ user, profile, setProfile, showToast }) {
    // showForm is true when vendor_id is null (auto), or forced open via "Update"
    const [showForm, setShowForm] = useState(!profile?.cashfree_vendor_id);

    if (!PAYOUTS_LIVE) {
        return (
            <div style={{ background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-mint) 100%)', padding: '2rem', borderRadius: 16, border: '1px dashed var(--border-mint)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }}>💳</span>
                    <span style={{ fontSize: '0.65rem', background: 'var(--peacock-green)', color: '#fff', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 12 }}>COMING SOON</span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900 }}>Payout Setup</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                    Manual bank/UPI payouts until Chavee Technologies LLP registers — Cashfree setup isn't available yet.
                </p>
                <NotifyMeButton user={user} featureKey="payout_setup" style={{ marginTop: '0.25rem', alignSelf: 'flex-start' }} />
            </div>
        );
    }

    const isConnected = !!profile?.cashfree_vendor_id;
    const statusLabel =
        profile?.cashfree_vendor_status === 'active' ? 'Active' :
        profile?.cashfree_vendor_status === 'pending' ? 'Pending verification' :
        profile?.cashfree_vendor_status || 'Submitted';

    const handleSuccess = (msg) => {
        showToast(msg, 'success');
        // Do not set cashfree_vendor_status from frontend — Edge Function / webhook
        // will update it. Just refresh local profile so the status label updates
        // if it was already non-null.
        setShowForm(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── Main card ────────────────────────────────────────────────── */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Payout Setup</h2>
                <p style={{ margin: '0 0 1.75rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Connect your bank account or UPI ID to receive payments when you complete a gig.
                </p>

                {/* Connected banner */}
                {isConnected && !showForm && (
                    <div style={{ background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                            <span style={{ fontSize: '1.6rem' }}>&#x2705;</span>
                            <div>
                                <p style={{ margin: 0, fontWeight: 700, color: 'var(--peacock-green)', fontSize: '0.95rem' }}>Payout method connected</p>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Status: <strong>{statusLabel}</strong>
                                    {profile?.cashfree_kyc_completed_at && (
                                        <> &middot; KYC completed {new Date(profile.cashfree_kyc_completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            Update payout method
                        </button>
                    </div>
                )}

                {/* Form — shown when not connected, or when user clicks Update */}
                {(!isConnected || showForm) && (
                    <>
                        {isConnected && showForm && (
                            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: '0.82rem', color: '#B45309', fontWeight: 600 }}>
                                &#x26A0;&#xFE0F; Updating will replace your existing payout method. Your previous details will be overwritten on Cashfree.
                            </div>
                        )}
                        <PayoutSetupForm
                            sellerProfileId={user?.id}
                            onSuccess={handleSuccess}
                            onCancel={isConnected && showForm ? () => setShowForm(false) : undefined}
                            submitLabel={isConnected ? 'Update Payout Method' : 'Set Up Payout'}
                        />
                    </>
                )}
            </div>

            {/* ── Info card ─────────────────────────────────────────────────── */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem 2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 800 }}>About payouts</h3>
                <ul style={{ margin: 0, padding: '0 0 0 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <li>Payouts are processed via Cashfree after the buyer marks a gig as complete.</li>
                    <li>KYC (PAN) is mandatory for all payout methods as per RBI guidelines.</li>
                    <li>Bank account payouts typically settle within 1–3 business days.</li>
                    <li>UPI payouts typically settle within minutes.</li>
                    <li>Your payout details are encrypted and never shared with buyers.</li>
                </ul>
            </div>

        </div>
    );
}
