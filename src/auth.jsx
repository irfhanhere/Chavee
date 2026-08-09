import { supabase } from './supabaseClient.js';
import React, { useState, useEffect } from 'react';

// 1) For Sign Up:
// - Use supabase.auth.signUp({ email, password })
export async function signUpUser(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
        throw error;
    }
    return data;
}

// 2) For Sign In:
// - Use supabase.auth.signInWithPassword({ email, password })
export async function signInUser(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        throw error;
    }
    return data;
}

/**
 * React Auth Screen containing Sign In and Sign Up flows connected to Supabase Auth.
 */
export default function AuthPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 6000); // Auto clears after 6 seconds
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        setSuccessMessage('');
        setError('');
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        setSuccessMessage('');
        setError('');
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            if (isSignUp) {
                // 1) Sign Up
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                
                // After signup, switch to Login tab and show prefilled email + check-email message
                setSuccessMessage("Account created successfully! Please check your email to verify your account before signing in.");
                setIsSignUp(false);
                setPassword(''); // Keep password empty
            } else {
                // 2) Sign In
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                
                // only redirect when a real session exists
                if (data.session) {
                    window.location.href = "/";
                } else {
                    setError("Active session not found. Please verify your email first.");
                }
            }
        } catch (err) {
            // 4) Add simple error handling: If Supabase returns an error, show a small error message under the form.
            setError(err.message || 'Authentication failed');
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setSuccessMessage('');
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err) {
            setError(err.message || 'Google login failed.');
        }
    };

    const GoogleIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.24-2.06 3.67-5.1 3.67-8.41z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.07.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.27v3.08C3.25 21.3 7.37 24 12 24z" />
            <path fill="#FBBC05" d="M5.24 14.26a7.18 7.18 0 010-4.52V6.66H1.27a11.967 11.967 0 000 10.68l3.97-3.08z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.93 1.19 15.24 0 12 0 7.37 0 3.25 2.7 1.27 6.66l3.97 3.08c.95-2.88 3.61-5.01 6.76-5.01z" />
        </svg>
    );

    return (
        <div style={styles.container}>
            <form onSubmit={handleAuth} style={styles.form}>
                <h2 style={styles.title}>{isSignUp ? 'Create Account 📝' : 'Welcome Back 👋'}</h2>
                
                <div style={styles.inputGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input 
                        type="email" 
                        value={email} 
                        onChange={handleEmailChange} 
                        required 
                        style={styles.input}
                        placeholder="student@chavee.in"
                    />
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>Password</label>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={handlePasswordChange} 
                        required 
                        style={styles.input}
                        placeholder="••••••••"
                    />
                </div>

                {error && <p style={styles.error}>{error}</p>}
                {successMessage && <p style={styles.success}>{successMessage}</p>}

                <button type="submit" style={styles.button}>
                    {isSignUp ? 'Sign Up' : 'Log In'}
                </button>

                <div style={styles.dividerContainer}>
                    <div style={styles.dividerLine}></div>
                    <span style={styles.dividerText}>or</span>
                    <div style={styles.dividerLine}></div>
                </div>

                <button type="button" onClick={handleGoogleLogin} style={styles.googleButton}>
                    <GoogleIcon />
                    Continue with Google
                </button>

                <p onClick={() => { setError(''); setSuccessMessage(''); setIsSignUp(!isSignUp); }} style={styles.toggle}>
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </p>
            </form>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F5F5F7',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    form: {
        background: '#ffffff',
        padding: '2rem',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        width: '350px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        border: '1px solid #E5E5EA'
    },
    title: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#1C1C1E',
        textAlign: 'center',
        margin: '0 0 0.5rem 0'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem'
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#48484A'
    },
    input: {
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #C7C7CC',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        color: '#1C1C1E'
    },
    button: {
        padding: '0.75rem',
        borderRadius: '8px',
        border: 'none',
        backgroundColor: '#2E7D32', // Matches Chavee's ForestGreen
        color: '#ffffff',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '0.5rem',
        transition: 'background-color 0.2s'
    },
    error: {
        color: '#FF3B30',
        fontSize: '0.8rem',
        fontWeight: '500',
        margin: '0',
        textAlign: 'center'
    },
    success: {
        color: '#2E7D32',
        fontSize: '0.85rem',
        fontWeight: '600',
        margin: '0',
        textAlign: 'center'
    },
    toggle: {
        textAlign: 'center',
        color: '#2E7D32',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '600',
        margin: '0',
        userSelect: 'none'
    },
    dividerContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0.25rem 0',
        gap: '0.5rem'
    },
    dividerLine: {
        flex: 1,
        height: '1px',
        backgroundColor: '#E5E5EA'
    },
    dividerText: {
        fontSize: '0.8rem',
        color: '#8E8E93',
        fontWeight: '500',
        textTransform: 'uppercase'
    },
    googleButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid #C7C7CC',
        backgroundColor: '#ffffff',
        color: '#1C1C1E',
        fontSize: '0.95rem',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        outline: 'none'
    }
};
