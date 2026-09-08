import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';
import { getCvSignedUrl } from '../utils/cvStorage.js';
import { logUserActivity } from '../utils/activityLogger.js';
import SaveButton from '../components/SaveButton.jsx';
import { sanitizeFilenameForStorageKey, getAttachmentSignedUrl } from '../utils/attachmentStorage.js';
import { subscribeNotify } from '../utils/subscribeNotify.js';

// Jobs and gigs are both fetched from Supabase (see loadJobs / loadGigs below).

const CATEGORIES = ['All', 'Textbooks', 'Notes', 'Services', 'Gigs', 'Digital'];
const GIG_CATEGORIES = ['All', 'Graphic Design', 'Development', 'Writing', 'Marketing', 'Video Editing', 'Photography', 'Voice Over', 'Translation', 'AI', 'Tutoring', 'Business', 'Other'];
const JOB_SUB_TABS = ['All Jobs', 'Internships', 'Part-Time', 'Full-Time', 'Remote', 'Campus Placement', 'Government'];

const GIG_DESCRIPTION_MIN_LENGTH = 30;
const PROPOSAL_MESSAGE_MIN_LENGTH = 30;
const PROPOSAL_MESSAGE_MAX_LENGTH = 2000;
const PROPOSAL_ATTACHMENTS_BUCKET = 'proposal-attachments';

// "Rough Timeline" dropdown — estimated_days is a plain integer column, so
// each option maps to one concrete day count rather than a fuzzy range.
const PROPOSAL_TIMELINE_OPTIONS = [
    { value: 1, label: '1 day' },
    { value: 2, label: '2 days' },
    { value: 3, label: '3 days' },
    { value: 5, label: '5 days' },
    { value: 7, label: '1 week (7 days)' },
    { value: 10, label: '10 days' },
    { value: 14, label: '2 weeks (14 days)' },
    { value: 21, label: '3 weeks (21 days)' },
    { value: 30, label: '1 month (30 days)' },
];

// Buyer-facing copy for gigs.rejection_reason — exact wording supplied by
// product, do not reword. Keyed by the enum values written by the admin
// moderation queue (Step 5).
const REJECTION_REASON_COPY = {
    academic_dishonesty: "This gig appears to be asking for help with academic work in a way that could be considered dishonest — like writing assignments or sitting exams on someone's behalf. We can't allow this on Chavee.",
    illegal_or_prohibited: "This request involves something outside what's allowed on Chavee. If this was flagged in error, edit your listing with more context and resubmit.",
    scope_unclear: "The scope of work in your description is unclear. Freelancers may not understand exactly what you need or what the expected outcome looks like.",
    suspected_scam: "This gig has some red flags that suggest it might not be genuine work. If it's real, try adding more specific details about the deliverables and budget.",
    off_platform_contact: "Your description asks people to contact you outside Chavee. For everyone's safety, all communication and payment should stay on the platform.",
    inappropriate_content: "This gig contains content that isn't appropriate for Chavee's community. Please review our guidelines and resubmit.",
    duplicate_posting: "This looks like a duplicate of a gig you've already posted. If it's genuinely different, make that clearer in the description.",
};

// A8's expanded-row file list — resolves a proposal_files entry
// ({path, name, type, size}) to a real signed URL against the private
// proposal-attachments bucket set up in Group 2 Step 1.
function ProposalFileLink({ file }) {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        if (!file?.path) return;
        let cancelled = false;
        getAttachmentSignedUrl(file.path, { bucket: PROPOSAL_ATTACHMENTS_BUCKET, ttl: 300 })
            .then(url => { if (!cancelled && url) setSignedUrl(url); });
        return () => { cancelled = true; };
    }, [file?.path]);

    return (
        <a
            href={signedUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => { e.stopPropagation(); if (!signedUrl) e.preventDefault(); }}
            style={{ fontSize: '0.8rem', color: 'var(--peacock-green)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
            📄 {signedUrl ? file.name : `Loading ${file.name}...`}
        </a>
    );
}

const gigTimeAgo = (date) => {
    if (!date) return '';
    const diff = (new Date() - new Date(date)) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minute${Math.floor(diff / 60) === 1 ? '' : 's'} ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) === 1 ? '' : 's'} ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) === 1 ? '' : 's'} ago`;
};

const S = {
    page: { minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' },
    card: { 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 16, 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.85rem', 
        transition: 'all 0.25s',
        boxShadow: 'var(--shadow-sm)'
    },
    tabBtn: (a) => ({ 
        padding: '0.6rem 1.25rem', 
        borderRadius: 20, 
        border: '1px solid', 
        cursor: 'pointer', 
        fontSize: '0.84rem', 
        fontWeight: 700, 
        transition: 'all 0.2s', 
        background: a ? 'var(--peacock-green)' : 'transparent', 
        borderColor: a ? 'var(--peacock-green)' : 'var(--border-color)', 
        color: a ? '#fff' : 'var(--text-secondary)' 
    }),
    chip: (a) => ({
        padding: '0.4rem 0.9rem', borderRadius: 20, border: '1px solid', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
        background: a ? 'var(--peacock-green)' : 'transparent',
        borderColor: a ? 'var(--peacock-green)' : 'var(--border-color)',
        color: a ? '#fff' : 'var(--text-secondary)',
        whiteSpace: 'nowrap'
    }),
    input: { 
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 10, 
        color: 'var(--text-primary)', 
        padding: '0.65rem 0.9rem', 
        fontSize: '0.88rem', 
        fontFamily: 'inherit', 
        outline: 'none', 
        width: '100%', 
        transition: 'border-color 0.2s' 
    },
    select: {
        background: 'var(--bg-surface)', 
        border: '1px solid var(--border-color)', 
        borderRadius: 10, 
        color: 'var(--text-primary)', 
        padding: '0.5rem 0.75rem', 
        fontSize: '0.8rem', 
        fontFamily: 'inherit', 
        outline: 'none', 
        cursor: 'pointer'
    },
    label: { 
        fontSize: '0.75rem', 
        fontWeight: 700, 
        color: 'var(--text-secondary)', 
        textTransform: 'uppercase', 
        letterSpacing: '0.5px', 
        display: 'block', 
        marginBottom: '0.4rem' 
    },
};

export default function Earn() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast, showToast, hideToast } = useToast();

    // Set page-level SEO meta
    useEffect(() => {
        document.title = 'Earn Money as a Student — Gigs and Freelance for College Students India | Chavee';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', "Post your skills, find gig work, sell textbooks and earn as a student in India. Chavee's student marketplace connects students with real earning opportunities.");
    }, []);

    const [user, setUser]                 = useState(null);
    const [gamification, setGamification] = useState(null);
    const [jobsList, setJobsList]         = useState([]);
    const [gigsList, setGigsList]         = useState([]);
    const [loadingJobs, setLoadingJobs]   = useState(true);
    const [loadingGigs, setLoadingGigs]   = useState(true);
    
    // Main Tabs: jobs | gigs | marketplace | post-gig
    const [activeMainTab, setActiveMainTab] = useState('jobs');
    const [totalEarned, setTotalEarned] = useState(0);
    const [showJobFilters, setShowJobFilters] = useState(false);
    
    // Detailed Views
    const [viewingJob, setViewingJob] = useState(null);
    const [viewingGigDetail, setViewingGigDetail] = useState(null);
    const [viewingGigStatus, setViewingGigStatus] = useState(null);

    // Set when the post-gig form is opened via "Edit & Resubmit" from the
    // Gig Status screen — handlePostGigSubmit branches to an UPDATE instead
    // of an INSERT when this is set, and clears rejection_reason/note.
    const [editingGigId, setEditingGigId] = useState(null);

    // Search & filters
    const [search, setSearch]             = useState('');
    const [jobFilter, setJobFilter]       = useState('All Jobs');

    // Extended Job Filters
    const [jobAdvancedFilters, setJobAdvancedFilters] = useState({
        experience: 'All', salary: 'All', category: 'All', location: 'All', company: 'All Companies', remote: false, verifiedOnly: false, postedToday: false
    });

    // Extended Gig Filters
    const [gigAdvancedFilters, setGigAdvancedFilters] = useState({
        category: 'All', budget: 'All', experience: 'All', remote: false, fixedPrice: false, hourly: false
    });
    
    // Gigs & Posting list
    const [listings, setListings]         = useState([]);
    const [postingGig, setPostingGig]     = useState(false);
    const [gigScope, setGigScope]         = useState('all'); // 'all' | 'my-listings' | 'my-gig-works'
    const [myListings, setMyListings]     = useState([]);
    const [myGigWorks, setMyGigWorks]     = useState([]);
    const [gigApplicationLookup, setGigApplicationLookup] = useState({});
    const [loadingMyGigWorks, setLoadingMyGigWorks] = useState(false);
    const [applyingGigId, setApplyingGigId] = useState(null);
    const [deletingGigId, setDeletingGigId] = useState(null);
    const [viewingGigProposals, setViewingGigProposals] = useState(null); // A8 — the gig whose proposals are being viewed
    const [currentProposals, setCurrentProposals] = useState([]);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [withdrawnProposalCount, setWithdrawnProposalCount] = useState(0);
    const [applicantCompletedCounts, setApplicantCompletedCounts] = useState({});
    const [expandedProposalId, setExpandedProposalId] = useState(null);
    const [proposalCounts, setProposalCounts] = useState({});
    const [completingGigAppId, setCompletingGigAppId] = useState(null);
    const [resolvingChat, setResolvingChat] = useState(null);
    
    // Interactive gig proposals
    const [selectedGig, setSelectedGig]   = useState(null);
    const [proposalMsg, setProposalMsg]   = useState('');
    const [submittingProposal, setSubmittingProposal] = useState(false);
    const [proposalSuccess, setProposalSuccess] = useState(false);

    // A3 — Send Proposal form fields (Group 2, Step 1)
    const [proposalPrice, setProposalPrice] = useState('');
    const [proposalTimelineDays, setProposalTimelineDays] = useState('');
    const [proposalLinks, setProposalLinks] = useState([]);
    const [proposalLinkInput, setProposalLinkInput] = useState('');
    const [proposalFiles, setProposalFiles] = useState([]); // staged File objects, uploaded on submit
    const [proposalPortfolioTab, setProposalPortfolioTab] = useState('links'); // 'links' | 'files'

    // In-app job application states
    const [applyingJob, setApplyingJob] = useState(null);
    const [uploadingCv, setUploadingCv] = useState(false);
    const [appCvFile, setAppCvFile] = useState(null);
    const [appCvUrl, setAppCvUrl] = useState('');
    const [appAvailability, setAppAvailability] = useState('');
    const [appAnswers, setAppAnswers] = useState({});
    const [submittingApp, setSubmittingApp] = useState(false);
    const [appSuccess, setAppSuccess] = useState(false);

    // Post Gig form state
    const [gigForm, setGigForm] = useState({ title: '', client: '', budget: '', deadline: '', skills: '', desc: '', categoryId: '' });
    const [gigCategories, setGigCategories] = useState([]);
    const [gigAutoApprove, setGigAutoApprove] = useState(false);

    // gig_categories is empty right now (0 rows) — this still loads it live
    // so the picker below starts working the moment real categories exist,
    // with no further code change needed.
    useEffect(() => {
        supabase.from('gig_categories').select('id, name').order('name').then(({ data, error }) => {
            if (error) { console.error('Failed to load gig categories:', error); return; }
            setGigCategories(data || []);
        });
    }, []);

    // Content reporting states
    const [reportingItem, setReportingItem] = useState(null);
    const [reportReason, setReportReason] = useState('Spam');
    const [reportCustomReason, setReportCustomReason] = useState('');
    const [submittingReport, setSubmittingReport] = useState(false);

    // Notify Subscribers states
    const [submittingFeatures, setSubmittingFeatures] = useState({});

    const handleNotifyMe = async (featureKey) => {
        if (!user || submittingFeatures[featureKey]) return;
        setSubmittingFeatures(prev => ({ ...prev, [featureKey]: true }));
        try {
            const profileStr = localStorage.getItem(`profile_${user.id}`);
            const profile = profileStr ? JSON.parse(profileStr) : null;

            // Via the subscribe-notify Edge Function; user_id is derived
            // from the caller's JWT server-side, and dedup is handled there.
            const res = await subscribeNotify({
                email: user.email || profile?.email || '',
                featureKey,
            });
            showToast(
                res.alreadySubscribed
                    ? "You're already on the list!"
                    : "You're on the list! We'll email you when this launches.",
                res.alreadySubscribed ? 'info' : 'success'
            );
        } catch (err) {
            console.error(err);
            showToast(err.message || "Failed to subscribe.", 'error');
        } finally {
            setSubmittingFeatures(prev => ({ ...prev, [featureKey]: false }));
        }
    };

    const loadJobs = async () => {
        setLoadingJobs(true);
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*, companies(id, name, logo_url, is_official)')
                .ilike('status', 'live')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data) setJobsList(data);
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoadingJobs(false);
        }
    };

    const loadGigs = async (currentUserId) => {
        setLoadingGigs(true);
        try {
            const { data, error } = await supabase
                .from('gigs')
                .select('*')
                // Only show publicly visible gigs:
                // 1. Must be verified by admin (verified = true)
                // 2. Must not be suspended, filled, or closed by admin/poster
                // 3. Must not be hidden by admin (admin_hidden = false or null)
                .eq('verified', true)
                .not('status', 'in', '("suspended","filled","closed","rejected")')
                .or('admin_hidden.is.null,admin_hidden.eq.false')
                .order('created_at', { ascending: false });
            if (error) throw error;
            let combined = data || [];

            // Pre-existing gap, not introduced by Phase 1b: the public feed
            // query above only ever returns verified gigs, so a poster's own
            // pending_review/rejected gigs never reached gigsList at all —
            // "My Listings" silently couldn't show them. A poster must always
            // be able to see everything they've posted regardless of
            // moderation state, so this adds their own gigs unconditionally.
            // This does NOT change what anyone else sees in the public feed
            // (that's Step 4's job) — only what the signed-in poster sees of
            // their own listings.
            if (currentUserId) {
                const { data: ownGigs, error: ownErr } = await supabase
                    .from('gigs')
                    .select('*')
                    .eq('posted_by', currentUserId)
                    .order('created_at', { ascending: false });
                if (ownErr) {
                    console.error('Error fetching own gigs:', ownErr);
                } else if (ownGigs) {
                    const seen = new Set(combined.map(g => g.id));
                    combined = [...combined, ...ownGigs.filter(g => !seen.has(g.id))];
                }
            }

            setGigsList(combined);
        } catch (err) {
            console.error('Error fetching gigs:', err);
        } finally {
            setLoadingGigs(false);
        }
    };

    const loadMyGigWorks = async (userId) => {
        if (!userId) return;
        setLoadingMyGigWorks(true);
        try {
            const { data, error } = await supabase
                .from('gig_applications')
                .select('*, gigs:gig_id(title, client_name, posted_by)')
                .eq('applicant_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped = (data || []).map(app => ({
                ...app,
                gigTitle: app.gigs?.title || 'Unknown Gig',
                posterName: app.gigs?.client_name || 'Unknown',
                posterId: app.gigs?.posted_by
            }));

            setMyGigWorks(mapped);

            const lookup = {};
            mapped.forEach(app => {
                if (app.gig_id) lookup[app.gig_id] = app;
            });
            setGigApplicationLookup(lookup);

        } catch (err) {
            console.error('Error loading my gig works:', err);
        } finally {
            setLoadingMyGigWorks(false);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user);
                const g = localStorage.getItem(`gamification_${session.user.id}`);
                if (g) setGamification(JSON.parse(g));
                loadMyGigWorks(session.user.id);

                // Step 6 — read for the post-form notice only (the actual
                // gate is re-checked fresh at submit time in
                // handlePostGigSubmit, this is just so the notice copy
                // isn't misleadingly telling a trusted poster to expect a
                // 2-hour review).
                supabase.from('profiles').select('gig_auto_approve').eq('id', session.user.id).single()
                    .then(({ data }) => setGigAutoApprove(!!data?.gig_auto_approve));

                // "Your Earnings" card — same real source/query Earnings.jsx uses
                // (gig_contracts.seller_net_amount, approved contracts only).
                supabase.from('gig_contracts').select('seller_net_amount')
                    .eq('seller_id', session.user.id)
                    .eq('status', 'approved')
                    .then(({ data }) => {
                        const sum = (data || []).reduce((s, c) => s + (Number(c.seller_net_amount) || 0), 0);
                        setTotalEarned(sum);
                    });
            }
            // Called only after we know whether there's a session, so the
            // own-gigs merge in loadGigs has the right id on first load
            // instead of racing this promise.
            loadGigs(session?.user?.id);
        });
        loadJobs();
    }, []);

    useEffect(() => {
        const highlightGigId = searchParams.get('highlightGigId');
        if (!highlightGigId || gigsList.length === 0) return;

        setActiveMainTab('gigs');
        setGigScope('all');

        const timer = window.setTimeout(() => {
            const target = document.getElementById(`gig-card-${highlightGigId}`);
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [gigsList, searchParams]);

    // Extended Jobs Filtering
    const displayedJobs = jobsList.filter(j => {
        // Tab Filter
        let matchTab = true;
        if (jobFilter !== 'All Jobs') {
            if (jobFilter === 'Internships') matchTab = j.job_type === 'Internship';
            else if (jobFilter === 'Part-Time') matchTab = j.job_type === 'Part-Time';
            else if (jobFilter === 'Full-Time') matchTab = j.job_type === 'Full-Time';
            else if (jobFilter === 'Remote') matchTab = j.location?.toLowerCase().includes('remote') || j.remote_only;
            else if (jobFilter === 'Campus Placement') matchTab = j.job_type === 'Campus Placement';
            else if (jobFilter === 'Government') matchTab = j.job_type === 'Government';
        }

        // Search
        const matchSearch = search === '' || 
            j.title.toLowerCase().includes(search.toLowerCase()) || 
            j.company.toLowerCase().includes(search.toLowerCase()) || 
            (j.skills && j.skills.toLowerCase().includes(search.toLowerCase()));

        // Advanced Filters
        const matchCat = jobAdvancedFilters.category === 'All' || j.category === jobAdvancedFilters.category;
        const matchExp = jobAdvancedFilters.experience === 'All' || j.experience === jobAdvancedFilters.experience;
        const matchLoc = jobAdvancedFilters.location === 'All' || j.location?.includes(jobAdvancedFilters.location);
        const matchCompany = jobAdvancedFilters.company === 'All Companies' || j.companies?.name === jobAdvancedFilters.company;
        const matchRem = !jobAdvancedFilters.remote || j.location?.toLowerCase().includes('remote') || j.remote_only;
        const matchVer = !jobAdvancedFilters.verifiedOnly || j.verified;

        let matchToday = true;
        if (jobAdvancedFilters.postedToday) {
            const today = new Date();
            const postedDate = new Date(j.created_at);
            matchToday = postedDate.toDateString() === today.toDateString();
        }

        return matchTab && matchSearch && matchCat && matchExp && matchLoc && matchCompany && matchRem && matchVer && matchToday;
    });

    // Real distinct companies among the currently loaded live jobs — not a
    // hardcoded list.
    const jobCompanyOptions = useMemo(() => {
        const seen = new Map();
        jobsList.forEach(j => { if (j.companies) seen.set(j.companies.id, j.companies.name); });
        return ['All Companies', ...seen.values()];
    }, [jobsList]);

    // Extended Gigs Filtering
    const displayedGigs = gigsList.filter(g => {
        if (gigScope === 'my-listings') {
            // Everything the user has posted, any status — that's the point
            // of "My Listings". Needs Attention / All Gigs below are the
            // narrower, purpose-specific views.
            return user && g.posted_by === user.id;
        }

        if (gigScope === 'needs-attention') {
            return user && g.posted_by === user.id && (g.status === 'pending_review' || g.status === 'rejected');
        }

        // 'all' — the public feed. Explicitly requires verified === true
        // here, not just "whatever loadGigs happened to fetch" — loadGigs
        // also merges in the signed-in user's own gigs (any status) so
        // My Listings/Needs Attention can show them, and this filter is
        // what keeps those out of the public feed, even for the poster
        // viewing their own gig list. A pending/rejected gig must never
        // show here, badged or not.
        if (!g.verified) return false;

        // Search
        const matchSearch = search === '' ||
            (g.title && g.title.toLowerCase().includes(search.toLowerCase())) ||
            (g.category && g.category.toLowerCase().includes(search.toLowerCase())) ||
            (g.description && g.description.toLowerCase().includes(search.toLowerCase()));

        // Advanced Filters
        const matchCat = gigAdvancedFilters.category === 'All' || (g.category && g.category.toLowerCase().includes(gigAdvancedFilters.category.toLowerCase()));

        // (Other advanced gig filters would go here if we had the data - we'll treat them as matching all for now since data is missing)
        return matchSearch && matchCat;
    });

    const needsAttentionCount = gigsList.filter(g => user && g.posted_by === user.id && (g.status === 'pending_review' || g.status === 'rejected')).length;

    const handlePostGigSubmit = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }

        // Defense in depth alongside the disabled submit button — the live
        // counter in the JSX below already blocks submission under 30 chars,
        // this just guards direct form submission (e.g. Enter key).
        const trimmedDesc = gigForm.desc?.trim() || '';
        if (trimmedDesc.length < GIG_DESCRIPTION_MIN_LENGTH) {
            showToast(`Description must be at least ${GIG_DESCRIPTION_MIN_LENGTH} characters.`, 'error');
            return;
        }

        setPostingGig(true);

        // "Skills Required" still feeds the legacy free-text `category` column
        // unchanged — that's what the public gig-card chips (Earn.jsx list view)
        // read, and this fix isn't touching that display. category_id is the
        // new FK column the admin panel actually reads; gig_categories has 0
        // rows right now, so this will be null until real categories exist —
        // flagged to the user, not seeded here.
        //
        // status is now 'pending_review', not 'Live' — Phase 1b gig posting
        // moderation. Every new gig sits in the queue until an admin approves
        // or rejects it (see admin moderation queue). This does NOT touch any
        // of the 12 gigs that existed before this change.
        const budgetValue = Number(gigForm.budget) || 1000;
        const basePayload = {
            title: gigForm.title?.trim(),
            client_name: gigForm.client?.trim() || user.email.split('@')[0],
            location: 'Remote',
            price: budgetValue,
            budget_min: budgetValue,
            budget_max: budgetValue,
            condition: (gigForm.deadline || '7') + ' Days',
            category: gigForm.skills?.trim() || 'General',
            category_id: gigForm.categoryId || null,
            description: trimmedDesc,
        };

        // Edit & Resubmit (Gig Status screen, rejected gigs only): UPDATE the
        // existing row instead of inserting a new one — puts it back in the
        // review queue and clears the rejection so it reads as a fresh
        // submission, without re-awarding XP for what's still the same gig.
        if (editingGigId) {
            const { error: updateError } = await supabase
                .from('gigs')
                .update({ ...basePayload, status: 'pending_review', rejection_reason: null, rejection_note: null })
                .eq('id', editingGigId);

            if (updateError) {
                showToast('Failed to resubmit gig: ' + updateError.message, 'error');
                setPostingGig(false);
                return;
            }

            setGigForm({ title: '', client: '', budget: '', deadline: '', skills: '', desc: '', categoryId: '' });
            setEditingGigId(null);
            setPostingGig(false);
            setActiveMainTab('gigs');
            showToast('🎉 Gig resubmitted for review!', 'success');
            loadGigs(user.id);
            return;
        }

        // Step 6 — auto-trust (read side). A poster flagged via
        // profiles.gig_auto_approve (set manually by "Approve & Trust", or
        // automatically after 3 clean approvals — both in the admin
        // moderation queue) skips the review queue entirely: their gig goes
        // straight to status: 'active', verified: true. verified_at/
        // verified_by are deliberately left unset here — no admin actually
        // verified this specific gig, an auto-approved post shouldn't claim
        // one did.
        const { data: posterProfile, error: profileErr } = await supabase
            .from('profiles').select('gig_auto_approve').eq('id', user.id).single();
        if (profileErr) console.error('Failed to check auto-approve status:', profileErr);
        const autoApprove = !!posterProfile?.gig_auto_approve;

        const payload = {
            ...basePayload,
            status: autoApprove ? 'active' : 'pending_review',
            verified: autoApprove,
            posted_by: user.id,
        };

        const { data, error } = await supabase
            .from('gigs')
            .insert(payload)
            .select('*');

        if (error) {
            showToast('Failed to post gig: ' + error.message, 'error');
            setPostingGig(false);
            return;
        }

        try {
            const { error: rpcError } = await supabase.rpc('award_xp_for_gig_creation', { p_gig_id: data[0].id });
            if (rpcError) throw rpcError;

            if (gamification) {
                const pts = { ...gamification, points: gamification.points + 50 };
                if (!pts.badges.includes('Gig Pioneer')) {
                    pts.badges = [...pts.badges, 'Gig Pioneer'];
                }
                setGamification(pts);
                localStorage.setItem(`gamification_${user.id}`, JSON.stringify(pts));
            }
        } catch (rpcErr) {
            console.error('Failed to award gig XP:', rpcErr);
        }

        setGigForm({ title: '', client: '', budget: '', deadline: '', skills: '', desc: '', categoryId: '' });
        setPostingGig(false);
        setActiveMainTab('gigs');
        showToast(
            autoApprove
                ? '🎉 Gig posted and live immediately — you\'re a trusted poster! +50 XP & Gig Pioneer badge!'
                : '🎉 Gig submitted for review! +50 XP & Gig Pioneer badge!',
            'success'
        );
        loadGigs(user.id);
    };

    const handleOpenApplyGig = (gig) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedGig(gig);
        setProposalMsg('');
        setProposalSuccess(false);
        setProposalPrice('');
        setProposalTimelineDays('');
        setProposalLinks([]);
        setProposalLinkInput('');
        setProposalFiles([]);
        setProposalPortfolioTab('links');
    };

    const handleDeleteGig = async (gig) => {
        if (!user || !gig?.id) return;
        const confirmed = window.confirm(`Delete "${gig.title}"? This cannot be undone.`);
        if (!confirmed) return;

        setDeletingGigId(gig.id);
        try {
            const { error } = await supabase
                .from('gigs')
                .delete()
                .eq('id', gig.id);
            if (error) throw error;

            setGigsList(prev => prev.filter(item => item.id !== gig.id));
            setMyListings(prev => prev.filter(item => item.id !== gig.id));
            if (viewingGigDetail?.id === gig.id) setViewingGigDetail(null);
            if (viewingGigStatus?.id === gig.id) setViewingGigStatus(null);
            showToast('🗑️ Gig deleted.', 'success');
        } catch (err) {
            console.error('Error deleting gig:', err);
            showToast('Failed to delete gig: ' + err.message, 'error');
        } finally {
            setDeletingGigId(null);
        }
    };

    // Pre-fills the post-gig form from a rejected gig and switches the form
    // into "edit" mode — handlePostGigSubmit branches on editingGigId to do
    // an UPDATE (status back to pending_review, rejection fields cleared)
    // instead of an INSERT.
    const handleEditResubmit = (gig) => {
        const days = parseInt(gig.condition, 10);
        setGigForm({
            title: gig.title || '',
            client: gig.client_name || '',
            budget: String(gig.budget_min || gig.price || ''),
            deadline: days ? String(days) : '',
            skills: gig.category || '',
            desc: gig.description || '',
            categoryId: gig.category_id || '',
        });
        setEditingGigId(gig.id);
        setViewingGigStatus(null);
        setActiveMainTab('post-gig');
    };

    const loadProposalCountsForOwnedGigs = async (gigIds) => {
        if (!user || !gigIds.length) {
            setProposalCounts({});
            return;
        }

        try {
            const { data, error } = await supabase
                .from('gig_applications')
                .select('gig_id')
                .in('gig_id', gigIds);

            if (error) throw error;

            const nextCounts = gigIds.reduce((acc, gigId) => ({ ...acc, [gigId]: 0 }), {});
            (data || []).forEach(app => {
                if (app.gig_id) {
                    nextCounts[app.gig_id] = (nextCounts[app.gig_id] || 0) + 1;
                }
            });
            setProposalCounts(nextCounts);
        } catch (err) {
            console.error('Error loading proposal counts:', err);
        }
    };

    useEffect(() => {
        if (!user) return;
        const ownedGigIds = gigsList.filter(gig => gig.posted_by === user.id).map(gig => gig.id);
        loadProposalCountsForOwnedGigs(ownedGigIds);
    }, [user, gigsList]);

    const loadProposalsForGig = async (gigId) => {
        setLoadingProposals(true);
        try {
            const { data, error } = await supabase
                .from('gig_applications')
                .select('*, profiles:applicant_id(full_name, username, avatar_url)')
                .eq('gig_id', gigId)
                .order('created_at', { ascending: false });
            if (error) throw error;

            // Withdrawn proposals are excluded from the list by design (a
            // poster doesn't need to see ones the applicant pulled back) —
            // shown only as a low-key count, not full rows.
            const visible = (data || []).filter(p => p.status !== 'withdrawn');
            const withdrawnCount = (data || []).length - visible.length;
            setCurrentProposals(visible);
            setWithdrawnProposalCount(withdrawnCount);

            // "Completed gigs" per applicant — real, computable count (Group 2
            // point 4's honesty standard): gig_applications where that
            // applicant_id has status='completed', the same definition the
            // A4 "Mark Completed" action already writes.
            const applicantIds = [...new Set(visible.map(p => p.applicant_id).filter(Boolean))];
            if (applicantIds.length) {
                const { data: completedRows } = await supabase
                    .from('gig_applications')
                    .select('applicant_id')
                    .eq('status', 'completed')
                    .in('applicant_id', applicantIds);
                const counts = {};
                (completedRows || []).forEach(r => { counts[r.applicant_id] = (counts[r.applicant_id] || 0) + 1; });
                setApplicantCompletedCounts(counts);
            } else {
                setApplicantCompletedCounts({});
            }
        } catch (err) {
            console.error('Error loading proposals:', err);
            showToast('Failed to load proposals: ' + (err.message || String(err)), 'error');
            setCurrentProposals([]);
            setWithdrawnProposalCount(0);
            setApplicantCompletedCounts({});
        } finally {
            setLoadingProposals(false);
        }
    };

    const handleFoundSomeone = async (gig) => {
        if (!user || !gig?.id) return;
        const ok = window.confirm(`Mark "${gig.title}" as Found Someone / Filled? This will close the gig to new proposals.`);
        if (!ok) return;
        try {
            const { error } = await supabase.from('gigs').update({ status: 'filled' }).eq('id', gig.id);
            if (error) throw error;
            showToast('Gig marked as filled.', 'success');
            loadGigs(user.id);
            loadMyGigWorks(user.id).catch(() => {});
        } catch (err) {
            console.error('Failed to mark filled:', err);
            showToast('Failed to mark gig as filled: ' + (err.message || String(err)), 'error');
        }
    };

    const handleApplyGig = async (e) => {
        e.preventDefault();
        if (!user || !selectedGig) { navigate('/login'); return; }

        const trimmedPitch = proposalMsg.trim();
        if (trimmedPitch.length < PROPOSAL_MESSAGE_MIN_LENGTH) {
            showToast(`Proposal message must be at least ${PROPOSAL_MESSAGE_MIN_LENGTH} characters.`, 'error');
            return;
        }
        if (!proposalTimelineDays) {
            showToast('Please select a rough timeline.', 'error');
            return;
        }

        setApplyingGigId(selectedGig.id);
        setSubmittingProposal(true);
        const gigSnapshot = selectedGig;

        try {
            const { data: sessionData } = await supabase.auth.getSession();
            const currentUser = sessionData?.session?.user;
            if (!currentUser) throw new Error('No authenticated user session');

            const insertPayload = {
                gig_id: gigSnapshot.id,
                applicant_id: currentUser.id,
                pitch: trimmedPitch,
                proposed_price: proposalPrice ? Number(proposalPrice) : null,
                estimated_days: Number(proposalTimelineDays),
                portfolio_links: proposalLinks,
                portfolio_files: [], // filled in below, after upload — needs the real application id first
            };

            const { data: inserted, error } = await supabase
                .from('gig_applications')
                .insert(insertPayload)
                .select('*')
                .single();

            if (error) {
                const isDuplicate = error.code === '23505' || /duplicate|already exists/i.test(error.message || '');
                if (isDuplicate) {
                    showToast('You already applied to this gig.', 'info');
                } else {
                    throw error;
                }
            } else {
                // Storage RLS requires the path to start with the real
                // gig_application_id, so uploads can only happen after the
                // insert above returns one — mirrors the gig-deliveries
                // pattern from Phase 1b. sanitizeFilenameForStorageKey is
                // reused as-is (not re-derived) — same ellipsis/path-
                // traversal bug from Fix 4 could recur otherwise.
                if (proposalFiles.length > 0) {
                    const uploadedFiles = [];
                    for (const file of proposalFiles) {
                        try {
                            const safeName = sanitizeFilenameForStorageKey(file.name);
                            const path = `${inserted.id}/${Date.now()}_${safeName}`;
                            const { error: upErr } = await supabase.storage
                                .from(PROPOSAL_ATTACHMENTS_BUCKET)
                                .upload(path, file, { cacheControl: '3600', upsert: false });
                            if (upErr) throw upErr;
                            uploadedFiles.push({ path, name: file.name, type: file.type, size: file.size });
                        } catch (fileErr) {
                            console.error('Portfolio file upload failed:', fileErr);
                            showToast(`Failed to upload ${file.name}: ${fileErr.message}`, 'error');
                        }
                    }
                    if (uploadedFiles.length > 0) {
                        const { error: filesUpdateErr } = await supabase
                            .from('gig_applications')
                            .update({ portfolio_files: uploadedFiles })
                            .eq('id', inserted.id);
                        if (filesUpdateErr) console.error('Failed to save portfolio file references:', filesUpdateErr);
                    }
                }

                showToast('🎉 Proposal sent! Redirecting to your messages...', 'success');
                // The gig owner's "new pitch" notification is produced
                // server-side by the handle_new_gig_application trigger on
                // gig_applications INSERT — no client call needed.

                let conversationId = inserted?.conversation_id || null;
                if (!conversationId && inserted?.id) {
                    const { data: refreshed } = await supabase.from('gig_applications').select('conversation_id').eq('id', inserted.id).single();
                    conversationId = refreshed?.conversation_id || null;
                }

                setSelectedGig(null);
                setProposalPrice('');
                setProposalTimelineDays('');
                setProposalLinks([]);
                setProposalLinkInput('');
                setProposalFiles([]);
                setProposalPortfolioTab('links');

                if (conversationId) {
                    navigate(`/messages?id=${conversationId}`);
                } else {
                    await loadMyGigWorks(currentUser.id);
                    setGigApplicationLookup(prev => ({
                        ...prev,
                        [gigSnapshot.id]: { id: gigSnapshot.id, gig_id: gigSnapshot.id, status: 'applied' }
                    }));
                    setProposalSuccess(true);
                }
            }
        } catch (err) {
            console.error('Error submitting gig application:', err);
            showToast('Failed to submit proposal: ' + err.message, 'error');
        } finally {
            setSubmittingProposal(false);
            setApplyingGigId(null);
        }
    };

    const handleCompleteGigApplication = async (application) => {
        if (!user || !application?.id) return;
        setCompletingGigAppId(application.id);
        try {
            const { error } = await supabase.rpc('complete_gig_application', { p_application_id: application.id });
            if (error) throw error;
            setMyGigWorks(prev => prev.map(item => item.id === application.id ? { ...item, status: 'completed' } : item));
            showToast('+30 XP earned! Gig Completer badge unlocked.', 'success');
        } catch (err) {
            console.error('Error completing gig application:', err);
            showToast('Unable to complete this gig work right now.', 'error');
        } finally {
            setCompletingGigAppId(null);
        }
    };

    const handleOpenApplyJob = (job) => {
        if (!user) { navigate('/login'); return; }
        setApplyingJob(job);
        setAppCvFile(null);
        setAppCvUrl('');
        setAppAvailability('');
        const initialAnswers = {};
        if (Array.isArray(job.application_questions)) {
            job.application_questions.forEach(q => { initialAnswers[q] = ''; });
        }
        setAppAnswers(initialAnswers);
        setAppSuccess(false);
    };

    const handleViewOwnCv = async () => {
        if (!appCvUrl) return;
        try {
            const signedUrl = await getCvSignedUrl(appCvUrl);
            if (!signedUrl) throw new Error('Unable to create a temporary CV link.');
            window.open(signedUrl, '_blank', 'noopener,noreferrer');
        } catch (err) {
            console.error('Failed to open CV:', err);
            showToast('Unable to open your CV right now.', 'error');
        }
    };

    const handleCvUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!user) { showToast('Please log in to upload your CV.', 'error'); return; }

        setUploadingCv(true);
        try {
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
            const filePath = `${user.id}/${fileName}`;
            const { error } = await supabase.storage.from('job-cvs').upload(filePath, file, { cacheControl: '3600', upsert: false });
            if (error) throw error;

            setAppCvUrl(filePath);
            setAppCvFile(file);
            showToast('📄 CV uploaded successfully!', 'success');
        } catch (err) {
            console.error('CV upload failed:', err);
            showToast(`Upload failed: ${err.message}`, 'error');
        } finally {
            setUploadingCv(false);
        }
    };

    const handleSubmitJobApplication = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        if (!appCvUrl) { showToast('Please upload your CV before submitting.', 'error'); return; }

        setSubmittingApp(true);
        try {
            const payload = {
                job_id: applyingJob.id,
                user_id: user.id,
                cv_url: appCvUrl,
                availability: appAvailability.trim(),
                answers: appAnswers,
                status: 'Submitted'
            };
            const { data: newApp, error } = await supabase.from('job_applications').insert(payload).select('id').single();
            if (error) throw error;

            try {
                const { error: rpcError } = await supabase.rpc('award_xp_for_job_application', { p_application_id: newApp.id });
                if (!rpcError && gamification) {
                    const pts = { ...gamification, points: gamification.points + 25 };
                    setGamification(pts);
                    localStorage.setItem(`gamification_${user.id}`, JSON.stringify(pts));
                }
            } catch (rpcErr) { console.error('Failed to award XP:', rpcErr); }
            
            await logUserActivity(user.id, 'job_application', { 
                job_id: applyingJob.id, 
                job_title: applyingJob.title,
                company_name: applyingJob.company_name
            });

            setAppSuccess(true);
            showToast('🎉 Application submitted successfully!', 'success');
            loadJobs();
        } catch (err) {
            console.error('Application submission failed:', err);
            showToast('Failed to submit application: ' + err.message, 'error');
        } finally {
            setSubmittingApp(false);
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        if (!reportingItem) return;

        setSubmittingReport(true);
        try {
            const finalReason = reportReason === 'Other' ? reportCustomReason.trim() : reportReason;
            if (!finalReason) { showToast('Please provide a reason for reporting.', 'error'); setSubmittingReport(false); return; }

            const payload = {
                reporter_id: user.id,
                reported_user_id: reportingItem.authorId,
                message_id: reportingItem.type === 'message' ? reportingItem.id : null,
                post_id: reportingItem.type === 'post' ? reportingItem.id : null,
                gig_id: reportingItem.type === 'gig' ? reportingItem.id : null,
                reason: finalReason,
                status: 'Pending'
            };

            const { error } = await supabase.from('reports_moderation').insert(payload);
            if (error) throw error;

            showToast('🚩 Report submitted successfully. Thank you!', 'success');
            setReportingItem(null);
            setReportReason('Spam');
            setReportCustomReason('');
        } catch (err) {
            console.error('Error submitting report:', err);
            showToast('Failed to submit report: ' + err.message, 'error');
        } finally {
            setSubmittingReport(false);
        }
    };

    const handleDiscuss = async (proposalId, conversationId) => {
        try {
            const { error } = await supabase.from('gig_applications').update({ status: 'discussing' }).eq('id', proposalId);
            if (error) throw error;
            // Optimistically update local state if needed
            setCurrentProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'discussing' } : p));
            if (conversationId) navigate(`/messages?id=${conversationId}`);
        } catch (err) {
            console.error('Error starting discussion:', err);
            showToast('Failed to start discussion.', 'error');
        }
    };

    const handleMessagePeer = async (peerId, peerName) => {
        if (!user) { navigate('/login'); return; }
        if (!peerId) { showToast("Cannot message this user.", "info"); return; }
        if (peerId === user.id) { showToast("You cannot message yourself.", "info"); return; }
        
        setResolvingChat(peerId);
        try {
            const { data: conversationId, error: err } = await supabase.rpc('start_direct_conversation', { other_user_id: peerId });
            if (err) throw err;
            navigate(`/messages?id=${conversationId}`);
        } catch (err) {
            console.error('Error starting conversation:', err);
            showToast('Failed to start conversation.', 'error');
        } finally {
            setResolvingChat(null);
        }
    };

    const handleAnswerChange = (q, val) => {
        setAppAnswers(prev => ({ ...prev, [q]: val }));
    };

    // Sub-components
    const FilterSelect = ({ label, value, onChange, options }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</span>
            <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>
    );

    const JobDetailView = ({ job, onBack }) => {
        const isInternal = job.application_type === 'internal';
        return (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <button onClick={onBack} className="btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back to Jobs
                </button>
                <div style={{ ...S.card, padding: '2.5rem', gap: '2rem' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '3.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 16, width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {job.logo || '🏢'}
                            </div>
                            <div>
                                <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '1.8rem', fontWeight: 900 }}>{job.title}</h1>
                                <p style={{ fontSize: '1rem', color: 'var(--peacock-green)', fontWeight: 700, margin: '0 0 0.5rem 0' }}>{job.company}</p>
                                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                    <span>📍 {job.location || 'Remote'}</span>
                                    <span>🕒 {job.job_type || 'Full-Time'}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button className="btn-ghost" onClick={() => showToast('Job saved!', 'success')} style={{ padding: '0.65rem', borderRadius: 8, fontSize: '1.1rem' }}>🔖</button>
                            <button className="btn-ghost" onClick={() => showToast('Link copied!', 'success')} style={{ padding: '0.65rem', borderRadius: 8, fontSize: '1.1rem' }}>🔗</button>
                            <button onClick={() => {
                                if (isInternal) handleOpenApplyJob(job);
                                else if (job.apply_url) window.open(job.apply_url, '_blank');
                            }} className="btn-primary" style={{ padding: '0.65rem 1.5rem', borderRadius: 8, fontSize: '0.9rem' }}>
                                Apply Now →
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Salary</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.2rem' }}>{job.compensation || 'Negotiable'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Experience</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.2rem' }}>{job.experience || 'Entry Level'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Deadline</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.2rem' }}>{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Rolling'}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Working Mode</div>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: '0.2rem' }}>{job.working_mode || (job.remote_only ? 'Remote' : 'Hybrid')}</div>
                        </div>
                    </div>

                    {/* Content */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Job Description</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{job.description}</p>
                        </div>

                        {(job.requirements || job.skills) && (
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Requirements</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{job.requirements || 'Key Skills: ' + job.skills}</p>
                            </div>
                        )}

                        {job.benefits && (
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1rem 0' }}>Benefits</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{job.benefits}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const GigDetailView = ({ gig, onBack }) => {
        const isOwnGig = Boolean(user && gig.posted_by === user.id);
        const hasApplied = Boolean(gigApplicationLookup[gig.id]);

        // A2 gap closure (Group 2 Step 4) — only the two honestly-real
        // poster stats. No Response Rate / Rating / Last Active: confirmed
        // in the Group 2 investigation that no real data backs any of them
        // (no reviews table, profiles.last_active_at is never written).
        const [posterStats, setPosterStats] = useState(null);
        useEffect(() => {
            if (!gig.posted_by) return;
            let cancelled = false;
            Promise.all([
                supabase.from('gigs').select('id', { count: 'exact', head: true }).eq('posted_by', gig.posted_by),
                supabase.from('profiles').select('created_at').eq('id', gig.posted_by).single(),
            ]).then(([gigsCountRes, profileRes]) => {
                if (cancelled) return;
                setPosterStats({
                    gigsPosted: gigsCountRes.count || 0,
                    memberSince: profileRes.data?.created_at || null,
                });
            });
            return () => { cancelled = true; };
        }, [gig.posted_by]);

        return (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <button onClick={onBack} className="btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back to Gigs
                </button>
                <div style={{ ...S.card, padding: '2.5rem', gap: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                            <div style={{ fontSize: '3rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 16, width: 70, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                ⚡
                            </div>
                            <div>
                                <h1 style={{ margin: '0 0 0.4rem 0', fontSize: '1.6rem', fontWeight: 900 }}>{gig.title}</h1>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Posted by {gig.client_name || 'Student'} · {gig.location || 'Remote'}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--peacock-green)', marginBottom: '0.5rem' }}>₹{Number(gig.price || 1000).toLocaleString('en-IN')}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{gig.condition || '7 Days'} Timeline</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {(gig.category || 'General').split(',').map(s => (
                            <span key={s} style={{ fontSize: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.3rem 0.75rem', borderRadius: 20, fontWeight: 600 }}>
                                {s.trim()}
                            </span>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>Project Description</h3>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{gig.description}</p>
                        </div>
                        
                        {(gig.requirements || gig.skills) && (
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>Skills & Requirements</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{gig.requirements || gig.skills}</p>
                            </div>
                        )}

                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>Attachments</h3>
                            {/* No attachment column/table exists for gigs (same gap flagged
                                in Phase 1b's GigStatusView) — honest "No attachments" rather
                                than inventing files the mockup shows. */}
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span>📎</span> No attachments
                            </p>
                        </div>

                        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 14, padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 0.85rem 0' }}>Posted by</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: posterStats ? '1rem' : 0 }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Gigs Posted</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{posterStats ? posterStats.gigsPosted : '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Member Since</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                                        {posterStats?.memberSince
                                            ? new Date(posterStats.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
                                            : '—'}
                                    </div>
                                </div>
                            </div>
                            {gig.posted_by && (
                                <Link to={`/profile/${gig.posted_by}`} style={{ display: 'inline-block', padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--peacock-green)', color: 'var(--peacock-green)', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none' }}>
                                    View Poster Profile
                                </Link>
                            )}
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button className="btn-ghost" onClick={() => showToast('Gig saved!', 'success')} style={{ padding: '0.65rem 1.25rem', borderRadius: 8 }}>Save Gig</button>
                        {!isOwnGig && (
                            <button onClick={() => setReportingItem({ type: 'gig', id: gig.id, authorId: gig.posted_by })} className="btn-ghost" style={{ padding: '0.65rem 1.25rem', borderRadius: 8, color: 'var(--accent-coral)' }}>Report</button>
                        )}
                        {!isOwnGig ? (
                            <button onClick={() => handleOpenApplyGig(gig)} disabled={hasApplied} className="btn-primary" style={{ padding: '0.65rem 2rem', borderRadius: 8 }}>
                                {hasApplied ? 'Proposal Sent ✓' : 'Submit Proposal ⚡'}
                            </button>
                        ) : (
                            <button onClick={() => { setViewingGigProposals(gig); setExpandedProposalId(null); loadProposalsForGig(gig.id); }} className="btn-primary" style={{ padding: '0.65rem 2rem', borderRadius: 8 }}>
                                View Proposals
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // A7 — Gig Status screen. Shown when the poster opens one of their own
    // gigs while it's pending_review or rejected (design-references/gig-screens/
    // 7-gig-status-mobile.png.png, A7-gig-status-web.png.png).
    //
    // Data gaps vs. the mockup, flagged rather than fabricated:
    // - No image/thumbnail column on gigs — using the same ⚡ icon box
    //   GigDetailView already uses instead of a fake image.
    // - No attachments column/table on gigs — Attachments row shows "No
    //   attachments" rather than the mockup's invented "brand-inspiration.pdf".
    // - No updated_at column — the desktop Overview panel omits "Last
    //   Updated" rather than reusing created_at dishonestly.
    // - "Needed By" isn't a stored date — condition stores "N Days" as
    //   free text, so this is created_at + N days, a real derived value.
    // - "Gig ID: GIG-XXXXX" — gigs use UUID ids, not this short format;
    //   using the first 5 hex chars of the real id as a display-only label.
    // - "Gig Type: Standard Gig" — there's only one gig type in the schema
    //   today, so this is accurate static text, not fabricated data.
    const GigStatusView = ({ gig, onBack, onEditResubmit, onDelete }) => {
        const [proposalsCount, setProposalsCount] = useState(0);

        useEffect(() => {
            let cancelled = false;
            supabase.from('gig_applications').select('id', { count: 'exact', head: true }).eq('gig_id', gig.id)
                .then(({ count }) => { if (!cancelled) setProposalsCount(count || 0); });
            return () => { cancelled = true; };
        }, [gig.id]);

        const isPending = gig.status === 'pending_review';
        const isRejected = gig.status === 'rejected';
        const categoryName = gigCategories.find(c => c.id === gig.category_id)?.name || 'Uncategorized';
        const shortGigId = `GIG-${gig.id.slice(0, 5).toUpperCase()}`;
        const hasBudgetRange = gig.budget_min || gig.budget_max;
        const budgetLabel = hasBudgetRange
            ? `₹${Number(gig.budget_min || gig.price || 0).toLocaleString('en-IN')} - ₹${Number(gig.budget_max || gig.price || 0).toLocaleString('en-IN')}`
            : 'Negotiable';
        const neededByLabel = (() => {
            const days = parseInt(gig.condition, 10);
            if (!days || !gig.created_at) return '—';
            const d = new Date(gig.created_at);
            d.setDate(d.getDate() + days);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        })();
        const rejectionCopy = gig.rejection_reason
            ? (REJECTION_REASON_COPY[gig.rejection_reason] || 'No specific reason was recorded for this rejection.')
            : null;

        const detailRows = (
            <>
                <div className="gig-status-field"><span>📂</span><div><strong>Category</strong><div className="gig-status-field-value"><span className="gig-status-category-chip">{categoryName}</span></div></div></div>
                <div className="gig-status-field"><span>🛡️</span><div><strong>Budget Range</strong><div className="gig-status-field-value">{budgetLabel}</div></div></div>
                <div className="gig-status-field"><span>📅</span><div><strong>Needed By</strong><div className="gig-status-field-value">{neededByLabel}</div></div></div>
                <div className="gig-status-field"><span>👥</span><div><strong>Proposals</strong><div className="gig-status-field-value">{proposalsCount}</div></div></div>
            </>
        );

        return (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <button onClick={onBack} className="btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back to My Gigs
                </button>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span onClick={onBack} style={{ color: 'var(--peacock-green)', fontWeight: 700, cursor: 'pointer' }}>Earn</span>
                    <span>›</span>
                    <span style={{ color: 'var(--peacock-green)', fontWeight: 700 }}>Gig</span>
                    <span>›</span>
                    <span onClick={onBack} style={{ color: 'var(--peacock-green)', fontWeight: 700, cursor: 'pointer' }}>My Gigs</span>
                    <span>›</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{gig.title}</span>
                </div>

                <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.5rem', fontWeight: 900 }}>{gig.title}</h1>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Gig ID: {shortGigId} · Posted {gigTimeAgo(gig.created_at)}
                </p>

                {isPending && (
                    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.9rem' }}>
                        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>⏳</span>
                        <div>
                            <div style={{ fontWeight: 800, color: '#B45309', fontSize: '1rem', marginBottom: '0.2rem' }}>Under Review</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.6rem' }}>
                                Submitted {gigTimeAgo(gig.created_at)} · usually live within 2 hours
                            </div>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Thanks! We're reviewing your gig to make sure it meets our guidelines.
                            </p>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: '1.1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '0.9rem' }}>
                        <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>⊗</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '1rem', marginBottom: '0.3rem' }}>Rejected</div>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                We couldn't approve your gig this time. Don't worry — this is common and easy to fix.
                            </p>
                            <div className="gig-status-reject-grid">
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.3rem' }}>Reason for rejection</div>
                                    <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rejectionCopy}</p>
                                </div>
                                {gig.rejection_note && (
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.3rem' }}>Admin note</div>
                                        <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{gig.rejection_note}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="gig-status-actions" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => isRejected && onEditResubmit(gig)}
                        disabled={!isRejected}
                        style={{
                            flex: '1 1 160px', padding: '0.65rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700,
                            background: 'transparent', border: `1px solid ${isRejected ? 'var(--peacock-green)' : 'var(--border-color)'}`,
                            color: isRejected ? 'var(--peacock-green)' : 'var(--text-muted)',
                            cursor: isRejected ? 'pointer' : 'not-allowed', opacity: isRejected ? 1 : 0.55
                        }}
                        title={isRejected ? '' : 'Only available for rejected gigs'}
                    >
                        ✏️ Edit & Resubmit
                    </button>
                    <button
                        onClick={() => onDelete(gig)}
                        style={{ flex: '1 1 160px', padding: '0.65rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--accent-coral)', color: 'var(--accent-coral)', cursor: 'pointer' }}
                    >
                        🗑️ Delete Gig
                    </button>
                    <Link
                        to="/contact-us"
                        style={{ flex: '1 1 160px', padding: '0.65rem 1rem', borderRadius: 10, fontSize: '0.85rem', fontWeight: 700, background: 'transparent', border: '1px solid #3B82F6', color: '#3B82F6', textAlign: 'center', textDecoration: 'none' }}
                    >
                        🎧 Contact Support
                    </Link>
                </div>

                <div className="gig-status-grid">
                    <div className="gig-status-details" style={S.card}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Gig Details</h3>
                        <div className="gig-status-details-inner">
                            <div style={{ fontSize: '2.2rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 14, width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                ⚡
                            </div>
                            <div className="gig-status-fields">
                                {detailRows}
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                            <span>📎</span>
                            <span style={{ fontWeight: 700 }}>Attachments</span>
                            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>No attachments</span>
                        </div>

                        <div className="gig-status-description">
                            <h4 style={{ margin: '0.5rem 0 0.5rem', fontSize: '0.9rem', fontWeight: 800 }}>Description</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{gig.description}</p>
                        </div>
                    </div>

                    <div className="gig-status-sidebar" style={S.card}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Overview</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Status</span><span style={{ fontWeight: 700, color: isRejected ? '#DC2626' : '#B45309' }}>{isRejected ? 'Rejected' : 'Under Review'}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Posted</span><span style={{ fontWeight: 700 }}>{new Date(gig.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Gig Type</span><span style={{ fontWeight: 700 }}>Standard Gig</span></div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 14, padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                        <span style={{ fontSize: '1.3rem' }}>💡</span>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--peacock-green)' }}>Tips to get your gig approved</h4>
                    </div>
                    <div className="gig-status-tips-grid">
                        {[
                            'Be clear and specific about what you need',
                            'Add details about deliverables, file formats, and preferences',
                            'Mention any examples or references (if available)',
                            'Set a realistic budget range',
                            'Add a deadline that gives freelancers enough time',
                        ].map(tip => (
                            <div key={tip} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                                <span style={{ color: 'var(--peacock-green)', flexShrink: 0 }}>✓</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // A3 — Send Proposal. Full-page view (not a modal), matching the
    // mockup's dedicated "Propose" breadcrumb step — desktop: form +
    // gig-summary sidebar (design-references/gig-screens/
    // A3-send-proposal-.png.png), mobile: gig-summary card stacked above
    // the form (A3-send-proposal-mobile.png.png). Submits through the
    // same handleApplyGig used by the old modal, just with the richer
    // field set wired in.
    const SendProposalView = ({ gig, onBack }) => {
        const canSubmit = proposalMsg.trim().length >= PROPOSAL_MESSAGE_MIN_LENGTH && !!proposalTimelineDays;

        const handleAddLink = () => {
            const link = proposalLinkInput.trim();
            if (!link) return;
            setProposalLinks(prev => [...prev, link]);
            setProposalLinkInput('');
        };
        const handleRemoveLink = (idx) => setProposalLinks(prev => prev.filter((_, i) => i !== idx));
        const handleFilesSelected = (e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) setProposalFiles(prev => [...prev, ...files]);
            e.target.value = '';
        };
        const handleRemoveFile = (idx) => setProposalFiles(prev => prev.filter((_, i) => i !== idx));

        const budgetLabel = (gig.budget_min || gig.budget_max)
            ? `₹${Number(gig.budget_min || gig.price || 0).toLocaleString('en-IN')} - ₹${Number(gig.budget_max || gig.price || 0).toLocaleString('en-IN')}`
            : `₹${Number(gig.price || 0).toLocaleString('en-IN')}`;

        const gigSummary = (
            <div style={S.card}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                    <div style={{ fontSize: '1.8rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 12, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⚡</div>
                    <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, lineHeight: 1.3 }}>{gig.title}</h3>
                        <span style={{ display: 'inline-block', marginTop: '0.35rem', fontSize: '0.72rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 600 }}>
                            {(gig.category || 'General').split(',')[0].trim()}
                        </span>
                    </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.85rem', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Budget</span>
                        <span style={{ fontWeight: 700 }}>{budgetLabel}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Posted</span>
                        <span style={{ fontWeight: 700 }}>{gigTimeAgo(gig.created_at)}</span>
                    </div>
                </div>
            </div>
        );

        return (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <button onClick={onBack} className="btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back
                </button>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span onClick={onBack} style={{ color: 'var(--peacock-green)', fontWeight: 700, cursor: 'pointer' }}>Earn</span>
                    <span>›</span>
                    <span style={{ color: 'var(--peacock-green)', fontWeight: 700 }}>Gig</span>
                    <span>›</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{gig.title}</span>
                    <span>›</span>
                    <span>Propose</span>
                </div>

                <h1 style={{ margin: '0 0 0.35rem 0', fontSize: '1.5rem', fontWeight: 900 }}>Send Proposal</h1>
                <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Introduce yourself and tell the client why you're the right person for this work.</p>

                <div className="proposal-summary-mobile">{gigSummary}</div>

                <div className="proposal-grid">
                    <form onSubmit={handleApplyGig} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={S.label}>Your Proposal Message *</label>
                            <textarea
                                rows={6}
                                value={proposalMsg}
                                onChange={e => setProposalMsg(e.target.value.slice(0, PROPOSAL_MESSAGE_MAX_LENGTH))}
                                placeholder="Explain how you will approach this work, what you will deliver and why you're a great fit for this gig..."
                                style={{ ...S.input, resize: 'vertical' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                                <span style={{ color: proposalMsg.trim().length >= PROPOSAL_MESSAGE_MIN_LENGTH ? 'var(--peacock-green)' : 'var(--text-muted)', fontWeight: 600 }}>
                                    Minimum {PROPOSAL_MESSAGE_MIN_LENGTH} characters{proposalMsg.trim().length >= PROPOSAL_MESSAGE_MIN_LENGTH ? ' ✓' : ''}
                                </span>
                                <span style={{ color: 'var(--text-muted)' }}>{proposalMsg.length} / {PROPOSAL_MESSAGE_MAX_LENGTH}</span>
                            </div>
                        </div>

                        <div>
                            <label style={S.label}>Your Price (₹) — Optional</label>
                            <input type="number" min="0" value={proposalPrice} onChange={e => setProposalPrice(e.target.value)} placeholder="e.g., 1200" style={S.input} />
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Optional — you can discuss this in chat.</p>
                        </div>

                        <div>
                            <label style={S.label}>Rough Timeline *</label>
                            <select value={proposalTimelineDays} onChange={e => setProposalTimelineDays(e.target.value)} style={S.input}>
                                <option value="">Select estimated delivery time</option>
                                {PROPOSAL_TIMELINE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tell the client how many days you'll need to complete this work.</p>
                        </div>

                        <div>
                            <label style={S.label}>Samples / Portfolio (Optional)</label>
                            <p style={{ margin: '0 0 0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Share links to your previous work or upload files that show your skills.</p>

                            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 10, overflow: 'hidden' }}>
                                <button type="button" onClick={() => setProposalPortfolioTab('links')} style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: proposalPortfolioTab === 'links' ? 'var(--bg-mint)' : 'var(--bg-elevated)', color: proposalPortfolioTab === 'links' ? 'var(--peacock-green)' : 'var(--text-secondary)' }}>
                                    🔗 Add Links
                                </button>
                                <button type="button" onClick={() => setProposalPortfolioTab('files')} style={{ flex: 1, padding: '0.6rem', fontSize: '0.82rem', fontWeight: 700, border: 'none', borderLeft: '1px solid var(--border-color)', cursor: 'pointer', background: proposalPortfolioTab === 'files' ? 'var(--bg-mint)' : 'var(--bg-elevated)', color: proposalPortfolioTab === 'files' ? 'var(--peacock-green)' : 'var(--text-secondary)' }}>
                                    ⬆️ Upload Files
                                </button>
                            </div>

                            <div style={{ border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '1rem' }}>
                                {proposalPortfolioTab === 'links' ? (
                                    <>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <input type="url" value={proposalLinkInput} onChange={e => setProposalLinkInput(e.target.value)} placeholder="Paste portfolio link, Behance, Drive link, etc." style={{ ...S.input, flex: 1 }} />
                                            <button type="button" onClick={handleAddLink} className="btn-ghost" style={{ padding: '0 1.1rem', borderRadius: 8, border: '1px solid var(--peacock-green)', color: 'var(--peacock-green)', fontWeight: 700, fontSize: '0.82rem' }}>Add Link</button>
                                        </div>
                                        <div style={{ marginTop: '0.85rem' }}>
                                            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Added Links</div>
                                            {proposalLinks.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '1.5rem 1rem', background: 'var(--bg-elevated)', borderRadius: 10, border: '1px dashed var(--border-color)' }}>
                                                    <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>🔗</div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>No links added yet</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Add portfolio links or work samples to build trust.</div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                    {proposalLinks.map((link, idx) => (
                                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.7rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                                            <span style={{ flex: 1, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</span>
                                                            <button type="button" onClick={() => handleRemoveLink(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-coral)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <input type="file" id="proposal-file-upload" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />
                                        <label htmlFor="proposal-file-upload" className="btn-ghost" style={{ display: 'block', textAlign: 'center', padding: '1.25rem', borderRadius: 10, border: '1px dashed var(--border-color)', cursor: 'pointer', background: 'var(--bg-elevated)' }}>
                                            <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>⬆️</div>
                                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Click to choose files</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Any file type, multiple allowed</div>
                                        </label>
                                        {proposalFiles.length > 0 && (
                                            <div style={{ marginTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                {proposalFiles.map((f, idx) => (
                                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.7rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                                        <span style={{ flex: 1, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name}</span>
                                                        <button type="button" onClick={() => handleRemoveFile(idx)} style={{ background: 'none', border: 'none', color: 'var(--accent-coral)', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div style={{ padding: '0.85rem 1rem', borderRadius: 10, background: 'rgba(17,94,89,0.06)', border: '1px solid rgba(17,94,89,0.15)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                            <span>🛡️</span>
                            <div>
                                <div style={{ fontWeight: 700, marginBottom: '0.15rem' }}>Keep your proposal professional</div>
                                <div>Mention your experience, relevant skills and how you'll add value to this project.</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="button" onClick={onBack} className="btn-ghost" style={{ padding: '0.75rem 1.5rem', borderRadius: 10 }}>Cancel</button>
                            <button type="submit" disabled={submittingProposal || !canSubmit} className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: 10, opacity: (submittingProposal || !canSubmit) ? 0.6 : 1, cursor: (submittingProposal || !canSubmit) ? 'not-allowed' : 'pointer' }}>
                                {submittingProposal ? <ButtonSpinner label="Sending..." /> : '📨 Send Proposal'}
                            </button>
                        </div>
                    </form>

                    <div className="proposal-summary-desktop">{gigSummary}</div>
                </div>
            </div>
        );
    };

    // A4 — My Proposals. New dedicated view (replaces the old plain "My Gig
    // Works" card grid) with the four tabs bucketed as resolved in the
    // Group 2 investigation:
    //   1. latest linked gig_offers row status='accepted' -> Converted
    //   2. latest offer status='declined'                 -> Declined
    //   3. application.status='discussing' OR latest offer
    //      status='countered'                              -> Chat Started
    //   4. otherwise (status='applied', no offer)          -> Sent
    // "Latest" offer = most recent by created_at, not parent_offer_id
    // chain-walking — confirmed empirically that chains don't reliably
    // link across negotiation rounds (a fresh round can start a new root
    // offer with parent_offer_id null, unlinked to the prior round).
    // Withdrawn applications (status='withdrawn') are excluded from all
    // four tabs entirely — bucket is null and they're filtered out.
    const MyProposalsView = () => {
        const [proposals, setProposals] = useState([]);
        const [loadingProposalsList, setLoadingProposalsList] = useState(true);
        const [activeProposalTab, setActiveProposalTab] = useState('sent');
        const [withdrawingId, setWithdrawingId] = useState(null);

        const loadMyProposals = async () => {
            if (!user) return;
            setLoadingProposalsList(true);
            try {
                const { data: apps, error } = await supabase
                    .from('gig_applications')
                    .select('*')
                    .eq('applicant_id', user.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;

                const gigIds = [...new Set((apps || []).map(a => a.gig_id).filter(Boolean))];
                let gigsMap = {};
                if (gigIds.length) {
                    const { data: gigs } = await supabase.from('gigs').select('*').in('id', gigIds);
                    (gigs || []).forEach(g => { gigsMap[g.id] = g; });
                }

                const appIds = (apps || []).map(a => a.id);
                let latestOfferByApp = {};
                if (appIds.length) {
                    // Ascending order so the last write per key wins — the
                    // most recent offer, matching the empirically-confirmed
                    // "most-recent-by-created_at" rule, not chain-walking.
                    const { data: offers } = await supabase
                        .from('gig_offers')
                        .select('gig_application_id, status, created_at')
                        .in('gig_application_id', appIds)
                        .order('created_at', { ascending: true });
                    (offers || []).forEach(o => { latestOfferByApp[o.gig_application_id] = o; });
                }

                const enriched = (apps || []).map(a => {
                    const latestOffer = latestOfferByApp[a.id] || null;
                    let bucket = null;
                    if (a.status !== 'withdrawn') {
                        if (latestOffer?.status === 'accepted') bucket = 'converted';
                        else if (latestOffer?.status === 'declined') bucket = 'declined';
                        else if (a.status === 'discussing' || latestOffer?.status === 'countered') bucket = 'chatStarted';
                        else bucket = 'sent';
                    }
                    return { ...a, gig: gigsMap[a.gig_id] || null, latestOffer, bucket };
                });

                setProposals(enriched);
            } catch (err) {
                console.error('Failed to load proposals:', err);
                showToast('Failed to load your proposals.', 'error');
            } finally {
                setLoadingProposalsList(false);
            }
        };

        useEffect(() => { loadMyProposals(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

        const handleWithdrawProposal = async (application) => {
            const confirmed = window.confirm(`Withdraw your proposal for "${application.gig?.title || 'this gig'}"? The gig room stays open — this only marks your proposal as withdrawn.`);
            if (!confirmed) return;
            setWithdrawingId(application.id);
            try {
                const { error } = await supabase.from('gig_applications').update({ status: 'withdrawn' }).eq('id', application.id);
                if (error) throw error;
                showToast('Proposal withdrawn.', 'success');
                setProposals(prev => prev.map(p => p.id === application.id ? { ...p, status: 'withdrawn', bucket: null } : p));
            } catch (err) {
                console.error('Failed to withdraw proposal:', err);
                showToast('Failed to withdraw proposal: ' + err.message, 'error');
            } finally {
                setWithdrawingId(null);
            }
        };

        const TABS = [
            { key: 'sent', label: 'Sent' },
            { key: 'chatStarted', label: 'Chat Started' },
            { key: 'declined', label: 'Declined' },
            { key: 'converted', label: 'Converted' },
        ];
        const counts = TABS.reduce((acc, t) => {
            acc[t.key] = proposals.filter(p => p.bucket === t.key).length;
            return acc;
        }, {});
        const visibleProposals = proposals.filter(p => p.bucket === activeProposalTab);

        const STATUS_PILL = {
            sent: { label: 'Sent', bg: 'rgba(245,158,11,0.1)', color: 'var(--accent-gold)' },
            chatStarted: { label: 'Chat Started', bg: 'rgba(59,130,246,0.1)', color: '#2563EB' },
            declined: { label: 'Declined', bg: 'rgba(239,68,68,0.1)', color: 'var(--accent-coral)' },
            converted: { label: 'Converted', bg: 'rgba(16,185,129,0.1)', color: 'var(--peacock-green)' },
        };

        return (
            <div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveProposalTab(t.key)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.4rem',
                                background: activeProposalTab === t.key ? 'var(--peacock-green)' : 'var(--bg-surface)',
                                color: activeProposalTab === t.key ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid', borderColor: activeProposalTab === t.key ? 'var(--peacock-green)' : 'var(--border-color)',
                                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            {t.label}
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, padding: '0 0.3rem', fontSize: '0.68rem', fontWeight: 800,
                                background: activeProposalTab === t.key ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                                color: activeProposalTab === t.key ? '#fff' : 'var(--text-muted)'
                            }}>
                                {counts[t.key]}
                            </span>
                        </button>
                    ))}
                </div>

                {loadingProposalsList ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 2rem' }}>Loading your proposals...</div>
                ) : visibleProposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>Nothing here yet</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                            {activeProposalTab === 'sent' && "Proposals waiting on a response show up here."}
                            {activeProposalTab === 'chatStarted' && "Proposals the poster has engaged with show up here."}
                            {activeProposalTab === 'declined' && "Declined offers show up here."}
                            {activeProposalTab === 'converted' && "Proposals that turned into an accepted offer show up here."}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {visibleProposals.map(p => {
                            const pill = STATUS_PILL[p.bucket];
                            return (
                                <div key={p.id} style={{ ...S.card, gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
                                            <div style={{ fontSize: '1.4rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⚡</div>
                                            <div style={{ minWidth: 0 }}>
                                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.gig?.title || 'Gig no longer available'}</h4>
                                                {p.gig?.category && (
                                                    <span style={{ display: 'inline-block', marginTop: '0.25rem', fontSize: '0.68rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: 20, fontWeight: 600 }}>
                                                        {p.gig.category.split(',')[0].trim()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 999, background: pill.bg, color: pill.color, whiteSpace: 'nowrap' }}>{pill.label}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                        {p.proposed_price != null && <span>₹{Number(p.proposed_price).toLocaleString('en-IN')}</span>}
                                        {p.estimated_days != null && <span>• {p.estimated_days} day{p.estimated_days === 1 ? '' : 's'}</span>}
                                    </div>

                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {p.pitch}
                                    </p>

                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applied {gigTimeAgo(p.created_at)}</div>

                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                        {p.bucket === 'sent' && (
                                            <button
                                                onClick={() => handleWithdrawProposal(p)}
                                                disabled={withdrawingId === p.id}
                                                style={{ padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--accent-coral)', color: 'var(--accent-coral)', cursor: withdrawingId === p.id ? 'not-allowed' : 'pointer', opacity: withdrawingId === p.id ? 0.6 : 1 }}
                                            >
                                                {withdrawingId === p.id ? 'Withdrawing...' : '✈️ Withdraw Proposal'}
                                            </button>
                                        )}
                                        {/* Not part of the A4 mockup's action set, but this is the only
                                            entry point complete_gig_application (real XP-granting flow)
                                            had before this screen replaced the old card grid — removing
                                            it entirely would silently orphan working functionality, so
                                            it's kept here on Converted rows, the only bucket where
                                            "this became real work" is actually true. */}
                                        {p.bucket === 'converted' && (
                                            p.status === 'completed' ? (
                                                <span style={{ padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', color: 'var(--peacock-green)' }}>
                                                    Completed ✓
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={async () => { await handleCompleteGigApplication(p); loadMyProposals(); }}
                                                    disabled={completingGigAppId === p.id}
                                                    className="btn-primary"
                                                    style={{ padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.78rem' }}
                                                >
                                                    {completingGigAppId === p.id ? 'Completing...' : 'Mark Completed ✓'}
                                                </button>
                                            )
                                        )}
                                        {p.gig && (
                                            <button
                                                onClick={() => setViewingGigDetail(p.gig)}
                                                style={{ padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                            >
                                                👁 View Gig
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate(`/messages?id=${p.conversation_id}`)}
                                            disabled={!p.conversation_id}
                                            style={{ marginLeft: 'auto', padding: '0.45rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700, background: 'transparent', border: 'none', color: p.conversation_id ? 'var(--peacock-green)' : 'var(--text-muted)', cursor: p.conversation_id ? 'pointer' : 'not-allowed' }}
                                        >
                                            View Proposal ›
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    // A8 — Proposals on My Gig (poster's view). Full page (replaces the old
    // small "Gig Proposals" modal), row layout per design-references/
    // gig-screens/A8-proposals-on-gig-mobile.png.png. A9 fold-in: tapping a
    // row expands it in place to show the full pitch + portfolio links/
    // files, rather than a separate Proposal Detail screen — per the
    // Group 2 decision that A9 didn't earn its own screen once the room
    // opens instantly anyway.
    const GigProposalsView = ({ gig, onBack }) => {
        const handleExpandToggle = (proposalId) => {
            setExpandedProposalId(prev => prev === proposalId ? null : proposalId);
        };

        return (
            <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                <button onClick={onBack} className="btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: 8, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    ← Back to My Gigs
                </button>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span onClick={onBack} style={{ color: 'var(--peacock-green)', fontWeight: 700, cursor: 'pointer' }}>Earn</span>
                    <span>›</span>
                    <span style={{ color: 'var(--peacock-green)', fontWeight: 700 }}>Gig</span>
                    <span>›</span>
                    <span onClick={onBack} style={{ color: 'var(--peacock-green)', fontWeight: 700, cursor: 'pointer' }}>My Gigs</span>
                    <span>›</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{gig.title}</span>
                    <span>›</span>
                    <span>Proposals</span>
                </div>

                <div style={{ ...S.card, flexDirection: 'row', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: '1.6rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 12, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>⚡</div>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>{gig.title}</h2>
                        <span style={{ display: 'inline-block', marginTop: '0.3rem', fontSize: '0.72rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.6rem', borderRadius: 20, fontWeight: 600 }}>
                            {(gig.category || 'General').split(',')[0].trim()}
                        </span>
                    </div>
                </div>

                {loadingProposals ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 2rem' }}>Loading proposals...</div>
                ) : currentProposals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16 }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>No proposals yet</h3>
                        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Check back soon — applicants will show up here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {currentProposals.map(proposal => {
                            const applicantName = proposal.profiles?.full_name || proposal.profiles?.username || 'Anonymous';
                            const avatarUrl = proposal.profiles?.avatar_url;
                            const initials = applicantName.split(' ').slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '?';
                            const isExpanded = expandedProposalId === proposal.id;
                            const alreadyEngaged = proposal.status !== 'applied';
                            const completedCount = applicantCompletedCounts[proposal.applicant_id] || 0;
                            const links = Array.isArray(proposal.portfolio_links) ? proposal.portfolio_links : [];
                            const files = Array.isArray(proposal.portfolio_files) ? proposal.portfolio_files : [];

                            return (
                                <div key={proposal.id} style={S.card}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => handleExpandToggle(proposal.id)}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                            {avatarUrl ? (
                                                <img src={avatarUrl} alt={applicantName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                            ) : (
                                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-mint)', color: 'var(--peacock-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                                                    {initials}
                                                </div>
                                            )}
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicantName}</div>
                                                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{completedCount} completed gig{completedCount === 1 ? '' : 's'}</div>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>⌄</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.6rem' }}>
                                        {proposal.proposed_price != null && <span>₹{Number(proposal.proposed_price).toLocaleString('en-IN')}</span>}
                                        {proposal.estimated_days != null && <span>• {proposal.estimated_days} day{proposal.estimated_days === 1 ? '' : 's'}</span>}
                                        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontWeight: 400 }}>{gigTimeAgo(proposal.created_at)}</span>
                                    </div>

                                    <p style={{
                                        margin: '0.6rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                        ...(isExpanded ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' })
                                    }}>
                                        {proposal.pitch}
                                    </p>

                                    {isExpanded && (links.length > 0 || files.length > 0) && (
                                        <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {links.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.4rem' }}>Portfolio Links</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                        {links.map((link, idx) => (
                                                            <a key={idx} href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '0.8rem', color: 'var(--peacock-green)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                🔗 {link}
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {files.length > 0 && (
                                                <div>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '0.4rem' }}>Attached Files</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                        {files.map((file, idx) => (
                                                            <ProposalFileLink key={idx} file={file} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.85rem' }} onClick={e => e.stopPropagation()}>
                                        {alreadyEngaged ? (
                                            <button onClick={() => navigate(`/messages?id=${proposal.conversation_id}`)} disabled={!proposal.conversation_id} className="btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.8rem', border: '1px solid var(--border-color)', flex: 1 }}>
                                                Message
                                            </button>
                                        ) : (
                                            <button onClick={() => handleDiscuss(proposal.id, proposal.conversation_id)} disabled={!proposal.conversation_id} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.8rem', flex: 1 }}>
                                                Start Chat
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {withdrawnProposalCount > 0 && (
                    <p style={{ textAlign: 'center', margin: '1rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {withdrawnProposalCount} proposal{withdrawnProposalCount === 1 ? '' : 's'} withdrawn
                    </p>
                )}
            </div>
        );
    };

    return (
        <div style={S.page}>

            {/* Header row — plain title + subtext left, real "Your Earnings" card
                pinned top-right (design-references/Mobile/Earn-tab.png). No hero
                banner here — that treatment isn't in the reference. */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 2rem 0' }}>
                <div className="earn-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'nowrap', marginBottom: '1.5rem' }}>
                    <div style={{ minWidth: 0, flex: '1 1 0%' }}>
                        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, margin: '0 0 0.35rem 0' }}>Earn</h1>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, fontSize: '0.9rem' }}>
                            Find jobs, gigs and opportunities that match your skills.
                        </p>
                    </div>
                    <Link to="/earnings" style={{ textDecoration: 'none', flexShrink: 0, background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', borderRadius: 14, padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--peacock-green)' }}>Your Earnings</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--peacock-green)' }}>₹{totalEarned.toLocaleString('en-IN')}</div>
                        </div>
                        <span style={{ color: 'var(--peacock-green)', fontSize: '1.1rem' }}>›</span>
                    </Link>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 2rem 3rem' }}>

                {/* 1. MAIN CATEGORY GRID — 2x2 cards, not a pill row
                    (design-references/Mobile/Earn-tab.png) */}
                {!viewingJob && !viewingGigDetail && !viewingGigStatus && !selectedGig && !viewingGigProposals && (
                    <div className="earn-category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { id: 'jobs', icon: '💼', iconBg: 'var(--bg-mint)', title: 'Jobs', desc: 'Find freelance & full-time jobs' },
                            { id: 'gigs', icon: '⚡', iconBg: 'rgba(217,119,6,0.12)', title: 'Gigs', desc: 'Offer your skills & get hired' },
                            { id: 'marketplace', icon: '🛒', iconBg: 'rgba(99,102,241,0.12)', title: 'Student Marketplace', desc: 'Buy & sell books, notes & more' },
                            { id: 'challenges', icon: '🏆', iconBg: 'rgba(217,119,6,0.12)', title: 'Challenges', desc: 'Participate & win exciting rewards' },
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setActiveMainTab(cat.id); setSearch(''); }}
                                style={{
                                    textAlign: 'left',
                                    background: 'var(--bg-surface)',
                                    border: activeMainTab === cat.id ? '2px solid var(--peacock-green)' : '1px solid var(--border-color)',
                                    borderBottom: activeMainTab === cat.id ? '4px solid var(--peacock-green)' : '1px solid var(--border-color)',
                                    borderRadius: 14,
                                    padding: '1rem 0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ width: 40, height: 40, borderRadius: '50%', background: cat.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' }}>{cat.icon}</span>
                                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>{cat.title}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{cat.desc}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── JOBS TAB ── */}
                {activeMainTab === 'jobs' && (
                    <div>
                        {viewingJob ? (
                            <JobDetailView job={viewingJob} onBack={() => setViewingJob(null)} />
                        ) : (
                            <>
                                {/* Search + filter toggle — reference shows a search bar with a
                                    separate filter icon button, not the sub-tab chips and dropdowns
                                    expanded by default. Those now live behind the filter icon. */}
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: showJobFilters ? '1rem' : '2rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <input
                                            type="text" value={search} onChange={e => setSearch(e.target.value)}
                                            placeholder="🔍 Search jobs, gigs, skills or companies..."
                                            style={S.input}
                                        />
                                    </div>
                                    <button
                                        onClick={() => setShowJobFilters(v => !v)}
                                        aria-label="Filters"
                                        style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 10, border: '1px solid var(--border-color)', background: showJobFilters ? 'var(--bg-mint)' : 'var(--bg-surface)', color: 'var(--peacock-green)', fontSize: '1.1rem', cursor: 'pointer' }}
                                    >
                                        ⚙️
                                    </button>
                                </div>

                                {showJobFilters && (
                                    <div style={{ ...S.card, marginBottom: '2rem', gap: '1.25rem' }}>
                                        <div>
                                            <label style={S.label}>Type</label>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {JOB_SUB_TABS.map(tab => (
                                                    <button key={tab} style={S.chip(jobFilter === tab)} onClick={() => setJobFilter(tab)}>{tab}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                            <FilterSelect label="Experience" value={jobAdvancedFilters.experience} onChange={v => setJobAdvancedFilters(p => ({...p, experience: v}))} options={['All', 'Entry Level', '1-2 Years', '3+ Years']} />
                                            <FilterSelect label="Salary" value={jobAdvancedFilters.salary} onChange={v => setJobAdvancedFilters(p => ({...p, salary: v}))} options={['All', 'Paid', 'Unpaid/Equity']} />
                                            <FilterSelect label="Category" value={jobAdvancedFilters.category} onChange={v => setJobAdvancedFilters(p => ({...p, category: v}))} options={['All', 'Engineering', 'Design', 'Marketing', 'Sales', 'Product', 'Other']} />
                                            <FilterSelect label="Company" value={jobAdvancedFilters.company} onChange={v => setJobAdvancedFilters(p => ({...p, company: v}))} options={jobCompanyOptions} />
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem' }}>
                                                <input type="checkbox" checked={jobAdvancedFilters.remote} onChange={e => setJobAdvancedFilters(p => ({...p, remote: e.target.checked}))} />
                                                Remote Only
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Recommended for you — real "featured" jobs (jobs.featured),
                                    same data source the grid below uses, just surfaced first. */}
                                {!loadingJobs && displayedJobs.some(j => j.featured) && (
                                    <div style={{ marginBottom: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Recommended for you</h2>
                                        </div>
                                        {(() => {
                                            const job = displayedJobs.find(j => j.featured);
                                            return (
                                                <div style={{ ...S.card, cursor: 'pointer', border: '1px solid var(--border-mint)', background: 'var(--bg-mint)' }} onClick={() => setViewingJob(job)}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(217,119,6,0.15)', color: 'var(--accent-gold)', padding: '0.2rem 0.55rem', borderRadius: 20 }}>🔥 Hot</span>
                                                        <SaveButton itemType="job" itemId={job.id} user={user} style={{ padding: '0.4rem', borderRadius: 8, border: 'none', background: 'transparent' }} />
                                                    </div>
                                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{job.title}</h3>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--peacock-green)', fontWeight: 700, margin: 0 }}>{job.company} · {job.location || 'Remote'}</p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--peacock-green)' }}>💰 {job.compensation || 'Negotiable'}</span>
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recent'}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Latest Opportunities */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Latest Opportunities</h2>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>{displayedJobs.length} job{displayedJobs.length === 1 ? '' : 's'} found</p>
                                    </div>
                                </div>

                                {/* Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>

                                    {loadingJobs ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 2rem' }}>
                                            <div className="spinner" style={{ margin: '0 auto 1rem', width: 30, height: 30, border: '3px solid var(--peacock-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                            Loading jobs...
                                        </div>
                                    ) : displayedJobs.length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16 }}>
                                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💼</div>
                                            <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>No jobs found</h3>
                                            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Try adjusting your search or filters.</p>
                                        </div>
                                    ) : (
                                        displayedJobs.map(job => (
                                            <div key={job.id} style={{ ...S.card, cursor: 'pointer', padding: '1.1rem', gap: '0.5rem' }} onClick={() => setViewingJob(job)}>
                                                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                                                    <span style={{ fontSize: '1.4rem', background: 'var(--bg-elevated)', borderRadius: 10, width: 42, height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                                        {job.companies?.logo_url ? (
                                                            <img src={job.companies.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                        ) : (job.logo || '🏢')}
                                                    </span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.15rem 0', overflowWrap: 'anywhere' }}>{job.title}</h3>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--peacock-green)', fontWeight: 700, margin: '0 0 0.4rem 0' }}>{job.companies?.name || job.company}</p>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '0.2rem 0.55rem', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                                                                📍 {job.location || 'Remote'}
                                                            </span>
                                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '0.2rem 0.55rem', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                                                                💼 {job.job_type || 'Full-Time'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <SaveButton itemType="job" itemId={job.id} user={user} style={{ flexShrink: 0 }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 'calc(42px + 0.85rem)' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--peacock-green)' }}>{job.compensation || 'Negotiable'}</span>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Recent'}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── GIG WORK TAB ── */}
                {activeMainTab === 'gigs' && (
                    <div>
                        {selectedGig ? (
                            <SendProposalView gig={selectedGig} onBack={() => setSelectedGig(null)} />
                        ) : viewingGigProposals ? (
                            <GigProposalsView gig={viewingGigProposals} onBack={() => { setViewingGigProposals(null); setExpandedProposalId(null); }} />
                        ) : viewingGigStatus ? (
                            <GigStatusView
                                gig={viewingGigStatus}
                                onBack={() => setViewingGigStatus(null)}
                                onEditResubmit={handleEditResubmit}
                                onDelete={handleDeleteGig}
                            />
                        ) : viewingGigDetail ? (
                            <GigDetailView gig={viewingGigDetail} onBack={() => setViewingGigDetail(null)} />
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                                    <button onClick={() => { if (!user) { navigate('/login'); return; } setActiveMainTab('post-gig'); }}
                                        className="btn-primary" style={{ padding: '0.7rem 1.5rem', fontSize: '0.88rem', borderRadius: 10 }}>
                                        + Post a Gig
                                    </button>
                                </div>
                                {/* Categories */}
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {GIG_CATEGORIES.map(cat => (
                                        <button key={cat} style={S.chip(gigAdvancedFilters.category === cat)} onClick={() => setGigAdvancedFilters(p => ({...p, category: cat}))}>{cat}</button>
                                    ))}
                                </div>

                                {/* Filters */}
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem', alignItems: 'flex-end' }}>
                                    <div style={{ flex: '1 1 250px' }}>
                                        <input 
                                            type="text" value={search} onChange={e => setSearch(e.target.value)} 
                                            placeholder="🔍 Search freelance gigs, skills, clients..." 
                                            style={S.input} 
                                        />
                                    </div>
                                    <FilterSelect label="Budget" value={gigAdvancedFilters.budget} onChange={v => setGigAdvancedFilters(p => ({...p, budget: v}))} options={['All', 'Under ₹1k', '₹1k - ₹5k', '₹5k+']} />
                                    <FilterSelect label="Experience" value={gigAdvancedFilters.experience} onChange={v => setGigAdvancedFilters(p => ({...p, experience: v}))} options={['All', 'Beginner', 'Intermediate', 'Expert']} />
                                    
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setGigScope('all')} style={{ padding: '0.5rem 1rem', borderRadius: 10, background: gigScope === 'all' ? 'var(--peacock-green)' : 'var(--bg-surface)', color: gigScope === 'all' ? '#fff' : 'var(--text-secondary)', border: '1px solid', borderColor: gigScope === 'all' ? 'var(--peacock-green)' : 'var(--border-color)', fontSize: '0.8rem', fontWeight: 600 }}>All Gigs</button>
                                        <button onClick={() => setGigScope('my-listings')} style={{ padding: '0.5rem 1rem', borderRadius: 10, background: gigScope === 'my-listings' ? 'var(--peacock-green)' : 'var(--bg-surface)', color: gigScope === 'my-listings' ? '#fff' : 'var(--text-secondary)', border: '1px solid', borderColor: gigScope === 'my-listings' ? 'var(--peacock-green)' : 'var(--border-color)', fontSize: '0.8rem', fontWeight: 600 }}>My Listings</button>
                                        <button
                                            onClick={() => setGigScope('needs-attention')}
                                            style={{ padding: '0.5rem 1rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.4rem', background: gigScope === 'needs-attention' ? 'var(--peacock-green)' : 'var(--bg-surface)', color: gigScope === 'needs-attention' ? '#fff' : 'var(--text-secondary)', border: '1px solid', borderColor: gigScope === 'needs-attention' ? 'var(--peacock-green)' : 'var(--border-color)', fontSize: '0.8rem', fontWeight: 600 }}
                                        >
                                            Needs Attention
                                            {needsAttentionCount > 0 && (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, padding: '0 0.3rem', fontSize: '0.68rem', fontWeight: 800,
                                                    background: gigScope === 'needs-attention' ? 'rgba(255,255,255,0.25)' : 'rgba(245,158,11,0.15)',
                                                    color: gigScope === 'needs-attention' ? '#fff' : '#B45309'
                                                }}>
                                                    {needsAttentionCount}
                                                </span>
                                            )}
                                        </button>
                                        <button onClick={() => setGigScope('my-gig-works')} style={{ padding: '0.5rem 1rem', borderRadius: 10, background: gigScope === 'my-gig-works' ? 'var(--peacock-green)' : 'var(--bg-surface)', color: gigScope === 'my-gig-works' ? '#fff' : 'var(--text-secondary)', border: '1px solid', borderColor: gigScope === 'my-gig-works' ? 'var(--peacock-green)' : 'var(--border-color)', fontSize: '0.8rem', fontWeight: 600 }}>My Gig Works</button>
                                    </div>
                                </div>

                                {/* My Gig Works entry point now renders the full A4 My Proposals
                                    view (four computed tabs) instead of the old plain card grid. */}
                                {gigScope === 'my-gig-works' ? (
                                    <MyProposalsView />
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                        {loadingGigs ? (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 2rem' }}>
                                                <div className="spinner" style={{ margin: '0 auto 1rem', width: 30, height: 30, border: '3px solid var(--peacock-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                Loading freelance gigs...
                                            </div>
                                        ) : displayedGigs.length === 0 ? (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16 }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{gigScope === 'needs-attention' ? '✅' : '⚡'}</div>
                                                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>{gigScope === 'needs-attention' ? "You're all caught up" : 'No gigs found'}</h3>
                                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
                                                    {gigScope === 'needs-attention' ? 'Nothing pending review or needing changes right now.' : 'Be the first to post a gig in this category!'}
                                                </p>
                                            </div>
                                        ) : (
                                            displayedGigs.map(gig => {
                                                const budgetVal = gig.price ? Number(gig.price) : 1000;
                                                const isRejected = gig.status === 'rejected';
                                                const isPending = !gig.verified && !isRejected;
                                                const isOwnGig = Boolean(user && gig.posted_by === user.id);
                                                const accentColor = isRejected ? 'var(--accent-coral)' : isPending ? 'var(--accent-gold)' : 'var(--peacock-green)';

                                                return (
                                                    <div id={`gig-card-${gig.id}`} key={gig.id}
                                                        style={{
                                                            ...S.card, cursor: 'pointer',
                                                            borderLeft: `4px solid ${accentColor}`,
                                                            background: isRejected ? 'rgba(239,68,68,0.03)' : isPending ? 'rgba(245,158,11,0.03)' : 'var(--bg-surface)'
                                                        }}
                                                        onClick={() => {
                                                            // A gig's poster viewing their own pending_review/rejected
                                                            // gig gets the Gig Status screen (A7), not the public
                                                            // GigDetailView — that view assumes a live, applyable gig.
                                                            if (isOwnGig && (gig.status === 'pending_review' || gig.status === 'rejected')) {
                                                                setViewingGigStatus(gig);
                                                            } else {
                                                                setViewingGigDetail(gig);
                                                            }
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span style={{ fontSize: '1.75rem' }}>⚡</span>
                                                            </div>
                                                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: accentColor }}>
                                                                ₹{budgetVal.toLocaleString('en-IN')}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.25rem 0', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{gig.title}</h3>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, margin: 0 }}>
                                                                {gig.client_name || 'Student'} · {gig.condition || '7 Days'}
                                                            </p>
                                                        </div>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                            {gig.description}
                                                        </p>
                                                        
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', margin: '0.25rem 0' }}>
                                                            {(gig.category || 'General').split(',').map(s => (
                                                                <span key={s} style={{ fontSize: '0.7rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.2rem 0.5rem', borderRadius: 6 }}>
                                                                    {s.trim()}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {isOwnGig ? (
                                                            <div style={{ marginTop: '0.5rem' }}>
                                                                {gig.status === 'rejected' ? (
                                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: 'var(--accent-coral)' }}>
                                                                        🔴 Rejected — Needs Your Attention
                                                                    </span>
                                                                ) : gig.status === 'pending_review' ? (
                                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: 8, background: 'rgba(245,158,11,0.1)', color: 'var(--accent-gold)' }}>
                                                                        🟡 Pending Admin Approval
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: 8, background: 'var(--bg-mint)', color: 'var(--peacock-green)' }}>
                                                                        🟢 Your Live Listing
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                                                <SaveButton itemType="gig" itemId={gig.id} user={user} style={{ padding: '0.6rem', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                                                                <button onClick={(e) => { e.stopPropagation(); setViewingGigDetail(gig); }} className="btn-primary" style={{ width: '100%', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem' }}>
                                                                    View & Apply →
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── STUDENT MARKETPLACE TAB ── */}
                {activeMainTab === 'marketplace' && (
                    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '4rem 2rem', position: 'relative' }}>
                            {/* Decorative background blobs */}
                            <div style={{ position: 'absolute', top: -50, left: -50, width: 200, height: 200, background: 'var(--peacock-green)', opacity: 0.05, borderRadius: '50%', filter: 'blur(40px)' }}></div>
                            <div style={{ position: 'absolute', bottom: -50, right: -50, width: 250, height: 250, background: '#F59E0B', opacity: 0.05, borderRadius: '50%', filter: 'blur(50px)' }}></div>
                            
                            <div style={{ position: 'relative', zIndex: 1, maxWidth: 600 }}>
                                <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 800, background: 'var(--bg-mint)', color: 'var(--peacock-green)', border: '1px solid var(--border-mint)', padding: '0.3rem 0.8rem', borderRadius: 20, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Coming Soon
                                </span>
                                
                                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🛒</div>
                                
                                <h2 style={{ fontSize: '2.25rem', fontWeight: 900, margin: '0 0 1rem 0' }}>Student Marketplace</h2>
                                
                                <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
                                    Buy and sell textbooks, gadgets, notes, stationery and digital resources securely within your college. Zero platform fees!
                                </p>
                                
                                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
                                    <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>Join the waitlist for early access</h4>
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => handleNotifyMe('student_marketplace')} 
                                        disabled={submittingFeatures['student_marketplace']}
                                        style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem', borderRadius: 10 }}
                                    >
                                        {submittingFeatures['student_marketplace'] ? 'Adding to list...' : 'Get Notified on Launch 🔔'}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Feature Preview Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', width: '100%', maxWidth: 900, position: 'relative', zIndex: 1 }}>
                                {[
                                    { icon: '🛡️', title: 'Verified Students', desc: 'Trade safely with verified campus peers' },
                                    { icon: '🔒', title: 'Secure Chat', desc: 'Negotiate and arrange meetups safely' },
                                    { icon: '📚', title: 'Buy & Sell Books', desc: 'Find course materials for cheap' },
                                    { icon: '💻', title: 'Digital Assets', desc: 'Sell premium notes and study guides' }
                                ].map((feat, i) => (
                                    <div key={i} style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1.5rem', textAlign: 'left' }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{feat.icon}</div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 800, fontSize: '0.95rem' }}>{feat.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{feat.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── CHALLENGES TAB (Coming Soon) ── */}
                {activeMainTab === 'challenges' && (
                    <div style={{ background: 'var(--bg-surface)', padding: '3rem 2rem', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏆</div>
                        <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.4rem', fontWeight: 800 }}>Challenges</h2>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Challenges are paid competitions and campaigns — like naming contests or marketing challenges — where winners earn cash prizes. Coming soon.
                        </p>
                    </div>
                )}

                {/* ── POST A GIG TAB ── */}
                {activeMainTab === 'post-gig' && (
                    <div style={{ maxWidth: 620, margin: '0 auto' }}>
                        <div style={{ ...S.card, padding: '2rem', gap: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>{editingGigId ? 'Edit Your Gig' : 'Post a Freelance Gig'}</h2>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                                    {editingGigId
                                        ? "Update your listing based on the admin's feedback, then resubmit for review."
                                        : 'Outsource simple tasks, tech development, or design work to campus peers. Get it done fast. +50 XP!'}
                                </p>
                            </div>
                            
                            <form onSubmit={handlePostGigSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                                <div>
                                    <label style={S.label}>Gig Listing Title</label>
                                    <input type="text" value={gigForm.title} onChange={e => setGigForm({...gigForm, title: e.target.value})} placeholder="e.g. Build simple portfolio page in HTML/CSS" style={S.input} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={S.label}>Budget (₹)</label>
                                        <input type="number" value={gigForm.budget} onChange={e => setGigForm({...gigForm, budget: e.target.value})} placeholder="e.g. 3500" style={S.input} required />
                                    </div>
                                    <div>
                                        <label style={S.label}>Timeframe (Days)</label>
                                        <input type="number" value={gigForm.deadline} onChange={e => setGigForm({...gigForm, deadline: e.target.value})} placeholder="e.g. 7" style={S.input} required />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={S.label}>Client Name / Company</label>
                                        <input type="text" value={gigForm.client} onChange={e => setGigForm({...gigForm, client: e.target.value})} placeholder="e.g. Calicut Bakery" style={S.input} />
                                    </div>
                                    <div>
                                        <label style={S.label}>Skills Required (comma-separated)</label>
                                        <input type="text" value={gigForm.skills} onChange={e => setGigForm({...gigForm, skills: e.target.value})} placeholder="e.g. Figma, Canva" style={S.input} required />
                                    </div>
                                </div>
                                <div>
                                    <label style={S.label}>Category</label>
                                    <select
                                        value={gigForm.categoryId}
                                        onChange={e => setGigForm({...gigForm, categoryId: e.target.value})}
                                        style={S.input}
                                        disabled={gigCategories.length === 0}
                                    >
                                        <option value="">
                                            {gigCategories.length === 0 ? 'No categories set up yet' : 'Select a category (optional)'}
                                        </option>
                                        {gigCategories.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={S.label}>Gig Description & Scope</label>
                                    <textarea rows={4} value={gigForm.desc} onChange={e => setGigForm({...gigForm, desc: e.target.value})} placeholder="Describe the deliverables in detail. What skills should the student have?" style={{ ...S.input, resize: 'vertical', fontFamily: 'inherit' }} required />
                                    <div style={{ marginTop: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: gigForm.desc.trim().length >= GIG_DESCRIPTION_MIN_LENGTH ? 'var(--peacock-green)' : 'var(--text-muted)' }}>
                                        {gigForm.desc.trim().length} / {GIG_DESCRIPTION_MIN_LENGTH} characters minimum
                                        {gigForm.desc.trim().length >= GIG_DESCRIPTION_MIN_LENGTH ? ' ✓' : ''}
                                    </div>
                                </div>
                                {gigAutoApprove && !editingGigId ? (
                                    <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.8rem', color: 'var(--peacock-green)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontWeight: 600 }}>
                                        <span>⚡</span>
                                        <span>You're a trusted poster — this gig goes live immediately, no review wait.</span>
                                    </div>
                                ) : (
                                    <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(17,94,89,0.06)', border: '1px solid rgba(17,94,89,0.15)', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        <span>⏳</span>
                                        <span>{editingGigId ? 'Resubmitted gigs are reviewed again before going live — usually within 2 hours.' : 'All gigs are reviewed before going live — usually within 2 hours.'}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={() => { setEditingGigId(null); setGigForm({ title: '', client: '', budget: '', deadline: '', skills: '', desc: '', categoryId: '' }); setActiveMainTab('gigs'); }} className="btn-ghost" style={{ padding: '0.75rem 1.5rem', borderRadius: 10 }}>Cancel</button>
                                    <button type="submit" disabled={postingGig || gigForm.desc.trim().length < GIG_DESCRIPTION_MIN_LENGTH} className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: 10, opacity: (postingGig || gigForm.desc.trim().length < GIG_DESCRIPTION_MIN_LENGTH) ? 0.6 : 1, cursor: (postingGig || gigForm.desc.trim().length < GIG_DESCRIPTION_MIN_LENGTH) ? 'not-allowed' : 'pointer' }}>
                                        {postingGig
                                            ? <ButtonSpinner label="Submitting..." />
                                            : editingGigId
                                                ? 'Resubmit for Review'
                                                : (gigAutoApprove ? 'Post Gig ⚡' : 'Submit for Review')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Application Modals and Proposal Modals retained exactly as is... */}
            {/* ── APPLY JOB MODAL ────────────────────────── */}
            {applyingJob && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 24, width: 680, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.3s ease-out', boxShadow: 'var(--shadow-xl)', maxHeight: '90vh', overflowY: 'auto' }}>
                        {!appSuccess ? (
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, fontSize: '1.35rem' }}>Apply: {applyingJob.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Complete the application form for {applyingJob.company}</p>
                                
                                <form onSubmit={handleSubmitJobApplication} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-color)', padding: '1.5rem', borderRadius: 12, textAlign: 'center' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                                        <h4 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>Upload your Resume / CV</h4>
                                        <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, DOCX up to 5MB</p>
                                        <input type="file" id="cv-upload" accept=".pdf,.doc,.docx" onChange={handleCvUpload} style={{ display: 'none' }} />
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <label htmlFor="cv-upload" className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' }}>
                                                {uploadingCv ? 'Uploading...' : 'Choose File'}
                                            </label>
                                            {appCvUrl && (
                                                <button type="button" onClick={handleViewOwnCv} className="btn-ghost" style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.85rem' }}>View Selected</button>
                                            )}
                                        </div>
                                        {appCvFile && <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--peacock-green)', fontWeight: 600 }}>✓ {appCvFile.name}</div>}
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Availability (Hours/Week or Notice Period)</label>
                                        <input type="text" value={appAvailability} onChange={e => setAppAvailability(e.target.value)} placeholder="e.g. 20 hours/week, can start immediately" style={S.input} required />
                                    </div>

                                    {applyingJob.application_questions && applyingJob.application_questions.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(17,94,89,0.03)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(17,94,89,0.1)' }}>
                                            <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--peacock-green)', fontSize: '0.95rem' }}>Employer Questionnaire</h4>
                                            {applyingJob.application_questions.map((q, idx) => (
                                                <div key={idx}>
                                                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>{q}</label>
                                                    <textarea rows={2} value={appAnswers[q] || ''} onChange={e => handleAnswerChange(q, e.target.value)} placeholder="Your answer..." style={{ ...S.input, resize: 'vertical' }} required />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                                        <button type="button" onClick={() => setApplyingJob(null)} className="btn-ghost" style={{ padding: '0.65rem 1.25rem', borderRadius: 8 }} disabled={submittingApp}>Cancel</button>
                                        <button type="submit" disabled={submittingApp || uploadingCv} className="btn-primary" style={{ flex: 1, padding: '0.65rem', borderRadius: 8 }}>
                                            {submittingApp ? <ButtonSpinner label="Submitting..." /> : 'Submit Application ✓'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--peacock-green)', margin: '0 0 0.5rem 0' }}>Application Submitted!</h4>
                                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                                    Your application has been submitted to <strong>{applyingJob.company}</strong>. We will notify you once the hiring team reviews your profile.
                                </p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                    <button onClick={handleViewOwnCv} className="btn-ghost" style={{ padding: '0.65rem 1.25rem', borderRadius: 10, fontSize: '0.88rem' }}>View My CV</button>
                                    <button onClick={() => setApplyingJob(null)} className="btn-primary" style={{ padding: '0.65rem 2rem', borderRadius: 10, fontSize: '0.88rem' }}>Close</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Fallback success overlay — only reached if a Gig Room's
                conversation_id somehow isn't available right after insert
                (the DB trigger has been 100% reliable in testing, this is
                a safety net, not the normal path). SendProposalView itself
                replaced the old always-a-modal apply flow above. */}
            {proposalSuccess && !selectedGig && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, width: 420, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.3s ease-out', boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: 'var(--peacock-green)' }}>Proposal Sent!</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Your proposal has been sent securely.</p>
                        <button onClick={() => setProposalSuccess(false)} className="btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: 10 }}>Got it</button>
                    </div>
                </div>
            )}

            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}
