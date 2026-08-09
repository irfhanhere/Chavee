import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import SaveButton from '../components/SaveButton.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';

const CATEGORIES = [
    { value: 'All', label: 'All', icon: '🌟' },
    { value: 'Workshops', label: 'Workshops', icon: '🛠' },
    { value: 'Webinars', label: 'Webinars', icon: '💻' },
    { value: 'Hackathons', label: 'Hackathons', icon: '🏆' },
    { value: 'Fests', label: 'Fests', icon: '🎪' },
    { value: 'Meetups', label: 'Meetups', icon: '🤝' },
    { value: 'Competitions', label: 'Competitions', icon: '🎯' },
    { value: 'Career Events', label: 'Career Events', icon: '💼' }
];

const CAT_COLORS = {
    'Workshops': '#10B981',
    'Webinars': '#3B82F6',
    'Hackathons': '#F59E0B',
    'Fests': '#EC4899',
    'Meetups': '#8B5CF6',
    'Competitions': '#EF4444',
    'Career Events': '#14B8A6',
    'All': '#10B981'
};

export default function Events() {
    const { toast, showToast, hideToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const [eventsList, setEventsList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters from URL
    const qSearch = searchParams.get('q') || '';
    const qCategory = searchParams.get('category') || 'All';
    const qMode = searchParams.get('mode') || 'All';
    const qDate = searchParams.get('date') || 'All';

    const updateFilter = (key, value) => {
        const newParams = new URLSearchParams(searchParams);
        if (value && value !== 'All' && value !== '') {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        setSearchParams(newParams);
    };

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .neq('status', 'draft') // Assuming we hide drafts
                    .order('event_date', { ascending: true });
                if (error) throw error;
                setEventsList(data || []);
            } catch (err) {
                console.error(err);
                showToast('Failed to load events', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        return eventsList.filter(e => {
            if (qCategory !== 'All' && e.category !== qCategory) return false;
            if (qMode !== 'All' && e.mode?.toLowerCase() !== qMode.toLowerCase()) return false;
            
            if (qSearch) {
                const term = qSearch.toLowerCase();
                if (!e.title?.toLowerCase().includes(term) && !e.description?.toLowerCase().includes(term)) {
                    return false;
                }
            }
            
            if (qDate !== 'All' && e.event_date) {
                const evtDate = new Date(e.event_date);
                const now = new Date();
                if (qDate === 'Upcoming' && evtDate < now) return false;
                if (qDate === 'Past' && evtDate >= now) return false;
                if (qDate === 'This Week') {
                    const nextWeek = new Date(now);
                    nextWeek.setDate(now.getDate() + 7);
                    if (evtDate < now || evtDate > nextWeek) return false;
                }
                if (qDate === 'This Month') {
                    if (evtDate.getMonth() !== now.getMonth() || evtDate.getFullYear() !== now.getFullYear()) return false;
                }
            }

            return true;
        });
    }, [eventsList, qSearch, qCategory, qMode, qDate]);

    const upcomingEvents = useMemo(() => {
        return [...eventsList]
            .filter(e => new Date(e.event_date) > new Date())
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .slice(0, 5);
    }, [eventsList]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', paddingBottom: '4rem' }}>
            <Toast toast={toast} onClose={hideToast} />
            
            {/* Hero Section */}
            <div style={{ 
                background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-base) 100%)', 
                borderBottom: '1px solid var(--border-color)', 
                padding: '4rem 5%', 
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: 300, height: 300, background: 'var(--peacock-green)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 250, height: 250, background: 'var(--accent-gold)', filter: 'blur(100px)', opacity: 0.1, borderRadius: '50%' }} />
                
                <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '1rem', position: 'relative' }}>
                    Student <span style={{ color: 'var(--peacock-green)' }}>Events</span> & Workshops
                </h1>
                <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto 2rem', lineHeight: 1.6, position: 'relative' }}>
                    Discover hackathons, webinars, meetups, and career events near you. Upgrade your skills and network with peers.
                </p>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                    <input 
                        type="text" 
                        placeholder="Search events..." 
                        value={qSearch}
                        onChange={(e) => updateFilter('q', e.target.value)}
                        style={{ padding: '0.8rem 1.5rem', borderRadius: 30, border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', maxWidth: 400, fontSize: '1rem' }}
                    />
                </div>
            </div>

            <div style={{ padding: '2rem 5%', maxWidth: 1400, margin: '0 auto', display: 'flex', gap: '2rem', flexDirection: 'column', md: { flexDirection: 'row' } }}>
                
                {/* Main Content */}
                <div style={{ flex: 1 }}>
                    
                    {/* Filter Panel */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="hide-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', flex: 1, minWidth: 300 }}>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => updateFilter('category', cat.value)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: 20,
                                        border: `1px solid ${qCategory === cat.value ? (CAT_COLORS[cat.value] || 'var(--peacock-green)') : 'var(--border-color)'}`,
                                        background: qCategory === cat.value ? `${CAT_COLORS[cat.value] || 'var(--peacock-green)'}15` : 'var(--bg-surface)',
                                        color: qCategory === cat.value ? (CAT_COLORS[cat.value] || 'var(--peacock-green)') : 'var(--text-secondary)',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {cat.icon} {cat.label}
                                </button>
                            ))}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select 
                                value={qDate} 
                                onChange={e => updateFilter('date', e.target.value)}
                                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                <option value="All">Any Date</option>
                                <option value="Upcoming">Upcoming</option>
                                <option value="This Week">This Week</option>
                                <option value="This Month">This Month</option>
                                <option value="Past">Past Events</option>
                            </select>
                            <select 
                                value={qMode} 
                                onChange={e => updateFilter('mode', e.target.value)}
                                style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                <option value="All">Any Mode</option>
                                <option value="online">Online</option>
                                <option value="offline">Offline</option>
                                <option value="hybrid">Hybrid</option>
                            </select>
                        </div>
                    </div>

                    {/* Events Grid */}
                    {loading ? (
                        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 16, height: 350, border: '1px solid var(--border-color)', animation: 'pulse 1.5s infinite' }} />
                            ))}
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-surface)', borderRadius: 16, border: '1px dashed var(--border-color)' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📭</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem' }}>No events available right now.</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Try adjusting your filters or search term.</p>
                            {(qSearch || qCategory !== 'All' || qDate !== 'All' || qMode !== 'All') && (
                                <button onClick={() => setSearchParams(new URLSearchParams())} style={{ marginTop: '1rem', padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {filteredEvents.map(evt => {
                                const catColor = CAT_COLORS[evt.category] || 'var(--peacock-green)';
                                const isFree = !evt.price || Number(evt.price) === 0;
                                const isComingSoon = evt.status?.toLowerCase() === 'coming_soon' || evt.status?.toLowerCase() === 'coming soon';
                                
                                // Attendee placeholder logic
                                const seatsFilled = evt.seats_filled || 0;
                                const showAvatars = seatsFilled > 0 ? Math.min(seatsFilled, 3) : 0;
                                
                                return (
                                    <div key={evt.id} style={{ 
                                        background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden', 
                                        display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                                        ':hover': { transform: 'translateY(-4px)', boxShadow: 'var(--shadow-md)' }
                                    }}>
                                        <div style={{ height: 160, background: 'var(--bg-elevated)', position: 'relative' }}>
                                            {evt.image_url ? (
                                                <img src={evt.image_url} alt={evt.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: `${catColor}15` }}>
                                                    {CATEGORIES.find(c => c.value === evt.category)?.icon || '🎪'}
                                                </div>
                                            )}
                                            
                                            <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ background: catColor, color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
                                                    {evt.category || 'Event'}
                                                </span>
                                                {isComingSoon && (
                                                    <span style={{ background: '#F59E0B', color: '#fff', padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
                                                        Coming Soon
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                                                <SaveButton itemType="events" itemId={evt.id} />
                                            </div>
                                        </div>
                                        
                                        <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                                {evt.title}
                                            </h3>
                                            
                                            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {evt.description || 'No description provided.'}
                                            </p>
                                            
                                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    <span>📅</span>
                                                    <span>{evt.event_date ? new Date(evt.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date TBA'}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    <span>📍</span>
                                                    <span>{evt.mode === 'online' ? 'Online' : evt.location || 'Location TBA'}</span>
                                                </div>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span style={{ fontWeight: 700, color: isFree ? 'var(--peacock-green)' : 'var(--text-primary)' }}>
                                                            {isFree ? 'Free' : `₹${evt.price}`}
                                                        </span>
                                                        {seatsFilled > 0 && (
                                                            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{seatsFilled} attending</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    <Link 
                                                        to={`/events/${evt.slug || evt.id}`}
                                                        style={{ 
                                                            padding: '0.4rem 0.8rem', borderRadius: 8, background: 'transparent', 
                                                            border: '1px solid var(--border-color)', color: 'var(--text-primary)', 
                                                            fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none'
                                                        }}
                                                    >
                                                        Details →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Rail */}
                <div style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🚀</span> Upcoming Events
                        </h3>
                        
                        {loading ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading...</p>
                        ) : upcomingEvents.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No upcoming events.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {upcomingEvents.map(evt => (
                                    <Link key={evt.id} to={`/events/${evt.slug || evt.id}`} style={{ textDecoration: 'none', display: 'flex', gap: '0.75rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', ':lastChild': { borderBottom: 'none', paddingBottom: 0 } }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--bg-elevated)', overflow: 'hidden', flexShrink: 0 }}>
                                            {evt.image_url ? (
                                                <img src={evt.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', background: `${CAT_COLORS[evt.category] || 'var(--peacock-green)'}15` }}>
                                                    {CATEGORIES.find(c => c.value === evt.category)?.icon || '🎪'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{evt.title}</h4>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(evt.event_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                        
                        <Link to="/events?date=Upcoming" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--peacock-green)', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                            View all upcoming →
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
