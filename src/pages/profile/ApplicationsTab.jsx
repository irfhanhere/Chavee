import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { PageLoader } from '../../components/Spinner.jsx';

export default function ApplicationsTab({ user }) {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApplications = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch job applications
                const { data: jobsApp, error: jErr } = await supabase
                    .from('job_applications')
                    .select('*, jobs(title, company_name, location)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                
                // Fetch gig applications
                const { data: gigsApp, error: gErr } = await supabase
                    .from('gig_applications')
                    .select('*, gigs(title, client_name)')
                    .eq('applicant_id', user.id)
                    .order('created_at', { ascending: false });

                const combined = [
                    ...(jobsApp || []).map(app => ({
                        ...app,
                        type: 'job',
                        title: app.jobs?.title || 'Unknown Job',
                        company: app.jobs?.company_name || 'Unknown Company',
                    })),
                    ...(gigsApp || []).map(app => ({
                        ...app,
                        type: 'gig',
                        title: app.gigs?.title || 'Unknown Gig',
                        company: app.gigs?.client_name || 'Unknown Client',
                    }))
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                setApplications(combined);
            } catch (err) {
                console.error("Failed to load applications", err);
            } finally {
                setLoading(false);
            }
        };

        fetchApplications();
    }, [user]);

    if (loading) return <PageLoader message="Loading applications..." />;

    return (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '2rem', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>My Applications</h3>
            
            {applications.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                    {applications.map(app => (
                        <div key={`${app.type}-${app.id}`} style={{ border: '1px solid var(--border-color)', borderRadius: 12, padding: '1.25rem', background: 'var(--bg-base)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1.05rem', fontWeight: 800 }}>{app.title}</h4>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{app.company}</div>
                                </div>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700, 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: 12, 
                                    background: app.status === 'Accepted' ? 'rgba(16, 185, 129, 0.1)' : app.status === 'Rejected' ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-elevated)',
                                    color: app.status === 'Accepted' ? '#10B981' : app.status === 'Rejected' ? '#EF4444' : 'var(--text-primary)'
                                }}>
                                    {app.status || 'Submitted'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{app.type.toUpperCase()}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(app.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem' }}>
                    You haven't applied to any jobs or gigs yet.
                </div>
            )}
        </div>
    );
}
