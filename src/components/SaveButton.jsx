import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';
import { useToast } from './Toast.jsx';

/**
 * SaveButton
 * 
 * Reusable component to bookmark/save items across the app.
 * It queries its own state from saved_items and toggles it.
 * 
 * @param {string} itemType - The type of item (e.g. 'post', 'job', 'gig', 'event', 'course', 'scholarship', 'community')
 * @param {string} itemId - The ID of the item
 * @param {object} user - The current logged in user object
 * @param {object} style - Optional styles
 */
export default function SaveButton({ itemType, itemId, user, style = {} }) {
    const { showToast } = useToast();
    const [isSaved, setIsSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        const checkSaved = async () => {
            if (!user || !itemId) {
                if (isMounted) setLoading(false);
                return;
            }
            try {
                const { data } = await supabase
                    .from('saved_items')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('item_id', itemId)
                    .eq('item_type', itemType)
                    .maybeSingle();

                if (isMounted) {
                    setIsSaved(!!data);
                    setLoading(false);
                }
            } catch (err) {
                console.error("SaveButton error:", err);
                if (isMounted) setLoading(false);
            }
        };

        checkSaved();

        return () => { isMounted = false; };
    }, [user, itemId, itemType]);

    const toggleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            showToast('Please log in to save items.', 'error');
            return;
        }

        setLoading(true);

        try {
            if (isSaved) {
                const { error } = await supabase
                    .from('saved_items')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('item_id', itemId)
                    .eq('item_type', itemType);
                if (error) throw error;
                setIsSaved(false);
                showToast(`Removed from Saved Items`, 'success');
            } else {
                const { error } = await supabase
                    .from('saved_items')
                    .insert({ user_id: user.id, item_id: itemId, item_type: itemType });
                if (error) throw error;
                setIsSaved(true);
                showToast(`Saved ${itemType}`, 'success');
            }
        } catch (err) {
            console.error("Save toggle error:", err);
            showToast(`Failed to update saved status`, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={toggleSave} 
            disabled={loading}
            title={isSaved ? "Remove from Saved" : "Save Item"}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: '1.2rem',
                color: isSaved ? 'var(--peacock-green)' : 'var(--text-muted)',
                transition: 'transform 0.1s, color 0.2s',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.5 : 1,
                ...style
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)'; }}
        >
            {isSaved ? '🔖' : '📑'}
        </button>
    );
}
