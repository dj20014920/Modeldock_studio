
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

// --- Message Content Types ---
// 이미지 첨부를 위한 확장된 Content 타입

export interface TextContentPart {
  type: 'text';
  text: string;
}

export interface ImageContentPart {
  type: 'image_url';
  image_url: {
    url: string; // base64 (data:image/...) 또는 HTTP/HTTPS URL
    detail?: 'auto' | 'low' | 'high'; // OpenAI vision detail level (optional)
  };
}

// TODO: Phase 2 - File Attachment Support
// 파일 첨부 기능을 위한 타입 (향후 구현 예정)
//
// export interface FileContentPart {
//   type: 'file';
//   file: {
//     id: string;          // Files API로부터 받은 file_id
//     name: string;        // 원본 파일명
//     mimeType: string;    // MIME type (application/pdf, text/csv 등)
//     size?: number;       // 파일 크기 (bytes)
//   };
// }
//
// 사용 시나리오:
// 1. 사용자가 PDF/문서 첨부 → BYOKChat의 파일 선택 버튼 클릭
// 2. Provider별 Files API 호출하여 업로드:
//    - OpenAI: POST /v1/files (purpose: 'assistants')
//    - Anthropic: POST /v1/messages/batches (Files API beta)
//    - Google: POST /upload/v1beta/files
//    - DeepSeek: 파일 업로드 지원 (최대 50개, 100MB)
//    - xAI: Files API 지원
// 3. file_id 획득 후 메시지 content에 포함
// 4. 히스토리 저장 시 file_id만 저장 (원본 파일은 Provider 서버에 저장됨)
// 5. 불러오기 시 file_id로 참조 (재다운로드 불필요)
//
// 구현 시 고려사항:
// - 업로드 진행률 표시 (UX)
// - 파일 크기/형식 제한 체크 (Provider별 상이)
// - 에러 핸들링 (타임아웃, 네트워크 오류, 용량 초과 등)
// - 파일 삭제 API (불필요한 파일 정리)

export type MessageContentPart = TextContentPart | ImageContentPart; // | FileContentPart (Phase 2)

export type MessageContent = string | MessageContentPart[];

// --- Reasoning/Thinking Types (OpenRouter, Anthropic, DeepSeek 등) ---
export interface ReasoningDetail {
  type: 'reasoning.summary' | 'reasoning.text' | 'reasoning.encrypted';
  id?: string | null;
  format?: 'unknown' | 'openai-responses-v1' | 'xai-responses-v1' | 'anthropic-claude-v1';
  index?: number;
  // type별 필드
  summary?: string;     // reasoning.summary
  text?: string;        // reasoning.text
  signature?: string | null; // reasoning.text
  data?: string;        // reasoning.encrypted
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: MessageContent; // ✨ string에서 확장 (하위 호환 유지)
  timestamp: number;
  // Reasoning/Thinking 지원
  reasoning?: string;           // 단순 텍스트 (DeepSeek R1 등)
  reasoningDetails?: ReasoningDetail[]; // OpenRouter 표준 (OpenAI, Anthropic, Gemini 등)
}

// --- History Types ---
export interface ConversationMetadata {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  preview: string;
  modelCount: number;
  mode?: 'auto-routing' | 'brainflow' | 'byok' | 'manual';
  linkCount?: number;
  lastPrompt?: string;
}

export interface ConversationContent {
  id: string;
  activeModels: ActiveModel[];
  mainBrainId: string | null;
  conversationLinks?: Record<string, string>;
  mode?: 'auto-routing' | 'brainflow' | 'byok' | 'manual';
  lastPrompt?: string;
}

// New interface for managing multiple instances of the same model
export interface ActiveModel {
  modelId: ModelId;
  instanceId: string; // Unique ID (e.g., 'gemini-1715234...')
  lastStatus?: 'idle' | 'sending' | 'success' | 'error';
  messages?: ChatMessage[]; // BYOK 모델을 위한 대화 내역
  conversationUrl?: string; // Auto-routing/Brain Flow 결과 링크
  historyMode?: 'auto-routing' | 'brainflow' | 'byok' | 'manual';
  lastPrompt?: string;
  byokHistoryId?: string; // ID of the currently loaded BYOK history
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

// OpenRouter Model Variants (suffix로 붙음)
// 문서: https://openrouter.ai/docs/guides/routing/model-variants
export type OpenRouterVariant = 
  | 'default'   // 기본 (suffix 없음)
  | 'free'      // :free - 무료 버전
  | 'extended'  // :extended - 확장 컨텍스트
  | 'thinking'  // :thinking - 추론 확장
  | 'online'    // :online - 실시간 웹 검색
  | 'nitro'     // :nitro - 빠른 응답
  | 'floor';    // :floor - 최저가 provider

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
  isFree?: boolean; // Explicitly marks the model as free
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
      selectedVariant?: string;    // ✅ 현재 단일 선택 기준
      selectedVariants?: string[]; // 🚧 멀티 선택(미사용 시 무시)
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
  
  // ✨ 모델별 개별 설정 오버라이드
  // 키: 모델 전체 ID (예: "openrouter-meta-llama/llama-3.2-3b-instruct")
  // 설정 우선순위: modelOverrides[modelId] > providers[providerId] (기본 설정)
  modelOverrides?: {
    [modelId: string]: ModelOverrideSettings;
  };
}

// ✨ 모델별 개별 설정 (기본 설정을 오버라이드)
export interface ModelOverrideSettings {
  // OpenRouter Model Variant (:free, :thinking 등)
  openRouterVariant?: OpenRouterVariant;
  
  // Basic Sampling
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  
  // Reasoning/Thinking
  reasoningEffort?: ReasoningEffort;
  thinkingBudget?: number;
  thinkingLevel?: ThinkingLevel;
  enableThinking?: boolean;
  
  // Advanced Sampling
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  minP?: number;
  topA?: number;
  seed?: number;
  
  // Output Control
  stopSequences?: string[];
  responseFormat?: 'text' | 'json_object' | 'json_schema';
  
  // 기본 설정 사용 여부 (true면 이 오버라이드 무시)
  useDefaults?: boolean;
}

export interface ModelConfigWithBYOK extends ModelConfig {
  byokSupport?: {
    providerId: BYOKProviderId;
    // if true, this model ONLY works with BYOK (no web UI fallback)
    byokOnly?: boolean;
  };
}
