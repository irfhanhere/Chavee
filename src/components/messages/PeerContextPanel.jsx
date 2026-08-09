import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';
import { getAttachmentSignedUrl } from '../../utils/attachmentStorage.js';

export default function PeerContextPanel({ peer, activeId, user }) {
    const [sharedMedia, setSharedMedia] = useState([]);
    const [sharedConnections, setSharedConnections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!peer || !activeId || !user) return;

        const fetchContextData = async () => {
            setLoading(true);
            try {
                // 1. Fetch Shared Media (messages with file_url in this conversation)
                const { data: mediaMsgs } = await supabase
                    .from('messages')
                    .select('id, file_url, content, created_at')
                    .eq('conversation_id', activeId)
                    .not('file_url', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(20);

                if (mediaMsgs) {
                    const resolvedMedia = await Promise.all(
                        mediaMsgs.map(async (m) => {
                            const url = await getAttachmentSignedUrl(m.file_url);
                            return { ...m, signedUrl: url };
                        })
                    );
                    setSharedMedia(resolvedMedia.filter(m => m.signedUrl));
                }

                // 2. Fetch Shared Connections
                // User's connections
                const { data: myConns } = await supabase
                    .from('connections')
                    .select('user_one, user_two')
                    .or(`user_one.eq.${user.id},user_two.eq.${user.id}`);
                
                // Peer's connections
                const { data: peerConns } = await supabase
                    .from('connections')
                    .select('user_one, user_two')
                    .or(`user_one.eq.${peer.id},user_two.eq.${peer.id}`);

                if (myConns && peerConns) {
                    const myIds = new Set(myConns.map(c => c.user_one === user.id ? c.user_two : c.user_one));
                    const peerIds = peerConns.map(c => c.user_one === peer.id ? c.user_two : c.user_one);
                    const sharedIds = peerIds.filter(id => myIds.has(id));

                    if (sharedIds.length > 0) {
                        const { data: sharedProfiles } = await supabase
                            .from('profiles')
                            .select('id, full_name, username, avatar_url')
                            .in('id', sharedIds)
                            .limit(5);
                        setSharedConnections(sharedProfiles || []);
                    } else {
                        setSharedConnections([]);
                    }
                }
            } catch (err) {
                console.error("Error fetching context data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchContextData();
    }, [peer, activeId, user]);

    if (!peer) return null;

    const renderAvatar = (avatarData, name, size = 80) => {
        let base = name?.[0]?.toUpperCase() || '?';
        let bg = 'linear-gradient(135deg, #115E59 0%, #059669 100%)';
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', background: bg }} className="flex items-center justify-center text-white font-extrabold shrink-0 select-none text-[2.5rem] mx-auto shadow-sm">
                <span>{base}</span>
            </div>
        );
    };

    return (
        <div className="w-full md:w-[320px] lg:w-[350px] shrink-0 border-l border-gray-200 bg-white h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="h-[72px] px-6 flex items-center border-b border-gray-200 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">Details</h2>
            </div>

            {/* Profile Section */}
            <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
                <div className="mb-4 relative">
                    {renderAvatar(peer.avatar_url, peer.full_name || peer.username || 'P', 90)}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{peer.full_name || peer.username}</h3>
                {peer.username && <p className="text-sm font-medium text-gray-500 mb-2">@{peer.username}</p>}
                {peer.college && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold mt-1">
                        🎓 {peer.college}
                    </span>
                )}
                {peer.bio && (
                    <p className="mt-4 text-sm text-gray-600 leading-relaxed px-2">
                        {peer.bio}
                    </p>
                )}
            </div>

            {/* Shared Connections */}
            <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    Shared Connections
                </h4>
                {loading ? (
                    <div className="animate-pulse flex gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                ) : sharedConnections.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {sharedConnections.map(conn => (
                            <div key={conn.id} className="relative group cursor-pointer" title={conn.full_name}>
                                {renderAvatar(conn.avatar_url, conn.full_name || conn.username, 36)}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 font-medium">No shared connections</p>
                )}
            </div>

            {/* Shared Media */}
            <div className="p-6">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-emerald-600">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    Shared Media
                </h4>
                {loading ? (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="aspect-square bg-gray-100 rounded-lg animate-pulse"></div>
                        <div className="aspect-square bg-gray-100 rounded-lg animate-pulse"></div>
                        <div className="aspect-square bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                ) : sharedMedia.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                        {sharedMedia.map(m => {
                            const isImage = m.signedUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || m.file_url.match(/\.(jpeg|jpg|gif|png|webp)/i);
                            if (isImage) {
                                return (
                                    <a key={m.id} href={m.signedUrl} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:opacity-80 transition-opacity">
                                        <img src={m.signedUrl} alt="shared" className="w-full h-full object-cover" />
                                    </a>
                                );
                            }
                            return (
                                <a key={m.id} href={m.signedUrl} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg border border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors p-1 text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 mb-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                    <span className="text-[0.6rem] text-gray-500 font-medium truncate w-full px-1">{m.content || 'File'}</span>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 font-medium">No shared media</p>
                )}
            </div>
        </div>
    );
}
