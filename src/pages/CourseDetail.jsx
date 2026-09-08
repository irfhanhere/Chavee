import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import Toast, { useToast } from '../components/Toast.jsx';
import { ButtonSpinner } from '../components/Spinner.jsx';
import SaveButton from '../components/SaveButton.jsx';
import useNotifyMe from '../hooks/useNotifyMe.js';
import NotifyMeButton from '../components/NotifyMeButton.jsx';
import { useAuth } from '../hooks/useAuth.js';
export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();

    const { user } = useAuth();   // session guarded upstream by <RequireAuth>
    const { notifiedFeatures, loadingFeatures, toggleNotify } = useNotifyMe(user);
    const featureKey = `course:${id}`;
    const [course, setCourse] = useState(null);
    const [relatedCourses, setRelatedCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        async function fetchCourse() {
            setLoading(true);

            // Fetch course
            const { data: courseData, error } = await supabase
                .from('courses')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !courseData) {
                if (isMounted) {
                    setLoading(false);
                }
                return;
            }

            if (isMounted) setCourse(courseData);

            // Fetch related upcoming courses in same category
            if (courseData.category_id) {
                const { data: related } = await supabase
                    .from('courses')
                    .select('*')
                    .eq('category_id', courseData.category_id)
                    .neq('id', id)
                    .eq('is_coming_soon', true)
                    .limit(3);
                if (isMounted && related) {
                    setRelatedCourses(related);
                }
            }

            if (isMounted) setLoading(false);
        }
        fetchCourse();
        return () => { isMounted = false; };
    }, [id]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Loading...
            </div>
        );
    }

    if (!course) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
                <h2>Course not found</h2>
                <button onClick={() => navigate('/education/courses')} className="btn-primary">Back to Courses</button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif", paddingBottom: '4rem' }}>
            {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
            
            {/* Hero Section */}
            <div style={{
                height: '350px',
                backgroundImage: `url(${course.banner_url || course.image_url || 'https://via.placeholder.com/1200x400?text=Course+Banner'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end'
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)'
                }} />
                
                <div style={{ padding: '2rem 5%', position: 'relative', zIndex: 2, width: '100%', maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <button onClick={() => navigate('/education/courses')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: 8, cursor: 'pointer', marginBottom: '1rem', backdropFilter: 'blur(4px)', fontWeight: 600 }}>
                            ← Back
                        </button>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            {course.is_coming_soon && (
                                <span style={{ background: 'var(--bg-mint)', color: 'var(--peacock-green)', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 900 }}>
                                    COMING SOON
                                </span>
                            )}
                            {course.is_featured && (
                                <span style={{ background: '#F59E0B', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 900 }}>
                                    ⭐ FEATURED
                                </span>
                            )}
                        </div>
                        <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: 900, margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
                            {course.title}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.1rem', margin: '0 0 1rem 0', maxWidth: '600px' }}>
                            {course.short_description || 'No description available for this course.'}
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <SaveButton itemType="course" itemId={course.id} user={user} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', backdropFilter: 'blur(4px)', fontSize: '1.2rem' }} />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 5%', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
                
                {/* Main Left Column */}
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Course Details</h2>
                    
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 16, padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Instructor</span>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{course.instructor || course.instructor_name || 'TBA'}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Difficulty</span>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{course.difficulty || course.level || 'All Levels'}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Launch Date</span>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{course.estimated_launch_date || 'TBA'}</strong>
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Price</span>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{course.price > 0 ? `₹${course.price}` : 'Free'}</strong>
                            </div>
                        </div>
                        
                        <div>
                            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>About this course</span>
                            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
                                {course.description || course.short_description || 'More details coming soon.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div>
                    {course.is_coming_soon && (
                        <div style={{ background: 'linear-gradient(135deg, var(--bg-mint) 0%, rgba(11,143,90,0.1) 100%)', borderRadius: 16, padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(11,143,90,0.2)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--peacock-green)' }}>
                                Be the first to know!
                            </h3>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                                This course is still in development. Get notified instantly when it launches.
                            </p>
                            
                            <NotifyMeButton user={user} featureKey={`course:${id}`} fullWidth />
                        </div>
                    )}

                    {relatedCourses.length > 0 && (
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>More Upcoming Courses</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {relatedCourses.map(rc => (
                                    <Link key={rc.id} to={`/education/course/${rc.id}`} style={{ textDecoration: 'none' }}>
                                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', transition: 'transform 0.2s', border: '1px solid var(--border-color)' }}>
                                            <div style={{ width: 60, height: 60, borderRadius: 8, backgroundImage: `url(${rc.banner_url || rc.image_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center', background: rc.banner_url ? '' : 'var(--bg-mint)' }} />
                                            <div>
                                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: 'var(--text-primary)' }}>{rc.title}</h4>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--peacock-green)', fontWeight: 700 }}>{rc.estimated_launch_date || 'Coming Soon'}</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
