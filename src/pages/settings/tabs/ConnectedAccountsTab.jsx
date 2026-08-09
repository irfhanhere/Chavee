import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { PageLoader, ButtonSpinner } from '../../../components/Spinner.jsx';

export default function ConnectedAccountsTab({ user, showToast }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actioning, setActioning] = useState(null); // 'google', 'github', etc.

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!user) return;
            const { data, error } = await supabase.auth.getUserIdentities();
            if (error) {
                console.error('Failed to fetch identities:', error);
            } else if (data?.identities) {
                setAccounts(data.identities.map(identity => identity.provider));
            }
            setLoading(false);
        };
        fetchAccounts();
    }, [user]);

    const handleConnect = async (provider) => {
        if (provider !== 'google') {
            showToast(`${provider} connection is coming soon!`, 'info');
            return;
        }
        setActioning(provider);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: provider,
                options: {
                    redirectTo: `${window.location.origin}/profile/settings/connected-accounts`
                }
            });
            if (error) throw error;
        } catch (err) {
            showToast(err.message, 'error');
            setActioning(null);
        }
    };

    const handleDisconnect = async (provider) => {
        if (!window.confirm(`Are you sure you want to disconnect ${provider}? You will no longer be able to log in using this method.`)) return;
        
        setActioning(provider);
        try {
            const { error } = await supabase.from('connected_accounts').delete().eq('user_id', user.id).eq('provider', provider);
            if (error) throw error;
            setAccounts(accounts.filter(a => a !== provider));
            showToast(`Disconnected ${provider} successfully.`, 'success');
        } catch (err) {
            showToast(`Failed to disconnect ${provider}`, 'error');
        } finally {
            setActioning(null);
        }
    };

    if (loading) return <PageLoader message="Loading connected accounts..." />;

    const ProviderRow = ({ name, providerId, icon, comingSoon }) => {
        const isConnected = accounts.includes(providerId);
        return (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontSize: '1.8rem' }}>{icon}</div>
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {name}
                            {comingSoon && <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.1rem 0.4rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 700 }}>SOON</span>}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: isConnected ? 'var(--peacock-green)' : 'var(--text-secondary)' }}>
                            {isConnected ? 'Connected' : 'Not connected'}
                        </p>
                    </div>
                </div>
                {isConnected ? (
                    <button 
                        onClick={() => handleDisconnect(providerId)} 
                        disabled={actioning === providerId}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        {actioning === providerId ? <ButtonSpinner /> : 'Disconnect'}
                    </button>
                ) : (
                    <button 
                        onClick={() => handleConnect(providerId)} 
                        disabled={actioning === providerId}
                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        {actioning === providerId ? <ButtonSpinner /> : 'Connect'}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Connected Accounts</h2>
                <p style={{ margin: '0 0 2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Connect your social accounts to log in faster and share your achievements.</p>
                
                <ProviderRow name="Google" providerId="google" icon="🌐" />
                <ProviderRow name="GitHub" providerId="github" icon="🐙" comingSoon />
                <ProviderRow name="LinkedIn" providerId="linkedin" icon="💼" comingSoon />
                <ProviderRow name="Apple" providerId="apple" icon="🍎" comingSoon />
                <ProviderRow name="Microsoft" providerId="azure" icon="🪟" comingSoon />
            </div>
        </div>
    );
}
