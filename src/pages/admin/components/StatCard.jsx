import React from 'react';

/**
 * StatCard — compact KPI tile for the admin dashboard (Light Theme)
 * Props: { icon, label, value, sub, color, trend, loading }
 */
export default function StatCard({ icon, label, value, sub, color = '#10B981', trend, loading }) {
    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '1.25rem 1.4rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.6rem',
            position: 'relative',
            overflow: 'hidden',
            transition: 'border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease',
            boxShadow: 'var(--shadow-sm)',
            cursor: 'default',
        }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(17, 94, 89, 0.2)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Glow blob */}
            <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 80, height: 80, borderRadius: '50%',
                background: color, opacity: 0.05, filter: 'blur(24px)',
                pointerEvents: 'none',
            }} />

            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                    fontSize: '1.4rem',
                    background: `${color}12`,
                    border: `1px solid ${color}25`,
                    borderRadius: 10,
                    width: 40, height: 40,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{icon}</span>
                {trend !== undefined && (
                    <span style={{
                        fontSize: '0.72rem', fontWeight: 700,
                        color: trend >= 0 ? '#10B981' : '#EF4444',
                        background: trend >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${trend >= 0 ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}`,
                        borderRadius: 20, padding: '0.15rem 0.5rem',
                    }}>
                        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </span>
                )}
            </div>

            {/* Value */}
            {loading ? (
                <div style={{ height: 32, width: '60%', background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
            ) : (
                <div style={{ fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {value ?? '—'}
                </div>
            )}

            {/* Label + sub */}
            <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                </div>
                {sub && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>
                )}
            </div>
        </div>
    );
}
