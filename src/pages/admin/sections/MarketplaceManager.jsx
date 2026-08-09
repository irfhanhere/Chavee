import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient.js';
import Toast, { useToast } from '../../../components/Toast.jsx';
import { ButtonSpinner } from '../../../components/Spinner.jsx';

export default function MarketplaceManager() {
    const { toast, showToast, hideToast } = useToast();
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSubscribers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notify_subscribers')
                .select('*')
                .eq('feature_key', 'student_marketplace')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setSubscribers(data || []);
        } catch (err) {
            console.error('Error fetching marketplace waitlist:', err);
            showToast('Failed to load waitlist', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscribers();
    }, []);

    const exportCsv = () => {
        if (!subscribers.length) return;
        const csvRows = ['Email,Date Joined'];
        subscribers.forEach(sub => {
            const date = new Date(sub.created_at).toLocaleDateString();
            csvRows.push(`${sub.email},${date}`);
        });
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'marketplace_waitlist.csv';
        a.click();
    };

    return (
        <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: '0 0 0.5rem 0' }}>Marketplace Manager</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage the student marketplace feature (Coming Soon)</p>
                </div>
                <div>
                    <button onClick={exportCsv} disabled={subscribers.length === 0} className="btn-primary" style={{ padding: '0.6rem 1.25rem', borderRadius: 8 }}>
                        Export Waitlist CSV
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Waitlist Signups</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--peacock-green)' }}>{subscribers.length}</div>
                </div>
                <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 16, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    More metrics coming on launch...
                </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>Waitlist Users</h2>
            
            <div style={{ background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
                ) : subscribers.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No one on the waitlist yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Email</th>
                                <th style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Date Joined</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscribers.map((sub, i) => (
                                <tr key={sub.id} style={{ borderBottom: i === subscribers.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{sub.email}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                                        {new Date(sub.created_at).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            <Toast {...toast} onHide={hideToast} />
        </div>
    );
}
