import React, { useEffect, useState } from 'react';
import { ChaveeLogo } from '../../Logo.jsx';
import { FloatingIllustrations } from './FloatingIllustrations.jsx';
import { FeatureList } from './FeatureList.jsx';
import { supabase } from '../../supabaseClient.js';

export function BrandPanel({ heading, subtitle, features }) {
    const [studentCount, setStudentCount] = useState(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const { data, error } = await supabase.rpc('get_landing_stats');
                if (!error && data && typeof data.student_count === 'number') {
                    setStudentCount(data.student_count);
                }
            } catch (err) {
                console.error("Failed to fetch landing stats", err);
            }
        }
        fetchStats();
    }, []);

    return (
        <div style={{ padding: 'clamp(2rem, 4vw, 4rem)', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 1 }}>
            
            <div style={{ position: 'relative', zIndex: 10 }}>
                <ChaveeLogo height={42} light />
            </div>
            
            <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', marginBottom: '2rem' }}>
                {/* Not the real page h1 — decorative brand-panel copy.
                    AuthCard's own heading (the actual "Log in"/"Sign up"
                    form heading) is the one real h1 for these pages. */}
                <p style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                    {heading}
                </p>
                <p style={{ fontSize: '1.25rem', opacity: 0.9, maxWidth: '480px', lineHeight: 1.5, marginBottom: '3rem', color: '#DFF7EA' }}>
                    {subtitle}
                </p>
                
                <FeatureList features={features} />
            </div>

            <div style={{ position: 'relative', zIndex: 10, marginTop: '2rem' }}>
                {studentCount !== null && studentCount > 0 ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '100px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ fontSize: '1.5rem' }}>🎓</span>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Join {studentCount.toLocaleString()} students already on Chavee</span>
                    </div>
                ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1.25rem', borderRadius: '100px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                        <span style={{ fontSize: '1.5rem' }}>🌟</span>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Be the first to join Chavee!</span>
                    </div>
                )}
            </div>

            <FloatingIllustrations />
        </div>
    );
}
