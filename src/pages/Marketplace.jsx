import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';
import useNotifyMe from '../hooks/useNotifyMe.js';

export default function Marketplace() {
    const { toast, showToast } = useToast();
    const [user, setUser] = useState(null);
    const { notifiedFeatures, loadingFeatures, toggleNotify } = useNotifyMe(user);
    const featureKey = 'marketplace';
    const hasSubscribed = notifiedFeatures.has(featureKey);
    const submitting = loadingFeatures.has(featureKey);
    const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
    const [loadingFlag, setLoadingFlag] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        getSession();
        
        const fetchFeatureFlag = async () => {
            try {
                const { data, error } = await supabase
                    .from('feature_flags')
                    .select('enabled, is_enabled')
                    .eq('name', 'marketplace')
                    .single();
                    
                if (data && (data.enabled || data.is_enabled)) {
                    setIsFeatureEnabled(true);
                }
            } catch (err) {
                // Ignore missing flags for now, defaults to false
            } finally {
                setLoadingFlag(false);
            }
        };
        
        fetchFeatureFlag();
    }, []);

    const handleNotifyMe = async () => {
        if (!user) {
            showToast('Please log in to be notified.', 'error');
            return;
        }
        try {
            const isSubscribed = await toggleNotify(featureKey);
            if (isSubscribed) {
                showToast("You're on the list! We'll notify you when Marketplace launches.", 'success');
            } else if (isSubscribed === false) {
                showToast("Removed from waitlist.", 'success');
            }
        } catch (err) {
            showToast('Something went wrong. Please try again.', 'error');
        }
    };

    if (loadingFlag) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;
    }

    if (isFeatureEnabled) {
        return (
            <div style={{ padding: '2rem' }}>
                <h1 style={{ margin: '0 0 1rem', fontSize: '1.5rem', fontWeight: 900 }}>Marketplace</h1>
                <p>Welcome to the Marketplace! (Coming in a future update)</p>
            </div>
        );
    }

    // "Coming Soon" State (matches Study Sync pattern)
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            <div style={{ animation: 'fadeInUp 0.3s ease-out', maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
                
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '50%', width: 80, height: 80, fontSize: '2.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    🛒
                </div>
                
                <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 900 }}>Marketplace</h1>
                <p style={{ margin: '0 auto 1.5rem', color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, lineHeight: 1.5 }}>
                    Buy and sell notes, PDFs, used laptops, and other items within your campus network.
                </p>
                
                <span style={{ display: 'inline-block', padding: '0.35rem 1rem', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 800, fontSize: '0.85rem', borderRadius: 20, border: '1px solid rgba(245,158,11,0.2)', marginBottom: '2.5rem' }}>
                    🚀 Coming Soon
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', textAlign: 'left', marginBottom: '3rem' }}>
                    <FeatureCard icon="📚" title="Study Material" desc="Buy and sell class notes and textbook PDFs." />
                    <FeatureCard icon="💻" title="Used Electronics" desc="Find deals on laptops and tablets from seniors." />
                    <FeatureCard icon="🤝" title="Safe Exchange" desc="Meet on campus for secure and trusted transactions." />
                    <FeatureCard icon="💸" title="Zero Commission" desc="Keep 100% of what you earn." />
                </div>

                <div style={{ padding: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, boxShadow: 'var(--shadow-md)' }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Want early access?</h3>
                    <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join the waitlist to be the first to know when we launch.</p>
                    <button 
                        onClick={handleNotifyMe}
                        disabled={submitting || hasSubscribed}
                        style={{
                            padding: '0.8rem 2rem', borderRadius: 12, border: 'none', background: hasSubscribed ? 'var(--bg-mint)' : 'var(--peacock-green)', 
                            color: hasSubscribed ? 'var(--peacock-green)' : '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: hasSubscribed ? 'default' : 'pointer', transition: 'all 0.2s', width: '100%', maxWidth: 300
                        }}
                    >
                        {submitting ? <ButtonSpinner label="Joining..." /> : hasSubscribed ? '✓ You are on the list' : 'Notify Me'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
            <h4 style={{ margin: '0 0 0.35rem', fontWeight: 800, fontSize: '0.95rem' }}>{title}</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{desc}</p>
        </div>
    );
}
