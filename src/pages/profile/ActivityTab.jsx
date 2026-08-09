import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { PageLoader } from '../../components/Spinner.jsx';

export default function ActivityTab({ targetUserId }) {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('user_activity')
                    .select('*')
                    .eq('user_id', targetUserId)
                    .order('created_at', { ascending: false });
                if (data) setActivities(data);
            } catch (err) {
                console.error("Failed to load activities", err);
            } finally {
                setLoading(false);
            }
        };

        if (targetUserId) fetchActivities();
    }, [targetUserId]);

    if (loading) return <PageLoader message="Loading activity..." />;

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Full Timeline</h3>
            
            {activities.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {activities.map((act) => (
                        <div key={act.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                {act.activity_type.includes('job') ? '💼' : 
                                 act.activity_type.includes('community') ? '👥' : 
                                 act.activity_type.includes('like') ? '❤️' : '✨'}
                            </div>
                            <div style={{ flex: 1, paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                    {act.activity_type === 'community_join' ? `Joined ${act.metadata?.community_name || 'a community'}` :
                                     act.activity_type === 'job_application' ? `Applied to ${act.metadata?.job_title || 'a job'} at ${act.metadata?.company_name || 'a company'}` :
                                     act.activity_type === 'post_like' ? 'Liked a post' :
                                     act.activity_type === 'post_comment' ? 'Commented on a post' :
                                     'Completed an activity'}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                    {new Date(act.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem' }}>
                    No activity recorded yet.
                </div>
            )}
        </div>
    );
}
