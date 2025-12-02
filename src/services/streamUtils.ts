/**
 * =============================================================================
 * SSE (Server-Sent Events) 스트림 파서 유틸리티
 * =============================================================================
 * 
 * OpenAI, Anthropic, OpenRouter 등의 스트리밍 API 응답을 파싱합니다.
 * 
 * 스트림 형식:
 * ```
 * data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk",...}
 * data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk",...}
 * data: [DONE]
 * ```
 * 
 * @param reader ReadableStreamDefaultReader<Uint8Array>
 * @param onChunk 각 청크를 받을 때마다 호출되는 콜백
 */
export async function parseSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (data: any) => void,
    onDone?: () => void,
    onError?: (error: Error) => void
): Promise<void> {
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                if (onDone) onDone();
                break;
            }

            // 디코딩 후 버퍼에 추가
            buffer += decoder.decode(value, { stream: true });

            // 줄 단위로 분리
            const lines = buffer.split('\n');

            // 마지막 줄은 불완전할 수 있으므로 버퍼에 유지
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmed = line.trim();

                // 빈 줄 무시
                if (!trimmed) continue;

                // "data: " 접두사 확인
                if (trimmed.startsWith('data: ')) {
                    const data = trimmed.slice(6); // "data: " 제거

                    // [DONE] 시그널
                    if (data === '[DONE]') {
                        if (onDone) onDone();
                        return;
                    }

                    // JSON 파싱
                    try {
                        const parsed = JSON.parse(data);
                        onChunk(parsed);
                    } catch (e) {
                        console.warn('[SSE] Failed to parse chunk:', data);
                        // 파싱 실패는 무시하고 계속 진행
                    }
                }
            }
        }
    } catch (error) {
        if (onError) {
            onError(error as Error);
        } else {
            throw error;
        }
    }
}

/**
 * =============================================================================
 * 델타 누적 헬퍼
 * =============================================================================
 * 
 * OpenAI/OpenRouter 스타일의 델타(증분) 청크를 누적합니다.
 * 
 * 예시:
 * ```
 * chunk 1: { delta: { content: "Hello" } }
 * chunk 2: { delta: { content: " world" } }
 * 누적 결과: "Hello world"
 * ```
 */
export class StreamAccumulator {
    private content: string = '';
    private reasoning: string = '';
    private reasoningDetails: any[] = [];
    private usage: any = null;

    /**
     * 델타 청크를 누적
     */
    addChunk(chunk: any): void {
        const delta = chunk.delta || chunk.message; // OpenAI/Anthropic 호환

        if (delta) {
            // Content 누적
            if (delta.content) {
                this.content += delta.content;
            }

            // Reasoning 누적 (DeepSeek R1 등)
            if (delta.reasoning) {
                this.reasoning += delta.reasoning;
            }

            // Reasoning Details 누적 (OpenRouter 표준)
            if (delta.reasoning_details && Array.isArray(delta.reasoning_details)) {
                this.reasoningDetails.push(...delta.reasoning_details);
            }
        }

        // Usage 정보 (최종 청크에 포함됨)
        if (chunk.usage) {
            this.usage = chunk.usage;
        }
    }

    /**
     * 현재 누적된 상태를 반환
     */
    getAccumulated(): {
        content: string;
        reasoning: string;
        reasoningDetails: any[];
        usage: any;
    } {
        return {
            content: this.content,
            reasoning: this.reasoning,
            reasoningDetails: this.reasoningDetails,
            usage: this.usage,
        };
    }

    /**
     * 초기화
     */
    reset(): void {
        this.content = '';
        this.reasoning = '';
        this.reasoningDetails = [];
        this.usage = null;
    }
}
