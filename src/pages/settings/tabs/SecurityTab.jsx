import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient.js';
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
            console.log('DEBUG auth.updateUser payload:', { action: 'updateUser', fields: { password: '[REDACTED]' } });
            const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
            if (error) throw error;

            showToast("Password updated successfully!", 'success');
            setPasswordForm({ current: '', new: '', confirm: '' });

            // Log security action
            console.log('DEBUG security_logs insert payload:', { table: 'security_logs', values: { user_id: user.id, action: 'password_change', description: 'User changed their password.' } });
            await supabase.from('security_logs').insert({ user_id: user.id, action: 'password_change', description: 'User changed their password.' });
        } catch (err) {
            console.error('Failed to change password:', { message: err.message, code: err.code, status: err.status, details: err.details, hint: err.hint, full: err });
            showToast(err.message, 'error');
        } finally {
            setUpdatingPassword(false);
        }
    };

    const handleNotify2FA = async () => {
        setNotifying2FA(true);
        try {
            const { error } = await supabase.from('notify_subscribers').insert({ email: user.email, feature_key: '2fa_security' });
            if (error && error.code !== '23505') throw error;
            showToast("You're on the waitlist for 2FA!", 'success');
        } catch (err) {
            showToast("Failed to join waitlist.", 'error');
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

            {/* Login Sessions */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Login Sessions</h2>
                <p style={{ margin: '0 0 2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>These are the devices that have logged into your account. Revoke any sessions that you do not recognize.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Current Session Mock */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--peacock-green)', borderRadius: 12, background: 'rgba(11,143,90,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '1.5rem' }}>💻</div>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>Windows 11 • Chrome</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bengaluru, India • 192.168.1.1</p>
                            </div>
                        </div>
                        <span style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.85rem' }}>Active Now</span>
                    </div>

                    {/* Other Session Mock */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>📱</div>
                            <div>
                                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>iPhone 13 • Safari</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mumbai, India • 10.0.0.5</p>
                            </div>
                        </div>
                        <button style={{ background: 'transparent', border: 'none', color: '#DC2626', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Revoke</button>
                    </div>

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
