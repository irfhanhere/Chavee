import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_INFO, hasChosen, acceptAll, rejectAll, setConsent } from '../utils/cookieConsent.js';

/**
 * Cookie consent banner. Reject-all is the default (and the most prominent
 * dismissal): nothing beyond "essential" is stored until the user opts in.
 * "Customize" exposes per-category toggles. Re-openable from the footer
 * ("Cookie settings" -> openCookieSettings()).
 */
export default function CookieConsent() {
    const [visible, setVisible] = useState(() => !hasChosen());
    const [customOpen, setCustomOpen] = useState(false);
    const [draft, setDraft] = useState({ functional: false, analytics: false });

    useEffect(() => {
        const reopen = () => {
            setDraft({ functional: false, analytics: false });
            setCustomOpen(false);
            setVisible(true);
        };
        window.addEventListener('chavee:open-cookie-settings', reopen);
        return () => window.removeEventListener('chavee:open-cookie-settings', reopen);
    }, []);

    if (!visible) return null;

    const close = () => setVisible(false);

    return (
        <div
            role="dialog"
            aria-label="Cookie consent"
            aria-live="polite"
            style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99998,
                background: '#0F172A',
                color: '#F8FAFC',
                borderTop: '1px solid #1E293B',
                boxShadow: '0 -6px 24px rgba(0,0,0,0.3)',
                font: "400 0.85rem/1.5 'Inter', system-ui, sans-serif",
            }}
        >
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, flex: '1 1 320px', minWidth: 0 }}>
                        Chavee uses only essential storage to keep you signed in and protect forms.
                        We&rsquo;d also like your consent for functional and analytics storage.
                        See our <Link to="/cookie-policy" style={{ color: '#5EEAD4', fontWeight: 600 }}>Cookie Policy</Link>.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                        <button
                            onClick={() => { rejectAll(); close(); }}
                            style={btn('#F8FAFC', 'transparent', '1px solid #475569')}
                        >
                            Reject all
                        </button>
                        <button
                            onClick={() => setCustomOpen((v) => !v)}
                            style={btn('#F8FAFC', 'transparent', '1px solid #475569')}
                        >
                            {customOpen ? 'Hide options' : 'Customize'}
                        </button>
                        <button
                            onClick={() => { acceptAll(); close(); }}
                            style={btn('#0F172A', '#5EEAD4', 'none')}
                        >
                            Accept all
                        </button>
                    </div>
                </div>

                {customOpen && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid #1E293B', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {CATEGORY_INFO.map((c) => (
                            <label key={c.key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: c.locked ? 'default' : 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={c.locked ? true : draft[c.key]}
                                    disabled={c.locked}
                                    onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.checked }))}
                                    style={{ marginTop: 3, flexShrink: 0 }}
                                />
                                <span>
                                    <strong style={{ color: '#F8FAFC' }}>{c.label}</strong>
                                    {c.locked && <span style={{ color: '#94A3B8' }}> — always on</span>}
                                    <br />
                                    <span style={{ color: '#CBD5E1' }}>{c.description}</span>
                                </span>
                            </label>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setConsent(draft); close(); }}
                                style={btn('#0F172A', '#5EEAD4', 'none')}
                            >
                                Save choices
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function btn(color, background, border) {
    return {
        color,
        background,
        border,
        borderRadius: 8,
        padding: '0.5rem 0.9rem',
        fontWeight: 700,
        fontSize: '0.8rem',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    };
}
