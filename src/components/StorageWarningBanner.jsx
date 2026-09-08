import React, { useEffect, useState } from 'react';
import { isAuthStoragePersistent } from '../supabaseClient.js';

/**
 * Shown only when the browser is blocking persistent storage, so the
 * Supabase auth session cannot survive a reload. Common in iOS Safari
 * with tracking protection and in Instagram / Snapchat in-app browsers.
 * Dismissible for the tab (dismissal is best-effort — sessionStorage may
 * also be blocked).
 */
export default function StorageWarningBanner() {
    const [blocked, setBlocked] = useState(() => !isAuthStoragePersistent());
    const [dismissed, setDismissed] = useState(() => {
        try { return sessionStorage.getItem('chavee_storage_warning_dismissed') === '1'; }
        catch { return false; }
    });

    useEffect(() => {
        const onUnavailable = () => setBlocked(true);
        window.addEventListener('chavee:auth-storage-unavailable', onUnavailable);
        return () => window.removeEventListener('chavee:auth-storage-unavailable', onUnavailable);
    }, []);

    if (!blocked || dismissed) return null;

    const dismiss = () => {
        setDismissed(true);
        try { sessionStorage.setItem('chavee_storage_warning_dismissed', '1'); } catch { /* noop */ }
    };

    return (
        <div
            role="alert"
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 100000,
                background: '#7C2D12',
                color: '#fff',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                font: '500 0.85rem/1.4 system-ui, -apple-system, sans-serif',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.25)',
            }}
        >
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }} aria-hidden="true">⚠️</span>
            <span style={{ flex: 1 }}>
                Your browser is blocking site storage, so you&rsquo;ll be signed out when you
                refresh or switch away from this tab. To stay signed in, open{' '}
                <strong>chavee.in</strong> directly in Safari or Chrome, or turn off
                &ldquo;Prevent Cross-Site Tracking&rdquo; for this site.
            </span>
            <button
                onClick={dismiss}
                aria-label="Dismiss"
                style={{
                    flexShrink: 0,
                    background: 'rgba(255,255,255,0.15)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '0.35rem 0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                }}
            >
                Dismiss
            </button>
        </div>
    );
}
