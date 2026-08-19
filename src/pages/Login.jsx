import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
import { PasswordField } from '../components/auth/PasswordField.jsx';
import { SocialLoginButton } from '../components/auth/SocialLoginButton.jsx';
import { AuthFooter } from '../components/auth/AuthFooter.jsx';

/* Determine the correct redirect URL (prod vs local dev) */
const getRedirectUrl = () => {
    if (import.meta.env.PROD) {
        return 'https://chavee.in/dashboard';
    }
    return `${window.location.origin}/dashboard`;
};

export default function Login() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();

    const [email, setEmail]         = useState('');
    const [password, setPassword]   = useState('');
    const [loading, setLoading]     = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showPw, setShowPw]       = useState(false);
    const [rememberMe, setRememberMe] = useState(true);

    const [unverifiedEmail, setUnverifiedEmail] = useState('');
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Turnstile — see SignUp.jsx for the full rationale; same Dashboard-
    // configured Bot and Abuse Protection, same options.captchaToken shape.
    const [captchaToken, setCaptchaToken] = useState('');
    const turnstileRef = useRef(null);

    // Resend Cooldown countdown
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Check if there is an active resend cooldown expiry in sessionStorage
    useEffect(() => {
        const expiry = sessionStorage.getItem('resend_cooldown_expiry');
        if (expiry) {
            const remaining = Math.ceil((parseInt(expiry, 10) - Date.now()) / 1000);
            if (remaining > 0) {
                setResendCooldown(remaining);
            }
        }
    }, []);

    const handleResendEmail = async () => {
        if (!unverifiedEmail) return;
        if (resendCooldown > 0) return;

        setResendLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: unverifiedEmail.toLowerCase(),
                options: {
                    emailRedirectTo: getRedirectUrl(),
                }
            });

            if (error) {
                if (error.code === 'over_email_send_rate_limit' || error.status === 429 || error.message.includes('rate limit')) {
                    showToast("Rate limit exceeded. Please try again in a few minutes.", 'error');
                    return;
                }
                throw error;
            }

            showToast('Verification email resent successfully! ✉️ Check your inbox.', 'success');
            
            // Start 60s cooldown
            const expiry = Date.now() + 60 * 1000;
            sessionStorage.setItem('resend_cooldown_expiry', expiry.toString());
            setResendCooldown(60);
        } catch (err) {
            showToast(err.message || 'Failed to resend confirmation email.', 'error');
        } finally {
            setResendLoading(false);
        }
    };

    /* ── Email Login ─────────────────────────────────────────── */
    const handleLogin = async (e) => {
        e.preventDefault();
        setUnverifiedEmail(''); // reset any previous unverified state
        
        if (!email || !password) { showToast('Please enter your email and password.', 'warning'); return; }
        if (!captchaToken) { showToast('Please complete the verification challenge.', 'warning'); return; }
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
                options: { captchaToken },
            });
            if (error) throw error;

            // Check admin status
            const { data: isAdmin } = await supabase.rpc('is_admin').maybeSingle();
            if (isAdmin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const msg = err.message || '';
            if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
                showToast('Incorrect email or password. Please try again.', 'error');
            } else if (msg.toLowerCase().includes('email not confirmed')) {
                setUnverifiedEmail(email.trim());
                // Don't show toast, we'll show an inline alert instead
            } else {
                showToast(msg || 'Login failed. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
            turnstileRef.current?.reset();
            setCaptchaToken('');
        }
    };

    /* ── Google Login ─────────────────────────────────────────── */
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: getRedirectUrl(),
                    queryParams: { prompt: 'select_account' },
                },
            });
            if (error) throw error;
        } catch (err) {
            showToast(err.message || 'Google login failed. Please try again.', 'error');
            setGoogleLoading(false);
        }
    };

    const loginFeatures = [
        { heading: "Your personalized hub", description: "Everything you need in one place.", icon: "🏠" },
        { heading: "Continue Learning", description: "Pick up right where you left off.", icon: "📚" },
        { heading: "Earn Opportunities", description: "New gigs matching your skills.", icon: "💰" },
        { heading: "Grow Your Network", description: "Connect with new members daily.", icon: "🤝" }
    ];

    return (
        <>
        <SEO
            title="Log In | Chavee"
            description="Log in to Chavee to access your courses, gigs, communities, and events — India's first student social platform."
            path="/login"
        />
        <AuthLayout
            leftPanel={
                <BrandPanel
                    heading={<>Welcome back<br/>to Chavee.</>}
                    subtitle="Continue your journey of learning, earning and building meaningful connections."
                    features={loginFeatures}
                />
            }
            mobileHeader={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                    <ChaveeLogo height={32} light />
                    <div>
                        {/* Not a real <h1> — BrandPanel's heading is already the page's
                            one real h1 (same text, desktop panel), and both exist in the
                            DOM simultaneously (CSS-toggled by breakpoint, not conditionally
                            rendered), so a second h1 here would be a real duplicate-h1 bug. */}
                        <p style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                            Welcome back
                        </p>
                        <p style={{ fontSize: '1rem', opacity: 0.9, color: '#DFF7EA', margin: 0 }}>
                            Sign in to continue your journey.
                        </p>
                    </div>
                </div>
            }
        >
            <AuthCard heading="Log in to Chavee" subtitle="Welcome back! Please enter your details.">
                
                <AnimatePresence>
                {unverifiedEmail && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                        <div style={{
                            background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 12,
                            padding: '1.25rem', color: '#92400E', fontSize: '0.9rem', lineHeight: '1.5'
                        }}>
                            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span>⚠️</span> Account not verified
                            </div>
                            Your email (<strong>{unverifiedEmail}</strong>) hasn't been confirmed yet. Please check your inbox for the verification link.
                            <div style={{ marginTop: '0.75rem' }}>
                                <button 
                                    onClick={handleResendEmail} 
                                    disabled={resendLoading || resendCooldown > 0}
                                    style={{ 
                                        background: '#D97706', color: '#FFF', border: 'none', padding: '0.5rem 1rem', 
                                        borderRadius: '8px', fontWeight: 600, cursor: (resendLoading || resendCooldown > 0) ? 'not-allowed' : 'pointer',
                                        opacity: (resendLoading || resendCooldown > 0) ? 0.7 : 1, transition: 'all 0.2s'
                                    }}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? 'Sending...' : 'Resend Verification Email'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <SocialLoginButton 
                        provider="google" 
                        text="Log in with Google" 
                        onClick={handleGoogleLogin} 
                        loading={googleLoading} 
                        disabled={loading} 
                    />
                    <SocialLoginButton 
                        provider="apple" 
                        text="Apple" 
                        disabled={true} 
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                    <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>OR</span>
                    <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <button disabled style={{ background: 'none', border: 'none', color: '#9CA3AF', fontWeight: 600, fontSize: '0.85rem', cursor: 'not-allowed' }}>
                        Use Phone Number (OTP) - Coming Soon
                    </button>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <InputField 
                        label="Email Address" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="you@example.com" 
                        required 
                    />

                    <PasswordField 
                        label="Password" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Enter your password" 
                        required 
                    />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input 
                                type="checkbox" 
                                id="rememberMe" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#0B8F5A' }} 
                            />
                            <label htmlFor="rememberMe" style={{ fontSize: '0.85rem', color: '#4B5563', cursor: 'pointer', fontWeight: 500 }}>
                                Remember me
                            </label>
                        </div>
                        <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#0B8F5A', fontWeight: 600, textDecoration: 'none' }}>
                            Forgot Password?
                        </Link>
                    </div>

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
                        whileHover={!(loading || googleLoading || !captchaToken) ? { scale: 1.02, boxShadow: '0 8px 20px rgba(11,143,90,0.2)' } : {}}
                        whileTap={!(loading || googleLoading || !captchaToken) ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={loading || googleLoading || !captchaToken}
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
                            opacity: (loading || googleLoading || !captchaToken) ? 0.7 : 1,
                            cursor: (loading || googleLoading || !captchaToken) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 10px rgba(11,143,90,0.1)'
                        }}
                    >
                        {loading ? <ButtonSpinner label="Logging in..." /> : 'Log In →'}
                    </motion.button>
                </form>

                <AuthFooter text="Don't have an account?" linkText="Create Account" linkTo="/signup" />
            </AuthCard>

            <Toast {...toast} onHide={hideToast} />
        </AuthLayout>
        </>
    );
}
