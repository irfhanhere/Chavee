import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';

// ── Tier thresholds ──────────────────────────────────────────────
export const TIER_CONFIG = [
    { min: 600, tier: 'Platinum', icon: '🏆', color: '#818CF8', next: null },
    { min: 300, tier: 'Gold',     icon: '🥇', color: '#F59E0B', next: 600 },
    { min: 100, tier: 'Silver',   icon: '🥈', color: '#94A3B8', next: 300 },
    { min: 0,   tier: 'Bronze',   icon: '🥉', color: '#D97706', next: 100 },
];

export function getLevelDetails(points = 50) {
    const t = TIER_CONFIG.find(t => points >= t.min) || TIER_CONFIG[3];
    const progress = t.next
        ? Math.min(100, ((points - t.min) / (t.next - t.min)) * 100)
        : 100;
    const nextMilestone = t.next
        ? `${t.next - points} XP to ${TIER_CONFIG.find(tt => tt.min === t.next)?.tier}`
        : 'Max Tier Reached! 🏆';
    return { ...t, progress, nextMilestone };
}

// ── Default fallback values ──────────────────────────────────────
const buildDefaultProfile = (user) => ({
    id: user.id,
    name: user.email.split('@')[0],
    bio: 'Student ready to learn, earn, and connect on Chavee!',
    skills: 'Curiosity, Learning, Networking',
    resume_link: '',
    college: '',
    course: '',
    year: '',
    dob: '',
    interests: [],
    motive: '',
    is_mentor: false,
    is_mentee: false,
    onboarding_completed: false,
    privacy: 'public',
    avatar_url: null,
});

const buildDefaultGamification = (user) => ({
    user_id: user.id,
    points: 50,
    level: 1,
    badges: ['Onboarding Explorer'],
});

/**
 * useProfile — manages profiles + user_gamification in sync
 */
export function useProfile(user) {
    const [profile, setProfile] = useState(null);
    const [gamification, setGamification] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [gamificationLoading, setGamificationLoading] = useState(false);

    // ── Fetch Profile ────────────────────────────────────────────
    const fetchProfile = useCallback(async () => {
        if (!user) return;
        setProfileLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error) throw error;
            if (data) setProfile(data);
        } catch {
            const local = localStorage.getItem(`profile_${user.id}`);
            const parsed = local ? JSON.parse(local) : buildDefaultProfile(user);
            setProfile(parsed);
            if (!local) localStorage.setItem(`profile_${user.id}`, JSON.stringify(parsed));
        } finally {
            setProfileLoading(false);
        }
    }, [user]);

    // ── Fetch Gamification ───────────────────────────────────────
    const fetchGamification = useCallback(async () => {
        if (!user) return;
        setGamificationLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_gamification')
                .select('*')
                .eq('user_id', user.id)
                .single();
            if (error) throw error;
            if (data) setGamification(data);
        } catch {
            const local = localStorage.getItem(`gamification_${user.id}`);
            const parsed = local ? JSON.parse(local) : buildDefaultGamification(user);
            setGamification(parsed);
            if (!local) localStorage.setItem(`gamification_${user.id}`, JSON.stringify(parsed));
        } finally {
            setGamificationLoading(false);
        }
    }, [user]);

    // ── Save Profile ─────────────────────────────────────────────
    const saveProfile = useCallback(async (data, { onSuccess, onError } = {}) => {
        if (!user) return;
        setProfileLoading(true);
        try {
            // Strip non-db columns (onboarding_completed, email, name)
            const { onboarding_completed, email, name, ...cleanData } = data;
            const payload = {
                id: user.id,
                full_name: name || data.full_name || '',
                ...cleanData,
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase
                .from('profiles')
                .upsert(payload);
            if (error) throw error;
            setProfile(data);
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
            onSuccess?.('saved-supabase');
        } catch (err) {
            // Graceful offline fallback — still updates local state
            setProfile(data);
            localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
            onError?.(err, 'saved-offline');
        } finally {
            setProfileLoading(false);
        }
    }, [user]);

    // ── Reward Points / XP ────────────────────────────────────────
    const rewardPoints = useCallback(async (amount, newBadge = null) => {
        if (!user || !gamification) return null;
        const updated = { ...gamification, points: gamification.points + amount };

        // Recalculate tier
        if (updated.points >= 600) updated.level = 4;
        else if (updated.points >= 300) updated.level = 3;
        else if (updated.points >= 100) updated.level = 2;
        else updated.level = 1;

        // Add badge if new
        if (newBadge && !updated.badges.includes(newBadge)) {
            updated.badges = [...updated.badges, newBadge];
        }

        setGamification(updated);
        localStorage.setItem(`gamification_${user.id}`, JSON.stringify(updated));

        try {
            await supabase.from('user_gamification').upsert(updated);
        } catch { /* offline — already saved locally */ }

        return updated;
    }, [user, gamification]);

    return {
        profile, setProfile,
        gamification, setGamification,
        profileLoading, gamificationLoading,
        fetchProfile, fetchGamification,
        saveProfile, rewardPoints,
    };
}

export default useProfile;
