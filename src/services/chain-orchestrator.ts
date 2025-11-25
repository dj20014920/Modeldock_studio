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
            const slavePrompts = this.parseSlavePrompts(planResponse);

            const slavePromises = slaves.map(async (slave) => {
                const prompt = slavePrompts.get(slave.instanceId) || slavePrompts.get(slave.modelId);
                if (!prompt) {
                    console.warn(`[BrainFlow] No prompt found for slave ${slave.modelId}`);
                    return { slave, response: '(No instruction provided by Main Brain)' };
                }

                try {
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

    private async sendMessageToModel(
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

        return new Promise((resolve, reject) => {
            let responseText = '';

            // Listener for this specific request
            const listener = (event: MessageEvent) => {
                const data = event.data;
                if (!data) return;

                // Handle chunks
                if (data.type === 'MODEL_DOCK_RESPONSE_CHUNK' && data.payload?.requestId === requestId) {
                    responseText = data.payload.text;
                    callbacks.onModelUpdate(model.modelId, responseText);
                }

                // Handle completion
                if (data.type === 'MODEL_DOCK_RESPONSE_COMPLETE' && data.payload?.requestId === requestId) {
                    responseText = data.payload.text;
                    callbacks.onModelComplete(model.modelId, responseText);
                    cleanup();
                    resolve(responseText);
                }
            };

            const cleanup = () => {
                window.removeEventListener('message', listener);
                this.activeListeners.delete(requestId);
            };

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

            // Timeout safety (120s)
            setTimeout(() => {
                if (this.activeListeners.has(requestId)) {
                    console.warn(`[BrainFlow] Timeout for ${model.modelId}`);
                    cleanup();
                    reject(new Error(`Timeout waiting for response from ${model.modelId}`));
                }
            }, 120000);
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

    private parseSlavePrompts(planText: string): Map<string, string> {
        const prompts = new Map<string, string>();

        // Regex to find [SLAVE:id] ... [/SLAVE]
        // Supports [SLAVE:modelId] and [SLAVE:modelId-instanceId]
        const regex = /\[SLAVE:([a-zA-Z0-9-]+)\]([\s\S]*?)\[\/SLAVE\]/g;
        let match;

        while ((match = regex.exec(planText)) !== null) {
            const id = match[1].trim();
            const content = match[2].trim();
            prompts.set(id, content);
        }

        return prompts;
    }
}
