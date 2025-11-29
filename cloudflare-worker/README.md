# ModelDock Studio - BYOK Proxy Server

Cloudflare Workers 기반 모델 리스트 캐싱 프록시 서버입니다.

## 📌 주요 기능

- **OpenRouter API 통합**: 6시간마다 최신 모델 리스트 자동 갱신
- **R2 스토리지 캐싱**: 효율적인 캐싱으로 API 호출 최소화
- **제공자별 자동 분류**: Claude, Grok, OpenAI, Gemini 등 자동 분류
- **인기순 정렬**: OpenRouter 인기 랭킹 기반 정렬
- **정적/동적 모델 병합**: 최신 모델 + 큐레이션된 모델

## 🚀 배포 방법

### 1. Cloudflare 계정 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. Workers & Pages 섹션으로 이동

### 2. R2 버킷 생성

```bash
# Cloudflare Dashboard에서 R2 섹션으로 이동
# "Create bucket" 클릭
# Bucket name: modeldock-models-cache
```

### 3. Wrangler CLI 설치 및 로그인

```bash
npm install -g wrangler
wrangler login
```

### 4. 환경 변수 설정

`wrangler.toml` 파일에서 OpenRouter API 키 설정:

```toml
[vars]
OPENROUTER_API_KEY = "sk-or-v1-YOUR_ACTUAL_KEY"
```

**중요**: 실제 OpenRouter API 키로 교체하세요!

### 5. Worker 배포

```bash
cd cloudflare-worker
wrangler deploy
```

배포 완료 후 Worker URL이 출력됩니다:
```
https://modeldock-byok-proxy.YOUR_SUBDOMAIN.workers.dev
```

### 6. 테스트

```bash
curl https://modeldock-byok-proxy.YOUR_SUBDOMAIN.workers.dev/models
```

## 📊 API 엔드포인트

### GET /models

**응답 예시**:
```json
{
  "success": true,
  "models": {
    "openai": [...],
    "anthropic": [...],
    "google": [...],
    "xai": [...],
    "deepseek": [...],
    "mistral": [...],
    "qwen": [...],
    "kimi": [...]
  },
  "timestamp": 1732723200000,
  "cached": true,
  "age": 120
}
```

**필드 설명**:
- `success`: 요청 성공 여부
- `models`: 제공자별 모델 리스트
- `timestamp`: 데이터 타임스탬프
- `cached`: 캐시에서 제공되었는지 여부
- `age`: 캐시 나이 (분 단위)

## 🔧 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `CACHE_TTL_HOURS` | 캐시 유지 시간 (시간) | 6 |
| `OPENROUTER_API_KEY` | OpenRouter API 키 | (필수) |

## 📦 R2 버킷 구조

```
modeldock-models-cache/
└── models-cache-v1.json
    {
      "models": { ... },
      "timestamp": 1732723200000
    }
```

## 🔒 보안

- API 키는 Worker 환경 변수에만 저장됨
- 클라이언트에는 절대 노출되지 않음
- CORS 활성화로 브라우저에서 안전하게 호출 가능

## 🎯 캐싱 전략

1. **최초 호출**: OpenRouter API 호출 → R2 저장 → 응답
2. **6시간 이내 재호출**: R2 캐시에서 즉시 응답
3. **6시간 경과 후**: OpenRouter API 재호출 → 캐시 갱신 → 응답

## 📝 모델 분류 로직

```javascript
// Claude 존
if (model.id.startsWith('anthropic/')) { ... }

// Grok 존
if (model.id.startsWith('x-ai/')) { ... }

// OpenAI 존
if (model.id.startsWith('openai/')) { ... }
```

## 🔄 업데이트

Worker 코드 수정 후:
```bash
wrangler deploy
```

R2 캐시 수동 삭제 (필요 시):
```bash
wrangler r2 object delete modeldock-models-cache/models-cache-v1.json
```

## 💰 비용 예상

**Cloudflare Workers** (무료 플랜):
- 100,000 요청/일
- 10ms CPU 시간/요청

**R2 스토리지** (무료 플랜):
- 10GB 저장 공간
- 10M 읽기/월

**OpenRouter API**:
- 하루 4회 호출 (6시간마다)
- 월 ~120회 호출
- 무료 (모델 리스트 조회)

## 📞 문의

문제가 발생하면 GitHub Issues로 제보해주세요.
