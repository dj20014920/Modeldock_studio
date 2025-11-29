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
        mainBrainId: string | null
    ): Promise<string> {
        // 1. Validate content
        if (activeModels.length === 0) return id || this.generateId(); // Don't save empty sessions

        // Check if there are any messages
        const hasMessages = activeModels.some(m => m.messages && m.messages.length > 0);
        if (!hasMessages) return id || this.generateId(); // Don't save empty chats

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
        let title = 'New Conversation';
        const firstModelWithMsg = activeModels.find(m => m.messages && m.messages.length > 0);
        if (firstModelWithMsg && firstModelWithMsg.messages && firstModelWithMsg.messages.length > 0) {
            const firstMsg = firstModelWithMsg.messages.find(m => m.role === 'user');
            if (firstMsg) {
                title = firstMsg.content.slice(0, 30) + (firstMsg.content.length > 30 ? '...' : '');
            }
        }

        // Generate Preview (last message)
        let preview = 'No messages';
        if (firstModelWithMsg && firstModelWithMsg.messages && firstModelWithMsg.messages.length > 0) {
            const lastMsg = firstModelWithMsg.messages[firstModelWithMsg.messages.length - 1];
            preview = lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : '');
        }

        // 3. Update Metadata
        const metadata: ConversationMetadata = {
            id: conversationId,
            title: isNew ? title : (historyList.find(h => h.id === conversationId)?.title || title),
            createdAt: isNew ? now : (historyList.find(h => h.id === conversationId)?.createdAt || now),
            updatedAt: now,
            preview,
            modelCount: activeModels.length
        };

        const updatedList = [
            metadata,
            ...historyList.filter(h => h.id !== conversationId)
        ];

        // 4. Save Content
        const content: ConversationContent = {
            id: conversationId,
            activeModels,
            mainBrainId
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
}
