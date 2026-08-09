import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { ChaveeLogo } from '../Logo.jsx';
import { supabase } from '../supabaseClient.js';

const DEFAULT_PRESS = [
    {
        id: 'pr-1',
        title: 'Chavee Rolls Out Live Interactive Language Courses with Native Tutors Across Kerala',
        summary: 'Chavee announced a major upgrade to its Education Tab, featuring structured courses in Korean, German, and Spanish tailored specifically for Indian students.',
        created_at: '2026-07-10T10:00:00Z',
        status: 'published'
    },
    {
        id: 'pr-2',
        title: 'Chavee Surpasses Core Onboarding Milestones as the Premier Gen Z Student Marketplace Launch Approaches',
        summary: 'With thousands of students registering across colleges, Chavee announces its zero-commission student marketplace to facilitate gig work and textbook exchange.',
        created_at: '2026-06-18T14:30:00Z',
        status: 'published'
    }
];

export default function PressKit() {
    const [releases, setReleases] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadPress = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('content_type', 'press_release')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                setReleases(data);
            } else {
                setReleases(DEFAULT_PRESS);
            }
        } catch (err) {
            console.warn('Could not load press releases from database, checking local:', err.message);
            const local = localStorage.getItem('chavee_press_releases');
            if (local) {
                setReleases(JSON.parse(local).filter(r => r.published !== false));
            } else {
                setReleases(DEFAULT_PRESS);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPress();
        document.title = 'Chavee Press & Media Kit | Learn Earn Network Belong';
    }, []);

    const handleDownloadLogo = () => {
        // Mock download logo
        alert('🎨 Downloading Chavee Brand Assets Package (SVG, PNG, Branding Guidelines)...');
    };

    const S = {
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.03) 0%, rgba(5,150,105,0.01) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '4rem 2rem',
            textAlign: 'center'
        },
        container: {
            maxWidth: 900,
            margin: '0 auto',
            padding: '3rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '3rem'
        },
        card: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '2rem',
            boxShadow: 'var(--shadow-sm)'
        }
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>📰 Press Kit</p>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.5rem 0' }}>Press & Brand Kit</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Everything you need to write about Chavee — logos, brand colors, values, and official press releases.
                </p>
            </header>

            <div style={S.container}>
                {/* 1. Brand Mission & Overview */}
                <div style={S.card}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--peacock-green)', margin: '0 0 0.75rem 0' }}>About Chavee</h2>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                        Chavee is India's first student social networking platform. Built in Kerala and scaling across campuses nationwide, Chavee empowers Gen Z college students to learn languages, earn through gigs, find peer mentors, and attend events all on a single unified platform. Free to join and designed privacy-first.
                    </p>
                </div>

                {/* 2. Brand Assets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                    <div style={S.card}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Brand Assets</h2>
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
                            <ChaveeLogo height={32} />
                        </div>
                        <button onClick={handleDownloadLogo} className="btn-primary" style={{ width: '100%', padding: '0.7rem', borderRadius: 10, fontSize: '0.84rem' }}>
                            📥 Download Logo Assets
                        </button>
                    </div>

                    <div style={S.card}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Color Palette</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[
                                { name: 'Peacock Green', hex: '#115E59', role: 'Primary Brand Color' },
                                { name: 'Mint Green', hex: '#F0FDF4', role: 'Secondary Accent' },
                                { name: 'Amber Gold', hex: '#D97706', role: 'Gamification Accent' }
                            ].map(color => (
                                <div key={color.hex} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: color.hex, border: '1px solid var(--border-color)' }} />
                                    <div>
                                        <div style={{ fontSize: '0.84rem', fontWeight: 800 }}>{color.name} ({color.hex})</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{color.role}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 3. Press Releases */}
                <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>Official Press Releases</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', padding: '1rem' }}>
                                Loading releases...
                            </div>
                        ) : releases.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.86rem', padding: '1rem', fontStyle: 'italic' }}>
                                No announcements yet.
                            </div>
                        ) : (
                            releases.map((pr) => (
                                <div key={pr.id} style={{ ...S.card, display: 'flex', flexDirection: pr.image_url ? 'row' : 'column', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                    {pr.image_url && (
                                        <div style={{ width: 140, height: 100, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0 }}>
                                            <img src={pr.image_url} alt={pr.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    )}
                                    <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--peacock-green)', fontWeight: 800 }}>
                                            {new Date(pr.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </span>
                                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{pr.title}</h3>
                                        <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{pr.summary || pr.description}</p>
                                        <a href={pr.metadata?.external_link || pr.external_link || '#'} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--peacock-green)', textDecoration: 'none' }}>
                                            Read More →
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
