import { BYOKProvider, BYOKProviderId } from './types';

/**
 * BYOK Provider 설정
 *
 * ⚠️ 중요: 이 파일은 Provider 메타데이터만 제공합니다.
 * 실제 모델 리스트는 OpenRouter API를 통해 실시간으로 가져옵니다.
 *
 * - Cloudflare Worker 프록시를 통해 OpenRouter API 호출
 * - 6시간 캐싱으로 최신 모델 정보 유지
 * - "Refresh Models" 버튼으로 수동 업데이트 가능
 *
 * 가상 모델 데이터 제거됨 (2025-01-15)
 */

export const BYOK_PROVIDERS: Record<BYOKProviderId, BYOKProvider> = {
    openai: {
        id: 'openai',
        name: 'OpenAI',
        websiteUrl: 'https://openai.com',
        apiDocsUrl: 'https://platform.openai.com/docs',
        apiKeyUrl: 'https://platform.openai.com/api-keys',
        apiEndpoint: 'https://api.openai.com/v1',
        headerFormat: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'Bearer ',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 2],
        defaultTemperature: 1.0,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    anthropic: {
        id: 'anthropic',
        name: 'Anthropic',
        websiteUrl: 'https://anthropic.com',
        apiDocsUrl: 'https://docs.anthropic.com',
        apiKeyUrl: 'https://console.anthropic.com',
        apiEndpoint: 'https://api.anthropic.com/v1',
        headerFormat: {
            apiKeyHeader: 'x-api-key',
            apiKeyPrefix: '',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 1],
        defaultTemperature: 1.0,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    google: {
        id: 'google',
        name: 'Google Gemini',
        websiteUrl: 'https://ai.google.dev',
        apiDocsUrl: 'https://ai.google.dev/docs',
        apiKeyUrl: 'https://aistudio.google.com/app/apikey',
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
        headerFormat: {
            apiKeyHeader: 'x-goog-api-key',
            apiKeyPrefix: '',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 2],
        defaultTemperature: 1.0,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        websiteUrl: 'https://deepseek.com',
        apiDocsUrl: 'https://api-docs.deepseek.com',
        apiKeyUrl: 'https://platform.deepseek.com/api_keys',
        apiEndpoint: 'https://api.deepseek.com/v1',
        headerFormat: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'Bearer ',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 2],
        defaultTemperature: 1.0,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    xai: {
        id: 'xai',
        name: 'xAI (Grok)',
        websiteUrl: 'https://x.ai',
        apiDocsUrl: 'https://docs.x.ai',
        apiKeyUrl: 'https://console.x.ai',
        apiEndpoint: 'https://api.x.ai/v1',
        headerFormat: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'Bearer ',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 2],
        defaultTemperature: 1.0,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    mistral: {
        id: 'mistral',
        name: 'Mistral AI',
        websiteUrl: 'https://mistral.ai',
        apiDocsUrl: 'https://docs.mistral.ai',
        apiKeyUrl: 'https://console.mistral.ai',
        apiEndpoint: 'https://api.mistral.ai/v1',
        headerFormat: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'Bearer ',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 1],
        defaultTemperature: 0.7,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    qwen: {
        id: 'qwen',
        name: 'Qwen (Alibaba)',
        websiteUrl: 'https://www.alibabacloud.com/help/en/model-studio',
        apiDocsUrl: 'https://www.alibabacloud.com/help/en/model-studio/developer-reference/use-qwen-by-calling-api',
        apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
        apiEndpoint: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
        headerFormat: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'Bearer ',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 2],
        defaultTemperature: 0.8,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    kimi: {
        id: 'kimi',
        name: 'Kimi (Moonshot)',
        websiteUrl: 'https://moonshot.cn',
        apiDocsUrl: 'https://platform.moonshot.cn/docs',
        apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
        apiEndpoint: 'https://api.moonshot.cn/v1',
        headerFormat: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'Bearer ',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 1],
        defaultTemperature: 0.3,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },

    openrouter: {
        id: 'openrouter',
        name: 'OpenRouter',
        websiteUrl: 'https://openrouter.ai',
        apiDocsUrl: 'https://openrouter.ai/docs',
        apiKeyUrl: 'https://openrouter.ai/keys',
        apiEndpoint: 'https://openrouter.ai/api/v1',
        modelsEndpoint: 'https://openrouter.ai/api/v1/models',
        headerFormat: {
            apiKeyHeader: 'Authorization',
            apiKeyPrefix: 'Bearer ',
        },
        defaultVariant: '',
        supportsTemperature: true,
        temperatureRange: [0, 2],
        defaultTemperature: 1.0,
        supportsTopP: true,
        supportsMaxTokens: true,
        variants: [],
        // 모델 리스트는 OpenRouter API에서 실시간으로 가져옵니다
    },
};

export const REASONING_EFFORT_LABELS: Record<string, { label: string; description: string }> = {
    low: {
        label: 'Low',
        description: 'Faster responses, lower cost',
    },
    medium: {
        label: 'Medium',
        description: 'Balanced reasoning (Default)',
    },
    high: {
        label: 'High',
        description: 'Deep reasoning, complex tasks',
    },
};
