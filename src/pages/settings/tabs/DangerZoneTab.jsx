import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { ButtonSpinner } from '../../../components/Spinner.jsx';
import { useNavigate } from 'react-router-dom';

export default function DangerZoneTab({ user, showToast }) {
    const navigate = useNavigate();
    
    const [deactivateReason, setDeactivateReason] = useState('');
    const [deactivating, setDeactivating] = useState(false);
    
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDeactivate = async () => {
        if (!deactivateReason) {
            showToast("Please provide a reason", 'error');
            return;
        }
        if (!window.confirm("Are you sure you want to deactivate your account? You will be logged out.")) return;
        
        setDeactivating(true);
        try {
            await supabase.from('deleted_accounts').insert({
                user_id: user.id,
                email: user.email,
                reason: `DEACTIVATED: ${deactivateReason}`,
                scheduled_deletion_date: null
            });
            await supabase.auth.signOut();
            navigate('/login');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeactivating(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm !== 'DELETE') {
            showToast("Please type DELETE to confirm", 'error');
            return;
        }
        if (!window.confirm("This action will schedule your account for permanent deletion in 30 days. Proceed?")) return;

        setDeleting(true);
        try {
            const scheduledDate = new Date();
            scheduledDate.setDate(scheduledDate.getDate() + 30);
            
            await supabase.from('deleted_accounts').insert({
                user_id: user.id,
                email: user.email,
                reason: 'PERMANENT_DELETION_REQUESTED',
                scheduled_deletion_date: scheduledDate.toISOString()
            });
            await supabase.auth.signOut();
            navigate('/login');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Deactivate */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid #FCA5A5', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#DC2626' }}>Deactivate Account</h2>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deactivating your account will hide your profile and content. You can reactivate by logging in anytime.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
                    <select 
                        value={deactivateReason}
                        onChange={e => setDeactivateReason(e.target.value)}
                        style={{ padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.95rem' }}
                    >
                        <option value="">Select a reason (Required)</option>
                        <option value="Taking a break">I'm taking a break from Chavee</option>
                        <option value="Privacy concerns">I have privacy concerns</option>
                        <option value="Not useful">I don't find it useful</option>
                        <option value="Other">Other</option>
                    </select>
                    
                    <button 
                        onClick={handleDeactivate} 
                        disabled={deactivating}
                        style={{ background: 'transparent', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                        {deactivating ? <ButtonSpinner /> : 'Deactivate Account'}
                    </button>
                </div>
            </div>

            {/* Permanent Delete */}
            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid #EF4444', boxShadow: 'var(--shadow-sm)' }}>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#B91C1C' }}>Delete Account</h2>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Permanently delete your account and all associated data. Your account will be soft-deleted for 30 days before being permanently purged.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 500 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Type <strong style={{ color: '#DC2626' }}>DELETE</strong> to confirm</label>
                    <input 
                        type="text" 
                        placeholder="DELETE"
                        value={deleteConfirm}
                        onChange={e => setDeleteConfirm(e.target.value)}
                        style={{ padding: '0.75rem 1rem', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#B91C1C', fontSize: '0.95rem', fontWeight: 700 }}
                    />
                    
                    <button 
                        onClick={handleDelete} 
                        disabled={deleting}
                        style={{ background: '#DC2626', border: 'none', color: 'white', padding: '0.75rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}
                    >
                        {deleting ? <ButtonSpinner /> : 'Permanently Delete Account'}
                    </button>
                </div>
            </div>

        </div>
    );
}
