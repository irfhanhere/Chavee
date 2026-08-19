import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { ChaveeLogo } from '../Logo.jsx';
import { PageLoader } from './Spinner.jsx';
import HeaderActions from './HeaderActions.jsx';
import SEO from './SEO.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const TIER_NAMES  = { 4: 'Platinum', 3: 'Gold', 2: 'Silver', 1: 'Bronze' };
const TIER_COLORS = { 4: '#818CF8', 3: '#F59E0B', 2: '#94A3B8', 1: '#D97706' };

const NAV_LINKS = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/education', icon: '📚', label: 'Education' },
    { path: '/earn', icon: '💸', label: 'Earn' },
    { path: '/network', icon: '🤝', label: 'Network' },
    { path: '/events', icon: '🎪', label: 'Events' }
];

const renderAvatar = (avatarData, name, size = 34, fontSize = '0.9rem') => {
    // Real uploaded photo URL (e.g. Supabase Storage public URL) — not the JSON avatar-builder shape.
    if (typeof avatarData === 'string' && avatarData.startsWith('http')) {
        return (
            <img
                src={avatarData}
                alt="Avatar"
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    boxShadow: 'var(--shadow-sm)',
                    border: '2px solid var(--border-mint)',
                    flexShrink: 0,
                    userSelect: 'none',
                    cursor: 'pointer'
                }}
            />
        );
    }

    let base = '?';
    let accessory = '';
    let bg = 'var(--peacock-green)';

    if (avatarData) {
        try {
            const parsed = typeof avatarData === 'string' ? JSON.parse(avatarData) : avatarData;
            base = parsed.base || parsed.avatar || '?';
            accessory = parsed.accessory || '';
            bg = parsed.bg || bg;
        } catch {
            base = avatarData[0]?.toUpperCase() || '?';
        }
    } else {
        base = name?.[0]?.toUpperCase() || '?';
    }

    const bgStyle = bg.startsWith('linear-gradient') ? bg : (
        bg === 'gold' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' :
        bg === 'purple' ? 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)' :
        bg === 'pink' ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' :
        bg === 'slate' ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' :
        'linear-gradient(135deg, #115E59 0%, #059669 100%)' // mint
    );

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            background: bgStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSize,
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            border: '2px solid var(--border-mint)',
            flexShrink: 0,
            userSelect: 'none',
            cursor: 'pointer'
        }}>
            <span>{base}</span>
            {accessory && (
                <span style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    fontSize: `calc(${fontSize} * 0.7)`,
                    background: 'var(--bg-surface)',
                    borderRadius: '50%',
                    padding: '0.05rem',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)',
                    width: `calc(${fontSize} * 1.15)`,
                    height: `calc(${fontSize} * 1.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {accessory}
                </span>
            )}
        </div>
    );
};

export default function AppShell({ children }) {
    const navigate  = useNavigate();
    const location  = useLocation();

    const [user, setUser]               = useState(null);
    const [gamification, setGamification] = useState(null);
    const [profile, setProfile]         = useState(null);
    const [checking, setChecking]       = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false); // mobile
    const [isAdmin, setIsAdmin]         = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    
    // Avatar Dropdown State
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Auth guard + gamification + profile load ───────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) { 
                if (sessionStorage.getItem('previewMode') === 'true') {
                    setPreviewMode(true);
                    setChecking(false);
                    return;
                }
                navigate('/login'); 
                return; 
            }
            setUser(session.user);

            // Load gamification & profile from localStorage first (instant)
            const local = localStorage.getItem(`gamification_${session.user.id}`);
            if (local) setGamification(JSON.parse(local));

            const localProfile = localStorage.getItem(`profile_${session.user.id}`);
            if (localProfile) setProfile(JSON.parse(localProfile));

            // Sync gamification
            supabase
                .from('user_gamification')
                .select('*')
                .eq('user_id', session.user.id)
                .single()
                .then(({ data }) => { if (data) { setGamification(data); localStorage.setItem(`gamification_${session.user.id}`, JSON.stringify(data)); } })
                .catch(() => {});

            // Sync profile
            supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
                .then(({ data }) => { if (data) { setProfile(data); localStorage.setItem(`profile_${session.user.id}`, JSON.stringify(data)); } })
                .catch(() => {})
                .finally(() => setChecking(false));

            // Check admin status via RPC
            supabase
                .rpc('is_admin')
                .then(({ data }) => { setIsAdmin(!!data); })
                .catch(() => {});
        }).catch(() => navigate('/login'));
    }, [navigate]);

    // Keep profile state updated on route changes (in case customized)
    useEffect(() => {
        if (user) {
            const localProfile = localStorage.getItem(`profile_${user.id}`);
            if (localProfile) setProfile(JSON.parse(localProfile));
        }
    }, [user, location.pathname]);

    // Bridge: pick up profile field updates (e.g. avatar/banner upload) fired
    // from other components (AccountTab.jsx) without a full profile refetch.
    useEffect(() => {
        const handleProfileUpdated = (e) => {
            setProfile(prev => {
                const next = { ...prev, ...e.detail };
                if (user) localStorage.setItem(`profile_${user.id}`, JSON.stringify(next));
                return next;
            });
        };
        window.addEventListener('profile-updated', handleProfileUpdated);
        return () => window.removeEventListener('profile-updated', handleProfileUpdated);
    }, [user]);

    // Close sidebar on route change (mobile)
    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    // Clear preview mode if navigating to landing page
    useEffect(() => {
        if (location.pathname === '/') {
            sessionStorage.removeItem('previewMode');
            setPreviewMode(false);
        }
    }, [location.pathname]);

    // Intercept clicks in preview mode
    useEffect(() => {
        if (!previewMode) return;
        const handler = (e) => {
            const target = e.target.closest('button, input, textarea, form, [contenteditable="true"]');
            // Allow navigation links and specific allowed buttons
            if (target && !target.classList.contains('allow-preview') && !target.closest('.allow-preview')) {
                e.preventDefault();
                e.stopPropagation();
                setShowPreviewModal(true);
            }
        };
        // Use capture phase to intercept before React synthetic events
        document.addEventListener('click', handler, true);
        return () => document.removeEventListener('click', handler, true);
    }, [previewMode]);

    if (checking && !user && !previewMode) return <PageLoader message="Loading Chavee... 🔒" />;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/events') return location.pathname.startsWith('/events');
        return location.pathname === path;
    };

    // Bottom tab bar's own active check — '/' redirects logged-in users to
    // '/dashboard' (Landing.jsx's own useEffect), so by the time anyone is
    // inside AppShell the real pathname is always '/dashboard', never '/'.
    // isActive('/') above would never match there; Home needs to treat both
    // as the same tab. Kept separate from isActive rather than changing it,
    // since isActive also drives the untouched desktop sidebar.
    const isBottomNavActive = (path) => {
        if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
        if (path === '/events') return location.pathname.startsWith('/events');
        return location.pathname === path;
    };

    /* ── Styles ─────────────────────────────────────────────────── */
    const S = {
        layout: {
            minHeight: '100vh',
            background: 'var(--bg-base)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
        },
        header: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border-color)',
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 200,
            flexShrink: 0,
        },
        body: { display: 'flex', flex: 1, minHeight: 0 },
        sidebar: {
            width: 280,
            background: 'var(--bg-elevated)',
            borderRight: '1px solid var(--border-color)',
            padding: '1.5rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            position: 'sticky',
            top: 80,
            height: 'calc(100vh - 80px)',
            overflowY: 'auto',
            flexShrink: 0,
        },
        main: {
            flex: 1,
            overflowY: 'auto',
            minWidth: 0,
        },
        navHeading: {
            fontSize: '0.68rem',
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            padding: '0 0.5rem',
            marginBottom: '0.2rem',
        },
        sideLink: (active) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: 12,
            border: 'none',
            textAlign: 'left',
            fontSize: '0.92rem',
            fontWeight: active ? 700 : 600,
            cursor: 'pointer',
            transition: 'all 0.18s',
            textDecoration: 'none',
            background: active ? 'var(--bg-mint)' : 'transparent',
            color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
            borderLeft: 'none',
        }),
        divider: {
            border: 'none',
            borderTop: '1px solid rgba(148,163,184,0.08)',
            margin: '0.6rem 0',
        },
        pill: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            padding: '0.25rem 0.8rem',
            background: 'var(--bg-mint)',
            border: '1px solid var(--border-mint)',
            borderRadius: 10,
            cursor: 'default',
        },
        avatar: {
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--peacock-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: '#fff',
            fontSize: '0.9rem',
            cursor: 'pointer',
            border: '2px solid var(--border-mint)',
            transition: 'all 0.2s',
            flexShrink: 0,
        },
        logoutBtn: {
            background: 'none',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8,
            color: '#F87171',
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
        },
        hamburger: {
            background: 'none',
            border: '1px solid rgba(148,163,184,0.25)',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            width: 36,
            height: 36,
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.2rem',
            flexShrink: 0,
        },
    };

    const tierColor = gamification ? (TIER_COLORS[gamification.level] || '#D97706') : '#D97706';
    const tierName  = gamification ? (TIER_NAMES[gamification.level]  || 'Bronze')  : 'Bronze';

    // hidePrimary: the mobile drawer no longer needs to duplicate the 5
    // primary links now that they live in the persistent bottom tab bar —
    // desktop sidebar keeps them (hidePrimary defaults false there).
    const SidebarNav = ({ hidePrimary = false }) => (
        <>
            {!hidePrimary && NAV_LINKS.map(l => (
                <Link
                    key={l.path}
                    to={l.path}
                    style={S.sideLink(isActive(l.path))}
                    onMouseEnter={e => { if (!isActive(l.path)) e.currentTarget.style.background = 'var(--bg-surface)'; }}
                    onMouseLeave={e => { if (!isActive(l.path)) e.currentTarget.style.background = 'transparent'; }}
                >
                    <span style={{ fontSize: '1rem' }}>{l.icon}</span>
                    {l.label}
                </Link>
            ))}

            {/* Admin panel link — only visible to admins */}
            {isAdmin && (
                <>
                    <hr style={S.divider} />
                    <p style={S.navHeading}>Admin</p>
                    <Link
                        to="/admin"
                        style={{
                            ...S.sideLink(location.pathname.startsWith('/admin')),
                            background: location.pathname.startsWith('/admin') ? 'rgba(17,94,89,0.1)' : 'transparent',
                            color: location.pathname.startsWith('/admin') ? 'var(--peacock-green)' : 'var(--text-muted)',
                        }}
                        onMouseEnter={e => { if (!location.pathname.startsWith('/admin')) e.currentTarget.style.background = 'var(--bg-surface)'; }}
                        onMouseLeave={e => { if (!location.pathname.startsWith('/admin')) e.currentTarget.style.background = 'transparent'; }}
                    >
                        <span style={{ fontSize: '1rem' }}>🛡️</span>
                        Admin Panel
                    </Link>
                </>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--bg-mint) 0%, rgba(17,94,89,0.05) 100%)', padding: '1.25rem', borderRadius: 16, border: '1px solid var(--border-mint)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--peacock-green)', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>Build your future with Chavee</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                        Learn new skills, find jobs, and network with peers.
                    </p>
                    <Link to="/education" style={{ display: 'block', textAlign: 'center', background: 'var(--peacock-green)', color: '#fff', textDecoration: 'none', padding: '0.6rem', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.9} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                        Explore Now
                    </Link>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', padding: '1rem 0.5rem 0', fontSize: '0.75rem', color: 'var(--text-muted)', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <span>© {new Date().getFullYear()} Chavee</span>
                    <Link to="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</Link>
                    <Link to="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</Link>
                </div>
            </div>
        </>
    );


    return (
        <div style={S.layout}>
            {/* Every route rendered through AppShell requires login — never
                indexable, so this one tag covers all of them without
                needing a <SEO noindex/> in each individual page file. */}
            <SEO noindex />

            {/* ── Header ── */}
            <header className="app-header" style={S.header}>
                {/* Left side: Avatar (dropdown trigger) + Logo — matches the reference
                    header order (avatar leftmost, then logo) shown consistently across
                    every reference screenshot. Avatar simplified to icon-only at every
                    width — no reference screenshot shows name/role text or a chevron
                    next to it, and this also removes the previous desktop-vs-mobile
                    inconsistency (name+chevron used to be hidden-mobile only). */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {!previewMode ? (
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <div onClick={() => setShowDropdown(!showDropdown)} title="Account" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0.15rem', borderRadius: '50%', transition: 'background 0.2s', background: showDropdown ? 'var(--bg-elevated)' : 'transparent' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => { if (!showDropdown) e.currentTarget.style.background = 'transparent'; }}>
                                {renderAvatar(profile?.avatar_url, profile?.name || user?.email, 36, '0.9rem')}
                            </div>

                            <AnimatePresence>
                                {showDropdown && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15, ease: 'easeOut' }}
                                        style={{
                                            position: 'absolute',
                                            top: 'calc(100% + 0.5rem)',
                                            /* Anchored left, not right — the trigger now lives at the far
                                               left of the header, so a right-anchored panel would extend
                                               off-screen to the left. Opening rightward keeps it on-screen. */
                                            left: 0,
                                            width: 240,
                                            background: 'var(--bg-surface)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: 16,
                                            boxShadow: 'var(--shadow-lg)',
                                            padding: '0.5rem',
                                            zIndex: 1000,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem'
                                        }}
                                    >
                                        <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {profile?.name || user?.email?.split('@')[0] || 'User'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {user?.email}
                                            </div>
                                        </div>

                                        <Link to="/profile" onClick={() => setShowDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.1rem' }}>👤</span> Profile
                                        </Link>
                                        <Link to="/saved" onClick={() => setShowDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.1rem' }}>🔖</span> Saved Items
                                        </Link>
                                        <Link to="/earnings" onClick={() => setShowDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.1rem' }}>💰</span> Earnings
                                        </Link>
                                        <Link to="/notifications" onClick={() => setShowDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.1rem' }}>🔔</span> Notifications
                                        </Link>
                                        <Link to="/profile/edit" onClick={() => setShowDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.1rem' }}>⚙️</span> Settings
                                        </Link>
                                        <Link to="/help" onClick={() => setShowDropdown(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', textDecoration: 'none', color: 'var(--text-primary)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-base)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.1rem' }}>❓</span> Help &amp; Support
                                        </Link>

                                        <div style={{ height: 1, background: 'var(--border-color)', margin: '0.25rem 0' }} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', color: 'var(--text-muted)', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'not-allowed', opacity: 0.7 }}>
                                            <span style={{ fontSize: '1.1rem' }}>🔁</span> Switch Account <span style={{ marginLeft: 'auto', fontSize: '0.65rem', background: 'var(--bg-elevated)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>Soon</span>
                                        </div>

                                        <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', color: '#EF4444', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <span style={{ fontSize: '1.1rem' }}>🚪</span> Log Out
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            style={{...S.logoutBtn, border: '1px solid var(--peacock-green)', color: 'var(--peacock-green)', textDecoration: 'none'}}
                            className="hidden-mobile allow-preview"
                        >
                            Log In
                        </Link>
                    )}

                    <Link to="/dashboard" style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <span className="hidden-mobile" style={{ display: 'inline-flex' }}>
                            <ChaveeLogo height={34} />
                        </span>
                        <span className="show-mobile" style={{ display: 'none', alignItems: 'center' }}>
                            <ChaveeLogo height={36} iconOnly />
                        </span>
                    </Link>
                </div>

                {/* Right side: Search + Messages + Notifications (all inside HeaderActions,
                    width-agnostic — same component renders identically at every
                    breakpoint) + Hamburger (mobile only, unrelated to the reference
                    pattern — holds Admin Panel/Explore/Log Out, kept as-is). The old
                    decorative desktop-only search <input> is gone — replaced by the
                    real search icon inside HeaderActions. */}
                <div className="header-right-group" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <HeaderActions user={user} />

                    {/* Hamburger — mobile */}
                    <button
                        onClick={() => setSidebarOpen(v => !v)}
                        style={S.hamburger}
                        className="show-mobile allow-preview"
                        aria-label="Toggle menu"
                    >
                        {sidebarOpen ? '✕' : '☰'}
                    </button>
                </div>
            </header>

            {/* ── Body ── */}
            <div style={S.body}>
                {/* Desktop sidebar */}
                <nav style={{ ...S.sidebar, display: 'flex' }} className="shell-sidebar">
                    <SidebarNav />
                </nav>

                {/* Mobile overlay sidebar */}
                {sidebarOpen && (
                    <div
                        style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', zIndex: 190 }}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <nav
                            style={{
                                width: 240,
                                height: '100%',
                                background: 'var(--bg-surface)',
                                borderRight: '1px solid var(--border-color)',
                                padding: '1.25rem 0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.25rem',
                                overflowY: 'auto',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <SidebarNav hidePrimary />
                            <hr style={{ ...S.divider, marginTop: '0.5rem' }} />
                            <button
                                onClick={handleLogout}
                                style={{ ...S.logoutBtn, textAlign: 'left', padding: '0.6rem 0.85rem', width: '100%' }}
                                className="allow-preview"
                            >
                                Log Out
                            </button>
                        </nav>
                    </div>
                )}

                {/* Main content */}
                <main style={S.main} className="app-main-content">
                    {children}
                </main>
            </div>

            {/* Persistent mobile bottom tab bar — the 5 primary NAV_LINKS, same
                routes as the desktop sidebar. Desktop untouched: hidden ≥769px
                via CSS below, same breakpoint as the rest of this file's
                responsive rules. */}
            <nav className="mobile-bottom-nav" aria-label="Primary">
                {NAV_LINKS.map(l => (
                    <Link
                        key={l.path}
                        to={l.path === '/' ? '/dashboard' : l.path}
                        className={`mobile-bottom-nav-item${isBottomNavActive(l.path) ? ' active' : ''}`}
                    >
                        <span className="mobile-bottom-nav-icon">{l.icon}</span>
                        <span>{l.label}</span>
                    </Link>
                ))}
            </nav>

            {/* Preview Modal */}
            <AnimatePresence>
                {showPreviewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(15,23,42,0.6)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                        }}
                        onClick={() => setShowPreviewModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                background: 'var(--bg-surface)',
                                padding: '2.5rem 2rem',
                                borderRadius: '24px',
                                maxWidth: '400px',
                                width: '100%',
                                textAlign: 'center',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                            }}
                        >
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                                Join Chavee to unlock all features
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.95rem' }}>
                                You're in preview mode. Create a free account to post, join communities, apply for gigs, and send messages.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <Link to="/signup" className="allow-preview" style={{ background: 'var(--peacock-green)', color: '#fff', padding: '0.8rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, transition: 'all 0.2s' }}>
                                    Create Free Account
                                </Link>
                                <Link to="/login" className="allow-preview" style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.8rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700 }}>
                                    Log In
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Responsive helpers */}
            <style>{`
                @media (max-width: 768px) {
                    .hidden-mobile { display: none !important; }
                    .show-mobile   { display: flex !important; }
                    .shell-sidebar { display: none !important; }
                }
                @media (min-width: 769px) {
                    .show-mobile { display: none !important; }
                }

                /* Header padding/gap — fixed values ate too much of the row's
                   available width at narrow viewports, pushing the hamburger
                   button past the edge where the global overflow-x: hidden
                   rule (index.css) clipped it. Reduced below 480px. */
                .app-header { padding: 0 2rem; }
                .header-right-group { gap: 1rem; }
                @media (max-width: 480px) {
                    .app-header { padding: 0 1rem; }
                    .header-right-group { gap: 0.5rem; }
                }

                /* Persistent mobile bottom tab bar — hidden entirely ≥769px so
                   desktop is untouched (same breakpoint as .shell-sidebar above). */
                .mobile-bottom-nav { display: none; }
                @media (max-width: 768px) {
                    .mobile-bottom-nav {
                        display: flex;
                        position: fixed;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 150; /* above page content, below the drawer overlay (190) and header (200) */
                        background: var(--bg-surface);
                        border-top: 1px solid var(--border-color);
                        box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
                        padding: 0.35rem 0.25rem calc(0.35rem + env(safe-area-inset-bottom, 0px));
                    }
                }
                .mobile-bottom-nav-item {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    padding: 0.3rem 0.1rem;
                    text-decoration: none;
                    color: var(--text-muted);
                    font-size: 0.65rem;
                    font-weight: 600;
                    line-height: 1.1;
                    text-align: center;
                }
                .mobile-bottom-nav-item.active {
                    color: var(--peacock-green);
                    font-weight: 800;
                }
                .mobile-bottom-nav-icon { font-size: 1.3rem; line-height: 1; }

                /* Room for the fixed bottom bar so it never clips the end of
                   scrollable page content. Bar's own real height varies slightly
                   by device (icon+label+padding+safe-area), so this is a bit more
                   generous than the bar's typical ~60px to comfortably clear it. */
                @media (max-width: 768px) {
                    .app-main-content { padding-bottom: calc(76px + env(safe-area-inset-bottom, 0px)); }
                }
            `}</style>
        </div>
    );
}
