import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';
import HeaderActions from '../../components/HeaderActions.jsx';
import SEO from '../../components/SEO.jsx';

const NAV = [
    { path: '/admin',              icon: '📊', label: 'Overview' },
    { path: '/admin/communities',  icon: '🏘️', label: 'Communities' },
    { path: '/admin/posts',        icon: '📝', label: 'Posts' },
    { path: '/admin/content',      icon: '📚', label: 'Content' },
    { path: '/admin/testimonials', icon: '💬', label: 'Testimonials' },
    { 
      label: 'Education', 
      icon: '🎓', 
      isExpandable: true,
      children: [
          { path: '/admin/courses',        label: 'Courses' },
          { path: '/admin/scholarships',   label: 'Scholarships' },
          { path: '/admin/certifications', label: 'Certifications' },
          { path: '/admin/resources',      label: 'Resources' },
      ]
    },
    { path: '/admin/jobs',         icon: '💼', label: 'Jobs' },
    { path: '/admin/companies',    icon: '🏢', label: 'Companies' },
    { path: '/admin/gigs',         icon: '⚡', label: 'Gigs' },
    // Separate path (not /admin/gigs/...) on purpose — isActive() below uses
    // startsWith(), so a nested path would light up both nav items at once.
    { path: '/admin/gig-moderation', icon: '🛡️', label: 'Gig Moderation' },
    { path: '/admin/contracts', icon: '📄', label: 'Contracts' },
    { path: '/admin/disputes', icon: '⚠️', label: 'Disputes' },
    { path: '/admin/withdrawals', icon: '💸', label: 'Withdrawals' },
    { path: '/admin/events',       icon: '🎪', label: 'Events' },
    { path: '/admin/users',        icon: '👥', label: 'Users' },
    { path: '/admin/reports',      icon: '🚩', label: 'Reports' },
    { path: '/admin/support-tickets', icon: '🎫', label: 'Issue Reports' },
    { path: '/admin/subscribers',  icon: '🔔', label: 'Waitlists' },
];

const ANIMATIONS = `
@keyframes adminModalIn {
  from { transform: scale(0.92) translateY(10px); opacity: 0; }
  to   { transform: scale(1)    translateY(0);    opacity: 1; }
}
@keyframes spin {
  0%   { transform: rotate(0deg);   }
  100% { transform: rotate(360deg); }
}
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.8; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
`;

export default function AdminShell({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser]       = useState(null);
    const [checking, setChecking] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [eduExpanded, setEduExpanded] = useState(false);

    useEffect(() => {
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { navigate('/login'); return; }
            setUser(session.user);

            // Admin guard — real is_admin() RPC only. This used to also trust
            // any account whose email merely contained "admin" or "qa_user"
            // as a client-side-only bypass, with zero backing in the actual
            // `admins` table or the events/admins RLS policies (confirmed
            // live: is_admin() returns false and there's no admins row for
            // an "admin_..." test account that could still reach this whole
            // panel, including Add/Edit/Delete on every manager). Removed —
            // the client-side gate now agrees with what the database
            // actually enforces, instead of quietly disagreeing with it.
            const { data } = await supabase.rpc('is_admin');
            const isAdmin = !!data;

            if (!isAdmin) {
                navigate('/dashboard');
                return;
            }
            setChecking(false);
        };
        check();
    }, [navigate]);

    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    if (checking) {
        return (
            <div style={{
                minHeight: '100vh', background: 'var(--bg-base)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '1.25rem',
            }}>
                <div style={{
                    width: 44, height: 44, border: '3px solid var(--peacock-green)',
                    borderTopColor: 'var(--emerald-light)', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>Verifying admin access…</p>
            </div>
        );
    }

    const isActive = (path) =>
        path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div style={{ padding: '0 0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
                <Link to="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                        width: 34, height: 34, borderRadius: 10,
                        background: 'var(--gradient-brand)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem', fontWeight: 900,
                    }}>🌿</div>
                    <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1 }}>Chavee</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Admin Panel</div>
                    </div>
                </Link>
            </div>

            {/* Nav */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                <p style={{ fontSize: '0.63rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 0.75rem', margin: '0 0 0.35rem' }}>Navigation</p>
                {NAV.map(n => {
                    if (n.isExpandable) {
                        const childActive = n.children.some(c => isActive(c.path));
                        // Automatically open if a child is active
                        const isExpanded = childActive || eduExpanded;
                        
                        return (
                            <div key={n.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <button
                                    onClick={() => setEduExpanded(!eduExpanded)}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.62rem 0.85rem', borderRadius: 10, border: 'none',
                                        background: 'transparent', cursor: 'pointer',
                                        fontSize: '0.875rem', fontWeight: childActive ? 700 : 600,
                                        color: childActive ? 'var(--peacock-green)' : 'var(--text-secondary)',
                                        borderLeft: `3px solid ${childActive ? 'var(--peacock-green)' : 'transparent'}`,
                                        transition: 'all 0.18s', width: '100%', textAlign: 'left',
                                    }}
                                    onMouseEnter={e => { if (!childActive) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                    onMouseLeave={e => { if (!childActive) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                        <span style={{ fontSize: '1rem', opacity: childActive ? 1 : 0.7 }}>{n.icon}</span>
                                        {n.label}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                                </button>
                                
                                {isExpanded && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginLeft: '1.25rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
                                        {n.children.map(c => {
                                            const active = isActive(c.path);
                                            return (
                                                <Link
                                                    key={c.path}
                                                    to={c.path}
                                                    style={{
                                                        display: 'block', padding: '0.5rem 0.75rem', borderRadius: 8,
                                                        textDecoration: 'none', fontSize: '0.8rem', fontWeight: active ? 700 : 600,
                                                        color: active ? 'var(--peacock-green)' : 'var(--text-secondary)',
                                                        background: active ? 'var(--bg-mint)' : 'transparent',
                                                        transition: 'all 0.18s',
                                                    }}
                                                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                                                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                                                >
                                                    {c.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    const active = isActive(n.path);
                    return (
                        <Link
                            key={n.path}
                            to={n.path}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.65rem',
                                padding: '0.62rem 0.85rem', borderRadius: 10,
                                textDecoration: 'none', fontSize: '0.875rem', fontWeight: active ? 700 : 600,
                                color: active ? 'var(--peacock-green)' : 'var(--text-secondary)',
                                background: active ? 'var(--bg-mint)' : 'transparent',
                                borderLeft: `3px solid ${active ? 'var(--peacock-green)' : 'transparent'}`,
                                transition: 'all 0.18s',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                        >
                            <span style={{ fontSize: '1rem', opacity: active ? 1 : 0.7 }}>{n.icon}</span>
                            {n.label}
                        </Link>
                    );
                })}
            </div>

            {/* Bottom */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Link
                    to="/dashboard"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.55rem 0.85rem', borderRadius: 9,
                        textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600,
                        color: 'var(--text-muted)', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                    ← Back to App
                </Link>
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.55rem 0.85rem', borderRadius: 9, border: 'none',
                        background: 'rgba(239,68,68,0.06)', textAlign: 'left',
                        fontSize: '0.82rem', fontWeight: 600, color: '#EF4444',
                        cursor: 'pointer', transition: 'background 0.15s', width: '100%',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                >
                    🚪 Sign Out
                </button>
            </div>
        </>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', display: 'flex' }}>
            {/* Every /admin/* route requires admin login — never indexable. */}
            <SEO noindex />
            <style>{ANIMATIONS}</style>

            {/* Desktop sidebar */}
            <nav style={{
                width: 220, background: 'var(--bg-surface)',
                borderRight: '1px solid var(--border-color)',
                padding: '1.25rem 0.75rem',
                position: 'sticky', top: 0, height: '100vh',
                overflowY: 'auto', flexShrink: 0,
                display: 'flex', flexDirection: 'column',
            }} className="admin-sidebar">
                <SidebarContent />
            </nav>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 300 }}
                    onClick={() => setSidebarOpen(false)}
                >
                    <nav
                        style={{
                            width: 240, height: '100%', background: 'var(--bg-surface)',
                            borderRight: '1px solid var(--border-color)',
                            padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column',
                            overflowY: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <SidebarContent />
                    </nav>
                </div>
            )}

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top bar */}
                <header style={{
                    height: 58, background: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0,
                }}>
                    {/* Left: hamburger (mobile) + title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            onClick={() => setSidebarOpen(v => !v)}
                            style={{
                                background: 'none', border: '1px solid var(--border-color)',
                                borderRadius: 8, color: 'var(--text-muted)', width: 34, height: 34,
                                cursor: 'pointer', fontSize: '1.1rem',
                                display: 'none',
                            }}
                            className="admin-hamburger"
                            aria-label="Menu"
                        >
                            {sidebarOpen ? '✕' : '☰'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                background: 'var(--bg-mint)', border: '1px solid var(--border-mint)',
                                color: 'var(--peacock-green)', fontSize: '0.68rem', fontWeight: 800,
                                padding: '0.2rem 0.6rem', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.5px',
                            }}>Admin</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                {user?.email}
                            </span>
                        </div>
                    </div>

                    {/* Right: Actions + back to app */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <HeaderActions user={user} />
                        <Link
                            to="/dashboard"
                            style={{
                                textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600,
                                padding: '0.4rem 0.85rem', borderRadius: 8,
                                border: '1px solid var(--border-color)', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--peacock-green)'; e.currentTarget.style.color = 'var(--peacock-green)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                        >
                            ← App
                        </Link>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '1.75rem' }}>
                    {children}
                </main>
            </div>

            {/* Responsive */}
            <style>{`
                @media (max-width: 768px) {
                    .admin-sidebar { display: none !important; }
                    .admin-hamburger { display: flex !important; }
                }
            `}</style>
        </div>
    );
}
