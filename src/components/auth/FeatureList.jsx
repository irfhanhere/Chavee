import React from 'react';

// features defaults to [] — ForgotPassword.jsx and ResetPassword.jsx were
// both calling <BrandPanel> with no features prop at all, and this used to
// crash on features.map() with no error boundary on these routes (confirmed
// live: real blank white page, real uncaught TypeError). Both callers now
// pass real content too (see their own files), but this default stays as a
// second line of defense against any future caller doing the same thing.
export function FeatureList({ features = [] }) {
    return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '1.15rem', opacity: 0.9 }}>
            {features.map((feature, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        background: 'rgba(255,255,255,0.1)', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.2rem'
                    }}>
                        {feature.icon}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: '0.1rem' }}>{feature.heading}</div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>{feature.description}</div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
