import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';
import { getCvSignedUrl } from '../utils/cvStorage.js';
import { logUserActivity } from '../utils/activityLogger.js';
import SaveButton from '../components/SaveButton.jsx';

// Jobs and gigs are both fetched from Supabase (see loadJobs / loadGigs below).

const CATEGORIES = ['All', 'Textbooks', 'Notes', 'Services', 'Gigs', 'Digital'];
const GIG_CATEGORIES = ['All', 'Graphic Design', 'Development', 'Writing', 'Marketing', 'Video Editing', 'Photography', 'Voice Over', 'Translation', 'AI', 'Tutoring', 'Business', 'Other'];
const JOB_SUB_TABS = ['All Jobs', 'Internships', 'Part-Time', 'Full-Time', 'Remote', 'Campus Placement', 'Government'];

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

    // Search & filters
    const [search, setSearch]             = useState('');
    const [jobFilter, setJobFilter]       = useState('All Jobs');
    
    // Extended Job Filters
    const [jobAdvancedFilters, setJobAdvancedFilters] = useState({
        experience: 'All', salary: 'All', category: 'All', location: 'All', remote: false, verifiedOnly: false, postedToday: false
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
    const [proposalsOpen, setProposalsOpen] = useState(false);
    const [currentProposals, setCurrentProposals] = useState([]);
    const [loadingProposals, setLoadingProposals] = useState(false);
    const [proposalCounts, setProposalCounts] = useState({});
    const [completingGigAppId, setCompletingGigAppId] = useState(null);
    const [resolvingChat, setResolvingChat] = useState(null);
    
    // Interactive gig proposals
    const [selectedGig, setSelectedGig]   = useState(null);
    const [proposalMsg, setProposalMsg]   = useState('');
    const [submittingProposal, setSubmittingProposal] = useState(false);
    const [proposalSuccess, setProposalSuccess] = useState(false);

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
            const { data: existing } = await supabase
                .from('notify_subscribers')
                .select('id')
                .eq('user_id', user.id)
                .eq('feature_key', featureKey)
                .single();

            if (existing) {
                showToast("You're already on the list!", 'info');
                return;
            }

            const profileStr = localStorage.getItem(`profile_${user.id}`);
            const profile = profileStr ? JSON.parse(profileStr) : null;

            const { error } = await supabase.from('notify_subscribers').insert({
                user_id: user.id,
                email: user.email || (profile?.email) || '',
                feature_key: featureKey
            });

            if (error) throw error;
            showToast("You're on the list! We'll email you when this launches.", 'success');
        } catch (err) {
            console.error(err);
            showToast("Failed to subscribe.", 'error');
        } finally {
            setSubmittingFeatures(prev => ({ ...prev, [featureKey]: false }));
        }
    };

    const loadJobs = async () => {
        setLoadingJobs(true);
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
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

    const loadGigs = async () => {
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
            if (data) setGigsList(data);
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
        });
        loadJobs();
        loadGigs();
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
        const matchRem = !jobAdvancedFilters.remote || j.location?.toLowerCase().includes('remote') || j.remote_only;
        const matchVer = !jobAdvancedFilters.verifiedOnly || j.verified;
        
        let matchToday = true;
        if (jobAdvancedFilters.postedToday) {
            const today = new Date();
            const postedDate = new Date(j.created_at);
            matchToday = postedDate.toDateString() === today.toDateString();
        }

        return matchTab && matchSearch && matchCat && matchExp && matchLoc && matchRem && matchVer && matchToday;
    });

    // Extended Gigs Filtering
    const displayedGigs = gigsList.filter(g => {
        if (gigScope === 'my-listings') {
            return user && g.posted_by === user.id;
        }
        
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

    const handlePostGigSubmit = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        setPostingGig(true);

        // "Skills Required" still feeds the legacy free-text `category` column
        // unchanged — that's what the public gig-card chips (Earn.jsx list view)
        // read, and this fix isn't touching that display. category_id is the
        // new FK column the admin panel actually reads; gig_categories has 0
        // rows right now, so this will be null until real categories exist —
        // flagged to the user, not seeded here.
        const budgetValue = Number(gigForm.budget) || 1000;
        const payload = {
            title: gigForm.title?.trim(),
            client_name: gigForm.client?.trim() || user.email.split('@')[0],
            location: 'Remote',
            price: budgetValue,
            budget_min: budgetValue,
            budget_max: budgetValue,
            condition: (gigForm.deadline || '7') + ' Days',
            category: gigForm.skills?.trim() || 'General',
            category_id: gigForm.categoryId || null,
            description: gigForm.desc?.trim(),
            status: 'Live',
            verified: false, // starts as unverified, needs admin approval!
            posted_by: user.id
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
        showToast('🎉 Freelance gig posted successfully! +50 XP & Gig Pioneer badge!', 'success');
        loadGigs();
    };

    const handleOpenApplyGig = (gig) => {
        if (!user) {
            navigate('/login');
            return;
        }
        setSelectedGig(gig);
        setProposalMsg('');
        setProposalSuccess(false);
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
            showToast('🗑️ Gig deleted.', 'success');
        } catch (err) {
            console.error('Error deleting gig:', err);
            showToast('Failed to delete gig: ' + err.message, 'error');
        } finally {
            setDeletingGigId(null);
        }
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
            setCurrentProposals(data || []);
        } catch (err) {
            console.error('Error loading proposals:', err);
            showToast('Failed to load proposals: ' + (err.message || String(err)), 'error');
            setCurrentProposals([]);
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
            loadGigs();
            loadMyGigWorks(user.id).catch(() => {});
        } catch (err) {
            console.error('Failed to mark filled:', err);
            showToast('Failed to mark gig as filled: ' + (err.message || String(err)), 'error');
        }
    };

    const handleApplyGig = async (e) => {
        e.preventDefault();
        if (!user || !selectedGig) { navigate('/login'); return; }
        if (!proposalMsg.trim()) {
            showToast('Please add a short pitch before submitting.', 'error');
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
                pitch: proposalMsg.trim(),
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
                showToast('🎉 Proposal sent! Redirecting to your messages...', 'success');
                if (gigSnapshot.posted_by) {
                    try {
                        await supabase.rpc('create_notification', {
                            p_user_id: gigSnapshot.posted_by,
                            p_type: 'gig_application',
                            p_title: '💼 New Gig Proposal Received!',
                            p_body: `Someone applied to your gig "${gigSnapshot.title || 'Gig listing'}".`,
                            p_link: '/earn'
                        });
                    } catch (nErr) { console.error(nErr); }
                }

                let conversationId = inserted?.conversation_id || null;
                if (!conversationId && inserted?.id) {
                    const { data: refreshed } = await supabase.from('gig_applications').select('conversation_id').eq('id', inserted.id).single();
                    conversationId = refreshed?.conversation_id || null;
                }

                setSelectedGig(null);
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
                            <button onClick={() => { setProposalsOpen(true); loadProposalsForGig(gig.id); }} className="btn-primary" style={{ padding: '0.65rem 2rem', borderRadius: 8 }}>
                                View Proposals
                            </button>
                        )}
                    </div>
                </div>
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
                {!viewingJob && !viewingGigDetail && (
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
                                                    <span style={{ fontSize: '1.4rem', background: 'var(--bg-elevated)', borderRadius: 10, width: 42, height: 42, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {job.logo || '🏢'}
                                                    </span>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 0.15rem 0', overflowWrap: 'anywhere' }}>{job.title}</h3>
                                                        <p style={{ fontSize: '0.8rem', color: 'var(--peacock-green)', fontWeight: 700, margin: '0 0 0.4rem 0' }}>{job.company}</p>
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
                        {viewingGigDetail ? (
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
                                        <button onClick={() => setGigScope('my-gig-works')} style={{ padding: '0.5rem 1rem', borderRadius: 10, background: gigScope === 'my-gig-works' ? 'var(--peacock-green)' : 'var(--bg-surface)', color: gigScope === 'my-gig-works' ? '#fff' : 'var(--text-secondary)', border: '1px solid', borderColor: gigScope === 'my-gig-works' ? 'var(--peacock-green)' : 'var(--border-color)', fontSize: '0.8rem', fontWeight: 600 }}>My Gig Works</button>
                                    </div>
                                </div>

                                {/* My Gig Works specific view */}
                                {gigScope === 'my-gig-works' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {loadingMyGigWorks ? (
                                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 2rem' }}>Loading your gig applications...</div>
                                        ) : myGigWorks.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16 }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                                                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>No applications yet</h3>
                                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>You haven't submitted proposals for any gigs.</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                                {myGigWorks.map(application => (
                                                    <div key={application.id} style={{ ...S.card, gap: '0.75rem' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                            <div>
                                                                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.35 }}>{application.gigTitle}</h4>
                                                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>by {application.posterName}</p>
                                                            </div>
                                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.25rem 0.55rem', borderRadius: 999, background: application.status === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: application.status === 'completed' ? 'var(--peacock-green)' : 'var(--accent-gold)', border: `1px solid ${application.status === 'completed' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}` }}>
                                                                {application.status === 'completed' ? 'Completed' : application.status === 'rejected' ? 'Rejected' : application.status === 'in_progress' ? 'In Progress' : 'Applied'}
                                                            </span>
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                            <div>Applied on {new Date(application.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                                        </div>
                                                        {['applied', 'in_progress'].includes(application.status) ? (
                                                            <button onClick={() => handleCompleteGigApplication(application)} disabled={completingGigAppId === application.id} className="btn-primary" style={{ width: '100%', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem' }}>
                                                                {completingGigAppId === application.id ? <ButtonSpinner label="Completing..." /> : 'Completed ✓'}
                                                            </button>
                                                        ) : application.status === 'completed' ? (
                                                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--peacock-green)', textAlign: 'center', padding: '0.55rem', borderRadius: 8, background: 'var(--bg-mint)', border: '1px solid var(--border-mint)' }}>Completed ✓</div>
                                                        ) : (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>No action available</div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                                        {loadingGigs ? (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '4rem 2rem' }}>
                                                <div className="spinner" style={{ margin: '0 auto 1rem', width: 30, height: 30, border: '3px solid var(--peacock-green)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                                Loading freelance gigs...
                                            </div>
                                        ) : displayedGigs.length === 0 ? (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 16 }}>
                                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                                                <h3 style={{ margin: '0 0 0.5rem', fontWeight: 800 }}>No gigs found</h3>
                                                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>Be the first to post a gig in this category!</p>
                                            </div>
                                        ) : (
                                            displayedGigs.map(gig => {
                                                const budgetVal = gig.price ? Number(gig.price) : 1000;
                                                const isPending = !gig.verified;
                                                const isOwnGig = Boolean(user && gig.posted_by === user.id);
                                                
                                                return (
                                                    <div id={`gig-card-${gig.id}`} key={gig.id} 
                                                        style={{ 
                                                            ...S.card, cursor: 'pointer',
                                                            borderLeft: `4px solid ${isPending ? 'var(--accent-gold)' : 'var(--peacock-green)'}`,
                                                            background: isPending ? 'rgba(245,158,11,0.03)' : 'var(--bg-surface)'
                                                        }}
                                                        onClick={() => setViewingGigDetail(gig)}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span style={{ fontSize: '1.75rem' }}>⚡</span>
                                                            </div>
                                                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: isPending ? 'var(--accent-gold)' : 'var(--peacock-green)' }}>
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
                                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: 8, background: gig.verified ? 'var(--bg-mint)' : 'rgba(245,158,11,0.1)', color: gig.verified ? 'var(--peacock-green)' : 'var(--accent-gold)' }}>
                                                                    {gig.verified ? '🟢 Your Live Listing' : '🟡 Pending Admin Approval'}
                                                                </span>
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
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Post a Freelance Gig</h2>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                                    Outsource simple tasks, tech development, or design work to campus peers. Get it done fast. +50 XP!
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
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button type="button" onClick={() => setActiveMainTab('gigs')} className="btn-ghost" style={{ padding: '0.75rem 1.5rem', borderRadius: 10 }}>Cancel</button>
                                    <button type="submit" disabled={postingGig} className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: 10 }}>
                                        {postingGig ? <ButtonSpinner label="Publishing..." /> : 'Post Gig Listing ⚡'}
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

            {/* Proposal Modals... */}
            {proposalsOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, width: 680, maxWidth: '100%', padding: '1rem', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Gig Proposals</h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Applicants from gig_applications</p>
                            </div>
                            <button onClick={() => { setProposalsOpen(false); setCurrentProposals([]); }} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer' }}>✕</button>
                        </div>
                        <div style={{ maxHeight: '60vh', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            {loadingProposals ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading proposals...</div>
                            ) : currentProposals.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No proposals yet.</div>
                            ) : (
                                currentProposals.map(proposal => {
                                    const applicantName = proposal.profiles?.full_name || proposal.profiles?.username || 'Anonymous';
                                    const avatarUrl = proposal.profiles?.avatar_url;
                                    const initials = applicantName.split(' ').slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || '?';

                                    return (
                                        <div key={proposal.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '0.8rem', background: 'var(--bg-elevated)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt={applicantName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-mint)', color: 'var(--peacock-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
                                                            {initials}
                                                        </div>
                                                    )}
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{applicantName}</div>
                                                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{new Date(proposal.created_at).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                                {proposal.status === 'applied' ? (
                                                    <button onClick={() => handleDiscuss(proposal.id, proposal.conversation_id)} disabled={!proposal.conversation_id} className="btn-primary" style={{ padding: '0.5rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', flexShrink: 0 }}>
                                                        Discuss
                                                    </button>
                                                ) : (
                                                    <button onClick={() => navigate(`/messages?id=${proposal.conversation_id}`)} disabled={!proposal.conversation_id} className="btn-primary" style={{ padding: '0.5rem 0.8rem', borderRadius: 8, fontSize: '0.78rem', flexShrink: 0 }}>
                                                        Message
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                                {proposal.pitch}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Apply to Gig modal */}
            {selectedGig && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.15)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 20, width: 480, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.3s ease-out', boxShadow: 'var(--shadow-lg)' }}>
                        {!proposalSuccess ? (
                            <>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900 }}>Send Proposal ⚡</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>You are proposing to work on <strong>{selectedGig.title}</strong> for {selectedGig.client_name || 'this client'}.</p>
                                
                                <form onSubmit={handleApplyGig} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Your Pitch</label>
                                        <textarea rows={4} value={proposalMsg} onChange={e => setProposalMsg(e.target.value)} placeholder="Introduce yourself, mention relevant skills, and explain why you're a good fit..." style={{ ...S.input, resize: 'vertical' }} required />
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        <button type="button" onClick={() => setSelectedGig(null)} className="btn-ghost" style={{ padding: '0.65rem 1.25rem', borderRadius: 10 }}>Cancel</button>
                                        <button type="submit" disabled={submittingProposal} className="btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: 10 }}>
                                            {submittingProposal ? <ButtonSpinner label="Sending..." /> : 'Submit Proposal ✈️'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 900, color: 'var(--peacock-green)' }}>Proposal Sent!</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Your pitch has been sent securely. You will be redirected to Messages.</p>
                                <button onClick={() => setSelectedGig(null)} className="btn-primary" style={{ width: '100%', padding: '0.75rem', borderRadius: 10 }}>Got it</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}
