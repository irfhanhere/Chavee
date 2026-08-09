import React from 'react';
import { motion } from 'framer-motion';

export function AuthCard({ heading, subtitle, children }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ 
                width: '100%', 
                maxWidth: '520px', 
                background: '#FFFFFF',
                borderRadius: '28px',
                padding: 'clamp(2rem, 5vw, 3rem)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB',
                margin: '0 auto'
            }}
        >
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.5rem', color: '#111827', letterSpacing: '-0.02em' }}>
                    {heading}
                </h1>
                <p style={{ color: '#6B7280', fontSize: '1.05rem', margin: 0 }}>
                    {subtitle}
                </p>
            </div>
            {children}
        </motion.div>
    );
}
