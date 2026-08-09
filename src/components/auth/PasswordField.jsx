import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function PasswordField({ label = 'Password', value, onChange, placeholder = '••••••••', disabled, ...rest }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                {label}
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
                <motion.input
                    whileFocus={{ scale: 1.01, borderColor: '#0B8F5A', boxShadow: '0 0 0 3px rgba(11,143,90,0.1)' }}
                    type={showPassword ? 'text' : 'password'}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingRight: '3rem',
                        borderRadius: '12px',
                        border: '1px solid #D1D5DB',
                        background: disabled ? '#F3F4F6' : '#FFFFFF',
                        color: '#111827',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        cursor: disabled ? 'not-allowed' : 'text'
                    }}
                    {...rest}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                    style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#6B7280',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                </button>
            </div>
        </div>
    );
}
