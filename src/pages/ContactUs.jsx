import React, { useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function ContactUs() {
    useEffect(() => {
        const originalTitle = document.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

        document.title = "Contact Chavee | Get in Touch with India's Student Social Platform";
        if (metaDesc) {
            metaDesc.setAttribute('content', "Have a question, feedback, or partnership inquiry? Contact the Chavee team directly. We're based in Tirur, Kerala, and we'd love to hear from you.");
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
        contactDetails: {
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            padding: '1.5rem',
            marginBottom: '2rem',
        },
        faqContainer: {
            marginTop: '1.5rem',
        },
        faqItem: {
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '1rem',
            marginBottom: '1rem',
        },
        faqQuestion: {
            fontSize: '1.02rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '0.4rem',
        },
        faqAnswer: {
            fontSize: '0.92rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            margin: 0,
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

    const FAQs = [
        {
            q: "How quickly will I get a response?",
            a: "We aim to respond to all inquiries within 24-48 hours on business days. Urgent safety-related reports submitted through the in-app reporting tool are typically reviewed faster, as they go directly into our moderation queue."
        },
        {
            q: "I forgot my password. What do I do?",
            a: "Use the \"Forgot Password\" link on the Chavee login page. You'll receive a password reset link via email — if you don't see it within a few minutes, please check your spam folder before contacting support."
        },
        {
            q: "How do I delete my Chavee account?",
            a: "Account deletion options are available in your profile settings. If you're having trouble locating this option, email us and we'll guide you through the process, in accordance with our Privacy Policy."
        },
        {
            q: "Is Chavee free to use?",
            a: "Yes, Chavee's core features — including social networking, gig applications, community access, and mentorship matching — are free for students. Certain premium features may be introduced over time, and any paid offerings will always be clearly labeled with transparent pricing."
        },
        {
            q: "How do I verify my college on Chavee?",
            a: "During signup, you'll be prompted to enter your college details. Verification helps maintain a trusted, student-only community. If your college isn't yet recognized in our system, contact us and we'll work to get it added."
        },
        {
            q: "I found a suspicious or fake gig listing. What should I do?",
            a: "Please use the \"Report\" option available on the gig listing itself, or email us directly with the listing details. All reported gigs are reviewed by our moderation team, and listings requiring admin verification are not made publicly visible until approved."
        },
        {
            q: "Can I use Chavee if I'm not in Kerala?",
            a: "Yes. While Chavee was founded and is currently strongest in Kerala, the platform is open to students across India, and we're actively growing our presence in colleges and universities nationwide."
        },
        {
            q: "Does Chavee have a mobile app?",
            a: "Chavee is accessible through any mobile browser at chavee.in, with a fully responsive experience designed for phones and tablets. A dedicated mobile app is part of our ongoing roadmap — follow our updates for the latest on availability."
        }
    ];

    return (
        <div style={S.wrapper}>
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>📞 Contact Team</p>
                <h1 style={S.title}>Contact Us</h1>
                <p style={S.subtitle}>
                    Have a question, feedback, or partnership inquiry? Get in touch with the Chavee team.
                </p>
            </header>

            {/* Main Content */}
            <main style={S.container}>
                <article style={S.contentCard}>
                    <h2 style={{ ...S.h2, marginTop: 0 }}>We'd Love to Hear From You</h2>
                    <p style={S.p}>
                        Whether you're a student with a question about your account, a college interested in partnering with Chavee, a parent wanting to understand our platform, or a brand exploring collaboration opportunities — we're here and ready to help.
                    </p>
                    <p style={S.p}>
                        Chavee was built by people who genuinely care about getting this right for students, and that same care extends to how we respond when you reach out.
                    </p>

                    <h2 style={S.h2}>Get in Touch</h2>
                    <div style={S.contactDetails}>
                        <p style={{ ...S.p, marginBottom: '1rem' }}>
                            <span style={S.strong}>Email:</span> <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a><br />
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>We aim to respond to all general inquiries within 24-48 hours on business days.</span>
                        </p>
                        <p style={{ ...S.p, marginBottom: '1rem' }}>
                            <span style={S.strong}>Registered Office Address:</span><br />
                            Chavee<br />
                            Adimaparambil House, Ponmundam PO, Ponmundam<br />
                            Tirur, Kerala 676106, India
                        </p>
                        <p style={{ ...S.p, marginBottom: 0 }}>
                            <span style={S.strong}>Business Hours:</span> Monday - Saturday, 10:00 AM - 6:00 PM IST
                        </p>
                    </div>

                    <h2 style={S.h2}>What Can We Help You With?</h2>

                    <h3 style={S.h3}>For Students</h3>
                    <p style={S.p}>
                        If you're a current or prospective Chavee user, reach out to us for:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>
                            <span style={S.strong}>Account issues</span> — trouble signing up, logging in, or verifying your email
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>Profile and privacy questions</span> — how to control what information is visible to other users
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>Reporting a problem</span> — inappropriate content, a suspicious gig listing, or a user violating our Community Guidelines
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>Feature requests</span> — ideas for what you'd like to see next on Chavee (we genuinely read these)
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>Technical bugs</span> — anything not working as expected on the platform or mobile app
                        </li>
                    </ul>
                    <p style={S.p}>
                        For urgent safety concerns (harassment, threats, or content requiring immediate moderation), please use the in-app reporting feature available on posts, messages, and profiles, in addition to emailing us — this ensures your report reaches our moderation queue directly and gets prioritized appropriately.
                    </p>

                    <h3 style={S.h3}>For Colleges and Institutions</h3>
                    <p style={S.p}>
                        If you represent a college, university, or educational institution interested in getting your campus verified on Chavee, setting up official campus communities, or exploring partnership opportunities (such as co-hosted events, mentorship programs, or placement collaboration), we'd love to talk. Email us at <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a> with "Institution Partnership" in the subject line, and our team will get back to you with next steps.
                    </p>

                    <h3 style={S.h3}>For Brands and Businesses</h3>
                    <p style={S.p}>
                        Interested in reaching Chavee's student community for hiring, internships, sponsored gigs, or event partnerships? We work with businesses who genuinely want to invest in student growth — not just post generic job listings. Reach out with "Business Inquiry" in your subject line, and let us know a bit about what you're looking to do.
                    </p>

                    <h3 style={S.h3}>For Mentors and Educators</h3>
                    <p style={S.p}>
                        If you're interested in becoming a mentor on Study Sync, offering language training, or hosting a workshop or webinar through Chavee's Events feature, we'd love to hear from you. Email us with "Mentor/Educator Inquiry" in the subject line, including a short note about your background and what you'd like to offer.
                    </p>

                    <h3 style={S.h3}>For Press and Media</h3>
                    <p style={S.p}>
                        Journalists and media professionals covering EdTech, student platforms, or Kerala's startup ecosystem can reach our team directly for interviews, quotes, or additional information about Chavee. Please include "Press Inquiry" in your subject line, and check our Press Kit page for existing company information, logos, and founder details.
                    </p>

                    <h2 style={S.h2}>Frequently Asked Questions</h2>
                    <div style={S.faqContainer}>
                        {FAQs.map((faq, index) => (
                            <div key={index} style={S.faqItem}>
                                <h4 style={S.faqQuestion}>{faq.q}</h4>
                                <p style={S.faqAnswer}>{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <h2 style={S.h2}>Follow Our Journey</h2>
                    <p style={S.p}>
                        Stay updated with the latest features, campus events, and student success stories by following Chavee on our social channels, linked in the footer of this page, or by checking our Blog for the latest platform news and student stories.
                    </p>

                    <h2 style={S.h2}>A Note From Our Team</h2>
                    <p style={S.p}>
                        Chavee is still a growing platform, built by a small, dedicated team that reads every message that comes through. If something isn't working right, if you have an idea that could make Chavee better for students like you, or if you just want to say hello — we genuinely want to hear it. Every piece of feedback shapes what we build next.
                    </p>
                    <p style={S.p}>
                        Thank you for being part of the Chavee community.
                    </p>

                    <p style={S.italic}>
                        <span style={S.strong}>Chavee</span><br />
                        Adimaparambil House, Ponmundam PO, Ponmundam<br />
                        Tirur, Kerala 676106, India<br />
                        Email: <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a>
                    </p>
                </article>
            </main>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
