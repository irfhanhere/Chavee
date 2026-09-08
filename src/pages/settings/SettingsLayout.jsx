import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import { useAuth } from '../../hooks/useAuth.js';
import Toast, { useToast } from '../../components/Toast.jsx';
import { PageLoader } from '../../components/Spinner.jsx';

import AccountTab from './tabs/AccountTab.jsx';
import SecurityTab from './tabs/SecurityTab.jsx';
import NotificationsTab from './tabs/NotificationsTab.jsx';
import PrivacyTab from './tabs/PrivacyTab.jsx';
import PreferencesTab from './tabs/PreferencesTab.jsx';
import ConnectedAccountsTab from './tabs/ConnectedAccountsTab.jsx';
import DangerZoneTab from './tabs/DangerZoneTab.jsx';
import PayoutTab from './tabs/PayoutTab.jsx';

export default function SettingsLayout() {
    const navigate = useNavigate();
    const { tab } = useParams();
    const { toast, showToast, hideToast } = useToast();
    
    const { user } = useAuth();   // session guarded upstream by <RequireAuth>
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const activeTab = tab || 'account';

    useEffect(() => {
        if (!user) return;
        let cancelled = false;
        (async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (cancelled) return;
            if (data) setProfile(data);
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, [user]);

    const handleLogout = async () => {
        if (window.confirm("Are you sure you want to log out?")) {
            await supabase.auth.signOut();
            navigate('/login');
        }
    };

    if (loading) return <PageLoader message="Loading settings..." />;

    const tabs = [
        { id: 'account', label: 'Account' },
        { id: 'security', label: 'Security' },
        { id: 'notifications', label: 'Notifications' },
        { id: 'privacy', label: 'Privacy' },
        { id: 'preferences', label: 'Preferences' },
        { id: 'connected-accounts', label: 'Connected Accounts' },
        { id: 'payout', label: 'Payout Setup' },
        { id: 'danger-zone', label: 'Danger Zone' },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem', display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            {/* Main Content */}
            <div style={{ flex: '1 1 600px', minWidth: 0 }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>Settings</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage your account, preferences and privacy settings.</p>
                </div>

                {/* Tabs */}
                <div className="hide-scrollbar" style={{
                    display: 'flex',
                    gap: '2rem',
                    borderBottom: '1px solid var(--border-color)',
                    marginBottom: '2rem',
                    overflowX: 'auto'
                }}>
                    {tabs.map(t => (
                        <Link 
                            key={t.id}
                            to={`/profile/settings/${t.id}`}
                            style={{
                                padding: '0.75rem 0',
                                color: activeTab === t.id ? 'var(--peacock-green)' : 'var(--text-secondary)',
                                fontWeight: activeTab === t.id ? 700 : 500,
                                textDecoration: 'none',
                                borderBottom: activeTab === t.id ? '2px solid var(--peacock-green)' : '2px solid transparent',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {t.label}
                        </Link>
                    ))}
                </div>

                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    {activeTab === 'account' && <AccountTab user={user} profile={profile} setProfile={setProfile} showToast={showToast} />}
                    {activeTab === 'security' && <SecurityTab user={user} showToast={showToast} />}
                    {activeTab === 'notifications' && <NotificationsTab user={user} showToast={showToast} />}
                    {activeTab === 'privacy' && <PrivacyTab user={user} showToast={showToast} />}
                    {activeTab === 'preferences' && <PreferencesTab user={user} showToast={showToast} />}
                    {activeTab === 'connected-accounts' && <ConnectedAccountsTab user={user} showToast={showToast} />}
                    {activeTab === 'payout' && <PayoutTab user={user} profile={profile} setProfile={setProfile} showToast={showToast} />}
                    {activeTab === 'danger-zone' && <DangerZoneTab user={user} showToast={showToast} />}
                    
                    {!tabs.find(t => t.id === activeTab) && <Navigate to="/profile/settings/account" replace />}
                </div>
            </div>

            {/* Right Sidebar */}
            <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Quick Settings */}
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Quick Settings</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <Link to="/profile/settings/security" style={styles.quickLink}>🔒 Change Password <span>›</span></Link>
                        <Link to="/profile/settings/notifications" style={styles.quickLink}>✉️ Email Preferences <span>›</span></Link>
                        <Link to="/profile/settings/notifications" style={styles.quickLink}>🔔 Notification Settings <span>›</span></Link>
                        <Link to="/profile/settings/privacy" style={styles.quickLink}>🛡️ Privacy Settings <span>›</span></Link>
                    </div>
                </div>

                {/* Subscription Card */}
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>👑</div>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Subscription</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Plans and premium features are coming soon.</p>
                </div>

                {/* Help & Support */}
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Help & Support</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <Link to="/help" style={styles.quickLink}>❓ Visit Help Center <span>›</span></Link>
                        <Link to="/contact-us" style={styles.quickLink}>💬 Contact Support <span>›</span></Link>
                        <Link to="/contact-us" style={styles.quickLink}>💡 Submit Feedback <span>›</span></Link>
                        <Link to="/contact-us" style={styles.quickLink}>⚙️ Report a Bug <span>›</span></Link>
                    </div>
                </div>

                {/* Logout */}
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px solid #FCA5A5', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>↪</span> Logout
                    </h3>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sign out from your Chavee account.</p>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
                        <span>↪</span> Logout
                    </button>
                </div>

            </div>

            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}

const styles = {
    quickLink: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        textDecoration: 'none',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
        borderRadius: 8,
        transition: 'background 0.2s',
        fontWeight: 500
    }
};
