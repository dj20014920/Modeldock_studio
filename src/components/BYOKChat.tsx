import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, MessageContent, ImageContentPart } from '../types';
import { Bot, User, Send, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatedChatMessage } from './AnimatedChatMessage';

interface BYOKChatProps {
    messages: ChatMessage[];
    isStreaming?: boolean;
    onSendMessage?: (message: string, images?: ImageContentPart[]) => Promise<void>;
}

export const BYOKChat: React.FC<BYOKChatProps> = ({ messages, isStreaming, onSendMessage }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>(messages || []);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedImages, setSelectedImages] = useState<ImageContentPart[]>([]);

    // 부모 messages prop과 displayMessages 동기화
    useEffect(() => {
        const incoming = messages || [];
        setDisplayMessages(incoming);
    }, [messages]);

    // 자동 스크롤
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [displayMessages, isStreaming]);

    // 이미지 선택 핸들러
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newImages: ImageContentPart[] = [];
        let processedCount = 0;

        Array.from(files).forEach((file) => {
            if (!file.type.startsWith('image/')) {
                console.warn('[BYOKChat] Non-image file ignored:', file.name);
                processedCount++;
                return;
            }

            if (file.size > 20 * 1024 * 1024) {
                alert(`이미지 "${file.name}"가 너무 큽니다 (최대 20MB)`);
                processedCount++;
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Url = event.target?.result as string;
                newImages.push({
                    type: 'image_url',
                    image_url: { url: base64Url }
                });

                processedCount++;
                if (processedCount === files.length) {
                    setSelectedImages(prev => [...prev, ...newImages]);
                }
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = async () => {
        if ((!input.trim() && selectedImages.length === 0) || isSending || !onSendMessage) return;

        setIsSending(true);
        try {
            await onSendMessage(input.trim(), selectedImages.length > 0 ? selectedImages : undefined);
            setInput('');
            setSelectedImages([]);
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

    // 메시지 content 렌더링 헬퍼 (AnimatedChatMessage에 전달)
    const renderMessageContent = (content: MessageContent) => {
        if (typeof content === 'string') {
            return <div className="whitespace-pre-wrap break-words">{content}</div>;
        }
        return (
            <div className="flex flex-col gap-2">
                {content.map((part, idx) => {
                    if (part.type === 'text') {
                        return <div key={idx} className="whitespace-pre-wrap break-words">{part.text}</div>;
                    } else if (part.type === 'image_url') {
                        return (
                            <img
                                key={idx}
                                src={part.image_url.url}
                                alt="Attached image"
                                className="max-w-full rounded-lg border border-slate-200 shadow-sm"
                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50" ref={scrollRef}>
                {displayMessages.length === 0 ? (
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
                        {displayMessages.map((msg, idx) => {
                            const isLastMessage = idx === displayMessages.length - 1;
                            // 마지막 메시지이고 스트리밍 중일 때만 애니메이션 활성화 신호를 보냄
                            // AnimatedChatMessage 내부에서 이 신호를 받으면 애니메이션을 시작하고, 
                            // 신호가 끊겨도(스트리밍 종료) 애니메이션을 끝까지 수행함
                            const messageIsStreaming = isLastMessage && isStreaming;

                            return (
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
                                        msg.role === 'user' ? "items-end" : "items-start w-full"
                                    )}>
                                        {msg.role === 'user' ? (
                                            <div className="rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm bg-slate-800 text-white rounded-tr-none">
                                                {renderMessageContent(msg.content)}
                                            </div>
                                        ) : (
                                            <AnimatedChatMessage
                                                message={msg}
                                                isStreaming={!!messageIsStreaming}
                                                renderContent={renderMessageContent}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Streaming Indicator */}
                        {isStreaming && (
                            <div className="flex gap-4 max-w-full">
                                <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm mt-1">
                                    <Bot size={18} />
                                </div>
                                <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm w-fit">
                                    <div className="flex space-x-1.5 h-4 items-center">
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
                    {/* 이미지 미리보기 */}
                    {selectedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                            {selectedImages.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img
                                        src={img.image_url.url}
                                        alt={`Preview ${idx + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border border-slate-200"
                                    />
                                    <button
                                        onClick={() => handleRemoveImage(idx)}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

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
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageSelect}
                                disabled={isSending || isStreaming}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSending || isStreaming}
                                className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    isSending || isStreaming
                                        ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-purple-600"
                                )}
                                title="이미지 첨부"
                            >
                                <ImageIcon size={16} />
                            </button>

                            <span className="text-xs text-slate-400">
                                {isSending ? 'Sending...' : isStreaming ? 'Receiving...' : selectedImages.length > 0 ? `${selectedImages.length} image(s) selected` : 'Press Enter to send'}
                            </span>
                        </div>

                        <button
                            onClick={handleSend}
                            disabled={(!input.trim() && selectedImages.length === 0) || isSending || isStreaming}
                            className={clsx(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                ((input.trim() || selectedImages.length > 0) && !isSending && !isStreaming)
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
