import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

function Toast({ msg, type }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
            background: isErr ? 'rgba(30,15,15,0.97)' : 'rgba(15,30,25,0.97)',
            border: `1px solid ${isErr ? 'var(--accent-coral)' : 'var(--border-mint)'}`,
            borderRadius: 12, padding: '0.9rem 1.4rem', color: '#fff',
            fontSize: '0.875rem', fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeInUp 0.3s ease-out',
        }}>{msg}</div>
    );
}

const RATING_OPTIONS = [1, 2, 3, 4, 5].map(n => ({ value: n, label: `${'★'.repeat(n)}${'☆'.repeat(5 - n)} (${n})` }));

// Real display-name/avatar fallback: linked profile wins when present,
// otherwise the admin-authored display fields — never blank if either
// side actually has data.
function resolveDisplay(row) {
    if (row.user_id && row.profiles) {
        return {
            name: row.profiles.full_name || row.profiles.username || 'Unnamed User',
            role: row.role_label || null,
            photo: row.profiles.avatar_url || null,
        };
    }
    return {
        name: row.display_name || 'Anonymous',
        role: row.role_label || null,
        photo: row.photo_url || null,
    };
}

export default function TestimonialsManager() {
    const [rows, setRows] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
    const [saving, setSaving] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, row: null });
    const [deleting, setDeleting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('testimonials')
                .select('*, profiles(full_name, username, avatar_url)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setRows(data || []);

            const { data: profilesData } = await supabase.from('profiles').select('id, full_name, username').order('full_name');
            setProfiles(profilesData || []);
        } catch (err) {
            console.error(err);
            showToast('Failed to load testimonials: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const userOptions = profiles.map(p => ({
        value: p.id,
        label: `${p.full_name || 'Unnamed'}${p.username ? ` (@${p.username})` : ''}`,
    }));

    const FIELDS = [
        { key: 'user_id', label: 'Linked Profile (optional)', type: 'user_search', options: userOptions, hint: 'Leave unset to use the display fields below instead — no real account required.' },
        { key: 'display_name', label: 'Display Name', type: 'text', required: true, condition: (v) => !v.user_id, hint: 'Used only when no profile is linked above.' },
        { key: 'role_label', label: 'Role / Label', type: 'text', placeholder: 'e.g. Founding Student, VIT', condition: (v) => !v.user_id },
        { key: 'photo_url', label: 'Photo URL', type: 'url', placeholder: 'https://...', condition: (v) => !v.user_id, hint: 'Optional — shown only when no profile is linked.' },
        { key: 'feedback_text', label: 'Feedback', type: 'textarea', required: true },
        { key: 'rating', label: 'Rating', type: 'select', options: RATING_OPTIONS },
        { key: 'featured', label: 'Featured', type: 'toggle', onLabel: 'Featured', offLabel: 'Not Featured', hint: 'Must ALSO be Approved for this to appear on the public Landing page.' },
        { key: 'approved', label: 'Approved', type: 'toggle', onLabel: 'Approved', offLabel: 'Not Approved', hint: 'Must ALSO be Featured for this to appear on the public Landing page.' },
    ];

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const hasUser = !!values.user_id;
            const payload = {
                user_id: hasUser ? values.user_id : null,
                display_name: hasUser ? null : (values.display_name?.trim() || null),
                role_label: hasUser ? (values.role_label?.trim() || null) : (values.role_label?.trim() || null),
                photo_url: hasUser ? null : (values.photo_url?.trim() || null),
                feedback_text: values.feedback_text?.trim(),
                rating: values.rating ? Number(values.rating) : null,
                featured: !!values.featured,
                approved: !!values.approved,
            };

            let error;
            if (modal.mode === 'create') {
                ({ error } = await supabase.from('testimonials').insert(payload));
            } else {
                ({ error } = await supabase.from('testimonials').update(payload).eq('id', modal.row.id));
            }
            if (error) throw error;

            showToast(modal.mode === 'create' ? 'Testimonial created successfully!' : 'Testimonial updated successfully!');
            setModal({ open: false, mode: 'create', row: null });
            loadData();
        } catch (err) {
            showToast('Failed to save testimonial: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase.from('testimonials').delete().eq('id', confirmDelete.row.id);
            if (error) throw error;
            showToast('Testimonial deleted.');
            setConfirmDelete({ open: false, row: null });
            loadData();
        } catch (err) {
            showToast('Failed to delete: ' + err.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        {
            key: 'display', label: 'Person', sortable: false,
            render: (_, row) => {
                const d = resolveDisplay(row);
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                            {d.photo ? <img src={d.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.87rem' }}>{d.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.role || (row.user_id ? 'Linked profile' : '—')}</div>
                        </div>
                    </div>
                );
            }
        },
        { key: 'feedback_text', label: 'Feedback', render: v => <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{v?.length > 80 ? v.slice(0, 80) + '…' : v}</span> },
        { key: 'rating', label: 'Rating', sortable: true, render: v => v ? <span style={{ fontSize: '0.8rem' }}>{'★'.repeat(v)}{'☆'.repeat(5 - v)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
        {
            key: 'visibility', label: 'Public Visibility', sortable: false,
            render: (_, row) => {
                const live = row.featured && row.approved;
                return (
                    <span style={{
                        fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: 20,
                        color: live ? 'var(--peacock-green)' : 'var(--text-muted)',
                        background: live ? 'var(--bg-mint)' : 'rgba(148,163,184,0.15)',
                    }}>
                        {live ? '● Live on Landing' : (row.featured ? 'Featured only' : (row.approved ? 'Approved only' : 'Hidden'))}
                    </span>
                );
            }
        },
        { key: 'created_at', label: 'Added', sortable: true, render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—' },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>💬 Testimonials</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage student testimonials shown in "Building Chavee Together" on the Landing page. A testimonial must be BOTH Featured AND Approved to appear publicly.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={loadData} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>↻ Refresh</button>
                    <button onClick={() => setModal({ open: true, mode: 'create', row: null })} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Add Testimonial</button>
                </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    emptyMessage="No testimonials yet."
                    searchKeys={['feedback_text', 'display_name']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => setModal({ open: true, mode: 'edit', row })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6366F115', color: '#6366F1', border: '1px solid #6366F130', cursor: 'pointer' }}>Edit</button>
                            <button onClick={() => setConfirmDelete({ open: true, row })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Delete</button>
                        </div>
                    )}
                />
            </div>

            <FormModal
                open={modal.open}
                title={modal.mode === 'create' ? 'Add Testimonial' : 'Edit Testimonial'}
                fields={FIELDS}
                initialValues={modal.row ? { ...modal.row } : { featured: false, approved: false }}
                onSubmit={handleSave}
                onClose={() => setModal({ open: false, mode: 'create', row: null })}
                submitLabel={modal.mode === 'create' ? 'Create Testimonial' : 'Save Changes'}
                loading={saving}
            />

            <ConfirmDialog
                open={confirmDelete.open}
                title="Delete testimonial?"
                message={confirmDelete.row ? `This will permanently delete this testimonial. This cannot be undone.` : ''}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete({ open: false, row: null })}
                loading={deleting}
            />
        </div>
    );
}
