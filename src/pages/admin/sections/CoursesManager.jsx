import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const TYPE_OPTIONS = [
    { value: 'Language', label: '🌍 Language' },
    { value: 'Skill',    label: '💻 Skill'    },
];

const LEVEL_OPTIONS = [
    { value: 'Beginner',           label: 'Beginner'              },
    { value: 'Beginner → Mid',     label: 'Beginner → Mid'        },
    { value: 'Intermediate',       label: 'Intermediate'          },
    { value: 'Intermediate → Adv', label: 'Intermediate → Adv'    },
    { value: 'Advanced',           label: 'Advanced'              },
];

const LEVEL_COLORS = {
    'Beginner':           '#10B981',
    'Beginner → Mid':     '#3B82F6',
    'Intermediate':       '#F59E0B',
    'Intermediate → Adv': '#A855F7',
    'Advanced':           '#EF4444',
};

const TYPE_COLORS = { Language: '#6366F1', Skill: '#10B981' };

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
function StatusToggle({ status, busy, onClick }) {
    const isLive = status === 'Live';
    const [hov, setHov] = useState(false);
    return (
        <button
            onClick={onClick}
            disabled={busy}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title={isLive ? 'Click to set Draft' : 'Click to set Live'}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.22rem 0.7rem', borderRadius: 20,
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.72rem',
                transition: 'all 0.18s',
                background: isLive
                    ? (hov ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.08)')
                    : (hov ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.1)'),
                color: isLive
                    ? (hov ? '#F59E0B' : '#10B981')
                    : (hov ? '#10B981' : 'var(--text-muted)'),
                border: isLive
                    ? `1px solid ${hov ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.18)'}`
                    : `1px solid ${hov ? 'rgba(16,185,129,0.2)' : 'var(--border-color)'}`,
                opacity: busy ? 0.55 : 1,
                minWidth: 100,
            }}
        >
            {busy ? (
                <span style={{
                    width: 10, height: 10, border: '2px solid currentColor',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
            ) : (
                <span style={{ fontSize: '0.7rem' }}>{isLive ? (hov ? '⏳' : '●') : (hov ? '●' : '○')}</span>
            )}
            {isLive ? (hov ? 'Set Draft' : 'Live') : (hov ? 'Go Live' : 'Draft')}
        </button>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function CoursesManager() {
    const [rows, setRows]         = useState([]);
    const [loading, setLoading]   = useState(true);
    const [modal, setModal]       = useState({ open: false, mode: 'create', row: null });
    const [confirm, setConfirm]   = useState({ open: false, row: null });
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

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
        const [{ data: coursesData, error: coursesError }, { data: countsData }] = await Promise.all([
            supabase.from('courses').select('*').order('created_at', { ascending: false }),
            supabase.from('waitlist_counts').select('*').like('feature_key', 'course:%')
        ]);
        
        if (coursesError) showToast('Failed to load courses: ' + coursesError.message, 'error');
        
        const countsMap = (countsData || []).reduce((acc, curr) => {
            acc[curr.feature_key] = curr.waitlist_count;
            return acc;
        }, {});

        const rowsWithCounts = (coursesData || []).map(r => ({
            ...r,
            waitlist_count: countsMap[`course:${r.id}`] || 0
        }));

        setRows(rowsWithCounts);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    /* ── Quick status toggle ── */
    const handleToggleStatus = async (row) => {
        setTogglingId(row.id);
        const newValue = row.status === 'Live' ? 'Draft' : 'Live';
        const { error } = await supabase
            .from('courses')
            .update({ status: newValue })
            .eq('id', row.id);
            
        if (error) { 
            setTogglingId(null);
            showToast('Toggle failed: ' + error.message, 'error'); 
            return; 
        }

        if (newValue === 'Live' && row.waitlist_count > 0) {
            // Notify waitlist when published
            try {
                await supabase.rpc('notify_waitlist_on_publish', { 
                    p_feature_key: `course:${row.id}`, 
                    p_title: row.title 
                });
                showToast(`🟢 Live! Notified ${row.waitlist_count} waitlisted users.`, 'success');
            } catch (err) {
                console.error("Waitlist notification failed:", err);
                showToast('🟢 Live! (Waitlist notification failed)', 'success');
            }
        } else {
            showToast(newValue === 'Live' ? '🟢 Course is now Live!' : '⏳ Course set to Draft.');
        }

        setTogglingId(null);
        // Refresh to clear waitlist count if we just published
        load();
    };

    /* ── Modal handlers ── */
    const openCreate = () => setModal({ open: true, mode: 'create', row: null });
    const openEdit   = (row) => setModal({ open: true, mode: 'edit', row });
    const closeModal = () => setModal(m => ({ ...m, open: false }));

    /* ── Create / Update ── */
    const handleSubmit = async (values) => {
        setSaving(true);
        const tagsArray = values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        const payload = {
            title:           values.title?.trim(),
            type:            values.type,
            level:           values.level,
            instructor_name: values.instructor_name?.trim(),
            schedule:        values.schedule?.trim() || null,
            duration:        values.duration?.trim() || null,
            tags:            tagsArray,
            price:           values.price !== '' && values.price != null ? Number(values.price) : null,
            status:          values.status ? 'Live' : 'Draft', // values.status comes as boolean from the toggle field
            category_id:     values.category_id?.trim() || null,
            banner_url:      values.banner_url?.trim() || null,
            short_description: values.short_description?.trim() || null,
            estimated_launch_date: values.estimated_launch_date?.trim() || null,
            is_coming_soon:  !!values.is_coming_soon,
            is_featured:     !!values.is_featured,
        };

        let error;
        if (modal.mode === 'create') {
            ({ error } = await supabase.from('courses').insert(payload));
        } else {
            ({ error } = await supabase.from('courses').update(payload).eq('id', modal.row.id));
        }
        setSaving(false);
        if (error) { showToast('Save failed: ' + error.message, 'error'); return; }
        showToast(modal.mode === 'create' ? '✅ Course added!' : '✅ Course updated!');
        closeModal();
        load();
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase.from('courses').delete().eq('id', confirm.row.id);
        setDeleting(false);
        setConfirm({ open: false, row: null });
        if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
        showToast('🗑️ Course deleted.');
        load();
    };

    /* ── Action button style ── */
    const actionBtn = (color) => ({
        padding: '0.35rem 0.75rem', borderRadius: 7,
        border: `1px solid ${color}30`, background: `${color}12`,
        color, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
        transition: 'all 0.15s',
    });

    /* ── Derived counts ── */
    const liveCount    = rows.filter(r =>  r.status === 'Live').length;
    const draftCount   = rows.filter(r =>  r.status !== 'Live').length;
    const langCount    = rows.filter(r =>  r.type === 'Language').length;
    const skillCount   = rows.filter(r =>  r.type === 'Skill').length;

    /* ── Edit initial values ── */
    const initialValues = modal.mode === 'edit' && modal.row ? {
        title:           modal.row.title           ?? '',
        type:            modal.row.type            ?? '',
        level:           modal.row.level           ?? '',
        instructor_name: modal.row.instructor_name ?? '',
        schedule:        modal.row.schedule        ?? '',
        duration:        modal.row.duration        ?? '',
        tags:            modal.row.tags?.join(', ') ?? '',
        price:           modal.row.price           ?? '',
        status:          modal.row.status === 'Live', // pass as boolean for the toggle component
        category_id:     modal.row.category_id     ?? '',
        banner_url:      modal.row.banner_url      ?? '',
        short_description: modal.row.short_description ?? '',
        estimated_launch_date: modal.row.estimated_launch_date ?? '',
        is_coming_soon:  modal.row.is_coming_soon  ?? false,
        is_featured:     modal.row.is_featured     ?? false,
    } : { status: false, price: 0, is_coming_soon: false, is_featured: false, tags: '', duration: '' };

    /* ── Form Modal Field Setup ── */
    const fields = [
        { key: 'title', label: 'Course Title', type: 'text', required: true, placeholder: 'e.g. Korean Language Foundations' },
        { key: 'category_id', label: 'Category', type: 'text', placeholder: 'Optional category string or UUID' },
        { key: 'type', label: 'Type', type: 'select', required: true, options: TYPE_OPTIONS },
        { key: 'level', label: 'Difficulty Level', type: 'select', required: true, options: LEVEL_OPTIONS },
        { key: 'instructor_name', label: 'Instructor Name', type: 'text', required: true, placeholder: 'e.g. Park Ji-yeon' },
        { key: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 10 hours or 4 weeks' },
        { key: 'schedule', label: 'Schedule', type: 'text', placeholder: 'e.g. Every Saturday 10am – 12pm', hint: 'When does this course run?' },
        { key: 'tags', label: 'Tags', type: 'text', placeholder: 'e.g. programming, react, frontend', hint: 'Comma-separated' },
        { key: 'price', label: 'Price (₹)', type: 'number', placeholder: '0', hint: 'Enter 0 for a free course.' },
        { key: 'banner_url', label: 'Banner URL', type: 'text', placeholder: 'https://...', hint: 'URL to the course banner image' },
        { key: 'short_description', label: 'Short Description', type: 'text', placeholder: 'A quick summary of the course' },
        { key: 'estimated_launch_date', label: 'Estimated Launch Date', type: 'text', placeholder: 'e.g. Q3 2026 or Sept 15' },
        { key: 'status', label: 'Status', type: 'toggle', onLabel: '🟢 Live — visible to all users', offLabel: '⏳ Draft — hidden from users' },
        { key: 'is_coming_soon', label: 'Coming Soon', type: 'toggle', onLabel: 'Yes (shows badge)', offLabel: 'No' },
        { key: 'is_featured', label: 'Featured', type: 'toggle', onLabel: '⭐ Yes', offLabel: 'No' }
    ];

    /* ── Table Columns Config ── */
    const columns = [
        {
            key: 'title', label: 'Title', sortable: true,
            render: (v, row) => (
                <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        {row.is_featured && <span title="Featured">⭐</span>}
                        {v || '—'}
                    </span>
                    {(row.instructor_name || row.is_coming_soon) && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {row.instructor_name && <span>👤 {row.instructor_name}</span>}
                            {row.is_coming_soon && <span style={{ padding: '0.1rem 0.4rem', background: 'var(--bg-mint)', color: 'var(--peacock-green)', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>COMING SOON</span>}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'type', label: 'Type', sortable: true,
            render: v => {
                const c = TYPE_COLORS[v] || '#64748B';
                return v ? (
                    <span style={{
                        padding: '0.18rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                        background: `${c}12`, color: c, border: `1px solid ${c}25`,
                    }}>
                        {v === 'Language' ? '🌍' : '💻'} {v}
                    </span>
                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>;
            },
        },
        {
            key: 'level', label: 'Level', sortable: true,
            render: v => {
                const c = LEVEL_COLORS[v] || '#64748B';
                return v ? (
                    <span style={{
                        padding: '0.18rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                        background: `${c}12`, color: c, border: `1px solid ${c}25`,
                    }}>{v}</span>
                ) : <span style={{ color: 'var(--text-muted)' }}>—</span>;
            },
        },
        {
            key: 'price', label: 'Price', sortable: true,
            render: v => v != null && v !== ''
                ? <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {Number(v) === 0 ? 'Free' : `₹${Number(v).toLocaleString('en-IN')}`}
                  </span>
                : <span style={{ color: 'var(--text-muted)' }}>—</span>,
        },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v, row) => (
                <StatusToggle
                    status={v}
                    busy={togglingId === row.id}
                    onClick={() => handleToggleStatus(row)}
                />
            ),
        },
        {
            key: 'waitlist_count', label: 'Waitlist', sortable: true,
            render: (v, row) => v > 0 
                ? <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800 }}>🔔 {v}</span>
                : <span style={{ color: 'var(--text-muted)' }}>—</span>
        },
        {
            key: 'created_at', label: 'Added', sortable: true,
            render: v => v
                ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                : '—',
        },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            {/* Page header */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
            }}>
                <div>
                    <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        📚 Courses
                    </h1>
                    {!loading && (
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            <span>{rows.length} total</span>
                            <span style={{ color: 'var(--border-color)' }}>·</span>
                            <span style={{ color: 'var(--emerald)' }}>🟢 {liveCount} live</span>
                            <span style={{ color: 'var(--border-color)' }}>·</span>
                            <span style={{ color: 'var(--text-muted)' }}>⏳ {draftCount} drafts</span>
                            <span style={{ color: 'var(--border-color)' }}>·</span>
                            <span style={{ color: '#6366F1' }}>🌍 {langCount} language</span>
                            <span style={{ color: 'var(--border-color)' }}>·</span>
                            <span style={{ color: 'var(--emerald)' }}>💻 {skillCount} skill</span>
                        </p>
                    )}
                </div>

                <button
                    onClick={openCreate}
                    style={{
                        padding: '0.65rem 1.35rem', borderRadius: 10, border: 'none',
                        background: 'var(--peacock-green)', color: '#fff', fontWeight: 700,
                        fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                    }}
                >
                    + Add Course
                </button>
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
                    rows={rows}
                    loading={loading}
                    emptyMessage="No courses yet. Click '+ Add Course' to create the first one."
                    searchKeys={['title', 'instructor_name', 'type', 'level']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => openEdit(row)} style={actionBtn('#6366F1')}>Edit</button>
                            <button onClick={() => setConfirm({ open: true, row })} style={actionBtn('#EF4444')}>Delete</button>
                        </div>
                    )}
                />
            </div>

            {/* Shared Form Modal */}
            <FormModal
                open={modal.open}
                title={modal.mode === 'create' ? '+ Add Course' : `Edit: ${modal.row?.title}`}
                fields={fields}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onClose={closeModal}
                submitLabel={modal.mode === 'create' ? 'Create Course' : 'Save Changes'}
                loading={saving}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                open={confirm.open}
                title="Delete Course"
                message={`Delete "${confirm.row?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirm({ open: false, row: null })}
                loading={deleting}
            />
        </div>
    );
}
