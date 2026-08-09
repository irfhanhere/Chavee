import React, { useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import Toast, { useToast } from '../../components/Toast.jsx';
import { ButtonSpinner } from '../../components/Spinner.jsx';
import useNotifyMe from '../../hooks/useNotifyMe.js';

export default function StudySyncTab({ user }) {
    const { toast, showToast } = useToast();
    const { notifiedFeatures, loadingFeatures, toggleNotify } = useNotifyMe(user);
    const featureKey = 'study_sync';
    const hasSubscribed = notifiedFeatures.has(featureKey);
    const submitting = loadingFeatures.has(featureKey);

    const handleNotifyMe = async () => {
        if (!user) {
            showToast('Please log in to be notified.', 'error');
            return;
        }
        try {
            const isSubscribed = await toggleNotify(featureKey);
            if (isSubscribed) {
                showToast('You are on the list! We will notify you when Study Sync launches.', 'success');
            } else if (isSubscribed === false) {
                showToast('Removed from waitlist.', 'success');
            }
        } catch (err) {
            showToast('Something went wrong. Please try again.', 'error');
        }
    };

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out', maxWidth: 800, margin: '0 auto', textAlign: 'center', padding: '3rem 1rem' }}>
            <Toast msg={toast?.msg} type={toast?.type} />
            
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '50%', width: 80, height: 80, fontSize: '2.5rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                ⏱️
            </div>
            
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '2rem', fontWeight: 900 }}>Study Sync</h1>
            <p style={{ margin: '0 auto 1.5rem', color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: 500, lineHeight: 1.5 }}>
                Find study partners, accountability buddies and mentors. Supercharge your learning with collaborative tools.
            </p>
            
            <span style={{ display: 'inline-block', padding: '0.35rem 1rem', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontWeight: 800, fontSize: '0.85rem', borderRadius: 20, border: '1px solid rgba(245,158,11,0.2)', marginBottom: '2.5rem' }}>
                🚀 Coming Soon
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', textAlign: 'left', marginBottom: '3rem' }}>
                <FeatureCard icon="👥" title="Study Partner Matching" desc="Find peers with similar goals and schedules." />
                <FeatureCard icon="🧑‍🏫" title="Mentor Matching" desc="Connect with seniors for guidance and advice." />
                <FeatureCard icon="🍅" title="Pomodoro Rooms" desc="Join virtual study rooms and track focus time." />
                <FeatureCard icon="📝" title="Shared Notes" desc="Collaborate on notes and share resources easily." />
            </div>

            <div style={{ padding: '2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, boxShadow: 'var(--shadow-md)' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Want early access?</h3>
                <p style={{ margin: '0 0 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Join the waitlist to be the first to know when we launch.</p>
                <button 
                    onClick={handleNotifyMe}
                    disabled={submitting || hasSubscribed}
                    style={{
                        padding: '0.8rem 2rem', borderRadius: 12, border: 'none', background: hasSubscribed ? 'var(--bg-mint)' : 'var(--peacock-green)', 
                        color: hasSubscribed ? 'var(--peacock-green)' : '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: hasSubscribed ? 'default' : 'pointer', transition: 'all 0.2s', width: '100%', maxWidth: 300
                    }}
                >
                    {submitting ? <ButtonSpinner label="Joining..." /> : hasSubscribed ? '✓ You are on the list' : 'Notify Me'}
                </button>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div style={{ padding: '1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{icon}</div>
            <h4 style={{ margin: '0 0 0.35rem', fontWeight: 800, fontSize: '0.95rem' }}>{title}</h4>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{desc}</p>
        </div>
    );
}
