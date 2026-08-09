import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RightSidebarSkeleton } from './SkeletonLoaders.jsx';
import { getAttachmentSignedUrl } from '../../utils/attachmentStorage.js';
import { useToast } from '../../components/Toast.jsx';
import { supabase } from '../../supabaseClient.js';

function MediaThumbnail({ fileUrl }) {
    const [url, setUrl] = useState(fileUrl);
    useEffect(() => {
        if (!fileUrl) return;
        getAttachmentSignedUrl(fileUrl).then(u => { if (u) setUrl(u); });
    }, [fileUrl]);

    if (!url) return null;
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)/i) || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i);
    
    if (isImage) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt="media" className="w-[72px] h-[72px] object-cover rounded-xl border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity" />
            </a>
        );
    }
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="w-[72px] h-[72px] bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        </a>
    );
}

export default function RightSidebar({
    peer,
    messages = [],
    loading = false,
    onClose,
    onlineUsers = new Set(),
    connectionsData = [],
    currentUserId
}) {
    const { showToast } = useToast();
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [mutualCount, setMutualCount] = useState(0);

    useEffect(() => {
        if (!currentUserId || !peer?.id || !connectionsData?.length) return;
        const myConnectedIds = connectionsData.map(c => c.user_one === currentUserId ? c.user_two : c.user_one);
        supabase.from('connections').select('user_one, user_two')
            .or(`user_one.eq.${peer.id},user_two.eq.${peer.id}`)
            .then(({ data: peerConns }) => {
                if (peerConns) {
                    const peerIds = peerConns.map(c => c.user_one === peer.id ? c.user_two : c.user_one);
                    const myIdsSet = new Set(myConnectedIds);
                    setMutualCount(peerIds.filter(id => myIdsSet.has(id)).length);
                }
            });
    }, [currentUserId, peer?.id, connectionsData]);

    // ── Guard: placed after all hooks ──
    if (loading || !peer) return <RightSidebarSkeleton />;

    const isOnline = onlineUsers.has(peer.id);
    const mediaMessages = messages.filter(m => m.file_url);

    // Calculate Connected Since
    let connectedSince = null;
    const connectionRecord = connectionsData.find(c => 
        (c.user_one === currentUserId && c.user_two === peer.id) ||
        (c.user_two === currentUserId && c.user_one === peer.id)
    );
    if (connectionRecord && connectionRecord.connected_at) {
        connectedSince = new Date(connectionRecord.connected_at).toLocaleDateString([], { month: 'long', year: 'numeric' });
    }

    const renderAvatar = (avatarData, name, size = 100) => {
        let base = name?.[0]?.toUpperCase() || '?';
        let bg = 'linear-gradient(135deg, #115E59 0%, #059669 100%)';
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', background: bg }} className="flex items-center justify-center text-white font-extrabold select-none text-[2.5rem] shadow-sm relative">
                <span>{base}</span>
                {isOnline && <span className="absolute bottom-1 right-2 w-5 h-5 bg-[#25D366] rounded-full border-4 border-white" />}
            </div>
        );
    };

    const handleReportSubmit = async () => {
        if (!reportReason.trim()) {
            showToast('Please select or enter a reason', 'error');
            return;
        }
        setIsReporting(true);
        try {
            const { error } = await supabase.from('reports_moderation').insert({
                reporter_id: currentUserId,
                reported_user_id: peer.id,
                reason: reportReason,
                status: 'Pending'
            });
            if (error) throw error;
            showToast('Report submitted successfully. Thank you.', 'success');
            setReportModalOpen(false);
            setReportReason('');
        } catch (err) {
            showToast('Failed to submit report: ' + err.message, 'error');
        } finally {
            setIsReporting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full lg:w-[320px] shrink-0 overflow-y-auto relative scrollbar-thin">
            
            {/* Mobile Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full lg:hidden z-10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>

            {/* Profile Section */}
            <div className="flex flex-col items-center pt-10 pb-6 border-b border-gray-100 px-6 text-center">
                <div className="mb-4">
                    {renderAvatar(peer.avatar_url, peer.full_name || peer.username || 'P')}
                </div>
                <h3 className="text-[1.35rem] font-bold text-gray-900 leading-tight">{peer.full_name || peer.username}</h3>
                <div className="flex items-center gap-1.5 mt-1.5 mb-4">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#25D366]' : 'bg-gray-300'}`} />
                    <span className="text-sm font-semibold text-gray-500">{isOnline ? 'Active Now' : 'Offline'}</span>
                </div>
                {peer.college && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 font-medium">
                        <span>🎓</span>
                        <span className="truncate max-w-[200px]">{peer.college}</span>
                    </div>
                )}
            </div>

            {/* About & Connections */}
            <div className="px-6 py-6 border-b border-gray-100 flex flex-col gap-5">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">About</h4>
                    <p className="text-[0.95rem] text-gray-800 leading-relaxed">
                        Student at {peer.college || 'Chavee University'}.
                    </p>
                </div>
                
                <div className="flex items-center justify-between text-[0.95rem]">
                    <span className="text-gray-500 font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                        Connected
                    </span>
                    <span className="font-semibold text-gray-900">{connectedSince || 'Not connected'}</span>
                </div>

                <div className="flex items-center justify-between text-[0.95rem]">
                    <span className="text-gray-500 font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                        Mutual Connections
                    </span>
                    <span className="font-semibold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-md cursor-pointer hover:bg-emerald-100 transition-colors">
                        {mutualCount} mutual{mutualCount !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Shared Media */}
            <div className="px-6 py-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Media & Files</h4>
                    {mediaMessages.length > 0 && (
                        <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2 py-1 rounded-full">{mediaMessages.length} files</span>
                    )}
                </div>
                
                {mediaMessages.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                        <p className="text-sm text-gray-400 font-medium">No media shared yet.</p>
                    </div>
                ) : (
                    <div className="flex gap-2 flex-wrap">
                        {mediaMessages.slice(-6).reverse().map(m => (
                            <MediaThumbnail key={m.id} fileUrl={m.file_url} />
                        ))}
                        {mediaMessages.length > 6 && (
                            <div className="w-[72px] h-[72px] bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 text-sm font-bold text-gray-500 cursor-pointer hover:bg-gray-100 shadow-sm transition-colors">
                                +{mediaMessages.length - 6}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="px-6 py-8 space-y-3 mt-auto">
                <Link 
                    to={`/profile/${peer.id}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-bold transition-all active:scale-95 border border-transparent hover:border-emerald-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                    View Profile
                </Link>
                <button 
                    onClick={() => setReportModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-bold transition-all active:scale-95 border border-transparent hover:border-gray-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>
                    Report User
                </button>
                <button 
                    onClick={() => showToast('Block functionality coming soon! (Stubbed)', 'info')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-all active:scale-95 border border-transparent hover:border-red-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                    Block User
                </button>
            </div>

            {/* Report Modal */}
            {reportModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Report {peer.full_name || peer.username}</h3>
                            <button onClick={() => setReportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">Please provide a reason for reporting this user. Our moderation team will review this shortly.</p>
                            <select 
                                value={reportReason} 
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none mb-4 bg-white"
                            >
                                <option value="" disabled>Select a reason...</option>
                                <option value="Inappropriate Content">Inappropriate Content</option>
                                <option value="Harassment or Bullying">Harassment or Bullying</option>
                                <option value="Spam or Scams">Spam or Scams</option>
                                <option value="Fake Account">Fake Account</option>
                                <option value="Other">Other</option>
                            </select>
                            <div className="flex gap-3 justify-end mt-4">
                                <button onClick={() => setReportModalOpen(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">Cancel</button>
                                <button onClick={handleReportSubmit} disabled={isReporting} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                                    {isReporting ? 'Submitting...' : 'Submit Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
