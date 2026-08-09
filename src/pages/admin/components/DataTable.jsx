import React, { useState, useMemo } from 'react';

/**
 * DataTable — reusable admin table (Light Theme)
 * Props:
 *   columns: [{ key, label, render?, width?, align? }]
 *   rows: array of data objects
 *   loading: bool
 *   emptyMessage: string
 *   actions: (row) => JSX  (rightmost column)
 *   searchKeys: [string]  (keys to search across)
 *   pageSize: number
 */
export default function DataTable({
    columns = [],
    rows = [],
    loading = false,
    emptyMessage = 'No records found.',
    actions,
    searchKeys = [],
    pageSize = 12,
}) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        let data = [...rows];
        if (search && searchKeys.length) {
            const q = search.toLowerCase();
            data = data.filter(r => searchKeys.some(k => String(r[k] ?? '').toLowerCase().includes(q)));
        }
        if (sortKey) {
            data.sort((a, b) => {
                const av = a[sortKey] ?? '';
                const bv = b[sortKey] ?? '';
                const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
                return sortDir === 'asc' ? cmp : -cmp;
            });
        }
        return data;
    }, [rows, search, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

    const handleSort = (key) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
        setPage(1);
    };

    const handleSearch = (v) => { setSearch(v); setPage(1); };

    const S = {
        wrap: { width: '100%', overflowX: 'auto' },
        toolbar: {
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1rem', flexWrap: 'wrap',
        },
        searchInput: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 9, color: 'var(--text-primary)',
            padding: '0.55rem 0.9rem', fontSize: '0.855rem',
            outline: 'none', minWidth: 220,
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
        },
        table: {
            width: '100%', borderCollapse: 'separate', borderSpacing: 0,
            fontSize: '0.855rem',
        },
        th: {
            padding: '0.75rem 1rem', textAlign: 'left',
            color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem',
            textTransform: 'uppercase', letterSpacing: '0.6px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-color)',
            whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none',
        },
        thStatic: {
            padding: '0.75rem 1rem', textAlign: 'left',
            color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem',
            textTransform: 'uppercase', letterSpacing: '0.6px',
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-color)',
            whiteSpace: 'nowrap', userSelect: 'none',
        },
        td: {
            padding: '0.8rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            color: 'var(--text-primary)', verticalAlign: 'middle',
        },
        tr: (i) => ({
            background: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg-surface)',
            transition: 'background 0.15s',
        }),
        pagination: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: '1.25rem', gap: '1rem', flexWrap: 'wrap',
            paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)',
        },
        pageBtn: (disabled) => ({
            padding: '0.45rem 0.9rem', borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: disabled ? 'var(--text-muted)' : 'var(--peacock-green)',
            fontWeight: 700, fontSize: '0.8rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            transition: 'all 0.15s',
        }),
    };

    return (
        <div style={{ animation: 'fadeInUp 0.2s ease-out' }}>
            {/* Search toolbar */}
            {searchKeys.length > 0 && (
                <div style={S.toolbar}>
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        style={S.searchInput}
                        onFocus={e => e.target.style.borderColor = 'var(--peacock-green)'}
                        onFocusOut={e => e.target.style.borderColor = 'var(--border-color)'}
                    />
                    {search && (
                        <button
                            onClick={() => handleSearch('')}
                            style={{
                                background: 'none', border: 'none',
                                color: 'var(--accent-coral)', fontWeight: 700,
                                fontSize: '0.8rem', cursor: 'pointer',
                            }}
                        >Clear search</button>
                    )}
                </div>
            )}

            {/* Table */}
            <div style={S.wrap}>
                <table style={S.table}>
                    <thead>
                        <tr>
                            {columns.map(c => {
                                const isSortable = searchKeys.includes(c.key) || c.sortable;
                                const isCurrent = sortKey === c.key;
                                return (
                                    <th
                                        key={c.key}
                                        onClick={() => isSortable && handleSort(c.key)}
                                        style={{
                                            ...(isSortable ? S.th : S.thStatic),
                                            width: c.width,
                                            textAlign: c.align || 'left',
                                        }}
                                    >
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                            {c.label}
                                            {isSortable && (
                                                <span style={{ fontSize: '0.65rem', opacity: isCurrent ? 1 : 0.35 }}>
                                                    {isCurrent ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                                                </span>
                                            )}
                                        </div>
                                    </th>
                                );
                            })}
                            {actions && <th style={S.thStatic}>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} style={S.tr(i)}>
                                    {columns.map(c => (
                                        <td key={c.key} style={S.td}>
                                            <div style={{
                                                height: 12,
                                                background: 'var(--border-color)',
                                                borderRadius: 4,
                                                animation: 'pulse 1.5s infinite',
                                                width: c.width ? c.width - 15 : '80%',
                                            }} />
                                        </td>
                                    ))}
                                    {actions && (
                                        <td style={S.td}>
                                            <div style={{ height: 26, width: 80, background: 'var(--border-color)', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : pageRows.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (actions ? 1 : 0)}
                                    style={{ ...S.td, textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            pageRows.map((row, i) => (
                                <tr key={row.id || i} style={S.tr(i)}>
                                    {columns.map(c => (
                                        <td
                                            key={c.key}
                                            style={{ ...S.td, textAlign: c.align || 'left' }}
                                        >
                                            {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td style={S.td}>
                                            {actions(row)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!loading && filtered.length > pageSize && (
                <div style={S.pagination}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Showing {((page - 1) * pageSize) + 1} – {Math.min(filtered.length, page * pageSize)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={S.pageBtn(page === 1)}
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={S.pageBtn(page === totalPages)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
