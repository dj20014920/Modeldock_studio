export interface PerplexityFile {
    name: string;
    type: string;
    data: string; // Base64
    id?: string; // ID returned from server
}

export interface PerplexityMessage {
    role: 'user' | 'assistant';
    content: string;
    citations?: string[];
    attachments?: PerplexityFile[];
}

export interface PerplexityState {
    messages: PerplexityMessage[];
    isStreaming: boolean;
    error: string | null;
    deepResearchEnabled: boolean;
}

type Listener = (state: PerplexityState) => void;

const SUPPORTED_BLOCK_USE_CASES = [
    'answer_modes', 'media_items', 'knowledge_cards', 'inline_entity_cards',
    'place_widgets', 'finance_widgets', 'sports_widgets', 'flight_status_widgets',
    'shopping_widgets', 'jobs_widgets', 'search_result_widgets', 'clarification_responses',
    'inline_images', 'inline_assets', 'placeholder_cards', 'diff_blocks',
    'inline_knowledge_cards', 'entity_group_v2', 'refinement_filters',
    'canvas_mode', 'maps_preview', 'answer_tabs', 'price_comparison_widgets'
];

class PerplexityService {
    private state: PerplexityState = {
        messages: [],
        isStreaming: false,
        error: null,
        deepResearchEnabled: false
    };

    private listeners: Set<Listener> = new Set();
    private proxyTabId: number | null = null;
    private capturedEndpoint: string | null = null;
    private sseBuffer: string = ''; // Buffer for SSE chunks

    constructor() {
        this.initMessageListener();
    }

    private initMessageListener() {
        if (typeof chrome === 'undefined') return;

        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'PERPLEXITY_PROXY_CHUNK') {
                this.handleChunk(message.payload.chunk);
            } else if (message.type === 'PERPLEXITY_PROXY_DONE') {
                this.handleDone();
            } else if (message.type === 'PERPLEXITY_PROXY_ERROR') {
                this.handleError(message.payload.error);
            } else if (message.type === 'PERPLEXITY_DEBUG_URL') {
                console.log('[PerplexityService] Captured API Endpoint:', message.payload.url);
                if (message.payload.url.includes('ask') || message.payload.url.includes('research')) {
                    this.capturedEndpoint = message.payload.url;
                }
            }
        });
    }

    public subscribe(listener: Listener) {
        this.listeners.add(listener);
        listener(this.state);
        return () => this.listeners.delete(listener);
    }

    private notify() {
        this.listeners.forEach(l => l({ ...this.state }));
    }

    public toggleDeepResearch() {
        this.state.deepResearchEnabled = !this.state.deepResearchEnabled;
        this.notify();
    }

    // --- Quota Management ---
    private readonly STORAGE_KEY_TIER = 'pplx_user_tier';
    private readonly STORAGE_KEY_QUOTA = 'pplx_quota_v2'; // v2 for new structure

    public get tier(): 'free' | 'pro' {
        return (localStorage.getItem(this.STORAGE_KEY_TIER) as 'free' | 'pro') || 'free';
    }

    public setTier(tier: 'free' | 'pro') {
        localStorage.setItem(this.STORAGE_KEY_TIER, tier);
        this.resetQuota(tier);
        this.notify();
    }

    public get quota() {
        const stored = localStorage.getItem(this.STORAGE_KEY_QUOTA);
        if (!stored) return this.resetQuota(this.tier);

        const data = JSON.parse(stored);
        const now = Date.now();

        // Check reset conditions
        if (this.tier === 'free') {
            // Free: Reset every 4 hours
            if (now - data.lastReset > 4 * 60 * 60 * 1000) {
                return this.resetQuota('free');
            }
        } else {
            // Pro: Reset every 24 hours (or at midnight, but 24h rolling is safer for simple logic)
            if (now - data.lastReset > 24 * 60 * 60 * 1000) {
                return this.resetQuota('pro');
            }
        }

        return data;
    }

    private resetQuota(tier: 'free' | 'pro') {
        const limits = {
            free: 5,
            pro: 600 // 2025 Standard: 300-600+ depending on specific plan, defaulting to 600 for "Pro"
        };

        const data = {
            remaining: limits[tier],
            total: limits[tier],
            lastReset: Date.now()
        };

        localStorage.setItem(this.STORAGE_KEY_QUOTA, JSON.stringify(data));
        return data;
    }

    public decrementQuota() {
        const current = this.quota;
        if (current.remaining > 0) {
            current.remaining--;
            localStorage.setItem(this.STORAGE_KEY_QUOTA, JSON.stringify(current));
            this.notify();
        }
    }
    // ------------------------

    public async sendMessage(text: string, files: PerplexityFile[] = []) {
        // 1. Add User Message
        this.state.messages.push({
            role: 'user',
            content: text,
            attachments: files
        });
        this.state.messages.push({ role: 'assistant', content: '' });
        this.state.isStreaming = true;
        this.state.error = null;
        this.sseBuffer = ''; // Reset buffer
        this.notify();

        try {
            // 2. Ensure Proxy Tab with PING check
            await this.ensureProxyTab();

            // Quota Check for Deep Research
            if (this.state.deepResearchEnabled) {
                const q = this.quota;
                if (q.remaining <= 0) {
                    throw new Error(`Deep Research quota exceeded for ${this.tier === 'free' ? 'Free' : 'Pro'} tier.`);
                }
                this.decrementQuota();
            }

            // 3. Process Files
            let finalQuery = text;
            const uploadedFileIds = [];

            if (files.length > 0) {
                for (const file of files) {
                    if (this.isTextFile(file.type) || file.name.match(/\.(txt|md|csv|json|js|ts|py|html|css)$/i)) {
                        const content = this.base64ToText(file.data);
                        finalQuery += `\n\n--- Attached File: ${file.name} ---\n${content}\n--- End File ---`;
                    } else {
                        const uploaded = await this.uploadFile(file);
                        if (uploaded && uploaded.id) {
                            uploadedFileIds.push(uploaded.id);
                        }
                    }
                }
            }

            // 4. Prepare Payload (Matching api.ts structure)
            const isDeep = this.state.deepResearchEnabled;

            const params: any = {
                search_focus: 'internet',
                sources: ['web'],
                search_recency_filter: null,
                mode: isDeep ? 'research' : 'copilot', // api.ts line 40
                model_preference: 'pplx_alpha', // api.ts line 41
                prompt_source: 'user',
                query_source: 'home',
                is_related_query: false,
                is_sponsored: false,
                is_incognito: false,
                local_search_enabled: false,
                skip_search_enabled: true,
                is_nav_suggestions_disabled: false,
                always_search_override: false,
                override_no_search: false,
                should_ask_for_mcp_tool_confirmation: true,
                browser_agent_allow_once_from_toggle: false,
                supported_block_use_cases: SUPPORTED_BLOCK_USE_CASES,
                use_schematized_api: true,
                send_back_text_in_streaming_api: false,
                version: '2.18',
                attachments: uploadedFileIds.length > 0 ? uploadedFileIds : [],
                language: "en-US",
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                frontend_uuid: this.generateUUID(),
                frontend_context_uuid: this.generateUUID(),
            };

            if (isDeep) {
                Object.assign(params, {
                    search_depth: 'deep',
                    deep_search: true,
                    enable_multi_step_reasoning: true,
                    max_iterations: 3,
                    followup_questions: 3,
                });
            }

            const payload = {
                query_str: finalQuery,
                params: params
            };

            // 5. Determine Endpoint
            let endpoint = isDeep
                ? 'https://www.perplexity.ai/rest/sse/perplexity_research'
                : 'https://www.perplexity.ai/rest/sse/perplexity_ask';

            if (this.capturedEndpoint) {
                // If we captured an endpoint, prefer it, but respect deep/ask switch if possible
                // For now, just use captured if available as it's likely the correct one for the current session
                endpoint = this.capturedEndpoint;
            }

            // 6. Send to Proxy
            if (this.proxyTabId) {
                chrome.tabs.sendMessage(this.proxyTabId, {
                    type: 'PERPLEXITY_PROXY_REQUEST',
                    payload: {
                        url: endpoint,
                        options: {
                            method: 'POST',
                            body: JSON.stringify(payload)
                        },
                        messageId: Date.now().toString()
                    }
                });
            }

        } catch (e: any) {
            this.handleError(e.message);
        }
    }

    private isTextFile(mimeType: string): boolean {
        return mimeType.startsWith('text/') ||
            mimeType.includes('json') ||
            mimeType.includes('javascript') ||
            mimeType.includes('xml');
    }

    private base64ToText(dataUrl: string): string {
        try {
            const base64 = dataUrl.split(',')[1];
            return atob(base64);
        } catch (e) {
            console.error('Failed to decode base64 file', e);
            return '[Error decoding file content]';
        }
    }

    private async uploadFile(file: PerplexityFile): Promise<PerplexityFile> {
        return { ...file, id: 'mock-file-id-' + Date.now() };
    }

    private handleChunk(chunk: string) {
        this.sseBuffer += chunk;
        const lines = this.sseBuffer.split('\n');
        this.sseBuffer = lines.pop() || ''; // Keep incomplete line

        const lastMsg = this.state.messages[this.state.messages.length - 1];
        if (!lastMsg || lastMsg.role !== 'assistant') return;

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;

                try {
                    const data = JSON.parse(jsonStr);

                    // Handle different data structures based on api.ts logic
                    let newText = '';

                    // 1. Check for blocks (markdown_block, text_block, message)
                    if (data.blocks && Array.isArray(data.blocks)) {
                        for (const block of data.blocks) {
                            if (block.markdown_block && block.markdown_block.answer) {
                                newText = block.markdown_block.answer;
                            } else if (block.text_block && block.text_block.text) {
                                newText = block.text_block.text;
                            } else if (block.message && typeof block.message === 'string') {
                                newText = block.message;
                            }
                        }
                    }

                    // 2. Check for direct text/answer fields
                    if (!newText) {
                        if (data.text && typeof data.text === 'string') {
                            // Check if it's a JSON string
                            let isJsonString = false;
                            try {
                                const parsed = JSON.parse(data.text);
                                if (Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null)) {
                                    isJsonString = true;
                                }
                            } catch { }

                            if (!isJsonString) newText = data.text;
                        } else if (data.answer && typeof data.answer === 'string') {
                            newText = data.answer;
                        }
                    }

                    // Update message content if we found text
                    if (newText) {
                        // Clean up citations format [1](pplx://...) -> [1]
                        newText = newText.replace(/\[([^\]]+)\]\(pplx:\/\/[^)]+\)/g, '$1');
                        lastMsg.content = newText;
                        this.notify();
                    }

                    // Check for completion
                    if (data.final_sse_message === true || data.status === 'COMPLETED') {
                        this.handleDone();
                    }

                } catch (e) {
                    console.debug('Failed to parse SSE data:', line, e);
                }
            }
        }
    }

    private handleDone() {
        this.state.isStreaming = false;
        this.notify();
    }

    private handleError(error: string) {
        this.state.error = error;
        this.state.isStreaming = false;
        this.notify();
    }

    private async ensureProxyTab() {
        // 1. Check existing ID
        if (this.proxyTabId) {
            try {
                await chrome.tabs.get(this.proxyTabId);
                if (await this.pingTab(this.proxyTabId)) return;
            } catch (e) {
                this.proxyTabId = null;
            }
        }

        // 2. Find existing tab by URL
        const tabs = await chrome.tabs.query({ url: 'https://www.perplexity.ai/*' });
        for (const tab of tabs) {
            if (tab.id && await this.pingTab(tab.id)) {
                this.proxyTabId = tab.id;
                return;
            }
        }

        // 3. Create new tab
        const tab = await chrome.tabs.create({
            url: 'https://www.perplexity.ai',
            pinned: true,
            active: false
        });

        if (tab.id) {
            this.proxyTabId = tab.id;
            // Wait for load and ping loop
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 1000)); // Wait 1s
                if (await this.pingTab(tab.id)) return;
            }
            throw new Error('Proxy tab created but not responsive');
        } else {
            throw new Error('Failed to create proxy tab');
        }
    }

    private async pingTab(tabId: number): Promise<boolean> {
        try {
            const response = await chrome.tabs.sendMessage(tabId, { type: 'PERPLEXITY_PING' });
            return response && response.status === 'pong';
        } catch (e) {
            return false;
        }
    }

    private generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export const perplexityService = new PerplexityService();
