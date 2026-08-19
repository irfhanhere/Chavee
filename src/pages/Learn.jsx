import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SaveButton from '../components/SaveButton.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import useNotifyMe from '../hooks/useNotifyMe.js';
import NotifyMeButton from '../components/NotifyMeButton.jsx';

export default function Learn() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast, showToast, hideToast } = useToast();

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [gamification, setGamification] = useState(null);
    
    // Data states
    const [courses, setCourses] = useState([]);
    const [scholarships, setScholarships] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [resources, setResources] = useState([]);
    const [educationCategories, setEducationCategories] = useState([]);
    const [learningStats, setLearningStats] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    // Tab state: 'overview' | 'courses' | 'certifications' | 'scholarships' | 'resources'
    const { tab } = useParams();
    const validTabs = ['overview', 'courses', 'certifications', 'scholarships', 'resources'];
    const mainTab = validTabs.includes(tab) ? tab : 'overview';
    const { notifiedFeatures, loadingFeatures, toggleNotify } = useNotifyMe(user);

    // Courses filter states
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Courses');
    const [activeLevel, setActiveLevel] = useState('All Levels');
    const [activeLanguage, setActiveLanguage] = useState('All Languages');
    const [activeStatus, setActiveStatus] = useState('Upcoming');
    
    // Scholarships filter states
    const [scholarshipFilters, setScholarshipFilters] = useState({
        state: '',
        country: '',
        education_level: '',
        category: '',
        funding_type: '',
        deadline_status: ''
    });
    
    // Request Course modal states
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestForm, setRequestForm] = useState({ topic: '' });
    const [submittingRequest, setSubmittingRequest] = useState(false);

    // Resources "Notify Me" states
    const [notifyEmail, setNotifyEmail] = useState('');
    const [submittingNotify, setSubmittingNotify] = useState(false);

    // Set page-level SEO meta
    useEffect(() => {
        document.title = 'Education & Scholarships | Chavee';
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.setAttribute('content', 'Explore courses, certifications, and scholarships on Chavee. Your complete student education dashboard.');
    }, []);

    // Removed query parameter effect in favor of React Router params

    // Data Fetching
    useEffect(() => {
        async function fetchAllData() {
            setLoadingData(true);
            
            const { data: sessionData } = await supabase.auth.getSession();
            const sessionUser = sessionData?.session?.user;
            
            if (sessionUser) {
                setUser(sessionUser);
                const localProfile = localStorage.getItem(`profile_${sessionUser.id}`);
                if (localProfile) setProfile(JSON.parse(localProfile));
                const localGamification = localStorage.getItem(`gamification_${sessionUser.id}`);
                if (localGamification) setGamification(JSON.parse(localGamification));
                
                // Fetch learning stats (fail gracefully if table doesn't exist)
                try {
                    const { data: stats } = await supabase.from('learning_stats').select('*').eq('user_id', sessionUser.id).single();
                    setLearningStats(stats || null);
                } catch (e) {
                    setLearningStats(null);
                }
            } else {
                setLearningStats(null);
            }

            // Fetch generic data (fail gracefully)
            try {
                const [
                    { data: cData },
                    { data: sData },
                    { data: certData },
                    { data: catData },
                    { data: rData }
                ] = await Promise.all([
                    supabase.from('courses').select('*').order('created_at', { ascending: false }),
                    supabase.from('scholarships').select('*').order('created_at', { ascending: false }),
                    supabase.from('certifications').select('*').order('created_at', { ascending: false }),
                    supabase.from('education_categories').select('*').order('group_name', { ascending: true }),
                    supabase.from('resources').select('*').order('created_at', { ascending: false })
                ]);
                setCourses(cData ? cData.filter(c => c.status !== 'Draft') : []);
                setScholarships(sData ? sData.filter(s => s.status !== 'Draft') : []);
                setCertifications(certData ? certData.filter(c => c.published !== false) : []);
                setEducationCategories(catData || []);
                setResources(rData ? rData.filter(r => r.published !== false) : []);
            } catch (err) {
                console.error("Error fetching education data:", err);
            }

            // Upcoming Event hero banner — same real query + columns as
            // Dashboard's mobile "Upcoming Event" banner (fail gracefully,
            // no banner renders if none/errored).
            try {
                const { data: evData, error: evError } = await supabase
                    .from('events')
                    .select('*')
                    .in('status', ['live', 'coming_soon', 'Live', 'Coming Soon', 'upcoming', 'Upcoming'])
                    .order('event_date', { ascending: true })
                    .limit(3);
                if (!evError && evData) setUpcomingEvents(evData);
            } catch (err) {
                console.error("Error fetching upcoming events:", err);
            }

            setLoadingData(false);
        }
        fetchAllData();
    }, []);

    // Handlers
    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setSubmittingRequest(true);
        try {
            if (!user) {
                showToast('Please log in to request a course.', 'error');
                return;
            }
            await supabase.from('notify_subscribers').insert({
                user_id: user.id,
                email: user.email,
                feature_key: `course_request:${requestForm.topic}`
            });
            showToast('Course request submitted successfully!', 'success');
            setShowRequestModal(false);
            setRequestForm({ topic: '' });
        } catch (err) {
            console.error(err);
            showToast('Failed to submit request.', 'error');
        } finally {
            setSubmittingRequest(false);
        }
    };

    const handleNotifySubmit = async (e) => {
        e.preventDefault();
        if (!notifyEmail) return;
        setSubmittingNotify(true);
        try {
            const userId = user ? user.id : 'anon';
            await supabase.from('notify_subscribers').insert({
                user_id: userId,
                email: notifyEmail,
                feature_key: 'resources_tab'
            });
            showToast('You will be notified when Resources launch!', 'success');
            setNotifyEmail('');
        } catch (err) {
            console.error(err);
            showToast('Failed to subscribe.', 'error');
        } finally {
            setSubmittingNotify(false);
        }
    };

    const handleTabChange = (tab) => {
        navigate(`/education/${tab}`);
    };

    // Derived State
    const featuredCourses = courses.filter(c => c.is_featured) || [];
    const recommendedCourses = courses.slice(0, 4) || [];
    const topScholarships = scholarships.slice(0, 4) || [];
    const popularTopics = ['Web Development', 'UI/UX Design', 'Data Science', 'Marketing', 'Languages', 'AI/ML'];
    const mapCategoryToGroup = (c) => {
        let rawCategory = 'other';
        if (c.category_id) {
            const cat = educationCategories.find(ec => ec.id === c.category_id);
            if (cat && cat.group_name) rawCategory = cat.group_name.toLowerCase();
        } else if (c.category) {
            rawCategory = c.category.toLowerCase();
        } else if (c.type) {
            rawCategory = c.type.toLowerCase();
        }

        if (rawCategory.includes('skill')) return 'Skill Development';
        if (rawCategory.includes('language')) return 'Language';
        if (rawCategory.includes('tech') || rawCategory.includes('business') || rawCategory.includes('career') || rawCategory.includes('professional')) return 'Professional';
        if (rawCategory.includes('academic')) return 'Academic';
        return 'Other';
    };

    const courseTabs = ['All Courses', 'Skill Development', 'Language', 'Professional', 'Academic', 'Other'];
    const courseCounts = { 'All Courses': courses.length };
    courseTabs.slice(1).forEach(t => courseCounts[t] = 0);
    courses.forEach(c => {
        const mapped = mapCategoryToGroup(c);
        if (courseCounts[mapped] !== undefined) courseCounts[mapped]++;
    });

    const availableLanguages = ['All Languages', ...new Set(courses.map(c => c.language).filter(Boolean))];
    const availableLevels = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

    const upcomingCount = courses.filter(c => c.is_coming_soon).length;
    const liveCount = courses.filter(c => !c.is_coming_soon).length;

    const displayedCourses = courses.filter(c => {
        const mappedCategory = mapCategoryToGroup(c);
        const matchSearch = search === '' || (c.title && c.title.toLowerCase().includes(search.toLowerCase()));
        const matchCategory = activeCategory === 'All Courses' || mappedCategory === activeCategory;
        const matchLevel = activeLevel === 'All Levels' || (c.level && c.level.includes(activeLevel));
        const matchLanguage = activeLanguage === 'All Languages' || c.language === activeLanguage;
        
        let matchStatus = true;
        if (activeStatus === 'Live Now') matchStatus = !c.is_coming_soon;
        if (activeStatus === 'Upcoming') matchStatus = c.is_coming_soon;

        return matchSearch && matchCategory && matchLevel && matchLanguage && matchStatus;
    });

    const groupedResources = {};
    resources.forEach(r => {
        const cat = r.category || 'Other';
        if (!groupedResources[cat]) groupedResources[cat] = [];
        groupedResources[cat].push(r);
    });

    const filteredScholarships = scholarships.filter(sch => {
        if (scholarshipFilters.state && sch.state !== scholarshipFilters.state) return false;
        
        if (scholarshipFilters.country) {
            const isIndia = (sch.country || '').toLowerCase() === 'india';
            if (scholarshipFilters.country === 'Domestic' && !isIndia) return false;
            if (scholarshipFilters.country === 'International' && isIndia) return false;
        }
        
        if (scholarshipFilters.education_level && sch.education_level !== scholarshipFilters.education_level) return false;
        if (scholarshipFilters.category && sch.category !== scholarshipFilters.category) return false;
        if (scholarshipFilters.funding_type && sch.funding_type !== scholarshipFilters.funding_type) return false;
        
        if (scholarshipFilters.deadline_status) {
            if (!sch.deadline_date) return false;
            const now = new Date();
            const deadline = new Date(sch.deadline_date);
            const daysDiff = (deadline - now) / (1000 * 60 * 60 * 24);
            
            if (scholarshipFilters.deadline_status === 'Open' && daysDiff < 0) return false;
            if (scholarshipFilters.deadline_status === 'Closed' && daysDiff >= 0) return false;
            if (scholarshipFilters.deadline_status === 'Closing Soon' && (daysDiff < 0 || daysDiff > 14)) return false;
        }
        
        return true;
    });

    const S = {
        page: { minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', paddingBottom: '4rem' },
        card: { 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 20, 
            padding: '1.25rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '0.85rem', 
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
        },
        sectionTitle: { fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-primary)' },
        formInput: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, color: 'var(--text-primary)', padding: '0.8rem 1rem', fontSize: '0.9rem', outline: 'none', width: '100%', transition: 'border-color 0.2s', fontFamily: 'inherit' },
        formLabel: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem', display: 'block' },
        badge: { padding: '0.2rem 0.6rem', borderRadius: 8, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' },
        emptyState: { textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-elevated)', borderRadius: 20, border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }
    };

    // Components
    const CourseCard = ({ course }) => {
        const featureKey = `course:${course.id}`;
        
        const cat = educationCategories.find(c => c.id === course.category_id);
        const categoryName = cat ? cat.name : course.category;

        return (
            <div className="course-card" onClick={() => navigate(`/education/course/${course.id}`)} style={{ ...S.card, cursor: 'pointer', opacity: course.is_coming_soon ? 0.85 : 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 140, background: 'var(--bg-elevated)', borderRadius: 12, backgroundImage: `url(${course.banner_url || course.image_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    {course.is_coming_soon && (
                        <span style={{ position: 'absolute', top: 12, left: 12, background: 'var(--bg-mint)', color: 'var(--peacock-green)', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 900 }}>
                            COMING SOON
                        </span>
                    )}
                    {!course.is_coming_soon && categoryName && (
                        <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', color: '#000', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, backdropFilter: 'blur(4px)' }}>
                            {categoryName}
                        </span>
                    )}
                    <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 12, right: 12 }}>
                        <SaveButton itemType="course" itemId={course.id} user={user} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)' }} />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginTop: '0.5rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.35rem 0', lineHeight: 1.3 }}>
                        {course.is_featured && <span title="Featured" style={{marginRight: '6px'}}>⭐</span>}
                        {course.title || 'Course Title'}
                    </h4>
                    {course.short_description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {course.short_description}
                        </p>
                    )}
                    {(course.instructor || course.instructor_name) && (course.instructor || course.instructor_name) !== 'Instructor' && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontWeight: 600 }}>{course.instructor || course.instructor_name}</p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: 'auto' }}>
                        {course.level && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>▷ {course.level}</span>}
                        {course.duration && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>⏱ {course.duration}</span>}
                        {course.estimated_launch_date && course.is_coming_soon && (
                            <span style={{ fontWeight: 700, marginLeft: 'auto' }}>Launch: {course.estimated_launch_date}</span>
                        )}
                    </div>
                    <NotifyMeButton user={user} featureKey={featureKey} fullWidth />
                </div>
            </div>
        );
    };

    const CertificationCard = ({ cert }) => {
        const featureKey = `certification:${cert.id}`;
        const [showDetails, setShowDetails] = useState(false);

        return (
            <>
            <div className="course-card" style={{ ...S.card, opacity: cert.is_coming_soon ? 0.85 : 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 8, background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', flexShrink: 0 }}>
                        <img src={cert.logo_url || 'https://via.placeholder.com/64'} alt={cert.provider} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: cert.is_coming_soon ? '4rem' : 0 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.2rem 0', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cert.featured && <span title="Featured" style={{marginRight: '4px'}}>⭐</span>}
                            {cert.name}
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>{cert.provider}</p>
                    </div>
                    {cert.is_coming_soon && (
                        <span style={{ position: 'absolute', top: 0, right: 0, background: 'var(--bg-mint)', color: 'var(--peacock-green)', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 900 }}>
                            COMING SOON
                        </span>
                    )}
                </div>

                {cert.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {cert.description}
                    </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: cert.is_coming_soon ? '1rem' : 0, marginTop: 'auto', flexWrap: 'wrap' }}>
                    {cert.difficulty && (
                        <span style={{ background: 'var(--bg-elevated)', padding: '0.2rem 0.5rem', borderRadius: 4, fontWeight: 600 }}>
                            {cert.difficulty}
                        </span>
                    )}
                    {cert.duration && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            ⏱️ {cert.duration}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: cert.is_coming_soon ? 'auto' : '1rem', alignItems: 'center' }}>
                    {cert.is_coming_soon ? (
                        <NotifyMeButton user={user} featureKey={featureKey} />
                    ) : (
                        <button
                            onClick={() => setShowDetails(true)}
                            style={{ flex: 1, background: 'var(--peacock-green)', color: '#fff', border: 'none', padding: '0.6rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                            View Details
                        </button>
                    )}
                    <SaveButton itemType="certification" itemId={cert.id} user={user} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0 }} />
                </div>
            </div>

            {/* View Details Modal — only reachable for non-coming-soon certs */}
            {showDetails && !cert.is_coming_soon && (
                <div
                    onClick={() => setShowDetails(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{ background: 'var(--bg-surface)', width: '100%', maxWidth: 480, borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem', flexShrink: 0 }}>
                                    <img src={cert.logo_url || 'https://via.placeholder.com/64'} alt={cert.provider} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>{cert.name}</h3>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{cert.provider}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cert.description && (
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {cert.description}
                                </p>
                            )}

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {cert.difficulty && (
                                    <span style={{ background: 'var(--bg-elevated)', padding: '0.3rem 0.7rem', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem' }}>
                                        {cert.difficulty}
                                    </span>
                                )}
                                {cert.duration && (
                                    <span style={{ background: 'var(--bg-elevated)', padding: '0.3rem 0.7rem', borderRadius: 6, fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        ⏱️ {cert.duration}
                                    </span>
                                )}
                            </div>

                            {cert.enrollment_url ? (
                                <button
                                    onClick={() => window.open(cert.enrollment_url, '_blank', 'noopener,noreferrer')}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 800, marginTop: '0.5rem' }}
                                >
                                    Enroll Now ↗
                                </button>
                            ) : (
                                <button
                                    disabled
                                    style={{ width: '100%', padding: '0.85rem', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, marginTop: '0.5rem', background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border-color)', cursor: 'not-allowed' }}
                                >
                                    Enrollment link coming soon
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            </>
        );
    };

    const ScholarshipCard = ({ sch }) => {
        const isDomestic = (sch.country || '').toLowerCase() === 'india';
        return (
            <div className="course-card" style={S.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ ...S.badge, background: isDomestic ? 'var(--bg-mint)' : 'rgba(59,130,246,0.1)', color: isDomestic ? 'var(--peacock-green)' : '#3B82F6' }}>
                        {isDomestic ? '🇮🇳 Domestic' : '🌍 International'}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {sch.is_featured && <span style={{ fontSize: '1.1rem' }} title="Featured">⭐</span>}
                        <SaveButton itemType="scholarship" itemId={sch.id} user={user} />
                    </div>
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{sch.name || 'Scholarship Name'}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', fontWeight: 600 }}>{sch.provider || 'Provider'}</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{sch.amount || 'Variable'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Deadline</span>
                        <strong style={{ color: 'var(--text-primary)' }}>
                            {sch.deadline_date ? new Date(sch.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling'}
                        </strong>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '0.75rem', marginTop: 'auto', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.2rem' }}>Eligibility:</strong>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sch.eligibility || 'Check website for details.'}</span>
                </div>
                
                <button onClick={() => window.open(sch.apply_url || '#', '_blank')} className="btn-primary" style={{ width: '100%', padding: '0.7rem', marginTop: '0.5rem', borderRadius: 10, fontSize: '0.85rem' }}>
                    Apply Now
                </button>
            </div>
        );
    };

    const ResourceCard = ({ resource }) => {
        const featureKey = `resource:${resource.id}`;

        return (
            <div className="course-card" style={{ ...S.card, opacity: resource.is_coming_soon ? 0.85 : 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '2rem', background: 'var(--bg-elevated)', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {resource.thumbnail_url ? <img src={resource.thumbnail_url} alt="" style={{width:'100%', height:'100%', objectFit:'cover'}}/> : (resource.icon || '📄')}
                    </div>
                    {resource.is_coming_soon && (
                        <span style={{ background: 'var(--bg-mint)', color: 'var(--peacock-green)', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.65rem', fontWeight: 900 }}>
                            COMING SOON
                        </span>
                    )}
                </div>
                
                <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.25rem 0', lineHeight: 1.3 }}>
                    {resource.featured && <span title="Featured" style={{marginRight: '4px'}}>⭐</span>}
                    {resource.title}
                </h4>
                
                {resource.description && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {resource.description}
                    </p>
                )}
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', alignItems: 'center' }}>
                    {resource.is_coming_soon ? (
                        <NotifyMeButton user={user} featureKey={featureKey} />
                    ) : (
                        <button 
                            style={{ flex: 1, background: 'var(--peacock-green)', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                        >
                            Open
                        </button>
                    )}
                    <SaveButton itemType="resource" itemId={resource.id} user={user} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: 8, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-primary)', flexShrink: 0 }} />
                </div>
            </div>
        );
    };

    return (
        <div style={S.page}>
            <style>{`
                .learn-layout {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                }
                @media (min-width: 1024px) {
                    .learn-layout {
                        flex-direction: row;
                        align-items: flex-start;
                    }
                    .learn-main {
                        flex: 1;
                        min-width: 0;
                    }
                    .learn-sidebar {
                        width: 340px;
                        flex-shrink: 0;
                        position: sticky;
                        top: 100px;
                    }
                }
                @media (max-width: 1023px) {
                    .learn-sidebar {
                        width: 100%;
                    }
                }
                .scrollable-tabs {
                    display: flex;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    border-bottom: 1px solid var(--border-color);
                }
                .scrollable-tabs::-webkit-scrollbar {
                    display: none;
                }
                .course-card:hover {
                    transform: translateY(-4px);
                    box-shadow: var(--shadow-md) !important;
                    border-color: var(--peacock-hover) !important;
                }
                .tab-btn {
                    position: relative;
                    padding: 1rem 1.25rem;
                    font-weight: 700;
                    font-size: 0.95rem;
                    color: var(--text-muted);
                    cursor: pointer;
                    transition: color 0.2s;
                    white-space: nowrap;
                    background: none;
                    border: none;
                    outline: none;
                }
                .tab-btn.active {
                    color: var(--peacock-green);
                }
                .tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: var(--peacock-green);
                    border-radius: 3px 3px 0 0;
                }
                .topic-pill {
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    background: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    white-space: nowrap;
                }
                .topic-pill:hover {
                    border-color: var(--peacock-green);
                    color: var(--peacock-green);
                    background: var(--bg-mint);
                }
            `}</style>

            {/* Header */}
            <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', padding: '2.5rem 2rem' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <p style={{ color: 'var(--peacock-green)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>EDUCATION DASHBOARD</p>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 900, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                        Education
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
                        Master new skills, discover scholarships, and earn certifications to accelerate your career.
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
                
                {/* Tabs */}
                <div className="scrollable-tabs" style={{ marginBottom: '2.5rem' }}>
                    {['overview', 'courses', 'certifications', 'scholarships', 'resources'].map(tab => (
                        <button key={tab} className={`tab-btn ${mainTab === tab ? 'active' : ''}`} onClick={() => handleTabChange(tab)}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {loadingData ? (
                    <div style={{ textAlign: 'center', padding: '4rem' }}>
                        <ButtonSpinner label="Loading education data..." />
                    </div>
                ) : (
                    <div className="learn-layout">
                        {/* ── MAIN CONTENT ── */}
                        <div className="learn-main">
                            
                            {/* OVERVIEW TAB */}
                            {mainTab === 'overview' && (
                                <ErrorBoundary message="The Overview section encountered a problem loading.">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                    
                                    {/* Popular Topics */}
                                    <section>
                                        <h2 style={S.sectionTitle}>Popular Topics</h2>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            {popularTopics.map(topic => (
                                                <div key={topic} className="topic-pill">{topic}</div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Upcoming Event — real data, same events query + banner style as
                                        Dashboard's mobile "Upcoming Event" widget (upcomingEvents[0]).
                                        No carousel, single card, "View all" links to /events. */}
                                    {upcomingEvents.length > 0 && (() => {
                                        const ev = upcomingEvents[0];
                                        const dateLabel = new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                                        const timeLabel = new Date(ev.event_date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
                                        return (
                                            <section>
                                                <h2 style={S.sectionTitle}>Upcoming Event</h2>
                                                <div style={{ background: 'linear-gradient(135deg, #115E59 0%, #0B3B36 100%)', borderRadius: 16, padding: '1.25rem', color: '#fff', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', opacity: 0.85 }}>Upcoming Event</span>
                                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, lineHeight: 1.3 }}>{ev.title}</h3>
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>{dateLabel} • {timeLabel}</span>
                                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.6rem', alignItems: 'center' }}>
                                                        <Link
                                                            to={`/events/${ev.slug || ev.id}`}
                                                            style={{ background: '#F5A623', color: '#1A1A1A', border: 'none', borderRadius: 10, padding: '0.6rem 1.25rem', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block' }}
                                                        >
                                                            Register Now
                                                        </Link>
                                                        <Link to="/events" style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }}>View all</Link>
                                                    </div>
                                                </div>
                                            </section>
                                        );
                                    })()}

                                    {/* Featured Courses */}
                                    <section>
                                        <h2 style={S.sectionTitle}>Featured Courses</h2>
                                        {featuredCourses.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
                                                {featuredCourses.map(course => <CourseCard key={course.id} course={course} />)}
                                            </div>
                                        ) : (
                                            <div style={S.emptyState}>
                                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📭</div>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>No courses available.</h4>
                                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>Check back later for curated content.</p>
                                                <button className="btn-primary" onClick={() => handleTabChange('courses')} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, fontSize: '0.85rem' }}>Browse Categories</button>
                                            </div>
                                        )}
                                    </section>

                                </div>
                                </ErrorBoundary>
                            )}

                            {/* COURSES TAB */}
                            {mainTab === 'courses' && (
                                <ErrorBoundary message="The Courses section encountered a problem loading.">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                    
                                    {/* Top Category Tabs */}
                                    <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="hide-scrollbar">
                                        {courseTabs.map(tab => (
                                            <button 
                                                key={tab}
                                                onClick={() => setActiveCategory(tab)}
                                                style={{ 
                                                    padding: '0.75rem 1.25rem', 
                                                    borderRadius: 12, 
                                                    border: `1px solid ${activeCategory === tab ? 'var(--peacock-green)' : 'var(--border-color)'}`, 
                                                    background: activeCategory === tab ? 'var(--bg-mint)' : 'var(--bg-surface)', 
                                                    color: activeCategory === tab ? 'var(--peacock-green)' : 'var(--text-secondary)',
                                                    fontWeight: activeCategory === tab ? 800 : 600,
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {tab} 
                                                <span style={{ opacity: 0.8, fontSize: '0.85em', background: activeCategory === tab ? 'rgba(17,94,89,0.1)' : 'var(--bg-elevated)', padding: '0.1rem 0.4rem', borderRadius: 6 }}>
                                                    {courseCounts[tab]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Coming Soon Banner */}
                                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ fontSize: '2rem' }}>⏱️</div>
                                            <div>
                                                <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', fontWeight: 800 }}>Courses are coming soon!</h3>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>We're curating the best learning experiences for you. Get notified when your favorite courses go live.</p>
                                            </div>
                                        </div>
                                        <NotifyMeButton user={user} featureKey="courses:general" />
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                        {/* Main Grid */}
                                        <div style={{ flex: 1, minWidth: 280 }}>
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <input 
                                                    type="text" 
                                                    value={search} 
                                                    onChange={e => setSearch(e.target.value)} 
                                                    placeholder="🔍 Search courses by title, topic or keyword..." 
                                                    style={{ width: '100%', ...S.formInput }} 
                                                />
                                            </div>
                                            {displayedCourses.length > 0 ? (
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                                                    {displayedCourses.map(course => <CourseCard key={course.id} course={course} />)}
                                                </div>
                                            ) : (
                                                <div style={S.emptyState}>
                                                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                                                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>No courses available.</h4>
                                                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>Try adjusting your search or filters.</p>
                                                    <button className="btn-primary" onClick={() => { setSearch(''); setActiveCategory('All Courses'); setActiveLevel('All Levels'); setActiveLanguage('All Languages'); setActiveStatus('Upcoming'); }} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, fontSize: '0.85rem' }}>Clear Filters</button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Filter Sidebar */}
                                        <div style={{ width: '100%', maxWidth: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem', ...S.card }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>Filter Courses</h3>
                                                <button onClick={() => { setActiveCategory('All Courses'); setActiveLevel('All Levels'); setActiveLanguage('All Languages'); setActiveStatus('Upcoming'); }} style={{ background: 'none', border: 'none', color: 'var(--peacock-green)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>Clear All</button>
                                            </div>

                                            <div>
                                                <label style={S.formLabel}>Level</label>
                                                {availableLevels.map(lvl => (
                                                    <label key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                        <input type="radio" checked={activeLevel === lvl} onChange={() => setActiveLevel(lvl)} /> {lvl}
                                                    </label>
                                                ))}
                                            </div>

                                            <div>
                                                <label style={S.formLabel}>Language</label>
                                                <select value={activeLanguage} onChange={e => setActiveLanguage(e.target.value)} style={{...S.formInput, padding: '0.5rem'}}>
                                                    {availableLanguages.map(lang => (
                                                        <option key={lang} value={lang}>{lang}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={S.formLabel}>Course Status</label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    <input type="radio" checked={activeStatus === 'Upcoming'} onChange={() => setActiveStatus('Upcoming')} /> Upcoming ({upcomingCount})
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                    <input type="radio" checked={activeStatus === 'Live Now'} onChange={() => setActiveStatus('Live Now')} /> Live Now ({liveCount})
                                                </label>
                                            </div>
                                            
                                            <div style={{ marginTop: '0.5rem', background: 'var(--bg-elevated)', borderRadius: 12, padding: '1.25rem', border: '1px solid rgba(17, 94, 89, 0.2)' }}>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 800 }}>Don't see what you need?</h4>
                                                <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tell us what you want to learn. We'll notify you when it's available.</p>
                                                <button onClick={() => setShowRequestModal(true)} className="btn-secondary" style={{ width: '100%', padding: '0.6rem', borderRadius: 8, fontSize: '0.85rem', background: 'transparent', border: '1px solid var(--border-color)', fontWeight: 600 }}>Request a Course →</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </ErrorBoundary>
                            )}

                            {/* CERTIFICATIONS TAB */}
                            {mainTab === 'certifications' && (
                                <ErrorBoundary message="The Certifications section encountered a problem loading.">
                                <div>
                                    <h2 style={S.sectionTitle}>Professional Certifications</h2>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Earn industry-recognized certificates from top technology partners.</p>
                                    
                                    {certifications.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                            {certifications.map(cert => <CertificationCard key={cert.id} cert={cert} notifiedFeatures={notifiedFeatures} loadingFeatures={loadingFeatures} toggleNotify={toggleNotify} />)}
                                        </div>
                                    ) : (
                                        <div style={S.emptyState}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎓</div>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Certifications updating</h4>
                                            <p style={{ margin: 0, fontSize: '0.85rem' }}>Check back soon for new partner tracks.</p>
                                        </div>
                                    )}
                                </div>
                                </ErrorBoundary>
                            )}

                            {/* SCHOLARSHIPS TAB */}
                            {mainTab === 'scholarships' && (
                                <ErrorBoundary message="The Scholarships section encountered a problem loading.">
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2 style={S.sectionTitle}>Available Scholarships</h2>
                                        <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                                            <span>↻</span> Refresh
                                        </button>
                                    </div>
                                    
                                    {/* Filters */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                                        <select 
                                            value={scholarshipFilters.education_level} 
                                            onChange={e => setScholarshipFilters(f => ({ ...f, education_level: e.target.value }))}
                                            style={{ ...S.formInput, width: 'auto', flex: 1, minWidth: 140, padding: '0.5rem 1rem' }}
                                        >
                                            <option value="">All Education Levels</option>
                                            <option value="High School">High School</option>
                                            <option value="Undergraduate">Undergraduate</option>
                                            <option value="Postgraduate">Postgraduate</option>
                                            <option value="Doctorate">Doctorate</option>
                                        </select>
                                        <select 
                                            value={scholarshipFilters.category} 
                                            onChange={e => setScholarshipFilters(f => ({ ...f, category: e.target.value }))}
                                            style={{ ...S.formInput, width: 'auto', flex: 1, minWidth: 140, padding: '0.5rem 1rem' }}
                                        >
                                            <option value="">All Categories</option>
                                            <option value="Merit-Based">Merit-Based</option>
                                            <option value="Need-Based">Need-Based</option>
                                            <option value="Minority">Minority</option>
                                            <option value="Women">Women</option>
                                        </select>
                                        <select 
                                            value={scholarshipFilters.funding_type} 
                                            onChange={e => setScholarshipFilters(f => ({ ...f, funding_type: e.target.value }))}
                                            style={{ ...S.formInput, width: 'auto', flex: 1, minWidth: 140, padding: '0.5rem 1rem' }}
                                        >
                                            <option value="">All Funding Types</option>
                                            <option value="Full Ride">Full Ride</option>
                                            <option value="Partial">Partial</option>
                                            <option value="One-time">One-time</option>
                                        </select>
                                        <select 
                                            value={scholarshipFilters.deadline_status} 
                                            onChange={e => setScholarshipFilters(f => ({ ...f, deadline_status: e.target.value }))}
                                            style={{ ...S.formInput, width: 'auto', flex: 1, minWidth: 140, padding: '0.5rem 1rem' }}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Open">Open</option>
                                            <option value="Closing Soon">Closing Soon (14 days)</option>
                                            <option value="Closed">Closed</option>
                                        </select>
                                        <input 
                                            type="text" 
                                            placeholder="State (e.g. Maharashtra)" 
                                            value={scholarshipFilters.state}
                                            onChange={e => setScholarshipFilters(f => ({ ...f, state: e.target.value }))}
                                            style={{ ...S.formInput, width: 'auto', flex: 1, minWidth: 160, padding: '0.5rem 1rem' }}
                                        />
                                        <select 
                                            value={scholarshipFilters.country}
                                            onChange={e => setScholarshipFilters(f => ({ ...f, country: e.target.value }))}
                                            style={{ ...S.formInput, width: 'auto', flex: 1, minWidth: 140, padding: '0.5rem 1rem' }}
                                        >
                                            <option value="">All Regions</option>
                                            <option value="Domestic">Domestic (India)</option>
                                            <option value="International">International</option>
                                        </select>
                                        <button 
                                            onClick={() => setScholarshipFilters({ state: '', country: '', education_level: '', category: '', funding_type: '', deadline_status: '' })}
                                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', padding: '0.5rem 1rem', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    
                                    {filteredScholarships.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                            {filteredScholarships.map(sch => <ScholarshipCard key={sch.id} sch={sch} />)}
                                        </div>
                                    ) : (
                                        <div style={S.emptyState}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>💸</div>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>No scholarships available.</h4>
                                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>We are actively sourcing new opportunities.</p>
                                            <button className="btn-primary" onClick={() => window.location.reload()} style={{ padding: '0.6rem 1.25rem', borderRadius: 8, fontSize: '0.85rem' }}>Refresh</button>
                                        </div>
                                    )}
                                </div>
                                </ErrorBoundary>
                            )}

                            {/* RESOURCES TAB */}
                            {mainTab === 'resources' && (
                                <ErrorBoundary message="The Resources section encountered a problem loading.">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                    <div style={{ marginBottom: '-1rem' }}>
                                        <h2 style={S.sectionTitle}>Student Resources</h2>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>A curated collection of study materials, guides, and tools to help you succeed.</p>
                                    </div>
                                    
                                    {Object.entries(groupedResources).length > 0 ? (
                                        Object.entries(groupedResources).sort(([a], [b]) => a.localeCompare(b)).map(([catName, resList]) => (
                                            <section key={catName}>
                                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                                    {catName}
                                                </h3>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                                                    {resList.map(res => <ResourceCard key={res.id} resource={res} />)}
                                                </div>
                                            </section>
                                        ))
                                    ) : (
                                        <div style={{ ...S.emptyState, padding: '4rem 2rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', maxWidth: 600, margin: '0 auto' }}>
                                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                                            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>Resources are Coming Soon</h3>
                                            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 2rem 0' }}>
                                                We're building one place for notes, PDFs, previous year papers, career guides and student resources.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                </ErrorBoundary>
                            )}

                        </div>

                        {/* ── RIGHT SIDEBAR ── */}
                        <div className="learn-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            
                            {/* Learning Stats */}
                            <div style={S.card}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Your Learning Stats</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div style={{ background: 'var(--bg-elevated)', padding: '0.8rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--peacock-green)' }}>{learningStats?.courses_enrolled || 0}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Courses Enrolled</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-elevated)', padding: '0.8rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--peacock-green)' }}>{learningStats?.lessons_completed || 0}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Lessons Completed</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-elevated)', padding: '0.8rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--peacock-green)' }}>{learningStats?.certificates_earned || 0}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Certificates</div>
                                    </div>
                                    <div style={{ background: 'var(--bg-elevated)', padding: '0.8rem', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--peacock-green)' }}>{learningStats?.learning_hours || 0}h</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>Learning Hours</div>
                                    </div>
                                </div>
                            </div>

                            {/* Recommended For You */}
                            <div style={S.card}>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Recommended For You</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 360, overflowY: 'auto' }}>
                                    {recommendedCourses.length > 0 ? (
                                        recommendedCourses.map(course => (
                                            <div key={course.id} onClick={() => navigate(`/education/course/${course.id}`)} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', cursor: 'pointer', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                                                <div style={{ 
                                                    width: 60, 
                                                    height: 60, 
                                                    borderRadius: 8, 
                                                    background: 'var(--bg-elevated)', 
                                                    backgroundImage: (course.banner_url || course.image_url) ? `url(${course.banner_url || course.image_url})` : 'none', 
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    flexShrink: 0,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.5rem',
                                                    border: '1px solid var(--border-color)'
                                                }}>
                                                    {!(course.banner_url || course.image_url) && '🎓'}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 0.2rem 0', lineHeight: 1.2, color: 'var(--text-primary)' }}>{course.title || 'Course'}</h5>
                                                    {(course.instructor || course.instructor_name) && (course.instructor || course.instructor_name) !== 'Instructor' && (
                                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{course.instructor || course.instructor_name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                                            We'll recommend courses once you begin learning.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Top Scholarships */}
                            <div style={S.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Top Scholarships</h3>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--peacock-green)', fontWeight: 700, cursor: 'pointer' }} onClick={() => handleTabChange('scholarships')}>View All</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {topScholarships.length > 0 ? (
                                        topScholarships.map(sch => (
                                            <div key={sch.id} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', lastChild: { border: 'none' } }}>
                                                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)', lineHeight: 1.2 }}>{sch.name || 'Scholarship'}</h5>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                                                    <span style={{ color: 'var(--peacock-green)', fontWeight: 700 }}>{sch.amount || 'Variable'}</span>
                                                    <span style={{ color: 'var(--text-muted)' }}>
                                                        {sch.deadline_date ? new Date(sch.deadline_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Rolling'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                                            No scholarships available right now.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Request a Course */}
                            <div style={{ ...S.card, background: 'var(--bg-mint)', border: '1px solid var(--border-mint)', textAlign: 'center', padding: '2rem 1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--peacock-green)', margin: '0 0 0.5rem 0' }}>Can't find a course?</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>Let us know what you want to learn next.</p>
                                <button className="btn-primary" onClick={() => setShowRequestModal(true)} style={{ width: '100%', padding: '0.75rem', borderRadius: 10, fontSize: '0.9rem' }}>
                                    Request a Course
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            {/* Request Course Modal */}
            {showRequestModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 24, width: 420, maxWidth: '100%', padding: '2rem', animation: 'modalEntrance 0.25s ease-out', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Request a Course</h3>
                            <button onClick={() => setShowRequestModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
                        </div>
                        
                        <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={S.formLabel}>Course Topic / Name *</label>
                                <input 
                                    type="text" 
                                    required 
                                    style={S.formInput} 
                                    placeholder="e.g. Advanced React Patterns"
                                    value={requestForm.topic}
                                    onChange={e => setRequestForm({ topic: e.target.value })}
                                />
                            </div>
                            
                            <button type="submit" disabled={submittingRequest} className="btn-primary" style={{ width: '100%', padding: '0.85rem', marginTop: '0.5rem', borderRadius: 12, fontSize: '0.95rem' }}>
                                {submittingRequest ? <ButtonSpinner label="Submitting..." /> : 'Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}
