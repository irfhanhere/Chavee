import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';

export default function HeaderActions({ user }) {
    const navigate = useNavigate();
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Unread' | 'Read'
    const dropdownRef = useRef(null);

    const userId = user?.id;

    // Fetch counts and notifications
    const fetchUnreadMessages = async () => {
        if (!userId) return;
        try {
            const { data: participants, error: pError } = await supabase
                .from('conversation_participants')
                .select('conversation_id')
                .eq('user_id', userId);
            
            if (pError) throw pError;
            const convIds = participants?.map(p => p.conversation_id).filter(Boolean) || [];
            
            if (convIds.length === 0) {
                setUnreadMessages(0);
                return;
            }

            const { count, error: mError } = await supabase
                .from('messages')
                .select('id', { count: 'exact', head: true })
                .in('conversation_id', convIds)
                .neq('sender_id', userId)
                .is('read_at', null);

            if (mError) throw mError;
            setUnreadMessages(count || 0);
        } catch (err) {
            console.error('Error fetching unread messages count:', err);
        }
    };

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotifications(data || []);
            setUnreadNotificationsCount(data || []);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        }
    };

    const setUnreadNotificationsCount = (data) => {
        const count = data.filter(n => !n.is_read).length;
        setUnreadNotifications(count);
    };

    // Pulling logic
    useEffect(() => {
        if (!userId) return;

        fetchUnreadMessages();
        fetchNotifications();

        // Used a debounce timer for Realtime to prevent spam
        let timeoutId;
        const debouncedFetchUnread = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(fetchUnreadMessages, 1000);
        };

        // Supabase Realtime subscriptions
        const channel = supabase
            .channel(`header-updates-${userId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
                debouncedFetchUnread();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
                if (payload.new && payload.new.user_id === userId) {
                    fetchNotifications();
                }
            })
            .subscribe();

        return () => {
            clearTimeout(timeoutId);
            supabase.removeChannel(channel);
        };
    }, [userId]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markNotificationRead = async (notif) => {
        if (notif.is_read) {
            navigate(notif.link);
            setDropdownOpen(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notif.id);

            if (error) throw error;
            
            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
            );
            setUnreadNotifications(prev => Math.max(0, prev - 1));

            // Navigate
            navigate(notif.link);
            setDropdownOpen(false);
        } catch (err) {
            console.error('Error marking notification read:', err);
            // Navigate anyway as fallback
            navigate(notif.link);
            setDropdownOpen(false);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'follow':
            case 'new_follower':
                return '👤';
            case 'message':
            case 'new_message':
                return '💬';
            case 'like':
            case 'post_liked':
                return '❤️';
            case 'comment':
            case 'post_commented':
                return '💬';
            case 'event':
            case 'event_registration':
                return '🎪';
            case 'gig':
            case 'gig_approval':
                return '⚡';
            default:
                return '🔔';
        }
    };

    const getRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const now = new Date();
        const past = new Date(dateStr);
        const diffMs = now - past;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHr = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHr / 24);

        if (diffSec < 60) return 'just now';
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHr < 24) return `${diffHr}h ago`;
        return `${diffDay}d ago`;
    };

    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'Unread') return !n.is_read;
        if (activeTab === 'Read') return n.is_read;
        return true; // 'All'
    });

    const S = {
        container: {
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
            flexShrink: 0,
        },
        iconBtn: {
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'background 0.2s',
            color: 'var(--text-secondary)',
            flexShrink: 0,
        },
        badge: {
            position: 'absolute',
            top: -2,
            right: -2,
            background: 'var(--accent-coral)',
            color: '#fff',
            fontSize: '0.62rem',
            fontWeight: 800,
            borderRadius: 10,
            height: 16,
            minWidth: 16,
            padding: '0 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 2px var(--bg-surface)'
        },
        dropdown: {
            position: 'absolute',
            top: '40px',
            right: 0,
            width: 320,
            maxHeight: 400,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        },
        dropdownHeader: {
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        dropdownTitle: {
            fontSize: '0.9rem',
            fontWeight: 800,
            margin: 0
        },
        tabs: {
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-elevated)',
            padding: '0.2rem'
        },
        tabBtn: (active) => ({
            flex: 1,
            background: active ? 'var(--bg-surface)' : 'transparent',
            border: 'none',
            borderRadius: 6,
            padding: '0.35rem',
            fontSize: '0.75rem',
            fontWeight: active ? 700 : 600,
            color: active ? 'var(--peacock-green)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: active ? 'var(--shadow-sm)' : 'none'
        }),
        list: {
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
        },
        row: (isUnread) => ({
            display: 'flex',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.2s',
            background: isUnread ? 'var(--bg-mint)' : 'transparent'
        }),
        rowIcon: {
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        },
        rowContent: {
            minWidth: 0,
            flex: 1
        },
        rowTitle: {
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.15rem 0',
            lineHeight: 1.3
        },
        rowBody: {
            fontSize: '0.74rem',
            color: 'var(--text-secondary)',
            margin: '0 0 0.25rem 0',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        rowTime: {
            fontSize: '0.68rem',
            color: 'var(--text-muted)'
        },
        emptyState: {
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.8rem'
        }
    };

    return (
        <div className="header-actions-container" style={S.container}>
            {/* Messages Icon */}
            <button
                onClick={() => navigate('/messages')}
                style={S.iconBtn}
                title="Messages"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mint)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                {unreadMessages > 0 && (
                    <span style={S.badge}>{unreadMessages}</span>
                )}
            </button>

            {/* Notifications Icon */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={S.iconBtn}
                    title="Notifications"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-mint)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {unreadNotifications > 0 && (
                        <span style={S.badge}>{unreadNotifications}</span>
                    )}
                </button>

                {/* Notifications Dropdown Panel */}
                {dropdownOpen && (
                    <div style={S.dropdown}>
                        <div style={S.dropdownHeader}>
                            <h4 style={S.dropdownTitle}>Notifications</h4>
                            {unreadNotifications > 0 && (
                                <span style={{ fontSize: '0.72rem', background: 'var(--bg-mint)', color: 'var(--peacock-green)', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 700 }}>
                                    {unreadNotifications} new
                                </span>
                            )}
                        </div>

                        {/* Tabs */}
                        <div style={S.tabs}>
                            {['All', 'Unread', 'Read'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={S.tabBtn(activeTab === tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div style={S.list}>
                            {filteredNotifications.length === 0 ? (
                                <div style={S.emptyState}>
                                    <div>📭</div>
                                    <div style={{ marginTop: '0.5rem' }}>No {activeTab.toLowerCase()} notifications</div>
                                </div>
                            ) : (
                                filteredNotifications.map(notif => (
                                    <button
                                        key={notif.id}
                                        onClick={() => markNotificationRead(notif)}
                                        style={S.row(!notif.is_read)}
                                        onMouseEnter={e => e.currentTarget.style.background = notif.is_read ? 'var(--bg-elevated)' : 'rgba(16,185,129,0.06)'}
                                        onMouseLeave={e => e.currentTarget.style.background = notif.is_read ? 'transparent' : 'var(--bg-mint)'}
                                    >
                                        <div style={S.rowIcon}>{getNotificationIcon(notif.type)}</div>
                                        <div style={S.rowContent}>
                                            <h5 style={S.rowTitle}>{notif.title}</h5>
                                            <p style={S.rowBody}>{notif.body}</p>
                                            <span style={S.rowTime}>{getRelativeTime(notif.created_at)}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            <style>{`
                .header-actions-container { gap: 1rem; }
                @media (max-width: 480px) {
                    .header-actions-container { gap: 0.5rem; }
                }
            `}</style>
        </div>
    );
}
