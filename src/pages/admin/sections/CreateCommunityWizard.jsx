import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../supabaseClient.js';

// design-references/New Scree/Create-community.png — 5-step wizard replacing
// the old flat FormModal. Schema reality-check (live PostgREST probes against
// `communities`) before building this:
//   REAL columns used below: name, slug, description, short_description,
//   category, guidelines, is_paid, price, status, visibility, emoji,
//   logo_url, cover_image_url, created_by, created_at.
//   NOT REAL (confirmed missing, 42703): detailed_description, sub_category,
//   primary_language, secondary_languages, tags, who_can_post/comment,
//   join_approval_required, theme/accent/banner color, allow_comments,
//   allow_posts, is_moderated, rules, website_url, social_links,
//   contact_email, mission, max_members.
// The reference's Sub Category / Primary Language / Tags / Secondary
// Languages fields and the entire "Permissions" step have no backing
// columns — they are NOT built here (a required field with nowhere to save
// would silently do nothing), and are flagged in the Permissions step and
// in the final report instead of faked.

function Toast({ msg, type }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
            background: isErr ? 'rgba(30,15,15,0.97)' : 'rgba(15,30,25,0.97)',
            border: `1px solid ${isErr ? 'var(--accent-coral)' : 'var(--border-mint)'}`,
            borderRadius: 12, padding: '0.9rem 1.4rem', color: '#fff',
            fontSize: '0.875rem', fontWeight: 600, boxShadow: 'var(--shadow-lg)',
        }}>{msg}</div>
    );
}

const STEPS = [
    { id: 1, label: 'Basic Information', desc: 'Add name, description, category and images' },
    { id: 2, label: 'Settings & Rules', desc: 'Set privacy, visibility and community rules' },
    { id: 3, label: 'Permissions', desc: 'Configure who can post, comment and join' },
    { id: 4, label: 'Customization', desc: 'Customize appearance and features' },
    { id: 5, label: 'Review & Publish', desc: 'Review all details and publish community' },
];

const EMOJI_CHOICES = ['🏘️', '💼', '🎨', '💻', '📚', '🚀', '🗣️', '⚽', '🎮', '🌱', '📷', '🎵'];
const VISIBILITY_LABELS = { public: 'Public', private: 'Private', invite_only: 'Invite Only' };

export default function CreateCommunityWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [uploadingIcon, setUploadingIcon] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [toast, setToast] = useState(null);
    const iconInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const previewRef = useRef(null);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const [form, setForm] = useState({
        name: '', short_description: '', description: '', category: '',
        logo_url: '', cover_image_url: '', emoji: '🏘️',
        visibility: 'public', guidelines: '', is_paid: false, price: 0,
        status: 'Coming Soon',
    });
    const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

    // Real categories, drawn from existing communities — not a hardcoded guess.
    useEffect(() => {
        supabase.from('communities').select('category').then(({ data }) => {
            setCategoryOptions([...new Set((data || []).map(r => r.category).filter(Boolean))].sort());
        });
    }, []);

    const uploadFile = async (e, setUploading, key) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
            // No dedicated community-icons/community-covers bucket exists —
            // reusing the real, already-working `event-images` bucket
            // (same one EventsManager.jsx uploads into) under a
            // `communities/` prefix, rather than inventing a new bucket
            // this session can't provision (storage buckets need
            // dashboard/service-role access, same class of gap as the
            // `admins` table RLS block found earlier).
            const filePath = `communities/${fileName}`;
            const { error } = await supabase.storage.from('event-images').upload(filePath, file);
            if (error) throw error;
            const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
            set(key, data.publicUrl);
            showToast('Image uploaded');
        } catch (err) {
            showToast('Upload failed: ' + err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const validateStep1 = () => form.name.trim() && form.short_description.trim() && form.description.trim() && form.category.trim();

    const handleNext = () => {
        if (step === 1 && !validateStep1()) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        setStep(s => Math.min(5, s + 1));
    };
    const handleBack = () => setStep(s => Math.max(1, s - 1));

    const handlePublish = async () => {
        if (!validateStep1()) {
            showToast('Basic Information is incomplete.', 'error');
            setStep(1);
            return;
        }
        setSaving(true);
        try {
            const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const { data: existing } = await supabase.from('communities').select('id').eq('slug', slug).maybeSingle();
            if (existing) {
                showToast('A community with a similar name already exists.', 'error');
                setSaving(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            const payload = {
                name: form.name, slug,
                short_description: form.short_description,
                description: form.description,
                category: form.category,
                logo_url: form.logo_url || null,
                cover_image_url: form.cover_image_url || null,
                emoji: form.emoji,
                visibility: form.visibility,
                guidelines: form.guidelines,
                is_paid: form.is_paid,
                price: form.is_paid ? (form.price || 0) : 0,
                status: form.status,
                created_by: session?.user?.id,
            };
            const { error } = await supabase.from('communities').insert(payload);
            if (error) throw error;
            showToast('Community published!');
            setTimeout(() => navigate('/admin/communities'), 700);
        } catch (err) {
            showToast('Publish failed: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <Link to="/admin/communities" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Communities</Link> › Create New Community
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900 }}>👥 Create New Community</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fill in the details below to create a new community for students.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} style={{ padding: '0.55rem 1.1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer' }}>
                        👁 Preview Community
                    </button>
                    <button onClick={() => navigate('/admin/communities')} style={{ padding: '0.55rem 1.1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer' }}>
                        ✕ Cancel
                    </button>
                </div>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.25rem 1.5rem', overflowX: 'auto' }}>
                {STEPS.map((s, i) => (
                    <React.Fragment key={s.id}>
                        <button onClick={() => (s.id < step || s.id === step) && setStep(s.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', cursor: s.id <= step ? 'pointer' : 'default', flexShrink: 0, fontFamily: 'inherit' }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
                                background: s.id < step ? 'var(--peacock-green)' : (s.id === step ? 'var(--peacock-green)' : 'var(--bg-elevated)'),
                                color: s.id <= step ? '#fff' : 'var(--text-muted)',
                                border: s.id <= step ? 'none' : '1px solid var(--border-color)',
                            }}>
                                {s.id < step ? '✓' : s.id}
                            </span>
                            <span style={{ fontSize: '0.85rem', fontWeight: s.id === step ? 800 : 600, color: s.id === step ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>{s.label}</span>
                        </button>
                        {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: s.id < step ? 'var(--peacock-green)' : 'var(--border-color)', margin: '0 0.75rem', minWidth: 20 }} />}
                    </React.Fragment>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* MAIN */}
                <div style={{ flex: '1 1 0%', minWidth: 480 }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.75rem' }}>
                        {step === 1 && (
                            <StepBasicInfo
                                form={form} set={set}
                                uploadingIcon={uploadingIcon} uploadingCover={uploadingCover}
                                iconInputRef={iconInputRef} coverInputRef={coverInputRef}
                                onIconFile={e => uploadFile(e, setUploadingIcon, 'logo_url')}
                                onCoverFile={e => uploadFile(e, setUploadingCover, 'cover_image_url')}
                                categoryOptions={categoryOptions}
                            />
                        )}
                        {step === 2 && <StepSettingsRules form={form} set={set} />}
                        {step === 3 && <StepPermissions />}
                        {step === 4 && <StepCustomization form={form} set={set} />}
                        {step === 5 && <StepReview form={form} set={set} />}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                            <div>
                                {step > 1 && (
                                    <button onClick={handleBack} style={{ padding: '0.65rem 1.25rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer' }}>
                                        ← Back
                                    </button>
                                )}
                            </div>
                            {step < 5 ? (
                                <button onClick={handleNext} style={{ padding: '0.65rem 1.5rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    Save & Continue →
                                </button>
                            ) : (
                                <button onClick={handlePublish} disabled={saving} style={{ padding: '0.65rem 1.5rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    {saving ? 'Publishing…' : '🚀 Publish Community'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* "What happens next?" — real, matches the actual flow:
                        a new community lands with the status chosen on the
                        Review step (Live goes live immediately, no separate
                        admin-approval queue exists in this data model — so
                        no fake "Admin approval within 24-48 hours" claim). */}
                    <div style={{ marginTop: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                        <WhatNext icon="📝" title="Review" desc="Fill in every step of this form." />
                        <WhatNext icon="✅" title="Choose Status" desc="Publish Live, or save as Coming Soon." />
                        <WhatNext icon="🚀" title="Publishing" desc="Live communities appear immediately." />
                        <WhatNext icon="📈" title="Growth" desc="Invite members and start posting." />
                    </div>
                </div>

                {/* RIGHT RAIL */}
                <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1.1rem', fontSize: '1rem', fontWeight: 800 }}>Creation Workflow</h3>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {STEPS.map((s, i) => (
                                <div key={s.id} style={{ display: 'flex', gap: '0.85rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, flexShrink: 0, background: s.id <= step ? 'var(--peacock-green)' : 'var(--bg-elevated)', color: s.id <= step ? '#fff' : 'var(--text-muted)' }}>
                                            {s.id < step ? '✓' : s.id}
                                        </span>
                                        {i < STEPS.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 24, background: s.id < step ? 'var(--peacock-green)' : 'var(--border-color)' }} />}
                                    </div>
                                    <div style={{ paddingBottom: '1.1rem' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: s.id === step ? 800 : 700, color: s.id === step ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{s.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 0.9rem', fontSize: '1rem', fontWeight: 800 }}>Community Guidelines</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {['Ensure the community name is clear and relevant', 'Write a comprehensive description', 'Choose the right category for discoverability', 'Set clear rules to maintain a healthy community', 'Review all settings before publishing'].map(tip => (
                                <div key={tip} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <span style={{ color: 'var(--peacock-green)' }}>✓</span> {tip}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div ref={previewRef} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.5rem' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 800 }}>Preview</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.75rem' }}>
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: form.logo_url ? `url(${form.logo_url}) center/cover` : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                {!form.logo_url && form.emoji}
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{form.name || 'Community Name'}</span>
                                    <span style={{ padding: '0.1rem 0.45rem', borderRadius: 10, fontSize: '0.65rem', fontWeight: 800, background: form.status === 'Live' ? '#10B98115' : '#F59E0B15', color: form.status === 'Live' ? '#10B981' : '#F59E0B' }}>{form.status}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{form.category || 'Category'} · {VISIBILITY_LABELS[form.visibility] || form.visibility}</div>
                            </div>
                        </div>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{form.short_description || 'Short description will appear here.'}</p>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>👥 0 Members · 📝 0 Posts</div>
                    </div>

                    <div style={{ background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 14, padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.9rem', fontWeight: 800 }}>Need Help?</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fill in the required fields on each step, then Publish on the final step to make it live.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function WhatNext({ icon, title, desc }) {
    return (
        <div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>{title}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
        </div>
    );
}

function Field({ label, required, hint, children }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                {label}{required && <span style={{ color: '#EF4444' }}> *</span>}
            </label>
            {children}
            {hint && <p style={{ margin: '0.3rem 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hint}</p>}
        </div>
    );
}

const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' };

function StepBasicInfo({ form, set, uploadingIcon, uploadingCover, iconInputRef, coverInputRef, onIconFile, onCoverFile, categoryOptions }) {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Basic Information</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Provide the essential details about your community.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Field label="Community Name" required>
                        <input value={form.name} onChange={e => set('name', e.target.value.slice(0, 60))} maxLength={60} placeholder="e.g., Data Science Hub" style={inputStyle} />
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{form.name.length}/60</div>
                    </Field>
                    <Field label="Short Description" required>
                        <input value={form.short_description} onChange={e => set('short_description', e.target.value.slice(0, 150))} maxLength={150} placeholder="A short description about the community…" style={inputStyle} />
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{form.short_description.length}/150</div>
                    </Field>
                    <Field label="Detailed Description" required>
                        <textarea value={form.description} onChange={e => set('description', e.target.value.slice(0, 2000))} maxLength={2000} rows={5} placeholder="Describe the purpose, goals and what members can expect in this community…" style={{ ...inputStyle, resize: 'vertical' }} />
                        <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{form.description.length}/2000</div>
                    </Field>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Field label="Community Icon">
                        <input ref={iconInputRef} type="file" accept="image/*" onChange={onIconFile} style={{ display: 'none' }} />
                        <button onClick={() => iconInputRef.current?.click()} disabled={uploadingIcon} style={{ width: '100%', padding: '1.25rem', borderRadius: 10, border: '1.5px dashed var(--border-color)', background: 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'center' }}>
                            {form.logo_url ? (
                                <img src={form.logo_url} alt="Icon" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', margin: '0 auto' }} />
                            ) : (
                                <>
                                    <div style={{ fontSize: '1.3rem' }}>{uploadingIcon ? '⏳' : '⬆️'}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0.4rem 0 0.15rem' }}>{uploadingIcon ? 'Uploading…' : 'Upload Icon'}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PNG, JPG. Max 2MB.</div>
                                </>
                            )}
                        </button>
                    </Field>
                    <Field label="Cover Image (Optional)">
                        <input ref={coverInputRef} type="file" accept="image/*" onChange={onCoverFile} style={{ display: 'none' }} />
                        <button onClick={() => coverInputRef.current?.click()} disabled={uploadingCover} style={{ width: '100%', padding: '1.25rem', borderRadius: 10, border: '1.5px dashed var(--border-color)', background: 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'center' }}>
                            {form.cover_image_url ? (
                                <img src={form.cover_image_url} alt="Cover" style={{ width: '100%', height: 60, borderRadius: 8, objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <div style={{ fontSize: '1.3rem' }}>{uploadingCover ? '⏳' : '⬆️'}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0.4rem 0 0.15rem' }}>{uploadingCover ? 'Uploading…' : 'Upload Cover Image'}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PNG, JPG. Max 5MB.</div>
                                </>
                            )}
                        </button>
                    </Field>
                </div>
            </div>

            <Field label="Category" required>
                <input value={form.category} onChange={e => set('category', e.target.value)} list="category-options" placeholder="Select or type a category" style={inputStyle} />
                <datalist id="category-options">
                    {categoryOptions.map(c => <option key={c} value={c} />)}
                </datalist>
            </Field>

            {/* Reference also shows Sub Category, Primary Language, Tags, and
                Secondary Languages here — none of those have a backing
                column on `communities` (confirmed via live schema probe).
                Not built: a "required" field with nowhere to persist would
                silently do nothing, which is worse than not having it. */}
            <div style={{ marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ The reference design also includes Sub Category, Primary/Secondary Language, and Tags fields here. Those don't have matching columns in the database yet, so they're left out rather than built as fields that wouldn't actually save.
            </div>
        </div>
    );
}

function StepSettingsRules({ form, set }) {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Settings & Rules</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Set privacy, visibility and community rules.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Field label="Visibility" required>
                    {/* Values are lowercase/underscored to match the real
                        `communities_visibility_check` constraint (confirmed
                        live: 'Public'/'Invite Only' etc. get rejected with a
                        23514 check-constraint error — this exact bug also
                        existed in the old Edit-Community modal's dropdown,
                        fixed there too). */}
                    <select value={form.visibility} onChange={e => set('visibility', e.target.value)} style={inputStyle}>
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="invite_only">Invite Only</option>
                    </select>
                </Field>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input type="checkbox" id="is_paid" checked={form.is_paid} onChange={e => set('is_paid', e.target.checked)} />
                    <label htmlFor="is_paid" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Paid community?</label>
                </div>
                {form.is_paid && (
                    <Field label="Price (₹)" required>
                        <input type="number" min="0" value={form.price} onChange={e => set('price', Number(e.target.value))} style={inputStyle} />
                    </Field>
                )}
                <Field label="Community Rules / Guidelines" hint="Shown to members on the community's About tab.">
                    <textarea value={form.guidelines} onChange={e => set('guidelines', e.target.value)} rows={5} placeholder="Be respectful, stay on topic, no spam…" style={{ ...inputStyle, resize: 'vertical' }} />
                </Field>
            </div>
        </div>
    );
}

function StepPermissions() {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Permissions</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure who can post, comment and join.</p>
            {/* Confirmed via live schema probe: no who_can_post,
                who_can_comment, or join_approval_required columns exist on
                `communities` — granular permissions aren't part of the data
                model. An honest empty state instead of decorative dropdowns
                that wouldn't save anything. */}
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>🚧</div>
                <p style={{ margin: '0 0 0.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Not available yet</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 400, marginInline: 'auto' }}>
                    Granular post/comment/join permissions aren't part of the data model yet. All communities currently share the same rule set — set community-specific rules on the previous step.
                </p>
            </div>
        </div>
    );
}

function StepCustomization({ form, set }) {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Customization</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Customize appearance and features.</p>
            <Field label="Badge Emoji" hint="Shown on community cards wherever no icon image is uploaded.">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.6rem', marginBottom: '0.75rem' }}>
                    {EMOJI_CHOICES.map(em => (
                        <button key={em} onClick={() => set('emoji', em)} style={{ padding: '0.6rem', fontSize: '1.3rem', borderRadius: 10, cursor: 'pointer', background: form.emoji === em ? 'var(--bg-mint)' : 'var(--bg-elevated)', border: `1.5px solid ${form.emoji === em ? 'var(--peacock-green)' : 'var(--border-color)'}` }}>
                            {em}
                        </button>
                    ))}
                </div>
                <input value={form.emoji} onChange={e => set('emoji', e.target.value.slice(0, 4))} placeholder="Or type a custom emoji" style={inputStyle} />
            </Field>
            {/* Reference's "Customization" step implies deeper theming
                (colors, banners) — no theme_color/accent_color/banner_color
                columns exist (confirmed via schema probe), so this step is
                limited to the one real customization field. */}
        </div>
    );
}

function StepReview({ form, set }) {
    const Row = ({ label, value }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
        </div>
    );
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Review & Publish</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Review all details, choose a status, and publish.</p>
            <div style={{ marginBottom: '1.5rem' }}>
                <Row label="Name" value={form.name} />
                <Row label="Category" value={form.category} />
                <Row label="Short Description" value={form.short_description} />
                <Row label="Visibility" value={VISIBILITY_LABELS[form.visibility] || form.visibility} />
                <Row label="Paid" value={form.is_paid ? `Yes (₹${form.price})` : 'No'} />
                <Row label="Icon" value={form.logo_url ? 'Uploaded' : `${form.emoji} (emoji only)`} />
                <Row label="Cover Image" value={form.cover_image_url ? 'Uploaded' : 'None'} />
            </div>
            <Field label="Status" required hint="Live is visible to students immediately. Coming Soon stays hidden until an admin flips it to Live later.">
                <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                    <option value="Live">Live</option>
                    <option value="Coming Soon">Coming Soon</option>
                </select>
            </Field>
        </div>
    );
}
