import React from 'react';

/**
 * ConfirmDialog — modal for destructive-action confirmation (Light Theme)
 * Props: { open, title, message, confirmLabel, onConfirm, onCancel, loading }
 */
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }) {
    if (!open) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
        }} onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-coral)',
                borderRadius: 16,
                padding: '1.75rem',
                width: '100%', maxWidth: 400,
                animation: 'adminModalIn 0.2s ease-out',
                boxShadow: 'var(--shadow-lg)',
            }}>
                {/* Icon */}
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.4rem', marginBottom: '1rem',
                }}>🗑️</div>

                <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                    {title}
                </h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.55 }}>
                    {message}
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            padding: '0.6rem 1.25rem', borderRadius: 9,
                            background: 'transparent', border: '1px solid var(--border-color)',
                            color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                        }}
                    >Cancel</button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.6rem 1.25rem', borderRadius: 9,
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.25)',
                            color: '#EF4444', fontWeight: 700, fontSize: '0.875rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1,
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                        }}
                    >
                        {loading && <span style={{
                            width: 14, height: 14, border: '2px solid #EF4444',
                            borderTopColor: 'transparent', borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite', display: 'inline-block',
                        }} />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
