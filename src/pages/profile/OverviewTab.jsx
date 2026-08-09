import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { ButtonSpinner } from '../../components/Spinner.jsx';

export default function OverviewTab({ profile, isOwnProfile }) {
    const [recentActivity, setRecentActivity] = useState([]);
    const [badges, setBadges] = useState([]);
    const [myFeed, setMyFeed] = useState([]);
    const [pendingGigs, setPendingGigs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOverviewData = async () => {
            setLoading(true);
            try {
                // Fetch recent activity (limit 5)
                const { data: activityData } = await supabase
                    .from('user_activity')
                    .select('*')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (activityData) setRecentActivity(activityData);

                // Fetch badges
                const { data: badgesData } = await supabase
                    .from('user_badges')
                    .select('badges!user_badges_badge_id_fkey(name, icon_url, description)')
                    .eq('user_id', profile.id)
                    .limit(5);
                if (badgesData) setBadges(badgesData.map(b => b.badges));

                // My Feed — posts by this profile's user. No profile embed needed at all:
                // we already know whose posts these are, so this sidesteps the posts<->profiles
                // FK-embed risk entirely (see Dashboard.jsx's fetchDbPosts, not reused here).
                const { data: feedData } = await supabase
                    .from('posts')
                    .select('id, content, created_at, is_featured, image_url, feeling, community_id')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (feedData) setMyFeed(feedData);

                // Pending Gigs — same proven query shape as ApplicationsTab.jsx.
                // 'applied' and 'discussing' are the only statuses confirmed to currently
                // exist in the live data; both count as pending. 'completed'/'rejected' are
                // correctly excluded by this filter if/when they appear.
                const { data: gigsData } = await supabase
                    .from('gig_applications')
                    .select('*, gigs(title, client_name)')
                    .eq('applicant_id', profile.id)
                    .in('status', ['applied', 'discussing'])
                    .order('created_at', { ascending: false })
                    .limit(5);
                if (gigsData) setPendingGigs(gigsData);
            } catch (err) {
                console.error("Failed to load overview data", err);
            } finally {
                setLoading(false);
            }
        };

        if (profile?.id) fetchOverviewData();
    }, [profile?.id]);

    const SectionHeader = ({ title, icon }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <span style={{ fontSize: '1.25rem' }}>{icon}</span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* About Me & Info */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <SectionHeader title="About Me" icon="👋" />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    {profile.bio || "This student hasn't written a bio yet."}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Skills</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {profile.skills ? (Array.isArray(profile.skills) ? profile.skills : profile.skills.split(',')).map((skill, i) => (
                                <span key={i} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 20, padding: '0.25rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                    {typeof skill === 'string' ? skill.trim() : skill}
                                </span>
                            )) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills added</span>}
                        </div>
                    </div>
                    
                    <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Links</div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            {profile.linkedin_url ? (
                                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" style={{ color: '#0A66C2', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span>🔗</span> LinkedIn
                                </a>
                            ) : null}
                            {profile.portfolio_url ? (
                                <a href={profile.portfolio_url} target="_blank" rel="noreferrer" style={{ color: 'var(--peacock-green)', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span>🌐</span> Portfolio
                                </a>
                            ) : null}
                            {!profile.linkedin_url && !profile.portfolio_url && (
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No links added</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Badges & Activity */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Badges Snippet */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                    <SectionHeader title="Recent Badges" icon="🎖️" />
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}><ButtonSpinner /></div>
                    ) : badges.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {badges.map((b, i) => (
                                <div key={i} title={b.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                        {b.icon_url ? <img src={b.icon_url} alt={b.name} style={{ width: '65%', height: '65%', objectFit: 'contain' }} /> : '🏅'}
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 60, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {b.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                            No badges earned yet.
                        </div>
                    )}
                </div>

                {/* Activity Snippet */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)', flex: 1 }}>
                    <SectionHeader title="Recent Activity" icon="⚡" />
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}><ButtonSpinner /></div>
                    ) : recentActivity.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recentActivity.map((act) => (
                                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                                    <div style={{ fontSize: '1.1rem', marginTop: '0.1rem' }}>
                                        {act.activity_type.includes('job') ? '💼' : 
                                         act.activity_type.includes('community') ? '👥' : 
                                         act.activity_type.includes('like') ? '❤️' : '✨'}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {act.activity_type === 'community_join' ? `Joined ${act.metadata?.community_name || 'a community'}` :
                                             act.activity_type === 'job_application' ? `Applied to ${act.metadata?.job_title || 'a job'} at ${act.metadata?.company_name || 'a company'}` :
                                             act.activity_type === 'post_like' ? 'Liked a post' :
                                             act.activity_type === 'post_comment' ? 'Commented on a post' :
                                             'Completed an activity'}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {new Date(act.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                            No recent activity.
                        </div>
                    )}
                </div>
            </div>

            {/* My Feed */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <SectionHeader title="My Feed" icon="📝" />
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}><ButtonSpinner /></div>
                ) : myFeed.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {myFeed.map((post) => (
                            <div key={post.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {post.content}
                                    </p>
                                    {post.community_id && (
                                        <span style={{ flexShrink: 0, background: 'var(--bg-mint)', color: 'var(--peacock-green)', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.65rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                            Community
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {new Date(post.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                        No posts yet.
                    </div>
                )}
            </div>

            {/* Pending Gigs */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                <SectionHeader title="Pending Gigs" icon="💼" />
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '1rem' }}><ButtonSpinner /></div>
                ) : pendingGigs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pendingGigs.map((app) => (
                            <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                        {app.gigs?.title || 'Untitled Gig'}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        {app.gigs?.client_name || 'Unknown Client'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                                        {new Date(app.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                <span style={{ flexShrink: 0, background: 'rgba(245,158,11,0.1)', color: '#B45309', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                    {app.status}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem 0' }}>
                        No pending gig applications.
                    </div>
                )}
            </div>

        </div>
    );
}
