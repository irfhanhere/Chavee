import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { PageLoader, ButtonSpinner } from '../../../components/Spinner.jsx';

export default function PrivacyTab({ user, showToast }) {
    const [prefs, setPrefs] = useState(null); // last saved state
    const [draft, setDraft] = useState(null); // local unsaved edits
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchPrefs = async () => {
            if (!user) return;
            const { data } = await supabase.from('privacy_settings').select('*').eq('user_id', user.id).single();
            if (data) {
                setPrefs(data);
                setDraft(data);
            }
            setLoading(false);
        };
        fetchPrefs();
    }, [user]);

    // Local-only — no Supabase call until Save is clicked
    const handleToggle = (key) => {
        if (!draft) return;
        setDraft({ ...draft, [key]: !draft[key] });
    };

    const handleSelectChange = (key, value) => {
        if (!draft) return;
        setDraft({ ...draft, [key]: value });
    };

    const isDirty = !!(draft && prefs && Object.keys(draft).some(key => draft[key] !== prefs[key]));

    const handleSave = async () => {
        if (!draft || !prefs) return;
        const changed = {};
        Object.keys(draft).forEach(key => {
            if (draft[key] !== prefs[key]) changed[key] = draft[key];
        });
        if (Object.keys(changed).length === 0) return;

        setSaving(true);
        try {
            const { error } = await supabase.from('privacy_settings').update(changed).eq('user_id', user.id);
            if (error) throw error;

            // Keep profiles.privacy in sync if profile_visibility changed
            if ('profile_visibility' in changed) {
                const { error: profileError } = await supabase.from('profiles').update({ privacy: changed.profile_visibility }).eq('id', user.id);
                if (profileError) throw profileError;
            }

            setPrefs(draft);
            showToast('Preferences saved', 'success');
        } catch (err) {
            console.error('Failed to update privacy settings:', err);
            showToast(err.message || 'Failed to save privacy settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Was a fake setTimeout claiming "we will email you a secure link" — no
    // export was ever generated and no email was ever sent. Real data export
    // isn't built (no Edge Function, no archive generation), so this is now
    // a real notify-me subscription instead of a false claim of action taken —
    // same real notify_subscribers pattern already used for 2FA (SecurityTab.jsx).
    const handleExport = async () => {
        setExporting(true);
        try {
            const { error } = await supabase.from('notify_subscribers').insert({ email: user.email, feature_key: 'data_export' });
            if (error && error.code !== '23505') throw error;
            showToast("Data export isn't built yet — you're on the list to be notified when it is.", 'success');
        } catch (err) {
            showToast('Failed to join waitlist.', 'error');
        } finally {
            setExporting(false);
        }
    };

    if (loading) return <PageLoader message="Loading privacy settings..." />;

    if (!prefs || !draft) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Could not load privacy settings.</div>;
    }

    const renderToggle = (label, key, description) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <div>
                <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{label}</h4>
                {description && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{description}</p>}
            </div>
            <label className="toggle-switch">
                <input type="checkbox" checked={draft[key]} onChange={() => handleToggle(key)} />
                <span className="slider round"></span>
            </label>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Save bar */}
            <div style={{ position: 'sticky', top: 0, zIndex: 5, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem', background: 'var(--bg-base)', padding: '0.5rem 0' }}>
                {isDirty && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You have unsaved changes</span>}
                <button
                    onClick={handleSave}
                    disabled={!isDirty || saving}
                    style={{
                        background: isDirty ? 'var(--peacock-green)' : 'var(--bg-elevated)',
                        color: isDirty ? '#fff' : 'var(--text-secondary)',
                        border: 'none',
                        padding: '0.6rem 1.5rem',
                        borderRadius: 8,
                        fontWeight: 700,
                        cursor: isDirty && !saving ? 'pointer' : 'not-allowed',
                        opacity: saving ? 0.7 : 1
                    }}
                >
                    {saving ? <ButtonSpinner /> : 'Save Changes'}
                </button>
            </div>

            {/* Profile Visibility */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Profile Visibility</h2>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Control who can see your profile on Chavee.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <select
                        value={draft.profile_visibility}
                        onChange={e => handleSelectChange('profile_visibility', e.target.value)}
                        style={{ padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.95rem', maxWidth: 300 }}
                    >
                        <option value="public">Public (Everyone)</option>
                        <option value="students">Students Only</option>
                        <option value="connections">Connections Only</option>
                        <option value="private">Private (Only You)</option>
                    </select>
                </div>
            </div>

            {/* Information Display */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Information Display</h2>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Hide specific fields from your public profile.</p>
                
                {renderToggle('Hide Email', 'hide_email')}
                {renderToggle('Hide Phone Number', 'hide_phone')}
                {renderToggle('Hide College', 'hide_college')}
                {renderToggle('Hide Date of Birth', 'hide_birthday')}
                {renderToggle('Hide Profile from Search Engines', 'hide_profile_from_search')}
            </div>

            {/* Interactions */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Interactions & Status</h2>
                
                {renderToggle('Allow Connection Requests', 'allow_connection_requests')}
                {renderToggle('Allow Direct Messages', 'allow_messages')}
                {renderToggle('Show Online Status', 'show_online_status')}
                {renderToggle('Show Last Seen', 'show_last_seen')}
                {renderToggle('Allow Community Invites', 'allow_community_invites')}
                {renderToggle('Allow Mentor Requests', 'allow_mentor_requests')}
            </div>

            {/* Data Download */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Download Your Data</h2>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Not built yet — this joins a real notify-me list instead of generating an archive that doesn't exist.
                </p>

                <button onClick={handleExport} disabled={exporting} style={{ background: 'transparent', border: '1px solid var(--peacock-green)', color: 'var(--peacock-green)', padding: '0.75rem 1.5rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    {exporting ? <ButtonSpinner /> : <><span>📥</span> Notify Me When Available</>}
                </button>
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
