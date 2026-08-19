import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import SEO from '../components/SEO.jsx';

export default function RefundAndCancellation() {

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
                title="Refund and Cancellation Policy | Chavee"
                description="Learn about Chavee's refund and cancellation policy for paid services, subscriptions, and transactions on our student platform."
                path="/refund-and-cancellation"
            />
            <Navbar />

            {/* Hero */}
            <header style={S.hero}>
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>💸 Refund & Cancellation</p>
                <h1 style={S.title}>Refund and Cancellation Policy</h1>
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
                            This policy is written as a general-purpose framework and should be reviewed and finalized by you (and ideally a legal/compliance professional) to reflect your actual paid features once they launch, since this document will be reviewed as part of your payment gateway application. Update the specific timelines, fees, and paid feature descriptions below to match reality before publishing.
                        </p>
                    </div>

                    <h2 style={{ ...S.h2, marginTop: 0 }}>1. Introduction</h2>
                    <p style={S.p}>
                        This Refund and Cancellation Policy explains the terms under which Chavee ("Chavee," "we," "us," or "our") handles refunds and cancellations for any paid services, features, or transactions available on the Chavee platform (chavee.in and associated applications).
                    </p>
                    <p style={S.p}>
                        By making a payment through Chavee, you agree to the terms outlined in this policy, alongside our Terms and Conditions and Privacy Policy.
                    </p>

                    <h2 style={S.h2}>2. Scope of This Policy</h2>
                    <p style={S.p}>
                        This policy applies to:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Any premium features, subscriptions, or paid tiers offered directly by Chavee</li>
                        <li style={S.li}>Any platform service fees charged by Chavee in connection with facilitating gigs, mentorship sessions, or paid events</li>
                        <li style={S.li}>Payments processed through Chavee's integrated payment gateway partners</li>
                    </ul>
                    <p style={S.p}>
                        This policy does <span style={S.strong}>not</span> directly govern private transactions arranged between users outside of Chavee's payment infrastructure (for example, if two users agree to a gig payment method independent of the platform). In such cases, users are responsible for resolving payment disputes between themselves, though Chavee's reporting and moderation tools remain available to address platform conduct violations.
                    </p>

                    <h2 style={S.h2}>3. General Refund Principles</h2>
                    <p style={S.p}>
                        Chavee aims to be fair and transparent in handling refunds. As a general principle:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Refunds are considered on a case-by-case basis in accordance with the specific terms of the paid feature or service purchased</li>
                        <li style={S.li}>Refund eligibility, where applicable, is typically tied to the timing of the cancellation request relative to service delivery</li>
                        <li style={S.li}>Refunds, where approved, are processed back to the original payment method used, in accordance with the processing timelines of our payment gateway partner</li>
                    </ul>

                    <h2 style={S.h2}>4. Subscription-Based Services</h2>
                    <p style={S.p}>
                        If Chavee offers subscription-based premium features (such as enhanced visibility for gig listings, advanced mentorship access, or premium profile tools):
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Subscriptions may be cancelled at any time through your account settings</li>
                        <li style={S.li}>Cancellation stops future billing cycles but does not automatically entitle you to a refund for the current billing period unless required by applicable law or explicitly stated at the time of purchase</li>
                        <li style={S.li}>If a subscription is cancelled within a short grace period after purchase (for example, within 24-48 hours, where specified at the time of the offer), a full refund may be issued, provided minimal or no use of the premium feature has occurred</li>
                    </ul>

                    <h2 style={S.h2}>5. One-Time Purchases and Service Fees</h2>
                    <p style={S.p}>
                        For one-time payments, such as a platform service fee associated with a specific gig, event registration, or mentorship session:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>If the service has not yet been delivered or the event/session has not yet taken place, a cancellation request made within a reasonable period before the scheduled service may be eligible for a full or partial refund, depending on how close to the service date the cancellation is requested</li>
                        <li style={S.li}>If the service has already been delivered (for example, an event has taken place, or a gig has been marked complete), the payment is generally non-refundable</li>
                        <li style={S.li}>In cases where a service was not delivered due to a fault on Chavee's part (technical failure, platform error, or an event being cancelled by Chavee), users are entitled to a full refund</li>
                    </ul>

                    <h2 style={S.h2}>6. Cancellation of Gigs and Mentorship Sessions</h2>
                    <p style={S.p}>
                        <span style={S.strong}>6.1 Gigs:</span> If a gig arrangement facilitated through Chavee's marketplace involves a platform fee, and either party (poster or applicant) cancels before work has commenced, the platform fee may be refunded in full. If work has already commenced or been partially delivered, refunds will be assessed based on the proportion of work completed, at Chavee's reasonable discretion, taking into account any evidence provided by both parties.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>6.2 Mentorship Sessions:</span> If a scheduled mentorship or Study Sync session involving a fee is cancelled by the student requesting mentorship at least 24 hours in advance, a full refund will typically be issued. Cancellations made with less notice, or no-shows, may not be eligible for a refund, as the mentor's time has already been reserved.
                    </p>

                    <h2 style={S.h2}>7. Event Registrations</h2>
                    <p style={S.p}>
                        For paid events, workshops, or webinars listed on Chavee:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>If you cancel your registration before the event takes place, refund eligibility depends on the specific cancellation window set by the event organizer, which will be clearly stated at the time of registration</li>
                        <li style={S.li}>If an event is cancelled or rescheduled by Chavee or the event organizer, registered users will be offered a full refund or the option to transfer their registration to the rescheduled date</li>
                        <li style={S.li}>No refunds are issued for no-shows at events where a clear cancellation window was provided and not used</li>
                    </ul>

                    <h2 style={S.h2}>8. How to Request a Refund</h2>
                    <p style={S.p}>
                        To request a refund, please contact us at <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a> with the following information:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Your registered email address on Chavee</li>
                        <li style={S.li}>Transaction ID or payment reference number</li>
                        <li style={S.li}>Reason for the refund request</li>
                        <li style={S.li}>Any relevant supporting details (e.g., screenshots, correspondence with the other party in a gig dispute)</li>
                    </ul>
                    <p style={S.p}>
                        We aim to acknowledge refund requests within 3-5 business days and resolve them within 7-14 business days, depending on the complexity of the request and the policies of our payment gateway partner.
                    </p>

                    <h2 style={S.h2}>9. Refund Processing Time</h2>
                    <p style={S.p}>
                        Once a refund is approved, the actual time for the funds to reflect in your account depends on your bank or payment method and our payment gateway provider's processing timelines. Typically, this can take anywhere from 5 to 10 business days, though this may vary.
                    </p>

                    <h2 style={S.h2}>10. Non-Refundable Circumstances</h2>
                    <p style={S.p}>
                        Refunds will generally not be issued in the following circumstances:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>The service, session, or event has already been fully delivered or attended</li>
                        <li style={S.li}>The cancellation request is made after the applicable cancellation window has passed</li>
                        <li style={S.li}>The user has violated Chavee's Terms and Conditions in a manner directly related to the transaction (for example, fraudulent gig postings)</li>
                        <li style={S.li}>The refund request is based on dissatisfaction with subjective outcomes (such as not finding a gig application successful) rather than a failure of the service itself to be delivered</li>
                    </ul>

                    <h2 style={S.h2}>11. Disputes</h2>
                    <p style={S.p}>
                        If you disagree with a refund decision, you may escalate your concern by replying to our initial response with additional context, and our team will conduct a secondary review. We aim to resolve all disputes fairly and in a reasonable timeframe.
                    </p>

                    <h2 style={S.h2}>12. Changes to This Policy</h2>
                    <p style={S.p}>
                        We may update this Refund and Cancellation Policy from time to time, particularly as new paid features are introduced on the platform. Material changes will be communicated through the Platform or via email, and the "Last updated" date at the top of this page will reflect the most recent revision.
                    </p>

                    <h2 style={S.h2}>13. Contact Us</h2>
                    <p style={S.p}>
                        For any questions regarding refunds or cancellations, please contact:
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Chavee</span><br />
                        2nd Floor, West End Tower, T. P. Road, Calicut<br />
                        Kerala - 673004, India<br />
                        Email: <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a>
                    </p>

                    <p style={S.italic}>
                        This Refund and Cancellation Policy works together with our <Link to="/terms-and-conditions" style={S.link}>Terms and Conditions</Link> and <Link to="/privacy-policy" style={S.link}>Privacy Policy</Link>.
                    </p>
                </article>
            </main>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
