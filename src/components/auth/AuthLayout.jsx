import React from 'react';
import { useIsMobile } from '../../hooks/useIsMobile.js';

/**
 * AuthLayout — single-branch render (JS, via useIsMobile), not the old
 * dual-render-plus-CSS-display-toggle approach. The old version rendered
 * BOTH the desktop layout (leftPanel + children) AND the mobile layout
 * (mobileHeader + children) unconditionally, hiding one with CSS media
 * queries — which meant `children` (the actual AuthCard form: real
 * inputs, real <form>, real h1) existed in the DOM TWICE simultaneously,
 * not just the decorative headings. Same useIsMobile() pattern Landing.jsx
 * already uses for its own desktop/mobile split. 899/900px matches this
 * layout's original CSS breakpoint exactly.
 */
export function AuthLayout({ leftPanel, mobileHeader, children }) {
    const isMobile = useIsMobile(899);

    if (isMobile) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
                <div style={{
                    height: '240px',
                    background: 'linear-gradient(135deg, #0F7A4B 0%, #0B5E3A 100%)',
                    padding: '2rem 1.5rem',
                    color: '#FFFFFF'
                }}>
                    {mobileHeader}
                </div>
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '-60px',
                    padding: '0 1rem 2rem 1rem'
                }}>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            <div style={{ flex: 1, display: 'flex', width: '100%' }}>
                <div style={{
                    flex: '0 0 40%',
                    position: 'sticky',
                    top: 0,
                    height: '100vh',
                    background: 'linear-gradient(135deg, #0F7A4B 0%, #0B5E3A 100%)',
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    borderTopRightRadius: '32px',
                    borderBottomRightRadius: '32px',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
                }}>
                    {leftPanel}
                </div>
                <div style={{
                    flex: '1 1 60%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    overflowY: 'auto'
                }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
