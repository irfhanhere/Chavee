import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import FormModal from '../components/FormModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

/* ─────────────────────────────────────────────
   DATE HELPERS
───────────────────────────────────────────── */
const thisMonthValue = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatFeaturedMonth = (dateStr) => {
    if (!dateStr) return null;
    const [y, m] = dateStr.split('-');
    return new Date(Number(y), Number(m) - 1, 1)
        .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

const monthValueToDate = (val) => (val ? `${val}-01` : null);

const dateToMonthValue = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.slice(0, 7); // "YYYY-MM"
};

const isFeaturedThisMonth = (featuredDate) => {
    if (!featuredDate) return false;
    const now   = new Date();
    const nowMM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return featuredDate.startsWith(nowMM);
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
   QUICK-SET-FEATURED BUTTON
───────────────────────────────────────────── */
function QuickFeatureBtn({ row, busy, onSet }) {
    const [hov, setHov] = useState(false);
    const isThisMonth = isFeaturedThisMonth(row.featured_month);

    if (isThisMonth) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.22rem 0.7rem', borderRadius: 20,
                background: 'rgba(245,158,11,0.08)', color: 'var(--accent-gold)',
                border: '1px solid rgba(245,158,11,0.25)',
                fontSize: '0.72rem', fontWeight: 800,
            }}>
                ⭐ Featured
            </span>
        );
    }

    return (
        <button
            onClick={() => onSet(row)}
            disabled={busy}
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            title="Set as this month's Scholarship of the Month"
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.22rem 0.7rem', borderRadius: 20,
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.72rem', transition: 'all 0.18s',
                background: hov ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)',
                color: hov ? 'var(--accent-gold)' : 'var(--text-muted)',
                border: `1px solid ${hov ? 'rgba(245,158,11,0.25)' : 'var(--border-color)'}`,
                opacity: busy ? 0.55 : 1,
            }}
        >
            {busy ? (
                <span style={{
                    width: 10, height: 10, border: '2px solid currentColor',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
            ) : '☆'}
            Set {new Date().toLocaleDateString('en-IN', { month: 'short' })}
        </button>
    );
}

/* ─────────────────────────────────────────────
   THIS MONTH'S PICK BANNER (Light Theme)
───────────────────────────────────────────── */
function ThisMonthBanner({ scholarship, onEdit }) {
    const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    if (!scholarship) {
        return (
            <div style={{
                background: 'var(--bg-surface)',
                border: '1px dashed var(--border-color)',
                borderRadius: 14, padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                flexWrap: 'wrap',
                boxShadow: 'var(--shadow-sm)',
            }}>
                <span style={{ fontSize: '1.4rem' }}>📋</span>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
                        No Scholarship of the Month set for <strong style={{ color: 'var(--text-primary)' }}>{monthLabel}</strong>
                    </p>
                    <p style={{ margin: '0.15rem 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Use the ☆ button on any row below to feature it this month.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, var(--bg-mint) 0%, rgba(245,158,11,0.05) 100%)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 14, padding: '1.1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
            flexWrap: 'wrap',
            boxShadow: 'var(--shadow-sm)',
            animation: 'fadeInUp 0.3s ease-out',
        }}>
            <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem',
            }}>⭐</div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: '0 0 0.15rem',
                    fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-gold)',
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                }}>
                    {monthLabel} — Scholarship of the Month
                </p>
                <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {scholarship.name}
                </p>
                {scholarship.eligibility && (
                    <p style={{
                        margin: '0.15rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {scholarship.eligibility}
                    </p>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                {scholarship.apply_url && (
                    <a
                        href={scholarship.apply_url}
                        target="_blank" rel="noreferrer"
                        style={{
                            padding: '0.45rem 0.9rem', borderRadius: 8, textDecoration: 'none',
                            background: 'var(--bg-mint)', border: '1px solid var(--border-mint)',
                            color: 'var(--peacock-green)', fontSize: '0.78rem', fontWeight: 700,
                        }}
                    >Apply ↗</a>
                )}
                <button
                    onClick={() => onEdit(scholarship)}
                    style={{
                        padding: '0.45rem 0.9rem', borderRadius: 8,
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                    }}
                >Edit</button>
            </div>
        </div>
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
            title={isLive ? 'Click to set Coming Soon' : 'Click to set Live'}
            style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.22rem 0.7rem', borderRadius: 20,
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.72rem',
                transition: 'all 0.18s',
                background: isLive
                    ? (hov ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.08)')
                    : (hov ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.08)'),
                color: isLive
                    ? (hov ? '#F59E0B' : '#10B981')
                    : (hov ? '#10B981' : '#F59E0B'),
                border: isLive
                    ? `1px solid ${hov ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.18)'}`
                    : `1px solid ${hov ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.25)'}`,
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
            {isLive ? (hov ? 'Coming Soon' : 'Live') : (hov ? 'Go Live' : 'Coming Soon')}
        </button>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function ScholarshipsManager() {
    const [rows, setRows]         = useState([]);
    const [countryFilter, setCountryFilter] = useState('All'); // 'All' | 'Domestic' | 'International'
    const [loading, setLoading]   = useState(true);
    const [modal, setModal]       = useState({ open: false, mode: 'create', row: null });
    const [confirm, setConfirm]   = useState({ open: false, row: null });
    const [saving, setSaving]     = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [settingId, setSettingId] = useState(null);
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
        const [{ data: scholarshipsData, error: scholarshipsError }, { data: countsData }] = await Promise.all([
            supabase.from('scholarships').select('*').order('created_at', { ascending: false }),
            supabase.from('waitlist_counts').select('*').like('feature_key', 'scholarship:%')
        ]);
        
        if (scholarshipsError) showToast('Failed to load scholarships: ' + scholarshipsError.message, 'error');
        
        const countsMap = (countsData || []).reduce((acc, curr) => {
            acc[curr.feature_key] = curr.waitlist_count;
            return acc;
        }, {});

        const rowsWithCounts = (scholarshipsData || []).map(r => ({
            ...r,
            waitlist_count: countsMap[`scholarship:${r.id}`] || 0
        }));

        setRows(rowsWithCounts);
        setLoading(false);
    }, []);

    const filteredRows = React.useMemo(() => {
        if (countryFilter === 'All') return rows;
        if (countryFilter === 'Domestic') return rows.filter(r => (r.country || '').toLowerCase() === 'india');
        if (countryFilter === 'International') return rows.filter(r => (r.country || '').toLowerCase() !== 'india' && r.country);
        return rows;
    }, [rows, countryFilter]);

    useEffect(() => { load(); }, [load]);

    /* ── Quick-set this month ── */
    const handleQuickSet = async (row) => {
        setSettingId(row.id);
        const newDate = monthValueToDate(thisMonthValue());
        const { error } = await supabase
            .from('scholarships')
            .update({ featured_month: newDate })
            .eq('id', row.id);
        setSettingId(null);
        if (error) { showToast('Failed: ' + error.message, 'error'); return; }
        showToast(`⭐ "${row.name}" is now the Scholarship of the Month!`);
        setRows(prev => prev.map(r => r.id === row.id ? { ...r, featured_month: newDate } : r));
    };

    /* ── Quick status toggle ── */
    const handleToggleStatus = async (row) => {
        setTogglingId(row.id);
        // Toggle between Live and Draft to match other managers (or Coming Soon depending on legacy data, but we'll use Draft for consistency)
        const newValue = row.status === 'Live' ? 'Draft' : 'Live';
        const { error } = await supabase
            .from('scholarships')
            .update({ status: newValue })
            .eq('id', row.id);
            
        if (error) { 
            setTogglingId(null);
            showToast('Toggle failed: ' + error.message, 'error'); 
            return; 
        }

        if (newValue === 'Live' && row.waitlist_count > 0) {
            try {
                await supabase.rpc('notify_waitlist_on_publish', { 
                    p_feature_key: `scholarship:${row.id}`, 
                    p_title: row.name 
                });
                showToast(`🟢 Live! Notified ${row.waitlist_count} waitlisted users.`, 'success');
            } catch (err) {
                console.error("Waitlist notification failed:", err);
                showToast('🟢 Live! (Waitlist notification failed)', 'success');
            }
        } else {
            showToast(newValue === 'Live' ? '🟢 Scholarship is now Live!' : `⏳ Scholarship set to ${newValue}.`);
        }

        setTogglingId(null);
        load();
    };

    /* ── Modal handlers ── */
    const openCreate = () => setModal({ open: true, mode: 'create', row: null });
    const openEdit   = (row) => setModal({ open: true, mode: 'edit', row });
    const closeModal = () => setModal(m => ({ ...m, open: false }));

    const handleSubmit = async (values) => {
        setSaving(true);
        const payload = {
            name:            values.name?.trim(),
            description:     values.description?.trim(),
            eligibility:     values.eligibility?.trim() || null,
            state:           values.state?.trim() || null,
            country:         values.country?.trim() || null,
            education_level: values.education_level?.trim() || null,
            category:        values.category?.trim() || null,
            funding_type:    values.funding_type?.trim() || null,
            deadline_date:   values.deadline_date?.trim() || null,
            apply_url:       values.apply_url?.trim(),
            featured_month:  values.featured_month
                ? monthValueToDate(values.featured_month)
                : null,
        };
        let error;
        if (modal.mode === 'create') {
            ({ error } = await supabase.from('scholarships').insert(payload));
        } else {
            ({ error } = await supabase.from('scholarships').update(payload).eq('id', modal.row.id));
        }
        setSaving(false);
        if (error) { showToast('Save failed: ' + error.message, 'error'); return; }
        showToast(modal.mode === 'create' ? '✅ Scholarship added!' : '✅ Scholarship updated!');
        closeModal();
        load();
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase.from('scholarships').delete().eq('id', confirm.row.id);
        setDeleting(false);
        setConfirm({ open: false, row: null });
        if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
        showToast('🗑️ Scholarship deleted.');
        load();
    };

    const thisMonthPick = rows.find(r => isFeaturedThisMonth(r.featured_month)) || null;

    const initialValues = modal.mode === 'edit' && modal.row ? {
        name:           modal.row.name          ?? '',
        description:    modal.row.description   ?? '',
        eligibility:    modal.row.eligibility   ?? '',
        state:          modal.row.state         ?? '',
        country:        modal.row.country       ?? '',
        education_level:modal.row.education_level?? '',
        category:       modal.row.category      ?? '',
        funding_type:   modal.row.funding_type  ?? '',
        deadline_date:  modal.row.deadline_date ?? '',
        apply_url:      modal.row.apply_url     ?? '',
        featured_month: dateToMonthValue(modal.row.featured_month) ?? '',
        status:         modal.row.status !== 'Coming Soon',
    } : { featured_month: '', status: true, state: '', country: '', education_level: '', category: '', funding_type: '', deadline_date: '' };

    const actionBtn = (color) => ({
        padding: '0.35rem 0.75rem', borderRadius: 7,
        border: `1px solid ${color}30`, background: `${color}12`,
        color, fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
        transition: 'all 0.15s',
    });

    const fields = [
        { key: 'name', label: 'Scholarship Name', type: 'text', required: true, placeholder: 'e.g. Reliance Foundation UG Scholarship' },
        { key: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'What is this scholarship? Who offers it?' },
        { key: 'eligibility', label: 'Eligibility', type: 'textarea', placeholder: 'e.g. For undergrads...', hint: 'Who can apply?' },
        { key: 'state', label: 'State', type: 'text', placeholder: 'e.g. Maharashtra (leave blank if nationwide)' },
        { key: 'country', label: 'Country', type: 'text', placeholder: 'e.g. India' },
        { key: 'education_level', label: 'Education Level', type: 'select', options: [{label:'High School',value:'High School'},{label:'Undergraduate',value:'Undergraduate'},{label:'Postgraduate',value:'Postgraduate'},{label:'Doctorate',value:'Doctorate'},{label:'Any',value:'Any'}] },
        { key: 'category', label: 'Category', type: 'select', options: [{label:'Merit-Based',value:'Merit-Based'},{label:'Need-Based',value:'Need-Based'},{label:'Minority',value:'Minority'},{label:'Women',value:'Women'},{label:'General',value:'General'}] },
        { key: 'funding_type', label: 'Funding Type', type: 'select', options: [{label:'Full Ride',value:'Full Ride'},{label:'Partial',value:'Partial'},{label:'One-time',value:'One-time'},{label:'Variable',value:'Variable'}] },
        { key: 'deadline_date', label: 'Deadline Date', type: 'date', hint: 'Used for Open/Closed status computation' },
        { key: 'apply_url', label: 'Apply URL', type: 'url', required: true, placeholder: 'https://...' },
        { key: 'featured_month', label: 'Featured Month', type: 'month', hint: 'Choose a month to feature this listing.' },
        { key: 'status', label: 'Status', type: 'toggle', onLabel: '🟢 Live — visible to all users', offLabel: '⏳ Coming Soon — placeholder' }
    ];

    const columns = [
        {
            key: 'name', label: 'Name', sortable: true,
            render: (v, row) => (
                <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v || '—'}</span>
                    {row.description && (
                        <div style={{
                            fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.1rem',
                            maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {row.description}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'eligibility', label: 'Eligibility', sortable: true,
            render: v => (
                <span style={{
                    color: 'var(--text-secondary)', fontSize: '0.78rem',
                    maxWidth: 220, display: 'block',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                    {v || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </span>
            ),
        },
        {
            key: 'featured_month', label: 'Featured Month', sortable: true,
            render: (v, row) => {
                const label = formatFeaturedMonth(v);
                const isThis = isFeaturedThisMonth(v);
                return label ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <span style={{
                            padding: '0.18rem 0.6rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                            background: isThis ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)',
                            color: isThis ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            border: `1px solid ${isThis ? 'rgba(245,158,11,0.25)' : 'var(--border-color)'}`,
                        }}>
                            {isThis ? '⭐ ' : '📅 '}{label}
                        </span>
                    </div>
                ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>Not featured</span>
                );
            },
        },
        {
            key: 'apply_url', label: 'Link', sortable: true,
            render: v => v ? (
                <a href={v} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--peacock-green)', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                    Apply ↗
                </a>
            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>,
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
            key: '_feature', label: 'This Month',
            render: (_, row) => (
                <QuickFeatureBtn
                    row={row}
                    busy={settingId === row.id}
                    onSet={handleQuickSet}
                />
            ),
        },
    ];

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />

            {/* Page header */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
            }}>
                <div>
                    <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        🎓 Scholarships
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {rows.length} listed · {rows.filter(r => r.featured_month).length} with a featured month
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select 
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        style={{
                            padding: '0.65rem 1rem', borderRadius: 10, border: '1px solid var(--border-color)',
                            background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem',
                            outline: 'none', cursor: 'pointer'
                        }}
                    >
                        <option value="All">All Scholarships</option>
                        <option value="Domestic">Domestic (India)</option>
                        <option value="International">International</option>
                    </select>
                    <button
                        onClick={openCreate}
                        style={{
                            padding: '0.65rem 1.35rem', borderRadius: 10, border: 'none',
                            background: 'var(--peacock-green)', color: '#fff', fontWeight: 700,
                            fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.2s',
                        }}
                    >
                        + Add Scholarship
                    </button>
                </div>
            </div>

            {/* This Month's Pick Banner */}
            <ThisMonthBanner scholarship={thisMonthPick} onEdit={openEdit} />

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
                    emptyMessage="No scholarships yet. Click '+ Add Scholarship' to add one."
                    searchKeys={['name', 'eligibility', 'description']}
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
                title={modal.mode === 'create' ? '+ Add Scholarship' : `Edit: ${modal.row?.name}`}
                fields={fields}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                onClose={closeModal}
                submitLabel={modal.mode === 'create' ? 'Create Scholarship' : 'Save Changes'}
                loading={saving}
            />

            {/* Delete Confirm */}
            <ConfirmDialog
                open={confirm.open}
                title="Delete Scholarship"
                message={`Delete "${confirm.row?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={handleDelete}
                onCancel={() => setConfirm({ open: false, row: null })}
                loading={deleting}
            />
        </div>
    );
}
