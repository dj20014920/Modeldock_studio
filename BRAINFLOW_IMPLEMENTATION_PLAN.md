# BrainFlow 동적 DOM 감지 시스템 구현 계획서

**작성일**: 2025-12-04
**작성자**: Claude (Project Lead)
**상태**: Phase 0 - Planning Complete
**예상 기간**: Phase 1-3 (3-4주)

---

## 📋 Executive Summary

### 🎯 목표
현재 BrainFlow 시스템의 **하드코딩된 제한** 제거하고, **모델별 특성을 동적으로 학습**하여 **완벽한 응답 완료 감지**를 구현합니다.

### 🚨 현재 문제점
1. **stabilizationTime 하드코딩**: 모델마다 고정값(15초~60초) 사용
2. **전역 UI 점수**: 모든 모델에 동일한 가중치 적용
3. **Thinking Mode 미대응**: 중간 pause를 완료로 오판
4. **네트워크 상태 무시**: SSE 연결 활성 여부 미확인
5. **Selector 중복 관리**: JSON과 JS 코드에서 이중 정의

### ✅ 해결 방법 (Codex 제안 + 추가 개선)
**Model Manifest + Monitor Factory 패턴** 도입
- `ai_model_dom_selectors.json` → 단일 진실 소스
- 4-Layer Signal Pipeline (Network, UI, Text, Decision)
- Adaptive Timing (minWait + adaptiveMultiplier)
- 모델별 Plugin 시스템

---

## 🏗️ 아키텍처 설계 (v2.0)

### 1. Model Manifest (Enhanced ai_model_dom_selectors.json)

**현재 구조:**
```json
{
  "claude": {
    "selectors": {
      "stop_button": { "primary": "button[aria-label*='Stop']" }
    }
  }
}
```

**개선 구조:**
```json
{
  "models": {
    "claude": {
      "id": "claude",
      "name": "Claude (Anthropic)",
      "selectors": {
        "stop_button": {
          "primary": "button[aria-label*='Stop']",
          "alternatives": [
            "button[data-testid='stop-button']",
            "button:has(svg[class*='stop'])"
          ],
          "detection": "aria-label",
          "visibility_check": "offsetParent"
        },
        "input": {
          "selector": "div[contenteditable='true'][data-testid='chat-input']",
          "type": "contenteditable",
          "disabled_check": "contenteditable === 'false'",
          "placeholder": "오늘 어떤 도움을 드릴까요?"
        },
        "loading": {
          "primary": "[class*='generating']",
          "alternatives": ["[aria-busy='true']"]
        }
      },
      "completion": {
        "minWaitMs": 2000,
        "adaptiveMultiplier": 3.0,
        "checks": [
          { "type": "stopButton", "weight": 40, "condition": "hidden" },
          { "type": "loading", "weight": 20, "condition": "hidden" },
          { "type": "input", "weight": 30, "condition": "enabled" },
          { "type": "submit", "weight": 10, "condition": "enabled" }
        ],
        "threshold": 60,
        "thinking": {
          "enabled": true,
          "markers": ["Thinking...", "생각 중..."],
          "pauseDetection": true,
          "maxPauseDuration": 10000
        }
      },
      "features": {
        "usesNetworkMonitor": true,
        "disableInputOnGenerate": true,
        "shadowDOM": false,
        "thinkingMode": true
      },
      "plugin": "claude"
    }
  }
}
```

### 2. Monitor Factory Pattern

**현재: 하나의 거대한 함수** (content.js:2758-2994)
```javascript
function startResponseMonitoring(requestId) {
  // 모든 모델에 대한 로직이 하나의 함수 안에 혼재
  const config = getResponseConfig();
  // ...3000+ 줄의 if-else 분기...
}
```

**개선: Factory + Plugin 시스템**
```typescript
// monitor-factory.js
interface ModelManifest {
  id: string;
  selectors: SelectorSet;
  completion: CompletionConfig;
  features: FeatureFlags;
  plugin?: string;
}

class MonitorFactory {
  constructor(private manifests: ModelManifest[]) {}

  create(location: Location): ResponseMonitor {
    const manifest = this.findManifest(location);

    if (manifest.plugin) {
      // 모델별 커스텀 Monitor 로드
      return pluginRegistry.get(manifest.plugin)(manifest);
    }

    // 기본 Monitor 사용
    return new DefaultMonitor(manifest);
  }
}

// default-monitor.js
class DefaultMonitor {
  constructor(private manifest: ModelManifest) {
    this.signalBridge = new SignalBridge();
    this.stateMachine = new CompletionStateMachine(manifest.completion);
  }

  async run(requestId: string) {
    // 1. Network Layer
    if (this.manifest.features.usesNetworkMonitor) {
      this.networkMonitor = new NetworkMonitor();
      this.networkMonitor.on('sse:close', () => {
        this.signalBridge.emit('network:complete');
      });
    }

    // 2. UI Layer (MutationObserver + Interval)
    this.startUIMonitor();

    // 3. Text Layer
    this.startTextMonitor();

    // 4. Decision Layer (State Machine)
    this.signalBridge.on('*', (signal) => {
      this.stateMachine.process(signal);

      if (this.stateMachine.isCompleted()) {
        this.cleanup();
        this.onComplete(requestId);
      }
    });
  }

  private startUIMonitor() {
    // Hybrid: MutationObserver + setInterval
    const observer = new MutationObserver(() => {
      this.uiSignalQueue.push({ type: 'dom:changed', timestamp: Date.now() });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 1초마다 UI 상태 샘플링
    this.uiInterval = setInterval(() => {
      const signals = this.collectUISignals();
      signals.forEach(signal => this.signalBridge.emit(signal.type, signal));
    }, 1000);
  }

  collectUISignals(): Signal[] {
    const signals: Signal[] = [];

    // Stop 버튼
    const stopBtn = this.findElement(this.manifest.selectors.stop_button);
    signals.push({
      type: 'ui:stopButton',
      value: stopBtn && this.isVisible(stopBtn),
      confidence: stopBtn ? 1.0 : 0.5,
      timestamp: Date.now()
    });

    // Loading indicator
    // Input state
    // Submit button
    // ...

    return signals;
  }

  deriveAdaptiveDelay(activity: ActivityStats): number {
    const { minWaitMs, adaptiveMultiplier } = this.manifest.completion;
    const avgChunkInterval = activity.avgInterval || 500;

    return minWaitMs + (adaptiveMultiplier * avgChunkInterval);
  }
}

// claude-monitor.js (Plugin 예시)
class ClaudeMonitor extends DefaultMonitor {
  collectUISignals(): Signal[] {
    const signals = super.collectUISignals();

    // Thinking Mode 전용 감지
    const thinkingText = this.detectThinkingText();
    if (thinkingText) {
      signals.push({
        type: 'claude:thinking',
        value: true,
        confidence: 1.0,
        timestamp: Date.now()
      });
    }

    return signals;
  }

  private detectThinkingText(): boolean {
    const bodyText = document.body.innerText;
    return /Thinking\.\.\.|생각 중\.\.\./i.test(bodyText);
  }
}
```

### 3. 4-Layer Signal Pipeline

```
┌──────────────────────────────────────────────────────────┐
│ 1. Network Layer (Highest Priority)                      │
│    - SSE connection status                               │
│    - Last chunk timestamp                                │
│    - Stream closed event                                 │
│    → Hard completion signal (bypasses other checks)      │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 2. UI Layer (Visual Signals)                             │
│    - Stop button: visible → generating                   │
│    - Loading spinner: visible → generating               │
│    - Input field: disabled → generating                  │
│    - Submit button: disabled → generating                │
│    → Weighted scoring (model-specific thresholds)        │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 3. Text Layer (Content Change)                           │
│    - MutationObserver: DOM text changes                  │
│    - Chunk tracking: Δchars, interval                    │
│    - Idle detection: No change for adaptive_delay        │
│    → Activity statistics (avgInterval, lastChange)       │
└──────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────┐
│ 4. Decision Layer (State Machine)                        │
│    States: Idle → Generating → SuspectPause →           │
│            ThinkingMode → Completed                      │
│    Transitions:                                          │
│      - Generating: Network active OR Stop button visible │
│      - SuspectPause: No text change for 5s              │
│      - ThinkingMode: Thinking text detected             │
│      - Completed: Network closed + UI restored + idle    │
└──────────────────────────────────────────────────────────┘
```

### 4. State Machine (Completion Detection)

```typescript
enum State {
  Idle,
  Generating,
  SuspectPause,
  ThinkingMode,
  Completed
}

class CompletionStateMachine {
  private state: State = State.Idle;
  private signals: Map<string, Signal> = new Map();

  constructor(private config: CompletionConfig) {}

  process(signal: Signal) {
    this.signals.set(signal.type, signal);

    // Network Layer (최우선)
    if (signal.type === 'network:complete') {
      this.transition(State.Completed, 'Network stream closed');
      return;
    }

    // State 전환 로직
    switch (this.state) {
      case State.Idle:
        if (this.isGenerating()) {
          this.transition(State.Generating, 'Generation started');
        }
        break;

      case State.Generating:
        if (this.isThinkingMode()) {
          this.transition(State.ThinkingMode, 'Thinking mode detected');
        } else if (this.isSuspectPause()) {
          this.transition(State.SuspectPause, 'No activity detected');
        } else if (this.isCompleted()) {
          this.transition(State.Completed, 'All signals indicate completion');
        }
        break;

      case State.ThinkingMode:
        if (!this.isThinkingMode() && this.isCompleted()) {
          this.transition(State.Completed, 'Thinking ended, completed');
        }
        break;

      case State.SuspectPause:
        if (this.isGenerating()) {
          this.transition(State.Generating, 'Activity resumed');
        } else if (this.isCompleted()) {
          this.transition(State.Completed, 'Confirmed completion');
        }
        break;
    }
  }

  private isGenerating(): boolean {
    const stopBtn = this.signals.get('ui:stopButton');
    const networkActive = this.signals.get('network:active');

    return (stopBtn?.value === true) || (networkActive?.value === true);
  }

  private isThinkingMode(): boolean {
    if (!this.config.thinking?.enabled) return false;

    const thinkingSignal = this.signals.get('claude:thinking');
    return thinkingSignal?.value === true;
  }

  private isSuspectPause(): boolean {
    const textChange = this.signals.get('text:changed');
    if (!textChange) return false;

    const timeSinceLastChange = Date.now() - textChange.timestamp;
    return timeSinceLastChange > 5000; // 5초 이상 변화 없음
  }

  private isCompleted(): boolean {
    let score = 0;

    for (const check of this.config.checks) {
      const signal = this.signals.get(`ui:${check.type}`);
      if (!signal) continue;

      const matches = (check.condition === 'hidden' && !signal.value) ||
                      (check.condition === 'enabled' && signal.value);

      if (matches) {
        score += check.weight;
      }
    }

    return score >= this.config.threshold;
  }

  isCompleted(): boolean {
    return this.state === State.Completed;
  }
}
```

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Week 1)
**목표**: Manifest + Factory 기반 구조 전환

#### Step 1.1: Enhanced Manifest 설계
- [ ] `ai_model_dom_selectors.json` 확장
  - `completion` 섹션 추가
  - `features` 플래그 추가
  - `plugin` 필드 추가
- [ ] TypeScript 타입 정의 (manifest.d.ts)
- [ ] Validation 로직 구현

#### Step 1.2: MonitorFactory 구현
- [ ] `MonitorFactory` 클래스
- [ ] `DefaultMonitor` 베이스 클래스
- [ ] Plugin 레지스트리 시스템
- [ ] Manifest 로더

#### Step 1.3: Signal Infrastructure
- [ ] `SignalBridge` (EventEmitter)
- [ ] `Signal` 인터페이스 정의
- [ ] `CompletionStateMachine` 기본 구조

**검증**:
- [ ] ChatGPT 모델로 End-to-End 테스트
- [ ] 기존 stabilizationTime 방식과 병렬 실행 비교
- [ ] False Positive/Negative 비율 측정

### Phase 2: Signal Pipeline (Week 2)
**목표**: 4-Layer 감지 시스템 구현

#### Step 2.1: Network Layer
- [ ] NetworkMonitor 클래스
- [ ] SSE/Fetch/XHR 인터셉터
- [ ] `network:complete` 신호 emit

#### Step 2.2: UI Layer (Hybrid)
- [ ] MutationObserver + setInterval 통합
- [ ] Signal Queue (debounce)
- [ ] Element caching (성능 최적화)
- [ ] Visibility check 로직

#### Step 2.3: Text Layer
- [ ] Chunk tracking (Δchars, interval)
- [ ] Adaptive delay 계산
- [ ] Activity statistics

#### Step 2.4: Decision Layer
- [ ] State Machine transitions
- [ ] Weighted scoring
- [ ] Thinking Mode detection

**검증**:
- [ ] 3개 모델 (Claude, ChatGPT, Gemini) 통합 테스트
- [ ] Thinking Mode 시나리오 테스트 (Claude)
- [ ] 네트워크 불안정 시나리오 (시뮬레이션)

### Phase 3: Model Plugins (Week 3)
**목표**: 모델별 특수 로직 구현

#### Step 3.1: Claude Plugin
- [ ] Thinking Mode 감지
- [ ] Artifacts 처리
- [ ] Custom pause detection

#### Step 3.2: Qwen Plugin
- [ ] 긴 대기 시간 대응
- [ ] 텍스트 기반 Stop 버튼 감지
- [ ] 복사 버튼 체크

#### Step 3.3: 나머지 10개 모델
- [ ] Grok, DeepSeek, LMArena, Mistral
- [ ] OpenRouter, Kimi, Gemini
- [ ] Codex, Claude Code, Perplexity

**검증**:
- [ ] 전체 13개 모델 통합 테스트
- [ ] 실제 사용 시나리오 (Brain Flow 전체 워크플로우)
- [ ] 성능 메트릭 (응답 시간, 정확도)

### Phase 4: Telemetry & Optimization (Week 4)
**목표**: 런타임 학습 및 최적화

#### Step 4.1: Telemetry System
- [ ] Per-model 통계 수집
  - P50/P90 chunk interval
  - Average stabilization time
  - Completion signal confidence
- [ ] IndexedDB 저장
- [ ] UI Dashboard (선택)

#### Step 4.2: Adaptive Learning
- [ ] `adaptiveMultiplier` 자동 조정
- [ ] Selector health check (실패율 추적)
- [ ] Fallback 메커니즘

#### Step 4.3: Performance Optimization
- [ ] MutationObserver throttle 최적화
- [ ] Element 캐싱 전략
- [ ] Memory leak 방지

**검증**:
- [ ] 7일간 실제 사용 데이터 수집
- [ ] False Positive/Negative 비율 < 1%
- [ ] 평균 응답 감지 시간 < 2초

---

## 🎯 Success Metrics

### 정량 지표
| Metric | Current | Target | 측정 방법 |
|--------|---------|--------|-----------|
| False Negative Rate | ~5% | < 1% | 응답 잘림 발생 비율 |
| False Positive Rate | ~10% | < 1% | 불필요한 대기 시간 |
| Avg Detection Time | ~10s | < 2s | 응답 완료 → 감지 |
| New Model Onboarding | 30분 | 5분 | 설정 작성 시간 |
| Code Duplication | 2x | 1x | JSON vs JS selector |

### 정성 지표
- [ ] Thinking Mode 완벽 지원
- [ ] 네트워크 불안정 환경 대응
- [ ] DOM 변경 시 자동 Fallback
- [ ] 신규 모델 추가 시 최소 코드 변경

---

## 🚧 Risk Mitigation

### Risk 1: 기존 기능 파괴
**Mitigation**:
- Phase 1에서 기존 코드와 병렬 실행
- Feature Flag로 점진적 롤아웃
- Rollback 계획 수립

### Risk 2: 성능 저하
**Mitigation**:
- MutationObserver throttle
- Element caching
- 프로파일링 (Chrome DevTools)

### Risk 3: 특정 모델 호환성
**Mitigation**:
- 모델별 Plugin 시스템
- Fallback 메커니즘
- Telemetry로 실시간 모니터링

---

## 📚 References

- **Codex 제안서**: Bash e03980 출력
- **HTML 분석**: Bash bd9629, 9d5f2d 작업
- **기존 문서**:
  - `/BRAINFLOW.md` (lines 220-274)
  - `/BRAINFLOW_REDESIGN_PLAN.md`
  - `/public/content.js` (lines 2514-2994)

---

**다음 단계**: Phase 1 Step 1.1 착수 승인 대기
