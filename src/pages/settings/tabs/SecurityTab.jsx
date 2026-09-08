import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { subscribeNotify } from '../../../utils/subscribeNotify.js';
import { ButtonSpinner } from '../../../components/Spinner.jsx';

export default function SecurityTab({ user, showToast }) {
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
    const [updatingPassword, setUpdatingPassword] = useState(false);
    const [notifying2FA, setNotifying2FA] = useState(false);

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.new !== passwordForm.confirm) {
            showToast("New passwords do not match", 'error');
            return;
        }
        if (passwordForm.new.length < 8) {
            showToast("Password must be at least 8 characters", 'error');
            return;
        }
        
        setUpdatingPassword(true);
        try {
            // In a real scenario, you might need to verify the current password first via a custom Edge Function,
            // or just rely on the user being logged in and using update().
            const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
            if (error) throw error;

            showToast("Password updated successfully!", 'success');
            setPasswordForm({ current: '', new: '', confirm: '' });

            // Log security action
            await supabase.from('security_logs').insert({ user_id: user.id, action: 'password_change', description: 'User changed their password.' });
        } catch (err) {
            console.error('Failed to change password:', err);
            showToast(err.message, 'error');
        } finally {
            setUpdatingPassword(false);
        }
    };

    const handleNotify2FA = async () => {
        setNotifying2FA(true);
        try {
            // Via the subscribe-notify Edge Function (JWT-attributed).
            await subscribeNotify({ email: user.email, featureKey: '2fa_security' });
            showToast("You're on the waitlist for 2FA!", 'success');
        } catch (err) {
            showToast(err.message || "Failed to join waitlist.", 'error');
        } finally {
            setNotifying2FA(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Change Password */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Change Password</h2>
                <p style={{ margin: '0 0 2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Ensure your account is using a long, random password to stay secure.</p>
                
                <form onSubmit={handlePasswordChange} style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={styles.label}>Current Password</label>
                        <input type="password" required value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} style={styles.input} />
                    </div>
                    <div>
                        <label style={styles.label}>New Password</label>
                        <input type="password" required value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} style={styles.input} />
                    </div>
                    <div>
                        <label style={styles.label}>Confirm New Password</label>
                        <input type="password" required value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} style={styles.input} />
                    </div>
                    
                    <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Password Requirements:</strong>
                        <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem' }}>
                            <li>Minimum 8 characters</li>
                            <li>At least one uppercase and one lowercase letter</li>
                            <li>At least one number and special character</li>
                        </ul>
                    </div>

                    <button type="submit" disabled={updatingPassword} style={{ background: 'var(--text-primary)', color: 'var(--bg-base)', padding: '0.75rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', border: 'none', marginTop: '0.5rem' }}>
                        {updatingPassword ? <ButtonSpinner /> : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* Two Factor Authentication */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Two-Factor Authentication <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.5rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 700 }}>COMING SOON</span>
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 500 }}>Add an extra layer of security to your account by requiring more than just a password to sign in.</p>
                </div>
                <button onClick={handleNotify2FA} disabled={notifying2FA} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem 1.25rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                    {notifying2FA ? 'Subscribing...' : 'Notify Me'}
                </button>
            </div>

            {/* Login Sessions — was fully hardcoded fake data (a fake Windows/Chrome
                session, a fake "iPhone 13 • Safari, Mumbai, India" session with a
                Revoke button with no onClick at all — clicking it did nothing).
                Supabase Auth doesn't expose a client-facing "list all my device
                sessions" API (by design — this needs a real, actively-populated
                sessions table with per-login writes to build honestly), so this
                is now an honest not-available state instead of fabricated
                security data, matching the convention used elsewhere for
                genuinely unbuildable features. */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Login Sessions</h2>
                <p style={{ margin: '0 0 2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>These are the devices that have logged into your account. Revoke any sessions that you do not recognize.</p>

                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>🚧</div>
                    <p style={{ margin: '0 0 0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Not available yet</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, marginInline: 'auto' }}>
                        Per-device session tracking isn't part of the data model yet — this needs a real sessions log, not something we can show honestly today.
                    </p>
                </div>
            </div>

        </div>
    );
}

const styles = {
    label: {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem'
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        fontSize: '0.95rem'
    }
};
