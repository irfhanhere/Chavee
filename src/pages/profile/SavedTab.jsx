import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { PageLoader, ButtonSpinner } from '../../components/Spinner.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';

export default function SavedTab({ user }) {
    const { toast, showToast } = useToast();
    const [savedItems, setSavedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        const fetchSaved = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch saved_items for the user
                const { data, error } = await supabase
                    .from('saved_items')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (!data || data.length === 0) {
                    setSavedItems([]);
                    return;
                }

                // Group by item_type
                const byType = data.reduce((acc, curr) => {
                    if (!acc[curr.item_type]) acc[curr.item_type] = [];
                    acc[curr.item_type].push(curr);
                    return acc;
                }, {});

                const enrichedItems = [];

                // Fetch jobs
                if (byType['job']?.length > 0) {
                    const jobIds = byType['job'].map(i => i.item_id);
                    const { data: jobs } = await supabase.from('jobs').select('*').in('id', jobIds);
                    if (jobs) {
                        byType['job'].forEach(save => {
                            const job = jobs.find(j => j.id === save.item_id);
                            if (job) enrichedItems.push({ ...save, content: job, type: 'Job' });
                        });
                    }
                }

                // Fetch posts
                if (byType['post']?.length > 0) {
                    const postIds = byType['post'].map(i => i.item_id);
                    const { data: posts } = await supabase.from('posts').select('*').in('id', postIds);
                    if (posts) {
                        byType['post'].forEach(save => {
                            const post = posts.find(p => p.id === save.item_id);
                            if (post) enrichedItems.push({ ...save, content: post, type: 'Post' });
                        });
                    }
                }
                
                // Fetch communities
                if (byType['community']?.length > 0) {
                    const commIds = byType['community'].map(i => i.item_id);
                    const { data: comms } = await supabase.from('communities').select('*').in('id', commIds);
                    if (comms) {
                        byType['community'].forEach(save => {
                            const comm = comms.find(c => c.id === save.item_id);
                            if (comm) enrichedItems.push({ ...save, content: comm, type: 'Community' });
                        });
                    }
                }

                // Sort back by created_at
                enrichedItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setSavedItems(enrichedItems);

            } catch (err) {
                console.error("Failed to load saved items", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSaved();
    }, [user]);

    const handleRemove = async (saveId) => {
        setRemovingId(saveId);
        try {
            const { error } = await supabase.from('saved_items').delete().eq('id', saveId);
            if (error) throw error;
            setSavedItems(prev => prev.filter(i => i.id !== saveId));
            showToast('Item removed from Saved', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to remove item', 'error');
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) return <PageLoader message="Loading saved items..." />;

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Saved Items</h3>
            
            {savedItems.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {savedItems.map(item => (
                        <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: '1.25rem', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--peacock-green)', background: 'var(--bg-mint)', padding: '0.2rem 0.6rem', borderRadius: 12 }}>
                                    {item.type}
                                </span>
                                <button 
                                    onClick={() => handleRemove(item.id)} 
                                    disabled={removingId === item.id}
                                    title="Remove from saved"
                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', transition: 'color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                >
                                    {removingId === item.id ? <ButtonSpinner /> : '✕'}
                                </button>
                            </div>
                            
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {item.content.title || item.content.name || item.content.content?.substring(0, 50) || 'Untitled'}
                            </h4>
                            
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item.content.description || item.content.company_name || item.content.category || ''}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem' }}>
                    You haven't saved anything yet.
                </div>
            )}
        </div>
    );
}
