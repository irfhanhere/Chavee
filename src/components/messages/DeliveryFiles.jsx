import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient.js';
import { getAttachmentSignedUrl } from '../../utils/attachmentStorage.js';

// Real delivery-file protection: replaces the old DeliveryFileLink that used
// to live duplicated in both Messages.jsx and profile/GigsTab.jsx, calling
// an unconditional signed-URL against the original file with no gate on
// contract status or viewer role — a buyer could open the full-resolution
// original the moment it was submitted, before ever approving it. Fixed by
// routing new deliveries through gig_delivery_files (original_path in the
// private gig-deliveries bucket, preview_path in gig-delivery-previews,
// written server-side by the generate-delivery-preview Edge Function).
//
// Existing contracts predate this table — their single delivery_file_url
// stays exactly as readable as it always was (same message-attachments
// signed URL, no new gate). Protection applies to deliveries submitted from
// now on, per the fix's own scope — historical data is left untouched.
const ORIGINALS_BUCKET = 'gig-deliveries';
const PREVIEWS_BUCKET = 'gig-delivery-previews';
// Short-lived on purpose — "Signed URL for the original is issued only when
// the contract reaches approved, with a short expiry, generated on demand."
const ORIGINAL_SIGNED_URL_TTL = 300; // 5 minutes

export default function DeliveryFiles({ contract, viewerIsSeller = false }) {
    const [files, setFiles] = useState(null); // null = loading, [] = none in the new table

    useEffect(() => {
        if (!contract?.id) return;
        let cancelled = false;
        supabase
            .from('gig_delivery_files')
            .select('*')
            .eq('gig_contract_id', contract.id)
            .order('created_at', { ascending: true })
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error) {
                    console.error('Failed to load delivery files:', error);
                    setFiles([]);
                    return;
                }
                setFiles(data || []);
            });
        return () => { cancelled = true; };
    }, [contract?.id]);

    if (!contract) return null;

    // Legacy path: no gig_delivery_files rows for this contract, but the old
    // single-file column has something — this is a pre-fix delivery, render
    // it exactly as before (no gate, same bucket/behaviour it always had).
    if (files !== null && files.length === 0) {
        if (!contract.delivery_file_url) return null;
        return <LegacyDeliveryLink filePath={contract.delivery_file_url} />;
    }

    if (files === null) {
        return <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Loading delivery files…</p>;
    }

    // Sellers already possess the original they uploaded — the lock exists to
    // stop a buyer previewing full quality before paying/approving, not to
    // hide a seller's own delivery from themselves.
    const unlocked = viewerIsSeller || contract.status === 'approved';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {files.map(f => <DeliveryFileRow key={f.id} file={f} unlocked={unlocked} />)}
            {!unlocked && (
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    🔒 Full-quality files unlock once the buyer accepts the work.
                </p>
            )}
        </div>
    );
}

function LegacyDeliveryLink({ filePath }) {
    const [signedUrl, setSignedUrl] = useState(null);

    useEffect(() => {
        if (!filePath) return;
        getAttachmentSignedUrl(filePath).then(url => { if (url) setSignedUrl(url); });
    }, [filePath]);

    if (!filePath) return null;
    const fileName = filePath.split('/').pop() || 'Delivered file';

    return (
        <a
            href={signedUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--peacock-green)', textDecoration: 'underline' }}
        >
            📎 {signedUrl ? `View ${fileName}` : 'Loading file...'}
        </a>
    );
}

function DeliveryFileRow({ file, unlocked }) {
    const [signedUrl, setSignedUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setSignedUrl(null);
        if (unlocked) {
            if (!file.original_path) return;
            setLoading(true);
            getAttachmentSignedUrl(file.original_path, { bucket: ORIGINALS_BUCKET, ttl: ORIGINAL_SIGNED_URL_TTL })
                .then(url => setSignedUrl(url))
                .finally(() => setLoading(false));
        } else if (file.preview_path) {
            setLoading(true);
            getAttachmentSignedUrl(file.preview_path, { bucket: PREVIEWS_BUCKET })
                .then(url => setSignedUrl(url))
                .finally(() => setLoading(false));
        }
        // No preview_path and not unlocked (video/PDF/DOCX/other) — nothing to
        // fetch, file name/type shown below is all the buyer sees pre-approval.
    }, [unlocked, file.original_path, file.preview_path]);

    const showingImagePreview = !unlocked && file.preview_path && signedUrl;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.7rem', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)' }}>
            {showingImagePreview ? (
                <img
                    src={signedUrl}
                    alt="Preview"
                    title="Preview quality — full file after approval"
                    style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                />
            ) : (
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{unlocked ? '📄' : '🔒'}</span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.file_name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {unlocked
                        ? 'Full file'
                        : (file.preview_path ? 'Preview quality — full file after approval' : 'No preview available for this file type')}
                </div>
            </div>
            {unlocked && (
                loading ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>Loading…</span>
                ) : signedUrl ? (
                    <a href={signedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--peacock-green)', flexShrink: 0 }}>
                        View
                    </a>
                ) : null
            )}
        </div>
    );
}
