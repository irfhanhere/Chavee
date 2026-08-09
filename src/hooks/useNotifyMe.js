import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function useNotifyMe(user) {
    const [notifiedFeatures, setNotifiedFeatures] = useState(new Set());
    const [loadingFeatures, setLoadingFeatures] = useState(new Set());

    useEffect(() => {
        if (!user) {
            setNotifiedFeatures(new Set());
            return;
        }
        
        async function fetchSubscriptions() {
            try {
                const { data, error } = await supabase
                    .from('notify_subscribers')
                    .select('feature_key')
                    .eq('user_id', user.id);
                if (error) throw error;
                setNotifiedFeatures(new Set(data.map(d => d.feature_key)));
            } catch (err) {
                console.error("Error fetching subscriptions:", err);
            }
        }
        
        fetchSubscriptions();
    }, [user]);

    const toggleNotify = async (featureKey) => {
        if (!user) return null;
        
        setLoadingFeatures(prev => new Set(prev).add(featureKey));
        try {
            const { data, error } = await supabase.rpc('toggle_notify_me', { p_feature_key: featureKey });
            if (error) throw error;
            
            setNotifiedFeatures(prev => {
                const next = new Set(prev);
                if (data) next.add(featureKey);
                else next.delete(featureKey);
                return next;
            });
            return data; // true if subscribed, false if unsubscribed
        } catch (err) {
            console.error("Error toggling notify me:", err);
            throw err;
        } finally {
            setLoadingFeatures(prev => {
                const next = new Set(prev);
                next.delete(featureKey);
                return next;
            });
        }
    };

    return { notifiedFeatures, loadingFeatures, toggleNotify };
}
