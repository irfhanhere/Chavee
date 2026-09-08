import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';
import { PageLoader, ButtonSpinner } from '../components/Spinner.jsx';
import Toast, { useToast } from '../components/Toast.jsx';

export default function SavedItems() {
    const { toast, showToast } = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();   // session guarded upstream by <RequireAuth>
    const [loading, setLoading] = useState(true);
    
    // Grouped items: { job: [], gig: [], event: [], course: [], scholarship: [], community: [], post: [] }
    const [groupedItems, setGroupedItems] = useState({});
    const [activeTab, setActiveTab] = useState('job');
    const [removingId, setRemovingId] = useState(null);

    const tabs = [
        { id: 'job', label: 'Jobs' },
        { id: 'gig', label: 'Gigs' },
        { id: 'event', label: 'Events' },
        { id: 'course', label: 'Courses' },
        { id: 'scholarship', label: 'Scholarships' },
        { id: 'community', label: 'Communities' },
        { id: 'post', label: 'Posts' }
    ];

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
                    setGroupedItems({});
                    setLoading(false);
                    return;
                }

                // Initial grouping
                const byType = {
                    job: [], gig: [], event: [], course: [], scholarship: [], community: [], post: []
                };
                
                data.forEach(item => {
                    if (byType[item.item_type]) {
                        byType[item.item_type].push(item);
                    } else {
                        byType[item.item_type] = [item];
                    }
                });

                // Helper to fetch details for a specific type
                const fetchDetails = async (type, table, idField = 'id') => {
                    if (!byType[type] || byType[type].length === 0) return [];
                    const ids = byType[type].map(i => i.item_id);
                    const { data: details } = await supabase.from(table).select('*').in(idField, ids);
                    if (!details) return [];
                    
                    return byType[type].map(save => {
                        const detail = details.find(d => d[idField] === save.item_id);
                        return detail ? { ...save, content: detail } : null;
                    }).filter(Boolean); // remove nulls if deleted from source
                };

                // Fetch all in parallel
                const [
                    jobs, gigs, events, courses, scholarships, communities, posts
                ] = await Promise.all([
                    fetchDetails('job', 'jobs'),
                    fetchDetails('gig', 'gigs'), // or marketplace_items
                    fetchDetails('event', 'events'),
                    fetchDetails('course', 'courses'),
                    fetchDetails('scholarship', 'scholarships'),
                    fetchDetails('community', 'communities'),
                    fetchDetails('post', 'posts')
                ]);

                setGroupedItems({
                    job: jobs,
                    gig: gigs,
                    event: events,
                    course: courses,
                    scholarship: scholarships,
                    community: communities,
                    post: posts
                });

            } catch (err) {
                console.error("Failed to load saved items", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSaved();
    }, [user]);

    const handleRemove = async (saveId, type) => {
        setRemovingId(saveId);
        try {
            const { error } = await supabase.from('saved_items').delete().eq('id', saveId);
            if (error) throw error;
            
            // Update local state
            setGroupedItems(prev => ({
                ...prev,
                [type]: prev[type].filter(i => i.id !== saveId)
            }));
            
            showToast('Item removed from Saved', 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to remove item', 'error');
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) return <PageLoader message="Loading saved items..." />;

    const currentItems = groupedItems[activeTab] || [];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => showToast(null)} />}
            
            <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Saved Items</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '1.05rem' }}>Your personal collection of bookmarked content.</p>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {tabs.map(tab => {
                        const count = groupedItems[tab.id]?.length || 0;
                        return (
                            <div 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{ 
                                    padding: '0.6rem 1.25rem', 
                                    cursor: 'pointer', 
                                    fontSize: '0.95rem', 
                                    fontWeight: 700,
                                    color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--text-primary)' : '2px solid transparent',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                {tab.label}
                                {count > 0 && (
                                    <span style={{ 
                                        background: activeTab === tab.id ? 'var(--text-primary)' : 'var(--bg-elevated)', 
                                        color: activeTab === tab.id ? 'var(--bg-base)' : 'var(--text-muted)', 
                                        padding: '0.1rem 0.5rem', 
                                        borderRadius: 12, 
                                        fontSize: '0.7rem' 
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Tab Content */}
                <div style={{ minHeight: 400 }}>
                    {currentItems.length > 0 ? (
                        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {currentItems.map(item => {
                                // Extract standard display fields regardless of source table
                                const title = item.content.title || item.content.name || item.content.content?.substring(0, 50) || 'Untitled';
                                const subtitle = item.content.company_name || item.content.client_name || item.content.category || item.content.location || '';
                                const description = item.content.description || item.content.content || '';
                                
                                // Determine Open/Apply route
                                let route = '';
                                if (activeTab === 'job' || activeTab === 'gig') route = '/earn';
                                if (activeTab === 'event') route = `/events/${item.content.slug || item.content.id}`;
                                if (activeTab === 'course' || activeTab === 'scholarship') route = '/learn';
                                if (activeTab === 'community') route = `/network?community=${item.content.id}`;
                                if (activeTab === 'post') route = '/dashboard';

                                return (
                                    <div key={item.id} style={{ border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {title}
                                                </h4>
                                                <button 
                                                    onClick={() => handleRemove(item.id, activeTab)} 
                                                    disabled={removingId === item.id}
                                                    title="Remove from saved"
                                                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', transition: 'color 0.2s', padding: 0 }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                >
                                                    {removingId === item.id ? <ButtonSpinner /> : '🔖'}
                                                </button>
                                            </div>
                                            {subtitle && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>{subtitle}</div>}
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>
                                                {description}
                                            </p>
                                        </div>
                                        
                                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                                            <button 
                                                onClick={() => navigate(route)} 
                                                style={{ padding: '0.5rem 1.25rem', borderRadius: 10, border: 'none', background: 'var(--bg-elevated)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--border-color)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                            >
                                                Open {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 0', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16 }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📑</div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>No {tabs.find(t => t.id === activeTab)?.label} Saved</h3>
                            <p style={{ fontSize: '0.95rem', margin: 0 }}>Items you save will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
