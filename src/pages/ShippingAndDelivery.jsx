import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

export default function ShippingAndDelivery() {
    useEffect(() => {
        const originalTitle = document.title;
        const metaDesc = document.querySelector('meta[name="description"]');
        const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';

        document.title = "Shipping and Delivery Policy | Chavee";
        if (metaDesc) {
            metaDesc.setAttribute('content', "Chavee is a fully digital platform. Learn how our digital services, features, and content are delivered to users — no physical shipping involved.");
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
                <p style={{ color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>⚡ Digital Delivery</p>
                <h1 style={S.title}>Shipping and Delivery Policy</h1>
                <p style={S.subtitle}>
                    Last updated: July 29, 2026
                </p>
            </header>

            {/* Main Content */}
            <main style={S.container}>
                <article style={S.contentCard}>
                    <h2 style={{ ...S.h2, marginTop: 0 }}>1. Overview</h2>
                    <p style={S.p}>
                        Chavee ("Chavee," "we," "us," or "our") operates chavee.in as a fully digital, online platform. This Shipping and Delivery Policy explains how our services, features, and any digital content are delivered to users, since Chavee does not involve the shipment of physical goods.
                    </p>
                    <p style={S.p}>
                        This policy is provided as part of our standard business documentation, including for the purposes of payment gateway verification, and to give users clear expectations about how and when they receive access to what they've signed up for or paid for on Chavee.
                    </p>

                    <h2 style={S.h2}>2. Nature of Our Services</h2>
                    <p style={S.p}>
                        Chavee is a student-focused social networking and services platform offering:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Access to social networking features (posts, messaging, communities, following)</li>
                        <li style={S.li}>Access to a gig and job marketplace connecting students with freelance and employment opportunities</li>
                        <li style={S.li}>Access to peer mentorship and language learning resources through Study Sync</li>
                        <li style={S.li}>Access to event listings, registrations, and campus community features</li>
                        <li style={S.li}>Optional premium features or subscriptions, where applicable</li>
                    </ul>
                    <p style={S.p}>
                        None of these services involve the shipment of any physical product. All value delivered through Chavee is digital and accessed directly through our website (chavee.in) or associated mobile applications.
                    </p>

                    <h2 style={S.h2}>3. How Digital Access Is Delivered</h2>
                    <p style={S.p}>
                        <span style={S.strong}>3.1 Account-Based Access:</span> Upon successful registration and email verification, your Chavee account is activated immediately, and you gain access to all free platform features without any additional delivery step or waiting period.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>3.2 Paid Features and Subscriptions:</span> If you purchase a premium feature, subscription, or paid service through Chavee, access is granted digitally and immediately upon successful payment confirmation from our payment gateway partner, unless otherwise stated at the time of purchase. In rare cases where a brief processing delay occurs (for example, due to payment gateway verification), access is typically granted within 24 hours of successful payment.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>3.3 Event Registrations:</span> For paid event registrations, "delivery" refers to your confirmed registration status, which is reflected in your account immediately upon successful payment. Any physical or virtual event access details (such as a venue address or a webinar link) are delivered to your registered email address and/or made visible within your Chavee account ahead of the event date.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>3.4 Gig and Marketplace Transactions:</span> Chavee's gig marketplace facilitates connections between students and opportunity providers. "Delivery" in this context refers to Chavee successfully connecting the applicant with the gig poster (for example, through an automatically created conversation upon application). The actual work, service, or deliverable associated with a gig is arranged and delivered directly between the two users involved, in accordance with the terms they agree upon, and is not shipped or delivered by Chavee itself.
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>3.5 Certificates and Digital Credentials:</span> If Chavee issues any digital certificates, badges, or credentials (for example, upon completion of a Study Sync program or course), these are delivered digitally within your Chavee profile and/or via email, typically within a short period after the qualifying activity is completed and verified.
                    </p>

                    <h2 style={S.h2}>4. No Physical Shipping</h2>
                    <p style={S.p}>
                        Because Chavee does not sell or ship any physical products, there are no shipping charges, shipping timelines, courier partners, or delivery addresses associated with the use of our platform. Any reference to "delivery" throughout our platform, Terms and Conditions, or Refund and Cancellation Policy refers exclusively to digital access, digital content, or the facilitation of a connection between users — never the physical transport of goods.
                    </p>

                    <h2 style={S.h2}>5. Delivery Delays</h2>
                    <p style={S.p}>
                        While digital access is typically instantaneous, delays can occasionally occur due to factors including but not limited to:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Payment gateway processing time</li>
                        <li style={S.li}>Server maintenance or technical issues</li>
                        <li style={S.li}>Email delivery delays (for example, due to email provider rate limits or spam filtering)</li>
                        <li style={S.li}>High traffic volume during peak usage periods</li>
                    </ul>
                    <p style={S.p}>
                        If you experience an unusual delay in receiving access to a paid feature or service after successful payment, please contact our support team using the details in Section 8 below, and we will investigate and resolve the issue promptly.
                    </p>

                    <h2 style={S.h2}>6. Verifying Successful Delivery</h2>
                    <p style={S.p}>
                        You can confirm successful "delivery" of any digital service on Chavee by checking:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Your account dashboard, which reflects your current subscription or feature status</li>
                        <li style={S.li}>Your registered email inbox, where confirmation emails are sent for account verification, event registrations, and payment confirmations</li>
                        <li style={S.li}>The notification bell within your Chavee account, which alerts you to relevant account and platform updates</li>
                    </ul>
                    <p style={S.p}>
                        If you do not see the expected confirmation within a reasonable timeframe after a successful payment, please check your spam or junk email folder before contacting support, as automated emails occasionally get filtered by email providers.
                    </p>

                    <h2 style={S.h2}>7. Failed or Incomplete Delivery</h2>
                    <p style={S.p}>
                        In the rare event that a payment is successfully processed but the corresponding digital access, feature, or confirmation is not delivered to your account due to a technical error on our end, Chavee will take immediate steps to either:
                    </p>
                    <ul style={S.ul}>
                        <li style={S.li}>Manually grant the access or feature you paid for, once the issue is identified and verified, or</li>
                        <li style={S.li}>Issue a full refund in accordance with our <Link to="/refund-and-cancellation" style={S.link}>Refund and Cancellation Policy</Link>, if the access or feature cannot be reasonably delivered</li>
                    </ul>

                    <h2 style={S.h2}>8. Contact Us</h2>
                    <p style={S.p}>
                        If you have questions about how a specific service, feature, or purchase is delivered on Chavee, or if you believe you have not received something you paid for, please contact us at:
                    </p>
                    <p style={S.p}>
                        <span style={S.strong}>Chavee</span><br />
                        Adimaparambil House, Ponmundam PO, Ponmundam<br />
                        Tirur, Kerala 676106, India<br />
                        Email: <a href="mailto:info@chavee.in" style={S.link}>info@chavee.in</a>
                    </p>
                    <p style={S.p}>
                        We aim to respond to all delivery-related inquiries within 2-3 business days.
                    </p>

                    <h2 style={S.h2}>9. Changes to This Policy</h2>
                    <p style={S.p}>
                        We may update this Shipping and Delivery Policy from time to time as our platform and service offerings evolve. Material changes will be communicated through the Platform or via email, and the "Last updated" date at the top of this page will reflect the most recent revision.
                    </p>

                    <p style={S.italic}>
                        This Shipping and Delivery Policy works together with our <Link to="/terms-and-conditions" style={S.link}>Terms and Conditions</Link>, <Link to="/privacy-policy" style={S.link}>Privacy Policy</Link>, and <Link to="/refund-and-cancellation" style={S.link}>Refund and Cancellation Policy</Link>.
                    </p>
                </article>
            </main>

            <div style={{ marginTop: 'auto' }}>
                <Footer />
            </div>
        </div>
    );
}
