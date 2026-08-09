import React from 'react';
import { motion } from 'framer-motion';

export function AuthLayout({ leftPanel, mobileHeader, children }) {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Desktop Container */}
            <div className="desktop-layout" style={{ flex: 1, display: 'flex', width: '100%' }}>
                
                {/* Left Panel (40%) - Hidden on mobile */}
                <div className="auth-left-col" style={{ 
                    flex: '0 0 40%',
                    position: 'sticky', 
                    top: 0, 
                    height: '100vh', 
                    background: 'linear-gradient(135deg, #0F7A4B 0%, #0B5E3A 100%)', 
                    color: '#FFFFFF', 
                    overflow: 'hidden',
                    display: 'none',
                    borderTopRightRadius: '32px',
                    borderBottomRightRadius: '32px',
                    boxShadow: '4px 0 24px rgba(0,0,0,0.1)'
                }}>
                    {leftPanel}
                </div>

                {/* Right Panel (60%) */}
                <div className="auth-right-col" style={{ 
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

            {/* Mobile Layout */}
            <div className="mobile-layout" style={{ display: 'none', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
                {/* Compact Top Hero */}
                <div style={{ 
                    height: '240px', 
                    background: 'linear-gradient(135deg, #0F7A4B 0%, #0B5E3A 100%)',
                    padding: '2rem 1.5rem',
                    color: '#FFFFFF'
                }}>
                    {mobileHeader}
                </div>

                {/* Overlapping Content */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginTop: '-60px', // Pull up to overlap
                    padding: '0 1rem 2rem 1rem'
                }}>
                    {children}
                </div>
            </div>
            
            <style>{`
                @media (min-width: 900px) {
                    .auth-left-col {
                        display: flex !important;
                        flex-direction: column;
                    }
                    .mobile-layout {
                        display: none !important;
                    }
                }
                @media (max-width: 899px) {
                    .desktop-layout {
                        display: none !important;
                    }
                    .mobile-layout {
                        display: flex !important;
                    }
                }
            `}</style>
        </div>
    );
}
