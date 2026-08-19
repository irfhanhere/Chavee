import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SEO from '../components/SEO.jsx';

export default function TermsAndConditions() {

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
            <SEO
                title="Terms and Conditions | Chavee — India's Student Social Platform"
                description="Read Chavee's Terms and Conditions covering account use, content guidelines, gigs and payments, intellectual property, and user responsibilities."
                path="/terms-and-conditions"
            />
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>📄 Terms & Guidelines</p>
                <h1 style={S.title}>Terms and Conditions</h1>
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
                            This document has been drafted to reflect general best practice for a student-focused platform operating in India. We recommend a review by a qualified legal professional before publishing, particularly regarding the gig/marketplace transaction terms and liability provisions, given their relevance to your payment gateway application.
                        </p>
                    </div>

                    <h2 style={{ ...S.h2, marginTop: 0 }}>1. Acceptance of Terms</h2>
                    <p style={S.p}>
                        Welcome to Chavee, operated by Chavee ("Chavee," "we," "us," or "our"). These Terms and Conditions ("Terms") govern your access to and use of chavee.in and any associated mobile applications (collectively, the "Platform" or "Services").
                    </p>
                    <p style={S.p}>
                        By creating an account, accessing, or using Chavee, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use the Platform.
                    </p>

                    <h2 style={S.h2}>2. Eligibility</h2>
                    <p style={S.p}>
                        Chavee is designed for college and school students. To use Chavee, you must:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Be a current student, or otherwise eligible to participate in our student-focused community</li>
                        <li style={S.li}>Provide accurate, current, and complete information during registration</li>
                        <li style={S.li}>Be at least the minimum age required under applicable Indian law to enter into a binding agreement, or have the consent and supervision of a parent or legal guardian if you are a minor</li>
                        <li style={S.li}>Not have been previously suspended or removed from Chavee for violating these Terms</li>
                    </ul>
                    <p style={S.p}>
                        We reserve the right to verify eligibility, including college affiliation, at our discretion.
                    </p>

                    <h2 style={S.h2}>3. Account Registration and Security</h2>
                    <p style={S.p}>
                        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Provide accurate registration information, including a valid email address</li>
                        <li style={S.li}>Notify us immediately of any unauthorized use of your account</li>
                        <li style={S.li}>Not share your account credentials with any other person</li>
                        <li style={S.li}>Not create multiple accounts for deceptive or abusive purposes</li>
                    </ul>
                    <p style={S.p}>
                        Chavee reserves the right to suspend or terminate accounts that violate these Terms, provide false information, or engage in behavior that harms the platform or its users.
                    </p>

                    <h2 style={S.h2}>4. Platform Features and Use</h2>
                    <p style={S.p}>
                        Chavee provides students with access to the following core features, each governed by these Terms:
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>4.1 Learn</span> — Access to peer mentorship, study groups, and language courses through Study Sync. Content shared in study communities must be accurate to the best of the contributor's knowledge and must not include plagiarized academic material intended to facilitate cheating.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>4.2 Earn</span> — A marketplace for gigs, freelance work, scholarships, and job listings. Users posting gigs or job opportunities are responsible for the accuracy and legality of their listings. Users applying to opportunities are responsible for the accuracy of their applications, including submitted resumes and portfolios.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>4.3 Network</span> — Tools to connect with peers, follow other students, and engage in direct messaging. Users must interact respectfully and in accordance with our Community Guidelines (Section 7).
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>4.4 Events</span> — Discovery and registration for campus events, workshops, and webinars. Chavee is not responsible for the conduct of third-party event organizers unless the event is directly hosted and organized by Chavee.
                    </p>

                    <h2 style={S.h2}>5. Gigs, Payments, and Transactions</h2>
                    <p style={S.p}>
                        <span style={S.strong}>5.1</span> Chavee's gig marketplace connects students offering skills/services with students or organizations seeking them. Chavee acts as a facilitator of these connections and is not a party to the agreements formed between users through gig applications.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>5.2</span> Users engaging in paid gigs or transactions through Chavee are responsible for agreeing on terms, deliverables, and payment directly with their counterparty, unless Chavee explicitly facilitates payment through an integrated payment gateway, in which case the applicable Refund and Cancellation Policy governs that transaction.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>5.3</span> Chavee reserves the right to verify gig listings before they are made publicly visible, and may reject or remove listings that violate these Terms or applicable law.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>5.4</span> Users are solely responsible for any tax obligations arising from income earned through gigs facilitated on Chavee.
                    </p>

                    <h2 style={S.h2}>6. User Content</h2>
                    <p style={S.p}>
                        <span style={S.strong}>6.1</span> You retain ownership of the content you post on Chavee, including posts, comments, gig listings, and profile information ("User Content").
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>6.2</span> By posting User Content, you grant Chavee a non-exclusive, royalty-free, worldwide license to host, display, and distribute that content as necessary to operate the Platform.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>6.3</span> You represent that you have the right to post any User Content you share, and that it does not infringe on the intellectual property, privacy, or other rights of any third party.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>6.4</span> Chavee reserves the right to remove any User Content that violates these Terms, our Community Guidelines, or applicable law, without prior notice.
                    </p>

                    <h2 style={S.h2}>7. Community Guidelines and Prohibited Conduct</h2>
                    <p style={S.p}>
                        To maintain a safe and constructive environment, users agree not to:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Post content that is defamatory, harassing, hateful, sexually explicit, or otherwise harmful</li>
                        <li style={S.li}>Impersonate any person or entity, or misrepresent your affiliation with any college or institution</li>
                        <li style={S.li}>Engage in spamming, phishing, or fraudulent activity, including fake gig listings or job postings</li>
                        <li style={S.li}>Attempt to gain unauthorized access to other users' accounts or Chavee's systems</li>
                        <li style={S.li}>Use automated tools (bots, scrapers) to access or interact with the Platform without our prior written consent</li>
                        <li style={S.li}>Upload malicious code or attempt to disrupt the normal operation of the Platform</li>
                        <li style={S.li}>Use Chavee to facilitate academic dishonesty, including plagiarism or exam misconduct</li>
                    </ul>
                    <p style={S.p}>
                        Violations of these guidelines may result in content removal, account suspension, or permanent termination, at Chavee's sole discretion.
                    </p>

                    <h2 style={S.h2}>8. Reporting and Moderation</h2>
                    <p style={S.p}>
                        Chavee provides tools for users to report content, messages, or gigs that violate these Terms. Our moderation team reviews reports and takes appropriate action, which may include content removal, warnings, or account suspension. We aim to review reports promptly, though response times may vary based on volume and complexity.
                    </p>

                    <h2 style={S.h2}>9. Intellectual Property</h2>
                    <p style={S.p}>
                        The Chavee name, logo, platform design, and underlying technology are the property of Chavee and are protected by applicable intellectual property laws. You may not use our trademarks, branding, or platform design without prior written permission.
                    </p>

                    <h2 style={S.h2}>10. Third-Party Links and Services</h2>
                    <p style={S.p}>
                        Chavee may contain links to third-party websites or integrate with third-party services (such as payment gateways or Google OAuth). We are not responsible for the content, privacy practices, or terms of these third-party services. Your use of any third-party service is governed by that service's own terms.
                    </p>

                    <h2 style={S.h2}>11. Disclaimers</h2>
                    <p style={S.p}>
                        Chavee is provided on an "as is" and "as available" basis. While we strive to maintain a reliable and secure platform, we do not guarantee that the Services will be uninterrupted, error-free, or completely secure. We do not guarantee the outcome of any gig, job application, mentorship interaction, or event facilitated through the Platform.
                    </p>

                    <h2 style={S.h2}>12. Limitation of Liability</h2>
                    <p style={S.p}>
                        To the maximum extent permitted by applicable law, Chavee shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to disputes between users arising from gigs, transactions, or interactions facilitated through Chavee.
                    </p>

                    <h2 style={S.h2}>13. Account Termination</h2>
                    <p style={S.p}>
                        You may deactivate or delete your account at any time through your account settings. Chavee reserves the right to suspend or terminate your account, with or without notice, if we determine, in our sole discretion, that you have violated these Terms.
                    </p>

                    <h2 style={S.h2}>14. Governing Law and Jurisdiction</h2>
                    <p style={S.p}>
                        These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising from these Terms or your use of Chavee shall be subject to the exclusive jurisdiction of the courts located in Kerala, India.
                    </p>

                    <h2 style={S.h2}>15. Changes to These Terms</h2>
                    <p style={S.p}>
                        We may update these Terms from time to time. Material changes will be communicated through the Platform or via email. Your continued use of Chavee after such changes constitutes acceptance of the revised Terms.
                    </p>

                    <h2 style={S.h2}>16. Contact Us</h2>
                    <p style={S.p}>
                        For questions about these Terms, please contact:
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Chavee</span><br />
                        2nd Floor, West End Tower, T. P. Road, Calicut<br />
                        Kerala - 673004, India<br />
                        Email: <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a>
                    </p>

                    <p style={S.italic}>
                        These Terms and Conditions work together with our <Link to="/privacy-policy" style={S.link}>Privacy Policy</Link> and <Link to="/refund-and-cancellation" style={S.link}>Refund and Cancellation Policy</Link>.
                    </p>
                </article>
            </main>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
