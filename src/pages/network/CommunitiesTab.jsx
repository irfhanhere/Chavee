import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { ButtonSpinner } from '../../components/Spinner.jsx';
import SaveButton from '../../components/SaveButton.jsx';
import NotifyMeButton from '../../components/NotifyMeButton.jsx';
import useNotifyMe from '../../hooks/useNotifyMe.js';
import { useToast } from '../../components/Toast.jsx';

export default function CommunitiesTab({ user, onCommunityClick }) {
    const { toast, showToast } = useToast();
    const { notifiedFeatures, loadingFeatures, toggleNotify } = useNotifyMe(user);
    const [communities, setCommunities] = useState([]);
    const [myCommunityIds, setMyCommunityIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    // Loads the community list itself — independent of auth state, so communities
    // aren't delayed waiting on the session to resolve.
    const fetchCommunities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('communities')
                .select(`
                    id,
                    name,
                    slug,
                    description,
                    category,
                    location,
                    status,
                    logo_url,
                    community_members(count)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const enriched = data.map(c => ({
                ...c,
                member_count: c.community_members?.[0]?.count ?? 0
            }));
            setCommunities(enriched);
        } catch (err) {
            console.error('Error fetching communities:', err);
        } finally {
            setLoading(false);
        }
    };

    // Loads the current user's membership set — separate from the above so it can
    // re-run whenever `user` actually becomes available (fixes a race where this
    // effect could run before Network.jsx's getSession() resolves, permanently
    // leaving myCommunityIds empty for the rest of the page load).
    const fetchMyMemberships = async () => {
        if (!user) {
            setMyCommunityIds(new Set());
            return;
        }
        try {
            const { data, error } = await supabase
                .from('community_members')
                .select('community_id')
                .eq('user_id', user.id);
            if (error) throw error;
            setMyCommunityIds(new Set((data || []).map(m => m.community_id)));
        } catch (err) {
            console.error('Error fetching community memberships:', err);
        }
    };

    useEffect(() => {
        fetchCommunities();
    }, []);

    useEffect(() => {
        fetchMyMemberships();
    }, [user]);

    const categories = ['All', 'Technology', 'Design', 'Marketing', 'Business', 'Programming', 'AI', 'Sports', 'Startup'];
    
    const filteredCommunities = communities.filter(c => 
        filter === 'All' ? true : c.category === filter
    );

    const myComms = filteredCommunities.filter(c => myCommunityIds.has(c.id));
    
    // Unjoined live communities
    const discoverable = filteredCommunities.filter(c => c.status === 'Live' && !myCommunityIds.has(c.id));
    
    // 1. Popular Communities: Sort by member count descending
    const popularCommunities = [...discoverable].sort((a, b) => b.member_count - a.member_count);
    
    // 2. Skill-Based: Filter by category (exclude 'General' or specific ones if needed, but for now we just show categories)
    // We can just show discoverable communities grouped by the selected filter category, or default to all if 'All' is selected.
    const skillBased = discoverable.filter(c => c.category && c.category !== 'General' && c.category !== 'Other');

    // 3. Location-Based
    const locationBased = discoverable.filter(c => c.location);

    // 4. Recommended For You: match college or interests
    const userCollege = user?.user_metadata?.college?.toLowerCase() || '';
    const userInterests = user?.user_metadata?.interests || [];
    
    const recommended = discoverable.filter(c => {
        const cDesc = (c.description || '').toLowerCase();
        const cName = (c.name || '').toLowerCase();
        const cLoc = (c.location || '').toLowerCase();
        const cCat = (c.category || '').toLowerCase();
        
        let match = false;
        if (userCollege && (cDesc.includes(userCollege) || cName.includes(userCollege) || cLoc.includes(userCollege))) {
            match = true;
        }
        if (!match && Array.isArray(userInterests)) {
            match = userInterests.some(interest => {
                const i = interest.toLowerCase();
                return cDesc.includes(i) || cName.includes(i) || cCat.includes(i);
            });
        }
        return match;
    });

    const comingSoon = communities.filter(c => c.status === 'Coming Soon');

    if (loading) {
        return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}><ButtonSpinner label="Loading Communities..." /></div>;
    }

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Filter Bar */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {categories.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setFilter(cat)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 20,
                            whiteSpace: 'nowrap',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            background: filter === cat ? 'var(--peacock-green)' : 'var(--bg-surface)',
                            color: filter === cat ? '#fff' : 'var(--text-secondary)',
                            border: `1px solid ${filter === cat ? 'var(--peacock-green)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* My Communities */}
            {user && myComms.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>My Communities</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {myComms.map(c => (
                            <CommunityCard key={c.id} community={c} user={user} onClick={() => onCommunityClick(c)} isLive={true} isJoined={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended For You */}
            {user && recommended.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Recommended For You</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {recommended.map(c => (
                            <CommunityCard key={c.id} community={c} user={user} onClick={() => onCommunityClick(c)} isLive={true} isJoined={false} />
                        ))}
                    </div>
                </div>
            )}

            {/* Popular Communities */}
            {popularCommunities.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Popular Communities</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {popularCommunities.map(c => (
                            <CommunityCard key={c.id} community={c} user={user} onClick={() => onCommunityClick(c)} isLive={true} isJoined={false} />
                        ))}
                    </div>
                </div>
            )}

            {/* Skill-Based Communities */}
            {skillBased.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Skill-Based Communities</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                        {skillBased.map(c => (
                            <CommunityCard key={c.id} community={c} user={user} onClick={() => onCommunityClick(c)} isLive={true} isJoined={false} />
                        ))}
                    </div>
                </div>
            )}

            {/* Location-Based Communities */}
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Location-Based Communities</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {locationBased.map(c => (
                        <CommunityCard key={c.id} community={c} user={user} onClick={() => onCommunityClick(c)} isLive={true} isJoined={false} />
                    ))}
                    {locationBased.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                            <p style={{ margin: 0, color: 'var(--text-muted)' }}>No location-based communities yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Coming Soon */}
            {comingSoon.length > 0 && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Coming Soon</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                        {comingSoon.map(c => (
                            <CommunityCard key={c.id} community={c} user={user} onClick={() => {}} isLive={false} isJoined={false} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function CommunityCard({ community, user, onClick, isLive, isJoined }) {
    const defaultGradient = 'linear-gradient(135deg, var(--peacock-green), #0D9488)';
    const featureKey = `community:${community.id}`;
    
    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: isLive ? 'pointer' : 'default',
            boxShadow: 'var(--shadow-sm)'
        }}
        onClick={isLive ? onClick : undefined}
        >
            <div style={{ 
                height: 100, 
                background: community.logo_url ? `url(${community.logo_url}) center/cover` : defaultGradient,
                position: 'relative'
            }}>
                {isLive && (
                    <span style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: 'rgba(16,185,129,0.9)', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 6,
                        backdropFilter: 'blur(4px)'
                    }}>Verified</span>
                )}
                {!isLive && (
                    <span style={{
                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                        background: 'rgba(245,158,11,0.9)', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 6,
                        backdropFilter: 'blur(4px)'
                    }}>Coming Soon</span>
                )}
                
                {/* Community Icon Overlap */}
                <div style={{
                    position: 'absolute',
                    bottom: -24,
                    left: '1rem',
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'var(--bg-elevated)',
                    border: '2px solid var(--bg-surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    {community.name.substring(0,2).toUpperCase()}
                </div>
            </div>

            <div style={{ padding: '2rem 1.25rem 1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {community.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {community.category || 'General'} · {community.member_count} members
                        </p>
                    </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem', flex: 1 }}>
                    {community.description || 'A community on Chavee.'}
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    {isLive ? (
                        <button style={{
                            flex: 1,
                            padding: '0.65rem',
                            borderRadius: 10,
                            background: isJoined ? 'var(--peacock-green)' : 'transparent',
                            color: isJoined ? '#fff' : 'var(--peacock-green)',
                            border: '1px solid var(--peacock-green)',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}>
                            {isJoined ? 'Open Community' : 'Join Community'}
                        </button>
                    ) : (
                        <NotifyMeButton user={user} featureKey={featureKey} />
                    )}
                    <SaveButton itemType="community" itemId={community.id} user={user} style={{ flex: '0 0 auto', padding: '0.65rem', borderRadius: 10, border: '1px solid var(--border-color)' }} />
                </div>
            </div>
        </div>
    );
}
