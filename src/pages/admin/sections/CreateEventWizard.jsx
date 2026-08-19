import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../../supabaseClient.js';

// design-references/New Scree/Event-admin.png — 5-step wizard for the admin
// Events section, same shell pattern as CreateCommunityWizard.jsx.
//
// Schema reality-check (live PostgREST probes against `events`) before
// building this:
//   REAL columns used below: title, description, category, image_url, tags,
//   event_date, end_date, timezone, registration_deadline, location, mode,
//   meeting_link, address, map_link, community_id, host_name, highlights,
//   price, seats_total, allow_waitlist, payment_link, refund_policy, status,
//   visibility, featured_on_landing, seo_title, seo_description,
//   certificate_enabled, attendance_required, organizer_id, slug.
//   community_id (optional "Attach to a Community" field) is what makes
//   community-scoped events possible at all — previously nothing anywhere
//   in the app ever set it, confirmed live (zero real events had a non-null
//   community_id), which is why CommunityLanding.jsx's Events tab is still
//   commented out pending real data to show.
//   CONFIRMED AUTHORITATIVE vs DEAD pair-members (grepped every real read,
//   not just writes): seats_total IS read by EventDetail.jsx's real
//   capacity/registration logic — max_capacity has zero reads or writes
//   anywhere and is not used. allow_waitlist IS read by EventDetail.jsx's
//   real waitlist button/logic — waitlist_enabled has zero reads or writes
//   anywhere. This wizard writes seats_total/allow_waitlist, not their
//   dead counterparts.
//   NOT REAL as a distinct concept (confirmed — the reference implies a
//   structure this schema doesn't have): a true multi-speaker list (name +
//   bio + photo per speaker) — only a single `host_name` text column
//   exists. Ticket tiers (multiple price/quantity combinations) — only a
//   single flat `price` column exists. Both flagged inline in Step 3/4
//   rather than built as fields with nowhere real to save the extra
//   structure, same convention as CreateCommunityWizard.jsx.

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
    { id: 1, label: 'Basic Details', desc: 'Add title, description, category and banner' },
    { id: 2, label: 'Schedule & Location', desc: 'Set date, time, duration and location/platform' },
    { id: 3, label: 'Speakers & Content', desc: 'Add host and event highlights' },
    { id: 4, label: 'Tickets & Registration', desc: 'Configure pricing, seats and registration' },
    { id: 5, label: 'Review & Publish', desc: 'Review all details and publish the event' },
];

const CATEGORY_OPTIONS = ['Workshop', 'Webinar', 'Hackathon', 'Workation', 'Staycation', 'Debate', 'Other'];
const STATUS_OPTIONS = [
    { value: 'coming_soon', label: '⏳ Coming Soon' },
    { value: 'live', label: '🟢 Live' },
    { value: 'completed', label: '🏁 Completed' },
    { value: 'cancelled', label: '🚫 Cancelled' },
];

const inputStyle = { width: '100%', padding: '0.65rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.88rem', fontFamily: 'inherit', boxSizing: 'border-box' };

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

// Simple chip-input for the two real array columns (tags, highlights) — type
// and press Enter to add, click a chip's × to remove.
function ChipInput({ values, onChange, placeholder }) {
    const [text, setText] = useState('');
    const add = () => {
        const v = text.trim();
        if (v && !values.includes(v)) onChange([...values, v]);
        setText('');
    };
    return (
        <div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
                    placeholder={placeholder}
                    style={inputStyle}
                />
                <button type="button" onClick={add} style={{ padding: '0 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', fontWeight: 700, cursor: 'pointer' }}>Add</button>
            </div>
            {values.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                    {values.map(v => (
                        <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.6rem', borderRadius: 20, background: 'var(--bg-mint)', color: 'var(--peacock-green)', fontSize: '0.78rem', fontWeight: 700 }}>
                            {v}
                            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 800, padding: 0 }}>×</button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CreateEventWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [toast, setToast] = useState(null);
    const imageInputRef = useRef(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const [form, setForm] = useState({
        title: '', description: '', category: '', image_url: '', tags: [],
        event_date: '', end_date: '', timezone: 'Asia/Kolkata', registration_deadline: '',
        location: '', mode: 'offline', meeting_link: '', address: '', map_link: '',
        community_id: '',
        host_name: '', highlights: [],
        price: 0, seats_total: '', allow_waitlist: false, payment_link: '', refund_policy: '',
        status: 'coming_soon', visibility: 'draft', featured_on_landing: false,
        seo_title: '', seo_description: '', certificate_enabled: false, attendance_required: false,
    });
    const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

    // Real communities, for the optional "Attach to a Community" field —
    // this is what makes events.community_id settable at all; without it
    // community-scoped events can never exist (confirmed live, zero real
    // events have a non-null community_id, and the community-facing Events
    // tab is still commented out pending exactly this).
    const [communityOptions, setCommunityOptions] = useState([]);
    useEffect(() => {
        supabase.from('communities').select('id, name').order('name').then(({ data }) => {
            setCommunityOptions(data || []);
        });
    }, []);

    const onImageFile = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploadingImage(true);
        try {
            const ext = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
            const filePath = `events/${fileName}`;
            const { error } = await supabase.storage.from('event-images').upload(filePath, file);
            if (error) throw error;
            const { data } = supabase.storage.from('event-images').getPublicUrl(filePath);
            set('image_url', data.publicUrl);
            showToast('Image uploaded');
        } catch (err) {
            showToast('Upload failed: ' + err.message, 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const validateStep1 = () => form.title.trim() && form.description.trim() && form.category.trim();
    const validateStep2 = () => form.event_date && form.location.trim();

    const handleNext = () => {
        if (step === 1 && !validateStep1()) { showToast('Please fill in all required fields.', 'error'); return; }
        if (step === 2 && !validateStep2()) { showToast('Event date and location are required.', 'error'); return; }
        setStep(s => Math.min(5, s + 1));
    };
    const handleBack = () => setStep(s => Math.max(1, s - 1));

    const handlePublish = async () => {
        if (!validateStep1()) { showToast('Basic Details is incomplete.', 'error'); setStep(1); return; }
        if (!validateStep2()) { showToast('Schedule & Location is incomplete.', 'error'); setStep(2); return; }
        setSaving(true);
        try {
            // Same real pattern as CreateCommunityWizard.jsx:126-132 — kebab-case
            // from the title, check-then-reject on collision (not the random-
            // suffix style the one pre-existing real slug happens to have).
            const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const { data: existing } = await supabase.from('events').select('id').eq('slug', slug).maybeSingle();
            if (existing) {
                showToast('An event with a similar title already exists.', 'error');
                setSaving(false);
                return;
            }
            const { data: { session } } = await supabase.auth.getSession();
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category,
                image_url: form.image_url || null,
                tags: form.tags.length ? form.tags : null,
                event_date: new Date(form.event_date).toISOString(),
                end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
                timezone: form.timezone || 'Asia/Kolkata',
                registration_deadline: form.registration_deadline ? new Date(form.registration_deadline).toISOString() : null,
                location: form.location.trim(),
                mode: form.mode,
                community_id: form.community_id || null,
                meeting_link: form.meeting_link?.trim() || null,
                address: form.address?.trim() || null,
                map_link: form.map_link?.trim() || null,
                host_name: form.host_name?.trim() || null,
                highlights: form.highlights.length ? form.highlights : null,
                price: Number(form.price) || 0,
                seats_total: form.seats_total !== '' ? Number(form.seats_total) : null,
                allow_waitlist: form.allow_waitlist,
                payment_link: form.payment_link?.trim() || null,
                refund_policy: form.refund_policy?.trim() || null,
                status: form.status,
                visibility: form.visibility,
                featured_on_landing: form.featured_on_landing,
                seo_title: form.seo_title?.trim() || null,
                seo_description: form.seo_description?.trim() || null,
                certificate_enabled: form.certificate_enabled,
                attendance_required: form.attendance_required,
                organizer_id: session?.user?.id,
                slug,
            };
            const { error } = await supabase.from('events').insert(payload);
            if (error) throw error;
            showToast('Event published!');
            setTimeout(() => navigate('/admin/events'), 700);
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
                <Link to="/admin/events" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Events</Link> › Create New Event
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900 }}>🎪 Create New Event</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Fill in the details below to create a new platform event.</p>
                </div>
                <button onClick={() => navigate('/admin/events')} style={{ padding: '0.55rem 1.1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer' }}>
                    ✕ Cancel
                </button>
            </div>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.25rem 1.5rem', overflowX: 'auto' }}>
                {STEPS.map((s, i) => (
                    <React.Fragment key={s.id}>
                        <button onClick={() => s.id <= step && setStep(s.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', cursor: s.id <= step ? 'pointer' : 'default', flexShrink: 0, fontFamily: 'inherit' }}>
                            <span style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
                                background: s.id <= step ? 'var(--peacock-green)' : 'var(--bg-elevated)',
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
                        {step === 1 && <StepBasicDetails form={form} set={set} uploadingImage={uploadingImage} imageInputRef={imageInputRef} onImageFile={onImageFile} />}
                        {step === 2 && <StepScheduleLocation form={form} set={set} communityOptions={communityOptions} />}
                        {step === 3 && <StepSpeakersContent form={form} set={set} />}
                        {step === 4 && <StepTicketsRegistration form={form} set={set} />}
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
                                <button onClick={handleNext} style={{ padding: '0.65rem 1.5rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                    Save & Continue →
                                </button>
                            ) : (
                                <button onClick={handlePublish} disabled={saving} style={{ padding: '0.65rem 1.5rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                    {saving ? 'Publishing…' : '🚀 Publish Event'}
                                </button>
                            )}
                        </div>
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

                    <div style={{ background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 14, padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.4rem', fontSize: '0.9rem', fontWeight: 800 }}>Need Help?</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fill in the required fields on each step, then Publish on the final step to make it live.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StepBasicDetails({ form, set, uploadingImage, imageInputRef, onImageFile }) {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Basic Details</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Provide the essential details about your event.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <Field label="Event Title" required>
                        <input value={form.title} onChange={e => set('title', e.target.value.slice(0, 120))} maxLength={120} placeholder="e.g., Arduino & Sensors Bootcamp" style={inputStyle} />
                    </Field>
                    <Field label="Event Category" required>
                        <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                            <option value="">— Select —</option>
                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </Field>
                    <Field label="Description" required hint="events.description is NOT NULL — required to save.">
                        <textarea value={form.description} onChange={e => set('description', e.target.value.slice(0, 2000))} maxLength={2000} rows={5} placeholder="Describe the event, agenda, what attendees should expect…" style={{ ...inputStyle, resize: 'vertical' }} />
                    </Field>
                    <Field label="Tags" hint="Press Enter or click Add after typing each tag.">
                        <ChipInput values={form.tags} onChange={v => set('tags', v)} placeholder="e.g. beginner-friendly" />
                    </Field>
                </div>

                <div>
                    <Field label="Event Banner Image">
                        <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageFile} style={{ display: 'none' }} />
                        <button onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} style={{ width: '100%', padding: '1.25rem', borderRadius: 10, border: '1.5px dashed var(--border-color)', background: 'var(--bg-elevated)', cursor: 'pointer', textAlign: 'center' }}>
                            {form.image_url ? (
                                <img src={form.image_url} alt="Banner" style={{ width: '100%', height: 90, borderRadius: 8, objectFit: 'cover' }} />
                            ) : (
                                <>
                                    <div style={{ fontSize: '1.3rem' }}>{uploadingImage ? '⏳' : '⬆️'}</div>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, margin: '0.4rem 0 0.15rem' }}>{uploadingImage ? 'Uploading…' : 'Upload Banner'}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PNG, JPG. Max 5MB.</div>
                                </>
                            )}
                        </button>
                    </Field>
                </div>
            </div>
        </div>
    );
}

function StepScheduleLocation({ form, set, communityOptions }) {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Schedule & Location</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Set date, time and where the event happens.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <Field label="Event Date & Time" required>
                    <input type="datetime-local" value={form.event_date} onChange={e => set('event_date', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="End Date & Time" hint="Leave blank if not applicable.">
                    <input type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Registration Deadline">
                    <input type="datetime-local" value={form.registration_deadline} onChange={e => set('registration_deadline', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Timezone">
                    <input value={form.timezone} onChange={e => set('timezone', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Mode" hint="Read by the real event listing/filter (Events.jsx) and detail page.">
                    <select value={form.mode} onChange={e => set('mode', e.target.value)} style={inputStyle}>
                        <option value="offline">In-Person</option>
                        <option value="online">Online</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </Field>
                <Field label="Location / Platform" required placeholder="e.g. Online (Zoom) / Goa">
                    <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Online (Zoom) / Goa" style={inputStyle} />
                </Field>
                {form.mode !== 'offline' && (
                    <Field label="Meeting Link">
                        <input type="url" value={form.meeting_link} onChange={e => set('meeting_link', e.target.value)} placeholder="https://..." style={inputStyle} />
                    </Field>
                )}
                {form.mode !== 'online' && (
                    <>
                        <Field label="Address">
                            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Street address, city" style={inputStyle} />
                        </Field>
                        <Field label="Map Link">
                            <input type="url" value={form.map_link} onChange={e => set('map_link', e.target.value)} placeholder="https://maps.google.com/..." style={inputStyle} />
                        </Field>
                    </>
                )}
                <Field label="Attach to a Community" hint="Optional. Defaults to none/platform-wide. Writes to events.community_id — makes community-scoped events possible for the first time.">
                    <select value={form.community_id} onChange={e => set('community_id', e.target.value)} style={inputStyle}>
                        <option value="">— None (platform-wide) —</option>
                        {communityOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </Field>
            </div>
        </div>
    );
}

function StepSpeakersContent({ form, set }) {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Speakers & Content</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add a host and event highlights.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Field label="Speaker / Host Name">
                    <input value={form.host_name} onChange={e => set('host_name', e.target.value)} placeholder="e.g. Arjun Menon" style={inputStyle} />
                </Field>
                <Field label="Highlights" hint="Short bullet points about the event — press Enter or click Add after each.">
                    <ChipInput values={form.highlights} onChange={v => set('highlights', v)} placeholder="e.g. Kits provided on-site" />
                </Field>
            </div>
            {/* Reference implies a real multi-speaker list (name + bio + photo per
                speaker) — no backing structure exists on `events`, only the single
                host_name column above. Not built as a field with nowhere real to
                save the extra structure; a real future schema addition if wanted. */}
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ The reference design implies multiple speakers (name, bio, photo per person). The real schema only has one plain-text host name — that's what's collected above. A true multi-speaker list would need new columns, not built in this pass.
            </div>
        </div>
    );
}

function StepTicketsRegistration({ form, set }) {
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Tickets & Registration</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Configure pricing, seats and registration.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <Field label="Price (₹)" hint="0 for free events.">
                    <input type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Payment Link (Cashfree)" hint="For paid events.">
                    <input type="url" value={form.payment_link} onChange={e => set('payment_link', e.target.value)} placeholder="https://..." style={inputStyle} />
                </Field>
                <Field label="Total Seats" hint="Leave blank for unlimited. Real — read by the live Register Now flow.">
                    <input type="number" min="0" value={form.seats_total} onChange={e => set('seats_total', e.target.value)} placeholder="e.g. 50" style={inputStyle} />
                </Field>
                <Field label="Refund Policy">
                    <input value={form.refund_policy} onChange={e => set('refund_policy', e.target.value)} placeholder="e.g. Full refund up to 48h before" style={inputStyle} />
                </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1.25rem' }}>
                <input type="checkbox" id="allow_waitlist" checked={form.allow_waitlist} onChange={e => set('allow_waitlist', e.target.checked)} />
                <label htmlFor="allow_waitlist" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Allow waitlist once seats are full</label>
            </div>
            {/* Reference implies multiple ticket tiers (e.g. Early Bird / Standard /
                VIP with different prices) — only a single flat `price` column
                exists. Not built as fields with nowhere real to save the extra
                structure; a real future schema addition if wanted. */}
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                ℹ️ The reference design implies multiple ticket tiers (Early Bird, Standard, VIP...). The real schema only has one flat price — that's what's collected above. Real ticket tiers would need new columns, not built in this pass.
            </div>
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
    const slugPreview = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    return (
        <div>
            <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>Review & Publish</h2>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Review all details, choose a status, and publish.</p>
            <div style={{ marginBottom: '1.5rem' }}>
                <Row label="Title" value={form.title} />
                <Row label="URL" value={slugPreview ? `/events/${slugPreview}` : '—'} />
                <Row label="Category" value={form.category} />
                <Row label="Date" value={form.event_date ? new Date(form.event_date).toLocaleString('en-IN') : ''} />
                <Row label="Location" value={form.location} />
                <Row label="Mode" value={form.mode} />
                <Row label="Host" value={form.host_name} />
                <Row label="Price" value={Number(form.price) === 0 ? 'Free' : `₹${form.price}`} />
                <Row label="Seats" value={form.seats_total || 'Unlimited'} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <Field label="Status" required hint="Live is visible to students immediately.">
                    <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </Field>
                <Field label="Visibility">
                    <select value={form.visibility} onChange={e => set('visibility', e.target.value)} style={inputStyle}>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </Field>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input type="checkbox" id="featured_on_landing" checked={form.featured_on_landing} onChange={e => set('featured_on_landing', e.target.checked)} />
                    <label htmlFor="featured_on_landing" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Feature on landing page</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input type="checkbox" id="certificate_enabled" checked={form.certificate_enabled} onChange={e => set('certificate_enabled', e.target.checked)} />
                    <label htmlFor="certificate_enabled" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Certificate included</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <input type="checkbox" id="attendance_required" checked={form.attendance_required} onChange={e => set('attendance_required', e.target.checked)} />
                    <label htmlFor="attendance_required" style={{ fontSize: '0.85rem', fontWeight: 700 }}>Attendance required</label>
                </div>
            </div>
            <Field label="SEO Title" hint="Optional — used for search/share previews.">
                <input value={form.seo_title} onChange={e => set('seo_title', e.target.value)} style={inputStyle} />
            </Field>
        </div>
    );
}
