import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { PageLoader } from '../../components/Spinner.jsx';

export default function BadgesTab({ targetUserId }) {
    const [earnedBadges, setEarnedBadges] = useState([]);
    const [allBadges, setAllBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBadge, setSelectedBadge] = useState(null);

    useEffect(() => {
        const fetchBadges = async () => {
            if (!targetUserId) return;
            setLoading(true);
            try {
                // Fetch all available badges
                const { data: badgesList, error: err1 } = await supabase.from('badges').select('*');
                if (!err1 && badgesList) setAllBadges(badgesList);

                // Fetch earned badges for this user
                const { data: earnedList, error: err2 } = await supabase
                    .from('user_badges')
                    .select('*, badges!user_badges_badge_id_fkey(*)')
                    .eq('user_id', targetUserId);
                
                if (!err2 && earnedList) {
                    setEarnedBadges(earnedList.map(ub => ({ ...ub.badges, earned_at: ub.created_at })));
                }

            } catch (err) {
                console.error("Failed to load badges", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBadges();
    }, [targetUserId]);

    if (loading) return <PageLoader message="Loading badges..." />;

    // Compute locked badges
    const earnedBadgeIds = new Set(earnedBadges.map(b => b.id));
    const lockedBadges = allBadges.filter(b => !earnedBadgeIds.has(b.id));

    const renderBadge = (badge, isEarned) => (
        <div 
            key={badge.id}
            onClick={() => setSelectedBadge({ ...badge, isEarned })}
            style={{ 
                border: '1px solid var(--border-color)', 
                borderRadius: 16, 
                padding: '1.5rem 1rem', 
                background: 'var(--bg-surface)', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                opacity: isEarned ? 1 : 0.6,
                filter: isEarned ? 'none' : 'grayscale(100%)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: '2px solid var(--border-color)' }}>
                {badge.icon_url ? <img src={badge.icon_url} alt={badge.name} style={{ width: '65%', height: '65%', objectFit: 'contain' }} /> : '🏅'}
            </div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{badge.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{isEarned ? 'Earned' : 'Locked'}</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Earned Badges</h3>
                {earnedBadges.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                        {earnedBadges.map(b => renderBadge(b, true))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No badges earned yet.</div>
                )}
            </div>

            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Locked Badges</h3>
                {lockedBadges.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
                        {lockedBadges.map(b => renderBadge(b, false))}
                    </div>
                ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You've earned all available badges! 🎉</div>
                )}
            </div>

            {/* Modal for Badge Details */}
            {selectedBadge && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setSelectedBadge(null)}>
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 24, padding: '2.5rem', maxWidth: 400, width: '100%', textAlign: 'center', position: 'relative', boxShadow: 'var(--shadow-xl)' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedBadge(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
                        
                        <div style={{ width: 80, height: 80, margin: '0 auto 1.5rem auto', borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '3px solid var(--border-color)', filter: selectedBadge.isEarned ? 'none' : 'grayscale(100%)', opacity: selectedBadge.isEarned ? 1 : 0.5 }}>
                            {selectedBadge.icon_url ? <img src={selectedBadge.icon_url} alt={selectedBadge.name} style={{ width: '65%', height: '65%', objectFit: 'contain' }} /> : '🏅'}
                        </div>
                        
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{selectedBadge.name}</h2>
                        <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                            {selectedBadge.description}
                        </p>
                        
                        {selectedBadge.requirement_text && (
                            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 12, marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Requirement</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{selectedBadge.requirement_text}</div>
                            </div>
                        )}

                        {selectedBadge.isEarned ? (
                            <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 }}>
                                Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                            </div>
                        ) : (
                            <div style={{ display: 'inline-flex', padding: '0.5rem 1rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 }}>
                                🔒 Not yet earned
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
