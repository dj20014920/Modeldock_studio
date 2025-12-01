import { ChatMessage, BYOKProviderId, MessageContent } from '../types';

const BYOK_HISTORY_KEY = 'md_byok_history';

export interface BYOKConversation {
    id: string;
    providerId: BYOKProviderId;
    modelVariant: string;
    title: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    preview: string;
}

// chrome.storage.local 사용 가능 여부 체크
function isChromeStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' && 
           chrome.storage !== undefined && 
           chrome.storage.local !== undefined;
}

// localStorage fallback을 위한 유틸리티
function getLocalStorageData(): BYOKConversation[] {
    try {
        const data = localStorage.getItem(BYOK_HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function setLocalStorageData(data: BYOKConversation[]): void {
    try {
        localStorage.setItem(BYOK_HISTORY_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('[BYOKHistoryService] Failed to save to localStorage:', e);
    }
}

// MessageContent에서 텍스트 추출 헬퍼
function extractTextFromContent(content: MessageContent, maxLength?: number): string {
    let text = '';
    if (typeof content === 'string') {
        text = content;
    } else if (Array.isArray(content)) {
        // MessageContentPart[] 에서 text만 추출
        text = content
            .filter(part => part.type === 'text')
            .map(part => (part as { type: 'text'; text: string }).text)
            .join(' ');
    }
    if (maxLength && text.length > maxLength) {
        return text.slice(0, maxLength) + '...';
    }
    return text;
}

export class BYOKHistoryService {
    private static instance: BYOKHistoryService;

    private constructor() { }

    public static getInstance(): BYOKHistoryService {
        if (!BYOKHistoryService.instance) {
            BYOKHistoryService.instance = new BYOKHistoryService();
        }
        return BYOKHistoryService.instance;
    }

    private generateId(): string {
        return 'byok-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get all BYOK conversations
     * chrome.storage.local 또는 localStorage fallback 사용
     */
    public async getAllHistory(): Promise<BYOKConversation[]> {
        if (isChromeStorageAvailable()) {
            try {
                const result = await chrome.storage.local.get(BYOK_HISTORY_KEY);
                return (result[BYOK_HISTORY_KEY] as BYOKConversation[]) || [];
            } catch (e) {
                console.warn('[BYOKHistoryService] chrome.storage failed, using localStorage:', e);
                return getLocalStorageData();
            }
        }
        return getLocalStorageData();
    }

    /**
     * Get history filtered by provider
     */
    public async getHistoryByProvider(providerId: string): Promise<BYOKConversation[]> {
        const all = await this.getAllHistory();
        return all.filter(c => c.providerId === providerId);
    }

    /**
     * Save data to storage (chrome.storage.local 또는 localStorage)
     */
    private async saveToStorage(data: BYOKConversation[]): Promise<void> {
        if (isChromeStorageAvailable()) {
            try {
                await chrome.storage.local.set({ [BYOK_HISTORY_KEY]: data });
                return;
            } catch (e) {
                console.warn('[BYOKHistoryService] chrome.storage.set failed, using localStorage:', e);
            }
        }
        setLocalStorageData(data);
    }

    /**
     * Save a BYOK conversation
     */
    public async saveConversation(
        conversationId: string | null,
        providerId: BYOKProviderId,
        modelVariant: string,
        messages: ChatMessage[]
    ): Promise<string> {
        if (!messages || messages.length === 0) return conversationId || this.generateId();

        const all = await this.getAllHistory();
        const now = Date.now();
        let id = conversationId;
        let isNew = false;

        if (!id) {
            id = this.generateId();
            isNew = true;
        }

        // Generate Title & Preview (MessageContent 타입 안전 처리)
        const firstUserMsg = messages.find(m => m.role === 'user');
        const title = firstUserMsg
            ? extractTextFromContent(firstUserMsg.content, 30)
            : 'New Conversation';

        const lastMsg = messages[messages.length - 1];
        const preview = lastMsg
            ? extractTextFromContent(lastMsg.content, 50)
            : '';

        const newConversation: BYOKConversation = {
            id,
            providerId,
            modelVariant,
            title: isNew ? title : (all.find(c => c.id === id)?.title || title),
            messages,
            createdAt: isNew ? now : (all.find(c => c.id === id)?.createdAt || now),
            updatedAt: now,
            preview
        };

        const updatedList = [
            newConversation,
            ...all.filter(c => c.id !== id)
        ];

        await this.saveToStorage(updatedList);
        console.log(`[BYOKHistoryService] Saved conversation: ${id}, messages: ${messages.length}`);

        return id;
    }

    /**
     * Delete a conversation
     */
    public async deleteConversation(id: string): Promise<void> {
        const all = await this.getAllHistory();
        const updatedList = all.filter(c => c.id !== id);
        await this.saveToStorage(updatedList);
    }

    /**
     * Get a specific conversation
     */
    public async getConversation(id: string): Promise<BYOKConversation | undefined> {
        const all = await this.getAllHistory();
        return all.find(c => c.id === id);
    }
}
