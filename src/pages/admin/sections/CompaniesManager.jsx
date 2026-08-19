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

const FIELDS = [
    { key: 'name', label: 'Company Name', type: 'text', required: true },
    { key: 'logo_url', label: 'Logo URL', type: 'url', placeholder: 'https://... or /logo.png', hint: 'A real image URL — no placeholder is used if left blank.' },
    { key: 'website', label: 'Website', type: 'url', placeholder: 'https://...' },
    { key: 'location', label: 'Location', type: 'text', placeholder: 'e.g. Kerala, India' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'is_official', label: 'Official Chavee Company', type: 'toggle', onLabel: 'Official', offLabel: 'Third-Party' },
];

export default function CompaniesManager() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobCounts, setJobCounts] = useState({});

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
            const { data, error } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setRows(data || []);

            // Real per-company job counts, so "delete" can honestly warn
            // when a company still has real jobs pointing at it.
            const { data: jobsData } = await supabase.from('jobs').select('company_id');
            const counts = {};
            (jobsData || []).forEach(j => { if (j.company_id) counts[j.company_id] = (counts[j.company_id] || 0) + 1; });
            setJobCounts(counts);
        } catch (err) {
            console.error(err);
            showToast('Failed to load companies: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (values) => {
        setSaving(true);
        try {
            const payload = {
                name: values.name?.trim(),
                logo_url: values.logo_url?.trim() || null,
                website: values.website?.trim() || null,
                location: values.location?.trim() || null,
                description: values.description?.trim() || null,
                is_official: !!values.is_official,
            };

            let error;
            if (modal.mode === 'create') {
                ({ error } = await supabase.from('companies').insert(payload));
            } else {
                ({ error } = await supabase.from('companies').update(payload).eq('id', modal.row.id));
            }
            if (error) throw error;

            showToast(modal.mode === 'create' ? 'Company created successfully!' : 'Company updated successfully!');
            setModal({ open: false, mode: 'create', row: null });
            loadData();
        } catch (err) {
            showToast('Failed to save company: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const { error } = await supabase.from('companies').delete().eq('id', confirmDelete.row.id);
            if (error) throw error;
            showToast('Company deleted.');
            setConfirmDelete({ open: false, row: null });
            loadData();
        } catch (err) {
            // Real FK violation surfaces here if jobs still reference this
            // company (no ON DELETE behavior removes those jobs silently).
            showToast('Failed to delete: ' + err.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const columns = [
        {
            key: 'name', label: 'Company', sortable: true,
            render: (v, row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-elevated)', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                        {row.logo_url ? <img src={row.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🏢'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.87rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {v}
                            {row.is_official && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--peacock-green)', background: 'var(--bg-mint)', padding: '0.1rem 0.45rem', borderRadius: 20 }}>Official</span>}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.location || '—'}</div>
                    </div>
                </div>
            )
        },
        { key: 'website', label: 'Website', render: v => v ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--peacock-green)', fontSize: '0.8rem' }}>{v.replace(/^https?:\/\//, '')}</a> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
        { key: 'jobs', label: 'Real Jobs', sortable: false, render: (_, row) => <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>💼 {jobCounts[row.id] || 0}</span> },
        { key: 'created_at', label: 'Added', sortable: true, render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—' },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>🏢 Companies</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Manage Chavee and third-party companies that post jobs on the platform.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={loadData} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>↻ Refresh</button>
                    <button onClick={() => setModal({ open: true, mode: 'create', row: null })} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>+ Add New Company</button>
                </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={rows}
                    loading={loading}
                    emptyMessage="No companies yet."
                    searchKeys={['name', 'location']}
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
                title={modal.mode === 'create' ? 'Add New Company' : `Edit: ${modal.row?.name}`}
                fields={FIELDS}
                initialValues={modal.row || { is_official: false }}
                onSubmit={handleSave}
                onClose={() => setModal({ open: false, mode: 'create', row: null })}
                submitLabel={modal.mode === 'create' ? 'Create Company' : 'Save Changes'}
                loading={saving}
            />

            <ConfirmDialog
                open={confirmDelete.open}
                title="Delete company?"
                message={confirmDelete.row ? `"${confirmDelete.row.name}" has ${jobCounts[confirmDelete.row.id] || 0} real job(s) linked to it. Deleting it will fail if any job still references it.` : ''}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete({ open: false, row: null })}
                loading={deleting}
            />
        </div>
    );
}
