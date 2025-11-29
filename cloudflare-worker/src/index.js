/**
 * ============================================================================
 *  ModelDock Studio - BYOK Proxy Server
 *  Cloudflare Worker for Dynamic Model List Caching
 *
 *  Features:
 *  - OpenRouter API 호출 및 모델 리스트 캐싱 (6시간 TTL)
 *  - 제공자별 자동 분류 (Claude, Grok, OpenAI, Gemini 등)
 *  - R2 스토리지 기반 캐싱
 *  - 인기순 정렬 (OpenRouter)
 *  - 6시간 주기 자동 갱신 (익명 사용자 접속 시)
 * ============================================================================
 */

// ===== Constants =====

const CACHE_KEY = 'models-cache-v4.json'; // v3 → v4 (Kimi prefix 수정: moonshot → moonshotai)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6시간 (밀리초)

// Provider Mapping (OpenRouter ID → 우리 Provider ID)
const PROVIDER_MAPPING = {
    'anthropic': {
        prefix: 'anthropic/',
        name: 'Anthropic',
        providerKey: 'anthropic'
    },
    'openai': {
        prefix: 'openai/',
        name: 'OpenAI',
        providerKey: 'openai'
    },
    'google': {
        prefix: 'google/',
        name: 'Google Gemini',
        providerKey: 'google'
    },
    'x-ai': {
        prefix: 'x-ai/',
        name: 'xAI (Grok)',
        providerKey: 'xai'
    },
    'deepseek': {
        prefix: 'deepseek/',
        name: 'DeepSeek',
        providerKey: 'deepseek'
    },
    'mistralai': {
        prefix: 'mistralai/',
        name: 'Mistral AI',
        providerKey: 'mistral'
    },
    'qwen': {
        prefix: 'qwen/',
        name: 'Qwen (Alibaba)',
        providerKey: 'qwen'
    },
    'moonshot': {
        prefix: 'moonshotai/',
        name: 'Kimi (Moonshot)',
        providerKey: 'kimi'
    },
    'openrouter': {
        prefix: 'openrouter/',
        name: 'OpenRouter',
        providerKey: 'openrouter'
    }
};

// ===== Helper Functions =====

/**
 * R2에서 캐시된 데이터 가져오기
 */
async function getCachedData(env) {
    try {
        const object = await env.MODEL_CACHE.get(CACHE_KEY);
        if (!object) return null;

        const data = await object.json();

        // TTL 체크
        const now = Date.now();
        if (data.timestamp && (now - data.timestamp) < CACHE_TTL_MS) {
            console.log('[Cache] Hit - Age:', Math.floor((now - data.timestamp) / 1000 / 60), 'minutes');
            return data;
        }

        console.log('[Cache] Expired - Age:', Math.floor((now - data.timestamp) / 1000 / 60), 'minutes');
        return null;
    } catch (error) {
        console.error('[Cache] Read Error:', error);
        return null;
    }
}

/**
 * R2에 데이터 캐싱
 */
async function setCachedData(env, data) {
    try {
        const cacheData = {
            ...data,
            timestamp: Date.now()
        };

        await env.MODEL_CACHE.put(
            CACHE_KEY,
            JSON.stringify(cacheData),
            {
                httpMetadata: {
                    contentType: 'application/json',
                }
            }
        );

        console.log('[Cache] Saved - Models:', Object.keys(data.models).length);
        return true;
    } catch (error) {
        console.error('[Cache] Write Error:', error);
        return false;
    }
}

/**
 * OpenRouter API에서 모델 리스트 가져오기
 */
async function fetchModelsFromOpenRouter(apiKey) {
    console.log('[OpenRouter] Fetching models...');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`OpenRouter API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[OpenRouter] Fetched', data.data?.length || 0, 'models');

        return data.data || [];
    } catch (error) {
        console.error('[OpenRouter] Fetch Error:', error);
        throw error;
    }
}

/**
 * 모델을 제공자별로 분류
 */
function classifyModels(rawModels) {
    const classified = {};

    for (const providerKey in PROVIDER_MAPPING) {
        classified[PROVIDER_MAPPING[providerKey].providerKey] = [];
    }

    // 기타 (unmapped) 제공자
    classified['other'] = [];

    for (const model of rawModels) {
        let matched = false;
        let primaryProviderKey = null;

        // 1. 먼저 해당 모델의 주요 제공자 찾기
        for (const providerKey in PROVIDER_MAPPING) {
            const config = PROVIDER_MAPPING[providerKey];

            // openrouter는 나중에 처리
            if (config.providerKey === 'openrouter') continue;

            if (model.id.startsWith(config.prefix)) {
                primaryProviderKey = config.providerKey;
                matched = true;
                break;
            }
        }

        // 2. 주요 제공자가 없으면 'other'
        if (!matched) {
            primaryProviderKey = 'other';
        }

        // 3. 모델 변환 (주요 제공자용)
        const transformedModel = transformModel(model, primaryProviderKey);

        // 4. 주요 제공자 카테고리에 추가
        classified[primaryProviderKey].push(transformedModel);

        // 5. openrouter 카테고리에도 모든 모델 추가 (복사본)
        classified['openrouter'].push({...transformedModel});
    }

    // 각 제공자별로 인기순 정렬 (popularity 높은 순)
    for (const providerKey in classified) {
        classified[providerKey].sort((a, b) => {
            // 인기도 점수 계산 (여러 지표 종합)
            const scoreA = (a.popularity || 0) * 1000 + (a.contextWindow || 0) / 1000;
            const scoreB = (b.popularity || 0) * 1000 + (b.contextWindow || 0) / 1000;
            return scoreB - scoreA;
        });

        // openrouter는 더 많은 모델 유지 (250개), 다른 제공자는 100개
        const maxModels = providerKey === 'openrouter' ? 250 : 100;
        if (classified[providerKey].length > maxModels) {
            classified[providerKey] = classified[providerKey].slice(0, maxModels);
        }
    }

    return classified;
}

/**
 * OpenRouter 모델 데이터를 우리 형식으로 변환
 */
function transformModel(rawModel, providerKey) {
    // Capability 추론
    const capabilities = [];
    const modelIdLower = rawModel.id.toLowerCase();
    const nameLower = (rawModel.name || '').toLowerCase();

    if (modelIdLower.includes('vision') || modelIdLower.includes('gpt-4o') ||
        modelIdLower.includes('claude-3') || modelIdLower.includes('gemini')) {
        capabilities.push('vision');
    }
    if (modelIdLower.includes('code') || modelIdLower.includes('coder')) {
        capabilities.push('coding');
    }
    if (modelIdLower.includes('reason') || modelIdLower.includes('o1') ||
        modelIdLower.includes('o3') || modelIdLower.includes('thinking') ||
        modelIdLower.includes('r1')) {
        capabilities.push('reasoning');
    }
    if (modelIdLower.includes('realtime') || modelIdLower.includes('audio')) {
        capabilities.push('realtime');
    }

    // 특수 기능 플래그
    let supportsReasoningEffort = false;
    let supportsThinkingBudget = false;
    let supportsEnableThinking = false;

    if (modelIdLower.includes('o1') || modelIdLower.includes('o3') || modelIdLower.includes('gpt-5')) {
        supportsReasoningEffort = true;
    }
    if ((providerKey === 'anthropic' || providerKey === 'qwen') &&
        (modelIdLower.includes('thinking') || modelIdLower.includes('sonnet') || modelIdLower.includes('opus'))) {
        supportsThinkingBudget = true;
    }
    if (providerKey === 'deepseek' && !modelIdLower.includes('reasoner')) {
        supportsEnableThinking = true;
    }

    // 최신 모델 판단 (30일 이내)
    const now = Math.floor(Date.now() / 1000); // Unix timestamp (초)
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const isNew = rawModel.created && rawModel.created >= thirtyDaysAgo;

    // 인기도 점수 계산 (복합 지표 - OpenRouter API에는 ranking 필드가 없음)
    // 1. 컨텍스트 길이 (높을수록 강력한 모델) - 최대 200점
    const contextScore = (rawModel.context_length || 0) / 1000;

    // 2. 최신성 (최근 모델일수록 성능 좋음) - 최대 20점
    const recencyScore = (rawModel.created || 0) / 100000000;

    // 3. Provider 지원 여부 (max_completion_tokens 있으면 +10점)
    const providerScore = rawModel.top_provider?.max_completion_tokens ? 10 : 0;

    // 4. 특정 모델 시리즈 가중치 (유명 모델 우대)
    let seriesBonus = 0;
    if (modelIdLower.includes('gpt-4') || modelIdLower.includes('o1') ||
        modelIdLower.includes('o3') || modelIdLower.includes('claude-3.5') ||
        modelIdLower.includes('gemini-2') || modelIdLower.includes('gemini-pro')) {
        seriesBonus = 100; // Tier S
    } else if (modelIdLower.includes('llama-3.3') || modelIdLower.includes('llama-3.1-405b') ||
               modelIdLower.includes('claude-3') || modelIdLower.includes('gemini-1.5') ||
               modelIdLower.includes('qwen-2.5-72b') || modelIdLower.includes('deepseek-r1')) {
        seriesBonus = 80; // Tier A
    } else if (modelIdLower.includes('gpt-3.5') || modelIdLower.includes('llama-3.1-70b') ||
               modelIdLower.includes('mixtral') || modelIdLower.includes('qwen-2.5')) {
        seriesBonus = 60; // Tier B
    } else if (modelIdLower.includes('llama-3') || modelIdLower.includes('mistral')) {
        seriesBonus = 40; // Tier C
    }

    // 5. 무료 모델은 추가 가산점 (+50점)
    const isFree = rawModel.pricing?.prompt === "0" && rawModel.pricing?.completion === "0";
    const freeBonus = isFree ? 50 : 0;

    const popularityScore = contextScore + recencyScore + providerScore + seriesBonus + freeBonus;

    return {
        id: rawModel.id,
        name: rawModel.name || rawModel.id,
        description: rawModel.description || `${rawModel.name} from OpenRouter`,
        contextWindow: rawModel.context_length || 4096,
        maxOutputTokens: rawModel.top_provider?.max_completion_tokens || 4096,
        // OpenRouter API는 "per token" 단위로 가격 제공
        // → "per 1M tokens"로 표시하기 위해 1,000,000 곱함
        // parseFloat로 문자열 "0"도 올바르게 처리
        costPer1MInput: parseFloat(rawModel.pricing?.prompt || 0) * 1000000,
        costPer1MOutput: parseFloat(rawModel.pricing?.completion || 0) * 1000000,
        capabilities,
        supportsReasoningEffort,
        supportsThinkingBudget,
        supportsEnableThinking,
        created: rawModel.created || 0, // Unix timestamp for sorting
        isNew,
        popularity: popularityScore, // 복합 지표로 계산된 인기도 점수
        architecture: rawModel.architecture || null,
        topProvider: rawModel.top_provider?.name || null
    };
}

/**
 * 정적 모델 데이터 (OpenRouter 외 제공자들)
 * ⚠️ 가상 모델 제거: OpenRouter API 데이터만 사용
 * 하드코딩된 가상 모델(GPT-5, Claude Opus 4 등)은 혼란을 줄 수 있으므로 제거됨
 */
function getStaticModels() {
    // 빈 객체 반환: OpenRouter API 데이터만 사용 (가상 모델 제거)
    return {};
}

/**
 * 정적 모델과 동적 모델 병합
 */
function mergeModels(staticModels, dynamicModels) {
    const merged = {};

    // 모든 제공자 키 수집
    const allProviderKeys = new Set([
        ...Object.keys(staticModels),
        ...Object.keys(dynamicModels)
    ]);

    for (const providerKey of allProviderKeys) {
        const static_ = staticModels[providerKey] || [];
        const dynamic = dynamicModels[providerKey] || [];

        // 동적 모델 우선, 중복 제거
        const modelMap = new Map();

        // 정적 모델 먼저 추가
        for (const model of static_) {
            modelMap.set(model.id, model);
        }

        // 동적 모델로 덮어쓰기 (우선순위 높음)
        for (const model of dynamic) {
            const existing = modelMap.get(model.id);
            if (existing) {
                // 병합: 정적 데이터의 메타정보 + 동적 데이터의 최신 정보
                modelMap.set(model.id, {
                    ...existing,
                    ...model,
                    // 정적 데이터의 플래그 우선 (더 정확함)
                    isRecommended: existing.isRecommended || model.isRecommended,
                    isNew: existing.isNew || model.isNew
                });
            } else {
                modelMap.set(model.id, model);
            }
        }

        merged[providerKey] = Array.from(modelMap.values());
    }

    return merged;
}

// ===== Main Handler =====

export default {
    async fetch(request, env, ctx) {
        // CORS 헤더
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // OPTIONS 요청 (CORS Preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: corsHeaders
            });
        }

        // GET /models 엔드포인트만 허용
        const url = new URL(request.url);
        if (url.pathname !== '/models' && url.pathname !== '/models/') {
            return new Response('Not Found', {
                status: 404,
                headers: corsHeaders
            });
        }

        try {
            // 🆕 URL 파라미터에서 force 확인 (사용자가 명시적으로 새로고침 요청)
            const forceRefresh = url.searchParams.get('force') === '1' ||
                                 url.searchParams.get('refresh') === '1';

            if (forceRefresh) {
                console.log('[Worker] Force refresh requested - bypassing cache');
            }

            // 1. 캐시 확인 (force가 아닐 때만)
            let cachedData = null;
            if (!forceRefresh) {
                cachedData = await getCachedData(env);
            }

            if (cachedData) {
                console.log('[Worker] Serving from cache');
                return new Response(JSON.stringify({
                    success: true,
                    models: cachedData.models,
                    timestamp: cachedData.timestamp,
                    cached: true,
                    age: Math.floor((Date.now() - cachedData.timestamp) / 1000 / 60) // minutes
                }), {
                    headers: {
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                });
            }

            // 2. 캐시 미스 - OpenRouter에서 새로 가져오기
            console.log('[Worker] Cache miss - Fetching from OpenRouter');

            const apiKey = env.OPENROUTER_API_KEY;
            if (!apiKey || apiKey === 'sk-or-v1-YOUR_OPENROUTER_KEY_HERE') {
                throw new Error('OpenRouter API key not configured');
            }

            const rawModels = await fetchModelsFromOpenRouter(apiKey);

            // 3. 모델 분류
            const dynamicModels = classifyModels(rawModels);

            // 4. 정적 모델과 병합
            const staticModels = getStaticModels();
            const mergedModels = mergeModels(staticModels, dynamicModels);

            // 5. 캐시 저장
            const dataToCache = {
                models: mergedModels
            };
            await setCachedData(env, dataToCache);

            // 6. 응답
            return new Response(JSON.stringify({
                success: true,
                models: mergedModels,
                timestamp: Date.now(),
                cached: false,
                totalModels: Object.values(mergedModels).reduce((sum, arr) => sum + arr.length, 0)
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });

        } catch (error) {
            console.error('[Worker] Error:', error);

            return new Response(JSON.stringify({
                success: false,
                error: error.message,
                timestamp: Date.now()
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    },
};
