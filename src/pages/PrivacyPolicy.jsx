import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function PrivacyPolicy() {
    useEffect(() => {
        const originalTitle = document.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

        document.title = "Privacy Policy | Chavee — India's Student Social Platform";
        if (metaDesc) {
            metaDesc.setAttribute('content', "Read Chavee's Privacy Policy to understand how we collect, use, store, and protect your personal data as a student user of our platform.");
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
        disclaimerBox: {
            background: 'rgba(217, 119, 6, 0.04)',
            border: '1px solid rgba(217, 119, 6, 0.15)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            fontSize: '0.88rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
        },
        disclaimerTitle: {
            fontWeight: 800,
            color: 'var(--accent-gold)',
            marginBottom: '0.35rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
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
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>🔒 Privacy first</p>
                <h1 style={S.title}>Privacy Policy</h1>
                <p style={S.subtitle}>
                    Last updated: July 29, 2026
                </p>
            </header>

            {/* Main Content */}
            <main style={S.container}>
                <article style={S.contentCard}>
                    {/* Disclaimer Box */}
                    <div style={S.disclaimerBox}>
                        <div style={S.disclaimerTitle}>
                            <span>⚠️</span> Important Note
                        </div>
                        <p style={{ margin: 0 }}>
                            This Privacy Policy has been drafted to reflect general best practice and applicable Indian law, including the Information Technology Act, 2000, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and the Digital Personal Data Protection Act, 2023. Before publishing this policy or submitting it as part of a payment gateway application, we recommend a review by a qualified legal professional to confirm it fully reflects your actual data practices and current legal obligations.
                        </p>
                    </div>

                    <h2 style={{ ...S.h2, marginTop: 0 }}>1. Introduction</h2>
                    <p style={S.p}>
                        Chavee ("we," "us," "our," or "the Platform") is operated by Chavee, based at Adimaparambil House, Ponmundam PO, Ponmundam, Tirur, Kerala 676106, India. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit or use chavee.in and any associated mobile applications (collectively, the "Services").
                    </p>
                    <p style={S.p}>
                        By creating an account or otherwise using Chavee, you agree to the terms of this Privacy Policy. If you do not agree with any part of this policy, please do not use our Services.
                    </p>

                    <h2 style={S.h2}>2. Information We Collect</h2>
                    <p style={S.p}>
                        We collect information in the following categories:
                    </p>

                    <h3 style={S.h3}>2.1 Information you provide directly</h3>
                    <ul style={S.ul}>
                        <li style={S.li}><span style={S.strong}>Account information:</span> full name, username, email address, phone number, date of birth</li>
                        <li style={S.li}><span style={S.strong}>Profile information:</span> college, course, year of study, bio, skills, interests, resume/CV, profile photo</li>
                        <li style={S.li}><span style={S.strong}>Content you create:</span> posts, comments, messages, gig listings, job applications, event registrations</li>
                        <li style={S.li}><span style={S.strong}>Payment-related information (when applicable):</span> billing details processed through our third-party payment gateway partners — Chavee does not store your full card or bank details directly</li>
                    </ul>

                    <h3 style={S.h3}>2.2 Information collected automatically</h3>
                    <ul style={S.ul}>
                        <li style={S.li}><span style={S.strong}>Log data:</span> IP address, browser type, device information, pages visited, time spent on the platform</li>
                        <li style={S.li}><span style={S.strong}>Cookies</span> and similar tracking technologies used to keep you logged in and understand platform usage</li>
                        <li style={S.li}><span style={S.strong}>Approximate location data</span> (where permitted by your device settings), used for relevant content such as nearby events or campus-specific listings</li>
                    </ul>

                    <h3 style={S.h3}>2.3 Information from third parties</h3>
                    <ul style={S.ul}>
                        <li style={S.li}>If you sign up using Google OAuth, we receive your name, email address, and profile picture from Google, in accordance with Google's own privacy practices and your consent at the time of sign-in</li>
                    </ul>

                    <h2 style={S.h2}>3. How We Use Your Information</h2>
                    <p style={S.p}>
                        We use the information we collect to:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Create and manage your Chavee account</li>
                        <li style={S.li}>Enable core platform features: posting, messaging, following, applying to gigs and jobs, joining communities, registering for events</li>
                        <li style={S.li}>Personalize your experience, including relevant recommendations for courses, gigs, and peers</li>
                        <li style={S.li}>Communicate with you, including account verification emails, notifications, and important platform updates</li>
                        <li style={S.li}>Maintain platform safety, including content moderation and investigating reported violations</li>
                        <li style={S.li}>Improve our Services through aggregated, anonymized usage analysis</li>
                        <li style={S.li}>Comply with legal obligations and enforce our Terms and Conditions</li>
                    </ul>
                    <p style={S.p}>
                        We do not sell your personal data to third parties for advertising purposes.
                    </p>

                    <h2 style={S.h2}>4. How We Share Your Information</h2>
                    <p style={S.p}>
                        We share your information only in the following circumstances:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>
                            <span style={S.strong}>With other users, as intended by the platform's design:</span> your public profile information, posts, and gig/job listings are visible to other students as part of Chavee's core functionality. You control certain visibility settings within your profile.
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>With service providers:</span> we work with third-party providers for essential functions such as cloud hosting (Supabase), email delivery (for account verification and notifications), and payment processing. These providers are contractually bound to protect your data and use it only for the purposes we specify.
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>For legal reasons:</span> we may disclose information if required by law, court order, or governmental request, or if necessary to protect the rights, safety, or property of Chavee, our users, or the public.
                        </li>
                        <li style={S.li}>
                            <span style={S.strong}>In connection with a business transaction:</span> if Chavee is involved in a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction, subject to standard confidentiality protections.
                        </li>
                    </ul>

                    <h2 style={S.h2}>5. Sensitive Personal Data</h2>
                    <p style={S.p}>
                        Certain information you provide — such as your resume/CV, uploaded documents, and academic details — is treated as sensitive personal data under applicable Indian regulations. We apply additional safeguards to this category of data, including:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Restricted access controls, ensuring only authorized systems and personnel can access sensitive documents</li>
                        <li style={S.li}>Storage using industry-standard encryption both in transit and at rest</li>
                        <li style={S.li}>Access to uploaded CVs and private documents is granted only through secure, time-limited signed links, never through permanently public URLs</li>
                    </ul>

                    <h2 style={S.h2}>6. Data Storage and Security</h2>
                    <p style={S.p}>
                        Your data is stored on secure cloud infrastructure provided by Supabase, with industry-standard security practices including encrypted connections (HTTPS/TLS), role-based access controls, and Row-Level Security policies that restrict data access strictly to authorized users.
                    </p>
                    <p style={S.p}>
                        While we take reasonable and appropriate measures to protect your information, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we are committed to promptly addressing any vulnerabilities identified.
                    </p>

                    <h2 style={S.h2}>7. Your Rights and Choices</h2>
                    <p style={S.p}>
                        As a Chavee user, you have the right to:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}><span style={S.strong}>Access</span> the personal data we hold about you</li>
                        <li style={S.li}><span style={S.strong}>Correct</span> inaccurate or incomplete information through your profile settings</li>
                        <li style={S.li}><span style={S.strong}>Delete</span> your account and associated personal data, subject to certain retention requirements for legal or security purposes</li>
                        <li style={S.li}><span style={S.strong}>Withdraw consent</span> for optional data processing activities, such as marketing communications</li>
                        <li style={S.li}><span style={S.strong}>Object to processing</span> of your data in certain circumstances</li>
                    </ul>
                    <p style={S.p}>
                        To exercise any of these rights, please contact us using the details in Section 12 below. We will respond to verified requests within a reasonable timeframe, in accordance with applicable law.
                    </p>

                    <h2 style={S.h2}>8. Cookies and Tracking Technologies</h2>
                    <p style={S.p}>
                        Chavee uses cookies and similar technologies to:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Keep you securely logged into your account</li>
                        <li style={S.li}>Remember your preferences</li>
                        <li style={S.li}>Understand how users interact with the platform, so we can improve it</li>
                    </ul>
                    <p style={S.p}>
                        You can control cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of the Services.
                    </p>

                    <h2 style={S.h2}>9. Children's Privacy</h2>
                    <p style={S.p}>
                        Chavee is intended for use by college and school students. If you are under the age of 18, you should use Chavee only with the involvement and consent of a parent or guardian, in accordance with applicable law. We do not knowingly collect personal data from children under a legally permitted age without appropriate consent. If we become aware that we have inadvertently collected such data without proper consent, we will take steps to delete it.
                    </p>

                    <h2 style={S.h2}>10. Data Retention</h2>
                    <p style={S.p}>
                        We retain your personal data for as long as your account remains active, and for a reasonable period thereafter to comply with legal obligations, resolve disputes, and enforce our agreements. When data is no longer needed, we take reasonable steps to securely delete or anonymize it.
                    </p>

                    <h2 style={S.h2}>11. International Data Transfers</h2>
                    <p style={S.p}>
                        Our infrastructure providers may process and store data in locations outside India. Where this occurs, we take steps to ensure appropriate safeguards are in place, consistent with applicable data protection law.
                    </p>

                    <h2 style={S.h2}>12. Contact Us</h2>
                    <p style={S.p}>
                        If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us at:
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Chavee</span><br />
                        Adimaparambil House, Ponmundam PO, Ponmundam<br />
                        Tirur, Kerala 676106, India<br />
                        Email: <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a>
                    </p>

                    <h2 style={S.h2}>13. Changes to This Policy</h2>
                    <p style={S.p}>
                        We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify users of material changes through the platform or via email. Continued use of Chavee after such changes constitutes acceptance of the updated policy.
                    </p>

                    <p style={S.italic}>
                        This Privacy Policy works together with our <Link to="/terms-and-conditions" style={S.link}>Terms and Conditions</Link> and <Link to="/refund-and-cancellation" style={S.link}>Refund and Cancellation Policy</Link>. Please review all applicable policies before using Chavee.
                    </p>
                </article>
            </main>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
