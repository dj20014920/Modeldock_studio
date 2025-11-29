# BYOK 프록시 서버 배포 가이드

## 📋 전체 아키텍처

```
사용자 브라우저
    ↓
프론트엔드 (Chrome Extension)
    ↓
Cloudflare Worker (프록시 서버)
    ↓
R2 스토리지 (6시간 캐싱)
    ↓
OpenRouter API
```

## 🎯 핵심 기능

1. **6시간 자동 캐싱**: 마지막 호출 후 6시간 경과 시에만 OpenRouter API 재호출
2. **제공자별 자동 분류**: Claude, Grok, OpenAI, Gemini, DeepSeek 등 자동 분류
3. **인기순 정렬**: OpenRouter 랭킹 기반 정렬
4. **API 키 보호**: 개발자 API 키는 서버에만 저장, 클라이언트 노출 없음

---

## 🚀 1단계: Cloudflare Worker 배포

### 1.1 Cloudflare 계정 설정

1. [Cloudflare Dashboard](https://dash.cloudflare.com) 접속
2. Workers & Pages 섹션으로 이동

### 1.2 R2 버킷 생성

```bash
# Cloudflare Dashboard → R2 섹션
# "Create bucket" 클릭
# Bucket name: modeldock-models-cache
# Location: Automatic (권장)
```

### 1.3 Wrangler CLI 설치

```bash
# Wrangler 전역 설치
npm install -g wrangler

# Cloudflare 로그인
wrangler login
```

### 1.4 환경 변수 설정

`cloudflare-worker/wrangler.toml` 파일 수정:

```toml
[vars]
CACHE_TTL_HOURS = 6
OPENROUTER_API_KEY = "sk-or-v1-실제_키로_교체하세요"
```

**⚠️ 중요**: 실제 OpenRouter API 키로 반드시 교체하세요!

### 1.5 Worker 배포

```bash
cd cloudflare-worker
wrangler deploy
```

**배포 성공 시 출력 예시**:
```
✨  Success! Uploaded 1 file (23.4 KB)
📦  Uploaded https://modeldock-byok-proxy.YOUR_SUBDOMAIN.workers.dev
```

---

## 🔧 2단계: 프론트엔드 설정

### 2.1 프록시 URL 설정

`src/services/byokService.ts` 파일에서 프록시 URL 수정:

```typescript
// 787번 라인 근처
const PROXY_URL = 'https://modeldock-byok-proxy.YOUR_SUBDOMAIN.workers.dev/models';
```

**실제 Worker URL로 교체하세요!**

### 2.2 빌드 및 테스트

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build
```

---

## 🧪 3단계: 테스트

### 3.1 프록시 서버 테스트

```bash
# 직접 호출 테스트
curl https://modeldock-byok-proxy.YOUR_SUBDOMAIN.workers.dev/models

# 예상 응답 (JSON)
{
  "success": true,
  "models": {
    "openai": [...],
    "anthropic": [...],
    "google": [...],
    ...
  },
  "timestamp": 1732723200000,
  "cached": false,
  "totalModels": 250
}
```

### 3.2 UI 테스트

1. Chrome Extension 로드
2. 설정 → BYOK 열기
3. 우측 상단 "Refresh All" 버튼 클릭
4. 콘솔에서 로그 확인:
   ```
   [BYOK] Fetching models from proxy server...
   [BYOK] Successfully fetched models from proxy
   [BYOK] Cache age: 0 minutes
   [BYOK] Total models: 250
   ```

---

## 📊 4단계: 모니터링

### 4.1 Cloudflare Worker 로그

```bash
# 실시간 로그 확인
wrangler tail
```

### 4.2 주요 로그 메시지

```
[Cache] Hit - Age: 120 minutes         → 캐시 히트
[Cache] Expired - Age: 361 minutes     → 캐시 만료
[OpenRouter] Fetching models...         → API 호출 시작
[OpenRouter] Fetched 250 models        → API 호출 성공
[Cache] Saved - Models: 9              → 캐시 저장 완료
```

### 4.3 R2 스토리지 확인

```bash
# 캐시 파일 확인
wrangler r2 object get modeldock-models-cache/models-cache-v1.json
```

---

## 🔄 5단계: 캐시 관리

### 5.1 수동 캐시 삭제

```bash
# 캐시 강제 갱신 (긴급 시)
wrangler r2 object delete modeldock-models-cache/models-cache-v1.json

# 다음 요청 시 자동으로 재생성됨
```

### 5.2 TTL 조정

`wrangler.toml`에서 캐시 유지 시간 변경:

```toml
[vars]
CACHE_TTL_HOURS = 12  # 6시간 → 12시간으로 변경
```

변경 후 재배포:
```bash
wrangler deploy
```

---

## 💰 비용 예상 (무료 플랜 기준)

### Cloudflare Workers
- **요청 수**: 100,000/일 (무료)
- **CPU 시간**: 10ms/요청 (무료)
- **예상 사용량**: ~50 요청/일

### R2 스토리지
- **저장 공간**: 10GB (무료)
- **읽기**: 10M/월 (무료)
- **쓰기**: 1M/월 (무료)
- **예상 사용량**: ~50 KB 저장, ~200 읽기/월

### OpenRouter API
- **모델 리스트 조회**: 무료
- **호출 빈도**: 하루 4회 (6시간마다)
- **월 호출 수**: ~120회

**결론**: 모두 무료 플랜 내에서 충분히 운영 가능!

---

## 🔒 보안 체크리스트

- [ ] OpenRouter API 키를 `wrangler.toml`에만 저장 (GitHub에 절대 커밋 금지)
- [ ] `.gitignore`에 `wrangler.toml` 추가
- [ ] 프론트엔드 코드에는 API 키 없음
- [ ] CORS 헤더 올바르게 설정됨
- [ ] 프록시 URL이 HTTPS임

---

## ❓ FAQ

### Q1. "OpenRouter API Error: 401" 발생 시?
A: `wrangler.toml`의 API 키를 확인하세요. 올바른 형식: `sk-or-v1-...`

### Q2. 캐시가 업데이트되지 않음?
A:
```bash
# 캐시 수동 삭제
wrangler r2 object delete modeldock-models-cache/models-cache-v1.json
```

### Q3. 프론트엔드에서 "Failed to fetch from proxy" 에러?
A:
1. 프록시 URL이 올바른지 확인
2. Worker가 정상 배포되었는지 확인: `wrangler deployments list`
3. CORS 설정 확인

### Q4. 모델 리스트가 너무 많음?
A: Worker 코드 수정 (`src/index.js`):
```javascript
// Top 50 모델만 유지
if (classified[providerKey].length > 50) {
    classified[providerKey] = classified[providerKey].slice(0, 50);
}
```

---

## 📞 지원

문제가 발생하면:
1. Worker 로그 확인: `wrangler tail`
2. 브라우저 콘솔 확인 (F12)
3. GitHub Issues에 제보

---

## 🎉 완료!

축하합니다! 이제 BYOK 시스템에서 동적 모델 리스트를 사용할 수 있습니다.

**다음 단계**:
1. 다양한 제공자들의 최신 모델 탐색
2. API 키 등록하여 실제 사용
3. 커스텀 파라미터 조정하여 최적화

즐거운 AI 개발 되세요! 🚀
