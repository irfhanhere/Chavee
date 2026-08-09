import React from 'react';
import { Link } from 'react-router-dom';

export function AuthFooter({ text, linkText, linkTo }) {
    return (
        <p style={{ textAlign: 'center', marginTop: '2.5rem', color: '#6B7280', fontSize: '0.95rem' }}>
            {text}{' '}
            <Link to={linkTo} style={{ color: '#0B8F5A', fontWeight: 700, textDecoration: 'none' }}>
                {linkText}
            </Link>
        </p>
    );
}
