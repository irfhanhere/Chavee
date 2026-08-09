import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useToast } from './Toast.jsx';
import { ButtonSpinner } from './Spinner.jsx';

export default function NotifyMeButton({ user, featureKey, className, style, fullWidth = false }) {
    const { showToast } = useToast();
    const [status, setStatus] = useState('idle'); // idle, loading, subscribed
    const [isSubscribed, setIsSubscribed] = useState(false);

    useEffect(() => {
        if (!user || !featureKey) return;
        let isMounted = true;

        async function checkStatus() {
            try {
                const { data, error } = await supabase
                    .from('notify_subscribers')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('feature_key', featureKey)
                    .maybeSingle();
                
                if (error && error.code !== 'PGRST116') throw error; // ignore 0 rows
                if (isMounted && data) {
                    setIsSubscribed(true);
                }
            } catch (err) {
                console.error("Error checking notify status:", err);
            }
        }
        checkStatus();

        return () => { isMounted = false; };
    }, [user, featureKey]);

    const handleToggle = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            showToast('Please log in to get notified.', 'error');
            return;
        }

        setStatus('loading');
        try {
            if (isSubscribed) {
                const { error } = await supabase
                    .from('notify_subscribers')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('feature_key', featureKey);
                if (error) throw error;
                setIsSubscribed(false);
                showToast('Notification cancelled.', 'success');
            } else {
                const { error } = await supabase
                    .from('notify_subscribers')
                    .insert({
                        user_id: user.id,
                        email: user.email,
                        feature_key: featureKey
                    });
                if (error && error.code !== '23505') throw error; // ignore unique violation
                setIsSubscribed(true);
                showToast('You are on the list!', 'success');
            }
        } catch (err) {
            console.error("Toggle notify error:", err);
            showToast('An error occurred. Please try again.', 'error');
        } finally {
            setStatus('idle');
        }
    };

    const baseStyle = {
        padding: '0.6rem 1.2rem',
        borderRadius: '8px',
        fontWeight: 700,
        fontSize: '0.85rem',
        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
        border: 'none',
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: fullWidth ? '100%' : 'auto',
        ...style
    };

    const subscribedStyle = {
        background: 'rgba(16,185,129,0.1)',
        color: '#10B981',
        border: '1px solid rgba(16,185,129,0.3)',
    };

    const unsubscribedStyle = {
        background: 'var(--peacock-green, #0B8F5A)',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(11,143,90,0.2)',
    };

    const currentStyle = { ...baseStyle, ...(isSubscribed ? subscribedStyle : unsubscribedStyle) };

    return (
        <button 
            className={className} 
            style={currentStyle} 
            onClick={handleToggle}
            disabled={status === 'loading'}
        >
            {status === 'loading' ? (
                <ButtonSpinner label="..." />
            ) : isSubscribed ? (
                '✓ Notified — Cancel'
            ) : (
                '🔔 Notify Me'
            )}
        </button>
    );
}
