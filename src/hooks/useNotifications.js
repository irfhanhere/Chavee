import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';
import { useAuth } from './useAuth.js';

/**
 * Shared notifications state for the bell dropdown (HeaderActions) and the
 * /notifications page. One implementation instead of two.
 *
 *  - one initial fetch of the current user's rows
 *  - one realtime subscription filtered to `user_id=eq.<id>`
 *    (needs `notifications` in the supabase_realtime publication —
 *     see supabase_notifications_complete.sql)
 *  - optimistic mark-one-read / mark-all-read
 *
 * @param {string} [userIdOverride] pass `user?.id` when the caller already
 *   has it (e.g. HeaderActions gets `user` as a prop); otherwise the hook
 *   reads it from useAuth().
 */
export function useNotifications(userIdOverride) {
    const { user } = useAuth();
    const userId = userIdOverride ?? user?.id ?? null;

    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const unreadCount = notifications.reduce((n, x) => n + (x.is_read ? 0 : 1), 0);

    const refetch = useCallback(async () => {
        if (!userId) {
            setNotifications([]);
            setLoading(false);
            return;
        }
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) console.error('useNotifications fetch failed:', error);
        else setNotifications(data || []);
        setLoading(false);
    }, [userId]);

    useEffect(() => {
        setLoading(true);
        refetch();

        if (!userId) return undefined;

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                (payload) => {
                    setNotifications((prev) => {
                        if (payload.eventType === 'INSERT') {
                            return prev.some((n) => n.id === payload.new.id)
                                ? prev
                                : [payload.new, ...prev];
                        }
                        if (payload.eventType === 'UPDATE') {
                            return prev.map((n) => (n.id === payload.new.id ? payload.new : n));
                        }
                        if (payload.eventType === 'DELETE') {
                            return prev.filter((n) => n.id !== payload.old.id);
                        }
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, refetch]);

    const markRead = useCallback(async (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
        if (error) console.error('useNotifications markRead failed:', error);
    }, []);

    const markAllRead = useCallback(async () => {
        if (!userId) return;
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);
        if (error) console.error('useNotifications markAllRead failed:', error);
    }, [userId]);

    return { notifications, unreadCount, loading, markRead, markAllRead, refetch };
}

export default useNotifications;
