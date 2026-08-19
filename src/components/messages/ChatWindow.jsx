import React, { useState, useRef, useEffect } from 'react';
import { getAttachmentSignedUrl } from '../../utils/attachmentStorage.js';
import { ChatWindowSkeleton } from './SkeletonLoaders.jsx';

function MessageAttachment({ fileUrl, content, isSelf }) {
    const [signedUrl, setSignedUrl] = useState(fileUrl);

    useEffect(() => {
        if (!fileUrl) return;
        getAttachmentSignedUrl(fileUrl).then(url => {
            if (url) setSignedUrl(url);
        });
    }, [fileUrl]);

    if (!signedUrl) return null;
    const isImage = signedUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || fileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i);
    const fileName = content || fileUrl.split('/').pop() || 'Attachment';

    if (isImage) {
        return (
            <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block max-w-[280px]">
                <img src={signedUrl} alt="attachment" className={`max-w-full max-h-[220px] rounded-lg block object-cover ${content ? 'mb-2' : ''}`} />
            </a>
        );
    }

    // Clean Card for non-image attachments
    return (
        <a 
            href={signedUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`flex items-center gap-3 p-3 rounded-xl min-w-[200px] max-w-[280px] no-underline transition-colors ${
                isSelf ? 'bg-emerald-700/10 hover:bg-emerald-700/20 text-emerald-900' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            } ${content && fileName !== content ? 'mb-2' : ''}`}
        >
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg shrink-0 ${isSelf ? 'bg-emerald-700/20' : 'bg-white shadow-sm'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold truncate leading-tight">{fileName}</span>
                <span className="text-xs opacity-70">Document</span>
            </div>
        </a>
    );
}

export default function ChatWindow({
    conversation,
    messages = [],
    loadingMsgs = false,
    user,
    onSend,
    onAcceptRequest,
    onIgnoreRequest,
    onBlockRequest,
    onOpenProfile,
    onClearChat,
    onlineUsers = new Set()
}) {
    const [text, setText] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [sending, setSending] = useState(false);
    
    // New states for the 3-dot menu and search
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const fileInputRef = useRef(null);
    const messageEndRef = useRef(null);
    const textareaRef = useRef(null);

    // Filter messages if searching
    const displayedMessages = showSearch && searchQuery.trim() 
        ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()) || m.file_url?.toLowerCase().includes(searchQuery.toLowerCase()))
        : messages;

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messageEndRef.current && !showSearch) {
            messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [displayedMessages, loadingMsgs, showSearch]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.dropdown-container')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (!conversation) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] z-10 min-h-0">
                <div className="w-64 h-64 opacity-50 mb-6">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#94A3B8" strokeWidth="1" />
                        <path d="M8 12L11 15L16 9" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <h2 className="text-xl font-light text-gray-500">Select a conversation to start chatting</h2>
            </div>
        );
    }

    if (loadingMsgs) return <ChatWindowSkeleton />;

    // URGENT fix: gig conversations are exempt from the connection-request reply
    // gate entirely — this gate was silently locking real paid gig threads (the
    // applicant/poster pair aren't necessarily "Connected" via the separate Peers
    // system, and there's no reason a real gig contract's messaging should depend
    // on that). conversation.isGigConversation comes from Messages.jsx's batched
    // gig_applications lookup, same signal the Gig Rooms tab split already uses.
    const isLockedForReply = !conversation.isGigConversation && !conversation.isConnection && conversation.lastMsg?.sender_id !== user.id;

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleInput = (e) => {
        setText(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = async () => {
        if (sending || (!text.trim() && !attachment)) return;
        setSending(true);
        try {
            await onSend(text, attachment);
            setText('');
            setAttachment(null);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            // Scroll to bottom immediately
            if (messageEndRef.current) {
                messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } finally {
            setSending(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]; 
        if (!file) return;
        setAttachment(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const peer = conversation.peer || {};
    const isOnline = onlineUsers.has(conversation.peerId);

    const renderAvatar = (avatarData, name, size = 40) => {
        let base = name?.[0]?.toUpperCase() || '?';
        let bg = 'linear-gradient(135deg, #115E59 0%, #059669 100%)';
        return (
            <div style={{ width: size, height: size, borderRadius: '50%', background: bg }} className="flex items-center justify-center text-white font-extrabold shrink-0 select-none text-[1rem]">
                <span>{base}</span>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col bg-gray-50 relative min-h-0">
            
            {/* Header */}
            <div className="h-[72px] px-6 bg-white/95 backdrop-blur-md flex items-center justify-between border-b border-gray-200 shrink-0 z-20 shadow-sm">
                <div className="flex items-center gap-3 cursor-pointer group" onClick={onOpenProfile}>
                    <div className="relative">
                        {renderAvatar(peer.avatar_url, peer.full_name || peer.username || 'P', 44)}
                        {isOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] rounded-full border-2 border-white" />}
                    </div>
                    <div>
                        <div className="text-[1.05rem] font-bold text-gray-900 group-hover:text-[#059669] transition-colors leading-snug">{peer.full_name || peer.username || 'Chavee Peer'}</div>
                        <div className={`text-xs font-semibold ${isOnline ? 'text-[#059669]' : 'text-gray-500'}`}>
                            {isOnline ? '● Online' : peer.college || 'click for info'}
                        </div>
                    </div>
                </div>
                <div className="flex gap-1 items-center dropdown-container relative">
                    <button onClick={() => setShowDropdown(!showDropdown)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" title="More options">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>
                    </button>
                    {showDropdown && (
                        <div className="absolute top-10 right-0 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50 overflow-hidden">
                            <button onClick={() => { setShowSearch(!showSearch); setShowDropdown(false); if(!showSearch) setSearchQuery(''); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                                Search in Chat
                            </button>
                            <div className="h-px w-full bg-gray-100 my-1"></div>
                            <button onClick={() => { if(onClearChat) onClearChat(); setShowDropdown(false); }} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">
                                Clear Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
                <div className="bg-white border-b border-gray-200 p-3 shrink-0 flex items-center gap-2 animate-in slide-in-from-top-2 z-10 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-400 ml-1"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                    <input 
                        type="text" 
                        placeholder="Search messages..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent border-none text-sm outline-none placeholder-gray-400 text-gray-800"
                        autoFocus
                    />
                    <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            )}

            {/* Request Action Bar */}
            {isLockedForReply && (
                <div className="bg-white p-4 shadow-sm z-10 border-b border-gray-200 shrink-0">
                    <div className="text-sm font-medium text-gray-800 mb-3 text-center">
                        {peer.full_name || peer.username} is not in your connections. Accept their request to reply.
                    </div>
                    <div className="flex justify-center gap-3">
                        <button onClick={onAcceptRequest} className="px-6 py-2 bg-[#059669] hover:bg-emerald-700 text-white rounded-full text-sm font-bold shadow-sm transition-all transform active:scale-95">Accept Connection</button>
                        <button onClick={onIgnoreRequest} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-bold transition-all transform active:scale-95">Ignore</button>
                        {/* Real blocking isn't built yet (onBlockRequest is a stub that only
                            hides the conversation locally) — disabled + labeled honestly
                            instead of looking like a working action. */}
                        <button disabled title="Coming soon" className="px-6 py-2 bg-gray-50 text-gray-400 rounded-full text-sm font-bold cursor-not-allowed">Block (Coming soon)</button>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-1 z-0 scroll-smooth min-h-0">
                {displayedMessages.length === 0 ? (
                    <div className="m-auto bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-medium text-gray-500 shadow-sm border border-gray-100 text-center">
                        {showSearch ? 'No messages found.' : 'Say hello! Start the conversation 👋'}
                    </div>
                ) : (
                    displayedMessages.map((m, idx) => {
                        const isSelf = m.sender_id === user.id;
                        const showDate = idx === 0 || new Date(m.created_at).toDateString() !== new Date(displayedMessages[idx - 1]?.created_at).toDateString();
                        const isSequence = idx > 0 && displayedMessages[idx - 1].sender_id === m.sender_id && !showDate;

                        return (
                            <React.Fragment key={m.id}>
                                {showDate && (
                                    <div className="text-center my-4">
                                        <span className="bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-gray-500 shadow-sm uppercase tracking-wider">
                                            {new Date(m.created_at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                                <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} ${isSequence ? 'mt-0' : 'mt-2'}`}>
                                    <div className={`
                                        max-w-[75%] md:max-w-[65%] px-4 py-2 relative group
                                        ${isSelf ? 'bg-[#059669] text-white' : 'bg-white text-gray-900'}
                                        ${isSelf 
                                            ? (isSequence ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tr-none') 
                                            : (isSequence ? 'rounded-2xl rounded-tl-sm' : 'rounded-2xl rounded-tl-none')}
                                        shadow-sm border ${!isSelf ? 'border-gray-200' : 'border-transparent'}
                                    `}>
                                        {m.file_url && (
                                            <MessageAttachment fileUrl={m.file_url} content={m.content} isSelf={isSelf} />
                                        )}
                                        {(!m.file_url || m.content !== m.file_url) && m.content && (
                                            <div className="break-words whitespace-pre-wrap text-[0.95rem] leading-snug pr-12 pb-2">{m.content}</div>
                                        )}
                                        <div className={`absolute bottom-1 right-2 flex items-center gap-1 text-[0.65rem] ${isSelf ? 'text-emerald-100/90' : 'text-gray-400'}`}>
                                            <span>{formatTime(m.created_at)}</span>
                                            {isSelf && (
                                                <span className={`text-[0.7rem] font-bold ${m.is_read ? 'text-white' : 'text-emerald-100/60'}`}>
                                                    {m.is_read ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        );
                    })
                )}
                <div ref={messageEndRef} className="h-4 shrink-0" />
            </div>

            {/* Input Area */}
            <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 border-t border-gray-200 z-20 flex flex-col shrink-0">
                {attachment && (
                    <div className="mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm max-w-sm ml-12">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-xl">📎</div>
                            <div className="text-sm font-semibold text-gray-700 max-w-[200px] truncate">{attachment.name}</div>
                        </div>
                        <button onClick={() => setAttachment(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                <div className="flex items-end gap-2 sm:gap-3">
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 sm:p-3 text-gray-400 hover:text-[#059669] hover:bg-emerald-50 rounded-full transition-colors shrink-0 mb-0.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" /></svg>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    
                    <div className="flex-1 bg-gray-100 rounded-2xl flex items-center border border-transparent focus-within:border-[#059669]/30 focus-within:bg-white transition-all overflow-hidden min-h-[48px]">
                        <textarea 
                            ref={textareaRef}
                            value={text} 
                            onChange={handleInput} 
                            onKeyDown={handleKeyDown}
                            placeholder={isLockedForReply ? "Accept request to reply..." : "Type a message..."}
                            disabled={sending || isLockedForReply}
                            rows={1}
                            className="flex-1 bg-transparent border-none px-4 py-3 text-[0.95rem] text-gray-800 placeholder-gray-400 focus:ring-0 outline-none resize-none max-h-[120px] scrollbar-thin overflow-y-auto leading-snug"
                        />
                        <button className="p-3 text-gray-400 hover:text-[#059669] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm3.65 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Z" /></svg>
                        </button>
                    </div>

                    <button 
                        type="button" 
                        onClick={handleSend} 
                        disabled={sending || (!text.trim() && !attachment) || isLockedForReply}
                        className={`w-[48px] h-[48px] rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-200 transform ${
                            (text.trim() || attachment) 
                            ? 'bg-[#059669] text-white hover:bg-emerald-700 shadow-md active:scale-95' 
                            : 'bg-gray-100 text-gray-400'
                        }`}
                    >
                        {sending ? (
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1"><path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" /></svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
