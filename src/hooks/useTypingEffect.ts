import { useState, useEffect, useRef } from 'react';

/**
 * 텍스트 타이핑 효과 훅
 * 
 * @param text 전체 텍스트
 * @param isEnabled 타이핑 효과 활성화 여부
 * @param onComplete 타이핑 완료 시 콜백
 * @param minSpeed 최소 타이핑 속도 (ms)
 * @returns 표시할 텍스트
 */
export const useTypingEffect = (
    text: string,
    isEnabled: boolean,
    onComplete?: () => void,
    minSpeed: number = 10
) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const indexRef = useRef(0);
    const textRef = useRef(text);

    // 텍스트 변경 감지 (스트리밍 대응)
    useEffect(() => {
        textRef.current = text;

        // 비활성화 상태면 즉시 전체 텍스트 표시
        if (!isEnabled) {
            setDisplayedText(text);
            indexRef.current = text.length;
            return;
        }

        // 이미 완료된 상태에서 텍스트가 추가된 경우 다시 타이핑 시작
        if (indexRef.current < text.length && !isTyping) {
            setIsTyping(true);
        }
    }, [text, isEnabled]);

    useEffect(() => {
        if (!isEnabled) return;

        const typeChar = () => {
            const currentLength = indexRef.current;
            const targetLength = textRef.current.length;

            if (currentLength < targetLength) {
                setIsTyping(true);

                // 남은 길이에 따라 속도 조절 (Dynamic Speed)
                const remaining = targetLength - currentLength;
                let charsToAdd = 1;
                let delay = minSpeed;

                if (remaining > 1000) {
                    charsToAdd = 20; // 매우 많으면 뭉텅이로
                    delay = 5;
                } else if (remaining > 500) {
                    charsToAdd = 10;
                    delay = 5;
                } else if (remaining > 100) {
                    charsToAdd = 5;
                    delay = 10;
                } else if (remaining > 50) {
                    charsToAdd = 2;
                    delay = 15;
                }

                // 실제 텍스트 업데이트
                const nextIndex = Math.min(currentLength + charsToAdd, targetLength);
                setDisplayedText(textRef.current.slice(0, nextIndex));
                indexRef.current = nextIndex;

                // 다음 프레임 예약
                setTimeout(typeChar, delay);
            } else {
                setIsTyping(false);
                if (onComplete) onComplete();
            }
        };

        if (isTyping) {
            typeChar();
        }

        // Cleanup function not needed for recursive setTimeout pattern 
        // as long as we check refs/state, but good practice to have a cancel flag if unmounted.
        // For simplicity here, we rely on component unmount clearing state updates.
    }, [isTyping, isEnabled, minSpeed, onComplete]);

    return { displayedText, isTyping };
};
