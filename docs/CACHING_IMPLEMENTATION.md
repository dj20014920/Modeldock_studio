# AI Provider별 캐싱 및 토큰 절약 기능 구현 현황

> 📅 최종 업데이트: 2025년 12월 1일  
> 🔍 공식 문서 기반 검증 완료

## 📊 Provider별 캐싱 지원 현황 요약

| Provider | 캐싱 방식 | 구현 상태 | 비용 절감 | 최소 토큰 |
|----------|-----------|-----------|-----------|-----------|
| **OpenAI** | ✅ 자동 | ✅ 완료 | 50~75% | 1,024 |
| **Anthropic** | ⚙️ 명시적 | ✅ 구현됨 | 90% | 1,024~4,096 |
| **Google Gemini** | ✅ 암시적 (2.5+) | ✅ 자동 지원 | 75% | 1,024~4,096 |
| **DeepSeek** | ✅ 자동 | ✅ 완료 | 90% | 64 |
| **xAI (Grok)** | ✅ 자동 | ✅ 완료 | 75% | - |
| **Mistral AI** | ❌ 미지원 | N/A | - | - |
| **Qwen (Alibaba)** | ❌ 미지원 | N/A | - | - |
| **Kimi (Moonshot)** | ✅ 자동 | ✅ 완료 | 자동 | - |
| **OpenRouter** | ⚡ 통합 | ✅ 구현됨 | Provider별 | - |

---

## 1. OpenAI

### 캐싱 방식
- **자동 캐싱** (Automatic Prompt Caching)
- 코드 변경 불필요

### 공식 문서
- https://platform.openai.com/docs/guides/prompt-caching

### 가격 정책
| 항목 | 가격 |
|------|------|
| 캐시 쓰기 | 무료 |
| 캐시 읽기 | 0.25x ~ 0.50x (모델별 상이) |

### 지원 모델
- GPT-4o, GPT-4o mini
- o1-preview, o1-mini
- GPT-4 Turbo

### 요구사항
- 최소 **1,024 토큰** 이상 프롬프트

### 구현 상태
```
✅ 자동 지원 - 추가 코드 불필요
```

---

## 2. Anthropic (Claude)

### 캐싱 방식
- **명시적 캐싱** (`cache_control` 속성 필수)
- 코드에서 명시적으로 캐시 브레이크포인트 지정 필요

### 공식 문서
- https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching

### 가격 정책
| 항목 | 가격 |
|------|------|
| 캐시 쓰기 | 1.25x (5분 TTL) |
| 캐시 읽기 | 0.1x (**90% 절감**) |
| 1시간 캐시 쓰기 | 2.0x |

### 지원 모델
- Claude Opus 4.5, 4.1, 4
- Claude Sonnet 4.5, 4, 3.7
- Claude Haiku 4.5, 3.5, 3
- Claude Opus 3

### 최소 토큰 요구사항
| 모델 | 최소 토큰 |
|------|-----------|
| Claude Opus 4.5 | 4,096 |
| Claude Sonnet/Opus 4.x | 1,024 |
| Claude Haiku 4.5 | 4,096 |
| Claude Haiku 3.5/3 | 2,048 |

### 구현 상태 ✅
```typescript
// byokService.ts - AnthropicAdapter.callAPI()

// 시스템 프롬프트에 cache_control 추가
body.system = [
    {
        type: 'text',
        text: params.systemPrompt,
        cache_control: { type: 'ephemeral' }
    }
];

// 마지막 메시지에 cache_control 추가 (20블록 lookback 보장)
body.messages = filteredHistory.map((m, index) => {
    const isLastMessage = index === filteredHistory.length - 1;
    if (isLastMessage) {
        return {
            role: m.role,
            content: [
                {
                    type: 'text',
                    text: convertedContent,
                    cache_control: { type: 'ephemeral' }
                }
            ]
        };
    }
    return { role: m.role, content: convertedContent };
});
```

### 캐시 확인 방법
응답의 `usage` 필드에서:
- `cache_read_input_tokens`: 캐시에서 읽은 토큰 수
- `cache_creation_input_tokens`: 캐시에 기록된 토큰 수

---

## 3. Google Gemini

### 캐싱 방식
- **암시적 캐싱** (Gemini 2.5 모델 자동 지원)
- **명시적 캐싱** (cachedContent API 사용 가능)

### 공식 문서
- https://ai.google.dev/gemini-api/docs/caching

### 가격 정책
| 항목 | 가격 |
|------|------|
| 캐시 쓰기/저장 | 무료 (암시적) |
| 캐시 읽기 | 0.25x |

### 암시적 캐싱 지원 모델 (2025년 5월 8일부터)
| 모델 | 최소 토큰 |
|------|-----------|
| Gemini 2.5 Flash | 1,024 |
| Gemini 2.5 Pro | 4,096 |
| Gemini 3 Pro Preview | 2,048 |

### 구현 상태
```
✅ 암시적 캐싱 자동 지원
✅ 명시적 캐싱 (cache_control) 추가 지원 (OpenRouterAdapter)
```

### 암시적 캐시 히트 최적화 팁
1. 프롬프트 시작 부분에 크고 공통적인 콘텐츠 배치
2. 짧은 시간 내에 유사한 prefix를 가진 요청 전송

---

## 4. DeepSeek

### 캐싱 방식
- **자동 캐싱** (Context Caching on Disk)
- 기본 활성화, 코드 변경 불필요

### 공식 문서
- https://api-docs.deepseek.com/guides/kv_cache

### 가격 정책
| 항목 | 가격 (백만 토큰당) |
|------|-------------------|
| 캐시 히트 | ¥0.1 (약 $0.014) |
| 캐시 미스 | ¥1.0 (약 $0.14) |

### 캐싱 원리
- **64 토큰** 단위로 캐싱
- **Prefix 매칭**: 이전 요청과 동일한 prefix 부분만 캐시 히트
- 캐시 구축에 수 초 소요
- 사용하지 않으면 수 시간~수 일 후 자동 삭제

### 캐시 히트 예시
```
첫 번째 요청:
messages: [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "What is the capital of China?"}
]

두 번째 요청:
messages: [
    {"role": "system", "content": "You are a helpful assistant"},  ← 캐시 히트
    {"role": "user", "content": "What is the capital of China?"},   ← 캐시 히트
    {"role": "assistant", "content": "Beijing."},
    {"role": "user", "content": "What about the USA?"}              ← 새로 처리
]
```

### 캐시 확인 방법
응답의 `usage` 필드에서:
- `prompt_cache_hit_tokens`: 캐시 히트 토큰 수
- `prompt_cache_miss_tokens`: 캐시 미스 토큰 수

### 구현 상태
```
✅ 자동 지원 - 추가 코드 불필요
```

---

## 5. xAI (Grok)

### 캐싱 방식
- **자동 캐싱**
- 코드 변경 불필요

### 공식 문서
- https://docs.x.ai/docs (캐싱 상세 문서 별도 없음)
- OpenRouter 문서에서 확인: https://openrouter.ai/docs/features/prompt-caching

### 가격 정책
| 항목 | 가격 |
|------|------|
| 캐시 쓰기 | 무료 |
| 캐시 읽기 | 0.25x |

### 구현 상태
```
✅ 자동 지원 - 추가 코드 불필요
```

---

## 6. Mistral AI

### 캐싱 방식
- **❌ 미지원**

### 공식 문서
- https://docs.mistral.ai/api/
- OpenRouter 문서: https://openrouter.ai/docs/features/prompt-caching

### 확인 결과
- API 문서에 캐싱 관련 파라미터 또는 기능 없음
- 표준 OpenAI 호환 API만 지원
- `frequency_penalty`, `presence_penalty` 등 기본 파라미터만 지원

### 구현 상태
```
❌ 캐싱 미지원 - 향후 공식 지원 시 업데이트 예정
```

---

## 7. Qwen (Alibaba)

### 캐싱 방식
- **❌ 미지원**

### 공식 문서
- https://www.alibabacloud.com/help/en/model-studio/developer-reference/use-qwen-by-calling-api

### 확인 결과
- DashScope API 문서에 캐싱 관련 내용 없음
- `enable_thinking`, `thinking_budget` 등 추론 기능만 지원
- `cached_tokens` 필드가 응답에 존재하지만, 명시적 캐싱 API 없음

### 구현 상태
```
❌ 캐싱 미지원 - 향후 공식 지원 시 업데이트 예정
```

---

## 8. Kimi (Moonshot)

### 캐싱 방식
- **자동 캐싱**
- 코드 변경 불필요

### 공식 문서
- https://platform.moonshot.cn/docs (중국어)
- OpenRouter 문서: https://openrouter.ai/docs/features/prompt-caching

### 가격 정책
- 캐시 쓰기: 무료
- 캐시 읽기: 할인 (정확한 비율 미공개)

### 구현 상태
```
✅ 자동 지원 - 추가 코드 불필요
```

---

## 9. OpenRouter

### 캐싱 방식
- **통합 캐싱 지원**
- Provider별 캐싱 방식 자동 적용
- Anthropic 및 Gemini 모델: `cache_control` 명시적 전달 필요

### 공식 문서
- https://openrouter.ai/docs/features/prompt-caching

### 지원 Provider별 캐싱
| Provider | 방식 | 캐시 읽기 가격 |
|----------|------|---------------|
| OpenAI | 자동 | 0.25x~0.50x |
| Anthropic | 명시적 | 0.1x |
| DeepSeek | 자동 | 0.1x |
| Google Gemini | 암시적/명시적 | 0.25x |
| Grok | 자동 | 0.25x |
| Moonshot | 자동 | 할인 |
| Groq | 자동 (Kimi K2) | 할인 |

### 구현 상태 ✅
```typescript
// byokService.ts - OpenRouterAdapter.callAPI()

// 명시적 캐싱이 필요한 모델 확인 (Anthropic, Google Gemini)
const isExplicitCacheModel = params.variant.startsWith('anthropic/') || 
                           params.variant.includes('claude') ||
                           params.variant.startsWith('google/') ||
                           params.variant.includes('gemini');

if (isExplicitCacheModel) {
    // 시스템 프롬프트에 cache_control 추가
    messages.unshift({
        role: 'system',
        content: [
            {
                type: 'text',
                text: params.systemPrompt,
                cache_control: { type: 'ephemeral' }
            }
        ]
    });
    
    // 마지막 사용자 메시지에 cache_control 추가
    if (isLastUserMessage) {
        messages.push({
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: msg.content,
                    cache_control: { type: 'ephemeral' }
                }
            ]
        });
    }
}

// 캐시 디스카운트 로깅
if (data.usage?.cache_discount) {
    console.log(`[BYOK] 💰 OpenRouter cache discount: ${data.usage.cache_discount}%`);
}
```

### 캐시 확인 방법
1. Activity 페이지에서 detail 버튼 클릭
2. `/api/v1/generation` API 사용
3. 요청에 `usage: {include: true}` 추가하여 `cache_discount` 필드 확인

---

## 💰 멀티턴 대화 비용 절감 효과

### 시뮬레이션: 10턴 대화 (총 10,000 입력 토큰 가정)

| Provider | 캐싱 없음 | 캐싱 적용 | 절감률 | 절감액 |
+|----------|-----------|-----------|--------|--------|
| **Anthropic Claude 3.5 Sonnet** | $0.030 | $0.003 | **90%** | $0.027 |
| **OpenAI GPT-4o** | $0.025 | $0.0125 | **50%** | $0.0125 |
| **DeepSeek V3** | $0.0027 | $0.00027 | **90%** | $0.00243 |
| **Google Gemini 2.5 Pro** | $0.0125 | $0.003125 | **75%** | $0.009375 |

### 월간 비용 절감 예시 (일 1,000 대화 기준)

| Provider | 월 비용 (캐싱 없음) | 월 비용 (캐싱) | 월 절감액 |
|----------|---------------------|----------------|-----------|
| **Anthropic** | $900 | $90 | **$810** |
| **OpenAI** | $750 | $375 | **$375** |
| **DeepSeek** | $81 | $8.1 | **$72.9** |

---

## 🔧 개발자 가이드

### 캐싱 최적화 Best Practices

1. **시스템 프롬프트 최적화**
   - 고정 시스템 프롬프트는 가능한 길게 유지
   - 변경이 적은 컨텍스트를 앞부분에 배치

2. **메시지 구조 최적화**
   - 변경되지 않는 대화 히스토리는 prefix로 유지
   - 동적 콘텐츠는 메시지 끝부분에 배치

3. **캐시 TTL 관리**
   - Anthropic: 5분 TTL (사용 시 자동 갱신)
   - 장시간 세션은 주기적으로 캐시 갱신 요청

4. **모니터링**
   - 응답의 `usage` 필드에서 캐시 히트율 확인
   - OpenRouter의 `cache_discount` 필드 모니터링

### 트러블슈팅

#### 캐시가 작동하지 않는 경우
1. 최소 토큰 요구사항 확인
2. 프롬프트 prefix가 정확히 일치하는지 확인
3. 캐시 TTL(5분) 내에 요청하는지 확인
4. 지원 모델인지 확인

#### Anthropic 캐시 오류
- `cache_control`은 `text` 타입 블록에만 추가 가능
- 최대 4개의 cache breakpoint만 허용
- thinking blocks에는 직접 캐시 불가

---

## 📚 참고 링크

- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching)
- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)
- [Google Gemini Context Caching](https://ai.google.dev/gemini-api/docs/caching)
- [DeepSeek Context Caching](https://api-docs.deepseek.com/guides/kv_cache)
- [OpenRouter Prompt Caching](https://openrouter.ai/docs/features/prompt-caching)

---

## 📝 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2025-12-01 | 최초 문서 작성, 모든 Provider 공식 문서 검증 완료 |
| 2025-12-01 | Google Gemini 명시적 캐싱 지원 추가 (OpenRouterAdapter) |
