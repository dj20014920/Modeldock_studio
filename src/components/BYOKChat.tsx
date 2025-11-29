import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface BYOKChatProps {
    messages: ChatMessage[];
    isStreaming?: boolean;
    onSendMessage?: (message: string) => Promise<void>;
}

export const BYOKChat: React.FC<BYOKChatProps> = ({ messages, isStreaming, onSendMessage }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isStreaming]);

    const handleSend = async () => {
        if (!input.trim() || isSending || !onSendMessage) return;

        setIsSending(true);
        try {
            await onSendMessage(input.trim());
            setInput('');
        } catch (error) {
            console.error('[BYOKChat] Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50" ref={scrollRef}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm rotate-3 transition-transform hover:rotate-0">
                            <Bot size={32} className="text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No messages yet</h3>
                        <p className="text-sm text-slate-500 max-w-xs text-center leading-relaxed">
                            Start a conversation with this BYOK model
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => (
                            <div key={idx} className={clsx(
                                "flex gap-4 max-w-full group",
                                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                            )}>
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm mt-1 transition-transform group-hover:scale-105",
                                    msg.role === 'user' ? "bg-slate-100 border border-slate-200" : "bg-purple-50 border border-purple-100 text-purple-600"
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
                                        <div className="whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isStreaming && (
                            <div className="flex gap-4 max-w-full">
                                <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <Bot size={18} />
                                </div>
                                <div className="flex-1 bg-white border border-purple-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm w-fit">
                                    <div className="flex space-x-1 h-4 items-center">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className={clsx(
                    "relative flex flex-col gap-2 bg-white border rounded-2xl p-3 transition-all shadow-sm",
                    isSending || isStreaming ? "border-slate-200 bg-slate-50" : "border-slate-300 focus-within:ring-2 focus-within:ring-purple-500/10 focus-within:border-purple-500"
                )}>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message to this model..."
                        disabled={isSending || isStreaming}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none min-h-[48px] max-h-32 py-2 px-2 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed disabled:opacity-50"
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
                            <span className="text-xs text-slate-400">
                                {isSending ? 'Sending...' : isStreaming ? 'Receiving...' : 'Press Enter to send'}
                            </span>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isSending || isStreaming}
                            className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                (input.trim() && !isSending && !isStreaming)
                                    ? "bg-purple-500 text-white hover:bg-purple-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    : "bg-slate-100 text-slate-300 cursor-not-allowed"
                            )}
                        >
                            {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
