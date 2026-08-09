import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../hooks/useAuth.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';

// ── Reusable Components ─────────────────────────────────────

const StepProgress = ({ current, total }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {Array.from({ length: total }).map((_, i) => (
                <React.Fragment key={i}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: current >= i + 1 ? '#0B8F5A' : '#F3F4F6',
                        color: current >= i + 1 ? '#FFF' : '#9CA3AF',
                        fontWeight: 800, fontSize: '0.9rem',
                        transition: 'all 0.3s ease',
                        border: current === i + 1 ? '2px solid rgba(11,143,90,0.3)' : '2px solid transparent',
                        boxShadow: current === i + 1 ? '0 0 0 4px rgba(11,143,90,0.1)' : 'none'
                    }}>
                        {current > i + 1 ? '✓' : (i + 1)}
                    </div>
                    {i < total - 1 && (
                        <div style={{ height: '3px', width: 'clamp(20px, 4vw, 50px)', background: current > i + 1 ? '#0B8F5A' : '#F3F4F6', transition: 'all 0.3s ease', borderRadius: '2px' }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const InterestCard = ({ label, selected, onClick, disabled }) => {
    return (
        <motion.button
            whileHover={!disabled || selected ? { scale: 1.03 } : {}}
            whileTap={!disabled || selected ? { scale: 0.97 } : {}}
            onClick={onClick}
            disabled={disabled && !selected}
            style={{
                padding: '1rem',
                borderRadius: '16px',
                border: selected ? '2px solid #0B8F5A' : '2px solid #E5E7EB',
                background: selected ? 'rgba(11,143,90,0.05)' : '#FFFFFF',
                color: selected ? '#0B8F5A' : '#4B5563',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: (disabled && !selected) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: (disabled && !selected) ? 0.5 : 1
            }}
        >
            {label}
        </motion.button>
    );
};

const CompletionRing = ({ percentage }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 2rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="75" cy="75" r={radius} stroke="#F3F4F6" strokeWidth="12" fill="none" />
                <motion.circle 
                    cx="75" cy="75" r={radius} 
                    stroke="#0B8F5A" strokeWidth="12" fill="none" 
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round"
                />
            </svg>
            <div style={{ position: 'absolute', fontSize: '2rem', fontWeight: 900, color: '#111827' }}>
                {percentage}%
            </div>
        </div>
    );
};

const SimpleConfetti = () => {
    const particles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100 - 50 + 'vw',
        y: -20 - Math.random() * 20 + 'vh',
        color: ['#0B8F5A', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'][Math.floor(Math.random() * 5)],
        delay: Math.random() * 0.5,
        duration: 1.5 + Math.random() * 1.5
    }));

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 100 }}>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 1, x: 0, y: '-10vh', rotate: 0 }}
                    animate={{ opacity: 0, x: p.x, y: '110vh', rotate: 360 }}
                    transition={{ duration: p.duration, delay: p.delay, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        left: '50%',
                        width: '10px', height: '10px',
                        backgroundColor: p.color,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                    }}
                />
            ))}
        </div>
    );
};


// ── Main Onboarding Wizard ──────────────────────────────────

export default function Onboarding() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState([]);
    
    const [formData, setFormData] = useState({
        college: '',
        course: '',
        year: '',
        state: '',
        career_goal: '',
        skill_level: '',
        bio: '',
        avatar_url: '',
        interests: []
    });

    const ALL_INTERESTS = [
        'Programming', 'Design', 'Marketing', 'Business', 
        'Travel', 'AI', 'Language Learning', 'Photography', 
        'Content Creation', 'Finance', 'Engineering', 'Medical', 
        'Law', 'Animation', 'Gaming', 'Student Clubs'
    ];

    // Fetch initial profile data & top communities on mount
    useEffect(() => {
        if (!user) return;
        const fetchInitialData = async () => {
            try {
                // Fetch Profile
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profile) {
                    setFormData(prev => ({
                        ...prev,
                        college: profile.college || '',
                        course: profile.course || '',
                        year: profile.year || '',
                        state: profile.state || '',
                        career_goal: profile.career_goal || '',
                        skill_level: profile.skill_level || '',
                        bio: profile.bio || '',
                        avatar_url: profile.avatar_url || '',
                        interests: Array.isArray(profile.interests) ? profile.interests : []
                    }));
                }

                // Fetch Top Communities by member count
                const { data: comms } = await supabase.from('communities')
                    .select('*, community_members(count)')
                    .eq('status', 'Live')
                    .limit(20);
                
                if (comms) {
                    const sorted = comms.sort((a, b) => {
                        const countA = a.community_members?.[0]?.count || 0;
                        const countB = b.community_members?.[0]?.count || 0;
                        return countB - countA;
                    });
                    setCommunities(sorted.slice(0, 4));
                }
            } catch (err) {
                console.error("Failed to load onboarding data:", err);
            }
        };
        fetchInitialData();
    }, [user]);

    // Step 2 & 3: Save to Profiles Table
    const saveProfileData = async (isSkip = false) => {
        if (!user) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('profiles').update({
                college: formData.college,
                course: formData.course,
                year_of_study: formData.year,
                state: formData.state,
                career_goal: formData.career_goal,
                skill_level: formData.skill_level,
                bio: formData.bio,
                avatar_url: formData.avatar_url,
                interests: formData.interests,
                profile_complete: true
            }).eq('id', user.id);
            if (error) throw error;
            setCurrentStep(prev => prev + 1);
        } catch (err) {
            showToast("Failed to save progress.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Join Community
    const handleJoinCommunity = async (communityId) => {
        if (!user) return;
        try {
            const { error } = await supabase.from('community_members').insert({
                user_id: user.id,
                community_id: communityId
            });
            if (error && error.code !== '23505') throw error; // Ignore unique constraint if already joined
            showToast("Joined community! 🎉", "success");
            // Mark it as joined in local state so the button updates
            setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, joined: true } : c));
        } catch (err) {
            showToast("Failed to join community.", "error");
        }
    };

    const handleSkipOrNextStep = () => {
        setCurrentStep(prev => prev + 1);
    };

    const calculateCompletionPercentage = () => {
        const fields = ['college', 'course', 'year', 'state', 'career_goal', 'skill_level', 'bio', 'avatar_url'];
        const filledCount = fields.filter(f => formData[f] && formData[f].trim().length > 0).length;
        // Also count interests as a field
        const hasInterests = formData.interests.length > 0 ? 1 : 0;
        const totalPossible = fields.length + 1;
        return Math.round(((filledCount + hasInterests) / totalPossible) * 100);
    };

    // Render Steps
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', display: 'inline-block', animation: 'float 3s ease-in-out infinite' }}>👋</div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                            Welcome to Chavee!
                        </h1>
                        <p style={{ fontSize: '1.15rem', color: '#6B7280', marginBottom: '2.5rem', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 2.5rem auto' }}>
                            We're excited to have you on board. Let's build your student profile so you can start discovering communities, gigs, and events tailored just for you.
                        </p>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setCurrentStep(2)} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>
                            Let's Go →
                        </motion.button>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', marginBottom: '0.5rem' }}>Complete Profile</h2>
                            <p style={{ color: '#6B7280' }}>Tell us a bit about your academic journey.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', textAlign: 'left', marginBottom: '2rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Profile Photo URL (Optional)</label>
                                <input type="url" value={formData.avatar_url} onChange={e => setFormData({...formData, avatar_url: e.target.value})} placeholder="https://example.com/photo.jpg" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>College</label>
                                <input type="text" value={formData.college} onChange={e => setFormData({...formData, college: e.target.value})} placeholder="e.g. IIT Delhi" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Course / Degree</label>
                                <input type="text" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} placeholder="e.g. B.Tech Computer Science" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Graduation Year</label>
                                <input type="text" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="e.g. 2026" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>State</label>
                                <input type="text" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="e.g. Maharashtra" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Career Goal</label>
                                <input type="text" value={formData.career_goal} onChange={e => setFormData({...formData, career_goal: e.target.value})} placeholder="e.g. Software Engineer" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Skill Level</label>
                                <select value={formData.skill_level} onChange={e => setFormData({...formData, skill_level: e.target.value})} style={inputStyle}>
                                    <option value="">Select Level</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Bio</label>
                                <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell everyone a bit about yourself..." style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
                            </div>
                            
                            {/* Verification Placeholders */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
                                <div style={{ flex: 1, minWidth: '200px', background: '#F3F4F6', padding: '1rem', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4B5563', marginBottom: '0.5rem' }}>Student Email Verification</div>
                                    <button disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#E5E7EB', color: '#9CA3AF', fontWeight: 600, cursor: 'not-allowed', fontSize: '0.85rem' }} title="Coming Soon">
                                        Verify .edu email (Coming Soon)
                                    </button>
                                </div>
                                <div style={{ flex: 1, minWidth: '200px', background: '#F3F4F6', padding: '1rem', borderRadius: '12px', border: '1px dashed #D1D5DB' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4B5563', marginBottom: '0.5rem' }}>College ID Badge</div>
                                    <button disabled style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#E5E7EB', color: '#9CA3AF', fontWeight: 600, cursor: 'not-allowed', fontSize: '0.85rem' }} title="Coming Soon">
                                        Upload ID Card (Coming Soon)
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => saveProfileData(true)} disabled={loading} style={{ background: '#F3F4F6', color: '#4B5563', padding: '1rem 2rem', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                                Skip
                            </motion.button>
                            <motion.button whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}} onClick={() => saveProfileData()} disabled={loading} className="btn-primary" style={{ padding: '1rem 2rem', borderRadius: '12px' }}>
                                {loading ? <ButtonSpinner label="" /> : 'Continue →'}
                            </motion.button>
                        </div>
                    </motion.div>
                );

            case 3:
                const isInterestsValid = formData.interests.length >= 3 && formData.interests.length <= 8;
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', marginBottom: '0.5rem' }}>Choose your interests</h2>
                            <p style={{ color: '#6B7280' }}>Select 3 to 8 topics you are passionate about.</p>
                            <div style={{ marginTop: '0.5rem', fontWeight: 700, color: isInterestsValid ? '#0B8F5A' : '#EF4444', fontSize: '0.9rem' }}>
                                Selected: {formData.interests.length} / 8
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                            {ALL_INTERESTS.map(interest => {
                                const selected = formData.interests.includes(interest);
                                const disabled = !selected && formData.interests.length >= 8;
                                return (
                                    <InterestCard 
                                        key={interest} 
                                        label={interest} 
                                        selected={selected} 
                                        disabled={disabled}
                                        onClick={() => {
                                            setFormData(prev => {
                                                const newInterests = selected 
                                                    ? prev.interests.filter(i => i !== interest)
                                                    : [...prev.interests, interest];
                                                return { ...prev, interests: newInterests };
                                            });
                                        }} 
                                    />
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <motion.button whileHover={!(!isInterestsValid || loading) ? { scale: 1.02 } : {}} whileTap={!(!isInterestsValid || loading) ? { scale: 0.98 } : {}} onClick={() => saveProfileData()} disabled={!isInterestsValid || loading} className="btn-primary" style={{ padding: '1rem 3rem', borderRadius: '12px', cursor: (!isInterestsValid || loading) ? 'not-allowed' : 'pointer', border: 'none', opacity: (!isInterestsValid || loading) ? 0.6 : 1 }}>
                                {loading ? <ButtonSpinner label="" /> : 'Continue →'}
                            </motion.button>
                        </div>
                    </motion.div>
                );

            case 4:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', marginBottom: '0.5rem' }}>Suggested Communities</h2>
                            <p style={{ color: '#6B7280' }}>Join the most active groups on Chavee to kickstart your network.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', textAlign: 'left' }}>
                            {communities.length > 0 ? communities.map(comm => (
                                <div key={comm.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #E5E7EB', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}>
                                            {comm.emoji || '🎪'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#111827', fontSize: '1.05rem' }}>{comm.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>{comm.community_members?.[0]?.count || 0} Members • {comm.category || 'General'}</div>
                                        </div>
                                    </div>
                                    <motion.button 
                                        whileHover={!comm.joined ? { scale: 1.05 } : {}}
                                        whileTap={!comm.joined ? { scale: 0.95 } : {}}
                                        onClick={() => handleJoinCommunity(comm.id)}
                                        disabled={comm.joined}
                                        style={{
                                            padding: '0.5rem 1.25rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem', cursor: comm.joined ? 'default' : 'pointer', transition: 'all 0.2s',
                                            background: comm.joined ? '#F3F4F6' : '#0B8F5A',
                                            color: comm.joined ? '#9CA3AF' : '#FFFFFF',
                                            border: 'none',
                                            boxShadow: comm.joined ? 'none' : '0 4px 10px rgba(11,143,90,0.2)'
                                        }}
                                    >
                                        {comm.joined ? 'Joined ✓' : 'Join'}
                                    </motion.button>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>Loading communities...</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSkipOrNextStep} className="btn-primary" style={{ padding: '1rem 3rem', borderRadius: '12px', cursor: 'pointer', border: 'none' }}>
                                Finish Setup 🎉
                            </motion.button>
                        </div>
                    </motion.div>
                );

            case 5:
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', position: 'relative' }}>
                        <SimpleConfetti />
                        
                        <CompletionRing percentage={calculateCompletionPercentage()} />
                        
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Welcome aboard!</h2>
                        <p style={{ color: '#6B7280', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '400px', margin: '0 auto 2.5rem auto', lineHeight: 1.6 }}>
                            Your profile is set up and ready to go. You can always update your details later from the settings menu.
                        </p>
                        
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => navigate('/dashboard')} className="btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 8px 25px rgba(11,143,90,0.3)', cursor: 'pointer', border: 'none' }}>
                            Go to Dashboard →
                        </motion.button>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'Inter', sans-serif" }}>
            <div style={{
                width: '100%', maxWidth: '800px',
                background: '#FFFFFF',
                borderRadius: '32px',
                padding: 'clamp(2rem, 5vw, 4rem)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.05)',
                border: '1px solid #E5E7EB',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Only show progress indicator on steps 2, 3, 4 */}
                {currentStep > 1 && currentStep < 5 && (
                    <StepProgress current={currentStep - 1} total={3} />
                )}

                <AnimatePresence mode="wait">
                    {renderStepContent()}
                </AnimatePresence>
            </div>
            
            {/* Global Keyframes for floating animation */}
            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(5deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
            `}</style>
            
            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}

const inputStyle = {
    width: '100%', 
    padding: '0.85rem 1rem', 
    borderRadius: '12px', 
    border: '1px solid #E5E7EB', 
    background: '#F9FAFB',
    fontSize: '0.95rem', 
    outline: 'none', 
    transition: 'all 0.2s',
    color: '#111827'
};
