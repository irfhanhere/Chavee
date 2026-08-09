import React from 'react';
import { motion } from 'framer-motion';
import { ButtonSpinner } from '../Spinner.jsx';

export function SocialLoginButton({ provider, onClick, loading, disabled, text }) {
    
    const getIcon = () => {
        if (provider === 'google') {
            return (
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
            );
        }
        if (provider === 'apple') {
            return (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.19 2.24-.86 3.44-.88 1.5-.02 2.72.69 3.49 1.74-2.91 1.76-2.4 5.86.35 7.15-.65 1.57-1.4 3.21-2.36 4.16zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.36 2.45-2.12 4.41-3.74 4.25z"/>
                </svg>
            );
        }
        return null;
    };

    return (
        <motion.button
            whileHover={!disabled && !loading ? { scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } : {}}
            whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
            onClick={onClick}
            type="button"
            disabled={disabled || loading}
            style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '12px',
                cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                color: '#111827',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                opacity: (disabled || loading) ? 0.6 : 1,
                transition: 'opacity 0.2s'
            }}
            title={disabled ? `${provider === 'apple' ? 'Apple' : provider} Login Coming Soon` : ''}
        >
            {loading ? (
                <ButtonSpinner label="Redirecting..." />
            ) : (
                <>
                    {getIcon()}
                    {text}
                </>
            )}
        </motion.button>
    );
}
