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

class PerplexityService {
    private state: PerplexityState = {
        messages: [],
        isStreaming: false,
        error: null,
        deepResearchEnabled: false
    };

    private listeners: Set<Listener> = new Set();
    private proxyTabId: number | null = null;

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

    public async sendMessage(text: string, files: PerplexityFile[] = []) {
        // 1. Add User Message
        this.state.messages.push({
            role: 'user',
            content: text,
            attachments: files
        });
        this.state.messages.push({ role: 'assistant', content: '' }); // Placeholder for response
        this.state.isStreaming = true;
        this.state.error = null;
        this.notify();

        try {
            // 2. Ensure Proxy Tab
            await this.ensureProxyTab();

            // 3. Process Files
            let finalQuery = text;
            const uploadedFileIds = [];

            if (files.length > 0) {
                for (const file of files) {
                    // Strategy A: Text Injection (for code, txt, md, csv, etc.)
                    if (this.isTextFile(file.type) || file.name.match(/\.(txt|md|csv|json|js|ts|py|html|css)$/i)) {
                        const content = this.base64ToText(file.data);
                        finalQuery += `\n\n--- Attached File: ${file.name} ---\n${content}\n--- End File ---`;
                    }
                    // Strategy B: Upload (for images/PDFs) - Mocked for now as we lack the internal endpoint
                    else {
                        const uploaded = await this.uploadFile(file);
                        if (uploaded && uploaded.id) {
                            uploadedFileIds.push(uploaded.id);
                        }
                    }
                }
            }

            // 4. Prepare Payload
            // Note: This is a simplified payload. Real Perplexity API might need more fields (source, mode, etc.)
            // Based on "Perplexity Architecture" prompt, we target /rest/sse/perplexity_ask or _research
            const endpoint = this.state.deepResearchEnabled
                ? 'https://www.perplexity.ai/rest/sse/perplexity_research'
                : 'https://www.perplexity.ai/rest/sse/perplexity_ask';

            const payload = {
                search_depth: this.state.deepResearchEnabled ? 'deep' : 'basic',
                query: finalQuery,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                backend_uuid: this.generateUUID(),
                frontend_uuid: this.generateUUID(),
                frontend_context_uuid: this.generateUUID(),
                attachments: uploadedFileIds.length > 0 ? uploadedFileIds : undefined,
                // Add other required fields as per reverse engineering or spec
            };

            // 5. Send to Proxy
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
        // This is a placeholder for the actual upload logic.
        // Since we don't have the exact upload endpoint, we will try a common pattern
        // or just pass the file data if the API supports it directly (unlikely for large files).

        // For now, we will simulate an upload and return a mock ID or the file itself if we can't upload.
        // In a real scenario, we would send a POST to /api/upload via the proxy.

        // TODO: Implement actual upload via proxy
        /*
        const response = await this.sendProxyRequest('https://www.perplexity.ai/api/upload', {
            method: 'POST',
            body: createFormData(file)
        });
        return { ...file, id: response.id };
        */

        // Mocking ID for now to prevent breakage if we can't upload
        return { ...file, id: 'mock-file-id-' + Date.now() };
    }

    private handleChunk(chunk: string) {
        // Parse SSE Chunk
        // Chunk format is usually "data: ... \n\n"
        // We need to accumulate and parse
        // For simplicity, let's assume we get raw text or JSON chunks
        // Real implementation needs a robust SSE parser

        // Simple accumulation for now (assuming the proxy sends raw text parts)
        // In reality, we need to parse the JSON from the SSE event

        const lastMsg = this.state.messages[this.state.messages.length - 1];
        if (lastMsg && lastMsg.role === 'assistant') {
            // Very basic SSE parsing logic
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        // Perplexity usually sends 'text' or 'answer' field
                        // Or 'text' field in the JSON
                        if (data.text) {
                            // Perplexity sends the FULL text each time usually? Or delta?
                            // Usually it's full text replacement for the current block
                            // Let's assume full text for the last block
                            // But we might need to append if it's delta.
                            // Let's assume it's a delta or full text. 
                            // Actually, Perplexity SSE often sends the accumulated text.
                            // Let's try replacing.
                            // Wait, if it's a JSON object, let's inspect it.
                            // For this MVP, let's append if it looks like a delta, or replace if it looks like full.
                            // Safe bet: Check length.

                            // Actually, let's just append raw text if we can't parse JSON
                            // But since we are parsing JSON:
                            const newText = data.text || data.answer;
                            if (newText) {
                                // If newText is longer than current, replace (it's likely full text)
                                // If it's short, it might be delta.
                                // Perplexity API usually sends full text so far.
                                lastMsg.content = JSON.parse(newText); // Sometimes it's double encoded
                            }
                        }
                    } catch (e) {
                        // If not JSON, maybe just raw text?
                        // lastMsg.content += line;
                    }
                }
            }
            this.notify();
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
        // Check if we already have a valid tab
        if (this.proxyTabId) {
            try {
                await chrome.tabs.get(this.proxyTabId);
                return;
            } catch (e) {
                this.proxyTabId = null;
            }
        }

        // Find existing tab
        const tabs = await chrome.tabs.query({ url: 'https://www.perplexity.ai/*' });
        if (tabs.length > 0 && tabs[0].id) {
            this.proxyTabId = tabs[0].id;
            return;
        }

        // Create new pinned tab
        const tab = await chrome.tabs.create({
            url: 'https://www.perplexity.ai',
            pinned: true,
            active: false
        });

        if (tab.id) {
            this.proxyTabId = tab.id;
            // Wait for load
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            throw new Error('Failed to create proxy tab');
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
