import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * MobileLanding — single-column, mobile-native rendering of the SAME 9
 * sections as Landing.jsx (desktop), reflowed with mobile-appropriate
 * spacing and type scale. Rendered at the same "/" route as Landing.jsx —
 * see the useIsMobile() branch there — using the exact same `stats` data
 * (useLandingStats, no separate fetch) and the exact same auth CTAs
 * (/signup, /login, handleExplore) as desktop. Not a subset: every section
 * desktop has, this has.
 *
 * Visual language (card treatment, stat-tile styling, spacing rhythm) is
 * inspired by the mobile design references, but every number here comes
 * from live `stats`, never a placeholder.
 */

const STAT_LABELS = {
    students: 'Verified Students',
    communities: 'Communities',
    events: 'Live Events',
    opportunities: 'Opportunities',
    courses: 'Courses',
    scholarships: 'Scholarships',
    blogs: 'Blogs',
};

const PROBLEMS = [
    { icon: '💼', title: 'Finding internships is broken.' },
    { icon: '👥', title: 'Finding the right people is hard.' },
    { icon: '🚀', title: 'Learning practical skills takes time.' },
    { icon: '🔍', title: 'Discovering opportunities is noisy.' },
];

const PILLARS = [
    { title: 'Learn', icon: '📚', color: '#3B82F6', desc: 'Master new skills with practical courses and peer-to-peer study sessions.', link: '/learn' },
    { title: 'Earn', icon: '💸', color: '#10B981', desc: 'Discover high-paying verified gigs, internships, and freelance opportunities.', link: '/earn' },
    { title: 'Network', icon: '🤝', color: '#8B5CF6', desc: 'Connect with ambitious peers, join active communities, and find mentors.', link: '/network' },
    { title: 'Events', icon: '🎪', color: '#F59E0B', desc: 'Attend premium campus events, workshops, hackathons, and workations.', link: '/events' },
];

// Real platform-preview screenshots — same source files/paths as Landing.jsx
// (public/assets/platform-preview/), resized for their actual small marquee
// card size (max 230x160 on mobile).
const PREVIEW_SHOTS = [
    { name: 'Dashboard', desc: 'Your personalized hub.', img: '/assets/platform-preview/dashboard.jpg', fallbackIcon: '📊' },
    { name: 'Communities', desc: 'Vibrant student groups.', img: '/assets/platform-preview/communities.webp', fallbackIcon: '👥' },
    { name: 'Opportunities', desc: 'Gigs and internships.', img: '/assets/platform-preview/opportunities.jpg', fallbackIcon: '💼' },
    { name: 'Events', desc: 'Campus happenings.', img: '/assets/platform-preview/events.jpg', fallbackIcon: '🎪' },
    { name: 'Networking', desc: 'Find mentors and peers.', img: '/assets/platform-preview/networking.jpg', fallbackIcon: '🤝' },
];
// Duplicated set for a seamless infinite loop — same technique as desktop.
const PREVIEW_LOOP = [...PREVIEW_SHOTS, ...PREVIEW_SHOTS];

const JOURNEY = [
    { step: 1, title: 'Create Account', desc: 'Sign up for free in seconds.' },
    { step: 2, title: 'Complete Profile', desc: 'Tell us your skills, college, and goals.' },
    { step: 3, title: 'Join Communities', desc: 'Find your tribe and start networking.' },
    { step: 4, title: 'Learn Skills', desc: 'Take courses and upskill rapidly.' },
    { step: 5, title: 'Earn Money', desc: 'Apply to verified gigs and internships.' },
    { step: 6, title: 'Build Career', desc: 'Graduate with a massive portfolio and network.' },
];

const FEATURED = [
    { title: 'Communities', desc: 'Join groups based on your college, interests, or tech stack. Build connections that matter.', btn: 'Explore Communities', path: '/network', icon: '👥', img: '/assets/featured/communities.jpg' },
    { title: 'Premium Events', desc: 'From online webinars to offline hackathons and workations, never miss an opportunity to learn and network.', btn: 'View Events', path: '/events', icon: '🎪', img: '/assets/featured/premium-events.jpg' },
    { title: 'Student Marketplace', desc: 'Buy and sell textbooks, notes, and resources directly with peers securely.', btn: 'Visit Marketplace', path: '/marketplace', icon: '📚', img: '/assets/featured/student-marketplace.jpg' },
];

const sectionStyle = (bg) => ({ padding: '3.5rem 1.25rem', background: bg });
const h2Style = { fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.2, margin: '0 0 0.6rem 0' };

export default function MobileLanding({ stats, handleExplore, testimonials = [] }) {
    const navigate = useNavigate();
    const activeStats = Object.entries(stats).filter(([, v]) => v > 0);

    return (
        <div style={{ background: '#F8FAFC', minHeight: '100vh', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

            {/* SECTION 1: HERO */}
            <section style={{ padding: '3rem 1.25rem 2.5rem', textAlign: 'center' }}>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ fontSize: '2.1rem', fontWeight: 900, color: '#111827', lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 1rem 0' }}
                >
                    Everything a Student Needs.<br />
                    <span style={{ color: '#0B8F5A' }}>One Platform.</span>
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.08 }}
                    style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.55, margin: '0 auto 1.75rem', maxWidth: '340px' }}
                >
                    Learn new skills. Earn while studying. Build meaningful connections. Attend events. Grow your future with India's first student social platform.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.16 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '360px', margin: '0 auto' }}
                >
                    <Link to="/signup" style={{ background: '#0B8F5A', color: '#fff', padding: '0.95rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 20px rgba(11,143,90,0.25)' }}>
                        Join Chavee Free
                    </Link>
                    <button onClick={handleExplore} style={{ background: '#FFFFFF', color: '#111827', border: '1px solid #E5E7EB', padding: '0.95rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>
                        Explore Platform
                    </button>
                </motion.div>
            </section>

            {/* SECTION 2: TRUST / STATS */}
            <section style={{ ...sectionStyle('#FFFFFF'), paddingTop: '2.5rem', paddingBottom: '2.5rem', borderTop: '1px solid #E5E7EB', borderBottom: '1px solid #E5E7EB' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', margin: '0 0 1.25rem 0' }}>
                    Trusted by early students across India
                </p>
                {activeStats.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        {activeStats.map(([key, value]) => (
                            <div key={key} style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '1rem 0.5rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#111827' }}>{value}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>{STAT_LABELS[key]}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>An Early-Stage Platform</div>
                        <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 600 }}>Growing every day.</div>
                    </div>
                )}
            </section>

            {/* SECTION 3: STUDENT PROBLEMS + WHY CHAVEE EXISTS */}
            <section style={{ ...sectionStyle('#111827'), color: '#FFFFFF' }}>
                <h2 style={h2Style}>Being a student today is harder than ever.</h2>
                <div style={{ display: 'grid', gap: '0.75rem', margin: '1.5rem 0' }}>
                    {PROBLEMS.map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ fontSize: '1.25rem' }}>{p.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.title}</span>
                        </div>
                    ))}
                </div>
                <div style={{ background: '#0B8F5A', padding: '1.75rem', borderRadius: '20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '160px', height: '160px', background: '#10B981', filter: 'blur(60px)', opacity: 0.5, borderRadius: '50%' }} />
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 0.85rem 0', position: 'relative' }}>Why Chavee Exists</h3>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.6, opacity: 0.9, position: 'relative', margin: 0 }}>
                        We realized that students spend too much time jumping between LinkedIn, WhatsApp groups, fragmented job portals, and generic course platforms.
                        <br /><br />
                        Chavee brings everything a student needs into a single, cohesive, premium experience. Less noise, more growth.
                    </p>
                </div>
            </section>

            {/* SECTION 4: FOUR PILLARS */}
            <section style={sectionStyle('#F8FAFC')}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                    <h2 style={h2Style}>Four Pillars.<br />Unlimited Possibilities.</h2>
                    <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>Everything is designed to help you launch your career.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    {PILLARS.map((pillar, i) => (
                        <motion.div
                            key={pillar.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ delay: i * 0.06 }}
                            onClick={() => navigate(pillar.link)}
                            style={{ background: '#FFFFFF', padding: '1.1rem 0.9rem', borderRadius: '18px', border: '1px solid #E5E7EB', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '0.6rem', cursor: 'pointer' }}
                        >
                            <div style={{ width: 40, height: 40, borderRadius: '12px', background: `${pillar.color}15`, color: pillar.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                {pillar.icon}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: '0 0 0.3rem 0' }}>{pillar.title}</h3>
                                <p style={{ color: '#6B7280', lineHeight: 1.4, fontSize: '0.78rem', margin: 0 }}>{pillar.desc}</p>
                            </div>
                            <div style={{ marginTop: 'auto', paddingTop: '0.4rem', fontWeight: 700, color: '#0B8F5A', fontSize: '0.78rem' }}>
                                Explore {pillar.title} →
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* SECTION 5: PLATFORM PREVIEW — auto-scrolling marquee, mobile-sized cards */}
            <section style={{ padding: '3.5rem 0', background: '#FFFFFF', overflow: 'hidden' }}>
                <div style={{ padding: '0 1.25rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                    <h2 style={h2Style}>Beautifully Designed.<br />Powerfully Built.</h2>
                    <p style={{ fontSize: '0.9rem', color: '#6B7280', margin: 0 }}>A premium interface that feels like your favorite apps.</p>
                </div>

                <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                    <motion.div
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ ease: 'linear', duration: 25, repeat: Infinity }}
                        style={{ display: 'flex', gap: '1rem', width: 'max-content', padding: '0 1.25rem' }}
                    >
                        {PREVIEW_LOOP.map((shot, i) => (
                            <div key={i} style={{ width: '230px', height: '160px', background: '#F1F5F9', borderRadius: '18px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', position: 'relative', overflow: 'hidden' }}>
                                <img
                                    src={shot.img}
                                    alt={shot.name}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <span style={{ display: 'none', fontSize: '2.2rem', position: 'relative' }}>{shot.fallbackIcon}</span>
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem 1rem 1rem', background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))', textAlign: 'center' }}>
                                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>{shot.name}</h4>
                                    <p style={{ color: '#E2E8F0', fontWeight: 500, fontSize: '0.7rem', margin: 0 }}>{shot.desc}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* SECTION 6: STUDENT JOURNEY */}
            <section style={sectionStyle('#F8FAFC')}>
                <h2 style={{ ...h2Style, textAlign: 'center', marginBottom: '1.75rem' }}>Your Journey from Student to Success</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '21px', width: '2px', background: '#E5E7EB', zIndex: 0 }} />
                    {JOURNEY.map((item, i) => (
                        <motion.div
                            key={item.step}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ delay: i * 0.06 }}
                            style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}
                        >
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#FFFFFF', border: '2px solid #0B8F5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 900, color: '#0B8F5A', flexShrink: 0 }}>
                                {item.step}
                            </div>
                            <div style={{ paddingTop: '0.15rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', margin: '0 0 0.2rem 0' }}>{item.title}</h4>
                                <p style={{ color: '#6B7280', fontSize: '0.85rem', margin: 0 }}>{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* SECTION 7: FEATURED SECTIONS */}
            <section style={sectionStyle('#FFFFFF')}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {FEATURED.map((feat, i) => (
                        <motion.div
                            key={feat.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '20px', border: '1px solid #E5E7EB' }}
                        >
                            <div style={{ width: '100%', height: '150px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.1rem', overflow: 'hidden', position: 'relative' }}>
                                <img
                                    src={feat.img}
                                    alt={feat.title}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <span style={{ display: 'none', fontSize: '2.2rem', position: 'absolute' }}>{feat.icon}</span>
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', margin: '0 0 0.5rem 0' }}>{feat.title}</h3>
                            <p style={{ fontSize: '0.88rem', color: '#6B7280', lineHeight: 1.5, margin: '0 0 1rem 0' }}>{feat.desc}</p>
                            <button onClick={() => navigate(feat.path)} className="btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.9rem', borderRadius: '12px' }}>
                                {feat.btn}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* SECTION 8: STUDENT STORIES — real approved+featured testimonials only.
                Omitted entirely (no empty-state) when there are zero matching rows. */}
            {testimonials.length > 0 && (
                <section style={{ padding: '3.5rem 0', background: '#F8FAFC', overflow: 'hidden' }}>
                    <div style={{ padding: '0 1.25rem', textAlign: 'center', marginBottom: '1.75rem' }}>
                        <h2 style={h2Style}>Building Chavee Together</h2>
                        <p style={{ fontSize: '0.88rem', color: '#6B7280', margin: 0 }}>
                            Real stories from the students helping shape Chavee.
                        </p>
                    </div>

                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                        <motion.div
                            animate={{ x: ['0%', '-50%'] }}
                            transition={{ ease: 'linear', duration: 25, repeat: Infinity }}
                            style={{ display: 'flex', gap: '1rem', width: 'max-content', padding: '0 1.25rem' }}
                        >
                            {[...testimonials, ...testimonials].map((t, i) => (
                                <div
                                    key={`${t.id}-${i}`}
                                    style={{ width: '250px', flexShrink: 0, background: '#FFFFFF', padding: '1.5rem', borderRadius: '18px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'center', textAlign: 'center' }}
                                >
                                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EAFBF3', border: '2px solid #0B8F5A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', overflow: 'hidden' }}>
                                        {t.photo ? <img src={t.photo} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                                    </div>
                                    <div style={{ display: 'inline-block', padding: '0.25rem 0.7rem', background: '#111827', color: '#FFFFFF', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700 }}>
                                        {t.name}{t.role ? ` · ${t.role}` : ''}
                                    </div>
                                    {t.rating && (
                                        <div style={{ color: '#F59E0B', fontSize: '0.8rem' }}>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</div>
                                    )}
                                    <p style={{ color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5, fontSize: '0.85rem', margin: 0 }}>"{t.feedback}"</p>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    <p style={{ textAlign: 'center', fontWeight: 600, color: '#0B8F5A', fontSize: '0.88rem', marginTop: '1.5rem' }}>
                        Join today and become one of our founding members.
                    </p>
                </section>
            )}

            {/* SECTION 9: FINAL CTA */}
            <section style={{ ...sectionStyle('#0B8F5A'), color: '#FFFFFF', textAlign: 'center' }}>
                <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ fontSize: '1.85rem', fontWeight: 900, margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}
                >
                    Ready to Build Your Future?
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.08 }}
                    style={{ fontSize: '0.95rem', opacity: 0.9, margin: '0 0 1.75rem 0', lineHeight: 1.5 }}
                >
                    Join India's growing student community. Learn. Earn. Connect. Grow.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.16 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '340px', margin: '0 auto' }}
                >
                    <Link to="/signup" style={{ background: '#FFFFFF', color: '#0B8F5A', padding: '0.95rem', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '1rem' }}>
                        Join Free
                    </Link>
                    <button onClick={handleExplore} style={{ background: 'transparent', color: '#FFFFFF', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)', padding: '0.9rem', borderRadius: '12px', fontWeight: 800, fontSize: '1rem' }}>
                        Explore Platform
                    </button>
                </motion.div>
            </section>
        </div>
    );
}
