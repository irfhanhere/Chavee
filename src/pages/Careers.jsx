import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SEO from '../components/SEO.jsx';

// Reference's stats/values bar is qualitative company-values tiles, NOT
// numeric counts (confirmed by viewing careers-web.png/careers-app.png
// directly — no numbers appear anywhere in that bar, unlike About Us's
// stats bar). Real provided copy from the reference image.
const VALUES = [
    { icon: '👥', title: 'Mission Driven', desc: 'Impact millions of students' },
    { icon: '🚀', title: 'Growth Mindset', desc: 'Learn, unlearn and grow together' },
    { icon: '❤️', title: 'Student First', desc: 'Everything we build is for students' },
    { icon: '🌐', title: 'Pan India Impact', desc: 'Building for students across the nation' },
];

// "Life at Chavee" — static company-culture copy from the reference, none
// of these tiles imply a real count/number, so no live data is needed here.
const CULTURE = [
    { icon: '👥', title: 'Collaborative Culture', desc: 'Open communication and teamwork drive everything we do.' },
    { icon: '🎓', title: 'Learn & Grow', desc: 'Continuous learning and skill development are part of our DNA.' },
    { icon: '❤️', title: 'Flexible & Inclusive', desc: 'Work the way that works best for you. We value people, not hours.' },
    { icon: '⭐', title: 'Make an Impact', desc: 'Every idea, every feature and every effort makes a real impact.' },
    { icon: '🙂', title: 'Fun & Meaningful', desc: 'We celebrate wins, have fun together and enjoy the journey.' },
];

export default function Careers() {
    const { toast, showToast, hideToast } = useToast();
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);
    const [department, setDepartment] = useState('All Departments');

    // Talent network mini-form (real notify_subscribers insert — same
    // pattern already used for the footer newsletter / 2FA waitlist).
    const [talentOpen, setTalentOpen] = useState(false);
    const [talentEmail, setTalentEmail] = useState('');
    const [talentSubmitting, setTalentSubmitting] = useState(false);

    const loadJobs = async () => {
        setLoadingJobs(true);
        try {
            // Relationship-based routing (not text matching): find the real
            // official Chavee company row, then filter jobs by company_id.
            // This is the real fix the companies entity was built to enable
            // — a job's company can never accidentally drift out of sync
            // with a typo'd "Chavee" string again.
            const { data: officialCompany, error: companyErr } = await supabase
                .from('companies')
                .select('id')
                .eq('is_official', true)
                .single();
            if (companyErr) throw companyErr;

            const { data, error } = await supabase
                .from('jobs')
                .select('*, job_categories(name)')
                .eq('company_id', officialCompany.id)
                .eq('status', 'live')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs((data || []).map(j => ({
                id: j.id,
                title: j.title,
                department: j.job_categories?.name || 'General',
                location: j.location || 'Remote',
                stipend: j.compensation || (j.salary_min && j.salary_max ? `₹${j.salary_min} - ₹${j.salary_max}` : 'Unpaid / Experience'),
                type: j.job_type || 'Internship',
                desc: j.description || '',
                skills: j.skills || '',
                created_at: j.created_at,
                application_type: j.application_type,
                apply_url: j.apply_url,
                application_questions: j.application_questions,
            })));
        } catch (err) {
            console.warn('Could not load career jobs from database:', err.message);
            setJobs([]);
        } finally {
            setLoadingJobs(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    // Department dropdown — sourced from real distinct department values on
    // the actual loaded jobs, not a hardcoded list.
    const departments = useMemo(() => {
        return ['All Departments', ...new Set(jobs.map(j => j.department))];
    }, [jobs]);

    const filteredJobs = department === 'All Departments' ? jobs : jobs.filter(j => j.department === department);

    const handleTalentSubmit = async (e) => {
        e.preventDefault();
        setTalentSubmitting(true);
        try {
            const { error } = await supabase
                .from('notify_subscribers')
                .insert({ email: talentEmail.trim().toLowerCase(), feature_key: 'career_talent_network' });
            if (error) throw error;
            showToast("You're on our talent network — we'll reach out when a matching role opens!", 'success');
            setTalentOpen(false);
            setTalentEmail('');
        } catch (err) {
            showToast(err.message || 'Could not join the talent network. Please try again.', 'error');
        } finally {
            setTalentSubmitting(false);
        }
    };

    const S = {
        hero: {
            background: 'linear-gradient(135deg, #0F172A 0%, #115E59 100%)',
            padding: '4rem 1.5rem 5rem',
        },
        container: { maxWidth: 1000, margin: '0 auto', padding: '0 1.5rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: 'var(--shadow-sm)' },
        sectionLabel: { color: 'var(--peacock-green)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' },
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO
                title="Chavee Careers | Build the Future of Campus Life"
                description="Join the Chavee team and help build India's first student-first social platform. Explore open roles across engineering, design, marketing, and operations."
                path="/careers"
            />
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <div style={S.container}>
                    <p style={{ color: '#6EE7B7', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.75rem' }}>Careers at Chavee</p>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#fff', margin: '0 0 0.75rem', lineHeight: 1.15 }}>
                        Build the future<br />of student opportunities.<br /><span style={{ color: '#34D399' }}>Grow. Build. Belong.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 480, fontSize: '0.95rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
                        We're a team of builders, dreamers and doers working to empower students across India with the right tools, opportunities and community to grow together.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <a href="#open-positions" className="btn-primary" style={{ padding: '0.8rem 1.6rem', borderRadius: 12, fontSize: '0.9rem', textDecoration: 'none' }}>View Open Positions</a>
                        <a href="#life-at-chavee" style={{ padding: '0.8rem 1.6rem', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', textDecoration: 'none' }}>Life at Chavee</a>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginTop: '1.5rem' }}>
                        New to Chavee? <Link to="/about-us" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Learn about us</Link> · Questions about a role? <Link to="/contact-us" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Contact us</Link>
                    </p>
                </div>
            </header>

            {/* Values bar — qualitative tiles, not numbers */}
            <div style={{ ...S.container, marginTop: '-2.5rem', position: 'relative', zIndex: 2 }}>
                <div style={{ ...S.card, padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                    {VALUES.map(v => (
                        <div key={v.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{v.icon}</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{v.title}</div>
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{v.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Open Positions */}
            <div id="open-positions" style={{ ...S.container, padding: '4rem 1.5rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                        <p style={S.sectionLabel}>Open Positions</p>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>Join our mission</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Be a part of a passionate team building India's first student-focused social platform.</p>
                    </div>
                    <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        style={{ padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                        {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loadingJobs ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <ButtonSpinner label="Fetching open roles..." />
                        </div>
                    ) : filteredJobs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No open roles currently. Check back later!
                        </div>
                    ) : (
                        filteredJobs.map(job => {
                            const isNew = job.created_at && (Date.now() - new Date(job.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
                            return (
                                <div key={job.id} style={{ ...S.card, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{job.title}</h3>
                                            {isNew && <span style={{ background: 'var(--bg-mint)', color: 'var(--peacock-green)', fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 20 }}>New</span>}
                                        </div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{job.department}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        <span>💼 {job.type}</span>
                                        <span>📍 {job.location}</span>
                                    </div>
                                    <Link to={`/careers/${job.id}`} style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--peacock-green)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                                        View Details →
                                    </Link>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Talent network CTA — real notify_subscribers insert */}
                <div style={{ ...S.card, marginTop: '1.5rem', padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'var(--bg-mint)', border: '1px solid var(--border-mint)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--peacock-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>✉️</span>
                        <div>
                            <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.92rem' }}>Don't see the right role?</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>We're always looking for talented people who are excited to build something meaningful. Let's stay in touch!</div>
                        </div>
                    </div>
                    <button onClick={() => setTalentOpen(true)} style={{ padding: '0.65rem 1.25rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--peacock-green)', color: 'var(--peacock-green)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Join Our Talent Network
                    </button>
                </div>
            </div>

            {/* Life at Chavee */}
            <div id="life-at-chavee" style={{ ...S.container, padding: '3rem 1.5rem' }}>
                <p style={S.sectionLabel}>Life at Chavee</p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 1.5rem' }}>More than just a workplace</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
                    {CULTURE.map(c => (
                        <div key={c.title} style={{ ...S.card, padding: '1.5rem' }}>
                            <span style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', marginBottom: '0.85rem' }}>{c.icon}</span>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{c.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{c.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Closing CTA */}
            <section style={{ background: 'linear-gradient(135deg, #115E59 0%, #059669 100%)', padding: '3rem 1.5rem' }}>
                <div style={{ ...S.container, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, margin: '0 0 0.35rem' }}>Ready to build the future with us?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.88rem', margin: 0 }}>Help us empower millions of students across India.</p>
                    </div>
                    <a href="#open-positions" style={{ padding: '0.8rem 1.6rem', borderRadius: 12, fontSize: '0.88rem', fontWeight: 800, background: '#fff', color: 'var(--peacock-green)', textDecoration: 'none', whiteSpace: 'nowrap' }}>View Open Positions</a>
                </div>
            </section>

            {/* Talent Network Modal */}
            {talentOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setTalentOpen(false)}>
                    <div style={{ ...S.card, maxWidth: 420, width: '100%', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Join Our Talent Network</h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>Leave your email and we'll reach out when a role that fits opens up.</p>
                        <form onSubmit={handleTalentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="email" required value={talentEmail} onChange={e => setTalentEmail(e.target.value)} placeholder="you@example.com" className="dark-input" style={{ width: '100%' }} />
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setTalentOpen(false)} className="btn-ghost" style={{ padding: '0.55rem 1.25rem', borderRadius: 10 }}>Cancel</button>
                                <button type="submit" disabled={talentSubmitting} className="btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: 10 }}>
                                    {talentSubmitting ? <ButtonSpinner label="Joining..." /> : 'Join'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}
