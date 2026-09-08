import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { PageLoader } from './components/Spinner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';

// ── Public pages — eager, plain imports ──────────────────────────────
// These are what a first-time visitor / search crawler / link-preview
// bot actually lands on, so they ship in the main bundle with zero
// chunk-fetch delay. Everything below this block (the authenticated app
// and the admin panel) is lazy — a public visitor never downloads it.
import Landing    from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import SignUp from './pages/SignUp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import ReportRedirect from './pages/ReportRedirect.jsx';
import Blog       from './pages/Blog.jsx';
import Careers    from './pages/Careers.jsx';
import CareerJobDetail from './pages/CareerJobDetail.jsx';
import PressKit   from './pages/PressKit.jsx';
import AboutUs    from './pages/AboutUs.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import CookiePolicy from './pages/CookiePolicy.jsx';
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import RefundAndCancellation from './pages/RefundAndCancellation.jsx';
import ShippingAndDelivery from './pages/ShippingAndDelivery.jsx';
import ContactUs from './pages/ContactUs.jsx';
import FAQ from './pages/FAQ.jsx';
import CommunityGuidelines from './pages/CommunityGuidelines.jsx';
import StudentPerks from './pages/StudentPerks.jsx';
import ComingSoon from './components/ComingSoon.jsx';

// ── Authenticated app (AppShell-gated) — lazy ────────────────────────
const AppShell   = lazy(() => import('./components/AppShell.jsx'));
const Dashboard  = lazy(() => import('./pages/Dashboard.jsx'));
const Profile    = lazy(() => import('./pages/Profile.jsx'));
const SettingsLayout = lazy(() => import('./pages/settings/SettingsLayout.jsx'));
const SavedItems = lazy(() => import('./pages/SavedItems.jsx'));
const Earnings = lazy(() => import('./pages/Earnings.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const HelpSupport = lazy(() => import('./pages/HelpSupport.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const Events     = lazy(() => import('./pages/Events.jsx'));
const EventDetail = lazy(() => import('./pages/EventDetail.jsx'));
const Learn      = lazy(() => import('./pages/Learn.jsx'));
const CourseDetail = lazy(() => import('./pages/CourseDetail.jsx'));
const Earn       = lazy(() => import('./pages/Earn.jsx'));
const Network    = lazy(() => import('./pages/Network.jsx'));
const Messages   = lazy(() => import('./pages/Messages.jsx'));
const Onboarding = lazy(() => import('./pages/Onboarding.jsx'));

// ── Admin panel — lazy ────────────────────────────────────────────────
const AdminShell          = lazy(() => import('./pages/admin/AdminShell.jsx'));
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const CommunitiesManager  = lazy(() => import('./pages/admin/sections/CommunitiesManager.jsx'));
const CreateCommunityWizard = lazy(() => import('./pages/admin/sections/CreateCommunityWizard.jsx'));
const CreateEventWizard = lazy(() => import('./pages/admin/sections/CreateEventWizard.jsx'));
const PostsManager        = lazy(() => import('./pages/admin/sections/PostsManager.jsx'));
const CoursesManager      = lazy(() => import('./pages/admin/sections/CoursesManager.jsx'));
const ScholarshipsManager = lazy(() => import('./pages/admin/sections/ScholarshipsManager.jsx'));
const JobsManager         = lazy(() => import('./pages/admin/sections/JobsManager.jsx'));
const CompaniesManager    = lazy(() => import('./pages/admin/sections/CompaniesManager.jsx'));
const TestimonialsManager = lazy(() => import('./pages/admin/sections/TestimonialsManager.jsx'));
const SupportTicketsManager = lazy(() => import('./pages/admin/sections/SupportTicketsManager.jsx'));
const EventsManager       = lazy(() => import('./pages/admin/sections/EventsManager.jsx'));
const UsersManager        = lazy(() => import('./pages/admin/sections/UsersManager.jsx'));
const GigsManager         = lazy(() => import('./pages/admin/sections/GigsManager.jsx'));
const GigModerationQueue  = lazy(() => import('./pages/admin/sections/GigModerationQueue.jsx'));
const WithdrawalQueue     = lazy(() => import('./pages/admin/sections/WithdrawalQueue.jsx'));
const ContractsOverview   = lazy(() => import('./pages/admin/sections/ContractsOverview.jsx'));
const DisputeQueue        = lazy(() => import('./pages/admin/sections/DisputeQueue.jsx'));
const ContentManager      = lazy(() => import('./pages/admin/sections/ContentManager.jsx'));
const ReportsManager      = lazy(() => import('./pages/admin/sections/ReportsManager.jsx'));
const SubscribersManager  = lazy(() => import('./pages/admin/sections/SubscribersManager.jsx'));
const EducationManager    = lazy(() => import('./pages/admin/sections/EducationManager.jsx'));
const CertificationsManager = lazy(() => import('./pages/admin/sections/CertificationsManager.jsx'));
const ResourcesManager    = lazy(() => import('./pages/admin/sections/ResourcesManager.jsx'));
/** Scroll-to-top on every route change */
function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
    return null;
}
/** Redirect for /messages/:id to /messages?id=:id */
function MessagesRedirect() {
    const { id } = useParams();
    return <Navigate to={`/messages?id=${id}`} replace />;
}

/** Simple 404 page */
function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#FFFFFF',
            fontFamily: "'Inter', sans-serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111827',
            gap: '1.5rem',
            textAlign: 'center',
            padding: '2rem',
        }}>
            <div style={{ fontSize: '5rem', marginBottom: '-0.5rem' }}>🌱</div>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>404</h1>
            <p style={{ color: '#6B7280', margin: 0, fontSize: '1.15rem', maxWidth: '400px', lineHeight: 1.6 }}>
                Oops! The page you're looking for doesn't exist or has been moved.
            </p>
            <a href="/" style={{
                marginTop: '1rem',
                padding: '1rem 2rem',
                borderRadius: '12px',
                background: 'var(--peacock-green)',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '1.05rem',
                boxShadow: '0 8px 20px rgba(17, 94, 89,0.2)',
                transition: 'all 0.2s',
            }}
            onMouseOver={e => e.target.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.target.style.transform = 'translateY(0)'}
            >
                Back to Home →
            </a>
        </div>
    );
}

/**
 * Authenticated app page: one guard, one shell, one error boundary.
 * `allowPreview` lets a logged-out visitor with sessionStorage.previewMode
 * see AppShell's restricted preview UI instead of being sent to /login.
 */
const shell = (el) => (
    <RequireAuth allowPreview>
        <AppShell><ErrorBoundary>{el}</ErrorBoundary></AppShell>
    </RequireAuth>
);

/** Admin page: RequireAuth + is_admin() check, then the admin shell. */
const adminShell = (el) => (
    <RequireAdmin>
        <AdminShell>{el}</AdminShell>
    </RequireAdmin>
);

/** Privacy / Terms / Refund placeholder */
function PlaceholderPage({ title }) {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '1rem' }}>
            <h1 style={{ color: 'var(--text-primary)' }}>{title}</h1>
            <p>This page is being drafted by the Chavee legal team. Check back soon.</p>
            <a href="/" style={{ color: 'var(--peacock-green)' }}>← Home</a>
        </div>
    );
}

export default function App() {
    return (
        <>
            <ScrollToTop />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader message="Loading..." />}>
            <Routes>
                {/* ── Public routes (own layouts) ── */}
                <Route path="/"        element={<Landing />} />
                <Route path="/login"   element={<Login />} />
                <Route path="/signup"  element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                
                {/* ── Coming Soon features ── */}
                <Route path="/resources" element={
                    <ComingSoon 
                        title="Resources Coming Soon" 
                        description="Study materials, PDFs, previous year papers and more will be available soon." 
                        illustration="📚" 
                        featureKey="resources" 
                    />
                } />
                <Route path="/blog"    element={<Blog />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/careers/:id" element={<CareerJobDetail />} />
                <Route path="/press"   element={<PressKit />} />
                <Route path="/about-us"  element={<AboutUs />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
                <Route path="/refund-and-cancellation" element={<RefundAndCancellation />} />
                <Route path="/shipping-and-delivery" element={<ShippingAndDelivery />} />
                <Route path="/contact-us" element={<ContactUs />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/guidelines" element={<CommunityGuidelines />} />
                <Route path="/perks" element={<StudentPerks />} />
                <Route path="/report" element={<ReportRedirect />} />


                {/* ── Authenticated routes — RequireAuth + AppShell sidebar ── */}
                <Route path="/dashboard"  element={shell(<Dashboard />)} />
                <Route path="/profile"    element={shell(<Profile />)} />
                <Route path="/profile/edit" element={<Navigate to="/profile/settings/account" replace />} />
                <Route path="/profile/settings" element={shell(<SettingsLayout />)} />
                <Route path="/profile/settings/:tab" element={shell(<SettingsLayout />)} />
                <Route path="/profile/:id" element={shell(<Profile />)} />
                <Route path="/saved" element={shell(<SavedItems />)} />
                <Route path="/earnings" element={shell(<Earnings />)} />
                <Route path="/notifications" element={shell(<Notifications />)} />
                <Route path="/help" element={shell(<HelpSupport />)} />
                <Route path="/messages"    element={shell(<Messages />)} />
                <Route path="/search"      element={shell(<Search />)} />
                <Route path="/messages/:id" element={<MessagesRedirect />} />
                <Route path="/education"  element={shell(<Learn />)} />
                <Route path="/education/course/:id" element={shell(<CourseDetail />)} />
                <Route path="/education/:tab"  element={shell(<Learn />)} />
                <Route path="/learn"      element={<Navigate to="/education" replace />} />
                <Route path="/earn"       element={shell(<Earn />)} />
                <Route path="/network"    element={shell(<Network />)} />
                <Route path="/network/:slug"      element={shell(<Network />)} />
                <Route path="/network/:slug/join" element={shell(<Network />)} />
                <Route path="/events"     element={shell(<Events />)} />
                <Route path="/events/:id" element={shell(<EventDetail />)} />
                <Route path="/chavee/onboarding" element={shell(<Onboarding />)} />

                {/* ── Admin panel — RequireAdmin (RequireAuth + is_admin) ── */}
                <Route path="/admin"              element={adminShell(<AdminDashboard />)} />
                <Route path="/admin/communities"  element={adminShell(<CommunitiesManager />)} />
                <Route path="/admin/communities/new" element={adminShell(<CreateCommunityWizard />)} />
                <Route path="/admin/posts"        element={adminShell(<PostsManager />)} />
                <Route path="/admin/content"      element={adminShell(<ContentManager />)} />
                <Route path="/admin/education"    element={adminShell(<EducationManager />)} />
                <Route path="/admin/courses"      element={adminShell(<CoursesManager />)} />
                <Route path="/admin/scholarships" element={adminShell(<ScholarshipsManager />)} />
                <Route path="/admin/certifications" element={adminShell(<CertificationsManager />)} />
                <Route path="/admin/resources"    element={adminShell(<ResourcesManager />)} />
                <Route path="/admin/jobs"         element={adminShell(<JobsManager />)} />
                <Route path="/admin/companies"    element={adminShell(<CompaniesManager />)} />
                <Route path="/admin/testimonials" element={adminShell(<TestimonialsManager />)} />
                <Route path="/admin/gigs"         element={adminShell(<GigsManager />)} />
                <Route path="/admin/gig-moderation" element={adminShell(<GigModerationQueue />)} />
                <Route path="/admin/withdrawals"   element={adminShell(<WithdrawalQueue />)} />
                <Route path="/admin/contracts"     element={adminShell(<ContractsOverview />)} />
                <Route path="/admin/disputes"      element={adminShell(<DisputeQueue />)} />
                <Route path="/admin/events"       element={adminShell(<EventsManager />)} />
                <Route path="/admin/events/new"   element={adminShell(<CreateEventWizard />)} />
                <Route path="/admin/users"        element={adminShell(<UsersManager />)} />
                <Route path="/admin/reports"      element={adminShell(<ReportsManager />)} />
                <Route path="/admin/support-tickets" element={adminShell(<SupportTicketsManager />)} />
                <Route path="/admin/subscribers"  element={adminShell(<SubscribersManager />)} />

                {/* ── Redirect legacy routes ── */}
                <Route path="/about"    element={<Navigate to="/about-us" replace />} />
                <Route path="/privacy"  element={<Navigate to="/privacy-policy" replace />} />
                <Route path="/cookies"  element={<Navigate to="/cookie-policy" replace />} />
                <Route path="/cookie-preferences" element={<Navigate to="/cookie-policy" replace />} />
                <Route path="/terms"    element={<Navigate to="/terms-and-conditions" replace />} />
                <Route path="/refund"   element={<Navigate to="/refund-and-cancellation" replace />} />
                <Route path="/home"     element={<Navigate to="/" replace />} />
                <Route path="/register" element={<Navigate to="/signup" replace />} />

                {/* ── 404 ── */}
                <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
            </ErrorBoundary>
        </>
    );
}
