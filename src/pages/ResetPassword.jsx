import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { ChaveeLogo } from '../Logo.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';
import Toast, { useToast } from '../components/Toast.jsx';
import { motion, AnimatePresence } from 'framer-motion';

import { AuthLayout } from '../components/auth/AuthLayout.jsx';
import { BrandPanel } from '../components/auth/BrandPanel.jsx';
import { AuthCard } from '../components/auth/AuthCard.jsx';
import { PasswordField } from '../components/auth/PasswordField.jsx';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Password validation logic
    const hasMinLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

    useEffect(() => {
        // Supabase typically establishes a session automatically from the URL hash on a password reset link.
        // We can listen for the hash and ensure there's a session.
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If there's no session and no hash, they probably shouldn't be here.
                if (!window.location.hash.includes('access_token')) {
                    showToast('Invalid or expired reset link.', 'error');
                }
            }
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        
        if (!isPasswordValid) { 
            showToast('Please meet all password requirements.', 'warning'); 
            return; 
        }
        if (password !== confirmPassword) { 
            showToast('Passwords do not match.', 'warning'); 
            return; 
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            
            setIsSuccess(true);
        } catch (err) {
            showToast(err.message || 'Failed to update password.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
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
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎉</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem', color: '#111827' }}>Password Updated!</h1>
                    <p style={{ color: '#6B7280', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                        Your password has been successfully changed. You can now log in with your new password.
                    </p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <Link to="/login" style={{ background: '#0B8F5A', color: '#fff', padding: '1rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, display: 'block', transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(11,143,90,0.2)' }}>
                            Log In to Chavee
                        </Link>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <AuthLayout 
            leftPanel={
                <BrandPanel 
                    heading={<>Set a new<br/>password.</>}
                    subtitle="Create a strong password to keep your Chavee account secure."
                />
            }
            mobileHeader={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                    <ChaveeLogo height={32} light />
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem', lineHeight: 1.1, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                            New Password
                        </h1>
                        <p style={{ fontSize: '1rem', opacity: 0.9, color: '#DFF7EA', margin: 0 }}>
                            Secure your account.
                        </p>
                    </div>
                </div>
            }
        >
            <AuthCard heading="New Password" subtitle="Please enter your new password below.">
                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <PasswordField 
                            label="New Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="Create a strong password" 
                            required 
                        />

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

                    <motion.button
                        whileHover={!loading ? { scale: 1.02, boxShadow: '0 8px 20px rgba(11,143,90,0.2)' } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        type="submit"
                        disabled={loading}
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
                            opacity: loading ? 0.7 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 10px rgba(11,143,90,0.1)'
                        }}
                    >
                        {loading ? <ButtonSpinner label="Updating..." /> : 'Update Password →'}
                    </motion.button>
                </form>
            </AuthCard>

            <Toast {...toast} onHide={hideToast} />
        </AuthLayout>
    );
}
