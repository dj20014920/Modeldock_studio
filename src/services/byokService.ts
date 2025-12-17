import {
    BYOKProviderId,
    BYOKSettings,
    ReasoningEffort,
    BYOKModelVariant,
    ModelCapability,
    ThinkingLevel,
    VerificationResult,
    ChatMessage,
    ReasoningDetail
} from '../types';
import { BYOK_PROVIDERS } from '../byokProviders';

/**
 * ============================================================================
 *  BYOK Service Architecture (Polymorphic Adapter Pattern)
 *  Refactored for Robustness, Precision, and Scalability
 *  v3.0: Final Hardening (Fallbacks, Retries, Conditional Headers)
 * ============================================================================
 */

// --- Interfaces & Types ---

// 🆕 API에서 받아온 원본 모델 정보 인터페이스
interface BYOKRawModel {
    id: string;
    created?: number; // Unix timestamp
    owned_by?: string;
    object?: string;
    name?: string; // 🆕 Display Name
    description?: string; // 🆕 Description
}

interface OpenRouterModel {
    id: string;
    name?: string;
    description?: string;
    created?: number; // Unix timestamp (seconds)
    context_length?: number;
    pricing?: {
        prompt?: string;
        completion?: string;
        input_cache_read?: string;
    };
    top_provider?: {
        max_completion_tokens?: number | null;
    };
    architecture?: {
        modality?: string;
        input_modalities?: string[];
    };
}

interface OpenRouterModelsResponse {
    data?: OpenRouterModel[];
}

// 🆕 스트리밍 청크 타입 (실시간 업데이트용)
interface StreamChunk {
    content?: string;              // 누적된 content
    reasoning?: string;            // 누적된 reasoning
    reasoningDetails?: ReasoningDetail[]; // 누적된 reasoning_details
    isDone: boolean;               // 스트림 완료 여부
}

// 🆕 스트리밍 콜백 타입
type StreamCallback = (chunk: StreamChunk) => void;

interface APICallParams {
    providerId: BYOKProviderId;
    apiKey: string;
    variant: string;
    prompt: string;
    systemPrompt?: string;
    historyMessages?: ChatMessage[]; // full conversation to support multi-turn

    // Basic Sampling
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;

    // Reasoning/Thinking
    reasoningEffort?: ReasoningEffort;
    thinkingBudget?: number;
    thinkingLevel?: ThinkingLevel;
    enableThinking?: boolean;

    // Advanced Sampling
    frequencyPenalty?: number;
    presencePenalty?: number;
    repetitionPenalty?: number;
    minP?: number;
    topA?: number;
    seed?: number;

    // Output Control
    stopSequences?: string[];
    responseFormat?: 'text' | 'json_object' | 'json_schema';

    // Tools
    enableTools?: boolean;
    parallelToolCalls?: boolean;

    // Advanced Options
    logprobs?: boolean;
    topLogprobs?: number;
    verbosity?: 'low' | 'medium' | 'high';

    // 🆕 Streaming Support
    stream?: boolean;              // 스트리밍 모드 활성화
    onStreamChunk?: StreamCallback; // 실시간 청크 콜백

    // Injected dynamically by the service facade
    mergedVariant?: BYOKModelVariant;
}

interface APIResponse {
    success: boolean;
    content?: string;
    reasoning?: string;               // 단순 텍스트 reasoning (DeepSeek R1 등)
    reasoningDetails?: ReasoningDetail[]; // OpenRouter 표준 reasoning_details
    error?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

interface BYOKAdapter {
    validateKey(apiKey: string): Promise<boolean>;
    fetchModels(apiKey: string): Promise<BYOKModelVariant[]>;
    listModels(apiKey: string): Promise<BYOKRawModel[] | null>; // 🆕 실제 모델 ID 리스트 가져오기 (null이면 미지원)
    callAPI(params: APICallParams): Promise<APIResponse>;
}

// --- Utils ---

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        // Retry on 429 (Too Many Requests) or 5xx (Server Errors)
        const isRetryable = error.message.includes('429') || error.message.includes('50') || error.message.includes('502') || error.message.includes('503');
        if (retries > 0 && isRetryable) {
            await new Promise(r => setTimeout(r, delay));
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

// --- Base Adapter ---

abstract class AbstractBYOKAdapter implements BYOKAdapter {
    protected providerId: BYOKProviderId;

    constructor(providerId: BYOKProviderId) {
        this.providerId = providerId;
    }

    protected get providerConfig() {
        return BYOK_PROVIDERS[this.providerId];
    }

    abstract callAPI(params: APICallParams): Promise<APIResponse>;

    async fetchModels(_apiKey: string): Promise<BYOKModelVariant[]> {
        return [];
    }

    abstract listModels(apiKey: string): Promise<BYOKRawModel[] | null>;

    async validateKey(apiKey: string): Promise<boolean> {
        // Trim the API key to avoid whitespace issues
        const trimmedKey = apiKey.trim();
        if (!trimmedKey) return false;

        // Strategy 1: Try cheap /models call first
        try {
            const models = await this.listModels(trimmedKey);
            if (models && models.length > 0) {
                console.log(`[BYOK] ✅ Key validated for ${this.providerId} via /models endpoint`);
                return true;
            }
        } catch (e: any) {
            console.warn(`[BYOK] /models validation failed for ${this.providerId}: ${e.message}`);
        }

        // Strategy 2: Try fetchModels (might return more data)
        try {
            const variants = await this.fetchModels(trimmedKey);
            if (variants && variants.length > 0) {
                console.log(`[BYOK] ✅ Key validated for ${this.providerId} via fetchModels`);
                return true;
            }
        } catch (e) {
            console.warn(`[BYOK] fetchModels validation failed for ${this.providerId}, trying completion fallback...`);
        }

        // Strategy 3: Ultra-cheap completion (only if defaultVariant exists)
        if (this.providerConfig.defaultVariant && this.providerConfig.defaultVariant !== '') {
            try {
                const result = await this.callAPI({
                    providerId: this.providerId,
                    apiKey: trimmedKey,
                    variant: this.providerConfig.defaultVariant,
                    prompt: 'Hi',
                    maxTokens: 1,
                    mergedVariant: this.inferCapabilities(this.providerConfig.defaultVariant)
                });
                if (result.success) {
                    console.log(`[BYOK] ✅ Key validated for ${this.providerId} via completion API`);
                    return true;
                }
            } catch (e) {
                console.warn(`[BYOK] Completion validation failed for ${this.providerId}:`, e);
            }
        }

        console.error(`[BYOK] ❌ All validation strategies failed for ${this.providerId}`);
        return false;
    }

    protected inferCapabilities(modelId: string): BYOKModelVariant {
        const lowerId = modelId.toLowerCase();
        const caps: any[] = [];

        // 1. Basic Capabilities
        if (lowerId.includes('vision') || lowerId.includes('gpt-4o') || lowerId.includes('claude-3-5') || lowerId.includes('gemini')) caps.push('vision');
        if (lowerId.includes('code') || lowerId.includes('coding')) caps.push('coding');
        if (lowerId.includes('reason') || lowerId.includes('o1') || lowerId.includes('o3') || lowerId.includes('deep-think') || lowerId.includes('r1') || lowerId.includes('thinking')) caps.push('reasoning');

        // 2. Feature Flags (Heuristics)
        const variant: Partial<BYOKModelVariant> = {
            id: modelId,
            capabilities: caps,
            supportsReasoningEffort: false,
            supportsThinkingBudget: false,
            supportsEnableThinking: false
        };

        // OpenAI o1/o3
        if (lowerId.includes('o1') || lowerId.includes('o3')) {
            variant.supportsReasoningEffort = true;
        }

        // Anthropic / Qwen Thinking
        if (lowerId.includes('thinking') || (lowerId.includes('claude') && (lowerId.includes('sonnet') || lowerId.includes('opus')))) {
            // Note: Claude 3.7 Sonnet supports thinking, but older ones don't. 
            // We'll be generous with the flag, but the UI/Service should check if the user actually set a budget.
            if (this.providerId === 'anthropic' || this.providerId === 'qwen') {
                variant.supportsThinkingBudget = true;
            }
        }

        // DeepSeek
        if (this.providerId === 'deepseek' && !lowerId.includes('reasoner')) {
            // Non-reasoner models might support enable_thinking toggle
            variant.supportsEnableThinking = true;
        }

        return variant as BYOKModelVariant;
    }
}

// --- Concrete Adapters ---

/**
 * OpenAI Compatible Adapter
 * Handles: OpenAI, DeepSeek, xAI, Mistral, Qwen, Kimi
 */
class OpenAICompatibleAdapter extends AbstractBYOKAdapter {
    async callAPI(params: APICallParams): Promise<APIResponse> {
        return withRetry(async () => {
            const { apiEndpoint, headerFormat } = this.providerConfig;
            const url = `${apiEndpoint}/chat/completions`;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (headerFormat.apiKeyPrefix) {
                headers[headerFormat.apiKeyHeader] = `${headerFormat.apiKeyPrefix}${params.apiKey}`;
            } else {
                headers[headerFormat.apiKeyHeader] = params.apiKey;
            }

            const messages = (() => {
                const history = params.historyMessages || [];
                if (history.length > 0) {
                    const mapped = history.map(msg => ({
                        role: msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user',
                        content: msg.content
                    }));
                    if (params.systemPrompt && mapped[0]?.role !== 'system') {
                        return [{ role: 'system', content: params.systemPrompt }, ...mapped];
                    }
                    if (params.systemPrompt && !mapped.some(m => m.role === 'system')) {
                        mapped.unshift({ role: 'system', content: params.systemPrompt });
                    }
                    return mapped;
                }
                const fallback: any[] = [];
                if (params.systemPrompt) fallback.push({ role: 'system', content: params.systemPrompt });
                fallback.push({ role: 'user', content: params.prompt });
                return fallback;
            })();

            const body: any = {
                model: params.variant,
                messages,
                stream: params.stream ?? false // 🆕 스트리밍 모드 설정
            };

            // --- Parameter Handling Strategy ---

            // 1. Fallback for Variant Config
            const variantConfig = params.mergedVariant ?? this.inferCapabilities(params.variant);
            const isReasoningModel = variantConfig.capabilities?.includes('reasoning') || params.variant.includes('o1') || params.variant.includes('reasoner');

            // 2. Sampling Parameters
            // DeepSeek R1 & OpenAI o1 strictly forbid temperature/top_p
            if (!isReasoningModel) {
                body.temperature = params.temperature ?? this.providerConfig.defaultTemperature;
                if (params.topP) body.top_p = params.topP;
                if (params.maxTokens) body.max_tokens = params.maxTokens;
            } else {
                // Reasoning models
                if (params.maxTokens) {
                    if (this.providerId === 'openai') {
                        body.max_completion_tokens = params.maxTokens;
                    } else {
                        body.max_tokens = params.maxTokens;
                    }
                }
                // Explicitly remove sampling params if they crept in
                delete body.temperature;
                delete body.top_p;
            }

            // 3. Provider Specifics
            if (this.providerId === 'openai') {
                if (variantConfig.supportsReasoningEffort && params.reasoningEffort) {
                    body.reasoning_effort = params.reasoningEffort;
                }
            } else if (this.providerId === 'deepseek') {
                if (params.enableThinking) {
                    // body.enable_thinking = true; // Future proofing
                }
            } else if (this.providerId === 'qwen') {
                if (variantConfig.supportsThinkingBudget && params.thinkingBudget) {
                    body.thinking_budget = params.thinkingBudget;
                }
            }

            // 4. Advanced Sampling Parameters (OpenAI-compatible)
            if (!isReasoningModel) {
                if (params.frequencyPenalty != null) body.frequency_penalty = params.frequencyPenalty;
                if (params.presencePenalty != null) body.presence_penalty = params.presencePenalty;
                if (params.repetitionPenalty != null) body.repetition_penalty = params.repetitionPenalty;
                if (params.minP != null) body.min_p = params.minP;
                if (params.topA != null) body.top_a = params.topA;
                if (params.topK != null) body.top_k = params.topK;
            }

            // 5. Universal Parameters
            if (params.seed != null) body.seed = params.seed;
            if (params.stopSequences && params.stopSequences.length > 0) body.stop = params.stopSequences;
            if (params.responseFormat && params.responseFormat !== 'text') {
                body.response_format = { type: params.responseFormat };
            }
            if (params.logprobs) {
                body.logprobs = true;
                if (params.topLogprobs) body.top_logprobs = params.topLogprobs;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout (reasoning takes longer)

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errText = await response.text();
                    let errMsg = `HTTP ${response.status}`;
                    try {
                        const errJson = JSON.parse(errText);
                        errMsg = errJson.error?.message || errMsg;
                    } catch (e) { }
                    throw new Error(errMsg);
                }

                // 🆕 스트리밍 모드 처리
                if (params.stream && params.onStreamChunk) {
                    return await this.handleStreamResponse(response, params.onStreamChunk);
                }

                // 비스트리밍 모드 (기존 로직)
                const data = await response.json();
                return {
                    success: true,
                    content: data.choices[0]?.message?.content || '',
                    reasoning: data.choices[0]?.message?.reasoning_content, // DeepSeek R1
                    usage: {
                        promptTokens: data.usage?.prompt_tokens || 0,
                        completionTokens: data.usage?.completion_tokens || 0,
                        totalTokens: data.usage?.total_tokens || 0
                    }
                };
            } finally {
                clearTimeout(timeoutId);
            }
        });
    }

    /**
     * 🆕 스트리밍 응답 처리
     */
    private async handleStreamResponse(
        response: Response,
        onStreamChunk: StreamCallback
    ): Promise<APIResponse> {
        const { parseSSEStream, StreamAccumulator } = await import('./streamUtils');

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Response body is not readable');
        }

        const accumulator = new StreamAccumulator();
        let lastUsage: any = null;

        await parseSSEStream(
            reader,
            (chunk) => {
                accumulator.addChunk(chunk);
                const accumulated = accumulator.getAccumulated();

                // 실시간 콜백 호출
                onStreamChunk({
                    content: accumulated.content,
                    reasoning: accumulated.reasoning,
                    reasoningDetails: accumulated.reasoningDetails,
                    isDone: false,
                });

                if (chunk.usage) {
                    lastUsage = chunk.usage;
                }
            },
            () => {
                // 스트림 완료
                const final = accumulator.getAccumulated();
                onStreamChunk({
                    content: final.content,
                    reasoning: final.reasoning,
                    reasoningDetails: final.reasoningDetails,
                    isDone: true,
                });
            },
            (error) => {
                console.error('[BYOK Stream] Error:', error);
                // 에러 발생 시 현재까지 누적된 내용을 isDone: true로 전달
                const final = accumulator.getAccumulated();
                onStreamChunk({
                    content: final.content,
                    reasoning: final.reasoning,
                    reasoningDetails: final.reasoningDetails,
                    isDone: true,
                });
            }
        );

        // 최종 응답 반환
        const final = accumulator.getAccumulated();
        return {
            success: true,
            content: final.content,
            reasoning: final.reasoning,
            reasoningDetails: final.reasoningDetails,
            usage: lastUsage ? {
                promptTokens: lastUsage.prompt_tokens || 0,
                completionTokens: lastUsage.completion_tokens || 0,
                totalTokens: lastUsage.total_tokens || 0,
            } : undefined,
        };
    }

    // 🆕 실제 API를 통해 모델 리스트 가져오기
    async listModels(apiKey: string): Promise<BYOKRawModel[] | null> {
        // ✅ DRY 원칙: byokProviders.ts의 apiEndpoint를 단일 진실의 원천으로 사용
        const endpoint = `${this.providerConfig.apiEndpoint}/models`;
        if (!endpoint) return null;

        try {
            console.log(`[BYOK] 📥 Fetching raw model list from ${this.providerId}...`);
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: this.buildHeaders(apiKey)
            });

            if (!res.ok) {
                console.warn(`[BYOK] Failed to list models for ${this.providerId}: ${res.status}`);
                return null;
            }

            const data = await res.json();
            const list = data.data || data.models || [];

            // ID 추출
            const modelIds = list.map((item: any) => ({
                id: item.id,
                created: item.created,
                owned_by: item.owned_by,
                object: item.object
            })).filter((item: BYOKRawModel) => typeof item.id === 'string');

            console.log(`[BYOK] ✅ Fetched ${modelIds.length} models from ${this.providerId}`);
            return modelIds;
        } catch (error) {
            console.error(`[BYOK] Error listing models for ${this.providerId}:`, error);
            return null;
        }
    }

    /**
     * 헤더 생성 헬퍼 메서드
     */
    protected buildHeaders(apiKey: string): Record<string, string> {
        const { headerFormat } = this.providerConfig;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // ✨ UX Perfection: 사용자가 실수로 "Bearer "를 포함해서 복사했을 경우 자동 제거
        let cleanKey = apiKey.trim();
        if (headerFormat.apiKeyPrefix === 'Bearer ' && cleanKey.startsWith('Bearer ')) {
            cleanKey = cleanKey.replace(/^Bearer\s+/i, '');
        }

        if (headerFormat.apiKeyPrefix) {
            headers[headerFormat.apiKeyHeader] = `${headerFormat.apiKeyPrefix}${cleanKey}`;
        } else {
            headers[headerFormat.apiKeyHeader] = cleanKey;
        }

        return headers;
    }

    async fetchModels(apiKey: string): Promise<BYOKModelVariant[]> {
        const { apiEndpoint, headerFormat } = this.providerConfig;
        const url = `${apiEndpoint}/models`;

        const headers: Record<string, string> = {};
        if (headerFormat.apiKeyPrefix) {
            headers[headerFormat.apiKeyHeader] = `${headerFormat.apiKeyPrefix}${apiKey}`;
        } else {
            headers[headerFormat.apiKeyHeader] = apiKey;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed to fetch models');

            const data = await response.json();
            const list = data.data || [];

            return list.map((m: any) => {
                const inferred = this.inferCapabilities(m.id);
                return {
                    id: m.id,
                    name: m.id,
                    description: `Imported from ${this.providerConfig.name}`,
                    contextWindow: 128000,
                    maxOutputTokens: 4096,
                    costPer1MInput: 0,
                    costPer1MOutput: 0,
                    capabilities: inferred.capabilities,
                    supportsReasoningEffort: inferred.supportsReasoningEffort,
                    supportsThinkingBudget: inferred.supportsThinkingBudget,
                    supportsEnableThinking: inferred.supportsEnableThinking,
                    isNew: true
                };
            });
        } catch (e) {
            return [];
        }
    }
}

/**
 * Anthropic Adapter
 */
class AnthropicAdapter extends AbstractBYOKAdapter {
    async listModels(apiKey: string): Promise<BYOKRawModel[] | null> {
        try {
            console.log('[BYOK] 📥 Fetching raw model list from anthropic...');
            const response = await fetch(`${this.providerConfig.apiEndpoint}/models?limit=100`, {
                method: 'GET',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });

            if (!response.ok) {
                console.warn(`[BYOK] Failed to list models for anthropic: ${response.status}`);
                return null;
            }

            const data = await response.json();
            if (Array.isArray(data.data)) {
                console.log(`[BYOK] ✅ Fetched ${data.data.length} models from anthropic`);
                return data.data.map((m: any) => ({
                    id: m.id,
                    created: m.created_at ? new Date(m.created_at).getTime() / 1000 : undefined,
                    name: m.display_name,
                    object: m.type
                }));
            }
            return null;
        } catch (e) {
            console.error('[BYOK] Error listing models for anthropic:', e);
            return null;
        }
    }
    async callAPI(params: APICallParams): Promise<APIResponse> {
        return withRetry(async () => {
            const { apiEndpoint } = this.providerConfig;
            const url = `${apiEndpoint}/messages`;

            const headers: Record<string, string> = {
                'x-api-key': params.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            };

            // Conditional Beta Header (Future Proofing for 3.7)
            if (params.variant.includes('claude-3-5') || params.variant.includes('sonnet-20241022') || params.variant.includes('claude-3-7')) {
                headers['anthropic-beta'] = 'models-2024-10-22';
            }

            // 1. Fallback for Variant Config
            const variantConfig = params.mergedVariant ?? this.inferCapabilities(params.variant);

            const body: any = {
                model: params.variant,
                max_tokens: params.maxTokens || 4096,
                messages: []
            };

            const history = params.historyMessages || [];
            if (history.length > 0) {
                const filteredHistory = history.filter(m => m.role === 'user' || m.role === 'assistant');

                // ✅ Anthropic Prompt Caching 구현
                // 공식 문서: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
                // - 시스템 프롬프트에 cache_control 추가 (90% 비용 절감)
                // - 마지막 메시지에 cache_control 추가 (20블록 lookback 보장)
                body.messages = filteredHistory.map((m, index) => {
                    const convertedContent = this.convertContentForAnthropic(m.content);
                    const isLastMessage = index === filteredHistory.length - 1;

                    // 마지막 메시지에 cache_control 추가 (멀티턴 대화 캐싱 최적화)
                    if (isLastMessage && typeof convertedContent === 'string') {
                        return {
                            role: m.role,
                            content: [
                                {
                                    type: 'text',
                                    text: convertedContent,
                                    cache_control: { type: 'ephemeral' }
                                }
                            ]
                        };
                    }

                    // 마지막 메시지가 배열인 경우 (이미지 등 포함)
                    if (isLastMessage && Array.isArray(convertedContent)) {
                        const lastPart = convertedContent[convertedContent.length - 1];
                        if (lastPart && lastPart.type === 'text') {
                            return {
                                role: m.role,
                                content: [
                                    ...convertedContent.slice(0, -1),
                                    { ...lastPart, cache_control: { type: 'ephemeral' } }
                                ]
                            };
                        }
                    }

                    return {
                        role: m.role,
                        content: convertedContent
                    };
                });
            } else {
                // 단일 메시지도 캐싱 적용
                body.messages = [{
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: params.prompt,
                            cache_control: { type: 'ephemeral' }
                        }
                    ]
                }];
            }

            // ✅ 시스템 프롬프트에 cache_control 추가 (가장 효과적인 캐싱 지점)
            if (params.systemPrompt) {
                body.system = [
                    {
                        type: 'text',
                        text: params.systemPrompt,
                        cache_control: { type: 'ephemeral' }
                    }
                ];
            }

            // Extended Thinking - Only if supported
            if (variantConfig.supportsThinkingBudget && params.thinkingBudget && params.thinkingBudget > 0) {
                if (body.max_tokens <= params.thinkingBudget) {
                    body.max_tokens = params.thinkingBudget + 4096;
                }
                body.thinking = {
                    type: 'enabled',
                    budget_tokens: params.thinkingBudget
                };
                // No temperature allowed
            } else {
                body.temperature = params.temperature ?? this.providerConfig.defaultTemperature;
                if (params.topP) body.top_p = params.topP;
                if (params.topK) body.top_k = params.topK;
            }

            // Stop sequences
            if (params.stopSequences && params.stopSequences.length > 0) {
                body.stop_sequences = params.stopSequences;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error?.message || `HTTP ${response.status}`);
                }

                const data = await response.json();

                let textContent = '';
                let reasoningContent = '';

                for (const block of data.content) {
                    if (block.type === 'text') {
                        textContent += block.text;
                    } else if (block.type === 'thinking') {
                        reasoningContent += block.thinking;
                    }
                }

                return {
                    success: true,
                    content: textContent,
                    reasoning: reasoningContent || undefined,
                    usage: {
                        promptTokens: data.usage?.input_tokens || 0,
                        completionTokens: data.usage?.output_tokens || 0,
                        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
                    }
                };
            } finally {
                clearTimeout(timeoutId);
            }
        });
    }

    async fetchModels(apiKey: string): Promise<BYOKModelVariant[]> {
        const { apiEndpoint } = this.providerConfig;
        const url = `${apiEndpoint}/models?limit=100`;

        const headers = {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed');

            const data = await response.json();
            return (data.data || []).map((m: any) => {
                const inferred = this.inferCapabilities(m.id);
                return {
                    id: m.id,
                    name: m.display_name || m.id,
                    description: `Anthropic Model`,
                    contextWindow: 200000,
                    maxOutputTokens: 8192,
                    costPer1MInput: 0,
                    costPer1MOutput: 0,
                    capabilities: inferred.capabilities,
                    supportsThinkingBudget: inferred.supportsThinkingBudget,
                    isNew: true
                };
            });
        } catch (e) {
            return [];
        }
    }

    /**
     * Convert MessageContent to Anthropic API format
     * Anthropic uses a different structure for images:
     * { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: '...' } }
     */
    private convertContentForAnthropic(content: any): any {
        // 단순 문자열 (하위 호환)
        if (typeof content === 'string') {
            return content;
        }

        // MessageContentPart[] (이미지 포함)
        if (Array.isArray(content)) {
            return content.map(part => {
                if (part.type === 'text') {
                    return { type: 'text', text: part.text };
                } else if (part.type === 'image_url') {
                    // base64 URL 파싱: data:image/jpeg;base64,/9j/4AAQ...
                    const url = part.image_url.url;
                    if (url.startsWith('data:')) {
                        const matches = url.match(/^data:(image\/[a-z]+);base64,(.+)$/);
                        if (matches) {
                            const mediaType = matches[1]; // image/jpeg, image/png 등
                            const base64Data = matches[2];
                            return {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: base64Data
                                }
                            };
                        }
                    }
                    // HTTP URL인 경우 (Anthropic은 URL도 지원)
                    if (url.startsWith('http://') || url.startsWith('https://')) {
                        return {
                            type: 'image',
                            source: {
                                type: 'url',
                                url: url
                            }
                        };
                    }
                }
                return part; // Fallback
            });
        }

        // Fallback
        return content;
    }
}

/**
 * Google Gemini Adapter
 */
class GoogleAdapter extends AbstractBYOKAdapter {
    async listModels(apiKey: string): Promise<BYOKRawModel[] | null> {
        try {
            console.log('[BYOK] 📥 Fetching raw model list from google...');
            const response = await fetch(`${this.providerConfig.apiEndpoint}/models?key=${apiKey}`);

            if (!response.ok) {
                console.warn(`[BYOK] Failed to list models for google: ${response.status}`);
                return null;
            }

            const data = await response.json();
            if (Array.isArray(data.models)) {
                const models = data.models
                    .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                    .map((m: any) => ({
                        id: m.name.replace('models/', ''),
                        name: m.displayName,
                        description: m.description,
                        object: 'model'
                    }));
                console.log(`[BYOK] ✅ Fetched ${models.length} models from google`);
                return models;
            }
            return null;
        } catch (e) {
            console.error('[BYOK] Error listing models for google:', e);
            return null;
        }
    }
    async callAPI(params: APICallParams): Promise<APIResponse> {
        return withRetry(async () => {
            const { apiEndpoint } = this.providerConfig;
            const url = `${apiEndpoint}/models/${params.variant}:generateContent?key=${params.apiKey}`;

            const body: any = {
                contents: [],
                generationConfig: {
                    maxOutputTokens: params.maxTokens || 8192,
                    temperature: params.temperature ?? this.providerConfig.defaultTemperature,
                    topP: params.topP,
                    topK: params.topK
                },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
                ]
            };

            const history = params.historyMessages || [];
            if (history.length > 0) {
                body.contents = history.map(m => ({
                    role: m.role === 'assistant' ? 'model' : m.role,
                    parts: this.convertContentForGoogle(m.content)
                }));
            } else {
                body.contents = [{ role: 'user', parts: [{ text: params.prompt }] }];
            }

            if (params.systemPrompt) {
                body.systemInstruction = { parts: [{ text: params.systemPrompt }] };
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const err = await response.json().catch(() => ({}));
                    throw new Error(err.error?.message || `HTTP ${response.status}`);
                }

                const data = await response.json();
                const candidate = data.candidates?.[0];

                if (!candidate) throw new Error('No candidates returned');

                let content = '';
                if (candidate.content?.parts) {
                    content = candidate.content.parts.map((p: any) => p.text).join('');
                }

                return {
                    success: true,
                    content,
                    usage: {
                        promptTokens: data.usageMetadata?.promptTokenCount || 0,
                        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                        totalTokens: data.usageMetadata?.totalTokenCount || 0
                    }
                };
            } finally {
                clearTimeout(timeoutId);
            }
        });
    }

    /**
     * ✨ Google Gemini API용 Content 변환 메서드
     * MessageContent → Google parts[] 형식으로 변환
     *
     * Google 형식:
     * - Text: { text: 'content' }
     * - Image (base64): { inlineData: { mimeType: 'image/jpeg', data: 'base64data' } }
     *
     * @param content - MessageContent (string | MessageContentPart[])
     * @returns Google parts[] 형식 배열
     */
    private convertContentForGoogle(content: any): Array<{ text: string } | { inlineData: { mimeType: string, data: string } }> {
        // 단순 문자열 (하위 호환)
        if (typeof content === 'string') {
            return [{ text: content }];
        }

        // MessageContentPart[] (이미지 포함)
        if (Array.isArray(content)) {
            const parts: Array<{ text: string } | { inlineData: { mimeType: string, data: string } }> = [];

            for (const part of content) {
                if (part.type === 'text') {
                    // Text part → { text: '...' }
                    parts.push({ text: part.text });
                } else if (part.type === 'image_url') {
                    // Image part → { inlineData: { mimeType: '...', data: '...' } }
                    const url = part.image_url.url;

                    // base64 URL 파싱: data:image/jpeg;base64,/9j/4AAQ...
                    if (url.startsWith('data:')) {
                        const matches = url.match(/^data:(image\/[a-z]+);base64,(.+)$/);
                        if (matches) {
                            const mimeType = matches[1]; // image/jpeg, image/png 등
                            const base64Data = matches[2];

                            parts.push({
                                inlineData: {
                                    mimeType: mimeType,
                                    data: base64Data
                                }
                            });
                        } else {
                            console.warn('[GoogleAdapter] Invalid base64 image URL format:', url.substring(0, 50));
                        }
                    } else if (url.startsWith('http://') || url.startsWith('https://')) {
                        // ⚠️ Google Gemini는 HTTP URL을 직접 지원하지 않음
                        // 클라이언트 측에서 base64로 변환 필요
                        console.warn('[GoogleAdapter] HTTP/HTTPS image URLs are not natively supported by Google Gemini. Use base64 instead.');
                        // Fallback: 에러 대신 경고만 출력하고 건너뜀
                    } else {
                        console.warn('[GoogleAdapter] Unknown image URL format:', url.substring(0, 50));
                    }
                }
            }

            return parts;
        }

        // Fallback (예상치 못한 타입)
        console.warn('[GoogleAdapter] Unexpected content type:', typeof content);
        return [{ text: String(content) }];
    }

    async fetchModels(apiKey: string): Promise<BYOKModelVariant[]> {
        const { apiEndpoint } = this.providerConfig;
        const url = `${apiEndpoint}/models?key=${apiKey}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed');

            const data = await response.json();
            return (data.models || [])
                .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
                .map((m: any) => {
                    const id = m.name.replace('models/', '');
                    const inferred = this.inferCapabilities(id);
                    return {
                        id,
                        name: m.displayName || id,
                        description: m.description || 'Google Gemini Model',
                        contextWindow: m.inputTokenLimit || 32768,
                        maxOutputTokens: m.outputTokenLimit || 8192,
                        costPer1MInput: 0,
                        costPer1MOutput: 0,
                        capabilities: inferred.capabilities,
                        isNew: true
                    };
                });
        } catch (e) {
            return [];
        }
    }
}

/**
 * OpenRouter Adapter
 * ✅ Reasoning/Thinking 지원 (OpenRouter 통합 reasoning 파라미터)
 * 문서: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
 */
class OpenRouterAdapter extends OpenAICompatibleAdapter {
    /**
     * ✅ OpenRouter API 호출 (Reasoning + Cache 지원)
     * - reasoning 파라미터로 thinking 활성화
     * - reasoning_details 응답 파싱
     * - Anthropic 모델 cache_control 지원
     */
    async callAPI(params: APICallParams): Promise<APIResponse> {
        return withRetry(async () => {
            const { apiEndpoint, headerFormat } = this.providerConfig;
            const url = `${apiEndpoint}/chat/completions`;

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
            };

            if (headerFormat.apiKeyPrefix) {
                headers[headerFormat.apiKeyHeader] = `${headerFormat.apiKeyPrefix}${params.apiKey}`;
            } else {
                headers[headerFormat.apiKeyHeader] = params.apiKey;
            }

            // 명시적 캐싱이 필요한 모델 확인 (Anthropic, Google Gemini)
            // Anthropic: cache_control 필수
            // Gemini: Implicit Caching(2.5+)이 있지만, cache_control을 사용하면 더 확실한 제어 가능
            const isExplicitCacheModel = params.variant.startsWith('anthropic/') ||
                params.variant.includes('claude') ||
                params.variant.startsWith('google/') ||
                params.variant.includes('gemini');

            // Reasoning 지원 모델 확인 (문서 기반)
            const isReasoningModel = this.isReasoningCapableModel(params.variant);

            // 메시지 구성
            const messages: any[] = [];
            const history = params.historyMessages || [];

            if (history.length > 0) {
                history.forEach((msg, index) => {
                    const role = msg.role === 'assistant' ? 'assistant' : msg.role === 'system' ? 'system' : 'user';
                    const isLastUserMessage = index === history.length - 1 && role === 'user';

                    // 명시적 캐싱 모델이면 cache_control 적용
                    if (isExplicitCacheModel && isLastUserMessage) {
                        messages.push({
                            role,
                            content: [
                                {
                                    type: 'text',
                                    text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
                                    cache_control: { type: 'ephemeral' }
                                }
                            ]
                        });
                    } else {
                        messages.push({ role, content: msg.content });
                    }
                });
            } else {
                if (isExplicitCacheModel) {
                    messages.push({
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: params.prompt,
                                cache_control: { type: 'ephemeral' }
                            }
                        ]
                    });
                } else {
                    messages.push({ role: 'user', content: params.prompt });
                }
            }

            // 시스템 프롬프트
            if (params.systemPrompt) {
                const existingSystemIdx = messages.findIndex(m => m.role === 'system');
                if (existingSystemIdx === -1) {
                    if (isExplicitCacheModel) {
                        messages.unshift({
                            role: 'system',
                            content: [
                                {
                                    type: 'text',
                                    text: params.systemPrompt,
                                    cache_control: { type: 'ephemeral' }
                                }
                            ]
                        });
                    } else {
                        messages.unshift({ role: 'system', content: params.systemPrompt });
                    }
                }
            }

            const body: any = {
                model: params.variant,
                messages,
                stream: params.stream ?? false // 🆕 스트리밍 모드 설정
            };

            // 기본 파라미터
            if (!isReasoningModel) {
                body.temperature = params.temperature ?? this.providerConfig.defaultTemperature;
                if (params.topP) body.top_p = params.topP;
            }
            if (params.maxTokens) body.max_tokens = params.maxTokens;

            // ✅ OpenRouter Reasoning 파라미터 (통합 인터페이스)
            // 문서: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
            if (isReasoningModel) {
                body.reasoning = {};

                // effort 기반 (OpenAI o1/o3, Grok)
                if (params.reasoningEffort) {
                    body.reasoning.effort = params.reasoningEffort;
                }
                // max_tokens 기반 (Anthropic, Qwen)
                else if (params.thinkingBudget && params.thinkingBudget > 0) {
                    body.reasoning.max_tokens = params.thinkingBudget;
                }
                // 기본 활성화 (명시적 설정 없으면)
                else {
                    body.reasoning.enabled = true; // medium effort 기본
                }

                // exclude: false → reasoning을 응답에 포함
                body.reasoning.exclude = false;
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 120초 (reasoning은 시간이 더 걸림)

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errText = await response.text();
                    let errMsg = `HTTP ${response.status}`;
                    try {
                        const errJson = JSON.parse(errText);
                        errMsg = errJson.error?.message || errMsg;
                    } catch (e) { }
                    throw new Error(errMsg);
                }

                // 🆕 스트리밍 모드 처리 (부모 클래스 메서드 재사용)
                if (params.stream && params.onStreamChunk) {
                    return await (this as any).handleStreamResponse(response, params.onStreamChunk);
                }

                // 비스트리밍 모드 (기존 로직)
                const data = await response.json();
                const message = data.choices[0]?.message;

                // ✅ OpenRouter 캐시 디스카운트 로깅
                if (data.usage?.cache_discount) {
                    console.log(`[BYOK] 💰 OpenRouter cache discount: ${data.usage.cache_discount}%`);
                }

                // ✅ Reasoning 응답 파싱
                // 1. reasoning_details (OpenRouter 표준 - 배열)
                // 2. reasoning (단순 텍스트 - DeepSeek R1 등)
                // 3. reasoning_content (일부 모델)
                const reasoningDetails = message?.reasoning_details as ReasoningDetail[] | undefined;
                const reasoningText = message?.reasoning || message?.reasoning_content;

                if (reasoningDetails && reasoningDetails.length > 0) {
                    console.log(`[BYOK] 🧠 Received ${reasoningDetails.length} reasoning blocks`);
                }

                return {
                    success: true,
                    content: message?.content || '',
                    reasoning: reasoningText,
                    reasoningDetails: reasoningDetails,
                    usage: {
                        promptTokens: data.usage?.prompt_tokens || 0,
                        completionTokens: data.usage?.completion_tokens || 0,
                        totalTokens: data.usage?.total_tokens || 0
                    }
                };
            } finally {
                clearTimeout(timeoutId);
            }
        });
    }

    /**
     * Reasoning 지원 모델 여부 확인 (OpenRouter 문서 기반)
     * https://openrouter.ai/docs/guides/best-practices/reasoning-tokens
     */
    private isReasoningCapableModel(modelId: string): boolean {
        const lowerId = modelId.toLowerCase();

        // OpenAI o1/o3 시리즈, GPT-5
        if (lowerId.includes('o1') || lowerId.includes('o3') || lowerId.includes('gpt-5')) return true;

        // Anthropic Claude 3.7+, Claude 4
        if (lowerId.includes('claude-3-7') || lowerId.includes('claude-3.7') ||
            lowerId.includes('claude-4') || lowerId.includes('claude-sonnet-4') ||
            lowerId.includes('claude-4.1')) return true;

        // DeepSeek R1
        if (lowerId.includes('deepseek-r1') || lowerId.includes('deepseek/deepseek-r1')) return true;

        // Gemini Thinking
        if (lowerId.includes('gemini') && lowerId.includes('thinking')) return true;

        // xAI Grok Reasoning
        if (lowerId.includes('grok') && (lowerId.includes('reason') || lowerId.includes('thinking'))) return true;

        // Qwen Thinking
        if (lowerId.includes('qwen') && lowerId.includes('thinking')) return true;

        // :thinking variant suffix
        if (lowerId.endsWith(':thinking')) return true;

        // MiniMax M2, Kimi K2 Thinking, INTELLECT-3
        if (lowerId.includes('minimax-m2') || lowerId.includes('kimi-k2-thinking') ||
            lowerId.includes('intellect-3')) return true;

        return false;
    }

    async fetchModels(apiKey: string): Promise<BYOKModelVariant[]> {
        const url = `${this.providerConfig.apiEndpoint}/models`;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            // OpenRouter requires auth for BYOK models
            const headers = {
                'Authorization': `Bearer ${apiKey}`
            };

            const response = await fetch(url, { headers, signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed');

            const data = await response.json();
            return (data.data || []).map((m: any) => {
                const inferred = this.inferCapabilities(m.id);
                const promptPrice = parseFloat(m.pricing?.prompt || '0');
                const completionPrice = parseFloat(m.pricing?.completion || '0');
                // OpenRouter returns pricing as strings sometimes.
                // We consider it free ONLY if:
                // 1. Pricing is explicitly provided and both are 0
                // 2. OR the model ID explicitly contains ":free" (OpenRouter convention)
                // 3. OR the model Name explicitly contains "(free)" (Common naming convention)
                const isFree = (m.pricing && promptPrice === 0 && completionPrice === 0) ||
                    m.id.endsWith(':free') ||
                    m.name.toLowerCase().includes('(free)');

                return {
                    id: m.id,
                    name: m.name,
                    description: m.description || '',
                    contextWindow: m.context_length || 4096,
                    maxOutputTokens: m.top_provider?.max_completion_tokens || 4096,
                    costPer1MInput: promptPrice * 1000000,
                    costPer1MOutput: completionPrice * 1000000,
                    isFree: isFree,
                    capabilities: inferred.capabilities,
                    supportsReasoningEffort: inferred.supportsReasoningEffort,
                    supportsThinkingBudget: inferred.supportsThinkingBudget,
                    isNew: false
                };
            });
        } catch (e) {
            return [];
        }
    }
}

// --- Service Facade ---

export class BYOKAPIService {
    private static instance: BYOKAPIService;
    private adapters: Map<BYOKProviderId, BYOKAdapter> = new Map();

    private constructor() {
        this.adapters = new Map();
        this.initializeAdapters();
    }

    public static getInstance(): BYOKAPIService {
        if (!BYOKAPIService.instance) {
            BYOKAPIService.instance = new BYOKAPIService();
        }
        return BYOKAPIService.instance;
    }

    private initializeAdapters() {
        this.adapters.set('openai', new OpenAICompatibleAdapter('openai'));
        this.adapters.set('deepseek', new OpenAICompatibleAdapter('deepseek'));
        this.adapters.set('xai', new OpenAICompatibleAdapter('xai'));
        this.adapters.set('mistral', new OpenAICompatibleAdapter('mistral'));
        this.adapters.set('qwen', new OpenAICompatibleAdapter('qwen'));
        this.adapters.set('kimi', new OpenAICompatibleAdapter('kimi'));
        this.adapters.set('anthropic', new AnthropicAdapter('anthropic'));
        this.adapters.set('google', new GoogleAdapter('google'));
        this.adapters.set('openrouter', new OpenRouterAdapter('openrouter'));
    }

    private getAdapter(providerId: BYOKProviderId): BYOKAdapter {
        if (!this.adapters.has(providerId)) {
            this.adapters.set(providerId, this.createAdapter(providerId));
        }
        return this.adapters.get(providerId)!;
    }

    private createAdapter(providerId: BYOKProviderId): BYOKAdapter {
        switch (providerId) {
            case 'openai':
            case 'deepseek':
            case 'xai':
            case 'mistral':
            case 'qwen':
            case 'kimi':
                return new OpenAICompatibleAdapter(providerId);
            case 'anthropic':
                return new AnthropicAdapter(providerId);
            case 'google':
                return new GoogleAdapter(providerId);
            case 'openrouter':
                return new OpenRouterAdapter(providerId);
            default:
                // Fallback for unknown providers, assuming OpenAI-compatible
                return new OpenAICompatibleAdapter(providerId);
        }
    }

    /**
     * Validate API Key
     */
    async validateAPIKey(providerId: BYOKProviderId, apiKey: string): Promise<boolean> {
        // 1. Check Cache
        const cached = await this.getVerificationCache(providerId, 'key_validation', apiKey);
        if (cached === 'available') return true;
        if (cached === 'unavailable') return false; // ✅ 실패 캐시도 확인

        // 2. Validate via Adapter
        const adapter = this.getAdapter(providerId);
        const isValid = await adapter.validateKey(apiKey);

        // 3. Update Cache (성공/실패 모두 캐시)
        if (isValid) {
            await this.setVerificationCache(providerId, 'key_validation', apiKey, 'available');
        } else {
            // ✅ 실패도 캐시 (1시간 TTL, getVerificationCache에서 처리)
            await this.setVerificationCache(providerId, 'key_validation', apiKey, 'unavailable');
        }

        return isValid;
    }

    /**
     * 🆕 UI 초기화용: 저장된 검증 상태 가져오기
     */
    async getStoredVerificationStatus(providerId: BYOKProviderId, apiKey: string): Promise<VerificationResult | null> {
        console.log(`[BYOK DEBUG] 🔎 getStoredVerificationStatus called for ${providerId}`);
        console.log(`[BYOK DEBUG] 🔑 API Key (first 15 chars): ${apiKey.substring(0, 15)}...`);

        // 1. 키 자체의 유효성 캐시 확인
        const keyStatus = await this.getVerificationCache(providerId, 'key_validation', apiKey);
        console.log(`[BYOK DEBUG] 💾 getVerificationCache returned: ${keyStatus}`);

        if (keyStatus === 'available') {
            // 2. 키가 유효하다면, 선택된 모델의 유효성 캐시도 확인 (선택적)
            // 여기서는 키 유효성만으로도 'available' (초록불)을 켜줄지, 아니면 모델까지 봐야할지 결정
            // UI에서는 모델 검증 결과가 우선이므로, 모델 검증 캐시가 있으면 그것을 반환
            // 하지만 모델 ID를 모르므로, 일단 키가 유효하면 'available'로 간주 (또는 호출자가 모델 ID를 줘야 함)
            return 'available';
        }

        if (keyStatus === 'unavailable') {
            return 'unavailable';
        }

        console.log(`[BYOK DEBUG] ❓ No cached status found, returning null`);
        return null;
    }

    /**
     * 모델 ID 정규화 (OpenRouter ID -> Native ID 변환)
     * 예: 'openai/gpt-4o' -> 'gpt-4o' (OpenAI Provider 사용 시)
     * 예: 'anthropic/claude-3' -> 'claude-3' (Anthropic Provider 사용 시)
     * OpenRouter Provider 사용 시는 변환 없음
     */
    private normalizeModelId(providerId: BYOKProviderId, modelId: string): string {
        if (providerId === 'openrouter') return modelId; // OpenRouter는 그대로 사용

        const prefixes: Record<string, string> = {
            openai: 'openai/',
            anthropic: 'anthropic/',
            google: 'google/',
            mistral: 'mistralai/', // OpenRouter uses 'mistralai/'
            deepseek: 'deepseek/',
            xai: 'x-ai/', // OpenRouter uses 'x-ai/'
            qwen: 'qwen/',
            kimi: 'moonshotai/', // OpenRouter uses 'moonshotai/' for Kimi
        };

        const prefix = prefixes[providerId];
        if (prefix && modelId.startsWith(prefix)) {
            return modelId.slice(prefix.length);
        }

        return modelId;
    }

    /**
     * Main Entry Point: Call API
     */
    async callAPI(params: APICallParams): Promise<APIResponse> {
        // 1. Load Settings to apply modelOverrides
        const settings = await loadBYOKSettings();
        const modelKey = `${params.providerId}-${params.variant}`;
        const modelOverride = settings.modelOverrides?.[modelKey];

        // 2. Apply Model-Specific Overrides (if useDefaults is false)
        let enhancedParams = { ...params };
        if (modelOverride && modelOverride.useDefaults === false) {
            // Temperature
            if (modelOverride.temperature !== undefined) {
                enhancedParams.temperature = modelOverride.temperature;
            }

            // Max Tokens
            if (modelOverride.maxTokens !== undefined) {
                enhancedParams.maxTokens = modelOverride.maxTokens;
            }

            // Top-P, Top-K
            if (modelOverride.topP !== undefined) {
                enhancedParams.topP = modelOverride.topP;
            }
            if (modelOverride.topK !== undefined) {
                enhancedParams.topK = modelOverride.topK;
            }

            // Reasoning/Thinking
            if (modelOverride.reasoningEffort !== undefined) {
                enhancedParams.reasoningEffort = modelOverride.reasoningEffort;
            }
            if (modelOverride.thinkingBudget !== undefined) {
                enhancedParams.thinkingBudget = modelOverride.thinkingBudget;
            }
            if (modelOverride.thinkingLevel !== undefined) {
                enhancedParams.thinkingLevel = modelOverride.thinkingLevel;
            }
            if (modelOverride.enableThinking !== undefined) {
                enhancedParams.enableThinking = modelOverride.enableThinking;
            }

            // Advanced Sampling
            if (modelOverride.frequencyPenalty !== undefined) {
                enhancedParams.frequencyPenalty = modelOverride.frequencyPenalty;
            }
            if (modelOverride.presencePenalty !== undefined) {
                enhancedParams.presencePenalty = modelOverride.presencePenalty;
            }
            if (modelOverride.repetitionPenalty !== undefined) {
                enhancedParams.repetitionPenalty = modelOverride.repetitionPenalty;
            }
            if (modelOverride.minP !== undefined) {
                enhancedParams.minP = modelOverride.minP;
            }
            if (modelOverride.topA !== undefined) {
                enhancedParams.topA = modelOverride.topA;
            }
            if (modelOverride.seed !== undefined) {
                enhancedParams.seed = modelOverride.seed;
            }

            // Output Control
            if (modelOverride.stopSequences !== undefined) {
                enhancedParams.stopSequences = modelOverride.stopSequences;
            }
            if (modelOverride.responseFormat !== undefined) {
                enhancedParams.responseFormat = modelOverride.responseFormat;
            }

            // ✅ OpenRouter Variant Suffix (: free, :thinking, etc.)
            if (params.providerId === 'openrouter' && modelOverride.openRouterVariant && modelOverride.openRouterVariant !== 'default') {
                // Append suffix to variant ID
                // Example: anthropic/claude-3-opus + free → anthropic/claude-3-opus:free
                enhancedParams.variant = `${params.variant}:${modelOverride.openRouterVariant}`;
            }
        }

        // 3. Load Dynamic Config to merge capabilities
        const providerWithDynamics = await this.getProviderWithDynamicModels(enhancedParams.providerId);

        // 4. Find the specific variant to inject capabilities
        let mergedVariant: BYOKModelVariant | undefined;
        if (providerWithDynamics) {
            mergedVariant = providerWithDynamics.variants.find(v => v.id === enhancedParams.variant);
        }

        // 5. Normalize Model ID for the specific provider
        const normalizedVariant = this.normalizeModelId(enhancedParams.providerId, enhancedParams.variant);

        // 6. Inject merged variant into params
        const finalParams = {
            ...enhancedParams,
            variant: normalizedVariant, // ✅ 정규화된 ID 사용
            mergedVariant
        };

        // 7. Get Adapter & Execute
        const adapter = this.getAdapter(enhancedParams.providerId);
        return adapter.callAPI(finalParams);
    }



    /**
     * ============================================================================
     * 모델 가용성 검증 시스템 (Enterprise-Grade)
     * ============================================================================
     *
     * 목적: OpenRouter 기준 모델이 실제 공급사 API 키로 호출 가능한지 검증
     * 전략: 2단계 검증 (List Models → Probe Call)
     * 비용: 총 토큰 <10개 (<$0.0001)
     * 캐싱: 1시간 TTL (chrome.storage.local)
     * 보안: API 키를 로그에 노출하지 않음
     */
    async verifyModelAvailability(providerId: BYOKProviderId, apiKey: string, modelId: string): Promise<VerificationResult> {
        // 캐시 확인 (성공한 경우만 캐시 사용, 실패는 재검증)
        const cached = await this.getVerificationCache(providerId, modelId, apiKey);
        if (cached === 'available') {
            console.log(`[BYOK] ✅ Cache hit (available) for ${providerId}/${modelId}`);
            return cached;
        }

        // 정규화된 ID 확인 (로깅용)
        const normalizedId = this.normalizeModelId(providerId, modelId);
        console.log(`[BYOK] 🔍 Verifying: ${providerId}/${modelId} (Normalized: ${normalizedId})`);

        // 공급사별 전략 실행
        let result: VerificationResult = 'uncertain';
        try {
            // Phase 1: List Models (가능한 경우)
            const listResult = await this.tryListModels(providerId, apiKey, modelId);
            if (listResult !== null) {
                result = listResult ? 'available' : 'unavailable';
            } else {
                // Phase 2: Probe Call (List 실패 시)
                result = await this.tryProbeCall(providerId, apiKey, modelId);
            }
        } catch (error: any) {
            console.error('[BYOK] ⚠️ Verification error:', error.message);
            result = 'uncertain';
        }

        console.log(`[BYOK] 🏁 Verification Result for ${modelId}: ${result}`);

        // ✅ 모든 결과를 캐시 (TTL은 getVerificationCache에서 차별화)
        // - available: 24시간 TTL
        // - uncertain: 24시간 TTL (키는 유효하므로)
        // - unavailable: 1시간 TTL (빠른 재검증 허용)
        await this.setVerificationCache(providerId, modelId, apiKey, result);

        return result;
    }

    /**
     * Phase 1: List Models 시도
     * 반환값: true (찾음) | false (못 찾음) | null (지원 안 함)
     */
    private async tryListModels(providerId: BYOKProviderId, apiKey: string, modelId: string): Promise<boolean | null> {
        // ✅ DRY 원칙: byokProviders.ts의 apiEndpoint를 단일 진실의 원천으로 사용
        const config = BYOK_PROVIDERS[providerId];
        let url = `${config.apiEndpoint}/models`;

        // Google은 URL 파라미터로 API 키 전달
        if (providerId === 'google') {
            url = `${url}?key=${apiKey}`;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch(url, {
                method: 'GET',
                headers: this.buildHeaders(providerId, apiKey),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                console.warn(`[BYOK] List models failed (Status: ${res.status}). This usually means the API Key is invalid or has no permissions.`);
                return null; // List 실패 → Probe로 fallback
            }

            const data = await res.json();
            const models: any[] = data.data || data.models || [];

            // ✅ 중앙화된 정규화 로직 사용
            const targetId = this.normalizeModelId(providerId, modelId);

            console.log(`[BYOK] 📋 Provider returned ${models.length} models.`);
            if (models.length > 0) {
                const sampleModels = models.slice(0, 5).map((m: any) => m.id || m.model || m.name);
                console.log(`[BYOK] 📋 Sample remote models: ${sampleModels.join(', ')} ...`);
            }

            const found = models.some((m) => {
                let remoteId = m.id || m.model || m.name; // Google uses 'name'

                // Google returns 'models/gemini-pro', remove prefix
                if (providerId === 'google' && remoteId && remoteId.startsWith('models/')) {
                    remoteId = remoteId.replace('models/', '');
                }

                return remoteId === targetId || remoteId === modelId;
            });

            console.log(`[BYOK] List result: ${found ? '✅' : '❌'} Target: '${targetId}' (Original: '${modelId}')`);
            return found;
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.warn('[BYOK] List models timeout');
            }
            return null; // 에러 → Probe로 fallback
        }
    }

    /**
     * Phase 2: Probe Call 시도 (최소 비용 호출)
     * 비용: max_tokens=1, 프롬프트="ping" (총 ~5 토큰)
     *
     * @returns VerificationResult
     *   - 'available': ✅ 200-299 OK
     *   - 'unavailable': ❌ 404, 401, 403
     *   - 'uncertain': ⚠️ 429, 5xx, 타임아웃, 네트워크 에러, 지원 안 함
     */
    private async tryProbeCall(providerId: BYOKProviderId, apiKey: string, modelId: string): Promise<VerificationResult> {
        const config = this.getProbeConfig(providerId, modelId);
        if (!config) {
            console.warn('[BYOK] Probe call unsupported for', providerId);
            return 'uncertain'; // 검증 불가능한 경우
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초로 연장

            console.log(`[BYOK] 🚀 Sending probe to ${config.endpoint} for model ${config.payload.model || 'URL-based'}`);

            const res = await fetch(config.endpoint, {
                method: 'POST',
                headers: this.buildHeaders(providerId, apiKey),
                body: JSON.stringify(config.payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // 성공: 200-299
            if (res.ok) {
                console.log(`[BYOK] ✅ Probe call succeeded: ${modelId}`);
                return 'available';
            }

            // 에러 상세 로깅
            const errorText = await res.text();
            console.warn(`[BYOK] ❌ Probe failed: ${res.status} ${res.statusText}`);
            console.warn(`[BYOK] ❌ Error details: ${errorText}`);

            // 모델 없음: 404
            if (res.status === 404) {
                return 'unavailable';
            }

            // 권한 없음: 401, 403
            if (res.status === 401 || res.status === 403) {
                return 'unavailable';
            }

            // 레이트 제한 또는 서버 에러: 429, 5xx
            console.warn(`[BYOK] ⚠️ Probe call uncertain (${res.status}): ${modelId}`);
            return 'uncertain';
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.warn('[BYOK] ⚠️ Probe call timeout:', modelId);
            } else {
                console.error('[BYOK] ⚠️ Probe call error:', error.message);
            }
            return 'uncertain'; // 네트워크 에러
        }
    }

    /**
     * ✅ Probe Call 설정 생성 (리팩토링: DRY 원칙 적용)
     * byokProviders.ts의 apiEndpoint를 단일 진실의 원천으로 사용
     */
    private getProbeConfig(providerId: BYOKProviderId, modelId: string): { endpoint: string; payload: any } | null {
        const targetId = this.normalizeModelId(providerId, modelId);
        const config = BYOK_PROVIDERS[providerId];

        // Google 특수 처리: URL에 모델 ID 포함
        if (providerId === 'google') {
            return {
                endpoint: `${config.apiEndpoint}/models/${targetId}:generateContent`,
                payload: {
                    contents: [{ parts: [{ text: 'ping' }] }],
                    generationConfig: { maxOutputTokens: 1 },
                }
            };
        }

        // Anthropic 특수 처리: /messages 엔드포인트 사용
        if (providerId === 'anthropic') {
            return {
                endpoint: `${config.apiEndpoint}/messages`,
                payload: {
                    model: targetId,
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 1,
                }
            };
        }

        // OpenAI 호환 (대부분의 Provider: OpenAI, xAI, DeepSeek, Mistral, Qwen, Kimi, OpenRouter)
        return {
            endpoint: `${config.apiEndpoint}/chat/completions`,
            payload: {
                model: targetId,
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 1,
                temperature: 0,
            }
        };
    }

    /**
     * 헤더 생성 (공급사별 차이 처리)
     */
    private buildHeaders(providerId: BYOKProviderId, apiKey: string): Record<string, string> {
        const baseHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // 공급사별 인증 헤더
        if (providerId === 'anthropic') {
            baseHeaders['x-api-key'] = apiKey;
            baseHeaders['anthropic-version'] = '2023-06-01';
        } else if (providerId === 'google') {
            // Google은 URL 파라미터로 API 키 전달 (헤더 없음)
        } else {
            // 대부분 Bearer 토큰
            baseHeaders['Authorization'] = `Bearer ${apiKey}`;
        }

        return baseHeaders;
    }

    /**
     * 캐시 조회 (chrome.storage.local)
     */
    private async getVerificationCache(providerId: string, modelId: string, apiKey: string): Promise<VerificationResult | null> {
        console.log(`[BYOK DEBUG] 🗄️ getVerificationCache: provider=${providerId}, model=${modelId}`);
        try {
            const keyHash = await this.hashKey(apiKey);
            console.log(`[BYOK DEBUG] 🔐 Key hash: ${keyHash}`);

            const cacheKey = `verification_${providerId}_${modelId}_${keyHash}`;
            console.log(`[BYOK DEBUG] 🔑 Cache key: ${cacheKey}`);

            const result = await chrome.storage.local.get(cacheKey);
            const cached = result[cacheKey];

            if (!cached) {
                console.log(`[BYOK DEBUG] ❌ No cache found for key: ${cacheKey}`);
                return null;
            }

            console.log(`[BYOK DEBUG] ✅ Cache found:`, {
                result: cached.result,
                timestamp: new Date(cached.timestamp).toISOString(),
                ageMinutes: Math.floor((Date.now() - cached.timestamp) / 1000 / 60)
            });

            // ✅ 검증 결과별 차별화된 TTL
            let ttl: number;
            if (modelId === 'key_validation') {
                // 키 검증: 결과에 따라 TTL 차별화
                ttl = cached.result === 'unavailable'
                    ? 1 * 60 * 60 * 1000  // unavailable: 1시간
                    : 24 * 60 * 60 * 1000; // available: 24시간
            } else {
                // 모델 검증: 결과에 따라 TTL 차별화
                ttl = cached.result === 'unavailable'
                    ? 1 * 60 * 60 * 1000   // unavailable: 1시간 (빠른 재검증)
                    : 24 * 60 * 60 * 1000;  // available/uncertain: 24시간
            }

            const age = Date.now() - cached.timestamp;
            console.log(`[BYOK DEBUG] ⏰ TTL check: age=${age}ms, ttl=${ttl}ms, valid=${age < ttl}`);

            if (age < ttl) {
                console.log(`[BYOK DEBUG] ✅ Cache is valid, returning: ${cached.result}`);
                return cached.result;
            } else {
                console.log(`[BYOK DEBUG] ⏳ Cache expired`);
            }
        } catch (e) {
            console.error('[BYOK DEBUG] ❌ Error in getVerificationCache:', e);
        }
        return null;
    }

    /**
     * 캐시 저장
     */
    private async setVerificationCache(providerId: string, modelId: string, apiKey: string, result: VerificationResult): Promise<void> {
        try {
            const keyHash = await this.hashKey(apiKey);
            const cacheKey = `verification_${providerId}_${modelId}_${keyHash}`;
            await chrome.storage.local.set({
                [cacheKey]: {
                    result,
                    timestamp: Date.now(),
                },
            });
        } catch (e) {
            // chrome.storage 없는 환경 (테스트 등)
        }
    }

    /**
     * API 키 해싱 (보안: 캐시 키로 사용, 원본 키 노출 방지)
     */
    private async hashKey(apiKey: string): Promise<string> {
        // ✅ trim을 통해 공백으로 인한 해시 불일치 방지
        const trimmedKey = apiKey.trim();
        const encoder = new TextEncoder();
        const data = encoder.encode(trimmedKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }

    // --- Helper Methods ---

    private async getProviderWithDynamicModels(providerId: BYOKProviderId): Promise<typeof BYOK_PROVIDERS[BYOKProviderId]> {
        const staticProvider = BYOK_PROVIDERS[providerId];
        try {
            const settings = await loadBYOKSettings();
            const dynamicModels = settings.dynamicModels?.[providerId];
            if (dynamicModels && dynamicModels.length > 0) {
                return { ...staticProvider, variants: dynamicModels };
            }
        } catch (e) { }
        return staticProvider;
    }



    /**
     * 🆕 Refresh User Models (Dynamic Fetch from Provider)
     * 사용자의 API 키를 사용하여 실제 모델 리스트를 가져오고, 로컬 설정을 업데이트합니다.
     * @returns 갱신된 모델 리스트 (실패 시 null)
     */
    async refreshUserModels(providerId: BYOKProviderId, apiKey: string): Promise<BYOKModelVariant[] | null> {
        const adapter = this.getAdapter(providerId);
        const userRawModels = await adapter.listModels(apiKey);

        if (!userRawModels || userRawModels.length === 0) {
            console.log(`[BYOK] No dynamic models found for ${providerId} (or not supported). Keeping existing list.`);
            return null;
        }

        console.log(`[BYOK] 🔄 Refreshing user models for ${providerId}. Found ${userRawModels.length} raw models.`);

        // 1. Load existing knowledge base (Static + Proxy) for Metadata Lookup
        let metadataSource: BYOKModelVariant[] = BYOK_PROVIDERS[providerId].variants;

        try {
            const settings = await loadBYOKSettings();
            const proxyModels = settings.dynamicModels?.[providerId];
            if (proxyModels && proxyModels.length > 0) {
                const existingIds = new Set(metadataSource.map(m => m.id));
                for (const m of proxyModels) {
                    if (!existingIds.has(m.id)) {
                        metadataSource.push(m);
                    }
                }
            }
        } catch (e) { }

        const metadataMap = new Map(metadataSource.map(m => [m.id, m]));

        // 2. Construct NEW dynamic list based on API Response (Master Data)
        const newDynamicModels: BYOKModelVariant[] = userRawModels.map(raw => {
            const id = raw.id;
            // const normalizedId = this.normalizeModelId(providerId, id); // 정규화는 필요 시 사용

            // 메타데이터(가격, 설명 등) 찾기
            const metadata = metadataMap.get(id);

            // raw 모델에 이미 isFree 정보가 있는지 확인 (OpenRouter 등)
            const rawIsFree = (raw as any).isFree;
            const rawCostInput = (raw as any).costPer1MInput;
            const rawCostOutput = (raw as any).costPer1MOutput;

            // ✅ 이중 검증: API에서 온 isFree, ID, 이름, 기존 메타데이터 중 하나라도 무료라면 무료로 간주
            const isActuallyFree = (rawIsFree === true) ||
                id.endsWith(':free') ||
                (raw.name || '').toLowerCase().includes('(free)') ||
                (metadata?.isFree === true);

            if (metadata) {
                // 메타데이터가 있으면 그것을 베이스로 하되, API에서 온 최신 정보로 덮어씀
                return {
                    ...metadata,
                    id: id,
                    created: raw.created || metadata.created,
                    isNew: this.isRecentModel(raw.created),
                    // API에서 가격/무료 정보를 가져왔다면 업데이트, 아니면 재검증된 값 사용
                    isFree: isActuallyFree,
                    costPer1MInput: rawCostInput !== undefined ? rawCostInput : metadata.costPer1MInput,
                    costPer1MOutput: rawCostOutput !== undefined ? rawCostOutput : metadata.costPer1MOutput,
                };
            }

            // 메타데이터가 없으면 "Generic Model" 생성
            return {
                id: id,
                name: raw.name || id, // 🆕 API 제공 이름 사용
                description: raw.description || 'User-specific model', // 🆕 API 제공 설명 사용
                contextWindow: 128000,
                maxOutputTokens: 4096,
                inputPrice: 0,
                outputPrice: 0,
                costPer1MInput: rawCostInput || 0,
                costPer1MOutput: rawCostOutput || 0,
                capabilities: [],
                created: raw.created, // ✅ 정렬을 위한 핵심
                isNew: this.isRecentModel(raw.created),
                isFree: isActuallyFree, // 재검증된 값 사용
            };
        });

        // 3. Save to Settings
        const settings = await loadBYOKSettings();
        if (!settings.dynamicModels) settings.dynamicModels = {};

        settings.dynamicModels[providerId] = newDynamicModels;
        settings.lastRefreshTimestamp = Date.now();
        await saveBYOKSettings(settings);

        console.log(`[BYOK] ✅ Saved ${newDynamicModels.length} user-specific models for ${providerId}`);
        return newDynamicModels;
    }

    /**
     * 최근 모델인지 판단 (3개월 이내)
     */
    private isRecentModel(created?: number): boolean {
        if (!created) return false;
        const threeMonthsAgo = Date.now() / 1000 - (90 * 24 * 60 * 60);
        return created > threeMonthsAgo;
    }

    /**
     * 모델 리스트 가져오기 (우선순위: 사용자 동적 리스트 > 정적)
     * 🆕 변경: API 키가 있으면 항상 직접 Provider에게 최신 리스트를 요청합니다 (로컬 갱신).
     */
    async fetchAvailableModels(providerId: BYOKProviderId, apiKey?: string): Promise<BYOKModelVariant[]> {
        // 1. API 키가 있으면 직접 Provider에게 요청 (로컬 갱신)
        if (apiKey) {
            try {
                // refreshUserModels 내부에서 listModels 호출 -> merge -> save 수행
                const success = await this.refreshUserModels(providerId, apiKey);
                if (success) {
                    // 갱신 성공 시 저장된 동적 모델 반환
                    const settings = await loadBYOKSettings();
                    if (settings.dynamicModels?.[providerId]) {
                        return settings.dynamicModels[providerId];
                    }
                }
            } catch (e) {
                console.warn(`[BYOK] Could not refresh user models for ${providerId} (likely invalid key). Using cached/static models instead.`, e);
            }
        }

        const settings = await loadBYOKSettings();

        // 2. 이미 저장된 동적 모델이 있으면 반환 (API 호출 실패 시 캐시 역할)
        if (settings.dynamicModels?.[providerId] && settings.dynamicModels[providerId].length > 0) {
            return settings.dynamicModels[providerId];
        }

        // 3. 정적 정의 반환
        return BYOK_PROVIDERS[providerId].variants;
    }

    private readonly OPENROUTER_CATALOG_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

    /**
     * OpenRouter public catalog -> provider-scoped model lists (local cache)
     * - No developer-operated proxy required
     * - Stores only a truncated, review-friendly subset in chrome.storage.local
     */
    async refreshAllModelsFromOpenRouterCatalog(forceRefresh: boolean = false): Promise<boolean> {
        try {
            const settings = await loadBYOKSettings();
            const lastRefresh = settings.lastRefreshTimestamp || 0;

            const hasAnyCatalog = Boolean(
                settings.dynamicModels &&
                Object.values(settings.dynamicModels).some((list) => Array.isArray(list) && list.length > 0)
            );

            const isFresh = hasAnyCatalog && lastRefresh > 0 && (Date.now() - lastRefresh) < this.OPENROUTER_CATALOG_TTL_MS;
            if (!forceRefresh && isFresh) {
                return true;
            }

            const url =
                BYOK_PROVIDERS.openrouter.modelsEndpoint ||
                `${BYOK_PROVIDERS.openrouter.apiEndpoint}/models`;

            console.log(`[BYOK] Fetching OpenRouter model catalog... (force: ${forceRefresh})`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            const response = await fetch(url, { method: 'GET', signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.warn(`[BYOK] OpenRouter catalog fetch failed: ${response.status}`);
                return false;
            }

            const data = (await response.json()) as OpenRouterModelsResponse;
            const rawModels = Array.isArray(data.data) ? data.data : [];

            if (rawModels.length === 0) {
                console.warn('[BYOK] OpenRouter catalog returned an empty model list');
                return false;
            }

            const classified = this.classifyOpenRouterCatalog(rawModels);

            settings.dynamicModels = classified;
            settings.lastRefreshTimestamp = Date.now();
            await saveBYOKSettings(settings);

            console.log('[BYOK] ✅ OpenRouter catalog cached locally');
            return true;
        } catch (error) {
            console.error('[BYOK] Failed to refresh OpenRouter catalog:', error);
            return false;
        }
    }

    private classifyOpenRouterCatalog(rawModels: OpenRouterModel[]): Record<BYOKProviderId, BYOKModelVariant[]> {
        const buckets: Record<BYOKProviderId, BYOKModelVariant[]> = {
            openai: [],
            anthropic: [],
            google: [],
            deepseek: [],
            xai: [],
            mistral: [],
            qwen: [],
            kimi: [],
            openrouter: [],
        };

        for (const raw of rawModels) {
            if (!raw?.id) continue;

            const primaryProvider = this.mapOpenRouterModelToProviderId(raw.id) || 'openrouter';
            const variant = this.transformOpenRouterCatalogModel(raw, primaryProvider);

            if (primaryProvider !== 'openrouter') {
                buckets[primaryProvider].push(variant);
            }

            // OpenRouter bucket includes everything (including unknown providers)
            buckets.openrouter.push(variant);
        }

        for (const providerId of Object.keys(buckets) as BYOKProviderId[]) {
            buckets[providerId].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
            const maxModels = providerId === 'openrouter' ? 250 : 100;
            if (buckets[providerId].length > maxModels) {
                buckets[providerId] = buckets[providerId].slice(0, maxModels);
            }
        }

        return buckets;
    }

    private mapOpenRouterModelToProviderId(modelId: string): BYOKProviderId | null {
        const lower = (modelId || '').toLowerCase();
        if (lower.startsWith('openai/')) return 'openai';
        if (lower.startsWith('anthropic/')) return 'anthropic';
        if (lower.startsWith('google/')) return 'google';
        if (lower.startsWith('deepseek/')) return 'deepseek';
        if (lower.startsWith('mistralai/')) return 'mistral';
        if (lower.startsWith('qwen/')) return 'qwen';
        if (lower.startsWith('moonshotai/')) return 'kimi';
        if (lower.startsWith('x-ai/')) return 'xai';
        return null;
    }

    private transformOpenRouterCatalogModel(raw: OpenRouterModel, providerId: BYOKProviderId): BYOKModelVariant {
        const id = raw.id;
        const name = raw.name || id;
        const description = raw.description || '';
        const contextWindow = raw.context_length || 4096;
        const maxOutputTokens = raw.top_provider?.max_completion_tokens || 4096;

        const promptPrice = Number.parseFloat(raw.pricing?.prompt ?? '0') || 0;
        const completionPrice = Number.parseFloat(raw.pricing?.completion ?? '0') || 0;
        const cachedInputPrice = Number.parseFloat(raw.pricing?.input_cache_read ?? '0') || 0;

        const lowerId = id.toLowerCase();
        const lowerName = name.toLowerCase();
        const isFree =
            (promptPrice === 0 && completionPrice === 0) ||
            lowerId.endsWith(':free') ||
            lowerName.includes('(free)');

        const inputModalities = raw.architecture?.input_modalities || [];
        const hasImageInput = inputModalities.includes('image');

        const capabilities: ModelCapability[] = [];
        if (
            hasImageInput ||
            lowerId.includes('vision') ||
            lowerId.includes('gpt-4o') ||
            lowerId.includes('claude-3') ||
            lowerId.includes('gemini')
        ) {
            capabilities.push('vision');
        }
        if (lowerId.includes('code') || lowerId.includes('coder')) {
            capabilities.push('coding');
        }
        if (
            lowerId.includes('reason') ||
            lowerId.includes('o1') ||
            lowerId.includes('o3') ||
            lowerId.includes('thinking') ||
            lowerId.includes('r1')
        ) {
            capabilities.push('reasoning');
        }
        if (lowerId.includes('realtime') || lowerId.includes('audio')) {
            capabilities.push('realtime');
        }

        const supportsReasoningEffort =
            lowerId.includes('o1') || lowerId.includes('o3') || lowerId.includes('gpt-5');

        const supportsThinkingBudget =
            (providerId === 'anthropic' || providerId === 'qwen') &&
            (lowerId.includes('thinking') || lowerId.includes('sonnet') || lowerId.includes('opus'));

        const supportsThinkingLevel = providerId === 'google' && lowerId.includes('thinking');
        const supportsEnableThinking = providerId === 'deepseek' && !lowerId.includes('reasoner');

        const created = typeof raw.created === 'number' ? raw.created : undefined;
        const nowSeconds = Math.floor(Date.now() / 1000);
        const isNew = created ? created >= (nowSeconds - 30 * 24 * 60 * 60) : undefined;

        const popularity = this.computeOpenRouterPopularityScore({
            idLower: lowerId,
            created,
            contextWindow,
            hasMaxCompletion: Boolean(raw.top_provider?.max_completion_tokens),
            isFree,
        });

        return {
            id,
            name,
            description,
            contextWindow,
            maxOutputTokens,
            costPer1MInput: promptPrice * 1_000_000,
            costPer1MOutput: completionPrice * 1_000_000,
            costPer1MCachedInput: cachedInputPrice * 1_000_000,
            capabilities,
            supportsReasoningEffort,
            supportsThinkingBudget,
            supportsThinkingLevel,
            supportsEnableThinking,
            created,
            isNew,
            popularity,
            architecture: raw.architecture?.modality ?? null,
            topProvider: null,
            isFree,
        };
    }

    private computeOpenRouterPopularityScore(args: {
        idLower: string;
        created?: number;
        contextWindow: number;
        hasMaxCompletion: boolean;
        isFree: boolean;
    }): number {
        const { idLower, created, contextWindow, hasMaxCompletion, isFree } = args;

        const contextScore = contextWindow / 1000;
        const recencyScore = (created || 0) / 100_000_000;
        const providerScore = hasMaxCompletion ? 10 : 0;

        let seriesBonus = 0;
        if (
            idLower.includes('gpt-4') ||
            idLower.includes('o1') ||
            idLower.includes('o3') ||
            idLower.includes('claude-3.5') ||
            idLower.includes('gemini-2') ||
            idLower.includes('gemini-pro')
        ) {
            seriesBonus = 100;
        } else if (
            idLower.includes('llama-3.3') ||
            idLower.includes('llama-3.1-405b') ||
            idLower.includes('claude-3') ||
            idLower.includes('gemini-1.5') ||
            idLower.includes('qwen-2.5-72b') ||
            idLower.includes('deepseek-r1')
        ) {
            seriesBonus = 80;
        } else if (
            idLower.includes('gpt-3.5') ||
            idLower.includes('llama-3.1-70b') ||
            idLower.includes('mixtral') ||
            idLower.includes('qwen-2.5')
        ) {
            seriesBonus = 60;
        } else if (idLower.includes('llama-3') || idLower.includes('mistral')) {
            seriesBonus = 40;
        }

        const freeBonus = isFree ? 50 : 0;
        return contextScore + recencyScore + providerScore + seriesBonus + freeBonus;
    }
}

// --- Storage Utils ---

export async function loadBYOKSettings(): Promise<BYOKSettings> {
    return new Promise((resolve) => {
        chrome.storage.local.get(['byokSettings'], (result) => {
            const defaultSettings: BYOKSettings = { enabled: false, providers: {} };
            resolve(result.byokSettings || defaultSettings);
        });
    });
}

export async function saveBYOKSettings(settings: BYOKSettings): Promise<void> {
    return new Promise((resolve) => {
        chrome.storage.local.set({ byokSettings: settings }, () => resolve());
    });
}

export async function isProviderConfigured(providerId: BYOKProviderId): Promise<boolean> {
    const settings = await loadBYOKSettings();
    return Boolean(settings.enabled && settings.providers[providerId]?.apiKey);
}

/**
 * 6시간 TTL 체크 - 마지막 갱신 이후 6시간 경과 여부 확인
 * @returns true면 자동 갱신 필요, false면 캐시 유효
 */
/**
 * BYOK Variant 삭제
 * @param providerId Provider ID
 * @param variantId  삭제할 Variant ID
 */
export async function removeBYOKVariant(providerId: BYOKProviderId, variantId: string): Promise<void> {
    const settings = await loadBYOKSettings();
    const config = settings.providers[providerId];

    if (!config || !config.selectedVariants) return;

    // 배열에서 해당 variant 제거
    const newVariants = config.selectedVariants.filter(id => id !== variantId);

    // 업데이트된 설정 저장
    settings.providers[providerId] = {
        ...config,
        selectedVariants: newVariants
    };

    await saveBYOKSettings(settings);
    console.log(`[BYOK] Removed variant: ${providerId}/${variantId}`);
}
