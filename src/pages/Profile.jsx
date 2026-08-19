import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { PageLoader, ButtonSpinner } from '../components/Spinner.jsx';

// Import Tabs
import OverviewTab from './profile/OverviewTab.jsx';
import ActivityTab from './profile/ActivityTab.jsx';
import ApplicationsTab from './profile/ApplicationsTab.jsx';
import GigsTab from './profile/GigsTab.jsx';
import BadgesTab from './profile/BadgesTab.jsx';

export default function Profile() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id: profileParam } = useParams();
    const { toast, showToast } = useToast();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({
        connectionsCount: 0,
        communitiesCount: 0,
        mutualConnections: 0,
        mutualCommunities: 0,
        connectionsList: [],
        jobsApplied: 0,
        gigsPosted: 0,
        xp: 0
    });
    const [loading, setLoading] = useState(true);
    const [connectionsModal, setConnectionsModal] = useState({ open: false });
    
    // Connection State Machine
    // 'none', 'pending_sent', 'pending_received', 'connected', 'blocked'
    const [connectionStatus, setConnectionStatus] = useState('none'); 
    const [requestId, setRequestId] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Determine if we're viewing our own profile (will verify after fetch if param is username)
    const [isOwnProfile, setIsOwnProfile] = useState(!profileParam);

    // Parse active tab from URL query params
    const searchParams = new URLSearchParams(location.search);
    const activeTab = searchParams.get('tab') || 'overview';

    const handleTabChange = (tab) => {
        navigate(`/profile${profileParam ? `/${profileParam}` : ''}?tab=${tab}`);
    };

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }
            setUser(session.user);
            if (!profileParam) setIsOwnProfile(true);
        };
        init();
    }, [navigate, profileParam]);

    useEffect(() => {
        if (!user) return;
        
        const loadProfileData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Profile
                let targetUserId = user.id;
                let profileData = null;
                
                // We always fetch from 'profiles' since the prompt says "profiles already has nearly everything"
                const table = 'profiles'; 
                
                if (profileParam) {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileParam);
                    const query = supabase.from(table).select('*');
                    if (isUuid) {
                        query.eq('id', profileParam);
                    } else {
                        query.eq('username', profileParam);
                    }
                    const { data, error } = await query.single();
                    if (error) {
                        // fallback to public_profiles if RLS on profiles blocks it
                        const { data: pubData, error: pubErr } = await supabase.from('public_profiles').select('*').eq(isUuid ? 'id' : 'username', profileParam).single();
                        if (pubErr) throw pubErr;
                        profileData = pubData;
                    } else {
                        profileData = data;
                    }
                    if (profileData) targetUserId = profileData.id;
                } else {
                    const { data } = await supabase.from(table).select('*').eq('id', user.id).single();
                    profileData = data;
                }
                
                setIsOwnProfile(targetUserId === user.id);
                setProfile(profileData || { id: targetUserId, full_name: 'Student' });

                if (!profileData) {
                    setLoading(false);
                    return;
                }

                // --- Connection & Block State ---
                if (targetUserId !== user.id) {
                    // Check Block
                    const { data: blocks } = await supabase
                        .from('user_blocks')
                        .select('*')
                        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`);
                        
                    if (blocks && blocks.length > 0) {
                        setConnectionStatus('blocked');
                        setLoading(false);
                        return; // Stop loading other stats if blocked
                    }

                    // Check connections
                    const { data: conns } = await supabase
                        .from('connections')
                        .select('*')
                        .or(`and(user_one.eq.${user.id},user_two.eq.${targetUserId}),and(user_one.eq.${targetUserId},user_two.eq.${user.id})`);
                    
                    if (conns && conns.length > 0) {
                        setConnectionStatus('connected');
                    } else {
                        // Check requests
                        const { data: reqs } = await supabase
                            .from('connection_requests')
                            .select('*')
                            .in('status', ['pending'])
                            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`);
                            
                        if (reqs && reqs.length > 0) {
                            const req = reqs[0];
                            setRequestId(req.id);
                            if (req.sender_id === user.id) {
                                setConnectionStatus('pending_sent');
                            } else {
                                setConnectionStatus('pending_received');
                            }
                        } else {
                            setConnectionStatus('none');
                        }
                    }
                }

                // --- Stats & Lists ---
                let connectionsCount = 0;
                let connectionsList = [];
                let mutualConnections = 0;
                try {
                    const { data: allConns } = await supabase
                        .from('connections')
                        .select('user_one, user_two')
                        .or(`user_one.eq.${targetUserId},user_two.eq.${targetUserId}`);
                        
                    if (allConns) {
                        connectionsCount = allConns.length;
                        const connectedIds = allConns.map(c => c.user_one === targetUserId ? c.user_two : c.user_one);
                        
                        // Fetch profiles for the list
                        if (connectedIds.length > 0) {
                            const { data: profs } = await supabase.from('public_profiles').select('id, full_name, username, avatar_url, college').in('id', connectedIds);
                            connectionsList = profs || [];
                        }

                        // Mutual logic if not own profile
                        if (targetUserId !== user.id) {
                            const { data: myConns } = await supabase
                                .from('connections')
                                .select('user_one, user_two')
                                .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);
                            const myConnectedIds = new Set((myConns || []).map(c => c.user_one === user.id ? c.user_two : c.user_one));
                            mutualConnections = connectedIds.filter(id => myConnectedIds.has(id)).length;
                        }
                    }
                } catch(e) { console.error(e); }

                let communitiesCount = 0;
                let mutualCommunities = 0;
                try {
                    const { data: targetComms } = await supabase.from('community_members').select('community_id').eq('user_id', targetUserId);
                    if (targetComms) {
                        communitiesCount = targetComms.length;
                        if (targetUserId !== user.id) {
                            const { data: myComms } = await supabase.from('community_members').select('community_id').eq('user_id', user.id);
                            const myCommIds = new Set((myComms || []).map(c => c.community_id));
                            mutualCommunities = targetComms.filter(c => myCommIds.has(c.community_id)).length;
                        }
                    }
                } catch(e) {}

                let xp = 0;
                try {
                    const { data: gamification } = await supabase.from('user_gamification').select('points').eq('user_id', targetUserId).single();
                    if (gamification) xp = gamification.points;
                } catch(e) {}

                setStats({
                    connectionsCount,
                    communitiesCount,
                    mutualConnections,
                    mutualCommunities,
                    connectionsList,
                    jobsApplied: 0,
                    gigsPosted: 0,
                    xp: xp || 0
                });

            } catch (err) {
                console.error("Error loading profile:", err);
            } finally {
                setLoading(false);
            }
        };

        loadProfileData();
    }, [user, profileParam]);


    // Actions
    const handleConnect = async () => {
        setIsActionLoading(true);
        try {
            const { data, error } = await supabase.from('connection_requests').insert({
                sender_id: user.id,
                receiver_id: profile.id,
                status: 'pending'
            }).select().single();
            if (error) throw error;
            setConnectionStatus('pending_sent');
            setRequestId(data.id);
            showToast('Connection request sent!', 'success');
        } catch(e) {
            showToast('Failed to send request', 'error');
        }
        setIsActionLoading(false);
    };

    const handleCancelRequest = async () => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('connection_requests')
                .update({ status: 'cancelled' })
                .eq('id', requestId);
            if (error) throw error;
            setConnectionStatus('none');
            setRequestId(null);
            showToast('Request cancelled.', 'success');
        } catch(e) {
            showToast('Failed to cancel request', 'error');
        }
        setIsActionLoading(false);
    };

    const handleAccept = async () => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase.rpc('accept_connection_request', { p_request_id: requestId });
            if (error) throw error;
            setConnectionStatus('connected');
            setStats(s => ({ ...s, connectionsCount: s.connectionsCount + 1 }));
            showToast('Connection accepted!', 'success');
        } catch(e) {
            showToast('Failed to accept request', 'error');
        }
        setIsActionLoading(false);
    };

    const handleDecline = async () => {
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('connection_requests')
                .update({ status: 'declined' })
                .eq('id', requestId);
            if (error) throw error;
            setConnectionStatus('none');
            setRequestId(null);
            showToast('Request declined.', 'success');
        } catch(e) {
            showToast('Failed to decline request', 'error');
        }
        setIsActionLoading(false);
    };

    const handleRemoveConnection = async (targetId = profile.id) => {
        if (!confirm('Are you sure you want to remove this connection?')) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('connections')
                .delete()
                .or(`and(user_one.eq.${user.id},user_two.eq.${targetId}),and(user_one.eq.${targetId},user_two.eq.${user.id})`);
            if (error) throw error;
            
            if (targetId === profile.id) {
                setConnectionStatus('none');
                setMenuOpen(false);
            } else {
                // Removed from modal
                setStats(s => ({
                    ...s,
                    connectionsCount: s.connectionsCount - 1,
                    connectionsList: s.connectionsList.filter(c => c.id !== targetId)
                }));
            }
            showToast('Connection removed.', 'success');
        } catch(e) {
            showToast('Failed to remove connection', 'error');
        }
        setIsActionLoading(false);
    };

    const handleBlock = async () => {
        if (!confirm('Are you sure you want to block this user? They will not be able to message you or see your profile.')) return;
        setIsActionLoading(true);
        try {
            const { error } = await supabase.from('user_blocks').insert({
                blocker_id: user.id,
                blocked_id: profile.id
            });
            if (error) throw error;
            
            // Also delete connection if exists
            await supabase.from('connections').delete()
                .or(`and(user_one.eq.${user.id},user_two.eq.${profile.id}),and(user_one.eq.${profile.id},user_two.eq.${user.id})`);
                
            setConnectionStatus('blocked');
            setMenuOpen(false);
            showToast('User blocked.', 'success');
        } catch(e) {
            showToast('Failed to block user', 'error');
        }
        setIsActionLoading(false);
    };

    const handleReport = async () => {
        const reason = prompt("Reason for reporting:");
        if (!reason) return;
        try {
            const { error } = await supabase.from('reports_moderation').insert({
                reporter_id: user.id,
                target_type: 'user',
                target_id: profile.id,
                reason
            });
            if (error) throw error;
            setMenuOpen(false);
            showToast('Report submitted.', 'success');
        } catch(e) {
            showToast('Failed to submit report', 'error');
        }
    };

    const handleMessage = async (targetId = profile.id) => {
        setIsActionLoading(true);
        try {
            const { data: conversationId, error } = await supabase.rpc('start_direct_conversation', {
                other_user_id: targetId
            });
            if (error) throw error;
            if (conversationId) {
                navigate(`/messages?conversation=${conversationId}`);
            }
        } catch(err) {
            showToast('Failed to start chat', 'error');
        }
        setIsActionLoading(false);
    };


    if (loading) return <PageLoader message="Loading profile..." />;
    if (!profile) return <div style={{ padding: '4rem', textAlign: 'center' }}><h2>Profile not found</h2></div>;

    if (connectionStatus === 'blocked') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚫</div>
                    <h2>Profile Unavailable</h2>
                </div>
            </div>
        );
    }

    if (!isOwnProfile && profile.profile_visibility === 'private' && connectionStatus !== 'connected') {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                    <h2>This profile is private.</h2>
                    <p>Connect with them to see their full profile.</p>
                </div>
            </div>
        );
    }

    // Calculate completion %
    const fields = ['full_name', 'bio', 'college', 'course', 'year', 'avatar_url', 'skills'];
    const filled = fields.filter(f => profile[f] && profile[f].length > 0).length;
    const completionPercent = Math.round((filled / fields.length) * 100);

    const tabs = isOwnProfile 
        ? [
            { id: 'overview', label: 'Overview' },
            { id: 'activity', label: 'Activity' },
            { id: 'applications', label: 'Applications' },
            { id: 'gigs', label: 'Gigs' },
            { id: 'badges', label: 'Badges' }
          ]
        : [
            { id: 'overview', label: 'Overview' },
            { id: 'activity', label: 'Activity' },
            { id: 'badges', label: 'Badges' },
            { id: 'gigs', label: 'Gigs' }
          ];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => showToast(null)} />}
            
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem' }}>
                
                {/* ── PROFILE HEADER ── */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-sm)', marginBottom: '1.5rem' }}>
                    {/* Banner */}
                    <div style={{ height: 140, background: profile.banner_url ? `url(${profile.banner_url}) center/cover` : 'linear-gradient(135deg, var(--bg-mint), var(--peacock-green))' }}></div>
                    
                    <div className="profile-header-row" style={{ padding: '0 2rem 2rem 2rem', marginTop: -50, display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap', position: 'relative' }}>
                        
                        {/* Avatar */}
                        <div style={{ flexShrink: 0, position: 'relative' }}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-surface)', boxShadow: 'var(--shadow-md)' }} />
                            ) : (
                                <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '3px solid var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>
                                    {profile.full_name?.charAt(0) || '🎓'}
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="profile-info-col" style={{ flex: 1, minWidth: 280 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                        <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                                            {profile.full_name || 'Student'}
                                        </h1>
                                        {profile.is_verified && (
                                            <span style={{ fontSize: '0.85rem', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '0.2rem 0.6rem', borderRadius: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                ✓ Verified
                                            </span>
                                        )}
                                    </div>
                                    
                                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontSize: '0.95rem' }}>
                                        @{profile.username || profile.id.substring(0,8)} 
                                        {profile.college && ` • ${profile.college}`} 
                                        {profile.course && ` • ${profile.course}`}
                                        {profile.year_of_study && ` • ${profile.year_of_study}`}
                                    </p>
                                    
                                    {(profile.city || profile.state || profile.country) && (
                                        <p style={{ color: 'var(--text-muted)', margin: '0 0 1rem 0', fontSize: '0.85rem' }}>
                                            📍 {[profile.city, profile.state, profile.country].filter(Boolean).join(', ')}
                                        </p>
                                    )}
                                </div>
                                
                                {/* Action Buttons for other profiles */}
                                {!isOwnProfile && (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', position: 'relative' }}>
                                        {connectionStatus === 'none' && (
                                            <button onClick={handleConnect} disabled={isActionLoading} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                                {isActionLoading ? <ButtonSpinner/> : 'Connect'}
                                            </button>
                                        )}
                                        {connectionStatus === 'pending_sent' && (
                                            <button onClick={handleCancelRequest} disabled={isActionLoading} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer' }}>
                                                {isActionLoading ? <ButtonSpinner/> : 'Pending (Cancel)'}
                                            </button>
                                        )}
                                        {connectionStatus === 'pending_received' && (
                                            <>
                                                <button onClick={handleAccept} disabled={isActionLoading} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                                    {isActionLoading ? <ButtonSpinner/> : 'Accept'}
                                                </button>
                                                <button onClick={handleDecline} disabled={isActionLoading} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', fontWeight: 700, cursor: 'pointer' }}>
                                                    Decline
                                                </button>
                                            </>
                                        )}
                                        {connectionStatus === 'connected' && (
                                            <button style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--bg-mint)', color: 'var(--peacock-green)', border: '1px solid var(--border-mint)', fontWeight: 700, cursor: 'default' }}>
                                                Connected ✓
                                            </button>
                                        )}
                                        {/* Message is intentionally NOT gated on connectionStatus — messaging is
                                            fully open (anyone can message anyone from a profile); only the
                                            connection state above controls the Connect/Accept/Decline affordance.
                                            Previously this button only rendered when connectionStatus === 'connected',
                                            which contradicted that — same handleMessage/start_direct_conversation flow,
                                            just no longer gated on being connected first. */}
                                        <button onClick={() => handleMessage(profile.id)} disabled={isActionLoading} style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                            {isActionLoading ? <ButtonSpinner/> : 'Message'}
                                        </button>

                                        <button onClick={() => setMenuOpen(!menuOpen)} style={{ padding: '0.5rem', borderRadius: 8, background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                                            •••
                                        </button>
                                        
                                        {menuOpen && (
                                            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 10, minWidth: 160, overflow: 'hidden' }}>
                                                {connectionStatus === 'connected' && (
                                                    <button onClick={() => handleRemoveConnection(profile.id)} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--error-red)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                                                        Remove Connection
                                                    </button>
                                                )}
                                                <button onClick={() => {
                                                    navigator.clipboard.writeText(`${window.location.origin}/profile/${profile.username || profile.id}`);
                                                    showToast('Link copied!', 'success');
                                                    setMenuOpen(false);
                                                }} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                                                    Copy Profile Link
                                                </button>
                                                <button onClick={handleReport} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                                                    Report User
                                                </button>
                                                <button onClick={handleBlock} style={{ width: '100%', textAlign: 'left', padding: '0.75rem 1rem', background: 'none', border: 'none', color: 'var(--error-red)', cursor: 'pointer' }}>
                                                    Block User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mutuals */}
                            {!isOwnProfile && (stats.mutualConnections > 0 || stats.mutualCommunities > 0) && (
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {stats.mutualConnections > 0 && <span>🤝 {stats.mutualConnections} mutual connection{stats.mutualConnections > 1 ? 's' : ''}</span>}
                                    {stats.mutualCommunities > 0 && <span>👥 {stats.mutualCommunities} mutual communit{stats.mutualCommunities > 1 ? 'ies' : 'y'}</span>}
                                </div>
                            )}

                            {/* Social Links */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                {profile.linkedin_url && (
                                    <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#0077b5', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>LinkedIn</a>
                                )}
                                {profile.github_url && (
                                    <a href={profile.github_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: '#333', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>GitHub</a>
                                )}
                                {profile.portfolio_url && (
                                    <a href={profile.portfolio_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--text-primary)', color: 'var(--bg-surface)', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Portfolio</a>
                                )}
                                {profile.website_url && (
                                    <a href={profile.website_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>Website</a>
                                )}
                            </div>

                            {/* Stat Cards */}
                            <div className="profile-stat-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Connections', value: stats.connectionsCount, onClick: () => setConnectionsModal({ open: true }) },
                                    { label: 'Communities', value: stats.communitiesCount },
                                    { label: 'Jobs Applied', value: stats.jobsApplied },
                                    { label: 'XP Points', value: stats.xp }
                                ].map(s => (
                                    <div
                                        key={s.label}
                                        onClick={s.onClick}
                                        className="profile-stat-card"
                                        style={{
                                            background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: 100,
                                            cursor: s.onClick ? 'pointer' : 'default',
                                            transition: s.onClick ? 'all 0.2s' : 'none'
                                        }}
                                        onMouseEnter={e => { if (s.onClick) { e.currentTarget.style.borderColor = 'var(--peacock-green)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                                        onMouseLeave={e => { if (s.onClick) { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                                    >
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.15rem' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions & Completion */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end', width: '100%', maxWidth: 200 }}>
                            {isOwnProfile && (
                                <button onClick={() => navigate('/profile/edit')} style={{ padding: '0.6rem 1.25rem', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}>
                                    ✏️ Edit Profile
                                </button>
                            )}

                            {isOwnProfile && (
                                <div style={{ textAlign: 'right', width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                                        <span>Profile Complete</span>
                                        <span style={{ color: completionPercent === 100 ? 'var(--peacock-green)' : 'var(--text-primary)' }}>{completionPercent}%</span>
                                    </div>
                                    <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${completionPercent}%`, background: completionPercent === 100 ? 'var(--peacock-green)' : 'var(--text-primary)', borderRadius: 3 }} />
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* ── TABS ── */}
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {tabs.map(tab => (
                        <div 
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            style={{ 
                                padding: '0.6rem 1.25rem', 
                                cursor: 'pointer', 
                                fontSize: '0.9rem', 
                                fontWeight: 700,
                                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tab.label}
                        </div>
                    ))}
                </div>

                {/* ── TAB CONTENT ── */}
                <div style={{ minHeight: 400 }}>
                    {activeTab === 'overview' && <OverviewTab profile={profile} isOwnProfile={isOwnProfile} />}
                    {activeTab === 'activity' && <ActivityTab targetUserId={profile.id} />}
                    {activeTab === 'applications' && <ApplicationsTab user={user} />}
                    {activeTab === 'gigs' && <GigsTab targetUserId={profile.id} />}
                    {activeTab === 'badges' && <BadgesTab targetUserId={profile.id} />}
                </div>

            </div>

            {/* ── CONNECTIONS MODAL ── */}
            {connectionsModal.open && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.2s' }}>
                    <div style={{ background: 'var(--bg-surface)', width: '90%', maxWidth: 500, borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Connections ({stats.connectionsList.length})</h3>
                            <button 
                                onClick={() => setConnectionsModal({ open: false })}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem' }}>
                            {stats.connectionsList.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>No connections yet.</p>
                            ) : (
                                stats.connectionsList.map(u => (
                                    <div 
                                        key={u.id} 
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem', borderRadius: 8, transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => { setConnectionsModal({ open: false }); navigate(`/profile/${u.username || u.id}`); }}>
                                            {u.avatar_url ? (
                                                <img src={u.avatar_url} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                                    {u.full_name?.charAt(0) || u.username?.charAt(0) || '👤'}
                                                </div>
                                            )}
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{u.full_name || 'Student'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{u.username || u.id.substring(0,8)} • {u.college || 'College not set'}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => handleMessage(u.id)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--peacock-green)', color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                                                Message
                                            </button>
                                            {isOwnProfile && (
                                                <button onClick={() => handleRemoveConnection(u.id)} style={{ padding: '0.4rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', cursor: 'pointer' }} title="Remove Connection">
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
