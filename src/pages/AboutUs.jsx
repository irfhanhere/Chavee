import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function AboutUs() {
    useEffect(() => {
        const originalTitle = document.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

        document.title = "About Chavee | India's First Student-Focused Social Networking Platform";
        if (metaDesc) {
            metaDesc.setAttribute('content', "Discover the story behind Chavee, India's first student-first social platform built in Kerala — connecting college students through mentorship, freelance gigs, language learning, and campus communities.");
        }

        return () => {
            document.title = originalTitle;
            if (metaDesc) {
                metaDesc.setAttribute('content', originalDesc);
            }
        };
    }, []);

    const S = {
        wrapper: {
            background: 'var(--bg-base)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
        },
        hero: {
            background: 'linear-gradient(135deg, rgba(17,94,89,0.03) 0%, rgba(5,150,105,0.01) 100%)',
            borderBottom: '1px solid var(--border-color)',
            padding: '4.5rem 2rem',
            textAlign: 'center',
        },
        container: {
            maxWidth: 800,
            margin: '0 auto',
            padding: '3.5rem 1.5rem',
            width: '100%',
        },
        title: {
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: 900,
            color: 'var(--text-primary)',
            marginBottom: '1rem',
            lineHeight: 1.1,
        },
        subtitle: {
            color: 'var(--text-secondary)',
            maxWidth: 600,
            margin: '0 auto',
            fontSize: '0.98rem',
            lineHeight: 1.6,
        },
        contentCard: {
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 16,
            padding: '2.5rem',
            boxShadow: 'var(--shadow-sm)',
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: 'var(--text-secondary)',
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginTop: '2.5rem',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.5rem',
        },
        h3: {
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginTop: '1.75rem',
            marginBottom: '0.75rem',
        },
        p: {
            marginBottom: '1.25rem',
            textAlign: 'justify',
        },
        ul: {
            paddingLeft: '1.5rem',
            marginBottom: '1.25rem',
            listStyleType: 'disc',
        },
        li: {
            marginBottom: '0.5rem',
        },
        link: {
            color: 'var(--peacock-green)',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'color 0.2s',
        },
        strong: {
            fontWeight: 700,
            color: 'var(--text-primary)',
        },
        italic: {
            fontStyle: 'italic',
            color: 'var(--text-muted)',
            display: 'block',
            marginTop: '2rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
        }
    };

    return (
        <div style={S.wrapper}>
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>🌿 Belong. Learn. Earn.</p>
                <h1 style={S.title}>About Us</h1>
                <p style={S.subtitle}>
                    India's first student-focused social networking platform built in Kerala.
                </p>
            </header>

            {/* Main Content */}
            <main style={S.container}>
                <article style={S.contentCard}>
                    <h2 style={{ ...S.h2, marginTop: 0 }}>Belong. Learn. Earn.</h2>
                    <p style={S.p}>
                        Chavee is India's first student-focused social networking platform — built from the ground up in Kerala for Gen Z college and school students who are tired of choosing between social media that distracts them and professional networks that intimidate them.
                    </p>
                    <p style={S.p}>
                        We believe college is the most formative stretch of a young person's life, and it deserves a digital space built specifically for it — not a repurposed version of platforms designed for adults, brands, or job-seekers with years of experience already behind them. Chavee exists to fill that gap.
                    </p>

                    <h2 style={S.h2}>Our Mission</h2>
                    <p style={S.p}>
                        Chavee was founded with a single, clear mission: to create a constructive and engaging online space for college students across India, starting with Kerala.
                    </p>
                    <p style={S.p}>
                        Traditional social networks often pull students toward comparison, distraction, and passive scrolling. Professional platforms, on the other hand, can feel intimidating and irrelevant to someone who hasn't even started their career yet. Chavee sits deliberately in between — a safe, supportive ecosystem where students can genuinely grow.
                    </p>
                    <p style={S.p}>
                        We do this by bringing together four things that, until now, have lived in separate apps, separate WhatsApp groups, and separate corners of the internet:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>
                            <span style={S.strong}>Learn</span> — peer-to-peer mentorship, structured study groups, and certified language training through Study Sync
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>Earn</span> — a marketplace of gigs, freelance opportunities, scholarships, and job listings built specifically for students taking their first steps into paid work
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>Network</span> — genuine connections with peers across colleges, cities, and even countries, built around shared interests rather than follower counts
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>Events</span> — campus events, workshops, hackathons, and webinars that bring the online community into real, offline experiences
                        </li>
                    </ul>
                    <p style={S.p}>
                        Every feature on Chavee is designed around one question: does this genuinely help a student belong, learn, or earn? If the answer is no, it doesn't make it onto the platform.
                    </p>

                    <h2 style={S.h2}>Our Journey</h2>
                    <p style={S.p}>
                        Chavee was born and designed in Kerala, a state with one of India's highest literacy rates and a long-standing culture of educational ambition. We started small — building custom study circles and peer mentoring systems focused on technology and language courses, testing what students actually needed rather than guessing from a boardroom.
                    </p>
                    <p style={S.p}>
                        What we learned early on shaped everything that came after: students don't just want another app to check. They want a place where they can find a study partner for tomorrow's exam, pick up a freelance design gig that pays for their semester's expenses, practice a new language with a native speaker their own age, and show up to a workshop that actually teaches them something useful — all without leaving one ecosystem.
                    </p>
                    <p style={S.p}>
                        Today, Chavee is growing across universities and colleges in India, one campus at a time. Every new student who joins doesn't just get access to a platform — they become part of a growing network of ambitious peers who are figuring things out together, the same way we were when we started.
                    </p>

                    <h2 style={S.h2}>What Makes Chavee Different</h2>
                    <p style={S.p}>
                        <span style={S.strong}>Built for students, not adapted for them.</span> Chavee wasn't originally built for professionals and then simplified for students. Every decision — from our four core pillars to our gamified XP and badge system — was made with a college student's actual daily reality in mind: tight budgets, exam stress, career uncertainty, and a genuine hunger to prove themselves.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Verified, safe, and moderated.</span> Every college on Chavee goes through a verification process. We take community safety seriously, with active moderation, a reporting system for inappropriate content, and privacy-first design choices that keep sensitive student information — like resumes, contact details, and personal data — protected and never exposed without consent.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Skill monetization from day one.</span> Most students don't get their first real taste of earning money until years into their career. Chavee's Earn marketplace changes that — letting students post gigs, apply for freelance work, and build a genuine portfolio of paid experience while they're still studying.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Peer-to-peer mentorship at scale.</span> Study Sync, our flagship mentorship program, connects students who need help in a subject with peers or seniors who've already mastered it — creating a self-sustaining cycle of knowledge-sharing that doesn't rely on expensive tutoring or formal programs.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Gamification that actually motivates.</span> Every meaningful action on Chavee — completing your profile, helping a peer, finishing a gig, attending an event — earns XP and unlocks badges, from Bronze to Platinum tier. It's a small design choice with a real effect: students stay engaged not because they're addicted to scrolling, but because they're genuinely making progress.
                    </p>

                    <h2 style={S.h2}>Our Founders & Leadership</h2>
                    <p style={S.p}>
                        Chavee was founded and is led by a small, hands-on team based in Kerala, India — <span style={S.strong}>Akshay</span> (Founder) leads the platform's vision, engineering, and overall growth strategy, driving the technical direction that has taken Chavee from an early concept to a live, functioning platform used by real students. <span style={S.strong}>Irfhan</span> (Co-founder) drives operations, community scaling, business development, and campus partnerships — the on-the-ground work of getting Chavee in front of the students who need it, building relationships with colleges, and shaping the ecosystem strategy that connects every feature of the platform together.
                    </p>
                    <p style={S.p}>
                        Both founders share a background rooted in understanding what students actually need — not from market research reports, but from direct, ongoing conversations with the students Chavee serves every day.
                    </p>

                    <h2 style={S.h2}>Why Kerala, Why Now</h2>
                    <p style={S.p}>
                        Kerala has long been recognized for its educational achievements — but access to structured mentorship, real-world skill-building, and early income opportunities for students hasn't kept pace with the state's academic ambition. Chavee was built to close that gap, starting in the region we know best, with plans to expand across Indian campuses as the platform grows.
                    </p>
                    <p style={S.p}>
                        India is home to one of the largest college-going populations in the world, and Gen Z students are more digitally native, more entrepreneurially minded, and more eager to build real skills early than any generation before them. Chavee exists to meet that ambition with the right tools, at the right time.
                    </p>

                    <h2 style={S.h2}>Our Commitment to Students</h2>
                    <p style={S.p}>
                        We know that trust is everything when you're asking students to share their profiles, their work, and their time on a platform. That's why safety, privacy, and genuine usefulness are non-negotiable principles at Chavee — not features we bolt on later, but the foundation everything else is built on.
                    </p>
                    <p style={S.p}>
                        We're not trying to be the next big social network chasing screen time. We're trying to be the platform students actually thank later — the one where they found their first freelance client, their study partner for a make-or-break exam, their mentor for a subject they were about to fail, or the community that made a new city feel a little less lonely.
                    </p>

                    <h2 style={S.h2}>Join the Movement</h2>
                    <p style={S.p}>
                        Chavee is more than a platform — it's a growing community of students who believe college should be about more than just grades. It should be about belonging somewhere, learning constantly, and earning your first real wins — academic, financial, and personal — before you even graduate.
                    </p>
                    <p style={S.p}>
                        If you're a student in Kerala, or anywhere in India, ready to build real skills, real connections, and a real head start on your future, Chavee is built for you.
                    </p>
                    <p style={{ ...S.p, fontWeight: 700, marginTop: '2rem' }}>
                        Ready to get started? <Link to="/signup" style={S.link}>Sign up free at chavee.in</Link> and join thousands of students already building their future on Chavee.
                    </p>

                    <p style={S.italic}>
                        Chavee is developed and operated by Chavee, based in Tirur, Kerala, India.
                    </p>
                </article>
            </main>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
