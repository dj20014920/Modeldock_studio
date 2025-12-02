/**
 * ============================================================================
 *  Provider Settings Configuration
 *  각 AI 회사별 지원 파라미터, 범위, 기본값, 레이블 정의
 *  
 *  이 파일은 회사별로 UI에 표시할 설정 항목을 정의합니다.
 *  실제 API 호출 로직은 byokService.ts의 Adapter에서 처리합니다.
 * ============================================================================
 */

import { BYOKProviderId } from '../types';

// ============================================================================
// 설정 항목 타입 정의
// ============================================================================

/** 설정 항목 타입 */
export type SettingType = 
  | 'slider'      // 슬라이더 (temperature, top_p 등)
  | 'number'      // 숫자 입력 (max_tokens 등)
  | 'toggle'      // ON/OFF 토글 (enable_thinking 등)
  | 'select'      // 드롭다운 (reasoning_effort, response_format 등)
  | 'button-group' // 버튼 그룹 (reasoning_effort 등)
  | 'variant-grid'; // 그리드 형태 버튼 (OpenRouter variants)

/** 기본 설정 항목 인터페이스 */
export interface BaseSettingConfig {
  id: string;                 // 설정 ID (temperature, maxTokens 등)
  label: string;              // 표시 레이블
  description?: string;       // 설명 (선택적)
  type: SettingType;          // 입력 타입
  defaultValue: any;          // 기본값
  // 조건부 표시 (모델별로 다를 수 있음)
  showCondition?: (modelId: string, capabilities?: string[]) => boolean;
}

/** 슬라이더 설정 */
export interface SliderSettingConfig extends BaseSettingConfig {
  type: 'slider';
  min: number;
  max: number;
  step: number;
  marks?: { value: number; label: string }[]; // 슬라이더 마크 (선택적)
}

/** 숫자 입력 설정 */
export interface NumberSettingConfig extends BaseSettingConfig {
  type: 'number';
  min: number;
  max: number;
  step?: number;
}

/** 토글 설정 */
export interface ToggleSettingConfig extends BaseSettingConfig {
  type: 'toggle';
}

/** 선택 (드롭다운) 설정 */
export interface SelectSettingConfig extends BaseSettingConfig {
  type: 'select';
  options: { value: string; label: string; description?: string }[];
}

/** 버튼 그룹 설정 */
export interface ButtonGroupSettingConfig extends BaseSettingConfig {
  type: 'button-group';
  options: { value: string; label: string; description?: string }[];
}

/** 그리드 버튼 설정 (OpenRouter Variants 등) */
export interface VariantGridSettingConfig extends BaseSettingConfig {
  type: 'variant-grid';
  options: { 
    value: string; 
    label: string; 
    icon?: string; // Lucide 아이콘 이름
    description?: string;
  }[];
  columns?: number; // 그리드 열 수
}

/** 통합 설정 타입 */
export type SettingConfig = 
  | SliderSettingConfig 
  | NumberSettingConfig 
  | ToggleSettingConfig 
  | SelectSettingConfig 
  | ButtonGroupSettingConfig
  | VariantGridSettingConfig;

/** 회사별 설정 그룹 */
export interface ProviderSettingsGroup {
  title: string;        // 그룹 제목 (예: "Sampling Parameters")
  icon?: string;        // Lucide 아이콘 이름
  settings: SettingConfig[];
}

/** 회사별 전체 설정 구성 */
export interface ProviderSettingsConfig {
  providerId: BYOKProviderId;
  groups: ProviderSettingsGroup[];
  // 특별 안내 메시지 (예: DeepSeek 권장값)
  notes?: string[];
}

// ============================================================================
// 공통 설정 항목 정의 (재사용)
// ============================================================================

/** Temperature 슬라이더 (기본) */
const temperatureSlider = (min = 0, max = 2, defaultValue = 1.0): SliderSettingConfig => ({
  id: 'temperature',
  label: 'Temperature',
  description: '응답의 창의성/무작위성 조절',
  type: 'slider',
  min,
  max,
  step: 0.1,
  defaultValue,
  marks: [
    { value: min, label: 'Precise' },
    { value: (min + max) / 2, label: 'Balanced' },
    { value: max, label: 'Creative' },
  ],
});

/** Top P 슬라이더 */
const topPSlider: SliderSettingConfig = {
  id: 'topP',
  label: 'Top P',
  description: '누적 확률 기반 토큰 선택 (Nucleus Sampling)',
  type: 'slider',
  min: 0,
  max: 1,
  step: 0.05,
  defaultValue: 1.0,
};

/** Top K 숫자 입력 */
const topKNumber: NumberSettingConfig = {
  id: 'topK',
  label: 'Top K',
  description: '상위 K개 토큰에서만 선택',
  type: 'number',
  min: 0,
  max: 100,
  step: 1,
  defaultValue: 0,
};

/** Max Tokens 숫자 입력 */
const maxTokensNumber = (max = 32768, defaultValue = 4096): NumberSettingConfig => ({
  id: 'maxTokens',
  label: 'Max Tokens',
  description: '최대 출력 토큰 수',
  type: 'number',
  min: 256,
  max,
  step: 256,
  defaultValue,
});

/** Stop Sequences 설정은 별도 처리 필요 (텍스트 입력) */

/** Reasoning Effort 버튼 그룹 */
const reasoningEffortButtons: ButtonGroupSettingConfig = {
  id: 'reasoningEffort',
  label: 'Reasoning Effort',
  description: '추론 깊이 조절 (o1/o3/GPT-5)',
  type: 'button-group',
  options: [
    { value: 'low', label: 'Low', description: '빠른 응답, 낮은 비용' },
    { value: 'medium', label: 'Medium', description: '균형잡힌 추론 (기본)' },
    { value: 'high', label: 'High', description: '깊은 추론, 복잡한 작업' },
  ],
  defaultValue: 'medium',
  showCondition: (modelId, capabilities) => {
    // o1, o3, gpt-5 등 reasoning 모델에서만 표시
    const id = modelId.toLowerCase();
    return id.includes('o1') || id.includes('o3') || id.includes('gpt-5') ||
           (capabilities?.includes('reasoning') ?? false);
  },
};

/** Enable Thinking 토글 */
const enableThinkingToggle: ToggleSettingConfig = {
  id: 'enableThinking',
  label: 'Enable Thinking',
  description: '추론 과정 활성화',
  type: 'toggle',
  defaultValue: false,
};

/** Thinking Budget 슬라이더 */
const thinkingBudgetSlider = (max = 32000): SliderSettingConfig => ({
  id: 'thinkingBudget',
  label: 'Thinking Budget',
  description: '추론에 할당할 최대 토큰 수 (0 = 비활성화)',
  type: 'slider',
  min: 0,
  max,
  step: 1024,
  defaultValue: 0,
});

/** Frequency Penalty 슬라이더 */
const frequencyPenaltySlider: SliderSettingConfig = {
  id: 'frequencyPenalty',
  label: 'Frequency Penalty',
  description: '반복 토큰에 대한 페널티',
  type: 'slider',
  min: -2,
  max: 2,
  step: 0.1,
  defaultValue: 0,
};

/** Presence Penalty 슬라이더 */
const presencePenaltySlider: SliderSettingConfig = {
  id: 'presencePenalty',
  label: 'Presence Penalty',
  description: '새로운 주제 도입 장려',
  type: 'slider',
  min: -2,
  max: 2,
  step: 0.1,
  defaultValue: 0,
};

/** Response Format 선택 */
const responseFormatSelect: SelectSettingConfig = {
  id: 'responseFormat',
  label: 'Response Format',
  description: '응답 형식 지정',
  type: 'select',
  options: [
    { value: 'text', label: 'Text', description: '일반 텍스트' },
    { value: 'json_object', label: 'JSON Object', description: 'JSON 객체' },
  ],
  defaultValue: 'text',
};

/** Seed 숫자 입력 */
const seedNumber: NumberSettingConfig = {
  id: 'seed',
  label: 'Seed',
  description: '재현 가능한 결과를 위한 시드 값',
  type: 'number',
  min: 0,
  max: 2147483647,
  step: 1,
  defaultValue: 0, // 0 = 미지정
};

// ============================================================================
// 회사별 설정 구성
// ============================================================================

/**
 * OpenAI 설정 구성
 * 
 * 지원 파라미터:
 * - temperature (0-2) - reasoning 모델 제외
 * - top_p (0-1)
 * - max_tokens / max_completion_tokens
 * - frequency_penalty (-2 to 2)
 * - presence_penalty (-2 to 2)
 * - reasoning_effort (o1/o3/o4-mini)
 * - response_format
 * - seed
 * - logprobs / top_logprobs
 * - stop sequences (reasoning 모델 미지원)
 */
export const OPENAI_SETTINGS: ProviderSettingsConfig = {
  providerId: 'openai',
  groups: [
    {
      title: 'Reasoning',
      icon: 'Brain',
      settings: [
        reasoningEffortButtons,
      ],
    },
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        {
          ...temperatureSlider(0, 2, 1.0),
          showCondition: (modelId) => {
            // o1, o3, o4-mini 등 reasoning 모델에서는 temperature 미지원
            const id = modelId.toLowerCase();
            return !(id.includes('o1') || id.includes('o3') || id.includes('o4'));
          },
        },
        topPSlider,
        maxTokensNumber(128000, 4096),
      ],
    },
    {
      title: 'Advanced',
      icon: 'Settings',
      settings: [
        frequencyPenaltySlider,
        presencePenaltySlider,
        responseFormatSelect,
        seedNumber,
      ],
    },
  ],
  notes: [
    '⚠️ o1/o3/o4-mini 등 reasoning 모델은 temperature, top_p, stop 미지원',
    '💡 max_completion_tokens는 reasoning 모델에서 자동 적용됨',
  ],
};

/**
 * Anthropic (Claude) 설정 구성
 * 
 * 지원 파라미터:
 * - temperature (0-1) - thinking 모드에서 미지원
 * - top_p (0-1)
 * - top_k
 * - max_tokens
 * - thinking (budget_tokens) - Claude 3.5 Sonnet/Opus
 * - stop_sequences
 */
export const ANTHROPIC_SETTINGS: ProviderSettingsConfig = {
  providerId: 'anthropic',
  groups: [
    {
      title: 'Extended Thinking',
      icon: 'Brain',
      settings: [
        {
          ...thinkingBudgetSlider(32000),
          description: '추론에 할당할 토큰 예산 (0 = 비활성화). Thinking 사용 시 temperature 비활성화됨.',
          showCondition: (modelId) => {
            // Claude 3.5 Sonnet, 3.7, Opus 등에서 지원
            const id = modelId.toLowerCase();
            return id.includes('claude-3-5') || id.includes('claude-3.5') ||
                   id.includes('claude-3-7') || id.includes('claude-3.7') ||
                   id.includes('opus') || id.includes('sonnet');
          },
        },
      ],
    },
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        {
          ...temperatureSlider(0, 1, 1.0),
          description: 'Thinking Budget > 0이면 자동 비활성화됨',
        },
        topPSlider,
        topKNumber,
        maxTokensNumber(200000, 4096),
      ],
    },
  ],
  notes: [
    '💡 Extended Thinking 사용 시 temperature는 자동으로 비활성화됩니다',
    '🔄 Prompt Caching이 자동 적용되어 비용이 최대 90% 절감됩니다',
  ],
};

/**
 * Google Gemini 설정 구성
 * 
 * 지원 파라미터:
 * - temperature (0-2)
 * - topP (0-1)
 * - topK
 * - maxOutputTokens
 * - stopSequences
 * - thinking budget (2.5 Flash/Pro)
 */
export const GOOGLE_SETTINGS: ProviderSettingsConfig = {
  providerId: 'google',
  groups: [
    {
      title: 'Thinking',
      icon: 'Brain',
      settings: [
        {
          ...thinkingBudgetSlider(32000),
          id: 'thinkingBudget',
          description: 'Gemini 2.5 Flash/Pro의 Thinking 예산 (0 = 비활성화)',
          showCondition: (modelId) => {
            const id = modelId.toLowerCase();
            return id.includes('gemini-2.5') || id.includes('gemini-2-5') ||
                   id.includes('flash') || id.includes('pro');
          },
        },
      ],
    },
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        temperatureSlider(0, 2, 1.0),
        topPSlider,
        topKNumber,
        maxTokensNumber(65536, 8192),
      ],
    },
  ],
  notes: [
    '⚠️ Gemini 2.5에서 temperature를 과도하게 낮추면 루프/성능 저하 가능',
    '💡 Gemini 2.5 Flash/Pro는 Thinking이 기본 활성화되어 있습니다',
  ],
};

/**
 * DeepSeek 설정 구성
 * 
 * 지원 파라미터:
 * - temperature (0-2) - R1 미지원
 * - top_p - R1 미지원
 * - max_tokens
 * - enable_thinking (v3.1/v3.2-exp)
 * 
 * 권장값:
 * - 코딩/수학: 0.0
 * - 일반 대화/번역: 1.3
 * - 창작: 1.5
 */
export const DEEPSEEK_SETTINGS: ProviderSettingsConfig = {
  providerId: 'deepseek',
  groups: [
    {
      title: 'Thinking Mode',
      icon: 'Brain',
      settings: [
        {
          ...enableThinkingToggle,
          description: 'DeepSeek V3.1/V3.2-exp에서 사고 모드 활성화',
          showCondition: (modelId) => {
            // R1은 항상 thinking이므로 토글 불필요
            const id = modelId.toLowerCase();
            return !id.includes('reasoner') && !id.includes('r1');
          },
        },
      ],
    },
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        {
          ...temperatureSlider(0, 2, 1.0),
          description: 'R1 모델에서는 자동 비활성화됨. 권장: 코딩 0.0, 대화 1.3, 창작 1.5',
          showCondition: (modelId) => {
            const id = modelId.toLowerCase();
            return !id.includes('reasoner') && !id.includes('r1');
          },
        },
        {
          ...topPSlider,
          showCondition: (modelId) => {
            const id = modelId.toLowerCase();
            return !id.includes('reasoner') && !id.includes('r1');
          },
        },
        maxTokensNumber(65536, 4096),
      ],
    },
  ],
  notes: [
    '🎯 권장 Temperature: 코딩/수학 0.0 | 일반 대화/번역 1.3 | 창작 1.5',
    '⚠️ DeepSeek-R1 (Reasoner)은 항상 Thinking 모드이며 temperature/top_p 미지원',
  ],
};

/**
 * xAI (Grok) 설정 구성
 * 
 * OpenAI 호환 API + reasoning_tokens 지원
 */
export const XAI_SETTINGS: ProviderSettingsConfig = {
  providerId: 'xai',
  groups: [
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        temperatureSlider(0, 2, 1.0),
        topPSlider,
        maxTokensNumber(131072, 4096),
      ],
    },
    {
      title: 'Advanced',
      icon: 'Settings',
      settings: [
        frequencyPenaltySlider,
        presencePenaltySlider,
        seedNumber,
      ],
    },
  ],
  notes: [
    '💡 Grok은 OpenAI 호환 API를 사용합니다',
    '📊 Reasoning 모델은 usage.reasoning_tokens로 추론 토큰 사용량을 확인할 수 있습니다',
  ],
};

/**
 * Mistral AI 설정 구성
 * 
 * 지원 파라미터:
 * - temperature (0-1)
 * - top_p
 * - max_tokens
 * - stop
 */
export const MISTRAL_SETTINGS: ProviderSettingsConfig = {
  providerId: 'mistral',
  groups: [
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        temperatureSlider(0, 1, 0.7),
        topPSlider,
        maxTokensNumber(32768, 4096),
      ],
    },
  ],
  notes: [
    '💡 Mistral의 기본 temperature는 0.7입니다',
  ],
};

/**
 * Qwen (Alibaba) 설정 구성
 * 
 * 지원 파라미터:
 * - temperature (0-2)
 * - top_p (0-1)
 * - max_tokens
 * - enable_thinking + thinking_budget (Deep Thinking 모델)
 */
export const QWEN_SETTINGS: ProviderSettingsConfig = {
  providerId: 'qwen',
  groups: [
    {
      title: 'Deep Thinking',
      icon: 'Brain',
      settings: [
        {
          ...enableThinkingToggle,
          description: 'Qwen 모델의 Deep Thinking 모드 활성화',
        },
        {
          ...thinkingBudgetSlider(64000),
          id: 'thinkingBudget',
          description: '추론에 할당할 최대 토큰 수 (Enable Thinking이 ON일 때만 적용)',
        },
      ],
    },
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        temperatureSlider(0, 2, 0.8),
        topPSlider,
        maxTokensNumber(32768, 4096),
      ],
    },
  ],
  notes: [
    '💡 Qwen의 기본 temperature는 0.8입니다',
    '🧠 Deep Thinking은 reasoning_content로 분리되어 스트리밍됩니다',
  ],
};

/**
 * Kimi (Moonshot) 설정 구성
 * 
 * OpenAI 호환 (temperature, top_p, max_tokens, stop, stream)
 */
export const KIMI_SETTINGS: ProviderSettingsConfig = {
  providerId: 'kimi',
  groups: [
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        temperatureSlider(0, 1, 0.3),
        topPSlider,
        maxTokensNumber(128000, 4096),
      ],
    },
  ],
  notes: [
    '💡 Kimi는 OpenAI 호환 API를 사용합니다',
    '🧠 Kimi K2 Thinking 모델은 항상 사고 모드입니다',
  ],
};

/**
 * OpenRouter 설정 구성
 * 
 * OpenRouter는 여러 Provider의 모델을 통합 제공하며,
 * 각 모델의 원본 Provider API 파라미터를 그대로 전달합니다.
 * 
 * 지원 파라미터 (OpenAI 호환):
 * - temperature (0-2)
 * - top_p (0-1)
 * - top_k (일부 모델)
 * - max_tokens
 * - stop
 * - presence_penalty, frequency_penalty
 * - reasoning_effort (reasoning 모델)
 * 
 * 참고: Model Variant (:free, :thinking 등)는 모델 ID에 suffix로 추가되므로
 * 여기가 아닌 모델 선택 단계에서 처리됩니다.
 */
export const OPENROUTER_SETTINGS: ProviderSettingsConfig = {
  providerId: 'openrouter',
  groups: [
    {
      title: 'Reasoning',
      icon: 'Brain',
      settings: [
        {
          ...reasoningEffortButtons,
          description: 'OpenRouter 통합 reasoning 파라미터 (reasoning 모델에 적용)',
          showCondition: (modelId, capabilities) => {
            const id = modelId.toLowerCase();
            // reasoning 지원 모델 확인
            return id.includes('o1') || id.includes('o3') || id.includes('gpt-5') ||
                   id.includes('claude-3-7') || id.includes('claude-4') ||
                   id.includes('deepseek-r1') || id.includes('thinking') ||
                   id.includes('grok') && (id.includes('reason') || id.includes('think')) ||
                   id.includes('qwen') && id.includes('thinking') ||
                   (capabilities?.includes('reasoning') ?? false);
          },
        },
        {
          ...thinkingBudgetSlider(32000),
          description: 'Anthropic/Qwen 모델의 Thinking Budget (reasoning.max_tokens)',
          showCondition: (modelId) => {
            const id = modelId.toLowerCase();
            return id.includes('anthropic/') || id.includes('claude') ||
                   id.includes('qwen/') && id.includes('thinking');
          },
        },
      ],
    },
    {
      title: 'Sampling',
      icon: 'Sliders',
      settings: [
        {
          ...temperatureSlider(0, 2, 1.0),
          showCondition: (modelId) => {
            // reasoning 모델에서는 temperature 미지원
            const id = modelId.toLowerCase();
            return !(id.includes('o1') || id.includes('o3') || id.includes('o4') ||
                     id.includes('deepseek-r1'));
          },
        },
        topPSlider,
        maxTokensNumber(128000, 4096),
      ],
    },
  ],
  notes: [
    '🔄 OpenRouter는 여러 Provider의 모델을 통합 제공합니다',
    '💰 Anthropic/Gemini 모델은 자동으로 캐싱이 적용되어 비용이 절감됩니다',
    '💡 Model Variant (:free, :nitro 등)는 모델 선택 시 적용됩니다',
  ],
};

// ============================================================================
// 회사별 설정 매핑
// ============================================================================

export const PROVIDER_SETTINGS: Record<BYOKProviderId, ProviderSettingsConfig> = {
  openai: OPENAI_SETTINGS,
  anthropic: ANTHROPIC_SETTINGS,
  google: GOOGLE_SETTINGS,
  deepseek: DEEPSEEK_SETTINGS,
  xai: XAI_SETTINGS,
  mistral: MISTRAL_SETTINGS,
  qwen: QWEN_SETTINGS,
  kimi: KIMI_SETTINGS,
  openrouter: OPENROUTER_SETTINGS,
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 특정 Provider의 설정 구성 가져오기
 */
export function getProviderSettings(providerId: BYOKProviderId): ProviderSettingsConfig {
  return PROVIDER_SETTINGS[providerId];
}

/**
 * 특정 모델에 대해 표시할 설정 항목 필터링
 */
export function getVisibleSettings(
  providerId: BYOKProviderId,
  modelId: string,
  capabilities?: string[]
): ProviderSettingsGroup[] {
  const config = PROVIDER_SETTINGS[providerId];
  
  return config.groups.map(group => ({
    ...group,
    settings: group.settings.filter(setting => {
      if (!setting.showCondition) return true;
      return setting.showCondition(modelId, capabilities);
    }),
  })).filter(group => group.settings.length > 0); // 빈 그룹 제거
}

/**
 * 설정 ID로 기본값 가져오기
 */
export function getDefaultValue(providerId: BYOKProviderId, settingId: string): any {
  const config = PROVIDER_SETTINGS[providerId];
  
  for (const group of config.groups) {
    const setting = group.settings.find(s => s.id === settingId);
    if (setting) return setting.defaultValue;
  }
  
  return undefined;
}

/**
 * Reasoning 모델인지 확인
 */
export function isReasoningModel(modelId: string, providerId?: BYOKProviderId): boolean {
  const id = modelId.toLowerCase();
  
  // 공통 패턴
  if (id.includes('o1') || id.includes('o3') || id.includes('gpt-5')) return true;
  if (id.includes('thinking') || id.includes('reasoner') || id.includes('r1')) return true;
  
  // Provider별 특수 케이스
  if (providerId === 'deepseek' && id.includes('reasoner')) return true;
  if (providerId === 'anthropic' && (id.includes('claude-3-7') || id.includes('claude-4'))) return true;
  
  return false;
}
