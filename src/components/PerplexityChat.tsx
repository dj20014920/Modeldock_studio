import React, { useEffect, useState, useRef } from 'react';
import { perplexityService, PerplexityState, PerplexityFile } from '../services/perplexity-service';
import { Bot, User, AlertCircle, Loader2, BrainCircuit, Paperclip, Send, XCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export const PerplexityChat: React.FC = () => {
    const { t } = useTranslation();
    const [state, setState] = useState<PerplexityState>({
        messages: [],
        isStreaming: false,
        error: null,
        deepResearchEnabled: false
    });

    const [input, setInput] = useState('');
    const [files, setFiles] = useState<PerplexityFile[]>([]);
    const [quota, setQuota] = useState(perplexityService.quota);
    const [tier, setTier] = useState<'free' | 'pro'>(perplexityService.tier);
    const [showTierMenu, setShowTierMenu] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = perplexityService.subscribe((newState) => {
            setState(newState);
            setQuota(perplexityService.quota); // Update quota on state change
        });
        return () => { unsubscribe(); };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [state.messages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    if (ev.target?.result) {
                        setFiles(prev => [...prev, {
                            name: file.name,
                            type: file.type,
                            data: ev.target!.result as string
                        }]);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!input.trim() && files.length === 0) || state.isStreaming) return;

        try {
            await perplexityService.sendMessage(input, files);
            setInput('');
            setFiles([]);
        } catch (error: any) {
            // Handle login required error
            if (error.message === 'PERPLEXITY_LOGIN_REQUIRED') {
                // Show login prompt toast instead of inline error
                const shouldLogin = confirm(
                    t('perplexity.login.message') + '\n\n' +
                    t('perplexity.login.featureLimited')
                );

                if (shouldLogin) {
                    perplexityService.promptLogin();
                }
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTierChange = (newTier: 'free' | 'pro') => {
        perplexityService.setTier(newTier);
        setTier(newTier);
        setQuota(perplexityService.quota);
        setShowTierMenu(false);
    };

    return (
        <div className="flex flex-col h-full bg-white font-sans">
            {/* Header Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-teal-500 rounded-md flex items-center justify-center text-white">
                        <BrainCircuit size={14} />
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">Perplexity</span>
                </div>

                {/* Quota & Tier Badge */}
                <div className="relative">
                    <button
                        onClick={() => setShowTierMenu(!showTierMenu)}
                        className="flex items-center gap-2 px-2 py-1 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                        <span className={clsx(
                            "w-2 h-2 rounded-full",
                            tier === 'pro' ? "bg-amber-400" : "bg-slate-400"
                        )} />
                        <span className="text-xs font-medium text-slate-600">
                            {tier === 'pro' ? t('perplexity.tier.pro') : t('perplexity.tier.free')}
                        </span>
                        <span className="text-xs text-slate-400 border-l border-slate-200 pl-2 ml-1">
                            {quota.remaining} {t('perplexity.quota.left')}
                        </span>
                    </button>

                    {showTierMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs text-slate-500 font-medium">
                                {t('perplexity.quota.selectTier')}
                            </div>
                            <button
                                onClick={() => handleTierChange('free')}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between group"
                            >
                                <span>{t('perplexity.quota.freePlan')}</span>
                                {tier === 'free' && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                            </button>
                            <button
                                onClick={() => handleTierChange('pro')}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between group"
                            >
                                <span>{t('perplexity.quota.proPlan')}</span>
                                {tier === 'pro' && <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {state.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3 transition-transform hover:rotate-0">
                            <BrainCircuit size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">{t('perplexity.chat.emptyTitle')}</h3>
                        <p className="text-sm text-slate-500 max-w-xs text-center leading-relaxed">
                            {t('perplexity.chat.emptyDescription')}
                        </p>
                    </div>
                ) : (
                    state.messages.map((msg, idx) => (
                        <div key={idx} className={clsx(
                            "flex gap-4 max-w-full group",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 transition-transform group-hover:scale-105",
                                msg.role === 'user' ? "bg-slate-100 border border-slate-200" : "bg-teal-50 border border-teal-100 text-teal-600"
                            )}>
                                {msg.role === 'user' ? <User size={16} className="text-slate-500" /> : <Bot size={18} />}
                            </div>

                            <div className={clsx(
                                "flex flex-col gap-1 max-w-[85%]",
                                msg.role === 'user' ? "items-end" : "items-start"
                            )}>
                                <div className={clsx(
                                    "rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                                    msg.role === 'user'
                                        ? "bg-slate-800 text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                                )}>
                                    {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {msg.attachments.map((file, i) => (
                                                <div key={i} className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-md text-xs border border-white/10">
                                                    <Paperclip size={12} className="opacity-70" />
                                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="whitespace-pre-wrap break-words markdown-body">
                                        {msg.content || (state.isStreaming && idx === state.messages.length - 1 ? <span className="animate-pulse">{t('perplexity.chat.thinking')}</span> : '')}
                                    </div>
                                </div>

                                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2 ml-1">
                                        {msg.citations.map((cit, i) => (
                                            <a key={i} href={cit} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200 transition-colors truncate max-w-[200px]">
                                                <span className="w-3 h-3 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">{i + 1}</span>
                                                {new URL(cit).hostname.replace('www.', '')}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}


                {state.error && (
                    <div className={clsx(
                        "flex items-center gap-3 p-4 text-sm rounded-xl border mx-4 animate-in fade-in slide-in-from-bottom-2 shadow-sm",
                        state.error === 'LOGIN_PROMPT_OPENED'
                            ? "bg-teal-50 text-teal-700 border-teal-100"
                            : "bg-red-50 text-red-700 border-red-100"
                    )}>
                        {state.error === 'LOGIN_PROMPT_OPENED' ? (
                            <>
                                <AlertCircle size={18} className="shrink-0 text-teal-600" />
                                <span>{t('perplexity.login.tabOpened')}</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={18} className="shrink-0" />
                                <span>
                                    {(() => {
                                        if (state.error?.includes('404')) return t('perplexity.error.404');
                                        if (state.error?.includes('403')) return t('perplexity.error.403');
                                        if (state.error?.includes('429')) return t('perplexity.error.429');
                                        if (state.error?.includes('500')) return t('perplexity.error.500');
                                        if (state.error?.includes('quota exceeded')) return t('perplexity.error.quotaExceeded', { tier: t(`perplexity.tier.${tier}`) });
                                        return t('perplexity.error.generic', { message: state.error });
                                    })()}
                                </span>
                            </>
                        )}
                    </div>
                )}

                {state.isStreaming && (
                    <div className="flex justify-center py-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 text-xs font-medium text-slate-500">
                            <Loader2 size={14} className="animate-spin text-teal-500" />
                            <span>{t('perplexity.chat.thinking')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className={clsx(
                    "relative flex flex-col gap-2 bg-white border rounded-2xl p-3 transition-all shadow-sm",
                    state.isStreaming ? "border-slate-200 bg-slate-50" : "border-slate-300 focus-within:ring-2 focus-within:ring-teal-500/10 focus-within:border-teal-500"
                )}>
                    {files.length > 0 && (
                        <div className="flex gap-2 px-1 pb-2 overflow-x-auto border-b border-slate-100 mb-1">
                            {files.map((file, i) => (
                                <div key={i} className="relative group flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                                    <div className="text-xs font-medium text-slate-600 truncate max-w-[100px]">{file.name}</div>
                                    <button onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={state.deepResearchEnabled ? t('perplexity.chat.deepResearchPlaceholder') : t('perplexity.chat.placeholder')}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[48px] max-h-32 py-2 px-2 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed"
                        rows={1}
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                        }}
                    />

                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            {/* Mode Toggle */}
                            <button
                                onClick={() => perplexityService.toggleDeepResearch()}
                                className={clsx(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                    state.deepResearchEnabled
                                        ? "bg-teal-50 text-teal-700 border border-teal-200 shadow-sm"
                                        : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
                                )}
                            >
                                <BrainCircuit size={14} className={state.deepResearchEnabled ? "text-teal-600" : "text-slate-400"} />
                                <span>{state.deepResearchEnabled ? t('perplexity.chat.proSearch') : t('perplexity.chat.quickSearch')}</span>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                                <Paperclip size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={(!input.trim() && files.length === 0) || state.isStreaming}
                            className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                (input.trim() || files.length > 0) && !state.isStreaming
                                    ? "bg-teal-500 text-white hover:bg-teal-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                            )}
                        >
                            {state.isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-center mt-3">
                    <span className="text-[10px] text-slate-400 font-medium">
                        {state.deepResearchEnabled
                            ? t('perplexity.chat.proSearchInfo', { remaining: quota.remaining })
                            : t('perplexity.chat.quickSearchInfo')}
                    </span>
                </div>
            </div>
        </div>
    );
};
