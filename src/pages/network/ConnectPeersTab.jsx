import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useNavigate } from 'react-router-dom';
import { ButtonSpinner } from '../../components/Spinner.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';
import { usePresence } from '../../hooks/usePresence.js';

export default function ConnectPeersTab({ user }) {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    const { onlineUsers } = usePresence(); // real global presence channel, already used in Messages.jsx

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterQuery, setFilterQuery] = useState('');
    
    const [connections, setConnections] = useState([]);
    const [requestsSent, setRequestsSent] = useState([]);
    const [requestsReceived, setRequestsReceived] = useState([]);
    const [blockedIds, setBlockedIds] = useState(new Set());
    
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [activeTab, setActiveTab] = useState('Discover');

    const fetchStudentsAndConnections = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 0. Fetch own profile to get college, course, interests
            let myProfile = null;
            try {
                const { data } = await supabase.from('profiles').select('college, course, interests').eq('id', user.id).single();
                myProfile = data;
            } catch(e) { console.error(e); }

            // 1. Fetch all students (limit 150 for recommendations pool)
            const { data: allStudents, error } = await supabase
                .from('public_profiles')
                .select('*')
                .neq('id', user.id)
                .limit(150);
            if (error) throw error;
            
            // 2. Fetch connections
            const { data: conns } = await supabase.from('connections').select('*')
                .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);
            const connectedIds = (conns || []).map(c => c.user_one === user.id ? c.user_two : c.user_one);
            setConnections(connectedIds);
            
            // 3. Fetch requests
            const { data: reqs } = await supabase.from('connection_requests').select('*')
                .in('status', ['pending'])
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
            
            const sent = (reqs || []).filter(r => r.sender_id === user.id);
            const received = (reqs || []).filter(r => r.receiver_id === user.id);
            setRequestsSent(sent);
            setRequestsReceived(received);

            // 4. Fetch blocks
            const { data: blocks } = await supabase.from('user_blocks').select('*')
                .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);
            const bIds = new Set((blocks || []).map(b => b.blocker_id === user.id ? b.blocked_id : b.blocker_id));
            setBlockedIds(bIds);

            // Filter out blocked
            let availableStudents = (allStudents || []).filter(s => !bIds.has(s.id));

            // Sort by recommendation logic (People You May Know)
            if (myProfile) {
                const myCollege = (myProfile.college || '').toLowerCase();
                const myCourse = (myProfile.course || '').toLowerCase();
                const myInterests = myProfile.interests || [];

                availableStudents.sort((a, b) => {
                    let scoreA = 0;
                    let scoreB = 0;
                    
                    if (myCollege && a.college && a.college.toLowerCase() === myCollege) scoreA += 3;
                    if (myCourse && a.course && a.course.toLowerCase() === myCourse) scoreA += 2;
                    if (a.interests && Array.isArray(a.interests)) {
                        scoreA += a.interests.filter(i => myInterests.includes(i)).length;
                    }

                    if (myCollege && b.college && b.college.toLowerCase() === myCollege) scoreB += 3;
                    if (myCourse && b.course && b.course.toLowerCase() === myCourse) scoreB += 2;
                    if (b.interests && Array.isArray(b.interests)) {
                        scoreB += b.interests.filter(i => myInterests.includes(i)).length;
                    }

                    return scoreB - scoreA;
                });
            }

            setStudents(availableStudents);
            
        } catch (err) {
            console.error('Error fetching peers:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentsAndConnections();
    }, [user]);

    // Sending a new connection request no longer happens from this list —
    // Profile.jsx already has its own full Connect flow (handleConnect,
    // same connection_requests insert) for whoever's profile you land on.
    // Removed the duplicate handleConnect here rather than leave it dead.

    const handleAccept = async (studentId) => {
        setActionLoadingId(studentId);
        try {
            const req = requestsReceived.find(r => r.sender_id === studentId);
            if (!req) throw new Error("Request not found");
            const { error } = await supabase.rpc('accept_connection_request', { p_request_id: req.id });
            if (error) throw error;
            setRequestsReceived(prev => prev.filter(r => r.id !== req.id));
            setConnections(prev => [...prev, studentId]);
            showToast('Request accepted!', 'success');
        } catch(e) {
            showToast('Failed to accept request', 'error');
        }
        setActionLoadingId(null);
    };

    const handleDecline = async (studentId) => {
        setActionLoadingId(studentId);
        try {
            const req = requestsReceived.find(r => r.sender_id === studentId);
            if (!req) throw new Error("Request not found");
            const { error } = await supabase.from('connection_requests').update({ status: 'declined' }).eq('id', req.id);
            if (error) throw error;
            setRequestsReceived(prev => prev.filter(r => r.id !== req.id));
            showToast('Request declined.', 'success');
        } catch(e) {
            showToast('Failed to decline', 'error');
        }
        setActionLoadingId(null);
    };

    const handleCancel = async (studentId) => {
        setActionLoadingId(studentId);
        try {
            const req = requestsSent.find(r => r.receiver_id === studentId);
            if (!req) throw new Error("Request not found");
            const { error } = await supabase.from('connection_requests').update({ status: 'cancelled' }).eq('id', req.id);
            if (error) throw error;
            setRequestsSent(prev => prev.filter(r => r.id !== req.id));
            showToast('Request cancelled.', 'success');
        } catch(e) {
            showToast('Failed to cancel', 'error');
        }
        setActionLoadingId(null);
    };

    // Messaging is no longer initiated from this list — tapping a row opens
    // the real profile page, which already has its own working Message
    // button (Profile.jsx, same start_direct_conversation RPC). Removed the
    // old inline handleMessage here rather than leave it dead.

    const getConnectionStatus = (studentId) => {
        if (connections.includes(studentId)) return 'connected';
        if (requestsSent.find(r => r.receiver_id === studentId)) return 'pending_sent';
        if (requestsReceived.find(r => r.sender_id === studentId)) return 'pending_received';
        return 'none';
    };

    const tabs = ['Discover', 'My Connections', 'Pending Requests'];

    const filteredStudents = students.filter(s => {
        if (!filterQuery) return true;
        const q = filterQuery.toLowerCase();
        return (
            s.full_name?.toLowerCase().includes(q) ||
            s.username?.toLowerCase().includes(q) ||
            s.college?.toLowerCase().includes(q)
        );
    });

    const displayStudents = filteredStudents.filter(s => {
        const status = getConnectionStatus(s.id);
        if (activeTab === 'My Connections') return status === 'connected';
        if (activeTab === 'Pending Requests') return status === 'pending_received';
        
        // Discover: show people you may know (not connected, not pending_received)
        // We can show pending_sent in Discover so they see who they've requested.
        if (activeTab === 'Discover') {
            return status === 'none' || status === 'pending_sent';
        }
        return true;
    });

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out', display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            {/* Main Content */}
            <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.5rem', fontWeight: 900 }}>Connect with Peers</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Find students across India based on interests, skills and career goals.
                    </p>
                </div>

                {/* Search & Tabs Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input 
                        type="text" 
                        placeholder="Search by name, skills, interests or college..."
                        value={filterQuery}
                        onChange={e => setFilterQuery(e.target.value)}
                        style={{
                            width: '100%', padding: '0.75rem 1rem', borderRadius: 12,
                            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem'
                        }}
                    />
                    
                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', scrollbarWidth: 'none' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: 'none', border: 'none', padding: '0.5rem 0',
                                    color: activeTab === tab ? 'var(--peacock-green)' : 'var(--text-muted)',
                                    fontWeight: activeTab === tab ? 800 : 600,
                                    fontSize: '0.85rem', cursor: 'pointer',
                                    borderBottom: activeTab === tab ? '2px solid var(--peacock-green)' : '2px solid transparent',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {tab}
                                {tab === 'Pending Requests' && requestsReceived.length > 0 && (
                                    <span style={{ marginLeft: '0.5rem', background: 'var(--error-red)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: 10, fontSize: '0.7rem' }}>
                                        {requestsReceived.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Student Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}><ButtonSpinner label="Loading peers..." /></div>
                ) : (
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            {displayStudents.length} students found
                        </p>
                        
                        {displayStudents.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                {activeTab === 'My Connections' && "You haven't connected with anyone yet."}
                                {activeTab === 'Pending Requests' && "No pending requests right now."}
                                {activeTab === 'Discover' && "No students found."}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                                {displayStudents.map((student, i) => (
                                    <StudentListRow
                                        key={student.id}
                                        student={student}
                                        status={getConnectionStatus(student.id)}
                                        isLoading={actionLoadingId === student.id}
                                        isOnline={onlineUsers.has(student.id)}
                                        isLast={i === displayStudents.length - 1}
                                        onAccept={() => handleAccept(student.id)}
                                        onDecline={() => handleDecline(student.id)}
                                        onCancel={() => handleCancel(student.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Rail: Filters (Desktop only) */}
            <div style={{ width: 280, display: 'none', flexShrink: 0 }} className="desktop-filters">
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', position: 'sticky', top: '100px' }}>
                    <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 800 }}>Refine Your Search</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <FilterSelect label="College" options={['All Colleges', 'NIT Trichy', 'VIT Chennai', 'IIT Delhi']} />
                        <FilterSelect label="Course / Branch" options={['All Courses', 'B.Tech CS', 'B.Design', 'BBA']} />
                        <FilterSelect label="Year of Study" options={['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year']} />
                        <FilterSelect label="Location" options={['All Locations', 'Bangalore', 'Mumbai', 'Chennai', 'Delhi']} />
                        
                        <button style={{
                            width: '100%', padding: '0.7rem', borderRadius: 8, background: 'var(--peacock-green)',
                            color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginTop: '0.5rem'
                        }}>
                            Apply Filters
                        </button>
                    </div>
                </div>
            </div>
            
            <style>{`
                @media (min-width: 1024px) {
                    .desktop-filters { display: block !important; }
                }
            `}</style>
        </div>
    );
}

function FilterSelect({ label, options }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{label}</label>
            <select style={{
                width: '100%', padding: '0.6rem', borderRadius: 8, background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.8rem', cursor: 'pointer'
            }}>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );
}

// List row — replaces the old card grid. The whole row navigates to the
// real profile page on tap (per redesign brief: messaging + connect both
// live there now, not inline in this list). Accept/Decline/Cancel are kept
// as inline buttons (stopPropagation'd so they don't also trigger the row
// navigation) because they're real connection-request management, not the
// Connect/Chat actions the redesign asked to remove — dropping them would
// leave Pending Requests with no way to respond at all.
function StudentListRow({ student, status, isLoading, isOnline, isLast, onAccept, onDecline, onCancel }) {
    const navigate = useNavigate();
    const avatarLetter = (student.full_name || student.username || '?')[0].toUpperCase();
    const skills = Array.isArray(student.skills) ? student.skills.filter(Boolean) : [];

    const goToProfile = () => navigate(`/profile/${student.username || student.id}`);
    const stop = (fn) => (e) => { e.stopPropagation(); fn(); };

    return (
        <div
            onClick={goToProfile}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') goToProfile(); }}
            style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.9rem 1.1rem',
                borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
                cursor: 'pointer', transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
            <div style={{ flexShrink: 0, position: 'relative' }}>
                {student.avatar_url ? (
                    <img src={student.avatar_url} alt="Avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.2rem'
                    }}>
                        {avatarLetter}
                    </div>
                )}
                {isOnline && (
                    <span title="Online now" style={{
                        position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%',
                        background: 'var(--emerald)', border: '2px solid var(--bg-surface)'
                    }} />
                )}
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {student.full_name || student.username}
                </h4>
                <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {[student.college, student.course].filter(Boolean).join(' · ') || 'Student'}
                </p>
                {skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.4rem' }}>
                        {skills.slice(0, 3).map(s => (
                            <span key={s} style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, background: 'var(--bg-mint)', color: 'var(--peacock-green)' }}>
                                {s}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {status === 'pending_received' && (
                    <>
                        <button onClick={stop(onAccept)} disabled={isLoading} style={{ padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'var(--peacock-green)', color: '#fff', border: 'none' }}>
                            {isLoading ? <ButtonSpinner label="..." /> : 'Accept'}
                        </button>
                        <button onClick={stop(onDecline)} disabled={isLoading} style={{ padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                            Decline
                        </button>
                    </>
                )}
                {status === 'pending_sent' && (
                    <button onClick={stop(onCancel)} disabled={isLoading} style={{ padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        {isLoading ? <ButtonSpinner label="..." /> : 'Requested'}
                    </button>
                )}
                {status === 'connected' && (
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: 20, background: 'var(--bg-mint)', color: 'var(--peacock-green)', border: '1px solid var(--border-mint)' }}>
                        Connected
                    </span>
                )}
                <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>›</span>
            </div>
        </div>
    );
}
