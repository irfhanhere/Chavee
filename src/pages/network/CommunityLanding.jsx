import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import Toast, { useToast } from '../../components/Toast.jsx';
import { ButtonSpinner } from '../../components/Spinner.jsx';
import { logUserActivity } from '../../utils/activityLogger.js';

// Builds a short "college • course • year_of_study" subtitle for a profile,
// matching the composite pattern/separator style used in Profile.jsx (~lines 463-468).
// Unlike that usage, this omits the leading @username — here it's used as a
// role/headline-style subtitle (post author, member card), not an identity line.
// Returns '' if none of the three fields are present.
function buildProfileSubtitle(profile) {
    if (!profile) return '';
    return [profile.college, profile.course, profile.year_of_study].filter(Boolean).join(' • ');
}

export default function CommunityLanding({ community, user, onBack }) {
    const { toast, showToast } = useToast();
    const [activeTab, setActiveTab] = useState('Home');
    const [role, setRole] = useState('Guest'); // Guest, Member, Admin
    const [loadingRole, setLoadingRole] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            if (!user) {
                setRole('Guest');
                setLoadingRole(false);
                return;
            }
            try {
                // Mocking the admin check. In reality, query community_members.
                // Assuming admins table exists or using a specific role column
                const { data, error } = await supabase
                    .from('community_members')
                    .select('role')
                    .eq('community_id', community.id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setRole(data.role || 'Member'); // could be Admin, Moderator, Member
                } else {
                    setRole('Guest');
                }
            } catch (err) {
                console.error('Error checking role:', err);
                setRole('Guest');
            } finally {
                setLoadingRole(false);
            }
        };
        checkRole();
    }, [community.id, user]);

    const handleJoin = async () => {
        if (!user) {
            showToast('Please log in to join communities.', 'error');
            return;
        }
        try {
            const { error } = await supabase
                .from('community_members')
                .insert({ community_id: community.id, user_id: user.id, role: 'member' });
            if (error) throw error;
            
            await logUserActivity(user.id, 'community_join', { 
                community_id: community.id, 
                community_name: community.name 
            });

            setRole('Member');
            showToast('Welcome to the community!', 'success');
        } catch (err) {
            console.error('Error joining:', err);
            showToast('Failed to join: ' + err.message, 'error');
        }
    };

    const tabs = ['Home', 'Discussions', 'Members', 'Resources', 'Events', 'About'];

    return (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            {/* Back Navigation */}
            <button 
                onClick={onBack}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
                ← Back to Communities
            </button>

            {/* Hero Banner */}
            <div style={{
                background: community.logo_url ? `url(${community.logo_url}) center/cover` : 'linear-gradient(135deg, var(--peacock-green), #0D9488)',
                borderRadius: 20,
                padding: '2rem',
                color: '#fff',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '1.5rem'
            }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)' }}></div>
                
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: 16, background: 'var(--bg-elevated)', border: '3px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: 'var(--text-primary)', boxShadow: 'var(--shadow-sm)', flexShrink: 0
                    }}>
                        {community.name.substring(0,2).toUpperCase()}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900 }}>{community.name}</h1>
                            <span style={{ fontSize: '0.75rem', background: 'rgba(16,185,129,0.2)', color: '#10B981', padding: '0.2rem 0.6rem', borderRadius: 20, border: '1px solid rgba(16,185,129,0.3)', fontWeight: 800 }}>Verified</span>
                        </div>
                        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', opacity: 0.9 }}>
                            {community.category} · {community.member_count} members · <span style={{ color: '#10B981', fontWeight: 700 }}>● {Math.floor(community.member_count * 0.1) || 12} Active Today</span>
                        </p>
                        <p style={{ margin: '0 0 1.5rem', fontSize: '0.95rem', lineHeight: 1.5, opacity: 0.8, maxWidth: 600 }}>
                            {community.description}
                        </p>
                        
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {loadingRole ? (
                                <button style={{ padding: '0.6rem 1.5rem', borderRadius: 10, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}>...</button>
                            ) : role === 'Guest' ? (
                                <button onClick={handleJoin} style={{ padding: '0.6rem 1.5rem', borderRadius: 10, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                                    Join Community
                                </button>
                            ) : (
                                <button style={{ padding: '0.6rem 1.5rem', borderRadius: 10, background: 'rgba(16,185,129,0.2)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 800, fontSize: '0.85rem', cursor: 'default' }}>
                                    ✓ Joined
                                </button>
                            )}
                            <button
                                onClick={async () => {
                                    const shareUrl = `${window.location.origin}/network/${community.slug}/join`;
                                    if (navigator.share) {
                                        try {
                                            await navigator.share({
                                                title: community.name,
                                                text: `Check out ${community.name} on Chavee!`,
                                                url: shareUrl,
                                            });
                                        } catch (err) {
                                            if (err.name !== 'AbortError') console.error('Share failed', err);
                                        }
                                    } else {
                                        navigator.clipboard.writeText(shareUrl);
                                        showToast('Link copied to clipboard!', 'success');
                                    }
                                }}
                                style={{ padding: '0.6rem 1rem', borderRadius: 10, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                            >
                                🔗 Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="hide-scrollbar" style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            background: 'none', border: 'none', padding: '0.75rem 0',
                            color: activeTab === tab ? 'var(--peacock-green)' : 'var(--text-muted)',
                            fontWeight: activeTab === tab ? 800 : 600,
                            fontSize: '0.9rem', cursor: 'pointer',
                            borderBottom: activeTab === tab ? '2px solid var(--peacock-green)' : '2px solid transparent',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div style={{ display: 'flex', gap: '2rem' }}>
                <div style={{ flex: 1 }}>
                    {activeTab === 'Home' && <HomeTab community={community} user={user} role={role} showToast={showToast} />}
                    {activeTab === 'Discussions' && <DiscussionsTab community={community} user={user} role={role} showToast={showToast} />}
                    {activeTab === 'Members' && <MembersTab community={community} />}
                    {activeTab === 'Resources' && <ResourcesTab community={community} role={role} showToast={showToast} />}
                    {activeTab === 'Events' && <EventsTab community={community} user={user} role={role} showToast={showToast} />}
                    {activeTab === 'About' && <AboutTab community={community} />}
                </div>

                {/* Right Rail (Desktop) */}
                <div style={{ width: 300, display: 'none', flexShrink: 0 }} className="desktop-rail">
                    <RightRail community={community} />
                </div>
            </div>

            <style>{`
                @media (min-width: 1024px) {
                    .desktop-rail { display: block !important; }
                }
            `}</style>
        </div>
    );
}

// ---------------------------------------------------------------------------
// SUB-TABS
// ---------------------------------------------------------------------------

function HomeTab({ community, user, role, showToast }) {
    const [posts, setPosts] = React.useState([]);
    const [loadingPosts, setLoadingPosts] = React.useState(true);
    const [content, setContent] = React.useState('');
    const [posting, setPosting] = React.useState(false);
    const [attachments, setAttachments] = React.useState([]);
    const fileInputRef = React.useRef(null);

    // Per-post "..." menu (Delete for the author, Report for everyone else)
    const [openMenuId, setOpenMenuId] = React.useState(null);
    // Report modal — holds the post being reported, or null when closed
    const [reportModalPost, setReportModalPost] = React.useState(null);
    const [reportReason, setReportReason] = React.useState('');
    const [submittingReport, setSubmittingReport] = React.useState(false);

    React.useEffect(() => {
        loadPosts();
    }, [community.id]);

    const loadPosts = async () => {
        setLoadingPosts(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, profiles(id, full_name, avatar_url, college, course, year_of_study)')
                .eq('community_id', community.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPosts(data || []);
        } catch (err) {
            console.error('Error loading posts:', err);
        } finally {
            setLoadingPosts(false);
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith('image/');
        const isAudio = file.type.startsWith('audio/');
        const bucket = isImage ? 'post-images' : (isAudio ? 'voice-notes' : 'post-attachments');
        
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;
            
            if (showToast) showToast(`Uploading ${file.name}...`, 'info');
            const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            
            setAttachments(prev => [...prev, {
                type: isImage ? 'image' : (isAudio ? 'audio' : 'document'),
                url: publicUrl,
                name: file.name
            }]);
            if (showToast) showToast('File attached', 'success');
        } catch (err) {
            console.error(err);
            if (showToast) showToast('Upload failed', 'error');
        }
    };

    const handlePost = async () => {
        if (!content.trim() && attachments.length === 0) return;
        setPosting(true);
        try {
            const { error } = await supabase
                .from('posts')
                .insert({
                    community_id: community.id,
                    user_id: user.id,
                    content: content.trim(),
                    attachments: attachments
                });
            if (error) throw error;

            setContent('');
            setAttachments([]);
            if (showToast) showToast('Posted successfully!', 'success');
            loadPosts();

            // post_id omitted — insert above has no .select() to fetch it back, and
            // community_id is the more useful field for a "recent activity" feed anyway.
            await logUserActivity(user.id, 'community_post', { community_id: community.id });
        } catch (err) {
            if (showToast) showToast('Failed to post', 'error');
        } finally {
            setPosting(false);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Delete this post? This cannot be undone.')) return;
        try {
            const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', user.id); // safety net — kept even though the button is already gated client-side
            if (error) throw error;

            setPosts(prev => prev.filter(p => p.id !== postId));
            if (showToast) showToast('Post deleted', 'success');
        } catch (err) {
            if (showToast) showToast(err.message || 'Failed to delete post', 'error');
        }
    };

    const handleSubmitReport = async () => {
        if (!reportModalPost || !reportReason.trim()) return;
        setSubmittingReport(true);
        try {
            const { error } = await supabase.from('reports_moderation').insert({
                reporter_id: user.id,
                reported_user_id: reportModalPost.user_id,
                post_id: reportModalPost.id,
                reason: reportReason.trim(),
                status: 'Pending'
            });
            if (error) throw error;

            if (showToast) showToast('Report submitted — our team will review it', 'success');
            setReportModalPost(null);
            setReportReason('');
        } catch (err) {
            if (showToast) showToast(err.message || 'Failed to submit report', 'error');
        } finally {
            setSubmittingReport(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--peacock-green)' }}>📌</span>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem' }}>Pinned Announcements</h4>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.1)' }}>
                    <h5 style={{ margin: '0 0 0.25rem', fontWeight: 800, fontSize: '0.9rem' }}>Welcome to {community.name}! 👋</h5>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Please read our community rules to keep this space positive and productive.</p>
                </div>
            </div>

            {role !== 'Guest' && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}>
                            {user?.user_metadata?.full_name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <textarea 
                                placeholder={`Share something with ${community.name}...`} 
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit' }} 
                            />
                            
                            {attachments.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {attachments.map((att, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
                                            {att.type === 'image' ? '🖼️' : att.type === 'audio' ? '🎤' : '📄'} {att.name}
                                            <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#10B981', cursor: 'pointer', padding: 0, marginLeft: '0.25rem' }}>×</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                                <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }} className="hover-lift">📎 Attach File</button>
                                <button onClick={handlePost} disabled={posting || (!content.trim() && attachments.length === 0)} style={{ marginLeft: 'auto', padding: '0.5rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: (posting || (!content.trim() && attachments.length === 0)) ? 'not-allowed' : 'pointer' }}>
                                    {posting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {loadingPosts ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading feed...</div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                        <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to share something!</p>
                    </div>
                ) : (
                    posts.map(post => {
                        const authorSubtitle = buildProfileSubtitle(post.profiles);
                        return (
                        <div key={post.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem', position: 'relative' }}>
                            {user && (
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                    <button
                                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem', padding: '0.15rem 0.4rem' }}
                                        title="More options"
                                    >
                                        ⋯
                                    </button>
                                    {openMenuId === post.id && (
                                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '0.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-md)', minWidth: 150, overflow: 'hidden', zIndex: 10 }}>
                                        {post.user_id === user.id ? (
                                            <button
                                                onClick={() => { setOpenMenuId(null); handleDeletePost(post.id); }}
                                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.9rem', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                                            >
                                                🗑️ Delete Post
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setOpenMenuId(null); setReportModalPost(post); }}
                                                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.9rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                                            >
                                                🚩 Report Post
                                            </button>
                                        )}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, backgroundImage: post.profiles?.avatar_url ? `url(${post.profiles.avatar_url})` : 'none', backgroundSize: 'cover' }}>
                                    {!post.profiles?.avatar_url && (post.profiles?.full_name ? post.profiles.full_name[0].toUpperCase() : '👤')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{post.profiles?.full_name || 'Anonymous User'}</div>
                                    {authorSubtitle && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{authorSubtitle}</div>
                                    )}
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(post.created_at).toLocaleString()}</div>
                                </div>
                            </div>

                            {post.content && (
                                <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>
                                    {post.content}
                                </p>
                            )}

                            {post.attachments && post.attachments.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                    {post.attachments.map((att, i) => (
                                        <div key={i}>
                                            {att.type === 'image' && <img src={att.url} alt="attachment" style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 12, border: '1px solid var(--border-color)' }} />}
                                            {att.type === 'audio' && <audio src={att.url} controls style={{ width: '100%', maxWidth: 400 }} />}
                                            {att.type === 'document' && (
                                                <a href={att.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-elevated)', padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none', color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
                                                    📄 Download {att.name || 'Document'}
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        );
                    })
                )}
            </div>

            {/* Report Post Modal */}
            {reportModalPost && (
                <div
                    onClick={() => { if (!submittingReport) { setReportModalPost(null); setReportReason(''); } }}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>Report Post</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Tell us why you're reporting this post. Our team will review it.
                        </p>
                        <textarea
                            value={reportReason}
                            onChange={e => setReportReason(e.target.value)}
                            placeholder="e.g. Spam, harassment, inappropriate content..."
                            rows={3}
                            disabled={submittingReport}
                            style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.88rem', resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => { setReportModalPost(null); setReportReason(''); }}
                                disabled={submittingReport}
                                style={{ padding: '0.55rem 1.1rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 600, cursor: submittingReport ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitReport}
                                disabled={submittingReport || !reportReason.trim()}
                                style={{ padding: '0.55rem 1.1rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: (submittingReport || !reportReason.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}
                            >
                                {submittingReport ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DiscussionsTab({ community, user, role, showToast }) {
    const [channels, setChannels] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreate, setShowCreate] = React.useState(false);
    const [formData, setFormData] = React.useState({ name: '', description: '', rules: '', is_event_channel: false, event_deadline: '' });
    const [saving, setSaving] = React.useState(false);

    // Which channel is currently open (in-file view state, not a new route — see report)
    const [selectedChannel, setSelectedChannel] = React.useState(null);
    const [openingChannelId, setOpeningChannelId] = React.useState(null);

    // Delete-authority check — same admins-table + Set pattern already proven in Dashboard.jsx
    const [adminIds, setAdminIds] = React.useState(new Set());

    React.useEffect(() => {
        loadChannels();
    }, [community.id]);

    React.useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const { data, error } = await supabase.from('admins').select('user_id');
                if (error) throw error;
                if (data) setAdminIds(new Set(data.map(a => a.user_id)));
            } catch (err) {
                console.error('Failed to load admin IDs:', err);
            }
        };
        fetchAdmins();
    }, []);

    const loadChannels = async () => {
        try {
            const { data, error } = await supabase
                .from('community_channels')
                .select('*')
                .eq('community_id', community.id)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const now = new Date();
            const allChannels = data || [];
            const isExpired = c => c.is_event_channel && c.event_deadline && new Date(c.event_deadline) < now;

            const expired = allChannels.filter(isExpired);
            const active = allChannels.filter(c => !isExpired(c));

            // Lazy cleanup — fire-and-forget, doesn't block rendering. This only runs the next
            // time someone loads this tab after a deadline passes (not a background job), and
            // the RPC itself only succeeds if the caller is the channel's creator or an admin —
            // if neither is present when this fires, the channel still disappears from THIS
            // view (filtered out below) but the DB row won't actually be removed until someone
            // authorized loads the tab.
            expired.forEach(c => {
                supabase.rpc('delete_channel', { p_channel_id: c.id }).catch(err => {
                    console.error(`Failed to auto-remove expired channel ${c.id}:`, err);
                });
            });

            setChannels(active);
        } catch (err) {
            console.error('Error loading channels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!user || role === 'Guest') {
            showToast('You must be a member to create a channel.', 'error');
            return;
        }
        if (!formData.name.trim()) {
            showToast('Channel name is required', 'error');
            return;
        }

        setSaving(true);
        try {
            const { data, error } = await supabase
                .from('community_channels')
                .insert({
                    community_id: community.id,
                    created_by: user.id,
                    name: formData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                    description: formData.description.trim(),
                    rules: formData.rules.trim() || null,
                    is_event_channel: formData.is_event_channel,
                    event_deadline: formData.is_event_channel ? (formData.event_deadline || null) : null
                })
                .select('*')
                .single();

            if (error) throw error;

            // Auto-join the creator so they're a real participant, not just DB owner via created_by —
            // same join_channel RPC used when opening any channel. Non-fatal if this fails; the
            // channel itself was still created successfully.
            try {
                await supabase.rpc('join_channel', { p_channel_id: data.id });
            } catch (joinErr) {
                console.error('Failed to auto-join created channel:', joinErr);
            }

            showToast('Channel created successfully!', 'success');
            setShowCreate(false);
            setFormData({ name: '', description: '', rules: '', is_event_channel: false, event_deadline: '' });
            setChannels(prev => [...prev, data]); // append locally — no manual refresh needed
        } catch (err) {
            showToast('Failed to create channel: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleOpenChannel = async (channel) => {
        setOpeningChannelId(channel.id);
        try {
            const { data: conversationId, error } = await supabase.rpc('join_channel', { p_channel_id: channel.id });
            if (error) throw error;
            setSelectedChannel({ ...channel, conversation_id: conversationId });
        } catch (err) {
            showToast('Failed to open channel: ' + err.message, 'error');
        } finally {
            setOpeningChannelId(null);
        }
    };

    const handleDeleteChannel = async (channelId, channelName, e) => {
        e.stopPropagation();
        if (!window.confirm(`Are you sure you want to delete the #${channelName} channel? This cannot be undone.`)) return;

        try {
            const { error } = await supabase.rpc('delete_channel', { p_channel_id: channelId });
            if (error) throw error;

            setChannels(prev => prev.filter(c => c.id !== channelId)); // remove locally, no reload
            if (showToast) showToast('Channel deleted.', 'success');
        } catch (err) {
            console.error('Delete error:', err);
            if (showToast) showToast('Failed to delete channel: ' + err.message, 'error');
        }
    };

    if (selectedChannel) {
        return (
            <ChannelDetailView
                channel={selectedChannel}
                user={user}
                showToast={showToast}
                onBack={() => setSelectedChannel(null)}
            />
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem' }}>Discussion Channels</h3>
                {role !== 'Guest' && (
                    <button 
                        onClick={() => setShowCreate(!showCreate)}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                        {showCreate ? 'Cancel' : '+ Create Channel'}
                    </button>
                )}
            </div>

            {showCreate && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                    <h4 style={{ margin: '0 0 1rem', fontWeight: 800 }}>Create New Channel</h4>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>Channel Name *</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. general, help, off-topic"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                disabled={saving}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="What is this channel about?"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>Rules / Guidelines</label>
                            <textarea
                                value={formData.rules}
                                onChange={(e) => setFormData({...formData, rules: e.target.value})}
                                placeholder="Optional — any specific rules for this channel"
                                rows={3}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_event_channel}
                                    onChange={(e) => setFormData({...formData, is_event_channel: e.target.checked, event_deadline: e.target.checked ? formData.event_deadline : ''})}
                                    disabled={saving}
                                />
                                Is this about a specific event?
                            </label>
                        </div>
                        {formData.is_event_channel && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>Auto-remove this channel on</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={formData.event_deadline}
                                    onChange={(e) => setFormData({...formData, event_deadline: e.target.value})}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                                    disabled={saving}
                                />
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button type="submit" disabled={saving} style={{ padding: '0.6rem 1.5rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                                {saving ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading channels...</div>
            ) : channels.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                    <p style={{ color: 'var(--text-muted)' }}>No channels created yet.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {channels.map(channel => {
                        const canDelete = channel.created_by === user?.id || (!!user && adminIds.has(user.id));
                        return (
                        <div
                            key={channel.id}
                            onClick={() => { if (openingChannelId !== channel.id) handleOpenChannel(channel); }}
                            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s', position: 'relative', opacity: openingChannelId === channel.id ? 0.6 : 1 }}
                            className="hover-lift"
                        >
                            {canDelete && (
                                <button
                                    onClick={(e) => handleDeleteChannel(channel.id, channel.name, e)}
                                    style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
                                    title="Delete Channel"
                                >
                                    🗑️
                                </button>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>#</span>
                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>{channel.name}</h4>
                            </div>
                            {channel.description && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{channel.description}</p>}
                            {channel.is_event_channel && channel.event_deadline && (
                                <span style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    ⏳ Ends {new Date(channel.event_deadline).toLocaleString()}
                                </span>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// Channel detail view — messages scoped to a channel's conversation_id, reusing the exact
// proven insert shape from Messages.jsx (handleSend) and the join_channel RPC pattern
// modeled on ConnectPeersTab.jsx's start_direct_conversation call.
function ChannelDetailView({ channel, user, showToast, onBack }) {
    const conversationId = channel.conversation_id;

    const [messages, setMessages] = React.useState([]);
    const [loadingMessages, setLoadingMessages] = React.useState(true);
    const [content, setContent] = React.useState('');
    const [sending, setSending] = React.useState(false);
    const [participantCount, setParticipantCount] = React.useState(0);
    const [leaving, setLeaving] = React.useState(false);

    React.useEffect(() => {
        loadMessages();
        loadParticipantCount();
    }, [conversationId]);

    const loadMessages = async () => {
        setLoadingMessages(true);
        try {
            // 1. Fetch messages — messages.sender_id has no FK to profiles (it points to
            // auth.users), so a nested-select embed (.select('*, profiles(...)')) can't work
            // here. Same two-step fetch-then-merge pattern as MembersTab in this file.
            const { data: msgData, error: msgErr } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });
            if (msgErr) throw msgErr;

            if (!msgData || msgData.length === 0) {
                setMessages([]);
                return;
            }

            // 2. Fetch profiles
            const senderIds = [...new Set(msgData.map(m => m.sender_id))];
            const { data: profData, error: profErr } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, college, course, year_of_study')
                .in('id', senderIds);

            if (profErr) console.warn('Error fetching profiles:', profErr);

            const profilesMap = {};
            (profData || []).forEach(p => { profilesMap[p.id] = p; });

            const combined = msgData.map(m => ({
                ...m,
                profile: profilesMap[m.sender_id] || {}
            }));

            setMessages(combined);
        } catch (err) {
            console.error('Error loading channel messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    const loadParticipantCount = async () => {
        try {
            const { count, error } = await supabase
                .from('conversation_participants')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conversationId);
            if (error) throw error;
            setParticipantCount(count || 0);
        } catch (err) {
            console.error('Error loading channel participant count:', err);
        }
    };

    const handleSend = async () => {
        if (!content.trim() || sending) return;
        setSending(true);
        try {
            // Exact proven shape from Messages.jsx's handleSend — no extra fields, matching
            // the real messages table (id, conversation_id, sender_id, content, file_url, created_at).
            // No .select('*, profiles(...)') here either — same FK gap as loadMessages, so we
            // just reload the feed afterward (same pattern HomeTab's handlePost already uses).
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user.id,
                    content: content.trim(),
                    file_url: null
                });
            if (error) throw error;

            setContent('');
            loadMessages();
        } catch (err) {
            if (showToast) showToast('Failed to send message: ' + err.message, 'error');
        } finally {
            setSending(false);
        }
    };

    const handleLeaveChannel = async () => {
        if (!window.confirm(`Leave #${channel.name}?`)) return;
        setLeaving(true);
        try {
            const { error } = await supabase
                .from('conversation_participants')
                .delete()
                .eq('conversation_id', conversationId)
                .eq('user_id', user.id); // safety net — same self-delete pattern as the post-delete fix
            if (error) throw error;
            if (showToast) showToast('You left the channel.', 'success');
            onBack();
        } catch (err) {
            if (showToast) showToast('Failed to leave channel: ' + err.message, 'error');
        } finally {
            setLeaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <button
                    onClick={onBack}
                    style={{ background: 'none', border: 'none', color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', padding: 0, marginBottom: '0.75rem' }}
                >
                    ← Back to Discussions
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontWeight: 800, fontSize: '1.25rem' }}># {channel.name}</h3>
                        {channel.description && <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{channel.description}</p>}
                        <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {participantCount} {participantCount === 1 ? 'member' : 'members'}
                        </p>
                        {channel.is_event_channel && channel.event_deadline && (
                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#F59E0B', fontWeight: 700 }}>
                                ⏳ This channel auto-removes on {new Date(channel.event_deadline).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleLeaveChannel}
                        disabled={leaving}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-color)', color: '#EF4444', fontWeight: 700, fontSize: '0.8rem', cursor: leaving ? 'not-allowed' : 'pointer' }}
                    >
                        {leaving ? 'Leaving...' : 'Leave Channel'}
                    </button>
                </div>
                {channel.rules && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Rules / Guidelines</p>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{channel.rules}</p>
                    </div>
                )}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem', minHeight: 300 }}>
                {loadingMessages ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No discussions yet — start the first one</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {messages.map(msg => {
                            const subtitle = buildProfileSubtitle(msg.profile);
                            return (
                                <div key={msg.id} style={{ display: 'flex', gap: '0.75rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0, backgroundImage: msg.profile?.avatar_url ? `url(${msg.profile.avatar_url})` : 'none', backgroundSize: 'cover' }}>
                                        {!msg.profile?.avatar_url && (msg.profile?.full_name ? msg.profile.full_name[0].toUpperCase() : '👤')}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{msg.profile?.full_name || 'Anonymous User'}</span>
                                            {subtitle && <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{subtitle}</span>}
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(msg.created_at).toLocaleString()}</span>
                                        </div>
                                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                    type="text"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !sending) handleSend(); }}
                    placeholder={`Message #${channel.name}`}
                    disabled={sending}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !content.trim()}
                    style={{ padding: '0.75rem 1.5rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: (sending || !content.trim()) ? 'not-allowed' : 'pointer' }}
                >
                    {sending ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
}

function MembersTab({ community }) {
    const [members, setMembers] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        async function fetchMembers() {
            setLoading(true);
            try {
                // 1. Fetch community members
                const { data: memData, error: memErr } = await supabase
                    .from('community_members')
                    .select('*')
                    .eq('community_id', community.id);
                if (memErr) throw memErr;

                if (!memData || memData.length === 0) {
                    setMembers([]);
                    return;
                }

                // 2. Fetch profiles
                const userIds = memData.map(m => m.user_id);
                const { data: profData, error: profErr } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, college, course, year_of_study')
                    .in('id', userIds);
                
                if (profErr) console.warn('Error fetching profiles:', profErr);

                const profilesMap = {};
                (profData || []).forEach(p => { profilesMap[p.id] = p; });

                const combined = memData.map(m => ({
                    ...m,
                    profile: profilesMap[m.user_id] || {}
                }));

                setMembers(combined);
            } catch (err) {
                console.error("Error loading members:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMembers();
    }, [community.id]);

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1.5rem', fontWeight: 800, fontSize: '1.1rem' }}>Members ({community.member_count || members.length})</h3>
            
            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading members...</div>
            ) : members.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No members found.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                    {members.map(m => (
                        <div key={m.id || m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', backgroundImage: m.profile?.avatar_url ? `url(${m.profile.avatar_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                {!m.profile?.avatar_url && (m.profile?.full_name ? m.profile.full_name[0].toUpperCase() : '👤')}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h4 style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                                    {m.profile?.full_name || 'Anonymous User'}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {buildProfileSubtitle(m.profile) || 'Member'}
                                    </span>
                                    {m.role === 'Admin' && <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.15)', color: '#10B981', padding: '0.15rem 0.4rem', borderRadius: 6, fontWeight: 800 }}>ADMIN</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ResourcesTab({ community, role, showToast }) {
    return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>Resources Coming Soon</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                We're building a centralized hub for community documents, links, and files. Check back later!
            </p>
        </div>
    );

    // Original implementation preserved below for MVP phase-out
    /*
    const [resources, setResources] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showUpload, setShowUpload] = React.useState(false);
    const [formData, setFormData] = React.useState({ title: '', url: '', type: 'Document' });
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        loadResources();
    }, [community.id]);

    const loadResources = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('community_resources')
                .select('*')
                .eq('community_id', community.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            setResources(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('community_resources')
                .insert({
                    community_id: community.id,
                    title: formData.title,
                    url: formData.url,
                    type: formData.type
                });
            if (error) throw error;
            if (showToast) showToast('Resource added successfully!', 'success');
            setShowUpload(false);
            setFormData({ title: '', url: '', type: 'Document' });
            loadResources();
        } catch (err) {
            if (showToast) showToast('Failed to add resource', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Community Resources</h3>
                {role !== 'Guest' && (
                    <button onClick={() => setShowUpload(!showUpload)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                        {showUpload ? 'Cancel' : '+ Add Resource'}
                    </button>
                )}
            </div>

            {showUpload && (
                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 12, marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input required placeholder="Resource Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                        <input required type="url" placeholder="URL Link" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                            <option>Document</option>
                            <option>Video</option>
                            <option>Link</option>
                        </select>
                        <button type="submit" disabled={saving} style={{ padding: '0.5rem', background: 'var(--peacock-green)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'Saving...' : 'Save Resource'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading resources...</div>
            ) : resources.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No resources uploaded yet.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {resources.map(r => (
                        <a key={r.id} href={r.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', textDecoration: 'none', color: 'inherit' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(16,185,129,0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                {r.type === 'Video' ? '🎬' : r.type === 'Document' ? '📄' : '🔗'}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 0.2rem', fontWeight: 700, fontSize: '0.95rem' }}>{r.title}</h4>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.type}</span>
                            </div>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
    */
}

function EventsTab({ community, user, role, showToast }) {
    return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.25rem' }}>Events Coming Soon</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: 400, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                We're redesigning community events. This feature will be back once it's ready.
            </p>
        </div>
    );

    // Original implementation preserved below for MVP phase-out
    /*
    const [events, setEvents] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [showCreate, setShowCreate] = React.useState(false);
    const [formData, setFormData] = React.useState({ title: '', event_date: '', location: '', description: '', meeting_link: '', category: '' });
    const [saving, setSaving] = React.useState(false);

    React.useEffect(() => {
        loadEvents();
    }, [community.id]);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('community_id', community.id)
                .order('event_date', { ascending: true });
            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await supabase
                .from('events')
                .insert({
                    community_id: community.id,
                    organizer_id: user.id,
                    title: formData.title,
                    category: formData.category.trim() || 'General',
                    event_date: formData.event_date,
                    location: formData.location,
                    description: formData.description,
                    meeting_link: formData.meeting_link,
                    status: 'upcoming'
                });
            if (error) throw error;
            if (showToast) showToast('Event created successfully!', 'success');
            setShowCreate(false);
            setFormData({ title: '', event_date: '', location: '', description: '', meeting_link: '', category: '' });
            loadEvents();
        } catch (err) {
            if (showToast) showToast('Failed to create event', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Upcoming Events</h3>
                {role !== 'Guest' && (
                    <button onClick={() => setShowCreate(!showCreate)} style={{ padding: '0.4rem 0.8rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}>
                        {showCreate ? 'Cancel' : '+ Create Event'}
                    </button>
                )}
            </div>

            {showCreate && (
                <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 12, marginBottom: '1rem', border: '1px solid var(--border-color)' }}>
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input required placeholder="Event Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                        <input placeholder="Event Type (e.g. Live Class, Meeting, Offline Meetup)" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                        <input required type="datetime-local" value={formData.event_date} onChange={e => setFormData({...formData, event_date: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                        <input required placeholder="Location (e.g. Zoom, New York)" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                        <input placeholder="Event Link (optional)" type="url" value={formData.meeting_link} onChange={e => setFormData({...formData, meeting_link: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                        <textarea required placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} rows={3} />
                        <button type="submit" disabled={saving} style={{ padding: '0.5rem', background: 'var(--peacock-green)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'Saving...' : 'Create Event'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</div>
            ) : events.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px dashed var(--border-color)' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No upcoming events scheduled.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {events.map(e => (
                        <div key={e.id} style={{ padding: '1.25rem', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{e.title}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>📅 {new Date(e.event_date).toLocaleString()}</span>
                                        {e.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>📍 {e.location}</span>}
                                    </div>
                                </div>
                            </div>
                            {e.description && <p style={{ margin: '1rem 0 0', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{e.description}</p>}
                            {e.meeting_link && (
                                <a href={e.meeting_link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '1rem', padding: '0.4rem 1rem', background: 'var(--peacock-green)', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>
                                    Join Event
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
    */
}

function AboutTab({ community }) {
    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '1rem' }}>About {community.name}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{community.description}</p>
            </div>
            <div>
                <h4 style={{ margin: '0 0 0.5rem', fontWeight: 800, fontSize: '0.9rem' }}>Rules & Guidelines</h4>
                {community.guidelines ? (
                    <div style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                        {community.guidelines}
                    </div>
                ) : (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <li>Be respectful to all members.</li>
                        <li>No spam or self-promotion.</li>
                        <li>Keep discussions relevant to the community topic.</li>
                    </ul>
                )}
            </div>
            <div style={{ display: 'flex', gap: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>Created On</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>15 Jan 2024</div>
                </div>
                <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.2rem' }}>Location</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Global</div>
                </div>
            </div>
        </div>
    );
}

function RightRail({ community }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Admins */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontWeight: 800, fontSize: '0.95rem' }}>Admins</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gradient-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>R</div>
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Rahul Kumar ✓</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Admin</div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Top Contributors */}
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.25rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontWeight: 800, fontSize: '0.95rem' }}>Top Contributors <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600 }}>(This Month)</span></h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>A</div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Arjun Pillai</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)' }}>1,250 XP 👑</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
