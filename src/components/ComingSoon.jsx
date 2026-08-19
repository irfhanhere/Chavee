import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient.js';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import Toast, { useToast } from './Toast.jsx';
import SEO from './SEO.jsx';

export default function ComingSoon({ 
    title = 'Coming Soon', 
    description = 'We are working hard to bring this feature to you.', 
    illustration = '🚀',
    featureKey = 'general'
}) {
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleNotify = async (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        
        try {
            const { error } = await supabase.from('notify_subscribers').insert([
                { email, feature_key: featureKey }
            ]);
            
            // Ignore unique violation if already subscribed
            if (error && error.code !== '23505') throw error;
            
            setStatus('success');
            setEmail('');
            showToast('You are on the list! We will notify you.', 'success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('Subscription error:', err);
            setStatus('error');
            showToast('Failed to subscribe. Please try again.', 'error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>
            {/* path="/resources" — only real usage of this component today
                (App.jsx). If it's ever reused for a different "coming soon"
                route, this canonical will need to become a prop too. */}
            <SEO title={`${title} | Chavee`} description={description} path="/resources" />
            <Navbar />
            <Toast toast={toast} onClose={hideToast} />

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1.5rem' }}>
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    style={{
                        background: '#FFFFFF',
                        maxWidth: '500px',
                        width: '100%',
                        borderRadius: '24px',
                        padding: '3rem 2rem',
                        textAlign: 'center',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                        border: '1px solid #E5E7EB'
                    }}
                >
                    <div style={{ 
                        fontSize: '5rem', 
                        lineHeight: 1, 
                        marginBottom: '1.5rem',
                        display: 'inline-block',
                        background: '#EAFBF3',
                        padding: '1.5rem',
                        borderRadius: '50%',
                        boxShadow: 'inset 0 0 20px rgba(11,143,90,0.1)'
                    }}>
                        {illustration}
                    </div>

                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>
                        {title}
                    </h1>
                    
                    <p style={{ fontSize: '1.1rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        {description}
                    </p>

                    <form onSubmit={handleNotify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                        <input
                            type="email"
                            placeholder="Enter your email to get notified"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                padding: '1rem 1.25rem',
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB',
                                fontSize: '1rem',
                                width: '100%',
                                outline: 'none',
                                background: '#F8FAFC',
                                color: '#111827'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            style={{
                                padding: '1rem',
                                borderRadius: '12px',
                                background: status === 'success' ? '#10B981' : '#0B8F5A',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '1.05rem',
                                border: 'none',
                                cursor: status === 'loading' || status === 'success' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: status === 'success' ? 'none' : '0 4px 14px rgba(11,143,90,0.25)'
                            }}
                        >
                            {status === 'loading' ? 'Subscribing...' : status === 'success' ? '✓ Subscribed' : 'Notify Me'}
                        </button>
                    </form>

                    <button 
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#6B7280',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        ← Go Back
                    </button>
                </motion.div>
            </div>

            <Footer />
        </div>
    );
}
