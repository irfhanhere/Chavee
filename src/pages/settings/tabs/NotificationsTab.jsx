import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { PageLoader, ButtonSpinner } from '../../../components/Spinner.jsx';

export default function NotificationsTab({ user, showToast }) {
    const [prefs, setPrefs] = useState(null); // last saved state
    const [draft, setDraft] = useState(null); // local unsaved edits
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchPrefs = async () => {
            if (!user) return;
            const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', user.id).single();
            if (data) {
                setPrefs(data);
                setDraft(data);
            }
            setLoading(false);
        };
        fetchPrefs();
    }, [user]);

    // Local-only toggle — no Supabase call until Save is clicked
    const handleToggle = (key) => {
        if (!draft) return;
        setDraft({ ...draft, [key]: !draft[key] });
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
            console.log('DEBUG notification_preferences update payload:', { table: 'notification_preferences', update: changed, match: { user_id: user.id } });
            const { error } = await supabase
                .from('notification_preferences')
                .update(changed)
                .eq('user_id', user.id);

            if (error) throw error;

            setPrefs(draft);
            showToast('Preferences saved', 'success');
        } catch (err) {
            console.error('Failed to update notification preferences:', { message: err.message, code: err.code, details: err.details, hint: err.hint, full: err });
            showToast(err.message || 'Failed to save preferences', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <PageLoader message="Loading preferences..." />;

    if (!prefs || !draft) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Could not load notification preferences.</div>;
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

            {/* Global Channels */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Notification Channels</h2>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Choose how you want to receive notifications from Chavee.</p>
                
                {renderToggle('In-App Notifications', 'platform_notifications', 'Receive notifications within the Chavee platform.')}
                {renderToggle('Email Notifications', 'email_notifications', 'Receive notifications via email.')}
                {renderToggle('Push Notifications', 'push_notifications', 'Receive push notifications on your mobile device.')}
            </div>

            {/* Content Preferences */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Activity & Updates</h2>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select what kind of updates you want to be notified about.</p>
                
                {renderToggle('Community Activity', 'community_activity')}
                {renderToggle('Course Updates', 'course_updates')}
                {renderToggle('Scholarship Alerts', 'scholarship_alerts')}
                {renderToggle('Gig & Job Updates', 'gig_updates')}
                {renderToggle('Event Reminders', 'event_reminders')}
            </div>

            {/* Social Interactions */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Social Interactions</h2>
                
                {renderToggle('Mentions', 'mentions', 'When someone @mentions you in a post or comment.')}
                {renderToggle('Comments', 'comments', 'When someone comments on your post.')}
                {renderToggle('Likes', 'likes', 'When someone likes your post.')}
                {renderToggle('Connection Requests', 'connection_requests')}
                {renderToggle('Direct Messages', 'messages')}
            </div>

            {/* Newsletters */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Newsletters & Digests</h2>
                
                {renderToggle('Weekly Digest', 'weekly_digest', 'A weekly summary of top activities and opportunities.')}
                {renderToggle('Monthly Digest', 'monthly_digest')}
                {renderToggle('Marketing & Offers', 'marketing_emails', 'Occasional emails about new Chavee features and partner offers.')}
            </div>

            {/* Global CSS for toggle switch if not already defined */}
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
