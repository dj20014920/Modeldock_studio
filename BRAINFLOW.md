# Brain Flow - 전체 아키텍처 문서

## 🚨 현재 심각 이슈 (우선순위 순)

### Critical Issues
1. **Perplexity iframe 오류** - `sendToPerplexity()` 구현했으나 여전히 iframe 경로로 진입
2. **대규모 응답 파싱 실패** - mistral, openrouter, aistudio, codex, claudecode, githubcopilot, lovable (7개 모델) 응답 미파싱
3. **Grok/LMArena 프롬프트 파싱 오류** - 응답 대신 전송한 프롬프트를 가져옴 (셀렉터 오류)
4. **Qwen 조기 종료** - 토큰 간 15초 간격 시 첫 단어만 파싱 후 종료

### High Priority Issues
5. **v0/Claude 조기 완료** - 응답 생성 중 조기 종료 판정
6. **Zoom 초기화 문제** - 대부분 모델의 zoom 설정이 리셋됨
7. **Perplexity Zoom 작동 불가**

---

## 🏗️ Brain Flow 아키텍처 개요

```
User Input (목표)
    ↓
[Phase 1] Main Brain - 계획 수립
    ↓ (parseSlavePrompts)
[Phase 2] Parallel Execution - 모든 Slave Bots
    ↓ (Promise.all)
[Phase 3] Main Brain - 종합 및 최종 답변
```

---
🧠 Brain Flow
 버튼 클릭
   ↓
2. Modal 팝업: "메인 브레인이 N개 슬레이브 지휘"
   ↓
3. 사용자 목표 입력 (예: "React 성능 최적화 방법")
   ↓
4. [Phase 1] 메인 브레인에게 전송:
   """
   당신은 메인 브레인입니다.
   슬레이브: ChatGPT (chatgpt-123), Gemini (gemini-456)
   [사용자 목적] React 성능 최적화 방법
   → 각 슬레이브에게 내릴 프롬프트를 작성하세요.
   """
   ↓
5. [Phase 2] 메인 응답을 슬레이브에게 병렬 전파
   - ChatGPT: "코드 예시 작성..."
   - Gemini: "비교표 작성..." (동시 실행!)
   ↓
6. [Phase 3] 슬레이브 응답 취합 후 메인에게 재전송:
   """
   [ChatGPT(chatgpt-123) Response]
   ...코드...
   [Gemini(gemini-456) Response]
   ...비교표...
   
   위 응답들을 종합하여 최적의 솔루션을 제시하세요.
   """
   ↓
7. 최종 결과 확인
---
## 📂 핵심 컴포넌트

### 1. **ChainOrchestrator** (`src/services/chain-orchestrator.ts`)
**역할**: Brain Flow 전체 오케스트레이션

**핵심 메서드**:
- `runBrainFlow(goal, mainBrain, slaves, callbacks)` - 전체 플로우 실행
- `sendMessageToModel(model, text, callbacks)` - 모델별 메시지 전송 라우팅
  - `sendToPerplexity(text, callbacks)` - Perplexity API 방식
  - `sendToIframe(model, text, callbacks)` - Iframe postMessage 방식
- `parseSlavePrompts(planText, slaves)` - Main Brain 계획에서 각 slave 프롬프트 추출
- `skipCurrentPhase()` - 현재 단계 강제 스킵

**분기 로직**:
```typescript
if (model.modelId === 'perplexity') {
    return sendToPerplexity();
} else {
    return sendToIframe();
}
```

**프롬프트 파싱**:
- Split 기반: `[SLAVE:모델ID]` 태그로 분리
- Fallback 매칭: instanceId, modelId, 복합 ID
- 엄격한 검증: 모든 slave에 대해 프롬프트 존재 확인

---

### 2. **Content Script** (`public/content.js`)
**역할**: Iframe 내 응답 모니터링 및 전송

**핵심 함수**:
- `getResponseConfig()` - 현재 호스트에 맞는 설정 반환
- `startMonitoring(requestId, config, callbacks)` - 응답 모니터링 시작
- `getResponseText()` - 3단계 텍스트 추출
  1. textContent (숨겨진 요소 포함)
  2. innerText (가시 텍스트)
  3. TreeWalker (모든 노드 순회)
- `checkIsRunning()` - 3가지 방법으로 실행 상태 확인
  1. Stop 버튼 가시성
  2. Input disabled 상태
  3. Submit disabled 상태

**완료 감지 로직** (2단계):
```javascript
Phase 1: 10초 텍스트 안정화 대기
Phase 2: UI 상태 확인 (Stop 버튼 + Input 상태)
    → 모두 만족 시 완료
    → 하나라도 불만족 시 타이머 리셋
```

**RESPONSE_CONFIGS 구조**:
```javascript
{
  hosts: ['도메인'],
  responseSelectors: ['응답 CSS 셀렉터'],
  stopSelectors: ['Stop 버튼 셀렉터'],
  inputSelector: '입력창 셀렉터',  // 비활성화 체크용
  submitSelector: '전송 버튼 셀렉터'  // 비활성화 체크용
}
```

---

### 3. **Perplexity Service** (`src/services/perplexity-service.ts`)
**역할**: Perplexity API 직접 호출 (iframe 불필요)

**상태 관리**:
```typescript
{
  messages: PerplexityMessage[],
  isStreaming: boolean,
  error: string | null,
  deepResearchEnabled: boolean
}
```

**실행 흐름**:
1. `sendMessage(text)` 호출
2. SSE 스트리밍으로 응답 수신
3. `state.isStreaming` 변화 → 구독자에게 알림
4. 완료 시 `state.isStreaming = false`

---

## 🔄 Brain Flow 상세 플로우

### Phase 1: 계획 수립
```
1. Main Brain에 프롬프트 전송:
   "당신은 메인 브레인입니다. 슬레이브 봇 목록: [모델들]
    목적: {goal}
    각 슬레이브에게 할당할 작업을 [SLAVE:모델ID] 형식으로 작성하세요."

2. Main Brain 응답 대기 (content.js 모니터링)
   - MutationObserver: 실시간 텍스트 변화 감지
   - heartbeatInterval: 2초마다 상태 확인
   - 완료 조건: 10초 안정 + Stop 버튼 없음 + Input 활성화

3. parseSlavePrompts(응답, slaves)
   - [SLAVE:gemini] ... [/SLAVE] 형식 파싱
   - 각 slave에 매칭 (instanceId, modelId)
   - 누락 검증
```

### Phase 2: 병렬 실행
```
Promise.all([
  sendMessageToModel(slave1, prompt1, callbacks),
  sendMessageToModel(slave2, prompt2, callbacks),
  ...
])

각 slave별:
  if (perplexity):
    - perplexityService.subscribe()
    - state.isStreaming 감지
    - 완료: !state.isStreaming
  else:
    - iframe.postMessage(MODEL_DOCK_INJECT_TEXT)
    - content.js startMonitoring()
    - 완료: MODEL_DOCK_RESPONSE_COMPLETE
```

### Phase 3: 종합
```
1. Main Brain에 프롬프트 전송:
   "아래는 슬레이브 응답입니다:
    [gemini Response] {응답1}
    [claude Response] {응답2}
    ...
    사용자 목적: {goal}
    종합하고 최적의 솔루션을 제시하세요."

2. Main Brain 응답 대기 (Phase 1과 동일)

3. 최종 결과 반환
```

---

## 🔍 현재 문제 원인 분석

### 1. Perplexity Iframe 오류
**증상**: `Iframe not found for model perplexity`

**원인**: `sendMessageToModel()`의 분기 로직 이전에 `findIframe()` 호출
```typescript
// 잘못된 순서:
const iframe = this.findIframe(model);  // ❌ 여기서 perplexity도 iframe 찾으려 함
if (model.modelId === 'perplexity') {
    return sendToPerplexity();
}
```

**해결**: 분기를 최상단으로 이동 ✅ (이미 수정됨)

---

### 2. 대규모 응답 파싱 실패 (7개 모델)
**증상**: mistral, openrouter 등 응답이 빈 배열

**원인**: `content.js` RESPONSE_CONFIGS에 해당 호스트 미등록

**필요 작업**: 각 모델의 DOM 구조 분석 후 셀렉터 추가

---

### 3. Grok/LMArena 프롬프트 파싱
**증상**: 응답 대신 보낸 프롬프트 텍스트가 파싱됨

**원인**: `responseSelectors`가 사용자 메시지 영역을 가리킴
```javascript
// 잘못된 셀렉터:
'div[role="article"]:last-of-type'  // ❌ 사용자 + 봇 메시지 포함
```

**해결**: 봇 메시지만 선택하는 셀렉터 필요

---

### 4. Qwen 조기 종료
**증상**: "다음은 3D 수학 및 기하학 전문가의 시각에서 요청하신 세 가지 요소를 수학적으로 엄밀히 다"

**원인**: 
1. 토큰 간 15초 간격 발생
2. 10초 안정화 타임아웃 미달
3. UI 상태 확인에서 완료 판정

**해결**: 
- 안정화 시간 증가 (10초 → 20초)
- 또는 실행 상태 체크 강화

---

### 5. v0/Claude 조기 완료
**원인**: Stop 버튼/Input 상태 감지 실패

**해결**: 셀렉터 재검증 필요

---

### 6. Zoom 초기화 문제
**원인**: 모델 iframe reload 시 zoom 상태 미보존

**해결**: LocalStorage에 zoom 상태 저장 필요

---

## 📊 지원 모델 현황

| 모델 | iframe | API | 응답 파싱 | 완료 감지 | 상태 |
|------|--------|-----|----------|----------|------|
| ChatGPT | ✅ | ❌ | ✅ | ✅ | 정상 |
| Claude | ✅ | ❌ | ✅ | ⚠️ | 조기 종료 |
| Gemini | ✅ | ❌ | ✅ | ✅ | 정상 |
| Grok | ✅ | ❌ | ❌ | ✅ | 프롬프트 파싱 |
| Perplexity | ❌ | ✅ | ❌ | ❌ | iframe 오류 |
| Qwen | ✅ | ❌ | ⚠️ | ⚠️ | 부분 파싱 |
| LMArena | ✅ | ❌ | ❌ | ✅ | 프롬프트 파싱 |
| Mistral | ✅ | ❌ | ❌ | ❌ | 셀렉터 없음 |
| OpenRouter | ✅ | ❌ | ❌ | ❌ | 셀렉터 없음 |
| AIStudio | ✅ | ❌ | ❌ | ❌ | 셀렉터 없음 |
| Codex | ✅ | ❌ | ❌ | ❌ | 셀렉터 없음 |
| ClaudeCode | ✅ | ❌ | ❌ | ❌ | 셀렉터 없음 |
| GitHubCopilot | ✅ | ❌ | ❌ | ❌ | 셀렉터 없음 |
| Lovable | ✅ | ❌ | ❌ | ❌ | 셀렉터 없음 |
| v0 | ✅ | ❌ | ✅ | ⚠️ | 조기 종료 |
| Kimi | ✅ | ❌ | ? | ? | 미검증 |
| DeepSeek | ✅ | ❌ | ? | ? | 미검증 |
| Vooster | ✅ | ❌ | ? | ? | 미검증 |
| Replit | ✅ | ❌ | ? | ? | 미검증 |
| Genspark | ✅ | ❌ | ? | ? | 미검증 |

**정상 작동**: 3개 (ChatGPT, Gemini, 부분적 Qwen)
**문제 있음**: 14개

---

## 🔧 다음 개선 계획

1. **Perplexity 완전 통합** - iframe 경로 차단 검증
2. **셀렉터 대규모 추가** - 7개 모델 DOM 분석
3. **Grok/LMArena 셀렉터 수정** - 봇 응답만 선택
4. **Qwen 타임아웃 증가** - 20초 안정화
5. **v0/Claude 완료 감지 강화** - 추가 검증 로직
6. **Zoom 상태 영구화** - LocalStorage 활용

---

## 📝 코드 설계 원칙 준수 현황

- ✅ **KISS**: 단순한 분기 로직 (perplexity vs iframe)
- ✅ **DRY**: 통일된 콜백 인터페이스
- ✅ **SRP**: sendToPerplexity, sendToIframe 분리
- ✅ **OCP**: 새 모델 타입 추가 시 기존 코드 불변
- ⚠️ **현재 위반**: RESPONSE_CONFIGS 하드코딩 (재사용성 ↓)

---

## 🎯 최종 목표

**모든 19개 지원 모델에서 Brain Flow 100% 작동**

현재 성공률: 3/19 = **15.7%**
목표 성공률: **100%**
