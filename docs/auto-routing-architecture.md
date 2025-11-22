# ModelDock 자동 라우팅 아키텍처 개요

본 문서는 ModelDock의 자동 라우팅(프롬프트 주입 및 전송) 구조와 모델별 처리 흐름을 정리한다. 대상 버전: 최신 작업(claude/codex 포함) 기준.

## 전체 아키텍처
- **주요 컴포넌트**
  - `src/components/ChatMessageInput.tsx`: Auto 모드의 오케스트레이션. 활성 모델 목록 → iframe 탐색 → postMessage 송신 → 응답 매칭/타임아웃 관리.
  - `public/content.js`: 각 모델 iframe 내부에서 입력 필드 검색, 텍스트 주입, 버튼 클릭/키 입력 수행. `MODEL_DOCK_INJECT_TEXT/RESPONSE` 메시지 브릿지.
  - `src/constants.ts`: 모델별 입력/전송 셀렉터, 딜레이, 키 입력 강제 플래그.
  - `src/components/ModelFrame.tsx`: iframe에 `data-md-frame/model-id/instance-id` 부여 → 프레임 식별 안정화.
- **전송 흐름(2-pass)**
  1) **주입 패스**: `submit=false` 로 텍스트만 입력.
  2) **전송 패스**: `submit=true, skipInject=true, forceKey=true` 로 키 입력/버튼 클릭.
- **메시지 경로**
  - 부모(메인 앱) → iframe: `postMessage({ type: 'MODEL_DOCK_INJECT_TEXT', payload })`
  - iframe → 부모: `postMessage({ type: 'MODEL_DOCK_INJECT_RESPONSE', payload })`
- **응답 매칭**
  - `requestId = base + instanceId + seq` 를 부여하여 프레임/인스턴스 단위 구분.
  - 8초 타임아웃 + 150ms 폴링; 성공 응답 여부로 결정.
- **프레임 선택 우선순위**
  - 인스턴스 ID → modelId → host 매칭 → (특정 모델 fallback 시) 첫 가시 iframe.
  - 중복 프레임 사용 방지: `claimedFrames` 집합으로 한 프레임에 다중 주입 차단.

## 모델별 설정 요약 (`src/constants.ts`)
- 공통: `inputSelector`, `submitSelector`, `delayBeforeSubmit`, `forceEnter`, `submitKey`(옵션)
- **Claude**
  - 입력: ProseMirror/contenteditable 계열.
  - 전송: `button[aria-label*="메시지 보내기"], button[data-testid*="send"], button.Button_claude__tTMUm` 등 한국어 라벨 포함.
  - 지연: 1000ms. `forceEnter=true`.
- **Claude Code**
  - 입력: ProseMirror/CodeMirror/textarea 혼용.
  - 전송: `send/run` 버튼 + `submitKey: Cmd+Enter`.
  - 지연: 900ms. `forceEnter=true`.
- **Codex Cloud**
  - 입력: Monaco/ProseMirror/textarea.
  - 전송: `generate/run` 버튼 + `submitKey: Cmd+Enter`.
  - 지연: 800ms. `forceEnter=true`.
- **ChatGPT**
  - 입력: textarea + data-testid 기반.
  - 전송: send 버튼.
  - 지연: 300ms.
- **Gemini**
  - 입력: contenteditable.
  - 전송: send 버튼, `forceEnter=true`, 지연 800ms.
- **Grok**
  - 입력: contenteditable/textarea.
  - 전송: send 버튼, `forceEnter=true`, 지연 1000ms.
- **Perplexity**
  - 입력: textarea.
  - 전송: send 버튼, `forceEnter=true`.
- **DeepSeek**
  - 입력: textarea.
  - 전송: send 버튼, `forceEnter=true`, 지연 500ms.
- **Qwen**
  - 입력: textarea/contenteditable.
  - 전송: send 버튼, `forceEnter=true`.
- **LM Arena**
  - 입력: textarea.
  - 전송: send 버튼.
- **Kimi**
  - 입력: contenteditable/textarea.
  - 전송: send 버튼, `forceEnter=true`, 지연 700ms.
- **OpenRouter**
  - 입력: textarea.
  - 전송: send 버튼, `forceEnter=true`.
- **Google AI Studio**
  - 입력: textarea/contenteditable (Shadow DOM 전체 탐색).
  - 전송: 다양한 run/build 버튼, `submitKey: Ctrl+Enter & Cmd+Enter`, 지연 1800ms.
- **Mistral**
  - 입력: textarea/contenteditable.
  - 전송: send 버튼, `forceEnter=true`, 지연 500ms.
- **기타(v0, Vooster 등)**
  - v0: TipTap/ProseMirror, 지연 800ms, `forceEnter=true`.
  - Vooster: textarea, 기본 send.

## content.js 내부 처리
1) `window.message` 리스너로 `MODEL_DOCK_INJECT_TEXT` 수신.
2) 입력 필드 탐색: `inputSelector` 쉼표 분리 후 Shadow DOM까지 탐색(AI Studio), 가시성 검사.
3) 주입: execCommand/innerText/textarea value/Clipboard paste(코드 에디터) 분기.
4) 전송: 우선 버튼 클릭(필터로 sidebar/stop 버튼 제외), 실패 시 키 입력(`submitKey` → Enter/Cmd/Ctrl).
5) 응답: `MODEL_DOCK_INJECT_RESPONSE`로 부모에 성공/실패 반환.

## 재시도/폴백 설계
- 2-pass(주입→전송)로 입력 안정화 후 전송.
- 프레임 매칭 실패 시 지정된 우선순위에 따라 호스트/가시 iframe 폴백.
- 타임아웃 8초로 무한 대기 방지.

## 품질/안전 장치
- 가시성 체크(rect, display/visibility) 후만 조작.
- sidebar/stop 버튼 클릭 방지 로직(content.js).
- ProseMirror/Monaco 등에 paste 기반 주입으로 히스토리/상태 유지.
- 중복 프레임 사용 차단(`claimedFrames`).

## 향후 개선 아이디어
- 모델별 성공/실패 메트릭 수집 후 딜레이/셀렉터 자동 튜닝.
- per-frame health check(응답 실패 시 즉시 다른 프레임 시도) 추가.
- chunk 크기 경고 해소(코드 스플리팅/롤업 manualChunks)로 배포 최적화.
