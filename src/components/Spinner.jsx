import React from 'react';

/** Reusable spinner — sizes: 'sm' | 'md' | 'lg' */
export default function Spinner({ size = 'md', color = '#10B981' }) {
    const dim = size === 'sm' ? 18 : size === 'lg' ? 48 : 32;
    const border = size === 'sm' ? 2 : size === 'lg' ? 5 : 3;
    return (
        <div style={{
            width: dim,
            height: dim,
            borderRadius: '50%',
            border: `${border}px solid rgba(255,255,255,0.12)`,
            borderTop: `${border}px solid ${color}`,
            animation: 'spin 0.85s linear infinite',
            flexShrink: 0,
        }} />
    );
}

/** Inline loading state for buttons */
export function ButtonSpinner({ label = 'Loading...' }) {
    return (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Spinner size="sm" color="#fff" />
            {label}
        </span>
    );
}

/** Full-screen loading screen */
export function PageLoader({ message = 'Loading Chavee...' }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-base)',
            gap: '1.5rem',
        }}>
            <div style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: '4px solid rgba(16,185,129,0.15)',
                borderTop: '4px solid #10B981',
                animation: 'spin 0.85s linear infinite',
            }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 500, margin: 0 }}>
                {message}
            </p>
        </div>
    );
}
