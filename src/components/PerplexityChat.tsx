import React, { useEffect, useState, useRef } from 'react';
import { perplexityService, PerplexityState, PerplexityFile } from '../services/perplexity-service';
import { Bot, User, AlertCircle, Loader2, BrainCircuit, Paperclip, Send, XCircle } from 'lucide-react';
import { clsx } from 'clsx';

export const PerplexityChat: React.FC = () => {
    const [state, setState] = useState<PerplexityState>({
        messages: [],
        isStreaming: false,
        error: null,
        deepResearchEnabled: false
    });

    const [input, setInput] = useState('');
    const [files, setFiles] = useState<PerplexityFile[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const unsubscribe = perplexityService.subscribe(setState);
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
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        if ((!input.trim() && files.length === 0) || state.isStreaming) return;

        perplexityService.sendMessage(input, files);
        setInput('');
        setFiles([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header Controls */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">Mode:</span>
                    <button
                        onClick={() => perplexityService.toggleDeepResearch()}
                        className={clsx(
                            "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                            state.deepResearchEnabled
                                ? "bg-teal-100 text-teal-700 border border-teal-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        )}
                    >
                        <BrainCircuit size={12} />
                        {state.deepResearchEnabled ? 'Deep Research' : 'Quick Search'}
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                {state.messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <BrainCircuit size={32} className="text-teal-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">Ask Perplexity</h3>
                        <p className="text-sm text-slate-500 max-w-xs text-center">
                            Deep research, real-time answers, and document analysis.
                        </p>
                    </div>
                ) : (
                    state.messages.map((msg, idx) => (
                        <div key={idx} className={clsx(
                            "flex gap-4 max-w-full",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}>
                            <div className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1",
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
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white border border-slate-100 text-slate-800 rounded-tl-none"
                                )}>
                                    {/* Attachments Display (User) */}
                                    {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {msg.attachments.map((file, i) => (
                                                <div key={i} className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded text-xs">
                                                    <span className="opacity-75">📎</span>
                                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="whitespace-pre-wrap break-words markdown-body">
                                        {msg.content || (state.isStreaming && idx === state.messages.length - 1 ? <span className="animate-pulse">Thinking...</span> : '')}
                                    </div>
                                </div>

                                {/* Citations (Assistant) */}
                                {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-1 ml-1">
                                        {msg.citations.map((cit, i) => (
                                            <a key={i} href={cit} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-full border border-slate-200 transition-colors truncate max-w-[150px]">
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
                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 mx-4 animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle size={16} />
                        <span>{state.error}</span>
                    </div>
                )}

                {state.isStreaming && (
                    <div className="flex justify-center py-2">
                        <Loader2 size={16} className="animate-spin text-teal-500" />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex flex-col gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all shadow-sm">

                    {/* File Preview */}
                    {files.length > 0 && (
                        <div className="flex gap-2 px-2 pt-2 overflow-x-auto">
                            {files.map((file, i) => (
                                <div key={i} className="relative group flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                                    <div className="text-xs font-medium text-slate-600 truncate max-w-[100px]">{file.name}</div>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                    >
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
                        placeholder={state.deepResearchEnabled ? "Ask a deep research question..." : "Ask anything..."}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[44px] max-h-32 py-2.5 px-3 text-sm text-slate-800 placeholder:text-slate-400"
                        rows={1}
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = target.scrollHeight + 'px';
                        }}
                    />

                    <div className="flex items-center justify-between px-2 pb-1">
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Attach file or image"
                            >
                                <Paperclip size={18} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                multiple
                                onChange={handleFileSelect}
                            />
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={(!input.trim() && files.length === 0) || state.isStreaming}
                            className={clsx(
                                "p-2 rounded-lg transition-all flex items-center justify-center",
                                (input.trim() || files.length > 0) && !state.isStreaming
                                    ? "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {state.isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        </button>
                    </div>
                </div>
                <div className="text-[10px] text-center text-slate-400 mt-2">
                    {state.deepResearchEnabled ? "Deep Research Mode Active" : "Quick Search Mode"}
                </div>
            </div>
        </div>
    );
};
