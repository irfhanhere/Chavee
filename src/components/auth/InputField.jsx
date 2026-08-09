import React from 'react';
import { motion } from 'framer-motion';

export function InputField({ label, type = 'text', value, onChange, placeholder, disabled, icon, onFocus, onBlur, ...rest }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
                {label}
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
                {icon && (
                    <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
                        {icon}
                    </div>
                )}
                <motion.input
                    whileFocus={{ scale: 1.01, borderColor: '#0B8F5A', boxShadow: '0 0 0 3px rgba(11,143,90,0.1)' }}
                    type={type}
                    value={value}
                    onChange={onChange}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{
                        width: '100%',
                        padding: '0.875rem 1rem',
                        paddingLeft: icon ? '2.75rem' : '1rem',
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
            </div>
        </div>
    );
}
