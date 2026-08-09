import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';

export default function HelpSupport() {
    const { toast, showToast, hideToast } = useToast();
    
    // Form state
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Mock search state
    const [searchQuery, setSearchQuery] = useState('');

    const faqs = [
        {
            q: "How do I verify my student status?",
            a: "You can verify your student status during onboarding by providing your university email address. A verification link will be sent to your inbox."
        },
        {
            q: "Can I join multiple communities?",
            a: "Yes! You can join as many communities as you'd like. Navigate to the Network tab and browse 'Communities' to find groups that match your interests."
        },
        {
            q: "How are XP points calculated?",
            a: "XP points are awarded for engaging with the platform. You earn points by creating posts, replying to discussions, completing courses, and receiving upvotes."
        },
        {
            q: "How do I delete my account?",
            a: "To delete your account, go to Profile > Settings (or Edit Profile) and scroll down to the Danger Zone. Please note this action is irreversible."
        }
    ];

    const handleSubmitTicket = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !message.trim()) {
            showToast("Please fill in both subject and message.", "error");
            return;
        }
        
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Not authenticated");

            const { error } = await supabase.from('support_tickets').insert({
                user_id: session.user.id,
                subject,
                message,
                status: 'open'
            });

            if (error) throw error;
            
            showToast("Support ticket submitted successfully. We'll be in touch!", "success");
            setSubject('');
            setMessage('');
        } catch (err) {
            console.error("Support ticket error:", err);
            showToast(err.message || "Failed to submit ticket. Please try again.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const S = {
        container: { maxWidth: 900, margin: '0 auto', padding: '3rem 2rem' },
        header: { textAlign: 'center', marginBottom: '3rem' },
        title: { fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 1rem 0' },
        subtitle: { fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0, maxWidth: 600, marginInline: 'auto' },
        searchBox: { display: 'flex', alignItems: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 24, padding: '0.75rem 1.5rem', gap: '0.75rem', maxWidth: 600, margin: '2rem auto 0', boxShadow: 'var(--shadow-sm)' },
        searchInput: { background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '1rem', width: '100%', fontFamily: 'inherit' },
        
        sectionTitle: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', boxShadow: 'var(--shadow-sm)' },
        
        linkCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', textDecoration: 'none', color: 'inherit', padding: '2rem 1.5rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, transition: 'all 0.2s', cursor: 'pointer' },
        
        formGroup: { marginBottom: '1.5rem' },
        label: { display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' },
        input: { width: '100%', background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.85rem 1rem', fontSize: '0.95rem', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' },
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
            <Toast {...toast} onHide={hideToast} />
            
            <div style={S.container}>
                {/* Header & Search */}
                <div style={S.header}>
                    <h1 style={S.title}>How can we help?</h1>
                    <p style={S.subtitle}>Search our knowledge base or get in touch with our support team.</p>
                    <div style={S.searchBox}>
                        <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>🔍</span>
                        <input 
                            style={S.searchInput} 
                            placeholder="Search for answers..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Quick Links */}
                <div style={S.grid}>
                    <Link to="/privacy-policy" style={S.linkCard} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--peacock-green)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Privacy Policy</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Understand how we protect and handle your data.</p>
                    </Link>
                    <Link to="/terms-and-conditions" style={S.linkCard} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--peacock-green)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📜</div>
                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Terms of Service</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Review the rules and guidelines of our platform.</p>
                    </Link>
                    <Link to="/network" style={S.linkCard} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--peacock-green)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤝</div>
                        <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>Community Guidelines</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Learn how to interact safely in Chavee communities.</p>
                    </Link>
                </div>

                {/* Main Content Split */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                    
                    {/* FAQ */}
                    <div>
                        <h2 style={S.sectionTitle}>Frequently Asked Questions</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {faqs.map((faq, i) => (
                                <div key={i} style={S.card}>
                                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.75rem 0', color: 'var(--text-primary)' }}>{faq.q}</h4>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Contact Support Form */}
                    <div>
                        <h2 style={S.sectionTitle}>Contact Support</h2>
                        <form onSubmit={handleSubmitTicket} style={S.card}>
                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
                                Can't find what you're looking for? Send us a message and we'll get back to you as soon as possible.
                            </p>
                            
                            <div style={S.formGroup}>
                                <label style={S.label}>Subject</label>
                                <input 
                                    style={S.input} 
                                    placeholder="Brief description of the issue" 
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div style={S.formGroup}>
                                <label style={S.label}>Message</label>
                                <textarea 
                                    style={{ ...S.input, minHeight: 150, resize: 'vertical' }} 
                                    placeholder="Please provide details so we can assist you better..." 
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={submitting}
                                style={{ 
                                    width: '100%', padding: '0.85rem', borderRadius: 10, background: 'var(--peacock-green)', 
                                    color: '#fff', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: submitting ? 'not-allowed' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s'
                                }}
                            >
                                {submitting ? <ButtonSpinner /> : 'Submit Ticket'}
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </div>
    );
}
