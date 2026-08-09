import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient.js';
import { ChaveeLogo } from './Logo.jsx';

// Premium pre-populated events list representing workshops, workations, staycations, hackathons, debates, etc.
const DEFAULT_EVENTS = [
    {
        id: 'event-1',
        title: 'Developer Workation Goa 🌊',
        type: 'Workation',
        description: 'Spend 4 days cowriting and hacking with 30 premium developers on the shores of Goa. Includes 1-on-1 career mentorship.',
        price: 4999,
        date: 'July 25-28, 2026',
        speaker: 'Aditya Sen (SDE-3 at Google)',
        location: 'Goa Coworking Hub'
    },
    {
        id: 'event-2',
        title: 'Mastering AI & Prompt Engineering 🤖',
        type: 'Workshop',
        description: 'An immersive hands-on technical workshop. Learn to build context-aware chatbots using Gemini Pro and React.',
        price: 0,
        date: 'July 18, 2026',
        speaker: 'Neha Sharma (AI Architect)',
        location: 'Chavee Zoom Link'
    },
    {
        id: 'event-3',
        title: 'Global Remote Freelancing Roadmap 💼',
        type: 'Webinar',
        description: 'Discover secrets to landing high-paying contract gigs while in college. Get pre-vetted resume templates and portfolio audits.',
        price: 0,
        date: 'July 20, 2026',
        speaker: 'Rohan Gupta (Top-Rated Freelancer)',
        location: 'Chavee Webinar Platform'
    },
    {
        id: 'event-4',
        title: 'Chavee 36-Hour National Hackathon 🏆',
        type: 'Hackathon',
        description: 'Pitch, build, and deploy an application using any modern framework. Generous cash prizes, swag, and VC network access.',
        price: 0,
        date: 'August 05-07, 2026',
        speaker: 'Chavee Tech Jury',
        location: 'IIT Madras Research Park'
    },
    {
        id: 'event-5',
        title: 'Product Management Staycation 🏨',
        type: 'Staycation',
        description: 'A 2-day immersive retreat discussing metrics, wireframes, agile roadmaps, and UX wireframes with industry leaders.',
        price: 2499,
        date: 'August 12-14, 2026',
        speaker: 'Suresh Kumar (Director of PM at Flipkart)',
        location: 'Radisson Blu, Bangalore'
    },
    {
        id: 'event-6',
        title: 'The Future of AI in Education Debate 🎤',
        type: 'Debate',
        description: 'Campus clash of thoughts! Join academic pioneers and technology leaders to debate skills vs. degrees and AI replacing tutors.',
        price: 0,
        date: 'July 23, 2026',
        speaker: 'Prof. Amrit Pal & Panel',
        location: 'Seminar Hall 3, Delhi'
    }
];

// Prepopulated campus leaderboard data
const DEFAULT_LEADERBOARD = [
    { name: 'Aarav Sharma', college: 'IIT Madras', points: 850, level: 'Platinum 🏆' },
    { name: 'Priya Patel', college: 'BITS Pilani', points: 720, level: 'Gold 🥇' },
    { name: 'Vikram Singh', college: 'Delhi University', points: 580, level: 'Gold 🥇' },
    { name: 'Sneha Reddy', college: 'RVCE Bangalore', points: 380, level: 'Silver 🥈' },
    { name: 'Tanmay Mehta', college: 'IIT Bombay', points: 290, level: 'Silver 🥈' }
];

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home'); // 'home', 'events', 'profile'
    
    // Core data states
    const [profile, setProfile] = useState(null);
    const [gamification, setGamification] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    
    // Loading spinners states
    const [profileLoading, setProfileLoading] = useState(false);
    const [gamificationLoading, setGamificationLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [registeringEventId, setRegisteringEventId] = useState(null);
    
    // Onboarding popup states
    const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);
    const [college, setCollege] = useState('');
    const [dob, setDob] = useState('');
    const [interests, setInterests] = useState([]);
    const [motive, setMotive] = useState('');
    
    // UI state
    const [eventCategory, setEventCategory] = useState('All');
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Toast manager
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    // Protect router & check authentication session
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) {
                    window.location.href = "/login";
                } else {
                    setUser(session.user);
                    setSessionLoading(false);
                }
            } catch (err) {
                window.location.href = "/login";
            }
        };
        checkSession();
    }, []);

    // Fetch user profile, gamification, and registrations when user session is loaded
    useEffect(() => {
        if (!user) return;
        
        const loadUserData = async () => {
            await fetchProfile();
            await fetchGamification();
            await fetchRegistrations();
        };
        
        loadUserData();
    }, [user]);

    // Onboarding popup timer: triggers after 1.5 seconds on the HOME tab if onboarding is incomplete
    useEffect(() => {
        if (!profile || profile.onboarding_completed) return;
        if (activeTab !== 'home') return;
        
        const timer = setTimeout(() => {
            // Check if user has already dismissed or completed this session
            const dismissed = sessionStorage.getItem(`onboarding_dismissed_${user.id}`);
            if (!dismissed) {
                // Prefill existing fields if any
                setCollege(profile.college || '');
                setDob(profile.dob || '');
                setInterests(profile.interests || []);
                setMotive(profile.motive || '');
                setShowOnboardingPopup(true);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [profile, activeTab]);

    // Fetch Profile API
    const fetchProfile = async () => {
        if (!user) return;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            
            if (error) throw error;
            if (data) {
                setProfile(data);
            }
        } catch (err) {
            console.warn('Supabase profile not found or table missing. Using local fallback:', err.message);
            const local = localStorage.getItem(`profile_${user.id}`);
            if (local) {
                setProfile(JSON.parse(local));
            } else {
                const defaultProfile = {
                    id: user.id,
                    name: user.email.split('@')[0],
                    bio: 'Tech enthusiast and student ready to explore opportunities!',
                    skills: 'React, JavaScript, CSS',
                    resume_link: '',
                    college: '',
                    dob: '',
                    interests: [],
                    motive: '',
                    onboarding_completed: false
                };
                setProfile(defaultProfile);
                localStorage.setItem(`profile_${user.id}`, JSON.stringify(defaultProfile));
            }
        } finally {
            setProfileLoading(false);
        }
    };

    // Fetch Gamification XP API
    const fetchGamification = async () => {
        if (!user) return;
        setGamificationLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_gamification')
                .select('*')
                .eq('user_id', user.id)
                .single();
            
            if (error) throw error;
            if (data) {
                setGamification(data);
            }
        } catch (err) {
            console.warn('Supabase user_gamification read error or table missing. Using local fallback:', err.message);
            const local = localStorage.getItem(`gamification_${user.id}`);
            if (local) {
                setGamification(JSON.parse(local));
            } else {
                const defaultGamification = {
                    user_id: user.id,
                    points: 50, // Welcome points
                    level: 1, // Tier 1: Bronze
                    badges: ['Onboarding Explorer']
                };
                setGamification(defaultGamification);
                localStorage.setItem(`gamification_${user.id}`, JSON.stringify(defaultGamification));
            }
        } finally {
            setGamificationLoading(false);
        }
    };

    // Fetch Registered Events API
    const fetchRegistrations = async () => {
        if (!user) return;
        setEventsLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_events')
                .select('event_id')
                .eq('user_id', user.id);
            
            if (error) throw error;
            if (data) {
                setRegistrations(data.map(item => item.event_id));
            }
        } catch (err) {
            console.warn('Supabase user_events read error or table missing. Using local fallback:', err.message);
            const local = localStorage.getItem(`registrations_${user.id}`);
            if (local) {
                setRegistrations(JSON.parse(local));
            } else {
                setRegistrations([]);
            }
        } finally {
            setEventsLoading(false);
        }
    };

    // Reward XP & Level Progression Engine
    const rewardPoints = async (amount, newBadge = null) => {
        if (!user || !gamification) return;
        
        const updated = { ...gamification };
        updated.points += amount;
        
        // Progression Tier definitions
        // Bronze: 0 - 100 XP
        // Silver: 101 - 300 XP
        // Gold: 301 - 600 XP
        // Platinum: 601+ XP
        if (updated.points >= 600) {
            updated.level = 4; // Platinum
        } else if (updated.points >= 300) {
            updated.level = 3; // Gold
        } else if (updated.points >= 100) {
            updated.level = 2; // Silver
        } else {
            updated.level = 1; // Bronze
        }

        if (newBadge && !updated.badges.includes(newBadge)) {
            updated.badges.push(newBadge);
        }

        setGamification(updated);
        localStorage.setItem(`gamification_${user.id}`, JSON.stringify(updated));

        try {
            await supabase
                .from('user_gamification')
                .upsert(updated);
            showToast(`🎉 Awarded +${amount} XP! ${newBadge ? `Unlocked "${newBadge}" Badge!` : ''}`);
        } catch (err) {
            console.warn('Supabase gamification save error. Saved locally.');
            showToast(`🎉 Awarded +${amount} XP! (Offline Mode)`, 'success');
        }
    };

    // Register for Event API
    const handleRegisterEvent = async (eventId) => {
        if (!user) return;
        setRegisteringEventId(eventId);
        
        try {
            // Emulate networking buffer to show loading spinner properly
            await new Promise(resolve => setTimeout(resolve, 800));

            const updatedRegs = [...registrations, eventId];
            setRegistrations(updatedRegs);
            localStorage.setItem(`registrations_${user.id}`, JSON.stringify(updatedRegs));

            try {
                const { error } = await supabase
                    .from('user_events')
                    .insert({
                        user_id: user.id,
                        event_id: eventId,
                        registered_at: new Date().toISOString()
                    });
                if (error) throw error;
            } catch (dbErr) {
                console.warn('Supabase user_events save error, saved locally:', dbErr.message);
            }

            // Gamification payout
            const milestoneBadge = updatedRegs.length >= 3 ? 'Seminar Star' : 'Event Enroller';
            await rewardPoints(100, milestoneBadge);

        } catch (err) {
            showToast('Registration failed. Please try again.', 'error');
        } finally {
            setRegisteringEventId(null);
        }
    };

    // Save Student Profile API
    const handleSaveProfile = async (e, customData = null) => {
        if (e) e.preventDefault();
        if (!user || !profile) return;
        
        setProfileLoading(true);
        const dataToSave = customData || profile;

        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...dataToSave,
                    updated_at: new Date().toISOString()
                });
            if (error) throw error;
            
            setProfile(dataToSave);
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToSave));
            showToast('Profile updated successfully! 👤');

            // Award points for completing profile if not awarded already
            if (dataToSave.bio && dataToSave.skills && !gamification?.badges?.includes('Profile Pioneer')) {
                await rewardPoints(150, 'Profile Pioneer');
            }
        } catch (err) {
            console.warn('Supabase profile save error, saved locally:', err.message);
            setProfile(dataToSave);
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToSave));
            showToast('Profile updated locally (offline mode)! 👤');

            // Offline gamification payout
            if (dataToSave.bio && dataToSave.skills && !gamification?.badges?.includes('Profile Pioneer')) {
                await rewardPoints(150, 'Profile Pioneer');
            }
        } finally {
            setProfileLoading(false);
        }
    };

    // Save Onboarding details Popup
    const handleSaveOnboarding = async () => {
        if (!user || !profile) return;
        
        const updated = {
            ...profile,
            college,
            dob,
            interests,
            motive,
            onboarding_completed: true
        };

        setProfileLoading(true);
        setShowOnboardingPopup(false);

        try {
            await handleSaveProfile(null, updated);
            // Award completion points
            await rewardPoints(50, 'Onboarding Achiever');
        } catch (err) {
            console.error(err);
        } finally {
            setProfileLoading(false);
        }
    };

    // Fill Onboarding details later
    const handleDismissOnboarding = () => {
        setShowOnboardingPopup(false);
        sessionStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
        showToast('Onboarding snoozed. You can fill details later via the Profile page! 🧭', 'info');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = "/login";
    };

    // Determine levels & progress bar styling
    const getLevelDetails = () => {
        const pts = gamification ? gamification.points : 50;
        if (pts >= 600) {
            return { tier: 'Platinum', icon: '🏆', color: '#1E3A8A', nextMilestone: 'Max Tier Unlocked!', progress: 100 };
        } else if (pts >= 300) {
            const nextXp = 600 - pts;
            const progress = ((pts - 300) / 300) * 100;
            return { tier: 'Gold', icon: '🥇', color: '#D97706', nextMilestone: `${nextXp} XP to Platinum`, progress };
        } else if (pts >= 100) {
            const nextXp = 300 - pts;
            const progress = ((pts - 100) / 200) * 100;
            return { tier: 'Silver', icon: '🥈', color: '#4B5563', nextMilestone: `${nextXp} XP to Gold`, progress };
        } else {
            const nextXp = 100 - pts;
            const progress = (pts / 100) * 100;
            return { tier: 'Bronze', icon: '🥉', color: '#78350F', nextMilestone: `${nextXp} XP to Silver`, progress };
        }
    };

    if (sessionLoading) {
        return (
            <div style={styles.loadingScreen}>
                <div style={styles.spinnerContainer}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Initializing student session... 🔒</p>
                </div>
            </div>
        );
    }

    const { tier, icon: tierIcon, color: tierColor, nextMilestone, progress: tierProgress } = getLevelDetails();

    return (
        <div style={styles.layout}>
            {/* Top Navigation Bar */}
            <header style={styles.header}>
                <ChaveeLogo height={32} />
                <div style={styles.topRight}>
                    {gamification && (
                        <div style={{ ...styles.pointsPill, color: tierColor }}>
                            <span>{tierIcon} {gamification.points} XP</span>
                            <span style={styles.miniTierLabel}>{tier}</span>
                        </div>
                    )}
                    <div style={styles.avatarPill} onClick={() => setActiveTab('profile')}>
                        <div style={styles.avatarLetter}>
                            {user.email.substring(0, 1).toUpperCase()}
                        </div>
                        <span style={styles.avatarEmail}>{user.email.split('@')[0]}</span>
                    </div>
                    <button onClick={handleLogout} style={styles.logoutButton}>
                        Log Out
                    </button>
                </div>
            </header>

            {/* Profile Incompletion Banner */}
            {profile && !profile.onboarding_completed && activeTab === 'home' && (
                <div style={styles.warningBanner}>
                    <div style={styles.warningContent}>
                        <span>🧭 <strong>Incomplete Profile:</strong> Complete your quick campus onboarding details to unlock Silver tier and earn <strong>+50 XP</strong> bonus points!</span>
                    </div>
                    <button 
                        onClick={() => {
                            setCollege(profile.college || '');
                            setDob(profile.dob || '');
                            setInterests(profile.interests || []);
                            setMotive(profile.motive || '');
                            setShowOnboardingPopup(true);
                        }} 
                        style={styles.bannerActionButton}
                    >
                        Complete Now
                    </button>
                </div>
            )}

            <div style={styles.container}>
                {/* Main Tab Switcher Side Rail */}
                <nav style={styles.sidebar}>
                    <button 
                        style={activeTab === 'home' ? styles.sidebarButtonActive : styles.sidebarButton} 
                        onClick={() => setActiveTab('home')}
                    >
                        <span style={styles.navIcon}>🏠</span> Home Dashboard
                    </button>
                    <button 
                        style={activeTab === 'events' ? styles.sidebarButtonActive : styles.sidebarButton} 
                        onClick={() => setActiveTab('events')}
                    >
                        <span style={styles.navIcon}>📅</span> Events Explorer
                    </button>
                    <button 
                        style={activeTab === 'profile' ? styles.sidebarButtonActive : styles.sidebarButton} 
                        onClick={() => setActiveTab('profile')}
                    >
                        <span style={styles.navIcon}>👤</span> Student Profile
                    </button>
                </nav>

                {/* Main Display View */}
                <main style={styles.mainContent}>
                    {/* HOME TAB */}
                    {activeTab === 'home' && (
                        <div style={styles.tabContent}>
                            <div style={styles.welcomeHero}>
                                <h2 style={styles.welcomeTitle}>Welcome Back, {profile ? profile.name : user.email.split('@')[0]}! 🚀</h2>
                                <p style={styles.welcomeSub}>Your campus learning, networking, and freelance activities center.</p>
                            </div>

                            {/* Gamification summary widget */}
                            <div style={styles.rowLayout}>
                                <div style={{ ...styles.card, flex: 1.2 }}>
                                    <h3 style={styles.cardTitle}>Gamification Milestone 🎯</h3>
                                    
                                    <div style={styles.gamificationHub}>
                                        <div style={styles.bigXpIndicator}>
                                            <div style={styles.xpCircle}>
                                                <span style={styles.xpVal}>{gamification ? gamification.points : 50}</span>
                                                <span style={styles.xpLabel}>Total XP</span>
                                            </div>
                                            <div style={styles.tierStatus}>
                                                <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: tierColor }}>
                                                    {tierIcon} {tier} Tier
                                                </span>
                                                <p style={styles.milestoneText}>{nextMilestone}</p>
                                            </div>
                                        </div>

                                        <div style={styles.progressBarBg}>
                                            <div style={{ ...styles.progressBarFill, width: `${tierProgress}%`, backgroundColor: '#10B981' }}></div>
                                        </div>
                                    </div>

                                    {/* Badges inventory */}
                                    <div style={styles.badgeSection}>
                                        <h4 style={styles.sectionHeading}>Your Unlocked Achievements 🏅</h4>
                                        <div style={styles.badgeRow}>
                                            {[
                                                { id: 'Onboarding Explorer', icon: '🧭', title: 'Onboarding Explorer', desc: 'Snoozed/Completed popup' },
                                                { id: 'Onboarding Achiever', icon: '🏆', title: 'Onboarding Achiever', desc: 'Saved profile onboarding' },
                                                { id: 'Profile Pioneer', icon: '🎖️', title: 'Profile Pioneer', desc: 'Added custom bio & skills' },
                                                { id: 'Event Enroller', icon: '🎫', title: 'Event Enroller', desc: 'Registered for an event' },
                                                { id: 'Seminar Star', icon: '🌟', title: 'Seminar Star', desc: 'Registered for 3+ events' }
                                            ].map(b => {
                                                const isUnlocked = gamification ? gamification.badges.includes(b.id) : b.id === 'Onboarding Explorer';
                                                return (
                                                    <div key={b.id} style={isUnlocked ? styles.badgeCell : styles.badgeCellLocked} title={b.desc}>
                                                        <span style={styles.badgeIcon}>{b.icon}</span>
                                                        <span style={styles.badgeName}>{b.title}</span>
                                                        <span style={styles.badgeStatus}>{isUnlocked ? 'Unlocked ✓' : 'Locked'}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Leaderboard Card */}
                                <div style={{ ...styles.card, flex: 0.8 }}>
                                    <h3 style={styles.cardTitle}>Campus Leaderboard 👑</h3>
                                    <p style={styles.sectionSub}>Live ranking based on tech, career, and seminar activity points.</p>
                                    
                                    <div style={styles.leaderboardTable}>
                                        {DEFAULT_LEADERBOARD.map((item, index) => (
                                            <div key={index} style={styles.leaderRow}>
                                                <div style={styles.leaderRank}>#{index + 1}</div>
                                                <div style={styles.leaderInfo}>
                                                    <span style={styles.leaderName}>{item.name}</span>
                                                    <span style={styles.leaderColl}>{item.college}</span>
                                                </div>
                                                <div style={styles.leaderXp}>
                                                    <strong style={{ color: '#10B981' }}>{item.points}</strong> XP
                                                </div>
                                            </div>
                                        ))}

                                        {/* Current user injected row */}
                                        {gamification && (
                                            <div style={styles.currentUserLeaderRow}>
                                                <div style={styles.leaderRank}>#4</div>
                                                <div style={styles.leaderInfo}>
                                                    <span style={styles.leaderName}>You ({profile ? profile.name : 'Chavee Scholar'})</span>
                                                    <span style={styles.leaderColl}>{profile?.college || 'Chavee Campus Member'}</span>
                                                </div>
                                                <div style={styles.leaderXp}>
                                                    <strong style={{ color: '#006699' }}>{gamification.points}</strong> XP
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Shortcut panel */}
                            <div style={styles.card}>
                                <h3 style={styles.cardTitle}>Recommended for You 🔥</h3>
                                <div style={styles.shortcutRow}>
                                    <div style={styles.shortcutBox} onClick={() => setActiveTab('events')}>
                                        <span style={styles.shortcutIcon}>🌊</span>
                                        <div>
                                            <h4>Goa Coworking Workation</h4>
                                            <p>Hack with elite minds, network on the shore.</p>
                                        </div>
                                    </div>
                                    <div style={styles.shortcutBox} onClick={() => setActiveTab('profile')}>
                                        <span style={styles.shortcutIcon}>📝</span>
                                        <div>
                                            <h4>Add Skills & Bio</h4>
                                            <p>Complete your resume link to land freelance jobs.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EVENTS TAB */}
                    {activeTab === 'events' && (
                        <div style={styles.tabContent}>
                            <div style={styles.welcomeHero}>
                                <h2 style={styles.welcomeTitle}>Campus Workshops & Networking Seminars 📅</h2>
                                <p style={styles.welcomeSub}>Secure your seats for our manual-verify premium events.</p>
                            </div>

                            {/* Sub category tabs */}
                            <div style={styles.subtabsRow}>
                                {['All', 'Workation', 'Webinar', 'Workshop', 'Hackathon', 'Staycation', 'Debate'].map(cat => (
                                    <button 
                                        key={cat} 
                                        style={eventCategory === cat ? styles.subtabButtonActive : styles.subtabButton}
                                        onClick={() => setEventCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Registered events quick status */}
                            {registrations.length > 0 && (
                                <div style={styles.pendingVerifBox}>
                                    <span>⏳ <strong>Manual Payment Verification Pending:</strong> Our campus coordinators are manually cross-referencing your registrations on Supabase. You have <strong>{registrations.length} seat(s) pending</strong>. Check WhatsApp or email for access passes!</span>
                                </div>
                            )}

                            {/* Filter and render events */}
                            <div style={styles.eventsGrid}>
                                {DEFAULT_EVENTS
                                    .filter(ev => eventCategory === 'All' || ev.type === eventCategory)
                                    .map(ev => {
                                        const isRegistered = registrations.includes(ev.id);
                                        const isRegistering = registeringEventId === ev.id;
                                        
                                        return (
                                            <div key={ev.id} style={styles.eventCard}>
                                                <div style={styles.eventHeader}>
                                                    <span style={styles.eventTypeBadge}>{ev.type}</span>
                                                    <span style={styles.eventPrice}>{ev.price === 0 ? 'Free' : `₹${ev.price}`}</span>
                                                </div>
                                                <h3 style={styles.eventTitle}>{ev.title}</h3>
                                                <p style={styles.eventDesc}>{ev.description}</p>
                                                
                                                <div style={styles.eventDetails}>
                                                    <div>🗣️ <strong>Instructor:</strong> {ev.speaker}</div>
                                                    <div>📍 <strong>Venue:</strong> {ev.location}</div>
                                                    <div>📅 <strong>Schedule:</strong> {ev.date}</div>
                                                </div>

                                                <button 
                                                    style={isRegistered ? styles.eventRegButtonDisabled : styles.eventRegButton}
                                                    disabled={isRegistered || isRegistering}
                                                    onClick={() => handleRegisterEvent(ev.id)}
                                                >
                                                    {isRegistering ? (
                                                        <div style={styles.btnSpinnerContainer}>
                                                            <div style={styles.btnSpinner}></div>
                                                            <span>Securing seat...</span>
                                                        </div>
                                                    ) : isRegistered ? (
                                                        'Registered (Pending Verification ✓)'
                                                    ) : (
                                                        'Register Now'
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && profile && (
                        <div style={styles.tabContent}>
                            <div style={styles.welcomeHero}>
                                <h2 style={styles.welcomeTitle}>Your Student Digital Profile 👤</h2>
                                <p style={styles.welcomeSub}>Manage your skills, bio, resume URL, and onboarding details.</p>
                            </div>

                            <form onSubmit={(e) => handleSaveProfile(e)} style={styles.card}>
                                <h3 style={styles.cardSubtitle}>Core Profile Record</h3>
                                
                                <div style={styles.formGrid}>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Full Name</label>
                                        <input 
                                            type="text" 
                                            value={profile.name} 
                                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                            style={styles.formInput}
                                            required 
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>College/Institution</label>
                                        <input 
                                            type="text" 
                                            value={profile.college || ''} 
                                            onChange={(e) => setProfile({ ...profile, college: e.target.value })}
                                            placeholder="e.g. IIT Madras"
                                            style={styles.formInput}
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Date of Birth</label>
                                        <input 
                                            type="date" 
                                            value={profile.dob || ''} 
                                            onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                                            style={styles.formInput}
                                        />
                                    </div>
                                    <div style={styles.formGroup}>
                                        <label style={styles.formLabel}>Resume / Portfolio Link</label>
                                        <input 
                                            type="url" 
                                            value={profile.resume_link || ''} 
                                            onChange={(e) => setProfile({ ...profile, resume_link: e.target.value })}
                                            placeholder="https://drive.google.com/... or linkedin.com/in/..."
                                            style={styles.formInput}
                                        />
                                    </div>
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Bio (Brief Summary)</label>
                                    <textarea 
                                        rows="3" 
                                        value={profile.bio || ''} 
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        placeholder="Tell other students and recruiters about yourself!"
                                        style={styles.formTextarea}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Tech & Business Skills (comma-separated)</label>
                                    <input 
                                        type="text" 
                                        value={profile.skills || ''} 
                                        onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                                        placeholder="React, Kotlin, UI/UX, Sales, Content Writing"
                                        style={styles.formInput}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>Motive for joining Chavee</label>
                                    <select 
                                        value={profile.motive || ''} 
                                        onChange={(e) => setProfile({ ...profile, motive: e.target.value })}
                                        style={styles.formSelect}
                                    >
                                        <option value="">Select primary motive</option>
                                        <option value="Find mentors">Find mentors & guidance</option>
                                        <option value="Earn money">Earn money (Freelancing / Gigs)</option>
                                        <option value="Meet people">Meet talented campus peers</option>
                                        <option value="Attend events">Attend high-tech events</option>
                                    </select>
                                </div>

                                <button 
                                    type="submit" 
                                    style={styles.submitProfileBtn}
                                    disabled={profileLoading}
                                >
                                    {profileLoading ? (
                                        <div style={styles.btnSpinnerContainer}>
                                            <div style={styles.btnSpinner}></div>
                                            <span>Saving profile records...</span>
                                        </div>
                                    ) : (
                                        'Save Student Profile'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </main>
            </div>

            {/* FLOATING SUCCESS TOAST */}
            {toast.show && (
                <div style={styles.toast}>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* POST-SIGNUP ONBOARDING POPUP MODAL */}
            {showOnboardingPopup && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalContainer}>
                        <div style={styles.modalHeader}>
                            <h3>Setup Your Chavee Onboarding 🧭</h3>
                            <span style={styles.xpBonusBadge}>+50 XP reward</span>
                        </div>
                        <p style={styles.modalDescription}>Tell us a bit about yourself so our coordinators can pre-approve and customize your student feed.</p>
                        
                        <div style={styles.modalBody}>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>College/Institution</label>
                                <input 
                                    type="text" 
                                    value={college} 
                                    onChange={(e) => setCollege(e.target.value)} 
                                    placeholder="e.g. BITS Pilani"
                                    style={styles.formInput}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Date of Birth</label>
                                <input 
                                    type="date" 
                                    value={dob} 
                                    onChange={(e) => setDob(e.target.value)} 
                                    style={styles.formInput}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>Interests (Select multiple)</label>
                                <div style={styles.interestsTagsRow}>
                                    {['Learn', 'Earn', 'Network', 'Events', 'Mentoring', 'Freelancing'].map(tag => {
                                        const isSelected = interests.includes(tag);
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                style={isSelected ? styles.interestTagActive : styles.interestTag}
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setInterests(interests.filter(t => t !== tag));
                                                    } else {
                                                        setInterests([...interests, tag]);
                                                    }
                                                }}
                                            >
                                                {tag} {isSelected && '✓'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>What is your primary motive to join Chavee?</label>
                                <select 
                                    value={motive} 
                                    onChange={(e) => setMotive(e.target.value)} 
                                    style={styles.formSelect}
                                >
                                    <option value="">Choose your goal</option>
                                    <option value="Find mentors">Find premium tech mentors</option>
                                    <option value="Earn money">Earn money through web3/dev gigs</option>
                                    <option value="Meet people">Meet ambitious peer engineers</option>
                                    <option value="Attend events">Attend workations & debates</option>
                                </select>
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button onClick={handleDismissOnboarding} style={styles.modalCancelBtn}>
                                Fill this later
                            </button>
                            <button 
                                onClick={handleSaveOnboarding} 
                                disabled={!college || !dob || !motive || interests.length === 0}
                                style={styles.modalSubmitBtn}
                            >
                                Save & Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    layout: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#1E293B'
    },
    loadingScreen: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F8FAFC'
    },
    spinnerContainer: {
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.25rem'
    },
    spinner: {
        width: '44px',
        height: '44px',
        border: '4px solid #E2E8F0',
        borderTop: '4px solid #10B981',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    },
    btnSpinner: {
        width: '18px',
        height: '18px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTop: '2px solid #ffffff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginRight: '8px'
    },
    btnSpinnerContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    loadingText: {
        fontSize: '1rem',
        fontWeight: '500',
        color: '#64748B'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.8rem 2rem',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
        position: 'sticky',
        top: 0,
        zIndex: 100
    },
    topRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
    },
    pointsPill: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        padding: '0.25rem 0.75rem',
        backgroundColor: '#F1F5F9',
        borderRadius: '12px',
        fontWeight: 'bold',
        fontSize: '0.9rem'
    },
    miniTierLabel: {
        fontSize: '0.65rem',
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#64748B'
    },
    avatarPill: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.35rem 0.75rem',
        backgroundColor: '#ECFDF5',
        border: '1px solid #A7F3D0',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    avatarLetter: {
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#10B981',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '0.85rem'
    },
    avatarEmail: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#047857'
    },
    logoutButton: {
        padding: '0.45rem 1rem',
        borderRadius: '8px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        color: '#EF4444',
        fontWeight: '600',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    warningBanner: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        borderBottom: '1px solid #FDE68A',
        padding: '0.75rem 2rem',
        fontSize: '0.85rem',
        color: '#92400E'
    },
    warningContent: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
    },
    bannerActionButton: {
        backgroundColor: '#D97706',
        color: '#ffffff',
        border: 'none',
        padding: '0.35rem 0.75rem',
        borderRadius: '6px',
        fontWeight: '700',
        fontSize: '0.8rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    container: {
        display: 'flex',
        flex: 1,
        position: 'relative'
    },
    sidebar: {
        width: '240px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #E2E8F0',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        height: 'calc(100vh - 60px)',
        position: 'sticky',
        top: '60px'
    },
    sidebarButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: 'transparent',
        color: '#64748B',
        fontSize: '0.95rem',
        fontWeight: '600',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    sidebarButtonActive: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        width: '100%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#ECFDF5',
        color: '#059669',
        fontSize: '0.95rem',
        fontWeight: '700',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    navIcon: {
        fontSize: '1.15rem'
    },
    mainContent: {
        flex: 1,
        padding: '2rem 3rem',
        overflowY: 'auto'
    },
    tabContent: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    welcomeHero: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    },
    welcomeTitle: {
        fontSize: '1.75rem',
        fontWeight: '800',
        color: '#1E293B',
        margin: '0'
    },
    welcomeSub: {
        fontSize: '0.95rem',
        color: '#64748B',
        margin: '0'
    },
    rowLayout: {
        display: 'flex',
        gap: '2rem'
    },
    card: {
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.01)'
    },
    cardTitle: {
        fontSize: '1.2rem',
        fontWeight: '700',
        color: '#1E293B',
        margin: '0 0 1rem 0'
    },
    cardSubtitle: {
        fontSize: '1.05rem',
        fontWeight: '700',
        color: '#475569',
        margin: '0 0 1.5rem 0'
    },
    gamificationHub: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
    },
    bigXpIndicator: {
        display: 'flex',
        alignItems: 'center',
        gap: '2rem'
    },
    xpCircle: {
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        backgroundColor: '#ECFDF5',
        border: '6px solid #10B981',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },
    xpVal: {
        fontSize: '1.75rem',
        fontWeight: '900',
        color: '#065F46',
        lineHeight: '1.2'
    },
    xpLabel: {
        fontSize: '0.65rem',
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#047857'
    },
    tierStatus: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    milestoneText: {
        fontSize: '0.85rem',
        color: '#64748B',
        margin: '0'
    },
    progressBarBg: {
        height: '10px',
        backgroundColor: '#F1F5F9',
        borderRadius: '5px',
        width: '100%',
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        borderRadius: '5px',
        transition: 'width 0.5s ease-in-out'
    },
    badgeSection: {
        marginTop: '2rem',
        borderTop: '1px solid #F1F5F9',
        paddingTop: '1.5rem'
    },
    sectionHeading: {
        fontSize: '0.95rem',
        fontWeight: '700',
        color: '#475569',
        margin: '0 0 1rem 0'
    },
    sectionSub: {
        fontSize: '0.8rem',
        color: '#64748B',
        margin: '0 0 1.5rem 0'
    },
    badgeRow: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap'
    },
    badgeCell: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.75rem',
        backgroundColor: '#ECFDF5',
        border: '1px solid #10B981',
        borderRadius: '12px',
        width: '120px',
        textAlign: 'center',
        cursor: 'help',
        transition: 'transform 0.2s'
    },
    badgeCellLocked: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.75rem',
        backgroundColor: '#F8FAFC',
        border: '1px dashed #CBD5E1',
        borderRadius: '12px',
        width: '120px',
        textAlign: 'center',
        filter: 'grayscale(100%) opacity(60%)',
        cursor: 'help'
    },
    badgeIcon: {
        fontSize: '1.75rem',
        marginBottom: '0.25rem'
    },
    badgeName: {
        fontSize: '0.75rem',
        fontWeight: 'bold',
        color: '#1E293B',
        display: '-webkit-box',
        WebkitLineBreak: 'anywhere',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 1,
        overflow: 'hidden'
    },
    badgeStatus: {
        fontSize: '0.6rem',
        fontWeight: '600',
        color: '#059669',
        marginTop: '0.25rem'
    },
    leaderboardTable: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
    },
    leaderRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        backgroundColor: '#F8FAFC',
        border: '1px solid #F1F5F9'
    },
    currentUserLeaderRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderRadius: '10px',
        backgroundColor: '#ECFDF5',
        border: '1px solid #A7F3D0'
    },
    leaderRank: {
        fontSize: '0.9rem',
        fontWeight: '800',
        color: '#64748B',
        width: '32px'
    },
    leaderInfo: {
        display: 'flex',
        flexDirection: 'column',
        flex: 1
    },
    leaderName: {
        fontSize: '0.85rem',
        fontWeight: '700',
        color: '#1E293B'
    },
    leaderColl: {
        fontSize: '0.7rem',
        color: '#64748B'
    },
    leaderXp: {
        fontSize: '0.8rem',
        color: '#475569'
    },
    shortcutRow: {
        display: 'flex',
        gap: '1.5rem'
    },
    shortcutBox: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1.25rem',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        cursor: 'pointer',
        transition: 'all 0.2s',
        backgroundColor: '#FCFDFF',
        '&:hover': {
            borderColor: '#10B981',
            transform: 'translateY(-2px)'
        }
    },
    shortcutIcon: {
        fontSize: '2rem'
    },
    subtabsRow: {
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.5rem'
    },
    subtabButton: {
        padding: '0.5rem 1.25rem',
        borderRadius: '20px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        color: '#64748B',
        fontSize: '0.85rem',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s'
    },
    subtabButtonActive: {
        padding: '0.5rem 1.25rem',
        borderRadius: '20px',
        border: '1px solid #10B981',
        backgroundColor: '#10B981',
        color: '#ffffff',
        fontSize: '0.85rem',
        fontWeight: '700',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s'
    },
    pendingVerifBox: {
        backgroundColor: '#ECFDF5',
        border: '1px solid #A7F3D0',
        padding: '0.75rem 1.5rem',
        borderRadius: '12px',
        fontSize: '0.85rem',
        color: '#065F46',
        lineHeight: '1.4'
    },
    eventsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1f))',
        gap: '1.5rem',
        marginTop: '1rem'
    },
    eventCard: {
        backgroundColor: '#ffffff',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.01)',
        transition: 'all 0.2s'
    },
    eventHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    eventTypeBadge: {
        padding: '0.2rem 0.6rem',
        borderRadius: '6px',
        backgroundColor: '#ECFDF5',
        color: '#059669',
        fontSize: '0.7rem',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    eventPrice: {
        fontSize: '1.1rem',
        fontWeight: '900',
        color: '#10B981'
    },
    eventTitle: {
        fontSize: '1.15rem',
        fontWeight: '800',
        color: '#1E293B',
        margin: '0'
    },
    eventDesc: {
        fontSize: '0.85rem',
        color: '#64748B',
        lineHeight: '1.5',
        margin: '0',
        flex: 1
    },
    eventDetails: {
        backgroundColor: '#F8FAFC',
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        fontSize: '0.75rem',
        color: '#475569'
    },
    eventRegButton: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#10B981',
        color: '#ffffff',
        fontSize: '0.9rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    eventRegButtonDisabled: {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#F1F5F9',
        color: '#94A3B8',
        fontSize: '0.9rem',
        fontWeight: '700',
        cursor: 'not-allowed'
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.25rem',
        marginBottom: '1.25rem'
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
        width: '100%'
    },
    formLabel: {
        fontSize: '0.8rem',
        fontWeight: '700',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    formInput: {
        padding: '0.7rem 0.9rem',
        borderRadius: '8px',
        border: '1px solid #CBD5E1',
        fontSize: '0.9rem',
        color: '#1E293B',
        outline: 'none',
        transition: 'border-color 0.2s',
        '&:focus': {
            borderColor: '#10B981'
        }
    },
    formTextarea: {
        padding: '0.7rem 0.9rem',
        borderRadius: '8px',
        border: '1px solid #CBD5E1',
        fontSize: '0.9rem',
        color: '#1E293B',
        fontFamily: 'inherit',
        resize: 'vertical',
        outline: 'none'
    },
    formSelect: {
        padding: '0.7rem 0.9rem',
        borderRadius: '8px',
        border: '1px solid #CBD5E1',
        fontSize: '0.9rem',
        color: '#1E293B',
        backgroundColor: '#ffffff',
        outline: 'none'
    },
    submitProfileBtn: {
        width: '100%',
        padding: '0.8rem',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#10B981',
        color: '#ffffff',
        fontSize: '0.95rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginTop: '1.5rem'
    },
    toast: {
        position: 'fixed',
        bottom: '2rem',
        right: '2rem',
        backgroundColor: '#1E293B',
        color: '#ffffff',
        padding: '0.85rem 1.5rem',
        borderRadius: '10px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        fontSize: '0.9rem',
        fontWeight: '600',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        animation: 'slideUp 0.3s ease-out'
    },
    modalBackdrop: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10000
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        width: '500px',
        maxWidth: '90%',
        padding: '2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        animation: 'modalEntrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
    },
    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    xpBonusBadge: {
        padding: '0.25rem 0.6rem',
        borderRadius: '20px',
        backgroundColor: '#FEF3C7',
        color: '#D97706',
        fontSize: '0.7rem',
        fontWeight: '800'
    },
    modalDescription: {
        fontSize: '0.85rem',
        color: '#64748B',
        lineHeight: '1.4',
        margin: '0'
    },
    modalBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    },
    interestsTagsRow: {
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap'
    },
    interestTag: {
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        border: '1px solid #CBD5E1',
        backgroundColor: '#ffffff',
        color: '#475569',
        fontSize: '0.8rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.15s'
    },
    interestTagActive: {
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        border: '1px solid #10B981',
        backgroundColor: '#ECFDF5',
        color: '#059669',
        fontSize: '0.8rem',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.15s'
    },
    modalFooter: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        marginTop: '1rem'
    },
    modalCancelBtn: {
        padding: '0.65rem 1.25rem',
        borderRadius: '10px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        color: '#64748B',
        fontSize: '0.85rem',
        fontWeight: '700',
        cursor: 'pointer'
    },
    modalSubmitBtn: {
        padding: '0.65rem 1.5rem',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: '#10B981',
        color: '#ffffff',
        fontSize: '0.85rem',
        fontWeight: '700',
        cursor: 'pointer',
        '&:disabled': {
            backgroundColor: '#CBD5E1',
            cursor: 'not-allowed'
        }
    }
};

// Add raw CSS keyframe animations for clean presentation
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes modalEntrance {
            from { transform: scale(0.9) translateY(10px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(styleSheet);
}
