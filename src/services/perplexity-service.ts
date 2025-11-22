import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

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

    // Multi-turn conversation state
    private conversationState: {
        frontendContextUuid?: string;
        lastBackendUuid?: string;
        readWriteToken?: string;
    } = {};

    private listeners: Set<Listener> = new Set();
    private proxyTabId: number | null = null;
    private capturedEndpoint: string | null = null;
    private sseBuffer: string = ''; // Buffer for SSE chunks
    private loginCheckInProgress: boolean = false;

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

    public resetConversation() {
        this.state.messages = [];
        this.conversationState = {};
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

    /**
     * Prompts user to login to Perplexity (only opens tab once)
     */
    public async promptLogin(): Promise<void> {
        if (this.loginCheckInProgress) return;
        this.loginCheckInProgress = true;

        try {
            await this.ensureProxyTab(true); // Force open with active=true
            // Notify listeners about login prompt
            this.state.error = 'LOGIN_PROMPT_OPENED';
            this.notify();
        } finally {
            this.loginCheckInProgress = false;
        }
    }

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

            // 3. Process Files (Client-Side Extraction)
            let finalQuery = text;

            if (files.length > 0) {
                finalQuery += '\n\n';
                for (const file of files) {
                    try {
                        const extractedText = await this.extractTextFromFile(file);
                        finalQuery += `[Attachment: ${file.name}]\n\`\`\`${this.getFileExtension(file.name)}\n${extractedText}\n\`\`\`\n\n`;
                    } catch (e) {
                        console.error(`Failed to extract text from ${file.name}:`, e);
                        finalQuery += `[Attachment: ${file.name}]\n(Error extracting content: ${e instanceof Error ? e.message : 'Unknown error'})\n\n`;
                    }
                }
                finalQuery += 'Please refer to the attached file(s) above for context.';
            }

            // 4. Prepare Payload (Matching HAR analysis)
            const isDeep = this.state.deepResearchEnabled;
            const isFollowUp = !!this.conversationState.lastBackendUuid;

            const params: any = {
                search_focus: 'internet',
                sources: ['web'],
                search_recency_filter: null,
                mode: isDeep ? 'research' : 'concise', // 'concise' matches HAR for turbo/standard
                model_preference: 'turbo', // Default to turbo as seen in HAR
                prompt_source: 'user',
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
                attachments: [], // We embed in text as we don't have the upload ID
                language: "en-US", // Or detect from browser/user settings
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                frontend_uuid: this.generateUUID(),
            };

            if (isFollowUp) {
                // Multi-turn: Follow-up Query
                params.query_source = 'followup';
                params.followup_source = 'link';
                params.last_backend_uuid = this.conversationState.lastBackendUuid;
                params.read_write_token = this.conversationState.readWriteToken;
                // IMPORTANT: Do NOT send frontend_context_uuid in follow-up requests
            } else {
                // Multi-turn: Initial Query
                params.query_source = 'home';
                // Generate and store new context UUID for this session
                this.conversationState.frontendContextUuid = this.generateUUID();
                params.frontend_context_uuid = this.conversationState.frontendContextUuid;
            }

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

    private getFileExtension(filename: string): string {
        return filename.split('.').pop() || 'txt';
    }

    private async extractTextFromFile(file: PerplexityFile): Promise<string> {
        const buffer = this.base64ToArrayBuffer(file.data);
        const type = file.type.toLowerCase();

        // 1. PDF
        if (type === 'application/pdf' || file.name.endsWith('.pdf')) {
            try {
                const loadingTask = pdfjsLib.getDocument({ data: buffer });
                const pdf = await loadingTask.promise;
                let fullText = '';

                // Limit pages to avoid massive context
                const maxPages = Math.min(pdf.numPages, 10);

                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items
                        .map((item: any) => item.str)
                        .join(' ');
                    fullText += `[Page ${i}]\n${pageText}\n\n`;
                }

                if (pdf.numPages > 10) {
                    fullText += `\n... (Truncated: ${pdf.numPages - 10} more pages)`;
                }

                return fullText;
            } catch (e) {
                throw new Error('PDF parsing failed');
            }
        }

        // 2. DOCX
        if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
            try {
                const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                return result.value;
            } catch (e) {
                throw new Error('DOCX parsing failed');
            }
        }

        // 3. Text/Code/JSON
        if (type.startsWith('text/') || type.includes('json') || type.includes('javascript') || type.includes('xml') || file.name.endsWith('.ts') || file.name.endsWith('.md')) {
            return this.base64ToText(file.data);
        }

        // 4. Images (Unsupported via Text Embedding)
        if (type.startsWith('image/')) {
            return `[Image Attachment: ${file.name}]\n(Note: Image content analysis is not supported in this mode. Please describe the image or use the official app.)`;
        }

        // Fallback for unknown types
        return `[Attachment: ${file.name}]\n(Binary file content omitted)`;
    }

    private base64ToText(dataUrl: string): string {
        try {
            const base64 = dataUrl.split(',')[1] || dataUrl;
            return atob(base64);
        } catch (e) {
            console.error('Failed to decode base64 file', e);
            return '[Error decoding file content]';
        }
    }

    private base64ToArrayBuffer(dataUrl: string): ArrayBuffer {
        const base64 = dataUrl.split(',')[1] || dataUrl;
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
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

                    // Capture Multi-turn Context from the FIRST valid response packet
                    if (data.backend_uuid && !this.conversationState.lastBackendUuid) {
                        this.conversationState.lastBackendUuid = data.backend_uuid;
                    }
                    if (data.read_write_token && !this.conversationState.readWriteToken) {
                        this.conversationState.readWriteToken = data.read_write_token;
                    }
                    // Note: We don't need to capture context_uuid as it's not sent back in follow-ups

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

    /**
     * Checks if user is logged in to Perplexity by inspecting cookies
     */
    private async isLoggedIn(): Promise<boolean> {
        try {
            const cookies = await chrome.cookies.getAll({ domain: '.perplexity.ai' });
            // Check for common auth cookies (adjust based on actual Perplexity cookies)
            const hasAuthCookie = cookies.some(c =>
                c.name.includes('session') ||
                c.name.includes('auth') ||
                c.name.includes('token') ||
                c.name === '__Secure-next-auth.session-token'
            );
            return hasAuthCookie && cookies.length > 0;
        } catch (e) {
            console.warn('[Perplexity] Failed to check login state:', e);
            return false;
        }
    }

    /**
     * Smart tab management: Reuse existing tabs, only create when necessary
     * Only opens pinned tab when login is required
     */
    private async ensureProxyTab(forceLoginPrompt = false) {
        // 1. Check existing cached ID
        if (this.proxyTabId) {
            try {
                const tab = await chrome.tabs.get(this.proxyTabId);
                if (tab && await this.pingTab(this.proxyTabId)) {
                    console.log('[Perplexity] Reusing existing proxy tab:', this.proxyTabId);
                    return;
                }
            } catch (e) {
                this.proxyTabId = null;
            }
        }

        // 2. Find ANY existing Perplexity tab (not just pinned)
        const tabs = await chrome.tabs.query({ url: 'https://www.perplexity.ai/*' });

        // Sort: prioritize pinned tabs, then responsive tabs
        const sortedTabs = tabs.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return 0;
        });

        for (const tab of sortedTabs) {
            if (tab.id && await this.pingTab(tab.id)) {
                this.proxyTabId = tab.id;
                console.log('[Perplexity] Found existing responsive tab:', this.proxyTabId);

                // Pin it if not already pinned (to ensure consistency)
                if (!tab.pinned) {
                    await chrome.tabs.update(tab.id, { pinned: true });
                }
                return;
            }
        }

        // 3. No responsive tab found - check login state before creating new one
        const loggedIn = await this.isLoggedIn();

        if (!loggedIn && !forceLoginPrompt) {
            // User not logged in - throw error with login guidance
            throw new Error('PERPLEXITY_LOGIN_REQUIRED');
        }

        // 4. Create new pinned tab (only if logged in OR user explicitly wants to login)
        console.log('[Perplexity] Creating new pinned tab...');
        const tab = await chrome.tabs.create({
            url: 'https://www.perplexity.ai',
            pinned: true,
            active: forceLoginPrompt // Make active if user needs to login
        });

        if (tab.id) {
            this.proxyTabId = tab.id;

            // Wait for load and ping loop
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 1000));
                if (await this.pingTab(tab.id)) {
                    console.log('[Perplexity] New tab is now responsive');
                    return;
                }
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
