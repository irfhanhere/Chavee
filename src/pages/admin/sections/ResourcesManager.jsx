import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

const CATEGORY_OPTIONS = [
    { value: 'Study Materials',    label: 'Study Materials' },
    { value: 'PDF Notes',          label: 'PDF Notes' },
    { value: 'Templates',          label: 'Templates' },
    { value: 'Previous Year Papers',label: 'Previous Year Papers' },
    { value: 'Career Guides',      label: 'Career Guides' },
    { value: 'Useful Websites',    label: 'Useful Websites' },
    { value: 'Free Tools',         label: 'Free Tools' },
    { value: 'Roadmaps',           label: 'Roadmaps' },
];

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
export default function ResourcesManager() {
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
        const [{ data: resourcesData, error: resourcesError }, { data: countsData }] = await Promise.all([
            supabase.from('resources').select('*').order('created_at', { ascending: false }),
            supabase.from('waitlist_counts').select('*').like('feature_key', 'resource:%')
        ]);
        
        if (resourcesError) showToast('Failed to load resources: ' + resourcesError.message, 'error');
        
        const countsMap = (countsData || []).reduce((acc, curr) => {
            acc[curr.feature_key] = curr.waitlist_count;
            return acc;
        }, {});

        const rowsWithCounts = (resourcesData || []).map(r => ({
            ...r,
            waitlist_count: countsMap[`resource:${r.id}`] || 0
        }));

        setRows(rowsWithCounts);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    /* ── Quick status toggle ── */
    const handleToggleStatus = async (row) => {
        setTogglingId(row.id);
        const newValue = !row.published;
        const { error } = await supabase
            .from('resources')
            .update({ published: newValue })
            .eq('id', row.id);
            
        if (error) { 
            setTogglingId(null);
            showToast('Toggle failed: ' + error.message, 'error'); 
            return; 
        }

        if (newValue && row.waitlist_count > 0) {
            try {
                await supabase.rpc('notify_waitlist_on_publish', { 
                    p_feature_key: `resource:${row.id}`, 
                    p_title: row.title 
                });
                showToast(`🟢 Live! Notified ${row.waitlist_count} waitlisted users.`, 'success');
            } catch (err) {
                console.error("Waitlist notification failed:", err);
                showToast('🟢 Live! (Waitlist notification failed)', 'success');
            }
        } else {
            showToast(newValue ? '🟢 Resource is now Live!' : '⏳ Resource set to Draft.');
        }

        setTogglingId(null);
        load();
    };

    /* ── Modal handlers ── */
    const openCreate = () => setModal({ open: true, mode: 'create', row: null });
    const openEdit   = (row) => setModal({ open: true, mode: 'edit', row });
    const closeModal = () => setModal(m => ({ ...m, open: false }));

    /* ── Create / Update ── */
    const handleSubmit = async (values) => {
        setSaving(true);
        const payload = {
            title:          values.title?.trim(),
            category:       values.category,
            description:    values.description?.trim() || null,
            thumbnail_url:  values.thumbnail_url?.trim() || null,
            is_coming_soon: !!values.is_coming_soon,
            featured:       !!values.featured,
            published:      !!values.published,
            sort_order:     values.sort_order ? Number(values.sort_order) : 0,
        };

        let error;
        if (modal.mode === 'create') {
            ({ error } = await supabase.from('resources').insert(payload));
        } else {
            ({ error } = await supabase.from('resources').update(payload).eq('id', modal.row.id));
        }
        setSaving(false);
        if (error) { showToast('Save failed: ' + error.message, 'error'); return; }
        showToast(modal.mode === 'create' ? '✅ Resource added!' : '✅ Resource updated!');
        closeModal();
        load();
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase.from('resources').delete().eq('id', confirm.row.id);
        setDeleting(false);
        setConfirm({ open: false, row: null });
        if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
        showToast('🗑️ Resource deleted.');
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
    const liveCount  = rows.filter(r => r.published === true).length;
    const draftCount = rows.filter(r => r.published !== true).length;

    /* ── Edit initial values ── */
    const initialValues = modal.mode === 'edit' && modal.row ? {
        title:          modal.row.title          ?? '',
        category:       modal.row.category       ?? '',
        description:    modal.row.description    ?? '',
        thumbnail_url:  modal.row.thumbnail_url  ?? '',
        is_coming_soon: modal.row.is_coming_soon ?? false,
        featured:       modal.row.featured       ?? false,
        published:      modal.row.published      ?? false,
        sort_order:     modal.row.sort_order     ?? 0,
    } : { published: false, is_coming_soon: false, featured: false, sort_order: 0, category: 'Study Materials' };

    /* ── Form Modal Field Setup ── */
    const fields = [
        { key: 'title', label: 'Resource Title', type: 'text', required: true, placeholder: 'e.g. Master Calculus PDF' },
        { key: 'category', label: 'Category', type: 'select', required: true, options: CATEGORY_OPTIONS },
        { key: 'description', label: 'Description', type: 'text', placeholder: 'A quick summary of the resource' },
        { key: 'thumbnail_url', label: 'Thumbnail URL', type: 'text', placeholder: 'https://...' },
        { key: 'sort_order', label: 'Sort Order', type: 'number', placeholder: 'e.g. 10' },
        { key: 'published', label: 'Published', type: 'toggle', onLabel: '🟢 Live — visible to all users', offLabel: '⏳ Draft — hidden from users' },
        { key: 'is_coming_soon', label: 'Coming Soon', type: 'toggle', onLabel: 'Yes (shows badge)', offLabel: 'No' },
        { key: 'featured', label: 'Featured', type: 'toggle', onLabel: 'Yes', offLabel: 'No' },
    ];

    /* ── Table Columns Config ── */
    const columns = [
        {
            key: 'title', label: 'Resource', sortable: true,
            render: (v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {row.thumbnail_url ? (
                        <img src={row.thumbnail_url} alt="" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: 4 }} />
                    ) : (
                        <div style={{ width: 24, height: 24, background: 'var(--bg-elevated)', borderRadius: 4 }}></div>
                    )}
                    <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                            {row.featured && <span title="Featured" style={{marginRight: '4px'}}>⭐</span>}
                            {v || '—'}
                        </span>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {row.is_coming_soon && <span style={{ padding: '0.1rem 0.4rem', background: 'var(--bg-mint)', color: 'var(--peacock-green)', borderRadius: 4, fontWeight: 700, fontSize: '0.65rem' }}>COMING SOON</span>}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            key: 'category', label: 'Category', sortable: true,
            render: v => v ? (
                <span style={{
                    padding: '0.18rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                }}>{v}</span>
            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>,
        },
        {
            key: 'published', label: 'Status', sortable: true,
            render: (v, row) => (
                <StatusToggle
                    status={v ? 'Live' : 'Draft'}
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
                        🗂️ Resources
                    </h1>
                    {!loading && (
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                            <span>{rows.length} total</span>
                            <span style={{ color: 'var(--border-color)' }}>·</span>
                            <span style={{ color: 'var(--emerald)' }}>🟢 {liveCount} live</span>
                            <span style={{ color: 'var(--border-color)' }}>·</span>
                            <span style={{ color: 'var(--text-muted)' }}>⏳ {draftCount} drafts</span>
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
                    + Add Resource
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
                    emptyMessage="No resources yet. Click '+ Add Resource' to create the first one."
                    searchKeys={['title', 'category']}
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
                title={modal.mode === 'create' ? '+ Add Resource' : `Edit: ${modal.row?.title}`}
                fields={fields}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onClose={closeModal}
                submitLabel={modal.mode === 'create' ? 'Create Resource' : 'Save Changes'}
                loading={saving}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                open={confirm.open}
                title="Delete Resource"
                message={`Delete "${confirm.row?.title}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirm({ open: false, row: null })}
                loading={deleting}
            />
        </div>
    );
}
