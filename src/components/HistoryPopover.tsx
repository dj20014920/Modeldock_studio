import React, { useEffect, useState, useRef } from 'react';
import { HistoryService } from '../services/historyService';
import { BYOKHistoryService, BYOKConversation } from '../services/byokHistoryService';
import { ConversationMetadata, BYOKProviderId } from '../types';
import { MessageSquare, Trash2, Plus, Clock, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

interface HistoryPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadHistory: (id: string) => void;
    onNewChat: () => void;
    currentConversationId: string | null;
    mode?: 'global' | 'byok'; // Default 'global'
    providerId?: BYOKProviderId; // Only for 'byok' mode
}

export const HistoryPopover: React.FC<HistoryPopoverProps> = ({
    isOpen,
    onClose,
    onLoadHistory,
    onNewChat,
    currentConversationId,
    mode = 'global',
    providerId
}) => {
    const { t } = useTranslation();
    const [history, setHistory] = useState<(ConversationMetadata | BYOKConversation)[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            loadHistory();
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    const loadHistory = async () => {
        setIsLoading(true);
        try {
            let list: (ConversationMetadata | BYOKConversation)[] = [];
            if (mode === 'byok') {
                if (providerId) {
                    list = await BYOKHistoryService.getInstance().getHistoryByProvider(providerId);
                } else {
                    list = await BYOKHistoryService.getInstance().getAllHistory();
                }
            } else {
                list = await HistoryService.getInstance().getHistoryList();
            }
            // Sort by updated at desc
            setHistory(list.sort((a, b) => b.updatedAt - a.updatedAt));
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm(t('common.deleteConfirm') || 'Are you sure you want to delete this conversation?')) {
            if (mode === 'byok') {
                await BYOKHistoryService.getInstance().deleteConversation(id);
            } else {
                await HistoryService.getInstance().deleteConversation(id);
            }
            loadHistory();
        }
    };

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            ref={popoverRef}
            className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right"
            style={{ maxHeight: '500px' }}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Clock size={16} className="text-indigo-500" />
                        {mode === 'byok' ? 'Model History' : 'History'}
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onNewChat}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-full transition-all shadow-sm hover:shadow-md active:scale-95"
                        >
                            <Plus size={14} />
                            New Chat
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mr-2"></div>
                        <span className="text-xs">Loading...</span>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center px-4">
                        <MessageSquare size={24} className="mb-2 opacity-50" />
                        <p className="text-sm font-medium">No conversations found</p>
                        <p className="text-xs mt-1 opacity-70">Start a new chat to see it here</p>
                    </div>
                ) : (
                    filteredHistory.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => {
                                onLoadHistory(item.id);
                                onClose();
                            }}
                            className={clsx(
                                "group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent",
                                currentConversationId === item.id
                                    ? "bg-indigo-50 border-indigo-100"
                                    : "hover:bg-slate-50 hover:border-slate-100"
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold mt-0.5",
                                currentConversationId === item.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm"
                            )}>
                                {(item as any).modelCount > 1 ? (item as any).modelCount : <MessageSquare size={14} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                    <h4 className={clsx(
                                        "text-sm font-semibold truncate pr-2",
                                        currentConversationId === item.id ? "text-indigo-900" : "text-slate-700"
                                    )}>
                                        {item.title || 'Untitled Conversation'}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 shrink-0 tabular-nums">
                                        {formatDate(item.updatedAt)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 truncate leading-relaxed opacity-80">
                                    {item.preview || 'No preview available'}
                                </p>
                            </div>

                            <button
                                onClick={(e) => handleDelete(e, item.id)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete conversation"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                <span className="text-[10px] text-slate-400 font-medium">
                    {history.length} conversations stored
                </span>
            </div>
        </div>
    );
};
