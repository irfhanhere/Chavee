import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { PageLoader, ButtonSpinner } from '../components/Spinner.jsx';

export default function EditProfile() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();

    const [user, setUser] = useState(null);
    const [draft, setDraft] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [activeSection, setActiveSection] = useState('Personal');
    
    // Check if on mobile for layout
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [showMobilePreview, setShowMobilePreview] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUser(session.user);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching profile:", error);
            }

            setDraft(data || {
                id: session.user.id,
                full_name: '',
                bio: '',
                college: '',
                course: '',
                year: '',
                skills: '',
                interests: '',
                linkedin_url: '',
                portfolio_url: '',
                resume_url: '',
                avatar_url: '',
                banner_url: '',
                profile_visibility: 'public',
                hide_email: true,
                hide_phone: true
            });
            setLoading(false);
        };
        fetchProfile();
    }, [navigate]);

    const handleChange = (field, value) => {
        setDraft(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = {
                ...draft,
                updated_at: new Date()
            };
            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;
            showToast('Profile updated successfully!', 'success');
            setTimeout(() => {
                navigate('/profile');
            }, 1000);
        } catch (err) {
            console.error('Update error:', err);
            showToast('Failed to update profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !draft) return <PageLoader message="Loading profile editor..." />;

    const sections = ['Personal', 'Education', 'Skills & Interests', 'Media & Links', 'Privacy Settings'];

    const renderFormSection = () => {
        const S = {
            label: { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' },
            input: { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' },
            group: { marginBottom: '1.5rem' },
            checkboxGroup: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }
        };

        if (activeSection === 'Personal') {
            return (
                <div className="fade-in">
                    <div style={S.group}>
                        <label style={S.label}>Full Name</label>
                        <input style={S.input} value={draft.full_name || ''} onChange={e => handleChange('full_name', e.target.value)} placeholder="e.g. Jane Doe" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>Bio</label>
                        <textarea style={{...S.input, minHeight: 100, resize: 'vertical'}} value={draft.bio || ''} onChange={e => handleChange('bio', e.target.value)} placeholder="Write a short bio about yourself..." />
                    </div>
                </div>
            );
        }
        if (activeSection === 'Education') {
            return (
                <div className="fade-in">
                    <div style={S.group}>
                        <label style={S.label}>College / University</label>
                        <input style={S.input} value={draft.college || ''} onChange={e => handleChange('college', e.target.value)} placeholder="e.g. Stanford University" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>Course / Major</label>
                        <input style={S.input} value={draft.course || ''} onChange={e => handleChange('course', e.target.value)} placeholder="e.g. B.Tech Computer Science" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>Graduation Year</label>
                        <input style={S.input} value={draft.year || ''} onChange={e => handleChange('year', e.target.value)} placeholder="e.g. 2026" />
                    </div>
                </div>
            );
        }
        if (activeSection === 'Skills & Interests') {
            return (
                <div className="fade-in">
                    <div style={S.group}>
                        <label style={S.label}>Skills (Comma separated)</label>
                        <input style={S.input} value={draft.skills || ''} onChange={e => handleChange('skills', e.target.value)} placeholder="e.g. React, Node.js, UI Design" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>Interests (Comma separated)</label>
                        <input style={S.input} value={draft.interests || ''} onChange={e => handleChange('interests', e.target.value)} placeholder="e.g. AI, Open Source, Hiking" />
                    </div>
                </div>
            );
        }
        if (activeSection === 'Media & Links') {
            return (
                <div className="fade-in">
                    <div style={S.group}>
                        <label style={S.label}>Avatar Image URL</label>
                        <input style={S.input} value={draft.avatar_url || ''} onChange={e => handleChange('avatar_url', e.target.value)} placeholder="https://example.com/avatar.jpg" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>Banner Image URL</label>
                        <input style={S.input} value={draft.banner_url || ''} onChange={e => handleChange('banner_url', e.target.value)} placeholder="https://example.com/banner.jpg" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>LinkedIn URL</label>
                        <input style={S.input} value={draft.linkedin_url || ''} onChange={e => handleChange('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/username" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>Portfolio / Personal Website</label>
                        <input style={S.input} value={draft.portfolio_url || ''} onChange={e => handleChange('portfolio_url', e.target.value)} placeholder="https://yourwebsite.com" />
                    </div>
                    <div style={S.group}>
                        <label style={S.label}>Resume URL (PDF Link)</label>
                        <input style={S.input} value={draft.resume_url || ''} onChange={e => handleChange('resume_url', e.target.value)} placeholder="https://drive.google.com/..." />
                    </div>
                </div>
            );
        }
        if (activeSection === 'Privacy Settings') {
            return (
                <div className="fade-in">
                    <div style={S.group}>
                        <label style={S.label}>Profile Visibility</label>
                        <select 
                            style={S.input} 
                            value={draft.profile_visibility || 'public'} 
                            onChange={e => handleChange('profile_visibility', e.target.value)}
                        >
                            <option value="public">Public (Visible to everyone)</option>
                            <option value="private">Private (Hidden from directories and public view)</option>
                        </select>
                    </div>
                    <div style={S.checkboxGroup}>
                        <input 
                            type="checkbox" 
                            id="hide_email" 
                            checked={draft.hide_email} 
                            onChange={e => handleChange('hide_email', e.target.checked)} 
                            style={{ width: 18, height: 18, accentColor: 'var(--peacock-green)' }}
                        />
                        <label htmlFor="hide_email" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Hide Email from other users</label>
                    </div>
                    <div style={S.checkboxGroup}>
                        <input 
                            type="checkbox" 
                            id="hide_phone" 
                            checked={draft.hide_phone} 
                            onChange={e => handleChange('hide_phone', e.target.checked)} 
                            style={{ width: 18, height: 18, accentColor: 'var(--peacock-green)' }}
                        />
                        <label htmlFor="hide_phone" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Hide Phone Number from other users</label>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
            <Toast {...toast} onHide={hideToast} />

            {/* Header */}
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => navigate('/profile')} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)' }}>
                        ←
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Edit Profile</h1>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {isMobile && (
                        <button 
                            onClick={() => setShowMobilePreview(!showMobilePreview)}
                            style={{ padding: '0.6rem 1rem', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                        >
                            {showMobilePreview ? 'Edit Form' : 'Live Preview'}
                        </button>
                    )}
                    <button 
                        onClick={handleSave} 
                        disabled={saving}
                        style={{ padding: '0.6rem 1.5rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: 'var(--shadow-sm)' }}
                    >
                        {saving ? <ButtonSpinner /> : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Layout */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                
                {/* Left Side: Form (Hidden on mobile if showing preview) */}
                {(!isMobile || !showMobilePreview) && (
                    <div style={{ flex: isMobile ? 1 : '0 0 550px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', background: 'var(--bg-surface)', overflowY: 'auto' }}>
                        
                        {/* Tabs */}
                        <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-color)', padding: '0 1rem', scrollbarWidth: 'none' }}>
                            {sections.map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => setActiveSection(sec)}
                                    style={{
                                        background: 'none', border: 'none', padding: '1rem',
                                        fontSize: '0.85rem', fontWeight: activeSection === sec ? 800 : 600,
                                        color: activeSection === sec ? 'var(--peacock-green)' : 'var(--text-muted)',
                                        borderBottom: activeSection === sec ? '2px solid var(--peacock-green)' : '2px solid transparent',
                                        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                                    }}
                                >
                                    {sec}
                                </button>
                            ))}
                        </div>

                        {/* Form Content */}
                        <div style={{ padding: '2rem' }}>
                            {renderFormSection()}
                        </div>
                    </div>
                )}

                {/* Right Side: Live Preview (Hidden on mobile if showing form) */}
                {(!isMobile || showMobilePreview) && (
                    <div style={{ flex: 1, background: 'var(--bg-base)', padding: '2rem', overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <PreviewCard draft={draft} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Live Preview Component ──
function PreviewCard({ draft }) {
    const skillsList = draft.skills ? draft.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    const interestsList = draft.interests ? draft.interests.split(',').map(s => s.trim()).filter(Boolean) : [];

    return (
        <div style={{ width: '100%', maxWidth: 600, background: 'var(--bg-surface)', borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', animation: 'fadeInUp 0.3s ease-out' }}>
            
            {/* Banner */}
            <div style={{ height: 140, background: draft.banner_url ? `url(${draft.banner_url}) center/cover` : 'linear-gradient(135deg, var(--bg-mint), var(--peacock-green))', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: 20, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                    Preview Mode
                </div>
                {draft.profile_visibility === 'private' && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: '0.7rem', padding: '0.3rem 0.6rem', borderRadius: 20, fontWeight: 700 }}>
                        🔒 Private Profile
                    </div>
                )}
            </div>

            <div style={{ padding: '0 2rem 2rem 2rem', marginTop: -50, position: 'relative' }}>
                {/* Avatar */}
                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-elevated)', border: '4px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', marginBottom: '1rem' }}>
                    {draft.avatar_url ? (
                        <img src={draft.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        draft.full_name?.charAt(0) || '🎓'
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                            {draft.full_name || 'Your Name'}
                        </h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {draft.college || 'College not set'} {draft.course ? `• ${draft.course}` : ''} {draft.year ? `• Class of ${draft.year}` : ''}
                        </p>
                    </div>
                </div>

                {draft.bio && (
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {draft.bio}
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {draft.linkedin_url && (
                        <a href={draft.linkedin_url} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 1rem', background: '#0077b5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            LinkedIn
                        </a>
                    )}
                    {draft.portfolio_url && (
                        <a href={draft.portfolio_url} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 1rem', background: 'var(--text-primary)', color: 'var(--bg-surface)', borderRadius: 8, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Portfolio
                        </a>
                    )}
                    {draft.resume_url && (
                        <a href={draft.resume_url} target="_blank" rel="noreferrer" style={{ padding: '0.5rem 1rem', background: 'var(--bg-mint)', color: 'var(--peacock-green)', border: '1px solid var(--border-mint)', borderRadius: 8, textDecoration: 'none', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Resume
                        </a>
                    )}
                </div>

                {(skillsList.length > 0 || interestsList.length > 0) && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {skillsList.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontWeight: 800 }}>Skills</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {skillsList.map((skill, i) => (
                                        <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {interestsList.length > 0 && (
                            <div>
                                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 0.5rem 0', fontWeight: 800 }}>Interests</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {interestsList.map((interest, i) => (
                                        <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'var(--bg-mint)', color: 'var(--peacock-green)', border: '1px solid var(--border-mint)', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                                            {interest}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
