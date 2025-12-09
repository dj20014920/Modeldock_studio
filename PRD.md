# ModelDock Studio - 제품 요구사항 명세서 (PRD)

## 📋 개발 원칙 및 작업 규칙

### 🎯 핵심 마인드셋
> **"세계 1등 아키텍처, 세계 1등 리팩토링 마스터, 대형 대기업 프로젝트 총괄 관리자"**

### 🔍 작업 방법론

#### 1. Ultra Deep Thinking Mode
- **단계별 사고**: Chain-of-Thought 시스템 활용
- **다각도 검증**: 모든 가정을 3중 검증
- **자기 반박**: 각 단계마다 자신의 가정에 도전
- **완성 후 재검토**: 전체 추론 체인을 처음부터 다시 검토

#### 2. 코드베이스 전체 파악
```
모든 파일 위치/경로 → MCP + 터미널 + @agent + skills 활용
                  ↓
           심층 트리 탐색
                  ↓
         연관 부분 정보 수집
                  ↓
      전체 아키텍처 이해 후 작업 시작
```

#### 3. 최소 코드, 최대 효과
- **KISS 원칙**: Keep It Simple, Stupid
- **DRY 원칙**: Don't Repeat Yourself (비슷한 로직의 산재 금지)
- **YAGNI 원칙**: You Ain't Gonna Need It
- **SOLID 원칙**: 객체 지향 설계 5대 원칙 준수

#### 4. 작업 프로세스
1. **Todo List 작성**: 세부 테스크 분할, 누락 방지
2. **빌드 테스트**: 작업 후 직접 빌드 실행
3. **근본 원인 해결**: "두더지 잡기"식 오류 수정 금지
4. **명료한 코드**: 누가 읽어도 이해 가능한 코드 + 주석
5. **스텁/주석 처리 금지**: 단순 빌드 성공 목적의 임시 처리 엄금

#### 5. 품질 검증
- **2중 3중 검토**: 작업 완료 후 스스로 의심하고 검토
- **반증 시도**: 자신의 구현에 대한 반박 시도
- **완전무결성 확인**: 모든 부분이 완벽하게 구현되었는지 확인

---

## 1. 프로젝트 개요
사용자가 이미 구독/로그인하거나 무료 티어의 계정을 이용하여 공식 AI 웹사이트(ChatGPT, Claude, Gemini, Grok, Perplexity, Qwen(通义千问), DeepSeek, Kimi, Mistral, OpenRouter, LM Arena 등)를 한 화면에 모아 사용하도록 구성한다. 프롬프트 템플릿 + 수동 수집 + 온보딩 가이드를 제공한다.

### 1.1 핵심 차별점

**이중 하이브리드 모델 로딩 시스템**

기존 멀티 AI 플랫폼들과 달리, ModelDock Studio는 정적 모델 리스트가 아닌 **실시간 동적 모델 목록 관리**를 구현:

1. **Cloudflare Worker 프록시 캐싱** (1차 레이어)
   - OpenRouter API 연동으로 200+ 모델 실시간 동기화
   - R2 스토리지 기반 6시간 TTL 캐싱
   - 제공자별 자동 분류 및 인기순 정렬

2. **사용자 API 키 기반 직접 조회** (2차 레이어)
   - 사용자가 자신의 API 키 입력 시
   - 각 제공자의 `/models` 엔드포인트로 직접 HTTP 요청
   - 계정별 실제 이용 가능 모델만 표시

**결과**: 새 모델 출시 즉시 사용 가능 (하드코딩 불필요)

### 1.2 지원 제공자 (2025년 12월 기준)

| 제공자 | iframe | API(BYOK) | 동적 로딩 | 모델 엔드포인트 |
|--------|--------|-----------|-----------|-----------------|
| OpenAI | ✅ | ✅ | ✅ | `/v1/models` |
| Anthropic | ✅ | ✅ | ✅ | `/v1/models` |
| Google | ✅ | ✅ | ✅ | `/v1beta/models` |
| DeepSeek | ✅ | ✅ | ✅ | `/v1/models` |
| xAI (Grok) | ✅ | ✅ | ✅ | `/v1/models` |
| Mistral | ✅ | ✅ | ✅ | `/v1/models` |
| Qwen | ✅ | ✅ | ✅ | `/compatible-mode/v1/models` |
| Kimi | ✅ | ✅ | ✅ | `/v1/models` |
| Perplexity | ✅ | ✅ | ✅ | `/models` |
| OpenRouter | ✅ | ✅ | ✅ | `/api/v1/models` |
| LM Arena | ✅ | - | - | (블라인드 테스트 전용) |
### 1.3 아키텍처 목표

**프록시 탭 모드 절대 금지**: 사용자경험증대 목적으로 프록시 탭 방식 우회

---

## 2. 기능 상세 명세

### 2.1 다중 AI 모델 지원 시스템

#### 2.1.1 모델 로딩 아키텍처

**이중 하이브리드 방식**:

```typescript
// Phase 1: Cloudflare Worker 캐시 조회
const cachedModels = await fetch('https://worker.domain/api/models');

// Phase 2: 사용자 API 키로 직접 조회
const userModels = await fetch(`${provider.apiEndpoint}/models`, {
  headers: { Authorization: `Bearer ${userApiKey}` }
});

// Merge & Display
const availableModels = [...cachedModels, ...userModels]
  .filter(unique)
  .sort(byPopularity);
```

#### 2.1.2 지원 방식

| 방식 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **iframe** | 공식 웹사이트 임베딩 | 무료, UI 동일 | 제한적 제어 |
| **BYOK API** | 사용자 API 키 사용 | 완전한 제어, 커스터마이징 | 유료 |
| **하이브리드** | 사용자 선택 | 유연성 최대화 | 복잡도 증가 |

#### 2.1.3 모델 선택 UX

- **Sidebar**: 11개 제공자 아이콘 그리드
- **모달 선택**: BYOK 모델 드롭다운 (동적 로딩)
- **Main Brain 지정**: 우측 고정 패널로 시각적 강조
4. **BrainFlow™**: AI 모델 간 협업 추론 엔진

### 1.4 주요 기능 명세

| 기능 | 설명 | 구현 방식 |
|------|------|-----------|
| **멀티 모델 그리드** | 최대 10개 모델 동시 실행 | React Grid + iframe 샌드박스 |
| **BrainFlow™** | 3단계 Chain-of-Thought | ChainOrchestrator (625 lines) |
| **BYOK 시스템** | 10개 제공자 API 통합 | Polymorphic Adapter (2,253 lines) |
| **Side Panel** | Chrome 사이드 패널 모드 | SidePanelApp.tsx |
| **프롬프트 라이브러리** | 무제한 저장 (IndexedDB) | PromptLibrary.tsx |
| **히스토리 관리** | 자동 저장 (2초 디바운스) | HistoryService + BYOKHistoryService |
| **쿠키 동기화** | iframe 로그인 상태 유지 | Cookie Partitioning (background.js) |
| **다국어 지원** | 14개 언어 | i18next |

⸻

기능 및 구성
2.1 다중 AI 모델 지원 및 선택 • 지원 모델 (2025-01-04 기준): • iframe 내장 방식: ChatGPT, Claude, Gemini, DeepSeek, Qwen, Grok, LM Arena, Kimi, Mistral, OpenRouter • API 방식: ChatGPT API, Claude API, Gemini API, DeepSeek API, Perplexity API, Grok API • 하이브리드 방식: 사용자가 Webapp 또는 API 모드를 선택 가능 • 로그인 계정을 통해 구독한 모델을 기반으로 선택할 수 있으며, 무료 사용자는 일부 모델만 선택 가능. • 수동 복사/붙여넣기 방식과 자동 라우팅 방식을 토글식으로 선택 가능. • 사용자가 모델에 입력한 프롬프트를 직접 복사하여 붙여넣기 또는 자동 라우팅을 통해 전달.

•    **최근 추가된 모델 (2025-01-04)**:
•    **Kimi (Moonshot AI)**: https://kimi.moonshot.cn - iframe 방식, 긴 문맥 처리 특화
•    **Mistral**: https://chat.mistral.ai/chat - iframe 방식, Le Chat 브랜딩
•    **OpenRouter**: https://openrouter.ai/chat - iframe 방식, 다중 모델 라우터
### 2.2 BrainFlow™ 협업 추론 엔진

#### 2.2.1 아키텍처 개요

**3단계 Chain-of-Thought 프로세스** (`chain-orchestrator.ts`, 625 lines):

```
Phase 1: 전략 수립 (Main Brain)
   ↓
Goal → Main Brain → 슬레이브별 작업 지시 생성
   ↓
[SLAVE:grok-1] "시장 조사 수행"
[SLAVE:claude-1] "리스크 분석"
[SLAVE:gemini-1] "기술 검증"

Phase 2: 병렬 실행 (Slaves)
   ↓
Promise.all([
  sendToSlave(grok, task1),
  sendToSlave(claude, task2),
  sendToSlave(gemini, task3)
])
   ↓
결과 수집 (Skip/Cancel 지원)

Phase 3: 종합 (Main Brain)
   ↓
수집된 응답 → Main Brain → 최종 보고서
```

#### 2.2.2 핵심 알고리즘

1. **슬레이브 프롬프트 파싱** (Regex):
   ```typescript
   const pattern = /\[SLAVE:(.+?)\]([\s\S]+?)(?=\[SLAVE:|$)/g;
   const matches = planResponse.matchAll(pattern);
   ```

2. **적응형 완료 감지** (content.js):
   ```javascript
   const signals = {
     stopButton: exists('[data-testid="stop"]'),
     inputEnabled: !input.disabled,
     actionButtons: exists('[role="button"]')
   };
   ```

3. **Skip/Cancel 메커니즘**:
   - Skip: 현재까지 수집된 응답으로 Phase 3 진행
   - Cancel: 즉시 중단, 정리 작업 수행

### 2.3 BYOK (Bring Your Own Key) 시스템

#### 2.3.1 폴리모픽 어댑터 패턴

**구조** (`byokService.ts`, 2,253 lines):

```typescript
// 추상 베이스
abstract class AbstractBYOKAdapter {
  abstract callAPI(params: APICallParams): Promise<APIResponse>;
  abstract listModels(apiKey: string): Promise<BYOKRawModel[]>;
  
  async validateKey(apiKey: string): Promise<boolean> {
    // 3단계 검증 전략
    // 1. /models 엔드포인트 (가장 저렴)
    // 2. fetchModels() (메타데이터 풍부)
    // 3. 초경량 completion (maxTokens=1)
  }
}

// 제공자별 구현
class OpenAIAdapter extends AbstractBYOKAdapter { ... }
class AnthropicAdapter extends AbstractBYOKAdapter { ... }
// ... 10개 어댑터
```

#### 2.3.2 지원 기능

| 기능 | 설명 | 구현 위치 |
|------|------|-----------|
| **스트리밍** | Server-Sent Events | `handleStreamResponse()` |
| **이미지 입력** | Vision 모델 지원 | `MessageContentPart[]` |
| **Reasoning** | DeepSeek R1, o1 | `reasoning`, `reasoningDetails` |
| **고급 샘플링** | temperature, top_p, top_k 등 | `APICallParams` |
| **3단계 키 검증** | 비용 최소화 | `validateKey()` |

#### 2.3.3 Cloudflare Worker 프록시

**역할**:
- OpenRouter API 호출 대행
- R2 스토리지 캐싱 (6시간 TTL)
- 제공자별 자동 분류

**구현** (`cloudflare-worker/src/index.js`, 492 lines):

```javascript
export default {
  async fetch(request, env) {
    const cached = await getCachedData(env);
    if (cached && !isExpired(cached)) return cached;
    
    const fresh = await fetchFromOpenRouter(env.OPENROUTER_API_KEY);
    const classified = classifyByProvider(fresh);
    await setCachedData(env, classified);
    
    return jsonResponse(classified);
  }
};
```

### 2.4 프롬프트 라이브러리

**기능**:
- IndexedDB 기반 무제한 저장
- 카테고리별 분류
- 원터치 주입 (모든 모델에 동시 적용)
- Import/Export (JSON)

**구현**: `PromptLibrary.tsx`

### 2.5 하이브리드 라우팅 시스템

#### 2.5.1 수동 모드 (기본값)

**플로우**:
```
User → ChatMessageInput → [복사] 버튼
                              ↓
                       클립보드 복사
                              ↓
                    각 모델에 수동 붙여넣기
```

**장점**:
- 법적 리스크 제로
- 봇 감지 우회
- 100% 안전

#### 2.5.2 자동 라우팅 모드 (옵션)

**플로우**:
```
User → ChatMessageInput → [자동 전송] 버튼
                              ↓
                    chrome.scripting.executeScript
                              ↓
                    content.js (DOM 주입)
                              ↓
                    ai_model_dom_selectors.json 참조
                              ↓
                    각 모델의 입력창에 자동 삽입
```

**리스크 고지**:
```typescript
const WARNING = `
⚠️ 자동 라우팅 모드 활성화 시 주의사항:
- 일부 AI 제공자는 자동화된 입력을 봇으로 간주할 수 있습니다
- 계정 제한 또는 차단의 위험이 있을 수 있습니다
- BYOK API 사용 시에는 이러한 리스크가 없습니다

계속 진행하시겠습니까?
`;
```

**구현**: `content.js` (5,123 lines)
- MonitorFactory 패턴
- 모델별 커스텀 모니터
- 적응형 완료 감지

### 2.6 API 키 관리 시스템

#### 2.6.1 저장 방식

```typescript
// chrome.storage.local (OS 수준 암호화)
const settings: BYOKSettings = {
  enabled: true,
  providers: {
    openai: {
      apiKey: 'sk-proj-xxx', // 평문 저장 (Chrome 자체 암호화)
      selectedVariants: ['gpt-4o']
    }
  }
};

await chrome.storage.local.set({ byok_settings: settings });
```

#### 2.6.2 보안 원칙

1. **절대 서버 전송 금지**: 모든 API 호출은 클라이언트 → 제공자 직접 연결
2. **로컬 저장만**: chrome.storage.local + IndexedDB
3. **로깅 금지**: API 키는 절대 콘솔에 출력하지 않음

#### 2.6.3 사용량 추적

**향후 구현 예정** (현재 미지원):
```typescript
interface UsageTracking {
  providerId: string;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCost: number;
  timestamp: number;
}
```

### 2.7 Main Brain 시스템

#### 2.7.1 개념

사용자가 선택한 여러 모델 중 **하나를 "Main Brain"으로 지정**하여:
- 정보 취합 및 팩트 체크
- 최종 결론 도출
- 프롬프트 최적화
- BrainFlow 오케스트레이션

#### 2.7.2 UI/UX

**우측 고정 패널**:
- 리사이즈 가능 (드래그 바)
- 독립적 상태 관리
- 시각적 강조 (테두리, 아이콘)

**기능**:
- 대화 히스토리 요약
- 슬레이브 응답 비교
- 가이드 및 체크리스트

#### 2.7.3 구현

```typescript
// App.tsx
const [mainBrainInstanceId, setMainBrainInstanceId] = 
  usePersistentState<string | null>('md_main_brain', null);

// 우측 패널 렌더링
{mainBrainInstanceId && (
  <MainBrainPanel
    model={activeModels.find(m => m.instanceId === mainBrainInstanceId)}
    onClose={() => setMainBrainInstanceId(null)}
  />
)}
```

### 2.8 히스토리 관리

#### 2.8.1 자동 저장

**디바운스 전략** (2초):
```typescript
useEffect(() => {
  const saveTimer = setTimeout(async () => {
    const newId = await HistoryService.getInstance().saveConversation(
      currentConversationId,
      activeModels,
      mainBrainInstanceId
    );
    setCurrentConversationId(newId);
  }, 2000);
  
  return () => clearTimeout(saveTimer);
}, [activeModels, mainBrainInstanceId]);
```

#### 2.8.2 저장 위치

| 데이터 타입 | 저장소 | 이유 |
|-------------|--------|------|
| 설정 | chrome.storage.local | 빠른 동기화 |
| 히스토리 | IndexedDB | 대용량 지원 |
| API 키 | chrome.storage.local | OS 암호화 |
| 프롬프트 | IndexedDB | 무제한 저장 |

#### 2.8.3 분리된 히스토리

- **일반 히스토리**: `HistoryService`
- **BYOK 히스토리**: `BYOKHistoryService`

이유: BYOK는 추가 메타데이터 필요 (모델 variant, reasoning 등)

---

## 3. 보안 및 프라이버시

### 3.1 제로 서버 아키텍처

**원칙**: 사용자 데이터는 절대 중앙 서버로 전송하지 않음

```
사용자 입력 → React State → chrome.storage.local
                                    ↓
                              (영구 저장)
                                    ↓
모델 선택 → BYOK Service → 제공자 API (직접 HTTPS)
                ↓
          (로컬 응답 처리)
```

### 3.2 API 키 보호

| 계층 | 보호 방법 |
|------|-----------|
| **저장** | chrome.storage.local (OS 수준 암호화) |
| **전송** | HTTPS Only, 직접 제공자 연결 |
| **로깅** | 절대 콘솔 출력 금지 |
| **공유** | 절대 서버 전송 금지 |

### 3.3 샌드박스 격리

**iframe 샌드박스**:
```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-forms"
  src="https://chatgpt.com"
/>
```

**Content Script 권한 최소화**:
- 필요한 DOM 조작만
- 민감 정보 접근 불가

### 3.4 쿠키 파티셔닝

**배경**: iframe 내 로그인 상태 유지 필요

**구현** (`background.js`):
```javascript
// 일반 쿠키 → 파티션된 쿠키로 미러링
chrome.cookies.onChanged.addListener((changeInfo) => {
  if (!changeInfo.removed && !isPartitioned(changeInfo.cookie)) {
    mirrorCookieIntoPartition(changeInfo.cookie, {
      partitionKey: {
        topLevelSite: `chrome-extension://${chrome.runtime.id}`
      }
    });
  }
});
```

---

## 4. 법적 고려사항

### 4.1 오픈소스 라이선스

**기반**: ChatHub (MIT License)

**MIT 라이선스 준수**:
- ✅ 상업적 사용 가능
- ✅ 수정 및 배포 허용
- ⚠️ 라이선스 고지 필수
- ⚠️ 원저작자 명시 필수

### 4.2 법적 리스크 최소화

| 리스크 | 완화 전략 |
|--------|-----------|
| **자동화 감지** | 수동 모드 기본값, 자동 라우팅은 옵션 |
| **API 남용** | 사용자 본인의 API 키 사용 |
| **데이터 유출** | 로컬 저장만, 서버 전송 없음 |
| **서비스 약관 위반** | iframe 웹앱은 공식 사이트 그대로 사용 |

### 4.3 개인정보 보호

**GDPR/CCPA 준수**:
- 사용자 데이터 수집 없음
- 쿠키는 기능적 목적만 (분석 없음)
- 투명한 데이터 흐름

---

## 5. 기술 스택

### 5.1 Frontend

```json
{
  "react": "18.2.0",
  "typescript": "5.4.2",
  "vite": "5.1.5",
  "tailwindcss": "3.4.1",
  "i18next": "25.6.3"
}
```

### 5.2 Chrome Extension APIs

- **Manifest V3**: 최신 표준
- **chrome.storage.local**: 영구 데이터
- **chrome.cookies**: 세션 동기화
- **chrome.sidePanel**: 사이드 패널
- **chrome.scripting**: 동적 주입
- **chrome.declarativeNetRequest**: CORS 우회

### 5.3 Backend (Serverless)

- **Cloudflare Workers**: 엣지 컴퓨팅
- **R2 Object Storage**: 모델 캐싱
- **Wrangler**: 배포 자동화

---

## 6. 개발 로드맵

### Phase 1: 완료 ✅
- 11개 제공자 통합
- BYOK 시스템 (10개 제공자)
- BrainFlow™ 엔진
- Side Panel 모드
- 14개 언어 지원

### Phase 2: 진행 중 🚧
- OpenRouter 자동 라우팅 통합
- 파일 첨부 기능 (PDF, 이미지)
- 사용량 추적 대시보드
- 비용 계산기

### Phase 3: 계획 중 📋
- 로컬 LLM 지원 (Ollama)
- 벡터 DB 연동 (RAG)
- 플러그인 시스템
- 팀 협업 기능

---

## 7. 결론

ModelDock Studio는 **이중 하이브리드 모델 로딩**, **BrainFlow™ 협업 추론**, **제로 서버 아키텍처**를 통해 기존 멀티 AI 플랫폼과 차별화됩니다.

**핵심 차별점**:
1. 정적 모델 리스트 → 동적 실시간 로딩
2. 단순 채팅 → 협업 추론 엔진
3. 중앙 서버 → 완전 로컬 우선

**개발 원칙 준수**:
- ✅ Ultra Deep Thinking Mode
- ✅ 코드베이스 전체 파악
- ✅ 최소 코드, 최대 효과
- ✅ KISS, DRY, YAGNI, SOLID 원칙
- ✅ 2중 3중 검증

---

## 부록: 주요 파일 및 코드 라인 수

| 파일 | 라인 수 | 설명 |
|------|---------|------|
| `byokService.ts` | 2,253 | BYOK 통합 레이어 |
| `chain-orchestrator.ts` | 625 | BrainFlow 엔진 |
| `content.js` | 5,123 | 자동 라우팅 |
| `background.js` | 318 | Service Worker |
| `cloudflare-worker/index.js` | 492 | 프록시 서버 |
| `types.ts` | 357 | TypeScript 타입 |
| **총계** | **~15,000** | 전체 프로젝트 |

---

<div align="center">

**최종 업데이트**: 2025년 12월 9일  
**버전**: 1.1.2  
**작성자**: ModelDock Team

</div>
