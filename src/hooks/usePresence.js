import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useAuth } from './useAuth.js';

export function usePresence() {
    const { user } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState(new Set());

    useEffect(() => {
        if (!user?.id) {
            setOnlineUsers(new Set());
            return;
        }

        // Clean up any existing global_presence channel from a previous fast unmount/mount 
        // before creating a new one, avoiding the 'already subscribed' error.
        const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:global_presence');
        if (existingChannel) {
            supabase.removeChannel(existingChannel);
        }

        const channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: user.id
                }
            }
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const activeIds = new Set();
                
                for (const key in state) {
                    if (state[key] && state[key].length > 0) {
                        activeIds.add(state[key][0].user_id);
                    }
                }
                
                setOnlineUsers(prev => {
                    if (prev.size !== activeIds.size) return activeIds;
                    for (let id of activeIds) {
                        if (!prev.has(id)) return activeIds;
                    }
                    return prev;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ user_id: user.id, online_at: new Date().toISOString() });
                }
            });

        return () => {
            channel.untrack().then(() => {
                supabase.removeChannel(channel);
            });
        };
    }, [user?.id]); // Depend on user.id instead of the full user object to prevent unnecessary re-subscriptions

    return { onlineUsers };
}
