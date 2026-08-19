import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * UpdatePrompt — real service-worker update UX, user-initiated by design
 * (registerType: 'prompt' in vite.config.js, not 'autoUpdate').
 *
 * Deliberately mirrors the copy/tone of ErrorBoundary.jsx's chunk-load-
 * failure message ("A new version of Chavee is available") — same real
 * problem (this tab is running a stale build), surfaced by two different,
 * complementary mechanisms:
 *   - ErrorBoundary: catches a *failed* dynamic import (a chunk the
 *     server no longer has) — the fallback for the rarer case where no
 *     service worker is controlling the page yet (first visit, or SW
 *     registration failed) and the browser goes straight to the network.
 *   - This component: once a service worker IS active, precached chunks
 *     keep loading successfully from the SW's own cache even after a
 *     deploy (so ErrorBoundary's case mostly stops happening for repeat
 *     visitors) — instead, the SW itself detects a new version in the
 *     background and this prompt asks the user to reload on their own
 *     terms, rather than silently reloading out from under them.
 */
export default function UpdatePrompt() {
    const {
        needRefresh: [needRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisterError(error) {
            console.error('Service worker registration failed:', error);
        },
    });

    if (!needRefresh) return null;

    return (
        <div
            role="status"
            style={{
                position: 'fixed',
                bottom: '1.25rem',
                right: '1.25rem',
                zIndex: 99999,
                background: 'var(--bg-surface, #0f172a)',
                border: '1px solid var(--border-mint, #10B981)',
                borderRadius: 14,
                padding: '1rem 1.25rem',
                maxWidth: 340,
                boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                animation: 'fadeInUp 0.3s ease-out',
                color: '#fff',
            }}
        >
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🚀</span>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                    A new version of Chavee is available
                </div>
                <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                    Reload to get the latest version.
                </p>
                <button
                    onClick={() => updateServiceWorker(true)}
                    style={{
                        padding: '0.45rem 1rem',
                        borderRadius: 8,
                        background: '#10B981',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                    }}
                >
                    Reload
                </button>
            </div>
        </div>
    );
}
