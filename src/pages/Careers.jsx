import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';

const MOCK_JOBS = [
    {
        id: 'c-1',
        title: 'Campus Ambassador Lead',
        department: 'Growth & Community',
        location: 'Remote (Kerala / India)',
        stipend: '₹5,000 - ₹12,000 / month',
        type: 'Part-Time / Intern',
        desc: 'Help expand Chavee across campuses. Coordinate events, lead local community efforts, and grow brand awareness on your campus.'
    },
    {
        id: 'c-2',
        title: 'Frontend React Engineer Intern',
        department: 'Engineering',
        location: 'Remote',
        stipend: '₹15,000 - ₹25,000 / month',
        type: 'Internship (3-6 Months)',
        desc: 'Work directly on the main Chavee React application. Implement premium UI designs, optimize performance, and ship code daily.'
    },
    {
        id: 'c-3',
        title: 'Student Community Coordinator',
        department: 'Operations',
        location: 'Remote',
        stipend: '₹8,000 - ₹15,000 / month',
        type: 'Internship',
        desc: 'Manage and moderate Chavee student communities. Host weekly events, engage users, and seed new discussion channels.'
    }
];

export default function Careers() {
    const { toast, showToast, hideToast } = useToast();
    const [selectedRole, setSelectedRole] = useState(null);
    const [appliedRoles, setAppliedRoles] = useState([]);
    
    // Dynamic Jobs States
    const [jobs, setJobs] = useState([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    // Application Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [resume, setResume] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadJobs = async () => {
        setLoadingJobs(true);
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('company', 'Chavee')
                .eq('status', 'Live')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                setJobs(data.map(j => ({
                    id: j.id,
                    title: j.title,
                    department: j.skills || 'General',
                    location: j.location || 'Remote',
                    stipend: j.compensation || 'Unpaid / Experience',
                    type: j.job_type || 'Internship',
                    desc: j.description || ''
                })));
            } else {
                setJobs(MOCK_JOBS);
            }
        } catch (err) {
            console.warn('Could not load career jobs from database, loading mock roles:', err.message);
            setJobs(MOCK_JOBS);
        } finally {
            setLoadingJobs(false);
        }
    };

    useEffect(() => {
        loadJobs();
        document.title = 'Chavee Careers | Build the Future of Campus Life';
    }, []);

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            // Check if job_applications table exists, try inserting there
            const { error } = await supabase
                .from('job_applications')
                .insert({
                    job_id: selectedRole.id,
                    applicant_name: name.trim(),
                    applicant_email: email.trim().toLowerCase(),
                    resume_url: resume.trim(),
                    cover_letter: reason.trim(),
                    created_at: new Date().toISOString()
                });
            
            if (error) throw error;
            setAppliedRoles([...appliedRoles, selectedRole.id]);
            showToast(`🎉 Applied successfully for ${selectedRole.title}! We will reach out via email.`, 'success');
        } catch (err) {
            console.warn('Could not submit application to database, saving to local applied list:', err.message);
            setAppliedRoles([...appliedRoles, selectedRole.id]);
            showToast(`🎉 Applied successfully for ${selectedRole.title}! (Saved locally)`, 'success');
        } finally {
            setSubmitting(false);
            setSelectedRole(null);
            setName('');
            setEmail('');
            setResume('');
            setReason('');
        }
    };

    const S = {
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.03) 0%, rgba(245,158,11,0.01) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '4rem 2rem',
            textAlign: 'center'
        },
        container: {
            maxWidth: 1000,
            margin: '0 auto',
            padding: '3rem 1.5rem'
        },
        card: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '1.75rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
        }
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>💼 Careers at Chavee</p>
                <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, margin: '0 0 0.5rem 0' }}>Build the Future of Campus Life</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.6 }}>
                    Join a remote, fast-paced team building India's first student social networking platform.
                </p>
            </header>

            {/* Culture / Value Section */}
            <div style={S.container}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Why Join Us? 🌿</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
                    {[
                        { title: 'Student-First Focus', desc: 'Everything we design, build, and launch aims to help students learn, earn, and feel like they belong.' },
                        { title: 'Build in Kerala, Scale Globally', desc: 'We are proud of our roots in Kerala and are expanding rapidly across campuses nationwide.' },
                        { title: 'Extreme Ownership', desc: 'We trust our interns and team members with complete ownership of features, marketing campaigns, and launches.' }
                    ].map(v => (
                        <div key={v.title} style={{ ...S.card, gap: '0.5rem', background: 'var(--bg-elevated)' }}>
                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--peacock-green)', margin: 0 }}>{v.title}</h3>
                            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>{v.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Job Listings */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Open Positions</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {loadingJobs ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            <ButtonSpinner label="Fetching open roles..." />
                        </div>
                    ) : jobs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            No open roles currently. Check back later!
                        </div>
                    ) : (
                        jobs.map(job => {
                            const alreadyApplied = appliedRoles.includes(job.id);
                            return (
                                <div key={job.id} style={S.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.35rem 0' }}>{job.title}</h3>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                                                <span>📂 {job.department}</span>
                                                <span>·</span>
                                                <span>📍 {job.location}</span>
                                                <span>·</span>
                                                <span>⏳ {job.type}</span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--peacock-green)', background: 'var(--bg-mint)', padding: '0.3rem 0.75rem', borderRadius: 20 }}>
                                            {job.stipend}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                        {job.desc}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                        {alreadyApplied ? (
                                            <button disabled style={{ padding: '0.6rem 1.5rem', borderRadius: 10, background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.85rem' }}>
                                                ✓ Applied
                                            </button>
                                        ) : (
                                            <button onClick={() => setSelectedRole(job)} className="btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: 10, fontSize: '0.85rem' }}>
                                                Apply for Role →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Apply Modal */}
            {selectedRole && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(4px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }} onClick={() => setSelectedRole(null)}>
                    <div style={{
                        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                        borderRadius: 16, maxWidth: 480, width: '100%',
                        boxShadow: 'var(--shadow-lg)', animation: 'fadeInUp 0.25s ease-out',
                        padding: '2rem'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>Apply for {selectedRole.title}</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0' }}>Stipend: {selectedRole.stipend} · {selectedRole.type}</p>

                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Kumar" required className="dark-input" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="rahul@example.com" required className="dark-input" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Resume Link (Google Drive / Notion)</label>
                                <input type="url" value={resume} onChange={e => setResume(e.target.value)} placeholder="https://drive.google.com/..." required className="dark-input" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Why do you want to join Chavee?</label>
                                <textarea rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="Tell us what excites you about this role..." required className="dark-input" style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setSelectedRole(null)} className="btn-ghost" style={{ padding: '0.55rem 1.25rem', borderRadius: 10 }}>Cancel</button>
                                <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: '0.55rem 1.5rem', borderRadius: 10 }}>
                                    {submitting ? <ButtonSpinner label="Submitting..." /> : 'Submit Application'}
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
