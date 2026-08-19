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
        return 'https://chavee.in/chavee/onboarding';
    }
    return `${window.location.origin}/chavee/onboarding`;
};

export default function SignUp() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();

    const [loading, setLoading]   = useState(false);
    const [showPw, setShowPw]     = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [submitThrottled, setSubmitThrottled] = useState(false);
    const [rateLimitError, setRateLimitError] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);

    // Resend confirmation email states
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

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
        if (!email.trim()) return;
        if (resendCooldown > 0) return;

        setResendLoading(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email.trim().toLowerCase(),
            });

            if (error) throw error;

            showToast('Verification email resent successfully! ✉️', 'success');
            
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

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName]         = useState('');
    const [username, setUsername] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [usernameStatus, setUsernameStatus] = useState(''); // '', 'checking', 'available', 'taken', 'invalid'
    const usernameTimer = React.useRef(null);

    // Turnstile — Bot and Abuse Protection is active on the linked Supabase
    // project (Dashboard-configured), which expects options.captchaToken on
    // the auth call itself. The widget token is single-use, so it's reset
    // after every attempt (success or failure) via turnstileRef.
    const [captchaToken, setCaptchaToken] = useState('');
    const turnstileRef = useRef(null);

    // Password validation logic
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

    const checkUsernameAvailability = async (val) => {
        const cleanVal = val.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (cleanVal.length < 3) {
            setUsernameStatus('invalid');
            return;
        }
        setUsernameStatus('checking');
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('username', cleanVal);
            if (error) throw error;
            if (data && data.length > 0) {
                setUsernameStatus('taken');
            } else {
                setUsernameStatus('available');
            }
        } catch (err) {
            console.error('Error checking username availability:', err);
            setUsernameStatus('available');
        }
    };

    const handleUsernameChange = (val) => {
        const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setUsername(clean);
        if (!clean) {
            setUsernameStatus('');
            return;
        }
        clearTimeout(usernameTimer.current);
        usernameTimer.current = setTimeout(() => {
            checkUsernameAvailability(clean);
        }, 400);
    };

    /* ── Email Sign-Up ────────────────────────────────────────── */
    const handleSignUp = async (e) => {
        e.preventDefault();
        if (loading || submitThrottled) return;
        if (!name.trim()) { showToast('Please enter your full name.', 'warning'); return; }
        if (!username.trim() || usernameStatus === 'taken' || usernameStatus === 'invalid') {
            showToast('Please choose a valid, unique username.', 'warning');
            return;
        }
        if (!isPasswordValid) { showToast('Please meet all password requirements.', 'warning'); return; }
        if (password !== confirmPassword) { showToast('Passwords do not match.', 'warning'); return; }
        if (!agreeTerms) { showToast('You must agree to the Terms of Service and Privacy Policy.', 'warning'); return; }
        if (!captchaToken) { showToast('Please complete the verification challenge.', 'warning'); return; }

        setLoading(true);
        setRateLimitError(false);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: { full_name: name.trim() },
                    emailRedirectTo: getRedirectUrl(),
                    captchaToken,
                },
            });
            if (error) {
                if (error.code === 'over_email_send_rate_limit' || error.status === 429 || error.message.includes('rate limit') || error.message.includes('limit exceeded')) {
                    setRateLimitError(true);
                    showToast("We're experiencing high signup volume right now. Please try again in a few minutes, or continue with Google instead.", 'error');
                    setLoading(false);
                    return;
                }
                // Rejected by the "before user created" DB auth hook
                // (public.hook_reject_disposable_email_domains) for a known
                // disposable/temp-mail domain. Match on a stable substring
                // rather than the full string, so the copy stays clean even
                // if supabase-js wraps/prefixes the hook's raw message.
                if (error.message && error.message.toLowerCase().includes('disposable')) {
                    showToast('Please use a real, non-disposable email address to sign up.', 'error');
                    setLoading(false);
                    return;
                }
                throw error;
            }

            // If auto-confirm is off, user gets an email
            if (data?.user?.identities?.length === 0) {
                showToast('This email is already registered. Try signing in.', 'warning');
                setTimeout(() => navigate('/login'), 2000);
                return;
            }

            // Upsert profile — trigger handles this too, but this is a safety fallback
            if (data.user) {
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    full_name: name.trim(),
                    username: username.trim().toLowerCase(),
                    college: '',
                    interests: [],
                    motive: '',
                    bio: `Hi, I'm ${name.trim()}! New to Chavee 👋`,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

                try {
                    await supabase.rpc('initialize_user_gamification', { p_user_id: data.user.id });
                } catch (e) {
                    console.error('Failed to init gamification', e);
                }
            }

            if (data?.session) {
                showToast('Welcome to Chavee! Signing you in... 🎉', 'success');
                setTimeout(() => navigate('/dashboard'), 1500);
            } else {
                setSignupSuccess(true);
            }
        } catch (err) {
            showToast(err.message || 'Signup failed. Please try again.', 'error');
        } finally {
            setLoading(false);
            setSubmitThrottled(true);
            setTimeout(() => setSubmitThrottled(false), 4000);
            // Turnstile tokens are single-use — reset for the next attempt
            // regardless of outcome.
            turnstileRef.current?.reset();
            setCaptchaToken('');
        }
    };

    /* ── Google Sign-Up ───────────────────────────────────────── */
    const handleGoogleSignUp = async () => {
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
            showToast(err.message || 'Google sign-up failed. Please try again.', 'error');
            setGoogleLoading(false);
        }
    };

    if (signupSuccess) {
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
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✉️</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', color: '#111827' }}>Verify your email</h1>
                    <p style={{ color: '#6B7280', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: 1.6 }}>
                        We've sent a verification email to <strong>{email}</strong>. Please click the link inside your inbox.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <a href="https://mail.google.com/" target="_blank" rel="noopener noreferrer" 
                           style={{ background: '#0B8F5A', color: '#fff', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, display: 'block', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(11,143,90,0.2)' }}>
                            Open Gmail
                        </a>
                        
                        <button onClick={handleResendEmail} disabled={resendLoading || resendCooldown > 0} 
                                style={{ background: '#F3F4F6', color: '#374151', padding: '1rem', borderRadius: '12px', border: 'none', fontWeight: 600, cursor: (resendLoading || resendCooldown > 0) ? 'not-allowed' : 'pointer', opacity: (resendLoading || resendCooldown > 0) ? 0.7 : 1 }}>
                            {resendCooldown > 0 ? `Resend Email (${resendCooldown}s)` : resendLoading ? 'Resending...' : 'Resend Email'}
                        </button>
                        
                        <Link to="/login" style={{ color: '#6B7280', fontWeight: 600, textDecoration: 'none', marginTop: '1rem' }}>
                            ← Back to Login
                        </Link>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#9CA3AF', marginTop: '2rem' }}>
                        Didn't receive it? Check your spam folder.
                    </p>
                </div>
                <Toast {...toast} onHide={hideToast} />
            </motion.div>
        );
    }

    const signupFeatures = [
        { heading: "Join verified communities", description: "Connect with students from your college.", icon: "👥" },
        { heading: "Earn through exclusive gigs", description: "Find freelance work tailored for students.", icon: "💼" },
        { heading: "Learn high-demand skills", description: "Access curated courses and resources.", icon: "🎓" },
        { heading: "Network with ambitious peers", description: "Build relationships that last a lifetime.", icon: "🌐" }
    ];

    return (
        <>
        <SEO
            title="Sign Up | Chavee"
            description="Create a free Chavee account — India's first student social platform for learning, earning, networking, and events."
            path="/signup"
        />
        <AuthLayout
            leftPanel={
                <BrandPanel
                    heading={<>Launch your future<br/>with Chavee.</>}
                    subtitle="Join India's first student social platform and connect, learn, earn and grow together."
                    features={signupFeatures}
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
                            Launch your future
                        </p>
                        <p style={{ fontSize: '1rem', opacity: 0.9, color: '#DFF7EA', margin: 0 }}>
                            Join India's first student social platform.
                        </p>
                    </div>
                </div>
            }
        >
            <AuthCard heading="Create Your Account" subtitle="Start your journey in less than 30 seconds.">
                
                <AnimatePresence>
                {rateLimitError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
                        <div style={{
                            background: '#FEF2F2',
                            border: '1.5px solid #FCA5A5',
                            borderRadius: 12,
                            padding: '1rem',
                            color: '#991B1B',
                            fontSize: '0.9rem',
                            lineHeight: '1.4'
                        }}>
                            <div style={{ fontWeight: 700, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span>⚠️</span> Rate Limit Reached
                            </div>
                            We're experiencing high signup volume right now. Please try again in a few minutes, or continue with Google instead.
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <SocialLoginButton 
                        provider="google" 
                        text="Continue with Google" 
                        onClick={handleGoogleSignUp} 
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

                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <InputField 
                        label="Full Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        placeholder="e.g. Rahul Kumar" 
                        required 
                    />
                    
                    <div>
                        <InputField 
                            label="Username" 
                            value={username} 
                            onChange={e => handleUsernameChange(e.target.value)} 
                            placeholder="rahulkumar" 
                            required 
                        />
                        <AnimatePresence mode="wait">
                        {usernameStatus === 'checking' && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.5rem', display: 'block' }}>🔍 Checking availability...</motion.span>}
                        {usernameStatus === 'available' && <motion.span initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0}} style={{ fontSize: '0.8rem', color: '#10B981', marginTop: '0.5rem', display: 'block', fontWeight: 600 }}>✓ Username is available</motion.span>}
                        {usernameStatus === 'taken' && <motion.span initial={{opacity:0, x:-5}} animate={{opacity:1, x:0}} exit={{opacity:0}} style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.5rem', display: 'block', fontWeight: 600 }}>✗ Username is already taken</motion.span>}
                        {usernameStatus === 'invalid' && <motion.span initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} style={{ fontSize: '0.8rem', color: '#F59E0B', marginTop: '0.5rem', display: 'block', fontWeight: 600 }}>⚠ Minimum 3 letters/numbers only</motion.span>}
                        </AnimatePresence>
                    </div>

                    <InputField 
                        label="Email Address" 
                        type="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="you@example.com" 
                        required 
                    />

                    <div>
                        <PasswordField 
                            label="Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Create a strong password" 
                            required 
                        />
                        {/* Live Password Checklist */}
                        {password.length > 0 && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden' }}>
                                <span style={{ color: hasMinLength ? '#0B8F5A' : '#9CA3AF' }}>{hasMinLength ? <motion.span initial={{scale:0}} animate={{scale:1}} style={{display:'inline-block'}}>✓</motion.span> : '○'} Min 8 characters</span>
                                <span style={{ color: hasUpper ? '#0B8F5A' : '#9CA3AF' }}>{hasUpper ? <motion.span initial={{scale:0}} animate={{scale:1}} style={{display:'inline-block'}}>✓</motion.span> : '○'} Uppercase letter</span>
                                <span style={{ color: hasLower ? '#0B8F5A' : '#9CA3AF' }}>{hasLower ? <motion.span initial={{scale:0}} animate={{scale:1}} style={{display:'inline-block'}}>✓</motion.span> : '○'} Lowercase letter</span>
                                <span style={{ color: hasNumber ? '#0B8F5A' : '#9CA3AF' }}>{hasNumber ? <motion.span initial={{scale:0}} animate={{scale:1}} style={{display:'inline-block'}}>✓</motion.span> : '○'} Number</span>
                                <span style={{ color: hasSpecial ? '#0B8F5A' : '#9CA3AF' }}>{hasSpecial ? <motion.span initial={{scale:0}} animate={{scale:1}} style={{display:'inline-block'}}>✓</motion.span> : '○'} Special character</span>
                            </motion.div>
                        )}
                    </div>

                    <div>
                        <PasswordField 
                            label="Confirm Password" 
                            value={confirmPassword} 
                            onChange={e => setConfirmPassword(e.target.value)} 
                            placeholder="Repeat your password" 
                            required 
                        />
                        {confirmPassword.length > 0 && password !== confirmPassword && (
                            <span style={{ fontSize: '0.8rem', color: '#EF4444', marginTop: '0.5rem', display: 'block' }}>✗ Passwords do not match</span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <input 
                            type="checkbox" 
                            id="agreeTerms" 
                            checked={agreeTerms} 
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0B8F5A' }} 
                        />
                        <label htmlFor="agreeTerms" style={{ fontSize: '0.85rem', color: '#4B5563', cursor: 'pointer' }}>
                            I agree to the <Link to="/terms-and-conditions" style={{ color: '#0B8F5A', fontWeight: 600, textDecoration: 'none' }}>Terms</Link> and <Link to="/privacy-policy" style={{ color: '#0B8F5A', fontWeight: 600, textDecoration: 'none' }}>Privacy Policy</Link>
                        </label>
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
                        whileHover={!(loading || googleLoading || submitThrottled || !captchaToken) ? { scale: 1.02, boxShadow: '0 8px 20px rgba(11,143,90,0.2)' } : {}}
                        whileTap={!(loading || googleLoading || submitThrottled || !captchaToken) ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={loading || googleLoading || submitThrottled || !captchaToken}
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
                            opacity: (loading || googleLoading || submitThrottled || !captchaToken) ? 0.7 : 1,
                            cursor: (loading || googleLoading || submitThrottled || !captchaToken) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 10px rgba(11,143,90,0.1)'
                        }}
                    >
                        {loading ? (
                            <ButtonSpinner label="Creating account..." />
                        ) : submitThrottled ? (
                            'Please wait...'
                        ) : (
                            'Continue →'
                        )}
                    </motion.button>
                </form>

                <AuthFooter text="Already have an account?" linkText="Log in" linkTo="/login" />
            </AuthCard>

            <Toast {...toast} onHide={hideToast} />
        </AuthLayout>
        </>
    );
}
