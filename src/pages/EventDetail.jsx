import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import SaveButton from '../components/SaveButton.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';

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

export default function EventDetail() {
    const { id } = useParams(); // Could be ID or slug
    const { toast, showToast, hideToast } = useToast();

    const [user, setUser] = useState(null);
    const [event, setEvent] = useState(null);
    const [similarEvents, setSimilarEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Registration State
    const [regStatus, setRegStatus] = useState(null); // 'confirmed', 'waitlisted', 'cancelled', or null
    const [registering, setRegistering] = useState(false);

    const [activeTab, setActiveTab] = useState('about');

    useEffect(() => {
        let isMounted = true;
        
        const loadUserAndEvent = async () => {
            setLoading(true);
            try {
                // 1. Get session
                const { data: { session } } = await supabase.auth.getSession();
                let currentUser = null;
                if (session) {
                    currentUser = session.user;
                    setUser(currentUser);
                }

                // 2. Fetch event by id or slug
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
                const query = supabase.from('events').select('*');
                if (isUuid) {
                    query.eq('id', id);
                } else {
                    query.eq('slug', id);
                }
                const { data: evtData, error: evtErr } = await query.single();
                
                if (evtErr) throw evtErr;
                if (!isMounted) return;
                setEvent(evtData);

                // 3. Fetch similar events
                if (evtData.category) {
                    const { data: similar } = await supabase
                        .from('events')
                        .select('*')
                        .eq('category', evtData.category)
                        .neq('id', evtData.id)
                        .limit(3);
                    if (similar && isMounted) setSimilarEvents(similar);
                }

                // 4. Check registration status if logged in
                if (currentUser) {
                    const { data: regData } = await supabase
                        .from('event_registrations')
                        .select('status')
                        .eq('event_id', evtData.id)
                        .eq('user_id', currentUser.id)
                        .maybeSingle();
                    if (regData && isMounted) {
                        setRegStatus(regData.status);
                    }
                }

            } catch (err) {
                console.error(err);
                if (isMounted) setEvent(null);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        
        loadUserAndEvent();
        return () => { isMounted = false; };
    }, [id]);

    const handleRegister = async () => {
        if (!user) {
            showToast('Please log in to register', 'error');
            return;
        }

        const isFree = !event.price || Number(event.price) === 0;
        
        if (!isFree) {
            if (event.payment_link) {
                window.open(event.payment_link, '_blank', 'noopener,noreferrer');
            } else {
                showToast('Payment link unavailable for this event', 'error');
            }
            return;
        }

        // Free event registration logic
        setRegistering(true);
        try {
            const seatsFilled = event.seats_filled || 0;
            const seatsTotal = event.seats_total;
            
            const isFull = seatsTotal !== null && seatsFilled >= seatsTotal;
            
            if (isFull && !event.allow_waitlist) {
                showToast('Registration is full!', 'error');
                return;
            }

            const targetStatus = isFull ? 'waitlisted' : 'confirmed';

            const { error } = await supabase.from('event_registrations').insert({
                event_id: event.id,
                user_id: user.id,
                status: targetStatus
            });

            if (error) throw error;
            
            setRegStatus(targetStatus);
            showToast(`Successfully ${targetStatus}!`);
            
            // Optimistically update seats filled if confirmed
            if (targetStatus === 'confirmed') {
                setEvent(prev => ({ ...prev, seats_filled: (prev.seats_filled || 0) + 1 }));
            }
        } catch (err) {
            console.error(err);
            if (err.code === '23505') {
                showToast('You are already registered.', 'error');
            } else {
                showToast('Failed to register: ' + err.message, 'error');
            }
        } finally {
            setRegistering(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.title,
                    text: `Check out ${event.title} on Chavee!`,
                    url: url
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard!');
        }
    };

    const generateICS = () => {
        if (!event) return;
        
        const pad = (n) => (n < 10 ? '0' + n : n);
        const formatICSDate = (dateString) => {
            const d = new Date(dateString);
            return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
        };

        const dtstart = event.event_date ? formatICSDate(event.event_date) : '';
        // If no end time, assume 1 hour duration
        const dtendObj = event.event_date ? new Date(new Date(event.event_date).getTime() + 60 * 60 * 1000) : new Date();
        const dtend = formatICSDate(dtendObj.toISOString());

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Chavee//Events//EN',
            'BEGIN:VEVENT',
            `UID:${event.id}@chavee.com`,
            `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
            `DTSTART:${dtstart}`,
            `DTEND:${dtend}`,
            `SUMMARY:${event.title}`,
            `DESCRIPTION:${event.description?.replace(/\n/g, '\\n') || ''}`,
            `LOCATION:${event.mode === 'online' ? 'Online' : (event.location || '')}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 44, height: 44, border: '3px solid var(--peacock-green)', borderTopColor: 'var(--emerald-light)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
        );
    }

    if (!event) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎪</div>
                <h1 style={{ margin: '0 0 1rem', fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>Event Not Found</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>This event may have been removed or does not exist.</p>
                <Link to="/events" style={{ padding: '0.8rem 1.5rem', background: 'var(--peacock-green)', color: '#fff', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>
                    ← Back to Events
                </Link>
            </div>
        );
    }

    const catColor = CAT_COLORS[event.category] || 'var(--peacock-green)';
    const isFree = !event.price || Number(event.price) === 0;
    const seatsTotal = event.seats_total;
    const seatsFilled = event.seats_filled || 0;
    const seatsLeft = seatsTotal !== null ? Math.max(0, seatsTotal - seatsFilled) : null;
    const isFull = seatsTotal !== null && seatsLeft === 0;
    
    // Quick Facts
    const quickFacts = [];
    if (isFree) quickFacts.push('🎉 Free Event');
    if (event.certificate_enabled) quickFacts.push('🎓 Certificate Included');
    quickFacts.push('👥 Open for All Students');

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', paddingBottom: '4rem' }}>
            <Toast toast={toast} onClose={hideToast} />

            {/* Hero Banner */}
            <div style={{ position: 'relative', background: 'var(--bg-elevated)', minHeight: 400, display: 'flex', alignItems: 'center' }}>
                {event.image_url ? (
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
                        <img src={event.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, var(--bg-base) 0%, transparent 100%)' }} />
                    </div>
                ) : (
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${catColor}15 0%, var(--bg-base) 100%)` }} />
                )}
                
                <div style={{ position: 'relative', padding: '4rem 5%', maxWidth: 1400, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span style={{ background: catColor, color: '#fff', padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
                            {event.category || 'Event'}
                        </span>
                        {event.status?.toLowerCase() === 'coming_soon' && (
                            <span style={{ background: '#F59E0B', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
                                Coming Soon
                            </span>
                        )}
                    </div>
                    
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, maxWidth: 800, lineHeight: 1.2 }}>{event.title}</h1>
                    <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 700 }}>
                        {event.description?.substring(0, 150)}{event.description?.length > 150 ? '...' : ''}
                    </p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '1.2rem' }}>📅</span>
                            <span style={{ fontWeight: 600 }}>{event.event_date ? new Date(event.event_date).toLocaleString('en-IN', { weekday: 'long', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date TBA'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '1.2rem' }}>📍</span>
                            <span style={{ fontWeight: 600 }}>{event.mode === 'online' ? 'Online' : event.location || 'Location TBA'}</span>
                        </div>
                        {seatsFilled > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                <span style={{ fontSize: '1.2rem' }}>👥</span>
                                <span style={{ fontWeight: 600 }}>{seatsFilled} attendees</span>
                            </div>
                        )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button onClick={handleShare} style={{ padding: '0.6rem 1.2rem', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🔗</span> Share
                        </button>
                        <SaveButton itemType="events" itemId={event.id} />
                    </div>
                </div>
            </div>

            <div style={{ padding: '2rem 5%', maxWidth: 1400, margin: '0 auto', display: 'flex', gap: '3rem', flexDirection: 'column', md: { flexDirection: 'row' } }}>
                
                {/* Main Content Area */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        {['About', event.host_name ? 'Speakers' : null, 'Details'].filter(Boolean).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                style={{
                                    padding: '1rem 0',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: `3px solid ${activeTab === tab.toLowerCase() ? 'var(--peacock-green)' : 'transparent'}`,
                                    color: activeTab === tab.toLowerCase() ? 'var(--text-primary)' : 'var(--text-muted)',
                                    fontWeight: activeTab === tab.toLowerCase() ? 800 : 600,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                        {activeTab === 'about' && (
                            <div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2rem' }}>
                                    {quickFacts.map((fact, i) => (
                                        <span key={i} style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                            {fact}
                                        </span>
                                    ))}
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>About this event</h3>
                                <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                    {event.description || 'No detailed description available.'}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'speakers' && event.host_name && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>Hosted By</h3>
                                <div style={{ padding: '1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--peacock-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                                        {event.host_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 800 }}>{event.host_name}</h4>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Event Host & Organizer</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'details' && (
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem' }}>Event Details</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <div>
                                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mode</p>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{event.mode === 'online' ? 'Online' : event.mode === 'offline' ? 'In-Person' : 'Hybrid'}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Certificate</p>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>{event.certificate_enabled ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Seats</p>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>
                                            {seatsTotal === null ? 'Unlimited' : `${seatsFilled} / ${seatsTotal}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Similar Events */}
                    {similarEvents.length > 0 && (
                        <div style={{ marginTop: '4rem' }}>
                            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 1.5rem' }}>Similar Events</h3>
                            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {similarEvents.map(sim => (
                                    <Link key={sim.id} to={`/events/${sim.slug || sim.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-color)', padding: '1rem', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } }}>
                                            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.2 }}>{sim.title}</h4>
                                            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {sim.event_date ? new Date(sim.event_date).toLocaleDateString('en-IN') : 'TBA'} • {sim.mode}
                                            </p>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: (!sim.price || sim.price == 0) ? 'var(--peacock-green)' : 'var(--text-primary)' }}>
                                                {(!sim.price || sim.price == 0) ? 'Free' : `₹${sim.price}`}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Registration */}
                <div style={{ width: '100%', maxWidth: 380, flexShrink: 0 }}>
                    <div style={{ position: 'sticky', top: '2rem' }}>
                        <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 20, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: isFree ? 'var(--peacock-green)' : 'var(--text-primary)' }}>
                                    {isFree ? 'Free' : `₹${event.price}`}
                                </span>
                                {event.certificate_enabled && (
                                    <span style={{ padding: '0.3rem 0.6rem', background: '#F59E0B15', color: '#F59E0B', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700 }}>
                                        Includes Cert
                                    </span>
                                )}
                            </div>

                            <div style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 12, marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Availability</span>
                                    <span style={{ fontWeight: 800 }}>
                                        {seatsLeft === null ? 'Open' : seatsLeft > 0 ? `${seatsLeft} left` : 'Full'}
                                    </span>
                                </div>
                                {event.registration_deadline && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Deadline</span>
                                        <span style={{ fontWeight: 800 }}>{new Date(event.registration_deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                )}
                            </div>

                            {regStatus ? (
                                <div style={{ padding: '1rem', background: regStatus === 'waitlisted' ? '#F59E0B15' : 'var(--emerald-light)', border: `1px solid ${regStatus === 'waitlisted' ? '#F59E0B30' : 'var(--peacock-green)'}`, borderRadius: 12, textAlign: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ margin: '0 0 0.25rem', color: regStatus === 'waitlisted' ? '#F59E0B' : 'var(--peacock-green)', fontSize: '1.1rem', fontWeight: 800 }}>
                                        {regStatus === 'waitlisted' ? 'Waitlisted' : 'Registered!'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                        {regStatus === 'waitlisted' ? 'You are on the waitlist for this event.' : 'Your spot is confirmed.'}
                                    </p>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleRegister}
                                    disabled={registering || (isFull && !event.allow_waitlist)}
                                    style={{ 
                                        width: '100%', padding: '1rem', borderRadius: 12, border: 'none', 
                                        background: (isFull && !event.allow_waitlist) ? 'var(--bg-elevated)' : 'var(--peacock-green)', 
                                        color: (isFull && !event.allow_waitlist) ? 'var(--text-muted)' : '#fff', 
                                        fontSize: '1.1rem', fontWeight: 800, cursor: (isFull && !event.allow_waitlist) ? 'not-allowed' : 'pointer',
                                        marginBottom: '1rem', transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    {registering ? <ButtonSpinner /> : (
                                        (isFull && !event.allow_waitlist) ? 'Registration Full' :
                                        (isFull && event.allow_waitlist) ? 'Join Waitlist' :
                                        isFree ? 'Register Now' : 'Pay & Register'
                                    )}
                                </button>
                            )}

                            <button 
                                onClick={generateICS}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: 12, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                            >
                                <span>📅</span> Add to Calendar
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
