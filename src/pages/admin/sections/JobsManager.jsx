import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import FormModal from '../components/FormModal.jsx';
import { getCvSignedUrl } from '../../../utils/cvStorage.js';

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

// Simple, real slugify — matches the seeded categories' slug shape
// (lowercase, hyphen-separated, no punctuation).
function slugify(name) {
    return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const OTHER_CATEGORY_VALUE = '__other__';

function StatCard({ title, count, color, icon, loading }) {
    return (
        <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            borderRadius: 16, padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                {icon}
            </div>
            <div>
                <p style={{ margin: '0 0 0.25rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
                <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                    {loading ? <span style={{ color: 'var(--border-color)' }}>-</span> : count}
                </h3>
            </div>
        </div>
    );
}

export default function JobsManager() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [companyFilter, setCompanyFilter] = useState('All Companies');

    // Stats
    const [stats, setStats] = useState({ total: 0, live: 0, pendingReview: 0, featured: 0, reported: 0 });

    // Inline "+ Add New Company" quick-create, opened from inside the job form
    const [quickCompanyOpen, setQuickCompanyOpen] = useState(false);
    const [quickCompanyName, setQuickCompanyName] = useState('');
    const [savingQuickCompany, setSavingQuickCompany] = useState(false);

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    // Form Modal
    const [modal, setModal] = useState({ open: false, mode: 'create', row: null });
    const [saving, setSaving] = useState(false);

    // Sub-view Applications
    const [viewingAppsFor, setViewingAppsFor] = useState(null);
    const [apps, setApps] = useState([]);
    const [loadingApps, setLoadingApps] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Jobs — real company relation embedded, so logo/name come
            // from the companies table now instead of the per-job emoji field.
            const { data: jobsData, error: jobsErr } = await supabase
                .from('jobs')
                .select('*, companies(id, name, logo_url, is_official)')
                .order('created_at', { ascending: false });
            if (jobsErr) throw jobsErr;

            // Fetch Categories
            const { data: catsData } = await supabase.from('job_categories').select('*');
            setCategories(catsData || []);

            // Fetch real Companies list — used for the picker + filter dropdown
            const { data: companiesData } = await supabase.from('companies').select('*').order('name');
            setCompanies(companiesData || []);

            // Fetch Proposals Count
            let appsCountMap = {};
            const { data: appsData } = await supabase.from('job_applications').select('job_id');
            if (appsData) {
                appsData.forEach(a => appsCountMap[a.job_id] = (appsCountMap[a.job_id] || 0) + 1);
            }

            // Fetch Reported Status
            let reportedSet = new Set();
            const { data: reportsData } = await supabase.from('reports_moderation').select('job_id').eq('status', 'Pending').not('job_id', 'is', null);
            if (reportsData) reportsData.forEach(r => reportedSet.add(r.job_id));

            const enriched = (jobsData || []).map(j => ({
                ...j,
                category_name: (catsData || []).find(c => c.id === j.category_id)?.name || 'Uncategorized',
                applicant_count: appsCountMap[j.id] || 0,
                is_reported: reportedSet.has(j.id)
            }));

            setRows(enriched);

            setStats({
                total: enriched.length,
                live: enriched.filter(j => j.status === 'live' && !j.admin_hidden).length,
                pendingReview: enriched.filter(j => j.status === 'pending_review').length,
                featured: enriched.filter(j => j.featured).length,
                reported: reportedSet.size
            });

        } catch (err) {
            console.error(err);
            showToast('Failed to load data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const performAction = async (job_id, action) => {
        try {
            const { error } = await supabase.rpc('admin_moderate_job', {
                p_job_id: job_id,
                p_action: action
            });
            if (error) throw error;
            showToast(`Action '${action}' successful.`);
            loadData();
        } catch (err) {
            showToast(`Action failed: ${err.message}`, 'error');
        }
    };

    const handleSaveJob = async (values) => {
        setSaving(true);
        try {
            const isInternal = !!values.application_type;

            // Real company relationship — write both company_id (FK) and the
            // matching company text (resolved from the selected company's
            // real name), so every existing text-column read site (Careers,
            // Earn.jsx, this manager's own list/apps view) keeps working
            // unmodified while the new relational column is also correct.
            const selectedCompany = companies.find(c => c.id === values.company_id);

            // "Other" category: case-insensitive lookup against real
            // job_categories first (so "Design" and "design" never create
            // two rows), only creating a new row when no match exists.
            let categoryId = values.category_id || null;
            if (categoryId === OTHER_CATEGORY_VALUE) {
                const newCatName = values.category_other_name?.trim();
                if (!newCatName) throw new Error('Enter a name for the new category.');

                const { data: existingCat, error: lookupErr } = await supabase
                    .from('job_categories')
                    .select('id, name')
                    .ilike('name', newCatName)
                    .maybeSingle();
                if (lookupErr) throw lookupErr;

                if (existingCat) {
                    categoryId = existingCat.id;
                } else {
                    const { data: createdCat, error: createErr } = await supabase
                        .from('job_categories')
                        .insert({ name: newCatName, slug: slugify(newCatName) })
                        .select('id, name')
                        .single();
                    if (createErr) throw createErr;
                    categoryId = createdCat.id;
                    setCategories(prev => [...prev, createdCat]);
                }
            }

            const payload = {
                title: values.title?.trim(),
                company_id: values.company_id || null,
                company: selectedCompany?.name || values.company?.trim() || '',
                job_type: values.job_type,
                description: values.description?.trim() || null,
                apply_url: isInternal ? null : (values.apply_url?.trim() || null),
                application_type: isInternal ? 'internal' : 'portal',
                status: values.status || 'pending_review',
                location: values.location?.trim() || 'Remote',
                compensation: values.compensation?.trim() || 'Negotiable',
                salary_min: values.salary_min || null,
                salary_max: values.salary_max || null,
                duration: values.duration?.trim() || 'Flexible',
                skills: values.skills?.trim() || 'General',
                category_id: categoryId,
                deadline: values.deadline || null
            };

            let error;
            if (modal.mode === 'create') {
                ({ error } = await supabase.from('jobs').insert(payload));
            } else {
                ({ error } = await supabase.from('jobs').update(payload).eq('id', modal.row.id));
            }

            if (error) throw error;
            showToast(modal.mode === 'create' ? 'Job posted successfully!' : 'Job updated successfully!');
            setModal({ open: false, mode: 'create', row: null });
            loadData();
        } catch (err) {
            showToast('Failed to save job: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const loadApplications = useCallback(async (jobId) => {
        setLoadingApps(true);
        try {
            const { data: appsData, error } = await supabase
                .from('job_applications')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const userIds = [...new Set((appsData || []).map(a => a.user_id).filter(Boolean))];
            let profilesMap = {};
            if (userIds.length > 0) {
                const { data: profiles } = await supabase.from('profiles').select('id, full_name, username').in('id', userIds);
                if (profiles) profiles.forEach(p => profilesMap[p.id] = p);
            }

            const enrichedApps = (appsData || []).map(a => ({
                ...a,
                profile: profilesMap[a.user_id] || { full_name: 'Unknown', username: 'unknown' }
            }));
            setApps(enrichedApps);
        } catch (err) {
            showToast('Failed to load apps: ' + err.message, 'error');
        } finally {
            setLoadingApps(false);
        }
    }, []);

    const viewAppsForJob = (job) => {
        setViewingAppsFor(job);
        loadApplications(job.id);
    };

    const handleUpdateAppStatus = async (appId, newStatus) => {
        try {
            const { error } = await supabase.rpc('admin_set_job_application_status', {
                p_application_id: appId,
                p_status: newStatus
            });
            if (error) throw error;
            showToast(`Status updated to ${newStatus}`);
            setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
        } catch (err) {
            showToast('Update failed: ' + err.message, 'error');
        }
    };

    const handleViewCv = async (cvUrl) => {
        try {
            const signedUrl = await getCvSignedUrl(cvUrl);
            if (!signedUrl) throw new Error('Failed to generate signed URL.');
            window.open(signedUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            showToast('Cannot open CV: ' + err.message, 'error');
        }
    };

    const formatCurrency = (amount) => amount ? `₹${Number(amount).toLocaleString('en-IN')}` : '';

    // Inline "+ Add New Company" — a real, minimal insert (name only; full
    // profile details can be filled in later from the Companies page).
    // Refreshing `companies` alone (not the whole job list) lets the open
    // job form's dropdown pick up the new option immediately.
    const handleQuickAddCompany = async () => {
        if (!quickCompanyName.trim()) return;
        setSavingQuickCompany(true);
        try {
            const { data, error } = await supabase.from('companies').insert({ name: quickCompanyName.trim() }).select().single();
            if (error) throw error;
            setCompanies(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
            showToast(`"${data.name}" added — select it from the dropdown.`);
            setQuickCompanyOpen(false);
            setQuickCompanyName('');
        } catch (err) {
            showToast('Failed to add company: ' + err.message, 'error');
        } finally {
            setSavingQuickCompany(false);
        }
    };

    // Real distinct companies represented in the currently loaded jobs list.
    const companyFilterOptions = useMemo(() => {
        const seen = new Map();
        rows.forEach(r => { if (r.companies) seen.set(r.companies.id, r.companies.name); });
        return ['All Companies', ...seen.values()];
    }, [rows]);

    const filteredRows = companyFilter === 'All Companies'
        ? rows
        : rows.filter(r => r.companies?.name === companyFilter);

    const columns = [
        {
            key: 'title', label: 'Job Title', sortable: true,
            render: (v, row) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{v || '—'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {row.companies?.logo_url ? (
                            <img src={row.companies.logo_url} alt="" style={{ width: 16, height: 16, borderRadius: 4, objectFit: 'contain' }} />
                        ) : (row.logo || '🏢')}
                        {row.companies?.name || row.company}
                        {row.companies?.is_official && <span style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--peacock-green)', background: 'var(--bg-mint)', padding: '0.05rem 0.4rem', borderRadius: 20 }}>Official</span>}
                    </span>
                    <div style={{ marginTop: '0.2rem', display: 'flex', gap: '0.5rem' }}>
                        {row.is_reported && <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.7rem' }}>🚩 Reported</span>}
                        {row.featured && <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.7rem' }}>⭐ Featured</span>}
                        {row.admin_hidden && <span style={{ color: '#6B7280', fontWeight: 700, fontSize: '0.7rem' }}>👁 Hidden</span>}
                    </div>
                </div>
            )
        },
        { key: 'category_name', label: 'Category', sortable: true, render: v => <span style={{ fontSize: '0.8rem' }}>{v}</span> },
        { 
            key: 'salary', label: 'Compensation', sortable: false,
            render: (_, row) => (
                <span style={{ fontWeight: 600, color: 'var(--emerald)', fontSize: '0.82rem' }}>
                    {row.salary_min || row.salary_max ? `${formatCurrency(row.salary_min)} - ${formatCurrency(row.salary_max)}` : row.compensation || '—'}
                </span>
            )
        },
        {
            key: 'status', label: 'Status', sortable: true,
            render: (v) => {
                const map = {
                    live: { label: '● Live', bg: 'rgba(16,185,129,0.1)', color: '#10B981' },
                    pending_review: { label: '● Pending Review', bg: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
                    closed: { label: '○ Closed', bg: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)' },
                };
                const s = map[v] || { label: '○ ' + v, bg: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)' };
                return (
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color }}>
                        {s.label}
                    </span>
                );
            }
        },
        {
            key: 'deadline', label: 'Deadline', sortable: true,
            render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—',
        },
        { key: 'views', label: 'Views', sortable: true, render: v => <span style={{ fontSize: '0.8rem' }}>👁 {v || 0}</span> },
        { key: 'applicant_count', label: 'Applicants', sortable: true, render: v => <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>📝 {v}</span> },
        {
            key: 'created_at', label: 'Posted', sortable: true,
            render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—',
        },
    ];

    const fields = [
        { key: 'title', label: 'Job Title', type: 'text', required: true },
        {
            key: 'company_id', label: 'Company', type: 'select_with_action', required: true,
            options: companies.map(c => ({ value: c.id, label: c.is_official ? `${c.name} (Official)` : c.name })),
            onAction: () => setQuickCompanyOpen(true), actionLabel: '+ Add New Company',
            hint: 'Jobs under the official Chavee company appear on the public Careers page.'
        },
        {
            key: 'category_id', label: 'Category', type: 'select',
            options: [...categories.map(c => ({ value: c.id, label: c.name })), { value: OTHER_CATEGORY_VALUE, label: 'Other (add new category)' }],
        },
        {
            key: 'category_other_name', label: 'New Category Name', type: 'text', required: true,
            condition: (vals) => vals.category_id === OTHER_CATEGORY_VALUE,
            placeholder: 'e.g. Data Science',
            hint: 'Reuses a matching existing category (case-insensitive) if one already exists, otherwise creates it.',
        },
        { key: 'job_type', label: 'Job Type', type: 'select', required: true, options: [{ value: 'Full-Time', label: 'Full-Time' }, { value: 'Part-Time', label: 'Part-Time' }, { value: 'Internship', label: 'Internship' }] },
        { key: 'location', label: 'Location', type: 'text', required: true },
        { key: 'salary_min', label: 'Min Salary', type: 'number' },
        { key: 'salary_max', label: 'Max Salary', type: 'number' },
        { key: 'compensation', label: 'Compensation Text (Fallback)', type: 'text' },
        { key: 'duration', label: 'Duration', type: 'text' },
        { key: 'skills', label: 'Skills (comma separated)', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'application_type', label: 'Application Type', type: 'toggle', onLabel: 'Internal App (CV upload)', offLabel: 'External Portal Link' },
        { key: 'apply_url', label: 'Apply URL (if External)', type: 'url', condition: (vals) => !vals.application_type },
        { key: 'deadline', label: 'Deadline', type: 'text', placeholder: 'YYYY-MM-DD' },
        {
            key: 'status', label: 'Status', type: 'select', required: true,
            options: [{ value: 'live', label: 'Live' }, { value: 'pending_review', label: 'Pending Review' }, { value: 'closed', label: 'Closed' }]
        }
    ];

    // Apps View
    if (viewingAppsFor) {
        return (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <Toast msg={toast?.msg} type={toast?.type} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <div>
                        <button
                            onClick={() => setViewingAppsFor(null)}
                            style={{ background: 'transparent', border: '1px solid var(--border-color)', padding: '0.45rem 0.9rem', borderRadius: 8, color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '0.75rem' }}
                        >
                            ← Back to Jobs
                        </button>
                        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                            📥 Apps for {viewingAppsFor.title}
                        </h1>
                        <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            at {viewingAppsFor.company} · {apps.length} applicants
                        </p>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                    <DataTable
                        columns={[
                            { key: 'candidate', label: 'Candidate', sortable: true, render: (_, r) => <div><span style={{ fontWeight: 700 }}>{r.profile?.full_name}</span><div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>@{r.profile?.username}</div></div> },
                            { key: 'cv_url', label: 'CV / Resume', render: (v) => v ? <button onClick={() => handleViewCv(v)} style={{ color: 'var(--peacock-green)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Download ↗</button> : '—' },
                            { key: 'status', label: 'Pipeline Stage', sortable: true, render: (v, row) => (
                                <select 
                                    value={v || 'submitted'} 
                                    onChange={(e) => handleUpdateAppStatus(row.id, e.target.value)}
                                    style={{ padding: '0.3rem 0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-base)', fontWeight: 700, fontSize: '0.75rem' }}
                                >
                                    <option value="submitted">Submitted</option>
                                    <option value="review">Review</option>
                                    <option value="interview">Interview</option>
                                    <option value="selected">Selected</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            )},
                            { key: 'created_at', label: 'Applied', sortable: true, render: v => v ? new Date(v).toLocaleDateString('en-IN') : '—' },
                        ]}
                        rows={apps}
                        loading={loadingApps}
                        emptyMessage="No applications yet."
                    />
                </div>
            </div>
        );
    }

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>💼 Jobs Management</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Create, manage, and review job applications.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={loadData}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>
                        ↻ Refresh
                    </button>
                    <button 
                        onClick={() => setModal({ open: true, mode: 'create', row: null })}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                        + Post Job
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                <StatCard title="Total Jobs" count={stats.total} icon="💼" color="#3B82F6" loading={loading} />
                <StatCard title="Live" count={stats.live} icon="⚡" color="#10B981" loading={loading} />
                <StatCard title="Pending Review" count={stats.pendingReview} icon="⏳" color="#F59E0B" loading={loading} />
                <StatCard title="Featured" count={stats.featured} icon="⭐" color="#8B5CF6" loading={loading} />
                <StatCard title="Reported" count={stats.reported} icon="🚩" color="#EF4444" loading={loading} />
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <select
                    value={companyFilter}
                    onChange={e => setCompanyFilter(e.target.value)}
                    style={{ padding: '0.55rem 0.9rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    {companyFilterOptions.map(c => <option key={c}>{c}</option>)}
                </select>
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 14, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={columns}
                    rows={filteredRows}
                    loading={loading}
                    emptyMessage="No jobs found."
                    searchKeys={['title', 'company']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <button onClick={() => viewAppsForJob(row)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#3B82F615', color: '#3B82F6', border: '1px solid #3B82F630', cursor: 'pointer' }}>Apps ({row.applicant_count})</button>
                            <button onClick={() => setModal({ open: true, mode: 'edit', row })} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6366F115', color: '#6366F1', border: '1px solid #6366F130', cursor: 'pointer' }}>Edit</button>
                            
                            {row.status === 'live' ? (
                                <button onClick={() => performAction(row.id, 'close')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430', cursor: 'pointer' }}>Close</button>
                            ) : null}

                            {!row.featured ? (
                                <button onClick={() => performAction(row.id, 'feature')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#8B5CF615', color: '#8B5CF6', border: '1px solid #8B5CF630', cursor: 'pointer' }}>Feature</button>
                            ) : (
                                <button onClick={() => performAction(row.id, 'unfeature')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Unfeature</button>
                            )}

                            {!row.admin_hidden ? (
                                <button onClick={() => performAction(row.id, 'hide')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#6B728015', color: '#6B7280', border: '1px solid #6B728030', cursor: 'pointer' }}>Hide</button>
                            ) : (
                                <button onClick={() => performAction(row.id, 'unhide')} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderRadius: 6, background: '#10B98115', color: '#10B981', border: '1px solid #10B98130', cursor: 'pointer' }}>Unhide</button>
                            )}
                        </div>
                    )}
                />
            </div>

            <FormModal
                open={modal.open}
                title={modal.mode === 'create' ? 'Post New Job' : `Edit: ${modal.row?.title}`}
                fields={fields}
                initialValues={modal.row ? { ...modal.row, application_type: modal.row.application_type === 'internal' } : { status: 'pending_review', application_type: true }}
                onSubmit={handleSaveJob}
                onClose={() => setModal({ open: false, mode: 'create', row: null })}
                submitLabel={modal.mode === 'create' ? 'Post Job' : 'Save Changes'}
                loading={saving}
            />

            {/* Inline "+ Add New Company" — a real, minimal quick-create so
                the admin never has to leave the job form. Full company
                details (logo, website, description) can be filled in later
                from the Companies page. */}
            {quickCompanyOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => !savingQuickCompany && setQuickCompanyOpen(false)}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 380, boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>+ Add New Company</h3>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Just the name for now — add logo, website and description later from the Companies page.</p>
                        <input
                            autoFocus
                            value={quickCompanyName}
                            onChange={e => setQuickCompanyName(e.target.value)}
                            placeholder="Company name"
                            disabled={savingQuickCompany}
                            className="fm-input"
                            style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 9, color: 'var(--text-primary)', padding: '0.65rem 0.9rem', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                            onKeyDown={e => { if (e.key === 'Enter') handleQuickAddCompany(); }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                            <button type="button" onClick={() => setQuickCompanyOpen(false)} disabled={savingQuickCompany} style={{ padding: '0.6rem 1.2rem', borderRadius: 9, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                            <button type="button" onClick={handleQuickAddCompany} disabled={savingQuickCompany || !quickCompanyName.trim()} style={{ padding: '0.6rem 1.2rem', borderRadius: 9, background: 'var(--peacock-green)', border: 'none', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: savingQuickCompany ? 'not-allowed' : 'pointer', opacity: savingQuickCompany ? 0.7 : 1 }}>
                                {savingQuickCompany ? 'Adding...' : 'Add Company'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
