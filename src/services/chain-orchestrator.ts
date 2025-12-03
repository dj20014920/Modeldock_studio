import { ActiveModel, ModelId, BYOKProviderId, ChatMessage } from '../types';
import { INPUT_SELECTORS, SUPPORTED_MODELS } from '../constants';
import { BYOKAPIService, loadBYOKSettings } from './byokService';
import { getIframeActualUrlWithRetry } from '../utils/iframeUrlUtils';

export interface BrainFlowCallbacks {
    onPhaseStart: (phase: 1 | 2 | 3) => void;
    onModelStart: (modelId: ModelId, instanceId?: string) => void;
    onModelUpdate: (modelId: ModelId, text: string, instanceId?: string) => void;
    onModelComplete: (modelId: ModelId, text: string, instanceId?: string) => void;
    onError: (error: any) => void;
    onConversationLink?: (instanceId: string, url: string, modelId?: ModelId) => void;
}

interface BrainFlowConfig {
    mainBrain: ActiveModel;
    slaves: ActiveModel[];
    goal: string;
    prompts: {
        phase1: string;
        phase3: string;
    };
    callbacks: BrainFlowCallbacks;
}

export class ChainOrchestrator {
    private static instance: ChainOrchestrator;
    private activeListeners: Map<string, (e: MessageEvent) => void> = new Map();
    private pendingRequests: Map<string, { resolve: (value: string) => void, cleanup: () => void, getCurrentText: () => string }> = new Map();

    // Skip 기능을 위한 상태 관리
    private skipRequested: boolean = false;
    private isCancelled: boolean = false;
    private collectedSlaveResponses: Map<string, { slave: ActiveModel, response: string }> = new Map();

    private constructor() { }

    public static getInstance(): ChainOrchestrator {
        if (!ChainOrchestrator.instance) {
            ChainOrchestrator.instance = new ChainOrchestrator();
        }
        return ChainOrchestrator.instance;
    }

    public async sendMessage(
        model: ActiveModel,
        text: string
    ): Promise<string> {
        return this.sendMessageToModel(model, text, {
            onPhaseStart: () => { },
            onModelStart: () => { },
            onModelUpdate: () => { },
            onModelComplete: () => { },
            onError: () => { }
        });
    }

    public async runBrainFlow(config: BrainFlowConfig): Promise<void> {
        const { mainBrain, slaves, goal, prompts, callbacks } = config;

        // 새 BrainFlow 시작 시 상태 초기화
        this.skipRequested = false;
        this.isCancelled = false;
        this.collectedSlaveResponses.clear();

        try {
            // === Phase 1: Main Brain Planning ===
            if (this.isCancelled) throw new Error('Brain Flow cancelled by user');
            callbacks.onPhaseStart(1);

            // 🔧 Generate unique display IDs for slaves (e.g., grok-1, grok-2)
            const slaveIdMap = new Map<string, string>(); // instanceId -> displayId
            const displayIdMap = new Map<string, string>(); // displayId -> instanceId
            const modelCounters = new Map<string, number>();

            slaves.forEach(slave => {
                const count = (modelCounters.get(slave.modelId) || 0) + 1;
                modelCounters.set(slave.modelId, count);
                const displayId = `${slave.modelId}-${count}`;
                slaveIdMap.set(slave.instanceId, displayId);
                displayIdMap.set(displayId, slave.instanceId);
            });

            const slaveListText = slaves.map(s => `- [SLAVE:${slaveIdMap.get(s.instanceId)}] ${SUPPORTED_MODELS[s.modelId].name}`).join('\n');
            const phase1Prompt = prompts.phase1
                .replace('{{slaves}}', slaveListText)
                .replace('{{goal}}', goal);

            const planResponse = await this.sendMessageToModel(
                mainBrain,
                phase1Prompt,
                callbacks
            );

            // 🔧 CRITICAL VALIDATION: Phase 1 응답 유효성 검증
            // 메인 브레인의 응답이 슬레이브 지시를 포함하는지 확인
            console.log('[BrainFlow] Phase 1 Response received, validating...');
            console.log('[BrainFlow] Response length:', planResponse?.length || 0);
            
            if (!planResponse || planResponse.length < 50) {
                console.error('[BrainFlow] ❌ Phase 1 response too short or empty!');
                throw new Error('Main Brain response is too short. Please try again.');
            }
            
            // 슬레이브 지시 블록 존재 확인
            const hasSlaveBlocks = planResponse.includes('[SLAVE:') || planResponse.includes('[/SLAVE]');
            if (!hasSlaveBlocks) {
                console.warn('[BrainFlow] ⚠️ No [SLAVE:] blocks found in response. Response preview:', planResponse.substring(0, 200));
            }

            if (this.isCancelled) throw new Error('Brain Flow cancelled by user');

            // === Phase 2: Slave Execution ===
            callbacks.onPhaseStart(2);

            // Parse the plan to find prompts for each slave
            console.log('[BrainFlow] ===== PARSING PHASE =====');
            console.log('[BrainFlow] Plan Response Length:', planResponse.length);
            console.log('[BrainFlow] Slaves to process:', slaves.map(s => `${s.modelId} (${slaveIdMap.get(s.instanceId)})`).join(', '));

            const slavePrompts = this.parseSlavePrompts(planResponse, slaves);

            // 🔧 CRITICAL VALIDATION: 슬레이브 프롬프트 파싱 결과 검증
            console.log('[BrainFlow] ===== MATCHING RESULTS =====');
            console.log('[BrainFlow] Parsed prompts count:', slavePrompts.size);
            
            slaves.forEach(slave => {
                const displayId = slaveIdMap.get(slave.instanceId);
                const found = slavePrompts.get(displayId!) || slavePrompts.get(slave.instanceId) || slavePrompts.get(slave.modelId);
                console.log(`[BrainFlow] ${displayId} (${slave.instanceId}): ${found ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
            });

            // 슬레이브 프롬프트가 하나도 없으면 경고 (에러는 아님 - 일부 슬레이브만 있을 수 있음)
            if (slavePrompts.size === 0) {
                console.error('[BrainFlow] ❌ CRITICAL: No slave prompts parsed! Main Brain may not have generated proper instructions.');
                console.error('[BrainFlow] Full response for debugging:', planResponse);
            }

            const slavePromises = slaves.map(async (slave) => {
                if (this.isCancelled) return { slave, response: '(Cancelled)' };

                const displayId = slaveIdMap.get(slave.instanceId)!;
                // Try multiple matching strategies
                let prompt = slavePrompts.get(displayId) // Priority 1: grok-1
                    || slavePrompts.get(slave.instanceId) // Priority 2: instanceId (fallback)
                    || slavePrompts.get(slave.modelId);   // Priority 3: modelId (legacy)

                if (!prompt) {
                    console.error(`[BrainFlow] ❌ CRITICAL: No prompt found for ${displayId}`);
                    console.error(`[BrainFlow] Available keys:`, Array.from(slavePrompts.keys()));
                    const result = { slave, response: '(Error: No instruction provided by Main Brain)' };
                    this.collectedSlaveResponses.set(slave.instanceId, result);
                    return result;
                }

                try {
                    console.log(`[BrainFlow] ✓ Sending to ${displayId}:`, prompt.substring(0, 100) + '...');
                    const response = await this.sendMessageToModel(slave, prompt, callbacks);
                    const result = { slave, response };
                    // 응답 완료 시 수집 (Skip 여부와 관계없이)
                    this.collectedSlaveResponses.set(slave.instanceId, result);
                    return result;
                } catch (err: any) {
                    console.error(`[BrainFlow] Slave ${displayId} failed:`, err);
                    const result = { slave, response: `(Error: ${err.message || 'Unknown error'})` };
                    this.collectedSlaveResponses.set(slave.instanceId, result);
                    return result;
                }
            });

            const slaveResults = await Promise.all(slavePromises);

            if (this.isCancelled) throw new Error('Brain Flow cancelled by user');

            // Skip이 요청되었을 경우, 수집된 응답들로 결과 구성
            const finalResults = this.skipRequested
                ? Array.from(this.collectedSlaveResponses.values())
                : slaveResults;

            console.log(`[BrainFlow] Phase 2 완료 - Skip: ${this.skipRequested}, 수집된 응답: ${finalResults.length}개`);

            // === Phase 3: Synthesis ===
            callbacks.onPhaseStart(3);

            const responsesText = finalResults.map(r =>
                `[${slaveIdMap.get(r.slave.instanceId)} Response]\n${r.response}\n`
            ).join('\n\n');

            const phase3Prompt = prompts.phase3
                .replace('{{goal}}', goal)
                .replace('{{responses}}', responsesText);

            await this.sendMessageToModel(
                mainBrain,
                phase3Prompt,
                callbacks
            );

        } catch (error: any) {
            if (error.message === 'Brain Flow cancelled by user') {
                console.log('[BrainFlow] Process cancelled.');
            } else {
                console.error('[BrainFlow] Error:', error);
                callbacks.onError(error);
            }
        } finally {
            // 정리
            this.skipRequested = false;
            this.isCancelled = false;
            this.collectedSlaveResponses.clear();
        }
    }

    /**
     * Skip 버튼 클릭 시 호출 - 현재 Phase를 강제 완료하고 다음으로 진행
     * 미완료된 슬레이브 모델들의 현재까지 응답도 수집하여 Phase 3에 전달
     */
    public skipCurrentPhase() {
        console.log('[BrainFlow] Skipping current phase...');
        this.skipRequested = true;

        // 모든 pending request에서 현재까지의 텍스트 수집 후 강제 완료
        this.pendingRequests.forEach((request, requestId) => {
            console.log(`[BrainFlow] Forcing completion for request ${requestId}`);
            const currentText = request.getCurrentText();
            console.log(`[BrainFlow] Collected text length: ${currentText.length} chars`);
            request.resolve(currentText);
            request.cleanup();
        });
        this.pendingRequests.clear();
    }

    /**
     * Cancel 버튼 클릭 시 호출 - 프로세스 즉시 중단
     */
    public cancelBrainFlow() {
        console.log('[BrainFlow] Cancelling process...');
        this.isCancelled = true;

        // 모든 pending request 강제 종료 (reject 대신 cleanup만)
        this.pendingRequests.forEach((request, requestId) => {
            console.log(`[BrainFlow] Cancelling request ${requestId}`);
            request.cleanup();
        });
        this.pendingRequests.clear();
    }

    private byokService: BYOKAPIService = BYOKAPIService.getInstance();

    private async sendMessageToModel(
        model: ActiveModel,
        text: string,
        callbacks: BrainFlowCallbacks
    ): Promise<string> {
        const withTailHistory = (messages: ChatMessage[] = []): ChatMessage[] => {
            // 최대 20턴(40메시지)로 잘라서 전송, 최신이 앞쪽에 남도록 뒤에서 슬라이스
            const limit = 40;
            if (messages.length <= limit) return messages;
            return messages.slice(-limit);
        };

        // 1. Check BYOK configuration first
        try {
            const settings = await loadBYOKSettings();
            const providerId = this.mapModelIdToProvider(model.modelId);

            if (settings.enabled && providerId && settings.providers[providerId]?.apiKey) {
                console.log(`[BrainFlow] Using BYOK for ${model.modelId} (${providerId})`);
                callbacks.onModelStart(model.modelId, model.instanceId);

                const config = settings.providers[providerId]!;
                const variant = config.selectedVariant || config.selectedVariants?.[0];

                if (!variant) {
                    throw new Error(`No BYOK model selected for provider: ${providerId}`);
                }
                const historyMessages = [...withTailHistory(model.messages || []), {
                    role: 'user' as const,
                    content: text,
                    timestamp: Date.now()
                }];

                const response = await this.byokService.callAPI({
                    providerId,
                    apiKey: config.apiKey.trim(),
                    variant,
                    prompt: text,
                    historyMessages,
                    temperature: config.customTemperature,
                    reasoningEffort: config.reasoningEffort,
                    thinkingBudget: config.thinkingBudget,
                    thinkingLevel: config.thinkingLevel,
                    enableThinking: config.enableThinking
                });

                if (response.success) {
                    let finalText = response.content || '';
                    if (response.reasoning) {
                        // Append reasoning if available (or handle via callback if UI supports it)
                        finalText = `[Reasoning]\n${response.reasoning}\n\n[Answer]\n${finalText}`;
                    }
                    callbacks.onModelComplete(model.modelId, finalText, model.instanceId);
                    return finalText;
                } else {
                    console.warn(`[BrainFlow] BYOK call failed: ${response.error}. Falling back to standard mode.`);
                    // Fallback to standard execution below
                }
            }
        } catch (e) {
            console.error('[BrainFlow] BYOK check failed:', e);
        }

        // 2. Standard Execution (Perplexity API or Iframe)
        if (model.modelId === 'perplexity') {
            console.log('[BrainFlow] Perplexity detected - using API mode');
            return this.sendToPerplexity(text, callbacks);
        }

        // 3. Iframe Automation
        return this.sendToIframe(model, text, callbacks);
    }

    private mapModelIdToProvider(modelId: string): BYOKProviderId | null {
        const lower = modelId.toLowerCase();

        // 1. Explicit BYOK ID check
        if (lower.startsWith('byok-')) {
            const providerPart = lower.replace('byok-', '');
            // Validate if it's a known provider
            const validProviders: BYOKProviderId[] = ['openai', 'anthropic', 'google', 'deepseek', 'xai', 'mistral', 'qwen', 'kimi', 'openrouter'];
            if (validProviders.includes(providerPart as BYOKProviderId)) {
                return providerPart as BYOKProviderId;
            }
        }

        // 2. Existing heuristic checks
        if (lower.includes('gpt') || lower.includes('o1')) return 'openai';
        if (lower.includes('claude')) return 'anthropic';
        if (lower.includes('gemini')) return 'google';
        if (lower.includes('deepseek')) return 'deepseek';
        if (lower.includes('grok')) return 'xai';
        if (lower.includes('mistral')) return 'mistral';
        if (lower.includes('qwen')) return 'qwen';
        if (lower.includes('kimi')) return 'kimi';
        // OpenRouter is usually a manual selection, but if modelId implies it:
        if (lower.includes('openrouter')) return 'openrouter';
        return null;
    }

    private async sendToPerplexity(
        text: string,
        callbacks: BrainFlowCallbacks
    ): Promise<string> {
        const { perplexityService } = await import('./perplexity-service');

        const requestId = `bf-perplexity-${Date.now()}`;
        callbacks.onModelStart('perplexity');

        return new Promise((resolve) => {
            let lastResponse = '';
            let unsubscribe: (() => void) | null = null;

            const cleanup = () => {
                if (unsubscribe) {
                    unsubscribe();
                    unsubscribe = null;
                }
                this.pendingRequests.delete(requestId);
            };

            // Subscribe to Perplexity state changes
            unsubscribe = perplexityService.subscribe((state) => {
                // Update on streaming
                if (state.isStreaming && state.messages.length > 0) {
                    const lastMsg = state.messages[state.messages.length - 1];
                    if (lastMsg.role === 'assistant' && lastMsg.content) {
                        lastResponse = lastMsg.content;
                        callbacks.onModelUpdate('perplexity', lastResponse);
                    }
                }

                // Complete on done
                if (!state.isStreaming && lastResponse) {
                    callbacks.onModelComplete('perplexity', lastResponse);
                    cleanup();
                    resolve(lastResponse);
                }

                // Handle errors
                if (state.error) {
                    console.error('[BrainFlow] Perplexity error:', state.error);
                    callbacks.onModelComplete('perplexity', lastResponse || `Error: ${state.error}`);
                    cleanup();
                    resolve(lastResponse || `Error: ${state.error}`);
                }
            });

            // Store for skip functionality
            this.pendingRequests.set(requestId, {
                resolve: (text: string) => {
                    cleanup();
                    resolve(text);
                },
                cleanup,
                getCurrentText: () => lastResponse
            });

            // Send message
            try {
                perplexityService.sendMessage(text);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                callbacks.onModelComplete('perplexity', `Error: ${errorMsg}`);
                cleanup();
                resolve(`Error: ${errorMsg}`);
            }
        });
    }

    private async sendToIframe(
        model: ActiveModel,
        text: string,
        callbacks: BrainFlowCallbacks
    ): Promise<string> {
        const iframe = this.findIframe(model);
        if (!iframe) throw new Error(`Iframe not found for model ${model.modelId}`);

        const selector = INPUT_SELECTORS[model.modelId];
        if (!selector) throw new Error(`No selector for model ${model.modelId}`);

        const requestId = `bf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const modelConfig = SUPPORTED_MODELS[model.modelId];
        const initialUrl = modelConfig?.url || iframe.src;

        callbacks.onModelStart(model.modelId, model.instanceId);

        return new Promise((resolve) => {
            let responseText = '';

            // Listener for this specific request
            const listener = async (event: MessageEvent) => {
                const data = event.data;
                if (!data) return;

                // Handle heartbeat (Reset timeout)
                if (data.type === 'MODEL_DOCK_HEARTBEAT' && data.payload?.requestId === requestId) {
                    lastActivityTime = Date.now();
                    // Optional: Log heartbeat for debugging
                    // console.log(`[BrainFlow] Heartbeat from ${model.modelId}: ${data.payload.status}`);
                }

                // Handle chunks
                if (data.type === 'MODEL_DOCK_RESPONSE_CHUNK' && data.payload?.requestId === requestId) {
                    responseText = data.payload.text;
                    lastActivityTime = Date.now();
                    callbacks.onModelUpdate(model.modelId, responseText, model.instanceId);
                }

                // Handle completion
                if (data.type === 'MODEL_DOCK_RESPONSE_COMPLETE' && data.payload?.requestId === requestId) {
                    console.log(`[BrainFlow] Completion signal received from ${model.modelId}`);
                    responseText = data.payload.text;

                    // 🔧 CRITICAL: Get final conversation URL with retry logic
                    // Wait for URL to change (platforms take time to navigate to new session)
                    const finalUrl = await getIframeActualUrlWithRetry(iframe, initialUrl, 5, 500);
                    if (finalUrl) {
                        callbacks.onConversationLink?.(model.instanceId, finalUrl, model.modelId);
                    } else if (iframe?.src) {
                        // Fallback to iframe.src if retry failed
                        callbacks.onConversationLink?.(model.instanceId, iframe.src, model.modelId);
                    }

                    callbacks.onModelComplete(model.modelId, responseText, model.instanceId);
                    cleanup();
                    resolve(responseText);
                }
            };

            const cleanup = () => {
                window.removeEventListener('message', listener);
                this.activeListeners.delete(requestId);
                this.pendingRequests.delete(requestId);
                clearInterval(statusInterval);
            };

            // Store request control
            this.pendingRequests.set(requestId, {
                resolve: (text) => {
                    callbacks.onModelComplete(model.modelId, text, model.instanceId);
                    resolve(text);
                },
                cleanup,
                getCurrentText: () => responseText
            });

            window.addEventListener('message', listener);
            this.activeListeners.set(requestId, listener);

            // 1. Inject and Submit
            iframe.contentWindow?.postMessage({
                type: 'MODEL_DOCK_INJECT_TEXT',
                payload: {
                    text,
                    targets: [{ ...selector, modelId: model.modelId }],
                    requestId,
                    modelId: model.modelId,
                    submit: true,
                    forceKey: true
                }
            }, '*');

            // 2. Start Monitoring (immediately)
            iframe.contentWindow?.postMessage({
                type: 'MODEL_DOCK_START_MONITORING',
                requestId
            }, '*');

            // 3. Infinite Wait with Heartbeat Check
            let lastActivityTime = Date.now();
            const statusInterval = setInterval(() => {
                const elapsed = Date.now() - lastActivityTime;

                // Log status every 10 seconds
                if ((Date.now() % 10000) < 1000) {
                    console.log(`[BrainFlow] Waiting for ${model.modelId}... (Last activity: ${Math.round(elapsed / 1000)}s ago)`);
                }

                // NO TIMEOUT - Infinite wait until completion or manual skip
                // We only warn if it's been a very long time without activity, but we don't reject.
                if (elapsed > 120000 && (Date.now() % 30000) < 1000) {
                    console.warn(`[BrainFlow] No signal from ${model.modelId} for over 2 minutes. Check connection.`);
                }
            }, 1000);
        });
    }

    private findIframe(model: ActiveModel): HTMLIFrameElement | null {
        // Try by instanceId
        let iframe = document.querySelector(`iframe[data-instance-id="${model.instanceId}"]`) as HTMLIFrameElement;
        if (iframe) return iframe;

        // Try by modelId
        iframe = document.querySelector(`iframe[data-model-id="${model.modelId}"]`) as HTMLIFrameElement;
        if (iframe) return iframe;

        // Try by URL matching
        const config = SUPPORTED_MODELS[model.modelId];
        if (config) {
            try {
                const host = new URL(config.url).host;
                const frames = Array.from(document.querySelectorAll('iframe'));
                return frames.find(f => f.src.includes(host)) || null;
            } catch (e) { return null; }
        }
        return null;
    }

    private parseSlavePrompts(planText: string, slaves: ActiveModel[]): Map<string, string> {
        const prompts = new Map<string, string>();

        console.log('[BrainFlow] ===== RAW PLAN TEXT (First 500 chars) =====');
        console.log(planText.substring(0, 500));
        console.log('[BrainFlow] ===== FULL LENGTH:', planText.length, 'chars =====');

        // Strategy 1: Split-based parsing
        const parts = planText.split(/\[SLAVE:\s*/i);
        console.log('[BrainFlow] Split into', parts.length, 'parts');

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            console.log(`[BrainFlow] Processing part ${i}:`, part.substring(0, 50));

            const closingBracketIndex = part.indexOf(']');
            if (closingBracketIndex === -1) {
                console.warn(`[BrainFlow] No closing bracket in part ${i}`);
                continue;
            }

            let id = part.substring(0, closingBracketIndex).trim();
            let content = part.substring(closingBracketIndex + 1);

            console.log(`[BrainFlow] Extracted ID: "${id}"`);

            // Remove closing tag if present
            const closingTagRegex = /\[\/\s*SLAVE\s*\]/i;
            const closingMatch = closingTagRegex.exec(content);
            if (closingMatch) {
                content = content.substring(0, closingMatch.index);
                console.log(`[BrainFlow] Found closing tag at position ${closingMatch.index}`);
            }

            content = content.trim();

            if (!id || !content) {
                console.warn(`[BrainFlow] Skipping - ID: "${id}", Content Length: ${content.length}`);
                continue;
            }

            // Store with original ID
            prompts.set(id, content);
            console.log(`[BrainFlow] ✓ Stored prompt for "${id}" (${content.length} chars)`);

            // Also try to map by modelId if ID looks like instanceId
            const matchingSlave = slaves.find(s => s.instanceId === id || s.modelId === id);
            if (matchingSlave && matchingSlave.instanceId !== id) {
                prompts.set(matchingSlave.modelId, content);
                console.log(`[BrainFlow] ✓ Also mapped to modelId: "${matchingSlave.modelId}"`);
            }
        }

        console.log('[BrainFlow] ===== PARSING COMPLETE =====');
        console.log('[BrainFlow] Total prompts parsed:', prompts.size);
        console.log('[BrainFlow] Keys:', Array.from(prompts.keys()));

        if (prompts.size === 0) {
            console.error('[BrainFlow] ❌ CRITICAL: Zero prompts parsed!');
            console.error('[BrainFlow] Full plan text:');
            console.error(planText);
        }

        return prompts;
    }
}
