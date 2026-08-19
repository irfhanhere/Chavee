import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

// 'cancelled' added as a real 4th status value — confirmed live it has no DB
// check constraint blocking it (a real write-then-revert test succeeded),
// it just wasn't wired into any admin UI option list before now.
const STATUS_OPTIONS = [
    { value: 'coming_soon', label: '⏳ Coming Soon' },
    { value: 'live',        label: '🟢 Live'        },
    { value: 'completed',   label: '🏁 Completed'   },
    { value: 'cancelled',   label: '🚫 Cancelled'    },
];

const STATUS_COLORS = {
    'coming_soon': '#F59E0B',
    'coming soon': '#F59E0B',
    'live':        '#10B981',
    'completed':   '#94A3B8',
    'cancelled':   '#EF4444',
};

// Status tabs — direct 1:1 with the real status vocabulary above (matches
// the existing STATUS_OPTIONS the admin form already used, rather than
// inventing date-math "happening now" semantics events.end_date can't
// reliably support — confirmed live, end_date is null on every real row).
const STATUS_TABS = [
    { id: 'all', label: 'All' },
    { id: 'coming_soon', label: 'Upcoming' },
    { id: 'live', label: 'Live Now' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const formatToDatetimeLocal = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const formatDisplayDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/* ─────────────────────────────────────────────
   INLINE TOAST
───────────────────────────────────────────── */
function Toast({ msg, type }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
            background: isErr ? 'rgba(30,15,15,0.97)' : 'rgba(15,30,25,0.97)',
            border: `1px solid ${isErr ? 'var(--accent-coral)' : 'var(--border-mint)'}`,
            borderRadius: 12, padding: '0.9rem 1.4rem', color: 'var(--text-primary)',
            fontSize: '0.875rem', fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeInUp 0.3s ease-out',
        }}>{msg}</div>
    );
}

/* ─────────────────────────────────────────────
   STATUS QUICK-TOGGLE
───────────────────────────────────────────── */
function EventStatusToggle({ status, busy, onClick }) {
    const isLive = status?.toLowerCase() === 'live';
    const isComing = status?.toLowerCase() === 'coming_soon' || status?.toLowerCase() === 'coming soon';
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={busy}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title={isLive ? 'Click to set Coming Soon' : 'Click to set Live'}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.22rem 0.7rem', borderRadius: 20,
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.72rem',
                transition: 'all 0.18s',
                background: isLive
                    ? (hov ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.08)')
                    : (isComing ? (hov ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.08)') : 'rgba(148,163,184,0.1)'),
                color: isLive
                    ? (hov ? '#F59E0B' : '#10B981')
                    : (isComing ? (hov ? '#10B981' : '#F59E0B') : 'var(--text-muted)'),
                border: isLive
                    ? `1px solid ${hov ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.18)'}`
                    : `1px solid ${isComing ? (hov ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.25)') : 'var(--border-color)'}`,
                opacity: busy ? 0.55 : 1,
                minWidth: 110,
            }}
        >
            {busy ? (
                <span style={{
                    width: 10, height: 10, border: '2px solid currentColor',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
            ) : (
                <span style={{ fontSize: '0.7rem' }}>{isLive ? (hov ? '⏳' : '●') : (hov ? '●' : '⏳')}</span>
            )}
            {isLive ? (hov ? 'Coming Soon' : 'Live') : (isComing ? (hov ? 'Go Live' : 'Coming Soon') : (hov ? 'Go Live' : status || 'Coming Soon'))}
        </button>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function EventsManager() {
    const navigate = useNavigate();
    const [rows, setRows]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [modal, setModal]       = useState({ open: false, mode: 'create', row: null });
    const [confirm, setConfirm]   = useState({ open: false, row: null });
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState(null); // id of event being quick-activated
    const [togglingFeaturedId, setTogglingFeaturedId] = useState(null);
    const [statusTab, setStatusTab] = useState('all');
    const [totalRegistrations, setTotalRegistrations] = useState(null);

    const [toast, setToast]       = useState(null);
    const toastTimer              = useRef(null);

    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    /* ── Fetch ── */
    const load = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('event_date', { ascending: true });
        if (error) showToast('Failed to load events: ' + error.message, 'error');
        setRows(data ?? []);
        setLoading(false);

        // Real Total Registrations stat — event_registrations count, all statuses
        // (confirmed/waitlisted), matching what the real Register Now flow writes.
        const { count } = await supabase.from('event_registrations').select('*', { count: 'exact', head: true });
        setTotalRegistrations(count ?? 0);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Real stat-card counts, derived from the same rows already loaded — no
    // extra queries needed for these 5.
    const stats = {
        total: rows.length,
        coming_soon: rows.filter(r => r.status?.toLowerCase() === 'coming_soon').length,
        live: rows.filter(r => r.status?.toLowerCase() === 'live').length,
        completed: rows.filter(r => r.status?.toLowerCase() === 'completed').length,
        cancelled: rows.filter(r => r.status?.toLowerCase() === 'cancelled').length,
    };

    const filteredRows = statusTab === 'all' ? rows : rows.filter(r => r.status?.toLowerCase() === statusTab);

    /* ── Quick status toggle (Coming Soon <-> Live) ── */
    const handleToggleStatus = async (row) => {
        setTogglingId(row.id);
        const newValue = row.status?.toLowerCase() === 'live' ? 'coming_soon' : 'live';
        const { error } = await supabase
            .from('events')
            .update({ status: newValue })
            .eq('id', row.id);
        setTogglingId(null);
        if (error) { showToast('Toggle failed: ' + error.message, 'error'); return; }
        showToast(newValue === 'live' ? `🎉 "${row.title}" is now LIVE!` : `⏳ "${row.title}" is set to Coming Soon.`);
        // Optimistic update
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: newValue } : r));
    };

    /* ── Quick featured toggle ── */
    const handleToggleFeatured = async (row) => {
        setTogglingFeaturedId(row.id);
        const newValue = !row.featured_on_landing;
        const { error } = await supabase
            .from('events')
            .update({ featured_on_landing: newValue })
            .eq('id', row.id);
        setTogglingFeaturedId(null);
        if (error) { showToast('Featured toggle failed: ' + error.message, 'error'); return; }
        showToast(newValue ? `🎉 "${row.title}" is now featured on the landing page!` : `❌ "${row.title}" is removed from featured events.`);
        // Optimistic update
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, featured_on_landing: newValue } : r));
    };

    /* ── Modal handlers ── */
    // Create now lives at /admin/events/new (CreateEventWizard.jsx) — this
    // FormModal is edit-only now, openCreate removed since nothing calls it.
    const openEdit   = (row) => setModal({ open: true, mode: 'edit', row });
    const closeModal = () => setModal(m => ({ ...m, open: false }));

    /* ── Update (edit-only — create moved to CreateEventWizard.jsx) ── */
    const handleSubmit = async (values) => {
        setSaving(true);
        try {
            let uploadedImageUrl = modal.row?.image_url || null;

            if (values.image instanceof File) {
                const file = values.image;
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const filePath = `events/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('event-images')
                    .upload(filePath, file);

                if (uploadError) {
                    throw new Error('Image upload failed: ' + uploadError.message);
                }

                const { data: urlData } = supabase.storage
                    .from('event-images')
                    .getPublicUrl(filePath);

                uploadedImageUrl = urlData.publicUrl;
            }

            // duration, team_size_limit, prize_details, accommodation_details, and
            // itinerary were removed from this payload — confirmed live (PGRST204)
            // that none of them are real columns on `events`. Every save was failing
            // unconditionally because of this. The category-specific ideas behind
            // them (Hackathon team size/prizes, Workation/Staycation accommodation/
            // itinerary, a plain-text duration) are real and worth keeping, but
            // need actual schema columns added first — not done in this urgent-fix
            // pass. See the matching UI note below (condition on category).
            const payload = {
                category:    values.category,
                title:       values.title?.trim(),
                description: values.description?.trim() || null,
                host_name:   values.host_name?.trim(),
                location:    values.location?.trim(),
                event_date:  values.event_date ? new Date(values.event_date).toISOString() : null,
                price:       values.price !== '' && values.price != null ? Number(values.price) : 0,
                payment_link:values.payment_link?.trim() || null,
                seats_total: values.seats_total !== '' && values.seats_total != null ? Number(values.seats_total) : null,
                status:      values.status,
                image_url:   uploadedImageUrl,
                featured_on_landing: values.featured_on_landing ?? false,
                registration_deadline: values.registration_deadline ? new Date(values.registration_deadline).toISOString() : null,
            };

            const { error } = await supabase.from('events').update(payload).eq('id', modal.row.id);
            if (error) throw error;

            showToast('✅ Event updated!');
            closeModal();
            load();
        } catch (err) {
            showToast('Save failed: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase.from('events').delete().eq('id', confirm.row.id);
        setDeleting(false);
        setConfirm({ open: false, row: null });
        if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
        showToast('🗑️ Event deleted.');
        load();
    };

    /* ── Action button style ── */
    const actionBtn = (color) => ({
        padding: '0.35rem 0.75rem', borderRadius: 7,
        border: `1px solid ${color}30`, background: `${color}12`,
        color, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
        transition: 'all 0.15s',
    });

    const initialValues = modal.mode === 'edit' && modal.row ? {
        category:    modal.row.category    ?? '',
        title:       modal.row.title       ?? '',
        description: modal.row.description ?? '',
        host_name:   modal.row.host_name   ?? '',
        location:    modal.row.location    ?? '',
        event_date:  formatToDatetimeLocal(modal.row.event_date),
        price:       modal.row.price       ?? '',
        payment_link:modal.row.payment_link?? '',
        seats_total: modal.row.seats_total ?? '',
        status:      modal.row.status      ?? 'coming_soon',
        image:       modal.row.image_url   ?? null,
        featured_on_landing: modal.row.featured_on_landing ?? false,
        registration_deadline: formatToDatetimeLocal(modal.row.registration_deadline),
    } : { status: 'coming_soon', price: 0, featured_on_landing: false, category: '' };

    const CATEGORY_OPTIONS = [
        { value: 'Workshop', label: 'Workshop' },
        { value: 'Webinar', label: 'Webinar' },
        { value: 'Hackathon', label: 'Hackathon' },
        { value: 'Workation', label: 'Workation' },
        { value: 'Staycation', label: 'Staycation' },
        { value: 'Debate', label: 'Debate' },
        { value: 'Other', label: 'Other' },
    ];

    const fields = [
        {
            key: 'category', label: 'Event Category', type: 'select', required: true, options: CATEGORY_OPTIONS,
            // Real gap, flagged rather than silently dropped: duration (Workshop/
            // Webinar/Debate), team size + prize details (Hackathon), and
            // accommodation + itinerary (Workation/Staycation) all used to have
            // form fields here, but none of those 5 columns exist on the real
            // `events` table — every save was silently discarding that input and
            // then failing outright (PGRST204) because the payload still tried to
            // write them. Fields removed rather than left as fake/dead inputs.
            // Worth adding as real columns in a future pass if these are wanted.
            hint: 'Note: detailed per-category fields (team size & prizes for Hackathons, accommodation & itinerary for Workation/Staycation, duration for Workshop/Webinar/Debate) aren\'t collected yet — coming in a future update.',
        },

        // Common Header
        { key: 'title', label: 'Event Title', type: 'text', required: true, placeholder: 'e.g. Developer Workation Goa 🌊', condition: v => !!v.category },
        { key: 'image', label: 'Event Banner Image', type: 'file', accept: 'image/*', condition: v => !!v.category },
        { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Short summary or schedule of the event', condition: v => !!v.category },
        { key: 'event_date', label: 'Event Date & Time', type: 'datetime-local', required: true, condition: v => !!v.category },
        { key: 'location', label: 'Location / Platform', type: 'text', required: true, placeholder: 'e.g. Online (Zoom) / Goa', condition: v => !!v.category },

        // Workshop / Webinar / Debate / Other
        { key: 'host_name', label: 'Speaker / Host Name', type: 'text', placeholder: 'e.g. Park Ji-yeon', condition: v => !!v.category && v.category !== 'Hackathon' },

        // Hackathon
        { key: 'registration_deadline', label: 'Registration Deadline', type: 'datetime-local', condition: v => v.category === 'Hackathon' },

        // Common Footer
        { key: 'status', label: 'Status', type: 'select', required: true, options: STATUS_OPTIONS, condition: v => !!v.category },
        { key: 'price', label: 'Price (₹)', type: 'number', placeholder: '0', hint: 'Leave blank or 0 for free events.', condition: v => !!v.category },
        { key: 'payment_link', label: 'Payment Link (Cashfree)', type: 'url', placeholder: 'https://...', hint: 'For paid events, paste the payment URL here.', condition: v => !!v.category },
        { key: 'seats_total', label: 'Total Seats Available', type: 'number', placeholder: 'e.g. 50', hint: 'Leave blank for unlimited.', condition: v => !!v.category },
        { key: 'featured_on_landing', label: 'Feature on Landing Page', type: 'toggle', onLabel: 'Featured', offLabel: 'Standard', condition: v => !!v.category }
    ];

    /* ── Columns config ── */
    const columns = [
        {
            key: 'title', label: 'Title', sortable: true,
            render: (v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {row.image_url && (
                        <img
                            src={row.image_url}
                            alt=""
                            style={{ width: 44, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }}
                        />
                    )}
                    <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v || '—'}</span>
                        {row.host_name && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                                👤 Host: {row.host_name} {row.location ? `· 📍 ${row.location}` : ''}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v, row) => (
                <EventStatusToggle
                    status={v}
                    busy={togglingId === row.id}
                    onClick={() => handleToggleStatus(row)}
                />
            ),
        },
        {
            key: 'event_date', label: 'Date', sortable: true,
            render: v => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDisplayDate(v)}</span>,
        },
        {
            key: 'seats', label: 'Seats (Filled/Total)', sortable: true,
            render: (_, row) => {
                const filled = row.seats_filled ?? 0;
                const total = row.seats_total;
                return (
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {filled} / {total != null ? total : '∞'}
                    </span>
                );
            },
        },
        {
            key: 'price', label: 'Price', sortable: true,
            render: v => (
                <span style={{ fontWeight: 700, color: Number(v) === 0 ? 'var(--emerald)' : 'var(--accent-gold)' }}>
                    {Number(v) === 0 ? 'Free' : `₹${Number(v).toLocaleString('en-IN')}`}
                </span>
            ),
        },
        {
            key: 'featured_on_landing', label: 'Featured', sortable: true,
            render: (v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {togglingFeaturedId === row.id ? (
                        <span style={{
                            width: 14, height: 14, border: '2px solid var(--peacock-green)',
                            borderTopColor: 'transparent', borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite', display: 'inline-block',
                        }} />
                    ) : (
                        <input
                            type="checkbox"
                            checked={!!v}
                            onChange={() => handleToggleFeatured(row)}
                            style={{
                                width: 17, height: 17,
                                cursor: 'pointer',
                                accentColor: 'var(--peacock-green)',
                            }}
                        />
                    )}
                </div>
            ),
        },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
            }}>
                <div>
                    <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        🎪 Events
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {rows.length} total event{rows.length !== 1 ? 's' : ''} listed
                    </p>
                </div>

                <button
                    onClick={() => navigate('/admin/events/new')}
                    style={{
                        padding: '0.65rem 1.35rem', borderRadius: 10, border: 'none',
                        background: 'var(--peacock-green)', color: '#fff', fontWeight: 700,
                        fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s',
                    }}
                >
                    + Add Event
                </button>
            </div>

            {/* Stat cards — 5 real, derived from the same rows already loaded,
                plus Total Registrations from a real event_registrations count.
                No "Live Now" date-math and no fake numbers — see STATUS_TABS
                comment above for why this mirrors the existing status vocabulary. */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { key: 'total', label: 'Total Events', icon: '🎪', color: '#8B5CF6', value: stats.total },
                    { key: 'coming_soon', label: 'Upcoming', icon: '⏳', color: '#F59E0B', value: stats.coming_soon },
                    { key: 'live', label: 'Live Now', icon: '🟢', color: '#10B981', value: stats.live },
                    { key: 'completed', label: 'Completed', icon: '🏁', color: '#94A3B8', value: stats.completed },
                    { key: 'cancelled', label: 'Cancelled', icon: '🚫', color: '#EF4444', value: stats.cancelled },
                    { key: 'registrations', label: 'Total Registrations', icon: '🎟️', color: '#3B82F6', value: totalRegistrations },
                ].map(card => (
                    <div key={card.key} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                            <span style={{ width: 30, height: 30, borderRadius: 8, background: `${card.color}18`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem' }}>{card.icon}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{card.label}</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                            {card.value === null ? '—' : card.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setStatusTab(tab.id)}
                        style={{
                            padding: '0.45rem 1rem', borderRadius: 20, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                            background: statusTab === tab.id ? 'var(--peacock-green)' : 'var(--bg-surface)',
                            color: statusTab === tab.id ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${statusTab === tab.id ? 'var(--peacock-green)' : 'var(--border-color)'}`,
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 14, overflow: 'hidden', padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)',
            }}>
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    loading={loading}
                    emptyMessage="No events yet. Click '+ Add Event' to list the first one."
                    searchKeys={['title', 'host_name', 'location', 'status']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => openEdit(row)} style={actionBtn('#6366F1')}>Edit</button>
                            <button onClick={() => setConfirm({ open: true, row })} style={actionBtn('#EF4444')}>Delete</button>
                        </div>
                    )}
                />
            </div>

            {/* Shared Form Modal — edit-only now */}
            <FormModal
                open={modal.open}
                title={`Edit: ${modal.row?.title}`}
                fields={fields}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onClose={closeModal}
                submitLabel="Save Changes"
                loading={saving}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                open={confirm.open}
                title="Delete Event"
                message={`Delete "${confirm.row?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirm({ open: false, row: null })}
                loading={deleting}
            />
        </div>
    );
}
