import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { ButtonSpinner } from '../../components/Spinner.jsx';
import { useNavigate } from 'react-router-dom';

export default function SettingsTab({ profile, user, setProfile, showToast }) {
    const navigate = useNavigate();
    
    // Form State
    const [draft, setDraft] = useState({
        full_name: profile?.full_name || '',
        bio: profile?.bio || '',
        college: profile?.college || '',
        course: profile?.course || '',
        year: profile?.year || '',
        skills: profile?.skills || '',
        linkedin_url: profile?.linkedin_url || '',
        portfolio_url: profile?.portfolio_url || '',
        avatar_url: profile?.avatar_url || ''
    });
    const [saving, setSaving] = useState(false);
    
    // Danger Zone State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = {
                id: user.id,
                ...draft,
                updated_at: new Date()
            };
            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            setProfile({ ...profile, ...draft });
            showToast('Profile updated successfully!', 'success');
        } catch (err) {
            console.error('Update error:', err);
            showToast('Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase.rpc('delete_user_account');
            if (error) throw error;
            showToast('Your account has been deleted. Farewell! 👋', 'success');
            setTimeout(async () => {
                await supabase.auth.signOut();
                navigate('/login');
            }, 2000);
        } catch (err) {
            console.error('Delete error:', err);
            showToast(err.message || 'Failed to delete account.', 'error');
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const S = {
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' },
        title: { margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' },
        label: { fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' },
        input: { background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', padding: '0.65rem 0.9rem', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.2s', marginBottom: '1.25rem' }
    };

    return (
        <div style={{ maxWidth: 800 }}>
            
            {/* General Profile Settings */}
            <div style={S.card}>
                <h3 style={S.title}>Edit Profile</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
                    <div>
                        <label style={S.label}>Full Name</label>
                        <input style={S.input} value={draft.full_name} onChange={e => setDraft({...draft, full_name: e.target.value})} placeholder="Your Name" />
                    </div>
                    <div>
                        <label style={S.label}>Avatar URL</label>
                        <input style={S.input} value={draft.avatar_url} onChange={e => setDraft({...draft, avatar_url: e.target.value})} placeholder="https://..." />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={S.label}>Bio</label>
                        <textarea style={{ ...S.input, minHeight: 80, resize: 'vertical' }} value={draft.bio} onChange={e => setDraft({...draft, bio: e.target.value})} placeholder="Tell us about yourself..." />
                    </div>
                    <div>
                        <label style={S.label}>College / University</label>
                        <input style={S.input} value={draft.college} onChange={e => setDraft({...draft, college: e.target.value})} placeholder="e.g. Stanford University" />
                    </div>
                    <div>
                        <label style={S.label}>Course / Major</label>
                        <input style={S.input} value={draft.course} onChange={e => setDraft({...draft, course: e.target.value})} placeholder="e.g. Computer Science" />
                    </div>
                    <div>
                        <label style={S.label}>Year of Study</label>
                        <input style={S.input} value={draft.year} onChange={e => setDraft({...draft, year: e.target.value})} placeholder="e.g. Junior, 3rd Year" />
                    </div>
                    <div>
                        <label style={S.label}>Skills (comma separated)</label>
                        <input style={S.input} value={draft.skills} onChange={e => setDraft({...draft, skills: e.target.value})} placeholder="React, Python, Design" />
                    </div>
                    <div>
                        <label style={S.label}>LinkedIn URL</label>
                        <input style={S.input} value={draft.linkedin_url} onChange={e => setDraft({...draft, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." />
                    </div>
                    <div>
                        <label style={S.label}>Portfolio URL</label>
                        <input style={S.input} value={draft.portfolio_url} onChange={e => setDraft({...draft, portfolio_url: e.target.value})} placeholder="https://yourwebsite.com" />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button onClick={handleSave} disabled={saving} style={{ background: 'var(--peacock-green)', color: '#fff', border: 'none', padding: '0.65rem 1.5rem', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
                        {saving ? <ButtonSpinner /> : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Notifications (Disabled / Coming Soon) */}
            <div style={{ ...S.card, opacity: 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Notification Preferences</h3>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', padding: '0.2rem 0.6rem', borderRadius: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Coming Soon</span>
                </div>
                
                {['Email Notifications', 'Push Notifications', 'Weekly Digest'].map(pref => (
                    <div key={pref} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{pref}</span>
                        <div style={{ width: 44, height: 24, borderRadius: 12, background: 'var(--bg-elevated)', cursor: 'not-allowed', position: 'relative' }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--text-muted)', position: 'absolute', top: 2, left: 2 }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Security (Disabled / Coming Soon) */}
            <div style={{ ...S.card, opacity: 0.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>Security</h3>
                    <span style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', padding: '0.2rem 0.6rem', borderRadius: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Coming Soon</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Two-Factor Authentication</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Add an extra layer of security to your account.</div>
                    </div>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: 'var(--bg-elevated)', cursor: 'not-allowed', position: 'relative' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--text-muted)', position: 'absolute', top: 2, left: 2 }} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 0 0.5rem 0' }}>
                    <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Active Sessions</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage devices logged into your account.</div>
                    </div>
                    <button disabled style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'not-allowed' }}>
                        Logout All
                    </button>
                </div>
            </div>

            {/* Premium / Upgrade (Disabled) */}
            <div style={{ background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1), rgba(234, 179, 8, 0.02))', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: 'rgba(234, 179, 8, 0.2)', color: '#CA8A04', fontSize: '0.75rem', fontWeight: 800, borderBottomLeftRadius: 16 }}>COMING SOON</div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#CA8A04' }}>Chavee Pro</h3>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Get verified, access premium jobs, and boost your profile visibility.</p>
                <button disabled style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: 'none', padding: '0.65rem 1.5rem', borderRadius: 10, fontWeight: 700, cursor: 'not-allowed', opacity: 0.7 }}>
                    Upgrade to Premium
                </button>
            </div>

            {/* Danger Zone */}
            <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 16, padding: '2rem', background: 'rgba(239, 68, 68, 0.02)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#EF4444' }}>Danger Zone</h3>
                <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    Once you delete your account, there is no going back. Please be certain.
                </p>
                <button onClick={() => setShowDeleteConfirm(true)} style={{ background: 'transparent', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.65rem 1.5rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    Delete Account
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 24, padding: '2.5rem', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 1.5rem auto' }}>
                            ⚠️
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 900 }}>Delete Account?</h2>
                        <p style={{ margin: '0 0 2rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Are you absolutely sure? This action cannot be undone and will permanently delete your data.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteConfirm(false)} style={{ padding: '0.7rem 1.5rem', borderRadius: 12, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', flex: 1 }}>
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount} disabled={deleting} style={{ padding: '0.7rem 1.5rem', borderRadius: 12, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', flex: 1 }}>
                                {deleting ? <ButtonSpinner /> : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
}
