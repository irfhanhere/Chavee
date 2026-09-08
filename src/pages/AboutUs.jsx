import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SEO from '../components/SEO.jsx';
import { useLandingStats } from '../hooks/useLandingStats.js';

// Real names/roles/bios — bios match the provided design reference verbatim
// (design-references/Seo/About Us- Web.png), not invented. Social links are
// the real URLs provided directly by the user, not guessed. Photos are the
// real headshots provided directly by the user (design-references/Images/
// akshay.png, irfhan.png), resized/compressed into public/assets/founders/.
const FOUNDERS = [
    {
        name: 'Akshay Ennazhiyil',
        role: 'Co-founder & CEO',
        bio: 'Leads strategy, growth, and business development at Chavee Technologies, with a background in sales, business strategy, and business writing. Focused on building partnerships, driving market growth, and turning ideas into scalable opportunities.',
        initials: 'AE',
        color: 'linear-gradient(135deg, #115E59 0%, #059669 100%)',
        photo: '/assets/founders/akshay.jpg',
        alt: 'Akshay Ennazhiyil, Co-founder & CEO of Chavee',
        links: [
            { label: 'LinkedIn', icon: 'in', url: 'https://www.linkedin.com/in/akshay-ennazhiyil-85213a241/' },
            { label: 'Instagram', icon: '📷', url: 'https://www.instagram.com/mr_akshay.e/' },
        ]
    },
    {
        name: 'Irfhan',
        role: 'Co-founder & CCO',
        bio: 'Freelance brand developer, digital marketer and travel consultant. Building brands, experiences and platforms that make impact.',
        initials: 'IR',
        color: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        photo: '/assets/founders/irfhan.jpg',
        // Includes his real handle (IRFHANHERE — already linked via Instagram/
        // website below) so image search on that name surfaces this photo.
        alt: 'Irfhan (IRFHANHERE), Co-founder & CCO of Chavee',
        links: [
            { label: 'LinkedIn', icon: 'in', url: 'https://www.linkedin.com/in/irfhan-ap/' },
            { label: 'Instagram', icon: '📷', url: 'https://www.instagram.com/IRFHANHERE/' },
            { label: 'Website', icon: '🌐', url: 'https://www.irfhanhere.space/' },
        ]
    }
];

const JOURNEY = [
    { icon: '💡', title: 'The Idea', desc: 'Identified the gap in student support and opportunities.' },
    { icon: '🚀', title: 'First Step', desc: 'Built the foundation with a student-first approach.' },
    { icon: '👥', title: 'Growing Community', desc: 'Students and colleges joined hands to grow together.' },
    { icon: '📈', title: 'Expanding Horizons', desc: 'More opportunities, features and partnerships added.' },
    { icon: '🏆', title: 'The Future', desc: 'Continuously evolving to empower every student.' },
];

const DIFFERENTIATORS = [
    { icon: '👤', title: 'Student First', desc: 'Everything we build is centered around student success and growth.' },
    { icon: '▦', title: 'All in One Place', desc: 'Learn, connect, find opportunities and grow — without switching platforms.' },
    { icon: '🛡️', title: 'Trusted & Verified', desc: 'Curated opportunities, verified partners and quality experiences.' },
    { icon: '❤️', title: 'Community Driven', desc: 'A supportive community that encourages collaboration and learning.' },
];

// Real photo when one exists; falls back to the initials avatar (on
// missing photo, or if the real image fails to load) — same onError
// fallback pattern used elsewhere in the app (marquee, testimonials).
function InitialsAvatar({ initials, gradient, size = 84, photo, alt }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: size * 0.34, flexShrink: 0,
            boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden'
        }}>
            {photo && (
                <img
                    src={photo}
                    alt={alt || initials}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                    onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                    }}
                />
            )}
            <span style={{ display: photo ? 'none' : 'flex' }}>{initials}</span>
        </div>
    );
}

export default function AboutUs() {
    const navigate = useNavigate();
    const stats = useLandingStats();

    const handleExplore = () => {
        sessionStorage.setItem('previewMode', 'true');
        navigate('/dashboard');
    };

    const S = {
        wrapper: { background: 'var(--bg-base)', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
        container: { maxWidth: 1140, margin: '0 auto', padding: '0 1.5rem' },
        card: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, boxShadow: 'var(--shadow-sm)' },
        sectionLabel: { color: 'var(--peacock-green)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' },
        h2: { fontSize: 'clamp(1.5rem, 3vw, 1.9rem)', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 1rem' },
    };

    return (
        <div style={S.wrapper}>
            <SEO
                title="About Chavee | India's First Student-Focused Social Networking Platform"
                description="Discover the story behind Chavee, India's first student-first social platform built in Kerala — connecting college students through mentorship, freelance gigs, language learning, and campus communities."
                path="/about-us"
            />
            <Navbar />

            {/* ── Hero (no real photo exists for this project — honest dark
                 gradient panel instead of the reference's stock/group photo) ── */}
            <header style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #115E59 100%)',
                padding: '4rem 1.5rem 5rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ ...S.container, position: 'relative', zIndex: 1 }}>
                    <p style={{ color: '#6EE7B7', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.75rem' }}>About Chavee</p>
                    <h1 style={{ fontSize: 'clamp(2.2rem, 6vw, 3.4rem)', fontWeight: 900, color: '#fff', margin: '0 0 1rem', lineHeight: 1.1 }}>
                        Let's Grow.<br />Let's Build.<br />Let's <span style={{ color: '#34D399' }}>Belong.</span>
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 480, fontSize: '1rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                        India's first student-focused social networking platform built to learn, connect, discover opportunities and grow together.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/signup" className="btn-primary" style={{ padding: '0.85rem 1.75rem', borderRadius: 12, fontSize: '0.92rem', textDecoration: 'none' }}>Join Chavee Now</Link>
                        <button onClick={handleExplore} style={{ padding: '0.85rem 1.75rem', borderRadius: 12, fontSize: '0.92rem', fontWeight: 700, background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', cursor: 'pointer' }}>Explore Platform</button>
                    </div>

                    {/* Floating feature bubbles */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginTop: '3rem' }}>
                        {[
                            { icon: '🎓', t: 'Learn New Skills', d: 'Courses & resources' },
                            { icon: '💼', t: 'Find Opportunities', d: 'Jobs, events & more' },
                            { icon: '🤝', t: 'Connect & Grow', d: 'Communities & peers' },
                        ].map(b => (
                            <div key={b.t} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{b.icon}</div>
                                <div>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{b.t}</div>
                                    <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.76rem' }}>{b.d}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* ── Stats bar — real live numbers via the same hook Landing.jsx
                 uses (useLandingStats). "College Partners" from the reference
                 is omitted: no real data anywhere backs that concept. ── */}
            <div style={{ ...S.container, marginTop: '-2.5rem', position: 'relative', zIndex: 2 }}>
                <div style={{ ...S.card, padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.5rem', textAlign: 'center' }}>
                    {[
                        { icon: '🧑‍🎓', label: 'Active Students', value: stats.students },
                        { icon: '🏘️', label: 'Communities', value: stats.communities },
                        { icon: '🎪', label: 'Events Hosted', value: stats.events },
                        { icon: '💼', label: 'Opportunities', value: stats.opportunities },
                    ].map(s => (
                        <div key={s.label}>
                            <div style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>{s.value}+</div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Why Chavee Exists + Mission/Vision ── */}
            <section style={{ ...S.container, padding: '4.5rem 1.5rem 3rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', alignItems: 'start' }}>
                    <div>
                        <p style={S.sectionLabel}>Our Purpose</p>
                        <h2 style={S.h2}>Why Chavee Exists</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: '1rem' }}>
                            To empower students with the right tools, opportunities and community to grow, build and belong — all in one place.
                        </p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.75 }}>
                            We bring everything a student needs into one space — learning, communities, jobs, events and upskilling — to make growth simpler, faster and more meaningful. Chavee wasn't built for professionals and simplified for students — every decision was made with a college student's actual daily reality in mind: tight budgets, exam stress, career uncertainty, and a genuine hunger to prove themselves.
                        </p>
                    </div>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ ...S.card, padding: '2rem', background: 'var(--peacock-green)', border: 'none' }}>
                            <div style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>🎯</div>
                            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem' }}>Our Mission</h3>
                            <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                                To empower students with the right tools, opportunities and community to grow, build and belong.
                            </p>
                        </div>
                        <div style={{ ...S.card, padding: '2rem' }}>
                            <div style={{ fontSize: '1.6rem', marginBottom: '0.75rem' }}>👁️</div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Our Vision</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                                To become the most trusted and loved platform where every student's journey from learning to success is seamless and accessible.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Our Journey ── */}
            <section style={{ ...S.container, padding: '2rem 1.5rem 3rem' }}>
                <div style={{ ...S.card, padding: '2.5rem 2rem', background: 'var(--bg-elevated)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                        <p style={S.sectionLabel}>Our Journey</p>
                        <h2 style={S.h2}>From an Idea to a Movement</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
                        {JOURNEY.map(j => (
                            <div key={j.title} style={{ textAlign: 'center' }}>
                                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--peacock-green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', margin: '0 auto 0.85rem' }}>{j.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>{j.title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{j.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── What Makes Chavee Different ── */}
            <section style={{ ...S.container, padding: '0 1.5rem 3rem' }}>
                <div style={{ ...S.card, padding: '2.5rem 2rem', background: '#0F172A', border: 'none' }}>
                    <p style={{ ...S.sectionLabel, textAlign: 'center', color: '#34D399' }}>What Makes Chavee Different</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                        {DIFFERENTIATORS.map(d => (
                            <div key={d.title} style={{ textAlign: 'center' }}>
                                <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid #34D39960', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', margin: '0 auto 0.85rem', color: '#34D399' }}>{d.icon}</div>
                                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', marginBottom: '0.35rem' }}>{d.title}</div>
                                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{d.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Meet Our Founders — no real photos exist anywhere in this
                 project (checked public/, Storage buckets, and profiles for
                 the founders' known emails — none found), so initials avatars
                 are used instead of stock photos. Social links below are the
                 real URLs the user provided directly. ── */}
            <section style={{ ...S.container, padding: '0 1.5rem 4rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={S.sectionLabel}>Meet Our Founders</p>
                    <h2 style={S.h2}>The Minds Behind Chavee</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {FOUNDERS.map(f => (
                        <div key={f.name} style={{ ...S.card, padding: '1.75rem', display: 'flex', gap: '1.25rem', borderBottom: '3px solid var(--peacock-green)' }}>
                            <InitialsAvatar initials={f.initials} gradient={f.color} photo={f.photo} alt={f.alt} />
                            <div>
                                <h3 style={{ margin: '0 0 0.15rem', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{f.name}</h3>
                                <div style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.6rem' }}>{f.role}</div>
                                <p style={{ margin: '0 0 0.85rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{f.bio}</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {f.links.map(l => (
                                        <a
                                            key={l.label}
                                            href={l.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${f.name} on ${l.label}`}
                                            title={l.label}
                                            style={{
                                                width: 30, height: 30, borderRadius: '50%', background: 'var(--peacock-green)',
                                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: l.icon === 'in' ? '0.72rem' : '0.85rem', fontWeight: 800, textDecoration: 'none'
                                            }}
                                        >
                                            {l.icon}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Closing CTA — no real photo exists for this project, so a
                 plain brand-color panel is used instead of the reference's
                 stock/group photo. ── */}
            <section style={{ background: 'linear-gradient(135deg, #115E59 0%, #059669 100%)', padding: '3.5rem 1.5rem' }}>
                <div style={{ ...S.container, textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', fontSize: 'clamp(1.6rem, 4vw, 2.3rem)', fontWeight: 900, margin: '0 0 0.75rem' }}>Ready to Grow, Build & Belong?</h2>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem', maxWidth: 480, margin: '0 auto 1.75rem' }}>
                        Join thousands of students who are already building their future with Chavee.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link to="/signup" style={{ padding: '0.85rem 1.75rem', borderRadius: 12, fontSize: '0.92rem', fontWeight: 800, background: '#fff', color: 'var(--peacock-green)', textDecoration: 'none' }}>Join Now</Link>
                        <button onClick={handleExplore} style={{ padding: '0.85rem 1.75rem', borderRadius: 12, fontSize: '0.92rem', fontWeight: 700, background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', cursor: 'pointer' }}>Explore Platform</button>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.85rem', marginTop: '1.75rem' }}>
                        Want to help us build this? <Link to="/careers" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>See open roles</Link> · Have a question? <Link to="/contact-us" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline' }}>Contact us</Link>
                    </p>
                </div>
            </section>

            <Footer />
        </div>
    );
}
