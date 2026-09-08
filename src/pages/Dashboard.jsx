import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner, PageLoader } from '../components/Spinner.jsx';
import { getLevelDetails, TIER_CONFIG } from '../hooks/useProfile.js';
import { logUserActivity } from '../utils/activityLogger.js';
import SaveButton from '../components/SaveButton.jsx';
import NotifyMeButton from '../components/NotifyMeButton.jsx';
import { subscribeNotify } from '../utils/subscribeNotify.js';
import { useIsMobile } from '../hooks/useIsMobile.js';

/* ── No hardcoded seed data — everything comes from Supabase ── */

/* Leaderboard pulls from user_gamification via Supabase */

const ALL_BADGES = [
    { id: 'Onboarding Explorer', icon: '🧭', title: 'Onboarding Explorer', desc: 'Completed signup' },
    { id: 'Onboarding Achiever', icon: '🏆', title: 'Onboarding Achiever', desc: 'Saved onboarding details' },
    { id: 'Profile Pioneer', icon: '🎖️', title: 'Profile Pioneer', desc: 'Added bio & skills' },
    { id: 'Event Enroller', icon: '🎫', title: 'Event Enroller', desc: 'Registered for an event' },
    { id: 'Seminar Star', icon: '🌟', title: 'Seminar Star', desc: 'Registered for 3+ events' },
    { id: 'Study Sync Star', icon: '📖', title: 'Study Sync Star', desc: 'Completed a Study Sync session' },
    { id: 'First Seller', icon: '💸', title: 'First Seller', desc: 'Posted first marketplace listing' },
    { id: 'Network Builder', icon: '🤝', title: 'Network Builder', desc: 'Connected with 5+ peers' },
];

/* ── Tier helpers ──────────────────────────────────────────────── */
const TIER_NAMES  = { 4: 'Platinum', 3: 'Gold', 2: 'Silver', 1: 'Bronze' };
const TIER_COLORS = { 4: '#818CF8', 3: '#F59E0B', 2: '#94A3B8', 1: '#D97706' };

/* ── Social Feed: loaded from Supabase only (no hardcoded posts) ── */
const INITIAL_POSTS = [];

/* Featured community post now comes only from Supabase */
const FEATURED_COMMUNITY_POST = null;

const ALL_SCHOLARSHIPS = [
    {
        id: 's-1',
        name: 'Reliance Foundation UG Scholarship',
        desc: 'Aims to support undergraduate students from all disciplines across India, providing financial aid and developer opportunities.',
        eligibility: 'First-year UG students enrolled in full-time courses. Annual household income less than ₹15 Lakhs.',
        incomeLimit: 1500000,
        applyUrl: 'https://www.reliancefoundation.org/scholarships',
    },
    {
        id: 's-2',
        name: 'Aditya Birla Capital Scholarship Scheme',
        desc: 'Financial support for meritorious school and college students to ensure continuity of education.',
        eligibility: 'UG professional/general course students with 60%+ in previous class. Family income less than ₹6 Lakhs.',
        incomeLimit: 600000,
        applyUrl: 'https://www.buddy4study.com/page/aditya-birla-capital-scholarship',
    },
    {
        id: 's-3',
        name: 'HDFC Badhte Kadam Scholarship',
        desc: 'Provides financial assistance to students facing general hardships or financial constraints to continue studies.',
        eligibility: 'Students in general graduation or professional courses with 60%+ marks. Family income less than ₹6 Lakhs.',
        incomeLimit: 600000,
        applyUrl: 'https://www.hdfcbank.com',
    },
    {
        id: 's-4',
        name: 'Vidyasaarathi Corporate CSR Scholarships',
        desc: 'Various corporate CSR scholarship programs for undergraduate, postgraduate, and diploma students.',
        eligibility: 'Indian students pursuing various courses, criteria depends on individual corporate partner terms.',
        incomeLimit: 500000,
        applyUrl: 'https://www.vidyasaarathi.co.in',
    },
    {
        id: 's-5',
        name: 'L’Oréal India For Young Women In Science Scholarship',
        desc: 'Assists young women in pursuing higher education in any scientific field (pure sciences/engineering/medicine).',
        eligibility: 'Female students who passed Class 12 in Science stream with 85%+. Family income less than ₹6 Lakhs.',
        incomeLimit: 600000,
        applyUrl: 'https://www.loreal.com',
    }
];

const renderAvatar = (avatarData, name, size = 34, fontSize = '0.9rem') => {
    let base = '?';
    let accessory = '';
    let bg = 'var(--peacock-green)';
    let isUrl = false;

    if (avatarData) {
        if (typeof avatarData === 'string' && (avatarData.startsWith('http://') || avatarData.startsWith('https://') || avatarData.startsWith('/'))) {
            isUrl = true;
        } else {
            try {
                const parsed = typeof avatarData === 'string' ? JSON.parse(avatarData) : avatarData;
                if (parsed && (parsed.base || parsed.avatar)) {
                    base = parsed.base || parsed.avatar || '?';
                    accessory = parsed.accessory || '';
                    bg = parsed.bg || bg;
                } else {
                    base = name?.[0]?.toUpperCase() || '?';
                }
            } catch {
                base = avatarData[0]?.toUpperCase() || '?';
            }
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
            background: isUrl ? 'transparent' : bgStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSize,
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            border: '2px solid var(--border-mint)',
            flexShrink: 0,
            overflow: 'hidden',
            userSelect: 'none'
        }}>
            {isUrl ? (
                <img src={avatarData} alt={name || 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span>{base}</span>
            )}
            {!isUrl && accessory && (
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

/* ── PostCard Component ── */
function PostCard({ p, onLike, onToggleComments, onAddComment, onShare, onDeletePost, S, adminIds, joinedCommunityIds = [], followedUserIds = [], onFollowToggle, onJoinToggle, currentUserId, onReport }) {
    const [commentInput, setCommentInput] = useState('');

    const handleCommentSubmit = (e) => {
        e.preventDefault();
        if (!commentInput.trim()) return;
        onAddComment(p.id, commentInput);
        setCommentInput('');
    };

    const isAdminPost = p.user_id && adminIds?.has(p.user_id);
    const displayName = isAdminPost ? 'Chavee Team' : p.author;
    const displayAvatar = isAdminPost ? 'C' : p.avatar;
    const displaySubtitle = isAdminPost ? `Official Chavee Team · ${p.time}` : (p.college ? `${p.college} · ${p.time}` : p.time);
    const avatarBg = isAdminPost ? 'var(--gradient-brand)' : 'var(--peacock-green)';

    return (
        <div style={{ ...S.card, padding: '1.25rem', borderRadius: 20, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                    {p.user_id || p.author_id ? (
                        <Link to={`/profile/${p.user_id || p.author_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                            {renderAvatar(p.avatar_raw, displayName, 38, '0.9rem')}
                        </Link>
                    ) : (
                        renderAvatar(p.avatar_raw, displayName, 38, '0.9rem')
                    )}
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.2rem' }}>
                            {p.user_id || p.author_id ? (
                                <Link to={`/profile/${p.user_id || p.author_id}`} style={{ textDecoration: 'none', color: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {displayName}
                                </Link>
                            ) : (
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                            )}
                            {p.feeling && (
                                <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    is {p.feeling}
                                </span>
                            )}
                            {isAdminPost && (
                                <span style={{
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: 4,
                                    background: 'var(--bg-mint)',
                                    color: 'var(--peacock-green)',
                                    border: '1px solid var(--border-mint)',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    marginLeft: '0.25rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.15rem',
                                    whiteSpace: 'nowrap'
                                }}>
                                    ✓ Official
                                </span>
                            )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{displaySubtitle}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {p.author_id && p.author_id !== currentUserId && (
                        <button
                            onClick={(e) => { e.preventDefault(); onFollowToggle(p.author_id, p.author); }}
                            style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.2rem 0.6rem',
                                borderRadius: 12,
                                border: '1px solid var(--border-mint)',
                                background: followedUserIds.includes(p.author_id) ? 'var(--bg-mint)' : 'var(--peacock-green)',
                                color: followedUserIds.includes(p.author_id) ? 'var(--peacock-green)' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {followedUserIds.includes(p.author_id) ? '✓ Following' : '+ Follow'}
                        </button>
                    )}
                    {p.user_id === currentUserId ? (
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to delete this post?")) {
                                    onDeletePost(p.id);
                                }
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                color: '#EF4444',
                                opacity: 0.6,
                                transition: 'opacity 0.2s',
                                padding: '0.25rem 0.5rem'
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                            title="Delete Post"
                        >
                            🗑️
                        </button>
                    ) : (
                        p.user_id !== currentUserId && (
                            <button
                                onClick={() => onReport({ type: 'post', id: p.id, authorId: p.user_id })}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-secondary)',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s',
                                    padding: '0.25rem 0.5rem'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                                title="Report Post"
                            >
                                🚩
                            </button>
                        )
                    )}
                    <SaveButton itemType="post" itemId={p.id} user={{ id: currentUserId }} />
                </div>
            </div>
            
            {p.community && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', alignSelf: 'flex-start' }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--peacock-green)', fontWeight: 800, background: 'var(--bg-mint)', padding: '0.2rem 0.6rem', borderRadius: 20 }}>
                        👥 {p.community}
                    </span>
                    {p.community_id && (
                        <button
                            onClick={(e) => { e.preventDefault(); onJoinToggle(p.community_id, p.community); }}
                            style={{
                                fontSize: '0.68rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.5rem',
                                borderRadius: 12,
                                border: 'none',
                                background: joinedCommunityIds.includes(p.community_id) ? 'var(--bg-mint)' : 'var(--peacock-green)',
                                color: joinedCommunityIds.includes(p.community_id) ? 'var(--peacock-green)' : '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                            }}
                        >
                            {joinedCommunityIds.includes(p.community_id) ? '✓ Joined' : 'Join'}
                        </button>
                    )}
                </div>
            )}

            <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {p.content}
            </p>

            {p.image_url && (
                <div style={{ marginTop: '0.5rem', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', width: '100%', maxHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={p.image_url} alt="Post attachment" style={{ width: '100%', height: 'auto', maxHeight: 420, objectFit: 'contain' }} />
                </div>
            )}

            <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--border-color)', borderBottom: p.commentsOpen ? '1px solid var(--border-color)' : 'none', padding: '0.65rem 0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <button 
                    onClick={() => onLike(p.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: p.likedByCurrentUser ? 'var(--peacock-green)' : 'inherit', fontWeight: p.likedByCurrentUser ? 800 : 600, display: 'flex', alignItems: 'center', gap: '0.25rem', transition: 'all 0.1s' }}
                >
                    {p.likedByCurrentUser ? '❤️' : '🤍'} {p.likes}
                </button>
                <button 
                    onClick={() => onToggleComments(p.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: p.commentsOpen ? 800 : 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                    💬 {p.comments.length}
                </button>
                <button 
                    onClick={() => onShare(p.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                    ↗️ {p.shares}
                </button>
            </div>

            {/* Comment Section expanded */}
            {p.commentsOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.25rem' }}>
                    {p.comments.map((c, ci) => (
                        <div key={ci} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.6rem 0.8rem', fontSize: '0.8rem' }}>
                            {c.user_id ? (
                                <Link to={`/profile/${c.user_id}`} style={{ textDecoration: 'none', color: 'var(--peacock-green)', display: 'block', marginBottom: '0.15rem', fontWeight: 'bold' }}>
                                    {c.author}
                                </Link>
                            ) : (
                                <strong style={{ color: 'var(--peacock-green)', display: 'block', marginBottom: '0.15rem' }}>{c.author}</strong>
                            )}
                            <span style={{ color: 'var(--text-secondary)' }}>{c.text}</span>
                        </div>
                    ))}
                    <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <input 
                            type="text" 
                            placeholder="Add a comment..." 
                            value={commentInput}
                            onChange={e => setCommentInput(e.target.value)}
                            style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem' }}
                        />
                        <button 
                            type="submit"
                            style={{ padding: '0.45rem 1rem', borderRadius: 8, border: 'none', background: 'var(--peacock-green)', color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    const fileInputRef = useRef(null);
    const feedTabsRef = useRef(null); // mobile Announcements-preview "View all" scrolls here

    const [user, setUser] = useState(null);
    const [sessionLoading, setSessionLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');

    // Data states
    const [profile, setProfile] = useState(null);
    const [gamification, setGamification] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [adminIds, setAdminIds] = useState(new Set());

    // Join & Follow states
    const [joinedCommunityIds, setJoinedCommunityIds] = useState([]);
    const [followedUserIds, setFollowedUserIds] = useState([]);
    const [dbCommunities, setDbCommunities] = useState([]);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // Loading states
    const [profileLoading, setProfileLoading] = useState(false);
    const [gamificationLoading, setGamificationLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [registeringEventId, setRegisteringEventId] = useState(null);

    // Onboarding popup
    const isMobile = useIsMobile();
    const [showOnboardingPopup, setShowOnboardingPopup] = useState(false);
    // Mobile-only: mirrors Home-after-signup.png's two-step flow (teaser →
    // full form) using this same modal's real fields — desktop keeps the
    // existing single-step modal untouched, gated below by isMobile.
    const [onboardingMobileStep, setOnboardingMobileStep] = useState('teaser'); // 'teaser' | 'form'
    const [college, setCollege] = useState('');
    const [dob, setDob] = useState('');
    const [interests, setInterests] = useState([]);
    const [motive, setMotive] = useState('');

    // Events filter
    const [eventCategory, setEventCategory] = useState('All');

    // Feed layout states
    const [feedTab, setFeedTab] = useState('For You');
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);

    // Social feed states
    const [posts, setPosts] = useState(INITIAL_POSTS);
    const [newPostText, setNewPostText] = useState('');
    const [sharePost, setSharePost] = useState(null);
    const [connectedFriends, setConnectedFriends] = useState([]);
    const [sharingToFriendId, setSharingToFriendId] = useState(null);
    const [sharedStatus, setSharedStatus] = useState({});
    const [featuredPost, setFeaturedPost] = useState(null);
    
    // Notify Subscribers states
    const [submittingFeatures, setSubmittingFeatures] = useState({});

    const handleNotifyMe = async (featureKey) => {
        if (!user || submittingFeatures[featureKey]) return;
        setSubmittingFeatures(prev => ({ ...prev, [featureKey]: true }));
        try {
            // Via the subscribe-notify Edge Function; user_id is derived
            // from the caller's JWT server-side, and dedup is handled there.
            const res = await subscribeNotify({
                email: user.email || profile?.email || '',
                featureKey,
            });
            showToast(
                res.alreadySubscribed
                    ? "You're already on the list!"
                    : "You're on the list! We'll email you when this launches.",
                res.alreadySubscribed ? 'info' : 'success'
            );
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to subscribe.", 'error');
        } finally {
            setSubmittingFeatures(prev => ({ ...prev, [featureKey]: false }));
        }
    };

    // Post Composer states
    const [selectedImageFile, setSelectedImageFile] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState('');
    const [selectedFeeling, setSelectedFeeling] = useState('');
    const [showFeelingPicker, setShowFeelingPicker] = useState(false);
    const [isPosting, setIsPosting] = useState(false);

    // Eligibility checker states
    const [showEligibilityModal, setShowEligibilityModal] = useState(false);
    const [selectedScholarship, setSelectedScholarship] = useState(null);
    const [eligibilityIncome, setEligibilityIncome] = useState('');
    const [eligibilityGender, setEligibilityGender] = useState('');
    const [eligibilityPercent, setEligibilityPercent] = useState('');
    const [eligibilityResult, setEligibilityResult] = useState(null);
    const [checkingEligibility, setCheckingEligibility] = useState(false);

    // Content reporting states
    const [reportingItem, setReportingItem] = useState(null);
    const [reportReason, setReportReason] = useState('Spam');
    const [reportCustomReason, setReportCustomReason] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        if (!reportingItem) return;

        setSubmittingReport(true);
        try {
            const finalReason = reportReason === 'Other' ? reportCustomReason.trim() : reportReason;
            if (!finalReason) {
                showToast('Please provide a reason for reporting.', 'error');
                setSubmittingReport(false);
                return;
            }

            const payload = {
                reporter_id: user.id,
                reported_user_id: reportingItem.authorId,
                message_id: reportingItem.type === 'message' ? reportingItem.id : null,
                post_id: reportingItem.type === 'post' ? reportingItem.id : null,
                gig_id: reportingItem.type === 'gig' ? reportingItem.id : null,
                reason: finalReason,
                status: 'Pending'
            };

            const { error } = await supabase
                .from('reports_moderation')
                .insert(payload);

            if (error) throw error;

            showToast('🚩 Report submitted successfully. Thank you!', 'success');
            setReportingItem(null);
            setReportReason('Spam');
            setReportCustomReason('');
        } catch (err) {
            console.error('Error submitting report:', err);
            showToast('Failed to submit report: ' + err.message, 'error');
        } finally {
            setSubmittingReport(false);
        }
    };

    // ── Auth guard ───────────────────────────────────────────────
    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error || !session) { navigate('/login'); return; }
                setUser(session.user);
                setSessionLoading(false);
            } catch { navigate('/login'); }
        };
        checkSession();
    }, [navigate]);

    // ── Load data after auth ─────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        fetchProfile();
        fetchGamification();
        fetchRegistrations();
        fetchAdmins();
        fetchJoinedCommunities();
        fetchFollowedUsers();
        fetchDbCommunities();
        fetchSuggestedUsers();
        fetchDbPosts();
        fetchConnectedFriends();
        fetchUpcomingEvents();
        fetchRecommendedJobs();
    }, [user]);

    useEffect(() => {
        const handleHomeTap = (event) => {
            if (activeTab !== 'home') {
                setActiveTab('home');
                return;
            }
            // AppShell already called mainRef.scrollTo({ top: 0 }) before firing this event.
            // If already near the top: refetch immediately (user wants a pull-to-refresh).
            // If scrolled down: wait ~350 ms for the smooth scroll to land before fetching
            // so the feed doesn't flash stale content mid-animation.
            const delay = event.detail?.isNearTop ? 0 : 350;
            setTimeout(() => fetchDbPosts(), delay);
        };

        window.addEventListener('dashboard-home-tap', handleHomeTap);
        return () => window.removeEventListener('dashboard-home-tap', handleHomeTap);
    }, [activeTab, user]);

    // ── Onboarding popup trigger ─────────────────────────────────
    useEffect(() => {
        if (!profile || profile.profile_complete || profile.college || activeTab !== 'home') return;
        const dismissed = sessionStorage.getItem(`onboarding_dismissed_${user?.id}`);
        if (dismissed) return;
        const t = setTimeout(() => {
            setCollege(profile.college || '');
            setDob(profile.dob || '');
            setInterests(profile.interests || []);
            setMotive(profile.motive || '');
            setOnboardingMobileStep('teaser');
            setShowOnboardingPopup(true);
        }, 1500);
        return () => clearTimeout(t);
    }, [profile, activeTab]);

    // ── API functions ────────────────────────────────────────────
    const fetchConnectedFriends = async () => {
        if (!user) return;
        try {
            const { data: connsData, error: e1 } = await supabase
                .from('connections')
                .select('user_one, user_two')
                .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);
            if (e1) throw e1;

            const peerIds = Array.from(new Set(
                (connsData || []).map(c => c.user_one === user.id ? c.user_two : c.user_one)
            )).filter(id => id !== user.id);

            if (peerIds.length === 0) {
                setConnectedFriends([]);
                return;
            }

            const { data: profiles, error: e2 } = await supabase
                .from('public_profiles')
                .select('id, full_name, username, avatar_url, college')
                .in('id', peerIds);
            if (e2) throw e2;

            setConnectedFriends(profiles || []);
        } catch (err) {
            console.error('Error fetching connected friends for share:', err);
        }
    };

    const fetchUpcomingEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .in('status', ['live', 'coming_soon', 'Live', 'Coming Soon', 'upcoming', 'Upcoming'])
                .order('event_date', { ascending: true })
                .limit(3);
            if (!error && data) setUpcomingEvents(data);
        } catch (err) {
            console.error('Error fetching upcoming events:', err);
        }
    };

    const fetchRecommendedJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .ilike('status', 'live')
                .order('created_at', { ascending: false })
                .limit(3);
            if (!error && data) setRecommendedJobs(data);
        } catch (err) {
            console.error('Error fetching recommended jobs:', err);
        }
    };

    const fetchProfile = async () => {
        if (!user) return;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (error) throw error;
            if (data) setProfile(data);
        } catch {
            const local = localStorage.getItem(`profile_${user.id}`);
            if (local) setProfile(JSON.parse(local));
            else {
                const def = { id: user.id, name: user.email.split('@')[0], bio: 'Student ready to level up!', skills: 'React, JavaScript', resume_link: '', college: '', dob: '', interests: [], motive: '', onboarding_completed: false };
                setProfile(def);
                localStorage.setItem(`profile_${user.id}`, JSON.stringify(def));
            }
        } finally { setProfileLoading(false); }
    };

    const fetchGamification = async () => {
        if (!user) return;
        setGamificationLoading(true);
        try {
            const { data, error } = await supabase.from('user_gamification').select('*').eq('user_id', user.id).single();
            if (error) throw error;
            if (data) setGamification(data);
        } catch {
            const local = localStorage.getItem(`gamification_${user.id}`);
            if (local) setGamification(JSON.parse(local));
            else {
                const def = { user_id: user.id, points: 50, level: 1, badges: ['Onboarding Explorer'] };
                setGamification(def);
                localStorage.setItem(`gamification_${user.id}`, JSON.stringify(def));
            }
        } finally { setGamificationLoading(false); }
    };

    const fetchRegistrations = async () => {
        if (!user) return;
        setEventsLoading(true);
        try {
            const { data, error } = await supabase.from('user_events').select('event_id').eq('user_id', user.id);
            if (error) throw error;
            if (data) setRegistrations(data.map(i => i.event_id));
        } catch {
            const local = localStorage.getItem(`registrations_${user.id}`);
            setRegistrations(local ? JSON.parse(local) : []);
        } finally { setEventsLoading(false); }
    };

    const fetchAdmins = async () => {
        try {
            // admin_ids() is a SECURITY DEFINER helper that exposes only the
            // user_id column — the admins table itself is now admin-only.
            const { data, error } = await supabase.rpc('admin_ids');
            if (error) throw error;
            if (data) {
                setAdminIds(new Set(data.map(a => a.user_id)));
            }
        } catch (err) {
            console.error('Failed to load admin IDs:', err);
        }
    };

    const fetchJoinedCommunities = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('user_id', user.id);
            if (!error && data) {
                setJoinedCommunityIds(data.map(r => r.community_id));
            }
        } catch (err) {
            console.error('Error fetching joined communities:', err);
        }
    };

    const fetchFollowedUsers = async () => {
        if (!user) return;
        try {
            // Fetch connected ids
            const { data: conns } = await supabase
                .from('connections')
                .select('user_one, user_two')
                .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);
                
            const connectedIds = (conns || []).map(c => c.user_one === user.id ? c.user_two : c.user_one);
            
            // Fetch pending requests sent
            const { data: reqs } = await supabase
                .from('connection_requests')
                .select('receiver_id')
                .eq('sender_id', user.id)
                .eq('status', 'pending');
                
            const reqIds = (reqs || []).map(r => r.receiver_id);
            
            // For dashboard suggestions filtering, we consider both connected and pending
            setFollowedUserIds([...connectedIds, ...reqIds]);
        } catch (err) {
            console.error('Error fetching connection states:', err);
        }
    };

    const fetchSuggestedUsers = async (currentFollowedIds = followedUserIds) => {
        if (!user) return;
        setLoadingSuggestions(true);
        try {
            const { data, error } = await supabase
                .from('public_profiles')
                .select('*')
                .neq('id', user.id)
                .limit(10);
            
            if (!error && data) {
                const filtered = data.filter(p => !currentFollowedIds.includes(p.id));
                setSuggestedUsers(filtered.slice(0, 5));
            }
        } catch (err) {
            console.error('Error fetching suggested users:', err);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const fetchDbCommunities = async () => {
        try {
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('status', 'Live');
            if (!error && data) {
                setDbCommunities(data);
            }
        } catch (err) {
            console.error('Error fetching communities:', err);
        }
    };

    const fetchDbPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select(`
                    id, content, created_at, is_featured, user_id, image_url, feeling, community_id,
                    profiles(full_name, username, avatar_url, college),
                    post_likes(user_id),
                    post_comments(id, content, created_at, user_id, profiles(full_name, username, avatar_url))
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const globalFeatured = data.find(p => p.is_featured && !p.community_id);
                if (globalFeatured) {
                    let baseAvatar = '?';
                    if (globalFeatured.profiles?.avatar_url) {
                        try {
                            const parsed = JSON.parse(globalFeatured.profiles.avatar_url);
                            baseAvatar = parsed.base || parsed.avatar || '?';
                        } catch {
                            baseAvatar = globalFeatured.profiles.avatar_url[0]?.toUpperCase() || '?';
                        }
                    } else {
                        baseAvatar = (globalFeatured.profiles?.full_name || globalFeatured.profiles?.username || '?')[0].toUpperCase();
                    }
                    const timeStr = globalFeatured.created_at
                        ? new Date(globalFeatured.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' at ' +
                          new Date(globalFeatured.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : 'Just now';

                    setFeaturedPost({
                        id: globalFeatured.id,
                        user_id: globalFeatured.user_id,
                        author: globalFeatured.profiles?.full_name || globalFeatured.profiles?.username || 'Student',
                        avatar: baseAvatar,
                        avatar_raw: globalFeatured.profiles?.avatar_url,
                        college: globalFeatured.profiles?.college || 'Chavee Student',
                        time: timeStr,
                        content: globalFeatured.content,
                        image_url: globalFeatured.image_url,
                        feeling: globalFeatured.feeling,
                    });
                } else {
                    setFeaturedPost(null);
                }

                const mapped = data.map(p => {
                    let baseAvatar = '?';
                    if (p.profiles?.avatar_url) {
                        try {
                            const parsed = JSON.parse(p.profiles.avatar_url);
                            baseAvatar = parsed.base || parsed.avatar || '?';
                        } catch {
                            baseAvatar = p.profiles.avatar_url[0]?.toUpperCase() || '?';
                        }
                    } else {
                        baseAvatar = (p.profiles?.full_name || p.profiles?.username || '?')[0].toUpperCase();
                    }

                    const timeStr = p.created_at
                        ? new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' at ' +
                          new Date(p.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                        : 'Just now';

                    const rawLikes = p.post_likes || [];
                    const rawComments = p.post_comments || [];

                    return {
                        id: p.id,
                        user_id: p.user_id,
                        author_id: p.user_id,
                        author: p.profiles?.full_name || p.profiles?.username || 'Student',
                        avatar: baseAvatar,
                        avatar_raw: p.profiles?.avatar_url,
                        college: p.profiles?.college || 'Chavee Student',
                        time: timeStr,
                        content: p.content,
                        image_url: p.image_url,
                        feeling: p.feeling,
                        likes: rawLikes.length,
                        likedByCurrentUser: user ? rawLikes.some(l => l.user_id === user.id) : false,
                        comments: rawComments.map(c => ({
                            id: c.id,
                            author: c.profiles?.full_name || c.profiles?.username || 'Student',
                            text: c.content
                        })),
                        commentsOpen: false,
                        shares: 0,
                    };
                });
                // Production: use ONLY real Supabase posts (no mock data)
                setPosts(mapped);
            }
        } catch (err) {
            console.error('Error fetching database posts:', err);
        }
    };

    const rewardPoints = async (amount, newBadge = null) => {
        if (!user || !gamification) return;
        const updated = { ...gamification, points: gamification.points + amount };
        if (updated.points >= 600) updated.level = 4;
        else if (updated.points >= 300) updated.level = 3;
        else if (updated.points >= 100) updated.level = 2;
        else updated.level = 1;
        if (newBadge && !updated.badges.includes(newBadge)) updated.badges = [...updated.badges, newBadge];
        setGamification(updated);
        localStorage.setItem(`gamification_${user.id}`, JSON.stringify(updated));
        try { await supabase.from('user_gamification').upsert(updated); } catch {}
        showToast(`🎉 +${amount} XP earned!${newBadge ? ` Badge: "${newBadge}"` : ''}`, 'success');
    };

    const handleRegisterEvent = async (eventId) => {
        if (!user) return;
        setRegisteringEventId(eventId);
        try {
            await new Promise(r => setTimeout(r, 800));
            const updated = [...registrations, eventId];
            setRegistrations(updated);
            localStorage.setItem(`registrations_${user.id}`, JSON.stringify(updated));
            try {
                const { error } = await supabase.from('user_events').insert({ user_id: user.id, event_id: eventId, registered_at: new Date().toISOString() });
                if (error) throw error;
                // Award XP securely via RPC
                await supabase.rpc('award_xp_for_event_registration', { p_event_id: eventId });
            } catch (err) {
                console.error('Registration or XP awarding error:', err);
            }
            const badge = updated.length >= 3 ? 'Seminar Star' : 'Event Enroller';
            await rewardPoints(100, badge);
        } catch { showToast('Registration failed. Please try again.', 'error'); }
        finally { setRegisteringEventId(null); }
    };

    const handleSaveProfile = async (e, customData = null) => {
        if (e) e.preventDefault();
        if (!user || !profile) return;
        setProfileLoading(true);
        const dataToSave = customData || profile;
        try {
            // Strip non-db columns (onboarding_completed, email, name)
            const { onboarding_completed, email, name, ...cleanData } = dataToSave;
            const payload = {
                id: user.id,
                full_name: name || dataToSave.full_name || '',
                ...cleanData,
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase.from('profiles').upsert(payload);
            if (error) throw error;
            setProfile(dataToSave);
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToSave));
            showToast('Profile updated! 👤', 'success');
            if (dataToSave.bio && dataToSave.skills && !gamification?.badges?.includes('Profile Pioneer')) {
                try {
                    await supabase.rpc('award_xp_for_profile_pioneer');
                    await rewardPoints(150, 'Profile Pioneer');
                } catch {}
            }
        } catch {
            setProfile(dataToSave);
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(dataToSave));
            showToast('Profile saved (offline mode) 👤', 'info');
        } finally { setProfileLoading(false); }
    };

    const handleSaveOnboarding = async () => {
        if (!user || !profile) return;
        const updated = { ...profile, college, dob, interests, motive, profile_complete: true };
        setShowOnboardingPopup(false);
        await handleSaveProfile(null, updated);
        try {
            await supabase.rpc('award_xp_for_onboarding');
            await rewardPoints(50, 'Onboarding Achiever');
        } catch {}
    };

    const handleDismissOnboarding = () => {
        setShowOnboardingPopup(false);
        sessionStorage.setItem(`onboarding_dismissed_${user?.id}`, 'true');
        showToast('Complete your profile later from the Profile page 🧭', 'info');
    };

    const handleFollowUser = async (targetUserId, targetName) => {
        if (!user) {
            showToast('Please log in to connect.', 'error');
            return;
        }
        
        const hasRequested = followedUserIds.includes(targetUserId);
        try {
            if (hasRequested) {
                showToast(`Already connected or request pending for ${targetName}`, 'info');
            } else {
                const { error } = await supabase
                    .from('connection_requests')
                    .insert({
                        sender_id: user.id,
                        receiver_id: targetUserId,
                        status: 'pending'
                    });
                
                if (error && error.code !== '42501' && error.code !== '23503') throw error;
                
                const updated = [...followedUserIds, targetUserId];
                setFollowedUserIds(updated);
                showToast(`👤 Connection request sent to ${targetName}!`, 'success');
                
                setSuggestedUsers(prev => prev.filter(p => p.id !== targetUserId));
                try {
                    await supabase.rpc('award_xp_for_follow', { p_following_id: targetUserId });
                    await rewardPoints(25);
                } catch {}
            }
        } catch (err) {
            console.error('Error toggling connection:', err);
            showToast('Failed to send connection request.', 'error');
        }
    };

    // Alias for backward compatibility (was renamed from handleFollowToggle)
    const handleFollowToggle = handleFollowUser;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const getCommunityIdByName = (name) => {
        if (!name) return null;
        const cleanName = name.replace(/[🚀🌊🗣️📐🎨💻🌟]/g, '').trim().toLowerCase();
        const matched = dbCommunities.find(c => {
            const cleanCName = c.name.replace(/[🚀🌊🗣️📐🎨💻🌟]/g, '').trim().toLowerCase();
            return cleanCName.includes(cleanName) || cleanName.includes(cleanCName);
        });
        if (matched) return matched.id;
        return dbCommunities[0]?.id || '097e5827-da10-46bf-bc6c-35b97ef28011'; // default fallback
    };

    const handleJoinToggle = async (communityId, communityName) => {
        if (!user) { navigate('/login'); return; }
        
        const isJoined = joinedCommunityIds.includes(communityId);
        try {
            if (isJoined) {
                // Leave
                const { error } = await supabase
                    .from('community_members')
                    .delete()
                    .eq('community_id', communityId)
                    .eq('user_id', user.id);
                
                if (error) throw error;
                
                setJoinedCommunityIds(prev => prev.filter(id => id !== communityId));
                showToast(`Left "${communityName}" community`, 'info');
            } else {
                // Join
                const { error } = await supabase
                    .from('community_members')
                    .insert({
                        community_id: communityId,
                        user_id: user.id
                    });
                
                if (error) throw error;
                
                setJoinedCommunityIds(prev => [...prev, communityId]);
                showToast(`🎉 Joined "${communityName}"! Group chat unlocked.`, 'success');
                try {
                    await supabase.rpc('award_xp_for_community_join', { p_community_id: communityId });
                    await rewardPoints(50);
                } catch {}
            }
        } catch (err) {
            console.error('Error toggling community join:', err);
            showToast('Failed to join community.', 'error');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedImageFile(file);
        setImagePreviewUrl(URL.createObjectURL(file));
    };

    const handleClearImage = () => {
        setSelectedImageFile(null);
        setImagePreviewUrl('');
    };

    // ── Social Feed & Eligibility Handlers ──
    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostText.trim() && !selectedImageFile) return;
        if (!user) { navigate('/login'); return; }

        setIsPosting(true);
        try {
            let imageUrl = null;
            if (selectedImageFile) {
                const fileExt = selectedImageFile.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                // Prefix with user.id so storage delete-own RLS policy is satisfied
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('post-images')
                    .upload(filePath, selectedImageFile);

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from('post-images')
                    .getPublicUrl(filePath);
                
                imageUrl = urlData.publicUrl;
            }

            const { data, error } = await supabase
                .from('posts')
                .insert({
                    content: newPostText.trim(),
                    user_id: user.id,
                    image_url: imageUrl,
                    feeling: selectedFeeling || null
                })
                .select(`
                    id, content, created_at, is_featured, user_id, image_url, feeling, community_id,
                    profiles(full_name, username, avatar_url, college)
                `)
                .single();

            if (error) throw error;

            if (data) {
                let baseAvatar = '?';
                if (data.profiles?.avatar_url) {
                    try {
                        const parsed = JSON.parse(data.profiles.avatar_url);
                        baseAvatar = parsed.base || parsed.avatar || '?';
                    } catch {
                        baseAvatar = data.profiles.avatar_url[0]?.toUpperCase() || '?';
                    }
                } else {
                    baseAvatar = (data.profiles?.full_name || data.profiles?.username || '?')[0].toUpperCase();
                }

                const newPost = {
                    id: data.id,
                    user_id: data.user_id,
                    author: data.profiles?.full_name || data.profiles?.username || 'Student',
                    avatar: baseAvatar,
                    avatar_raw: data.profiles?.avatar_url,
                    college: data.profiles?.college || 'Chavee Student',
                    time: 'Just now',
                    content: data.content,
                    image_url: data.image_url,
                    feeling: data.feeling,
                    likes: 0,
                    likedByCurrentUser: false,
                    comments: [],
                    commentsOpen: false,
                    shares: 0
                };

                setPosts([newPost, ...posts]);
                showToast('🎉 Post created! +15 XP earned.', 'success');
                try {
                    await supabase.rpc('award_xp_for_post', { p_post_id: data.id });
                    await rewardPoints(15);
                } catch {}

                setNewPostText('');
                setSelectedImageFile(null);
                setImagePreviewUrl('');
                setSelectedFeeling('');
                setShowFeelingPicker(false);
            }
        } catch (err) {
            console.error('Error creating post:', err);
            const errMsg = err?.message || String(err);
            if (/row-level security|violates/i.test(errMsg)) {
                showToast('Post failed: You must be signed in. Please refresh and try again.', 'error');
            } else {
                showToast('Failed to create post: ' + errMsg, 'error');
            }
        } finally {
            setIsPosting(false);
        }
    };

    const handleLikePost = async (postId) => {
        if (!user) return;
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const nextLiked = !post.likedByCurrentUser;

        // Optimistically update UI
        setPosts(posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    likedByCurrentUser: nextLiked,
                    likes: nextLiked ? p.likes + 1 : p.likes - 1
                };
            }
            return p;
        }));

        try {
            if (nextLiked) {
                const { error } = await supabase
                    .from('post_likes')
                    .insert({ post_id: postId, user_id: user.id });
                if (error && !error.message.includes('unique_post_likes')) throw error;
                
                await logUserActivity(user.id, 'post_like', { post_id: postId });

                // Notify the post owner (skip if liker is the owner)
                // The post-owner "like" notification is produced server-side
                // by the handle_new_like trigger on post_likes INSERT —
                // no client-side create_notification call needed here.
            } else {
                const { error } = await supabase
                    .from('post_likes')
                    .delete()
                    .eq('post_id', postId)
                    .eq('user_id', user.id);
                if (error) throw error;
            }
        } catch (err) {
            console.error('Error liking post in DB:', err);
            setPosts(posts.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        likedByCurrentUser: post.likedByCurrentUser,
                        likes: post.likes
                    };
                }
                return p;
            }));
            showToast('Failed to update like: ' + err.message, 'error');
        }
    };

    const handleToggleComments = (postId) => {
        setPosts(posts.map(p => {
            if (p.id === postId) return { ...p, commentsOpen: !p.commentsOpen };
            return p;
        }));
    };

    const handleAddComment = async (postId, text) => {
        if (!text.trim() || !user) return;

        try {
            const { data, error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    content: text.trim()
                })
                .select(`
                    id, content, created_at, user_id,
                    profiles(full_name, username, avatar_url)
                `)
                .single();

            if (error) throw error;
            
            await logUserActivity(user.id, 'post_comment', { post_id: postId, comment_id: data.id });

            const newComment = {
                id: data.id,
                author: data.profiles?.full_name || data.profiles?.username || 'Student',
                text: data.content
            };

            setPosts(posts.map(p => {
                if (p.id === postId) {
                    return {
                        ...p,
                        comments: [...p.comments, newComment]
                    };
                }
                return p;
            }));
            showToast('💬 Comment added! +5 XP earned.', 'success');
            rewardPoints(5);

            // The post-owner "comment" notification is produced server-side
            // by the handle_new_comment trigger on post_comments INSERT.
        } catch (err) {
            console.error('Error adding comment:', err);
            showToast('Failed to add comment: ' + err.message, 'error');
        }
    };

    const handleDeletePost = async (postId) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', user.id);

            if (error) throw error;

            setPosts(posts.filter(p => p.id !== postId));
            showToast('🗑️ Post deleted successfully!', 'success');
        } catch (err) {
            console.error('Error deleting post:', err);
            showToast('Failed to delete post: ' + err.message, 'error');
        }
    };

    const handleSharePost = (postId) => {
        const post = posts.find(p => p.id === postId);
        if (post) {
            setSharePost(post);
            setSharedStatus({});
            fetchConnectedFriends();
        }
    };

    const handleShareToFriend = async (friend, post) => {
        if (!user || !friend || !post) return;
        setSharingToFriendId(friend.id);
        try {
            const { data: conversationId, error: convErr } = await supabase.rpc('start_direct_conversation', {
                other_user_id: friend.id
            });
            if (convErr) throw convErr;

            if (!conversationId) throw new Error('Could not establish chat.');

            const postSnippet = post.content ? (post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content) : 'Post Attachment';
            const { error: msgErr } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: `📢 Check out this post on Chavee: "${postSnippet}" \n\nLink: https://chavee.in/dashboard?postId=${post.id}`
                });
            if (msgErr) throw msgErr;

            setSharedStatus(prev => ({ ...prev, [friend.id]: true }));
            showToast(`Post shared with ${friend.full_name || friend.username}! +5 XP`, 'success');
            rewardPoints(5);
        } catch (err) {
            console.error('Error sharing post:', err);
            showToast('Failed to share: ' + err.message, 'error');
        } finally {
            setSharingToFriendId(null);
        }
    };

    const handleCheckEligibility = (scholarship) => {
        setSelectedScholarship(scholarship);
        setEligibilityIncome('');
        setEligibilityGender('');
        setEligibilityPercent('');
        setEligibilityResult(null);
        setShowEligibilityModal(true);
    };

    const handleVerifyEligibility = (e) => {
        e.preventDefault();
        if (!selectedScholarship) return;
        setCheckingEligibility(true);
        setTimeout(() => {
            let eligible = true;
            const income = parseInt(eligibilityIncome, 10);
            const percent = parseInt(eligibilityPercent, 10);
            
            if (selectedScholarship.id === 's-5') {
                if (eligibilityGender !== 'Female') eligible = false;
                if (percent < 85) eligible = false;
                if (income > 600000) eligible = false;
            } else if (selectedScholarship.id === 's-2') {
                if (percent < 60) eligible = false;
                if (income > 600000) eligible = false;
            } else if (selectedScholarship.id === 's-1') {
                if (income > 1500000) eligible = false;
            } else if (selectedScholarship.id === 's-3') {
                if (percent < 60) eligible = false;
                if (income > 600000) eligible = false;
            } else {
                if (income > 500000) eligible = false;
            }

            setEligibilityResult(eligible ? 'eligible' : 'ineligible');
            setCheckingEligibility(false);
        }, 1000);
    };

    if (sessionLoading) return <PageLoader message="Loading your Chavee dashboard... 🔒" />;

    const { tier, icon: tierIcon, color: tierColor, nextMilestone, progress: tierProgress } = getLevelDetails(gamification?.points || 50);

    const filteredPosts = posts.filter(p => {
        if (feedTab === 'Following') return followedUserIds.includes(p.author_id);
        if (feedTab === 'Announcements') return adminIds.has(p.author_id);
        if (['Trending', 'Jobs', 'Events'].includes(feedTab)) return false;
        return true; // For You
    });


    /* ── Styles ───────────────────────────────────────────────── */
    const S = {
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.75rem', boxShadow: 'var(--shadow-sm)' },
        formInput: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-primary)', padding: '0.65rem 0.9rem', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none', width: '100%', transition: 'border-color 0.2s' },
        formLabel: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.35rem', display: 'block' },
        eventCard: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', boxShadow: 'var(--shadow-sm)', transition: 'all 0.25s' },
        regBtn: (disabled) => ({
            width: '100%', padding: '0.7rem', borderRadius: 10, border: 'none', fontSize: '0.88rem', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            background: disabled ? 'var(--bg-elevated)' : 'var(--peacock-green)',
            color: disabled ? 'var(--text-muted)' : '#fff',
            boxShadow: disabled ? 'none' : 'var(--shadow-sm)',
        }),
    };


    return (
        <>



            {/* Onboarding banner */}
            {profile && !profile.onboarding_completed && !profile.college && activeTab === 'home' && (
                <div className="profile-banner" style={{ background: 'var(--bg-mint)', border: 'none', borderBottom: '1px solid var(--border-mint)', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem', color: 'var(--peacock-green)' }}>
                    <span>🧭 <strong>Incomplete Profile:</strong> Complete onboarding to earn <strong>+50 XP</strong> and unlock Silver tier!</span>
                    <button onClick={() => { setCollege(profile.college || ''); setDob(profile.dob || ''); setInterests(profile.interests || []); setMotive(profile.motive || ''); setOnboardingMobileStep('teaser'); setShowOnboardingPopup(true); }}
                        style={{ background: 'var(--peacock-green)', color: '#fff', border: 'none', borderRadius: 8, padding: '0.35rem 0.85rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                        Complete Now
                    </button>
                </div>
            )}

            {/* Main content */}
            <div className="dashboard-content">


                    {/* ── HOME TAB (SOCIAL FEED) ─────────────────── */}
                    {activeTab === 'home' && (
                        <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%' }}>
                            <div className="home-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 760px) 340px', gap: '2rem', justifyContent: 'center' }}>
                                
                                {/* CENTER SOCIAL FEED */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, width: '100%' }}>
                                    
                                    <div style={{ paddingBottom: '0.2rem' }}>
                                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {profile?.name || user?.email?.split('@')[0] || 'Student'}
                                        </h2>
                                    </div>

                                    {/* Mobile-only: Upcoming Event banner + Announcements preview + Recent
                                        Activity preview. Desktop shows the same underlying data in the
                                        right-sidebar widgets below (.hidden-tablet) — this is the opposite
                                        toggle (.mobile-home-widgets, index.css) so nothing renders twice. */}
                                    <div className="mobile-home-widgets" style={{ flexDirection: 'column', gap: '1.25rem' }}>
                                        {/* Upcoming Event banner — real data, upcomingEvents[0], already
                                            fetched by fetchUpcomingEvents. No carousel (locked decision) —
                                            single card, "View all" links to /events.
                                            Register Now deliberately does NOT call this file's own
                                            handleRegisterEvent/registrations — verified live that both are
                                            dead code: they read/write a table named "user_events", which
                                            does not exist in the schema (confirmed via a live query — 42P01/
                                            PGRST205 "Could not find the table"). The real, working
                                            registration flow lives in EventDetail.jsx against the real
                                            event_registrations table (confirmed the same way, and per this
                                            project's memory: "already fully wired and functional — don't
                                            touch its logic"). So Register Now links straight to that real
                                            flow instead of reusing this file's broken inline action. */}
                                        {upcomingEvents.length > 0 && (() => {
                                            const ev = upcomingEvents[0];
                                            const dateLabel = new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                                            const timeLabel = new Date(ev.event_date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
                                            return (
                                                <div style={{ background: 'linear-gradient(135deg, #115E59 0%, #0B3B36 100%)', borderRadius: 16, padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.85 }}>Upcoming Event</span>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.3 }}>{ev.title}</h3>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{dateLabel} • {timeLabel}</span>
                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', alignItems: 'center' }}>
                                                        <Link
                                                            to={`/events/${ev.slug || ev.id}`}
                                                            style={{ background: '#F5A623', color: '#1A1A1A', border: 'none', borderRadius: 10, padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block' }}
                                                        >
                                                            Register Now
                                                        </Link>
                                                        <Link to="/events" style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>View all</Link>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Announcements preview — real admin-authored posts, already
                                            computed by the same rule the Announcements feed tab uses
                                            (adminIds.has(p.author_id)). No new fetch. */}
                                        {(() => {
                                            const announcementPosts = posts.filter(p => adminIds.has(p.author_id)).slice(0, 3);
                                            if (announcementPosts.length === 0) return null;
                                            return (
                                                <div style={S.card}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                                                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Announcements</h3>
                                                        <button
                                                            onClick={() => { setFeedTab('Announcements'); feedTabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                                                            style={{ background: 'none', border: 'none', color: 'var(--peacock-green)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                                        >
                                                            View all
                                                        </button>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                        {announcementPosts.map(p => (
                                                            <div key={p.id} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                                                                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>📢</span>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.content}</div>
                                                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{p.time}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* Recent Activity — honest coming-soon placeholder, no fetch. The
                                            real backing table (user_activity) has RLS blocking both reads
                                            AND writes right now (confirmed live: a self-row insert as an
                                            authenticated user returns 42501, RLS policy violation) — nothing
                                            can be queried from it truthfully yet. Fixing that RLS is a
                                            separate task; this stays a placeholder until it's done, same
                                            dashed-card pattern as the Featured Platform Releases cards below
                                            and PayoutTab.jsx/SettingsTab.jsx's coming-soon treatment. */}
                                        <div style={{ ...S.card, borderRadius: 20, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px dashed var(--border-mint)', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-mint) 100%)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                                                <span style={{ fontSize: '0.65rem', background: 'var(--peacock-green)', color: '#fff', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 12 }}>COMING SOON</span>
                                            </div>
                                            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0 }}>Recent Activity</h4>
                                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>See what people across Chavee are posting, joining, and celebrating — right here on Home.</p>
                                            <NotifyMeButton user={user} featureKey="recent_activity" fullWidth style={{ marginTop: 'auto' }} />
                                        </div>
                                    </div>

                                    {/* Feed Filter Tabs */}
                                    <div ref={feedTabsRef} className="feed-tabs-scroll" style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', paddingBottom: '0.2rem', borderBottom: '1px solid var(--border-color)', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', marginBottom: '0.5rem' }}>
                                        {['For You', 'Following', 'Trending', 'Jobs', 'Events', 'Announcements'].map(tab => (
                                            <button
                                                key={tab}
                                                onClick={() => setFeedTab(tab)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    borderBottom: feedTab === tab ? '2px solid var(--peacock-green)' : '2px solid transparent',
                                                    color: feedTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                                                    fontWeight: feedTab === tab ? 700 : 600,
                                                    padding: '0.5rem 0.2rem',
                                                    cursor: 'pointer',
                                                    fontSize: '0.9rem',
                                                    whiteSpace: 'nowrap',
                                                    flexShrink: 0,
                                                    transition: 'all 0.2s',
                                                    outline: 'none'
                                                }}
                                            >
                                                {tab}
                                            </button>
                                        ))}
                                    </div>
                                    <style>{`
                                        .feed-tabs-scroll::-webkit-scrollbar { display: none; }
                                    `}</style>

                                    {/* 2. Compose Post Box */}
                                    <div className="compose-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
                                        <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                onChange={handleImageChange} 
                                                accept="image/*" 
                                                style={{ display: 'none' }} 
                                            />
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'center' }}>
                                                    {user && adminIds.has(user.id) ? (
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: '50%',
                                                            background: 'var(--gradient-brand)',
                                                            color: '#fff', fontWeight: 800, fontSize: '1rem',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                        }}>C</div>
                                                    ) : (
                                                        renderAvatar(profile?.avatar_url, profile?.name || user?.email, 40, '1rem')
                                                    )}
                                                    {user && adminIds.has(user.id) && (
                                                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--peacock-green)', background: 'var(--bg-mint)', padding: '0.1rem 0.3rem', borderRadius: 4, whiteSpace: 'nowrap' }}>Official</span>
                                                    )}
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    <textarea 
                                                        value={newPostText}
                                                        onChange={e => {
                                                            setNewPostText(e.target.value);
                                                            e.target.style.height = 'auto';
                                                            e.target.style.height = `${e.target.scrollHeight}px`;
                                                        }}
                                                        placeholder={user && adminIds.has(user.id) ? "Post an official update as Chavee Team... 📢" : "What's on your mind? Share updates, links, or ideas..."} 
                                                        style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', resize: 'none', fontSize: '1rem', minHeight: 40, fontFamily: 'inherit', padding: '0.4rem 0', overflowY: 'hidden' }}
                                                        disabled={isPosting}
                                                    />

                                                    {selectedFeeling && (
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.35rem',
                                                            fontSize: '0.74rem',
                                                            fontWeight: 700,
                                                            color: 'var(--peacock-green)',
                                                            background: 'var(--bg-mint)',
                                                            padding: '0.2rem 0.6rem',
                                                            borderRadius: 20,
                                                            alignSelf: 'flex-start',
                                                            marginTop: '0.5rem'
                                                        }}>
                                                            😊 {selectedFeeling}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedFeeling('')}
                                                                style={{ background: 'none', border: 'none', color: 'var(--peacock-green)', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', padding: '0 0.1rem' }}
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    )}

                                                    {imagePreviewUrl && (
                                                        <div style={{ position: 'relative', width: 'fit-content', marginTop: '0.5rem', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                            <img src={imagePreviewUrl} alt="Upload preview" style={{ height: 120, width: 120, objectFit: 'cover', display: 'block' }} />
                                                            <button
                                                                type="button"
                                                                onClick={handleClearImage}
                                                                style={{
                                                                    position: 'absolute', top: 4, right: 4,
                                                                    background: 'rgba(0,0,0,0.6)', color: '#fff',
                                                                    border: 'none', borderRadius: '50%',
                                                                    width: 20, height: 20, cursor: 'pointer',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '0.75rem', fontWeight: 'bold'
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    )}

                                                    {showFeelingPicker && (
                                                        <div style={{
                                                            display: 'flex', flexWrap: 'wrap', gap: '0.4rem',
                                                            padding: '0.6rem', background: 'var(--bg-elevated)',
                                                            borderRadius: 8, border: '1px solid var(--border-color)',
                                                            marginTop: '0.5rem'
                                                        }}>
                                                            {['feeling excited 🎉', 'feeling motivated 💪', 'studying 📚', 'celebrating 🎊', 'working hard 💼', 'feeling inspired ✨'].map(f => (
                                                                <button
                                                                    key={f}
                                                                    type="button"
                                                                    onClick={() => { setSelectedFeeling(f); setShowFeelingPicker(false); }}
                                                                    style={{
                                                                        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                                                                        borderRadius: 20, padding: '0.25rem 0.65rem',
                                                                        fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)',
                                                                        cursor: 'pointer', transition: 'all 0.15s'
                                                                    }}
                                                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--peacock-green)'}
                                                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                                                >
                                                                    {f}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => fileInputRef.current?.click()}
                                                        title="Attach Photo" 
                                                        disabled={isPosting}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: 8, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem' }} 
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mint)'} 
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <span style={{ fontSize: '1.1rem' }}>🖼️</span> Photo
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => showToast('Video uploads coming soon!', 'info')}
                                                        title="Attach Video" 
                                                        disabled={isPosting}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: 8, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem' }} 
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mint)'} 
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <span style={{ fontSize: '1.1rem' }}>🎥</span> Video
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => showToast('Document uploads coming soon!', 'info')}
                                                        title="Attach Document" 
                                                        disabled={isPosting}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: 8, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem' }} 
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mint)'} 
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <span style={{ fontSize: '1.1rem' }}>📄</span> Document
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => showToast('Polls coming soon!', 'info')}
                                                        title="Create Poll" 
                                                        disabled={isPosting}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.4rem 0.75rem', borderRadius: 8, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.35rem' }} 
                                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mint)'} 
                                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                                    >
                                                        <span style={{ fontSize: '1.1rem' }}>📊</span> Poll
                                                    </button>
                                                </div>
                                                <button 
                                                    type="submit" 
                                                    disabled={isPosting || (!newPostText.trim() && !selectedImageFile)}
                                                    className="btn-primary" 
                                                    style={{ 
                                                        padding: '0.45rem 1.25rem', 
                                                        fontSize: '0.82rem', 
                                                        borderRadius: 10, 
                                                        cursor: (isPosting || (!newPostText.trim() && !selectedImageFile)) ? 'not-allowed' : 'pointer', 
                                                        background: (newPostText.trim() || selectedImageFile) ? 'var(--peacock-green)' : 'var(--bg-elevated)', 
                                                        color: (newPostText.trim() || selectedImageFile) ? '#fff' : 'var(--text-muted)' 
                                                    }}
                                                >
                                                    {isPosting ? <ButtonSpinner label="Posting..." /> : 'Post'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* 3. Featured Community Post — only shown when data exists from Supabase */}
                                    {featuredPost && (
                                     <div style={{ ...S.card, borderRadius: 20, border: '1.5px solid var(--accent-gold)', background: 'rgba(245, 158, 11, 0.03)', padding: '1.5rem', position: 'relative' }}>
                                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                             <span style={{ fontSize: '0.74rem', fontWeight: 800, background: 'var(--accent-gold)', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                                 ⭐ Featured Post
                                             </span>
                                             <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{featuredPost.time}</span>
                                         </div>
                                         <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                             {renderAvatar(featuredPost.avatar_raw, featuredPost.author, 32, '0.82rem')}
                                             <div>
                                                 <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{featuredPost.author}</div>
                                                 <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{featuredPost.college}</div>
                                             </div>
                                         </div>
                                         <p style={{ fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--text-primary)', margin: 0, whiteSpace: 'pre-wrap' }}>
                                             {featuredPost.content}
                                         </p>
                                         {featuredPost.image_url && (
                                             <div style={{ marginTop: '0.75rem', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', alignSelf: 'flex-start', maxWidth: '100%' }}>
                                                 <img src={featuredPost.image_url} alt="Featured Post Attachment" style={{ display: 'block', maxHeight: 250, maxWidth: '100%', objectFit: 'contain' }} />
                                             </div>
                                         )}
                                     </div>
                                    )}


                                    {/* 4. Post Feed — only real Supabase posts */}
                                    {filteredPosts.length === 0 ? (
                                        <div style={{ ...S.card, padding: '2.5rem 1.5rem', textAlign: 'center', border: '2px dashed var(--border-mint)', background: 'var(--bg-mint)' }}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{['Trending', 'Jobs', 'Events'].includes(feedTab) ? '🚧' : '✍️'}</div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--text-primary)' }}>
                                                {['Trending', 'Jobs', 'Events'].includes(feedTab) ? 'Coming Soon!' : 'Be the first to post! 🎉'}
                                            </h3>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1rem 0', lineHeight: 1.5 }}>
                                                {['Trending', 'Jobs', 'Events'].includes(feedTab) ? 'This feed tab is under construction.' : 'Share what\'s on your mind, a resource, or something exciting from campus.'}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredPosts.slice(0, 2).map(p => (
                                            <PostCard
                                                key={p.id}
                                                p={p}
                                                onLike={handleLikePost}
                                                onToggleComments={handleToggleComments}
                                                onAddComment={handleAddComment}
                                                onShare={handleSharePost}
                                                onDeletePost={handleDeletePost}
                                                S={S}
                                                adminIds={adminIds}
                                                joinedCommunityIds={joinedCommunityIds}
                                                followedUserIds={followedUserIds}
                                                onFollowToggle={handleFollowToggle}
                                                onJoinToggle={handleJoinToggle}
                                                currentUserId={user?.id}
                                                onReport={setReportingItem}
                                            />
                                        ))
                                    )}


                                    {/* 6. Featured Releases (Coming Soon Teasers) */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0 }}>🚀 Featured Platform Releases</h3>
                                        <div className="grid-responsive-2">
                                            <div style={{ ...S.card, borderRadius: 20, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px dashed var(--border-mint)', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-mint) 100%)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '1.5rem' }}>📖</span>
                                                    <span style={{ fontSize: '0.65rem', background: 'var(--peacock-green)', color: '#fff', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 12 }}>COMING SOON</span>
                                                </div>
                                                <h4 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0 }}>Chavee Study Sync ⚡</h4>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>AI-powered matching to connect you with subject study buddies in 24 hours. Level up together.</p>
                                                <NotifyMeButton user={user} featureKey="study_sync" fullWidth style={{ marginTop: 'auto' }} />
                                            </div>
                                            <div style={{ ...S.card, borderRadius: 20, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px dashed var(--border-mint)', background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-mint) 100%)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '1.5rem' }}>🤝</span>
                                                    <span style={{ fontSize: '0.65rem', background: 'var(--peacock-green)', color: '#fff', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 12 }}>COMING SOON</span>
                                                </div>
                                                <h4 style={{ fontSize: '0.94rem', fontWeight: 800, margin: 0 }}>1-on-1 Mentor Support 🎓</h4>
                                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>Get resume reviews, project advice, and mock interviews from engineers at Google, Amazon, and top startups.</p>
                                                <NotifyMeButton user={user} featureKey="mentor_support" fullWidth style={{ marginTop: 'auto' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* 7. More posts */}
                                    {filteredPosts.slice(2).map(p => (
                                        <PostCard
                                            key={p.id}
                                            p={p}
                                            onLike={handleLikePost}
                                            onToggleComments={handleToggleComments}
                                            onAddComment={handleAddComment}
                                            onShare={handleSharePost}
                                            onDeletePost={handleDeletePost}
                                            S={S}
                                            adminIds={adminIds}
                                            joinedCommunityIds={joinedCommunityIds}
                                            followedUserIds={followedUserIds}
                                            onFollowToggle={handleFollowToggle}
                                            onJoinToggle={handleJoinToggle}
                                            currentUserId={user?.id}
                                            onReport={setReportingItem}
                                        />
                                    ))}
                                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>
                                        ✨ You are all caught up! Share your own update above.
                                    </div>
                                </div>
                                
                                {/* RIGHT SIDEBAR WIDGETS */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="hidden-tablet">
                                    
                                    {/* Gamification progress circle widget */}
                                    <div style={S.card}>
                                        <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Level & XP ⚡</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-mint)', border: `4px solid var(--peacock-green)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--peacock-green)', lineHeight: 1.1 }}>{gamification?.points || 50}</span>
                                                <span style={{ fontSize: '0.5rem', fontWeight: 800, color: 'var(--peacock-hover)', textTransform: 'uppercase' }}>XP</span>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.94rem', fontWeight: 800, color: tierColor }}>{tierIcon} {tier} Tier</div>
                                                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.15rem 0 0.5rem 0', lineHeight: 1.3 }}>{nextMilestone}</p>
                                                <div className="progress-track" style={{ height: 6 }}>
                                                    <div className="progress-fill" style={{ width: `${tierProgress}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Upcoming Events Widget */}
                                    {upcomingEvents.length > 0 && (
                                        <div style={S.card}>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Upcoming Events 🎪</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {upcomingEvents.map(event => (
                                                    <Link key={event.id} to="/events" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', padding: '0.5rem', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-mint)', color: 'var(--peacock-green)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>{new Date(event.event_date).toLocaleString('default', { month: 'short' })}</span>
                                                            <span style={{ fontSize: '1rem', fontWeight: 900, lineHeight: 1 }}>{new Date(event.event_date).getDate()}</span>
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
                                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{event.location_type === 'Online' ? '💻 Virtual' : '📍 In-person'}</div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Recommended Jobs Widget */}
                                    {recommendedJobs.length > 0 && (
                                        <div style={S.card}>
                                            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommended Jobs 💼</h3>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {recommendedJobs.map(job => (
                                                    <Link key={job.id} to="/earn" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: 'inherit', padding: '0.5rem', borderRadius: 8, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                                                            {job.company_logo ? <img src={job.company_logo} alt={job.company_name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} /> : '🏢'}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.company_name}</div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* People You May Know widget */}
                                    {suggestedUsers.length > 0 && (
                                         <div style={S.card}>
                                             <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>People You May Know 👥</h3>
                                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                 {suggestedUsers.map(student => {
                                                     const isFollowing = followedUserIds.includes(student.id);
                                                     
                                                     let base = '?';
                                                     let bg = 'var(--peacock-green)';
                                                     if (student.avatar_url) {
                                                         try {
                                                             const parsed = JSON.parse(student.avatar_url);
                                                             base = parsed.base || parsed.avatar || '?';
                                                             bg = parsed.bg || bg;
                                                         } catch {
                                                             base = student.avatar_url[0]?.toUpperCase() || '?';
                                                         }
                                                     } else {
                                                         base = student.full_name?.[0]?.toUpperCase() || '?';
                                                     }

                                                     const bgStyle = bg.startsWith('linear-gradient') ? bg : (
                                                         bg === 'gold' ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' :
                                                         bg === 'purple' ? 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)' :
                                                         bg === 'pink' ? 'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)' :
                                                         bg === 'slate' ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)' :
                                                         'linear-gradient(135deg, #115E59 0%, #059669 100%)' // mint
                                                     );

                                                     return (
                                                         <div key={student.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                             <div style={{
                                                                 width: 36,
                                                                 height: 36,
                                                                 borderRadius: '50%',
                                                                 background: bgStyle,
                                                                 display: 'flex',
                                                                 alignItems: 'center',
                                                                 justifyContent: 'center',
                                                                 fontSize: '0.9rem',
                                                                 color: '#fff',
                                                                 fontWeight: 800,
                                                                 flexShrink: 0
                                                             }}>
                                                                 {base}
                                                             </div>
                                                             <div style={{ flex: 1, minWidth: 0 }}>
                                                                 <Link
                                                                     to={`/profile/${student.id}`}
                                                                     style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                                     onMouseEnter={e => e.currentTarget.style.color = 'var(--peacock-green)'}
                                                                     onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
                                                                 >
                                                                     {student.full_name || 'Verified Student'}
                                                                 </Link>
                                                                 <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                     {student.college || 'Chavee Peer'}
                                                                 </div>
                                                             </div>
                                                             <button
                                                                 onClick={() => handleFollowToggle(student.id, student.full_name)}
                                                                 style={{
                                                                     fontSize: '0.68rem',
                                                                     fontWeight: 800,
                                                                     padding: '0.15rem 0.5rem',
                                                                     borderRadius: 12,
                                                                     border: '1px solid var(--border-mint)',
                                                                     background: isFollowing ? 'var(--bg-mint)' : 'var(--peacock-green)',
                                                                     color: isFollowing ? 'var(--peacock-green)' : '#fff',
                                                                     cursor: 'pointer',
                                                                     transition: 'all 0.15s',
                                                                     flexShrink: 0
                                                                 }}
                                                             >
                                                                 {isFollowing ? 'Following' : 'Follow'}
                                                             </button>
                                                         </div>
                                                     );
                                                 })}
                                             </div>
                                         </div>
                                     )}
                                    

                                </div>
                                
                            </div>
                        </div>
                    )}


                    {/* ── EVENTS TAB ───────────────────────────── */}
                    {activeTab === 'events' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 1100, margin: '0 auto' }}>
                            <div>
                                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.35rem 0' }}>Events & Experiences 📅</h1>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Premium campus events, workshops, and workations.</p>
                            </div>

                            {/* Category filter */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {['All', 'Workation', 'Workshop', 'Webinar', 'Hackathon', 'Staycation', 'Debate'].map(cat => (
                                    <button key={cat} onClick={() => setEventCategory(cat)} style={{
                                        padding: '0.4rem 1rem', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
                                        background: eventCategory === cat ? 'var(--peacock-green)' : 'transparent',
                                        borderColor: eventCategory === cat ? 'var(--peacock-green)' : 'var(--border-color)',
                                        color: eventCategory === cat ? '#fff' : 'var(--text-secondary)',
                                    }}>{cat}</button>
                                ))}
                            </div>

                            {registrations.length > 0 && (
                                <div style={{ background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 12, padding: '0.75rem 1.25rem', fontSize: '0.84rem', color: 'var(--peacock-green)' }}>
                                    ⏳ <strong>{registrations.length} seat(s) pending verification.</strong> Our team will confirm via email/WhatsApp.
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                                {DEFAULT_EVENTS.filter(ev => eventCategory === 'All' || ev.type === eventCategory).map(ev => {
                                    const isRegistered = registrations.includes(ev.id);
                                    const isRegistering = registeringEventId === ev.id;
                                    return (
                                        <div key={ev.id} style={S.eventCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span className="type-badge">{ev.type}</span>
                                                <span style={{ fontSize: '1.05rem', fontWeight: 900, color: ev.price === 0 ? 'var(--emerald)' : 'var(--accent-gold)' }}>
                                                    {ev.price === 0 ? 'Free' : `₹${ev.price.toLocaleString('en-IN')}`}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, lineHeight: 1.35 }}>{ev.title}</h3>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{ev.description}</p>
                                            <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '0.65rem', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <span>🗣️ {ev.speaker}</span>
                                                <span>📍 {ev.location}</span>
                                                <span>📅 {ev.date}</span>
                                            </div>
                                            <button style={S.regBtn(isRegistered || isRegistering)} disabled={isRegistered || isRegistering} onClick={() => handleRegisterEvent(ev.id)}>
                                                {isRegistering ? <ButtonSpinner label="Securing seat..." /> : isRegistered ? '✓ Registered' : 'Register Now'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── PROFILE TAB ──────────────────────────── */}
                    {activeTab === 'profile' && profile && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: 800, margin: '0 auto' }}>
                            <div>
                                <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.35rem 0' }}>Student Profile 👤</h1>
                                <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                                    Manage your skills, bio, and portfolio. <Link to="/profile" style={{ color: 'var(--peacock-green)' }}>View full profile →</Link>
                                </p>
                            </div>

                            <form onSubmit={handleSaveProfile} style={S.card}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                    {[
                                        { label: 'Full Name', key: 'name', type: 'text' },
                                        { label: 'College / Institution', key: 'college', type: 'text', placeholder: 'e.g. IIT Madras' },
                                        { label: 'Date of Birth', key: 'dob', type: 'date' },
                                        { label: 'Resume / Portfolio URL', key: 'resume_link', type: 'url', placeholder: 'https://...' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label style={S.formLabel}>{f.label}</label>
                                            <input type={f.type} value={profile[f.key] || ''} placeholder={f.placeholder}
                                                onChange={e => setProfile({ ...profile, [f.key]: e.target.value })}
                                                className="dark-input" style={S.formInput} required={f.key === 'name'} />
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={S.formLabel}>Bio</label>
                                    <textarea rows={3} value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell peers and recruiters about yourself..." className="dark-input" style={{ ...S.formInput, resize: 'vertical', fontFamily: 'inherit' }} />
                                </div>

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label style={S.formLabel}>Skills (comma-separated)</label>
                                    <input type="text" value={profile.skills || ''} onChange={e => setProfile({ ...profile, skills: e.target.value })} placeholder="React, Kotlin, UI/UX, Sales..." className="dark-input" style={S.formInput} />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={S.formLabel}>Motive for joining Chavee</label>
                                    <select value={profile.motive || ''} onChange={e => setProfile({ ...profile, motive: e.target.value })} style={{ ...S.formInput, cursor: 'pointer' }}>
                                        <option value="">Select primary goal</option>
                                        <option value="Find mentors">Find mentors & guidance</option>
                                        <option value="Earn money">Earn money (Freelancing / Gigs)</option>
                                        <option value="Meet people">Meet talented campus peers</option>
                                        <option value="Attend events">Attend high-tech events</option>
                                    </select>
                                </div>

                                <button type="submit" className="btn-primary" disabled={profileLoading} style={{ width: '100%', padding: '0.8rem', fontSize: '0.95rem' }}>
                                    {profileLoading ? <ButtonSpinner label="Saving profile..." /> : 'Save Student Profile 💾'}
                                </button>
                            </form>
                        </div>
                    )}

            </div>

            {/* ── ONBOARDING POPUP ─────────────────────────────────── */}
            {/* Desktop — existing single-step modal, completely untouched. Mobile
                gets its own two-step version below (same fields, same handlers). */}
            {showOnboardingPopup && !isMobile && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, width: 480, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.35s ease-out', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem' }}>Setup Your Chavee Profile 🧭</h3>
                            <span style={{ background: 'var(--bg-mint)', color: 'var(--accent-gold)', border: '1px solid var(--border-mint)', borderRadius: 20, padding: '0.2rem 0.65rem', fontSize: '0.72rem', fontWeight: 800 }}>+50 XP</span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginBottom: '1.5rem' }}>Help us personalise your Chavee experience. Takes 30 seconds.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={S.formLabel}>College / Institution</label>
                                <input type="text" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. BITS Pilani" className="dark-input" style={S.formInput} />
                            </div>
                            <div>
                                <label style={S.formLabel}>Date of Birth</label>
                                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="dark-input" style={S.formInput} />
                            </div>
                            <div>
                                <label style={S.formLabel}>Interests (pick multiple)</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {['Learn', 'Earn', 'Network', 'Events', 'Mentoring', 'Freelancing', 'Languages', 'Tech'].map(tag => {
                                        const sel = interests.includes(tag);
                                        return (
                                            <button key={tag} type="button" onClick={() => sel ? setInterests(interests.filter(t => t !== tag)) : setInterests([...interests, tag])}
                                                style={{
                                                    padding: '0.35rem 0.75rem', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                                                    background: sel ? 'var(--bg-mint)' : 'var(--bg-elevated)',
                                                    borderColor: sel ? 'var(--border-mint)' : 'var(--border-color)',
                                                    color: sel ? 'var(--peacock-green)' : 'var(--text-secondary)'
                                                }}>
                                                {tag} {sel && '✓'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div>
                                <label style={S.formLabel}>Primary Goal on Chavee</label>
                                <select value={motive} onChange={e => setMotive(e.target.value)} style={{ ...S.formInput, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: motive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    <option value="">Choose your goal</option>
                                    <option value="Find mentors">Find premium tech mentors</option>
                                    <option value="Earn money">Earn money via gigs</option>
                                    <option value="Meet people">Meet ambitious peers</option>
                                    <option value="Attend events">Attend workations & events</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={handleDismissOnboarding} style={{ padding: '0.6rem 1.2rem', borderRadius: 10, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                Fill this later
                            </button>
                            <button onClick={handleSaveOnboarding} disabled={!college || !dob || !motive || interests.length === 0} className="btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}>
                                Save & Continue ✓
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile — two-step flow matching Home-after-signup.png (teaser →
                full form), same real fields/handlers as the desktop modal above
                (college, dob, interests, motive) — not the mockup's literal
                field labels (Full Name/Course/Graduation Year) where those
                don't correspond to what this form actually collects. */}
            {showOnboardingPopup && isMobile && onboardingMobileStep === 'teaser' && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, width: '100%', padding: '1.75rem 1.5rem', animation: 'modalEntrance 0.35s ease-out', boxShadow: 'var(--shadow-lg)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>🧭</div>
                        <h3 style={{ margin: '0.25rem 0 0', fontWeight: 900, fontSize: '1.1rem' }}>Complete your profile</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0, lineHeight: 1.5 }}>Help us know you better so we can personalize your Chavee experience.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', margin: '0.75rem 0', textAlign: 'left' }}>
                            {[
                                { icon: '🎯', text: 'Get relevant opportunities' },
                                { icon: '👥', text: 'Find the right communities' },
                                { icon: '🤝', text: 'Connect with like-minded students' },
                            ].map(item => (
                                <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <span>{item.icon}</span>{item.text}
                                </div>
                            ))}
                        </div>

                        <button onClick={() => setOnboardingMobileStep('form')} className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                            Complete Profile
                        </button>
                        <button onClick={handleDismissOnboarding} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: '0.5rem' }}>
                            Skip for now
                        </button>
                    </div>
                </div>
            )}
            {showOnboardingPopup && isMobile && onboardingMobileStep === 'form' && (() => {
                const fieldCheck = (filled) => filled ? (
                    <span style={{ color: 'var(--peacock-green)', fontWeight: 800 }}>✓</span>
                ) : null;
                return (
                    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-surface)', zIndex: 10000, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                            <button onClick={() => setOnboardingMobileStep('teaser')} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} aria-label="Back">←</button>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Complete your profile</span>
                            <button onClick={handleDismissOnboarding} style={{ background: 'none', border: 'none', fontSize: '1.3rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem' }} aria-label="Close">✕</button>
                        </div>

                        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', flex: 1 }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>This helps us show you the right content and opportunities.</p>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                    <label style={S.formLabel}>College / Institution</label>
                                    {fieldCheck(!!college.trim())}
                                </div>
                                <input type="text" value={college} onChange={e => setCollege(e.target.value)} placeholder="e.g. BITS Pilani" className="dark-input" style={S.formInput} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                    <label style={S.formLabel}>Date of Birth</label>
                                    {fieldCheck(!!dob)}
                                </div>
                                <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="dark-input" style={S.formInput} />
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={S.formLabel}>Interests (pick multiple)</label>
                                    {fieldCheck(interests.length > 0)}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {['Learn', 'Earn', 'Network', 'Events', 'Mentoring', 'Freelancing', 'Languages', 'Tech'].map(tag => {
                                        const sel = interests.includes(tag);
                                        return (
                                            <button key={tag} type="button" onClick={() => sel ? setInterests(interests.filter(t => t !== tag)) : setInterests([...interests, tag])}
                                                style={{
                                                    padding: '0.4rem 0.8rem', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.15s',
                                                    background: sel ? 'var(--bg-mint)' : 'var(--bg-elevated)',
                                                    borderColor: sel ? 'var(--border-mint)' : 'var(--border-color)',
                                                    color: sel ? 'var(--peacock-green)' : 'var(--text-secondary)'
                                                }}>
                                                {tag} {sel && '✓'}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                    <label style={S.formLabel}>Primary Goal on Chavee</label>
                                    {fieldCheck(!!motive)}
                                </div>
                                <select value={motive} onChange={e => setMotive(e.target.value)} style={{ ...S.formInput, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: motive ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                                    <option value="">Choose your goal</option>
                                    <option value="Find mentors">Find premium tech mentors</option>
                                    <option value="Earn money">Earn money via gigs</option>
                                    <option value="Meet people">Meet ambitious peers</option>
                                    <option value="Attend events">Attend workations & events</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem', flexShrink: 0 }}>
                            <button onClick={handleSaveOnboarding} disabled={!college || !dob || !motive || interests.length === 0} className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>
                                Save & Continue ✓
                            </button>
                            <button onClick={handleDismissOnboarding} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer', textAlign: 'center', padding: '0.4rem' }}>
                                Skip for now
                            </button>
                        </div>
                    </div>
                );
            })()}

            {/* ── SCHOLARSHIP ELIGIBILITY MODAL ────────────────────── */}
            {showEligibilityModal && selectedScholarship && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, width: 460, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.35s ease-out', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem' }}>Verify Eligibility 🧭</h3>
                            <button onClick={() => setShowEligibilityModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <p style={{ fontSize: '0.82rem', color: 'var(--peacock-green)', background: 'var(--bg-mint)', padding: '0.5rem 0.75rem', borderRadius: 8, margin: '0 0 1.25rem 0', fontWeight: 600 }}>
                            Checking: <strong>{selectedScholarship.name}</strong>
                        </p>

                        {eligibilityResult === null ? (
                            <form onSubmit={handleVerifyEligibility} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={S.formLabel}>Gender</label>
                                    <select value={eligibilityGender} onChange={e => setEligibilityGender(e.target.value)} style={S.formInput} required>
                                        <option value="">Select gender</option>
                                        <option value="Female">Female</option>
                                        <option value="Male">Male</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={S.formLabel}>Annual Family Income (INR)</label>
                                    <select value={eligibilityIncome} onChange={e => setEligibilityIncome(e.target.value)} style={S.formInput} required>
                                        <option value="">Select income range</option>
                                        <option value="300000">Less than ₹3,00,000</option>
                                        <option value="500000">₹3,00,000 - ₹5,00,000</option>
                                        <option value="600000">₹5,00,000 - ₹6,00,000</option>
                                        <option value="1200000">₹6,00,000 - ₹12,00,000</option>
                                        <option value="1500000">₹12,00,000 - ₹15,00,000</option>
                                        <option value="2000000">Above ₹15,00,000</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={S.formLabel}>Previous Year / Class 12 Marks (%)</label>
                                    <select value={eligibilityPercent} onChange={e => setEligibilityPercent(e.target.value)} style={S.formInput} required>
                                        <option value="">Select percentage</option>
                                        <option value="55">Below 60%</option>
                                        <option value="75">60% - 84%</option>
                                        <option value="90">85% and above</option>
                                    </select>
                                </div>
                                
                                <button type="submit" disabled={checkingEligibility} className="btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}>
                                    {checkingEligibility ? <ButtonSpinner label="Analyzing eligibility criteria..." /> : 'Verify Eligibility ✓'}
                                </button>
                            </form>
                        ) : eligibilityResult === 'eligible' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '0.5rem 0' }}>
                                <div style={{ fontSize: '3rem' }}>🎉</div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--emerald)' }}>Congratulations! You qualify.</h4>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                                    Based on your self-reported inputs, you satisfy all requirements for this scholarship program. Proceed to submit your application on the official portal.
                                </p>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button onClick={() => setShowEligibilityModal(false)} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                                        Close
                                    </button>
                                    <button onClick={() => { setShowEligibilityModal(false); window.open(selectedScholarship.applyUrl, '_blank'); }} className="btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', borderRadius: 8 }}>
                                        Go to Application Page →
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'center', padding: '0.5rem 0' }}>
                                <div style={{ fontSize: '3rem' }}>⚠️</div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#EF4444' }}>Criteria Not Met</h4>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>
                                    You do not meet the minimum specifications for this scholarship. Common requirements include:
                                </p>
                                <div style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.75rem', fontSize: '0.78rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>Required Specifications:</strong>
                                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>{selectedScholarship.eligibility}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button onClick={() => setEligibilityResult(null)} style={{ flex: 1, padding: '0.6rem', borderRadius: 8, border: '1px solid var(--peacock-green)', background: 'transparent', color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
                                        Try again
                                    </button>
                                    <button onClick={() => setShowEligibilityModal(false)} className="btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', borderRadius: 8 }}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── REPORT CONTENT MODAL ────────────────────── */}
            {reportingItem && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, width: 440, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.3s ease-out', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800 }}>Report Content 🚩</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>Help us keep Chavee safe. Why are you reporting this?</p>
                        
                        <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Reason</label>
                                <select 
                                    value={reportReason}
                                    onChange={e => setReportReason(e.target.value)}
                                    style={{
                                        background: 'var(--bg-surface)', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: 10, 
                                        color: 'var(--text-primary)', 
                                        padding: '0.65rem 0.9rem', 
                                        fontSize: '0.88rem', 
                                        fontFamily: 'inherit', 
                                        outline: 'none', 
                                        width: '100%',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="Spam">Spam / Advertising</option>
                                    <option value="Harassment">Harassment / Bullying</option>
                                    <option value="Inappropriate content">Inappropriate / Offensive content</option>
                                    <option value="Other">Other (Please specify)</option>
                                </select>
                            </div>

                            {reportReason === 'Other' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Specify Reason</label>
                                    <textarea 
                                        rows={3} 
                                        value={reportCustomReason}
                                        onChange={e => setReportCustomReason(e.target.value)}
                                        placeholder="Please describe why this content violates community rules..."
                                        style={{ 
                                            background: 'var(--bg-surface)', 
                                            border: '1px solid var(--border-color)', 
                                            borderRadius: 10, 
                                            color: 'var(--text-primary)', 
                                            padding: '0.65rem 0.9rem', 
                                            fontSize: '0.88rem', 
                                            fontFamily: 'inherit', 
                                            outline: 'none', 
                                            width: '100%', 
                                            resize: 'vertical' 
                                        }} 
                                        required
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setReportingItem(null)} className="btn-ghost" style={{ padding: '0.6rem 1.2rem', borderRadius: 10, fontSize: '0.85rem' }}>Cancel</button>
                                <button type="submit" disabled={submittingReport} style={{ padding: '0.6rem 1.5rem', borderRadius: 10, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    {submittingReport ? 'Submitting...' : 'Submit Report 🚩'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── SHARE POST MODAL ───────────────────────── */}
            {sharePost && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, width: 440, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.3s ease-out', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.15rem' }}>Share Post ↗️</h3>
                            <button onClick={() => setSharePost(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Select a connected peer to send this post as a direct message.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 280, overflowY: 'auto', paddingRight: '0.25rem' }}>
                            {connectedFriends.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                    No connected friends yet. Follow others to connect!
                                </div>
                            ) : (
                                connectedFriends.map(friend => {
                                    const sent = sharedStatus[friend.id];
                                    const sharing = sharingToFriendId === friend.id;
                                    return (
                                        <div key={friend.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--peacock-green)', color: '#fff', fontWeight: 800, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {(friend.full_name || friend.username || '?')[0].toUpperCase()}
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {friend.full_name || friend.username}
                                                    </span>
                                                    <span style={{ display: 'block', fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {friend.college || 'Chavee Student'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                disabled={sent || sharing}
                                                onClick={() => handleShareToFriend(friend, sharePost)}
                                                style={{
                                                    padding: '0.35rem 0.75rem',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: sent ? 'var(--bg-mint)' : 'var(--peacock-green)',
                                                    color: sent ? 'var(--peacock-green)' : '#fff',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 700,
                                                    cursor: (sent || sharing) ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                {sharing ? 'Sending...' : sent ? 'Sent ✓' : 'Send'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Toast {...toast} onHide={hideToast} />
        </>
    );
}
