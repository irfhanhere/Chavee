import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../supabaseClient.js';
import DataTable from '../components/DataTable.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Toast, { useToast } from '../../../components/Toast.jsx';
import { fetchEmailMap } from '../../../utils/emailLookup.js';

export default function UsersManager() {
    const { toast, showToast, hideToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Filters
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Confirm dialogs
    const [actionDialog, setActionDialog] = useState({ open: false, type: '', row: null });
    const [processing, setProcessing] = useState(false);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch profiles
            const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
            if (profErr) throw profErr;

            // Fetch admins
            const { data: admins, error: adminErr } = await supabase.from('admins').select('*');
            if (adminErr) throw adminErr;

            const adminMap = {};
            (admins || []).forEach(a => {
                adminMap[a.user_id] = a.role;
            });

            // Merge — no email here yet. profiles has no email column at all
            // (confirmed live); real email only lives in Supabase Auth. Filled
            // in below via the batched admin-email-lookup Edge Function once
            // it resolves, so the table renders immediately and emails arrive
            // a beat later rather than blocking the page.
            const merged = (profiles || []).map(p => ({
                ...p,
                role: adminMap[p.id] || 'student', // default student if not in admins table
                email: null,
                status: p.status || 'active'
            }));

            setUsers(merged);
            setSelectedIds(new Set());

            const { emails, failed } = await fetchEmailMap(merged.map(u => u.id));
            if (!failed) {
                setUsers(prev => prev.map(u => ({ ...u, email: emails[u.id] || null })));
            }
        } catch (err) {
            console.error('Failed to load users:', err);
            showToast('Failed to load users: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { loadUsers(); }, [loadUsers]);

    // Computed Stats
    const stats = useMemo(() => {
        const total = users.length;
        const active = users.filter(u => u.status !== 'suspended' && u.status !== 'banned').length;
        const today = new Date().toISOString().split('T')[0];
        const newToday = users.filter(u => u.created_at && u.created_at.startsWith(today)).length;
        const verified = users.filter(u => u.is_verified).length;
        const admins = users.filter(u => ['super_admin', 'admin', 'moderator', 'content_manager'].includes(u.role)).length;
        const banned = users.filter(u => u.status === 'banned').length;
        return { total, active, newToday, verified, admins, banned };
    }, [users]);

    // Derived filtering
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            if (roleFilter !== 'all') {
                const isAdminRole = ['super_admin', 'admin', 'moderator', 'content_manager'].includes(u.role);
                if (roleFilter === 'admin' && !isAdminRole) return false;
                if (roleFilter === 'student' && isAdminRole) return false;
            }
            if (statusFilter !== 'all') {
                if (statusFilter !== (u.status || 'active')) return false;
            }
            return true;
        });
    }, [users, roleFilter, statusFilter]);

    // Checkbox toggles
    const toggleAll = () => {
        if (selectedIds.size === filteredUsers.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    };
    const toggleRow = (id) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    // Actions
    const handleActionConfirm = async () => {
        setProcessing(true);
        const { type, row } = actionDialog;
        try {
            if (type === 'promote') {
                const { error } = await supabase.rpc('add_admin', { p_user_id: row.id });
                if (error) throw error;
                showToast(`Granted admin access to ${row.full_name || 'user'}.`);
            } else if (type === 'revoke') {
                const { error } = await supabase.rpc('remove_admin', { p_user_id: row.id });
                if (error) throw error;
                showToast(`Revoked admin access from ${row.full_name || 'user'}.`);
            } else if (type === 'suspend' || type === 'ban' || type === 'reactivate') {
                const newStatus = type === 'reactivate' ? 'active' : type;
                const { error } = await supabase.rpc('admin_set_user_status', { p_user_id: row.id, p_status: newStatus });
                if (error) throw error;
                showToast(`User status updated to ${newStatus}.`);
            } else if (type === 'reset_password') {
                // Guarded in the menu below too (option is only offered when a real
                // email resolved) — this is defense in depth, not the primary gate.
                if (!row.email) throw new Error('No real email on file for this user — cannot send a reset email.');
                const { error } = await supabase.auth.resetPasswordForEmail(row.email);
                if (error) throw error;
                showToast(`Password reset email sent to ${row.email}.`);
            }
            loadUsers();
        } catch (err) {
            console.error(err);
            showToast('Action failed: ' + err.message, 'error');
        } finally {
            setProcessing(false);
            setActionDialog({ open: false, type: '', row: null });
        }
    };

    const handleBulkSuspend = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Are you sure you want to suspend ${selectedIds.size} users?`)) return;
        setProcessing(true);
        try {
            for (let id of selectedIds) {
                await supabase.rpc('admin_set_user_status', { p_user_id: id, p_status: 'suspended' });
            }
            showToast(`Successfully suspended ${selectedIds.size} users.`);
            setSelectedIds(new Set());
            loadUsers();
        } catch (err) {
            showToast('Bulk suspend failed partially: ' + err.message, 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleExportCSV = () => {
        if (filteredUsers.length === 0) return showToast('No users to export', 'error');
        const headers = ['ID', 'Name', 'Username', 'Email', 'Role', 'Status', 'College', 'Joined'];
        const csvRows = [headers.join(',')];
        filteredUsers.forEach(u => {
            const values = [
                u.id,
                `"${(u.full_name || '').replace(/"/g, '""')}"`,
                `"${u.username || ''}"`,
                `"${u.email || '—'}"`,
                u.role || 'Student',
                u.status || 'active',
                `"${(u.college || '').replace(/"/g, '""')}"`,
                u.created_at ? new Date(u.created_at).toISOString() : ''
            ];
            csvRows.push(values.join(','));
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chavee_users_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Table Columns
    const COLUMNS = [
        { key: 'checkbox', label: ( <input type="checkbox" checked={selectedIds.size > 0 && selectedIds.size === filteredUsers.length} onChange={toggleAll} style={{ cursor: 'pointer' }} /> ), width: 40, render: (_, row) => (
            <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleRow(row.id)} style={{ cursor: 'pointer' }} />
        )},
        { key: 'avatar', label: 'Photo', width: 48, render: (_, row) => {
            const initial = (row.full_name || row.username || '?')[0].toUpperCase();
            return (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--peacock-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {row.avatar_url ? <img src={row.avatar_url} alt="" style={{width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover'}} /> : initial}
                </div>
            );
        }},
        { key: 'full_name', label: 'Name', render: (v, row) => (
            <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v || 'Unnamed User'} {row.is_verified && <span style={{ color: '#10B981', fontSize: '0.8rem' }} title="Verified">✓</span>}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{row.username || '—'}</div>
            </div>
        )},
        { key: 'email', label: 'Email', render: v => <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v || '—'}</span> },
        { key: 'role', label: 'Role', render: v => {
            const isAdmin = ['super_admin', 'admin', 'moderator', 'content_manager'].includes(v);
            return isAdmin ? (
                <span style={{ padding: '0.15rem 0.55rem', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>{v.replace('_', ' ').toUpperCase()}</span>
            ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Student</span>
            );
        }},
        { key: 'status', label: 'Status', render: v => {
            const s = v || 'active';
            const colors = { active: '#10B981', suspended: '#F59E0B', banned: '#EF4444' };
            const color = colors[s] || '#94A3B8';
            return <span style={{ color, fontWeight: 700, fontSize: '0.8rem', textTransform: 'capitalize' }}>{s}</span>;
        }},
        { key: 'college', label: 'College', render: (v, row) => (
            <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{v || '—'}</div>
                {(row.course || row.year) && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.course} • {row.year}</div>}
            </div>
        )},
        { key: 'created_at', label: 'Joined', render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—' },
    ];

    const StatBox = ({ label, value, color }) => (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1rem', flex: '1 1 120px', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{value}</div>
        </div>
    );

    return (
        <div style={{ animation: 'adminFadeUp 0.3s ease-out' }}>
            <Toast {...toast} onHide={hideToast} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>User Management</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>View, filter, and manage platform users.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={handleExportCSV} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>
                        📥 Export CSV
                    </button>
                    {selectedIds.size > 0 && (
                        <button onClick={handleBulkSuspend} disabled={processing} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: '#FEF2F2', border: '1px solid #F87171', color: '#B91C1C', fontWeight: 600, cursor: processing ? 'not-allowed' : 'pointer' }}>
                            Suspend Selected ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                <StatBox label="Total Users" value={stats.total} color="var(--text-primary)" />
                <StatBox label="Active" value={stats.active} color="#10B981" />
                <StatBox label="New Today" value={stats.newToday} color="#6366F1" />
                <StatBox label="Verified" value={stats.verified} color="#8B5CF6" />
                <StatBox label="Admins" value={stats.admins} color="#F59E0B" />
                <StatBox label="Banned" value={stats.banned} color="#EF4444" />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Role Filter</label>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}>
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status Filter</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', outline: 'none' }}>
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>
            </div>

            {/* Users table */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                <DataTable
                    columns={COLUMNS}
                    rows={filteredUsers}
                    loading={loading}
                    emptyMessage="No users match the criteria."
                    searchKeys={['full_name', 'username', 'email', 'college']}
                    actions={(row) => (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button
                                onClick={() => window.open('/admin/users/' + row.id, '_blank')} // Stub route for View Profile
                                style={{ padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                View
                            </button>

                            <select 
                                onChange={(e) => {
                                    if(e.target.value) setActionDialog({ open: true, type: e.target.value, row });
                                    e.target.value = '';
                                }}
                                style={{ padding: '0.35rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer', outline: 'none' }}
                                value=""
                            >
                                <option value="" disabled>Actions...</option>
                                <optgroup label="Access">
                                    {(row.status || 'active') !== 'suspended' && <option value="suspend">Suspend</option>}
                                    {(row.status || 'active') !== 'banned' && <option value="ban">Ban</option>}
                                    {(row.status === 'suspended' || row.status === 'banned') && <option value="reactivate">Reactivate</option>}
                                </optgroup>
                                <optgroup label="Roles">
                                    {['super_admin', 'admin', 'moderator', 'content_manager'].includes(row.role) ? (
                                        <option value="revoke">Remove Admin</option>
                                    ) : (
                                        <option value="promote">Make Admin</option>
                                    )}
                                </optgroup>
                                <optgroup label="Account">
                                    {/* Only offered when a real email actually resolved from the
                                        admin-email-lookup Edge Function — previously this always
                                        fired against a fabricated @example.com address, so the
                                        "sent!" toast was never true for anyone. */}
                                    {row.email && <option value="reset_password">Reset Password</option>}
                                </optgroup>
                            </select>
                        </div>
                    )}
                />
            </div>

            <ConfirmDialog
                open={actionDialog.open}
                title="Confirm Action"
                message={`Are you sure you want to ${actionDialog.type.replace('_', ' ')} for ${actionDialog.row?.full_name || 'this user'}?`}
                confirmLabel="Yes, Proceed"
                onConfirm={handleActionConfirm}
                onCancel={() => setActionDialog({ open: false, type: '', row: null })}
                loading={processing}
            />
            
            <style>{`
                @keyframes adminFadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
