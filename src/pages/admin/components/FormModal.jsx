import React, { useState, useEffect } from 'react';

/**
 * FormModal — generic create/edit modal driven by a fields config
 * 
 * Props:
 *   open: bool
 *   title: string
 *   fields: [{
 *     key: string,
 *     label: string,
 *     type: 'text' | 'textarea' | 'number' | 'url' | 'select' | 'toggle' | 'emoji' | 'month' | 'datetime-local',
 *     placeholder?: string,
 *     options?: [{ value, label }]  (for select)
 *     required?: bool
 *     hint?: string
 *     condition?: (values) => bool  (conditional rendering)
 *   }]
 *   initialValues: { [key]: value }
 *   onSubmit: (values) => Promise<void>
 *   onClose: () => void
 *   submitLabel?: string
 *   loading?: bool
 */
export default function FormModal({
    open, title, fields = [], initialValues = {},
    onSubmit, onClose, submitLabel = 'Save', loading = false,
}) {
    const [values, setValues] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (open) {
            setValues({ ...initialValues });
            setErrors({});
        }
    }, [open, JSON.stringify(initialValues)]);

    if (!open) return null;

    const set = (key, val) => {
        setValues(v => ({ ...v, [key]: val }));
        setErrors(e => ({ ...e, [key]: '' }));
    };

    const validate = () => {
        const errs = {};
        fields.forEach(f => {
            // Only validate if condition is met
            if (f.condition && !f.condition(values)) return;
            if (f.required && !values[f.key] && values[f.key] !== 0) {
                errs[f.key] = `${f.label} is required.`;
            }
        });
        return errs;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setSaving(true);
        try { await onSubmit(values); }
        finally { setSaving(false); }
    };

    const isBusy = saving || loading;

    const renderFieldInput = (f) => {
        const val = values[f.key] ?? '';

        const common = {
            id: `fm-${f.key}`,
            value: val,
            className: `fm-input ${errors[f.key] ? 'fm-input-error' : ''}`,
            placeholder: f.placeholder || '',
            disabled: isBusy,
        };

        switch (f.type) {
            case 'file':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {typeof val === 'string' && val.startsWith('http') && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img
                                    src={val}
                                    alt="Preview"
                                    style={{ width: 80, height: 48, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Image</span>
                            </div>
                        )}
                        <input
                            id={`fm-${f.key}`}
                            type="file"
                            accept={f.accept || 'image/*'}
                            disabled={isBusy}
                            onChange={e => set(f.key, e.target.files[0])}
                            className={`fm-input ${errors[f.key] ? 'fm-input-error' : ''}`}
                            style={{ cursor: 'pointer' }}
                        />
                    </div>
                );
            case 'textarea':
                return <textarea {...common} rows={3} onChange={e => set(f.key, e.target.value)} />;
            case 'number':
                return <input {...common} type="number" onChange={e => set(f.key, e.target.value === '' ? '' : Number(e.target.value))} />;
            case 'url':
                return <input {...common} type="url" onChange={e => set(f.key, e.target.value)} />;
            case 'month':
                return <input {...common} type="month" style={{ colorScheme: 'light', cursor: 'pointer' }} onChange={e => set(f.key, e.target.value)} />;
            case 'datetime-local':
                return <input {...common} type="datetime-local" style={{ colorScheme: 'light', cursor: 'pointer' }} onChange={e => set(f.key, e.target.value)} />;
            case 'select':
                return (
                    <select
                        {...common}
                        onChange={e => set(f.key, e.target.value)}
                        style={{ cursor: 'pointer' }}
                    >
                        <option value="">— Select —</option>
                        {f.options?.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                );
            case 'toggle':
                return (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <div
                            onClick={() => set(f.key, !val)}
                            style={{
                                width: 44, height: 24, borderRadius: 12,
                                background: val ? 'var(--peacock-green)' : 'rgba(148,163,184,0.2)',
                                position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                                border: `1px solid ${val ? 'var(--emerald-light)' : 'var(--border-color)'}`,
                                flexShrink: 0,
                            }}
                        >
                            <div style={{
                                position: 'absolute', top: 2,
                                left: val ? 22 : 2,
                                width: 18, height: 18, borderRadius: '50%',
                                background: val ? '#fff' : 'var(--text-muted)',
                                transition: 'left 0.2s, background 0.2s',
                                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                            }} />
                        </div>
                        <span style={{ color: val ? 'var(--peacock-green)' : 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 700 }}>
                            {val ? (f.onLabel || 'Yes') : (f.offLabel || 'No')}
                        </span>
                    </label>
                );
            case 'emoji':
                return (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                        <span style={{ fontSize: '1.6rem', minWidth: 36, textAlign: 'center' }}>{val || '🌿'}</span>
                        <input {...common} type="text" onChange={e => set(f.key, e.target.value)} placeholder="Paste emoji here" maxLength={8} />
                    </div>
                );
            case 'questions': {
                const questionList = Array.isArray(val) ? val : [];
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
                        {questionList.map((q, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={q}
                                    onChange={e => {
                                        const newQuestions = [...questionList];
                                        newQuestions[idx] = e.target.value;
                                        set(f.key, newQuestions);
                                    }}
                                    placeholder={f.placeholder || `Question #${idx + 1}`}
                                    disabled={isBusy}
                                    className="fm-input"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => {
                                        const newQuestions = questionList.filter((_, i) => i !== idx);
                                        set(f.key, newQuestions);
                                    }}
                                    style={{
                                        background: 'rgba(239,68,68,0.1)',
                                        border: '1px solid rgba(239,68,68,0.2)',
                                        color: '#EF4444',
                                        padding: '0.65rem 0.85rem',
                                        borderRadius: 9,
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                                set(f.key, [...questionList, '']);
                            }}
                            style={{
                                alignSelf: 'flex-start',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-color)',
                                color: 'var(--text-secondary)',
                                padding: '0.45rem 1rem',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                marginTop: '0.25rem',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--peacock-green)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                        >
                            ➕ Add Question
                        </button>
                    </div>
                );
            }
            default:
                return <input {...common} type="text" onChange={e => set(f.key, e.target.value)} />;
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', overflowY: 'auto',
        }} onClick={e => { if (e.target === e.currentTarget && !isBusy) onClose(); }}>
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 18,
                width: '100%', maxWidth: 560,
                animation: 'adminModalIn 0.22s ease-out',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
                margin: 'auto',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>{title}</h2>
                    <button
                        onClick={onClose}
                        disabled={isBusy}
                        style={{
                            background: 'none', border: 'none', color: 'var(--text-muted)',
                            fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1,
                            padding: '0.1rem 0.3rem',
                        }}
                    >×</button>
                </div>

                {/* Form body */}
                <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1 }}>
                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {fields.map(f => {
                            // Conditional rendering check
                            if (f.condition && !f.condition(values)) return null;

                            return (
                                <div key={f.key}>
                                    <label htmlFor={`fm-${f.key}`} style={{
                                        display: 'block', marginBottom: '0.4rem',
                                        color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 700,
                                        textTransform: 'uppercase', letterSpacing: '0.4px',
                                    }}>
                                        {f.label}
                                        {f.required && <span style={{ color: 'var(--accent-coral)', marginLeft: 3 }}>*</span>}
                                    </label>
                                    {renderFieldInput(f)}
                                    {f.hint && !errors[f.key] && (
                                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{f.hint}</p>
                                    )}
                                    {errors[f.key] && (
                                        <p style={{ margin: '0.3rem 0 0', color: 'var(--accent-coral)', fontSize: '0.75rem' }}>⚠ {errors[f.key]}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div style={{
                        padding: '1rem 1.5rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex', gap: '0.75rem', justifyContent: 'flex-end',
                        flexShrink: 0,
                    }}>
                        <button
                            type="button" onClick={onClose} disabled={isBusy}
                            style={{
                                padding: '0.65rem 1.3rem', borderRadius: 9,
                                background: 'transparent', border: '1px solid var(--border-color)',
                                color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem',
                                cursor: isBusy ? 'not-allowed' : 'pointer',
                            }}
                        >Cancel</button>
                        <button
                            type="submit" disabled={isBusy}
                            style={{
                                padding: '0.65rem 1.5rem', borderRadius: 9,
                                background: 'var(--peacock-green)', border: 'none',
                                color: '#fff', fontWeight: 700, fontSize: '0.875rem',
                                cursor: isBusy ? 'not-allowed' : 'pointer',
                                opacity: isBusy ? 0.7 : 1,
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {isBusy && <span style={{
                                width: 14, height: 14, border: '2px solid #fff',
                                borderTopColor: 'transparent', borderRadius: '50%',
                                animation: 'spin 0.7s linear infinite', display: 'inline-block',
                            }} />}
                            {submitLabel}
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
                .fm-input {
                    background: var(--bg-elevated) !important;
                    border: 1px solid var(--border-color) !important;
                    border-radius: 9px !important;
                    color: var(--text-primary) !important;
                    padding: 0.65rem 0.9rem !important;
                    font-size: 0.875rem !important;
                    outline: none !important;
                    width: 100% !important;
                    font-family: inherit !important;
                    resize: vertical !important;
                    transition: border-color 0.2s !important;
                    box-sizing: border-box !important;
                }
                .fm-input:focus {
                    border-color: var(--peacock-green) !important;
                    box-shadow: 0 0 0 2px var(--bg-mint) !important;
                }
                .fm-input-error {
                    border-color: var(--accent-coral) !important;
                }
                @keyframes adminModalIn {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
