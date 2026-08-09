import React, { useEffect } from 'react';

const ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
const BORDER_COLORS = {
    success: 'rgba(16,185,129,0.4)',
    error: 'rgba(239,68,68,0.4)',
    info: 'rgba(59,130,246,0.4)',
    warning: 'rgba(245,158,11,0.4)',
};

/**
 * Toast — floating notification
 * Props: { message, type, show, onHide }
 * type: 'success' | 'error' | 'info' | 'warning'
 */
export default function Toast({ message, type = 'success', show, onHide }) {
    useEffect(() => {
        if (!show) return;
        const t = setTimeout(() => onHide?.(), 4000);
        return () => clearTimeout(t);
    }, [show, message]);

    if (!show) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 99999,
            background: 'rgba(15,23,42,0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${BORDER_COLORS[type] || BORDER_COLORS.success}`,
            borderRadius: '12px',
            padding: '0.9rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            maxWidth: '380px',
            animation: 'slideUp 0.3s ease-out',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}>
            <span style={{ fontSize: '1.1rem' }}>{ICONS[type]}</span>
            <span style={{ color: '#F1F5F9', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.4 }}>
                {message}
            </span>
            <button
                onClick={onHide}
                style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0 0.25rem',
                    lineHeight: 1,
                }}
            >×</button>
        </div>
    );
}

/**
 * useToast — toast state manager hook
 * Returns { toast, showToast, hideToast }
 */
export function useToast() {
    const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });

    const showToast = React.useCallback((message, type = 'success') => {
        setToast({ show: true, message, type });
    }, []);

    const hideToast = React.useCallback(() => {
        setToast(t => ({ ...t, show: false }));
    }, []);

    return { toast, showToast, hideToast };
}
