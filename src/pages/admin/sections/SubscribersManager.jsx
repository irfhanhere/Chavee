import React, { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient.js';
import Toast, { useToast } from '../../../components/Toast.jsx';

export default function SubscribersManager() {
    const { toast, showToast, hideToast } = useToast();
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedFeature, setExpandedFeature] = useState(null);

    useEffect(() => {
        fetchSubscribers();
    }, []);

    const fetchSubscribers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notify_subscribers')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setSubscribers(data || []);
        } catch (err) {
            console.error('Error fetching subscribers:', err);
            showToast('Failed to load subscribers', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleSubscriberStatus = async (subId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('notify_subscribers')
                .update({ notified: !currentStatus })
                .eq('id', subId);
                
            if (error) throw error;
            
            showToast(`Subscriber marked as ${!currentStatus ? 'Notified' : 'Pending'}`, 'success');
            
            // Optimistic update
            setSubscribers(prev => prev.map(sub => 
                sub.id === subId ? { ...sub, notified: !currentStatus } : sub
            ));
        } catch (err) {
            console.error('Error updating subscriber:', err);
            showToast('Failed to update status', 'error');
        }
    };

    // Group subscribers by feature_key
    const grouped = subscribers.reduce((acc, sub) => {
        if (!acc[sub.feature_key]) acc[sub.feature_key] = [];
        acc[sub.feature_key].push(sub);
        return acc;
    }, {});

    const features = Object.keys(grouped).sort();

    const exportCsv = (featureKey) => {
        const subs = featureKey ? grouped[featureKey] : subscribers;
        if (!subs || subs.length === 0) {
            showToast('No data to export', 'error');
            return;
        }

        const headers = ['id', 'user_id', 'email', 'feature_key', 'notified', 'created_at'];
        const rows = subs.map(sub => headers.map(header => JSON.stringify(sub[header] || '')).join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `subscribers_${featureKey || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const S = {
        page: { padding: '2rem 3rem' },
        h1: { margin: '0 0 1.5rem 0', fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' },
        card: { background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: '1rem', boxShadow: 'var(--shadow-sm)' },
        headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' },
        featureName: { fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-secondary)', margin: 0 },
        countBadge: { background: 'var(--peacock-green)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: 20, fontSize: '0.85rem', fontWeight: 800 },
        list: { marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
        listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border-color)' },
        email: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' },
        date: { fontSize: '0.75rem', color: 'var(--text-muted)' }
    };

    return (
        <div style={S.page}>
            <h1 style={S.h1}>Waitlists & Subscribers 🔔</h1>
            
            {loading ? (
                <div style={{ color: 'var(--text-muted)' }}>Loading waitlists...</div>
            ) : features.length === 0 ? (
                <div style={S.card}>
                    <div style={{ color: 'var(--text-muted)' }}>No subscribers found.</div>
                </div>
            ) : (
                features.map(feature => (
                    <div key={feature} style={S.card}>
                        <div style={S.headerRow} onClick={() => setExpandedFeature(expandedFeature === feature ? null : feature)}>
                            <h3 style={S.featureName}>
                                {expandedFeature === feature ? '📂' : '📁'} Feature: <span style={{ color: 'var(--peacock-green)' }}>{feature}</span>
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); exportCsv(feature); }}
                                    style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.25rem 0.75rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                >
                                    Export CSV
                                </button>
                                <span style={S.countBadge}>{grouped[feature].length} Subscribers</span>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{expandedFeature === feature ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {expandedFeature === feature && (
                            <div style={S.list}>
                                {grouped[feature].map(sub => (
                                    <div key={sub.id || sub.email + sub.created_at} style={S.listItem}>
                                        <span style={S.email}>{sub.email}</span>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <span style={S.date}>{new Date(sub.created_at).toLocaleString()}</span>
                                            <button 
                                                onClick={() => toggleSubscriberStatus(sub.id, sub.notified)}
                                                style={{ 
                                                    fontSize: '0.75rem', 
                                                    background: sub.notified ? '#10B981' : 'var(--bg-elevated)', 
                                                    color: sub.notified ? '#fff' : 'var(--text-muted)', 
                                                    padding: '4px 10px', 
                                                    borderRadius: 6, 
                                                    fontWeight: 700,
                                                    border: `1px solid ${sub.notified ? 'transparent' : 'var(--border-color)'}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {sub.notified ? '✓ Notified' : 'Mark Notified'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))
            )}
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </div>
    );
}
