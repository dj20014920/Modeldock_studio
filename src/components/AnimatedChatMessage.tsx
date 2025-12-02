import React, { useState, useEffect, useMemo } from 'react';
import { ChatMessage, ReasoningDetail, MessageContent } from '../types';
import { Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { clsx } from 'clsx';
import { useTypingEffect } from '../hooks/useTypingEffect';

interface AnimatedChatMessageProps {
    message: ChatMessage;
    isStreaming: boolean;
    renderContent: (content: MessageContent) => React.ReactNode; // BYOKChat의 렌더링 로직 재사용
}

export const AnimatedChatMessage: React.FC<AnimatedChatMessageProps> = ({
    message,
    isStreaming,
    renderContent
}) => {
    // 애니메이션 활성화 상태 관리
    // 마운트 시점에 스트리밍 중이면 애니메이션 시작
    // 스트리밍이 끝나도(isStreaming -> false) 애니메이션은 계속 진행되어야 함
    const [shouldAnimate, setShouldAnimate] = useState(isStreaming);

    useEffect(() => {
        if (isStreaming) {
            setShouldAnimate(true);
        }
    }, [isStreaming]);

    // Reasoning 텍스트 추출
    const fullReasoning = useMemo(() => {
        if (message.reasoning) return message.reasoning;
        if (message.reasoningDetails) {
            return message.reasoningDetails
                .map((detail: ReasoningDetail) => {
                    if (detail.type === 'reasoning.text' && detail.text) return detail.text;
                    if (detail.type === 'reasoning.summary' && detail.summary) return `[Summary] ${detail.summary}`;
                    return '';
                })
                .filter(Boolean)
                .join('\n\n');
        }
        return '';
    }, [message.reasoning, message.reasoningDetails]);

    const hasReasoning = !!fullReasoning;

    // Animation Phase State
    const [phase, setPhase] = useState<'reasoning' | 'content'>(
        (shouldAnimate && hasReasoning) ? 'reasoning' : 'content'
    );

    // Thinking Block Expansion State
    const [isThinkingExpanded, setIsThinkingExpanded] = useState(true);

    // --- Reasoning Animation ---
    const { displayedText: displayedReasoning, isTyping: isReasoningTyping } = useTypingEffect(
        fullReasoning,
        shouldAnimate && phase === 'reasoning',
        () => {
            // Reasoning 타이핑 완료 시 Content로 전환 (Content가 있을 때만)
            if (message.content) {
                setPhase('content');
            }
        }
    );

    // --- Content Animation ---
    // Content가 문자열인 경우에만 타이핑 효과 적용
    const contentText = typeof message.content === 'string' ? message.content : '';
    const isContentString = typeof message.content === 'string';

    const { displayedText: displayedContent, isTyping: isContentTyping } = useTypingEffect(
        contentText,
        shouldAnimate && phase === 'content' && isContentString,
        undefined
    );

    // Content가 이미 존재하고 Reasoning이 끝났거나 없으면 Content 페이즈로 전환
    useEffect(() => {
        if (hasReasoning && !isReasoningTyping && fullReasoning.length === displayedReasoning.length && message.content) {
            setPhase('content');
        }
    }, [hasReasoning, isReasoningTyping, fullReasoning, displayedReasoning, message.content]);


    // 최종 렌더링할 Content 결정
    const finalContent = useMemo(() => {
        if (!shouldAnimate) return message.content;
        if (!isContentString) return message.content; // 이미지는 즉시 표시
        return displayedContent;
    }, [shouldAnimate, isContentString, message.content, displayedContent]);


    // Thinking Block 렌더링
    const renderThinking = () => {
        if (!hasReasoning) return null;

        // 애니메이션 중일 때는 displayedReasoning 사용, 아니면 전체 텍스트
        const textToShow = shouldAnimate ? displayedReasoning : fullReasoning;
        const isTyping = shouldAnimate && isReasoningTyping;

        return (
            <div className="mb-3">
                <button
                    onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
                    className={clsx(
                        "flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left text-xs transition-all",
                        isThinkingExpanded
                            ? "bg-purple-50 border border-purple-200"
                            : "bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-200"
                    )}
                >
                    <Brain size={14} className={clsx(
                        "shrink-0 transition-colors",
                        isTyping ? "animate-pulse text-purple-600" : (isThinkingExpanded ? "text-purple-500" : "text-slate-400")
                    )} />
                    <span className={clsx(
                        "font-medium",
                        isThinkingExpanded ? "text-purple-700" : "text-slate-600"
                    )}>
                        {isTyping ? 'Thinking Process...' : 'Thinking Process'}
                    </span>
                    {isThinkingExpanded ? (
                        <ChevronUp size={14} className="ml-auto text-purple-400" />
                    ) : (
                        <ChevronDown size={14} className="ml-auto text-slate-400" />
                    )}
                </button>

                {isThinkingExpanded && (
                    <div className="mt-2 px-4 py-3 bg-purple-50/30 border border-purple-100 rounded-xl text-xs text-slate-600 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                        {textToShow}
                        {isTyping && <span className="inline-block w-1.5 h-3 ml-1 bg-purple-400 animate-pulse align-middle" />}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col w-full">
            {renderThinking()}

            {/* Content Area */}
            {(!hasReasoning || phase === 'content' || !shouldAnimate) && (
                <div className={clsx(
                    "rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm bg-white border border-slate-100 text-slate-800 rounded-tl-none min-h-[40px]",
                    shouldAnimate && phase === 'content' && isContentTyping && "border-purple-200"
                )}>
                    {renderContent(finalContent)}
                    {shouldAnimate && phase === 'content' && isContentTyping && (
                        <span className="inline-block w-1.5 h-4 ml-1 bg-purple-500 animate-pulse align-middle" />
                    )}
                </div>
            )}
        </div>
    );
};
