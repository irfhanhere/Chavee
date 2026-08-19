import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '../supabaseClient.js';
import { ChaveeLogo } from '../Logo.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import SEO from '../components/SEO.jsx';

import { AuthLayout } from '../components/auth/AuthLayout.jsx';
import { BrandPanel } from '../components/auth/BrandPanel.jsx';
import { AuthCard } from '../components/auth/AuthCard.jsx';
import { InputField } from '../components/auth/InputField.jsx';
import { AuthFooter } from '../components/auth/AuthFooter.jsx';

export default function ForgotPassword() {
    const { toast, showToast, hideToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    // Turnstile — see SignUp.jsx for the full rationale; same Dashboard-
    // configured Bot and Abuse Protection, same options.captchaToken shape.
    const [captchaToken, setCaptchaToken] = useState('');
    const turnstileRef = useRef(null);

    const handleReset = async (e) => {
        e.preventDefault();
        if (!email) { showToast('Please enter your email.', 'warning'); return; }
        if (!captchaToken) { showToast('Please complete the verification challenge.', 'warning'); return; }
        setLoading(true);
        try {
            const redirectUrl = import.meta.env.PROD
                ? 'https://chavee.in/reset-password'
                : `${window.location.origin}/reset-password`;

            const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
                redirectTo: redirectUrl,
                captchaToken,
            });
            if (error) throw error;
            setIsSent(true);
        } catch (err) {
            showToast(err.message || 'Failed to send reset email.', 'error');
        } finally {
            setLoading(false);
            turnstileRef.current?.reset();
            setCaptchaToken('');
        }
    };

    // BrandPanel unconditionally renders <FeatureList features={features} />
    // — this page called it with no features prop at all, which crashed the
    // whole route (real blank white page, confirmed live via a real uncaught
    // "Cannot read properties of undefined (reading 'map')" in FeatureList).
    // Real content now, matching Login.jsx/SignUp.jsx's own feature lists.
    const forgotPasswordFeatures = [
        { heading: "Secure recovery", description: "We'll email a real reset link to your inbox.", icon: "🔒" },
        { heading: "Back in seconds", description: "Set a new password and you're straight back in.", icon: "⚡" },
        { heading: "Your data stays safe", description: "Nothing changes until you confirm the new password.", icon: "🛡️" },
    ];

    if (isSent) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', padding: '1rem' }}>
                <div style={{
                    width: '100%',
                    maxWidth: 500,
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: 24,
                    padding: '3rem',
                    textAlign: 'center',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📬</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', color: '#111827' }}>Check your inbox</h1>
                    <p style={{ color: '#6B7280', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                        We've sent a password reset link to <strong>{email}</strong>. Please check your email to continue.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer" 
                           style={{ background: '#0B8F5A', color: '#fff', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, display: 'block', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(11,143,90,0.2)' }}>
                            Open Gmail
                        </a>
                        
                        <Link to="/login" style={{ color: '#6B7280', fontWeight: 600, textDecoration: 'none', marginTop: '1rem' }}>
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <>
        <SEO
            title="Forgot Password | Chavee"
            description="Reset your Chavee account password to get back into your student profile, courses, gigs, and communities."
            path="/forgot-password"
        />
        <AuthLayout
            leftPanel={
                <BrandPanel
                    heading={<>Forgot your<br/>password?</>}
                    subtitle="No worries, we'll help you get back into your account."
                    features={forgotPasswordFeatures}
                />
            }
            mobileHeader={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                    <ChaveeLogo height={32} light />
                    <div>
                        {/* Not a real <h1> — BrandPanel's heading is already the page's
                            one real h1 (desktop panel), and both exist in the DOM
                            simultaneously (CSS-toggled by breakpoint, not conditionally
                            rendered), so a second h1 here would be a real duplicate-h1 bug. */}
                        <p style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                            Reset Password
                        </p>
                        <p style={{ fontSize: '1rem', opacity: 0.9, color: '#DFF7EA', margin: 0 }}>
                            We'll help you get back in.
                        </p>
                    </div>
                </div>
            }
        >
            <AuthCard heading="Reset Password" subtitle="Enter your email address and we'll send you a link to reset your password.">
                <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <InputField 
                        label="Email Address" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="you@example.com" 
                        required 
                    />

                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem' }}>
                        <Turnstile
                            ref={turnstileRef}
                            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                            onSuccess={setCaptchaToken}
                            onExpire={() => setCaptchaToken('')}
                            onError={() => setCaptchaToken('')}
                        />
                    </div>

                    <motion.button
                        whileHover={!(loading || !captchaToken) ? { scale: 1.02, boxShadow: '0 8px 20px rgba(11,143,90,0.2)' } : {}}
                        whileTap={!(loading || !captchaToken) ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={loading || !captchaToken}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: '#0B8F5A',
                            color: '#FFFFFF',
                            fontSize: '1.05rem',
                            fontWeight: 700,
                            borderRadius: '12px',
                            border: 'none',
                            marginTop: '1rem',
                            opacity: (loading || !captchaToken) ? 0.7 : 1,
                            cursor: (loading || !captchaToken) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 10px rgba(11,143,90,0.1)'
                        }}
                    >
                        {loading ? <ButtonSpinner label="Sending..." /> : 'Send Reset Link →'}
                    </motion.button>
                </form>

                <AuthFooter text="Remembered your password?" linkText="Back to Login" linkTo="/login" />
            </AuthCard>

            <Toast {...toast} onHide={hideToast} />
        </AuthLayout>
        </>
    );
}
