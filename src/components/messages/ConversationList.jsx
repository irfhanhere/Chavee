import React from 'react';
import { ConversationListSkeleton } from './SkeletonLoaders.jsx';

export default function ConversationList({ 
    conversations = [], 
    loading = false, 
    activeId = null, 
    onSelect, 
    searchQuery = '', 
    onSearchChange,
    activeTab = 'All', // 'All', 'Connect', 'Request'
    onTabChange,
    onlineUsers = new Set()
}) {
    if (loading) return <ConversationListSkeleton />;

    const renderAvatar = (avatarData, name, size = 48) => {
        let base = name?.[0]?.toUpperCase() || '?';
        let bg = 'linear-gradient(135deg, #115E59 0%, #059669 100%)';
        let accessory = '';
        if (avatarData) {
            try {
                const parsed = typeof avatarData === 'string' ? JSON.parse(avatarData) : avatarData;
                base = parsed.base || parsed.avatar || base;
                accessory = parsed.accessory || '';
                const rawBg = parsed.bg || 'mint';
                bg = rawBg.startsWith('linear-gradient') ? rawBg :
                    rawBg === 'gold' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
                    rawBg === 'purple' ? 'linear-gradient(135deg, #818CF8, #4F46E5)' :
                    rawBg === 'pink' ? 'linear-gradient(135deg, #EC4899, #BE185D)' :
                    rawBg === 'slate' ? 'linear-gradient(135deg, #1E293B, #0F172A)' :
                    'linear-gradient(135deg, #115E59, #059669)';
            } catch { base = avatarData?.[0]?.toUpperCase() || base; }
        }
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', background: bg }} className="flex items-center justify-center text-white font-extrabold shrink-0 relative select-none" style={{ fontSize: size * 0.38 }}>
                <span>{base}</span>
                {accessory && <span className="absolute -bottom-[1px] -right-[1px] bg-white rounded-full flex items-center justify-center border border-gray-100" style={{ fontSize: size * 0.27, padding: '0.06rem', width: size * 0.36, height: size * 0.36 }}>{accessory}</span>}
            </div>
        );
    };

    const getRelativeTime = (dateStr) => {
        if (!dateStr) return '';
        const diffMin = Math.floor((Date.now() - new Date(dateStr)) / 60000);
        if (diffMin < 1) return 'now';
        if (diffMin < 60) return diffMin + 'm';
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return diffHr + 'h';
        const diffDay = Math.floor(diffHr / 24);
        if (diffDay === 1) return 'Yesterday';
        return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const filteredConversations = conversations.filter(c => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q || (c.peer.full_name || c.peer.username || '').toLowerCase().includes(q);
        if (!matchesSearch) return false;

        if (activeTab === 'Connect') return c.isConnection;
        if (activeTab === 'Request') return !c.isConnection;
        return true; // 'All'
    });

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Header */}
            <div className="h-[72px] px-4 flex items-center justify-between border-b border-gray-200 shrink-0">
                <h2 className="text-xl font-bold text-[#059669]">Messages</h2>
                <button className="text-[#059669] hover:bg-emerald-50 p-2 rounded-full transition-colors" title="New Message">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                    </svg>
                </button>
            </div>

            {/* Tabs & Search */}
            <div className="px-4 py-3 border-b border-gray-200 flex flex-col gap-3 shrink-0">
                <div className="flex gap-2">
                    {['All', 'Connect', 'Request'].map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => onTabChange(tab)}
                            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                activeTab === tab 
                                ? 'bg-[#059669] text-white' 
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search conversations..." 
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-100 border-transparent rounded-xl text-sm focus:border-[#059669] focus:bg-white focus:ring-0 transition-colors outline-none"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto p-2 scroll-smooth">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 p-6 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm font-medium">No conversations found.</p>
                    </div>
                ) : (
                    filteredConversations.map(c => {
                        const isActive = activeId === c.id;
                        const hasUnread = c.unread > 0;
                        const preview = c.lastMsg ? (c.lastMsg.file_url ? '📎 Attachment' : c.lastMsg.content) : '';
                        
                        return (
                            <div 
                                key={c.id} 
                                onClick={() => onSelect(c)}
                                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 mb-1 ${
                                    isActive ? 'bg-[#f0fdf4]' : 'hover:bg-gray-50'
                                }`}
                            >
                                <div className="relative shrink-0">
                                    {renderAvatar(c.peer.avatar_url, c.peer.full_name || 'P', 48)}
                                    {onlineUsers.has(c.peerId) && (
                                        <span className="absolute bottom-[2px] right-[2px] w-3 h-3 bg-[#25D366] rounded-full border-2 border-white" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 border-b border-transparent">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[1.05rem] font-semibold text-gray-900 truncate">
                                            {c.peer.full_name || c.peer.username || 'Chavee Peer'}
                                        </span>
                                        <span className={`text-xs whitespace-nowrap ${hasUnread ? 'text-[#059669] font-bold' : 'text-gray-400 font-medium'}`}>
                                            {c.lastMsg ? getRelativeTime(c.lastMsg.created_at) : ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[0.85rem] truncate flex-1 ${hasUnread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                            {c.lastMsg?.sender_id && c.lastMsg.sender_id !== c.peerId && <span className="text-gray-400 mr-1">✓</span>}
                                            {preview}
                                        </span>
                                        {hasUnread && (
                                            <span className="bg-[#059669] text-white rounded-full text-[0.7rem] font-bold min-w-[20px] h-5 flex items-center justify-center px-1.5 ml-2 shadow-sm">
                                                {c.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
