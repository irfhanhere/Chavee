import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';

const RECENT_SEARCHES_CAP = 8;

// Real tables only — no MOCK_SEARCH_ITEMS. Each entry: real table, the
// column actually searched, the live-only filter that table already uses
// elsewhere in this app (confirmed live against the real schema), the
// mockup's category label/icon, and a real navigate target (no per-item
// deep link exists yet for jobs/resources, so those go to their real list
// pages — same as the existing "Recommended Jobs" sidebar widget does).
const CATEGORIES = [
    { key: 'jobs', table: 'jobs', column: 'title', icon: '💼', label: 'Job Opportunity',
      applyFilter: (q) => q.ilike('status', 'live'), linkTo: () => '/earn' },
    { key: 'courses', table: 'courses', column: 'title', icon: '📚', label: 'Course',
      applyFilter: (q) => q.eq('is_coming_soon', false), linkTo: (row) => `/education/course/${row.id}` },
    { key: 'resources', table: 'resources', column: 'title', icon: '📄', label: 'Resource',
      applyFilter: (q) => q.eq('published', true), linkTo: () => '/resources' },
    { key: 'communities', table: 'communities', column: 'name', icon: '👥', label: 'Community',
      applyFilter: (q) => q.eq('status', 'Live'), linkTo: (row) => `/network/${row.slug}` },
];

export default function Search() {
    const navigate = useNavigate();
    const { user } = useAuth();   // session guarded upstream by <RequireAuth>
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]); // [{ category, icon, label, id, title, link }]
    const [loading, setLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const debounceRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        // localStorage, per-user, this-device-only — no search_history table
        // exists (confirmed live earlier this pass), so this is real recent-
        // search data, just not server-persisted or synced cross-device.
        try {
            const stored = JSON.parse(localStorage.getItem(`recent_searches_${user.id}`) || '[]');
            setRecentSearches(Array.isArray(stored) ? stored : []);
        } catch { setRecentSearches([]); }
    }, [user]);

    // Writes to localStorage directly (not from inside the setState updater) —
    // handleSelectResult calls this immediately followed by navigate(), and
    // react-router's history-driven re-render happens outside React's normal
    // batching, so the component can unmount before a setState updater runs.
    // Computing `next` up front and writing it unconditionally guarantees the
    // persist happens even when this call is immediately followed by a route
    // change (confirmed live: the updater-based version silently dropped the
    // write on click-through, verified via a localStorage.setItem spy).
    const saveRecentSearch = (term) => {
        if (!user || !term.trim()) return;
        const trimmed = term.trim();
        const next = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, RECENT_SEARCHES_CAP);
        localStorage.setItem(`recent_searches_${user.id}`, JSON.stringify(next));
        setRecentSearches(next);
    };

    const removeRecentSearch = (term) => {
        if (!user) return;
        const next = recentSearches.filter(s => s !== term);
        localStorage.setItem(`recent_searches_${user.id}`, JSON.stringify(next));
        setRecentSearches(next);
    };

    const clearRecentSearches = () => {
        if (!user) return;
        setRecentSearches([]);
        localStorage.setItem(`recent_searches_${user.id}`, JSON.stringify([]));
    };

    const runSearch = async (term) => {
        const trimmed = term.trim();
        if (!trimmed) { setResults([]); return; }
        setLoading(true);
        try {
            const pattern = `%${trimmed}%`;

            const tableResults = await Promise.all(CATEGORIES.map(async (cat) => {
                let q = supabase.from(cat.table).select('*').ilike(cat.column, pattern).limit(4);
                q = cat.applyFilter(q);
                const { data, error } = await q;
                if (error) { console.error(`Search error (${cat.table}):`, error); return []; }
                return (data || []).map(row => ({
                    key: `${cat.key}-${row.id}`,
                    icon: cat.icon,
                    label: cat.label,
                    title: row[cat.column],
                    link: cat.linkTo(row),
                }));
            }));

            // Users — separate shape (OR across two columns, no live-only filter
            // needed since public_profiles is already the public-safe view).
            const { data: userRows, error: userErr } = await supabase
                .from('public_profiles')
                .select('id, full_name, username')
                .or(`full_name.ilike.${pattern},username.ilike.${pattern}`)
                .limit(4);
            if (userErr) console.error('Search error (public_profiles):', userErr);
            const userResults = (userRows || []).map(row => ({
                key: `users-${row.id}`,
                icon: '👤',
                label: 'User',
                title: row.full_name || row.username || 'Student',
                link: `/profile/${row.id}`,
            }));

            setResults([...tableResults.flat(), ...userResults]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (value) => {
        setQuery(value);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => runSearch(value), 300);
    };

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const handleSelectResult = (result) => {
        saveRecentSearch(query);
        navigate(result.link);
    };

    const handleRecentClick = (term) => {
        setQuery(term);
        runSearch(term);
    };

    const S = {
        page: { minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' },
        container: { maxWidth: 640, margin: '0 auto', padding: '1.5rem 1.25rem' },
        searchBar: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 24, padding: '0.65rem 1.1rem', marginBottom: '1.5rem' },
        input: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.95rem', fontFamily: 'inherit' },
        sectionTitle: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        resultRow: { display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 0.5rem', borderRadius: 10, cursor: 'pointer', textAlign: 'left', width: '100%', background: 'none', border: 'none' },
        resultIcon: { width: 38, height: 38, borderRadius: 10, background: 'var(--bg-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 },
        recentRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.5rem', borderRadius: 10, cursor: 'pointer', width: '100%', background: 'none', border: 'none', textAlign: 'left' },
    };

    return (
        <div style={S.page}>
            <div style={S.container}>
                <div style={S.searchBar}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>🔍</span>
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={e => handleChange(e.target.value)}
                        placeholder="Search jobs, courses, communities, people..."
                        style={S.input}
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setResults([]); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                    )}
                </div>

                {query.trim() ? (
                    <div>
                        <h3 style={S.sectionTitle}>Top Suggestions</h3>
                        {loading ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0.5rem' }}>Searching…</div>
                        ) : results.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0.5rem' }}>No results for "{query.trim()}".</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                {results.map(r => (
                                    <button
                                        key={r.key}
                                        onClick={() => handleSelectResult(r)}
                                        style={S.resultRow}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    >
                                        <span style={S.resultIcon}>{r.icon}</span>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.label}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div>
                        <h3 style={S.sectionTitle}>
                            Recent Searches (this device)
                            {recentSearches.length > 0 && (
                                <button onClick={clearRecentSearches} style={{ background: 'none', border: 'none', color: 'var(--peacock-green)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>Clear all</button>
                            )}
                        </h3>
                        {recentSearches.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem 0.5rem' }}>
                                No recent searches on this device yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                {recentSearches.map(term => (
                                    <div key={term} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <button
                                            onClick={() => handleRecentClick(term)}
                                            style={S.recentRow}
                                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            <span style={{ color: 'var(--text-muted)' }}>🕐</span>
                                            <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{term}</span>
                                        </button>
                                        <button onClick={() => removeRecentSearch(term)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', padding: '0.5rem' }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
