import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { PageLoader, ButtonSpinner } from '../components/Spinner.jsx';
import Toast, { useToast } from '../components/Toast.jsx';

export default function Notifications() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    
    const [activeTab, setActiveTab] = useState('All');

    useEffect(() => {
        const fetchNotifications = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching notifications:", error);
            } else {
                setNotifications(data || []);
            }
            setLoading(false);
        };
        fetchNotifications();
    }, [navigate]);

    const handleMarkAllRead = async () => {
        setMarking(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', session.user.id)
                .eq('is_read', false);

            if (error) throw error;
            
            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            showToast("All notifications marked as read", "success");
        } catch (err) {
            console.error("Error marking all read:", err);
            showToast("Failed to mark notifications as read", "error");
        } finally {
            setMarking(false);
        }
    };

    const handleMarkSingleRead = async (id, link) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);
            
            if (!error) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            }
            if (link) navigate(link);
        } catch (err) {
            console.error("Error marking read:", err);
            if (link) navigate(link); // Navigate anyway
        }
    };

    if (loading) return <PageLoader message="Loading notifications..." />;

    // Grouping Logic
    const groupNotifications = (items) => {
        const groups = { Today: [], Yesterday: [], Earlier: [] };
        const now = new Date();
        const todayStr = now.toDateString();
        
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        items.forEach(item => {
            const dateStr = new Date(item.created_at).toDateString();
            if (dateStr === todayStr) groups.Today.push(item);
            else if (dateStr === yesterdayStr) groups.Yesterday.push(item);
            else groups.Earlier.push(item);
        });

        return groups;
    };

    // Filter Logic
    const filtered = notifications.filter(n => {
        if (activeTab === 'All') return true;
        if (activeTab === 'Unread') return !n.is_read;
        return n.type === activeTab.toLowerCase(); // 'system', 'social', 'event', etc.
    });

    const grouped = groupNotifications(filtered);
    
    // Dynamic Tabs based on existing types
    const types = [...new Set(notifications.map(n => n.type))].filter(Boolean);
    const tabs = ['All', 'Unread', ...types.map(t => t.charAt(0).toUpperCase() + t.slice(1))];

    const S = {
        container: { maxWidth: 800, margin: '0 auto', padding: '2rem 1.5rem', minHeight: '100vh' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
        title: { fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 },
        markBtn: { background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.6rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' },
        
        tabs: { display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' },
        tab: (active) => ({
            padding: '0.5rem 1rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
            background: active ? 'var(--text-primary)' : 'transparent',
            color: active ? 'var(--bg-base)' : 'var(--text-secondary)',
            border: active ? '1px solid var(--text-primary)' : '1px solid transparent'
        }),

        groupTitle: { fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 1rem 0' },
        list: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2.5rem' },
        
        card: (unread) => ({
            display: 'flex', gap: '1rem', padding: '1rem', background: unread ? 'var(--bg-surface)' : 'var(--bg-base)', 
            border: `1px solid ${unread ? 'var(--peacock-green)' : 'var(--border-color)'}`, borderRadius: 12, 
            cursor: 'pointer', transition: 'background 0.2s', opacity: unread ? 1 : 0.7, textDecoration: 'none', color: 'inherit'
        }),
        icon: (type) => ({
            width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: type === 'system' ? 'rgba(59,130,246,0.1)' : type === 'social' ? 'rgba(16,185,129,0.1)' : type === 'event' ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)',
            color: type === 'system' ? '#3B82F6' : type === 'social' ? '#10B981' : type === 'event' ? '#F59E0B' : 'var(--text-primary)',
            fontSize: '1.2rem'
        }),
        dot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--peacock-green)', flexShrink: 0, alignSelf: 'center', marginLeft: 'auto' }
    };

    const getIcon = (type) => {
        if (type === 'system') return '⚙️';
        if (type === 'social') return '👋';
        if (type === 'event') return '📅';
        if (type === 'job') return '💼';
        return '🔔';
    };

    const timeAgo = (date) => {
        const diff = (new Date() - new Date(date)) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return new Date(date).toLocaleDateString();
    };

    return (
        <div style={{ background: 'var(--bg-base)' }}>
            <Toast {...toast} onHide={hideToast} />
            
            <div style={S.container}>
                <div style={S.header}>
                    <h1 style={S.title}>Notifications</h1>
                    <button 
                        style={S.markBtn} 
                        onClick={handleMarkAllRead}
                        disabled={marking}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                    >
                        {marking ? <ButtonSpinner /> : <>✓ Mark all as read</>}
                    </button>
                </div>

                <div style={S.tabs}>
                    {tabs.map(t => (
                        <div key={t} style={S.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
                            {t}
                        </div>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3>No notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                ) : (
                    <>
                        {['Today', 'Yesterday', 'Earlier'].map(group => {
                            const items = grouped[group];
                            if (items.length === 0) return null;
                            
                            return (
                                <div key={group}>
                                    <h3 style={S.groupTitle}>{group}</h3>
                                    <div style={S.list}>
                                        {items.map(n => (
                                            <div 
                                                key={n.id} 
                                                style={S.card(!n.is_read)}
                                                onClick={() => handleMarkSingleRead(n.id, n.link)}
                                            >
                                                <div style={S.icon(n.type)}>{getIcon(n.type)}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: !n.is_read ? 800 : 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {n.title}
                                                        </h4>
                                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                            {timeAgo(n.created_at)}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                        {n.message}
                                                    </p>
                                                </div>
                                                {!n.is_read && <div style={S.dot} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}
