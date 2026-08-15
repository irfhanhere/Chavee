import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

/**
 * useLandingStats — the live "Trusted by early students" numbers shown on the
 * landing page. Extracted verbatim from Landing.jsx's original inline fetch
 * (same RPC, same table counts, same shape) so the desktop page and the
 * mobile page read from the exact same source instead of each fetching or
 * hardcoding their own copy.
 */
export function useLandingStats() {
    const [stats, setStats] = useState({
        students: 0,
        communities: 0,
        events: 0,
        opportunities: 0,
        courses: 0,
        scholarships: 0,
        blogs: 0
    });

    useEffect(() => {
        async function fetchLiveStats() {
            try {
                let sCount = 0, eCount = 0, cCount = 0, oCount = 0;

                const { data, error } = await supabase.rpc('get_landing_stats');
                if (!error && data) {
                    const statsObj = Array.isArray(data) ? data[0] : data;
                    if (statsObj) {
                        sCount = statsObj.student_count || 0;
                        eCount = statsObj.live_event_count || 0;
                        cCount = statsObj.community_count || 0;
                    }
                }

                const [
                    { count: jobCount },
                    { count: gigCount },
                    { count: coursesCount },
                    { count: scholarshipsCount },
                    { count: blogsCount }
                ] = await Promise.all([
                    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'live'),
                    supabase.from('gigs').select('*', { count: 'exact', head: true }).eq('status', 'live').eq('verified', true),
                    supabase.from('courses').select('*', { count: 'exact', head: true }),
                    supabase.from('scholarships').select('*', { count: 'exact', head: true }),
                    supabase.from('blogs').select('*', { count: 'exact', head: true })
                ]);
                oCount = (jobCount || 0) + (gigCount || 0);

                setStats({
                    students: sCount,
                    communities: cCount,
                    events: eCount,
                    opportunities: oCount,
                    courses: coursesCount || 0,
                    scholarships: scholarshipsCount || 0,
                    blogs: blogsCount || 0
                });
            } catch (err) {
                console.error("Failed to fetch stats", err);
            }
        }
        fetchLiveStats();
    }, []);

    return stats;
}
