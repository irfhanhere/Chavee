import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';

import CommunitiesTab from './network/CommunitiesTab.jsx';
import ConnectPeersTab from './network/ConnectPeersTab.jsx';
import StudySyncTab from './network/StudySyncTab.jsx';
import CommunityLanding from './network/CommunityLanding.jsx';

export default function Network() {
    const { toast, showToast } = useToast();
    const { slug } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('Communities');

    // If a community is selected (via URL slug), this holds the community object and we render CommunityLanding
    const [activeCommunity, setActiveCommunity] = useState(null);
    const [communityLoading, setCommunityLoading] = useState(false);
    const [communityNotFound, setCommunityNotFound] = useState(false);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        getSession();
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });
        return () => authListener.subscription.unsubscribe();
    }, []);

    // Load the community directly from the URL slug — this is what makes a direct visit or
    // hard refresh of /network/:slug (or /network/:slug/join) work without requiring the
    // community to already be in memory from a list click.
    useEffect(() => {
        if (!slug) {
            setActiveCommunity(null);
            setCommunityNotFound(false);
            return;
        }

        let cancelled = false;
        const fetchBySlug = async () => {
            setCommunityLoading(true);
            setCommunityNotFound(false);
            const { data, error } = await supabase
                .from('communities')
                .select('*')
                .eq('slug', slug)
                .maybeSingle();
            if (cancelled) return;
            if (error || !data) {
                setActiveCommunity(null);
                setCommunityNotFound(true);
            } else {
                setActiveCommunity(data);
            }
            setCommunityLoading(false);
        };
        fetchBySlug();
        return () => { cancelled = true; };
    }, [slug]);

    // Clicking a community card navigates to its real URL instead of only changing local state.
    const handleOpenCommunity = (community) => {
        navigate(`/network/${community.slug}`);
    };

    const handleBackToNetwork = () => {
        navigate('/network');
    };

    // id matches the existing activeTab state values used below (line ~140's
    // conditional render) — only the display label changes ("Peer", not
    // "Connect with Peers"), so nothing downstream needs to change.
    const tabs = [
        { id: 'Communities', label: 'Communities', icon: '💼', iconBg: 'var(--bg-mint)', desc: 'Join topic-based communities' },
        { id: 'Connect with Peers', label: 'Peer', icon: '👥', iconBg: 'rgba(217,119,6,0.12)', desc: 'Connect with students' },
        { id: 'Study Sync', label: 'Study Sync', icon: '📖', iconBg: 'rgba(99,102,241,0.12)', desc: 'Find study partners & groups' },
    ];

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            {/* Header & Navigation */}
            {!slug && (
                <div style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
                    {/* Header */}
                    <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Network</h1>
                            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Find communities, study partners and peers across India.
                            </p>
                        </div>
                        {/* Global Search can go here */}
                    </div>

                    {/* Tabs — card-grid style adapted from Earn.jsx's real tab selector
                        (Earn.jsx:2124-2145: icon badge + bold title + description line,
                        active = 2px green border + 4px green bottom border). Earn lays
                        its 4 tabs out as a 2x2 grid; here it's 3 tabs in one row instead
                        of wrapping. NOT reusing S.tabBtn (Earn.jsx:98) — that's a dead,
                        unused pill-button style, unrelated to Earn's actual tab UI. */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '0 1.5rem 1.25rem' }}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    textAlign: 'left',
                                    background: 'var(--bg-surface)',
                                    border: activeTab === tab.id ? '2px solid var(--peacock-green)' : '1px solid var(--border-color)',
                                    borderBottom: activeTab === tab.id ? '4px solid var(--peacock-green)' : '1px solid var(--border-color)',
                                    borderRadius: 14,
                                    padding: '1rem 0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                }}
                            >
                                <span style={{
                                    width: 36, height: 36, borderRadius: '50%', background: tab.iconBg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
                                }}>
                                    {tab.icon}
                                </span>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{tab.label}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{tab.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: slug ? '1.5rem' : '2rem 1.5rem' }}>
                {slug ? (
                    communityLoading ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Loading community...</div>
                    ) : communityNotFound ? (
                        <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16 }}>
                            <p style={{ margin: '0 0 1rem', color: 'var(--text-muted)' }}>Community not found.</p>
                            <button onClick={handleBackToNetwork} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, background: 'var(--peacock-green)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                Back to Network
                            </button>
                        </div>
                    ) : activeCommunity ? (
                        <CommunityLanding
                            community={activeCommunity}
                            user={user}
                            onBack={handleBackToNetwork}
                        />
                    ) : null
                ) : (
                    <>
                        {activeTab === 'Communities' && <CommunitiesTab user={user} onCommunityClick={handleOpenCommunity} />}
                        {activeTab === 'Connect with Peers' && <ConnectPeersTab user={user} />}
                        {activeTab === 'Study Sync' && <StudySyncTab user={user} />}
                    </>
                )}
            </div>
        </div>
    );
}
