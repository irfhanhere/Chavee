import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { PageLoader, ButtonSpinner } from '../../../components/Spinner.jsx';

// Fields belonging to the "Interface Behavior" card — these are staged
// locally and only written on Save. Everything else in user_preferences
// (Display & Locale) continues to save immediately on change.
const INTERFACE_KEYS = ['homepage_default', 'remember_sidebar_state', 'compact_mode', 'animations', 'accessibility_mode'];

export default function PreferencesTab({ user, showToast }) {
    const [prefs, setPrefs] = useState(null);
    const [interfaceDraft, setInterfaceDraft] = useState(null); // local unsaved edits for Interface Behavior only
    const [loading, setLoading] = useState(true);
    const [savingInterface, setSavingInterface] = useState(false);

    useEffect(() => {
        const fetchPrefs = async () => {
            if (!user) return;
            const { data } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
            if (data) {
                setPrefs(data);
                const draft = {};
                INTERFACE_KEYS.forEach(key => { draft[key] = data[key]; });
                setInterfaceDraft(draft);
            }
            setLoading(false);
        };
        fetchPrefs();
    }, [user]);

    // Display & Locale — UI is replaced with a "Coming Soon" placeholder below (Phase 2).
    // Handler kept as-is and untouched so re-enabling later is a pure JSX swap, not new logic.
    const handleSelectChange = async (key, value) => {
        if (!prefs) return;
        setPrefs({ ...prefs, [key]: value });
        try {
            await supabase.from('user_preferences').update({ [key]: value }).eq('user_id', user.id);
            // Example: apply theme immediately
            if (key === 'theme') {
                document.body.className = value === 'system' ? '' : `theme-${value}`;
            }
        } catch (err) {
            showToast("Failed to update preference", 'error');
        }
    };

    // Interface Behavior — local-only, no Supabase call until Save is clicked
    const handleInterfaceToggle = (key) => {
        if (!interfaceDraft) return;
        setInterfaceDraft({ ...interfaceDraft, [key]: !interfaceDraft[key] });
    };

    const handleInterfaceSelectChange = (key, value) => {
        if (!interfaceDraft) return;
        setInterfaceDraft({ ...interfaceDraft, [key]: value });
    };

    const isInterfaceDirty = !!(interfaceDraft && prefs && INTERFACE_KEYS.some(key => interfaceDraft[key] !== prefs[key]));

    const handleSaveInterface = async () => {
        if (!interfaceDraft || !prefs) return;
        const changed = {};
        INTERFACE_KEYS.forEach(key => {
            if (interfaceDraft[key] !== prefs[key]) changed[key] = interfaceDraft[key];
        });
        if (Object.keys(changed).length === 0) return;

        setSavingInterface(true);
        try {
            const { error } = await supabase.from('user_preferences').update(changed).eq('user_id', user.id);
            if (error) throw error;

            setPrefs({ ...prefs, ...changed });
            showToast('Preferences saved', 'success');
        } catch (err) {
            console.error('Failed to update interface preferences:', err);
            showToast(err.message || 'Failed to save preferences', 'error');
        } finally {
            setSavingInterface(false);
        }
    };

    if (loading) return <PageLoader message="Loading preferences..." />;

    if (!prefs || !interfaceDraft) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Could not load preferences.</div>;
    }

    const renderToggle = (label, key, description) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{label}</h4>
                {description && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{description}</p>}
            </div>
            <label className="toggle-switch">
                <input type="checkbox" checked={interfaceDraft[key]} onChange={() => handleInterfaceToggle(key)} />
                <span className="slider round"></span>
            </label>
        </div>
    );

    const renderInterfaceSelect = (label, key, options) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{label}</h4>
            <select
                value={interfaceDraft[key]}
                onChange={e => handleInterfaceSelectChange(key, e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.9rem', minWidth: 150 }}
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    // Kept for Phase 2 — currently unused since Display & Locale renders a placeholder instead.
    const renderSelect = (label, key, options) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{label}</h4>
            <select 
                value={prefs[key]} 
                onChange={e => handleSelectChange(key, e.target.value)}
                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontSize: '0.9rem', minWidth: 150 }}
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Display & Locale — Coming Soon (Phase 2) */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🌐</div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Display & Locale</h2>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Theme, language, timezone, currency, and date format settings are coming in a future update.</p>
            </div>

            {/* UI Behavior */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Interface Behavior</h2>
                        <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Customize how the application behaves for you.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {isInterfaceDirty && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unsaved changes</span>}
                        <button
                            onClick={handleSaveInterface}
                            disabled={!isInterfaceDirty || savingInterface}
                            style={{
                                background: isInterfaceDirty ? 'var(--peacock-green)' : 'var(--bg-elevated)',
                                color: isInterfaceDirty ? '#fff' : 'var(--text-secondary)',
                                border: 'none',
                                padding: '0.6rem 1.5rem',
                                borderRadius: 8,
                                fontWeight: 700,
                                cursor: isInterfaceDirty && !savingInterface ? 'pointer' : 'not-allowed',
                                opacity: savingInterface ? 0.7 : 1
                            }}
                        >
                            {savingInterface ? <ButtonSpinner /> : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {renderInterfaceSelect('Homepage Default', 'homepage_default', [
                    { value: 'dashboard', label: 'Dashboard' },
                    { value: 'network', label: 'Network' },
                    { value: 'education', label: 'Education' }
                ])}

                {renderToggle('Remember Sidebar State', 'remember_sidebar_state', 'Keep the sidebar collapsed or expanded across sessions.')}
                {renderToggle('Compact Mode', 'compact_mode', 'Reduce spacing between elements to fit more content on screen.')}
                {renderToggle('Enable Animations', 'animations', 'Show smooth transitions and micro-animations.')}
                {renderToggle('Accessibility Mode', 'accessibility_mode', 'Increase contrast and display visual aids.')}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
                .toggle-switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-color); transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; }
                input:checked + .slider { background-color: var(--peacock-green); }
                input:focus + .slider { box-shadow: 0 0 1px var(--peacock-green); }
                input:checked + .slider:before { transform: translateX(20px); }
                .slider.round { border-radius: 24px; }
                .slider.round:before { border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            `}} />
        </div>
    );
}
