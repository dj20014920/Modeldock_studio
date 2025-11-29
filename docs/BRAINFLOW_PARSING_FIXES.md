# BrainFlow 파싱 개선 로그 (2025-11-27)

## 🎯 목적
각 모델의 실제 HTML 구조를 기반으로 Custom Parser를 개선하여 응답 파싱 실패 문제 해결

## 📊 사용자 제공 HTML 구조 분석

### 1. Qwen (chat.qwen.ai)

**제공된 HTML 구조:**
```html
<div id="message-8ef31ffa-1f92-4da6-ab39-b24e66b10de0"
     class="response-meesage-container svelte-1av26cy"
     translate="no" style>
  <div class="response-button-list-item">
    <div aria-label="복사" class="flex" style>
      <button class="message-footer-button-item flex justify-center h-8 w-8
                     items-center visible response-message-control-item-visible
                     copy-response-button rounded-lg text-[#585A73]
                     hover:bg-[#F7F8FC] hover:text-purple-500
                     dark:text-[#D1D5DB] dark:hover:bg-white/5
                     dark:hover:text-purple-500">
        <!-- 복사 버튼 -->
      </button>
    </div>
  </div>
  <!-- 실제 메시지 텍스트는 여기 어딘가 -->
</div>
```

**핵심 셀렉터:**
- 메시지 컨테이너: `div[id^="message-"].response-meesage-container` (오타 주의: meesage)
- 복사 버튼 앵커: `.copy-response-button`
- 버튼 컨테이너: `.response-button-list-item`

**현재 문제:**
- "중간 잘림" 또는 "빈칸" 현상 발생
- 응답이 완료되기 전에 파싱되는 것으로 추정

**개선 전략:**
1. ✅ `.copy-response-button` 역추적 (이미 구현됨)
2. ✅ `.response-meesage-container` 찾기 (이미 구현됨)
3. ⚠️ 버튼 제거 로직 강화 필요
4. ⚠️ 완료 감지 타이밍 개선 필요

---

### 2. LMArena (lmarena.ai)

**제공된 HTML 구조:**
```html
<div class="prose prose-sm prose-pre:bg-transparent prose-pre:p-0
            text-wrap break-words">
  <!-- 메시지 내용 -->

  <button class="inline-flex items-center justify-center gap-2
                 whitespace-nowrap transition-colors focus-visible:ring-2
                 focus-visible:ring-ring ring-offset-2
                 focus-visible:ring-offset-surface-primary
                 disabled:pointer-events-none disabled:opacity-50
                 [&_svg]:pointer-events-none [&_svg]:shrink-0 text-sm
                 font-medium hover:bg-surface-tertiary
                 hover:text-accent-foreground focus-visible:outline-none
                 focus-visible:border-none relative size-3 rounded-md p-3"
          type="button"
          data-state="closed"
          data-slot="tooltip-trigger"
          data-sentry-element="Button"
          data-sentry-source-file="copy-button.tsx"
          data-sentry-component="CopyButton">
    <!-- 복사 버튼 -->
  </button>
</div>
```

**핵심 셀렉터:**
- 메시지 컨테이너: `.prose.prose-sm`
- 복사 버튼 앵커: `button[data-sentry-component="CopyButton"]`
- 보조 앵커: `button[data-slot="tooltip-trigger"]`

**현재 문제:**
- **프롬프트를 복사하는 문제** (사용자 메시지와 봇 응답 구분 실패)
- `.prose` 클래스를 사용자/봇 모두 사용

**개선 전략:**
1. ✅ `data-sentry-component="CopyButton"` 역추적 (이미 구현됨)
2. ✅ 프롬프트 패턴 필터링 (이미 구현됨)
3. ⚠️ 프롬프트 패턴 필터 강화 필요
4. 🆕 메시지 순서 기반 구분 추가 고려

---

### 3. OpenRouter (openrouter.ai)

**제공된 HTML 구조:**
```html
<!-- 봇 메시지 -->
<div class="py-3 px-4 font-normal relative transition-colors border
            rounded-lg dark:bg-slate-2 bg-white border-slate-4
            rounded-tl-none text-foreground dark:text-foreground/90
            col-start-1 row-start-1 min-w-0 w-full">
  <!-- 메시지 내용 -->
</div>

<!-- 복사 버튼 -->
<button class="inline-flex items-center justify-center whitespace-nowrap
               font-medium transition-colors focus-visible:outline-none
               disabled:pointer-events-none disabled:opacity-50
               focus-visible:ring-1 focus-visible:ring-ring gap-2
               text-muted-foreground hover:bg-accent
               hover:text-accent-foreground border border-transparent
               rounded-md text-xs shadow-xs w-8 h-8 p-1"
        data-state="closed">
  <!-- 복사 아이콘 -->
</button>
```

**핵심 셀렉터:**
- 봇 메시지: `div.rounded-tl-none` (왼쪽 상단 모서리 둥글지 않음)
- 사용자 메시지: `div.rounded-tr-none` (오른쪽 상단 모서리 둥글지 않음)
- 그리드 레이아웃: `.col-start-1` (봇 메시지)
- 추가 클래스: `.py-3.px-4`, `.text-foreground`

**현재 문제:**
- "빈칸" 현상 발생

**개선 전략:**
1. ✅ `rounded-tl-none` vs `rounded-tr-none` 구분 (이미 구현됨)
2. ✅ `.col-start-1` 기반 탐색 (이미 구현됨)
3. ⚠️ 복사 버튼과의 연관성 강화 필요
4. ⚠️ 텍스트 추출 로직 검증 필요

---

### 4. ChatGPT (chatgpt.com)

**예상되는 문제:**
- "중간 잘림" 현상

**현재 구조 (RESPONSE_CONFIGS):**
```javascript
{
  hosts: ['chatgpt.com', 'chat.openai.com'],
  responseSelectors: [
    'div[data-message-author-role="assistant"]:last-of-type .markdown',
    'div[data-message-author-role="assistant"]:last-of-type',
    'div[data-testid*="conversation-turn"]:has([data-message-author-role="assistant"]):last-of-type .markdown'
  ],
  stabilizationTime: 12000
}
```

**개선 전략:**
1. ⚠️ Custom Parser 추가 고려
2. ⚠️ 완료 감지 타이밍 개선 (12초 → 조정 필요)

---

### 5. Claude (claude.ai)

**예상되는 문제:**
- "아예 복사 자체를 못함"

**현재 Custom Parser:**
- ✅ `.font-claude-message` 탐색
- ✅ `data-testid="message-content"` 탐색
- ✅ Copy 버튼 역추적
- ✅ `.prose` 기반 fallback

**개선 전략:**
1. ⚠️ 복사 버튼 셀렉터 재검증
2. ⚠️ 텍스트 추출 로직 검증
3. ⚠️ 에러 로그 분석 필요

---

## 🔧 공통 개선 사항

### 1. 완료 감지 타이밍 문제
- **현상**: 응답이 완료되기 전에 파싱 시도
- **원인**: `stabilizationTime` 부족 또는 UI Lock 상태 오판
- **해결**: ARMS (Adaptive Response Monitoring System) 활용

### 2. 텍스트 추출 로직
- **현상**: 빈칸 또는 부분 텍스트
- **원인**:
  - 버튼/툴바 제거 로직이 너무 공격적
  - `innerText` vs `textContent` 차이
- **해결**:
  - 제거 대상 셀렉터 정밀화
  - TreeWalker 기반 텍스트 추출 고려

### 3. 사용자 메시지 필터링
- **현상**: 프롬프트 복사 (LMArena, Grok)
- **원인**: 사용자/봇 메시지 구분 실패
- **해결**:
  - `excludeUserMessage: true` 활용
  - `strictAssistantCheck: true` 활용
  - 패턴 필터링 강화

---

## 📋 다음 단계

### Phase 1: Critical Fixes (P0) - ✅ 완료
1. ✅ Qwen: 버튼 제거 로직 강화 (v2 완료)
2. ✅ LMArena: 프롬프트 패턴 필터 강화 (v2 완료)
3. ✅ OpenRouter: 텍스트 추출 검증 (v2 완료 - All Strategies)

### Phase 2: Parser 추가 (P1) - ✅ 완료
4. ✅ ChatGPT: Custom Parser 추가 (v2 완료 - 3 Strategies)
5. ✅ Claude: Copy 버튼 셀렉터 재검증 (v2 완료 - UI 요소 제거 강화)

### Phase 3: 통합 테스트 (P2) - ✅ 완료
6. ✅ 코드 레벨 검증 완료 (문법, 일관성)
7. ✅ 빌드 검증 완료 (TypeScript + Vite 성공)
8. ⏳ 실제 브라우저 테스트 대기 (다음 단계)

---

## 📝 변경 이력

### 2025-11-27 - 초기 분석
- 사용자 제공 HTML 구조 문서화
- 각 모델별 문제점 및 개선 전략 수립

### 2025-11-27 - Phase 1 & 2 구현 완료
**구현 내용:**
1. **Qwen Parser v2** (Lines 1118-1240):
   - 12개 UI 요소 제거 셀렉터 추가
   - 4가지 컨테이너 탐색 경로 확장
   - 사용자 메시지 필터링 강화

2. **LMArena Parser v2** (Lines 1242-1361):
   - `isPromptPattern()` 함수 추가 (18개 패턴 감지)
   - 탐색 깊이 증가 (10→15, 8→12)
   - 한국어/영어/Brain Flow 패턴 모두 지원

3. **OpenRouter Parser v2** (Lines 1405-1559):
   - 모든 Strategy (1, 2, 3, 4) 강화 완료
   - `rounded-tl-none` vs `rounded-tr-none` 엄격 구분
   - SVG, data-state 제거 추가

4. **ChatGPT Parser v2** (Lines 468-586) - **신규 추가**:
   - 3가지 Strategy 구현
   - `data-message-author-role="assistant"` 역추적
   - stabilizationTime 12초 → 15초 증가

5. **Claude Parser v2** (Lines 925-1074):
   - `removeUIElements()` 헬퍼 함수 추가
   - 모든 Strategy에 Clone & Remove 패턴 적용
   - 사용자 메시지 필터링 강화 (5→8 깊이, role 속성 추가)

**공통 개선:**
- ✅ Clone & Remove 패턴 통일 적용
- ✅ UI 요소 제거 셀렉터 일관성 확보
- ✅ 로깅 개선 (모든 Parser v2 표시)
- ✅ 사용자 메시지 필터링 강화

---

## 🎯 최종 검증 결과 (2025-11-27)

### ✅ 빌드 검증
```bash
✓ TypeScript 컴파일 성공
✓ Vite 빌드 성공 (2.91s)
✓ 번들 크기: 1,360.21 kB (gzip: 396.76 kB)
⚠️ 성능 최적화 권장사항 (에러 아님)
```

### ✅ 소프트웨어 원칙 준수
- ✅ KISS: 각 Parser가 명확한 Strategy 구조
- ✅ DRY: 공통 패턴 통일 (일부 개선 여지 있음)
- ✅ YAGNI: 현재 필요한 기능만 구현
- ✅ SOLID: 모든 원칙 준수 확인

### 📊 stabilizationTime 설정 (최종)
| 모델 | 시간 | 이유 |
|------|------|------|
| Qwen | 60초 | 복잡한 응답, 긴 토큰 간격 |
| Claude | 25초 | Thinking 시간 고려 |
| ChatGPT | 15초 | v2 Parser 최적화 |
| LMArena | 20초 | 표준 설정 |
| OpenRouter | 20초 | 표준 설정 |

### 🧪 브라우저 테스트 체크리스트
**Qwen (chat.qwen.ai)**
- [ ] BrainFlow 실행 성공
- [ ] UI 요소 없이 순수 텍스트만 복사
- [ ] 중간 잘림 없이 전체 응답 복사
- [ ] 콘솔: `[Qwen Parser v2]` 로그 확인

**LMArena (lmarena.ai)**
- [ ] 프롬프트가 아닌 실제 응답 복사
- [ ] 18개 패턴 필터링 동작 확인
- [ ] 콘솔: `[LMArena Parser v2] Detected prompt pattern` 확인

**OpenRouter (openrouter.ai)**
- [ ] 빈칸 대신 정상 텍스트 복사
- [ ] rounded-tl-none 필터링 동작
- [ ] 콘솔: `[OpenRouter Parser v2]` 로그 확인

**ChatGPT (chatgpt.com)**
- [ ] 중간 잘림 없이 완전한 응답
- [ ] 3가지 Strategy 중 성공한 것 확인
- [ ] 콘솔: `[ChatGPT Parser v2]` 로그 확인

**Claude (claude.ai)**
- [ ] 복사 성공 (기존 실패 해결)
- [ ] UI 요소 제거 확인
- [ ] 콘솔: `[Claude Parser v2]` 로그 확인
