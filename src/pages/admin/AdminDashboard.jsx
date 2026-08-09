import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient.js';

function StatCard({ title, count, icon, color, loading }) {
    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>{title}</div>
                {loading ? (
                    <div style={{ height: 24, width: 60, background: 'var(--bg-elevated)', borderRadius: 4, animation: 'adminPulse 1.5s infinite' }} />
                ) : (
                    <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{count?.toLocaleString() || 0}</div>
                )}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [growthData, setGrowthData] = useState([]);
    const [featureFlags, setFeatureFlags] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);

    const loadDashboard = async () => {
        setLoading(true);
        setError(null);
        try {
            // 1. Stats from RPC
            const { data: rpcStats, error: rpcErr } = await supabase.rpc('get_admin_dashboard_stats');
            if (rpcErr) {
                // If the RPC is missing, it throws. Let's handle it gracefully so the dashboard doesn't totally break
                console.warn('RPC Error (might be missing):', rpcErr.message);
                setStats({});
            } else {
                setStats(rpcStats?.[0] || rpcStats || {}); // Some RPCs return an array, some an object
            }

            // 2. Growth Data (Signups over time)
            const { data: profiles, error: profErr } = await supabase.from('profiles').select('created_at').order('created_at', { ascending: true });
            if (!profErr && profiles) {
                const grouped = {};
                profiles.forEach(p => {
                    if (!p.created_at) return;
                    // Extract YYYY-MM-DD
                    const date = p.created_at.split('T')[0];
                    grouped[date] = (grouped[date] || 0) + 1;
                });
                
                // Get last 14 days
                const sortedDates = Object.keys(grouped).sort();
                const chartData = sortedDates.slice(-14).map(date => ({ date, count: grouped[date] }));
                setGrowthData(chartData);
            }

            // 3. Feature Flags
            const { data: flags, error: flagsErr } = await supabase.from('feature_flags').select('*').order('key');
            if (!flagsErr && flags) setFeatureFlags(flags);

            // 4. Activity Logs
            const { data: logs, error: logsErr } = await supabase.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(10);
            if (!logsErr && logs) setActivityLogs(logs);

        } catch (err) {
            console.error('Dashboard Load Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadDashboard(); }, []);

    const handleToggleFlag = async (flagKey, currentValue) => {
        const { error } = await supabase.from('feature_flags').update({ enabled: !currentValue }).eq('key', flagKey);
        if (!error) {
            setFeatureFlags(prev => prev.map(f => f.key === flagKey ? { ...f, enabled: !currentValue } : f));
        } else {
            alert('Failed to update feature flag: ' + error.message);
        }
    };

    const maxGrowth = useMemo(() => Math.max(...growthData.map(d => d.count), 1), [growthData]);

    return (
        <div style={{ animation: 'adminFadeUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>Dashboard Overview</h1>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome to the Chavee admin panel.</p>
                </div>
                <button 
                    onClick={loadDashboard}
                    disabled={loading}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {loading ? 'Refreshing...' : '↻ Refresh Data'}
                </button>
            </div>

            {error && (
                <div style={{ background: '#FEF2F2', border: '1px solid #F87171', color: '#B91C1C', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    <strong>Warning:</strong> {typeof error === 'object' ? JSON.stringify(error) : String(error)}
                </div>
            )}

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard title="Total Users" count={stats.total_users ?? 0} icon="👥" color="#6366F1" loading={loading} />
                <StatCard title="Active Users" count={stats.active_users ?? 0} icon="⚡" color="#10B981" loading={loading} />
                <StatCard title="Total Communities" count={stats.total_communities ?? 0} icon="🤝" color="#F59E0B" loading={loading} />
                <StatCard title="Total Jobs" count={stats.total_jobs ?? 0} icon="💼" color="#3B82F6" loading={loading} />
                <StatCard title="Total Gigs" count={stats.total_gigs ?? 0} icon="✨" color="#8B5CF6" loading={loading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* User Growth Chart */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>User Growth (Last 14 Days)</h3>
                        {loading ? (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading chart...</div>
                        ) : growthData.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: 200, paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                                {growthData.map((d, i) => {
                                    const heightPct = (d.count / maxGrowth) * 100;
                                    return (
                                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
                                                <div 
                                                    style={{ 
                                                        width: '100%', 
                                                        height: `${heightPct}%`, 
                                                        background: 'linear-gradient(to top, var(--peacock-green), #34D399)', 
                                                        borderRadius: '4px 4px 0 0',
                                                        transition: 'height 0.5s ease-out'
                                                    }} 
                                                    title={`${d.date}: ${d.count} signups`}
                                                />
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', transform: 'rotate(-45deg)', transformOrigin: 'top left', whiteSpace: 'nowrap', marginTop: '10px' }}>
                                                {d.date.substring(5)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No growth data available.</div>
                        )}
                    </div>

                    {/* Recent Activity */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Recent Admin Activities</h3>
                        {loading ? (
                            <div style={{ color: 'var(--text-muted)' }}>Loading logs...</div>
                        ) : activityLogs.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {activityLogs.map((log, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--peacock-green)' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>{log.action}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || 'No details provided')}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {new Date(log.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No recent activity found.</div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Platform Status / Feature Flags */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Platform Status</h3>
                        {loading ? (
                            <div style={{ color: 'var(--text-muted)' }}>Loading flags...</div>
                        ) : featureFlags.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {featureFlags.map(flag => {
                                    const isEnabled = flag.enabled;
                                    // Use a nicely formatted key name (e.g., study_sync -> Study Sync)
                                    const flagName = flag.key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                    return (
                                        <div key={flag.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{flagName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{flag.coming_soon_text || 'Feature flag'}</div>
                                            </div>
                                            <button 
                                                onClick={() => handleToggleFlag(flag.key, isEnabled)}
                                                style={{ 
                                                    width: 44, height: 24, borderRadius: 12, border: 'none', position: 'relative', cursor: 'pointer', transition: 'background 0.3s',
                                                    background: isEnabled ? 'var(--peacock-green)' : 'var(--bg-elevated)'
                                                }}
                                            >
                                                <div style={{ 
                                                    width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: isEnabled ? 22 : 2, transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                                                }} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No feature flags configured.</div>
                        )}
                    </div>

                    {/* Pending Approvals */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Pending Approvals</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 8 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Gig Verifications</span>
                                <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', fontWeight: 800 }}>
                                    {stats.pending_gig_verification || 0}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-base)', borderRadius: 8 }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Community Requests</span>
                                <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.6rem', borderRadius: 12, fontSize: '0.8rem', fontWeight: 800 }}>
                                    {stats.pending_community_requests || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes adminFadeUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes adminPulse {
                    0%, 100% { opacity: 0.5; }
                    50%      { opacity: 1;   }
                }
            `}</style>
        </div>
    );
}
