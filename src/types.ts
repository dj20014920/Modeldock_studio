
export type ModelId =
  | 'gemini'
  | 'claude'
  | 'chatgpt'
  | 'perplexity'
  | 'deepseek'
  | 'grok'
  | 'qwen'
  | 'lmarena'
  | 'kimi'
  | 'mistral'
  | 'openrouter'
  | 'aistudio'
  | 'codex'
  | 'claudecode'
  | 'githubcopilot'
  | 'replit'
  | 'genspark'
  | 'lovable'
  | 'v0'
  | 'vooster';

export interface ModelConfig {
  id: ModelId;
  name: string;
  url: string;
  iconColor: string; // Tailwind class for dot indicator
  themeColor: string; // Border/Accent color
  excludeFromBrainFlow?: boolean; // If true, this model cannot be used in Brain Flow
  sessionSync?: {
    method: 'cookiePartition';
    domains: string[];
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// --- History Types ---
export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  preview: string;
  modelCount: number;
}

export interface ConversationContent {
  id: string;
  activeModels: ActiveModel[];
  mainBrainId: string | null;
}

// New interface for managing multiple instances of the same model
export interface ActiveModel {
  modelId: ModelId;
  instanceId: string; // Unique ID (e.g., 'gemini-1715234...')
  lastStatus?: 'idle' | 'sending' | 'success' | 'error';
  messages?: ChatMessage[]; // BYOK 모델을 위한 대화 내역
}

export interface SidebarItemProps {
  id: ModelId;
  isActive: boolean;
  onClick: () => void;
}

export type DispatchMode = 'manual' | 'auto';

export interface InjectionSelector {
  inputSelector: string;
  submitSelector: string;
  // Optional: specialized handling flags
  inputType?: 'textarea' | 'contenteditable';
  forceEnter?: boolean;
  delayBeforeSubmit?: number; // ms to wait before clicking/entering
  submitKey?: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
  };
}

// --- Prompt Library Types ---

export type PromptCategory = 'General' | 'Coding' | 'Writing' | 'Analysis' | 'Creative' | 'Business' | 'Academic';

export interface PromptData {
  id: string;
  title: string;       // Shown in UI (Localized ideally)
  description: string; // Shown in UI (Localized ideally)
  content: string;     // The actual text sent to the LLM (Usually English)
  category: PromptCategory;
  tags?: string[];
  isSystem?: boolean;  // Built-in prompts vs User prompts
}

export type SidebarView = 'chats' | 'models' | 'history';

// --- BYOK (Bring Your Own Key) Types ---

export type BYOKProviderId = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'xai' | 'mistral' | 'qwen' | 'kimi' | 'openrouter';

// 모델 가용성 검증 결과 (3가지 상태)
export type VerificationResult =
  | 'available'   // ✅ 사용 가능 (200 OK)
  | 'unavailable' // ❌ 사용 불가 (404, 401, 403)
  | 'uncertain';  // ⚠️ 확인 불가 (429, 5xx, 타임아웃, 네트워크 에러)

export type ReasoningEffort = 'low' | 'medium' | 'high';
export type ThinkingLevel = 'low' | 'high';
export type ThinkingMode = 'quick' | 'extended';

export type ModelCapability =
  | 'reasoning'   // o1, o3, DeepSeek-R1
  | 'coding'      // Codex, Claude 3.5 Sonnet, Mistral Large
  | 'vision'      // GPT-4o, Claude 3.5, Gemini
  | 'audio'       // GPT-4o Audio
  | 'video'       // Sora 2
  | 'realtime'    // GPT-Realtime
  | 'search';     // GPT-4o Search, Perplexity

export interface BYOKModelVariant {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  costPer1MInput: number;
  costPer1MOutput: number;
  costPer1MCachedInput?: number;
  capabilities?: ModelCapability[];

  // Feature Flags
  supportsReasoningEffort?: boolean; // OpenAI o1/o3
  supportsThinkingBudget?: boolean; // Anthropic, Qwen
  supportsThinkingLevel?: boolean; // Google Gemini
  supportsEnableThinking?: boolean; // DeepSeek
  isRecommended?: boolean;
  isNew?: boolean;

  // Sorting & Metadata
  created?: number; // Unix timestamp (초) - OpenRouter API에서 제공
  popularity?: number; // OpenRouter ranking/popularity score
  architecture?: string | null; // Model architecture info
  topProvider?: string | null; // Top provider name
}

export interface BYOKProvider {
  id: BYOKProviderId;
  name: string;
  websiteUrl: string;
  apiDocsUrl: string;
  apiKeyUrl: string;
  apiEndpoint: string;
  headerFormat: {
    apiKeyHeader: string;
    apiKeyPrefix?: string;
  };
  defaultVariant: string;

  // Global Capabilities
  supportsTemperature: boolean;
  temperatureRange?: [number, number];
  defaultTemperature?: number;
  supportsTopP: boolean;
  supportsMaxTokens: boolean;

  variants: BYOKModelVariant[];
  modelsEndpoint?: string; // For dynamic fetching
}

export interface BYOKSettings {
  enabled: boolean;
  providers: {
    [key in BYOKProviderId]?: {
      apiKey: string;
      selectedVariant: string;
      customTemperature?: number;
      reasoningEffort?: ReasoningEffort;
      thinkingBudget?: number;
      thinkingLevel?: ThinkingLevel;
      enableThinking?: boolean;

      // Advanced Sampling Parameters
      topP?: number;
      topK?: number;
      frequencyPenalty?: number; // -2.0 to 2.0
      presencePenalty?: number; // -2.0 to 2.0
      repetitionPenalty?: number; // 0.0 to 2.0
      minP?: number; // 0.0 to 1.0
      topA?: number; // 0.0 to 1.0
      seed?: number;

      // Output Control
      maxTokens?: number;
      stopSequences?: string[];
      responseFormat?: 'text' | 'json_object' | 'json_schema';

      // Tools
      enableTools?: boolean;
      parallelToolCalls?: boolean;

      // Advanced Options
      logprobs?: boolean;
      topLogprobs?: number; // 0-20
      verbosity?: 'low' | 'medium' | 'high';
    };
  };
  dynamicModels?: {
    [key in BYOKProviderId]?: BYOKModelVariant[];
  };
  lastRefreshTimestamp?: number; // Unix timestamp (ms) of last model refresh
}

export interface ModelConfigWithBYOK extends ModelConfig {
  byokSupport?: {
    providerId: BYOKProviderId;
    // if true, this model ONLY works with BYOK (no web UI fallback)
    byokOnly?: boolean;
  };
}


