import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../supabaseClient.js';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

/* ─────────────────────────────────────────────
   STYLE TOKENS  (Light Theme)
───────────────────────────────────────────── */
const S = {
    page:    { animation: 'fadeInUp 0.3s ease-out' },
    surface: {
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
    },
    toolbar: {
        display: 'flex', alignItems: 'center',
        gap: '0.65rem', padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
    },
    searchInput: {
        background: 'var(--bg-base)',
        border: '1px solid var(--border-color)',
        borderRadius: 9, color: 'var(--text-primary)',
        padding: '0.55rem 0.9rem', fontSize: '0.855rem',
        outline: 'none', minWidth: 240, fontFamily: 'inherit',
        transition: 'border-color 0.2s',
    },
    filterBtn: (active) => ({
        padding: '0.45rem 0.9rem', borderRadius: 20,
        background: active ? 'var(--peacock-green)' : 'var(--bg-elevated)',
        color: active ? '#fff' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'var(--peacock-green)' : 'var(--border-color)'}`,
        fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
        transition: 'all 0.18s', whiteSpace: 'nowrap',
    }),
};

/* ─────────────────────────────────────────────
   INLINE TOAST
───────────────────────────────────────────── */
function Toast({ msg, type }) {
    if (!msg) return null;
    const isErr = type === 'error';
    return (
        <div style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 99999,
            background: isErr ? 'rgba(30,15,15,0.97)' : 'rgba(15,30,25,0.97)',
            border: `1px solid ${isErr ? 'var(--accent-coral)' : 'var(--border-mint)'}`,
            borderRadius: 12, padding: '0.9rem 1.4rem', color: 'var(--text-primary)',
            fontSize: '0.875rem', fontWeight: 600,
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeInUp 0.3s ease-out',
        }}>{msg}</div>
    );
}

/* ─────────────────────────────────────────────
   FEATURE TOGGLE BUTTON
───────────────────────────────────────────── */
function FeatureToggle({ isFeatured, busy, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            disabled={busy}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={isFeatured ? 'Currently featured — click to unfeature' : 'Set as featured post'}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.35rem 0.75rem', borderRadius: 20,
                cursor: busy ? 'not-allowed' : 'pointer',
                fontWeight: 700, fontSize: '0.75rem',
                transition: 'all 0.2s',
                background: isFeatured
                    ? 'rgba(245,158,11,0.08)'
                    : hovered ? 'rgba(245,158,11,0.05)' : 'var(--bg-elevated)',
                color: isFeatured ? 'var(--accent-gold)' : hovered ? 'var(--accent-gold)' : 'var(--text-muted)',
                border: `1px solid ${isFeatured ? 'rgba(245,158,11,0.25)' : hovered ? 'rgba(245,158,11,0.18)' : 'var(--border-color)'}`,
                opacity: busy ? 0.55 : 1,
            }}
        >
            {busy ? (
                <span style={{
                    width: 12, height: 12, border: '2px solid currentColor',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }} />
            ) : (
                <span style={{ fontSize: '0.85rem' }}>{isFeatured ? '⭐' : '☆'}</span>
            )}
            {isFeatured ? 'Featured' : 'Feature'}
        </button>
    );
}

/* ─────────────────────────────────────────────
   POST CARD  (feed row)
───────────────────────────────────────────── */
function PostCard({ post, onFeature, onDelete, featuringId, deletingId, adminIds }) {
    const isAdminPost = post.user_id && adminIds?.has(post.user_id);
    const author    = isAdminPost ? 'Chavee Team' : (post.profiles?.full_name || post.profiles?.username || 'Unknown');
    const initial   = isAdminPost ? 'C' : (author[0]?.toUpperCase() || '?');
    const community = post.communities?.name || null;
    const content   = post.content || '';
    const preview   = content.length > 200 ? content.slice(0, 200) + '…' : content;
    const likes     = post.post_likes?.[0]?.count  ?? 0;
    const comments  = post.post_comments?.[0]?.count ?? 0;
    const date      = post.created_at
        ? new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
        : '—';
    const time      = post.created_at
        ? new Date(post.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : '';

    const isFeatureBusy = featuringId === post.id;
    const isDeleteBusy  = deletingId  === post.id;

    return (
        <div style={{
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: '36px 1fr auto',
            gap: '0.85rem',
            alignItems: 'flex-start',
            transition: 'background 0.15s',
            background: post.is_featured ? 'rgba(245,158,11,0.02)' : 'transparent',
        }}
            onMouseEnter={e => { if (!post.is_featured) e.currentTarget.style.background = 'var(--bg-elevated)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = post.is_featured ? 'rgba(245,158,11,0.02)' : 'transparent'; }}
        >
            {/* Author avatar */}
            <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: 'var(--gradient-brand)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', fontWeight: 800, color: '#fff',
            }}>{initial}</div>

            {/* Body */}
            <div style={{ minWidth: 0 }}>
                {/* Meta row */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.35rem',
                }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center' }}>
                        {author}
                        {isAdminPost && (
                            <span style={{
                                padding: '0.1rem 0.4rem',
                                borderRadius: 4,
                                background: 'var(--bg-mint)',
                                color: 'var(--peacock-green)',
                                border: '1px solid var(--border-mint)',
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                marginLeft: '0.45rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.15rem'
                            }}>
                                ✓ Official
                            </span>
                        )}
                    </span>

                    {community && (
                        <span style={{
                            padding: '0.1rem 0.5rem', borderRadius: 20,
                            background: 'var(--bg-mint)', color: 'var(--peacock-green)',
                            fontSize: '0.7rem', fontWeight: 700,
                            border: '1px solid var(--border-mint)',
                        }}>
                            🤝 {community}
                        </span>
                    )}

                    {post.is_featured && (
                        <span style={{
                            padding: '0.1rem 0.5rem', borderRadius: 20,
                            background: 'rgba(245,158,11,0.08)', color: 'var(--accent-gold)',
                            fontSize: '0.7rem', fontWeight: 800,
                            border: '1px solid rgba(245,158,11,0.25)',
                        }}>
                            ⭐ Featured
                        </span>
                    )}

                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginLeft: 'auto' }}>
                        {date} · {time}
                    </span>
                </div>

                {/* Content preview */}
                <p style={{
                    margin: '0 0 0.5rem',
                    fontSize: '0.855rem', color: 'var(--text-secondary)',
                    lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                    {preview || <em style={{ color: 'var(--text-muted)' }}>(no content)</em>}
                </p>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        ❤️ <strong style={{ color: 'var(--text-secondary)' }}>{likes}</strong> like{likes !== 1 ? 's' : ''}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        💬 <strong style={{ color: 'var(--text-secondary)' }}>{comments}</strong> comment{comments !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div style={{
                display: 'flex', flexDirection: 'column',
                gap: '0.4rem', alignItems: 'flex-end', flexShrink: 0,
            }}>
                <FeatureToggle
                    isFeatured={post.is_featured}
                    busy={isFeatureBusy}
                    onClick={() => onFeature(post)}
                />
                <button
                    onClick={() => onDelete(post)}
                    disabled={isDeleteBusy}
                    style={{
                        padding: '0.35rem 0.75rem', borderRadius: 7,
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#EF4444', fontWeight: 600, fontSize: '0.75rem',
                        cursor: isDeleteBusy ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.35rem',
                        opacity: isDeleteBusy ? 0.5 : 1, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isDeleteBusy) e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                >
                    {isDeleteBusy ? (
                        <span style={{
                            width: 12, height: 12, border: '2px solid #EF4444',
                            borderTopColor: 'transparent', borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite', display: 'inline-block',
                        }} />
                    ) : '🗑'}
                    Remove
                </button>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   SKELETON ROW
───────────────────────────────────────────── */
function SkeletonRow() {
    return (
        <div style={{
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'grid', gridTemplateColumns: '36px 1fr auto',
            gap: '0.85rem', alignItems: 'flex-start',
        }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', animation: 'pulse 1.4s infinite' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ height: 13, width: '35%', background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse 1.4s infinite' }} />
                <div style={{ height: 12, width: '80%', background: 'var(--bg-elevated)', borderRadius: 6, animation: 'pulse 1.4s infinite' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
                <div style={{ height: 28, width: 90, background: 'var(--bg-elevated)', borderRadius: 20, animation: 'pulse 1.4s infinite' }} />
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────── */
function Pagination({ page, total, pageSize, onChange }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;

    const btn = (label, disabled, active, onClick) => (
        <button
            key={label}
            onClick={onClick}
            disabled={disabled}
            style={{
                minWidth: 34, height: 34, borderRadius: 8,
                border: '1px solid var(--border-color)',
                background: active ? 'var(--peacock-green)' : 'var(--bg-surface)',
                color: active ? '#fff' : disabled ? 'var(--text-muted)' : 'var(--peacock-green)',
                fontWeight: 600, fontSize: '0.82rem',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1, transition: 'all 0.15s',
                padding: '0 0.5rem',
            }}
        >
            {label}
        </button>
    );

    const pages = [];
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end   = Math.min(totalPages, start + 4);
    for (let p = start; p <= end; p++) pages.push(p);

    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border-color)',
            flexWrap: 'wrap', gap: '0.5rem',
        }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Page {page} of {totalPages} ({total} post{total !== 1 ? 's' : ''})
            </span>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {btn('«', page === 1, false, () => onChange(1))}
                {btn('‹', page === 1, false, () => onChange(page - 1))}
                {pages.map(p => btn(p, false, p === page, () => onChange(p)))}
                {btn('›', page === totalPages, false, () => onChange(page + 1))}
                {btn('»', page === totalPages, false, () => onChange(totalPages))}
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const PAGE_SIZE = 15;

export default function PostsManager() {
    const [posts, setPosts]         = useState([]);
    const [total, setTotal]         = useState(0);
    const [loading, setLoading]     = useState(true);

    const [search, setSearch]       = useState('');
    const [filter, setFilter]       = useState('all');   // 'all' | 'featured'
    const [page, setPage]           = useState(1);

    const [featuringId, setFeaturingId] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingId, setDeletingId]   = useState(null);
    const [adminIds, setAdminIds]       = useState(new Set());
    const [communities, setCommunities] = useState([]);
    const [selectedCommunityId, setSelectedCommunityId] = useState('all');

    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const showToast = (msg, type = 'success') => {
        clearTimeout(toastTimer.current);
        setToast({ msg, type });
        toastTimer.current = setTimeout(() => setToast(null), 3500);
    };

    /* ── Fetch posts ── */
    const load = useCallback(async (pg = 1, q = '', f = 'all', commId = 'all') => {
        setLoading(true);

        let query = supabase
            .from('posts')
            .select(
                `id, content, created_at, is_featured, user_id, community_id,
                 profiles(full_name, username),
                 communities(name),
                 post_likes(count),
                 post_comments(count)`,
                { count: 'exact' }
            )
            .order('created_at', { ascending: false })
            .range((pg - 1) * PAGE_SIZE, pg * PAGE_SIZE - 1);

        if (f === 'featured') query = query.eq('is_featured', true);
        if (commId !== 'all') {
            if (commId === 'global') {
                query = query.is('community_id', null);
            } else {
                query = query.eq('community_id', commId);
            }
        }
        if (q.trim()) query = query.ilike('content', `%${q.trim()}%`);

        const { data, count, error } = await query;

        if (error) {
            showToast('Failed to load posts: ' + error.message, 'error');
            setLoading(false);
            return;
        }

        setPosts(data ?? []);
        setTotal(count ?? 0);
        setLoading(false);
    }, []);

    useEffect(() => { load(page, search, filter, selectedCommunityId); }, [page, filter, selectedCommunityId]);

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const { data, error } = await supabase.from('admins').select('user_id');
                if (error) throw error;
                if (data) {
                    setAdminIds(new Set(data.map(a => a.user_id)));
                }
            } catch (err) {
                console.error('Failed to load admin IDs:', err);
            }
        };
        const fetchCommunities = async () => {
            try {
                const { data, error } = await supabase
                    .from('communities')
                    .select('id, name')
                    .order('name', { ascending: true });
                if (error) throw error;
                setCommunities(data || []);
            } catch (err) {
                console.error('Failed to load communities:', err);
            }
        };
        fetchAdmins();
        fetchCommunities();
    }, []);

    /* ── Search handler (reset page) ── */
    const handleSearch = (val) => {
        setSearch(val);
        setPage(1);
        load(1, val, filter, selectedCommunityId);
    };

    /* ── Filter handler (reset page) ── */
    const handleFilter = (f) => {
        setFilter(f);
        setPage(1);
    };

    /* ── Community Filter handler (reset page) ── */
    const handleCommunityChange = (commId) => {
        setSelectedCommunityId(commId);
        setPage(1);
    };

    /* ── Feature / Unfeature ── */
    const handleFeature = async (post) => {
        setFeaturingId(post.id);

        if (post.is_featured) {
            const { error } = await supabase
                .from('posts')
                .update({ is_featured: false })
                .eq('id', post.id);

            setFeaturingId(null);
            if (error) { showToast('Failed: ' + error.message, 'error'); return; }
            showToast('Post unfeatured.');
        } else {
            // Clear existing featured post in the same scope (community or global)
            if (post.community_id) {
                await supabase
                    .from('posts')
                    .update({ is_featured: false })
                    .eq('is_featured', true)
                    .eq('community_id', post.community_id);
            } else {
                await supabase
                    .from('posts')
                    .update({ is_featured: false })
                    .eq('is_featured', true)
                    .is('community_id', null);
            }

            const { error } = await supabase
                .from('posts')
                .update({ is_featured: true })
                .eq('id', post.id);

            setFeaturingId(null);
            if (error) { showToast('Failed: ' + error.message, 'error'); return; }
            showToast('⭐ Post is now featured!');
        }

        load(page, search, filter, selectedCommunityId);
    };

    /* ── Delete ── */
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.id);

        // Delete likes and comments first to avoid FK issues (best-effort)
        await supabase.from('post_likes').delete().eq('post_id', deleteTarget.id);
        await supabase.from('post_comments').delete().eq('post_id', deleteTarget.id);

        const { error } = await supabase.from('posts').delete().eq('id', deleteTarget.id);

        setDeletingId(null);
        setDeleteTarget(null);

        if (error) { showToast('Delete failed: ' + error.message, 'error'); return; }
        showToast('🗑️ Post removed.');
        load(page, search, filter, selectedCommunityId);
    };

    const featuredCount = posts.filter(p => p.is_featured).length;

    return (
        <div style={S.page}>
            <Toast msg={toast?.msg} type={toast?.type} />

            {/* ── Page header ── */}
            <div style={{
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
            }}>
                <div>
                    <h1 style={{ margin: '0 0 0.3rem', fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        📝 Posts
                    </h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {loading ? 'Loading…' : `${total.toLocaleString('en-IN')} post${total !== 1 ? 's' : ''} platform-wide`}
                        {!loading && filter === 'all' && (
                            <span style={{ marginLeft: '0.5rem', color: 'var(--accent-gold)' }}>
                                · {featuredCount > 0 ? '⭐ 1 featured' : 'no post featured'}
                            </span>
                        )}
                    </p>
                </div>

                {/* Featured info banner */}
                <div style={{
                    padding: '0.55rem 1rem', borderRadius: 10,
                    background: 'rgba(245,158,11,0.06)',
                    border: '1px solid rgba(245,158,11,0.25)',
                    fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                    ⭐ Only one post can be featured at a time
                </div>
            </div>

            {/* ── Feed surface ── */}
            <div style={S.surface}>

                {/* Toolbar */}
                <div style={S.toolbar}>
                    <input
                        type="text"
                        placeholder="Search post content…"
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        style={S.searchInput}
                        onFocus={e => e.target.style.borderColor = 'var(--peacock-green)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                    />

                    {search && (
                        <button
                            onClick={() => handleSearch('')}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-coral)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                        >
                            ✕ Clear
                        </button>
                    )}

                    <select
                        value={selectedCommunityId}
                        onChange={e => handleCommunityChange(e.target.value)}
                        style={{
                            background: 'var(--bg-base)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 9, color: 'var(--text-primary)',
                            padding: '0.55rem 0.9rem', fontSize: '0.855rem',
                            outline: 'none', minWidth: 200, fontFamily: 'inherit',
                            transition: 'border-color 0.2s',
                        }}
                    >
                        <option value="all">All Communities & Global</option>
                        <option value="global">Global Feed Only</option>
                        {communities.map(c => (
                            <option key={c.id} value={c.id}>🤝 {c.name}</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                        <button onClick={() => handleFilter('all')}      style={S.filterBtn(filter === 'all')}>All Posts</button>
                        <button onClick={() => handleFilter('featured')} style={S.filterBtn(filter === 'featured')}>⭐ Featured</button>
                    </div>
                </div>

                {/* Feed rows */}
                <div>
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : posts.length === 0 ? (
                        <div style={{
                            padding: '3rem', textAlign: 'center',
                            color: 'var(--text-muted)', fontSize: '0.875rem',
                        }}>
                            {filter === 'featured'
                                ? 'No featured post yet — use the ☆ Feature button on any post.'
                                : search
                                    ? `No posts match "${search}".`
                                    : 'No posts yet on the platform.'}
                        </div>
                    ) : posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            onFeature={handleFeature}
                            onDelete={p => setDeleteTarget(p)}
                            featuringId={featuringId}
                            deletingId={deletingId}
                            adminIds={adminIds}
                        />
                    ))}
                </div>

                {/* Pagination */}
                {!loading && posts.length > 0 && (
                    <Pagination
                        page={page}
                        total={total}
                        pageSize={PAGE_SIZE}
                        onChange={p => setPage(p)}
                    />
                )}
            </div>

            {/* ── Delete confirm ── */}
            <ConfirmDialog
                open={!!deleteTarget}
                title="Remove Post"
                message={`Remove this post by ${deleteTarget?.user_id && adminIds?.has(deleteTarget.user_id) ? 'Chavee Team' : (deleteTarget?.profiles?.full_name || deleteTarget?.profiles?.username || 'Unknown')}? This will permanently delete the post, its likes, and all comments. This cannot be undone.`}
                confirmLabel="Remove Post"
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
                loading={!!deletingId}
            />

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50%      { opacity: 0.75; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
