import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { useNavigate, Link } from 'react-router-dom';
import { ButtonSpinner } from '../../components/Spinner.jsx';
import Toast, { useToast } from '../../components/Toast.jsx';

export default function ConnectPeersTab({ user }) {
    const navigate = useNavigate();
    const { toast, showToast } = useToast();
    
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

    const handleConnect = async (studentId) => {
        if (!user) return;
        setActionLoadingId(studentId);
        try {
            const { data, error } = await supabase.from('connection_requests').insert({
                sender_id: user.id,
                receiver_id: studentId,
                status: 'pending'
            }).select().single();
            if (error) throw error;
            setRequestsSent(prev => [...prev, data]);
            showToast('Connection request sent!', 'success');
        } catch (err) {
            showToast('Failed to connect', 'error');
        }
        setActionLoadingId(null);
    };

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

    const handleMessage = async (studentId) => {
        if (!user) return;
        
        // Ensure they are connected first
        if (!connections.includes(studentId)) {
            if (confirm("You need to connect with this user before messaging them. Send a connection request now?")) {
                handleConnect(studentId);
            }
            return;
        }

        setActionLoadingId(studentId);
        try {
            const { data: conversationId, error } = await supabase.rpc('start_direct_conversation', {
                other_user_id: studentId
            });
            if (error) throw error;
            if (conversationId) navigate(`/messages?conversation=${conversationId}`);
        } catch (err) {
            showToast('Failed to start chat', 'error');
        }
        setActionLoadingId(null);
    };

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
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {displayStudents.map(student => (
                                <StudentCard 
                                    key={student.id} 
                                    student={student} 
                                    status={getConnectionStatus(student.id)}
                                    isLoading={actionLoadingId === student.id}
                                    onConnect={() => handleConnect(student.id)}
                                    onAccept={() => handleAccept(student.id)}
                                    onDecline={() => handleDecline(student.id)}
                                    onCancel={() => handleCancel(student.id)}
                                    onMessage={() => handleMessage(student.id)}
                                />
                            ))}
                        </div>
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

function StudentCard({ student, status, isLoading, onConnect, onAccept, onDecline, onCancel, onMessage }) {
    const avatarLetter = (student.full_name || student.username || '?')[0].toUpperCase();
    
    return (
        <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <Link to={`/profile/${student.username || student.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
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
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {student.full_name || student.username}
                            </h4>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {student.college || 'Student'}
                        </p>
                    </div>
                </div>
            </Link>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {student.course && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>📚</span> <span>{student.course}</span>
                    </div>
                )}
                {/* Mock Mutual Connections for MVP */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--emerald)' }}>●</span> <span>Active recently</span>
                </div>
            </div>
            
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button 
                    onClick={onMessage}
                    style={{ flex: 1, padding: '0.55rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                >
                    💬 Message
                </button>
                
                {status === 'none' && (
                    <button onClick={onConnect} disabled={isLoading} style={{ flex: 1, padding: '0.55rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--peacock-green)', color: '#fff', border: 'none' }}>
                        {isLoading ? <ButtonSpinner label="..." /> : 'Connect'}
                    </button>
                )}
                
                {status === 'pending_sent' && (
                    <button onClick={onCancel} disabled={isLoading} style={{ flex: 1, padding: '0.55rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                        {isLoading ? <ButtonSpinner label="..." /> : 'Cancel'}
                    </button>
                )}

                {status === 'pending_received' && (
                    <>
                        <button onClick={onAccept} disabled={isLoading} style={{ flex: 1, padding: '0.55rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--peacock-green)', color: '#fff', border: 'none' }}>
                            {isLoading ? <ButtonSpinner label="..." /> : 'Accept'}
                        </button>
                        <button onClick={onDecline} disabled={isLoading} style={{ padding: '0.55rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                            Decline
                        </button>
                    </>
                )}

                {status === 'connected' && (
                    <button disabled style={{ flex: 1, padding: '0.55rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-mint)', color: 'var(--peacock-green)', border: '1px solid var(--border-mint)' }}>
                        Connected
                    </button>
                )}
            </div>
        </div>
    );
}
