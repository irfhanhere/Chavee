import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChaveeLogo } from '../Logo.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { motion, AnimatePresence } from 'framer-motion';

const EXPLORE_LINKS = [
    { label: 'Courses', path: '/learn?tab=courses', icon: '🎓' },
    { label: 'Scholarships', path: '/learn?tab=scholarships', icon: '💰' },
    { label: 'Communities', path: '/network', icon: '🌍' },
    { label: 'Blogs', path: '/blog', icon: '📝' },
    { label: 'Resources', path: '/resources', icon: '📂' },
];

export default function Navbar({ gamification }) {
    const { user, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [exploreOpen, setExploreOpen] = useState(false);
    
    const drawerRef = useRef(null);
    const dropdownRef = useRef(null);

    // Detect scroll to enhance navbar background
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile drawer on route change
    useEffect(() => { setMobileOpen(false); setExploreOpen(false); }, [location.pathname]);

    // Close drawer on outside click
    useEffect(() => {
        const handler = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) {
                setMobileOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setExploreOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const navBg = scrolled
        ? 'rgba(255, 255, 255, 0.95)'
        : 'rgba(248, 250, 252, 0.8)';

    const linkStyle = (active) => ({
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: 600,
        color: active ? '#0B8F5A' : '#111827',
        transition: 'all 0.2s ease',
        background: active ? '#EAFBF3' : 'transparent',
    });

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1000,
                    background: navBg,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid #E5E7EB',
                    boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.03)' : 'none',
                    transition: 'background 0.3s, box-shadow 0.3s',
                }}
            >
                <div style={{
                    maxWidth: 1280,
                    margin: '0 auto',
                    padding: '0 1.5rem',
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                }}>
                    {/* Logo */}
                    <Link to={user ? "/dashboard" : "/"} style={{ textDecoration: 'none', flexShrink: 0 }}>
                        <ChaveeLogo height={36} />
                    </Link>

                    {/* Center nav — desktop */}
                    <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                         className="hidden-mobile">
                        <Link to="/learn" style={linkStyle(isActive('/learn'))}
                            onMouseEnter={e => { if(!isActive('/learn')) e.currentTarget.style.color = '#0B8F5A'; }}
                            onMouseLeave={e => { if(!isActive('/learn')) e.currentTarget.style.color = '#111827'; }}>
                            Learn
                        </Link>
                        <Link to="/earn" style={linkStyle(isActive('/earn'))}
                            onMouseEnter={e => { if(!isActive('/earn')) e.currentTarget.style.color = '#0B8F5A'; }}
                            onMouseLeave={e => { if(!isActive('/earn')) e.currentTarget.style.color = '#111827'; }}>
                            Earn
                        </Link>
                        <Link to="/network" style={linkStyle(isActive('/network'))}
                            onMouseEnter={e => { if(!isActive('/network')) e.currentTarget.style.color = '#0B8F5A'; }}
                            onMouseLeave={e => { if(!isActive('/network')) e.currentTarget.style.color = '#111827'; }}>
                            Network
                        </Link>
                        <Link to="/events" style={linkStyle(isActive('/events'))}
                            onMouseEnter={e => { if(!isActive('/events')) e.currentTarget.style.color = '#0B8F5A'; }}
                            onMouseLeave={e => { if(!isActive('/events')) e.currentTarget.style.color = '#111827'; }}>
                            Events
                        </Link>
                        
                        {/* Explore Dropdown */}
                        <div ref={dropdownRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setExploreOpen(!exploreOpen)}
                                style={{
                                    ...linkStyle(exploreOpen),
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Explore
                                <motion.svg 
                                    animate={{ rotate: exploreOpen ? 180 : 0 }}
                                    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </motion.svg>
                            </button>

                            <AnimatePresence>
                                {exploreOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            marginTop: '0.5rem',
                                            background: '#FFFFFF',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '16px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
                                            width: '240px',
                                            padding: '0.75rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.25rem',
                                            zIndex: 1000
                                        }}
                                    >
                                        {EXPLORE_LINKS.map(link => (
                                            <Link
                                                key={link.path}
                                                to={link.path}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: '10px',
                                                    textDecoration: 'none',
                                                    color: '#111827',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = '#EAFBF3';
                                                    e.currentTarget.style.color = '#0B8F5A';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = '#111827';
                                                }}
                                                onClick={() => setExploreOpen(false)}
                                            >
                                                <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                                                {link.label}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </nav>

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>

                        {user ? (
                            <>
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    style={{
                                        width: 40, height: 40,
                                        borderRadius: '50%',
                                        background: '#0B8F5A',
                                        border: '2px solid #EAFBF3',
                                        color: '#fff',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {user.email[0].toUpperCase()}
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="hidden-mobile"
                                    style={{
                                        color: '#111827',
                                        textDecoration: 'none',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        padding: '0.5rem 0.5rem',
                                        transition: 'color 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#0B8F5A'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#111827'}
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/signup"
                                    style={{
                                        background: '#0B8F5A',
                                        padding: '0.6rem 1.25rem',
                                        fontSize: '0.95rem',
                                        borderRadius: '12px',
                                        textDecoration: 'none',
                                        color: '#fff',
                                        fontWeight: 700,
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 14px rgba(11, 143, 90, 0.25)',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(11, 143, 90, 0.3)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(11, 143, 90, 0.25)';
                                    }}
                                >
                                    Join Free
                                </Link>
                            </>
                        )}

                        {/* Hamburger — mobile */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle menu"
                            className="show-mobile"
                            style={{
                                background: 'transparent',
                                border: '1px solid #E5E7EB',
                                borderRadius: '10px',
                                color: '#111827',
                                width: 40,
                                height: 40,
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                            }}
                        >
                            {mobileOpen ? '✕' : '☰'}
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* ── Mobile drawer ── */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 998,
                            background: 'rgba(17, 24, 39, 0.2)',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <motion.div
                            ref={drawerRef}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'absolute',
                                top: 0, right: 0, bottom: 0,
                                width: '280px',
                                background: '#FFFFFF',
                                boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
                                padding: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem',
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    style={{
                                        background: '#F8FAFC',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: 36, height: 36,
                                        fontSize: '1.2rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            <Link to="/learn" style={linkStyle(isActive('/learn'))}>Learn</Link>
                            <Link to="/earn" style={linkStyle(isActive('/earn'))}>Earn</Link>
                            <Link to="/network" style={linkStyle(isActive('/network'))}>Network</Link>
                            <Link to="/events" style={linkStyle(isActive('/events'))}>Events</Link>
                            
                            <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0.5rem 0' }} />
                            
                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#6B7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Explore</h4>
                            {EXPLORE_LINKS.map(link => (
                                <Link key={link.path} to={link.path} style={{...linkStyle(false), display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                                    <span style={{fontSize:'1.2rem'}}>{link.icon}</span> {link.label}
                                </Link>
                            ))}
                            
                            <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '0.5rem 0' }} />
                            
                            {user ? (
                                <>
                                    <Link to="/dashboard" style={{ ...linkStyle(false), background: '#0B8F5A', color: '#fff', textAlign: 'center' }}>
                                        My Dashboard
                                    </Link>
                                    <button onClick={signOut} style={{ ...linkStyle(false), textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}>
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" style={{ ...linkStyle(false), textAlign: 'center', background: '#F8FAFC' }}>
                                        Log In
                                    </Link>
                                    <Link to="/signup" style={{ ...linkStyle(false), background: '#0B8F5A', color: '#fff', textAlign: 'center' }}>
                                        Join Free
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                @media (max-width: 768px) {
                    .hidden-mobile { display: none !important; }
                    .show-mobile { display: flex !important; }
                }
                @media (min-width: 769px) {
                    .show-mobile { display: none !important; }
                }
            `}</style>
        </>
    );
}
