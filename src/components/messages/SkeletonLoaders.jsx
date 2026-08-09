import React from 'react';

export function ConversationListSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Header Skeleton */}
            <div className="h-[72px] px-4 flex items-center justify-between border-b border-gray-200 shrink-0">
                <div className="w-32 h-8 bg-gray-200 rounded-lg animate-pulse" />
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            </div>
            
            {/* Tabs & Search Skeleton */}
            <div className="px-4 py-3 border-b border-gray-200 space-y-3">
                <div className="flex gap-2">
                    <div className="w-16 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse" />
                </div>
                <div className="w-full h-10 bg-gray-100 rounded-xl animate-pulse" />
            </div>

            {/* List Skeleton */}
            <div className="flex-1 overflow-hidden p-2 space-y-1">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                        <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 animate-pulse" />
                        <div className="flex-1 min-w-0 py-1">
                            <div className="flex justify-between items-center mb-2">
                                <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                                <div className="w-10 h-3 bg-gray-200 rounded animate-pulse" />
                            </div>
                            <div className="w-3/4 h-3 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChatWindowSkeleton() {
    return (
        <div className="flex flex-col h-full bg-[#f8fafc]">
            {/* Chat Header Skeleton */}
            <div className="h-[72px] px-6 bg-white flex items-center justify-between border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                    <div>
                        <div className="w-24 h-4 bg-gray-200 rounded mb-2 animate-pulse" />
                        <div className="w-16 h-3 bg-gray-100 rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                </div>
            </div>

            {/* Messages Skeleton */}
            <div className="flex-1 p-6 flex flex-col justify-end gap-4">
                {[...Array(4)].map((_, i) => {
                    const isSelf = i % 2 === 1;
                    return (
                        <div key={i} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                            <div className={`w-64 h-12 rounded-2xl animate-pulse ${isSelf ? 'bg-[#d1fae5] rounded-br-sm' : 'bg-white rounded-bl-sm border border-gray-100'}`} />
                        </div>
                    );
                })}
            </div>

            {/* Input Skeleton */}
            <div className="p-4 bg-white border-t border-gray-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 h-12 bg-gray-100 rounded-full animate-pulse" />
                <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
            </div>
        </div>
    );
}

export function RightSidebarSkeleton() {
    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 p-6 overflow-y-auto">
            {/* Profile Skeleton */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse mb-4" />
                <div className="w-40 h-6 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="w-24 h-4 bg-gray-100 rounded animate-pulse" />
            </div>

            {/* About Skeleton */}
            <div className="mb-8">
                <div className="w-16 h-4 bg-gray-200 rounded mb-3 animate-pulse" />
                <div className="w-full h-3 bg-gray-100 rounded mb-2 animate-pulse" />
                <div className="w-full h-3 bg-gray-100 rounded mb-2 animate-pulse" />
                <div className="w-3/4 h-3 bg-gray-100 rounded animate-pulse" />
            </div>

            {/* Media Skeleton */}
            <div>
                <div className="w-40 h-4 bg-gray-200 rounded mb-4 animate-pulse" />
                <div className="flex gap-2 mb-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="w-16 h-16 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="w-16 h-16 bg-gray-100 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
