import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SEO from '../components/SEO.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useLandingStats } from '../hooks/useLandingStats.js';
import { useTestimonials } from '../hooks/useTestimonials.js';
import { useIsMobile } from '../hooks/useIsMobile.js';
import MobileLanding from './MobileLanding.jsx';

// Real platform-preview screenshots for the "Beautifully Designed" marquee.
// Files sourced from design-references/Images/, resized/compressed into
// public/assets/platform-preview/ (see PR notes — originals ranged 200-340KB
// at up to 1536px wide; these are re-encoded to fit their actual ~600x400
// display size at retina density).
const PLATFORM_PREVIEW_SHOTS = [
    { name: 'Dashboard', desc: 'Your personalized hub.', img: '/assets/platform-preview/dashboard.jpg', fallbackIcon: '📊' },
    { name: 'Communities', desc: 'Vibrant student groups.', img: '/assets/platform-preview/communities.webp', fallbackIcon: '👥' },
    { name: 'Opportunities', desc: 'Gigs and internships.', img: '/assets/platform-preview/opportunities.jpg', fallbackIcon: '💼' },
    { name: 'Events', desc: 'Campus happenings.', img: '/assets/platform-preview/events.jpg', fallbackIcon: '🎪' },
    { name: 'Networking', desc: 'Find mentors and peers.', img: '/assets/platform-preview/networking.jpg', fallbackIcon: '🤝' },
];

// Real featured-section photos for Communities / Premium Events / Student
// Marketplace, replacing the sparkle-emoji placeholders.
const FEATURED_IMAGES = {
    Communities: '/assets/featured/communities.jpg',
    'Premium Events': '/assets/featured/premium-events.jpg',
    'Student Marketplace': '/assets/featured/student-marketplace.jpg',
};

/* ── Floating Notification Card Component ── */
const FloatingCard = ({ delay, top, right, icon, title, subtitle }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay, duration: 0.6, type: 'spring', stiffness: 100 }}
        whileHover={{ scale: 1.05 }}
        style={{
            position: 'absolute',
            top, right,
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #E5E7EB',
            borderRadius: '16px',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            zIndex: 10,
            minWidth: '220px'
        }}
    >
        <div style={{
            width: '40px', height: '40px',
            borderRadius: '12px',
            background: '#EAFBF3',
            color: '#0B8F5A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem'
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>{title}</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{subtitle}</div>
        </div>
    </motion.div>
);

export default function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { scrollYProgress } = useScroll();
    const stats = useLandingStats();
    const { testimonials } = useTestimonials();
    const isMobile = useIsMobile();

    const handleExplore = () => {
        sessionStorage.setItem('previewMode', 'true');
        navigate('/dashboard');
    };

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Parallax values
    const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 100]);
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    // Mobile: same route, same data (stats above), same auth CTAs — reflowed,
    // single-column rendering in its own component. This branch runs after
    // every hook above has already been called, same pattern AppOpening.jsx
    // uses for its own post-hooks early return. Nothing below this point
    // (the desktop JSX) is reachable or altered when this branch is taken.
    // Same real title/description already baked into index.html's static
    // <head> — made explicit here via Helmet so the homepage is controlled
    // the same consistent way as every other public page (and so its
    // canonical is emitted from the same single source of truth).
    const homeSEO = (
        <SEO
            title="Chavee — India's First Student Social Platform | Learn Earn Network Belong"
            description="Chavee is India's first student social networking platform. Learn languages, earn through gigs, find mentors, join communities and attend events. Free for all college students. Based in Kerala, growing across India."
            path="/"
        />
    );

    if (isMobile) {
        return (
            <div style={{ overflowX: 'hidden' }}>
                {homeSEO}
                <Navbar />
                <MobileLanding stats={stats} handleExplore={handleExplore} testimonials={testimonials} />
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
            {homeSEO}
            <Navbar />

            {/* SECTION 1: HERO */}
            <section style={{
                position: 'relative',
                padding: '8rem 1.5rem',
                minHeight: '90vh',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
            }}>
                <div style={{
                    position: 'absolute',
                    top: '-10%', left: '-10%', width: '40vw', height: '40vw',
                    background: 'radial-gradient(circle, rgba(11,143,90,0.1) 0%, rgba(248,250,252,0) 70%)',
                    zIndex: 0
                }} />
                
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', zIndex: 1, position: 'relative' }}>
                    <motion.div style={{ y: heroY, opacity: heroOpacity }}>
                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}
                        >
                            Everything a Student Needs.<br />
                            <span style={{ color: '#0B8F5A' }}>One Platform.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            style={{ fontSize: '1.25rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '2.5rem', maxWidth: '90%' }}
                        >
                            Learn new skills. Earn while studying. Build meaningful connections. Attend events. Grow your future with India's first student social platform.
                        </motion.p>
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                        >
                            <Link to="/signup" style={{
                                background: '#0B8F5A', color: '#fff', padding: '1rem 2rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 8px 25px rgba(11,143,90,0.3)', transition: 'all 0.2s', display: 'inline-block'
                            }}>
                                Join Chavee Free
                            </Link>
                            <button onClick={handleExplore} style={{
                                background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '1rem 2rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '1.1rem', transition: 'all 0.2s', display: 'inline-block', boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                            }}>
                                Explore Platform
                            </button>
                        </motion.div>
                    </motion.div>

                    <div className="hidden-mobile" style={{ position: 'relative', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Mockup Base */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.8, type: 'spring' }}
                            style={{
                                width: '100%', height: '80%',
                                background: '#FFFFFF',
                                borderRadius: '24px',
                                border: '1px solid #E5E7EB',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                        >
                            {/* Fake Dashboard Header */}
                            <div style={{ height: '60px', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: '1rem' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }} />
                            </div>
                            {/* Fake Content */}
                            <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem', height: '100%' }}>
                                <div style={{ background: '#F8FAFC', borderRadius: '12px', height: '80%' }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div style={{ height: '120px', background: '#EAFBF3', borderRadius: '12px' }} />
                                    <div style={{ height: '80px', background: '#F8FAFC', borderRadius: '12px' }} />
                                    <div style={{ height: '80px', background: '#F8FAFC', borderRadius: '12px' }} />
                                </div>
                            </div>
                        </motion.div>

                        <FloatingCard delay={0.4} top="15%" right="-5%" icon="🎪" title="Upcoming Event" subtitle="Web3 Hackathon starts in 2 days" />
                        <FloatingCard delay={0.6} top="45%" right="-15%" icon="🤝" title="Mentor Request" subtitle="Aditya accepted your request" />
                        <FloatingCard delay={0.8} top="75%" right="-5%" icon="⚡" title="Level Up!" subtitle="You earned 500 XP this week" />
                    </div>
                </div>
            </section>

            {/* SECTION 2: TRUST SECTION */}
            <section style={{ padding: '4rem 1.5rem', background: '#FFFFFF', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2rem' }}>
                        Trusted by early students across India
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '3rem' }}>
                        {stats.students > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{stats.students}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Verified Students</div>
                            </div>
                        )}
                        {stats.communities > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{stats.communities}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Communities</div>
                            </div>
                        )}
                        {stats.events > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{stats.events}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Live Events</div>
                            </div>
                        )}
                        {stats.opportunities > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{stats.opportunities}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Opportunities</div>
                            </div>
                        )}
                        {stats.courses > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{stats.courses}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Courses</div>
                            </div>
                        )}
                        {stats.scholarships > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{stats.scholarships}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Scholarships</div>
                            </div>
                        )}
                        {stats.blogs > 0 && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827' }}>{stats.blogs}</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Blogs</div>
                            </div>
                        )}
                        {/* Fallback if all stats are zero to prevent empty section */}
                        {Object.values(stats).every(v => v === 0) && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827' }}>An Early-Stage Platform</div>
                                <div style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Growing every day.</div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* SECTION 3: STUDENT PROBLEMS */}
            <section style={{ padding: '8rem 1.5rem', background: '#111827', color: '#FFFFFF' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'center' }}>
                    
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }}>
                        <h2 style={{ fontSize: 'clamp(2.5rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '2rem' }}>
                            Being a student today is harder than ever.
                        </h2>
                        
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {[
                                { icon: '💼', title: 'Finding internships is broken.' },
                                { icon: '👥', title: 'Finding the right people is hard.' },
                                { icon: '🚀', title: 'Learning practical skills takes time.' },
                                { icon: '🔍', title: 'Discovering opportunities is noisy.' }
                            ].map((prob, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <span style={{ fontSize: '1.5rem' }}>{prob.icon}</span>
                                    <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{prob.title}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: '-100px' }} style={{ background: '#0B8F5A', padding: '4rem', borderRadius: '32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '300px', height: '300px', background: '#10B981', filter: 'blur(80px)', opacity: 0.5, borderRadius: '50%' }} />
                        <h3 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>Why Chavee Exists</h3>
                        <p style={{ fontSize: '1.15rem', lineHeight: 1.7, opacity: 0.9, position: 'relative', zIndex: 1 }}>
                            We realized that students spend too much time jumping between LinkedIn, WhatsApp groups, fragmented job portals, and generic course platforms.
                            <br /><br />
                            Chavee brings everything a student needs into a single, cohesive, premium experience. Less noise, more growth.
                        </p>
                    </motion.div>

                </div>
            </section>

            {/* SECTION 4: EXPLORE (FOUR PILLARS) */}
            <section style={{ padding: '8rem 1.5rem', background: '#F8FAFC' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Four Pillars.<br />Unlimited Possibilities.</h2>
                        <p style={{ fontSize: '1.2rem', color: '#6B7280' }}>Everything is designed to help you launch your career.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                        {[
                            { title: 'Learn', icon: '📚', color: '#3B82F6', desc: 'Master new skills with practical courses and peer-to-peer study sessions.', link: '/learn' },
                            { title: 'Earn', icon: '💸', color: '#10B981', desc: 'Discover high-paying verified gigs, internships, and freelance opportunities.', link: '/earn' },
                            { title: 'Network', icon: '🤝', color: '#8B5CF6', desc: 'Connect with ambitious peers, join active communities, and find mentors.', link: '/network' },
                            { title: 'Events', icon: '🎪', color: '#F59E0B', desc: 'Attend premium campus events, workshops, hackathons, and workations.', link: '/events' },
                        ].map((pillar, i) => (
                            <motion.div 
                                key={pillar.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8 }}
                                style={{
                                    background: '#FFFFFF',
                                    padding: '2.5rem 2rem',
                                    borderRadius: '24px',
                                    border: '1px solid #E5E7EB',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                                    display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                    cursor: 'pointer'
                                }}
                                onClick={() => navigate(pillar.link)}
                            >
                                <div style={{ width: 60, height: 60, borderRadius: '16px', background: `${pillar.color}15`, color: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>
                                    {pillar.icon}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.75rem' }}>{pillar.title}</h3>
                                    <p style={{ color: '#6B7280', lineHeight: 1.6 }}>{pillar.desc}</p>
                                </div>
                                <div style={{ marginTop: 'auto', paddingTop: '1rem', fontWeight: 700, color: '#0B8F5A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    Explore {pillar.title} →
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 5: PLATFORM PREVIEW */}
            <section style={{ padding: '8rem 0', background: '#FFFFFF', overflow: 'hidden' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', marginBottom: '4rem' }}>
                    <h2 style={{ fontSize: '3rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Beautifully Designed.<br />Powerfully Built.</h2>
                    <p style={{ fontSize: '1.2rem', color: '#6B7280' }}>A premium interface that feels like your favorite apps.</p>
                </div>

                <div style={{ position: 'relative', width: '100%', overflow: 'hidden', paddingBottom: '4rem' }}>
                    <motion.div 
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ 
                            ease: 'linear', 
                            duration: 25, 
                            repeat: Infinity 
                        }}
                        style={{ display: 'flex', gap: '2rem', width: 'max-content', padding: '0 2rem' }}
                    >
                        {[...PLATFORM_PREVIEW_SHOTS, ...PLATFORM_PREVIEW_SHOTS].map((shot, i) => (
                            <div
                                key={i}
                                style={{
                                    width: '600px',
                                    height: '400px',
                                    background: '#F8FAFC',
                                    borderRadius: '24px',
                                    border: '1px solid #E5E7EB',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.05)'
                                }}
                            >
                                <img
                                    src={shot.img}
                                    alt={shot.name}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                {/* Fallback if image doesn't load */}
                                <div style={{ display: 'none', width: '100%', height: '100%', background: '#F1F5F9', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#94A3B8' }}>
                                    <span style={{ fontSize: '4rem' }}>{shot.fallbackIcon}</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>{shot.name} Preview</span>
                                </div>

                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3rem 2rem 2rem 2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))', textAlign: 'center' }}>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>{shot.name}</h4>
                                    <p style={{ color: '#E2E8F0', fontWeight: 500 }}>{shot.desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* SECTION 6: STUDENT JOURNEY */}
            <section style={{ padding: '8rem 1.5rem', background: '#F8FAFC' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Your Journey from Student to Success</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', position: 'relative' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '32px', width: '2px', background: '#E5E7EB', zIndex: 0 }} />

                        {[
                            { step: 1, title: 'Create Account', desc: 'Sign up for free in seconds.' },
                            { step: 2, title: 'Complete Profile', desc: 'Tell us your skills, college, and goals.' },
                            { step: 3, title: 'Join Communities', desc: 'Find your tribe and start networking.' },
                            { step: 4, title: 'Learn Skills', desc: 'Take courses and upskill rapidly.' },
                            { step: 5, title: 'Earn Money', desc: 'Apply to verified gigs and internships.' },
                            { step: 6, title: 'Build Career', desc: 'Graduate with a massive portfolio and network.' }
                        ].map((item, i) => (
                            <motion.div 
                                key={item.step}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, margin: '-50px' }}
                                transition={{ delay: i * 0.1 }}
                                style={{ display: 'flex', gap: '2rem', position: 'relative', zIndex: 1 }}
                            >
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #0B8F5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#0B8F5A', flexShrink: 0, boxShadow: '0 4px 10px rgba(11,143,90,0.1)' }}>
                                    {item.step}
                                </div>
                                <div style={{ paddingTop: '0.5rem' }}>
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '0.25rem' }}>{item.title}</h4>
                                    <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION 7: FEATURED SECTIONS */}
            <section style={{ padding: '8rem 1.5rem', background: '#FFFFFF' }}>
                <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    
                    {[
                        { title: 'Communities', desc: 'Join groups based on your college, interests, or tech stack. Build connections that matter.', btn: 'Explore Communities', path: '/network', rev: false },
                        { title: 'Premium Events', desc: 'From online webinars to offline hackathons and workations, never miss an opportunity to learn and network.', btn: 'View Events', path: '/events', rev: true },
                        { title: 'Student Marketplace', desc: 'Buy and sell textbooks, notes, and resources directly with peers securely.', btn: 'Visit Marketplace', path: '/marketplace', rev: false }
                    ].map((feat, i) => (
                        <motion.div 
                            key={feat.title}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ 
                                display: 'flex', 
                                flexDirection: feat.rev ? 'row-reverse' : 'row', 
                                gap: '4rem', 
                                alignItems: 'center',
                                background: '#F8FAFC',
                                padding: '3rem',
                                borderRadius: '32px',
                                border: '1px solid #E5E7EB'
                            }}
                            className="mobile-stack-flex"
                        >
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>{feat.title}</h3>
                                <p style={{ fontSize: '1.15rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '2rem' }}>{feat.desc}</p>
                                <button onClick={() => navigate(feat.path)} className="btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.05rem', borderRadius: '12px' }}>
                                    {feat.btn}
                                </button>
                            </div>
                            <div style={{ flex: 1, height: '300px', background: '#FFFFFF', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                                <img
                                    src={FEATURED_IMAGES[feat.title]}
                                    alt={feat.title}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <span style={{ display: 'none', fontSize: '4rem', opacity: 0.5, position: 'absolute' }}>✨</span>
                            </div>
                        </motion.div>
                    ))}
                    
                </div>
            </section>

            {/* SECTION 8: STUDENT STORIES — real approved+featured testimonials only.
                Omitted entirely (no empty-state) when there are zero matching rows. */}
            {testimonials.length > 0 && (
                <section style={{ padding: '8rem 0', background: '#F8FAFC', overflow: 'hidden' }}>
                    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Building Chavee Together</h2>
                        <p style={{ fontSize: '1.15rem', color: '#6B7280', maxWidth: '600px', margin: '0 auto' }}>
                            Real stories from the students helping shape Chavee.
                        </p>
                    </div>

                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden', paddingBottom: '1rem' }}>
                        <motion.div
                            animate={{ x: ['0%', '-50%'] }}
                            transition={{ ease: 'linear', duration: 25, repeat: Infinity }}
                            style={{ display: 'flex', gap: '2rem', width: 'max-content', padding: '0 2rem' }}
                        >
                            {[...testimonials, ...testimonials].map((t, i) => (
                                <div
                                    key={`${t.id}-${i}`}
                                    style={{ width: '380px', flexShrink: 0, background: '#FFFFFF', padding: '2.5rem', borderRadius: '24px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', textAlign: 'center' }}
                                >
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EAFBF3', border: '2px solid #0B8F5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden' }}>
                                        {t.photo ? <img src={t.photo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                                    </div>
                                    <div>
                                        <div style={{ display: 'inline-block', padding: '0.25rem 0.75rem', background: '#111827', color: '#FFFFFF', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem' }}>
                                            {t.name}{t.role ? ` · ${t.role}` : ''}
                                        </div>
                                        {t.rating && (
                                            <div style={{ color: '#F59E0B', marginBottom: '0.5rem' }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                                        )}
                                        <p style={{ color: '#6B7280', fontStyle: 'italic', lineHeight: 1.6 }}>"{t.feedback}"</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                        <p style={{ fontWeight: 600, color: '#0B8F5A' }}>Join today and become one of our founding members.</p>
                    </div>
                </section>
            )}

            {/* SECTION 9: FINAL CTA */}
            <section style={{ padding: '8rem 1.5rem', background: '#0B8F5A', color: '#FFFFFF', textAlign: 'center' }}>
                <div style={{ maxWidth: 800, margin: '0 auto' }}>
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}
                    >
                        Ready to Build Your Future?
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: '1.25rem', opacity: 0.9, marginBottom: '3rem', lineHeight: 1.6 }}
                    >
                        Join India's growing student community. Learn. Earn. Connect. Grow.
                    </motion.p>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}
                    >
                        <Link to="/signup" style={{
                            background: '#FFFFFF', color: '#0B8F5A', padding: '1rem 2.5rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '1.1rem', boxShadow: '0 8px 25px rgba(0,0,0,0.15)', transition: 'all 0.2s', display: 'inline-block'
                        }}>
                            Join Free
                        </Link>
                        <button onClick={handleExplore} style={{
                            background: 'transparent', color: '#FFFFFF', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem', transition: 'all 0.2s', display: 'inline-block'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            Explore Platform
                        </button>
                    </motion.div>
                </div>
            </section>

            <Footer />

            <style>{`
                .mobile-stack-flex {
                    flex-direction: row;
                }
                @media (max-width: 768px) {
                    .mobile-stack-flex {
                        flex-direction: column !important;
                    }
                }
            `}</style>
        </div>
    );
}
