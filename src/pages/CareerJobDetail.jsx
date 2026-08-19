import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import { supabase } from '../supabaseClient.js';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SEO, { jobPostingSchema } from '../components/SEO.jsx';

export default function CareerJobDetail() {
    const { id } = useParams();
    const { toast, showToast, hideToast } = useToast();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [applyOpen, setApplyOpen] = useState(false);
    const [applied, setApplied] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [resume, setResume] = useState('');
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // Real job row only — no status filter here, since a direct
                // link to a role that's since closed should say so honestly
                // rather than 404.
                const { data, error } = await supabase
                    .from('jobs')
                    .select('*, job_categories(name)')
                    .eq('id', id)
                    .single();
                if (error) throw error;
                setJob(data);
            } catch (err) {
                console.warn('Could not load job:', err.message);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleApply = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { error } = await supabase.from('job_applications').insert({
                job_id: job.id,
                applicant_name: name.trim(),
                applicant_email: email.trim().toLowerCase(),
                resume_url: resume.trim(),
                cover_letter: JSON.stringify(answers),
                created_at: new Date().toISOString()
            });
            if (error) throw error;
            setApplied(true);
            setApplyOpen(false);
            showToast(`Applied successfully for ${job.title}! We'll reach out via email.`, 'success');
        } catch (err) {
            showToast(err.message || 'Could not submit your application. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const S = {
        container: { maxWidth: 800, margin: '0 auto', padding: '2.5rem 1.5rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: '1.75rem' },
        h2: { fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.85rem' },
        tag: { background: 'var(--bg-mint)', color: 'var(--peacock-green)', fontSize: '0.76rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: 20 },
    };

    if (loading) {
        return (
            <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '4rem' }}><ButtonSpinner label="Loading role..." /></div>
                <div style={{ marginTop: 'auto' }}><Footer /></div>
            </div>
        );
    }

    if (notFound || !job) {
        return (
            <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <SEO noindex />
                <Navbar />
                <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</div>
                    <h2 style={{ color: 'var(--text-primary)' }}>This role couldn't be found.</h2>
                    <p style={{ margin: '0.5rem 0 1.5rem' }}>It may have been removed or the link is incorrect.</p>
                    <Link to="/careers" style={{ color: 'var(--peacock-green)', fontWeight: 700, textDecoration: 'none' }}>← Back to Careers</Link>
                </div>
                <div style={{ marginTop: 'auto' }}><Footer /></div>
            </div>
        );
    }

    const isLive = job.status === 'live';
    const department = job.job_categories?.name || 'General';
    const skillTags = (job.skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const isInternal = job.application_type === 'internal';
    const questions = Array.isArray(job.application_questions) ? job.application_questions : [];

    const handleApplyClick = () => {
        if (isInternal) {
            setApplyOpen(true);
        } else if (job.apply_url) {
            window.open(job.apply_url, '_blank', 'noopener,noreferrer');
        } else {
            showToast('Applications for this role are not open yet.', 'error');
        }
    };

    return (
        <div style={{ background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <SEO
                title={`${job.title} | Chavee Careers`}
                description={job.description ? job.description.slice(0, 155) : `${job.title} — a real open role at Chavee, India's first student social platform.`}
                path={`/careers/${id}`}
                schema={isLive ? jobPostingSchema(job) : null}
            />
            <Navbar />

            <div style={S.container}>
                <Link to="/careers" style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>← Back to Careers</Link>

                {!isLive && (
                    <div style={{ background: '#F59E0B15', border: '1px solid #F59E0B40', color: '#B45309', borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                        This role is no longer open for applications.
                    </div>
                )}

                <div style={{ ...S.card, marginBottom: '1.5rem' }}>
                    <span style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-mint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', marginBottom: '1rem' }}>💼</span>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>{job.title}</h1>
                    <div style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '1rem' }}>Chavee</div>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        <span style={S.tag}>💼 {job.job_type || 'Full-Time'}</span>
                        <span style={S.tag}>📍 {job.location || 'Remote'}</span>
                        <span style={S.tag}>📂 {department}</span>
                        {job.duration && <span style={S.tag}>⏳ {job.duration}</span>}
                        {(job.compensation || job.salary_min) && (
                            <span style={S.tag}>💰 {job.compensation || `₹${job.salary_min} - ₹${job.salary_max}`}</span>
                        )}
                    </div>
                    <button
                        onClick={handleApplyClick}
                        disabled={!isLive || applied}
                        className="btn-primary"
                        style={{ padding: '0.75rem 1.75rem', borderRadius: 10, fontSize: '0.88rem', opacity: (!isLive || applied) ? 0.6 : 1, cursor: (!isLive || applied) ? 'not-allowed' : 'pointer' }}
                    >
                        {applied ? '✓ Applied' : isLive ? 'Apply Now' : 'Applications Closed'}
                    </button>
                </div>

                {job.description && (
                    <div style={{ ...S.card, marginBottom: '1.5rem' }}>
                        <h2 style={S.h2}>About the Role</h2>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{job.description}</p>
                    </div>
                )}

                {skillTags.length > 0 && (
                    <div style={{ ...S.card, marginBottom: '1.5rem' }}>
                        <h2 style={S.h2}>Skills</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {skillTags.map(s => <span key={s} style={S.tag}>{s}</span>)}
                        </div>
                    </div>
                )}

                <div style={S.card}>
                    <h2 style={S.h2}>About Chavee</h2>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
                        Chavee is India's first student-focused social platform where students can learn, connect, discover opportunities and grow together.
                    </p>
                    <Link to="/about-us" style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--peacock-green)', textDecoration: 'none' }}>Visit Chavee →</Link>
                </div>
            </div>

            {/* Apply Modal (internal applications) */}
            {applyOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setApplyOpen(false)}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, maxWidth: 480, width: '100%', boxShadow: 'var(--shadow-lg)', padding: '2rem', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 1.25rem', color: 'var(--text-primary)' }}>Apply for {job.title}</h2>
                        <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Full Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required className="dark-input" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="dark-input" style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>Resume Link</label>
                                <input type="url" value={resume} onChange={e => setResume(e.target.value)} placeholder="https://drive.google.com/..." required className="dark-input" style={{ width: '100%' }} />
                            </div>
                            {questions.map((q, i) => (
                                <div key={i}>
                                    <label style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>{q}</label>
                                    <textarea rows={2} value={answers[q] || ''} onChange={e => setAnswers({ ...answers, [q]: e.target.value })} required className="dark-input" style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
                                </div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setApplyOpen(false)} className="btn-ghost" style={{ padding: '0.55rem 1.25rem', borderRadius: 10 }}>Cancel</button>
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
