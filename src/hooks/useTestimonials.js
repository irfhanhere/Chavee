import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

/**
 * useTestimonials — real, approved + featured testimonials for the
 * "Building Chavee Together" section on Landing.jsx and MobileLanding.jsx.
 * Same source for both so desktop and mobile never drift.
 *
 * Display fallback rule: if a testimonial has a linked profile (user_id),
 * use that profile's real name/avatar; otherwise use the admin-authored
 * display_name/role_label/photo_url fields directly.
 */
export function useTestimonials() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function fetchTestimonials() {
            try {
                const { data, error } = await supabase
                    .from('testimonials')
                    .select('*, profiles(full_name, username, avatar_url)')
                    .eq('approved', true)
                    .eq('featured', true)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                if (cancelled) return;

                const resolved = (data || []).map(row => {
                    const fromProfile = row.user_id && row.profiles;
                    return {
                        id: row.id,
                        name: fromProfile
                            ? (row.profiles.full_name || row.profiles.username || 'Chavee Member')
                            : (row.display_name || 'Chavee Member'),
                        role: row.role_label || null,
                        photo: fromProfile ? (row.profiles.avatar_url || null) : (row.photo_url || null),
                        feedback: row.feedback_text,
                        rating: row.rating || null,
                    };
                });
                setTestimonials(resolved);
            } catch (err) {
                console.error('Failed to fetch testimonials', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        fetchTestimonials();
        return () => { cancelled = true; };
    }, []);

    return { testimonials, loading };
}
