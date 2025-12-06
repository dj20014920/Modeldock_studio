import { ConversationMetadata, ConversationContent, ActiveModel } from '../types';

const METADATA_KEY = 'md_history_metadata';
const CONTENT_PREFIX = 'md_history_content_';

export class HistoryService {
    private static instance: HistoryService;

    private constructor() { }

    public static getInstance(): HistoryService {
        if (!HistoryService.instance) {
            HistoryService.instance = new HistoryService();
        }
        return HistoryService.instance;
    }

    /**
     * Generate a UUID
     */
    private generateId(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Get all conversation metadata (for the sidebar list)
     */
    public async getHistoryList(): Promise<ConversationMetadata[]> {
        const result = await chrome.storage.local.get(METADATA_KEY);
        return (result[METADATA_KEY] as ConversationMetadata[]) || [];
    }

    /**
     * Load a specific conversation's content
     */
    public async loadConversation(id: string): Promise<ConversationContent | null> {
        const key = `${CONTENT_PREFIX}${id}`;
        const result = await chrome.storage.local.get(key);
        return (result[key] as ConversationContent) || null;
    }

    /**
     * Save or Update a conversation
     */
    public async saveConversation(
        id: string | null,
        activeModels: ActiveModel[],
        mainBrainId: string | null,
        options?: {
            mode?: 'auto-routing' | 'brainflow' | 'byok' | 'manual';
            titleOverride?: string;
            previewOverride?: string;
            force?: boolean;
            prompt?: string;
        }
    ): Promise<string> {
        // 1. Validate content
        if (activeModels.length === 0) return id || this.generateId(); // Don't save empty sessions

        // Check if there are any messages
        const hasMessages = activeModels.some(m => m.messages && m.messages.length > 0);

        if (!options?.force && !hasMessages) {
            // Don't save empty chats unless forced
            return id || this.generateId();
        }

        const historyList = await this.getHistoryList();
        const now = Date.now();
        let conversationId = id;
        let isNew = false;

        // 2. Determine ID and Title
        if (!conversationId) {
            conversationId = this.generateId();
            isNew = true;
        }

        // Generate Title from the first user message of the first model
        let title = options?.titleOverride || 'New Conversation';
        const firstModelWithMsg = activeModels.find(m => m.messages && m.messages.length > 0);
        if (!options?.titleOverride && firstModelWithMsg && firstModelWithMsg.messages && firstModelWithMsg.messages.length > 0) {
            const firstMsg = firstModelWithMsg.messages.find(m => m.role === 'user');
            if (firstMsg) {
                // ✨ 이미지 포함 content 처리 (extractTextFromContent 사용)
                const text = this.extractTextFromContent(firstMsg.content);
                title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
            }
        }

        // Generate Preview (last message)
        let preview = options?.previewOverride || 'No messages';
        if (!options?.previewOverride && firstModelWithMsg && firstModelWithMsg.messages && firstModelWithMsg.messages.length > 0) {
            const lastMsg = firstModelWithMsg.messages[firstModelWithMsg.messages.length - 1];
            // ✨ 이미지 포함 content 처리 (extractTextFromContent 사용)
            const text = this.extractTextFromContent(lastMsg.content);
            preview = text.slice(0, 50) + (text.length > 50 ? '...' : '');
        }

        const mode = options?.mode || this.deriveMode(activeModels);
        const lastPrompt = options?.prompt || this.pickLastPrompt(activeModels);

        // 3. Update Metadata
        const metadata: ConversationMetadata = {
            id: conversationId,
            title: isNew ? title : (historyList.find(h => h.id === conversationId)?.title || title),
            createdAt: isNew ? now : (historyList.find(h => h.id === conversationId)?.createdAt || now),
            updatedAt: now,
            preview,
            modelCount: activeModels.length,
            mode,
            lastPrompt
        };

        const updatedList = [
            metadata,
            ...historyList.filter(h => h.id !== conversationId)
        ];

        // 4. Save Content
        const content: ConversationContent = {
            id: conversationId,
            activeModels,
            mainBrainId,
            mode,
            lastPrompt
        };

        await chrome.storage.local.set({
            [METADATA_KEY]: updatedList,
            [`${CONTENT_PREFIX}${conversationId}`]: content
        });

        return conversationId;
    }

    /**
     * Delete a conversation
     */
    public async deleteConversation(id: string): Promise<void> {
        const historyList = await this.getHistoryList();
        const updatedList = historyList.filter(h => h.id !== id);

        await chrome.storage.local.set({ [METADATA_KEY]: updatedList });
        await chrome.storage.local.remove(`${CONTENT_PREFIX}${id}`);
    }

    /**
     * Rename a conversation
     */
    public async renameConversation(id: string, newTitle: string): Promise<void> {
        const historyList = await this.getHistoryList();
        const updatedList = historyList.map(h =>
            h.id === id ? { ...h, title: newTitle } : h
        );
        await chrome.storage.local.set({ [METADATA_KEY]: updatedList });
    }

    /**
     * Clear all history
     */
    public async clearHistory(): Promise<void> {
        const historyList = await this.getHistoryList();
        const keysToRemove = historyList.map(h => `${CONTENT_PREFIX}${h.id}`);
        keysToRemove.push(METADATA_KEY);

        await chrome.storage.local.remove(keysToRemove);
    }

    private deriveMode(activeModels: ActiveModel[]): ConversationMetadata['mode'] {
        const modes = activeModels.map(m => m.historyMode).filter(Boolean) as ConversationMetadata['mode'][];
        if (modes.includes('brainflow')) return 'brainflow';
        if (modes.includes('auto-routing')) return 'auto-routing';
        if (modes.includes('byok')) return 'byok';
        if (modes.includes('manual')) return 'manual';
        return undefined;
    }

    /**
     * ✨ MessageContent에서 텍스트만 추출하는 헬퍼 함수
     * 이미지 포함 메시지를 히스토리 메타데이터(title, preview)에 표시하기 위해 사용
     *
     * @param content - MessageContent (string | MessageContentPart[])
     * @returns 추출된 텍스트 (이미지는 "[이미지]"로 표시)
     */
    private extractTextFromContent(content: any): string {
        // 단순 문자열 (하위 호환)
        if (typeof content === 'string') {
            return content;
        }

        // MessageContentPart[] (이미지 포함)
        if (Array.isArray(content)) {
            const parts: string[] = [];

            for (const part of content) {
                if (part.type === 'text') {
                    parts.push(part.text);
                } else if (part.type === 'image_url') {
                    // 이미지는 "[이미지]" 텍스트로 표시
                    parts.push('[이미지]');
                }
            }

            return parts.join(' ');
        }

        // Fallback (예상치 못한 타입)
        return String(content);
    }

    private pickLastPrompt(activeModels: ActiveModel[]): string | undefined {
        for (const model of activeModels) {
            if (model.lastPrompt) return model.lastPrompt;
            const userMessages = (model.messages || []).filter(m => m.role === 'user');
            if (userMessages.length > 0) {
                const last = userMessages[userMessages.length - 1];
                const text = this.extractTextFromContent(last.content);
                return text.slice(0, 200);
            }
        }
        return undefined;
    }
}
