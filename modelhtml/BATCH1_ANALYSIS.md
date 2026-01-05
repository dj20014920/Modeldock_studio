# Claude DOM 구조 분석

## 1. Stop 버튼
- Primary: 없음 – `modelhtml/claude.md`에는 스트리밍 상태가 아니어서 Stop 전용 버튼 DOM이 생성되지 않았다.
- Alt 1: 해당 없음
- Alt 2: 해당 없음
- Alt 3: 해당 없음
- Detection: 현재 스냅샷으로는 Stop 버튼을 확인할 수 없으므로, 실시간 스트리밍 시점에 Send 버튼 자리에 나타나는 제어 요소를 감시해야 한다.
- Notes: 기본 상태에서는 `button[aria-label="메시지 보내기"]`만 존재하며, Stop 관련 문자열이나 SVG가 전혀 보이지 않는다.

## 2. 입력창
- Selector: `div[data-testid="chat-input"].tiptap.ProseMirror`
- Type: ProseMirror 기반 `contenteditable="true"` 블록
- Disabled: `aria-disabled`나 `data-disabled` 토글이 존재하지 않으며, 비활성화 여부를 DOM만으로는 감지할 수 없다.
- Placeholder: `data-placeholder="오늘 어떤 도움을 드릴까요?"`가 비어 있을 때 `<p>`에 남아 있다.
- Shadow DOM: 사용하지 않고 일반 DOM 안에 직접 렌더링된다.

## 3. 응답 영역
- Container: `div.flex.flex-grow.flex-col.overflow-y-auto` 내부의 `div.flex.flex-col.px-2.gap-px`가 메시지 스택을 위한 빈 컨테이너로 잡혀 있다.
- Assistant: 캡처 시점에는 메시지가 없어 `.font-claude-message`나 유사 식별자를 확인할 수 없다.
- User 구분: 사용자 메시지를 나타내는 마커도 존재하지 않아 DOM만으로는 구분 로직을 검증할 수 없다.
- Last message: 콘텐츠가 없어 최신 메시지를 선택하는 패턴을 확인할 수 없다.
- Extraction: 추출 대상 요소가 없어 버튼/툴바 제거 패턴을 검증할 수 없다.

## 4. 로딩 인디케이터
- Primary: 없음 – 스피너나 진행 바 관련 DOM이 없다.
- Alternatives: Stop 버튼이 등장할 때까지 기다리는 수밖에 없다는 점만 확인된다.
- Patterns: 현재 정적 DOM에서는 로딩 상태를 나타내는 클래스(`data-is-streaming`, `aria-busy`)가 보이지 않는다.

## 5. Submit 버튼
- Selector: `button[aria-label="메시지 보내기"].Button_claude__c_hZy`
- Disabled: 초기값으로 `disabled=""` 속성이 붙어 있어 내용이 없을 때 비활성화된 상태임을 알 수 있다.

## 6. 특수 기능
- Thinking Mode: DOM에 관련 토글이나 배지 없음.
- Shadow DOM: 사용하지 않는다.
- Code Interpreter: 입력창 좌측 툴바에 `data-testid="input-menu-plus"`, `input-menu-tools`, `file-upload` 버튼이 있어 기능 확장을 암시한다.
- Artifacts: 특정 UI 언급 없음.
- Network: HTML에서 스트리밍 엔드포인트나 SSE 힌트가 노출되지 않는다.

## 7. 완료 감지 전략
스트리밍 중에는 Send 버튼이 Stop으로 대체될 것으로 예상되지만 정적 DOM에 정보가 없다. 따라서 (1) Stop 버튼 DOM 출현/삭제, (2) `button[aria-label="메시지 보내기"]`의 `disabled` 속성 복귀, (3) 응답 컨테이너에 새 노드가 추가된 뒤 `aria-busy` 같은 속성이 `false`로 떨어지는지를 실측한 뒤 전략을 확정해야 한다.

# ChatGPT DOM 구조 분석

## 1. Stop 버튼
- Primary: 없음 – `modelhtml/openai.md`에는 Stop 관련 버튼이나 텍스트가 존재하지 않는다.
- Alt 1: 해당 없음
- Alt 2: 해당 없음
- Alt 3: 해당 없음
- Detection: 정적 상태에서는 Stop 제어가 전혀 보이지 않으므로, 실시간 스트리밍 중 Send 버튼 주변을 다시 캡처해 확인할 필요가 있다.
- Notes: 로그인 전 상태라 composer만 있고 실행 제어는 비어 있다.

## 2. 입력창
- Selector: `textarea.wcDTda_fallbackTextarea[name="prompt-textarea"][data-virtualkeyboard="true"]`
- Type: 네이티브 `<textarea>` (hydration 전까지 포커스를 받는 SSR 폴백)
- Disabled: `disabled` 속성이 없고 DOM에서는 잠금 여부를 알 수 없다.
- Placeholder: `placeholder="무엇이든 물어보세요"`
- Shadow DOM: 사용하지 않는다.

## 3. 응답 영역
- Container: `div#thread.group/thread`가 전체 대화 스크롤 영역으로 렌더링돼 있다.
- Assistant: 캡처에 메시지가 없어 `data-message-author-role` 등 식별자를 확인할 수 없다.
- User 구분: 사용자 메시지도 없어 구분 로직을 검증할 수 없다.
- Last message: DOM에 메시지가 없으므로 선택 기준을 확인할 수 없다.
- Extraction: `.markdown` 등의 컨텐츠 노드가 없어 정리 패턴을 검증할 수 없다.

## 4. 로딩 인디케이터
- Primary: 없음 – 로더나 토큰 스트림 클래스를 찾을 수 없다.
- Alternatives: 페이지 하단에 `div#live-region-{assertive,polite}` 스크린 리더 영역이 있지만, 텍스트가 비어 있어 실시간 알림 여부를 확인할 수 없다.
- Patterns: 어떠한 `aria-busy`/`spinner` 패턴도 노출되지 않는다.

## 5. Submit 버튼
- Selector: 캡처 시점에는 Send 버튼 DOM 자체가 없다(로그아웃/안내 모드). 입력창 옆에는 파일 첨부·검색·학습 버튼만 존재한다.
- Disabled: 미표시 – 로그인 후 다시 확인해야 한다.

## 6. 특수 기능
- Thinking Mode: 관련 UI 없음.
- Shadow DOM: 사용하지 않는다.
- Code Interpreter: `data-testid="composer-action-file-upload"`가 존재해 파일 첨부 기능을 암시한다.
- Artifacts: `data-testid="composer-button-search"`(검색), `composer-button-study`, `composer-speech-button`(음성) 등 보조 기능 버튼이 미리 렌더링돼 있다.
- Network: HTML에 스트리밍 엔드포인트 정보는 없다.

## 7. 완료 감지 전략
현재 DOM으로는 (1) Stop 버튼, (2) 메시지 컨테이너 업데이트 여부를 알 수 없다. 추후 실사용 화면에서 Send 버튼 활성화/비활성 토글과 `#thread` 하위 노드 변화를 감시하고, `textarea`의 `readOnly/disabled` 전환을 보조 지표로 삼는 전략을 세워야 한다.

# Gemini DOM 구조 분석

## 1. Stop 버튼
- Primary: 없음 – `modelhtml/gemini.md`의 완성된 응답에도 `.stop-button`이나 유사 제어가 포함돼 있지 않다.
- Alt 1: 해당 없음
- Alt 2: 해당 없음
- Alt 3: 해당 없음
- Detection: 스트리밍 중에만 생성되는 별도 버튼으로 추정되므로, 런타임 DOM을 추가로 확보해야 한다.
- Notes: 현 캡처에서는 응답이 이미 완성돼 있어 중단 제어가 제거된 상태다.

## 2. 입력창
- Selector: `rich-textarea .ql-editor.new-input-ui[contenteditable="true"][aria-label="여기에 프롬프트 입력"][data-placeholder="Gemini에게 물어보기"]`
- Type: Quill 기반 `contenteditable` 편집기
- Disabled: `aria-disabled`나 `data-disabled` 토글이 없으며, 버튼 레벨에서 제어한다.
- Placeholder: `data-placeholder="Gemini에게 물어보기"`
- Shadow DOM: Angular 컴포넌트이지만 Shadow DOM을 사용하지 않고 실제 DOM에 그대로 나타난다.

## 3. 응답 영역
- Container: `<model-response>` → `<response-container>` → `<message-content class="model-response-text ...">` 안의 `div.markdown`이 본문을 담는다.
- Assistant: `message-content`가 `model-response-text` 클래스를 가지며 `aria-busy="false"` 속성으로 상태를 노출한다.
- User 구분: 사용자 메시지는 `<user-query>` / `<user-query-content>`로 감싸져 있으므로 태그 이름으로 쉽게 분리된다.
- Last message: `message-content` 요소가 순차로 추가되며, 가장 마지막 `div.markdown`을 읽으면 된다.
- Extraction: `div.markdown.markdown-main-panel` 내부 텍스트에 모든 답변이 담겨 있어, 버튼/메뉴 외부 요소가 따로 포함돼 있지 않다.

## 4. 로딩 인디케이터
- Primary: `message-content`의 `aria-busy` 속성(캡처에서는 `false`)이 스트리밍 여부를 나타낸다.
- Alternatives: `model-thoughts[data-test-id="model-thoughts"]`가 열려 있을 때 추론 단계가 진행 중인 것으로 볼 수 있다.
- Patterns: `message-content`에 `style="--animation-duration: 600ms; ..."`과 `aria-live="off"` 속성이 있어, 변경 시 MutationObserver가 감지하기 쉽다.

## 5. Submit 버튼
- Selector: `button.send-button[aria-label="메시지 보내기"]` (Material `mat-icon-button`)
- Disabled: DOM에 `disabled`나 `aria-disabled`가 보이지 않아 입력값이 있을 때 바로 활성 상태로 렌더링된 것으로 보인다.

## 6. 특수 기능
- Thinking Mode: `<model-thoughts data-test-id="model-thoughts">`가 별도로 렌더링돼 있어 “생각 과정” 패널을 토글할 수 있다.
- Shadow DOM: 없음.
- Code Interpreter: 파일 캐러셀(`user-query-file-carousel`)과 확장(response extensions) 컴포넌트가 있어 첨부 기능을 제공한다.
- Artifacts: `tts-control` 컴포넌트가 응답 낭독 버튼(`aria-label="듣기"`)을 노출한다.
- Network: DOM에서 직접 확인할 수 있는 네트워크 정보는 없다.

## 7. 완료 감지 전략
- `message-content`가 `aria-busy="false"`가 된 시점과 `model-thoughts` 패널이 접히는 시점을 동시에 확인한다.
- Stop 버튼이 보이지 않으므로, `button.send-button`이 다시 활성화돼 있고 최신 `model-response`의 `aria-busy`가 `false`인지를 조합해 완료를 판단한다.

# Grok DOM 구조 분석

## 1. Stop 버튼
- Selector: `button[aria-label*="Stop"]` (X 스타일 버튼)
- 특성: 응답 중 명확히 등장하므로 1순위 신호

## 2. 입력창
- Selector: `div[role="textbox"][contenteditable="true"]`
- Disabled: 비활성 토글 없음 → 입력 상태는 보조 신호로만 활용

## 3. 응답 영역
- Assistant 마커: `data-message-author-role="assistant"` 필요 (Strict Mode)
- 사용자/봇 구분: `assistant` 마커가 없는 노드는 모두 제외

## 4. 로딩 인디케이터
- 별도 스피너보다 Stop 버튼 존재 여부가 더 신뢰도 높음

## 5. Submit 버튼
- 위치: 입력창 우측 (트위터 스타일), disable 토글 드묾

## 6. 특수 기능
- Shadow DOM 없음
- Strict Mode 필수: 사용자 메시지 오염 방지

## 7. 완료 감지 전략
- 1순위: Stop 버튼 제거 감지
- 2순위: 최신 assistant 노드 텍스트 안정 + `assistant` 마커 존재
- 3순위: 네트워크 모니터(옵션)로 SSE 종료 신호 확인

# DeepSeek DOM 구조 분석

## 1. Stop 버튼
- Primary: `div[role="button"]:has(svg)` 내 stop 아이콘
- Alt: `button[aria-label*="Stop"]` (일부 테마)
- 특성: 커스텀 role 버튼이라 일반 button만 검색하면 누락 가능

## 2. 입력창
- Selector: `textarea._27c9245[placeholder*="DeepSeek에 메시지 보내기"]`
- Disabled: 명시 토글 드묾 → 비활성 신호는 낮은 신뢰도

## 3. 응답 영역
- 컨테이너: `.ds-markdown` 계열 클래스가 본문을 가짐
- 사용자/봇 구분: 대화 목록은 카드식 리스트, 본문은 별도 뷰 → 메시지 리스트 대신 최근 `.ds-markdown` 사용

## 4. 로딩 인디케이터
- 아이콘 애니메이션(svg) 존재하나 클래스 난독화 → Stop 버튼/네트워크 우선

## 5. Submit 버튼
- 아이콘 버튼 2개가 나란히 배치(엔터/첨부)
- Disabled: aria-disabled 토글이 달리는 케이스 있음

## 6. 특수 기능
- “깊은 생각” 토글 버튼 존재 → R1/Reasoner 모드 힌트
- 파일 업로드 아이콘 존재

## 7. 완료 감지 전략
- 1순위: Stop role 버튼 제거
- 2순위: 최신 `.ds-markdown` 텍스트 1.5초 이상 안정
- 3순위: R1 모드 추정 시 최소 대기 8초, 네트워크 모니터 병행

# Qwen DOM 구조 분석 (Custom Parser v2 기준)

## 1. Stop 버튼
- UI 스냅샷 없음 → 실시간 DOM에서 `button[aria-label*="Stop"]` 또는 상위 nav 영역 role=button 탐색 필요

## 2. 입력창
- 예상: `textarea` 또는 `div[contenteditable="true"]` (로그인 상태에 따라 다름)
- Disabled: 불규칙 → 신뢰도 낮음

## 3. 응답 영역
- 다중 후보: 4가지 컨테이너 경로 + UI 요소 제거 셀렉터 12개 적용
- Clone & Remove 패턴 필수 (복사 버튼 앵커 뒤집기)

## 4. 로딩 인디케이터
- 명시 스피너 없음 → 텍스트 안정/Stop 버튼/네트워크 모니터 결합 필요

## 5. Submit 버튼
- 위치: 입력창 우측, disabled 토글 종종 사용

## 6. 특수 기능
- 긴 멈춤(토큰 텀 15초+) 발생 → 네트워크 기반 감시 강제
- stabilizationTime: 60초 (보수적)

## 7. 완료 감지 전략
- 1순위: 네트워크 모니터 완료 + 마지막 텍스트 안정 2초
- 2순위: Stop 버튼 제거 또는 submit disabled→enabled 전환
- 3순위: 응답 컨테이너 노드 증가 멈춤 (MutationObserver)

# LMArena DOM 구조 분석

## 1. Stop 버튼
- 명시 스냅샷 없음 → 입력창 인접 버튼 중 role=button + stop/pause 아이콘 탐색 필요

## 2. 입력창
- 예상: `textarea` 또는 `contenteditable` 블록
- Disabled: 토글 불규칙 → 낮은 신뢰도

## 3. 응답 영역
- Custom Parser v2: `isPromptPattern()` 18패턴으로 사용자 프롬프트 필터링
- 탐색 깊이: 15/12 (조상 탐색 강화)

## 4. 로딩 인디케이터
- 스피너 정보 없음 → 텍스트 안정 + Stop 버튼 감시

## 5. Submit 버튼
- 표준 버튼, disabled 토글 여부는 불명

## 6. 특수 기능
- 한국어/영어 패턴 혼합 → assistant 명시 노드만 허용
- stabilizationTime: 20초

## 7. 완료 감지 전략
- 1순위: Stop 버튼 제거
- 2순위: 최신 assistant 노드 텍스트 안정
- 3순위: 네트워크 모니터 병행 (SSE 추정)

# Kimi DOM 구조 분석

## 1. Stop 버튼
- 스냅샷 없음 → 상단 제어 패널의 role=button + stop 아이콘 검색

## 2. 입력창
- 일반 `textarea` 계열 예상

## 3. 응답 영역
- Custom Parser: 복사 아이콘을 앵커로 역탐색 (Clone & Remove)

## 4. 로딩 인디케이터
- 명시 스피너 불명 → Stop 버튼/텍스트 안정 조합

## 5. Submit 버튼
- disable 토글 존재 가능 (로그인 상태에 따라 상이)

## 6. 특수 기능
- 다국어 UI, 클래스 난독화 경향

## 7. 완료 감지 전략
- 1순위: Stop 버튼 제거
- 2순위: 복사 아이콘 주변 최신 마크다운 텍스트 안정
- 3순위: 네트워크 모니터(옵션)

# OpenRouter DOM 구조 분석

## 1. Stop 버튼
- 커스텀 버튼(아이콘) 가능성 → `button[aria-label*="Stop"]` + `button:has(svg)` 병행 탐색

## 2. 입력창
- 일반 `textarea` 예상, disabled 토글 보조 신호

## 3. 응답 영역
- Custom Parser v2: Strategy 1~4, `rounded-tl-none` vs `rounded-tr-none`로 사용자/봇 구분
- Clone & Remove + UI 제거(svgs, data-state)

## 4. 로딩 인디케이터
- 명시 정보 없음 → Stop 버튼/텍스트 안정

## 5. Submit 버튼
- disable 토글 여부 불규칙

## 6. 특수 기능
- 다양한 호스팅 모델(LLM) → 속도/대기시간 변동 큼
- stabilizationTime: 20초

## 7. 완료 감지 전략
- 1순위: Stop 버튼 제거
- 2순위: 최신 assistant 버블의 클래스(`rounded-*-none`) 텍스트 안정
- 3순위: 네트워크 모니터로 스트림 종료 확인

# Mistral DOM 구조 분석 (미확정)

## 1. Stop 버튼
- 스냅샷/셀렉터 미확보 → 실측 필요

## 2. 입력창
- `textarea` 계열 추정

## 3. 응답 영역
- P2 이슈: 파싱 실패 보고 → 컨테이너/assistant 마커 재조사 필요

## 4. 로딩 인디케이터
- 정보 없음 → 텍스트 안정/Stop 버튼/네트워크 모니터 조합

## 5. Submit 버튼
- 표준 버튼 예상

## 6. 특수 기능
- 없음 보고

## 7. 완료 감지 전략 (임시)
- 네트워크 모니터 + 텍스트 안정 우선, Stop 버튼 실측 후 보강 필요

# Codex / Claude Code / AI Studio 메모
- Vibe Coding 도구로 Brain Flow 제외 대상 (브레인/슬레이브 자동 라우팅에서 제외 필요)
- URL 매칭 시 경로 포함 주의(`chatgpt.com/codex` vs `chatgpt.com`)
- 감지 로직은 실행하지 말고 차단/경고 처리

# 추가 보강 및 미확정 항목
- Grok/DeepSeek/Mistral/LMArena/Kimi/OpenRouter: 정적 HTML이 난독화돼 있어 Stop/submit 세부 셀렉터는 실측 필요. 현재는 Stop 버튼 존재 감지 + 텍스트 안정 + 네트워크 모니터 3중 전략을 기본값으로 유지.
- ChatGPT(o1 포함): 정적 캡처에 Stop 버튼 미노출. 실사용 시 `button[aria-label="Stop generating"]`, `button[data-testid="stop-button"]`, `#prompt-textarea.disabled` 조합을 다시 채집해 precision 향상 필요.
- Gemini: `message-content[aria-busy]` 기반이나 stop-button 위치가 변할 수 있으므로 정기 재캡처 필요.
- Codex/ClaudeCode/AIStudio: Brain Flow 제외 모델이지만 경고/차단 메시지용 DOM은 주기적으로 점검.
