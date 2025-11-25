import { ActiveModel, ModelId } from '../types';
import { INPUT_SELECTORS, SUPPORTED_MODELS } from '../constants';

export interface BrainFlowCallbacks {
    onPhaseStart: (phase: 1 | 2 | 3) => void;
    onModelStart: (modelId: ModelId) => void;
    onModelUpdate: (modelId: ModelId, text: string) => void;
    onModelComplete: (modelId: ModelId, text: string) => void;
    onError: (error: any) => void;
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

    private constructor() { }

    public static getInstance(): ChainOrchestrator {
        if (!ChainOrchestrator.instance) {
            ChainOrchestrator.instance = new ChainOrchestrator();
        }
        return ChainOrchestrator.instance;
    }

    public async runBrainFlow(config: BrainFlowConfig): Promise<void> {
        const { mainBrain, slaves, goal, prompts, callbacks } = config;

        try {
            // === Phase 1: Main Brain Planning ===
            callbacks.onPhaseStart(1);

            const slaveListText = slaves.map(s => `- ${s.modelId} (${s.instanceId})`).join('\n');
            const phase1Prompt = prompts.phase1
                .replace('{{slaves}}', slaveListText)
                .replace('{{goal}}', goal);

            const planResponse = await this.sendMessageToModel(
                mainBrain,
                phase1Prompt,
                callbacks
            );

            // === Phase 2: Slave Execution ===
            callbacks.onPhaseStart(2);

            // Parse the plan to find prompts for each slave
            console.log('[BrainFlow] ===== PARSING PHASE =====');
            console.log('[BrainFlow] Plan Response Length:', planResponse.length);
            console.log('[BrainFlow] Slaves to process:', slaves.map(s => `${s.modelId} (${s.instanceId})`).join(', '));

            const slavePrompts = this.parseSlavePrompts(planResponse, slaves);

            console.log('[BrainFlow] ===== MATCHING RESULTS =====');
            slaves.forEach(slave => {
                const found = slavePrompts.get(slave.instanceId) || slavePrompts.get(slave.modelId);
                console.log(`[BrainFlow] ${slave.modelId} (${slave.instanceId}): ${found ? 'FOUND ✓' : 'NOT FOUND ✗'}`);
            });

            const slavePromises = slaves.map(async (slave) => {
                // Try multiple matching strategies
                let prompt = slavePrompts.get(slave.instanceId)
                    || slavePrompts.get(slave.modelId)
                    || slavePrompts.get(`${slave.modelId}-${slave.instanceId.split('-')[1]}`);

                if (!prompt) {
                    console.error(`[BrainFlow] ❌ CRITICAL: No prompt found for ${slave.modelId} (${slave.instanceId})`);
                    console.error(`[BrainFlow] Available keys:`, Array.from(slavePrompts.keys()));
                    return { slave, response: '(Error: No instruction provided by Main Brain)' };
                }

                try {
                    console.log(`[BrainFlow] ✓ Sending to ${slave.modelId}:`, prompt.substring(0, 100) + '...');
                    const response = await this.sendMessageToModel(slave, prompt, callbacks);
                    return { slave, response };
                } catch (err: any) {
                    console.error(`[BrainFlow] Slave ${slave.modelId} failed:`, err);
                    return { slave, response: `(Error: ${err.message || 'Unknown error'})` };
                }
            });

            const slaveResults = await Promise.all(slavePromises);

            // === Phase 3: Synthesis ===
            callbacks.onPhaseStart(3);

            const responsesText = slaveResults.map(r =>
                `[${r.slave.modelId} Response]\n${r.response}\n`
            ).join('\n\n');

            const phase3Prompt = prompts.phase3
                .replace('{{goal}}', goal)
                .replace('{{responses}}', responsesText);

            await this.sendMessageToModel(
                mainBrain,
                phase3Prompt,
                callbacks
            );

        } catch (error) {
            console.error('[BrainFlow] Error:', error);
            callbacks.onError(error);
        }
    }

    public skipCurrentPhase() {
        console.log('[BrainFlow] Skipping current phase...');
        this.pendingRequests.forEach((request, requestId) => {
            console.log(`[BrainFlow] Forcing completion for request ${requestId}`);
            const text = request.getCurrentText();
            request.resolve(text);
            request.cleanup();
        });
        this.pendingRequests.clear();
    }

    private async sendMessageToModel(
        model: ActiveModel,
        text: string,
        callbacks: BrainFlowCallbacks
    ): Promise<string> {
        // Branch: Perplexity uses API service, others use iframe
        if (model.modelId === 'perplexity') {
            return this.sendToPerplexity(text, callbacks);
        } else {
            return this.sendToIframe(model, text, callbacks);
        }
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

        callbacks.onModelStart(model.modelId);

        return new Promise((resolve) => {
            let responseText = '';

            // Listener for this specific request
            const listener = (event: MessageEvent) => {
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
                    callbacks.onModelUpdate(model.modelId, responseText);
                }

                // Handle completion
                if (data.type === 'MODEL_DOCK_RESPONSE_COMPLETE' && data.payload?.requestId === requestId) {
                    console.log(`[BrainFlow] Completion signal received from ${model.modelId}`);
                    responseText = data.payload.text;
                    callbacks.onModelComplete(model.modelId, responseText);
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
                    callbacks.onModelComplete(model.modelId, text);
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
