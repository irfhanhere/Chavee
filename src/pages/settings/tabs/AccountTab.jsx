import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { ButtonSpinner } from '../../../components/Spinner.jsx';

export default function AccountTab({ user, profile, setProfile, showToast }) {
    const [saving, setSaving] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    // Editable state for form fields.
    // NOTE: Only include columns that actually exist in the profiles table.
    // Sending unknown columns in a Supabase .update() causes PostgREST to
    // reject the ENTIRE request with a 400 error, silently failing all fields.
    // 'privacy' is NOT managed here — it lives in PrivacyTab via privacy_settings.
    const [formData, setFormData] = useState({
        full_name: profile?.full_name || '',
        username: profile?.username || '',
        phone: profile?.phone || '',
        date_of_birth: profile?.date_of_birth || '',
        college: profile?.college || '',
        course: profile?.course || '',
        year_of_study: profile?.year_of_study || '',
        bio: profile?.bio || '',
    });

    // Sync formData whenever profile prop loads or updates from Supabase
    React.useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                username: profile.username || '',
                phone: profile.phone || '',
                date_of_birth: profile.date_of_birth || '',
                college: profile.college || '',
                course: profile.course || '',
                year_of_study: profile.year_of_study || '',
                bio: profile.bio || '',
            });
        }
    }, [profile]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handlePictureUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!user) { showToast('Please log in to upload a picture.', 'error'); return; }

        setUploadingPicture(true);
        try {
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('profile-images').upload(filePath, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('profile-images').getPublicUrl(filePath);

            const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: { avatar_url: publicUrl } }));
            showToast('Profile picture updated!', 'success');
        } catch (err) {
            console.error('Picture upload failed:', err);
            showToast(`Upload failed: ${err.message}`, 'error');
        } finally {
            setUploadingPicture(false);
            e.target.value = '';
        }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!user) { showToast('Please log in to upload a banner.', 'error'); return; }

        setUploadingBanner(true);
        try {
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filePath = `${user.id}/${fileName}`;
            const { error: uploadError } = await supabase.storage.from('profile-banners').upload(filePath, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('profile-banners').getPublicUrl(filePath);

            const { error: updateError } = await supabase.from('profiles').update({ banner_url: publicUrl }).eq('id', user.id);
            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, banner_url: publicUrl }));
            window.dispatchEvent(new CustomEvent('profile-updated', { detail: { banner_url: publicUrl } }));
            showToast('Banner updated!', 'success');
        } catch (err) {
            console.error('Banner upload failed:', err);
            showToast(`Upload failed: ${err.message}`, 'error');
        } finally {
            setUploadingBanner(false);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Build an explicit whitelist of real profiles columns.
            // Do NOT spread formData directly — any ghost key causes PostgREST
            // to reject the entire PATCH with a 400, silently failing every field.
            const payload = {
                full_name:      formData.full_name,
                username:       formData.username,
                phone:          formData.phone,
                // date_of_birth is a `date` column — Postgres rejects '' as invalid,
                // which would fail the whole update. Send null when empty.
                date_of_birth:  formData.date_of_birth || null,
                college:        formData.college,
                course:         formData.course,
                year_of_study:  formData.year_of_study,
                bio:            formData.bio,
            };
            const { error } = await supabase
                .from('profiles')
                .update(payload)
                .eq('id', user.id);
            
            if (error) throw error;
            setProfile(prev => ({ ...prev, ...payload }));
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Profile save failed:', error);
            showToast(error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Profile Information */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Profile Information</h2>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Update your personal details and public profile information.</p>
                    </div>
                    <button onClick={handleSave} disabled={saving} style={{ background: 'var(--peacock-green)', border: 'none', color: '#fff', padding: '0.65rem 1.4rem', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 8px rgba(17,94,89,0.25)', transition: 'all 0.2s', opacity: saving ? 0.8 : 1 }}>
                        {saving ? <ButtonSpinner label="Saving..." /> : <><span>💾</span> Save Changes</>}
                    </button>
                </div>

                <div className="grid-responsive-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    
                    <div>
                        <label style={styles.label}>Full Name</label>
                        <input name="full_name" value={formData.full_name} onChange={handleChange} style={styles.input} />
                    </div>
                    <div>
                        <label style={styles.label}>Username</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input name="username" value={formData.username} onChange={handleChange} style={styles.input} />
                            {formData.username && <span style={styles.verifiedBadge}>✓ Verified</span>}
                        </div>
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={styles.label}>Email</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', maxWidth: '300px' }}>
                            <input readOnly value={user?.email || ''} style={{...styles.input, background: 'var(--bg-elevated)', color: 'var(--text-secondary)'}} />
                            <span style={styles.verifiedBadge}>Email Verified</span>
                        </div>
                    </div>

                    <div>
                        <label style={styles.label}>Phone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" style={styles.input} />
                    </div>
                    <div>
                        <label style={styles.label}>Date of Birth</label>
                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} style={styles.input} />
                    </div>

                    <div>
                        <label style={styles.label}>College</label>
                        <input name="college" value={formData.college} onChange={handleChange} style={styles.input} />
                    </div>
                    <div>
                        <label style={styles.label}>Course</label>
                        <input name="course" value={formData.course} onChange={handleChange} style={styles.input} />
                    </div>

                    <div>
                        <label style={styles.label}>Year</label>
                        <input name="year_of_study" value={formData.year_of_study} onChange={handleChange} placeholder="e.g. 2nd Year" style={styles.input} />
                    </div>
                    <div>
                        <label style={styles.label}>Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleChange} style={{...styles.input, minHeight: '60px', resize: 'vertical'}} />
                    </div>

                </div>

                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📅</span> Joined on {new Date(profile?.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🌐</span> Profile Visibility: <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{profile?.profile_visibility || profile?.privacy || 'public'}</span>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} style={{ background: 'var(--peacock-green)', border: 'none', color: '#fff', padding: '0.65rem 1.5rem', borderRadius: 10, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 8px rgba(17,94,89,0.25)', transition: 'all 0.2s', opacity: saving ? 0.8 : 1 }}>
                        {saving ? <ButtonSpinner label="Saving..." /> : <><span>💾</span> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Profile Picture & Banner */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>Profile Picture & Banner</h2>
                <p style={{ margin: '0 0 2rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your profile picture and cover banner.</p>

                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    
                    {/* Picture */}
                    <div>
                        <label style={styles.label}>Profile Picture</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--bg-elevated)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
                                )}
                            </div>
                            <div>
                                <input type="file" id="picture-upload" accept="image/*" onChange={handlePictureUpload} disabled={uploadingPicture} style={{ display: 'none' }} />
                                <label htmlFor="picture-upload" style={{ ...styles.uploadBtn, opacity: uploadingPicture ? 0.7 : 1, cursor: uploadingPicture ? 'not-allowed' : 'pointer' }}>
                                    {uploadingPicture ? 'Uploading...' : '↑ Change Picture'}
                                </label>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG or WebP. Max size 2MB.</p>
                            </div>
                        </div>
                    </div>

                    {/* Banner */}
                    <div style={{ flex: 1, minWidth: 280 }}>
                        <label style={styles.label}>Banner Image</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                            <div style={{ flex: 1, height: 80, borderRadius: 12, background: 'linear-gradient(135deg, var(--bg-mint), var(--peacock-green))', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                {profile?.banner_url && (
                                    <img src={profile.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                )}
                            </div>
                            <div>
                                <input type="file" id="banner-upload" accept="image/*" onChange={handleBannerUpload} disabled={uploadingBanner} style={{ display: 'none' }} />
                                <label htmlFor="banner-upload" style={{ ...styles.uploadBtn, opacity: uploadingBanner ? 0.7 : 1, cursor: uploadingBanner ? 'not-allowed' : 'pointer' }}>
                                    {uploadingBanner ? 'Uploading...' : '↑ Change Banner'}
                                </label>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG or WebP. Recommended 1200x300px.</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
}

const styles = {
    label: {
        display: 'block',
        fontSize: '0.85rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem'
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        background: 'transparent',
        color: 'var(--text-primary)',
        fontSize: '0.95rem'
    },
    verifiedBadge: {
        background: '#ECFDF5',
        color: '#10B981',
        padding: '0.3rem 0.6rem',
        borderRadius: 8,
        fontSize: '0.75rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap'
    },
    uploadBtn: {
        background: 'transparent',
        border: '1px solid var(--border-color)',
        color: 'var(--text-primary)',
        padding: '0.5rem 1rem',
        borderRadius: 8,
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: '0.85rem'
    }
};
