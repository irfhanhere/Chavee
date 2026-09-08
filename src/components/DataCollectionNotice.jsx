import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Short DPDP-style "what we collect and why" notice, shown at the point of
 * collection (sign-up, contact form). Full detail lives in the Privacy
 * Policy. Digital Personal Data Protection Act, 2023 expects a clear,
 * itemised notice at or before the time personal data is collected.
 */
export default function DataCollectionNotice({ variant = 'signup', style }) {
    const text =
        variant === 'contact'
            ? 'We use the name, email and message you submit here only to respond to your enquiry and keep a record of the correspondence. We don’t sell your data.'
            : 'We collect your email now, and your name and profile details during onboarding, to create and secure your account, personalise your experience, and send you service messages. We don’t sell your data.';

    return (
        <p
            style={{
                fontSize: '0.78rem',
                lineHeight: 1.5,
                color: 'var(--text-muted, #6B7280)',
                background: 'var(--bg-elevated, #F3F4F6)',
                border: '1px solid var(--border-color, #E5E7EB)',
                borderRadius: 8,
                padding: '0.6rem 0.75rem',
                margin: 0,
                ...style,
            }}
        >
            {text}{' '}
            <Link to="/privacy-policy" style={{ color: 'var(--peacock-green, #0B8F5A)', fontWeight: 600, textDecoration: 'none' }}>
                How we handle your data
            </Link>
            .
        </p>
    );
}
