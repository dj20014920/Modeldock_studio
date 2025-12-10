// ModelDock Content Script v15.8 (Multi-Model Completion Detection Fix - DeepSeek, Kimi, Qwen, Mistral, OpenRouter, Gemini)
// Ported from text-injection-bridge.ts.back
// 2025.12.06: Refactored for robust completion detection and manifest-first parsing
// 2025.12.09: Fixed LMArena user message copying and Skip/Empty response issues

// ============================================================
// 🎯 Phase 1: Model Manifest Loader
// ============================================================
let MODEL_MANIFESTS = null;
// 미리 로드해서 동기 코드 경로에서 활용
const MODEL_MANIFESTS_READY = loadModelManifests();

// 수동 호스트 → 매니페스트 ID 매핑 (자동 매핑 보완)
const MANIFEST_HOST_MAP = {
  'claude.ai': 'claude',
  'chat.openai.com': 'chatgpt',
  'chatgpt.com': 'chatgpt',
  'gemini.google.com': 'gemini',
  'kimi.moonshot.cn': 'kimi',
  'kimi.com': 'kimi',
  'chat.mistral.ai': 'mistral'
};

/**
 * Load and parse ai_model_dom_selectors.json
 * @returns {Promise<Object>} Parsed manifest data
 */
async function loadModelManifests() {
  if (MODEL_MANIFESTS) return MODEL_MANIFESTS;

  try {
    const response = await fetch(chrome.runtime.getURL('ai_model_dom_selectors.json'));
    const data = await response.json();
    MODEL_MANIFESTS = data.models;
    console.log('[BrainFlow] Model manifests loaded:', Object.keys(MODEL_MANIFESTS));
    return MODEL_MANIFESTS;
  } catch (error) {
    console.error('[BrainFlow] Failed to load model manifests:', error);
    return {};
  }
}

// ============================================================
// 🎯 Phase 2: MonitorFactory & DefaultMonitor
// ============================================================

/**
 * DefaultMonitor - 기본 모니터 클래스
 * 모든 모델에 공통적으로 적용되는 기본 로직
 */
class DefaultMonitor {
  constructor(manifest, requestId) {
    this.manifest = manifest;
    this.requestId = requestId;
    this.activityStats = {
      lastChunkTime: Date.now(),
      avgChunkInterval: 1000,
      totalChunks: 0
    };
  }

  /**
   * UI 신호 수집
   */
  collectSignals() {
    const signals = {
      stopButton: this._checkStopButton(),
      inputEnabled: this._checkInputEnabled(),
      loadingIndicator: this._checkLoadingIndicator(),
      submitButton: this._checkSubmitButton(),
      actionButtons: this._checkActionButtons(),
      timestamp: Date.now()
    };
    return signals;
  }

  _checkStopButton() {
    const stopButton = this.manifest.selectors?.stop_button;
    if (!stopButton) return false;
    const button = this._querySelectors(stopButton);
    return Boolean(button && button.offsetParent !== null);
  }

  _checkActionButtons() {
    const actionButtons = this.manifest.selectors?.action_buttons;
    if (!actionButtons) return false;
    const buttons = this._querySelectors(actionButtons);
    // Action buttons typically appear AFTER generation is done
    return Boolean(buttons && buttons.offsetParent !== null);
  }

  _checkInputEnabled() {
    const inputField = this.manifest.selectors?.input_field;
    if (!inputField) return false;
    const input = this._querySelectors(inputField);
    if (!input) return false;

    const inferredType = (inputField.type || '').toLowerCase();
    if (inferredType === 'textarea' || input.tagName === 'TEXTAREA') {
      return !input.disabled;
    } else if (inferredType === 'contenteditable' || input.isContentEditable || input.getAttribute('contenteditable') !== null) {
      return input.getAttribute('contenteditable') !== 'false';
    }
    return !input.disabled;
  }

  _checkLoadingIndicator() {
    const loadingIndicator = this.manifest.selectors?.loading_indicator;
    if (!loadingIndicator) return false;

    const indicator = this._querySelectors(loadingIndicator);
    return Boolean(indicator && indicator.offsetParent !== null);
  }

  _checkSubmitButton() {
    const submitButton = this.manifest.selectors?.submit_button;
    if (!submitButton) return false;
    const btn = this._querySelectors(submitButton);
    return Boolean(btn && !btn.disabled);
  }

  _safeQuerySelector(selector) {
    if (!selector) return null;
    try {
      return document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  _querySelectors(selectorConfig) {
    if (!selectorConfig) return null;
    const selectors = [selectorConfig.primary, ...(selectorConfig.alternatives || [])].filter(Boolean);
    for (const selector of selectors) {
      const element = this._safeQuerySelector(selector);
      if (element) return element;
    }
    return null;
  }

  /**
   * Adaptive delay 계산
   */
  deriveAdaptiveDelay() {
    const completion = this.manifest.completion || { minWaitMs: 10000, adaptiveMultiplier: 1 };
    const { minWaitMs, adaptiveMultiplier } = completion;
    return minWaitMs + (adaptiveMultiplier * this.activityStats.avgChunkInterval);
  }

  /**
   * 완료 판정
   */
  shouldComplete(signals) {
    const completion = this.manifest.completion || { checks: [] };
    const { checks = [] } = completion;

    // 필수 체크: Stop 버튼 없음 + Input 활성화
    if (checks.includes('stopButton') && signals.stopButton) return false;
    if (checks.includes('inputEnabled') && !signals.inputEnabled) return false;
    if (checks.includes('loadingIndicator') && signals.loadingIndicator) return false;

    // Action Buttons check (Mistral, Kimi etc): must be present to be complete
    if (checks.includes('actionButtons') && !signals.actionButtons) return false;

    // Thinking mode 체크 (Claude 등)
    if (completion.thinking?.enabled) {
      const thinkingPatterns = completion.thinking.patterns || [];
      const responseArea = this.manifest.selectors?.response_area;

      if (responseArea && thinkingPatterns.length > 0) {
        const responseElement = this._querySelectors(responseArea);
        if (responseElement) {
          const text = responseElement.textContent || '';
          // "Thinking...", "Reasoning...\" 등의 패턴이 보이면 아직 생각 중
          const isThinking = thinkingPatterns.some(pattern => text.includes(pattern));
          if (isThinking) {
            console.log('[DefaultMonitor] ⏳ Thinking mode detected:', thinkingPatterns.find(p => text.includes(p)));
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * 모니터링 시작
   */
  async run() {
    console.log('[MonitorFactory] Starting monitor for:', this.manifest.id);

    let checkCount = 0;
    const maxChecks = 100; // 최대 100회 체크 (약 100초)
    const checkInterval = 1000; // 1초마다 체크

    while (checkCount < maxChecks) {
      const signals = this.collectSignals();

      if (this.shouldComplete(signals)) {
        console.log('[MonitorFactory] Completion detected!', signals);
        return { success: true, signals };
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
      checkCount++;
    }

    console.warn('[MonitorFactory] Timeout after', maxChecks, 'checks');
    return { success: false, reason: 'timeout' };
  }
}

/**
 * ChatGPTMonitor - ChatGPT 전용 모니터 클래스
 * 100% DOM 동적 감지 기반 응답 완료 판정
 *
 * 핵심 원칙:
 * 1. manifest 기반 셀렉터 사용 (하드코딩 제거)
 * 2. 다층 신호 수집 (Stop, Streaming, Copy, Input)
 * 3. 우선순위 기반 완료 판정
 * 4. 최소 응답 길이 검증
 */
class ChatGPTMonitor extends DefaultMonitor {
  constructor(manifest, requestId) {
    super(manifest, requestId);
    this.MIN_COMPLETION_LENGTH = 50; // 최소 응답 길이
    this.lastTextLength = 0;
    this.stableChecks = 0; // 안정화 카운터
    this.STABLE_THRESHOLD = 3; // 3회 연속 동일하면 완료로 간주
  }

  /**
   * ChatGPT 전용 신호 수집 (override)
   * 기본 신호 + ChatGPT 특화 신호
   */
  collectSignals() {
    const baseSignals = super.collectSignals();

    // ChatGPT 전용 추가 신호
    const copyButton = this._checkCopyButtonInLastMessage();
    const lastAssistantMessage = this._getLastAssistantMessage();
    const textLength = lastAssistantMessage
      ? (lastAssistantMessage.textContent || '').trim().length
      : 0;

    // 텍스트 안정성 체크 (변화 없으면 완료 가능성 높음)
    if (textLength > 0 && textLength === this.lastTextLength) {
      this.stableChecks++;
    } else {
      this.stableChecks = 0;
    }
    this.lastTextLength = textLength;

    return {
      ...baseSignals,
      // baseSignals.loadingIndicator를 재사용 (DRY 원칙)
      copyButton,
      lastAssistantMessage,
      textLength,
      isTextStable: this.stableChecks >= this.STABLE_THRESHOLD,
      timestamp: Date.now()
    };
  }

  /**
   * ChatGPT 전용 완료 판정 (override)
   * 우선순위 기반 다층 검증
   * 🔧 v15.2: streaming-animation 클래스 직접 체크 추가
   */
  shouldComplete(signals) {
    // === Priority 0: streaming-animation 클래스 직접 체크 (가장 확실한 신호) ===
    const streamingAnimationElement = document.querySelector('.streaming-animation');
    if (streamingAnimationElement && streamingAnimationElement.offsetParent !== null) {
      console.log('[ChatGPTMonitor v15.2] 🔴 Generating: streaming-animation class detected');
      return false;
    }

    // === Priority 1: 생성 중 명확 신호 → 즉시 false ===

    // 1-1. Stop 버튼 visible
    if (signals.stopButton) {
      console.log('[ChatGPTMonitor] 🔴 Generating: Stop button visible');
      return false;
    }

    // 1-2. Loading indicator visible (animation 포함)
    if (signals.loadingIndicator) {
      console.log('[ChatGPTMonitor] 🔴 Generating: Loading indicator visible');
      return false;
    }

    // 1-3. Input disabled (생성 중에는 입력창 비활성화)
    if (!signals.inputEnabled) {
      console.log('[ChatGPTMonitor] 🔴 Generating: Input disabled');
      return false;
    }

    // === Priority 2: 최소 길이 검증 ===
    if (signals.textLength < this.MIN_COMPLETION_LENGTH) {
      console.log(`[ChatGPTMonitor] ⏳ Waiting: Text too short (${signals.textLength}/${this.MIN_COMPLETION_LENGTH})`);
      return false;
    }

    // === Priority 3: 완료 신호 검증 ===

    // 3-1. Copy 버튼 + 충분한 텍스트 (최고 신뢰도)
    if (signals.copyButton && signals.textLength > this.MIN_COMPLETION_LENGTH) {
      console.log(`[ChatGPTMonitor] ✅ COMPLETE: Copy button + text (${signals.textLength} chars, confidence: 95%)`);
      return true;
    }

    // 3-2. 텍스트 안정화 + 충분한 텍스트 (높은 신뢰도)
    if (signals.isTextStable && signals.textLength > this.MIN_COMPLETION_LENGTH) {
      console.log(`[ChatGPTMonitor] ✅ COMPLETE: Text stable for ${this.stableChecks} checks (${signals.textLength} chars, confidence: 90%)`);
      return true;
    }

    // 3-3. Loading 신호 없음 + Input 활성화 + 충분한 텍스트 (폴백, 중간 신뢰도)
    if (!signals.loadingIndicator &&
      !signals.stopButton &&
      signals.inputEnabled &&
      signals.textLength > this.MIN_COMPLETION_LENGTH * 1.5) { // 더 긴 텍스트 요구
      console.log(`[ChatGPTMonitor] ✅ COMPLETE: Stable fallback (${signals.textLength} chars, confidence: 80%)`);
      return true;
    }

    // 아직 완료 아님
    console.log(`[ChatGPTMonitor] ⏳ Waiting: stableChecks=${this.stableChecks}, textLen=${signals.textLength}`);
    return false;
  }

  /**
   * Loading indicator 체크 (override)
   * ChatGPT는 streaming-animation 클래스 + CSS animation도 함께 체크
   * 🔧 v15.2: streaming-animation 클래스 직접 감지 추가
   */
  _checkLoadingIndicator() {
    // 🔧 v15.2 CRITICAL: streaming-animation 클래스 직접 체크 (가장 확실한 신호)
    const streamingAnimationElement = document.querySelector('.streaming-animation');
    if (streamingAnimationElement && streamingAnimationElement.offsetParent !== null) {
      console.log('[ChatGPTMonitor v15.2] 🔴 streaming-animation class detected');
      return true;
    }

    const loadingIndicator = this.manifest.selectors?.loading_indicator;
    if (!loadingIndicator) return false;

    const indicator = this._querySelectors(loadingIndicator);
    if (!indicator || indicator.offsetParent === null) return false;

    // ChatGPT 특화: CSS animation/pulse도 생성 중 신호로 간주
    const style = window.getComputedStyle(indicator);
    const hasAnimation = style.animation !== 'none' ||
      indicator.classList.contains('animate-pulse') ||
      indicator.classList.contains('animate-spin');

    return hasAnimation || true; // visible하면 무조건 true
  }

  /**
   * 마지막 assistant 메시지에서만 Copy 버튼 체크
   * 이전 메시지의 Copy 버튼을 잘못 감지하는 것 방지
   */
  _checkCopyButtonInLastMessage() {
    const lastMsg = this._getLastAssistantMessage();
    if (!lastMsg) return false;

    // 마지막 메시지 내부에서만 Copy 버튼 검색
    const copyButton = lastMsg.querySelector(
      'button[aria-label*="Copy"], ' +
      'button[data-testid*="copy"], ' +
      'button[class*="copy"], ' +
      '[data-sentry-component="CopyButton"]'
    );

    return Boolean(copyButton && copyButton.offsetParent !== null);
  }

  /**
   * 정확한 마지막 assistant 메시지 식별
   * querySelectorAll + [length-1] 패턴으로 확실하게 마지막 메시지만 선택
   */
  _getLastAssistantMessage() {
    const messages = document.querySelectorAll('div[data-message-author-role="assistant"]');
    if (messages.length === 0) return null;

    // 마지막 메시지 반환
    const lastMessage = messages[messages.length - 1];

    // .markdown 컨테이너가 있으면 그것을 반환 (텍스트 추출용)
    const markdownContent = lastMessage.querySelector('.markdown') || lastMessage;
    return markdownContent;
  }

  /**
   * Adaptive delay 계산 (override)
   * ChatGPT는 빠른 응답이므로 짧은 딜레이
   */
  deriveAdaptiveDelay() {
    const completion = this.manifest.completion || { minWaitMs: 1000, adaptiveMultiplier: 1.0 };
    const { minWaitMs, adaptiveMultiplier } = completion;

    // ChatGPT는 일반적으로 빠르므로 기본 1초 체크 간격
    return Math.max(1000, minWaitMs + (adaptiveMultiplier * this.activityStats.avgChunkInterval));
  }
}

/**
 * MonitorFactory - 모니터 생성 팩토리
 * Plugin 시스템으로 모델별 전용 Monitor 반환
 */
class MonitorFactory {
  static async createMonitor(hostname, requestId) {
    const manifest = await getManifestForHost(hostname);

    if (!manifest) {
      console.warn('[MonitorFactory] No manifest for:', hostname);
      return null;
    }

    // Plugin 기반 Monitor 선택
    if (manifest.plugin) {
      console.log('[MonitorFactory] Creating monitor for plugin:', manifest.plugin);

      switch (manifest.plugin) {
        case 'chatgpt':
          console.log('[MonitorFactory] ✅ Using ChatGPTMonitor');
          return new ChatGPTMonitor(manifest, requestId);

        case 'claude':
          // TODO: ClaudeMonitor 구현 후 활성화
          console.log('[MonitorFactory] ⚠️ ClaudeMonitor not implemented yet, using default');
          break;

        case 'gemini':
          // TODO: GeminiMonitor 구현 후 활성화
          console.log('[MonitorFactory] ⚠️ GeminiMonitor not implemented yet, using default');
          break;

        default:
          console.log('[MonitorFactory] ⚠️ Unknown plugin:', manifest.plugin);
      }
    }

    // Fallback: DefaultMonitor
    console.log('[MonitorFactory] Using DefaultMonitor');
    return new DefaultMonitor(manifest, requestId);
  }
}

/**
 * Get manifest for current location
 * @param {string} hostname - Current hostname
 * @returns {Promise<Object|null>} Model manifest or null
 */
async function getManifestForHost(hostname) {
  await MODEL_MANIFESTS_READY.catch(() => { /* handled below */ });
  const manifest = resolveManifestFromCache(hostname);
  if (manifest) return manifest;

  console.log('[BrainFlow] No manifest found for:', hostname);
  return null;
}

function parseHostnameSafe(url) {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

function resolveManifestFromCache(hostname) {
  const manifests = MODEL_MANIFESTS || {};
  const normalizedHost = (hostname || '').toLowerCase();

  const manualId = MANIFEST_HOST_MAP[normalizedHost];
  if (manualId && manifests[manualId]) {
    return { ...manifests[manualId], id: manifests[manualId].id || manualId };
  }

  // URL 기반 자동 매핑 (manifest.url 우선)
  for (const [modelId, manifest] of Object.entries(manifests)) {
    const urlHost = parseHostnameSafe(manifest.url);
    if (!urlHost) continue;
    if (normalizedHost === urlHost || normalizedHost.endsWith(`.${urlHost}`)) {
      return { ...manifest, id: manifest.id || modelId };
    }
  }

  return null;
}

// TODO Phase 2: Replace RESPONSE_CONFIGS with manifest-based system
// TODO Phase 3: Implement MonitorFactory pattern

(() => {
  if (window.hasModelDockListener) return;
  window.hasModelDockListener = true;

  // --- v0 Main World Injection (CRITICAL) ---
  const IS_V0 = window.location.hostname.includes('v0.app') || window.location.hostname.includes('v0.dev');
  if (IS_V0) {
    console.log('[ModelDock] 🔧 V0 detected - injecting main world interceptor');
    const injectMainWorldScript = () => {
      const script = document.createElement('script');
      script.textContent = `
        (function() {
          console.log('[V0 Main World] 🎯 PostMessage interceptor installed');
          const originalPostMessage = window.postMessage.bind(window);
          window.postMessage = function(message, targetOrigin, transfer) {
            if (message && message.type === 'MODEL_DOCK_INJECT_TEXT') {
              window.dispatchEvent(new CustomEvent('__MD_V0_INJECT_REQUEST', { detail: message }));
              return; 
            }
            if (transfer) originalPostMessage(message, targetOrigin, transfer);
            else originalPostMessage(message, targetOrigin);
          };
        })();
      `;
      (document.head || document.documentElement).appendChild(script);
      script.remove();
    };
    if (document.documentElement) injectMainWorldScript();
    else document.addEventListener('DOMContentLoaded', injectMainWorldScript, { once: true });

    window.addEventListener('__MD_V0_INJECT_REQUEST', (event) => {
      const customEvent = event;
      console.log('[ModelDock] 📥 V0 CustomEvent received');
      // Re-route to handleInjection
      if (customEvent.detail && customEvent.detail.payload) {
        handleInjection(customEvent.detail.payload.text, customEvent.detail.payload.targets);
      }
    });
  }

  // --- postMessage Bridge (iframe <-> parent) ---
  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || data.type !== 'MODEL_DOCK_INJECT_TEXT') return;
    const { text, targets, requestId, submit = true, forceKey = false, modelId, skipInject = false } = data.payload || {};
    if (!text || !targets) return;

    const result = await handleInjection(text, targets, { submit, forceKey, modelId, skipInject });
    try {
      window.parent.postMessage({
        type: 'MODEL_DOCK_INJECT_RESPONSE',
        payload: {
          requestId,
          success: result.status === 'success',
          status: result.status,
          host: window.location.host,
          modelId
        }
      }, '*');
    } catch (err) {
      console.warn('[ModelDock] Response postMessage failed', err);
    }
  });

  // === Image Injection Bridge ===
  // 📸 이미지 직접 주입 (Paste 시뮬레이션)
  // DataURL -> Blob -> File -> DataTransfer -> Paste Event
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'INJECT_IMAGE') {
      const { dataUrl, targets } = request.payload;
      handleImageInjection(dataUrl, targets).then((result) => {
        sendResponse(result);
      });
      return true;
    }
  });

  // PostMessage Bridge for Images (if needed via iframe)
  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || data.type !== 'MODEL_DOCK_INJECT_IMAGE') return;

    const { dataUrl, targets, requestId } = data.payload || {};
    if (!dataUrl) return;

    const result = await handleImageInjection(dataUrl, targets);

    try {
      window.parent.postMessage({
        type: 'MODEL_DOCK_INJECT_RESPONSE', // Re-use generic response type
        payload: {
          requestId,
          success: result.status === 'success',
          status: result.status,
          host: window.location.host
        }
      }, '*');
    } catch (err) {
      console.warn('[ModelDock] Image response postMessage failed', err);
    }
  });

  async function handleImageInjection(dataUrl, targets) {
    console.log('[ModelDock] 📸 Handle Image Injection');

    // 1. Convert DataURL to File
    const blob = await fetch(dataUrl).then(res => res.blob());
    const file = new File([blob], "screenshot.png", { type: "image/png" });

    // 2. Find Input Element (Re-use logic)
    let foundInput = null;

    // AI Studio detection
    const isAIStudio = window.location.hostname.includes('aistudio.google.com');

    for (const target of targets) {
      const selectors = target.inputSelector.split(',').map(s => s.trim());
      for (const selector of selectors) {
        let el = null;
        if (isAIStudio) {
          const elements = queryShadowAll(document.body, selector);
          el = elements.find(e => isElementVisible(e)) || null;
        } else {
          el = queryShadow(document.body, selector);
        }

        if (el && isElementVisible(el)) {
          foundInput = el;
          break;
        }
      }
      if (foundInput) break;
    }

    if (!foundInput) {
      // Fallback logic from handleInjection
      const fallbacks = document.querySelectorAll('textarea, [contenteditable="true"]');
      for (const fb of fallbacks) {
        if (isElementVisible(fb)) {
          foundInput = fb;
          break;
        }
      }
    }

    if (!foundInput) {
      console.error('[ModelDock] ❌ No input found for image injection');
      return { status: 'no_input_found' };
    }

    console.log('[ModelDock] ✅ Found input for image:', foundInput);

    // 3. Simulate Paste / Drop
    try {
      foundInput.focus();

      // Method A: ClipboardEvent with DataTransfer (Modern)
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      });
      foundInput.dispatchEvent(pasteEvent);

      // Method B: Drop Event (Fallback for some editors like ProseMirror)
      const dragEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      foundInput.dispatchEvent(dragEvent);

      // Method C: Input Event with insertFromPaste (Legacy)
      const inputEvent = new InputEvent('input', {
        inputType: 'insertFromPaste',
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      foundInput.dispatchEvent(inputEvent);

      console.log('[ModelDock] 📸 Image paste simulated');
      return { status: 'success' };

    } catch (error) {
      console.error('[ModelDock] Image injection failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type !== 'INJECT_INPUT') return;
    const { text, targets, submit = true, forceKey = false, modelId, skipInject = false } = request.payload;
    handleInjection(text, targets, { submit, forceKey, modelId, skipInject }).then((result) => {
      sendResponse(result);
    });
    return true;
  });

  // === Brain Flow History: Current URL tracker ===
  // 🔒 SECURITY: Enhanced with 2024 postMessage best practices
  // Listen for URL requests from parent frame (for history save)
  window.addEventListener('message', async (event) => {
    const data = event.data;
    if (!data || data.type !== 'MODEL_DOCK_GET_CURRENT_URL') return;

    const { requestId } = data.payload || {};

    try {
      // 🔒 SECURITY: Determine safe targetOrigin
      // Use document.referrer if available, otherwise use window.location.origin
      let targetOrigin = '*';

      if (document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          // Only trust chrome-extension protocol (our extension)
          if (referrerUrl.protocol === 'chrome-extension:') {
            targetOrigin = referrerUrl.origin;
          }
        } catch (e) {
          console.warn('[ModelDock] Failed to parse referrer, using wildcard');
        }
      }

      // 🔒 SECURITY: Sanitize URL before sending
      let sanitizedUrl = window.location.href;
      try {
        const urlObj = new URL(sanitizedUrl);
        // Only allow http/https
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
          console.warn('[ModelDock] Non-HTTP(S) URL detected, rejecting');
          sanitizedUrl = '';
        }
      } catch (e) {
        console.warn('[ModelDock] Invalid URL format');
        sanitizedUrl = '';
      }

      window.parent.postMessage({
        type: 'MODEL_DOCK_CURRENT_URL_RESPONSE',
        payload: {
          requestId,
          url: sanitizedUrl,
          host: window.location.host,
          pathname: window.location.pathname
        }
      }, targetOrigin);

    } catch (err) {
      console.warn('[ModelDock] Failed to send current URL:', err);
    }
  });

  // --- Deep Search & Helpers ---
  function queryShadow(root, selector) {
    if (!root) return null;
    try {
      const el = root.querySelector(selector);
      if (el) return el;
    } catch (e) { }
    const elements = root.querySelectorAll('*');
    for (const element of elements) {
      if (element.shadowRoot) {
        const found = queryShadow(element.shadowRoot, selector);
        if (found) return found;
      }
    }
    return null;
  }

  // Shadow DOM 탐색 (모든 요소 찾기) - AI Studio용
  function queryShadowAll(root, selector) {
    const results = [];
    const visit = (node) => {
      try {
        const found = node.querySelectorAll(selector);
        if (found) results.push(...found);

        const all = node.querySelectorAll('*');
        if (all) {
          for (const el of all) {
            if (el.shadowRoot) visit(el.shadowRoot);
          }
        }
      } catch (e) { }
    };
    visit(root);
    return results;
  }

  function isElementVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }

  // --- Advanced Event Triggering ---
  function triggerInputEvents(element) {
    element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    try {
      element.dispatchEvent(new InputEvent('beforeinput', {
        bubbles: true, cancelable: true, inputType: 'insertText', data: (element.value || element.textContent)
      }));
    } catch (e) { }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    // React 17+
    try {
      element.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true }));
    } catch (e) { }
  }

  async function handleInjection(text, targets, options = {}) {
    const { submit = true, forceKey = false, modelId, skipInject = false } = options;
    let matchedTarget = null;
    let foundInput = null;

    // 🔧 v15.3: 디버깅 로그 추가 (BrainFlow 주입 문제 추적)
    console.log('[ModelDock v15.3] 📥 handleInjection called:', {
      hostname: window.location.hostname,
      modelId,
      textLength: text?.length || 0,
      targetsCount: targets?.length || 0,
      submit,
      skipInject
    });

    // AI Studio detection (Shadow DOM 깊이 탐색 필요)
    const isAIStudio = window.location.hostname.includes('aistudio.google.com');

    // 1. Find Input
    for (const target of targets) {
      const selectors = target.inputSelector.split(',').map(s => s.trim());
      console.log(`[ModelDock v15.3] 🔍 Trying selectors for ${target.modelId}:`, selectors);

      for (const selector of selectors) {
        let el = null;

        if (isAIStudio) {
          // AI Studio: Shadow DOM 전체 탐색
          const elements = queryShadowAll(document.body, selector);
          el = elements.find(e => isElementVisible(e)) || null;
        } else {
          // 기존 로직: 첫 번째 매칭만
          el = queryShadow(document.body, selector);
        }

        if (el && isElementVisible(el)) {
          matchedTarget = target;
          foundInput = el;
          console.log(`[ModelDock v15.3] ✅ Found input with selector: ${selector}`, el);
          break;
        } else if (el) {
          console.log(`[ModelDock v15.3] ⚠️ Found element but not visible: ${selector}`);
        }
      }
      if (foundInput) break;
    }

    if (!foundInput) {
      // Fallback: try finding ANY visible textarea or contenteditable if specific selectors fail
      // This helps with Mistral or generic pages
      const fallbacks = document.querySelectorAll('textarea, [contenteditable="true"]');
      for (const fb of fallbacks) {
        if (isElementVisible(fb)) {
          foundInput = fb;
          // Try to guess model ID or use default
          matchedTarget = targets[0] || { modelId: 'unknown', forceEnter: true };
          console.log('[ModelDock] Using fallback input:', fb);
          break;
        }
      }
    }

    if (!foundInput || !matchedTarget) {
      console.error('[ModelDock v15.3] ❌ No input found! Tried all selectors.');
      return { status: 'no_target_match', host: window.location.host };
    }

    const { submitSelector, modelId: targetModelId, forceEnter, delayBeforeSubmit, submitKey } = matchedTarget;
    const effectiveModelId = modelId || targetModelId;

    console.log('[ModelDock v15.3] ✅ Input found, proceeding with injection:', {
      elementType: foundInput.tagName,
      isContentEditable: foundInput.isContentEditable,
      modelId: effectiveModelId
    });

    try {
      // 2. Inject Text
      let injectionSuccess = true;
      if (!skipInject) {
        injectionSuccess = await robustInject(foundInput, text, effectiveModelId);
      }

      if (injectionSuccess) {
        // 주입 전용 패스: submit이 false이면 여기서 종료
        if (submit === false) {
          return { status: 'success', host: window.location.host, modelId: effectiveModelId };
        }

        await new Promise(r => setTimeout(r, delayBeforeSubmit || 300));

        // 3. Submit
        let submitted = false;

        // Filter sidebar buttons! (강화된 필터링)
        const isSidebarButton = (btn) => {
          const label = (btn.getAttribute('aria-label') || '').toLowerCase();
          const cls = (btn.className || '').toLowerCase();
          const testId = (btn.getAttribute('data-testid') || '').toLowerCase();
          const role = (btn.getAttribute('role') || '').toLowerCase();

          // Menu/Sidebar 관련
          if (label.includes('menu') || label.includes('sidebar') || label.includes('nav') ||
            cls.includes('sidebar') || cls.includes('menu') || role === 'navigation') {
            return true;
          }

          // Stop/Cancel 버튼 (Claude, GPT 등에서 생성 중지 버튼 방지)
          if (label.includes('stop') || label.includes('cancel') ||
            testId.includes('stop') || testId.includes('cancel')) {
            return true;
          }

          return false;
        };

        // 🔧 OpenRouter 전송 버튼 활성화 대기 로직 추가
        const isOpenRouter = effectiveModelId === 'openrouter' || window.location.hostname.includes('openrouter.ai');

        if (submitSelector) {
          const selectors = submitSelector.split(',').map(s => s.trim());
          // OpenRouter의 경우 더 긴 폴링 시간과 활성화 체크 강화
          const maxPollTime = isOpenRouter ? 10000 : 3000; // OpenRouter: 10초, 기타: 3초
          const startTime = Date.now();
          let attemptCount = 0;

          while (Date.now() - startTime < maxPollTime && !submitted) {
            attemptCount++;
            for (const sel of selectors) {
              let btn = null;

              if (isAIStudio) {
                // AI Studio: Shadow DOM 전체 탐색
                const buttons = queryShadowAll(document.body, sel);
                btn = buttons.find(b =>
                  !b.disabled &&
                  b.getAttribute('aria-disabled') !== 'true' &&
                  isElementVisible(b) &&
                  !isSidebarButton(b)
                ) || null;

                if (attemptCount === 1 && buttons.length > 0) {
                  console.log(`[ModelDock] AI Studio: Found ${buttons.length} buttons for selector "${sel}"`);
                }
              } else {
                // 기존 로직: 첫 번째 매칭만
                btn = queryShadow(document.body, sel);
              }

              if (btn) {
                // OpenRouter 전용: 버튼이 완전히 활성화될 때까지 기다림
                if (isOpenRouter) {
                  const dataState = btn.getAttribute('data-state');
                  const isFullyEnabled = !btn.disabled &&
                    btn.getAttribute('aria-disabled') !== 'true' &&
                    isElementVisible(btn) &&
                    !btn.classList.contains('opacity-40') &&
                    !btn.classList.contains('pointer-events-none') &&
                    dataState !== 'loading' &&
                    dataState !== 'open' &&
                    dataState !== 'pending' &&
                    (!dataState || dataState === 'closed') &&
                    !btn.hasAttribute('disabled');

                  if (!isFullyEnabled) {
                    console.log(`[ModelDock] OpenRouter: Button not ready yet (attempt ${attemptCount}): disabled=${btn.disabled}, aria-disabled=${btn.getAttribute('aria-disabled')}, visible=${isElementVisible(btn)}, opacity-40=${btn.classList.contains('opacity-40')}, data-state=${btn.getAttribute('data-state')}`);
                    continue; // 아직 준비 안 됨, 다음 시도
                  }
                } else {
                  // 일반 모델: 기존 조건
                  if (btn.disabled || btn.getAttribute('aria-disabled') === 'true' || !isElementVisible(btn)) {
                    continue;
                  }
                }

                if (isSidebarButton(btn)) {
                  console.warn('[ModelDock] Ignoring sidebar button:', sel);
                  continue;
                }

                // Click sequence
                btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                btn.click();
                btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                submitted = true;
                console.log(`[ModelDock] ✓ Submitted via button (attempt ${attemptCount}):`, sel);
                break;
              }
            }
            if (!submitted) await new Promise(r => setTimeout(r, 100));
          }

          if (!submitted && submitSelector) {
            if (isOpenRouter) {
              console.warn(`[ModelDock] OpenRouter: Button polling timeout after ${attemptCount} attempts (${maxPollTime}ms) - trying fallback`);
            } else {
              console.warn(`[ModelDock] Button polling timeout after ${attemptCount} attempts (${maxPollTime}ms)`);
            }
          }
        }

        // Fallback: Force Enter / Key (Codex, AI Studio 등 submitKey 활용)
        if ((forceEnter || !submitted || forceKey) && !submitted) {
          console.log('[ModelDock] Attempting Key fallback...');

          if (submitKey) {
            // submitKey가 정의된 경우 (Codex, AI Studio 등)
            if (submitKey.metaKey && submitKey.ctrlKey) {
              // 둘 다 설정된 경우: 크로스 플랫폼 지원을 위해 각각 시도
              console.log('[ModelDock] Trying Cmd+Enter (Mac)...');
              dispatchKey(foundInput, { key: submitKey.key, metaKey: true });
              console.log('[ModelDock] Trying Ctrl+Enter (Win/Linux)...');
              dispatchKey(foundInput, { key: submitKey.key, ctrlKey: true });
            } else {
              // 하나만 설정된 경우
              dispatchKey(foundInput, submitKey);
            }
          } else {
            // 기본: 단순 Enter
            dispatchKey(foundInput, { key: 'Enter' });
          }

          submitted = true;
        }

        return { status: 'success', host: window.location.host };
      } else {
        return { status: 'injection_failed', host: window.location.host };
      }
    } catch (err) {
      console.error('[ModelDock] Error:', err);
      return { status: 'error', message: err.toString() };
    }
  }

  async function robustInject(element, text, modelId) {
    element.focus();

    // 🔧 v14.0: 모델별 명시적 분기 처리 (BrainFlow 최적화)
    console.log(`[ModelDock v14] Injecting to model: ${modelId}, element type: ${element.tagName}, contentEditable: ${element.isContentEditable}`);

    // === 모델별 명시적 if-else 분기 ===

    // 🎯 Claude (모든 버전: claude, claudecode)
    if (modelId === 'claude' || modelId === 'claudecode' || element.isContentEditable) {
      console.log('[ModelDock v14] Using Claude-specific injection (execCommand)');
      // Try execCommand first (best for undo history and internal state)
      const success = document.execCommand('insertText', false, text);
      if (!success) {
        console.warn('[ModelDock v14] execCommand failed, using textContent fallback');
        element.textContent = text;
      }
      triggerInputEvents(element);
      return true;
    }

    // 🎯 Grok
    else if (modelId === 'grok') {
      console.log('[ModelDock v14] Using Grok-specific injection (textarea with verification)');
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(element, text);
        } else {
          element.value = text;
        }
        triggerInputEvents(element);

        // Grok specific: verify and retry with execCommand if needed
        if (element.value !== text) {
          console.warn('[ModelDock v14] Grok: textarea value mismatch, retrying with execCommand');
          document.execCommand('insertText', false, text);
        }
        return true;
      }
      // Grok contenteditable fallback
      else if (element.isContentEditable) {
        const success = document.execCommand('insertText', false, text);
        if (!success) element.textContent = text;
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 ChatGPT / Codex (Code editor - TipTap / ProseMirror)
    else if (modelId === 'chatgpt' || modelId === 'codex' ||
      element.classList.contains('ProseMirror') || element.classList.contains('tiptap')) {
      console.log('[ModelDock v15.4] Using ChatGPT/Codex ProseMirror injection');

      // New ChatGPT structure: ProseMirror contenteditable div
      if (element.classList.contains('ProseMirror') && element.id === 'prompt-textarea') {
        console.log('[ModelDock v15.4] 📝 Detected new ChatGPT ProseMirror structure');

        // Find and update the paragraph element
        let paragraph = element.querySelector('p[data-placeholder]');
        if (!paragraph) {
          paragraph = element.querySelector('p');
        }

        if (paragraph) {
          // Remove placeholder attributes
          paragraph.removeAttribute('data-placeholder');
          paragraph.removeAttribute('class');
          // Set text content
          paragraph.textContent = text;
          // Remove the trailing break if exists
          const br = paragraph.querySelector('br.ProseMirror-trailingBreak');
          if (br) br.remove();
        } else {
          // Create new paragraph if doesn't exist
          const p = document.createElement('p');
          p.textContent = text;
          element.innerHTML = '';
          element.appendChild(p);
        }

        // Trigger input events
        triggerInputEvents(element);

        // Move cursor to end
        element.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(element);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        return true;
      }

      // Fallback: try paste event for older ChatGPT or TipTap editors
      console.log('[ModelDock v15.4] Using paste event fallback');
      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true, cancelable: true, clipboardData: dataTransfer
        });
        element.dispatchEvent(pasteEvent);
        triggerInputEvents(element);
        return true;
      } catch (e) {
        console.warn('[ModelDock v14] Paste failed, falling back to execCommand');
        const success = document.execCommand('insertText', false, text);
        if (!success) element.textContent = text;
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 v0 / Replit (Code editor - TipTap/CodeMirror)
    else if (modelId === 'v0' || modelId === 'replit' ||
      element.classList.contains('cm-content') || element.classList.contains('monaco-editor')) {
      console.log('[ModelDock v14] Using v0/Replit-specific injection (paste event)');
      try {
        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true, cancelable: true, clipboardData: dataTransfer
        });
        element.dispatchEvent(pasteEvent);
        triggerInputEvents(element);
        return true;
      } catch (e) {
        console.warn('[ModelDock v14] Paste failed for code editor');
        return false;
      }
    }

    // 🎯 Gemini
    else if (modelId === 'gemini') {
      console.log('[ModelDock v14] Using Gemini-specific injection (execCommand)');
      if (element.isContentEditable) {
        const success = document.execCommand('insertText', false, text);
        if (!success) element.textContent = text;
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 Qwen (Alibaba) - textarea 기반, 긴 응답 시간 대응
    else if (modelId === 'qwen') {
      console.log('[ModelDock v14] Using Qwen-specific injection');
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(element, text);
        } else {
          element.value = text;
        }
        triggerInputEvents(element);
        // Qwen 전용: 추가 이벤트 트리거 (React 상태 동기화)
        element.dispatchEvent(new Event('compositionend', { bubbles: true }));
        return true;
      }
      // contenteditable fallback
      else if (element.isContentEditable) {
        const success = document.execCommand('insertText', false, text);
        if (!success) element.textContent = text;
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 Kimi (Moonshot) - Lexical 에디터 기반 (contenteditable)
    else if (modelId === 'kimi') {
      console.log('[ModelDock v15] Using Kimi Lexical editor injection');
      if (element.isContentEditable && element.getAttribute('data-lexical-editor') === 'true') {
        // Lexical 에디터는 focus + selection + execCommand 순서 필요
        element.focus();

        // 기존 내용 선택 후 교체 (빈 상태면 바로 삽입)
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);

        // execCommand로 텍스트 삽입
        const success = document.execCommand('insertText', false, text);
        if (!success) {
          // fallback: 직접 textContent 설정
          element.textContent = text;
        }

        // Lexical은 input/change 이벤트 외에 beforeinput도 필요할 수 있음
        element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));

        console.log('[ModelDock v15] Kimi Lexical injection complete');
        return true;
      } else if (element.isContentEditable) {
        // 일반 contenteditable fallback
        element.focus();
        const success = document.execCommand('insertText', false, text);
        if (!success) {
          element.textContent = text;
        }
        triggerInputEvents(element);
        return true;
      }
      // textarea fallback
      else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(element, text);
        } else {
          element.value = text;
        }
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 DeepSeek - textarea 기반, R1 모드 지원
    else if (modelId === 'deepseek') {
      console.log('[ModelDock v14] Using DeepSeek-specific injection');
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(element, text);
        } else {
          element.value = text;
        }
        triggerInputEvents(element);
        return true;
      }
      // contenteditable fallback (드문 케이스)
      else if (element.isContentEditable) {
        const success = document.execCommand('insertText', false, text);
        if (!success) element.textContent = text;
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 Mistral Le Chat - ProseMirror 에디터 기반 (contenteditable)
    else if (modelId === 'mistral') {
      console.log('[ModelDock v15] Using Mistral ProseMirror editor injection');
      if (element.isContentEditable && element.classList.contains('ProseMirror')) {
        // ProseMirror는 paste 이벤트가 가장 안정적
        try {
          element.focus();
          const dataTransfer = new DataTransfer();
          dataTransfer.setData('text/plain', text);
          const pasteEvent = new ClipboardEvent('paste', {
            bubbles: true, cancelable: true, clipboardData: dataTransfer
          });
          element.dispatchEvent(pasteEvent);
          triggerInputEvents(element);
          console.log('[ModelDock v15] Mistral ProseMirror injection via paste event');
          return true;
        } catch (e) {
          console.warn('[ModelDock v15] Paste failed, falling back to execCommand');
          element.focus();
          const success = document.execCommand('insertText', false, text);
          if (!success) element.textContent = text;
          triggerInputEvents(element);
          return true;
        }
      }
      // 일반 contenteditable fallback
      else if (element.isContentEditable) {
        element.focus();
        const success = document.execCommand('insertText', false, text);
        if (!success) element.textContent = text;
        triggerInputEvents(element);
        return true;
      }
      // textarea fallback (레거시 UI)
      else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(element, text);
        } else {
          element.value = text;
        }
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 LM Arena / OpenRouter  (Textarea)
    else if (modelId === 'lmarena' || modelId === 'openrouter') {
      console.log(`[ModelDock v14] Using ${modelId}-specific injection (native textarea)`);
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(element, text);
        } else {
          element.value = text;
        }
        triggerInputEvents(element);
        return true;
      }
      // Fallback to contentEditable
      else if (element.isContentEditable) {
        const success = document.execCommand('insertText', false, text);
        if (!success) element.textContent = text;
        triggerInputEvents(element);
        return true;
      }
    }

    // 🎯 Generic fallback (자동 감지)
    else {
      console.log('[ModelDock v14] Using generic injection (auto-detect)');

      // Textarea / Input
      if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        const proto = window.HTMLTextAreaElement.prototype;
        const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (nativeSetter) {
          nativeSetter.call(element, text);
        } else {
          element.value = text;
        }
        triggerInputEvents(element);
        return true;
      }

      // ContentEditable
      if (element.isContentEditable) {
        const success = document.execCommand('insertText', false, text);
        if (!success) {
          element.textContent = text;
        }
        triggerInputEvents(element);
        return true;
      }
    }

    console.warn('[ModelDock v14] No injection method matched');
    return false;
  }

  function dispatchKey(element, keyConfig) {
    const { key, ctrlKey, metaKey, shiftKey } = keyConfig;
    const code = key === 'Enter' ? 'Enter' : key;
    const keyCode = key === 'Enter' ? 13 : 0;

    const keyEvents = [
      { type: 'keydown', code, key, keyCode, which: keyCode },
      { type: 'keypress', code, key, keyCode, which: keyCode },
      { type: 'keyup', code, key, keyCode, which: keyCode }
    ];

    keyEvents.forEach(evt => {
      element.dispatchEvent(new KeyboardEvent(evt.type, {
        bubbles: true, cancelable: true,
        key: evt.key, code: evt.code, keyCode: evt.keyCode, which: evt.which,
        shiftKey: !!shiftKey, ctrlKey: !!ctrlKey, metaKey: !!metaKey, composed: true
      }));
    });
  }

  // ============================================================
  // 🎯 통합 파서 유틸리티 (ParserUtils) - 중복 제거 리팩토링
  // ============================================================
  const ParserUtils = {
    /**
     * Shadow DOM을 포함한 깊은 쿼리
     */
    deepQuerySelectorAll: (selector, root = document) => {
      const results = Array.from(root.querySelectorAll(selector));
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.shadowRoot) {
          results.push(...ParserUtils.deepQuerySelectorAll(selector, node.shadowRoot));
        }
      }
      return results;
    },

    /**
     * UI 요소를 제거한 클린 텍스트 추출
     */
    cleanText: (node, additionalSelectors = []) => {
      if (!node) return '';
      const clone = node.cloneNode(true);
      const baseSelectors = [
        'button', 'svg', 'textarea', 'input',
        '[class*="button"]', '[class*="action"]', '[class*="toolbar"]',
        '[class*="control"]', '[class*="copy"]', '[class*="footer"]',
        '[data-state]', '[data-sentry-component="CopyButton"]',
        '[aria-label*="Copy"]', '[aria-label="복사"]',
        '[aria-label*="Stop"]', '[aria-label*="중지"]'
      ];
      const allSelectors = [...baseSelectors, ...additionalSelectors];
      clone.querySelectorAll(allSelectors.join(', ')).forEach(el => el.remove());
      return (clone.innerText || clone.textContent || '').trim();
    },

    /**
     * 시스템/슬레이브 프롬프트 감지
     */
    isSystemPrompt: (text, additionalPatterns = []) => {
      if (!text) return false;
      const basePatterns = [
        '페르소나:', '명령:', '[SLAVE:', '사용자가 제시한',
        '입력 데이터:', '출력 형식:', 'persona:', 'instruction:',
        '슬레이브 봇들을 총괄', '[목적]', '[역할]', '메인 브레인',
        '당신은 슬레이브', '슬레이브 봇 목록', 'context:', 'input data:',
        'output format:'
      ];
      const patterns = [...basePatterns, ...additionalPatterns];
      const head = text.substring(0, 200).toLowerCase();
      const matchCount = patterns.filter(p => head.includes(p.toLowerCase())).length;
      return matchCount >= 1;
    },

    /**
     * 사용자 메시지 컨테이너 감지 (Enhanced for LMArena/Mistral/Claude)
     */
    isUserMessageContainer: (el, maxDepth = 5) => {
      if (!el) return false;

      const className = (el.className || '').toLowerCase();
      // Common standard markers
      if (className.includes('user') || className.includes('human')) return true;
      if (el.getAttribute('data-role') === 'user') return true;
      if (el.getAttribute('data-message-author-role') === 'user') return true;

      // LMArena specific
      if (el.dataset.testid && el.dataset.testid.includes('user')) return true;

      let parent = el.parentElement;
      for (let i = 0; i < maxDepth && parent; i++) {
        const pClass = (parent.className || '').toLowerCase();

        // Tailwind/CSS checks
        if (pClass.includes('user') || pClass.includes('human')) return true;
        if (parent.getAttribute('data-role') === 'user') return true;
        if (parent.getAttribute('data-message-author-role') === 'user') return true;

        // LMArena specific style classes (gray background often indicates user in some themes)
        if (pClass.includes('bg-surface-secondary')) return true;

        // Specific LMArena Chat User Message
        if (pClass.includes('chat-message-user')) return true;
        if (parent.dataset.testid && parent.dataset.testid.includes('chat-user-message')) return true;

        parent = parent.parentElement;
      }
      return false;
    },

    /**
     * 봇 응답 컨테이너 감지
     */
    isBotResponseContainer: (el, maxDepth = 5) => {
      if (!el) return false;

      const className = (el.className || '').toLowerCase();
      if (className.includes('assistant') || className.includes('bot') || className.includes('model')) return true;
      if (el.getAttribute('data-role') === 'assistant') return true;
      if (el.getAttribute('data-message-author-role') === 'assistant') return true;

      let parent = el.parentElement;
      for (let i = 0; i < maxDepth && parent; i++) {
        const pClass = (parent.className || '').toLowerCase();
        if (pClass.includes('assistant') || pClass.includes('bot') || pClass.includes('model-response')) return true;
        if (parent.getAttribute('data-role') === 'assistant') return true;
        parent = parent.parentElement;
      }
      return false;
    }
  };

  // ============================================================
  // 🎯 완전 동적 파서 (createDynamicParser) - 호스트 분기 없음
  // 기능/역할 기반 휴리스틱으로 모든 AI 챗봇에서 작동
  // ============================================================

  /**
   * 완전 동적 응답 파서
   * 
   * 설계 원칙:
   * 1. 호스트명 분기 없음 (No hostname branching)
   * 2. 시맨틱 속성 우선 (Semantic attributes first)
   * 3. 기능 기반 탐색 (Feature-based detection)
   * 4. 범용 휴리스틱 (Universal heuristics)
   * 
   * 탐색 우선순위:
   * P1: 역할 기반 탐색 (data-role, data-message-author-role)
   * P2: Copy 버튼 역추적 (봇 응답 = Copy 버튼 존재)
   * P3: 텍스트 컨테이너 휴리스틱 (.prose, .markdown, [class*="response"])
   * P4: 일반 메시지 패턴 ([class*="message"])
   * P5: Deep Text Scan (마지막 폴백)
   * 
   * 필터:
   * - 사용자 메시지 제외 (user, human, request)
   * - 시스템 프롬프트 제외 (ParserUtils.isSystemPrompt)
   */
  function createDynamicParser() {
    return () => {
      const utils = ParserUtils;
      const startTime = performance.now();
      console.log('[DynamicParser] 🚀 Starting universal detection...');

      // ========================================
      // P1: 역할 기반 탐색 (Role-based Detection)
      // 가장 신뢰도 높은 시맨틱 속성 우선
      // ========================================
      const roleBasedResult = (() => {
        // 시맨틱 속성 조합 (aria 표준 + 커스텀 data 속성)
        const roleSelectors = [
          '[data-message-author-role="assistant"]',
          '[data-role="assistant"]',
          '[data-testid*="assistant"]',
          '[data-testid="message-content"]',
          '[aria-label*="assistant" i]'
        ];

        for (const selector of roleSelectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          if (elements.length === 0) continue;

          // 마지막 요소부터 역순 검사
          for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];

            // 사용자 메시지 컨테이너 제외
            if (utils.isUserMessageContainer(el)) continue;

            // 텍스트 컨테이너 찾기 (.markdown, .prose, [class*="content"])
            const textContainer = el.querySelector('.markdown, .prose, [class*="content"]') || el;
            const text = utils.cleanText(textContainer);

            if (text && text.length > 10 && !utils.isSystemPrompt(text)) {
              console.log(`[DynamicParser] ✅ P1 Success (${selector}): ${text.length} chars`);
              return text;
            }
          }
        }
        return null;
      })();

      if (roleBasedResult) {
        console.log(`[DynamicParser] ⏱️ Completed in ${(performance.now() - startTime).toFixed(1)}ms`);
        return roleBasedResult;
      }

      // ========================================
      // P2: Copy 버튼 역추적 (Copy Button Reverse Traversal)
      // Copy 버튼이 있는 컨테이너 = 봇 응답
      // ========================================
      const copyButtonResult = (() => {
        // 범용 Copy 버튼 셀렉터 (다국어 지원)
        const copyButtonSelectors = [
          'button[aria-label*="Copy" i]',
          'button[aria-label*="복사"]',
          'button[aria-label*="コピー"]',
          'button[aria-label*="复制"]',
          '[data-sentry-component="CopyButton"]',
          'button[class*="copy" i]',
          '.copy-response-button',
          '.copy-button'
        ];

        let allCopyButtons = [];
        for (const selector of copyButtonSelectors) {
          const buttons = document.querySelectorAll(selector);
          allCopyButtons.push(...Array.from(buttons));
        }

        // 중복 제거
        allCopyButtons = [...new Set(allCopyButtons)];

        if (allCopyButtons.length === 0) return null;

        console.log(`[DynamicParser] P2: Found ${allCopyButtons.length} copy buttons`);

        // 마지막 Copy 버튼에서 역추적
        for (let i = allCopyButtons.length - 1; i >= 0; i--) {
          const btn = allCopyButtons[i];

          // 부모 컨테이너 탐색 (최대 15단계)
          let parent = btn.parentElement;
          for (let depth = 0; depth < 15 && parent && parent !== document.body; depth++) {
            // 사용자 메시지 컨테이너면 스킵
            if (utils.isUserMessageContainer(parent)) break;

            // 텍스트 후보 영역 찾기
            const textCandidates = [
              parent.querySelector('.prose, .markdown, [class*="content"], [class*="message"]'),
              parent
            ].filter(Boolean);

            for (const candidate of textCandidates) {
              const text = utils.cleanText(candidate);
              if (text && text.length > 20 && !utils.isSystemPrompt(text)) {
                console.log(`[DynamicParser] ✅ P2 Success (copy btn depth ${depth}): ${text.length} chars`);
                return text;
              }
            }

            parent = parent.parentElement;
          }
        }
        return null;
      })();

      if (copyButtonResult) {
        console.log(`[DynamicParser] ⏱️ Completed in ${(performance.now() - startTime).toFixed(1)}ms`);
        return copyButtonResult;
      }

      // ========================================
      // P3: 텍스트 컨테이너 휴리스틱 (Text Container Heuristic)
      // .prose, .markdown, [class*="response"] 등
      // ========================================
      const textContainerResult = (() => {
        const containerSelectors = [
          '.prose',
          '.markdown',
          '[class*="response" i]:not([class*="user" i])',
          '[class*="assistant" i]',
          '[class*="bot" i]:not([class*="robot" i])',
          '.font-claude-message',
          '.message-bubble',
          '[class*="svelte-"][class*="message" i]'
        ];

        // Shadow DOM 포함 탐색
        let allContainers = [];
        for (const selector of containerSelectors) {
          try {
            const elements = utils.deepQuerySelectorAll(selector);
            allContainers.push(...elements);
          } catch (e) {
            // 선택자 오류 무시
          }
        }

        console.log(`[DynamicParser] P3: Found ${allContainers.length} text containers`);

        // 마지막부터 역순 탐색
        for (let i = allContainers.length - 1; i >= 0; i--) {
          const container = allContainers[i];

          // 사용자 메시지 제외
          if (utils.isUserMessageContainer(container)) continue;

          const text = utils.cleanText(container);
          if (text && text.length > 30 && !utils.isSystemPrompt(text)) {
            console.log(`[DynamicParser] ✅ P3 Success (container ${i}): ${text.length} chars`);
            return text;
          }
        }
        return null;
      })();

      if (textContainerResult) {
        console.log(`[DynamicParser] ⏱️ Completed in ${(performance.now() - startTime).toFixed(1)}ms`);
        return textContainerResult;
      }

      // ========================================
      // P4: 일반 메시지 패턴 ([class*="message"])
      // 사용자/봇 구분 포함
      // ========================================
      const generalMessageResult = (() => {
        const messageElements = Array.from(document.querySelectorAll(
          '[class*="message" i], [class*="chat" i], [class*="turn" i], [class*="bubble" i]'
        ));

        console.log(`[DynamicParser] P4: Found ${messageElements.length} message elements`);

        // 마지막부터 역순 탐색
        for (let i = messageElements.length - 1; i >= 0; i--) {
          const msg = messageElements[i];
          const className = (msg.className || '').toLowerCase();

          // 사용자 메시지 명시적 제외
          if (className.includes('user') ||
            className.includes('human') ||
            className.includes('request') ||
            className.includes('input')) continue;

          // 사용자 컨테이너 체크
          if (utils.isUserMessageContainer(msg)) continue;

          const text = utils.cleanText(msg);
          if (text && text.length > 30 && !utils.isSystemPrompt(text)) {
            console.log(`[DynamicParser] ✅ P4 Success (message ${i}): ${text.length} chars`);
            return text;
          }
        }
        return null;
      })();

      if (generalMessageResult) {
        console.log(`[DynamicParser] ⏱️ Completed in ${(performance.now() - startTime).toFixed(1)}ms`);
        return generalMessageResult;
      }

      // ========================================
      // P5: Deep Text Scan (마지막 폴백)
      // 모든 텍스트 노드 탐색, 가장 긴 유효 텍스트 반환
      // ========================================
      const deepTextResult = (() => {
        console.log('[DynamicParser] P5: Starting deep text scan...');

        const allTextNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) {
          allTextNodes.push(walker.currentNode);
        }

        let bestText = '';
        for (let i = allTextNodes.length - 1; i >= 0 && bestText.length < 500; i--) {
          const node = allTextNodes[i];
          const text = (node.nodeValue || '').trim();

          if (text.length < 50) continue;
          if (utils.isSystemPrompt(text)) continue;

          // 부모가 사용자 메시지가 아닌지 확인
          const parent = node.parentElement;
          if (parent && utils.isUserMessageContainer(parent)) continue;

          if (text.length > bestText.length) {
            bestText = text;
          }
        }

        if (bestText) {
          console.log(`[DynamicParser] ✅ P5 Success (deep scan): ${bestText.length} chars`);
          return bestText;
        }
        return null;
      })();

      if (deepTextResult) {
        console.log(`[DynamicParser] ⏱️ Completed in ${(performance.now() - startTime).toFixed(1)}ms`);
        return deepTextResult;
      }

      // ========================================
      // 실패: 응답 없음
      // ========================================
      console.log(`[DynamicParser] ❌ No response found (${(performance.now() - startTime).toFixed(1)}ms)`);
      return '';
    };
  }

  // 단일 동적 파서 인스턴스 (모든 모델에서 공유)
  const dynamicParser = createDynamicParser();

  // ===========================================
  // 🔄 하위 호환성: createUnifiedCustomParser 래퍼
  // 기존 코드에서 호출하는 경우 동적 파서로 위임
  // ===========================================
  function createUnifiedCustomParser(hostname) {
    // 호스트명 무시, 동적 파서 반환
    console.log(`[DynamicParser] Legacy call from ${hostname}, using dynamic parser`);
    return dynamicParser;
  }

  // === Claude 공통 헬퍼 (파싱/완료 감지 공유) ===
  const CLAUDE_PROMPT_PATTERNS = [
    /^페르소나:/i,
    /^\[SLAVE:/i,
    /^당신은.*역할을/i,
    /^다음 지시사항을 따라/i,
    /^Please respond to/i,
    /^You are assigned/i
  ];

  function isClaudePromptText(text) {
    if (!text || text.length < 10) return false;
    return CLAUDE_PROMPT_PATTERNS.some(pattern => pattern.test(text.trim()));
  }

  function stripClaudeUIElements(root) {
    if (!root) return;
    const toRemove = root.querySelectorAll(
      'button, ' +
      '[class*="button"], ' +
      '[class*="action"], ' +
      '[class*="toolbar"], ' +
      '[class*="control"], ' +
      '[class*="copy"], ' +
      '[data-state], ' +
      '[data-sentry-component="CopyButton"], ' +
      'svg, ' +
      '[aria-label*="Copy"], ' +
      '[aria-label="복사"], ' +
      '[aria-label*="Stop"], ' +
      '[aria-label*="중지"]'
    );
    toRemove.forEach(el => el.remove());
  }

  function isClaudeUserMessageContainer(element) {
    if (!element) return false;

    let parent = element;
    for (let i = 0; i < 15 && parent; i++) {
      const className = (parent.className || '').toLowerCase();
      const role = (parent.getAttribute('data-message-author-role') || '').toLowerCase();

      if (className.includes('human') ||
        className.includes('user-message') ||
        role === 'user' ||
        role === 'human') {
        return true;
      }

      if (className.includes('assistant') ||
        className.includes('claude') ||
        role === 'assistant') {
        return false;
      }

      parent = parent.parentElement;
    }
    return false;
  }

  /**
   * Claude 최신 응답 스냅샷을 반환 (파싱/완료 감지 공용)
   * @param {Object} options
   * @param {boolean} options.cleanText - UI 제거 후 텍스트 추출 여부
   * @returns {{text: string, responseTextLength: number, isStreaming: boolean, hasCopyButton: boolean, isInputEnabled: boolean}}
   */
  function getClaudeLatestSnapshot(options = {}) {
    const { cleanText = false } = options;

    const streamingNodes = document.querySelectorAll('[data-is-streaming]');
    const lastStreamingNode = streamingNodes.length > 0 ? streamingNodes[streamingNodes.length - 1] : null;
    const hasStreamingAttr = lastStreamingNode?.getAttribute('data-is-streaming') === 'true';
    const stopButton = document.querySelector('button[aria-label="Stop generating"], button[aria-label*="Stop"], button[data-testid="stop-button"], button[aria-label*="중지"]');
    const isStreaming = hasStreamingAttr || !!stopButton;

    const candidates = [
      ...document.querySelectorAll('[data-is-streaming] .font-claude-response'),
      ...document.querySelectorAll('.font-claude-response'),
      ...document.querySelectorAll('.font-claude-response-body'),
      ...document.querySelectorAll('.font-claude-message'),
      ...document.querySelectorAll('div[data-testid="message-content"]'),
      ...document.querySelectorAll('.prose')
    ];

    let contentEl = null;
    for (let i = candidates.length - 1; i >= 0; i--) {
      const candidate = candidates[i];
      if (isClaudeUserMessageContainer(candidate)) continue;
      contentEl = candidate;
      break;
    }

    const container = contentEl?.closest('[data-message-author-role="assistant"]') ||
      contentEl?.closest('.group') ||
      contentEl;

    const copyButton = container?.querySelector('[data-testid="action-bar-copy"], button[data-sentry-component="CopyButton"], button[aria-label*="Copy"], button[aria-label*="복사"]') ||
      document.querySelector('[data-testid="action-bar-copy"]');

    const inputField = document.querySelector('[data-testid="chat-input"][contenteditable="true"]') ||
      document.querySelector('div[contenteditable="true"].ProseMirror') ||
      document.querySelector('div[contenteditable="true"]');
    const isInputEnabled = !!inputField;

    let text = '';
    if (contentEl) {
      const source = cleanText ? contentEl.cloneNode(true) : contentEl;
      if (cleanText) stripClaudeUIElements(source);
      text = source.innerText?.trim() || source.textContent?.trim() || '';
      if (isClaudePromptText(text)) text = '';
    }

    return {
      text,
      responseTextLength: text.length,
      isStreaming: !!isStreaming,
      hasCopyButton: !!copyButton,
      isInputEnabled,
      hasStopButton: !!stopButton
    };
  }

  // --- Response Monitoring (Added for Brain Flow) ---
  // === RESPONSE_CONFIGS v4.0 - 동적 감지 시스템 (2025) ===
  // 🔧 v14.0 변경사항:
  //   - stabilizationTime: DEPRECATED (동적 계산으로 대체됨)
  //   - 새로운 동적 시스템: detectDynamicCompletionSignal() + calculateDynamicStabilizationTime()
  //   - 모델별 특수 신호 감지 (Gemini aria-busy, Qwen 복사버튼 등)
  // 🔧 핵심 원칙: 봇 응답만 선택, 사용자 메시지 제외
  const RESPONSE_CONFIGS = [
    // 🔧 PRIORITY: 경로 포함 설정을 최상단에 배치 (더 구체적인 매칭 우선)

    // === Codex (OpenAI) ===
    // 🚨 CRITICAL: chatgpt.com/codex는 경로까지 매칭되어야 함
    {
      hosts: ['chatgpt.com/codex', 'codex.openai.com'],
      customParser: dynamicParser,
      responseSelectors: [
        // 🔧 Codex: assistant 명시 셀렉터 우선 (user 혼동 방지)
        // Priority 1: 명확한 data 속성
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="codex-output"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        // Priority 2: 클래스 기반
        'div[class*="codex-response"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="code-output"]:last-of-type',
        // Priority 3: 구조 기반 (assistant 명시된 형제만)
        'div[data-message-author-role="user"]:last-of-type ~ div[data-message-author-role="assistant"]',
        // Priority 4: Nested content (assistant 부모 확인)
        'div[data-message-author-role="assistant"] div.prose:last-of-type',
        'div[class*="assistant"] div[class*="content"]:last-of-type',
        'div.prose:last-of-type',
        'div[class*="markdown"]:not([class*="user"]):last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[data-testid="stop-button"]',
        'button[aria-label*="중지"]'
      ],
      inputSelector: 'div[data-testid="codex-input"] textarea, textarea, div[contenteditable="true"]',
      submitSelector: 'button[data-testid="composer-send-button"], button[data-testid="send-button"]',
      excludeUserMessage: true,
      stabilizationTime: 25000
    },
    // === Claude Code ===
    // 🚨 CRITICAL: claude.ai/code는 경로까지 매칭되어야 함
    {
      hosts: ['claude.ai/code', 'code.anthropic.com'],
      customParser: dynamicParser,
      responseSelectors: [
        // 🔧 Claude Code: assistant 명시 셀렉터 우선 (user 혼동 방지)
        // Priority 1: 명확한 data 속성
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="message-content"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        // Priority 2: 클래스 기반
        'div.font-claude-message:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="code-response"]:last-of-type',
        // Priority 3: 구조 기반 (assistant 명시된 형제만)
        'div[data-message-author-role="user"]:last-of-type ~ div[data-message-author-role="assistant"]',
        // Priority 4: Nested prose (assistant 부모 확인)
        'div[data-message-author-role="assistant"] div.prose:last-of-type',
        'div[class*="assistant"] div[class*="content"]:last-of-type',
        'div.prose:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="중지"]',
        'button[data-testid="stop-button"]',
        'button:has(svg[class*="stop"])'
      ],
      inputSelector: 'div[contenteditable="true"], textarea, div[data-placeholder*="Reply"]',
      submitSelector: 'button[data-testid*="send"], button[aria-label*="Send"]',
      excludeUserMessage: true,
      stabilizationTime: 30000
    },

    // === ChatGPT (Generic) - 2025 Enhanced v2 ===
    // ✅ NEW: Precise selectors based on actual DOM structure
    {
      hosts: ['chatgpt.com', 'chat.openai.com'],
      customParser: dynamicParser,
      responseSelectors: [
        // Exact match for assistant message
        '[data-message-author-role="assistant"] .markdown',
        '[data-message-author-role="assistant"] .prose',
        // Fallback for structure
        'div[data-testid*="conversation-turn"]:has([data-message-author-role="assistant"]):last-of-type .markdown',
        // Streaming state specifically
        '.result-streaming',
        '.streaming-animation'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[data-testid="stop-button"]',
        'button[aria-label*="중지"]',
        // New explicit generating signals
        '[class*="result-streaming"]',
        '[class*="streaming-animation"]'
      ],
      inputSelector: 'textarea[data-id="conversation-input"], textarea[data-testid="prompt-textarea"]',
      submitSelector: 'button[data-testid="send-button"]',
      stabilizationTime: 15000
    },
    // === Claude ===
    {
      hosts: ['claude.ai'],
      customParser: dynamicParser,
      responseSelectors: [
        // 🔧 Claude 봇 응답 전용 셀렉터 (더 정밀하게)
        'div[data-testid="message-content"]:last-of-type',
        'div.font-claude-message:last-of-type',
        'div[data-is-streaming="false"]:last-of-type .prose',
        // Claude 특유의 응답 영역
        'div[class*="prose"][class*="break-words"]:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="중지"]',
        'button[aria-label*="Cancel"]',
        'button:has(svg[class*="stop"])',
        // 🔧 Claude 전용: 응답 생성 중 표시되는 버튼
        'button[data-testid="stop-button"]'
      ],
      inputSelector: 'div[contenteditable="true"][data-placeholder*="Reply"]',
      submitSelector: 'button[aria-label*="Send message"], button[aria-label*="메시지 보내기"]',
      // 🔧 Claude 전용: 더 긴 안정화 시간 (20초 -> 25초)
      stabilizationTime: 25000
    },
    // === Gemini / AI Studio ===
    {
      hosts: ['gemini.google.com', 'aistudio.google.com'],
      customParser: dynamicParser,
      responseSelectors: [
        // 🔧 Gemini/AIStudio: assistant/model 명시 셀렉터 우선
        // Priority 1: 명확한 custom elements & data 속성
        'model-response:last-of-type',
        'message-content:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        'div[data-testid="model-response"]:last-of-type',
        // Priority 2: 클래스 기반
        'div[class*="model-response"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="response-container"]:last-of-type',
        '.ms-text-chunk:last-of-type',
        // Priority 3: 구조 기반 (assistant 명시된 형제만)
        'div[data-role="user"]:last-of-type ~ div[data-role="assistant"]',
        'div[class*="user-message"]:last-of-type ~ div[class*="model-message"]',
        // Priority 4: Nested markdown (model/assistant 부모 확인)
        'div[data-role="assistant"] div.markdown-body:last-of-type',
        'div[class*="model"] div[class*="content"]:last-of-type',
        'div.markdown-body:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Pause"]',
        'button[aria-label*="중지"]',
        'button:has(svg[data-icon="pause"])',
        'button:has(svg[data-icon="stop"])'
      ],
      inputSelector: 'div[contenteditable="true"][role="textbox"], textarea[placeholder*="Enter a prompt"]',
      submitSelector: 'button[aria-label="Send message"], button[aria-label="Build"], button[aria-label="Send"]',
      excludeUserMessage: true,
      stabilizationTime: 18000
    },
    // === Perplexity ===
    {
      hosts: ['perplexity.ai', 'www.perplexity.ai'],
      customParser: dynamicParser,
      responseSelectors: [
        'div.prose:last-of-type',
        'div[dir="auto"]:last-of-type',
        'div[class*="markdown"]:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button:has(svg[data-icon="pause"])',
        'button:has(svg[data-icon="stop"])'
      ],
      inputSelector: 'textarea[placeholder*="Ask anything"]',
      submitSelector: 'button[type="submit"]',
      stabilizationTime: 15000
    },
    // === Grok (X/Twitter AI) ===
    // 🔧 v15.2 UPDATE: 실제 Grok DOM 구조 기반 (last-response + ProseMirror)
    {
      hosts: ['grok.com', 'x.ai'],
      customParser: dynamicParser,
      responseSelectors: [
        // Priority 1: .last-response 내부 복사 버튼 포함된 응답 (최신 응답 보장)
        '.action-buttons.last-response + .response-content-markdown',
        '.last-response .response-content-markdown',
        // Priority 2: 마지막 응답 ID 기반
        '[id^="response-"]:last-of-type .response-content-markdown',
        '[id^="response-"]:last-of-type .message-bubble',
        // Priority 3: 복사 버튼 포함된 메시지 버블 (일반 케이스)
        '.message-bubble:has(button[aria-label="복사"]) p.break-words',
        '.message-bubble:has(button[aria-label="Copy"]) p.break-words',
        // Fallback: 마지막 메시지 버블
        '.message-bubble p.break-words:last-of-type',
        '.prose:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="stop"]',
        'button[aria-label*="중지"]',
        '.sonner-spinner:not([data-visible="false"])',
        '[class*="loading"]',
        '[class*="generating"]'
      ],
      inputSelector: 'div.tiptap.ProseMirror[contenteditable="true"], textarea, div[role="textbox"][contenteditable="true"]',
      submitSelector: 'button[aria-label="제출"], button[aria-label="Submit"], button[type="submit"]',
      excludeUserMessage: true,
      strictAssistantCheck: true,
      stabilizationTime: 20000
    },
    // === Qwen ===
    // 🔧 핵심 수정: stabilizationTime 대폭 증가 (토큰 간격이 긴 경우 대응)
    {
      hosts: ['chat.qwen.ai'],
      customParser: dynamicParser,
      responseSelectors: [
        // 🔧 Qwen CRITICAL FIX: 더 구체적인 셀렉터 우선 적용
        // ISSUE: 부분 파싱 문제 - 응답 중간에 완료 판정
        // Priority 1: 가장 구체적인 Qwen 전용 클래스 (전체 메시지 컨테이너)
        'div[class*="ChatItem_ChatItem"] div[class*="ChatItem_content"]:last-of-type',
        'div[class*="ChatItem_container"] div[class*="markdown"]:last-of-type',
        'div[class*="message-wrapper"] div[class*="message-content"]:last-of-type',
        // Priority 2: 일반 Qwen 클래스
        'div[class*="ChatItem_content"]:last-of-type',
        'div[class*="message-content"]:last-of-type',
        // Priority 3: 봇 응답 전용
        'div[class*="assistant"]:last-of-type',
        'div[class*="bot"]:last-of-type',
        // Priority 4: Markdown 영역 (fallback)
        'div[class*="markdown"]:last-of-type',
        'div.markdown-body:last-of-type'
      ],
      stopSelectors: [
        'button[class*="stop-btn"]',
        'button:has(svg[class*="stop"])',
        'button[aria-label*="Stop"]',
        'div[class*="stop-generating"]'
      ],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      // 🔧 CRITICAL FIX: Qwen은 토큰 간격이 매우 길고 응답이 긺 → 35초로 증가
      // 전체 응답이 끝날 때까지 기다리도록 충분한 시간 제공
      stabilizationTime: 35000,
      excludeUserMessage: true
    },
    // === DeepSeek ===
    {
      hosts: ['chat.deepseek.com'],
      customParser: dynamicParser,
      responseSelectors: [
        'div.ds-markdown:last-of-type',
        'div[class*="message-content"]:last-of-type',
        'div[class*="assistant"]:last-of-type'
      ],
      stopSelectors: [
        'div[role="button"]:has(svg)',
        'div[class*="stop"]',
        'button[aria-label*="Stop"]'
      ],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      stabilizationTime: 15000
    },
    // === GitHub Copilot ===
    // 🔧 수정: 더 정밀한 셀렉터
    {
      hosts: ['github.com/copilot', 'copilot.github.com', 'github.com'],
      customParser: dynamicParser,
      responseSelectors: [
        // GitHub Copilot 전용 (data 속성 우선)
        'div[data-testid="copilot-response"]:last-of-type',
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        // 구조 기반
        'div[data-message-author-role="user"]:last-of-type ~ div',
        // 클래스 기반
        'div[class*="copilot-message"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="bot-response"]:last-of-type',
        // Markdown 영역 (부모 확인)
        'div[data-message-author-role="assistant"] div[class*="markdown-body"]:last-of-type',
        'div[class*="assistant"] div[class*="content"]:last-of-type',
        'div[class*="markdown-body"]:last-of-type',
        'div[class*="conversation-message"]:not([class*="user"]):last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Cancel"]',
        'button[data-testid="stop-button"]'
      ],
      inputSelector: 'textarea[class*="ChatInput"], textarea',
      submitSelector: 'button[aria-label="Send"], button[type="submit"]',
      excludeUserMessage: true,
      stabilizationTime: 20000,
      thinkingPatterns: ["DeepSeek-R1", "Thinking...", "Reasoning..."]
    },
    // === Replit ===
    {
      hosts: ['replit.com'],
      customParser: dynamicParser,
      responseSelectors: [
        'div[class*="markdown"]:last-of-type',
        'div[class*="message-body"]:last-of-type',
        'div[class*="assistant"]:last-of-type',
        'div[class*="ai-response"]:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Cancel"]'
      ],
      inputSelector: 'textarea, .cm-content',
      submitSelector: 'button[aria-label="Send"], button[type="submit"]',
      stabilizationTime: 20000
    },
    // === v0 (Vercel) ===
    // 🔧 수정: 조기 종료 방지를 위한 안정화 시간 증가
    {
      hosts: ['v0.dev'],
      customParser: dynamicParser,
      responseSelectors: [
        // v0 전용 셀렉터
        'div[data-testid="message"]:last-of-type',
        'div[data-testid="ai-message"]:last-of-type',
        'div[class*="ai-message"]:last-of-type',
        // 일반 prose
        'div.prose:last-of-type',
        'div[class*="assistant"]:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Cancel"]',
        'button:has(svg[class*="stop"])',
        // v0 전용: 코드 생성 중지 버튼
        'button[data-testid="stop-generation"]'
      ],
      inputSelector: 'div.tiptap.ProseMirror[contenteditable="true"]',
      submitSelector: 'button[data-testid="prompt-form-send-button"]',
      // 🔧 v0 전용: 코드 생성 시간이 길 수 있으므로 30초로 증가
      stabilizationTime: 30000
    },
    // === Lovable ===
    // 🔧 수정: 더 정밀한 셀렉터
    {
      hosts: ['lovable.dev'],
      customParser: dynamicParser,
      responseSelectors: [
        // Lovable 전용 셀렉터 (data 속성 우선)
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        // 구조 기반
        'div[data-message-author-role="user"]:last-of-type ~ div',
        // 클래스 기반
        'div[class*="ai-response"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="bot-message"]:last-of-type',
        // Prose/markdown 영역 (부모 확인)
        'div[data-message-author-role="assistant"] div.prose:last-of-type',
        'div[class*="assistant"] div[class*="content"]:last-of-type',
        'div.prose:last-of-type',
        'div[class*="message"]:not([class*="user"]):last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Cancel"]',
        'button[data-testid="stop-button"]'
      ],
      inputSelector: 'textarea, div[contenteditable="true"]',
      submitSelector: 'button[aria-label="Send"], button[type="submit"]',
      excludeUserMessage: true,
      // 🔧 Lovable: 코드 생성이 길 수 있음
      stabilizationTime: 30000
    },
    // === LM Arena (Synced with JSON) ===
    {
      hosts: ['lmarena.ai'],
      customParser: dynamicParser,
      responseSelectors: [
        '.prose',
        '[data-testid*="message"]:not([data-testid*="user"])',
        '.chat-message:not(.user-message)'
      ],
      stopSelectors: ['button[aria-label*="Stop"]'],
      inputSelector: 'textarea',
      submitSelector: 'button.send-button',
      stabilizationTime: 8000,
      excludeUserMessage: true,
      strictAssistantCheck: true
    },
    // === ChatGPT ===
    {
      hosts: ['chatgpt.com', 'chat.openai.com'],
      responseSelectors: [
        'div[data-message-author-role="assistant"]:last-of-type',
        'div.markdown:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label="Stop generating"]',
        'button[data-testid="stop-button"]'
      ],
      inputSelector: '#prompt-textarea',
      submitSelector: 'button[data-testid="send-button"]',
      stabilizationTime: 10000
    },
    // === Claude (Custom Parser) - 2025 Enhanced v3 ===
    {
      hosts: ['claude.ai'],
      customParser: dynamicParser,
      responseSelectors: [
        '.font-claude-message:last-of-type',
        'div[data-testid="message-content"]:last-of-type',
        '.prose:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label="Stop generating"]',
        'button[aria-label*="Stop"]',
        'button[data-testid="stop-button"]'
      ],
      inputSelector: 'div[contenteditable="true"]',
      submitSelector: 'button[aria-label*="Send"]',
      stabilizationTime: 25000  // Claude는 생각 시간이 길 수 있음
    },
    // === Gemini ===
    {
      hosts: ['gemini.google.com'],
      responseSelectors: [
        'message-content:last-of-type',
        '.model-response-text:last-of-type'
      ],
      stopSelectors: ['.stop-button'],
      inputSelector: 'div[contenteditable="true"]',
      submitSelector: 'button[aria-label*="Send"]',
      stabilizationTime: 10000
    },
    // === Qwen (Synced with JSON) ===
    {
      hosts: ['chat.qwen.ai', 'tongyi.aliyun.com'],
      customParser: dynamicParser,
      responseSelectors: [
        '.response-message-content',
        '.qwen-markdown',
        'div[class*="response-message"]'
      ],
      stopSelectors: [
        'button.ant-btn-dangerous',
        'button[class*="stop"]'
      ],
      inputSelector: 'textarea.ant-input',
      submitSelector: 'button.ant-btn-primary',
      stabilizationTime: 3000
    },
    // === LMArena (Standard Selectors) - 2025 Final Fix v9 (Manifest-First) ===
    {
      hosts: ['lmarena.ai'],
      // customParser remove: let manifest selectors work
      responseSelectors: [
        '[data-testid*="message"]:not([data-testid*="user"])',
        '.chat-message:not(.user-message)'
      ],
      stopSelectors: ['button[aria-label*="Stop"]'],
      inputSelector: 'textarea',
      submitSelector: 'button.send-button',
      stabilizationTime: 60000,
      excludeUserMessage: true
    },
    // === OpenRouter (Custom Parser) - 2025 Final Fix v8 (Simplified Selectors) ===
    {
      hosts: ['openrouter.ai'],
      customParser: dynamicParser,
      responseSelectors: [],
      stopSelectors: [
        'button[aria-label="Stop generating"]',
        'button[aria-label*="Stop"]'
      ],
      inputSelector: 'textarea',
      // 🔧 v15.8b: broadened submit selectors (new UI variants)
      submitSelector: 'button.bg-primary.h-9.w-9, button.bg-primary, [data-testid="playground-composer"] button.bg-primary, button[aria-label*="Send"], button[type="submit"], button.bg-primary:has(svg[data-lucide="send"])',
      stabilizationTime: 60000,
      excludeUserMessage: true
    },
    // === Genspark / Vooster ===
    {
      hosts: ['genspark.ai', 'app.vooster.ai'],
      customParser: dynamicParser,
      responseSelectors: ['div.prose:last-of-type'],
      stopSelectors: ['button[aria-label*="Stop"]'],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      stabilizationTime: 18000
    }
  ];

  // Universal Fallbacks (Heuristics)
  const UNIVERSAL_RESPONSE_SELECTORS = [
    'div.markdown:last-of-type',
    'div.prose:last-of-type',
    'div[class*="message-content"]:last-of-type',
    'div[class*="bot-message"]:last-of-type',
    'div[class*="assistant-message"]:last-of-type'
  ];

  const UNIVERSAL_STOP_SELECTORS = [
    'button[aria-label*="Stop"]',
    'button[aria-label*="Pause"]',
    'button:has(svg[data-icon="stop"])',
    'button:has(svg[data-icon="pause"])',
    '.stop-generating',
    '[data-testid*="stop"]'
  ];

  function selectorListFromManifest(selectorConfig) {
    if (!selectorConfig) return [];
    return [selectorConfig.primary, ...(selectorConfig.alternatives || [])].filter(Boolean);
  }

  function buildResponseConfigFromManifest(manifest) {
    if (!manifest) return null;
    const selectors = manifest.selectors || {};
    const responseSelectors = selectorListFromManifest(selectors.response_area);
    const stopSelectors = selectorListFromManifest(selectors.stop_button);
    const inputSelectors = selectorListFromManifest(selectors.input_field).join(', ');
    const submitSelectors = selectorListFromManifest(selectors.submit_button).join(', ');

    return {
      responseSelectors: [...responseSelectors, ...UNIVERSAL_RESPONSE_SELECTORS],
      stopSelectors: [...stopSelectors, ...UNIVERSAL_STOP_SELECTORS],
      inputSelector: inputSelectors,
      submitSelector: submitSelectors,
      stabilizationTime: manifest.completion?.minWaitMs || 12000,
      excludeUserMessage: true,
      // 🔧 CRITICAL FIX: Disable dynamicParser default to prioritize precise JSON selectors
      // Only set customParser if explicitly requested in manifest (not supported yet)
      customParser: null
    };
  }

  function getLegacyResponseConfig() {
    const host = window.location.hostname;
    const path = window.location.pathname;
    const fullPath = host + path;

    // 🔧 CRITICAL FIX: 경로 포함 URL 매칭 강화
    // Priority 1: 정확한 경로 매칭 (예: chatgpt.com/codex)
    // Priority 2: 호스트만 매칭 (예: chatgpt.com)

    // 먼저 경로까지 포함하는 설정을 찾음 (더 구체적인 매칭)
    const pathSpecificConfig = RESPONSE_CONFIGS.find(c =>
      c.hosts.some(h => {
        // 슬래시가 포함된 경우 경로까지 비교
        if (h.includes('/')) {
          return fullPath.includes(h) || host.includes(h.split('/')[0]);
        }
        return false;
      })
    );

    if (pathSpecificConfig) {
      console.log(`[ModelDock] Using path-specific config for: ${fullPath}`);
      return {
        responseSelectors: [...pathSpecificConfig.responseSelectors, ...UNIVERSAL_RESPONSE_SELECTORS],
        stopSelectors: [...(pathSpecificConfig.stopSelectors || []), ...UNIVERSAL_STOP_SELECTORS],
        inputSelector: pathSpecificConfig.inputSelector,
        submitSelector: pathSpecificConfig.submitSelector,
        stabilizationTime: pathSpecificConfig.stabilizationTime || 12000,
        excludeUserMessage: pathSpecificConfig.excludeUserMessage || false
      };
    }

    // Fallback: 호스트만 매칭
    const specificConfig = RESPONSE_CONFIGS.find(c =>
      c.hosts.some(h => {
        const hostOnly = h.split('/')[0]; // 슬래시 앞부분만 추출
        return host.includes(hostOnly);
      })
    );

    if (specificConfig) {
      // Merge specific with universal for maximum robustness
      return {
        responseSelectors: [...specificConfig.responseSelectors, ...UNIVERSAL_RESPONSE_SELECTORS],
        stopSelectors: [...(specificConfig.stopSelectors || []), ...UNIVERSAL_STOP_SELECTORS],
        inputSelector: specificConfig.inputSelector,
        submitSelector: specificConfig.submitSelector,
        // 🔧 FIX: 모델별 안정화 시간 (기본값: 12초)
        stabilizationTime: specificConfig.stabilizationTime || 12000,
        // 사용자 메시지 제외 여부
        excludeUserMessage: specificConfig.excludeUserMessage || false
      };
    }

    // 🔧 FIX: 알 수 없는 모델에 대한 기본 설정 (12초)
    console.log(`[ModelDock] No specific config found for ${host}, using universal fallback`);
    return {
      responseSelectors: UNIVERSAL_RESPONSE_SELECTORS,
      stopSelectors: UNIVERSAL_STOP_SELECTORS,
      stabilizationTime: 12000,
      excludeUserMessage: false
    };
  }

  async function getResponseConfig(manifest) {
    const manifestConfig = buildResponseConfigFromManifest(manifest);
    if (manifestConfig) return manifestConfig;

    const resolvedManifest = await getManifestForHost(window.location.hostname);
    const resolvedConfig = buildResponseConfigFromManifest(resolvedManifest);
    if (resolvedConfig) return resolvedConfig;

    return getLegacyResponseConfig();
  }

  // ============================================================================
  // 🧠 ADAPTIVE RESPONSE MONITOR SYSTEM (ARMS) - Functional Approach
  // ============================================================================
  // World-Class Architecture: Explicit if-else Branching for Each Model
  // Author: ModelDock Team
  // Date: 2025-11-27 (B안 재구현)
  // ============================================================================

  /**
 * 모델별 Adaptive Threshold 계산 (명시적 if-else 분기)
 * @param {string} hostname - window.location.hostname
 * @param {Array} chunkIntervals - 최근 청크 간격 배열
 * @param {Object} [manifest] - Model manifest configuration (Optional)
 * @returns {number} threshold (ms)
 */
  function getModelAdaptiveThreshold(hostname, chunkIntervals, manifest = null) {
    // 평균 간격 계산
    const avgInterval = chunkIntervals.length > 0
      ? chunkIntervals.reduce((a, b) => a + b, 0) / chunkIntervals.length
      : 1000; // 초기값 1초

    // 기본: 평균 간격의 3배 + 2초 여유
    let baseThreshold = (avgInterval * 3) + 2000;

    // 🎯 Use Manifest Configuration if available (Priority)
    // This aligns with the new data-driven architecture
    if (manifest && manifest.completion) {
      const { minWaitMs, adaptiveMultiplier } = manifest.completion;
      const computedWait = (minWaitMs || 2000) + (avgInterval * (adaptiveMultiplier || 2.0));
      // Ensure reasonable bounds
      return Math.min(Math.max(computedWait, 2000), 90000);
    }

    // ====================================================================
    // Batch 1: Deep Implementation (Legacy/Fallback)
    // ====================================================================

    if (hostname.includes('gemini.google.com')) {
      // Gemini: 빠른 모델, 30% 단축, 최소 2초
      return Math.max(2000, baseThreshold * 0.7);
    }

    if (hostname.includes('claude.ai')) {
      // Claude: 매우 빠름, Thinking Model (5-10초 멈춤 가능)
      // 🔧 FIX: 최소값 10초 → 6초 (과도한 대기 방지)
      // 50% 증가, 최소 6초
      return Math.max(6000, baseThreshold * 1.5);
    }

    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      // ChatGPT: o1 모델 감지 (Thinking)
      const isO1Model = window.location.href.includes('model=o1') ||
        document.body.innerText.includes('o1-preview') ||
        document.body.innerText.includes('o1-mini');

      if (isO1Model) {
        // o1: 30초+ Thinking, 3배 증가, 최소 12초
        return Math.max(12000, baseThreshold * 3);
      }
      // 일반 GPT: 20% 단축, 최소 2.5초
      return Math.max(2500, baseThreshold * 0.8);
    }

    // ====================================================================
    // Batch 2: Medium Implementation
    // ====================================================================

    if (hostname.includes('grok.com') || hostname.includes('x.com')) {
      // Grok: 중간 속도, 최소 3초
      return Math.max(3000, baseThreshold);
    }

    if (hostname.includes('perplexity.ai')) {
      // Perplexity: 검색 시간 변동, 20% 증가, 최소 4초
      return Math.max(4000, baseThreshold * 1.2);
    }

    if (hostname.includes('chat.deepseek.com')) {
      // DeepSeek: R1 모델 감지
      const isR1Model = window.location.href.includes('deepthink') ||
        window.location.href.includes('-r1') ||
        document.body.innerText.includes('DeepSeek-R1');

      if (isR1Model) {
        // DeepSeek R1: 추론 시간 길음, 2배 증가, 최소 8초
        return Math.max(8000, baseThreshold * 2);
      }
      // 일반 DeepSeek: 빠름, 10% 단축, 최소 2.5초
      return Math.max(2500, baseThreshold * 0.9);
    }

    // ====================================================================
    // Phase-Based Adaptive Logic (The "Smart" Way)
    // ====================================================================

    // Phase 1: "Thinking / Start-up" (아직 텍스트가 없음)
    // 추론 모델(o1, R1)이나 대기열이 있는 경우 첫 토큰까지 오래 걸릴 수 있음.
    // 이때는 아주 넉넉하게 기다려야 함.
    if (chunkIntervals.length === 0) {
      // 기본 40초, 추론 모델 의심되면 120초
      if (hostname.includes('lmarena') || hostname.includes('openrouter') || hostname.includes('deepseek')) {
        return 120000; // 2분 대기 (추론 모델 대응)
      }
      return 40000; // 일반 모델도 40초는 대기
    }

    // Phase 2: "Streaming" (텍스트 생성 중)
    // 이미 텍스트가 나오고 있다면, 토큰 간격은 보통 짧음.
    // 60초나 기다릴 필요 없이, 평균 간격의 2~3배면 충분함.

    // LMArena / OpenRouter / Qwen (느린 모델 대응)
    if (hostname.includes('lmarena.ai') || hostname.includes('openrouter.ai') || hostname.includes('qwen')) {
      // 느린 모델은 토큰 간격이 불규칙할 수 있으므로 조금 더 여유를 둠
      // 평균 간격의 4배 또는 최소 10초
      return Math.max(10000, baseThreshold * 1.5);
    }

    // 일반적인 빠른 모델 (Claude, GPT-4o, Gemini)
    // 평균 간격의 3배 또는 최소 3~5초
    return Math.min(Math.max(baseThreshold, 3000), 15000);
  }
  /**
   * 모델별 UI Lock 체크 (명시적 if-else 분기)
   * @param {string} hostname - window.location.hostname
   * @param {Array} stopSelectors - config.stopSelectors
   * @returns {boolean} true if UI is locked (still generating)
   */
  function checkModelUILocked(hostname, stopSelectors, manifestFromCaller) {
    const queryFirst = (selectorConfig, options = { requireVisible: false }) => {
      if (!selectorConfig) return null;
      const selectors = selectorListFromManifest(selectorConfig);
      for (const sel of selectors) {
        const el = document.querySelector(sel) || queryShadow(document.body, sel);
        if (el && (!options.requireVisible || isElementVisible(el))) return el;
      }
      return null;
    };

    const isInputDisabledByManifest = (inputEl, fieldConfig) => {
      if (!inputEl || !fieldConfig) return false;

      const disabledDetection = fieldConfig.disabled_detection;
      if (disabledDetection) {
        try {
          if (inputEl.matches(disabledDetection)) return true;
          if (typeof inputEl.closest === 'function' && inputEl.closest(disabledDetection)) return true;
        } catch (e) { /* ignore invalid selectors */ }
      }

      const inferredType = (fieldConfig.type || '').toLowerCase();
      if (inferredType === 'contenteditable' || inputEl.isContentEditable || inputEl.getAttribute('contenteditable') !== null) {
        const attr = (inputEl.getAttribute('contenteditable') || '').toLowerCase();
        if (attr === 'false') return true;
      }

      return inputEl.disabled || inputEl.getAttribute('aria-disabled') === 'true';
    };

    const manifest = manifestFromCaller || resolveManifestFromCache(hostname);
    const manifestSelectors = manifest?.selectors;

    // Strategy 0: Thinking/Generating Status Nodes (avoid full-body false positives)
    // Only look at visible status/loader nodes instead of full page text to prevent stuck states
    let thinkingTexts = [
      'Thinking...', 'Generating...', 'Reasoning...',
      '생성 중...', '생각 중...', '답변 생성 중',
      'Searching', 'Researching', 'Analyzing', 'Grok is thinking',
      '검색 중', '분석 중', '답변 준비', '대기 중', '잠시만'
    ];

    if (manifest?.completion?.thinking?.enabled && manifest?.completion?.thinking?.patterns) {
      thinkingTexts = [...thinkingTexts, ...manifest.completion.thinking.patterns];
    }

    const statusNodes = Array.from(document.querySelectorAll('[role="status"], [aria-live], [class*="loading"], [class*="spinner"], [class*="typing"], [class*="thinking"], [data-testid*="loading"], [data-testid*="status"], button'))
      .slice(-120); // cap to avoid heavy scans

    for (const node of statusNodes) {
      if (!isElementVisible(node)) continue;
      const text = (node.innerText || '').trim();
      if (!text) continue;
      if (thinkingTexts.some(t => text.includes(t))) {
        return true;
      }
    }

    // ====================================================================
    // Manifest 기반 범용 감지 (SSOT)
    // ====================================================================
    if (manifestSelectors) {
      const stopEl = queryFirst(manifestSelectors.stop_button, { requireVisible: true });
      const loadingEl = queryFirst(manifestSelectors.loading_indicator, { requireVisible: true });
      const inputEl = queryFirst(manifestSelectors.input_field);
      const inputDisabled = isInputDisabledByManifest(inputEl, manifestSelectors.input_field);
      const actionButtons = queryFirst(manifestSelectors.action_buttons, { requireVisible: true });

      // Stop/Loading이 보이면 생성 중으로 판정
      if (stopEl || loadingEl) return true;

      // 입력창이 비활성화된 경우 (Lexical, ProseMirror 포함)
      if (inputEl && inputDisabled) return true;

      // 액션 버튼이 보이면 생성 완료 쪽으로 간주 (Mistral/Kimi 등)
      if (actionButtons) return false;

      // 입력창이 살아있으면 생성 종료로 간주, 신호 없으면 계속 기존 분기로
      if (inputEl) return false;
    }
    // ====================================================================
    // Batch 1
    // ====================================================================

    if (hostname.includes('gemini.google.com')) {
      // Gemini: .stop-button 클래스
      return document.querySelector('.stop-button') !== null;
    }

    if (hostname.includes('claude.ai')) {
      // Claude: 🔧 CRITICAL FIX - Stop 버튼 정밀 감지 + visible 체크
      const stopBtn = document.querySelector('button[aria-label="Stop generating"]');

      // visible 체크: offsetParent가 null이면 hidden
      if (stopBtn && stopBtn.offsetParent !== null) {
        console.log('[Claude UI Lock] Stop button visible');
        return true;
      }

      // 추가 확인: textarea/contenteditable 비활성화
      const textarea = document.querySelector('div[contenteditable="true"]');
      if (textarea) {
        const isDisabled = textarea.getAttribute('contenteditable') === 'false';
        if (isDisabled) {
          console.log('[Claude UI Lock] Textarea disabled');
          return true;
        }
      }

      // 추가 확인: Submit 버튼 비활성화
      const submitBtn = document.querySelector('button[aria-label*="Send"]') ||
        document.querySelector('button[type="submit"]');
      if (submitBtn && submitBtn.disabled) {
        console.log('[Claude UI Lock] Submit button disabled');
        return true;
      }

      console.log('[Claude UI Lock] No lock detected');
      return false;
    }

    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      // ChatGPT: Stop 버튼 + Textarea 비활성화
      const hasStopBtn = document.querySelector('button[aria-label="Stop generating"]') ||
        document.querySelector('button[data-testid="stop-button"]');
      if (hasStopBtn) return true;

      const textarea = document.querySelector('#prompt-textarea');
      if (textarea && textarea.disabled) return true;

      return false;
    }

    // ====================================================================
    // Batch 2
    // ====================================================================

    if (hostname.includes('grok.com') || hostname.includes('x.com')) {
      // Grok: Stop 버튼
      return document.querySelector('button[aria-label*="Stop"]') !== null;
    }

    if (hostname.includes('perplexity.ai')) {
      // Perplexity: Stop + Pause 버튼
      const stopBtn = document.querySelector('button[aria-label*="Stop"]') ||
        document.querySelector('button:has(svg[data-icon="pause"])');
      return stopBtn !== null;
    }

    if (hostname.includes('chat.deepseek.com')) {
      // 🔧 v14.3: DeepSeek 생성 중 감지 개선
      // Stop 버튼 또는 입력창 비활성화로 생성 중 감지
      const stopSelectors = [
        'div[role="button"]:has(svg[class*="stop"])',
        'button[aria-label*="Stop"]',
        'button[aria-label*="중지"]',
        '[class*="stop-button"]'
      ];
      const stopBtn = stopSelectors.map(s => document.querySelector(s)).find(el => el);
      if (stopBtn) return true;

      // 입력창이 비활성화 상태면 생성 중
      // 🔧 v14.4: 선택자 견고성 강화
      let textarea = document.querySelector('textarea[placeholder*="DeepSeek"]');
      if (!textarea) textarea = document.querySelector('textarea._27c9245');
      if (!textarea) {
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        textarea = allTextareas.find(el => el.offsetParent !== null);
      }

      if (textarea && textarea.disabled) return true;

      return false;
    }

    // ====================================================================
    // Batch 3: Quick Implementation (Explicit Branching)
    // ====================================================================

    if (hostname.includes('chat.qwen.ai')) {
      // Qwen: 🔧 CRITICAL FIX - Stop 버튼 정밀 감지
      // 문제: div[class*="stop"]는 너무 광범위함
      // 해결: 실제 Stop 버튼 구조에 맞춰 정밀화

      // Strategy 1: 버튼 내부 텍스트로 감지 (가장 확실)
      const buttons = Array.from(document.querySelectorAll('button'));
      const stopBtn = buttons.find(btn => {
        const text = btn.innerText.toLowerCase();
        return text.includes('stop') || text.includes('중지') || text.includes('정지');
      });
      if (stopBtn && stopBtn.offsetParent !== null) { // visible check
        console.log('[Qwen UI Lock] Stop button found (text)');
        return true;
      }

      // Strategy 2: 응답 생성 중 표시 (Loading Indicator)
      const loadingIndicators = document.querySelectorAll('[class*="loading"], [class*="generating"], [class*="thinking"]');
      if (loadingIndicators.length > 0) {
        for (const indicator of loadingIndicators) {
          if (indicator.offsetParent !== null) { // visible check
            console.log('[Qwen UI Lock] Loading indicator found');
            return true;
          }
        }
      }

      // Strategy 3: Textarea 비활성화 (입력 중 체크)
      const textarea = document.querySelector('textarea');
      if (textarea && textarea.disabled) {
        console.log('[Qwen UI Lock] Textarea disabled');
        return true;
      }

      console.log('[Qwen UI Lock] No lock detected');
      return false;
    }

    if (hostname.includes('lmarena.ai')) {
      // LMArena: 🔧 강화된 Stop 버튼 감지
      const stopBtn = document.querySelector('button[aria-label*="Stop"]') ||
        document.querySelector('button[aria-label*="stop"]');

      // visible 체크
      if (stopBtn && stopBtn.offsetParent !== null) {
        console.log('[LMArena UI Lock] Stop button visible');
        return true;
      }

      // 추가: 로딩/생성 인디케이터 감지 (스피너/typing/generating 클래스)
      const loadingNodes = Array.from(document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="typing"], [class*="generating"], .animate-spin'));
      const visibleLoading = loadingNodes.find(node => isElementVisible(node));
      if (visibleLoading) {
        console.log('[LMArena UI Lock] Loading indicator visible');
        return true;
      }

      // 추가: textarea 비활성화 체크
      const textarea = document.querySelector('textarea');
      if (textarea && textarea.disabled) {
        console.log('[LMArena UI Lock] Textarea disabled');
        return true;
      }

      console.log('[LMArena UI Lock] No lock detected');
      return false;
    }

    // ====================================================================
    // Batch 4: Quick Implementation (Explicit Branching)
    // ====================================================================

    if (hostname.includes('openrouter.ai')) {
      // OpenRouter: 🔧 강화된 Stop 버튼 감지
      const stopBtn = document.querySelector('button[aria-label="Stop generating"]') ||
        document.querySelector('button[aria-label*="Stop"]') ||
        document.querySelector('button[aria-label*="stop"]');

      // visible 체크 추가
      if (stopBtn && stopBtn.offsetParent !== null) {
        console.log('[OpenRouter UI Lock] Stop button visible');
        return true;
      }

      // 추가: textarea 비활성화 체크
      const textarea = document.querySelector('textarea');
      if (textarea && textarea.disabled) {
        console.log('[OpenRouter UI Lock] Textarea disabled');
        return true;
      }

      console.log('[OpenRouter UI Lock] No lock detected');
      return false;
    }

    if (hostname.includes('github.com') && (hostname.includes('copilot') || window.location.pathname.includes('copilot'))) {
      // GitHub Copilot: Stop / Cancel
      const stopBtn = document.querySelector('button[aria-label*="Stop"]') ||
        document.querySelector('button[aria-label*="Cancel"]') ||
        document.querySelector('button[data-testid="stop-button"]');
      return stopBtn !== null;
    }

    // ====================================================================
    // Batch 5: Quick Implementation (Explicit Branching)
    // ====================================================================

    if (hostname.includes('genspark.ai') || hostname.includes('app.vooster.ai')) {
      // Genspark: Stop 버튼
      return document.querySelector('button[aria-label*="Stop"]') !== null;
    }

    // ====================================================================
    // Universal Fallback (Safety Net)
    // ====================================================================
    // 설정된 stopSelectors가 있으면 체크
    if (stopSelectors && stopSelectors.length > 0) {
      const hasStopButton = stopSelectors.some(sel => {
        const el = document.querySelector(sel) || queryShadow(document.body, sel);
        return el && isElementVisible(el);
      });
      return hasStopButton;
    }

    return false;
  }

  // ============================================================================
  // 🎯 DYNAMIC COMPLETION SIGNAL SYSTEM (v14.0)
  // BATCH1_ANALYSIS.md 기반 - 하드코딩 제거, 동적 감지
  // ============================================================================

  /**
   * 모델별 동적 완료 신호 감지
   * 🔧 v14.2: modelStartedGenerating 필수 체크 추가
   * @param {string} hostname - window.location.hostname
   * @param {boolean} hasStartedGenerating - 모델이 생성을 시작했는지 여부
   * @param {number} responseLength - 현재 응답 길이
   * @returns {Object} { isComplete: boolean, confidence: number, signal: string }
   */
  function detectDynamicCompletionSignal(hostname, hasStartedGenerating = false, responseLength = 0) {
    const result = { isComplete: false, confidence: 0, signal: 'none' };

    // 🔧 v14.2 CRITICAL: 생성이 시작되지 않았으면 절대 완료로 판정하지 않음
    if (!hasStartedGenerating) {
      result.signal = 'waiting:generation-not-started';
      return result;
    }

    // 🔧 v14.2: 최소 응답 길이 체크 (너무 짧으면 완료 아님) - 모델별 튜닝
    const MIN_COMPLETION_LENGTH = getMinCompletionLength(hostname);
    if (responseLength < MIN_COMPLETION_LENGTH) {
      result.confidence = Math.min(30, responseLength / 5);
      result.signal = 'partial:' + responseLength + 'chars (need ' + MIN_COMPLETION_LENGTH + ')';
      return result;
    }

    // === Gemini 전용: 🔧 v15.1 강화된 완료 감지 (마지막 메시지 기반 + 입력창 상태) ===
    if (hostname.includes('gemini.google.com')) {
      // 🔧 v15.1: 마지막 message-content 요소 정확히 찾기
      const allMessageContents = document.querySelectorAll('message-content');
      const lastMessageContent = allMessageContents.length > 0
        ? allMessageContents[allMessageContents.length - 1]
        : null;

      if (lastMessageContent) {
        const ariaBusy = lastMessageContent.getAttribute('aria-busy');
        const markdownContent = lastMessageContent.querySelector('.markdown');
        const textLength = markdownContent ? markdownContent.textContent?.trim().length || 0 : 0;

        // 생성 중: aria-busy=true (명시적으로 true인 경우만)
        if (ariaBusy === 'true') {
          result.confidence = 0;
          result.signal = 'gemini:aria-busy=true (generating)';
          return result;
        }

        // 🔧 v15.8 CRITICAL: 완료 - aria-busy가 'false'이거나 아예 없는 경우 + 충분한 텍스트
        // geminichat.md 분석 결과: 완료 상태에서는 aria-busy 속성이 없음
        if ((ariaBusy === 'false' || ariaBusy === null) && textLength > 50) {
          result.isComplete = true;
          result.confidence = 90;
          result.signal = `gemini:complete (aria-busy=${ariaBusy} + text=${textLength})`;
          console.log('[Dynamic Completion v15.8] Gemini: Complete');
          return result;
        }

        if (textLength > 0 && textLength <= 50) {
          result.confidence = 30;
          result.signal = `gemini:short-text (${textLength}chars)`;
        }
      }

      // 🔧 v15.8 CRITICAL: bard-avatar.thinking 클래스 체크 (Gemini가 생각 중)
      // geminithinking.md 분석: 진행 중일 때 .bard-avatar.thinking 클래스 존재
      const bardAvatarThinking = document.querySelector('.bard-avatar.thinking');
      if (bardAvatarThinking && isElementVisible(bardAvatarThinking)) {
        result.confidence = 0;
        result.signal = 'gemini:bard-avatar.thinking (generating)';
        return result;
      }

      // 🔧 v15.9: 로딩 점/스피너 가시 상태도 생성 중 신호로 사용
      const geminiLoading = Array.from(document.querySelectorAll('.loading-dots, .response-loading, [aria-label="Generating"], mat-progress-spinner'))
        .find(node => isElementVisible(node));
      if (geminiLoading) {
        result.confidence = 0;
        result.signal = 'gemini:loading-indicator-visible';
        return result;
      }

      // model-thoughts 패널 체크 (생각 중)
      const modelThoughts = document.querySelector('model-thoughts[data-test-id="model-thoughts"]');
      if (modelThoughts && isElementVisible(modelThoughts)) {
        result.confidence = 0;
        result.signal = 'gemini:model-thoughts visible (thinking)';
        return result;
      }

      // 🔧 v15.1: 입력창 상태도 확인
      const richTextarea = document.querySelector('rich-textarea');
      const isInputReady = richTextarea && !richTextarea.hasAttribute('disabled');
      if (isInputReady && lastMessageContent && lastMessageContent.getAttribute('aria-busy') !== 'true') {
        const textLen = lastMessageContent.textContent?.trim().length || 0;
        if (textLen > 50) {
          result.isComplete = true;
          result.confidence = 75;
          result.signal = `gemini:complete-fallback (input-ready + text=${textLen})`;
          return result;
        }
      }
    }

    // === ChatGPT 전용: 🔧 v15.2 강화된 완료 감지 (streaming-animation 클래스 직접 체크) ===
    if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
      // 🔧 v15.2: 더 다양한 Stop 버튼 셀렉터
      const stopSelectors = [
        'button[aria-label="Stop generating"]',
        'button[aria-label="Stop"]',
        'button[aria-label="중지"]',
        'button[data-testid="stop-button"]',
        'button[data-testid="cancel-button"]',
        'button:has(svg[data-icon="stop"])'
      ];
      const stopBtn = stopSelectors.map(s => document.querySelector(s)).find(el => el && isElementVisible(el));

      // 🔧 v15.2 CRITICAL: streaming-animation 클래스 직접 체크 (가장 확실한 생성 중 신호)
      // ChatGPT는 응답 생성 중일 때 마크다운 컨테이너에 'streaming-animation' 클래스를 추가함
      const streamingAnimationElement = document.querySelector('.streaming-animation');
      const isStreamingAnimation = streamingAnimationElement !== null && isElementVisible(streamingAnimationElement);

      const streamingIndicator = document.querySelector('[data-testid="streaming-indicator"], .result-streaming, .cursor-blink');
      const textarea = document.querySelector('#prompt-textarea');

      // 🔧 v15.1: 정확한 마지막 assistant 메시지 식별 (querySelectorAll + [length-1] 패턴)
      const assistantMessages = document.querySelectorAll('div[data-message-author-role="assistant"]');
      const lastAssistantContainer = assistantMessages.length > 0
        ? assistantMessages[assistantMessages.length - 1]
        : null;
      const lastAssistantContent = lastAssistantContainer?.querySelector('.markdown') || lastAssistantContainer;
      const textLen = lastAssistantContent ? (lastAssistantContent.textContent || '').trim().length : 0;

      // 🔧 v15.1: 마지막 메시지에서 Copy 버튼 확인 (이전 메시지 버튼 감지 방지)
      const copyButtonInLastMsg = lastAssistantContainer?.querySelector(
        'button[aria-label*="Copy"], button[data-testid*="copy"], button[class*="copy"]'
      );

      // 스트리밍 중 명확 신호 (우선순위 순서로 체크)
      // 🔧 v15.2 CRITICAL: streaming-animation 클래스가 가장 확실한 생성 중 신호
      if (isStreamingAnimation) {
        result.confidence = 0;
        result.signal = 'chatgpt:streaming-animation (generating)';
        console.log('[ChatGPT v15.2] 🔴 Generating: streaming-animation class detected');
        return result;
      }
      if (stopBtn) {
        result.confidence = 0;
        result.signal = 'chatgpt:stop-visible';
        return result;
      }
      if (streamingIndicator && isElementVisible(streamingIndicator)) {
        result.confidence = 0;
        result.signal = 'chatgpt:streaming-indicator';
        return result;
      }

      // 입력창 비활성화면 아직 생성 중
      if (textarea && textarea.disabled) {
        result.confidence = 0;
        result.signal = 'chatgpt:textarea-disabled';
        return result;
      }

      // 🔧 v15.5 CRITICAL: streaming-animation 없음 = 즉시 완료 판정 (BrainFlow Phase 2 전환 최적화)
      // ChatGPT는 응답 완료 시 streaming-animation 클래스를 제거하므로 이것이 가장 확실한 완료 신호
      if (!isStreamingAnimation && textLen > 50) {
        result.isComplete = true;
        result.confidence = 95; // ← v15.5: confidence를 95%로 상향하여 즉시 완료 경로 활성화
        result.signal = `chatgpt:streaming-stopped (no-streaming-animation + text=${textLen})`;
        console.log('[Dynamic Completion v15.5] 🎯 ChatGPT: STREAMING STOPPED - Immediate completion', {
          textLength: textLen,
          hasCopyButton: !!copyButtonInLastMsg,
          confidence: 95
        });
        return result;
      }

      // Copy 버튼 추가 확인 (더 높은 신뢰도)
      if (!isStreamingAnimation && copyButtonInLastMsg && textLen > 50) {
        result.isComplete = true;
        result.confidence = 98;
        result.signal = `chatgpt:complete (no-streaming + copy-btn + text=${textLen})`;
        console.log('[Dynamic Completion v15.5] ✅ ChatGPT: Complete with copy button');
        return result;
      }

      // 텍스트가 너무 짧음 → 대기
      result.confidence = Math.min(40, textLen);
      result.signal = `chatgpt:short-text (${textLen})`;
      return result;
    }

    // === Qwen 전용: 복사 버튼 출현 감지 ===
    // === Qwen 전용: 🔧 v15.8 완료 감지 (qwen-chat-package-comp-new-action-control-icons 기반) ===
    if (hostname.includes('chat.qwen.ai') || hostname.includes('qwen.alibaba')) {
      // 1. 마지막 AI 응답 컨테이너 찾기
      const assistantMessages = document.querySelectorAll('.qwen-chat-message-assistant');
      const lastAssistant = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;

      // 2. 응답 텍스트 존재 확인
      const responseContent = lastAssistant?.querySelector('.qwen-markdown, .response-message-content');
      const hasResponseText = responseContent && responseContent.textContent?.trim().length > 0;
      const copyButton = lastAssistant?.querySelector('.copy-response-button, button[aria-label="Copy"], button[aria-label="복사"]');

      if (!hasResponseText) {
        result.confidence = 0;
        result.signal = 'qwen:no-response-text (waiting)';
        return result;
      }

      // 3. 🔧 v15.8 CRITICAL: qwen-chat-package-comp-new-action-control-icons 컨테이너 확인
      // 완료 시 이 컨테이너 안에 6개 버튼 (copy, good, bad, share, regenerate, more)이 나타남
      const actionIconsContainer = lastAssistant?.querySelector('.qwen-chat-package-comp-new-action-control-icons');
      const actionControlContainers = actionIconsContainer?.querySelectorAll('.qwen-chat-package-comp-new-action-control-container') || [];
      const hasActionIconsContainer = actionControlContainers.length >= 4; // 최소 4개 이상 (good, bad, regenerate, more 등)

      // 4. 기존 방식 폴백: 액션 버튼 존재 확인 (완료 시에만 표시됨)
      const actionContainer = lastAssistant?.querySelector('.response-message-footer .qwen-chat-package-comp-new-action-control');
      const hasGoodButton = !!lastAssistant?.querySelector('[class*="action-control-container-good"]');
      const hasBadButton = !!lastAssistant?.querySelector('[class*="action-control-container-bad"]');
      const hasRegenerateButton = !!lastAssistant?.querySelector('[class*="action-control-container-regenerate"]');
      const hasActionButtons = hasGoodButton || hasBadButton || hasRegenerateButton || !!copyButton;

      // 5. 입력창 상태 확인
      const inputField = document.querySelector('#chat-input, textarea.chat-input');
      const isInputEnabled = inputField && !inputField.disabled;

      // 6. 전송 버튼 상태 (완료 시 disabled, 생성 중 활성화)
      const sendButton = document.querySelector('button.send-button');
      const isSendButtonDisabled = sendButton && (sendButton.disabled || sendButton.classList.contains('disabled'));

      // 7. 생성 중 신호: Stop 버튼 존재 여부
      const stopButton = document.querySelector('button.send-button:not(.disabled):not([disabled]) [class*="stop"], button[aria-label*="Stop"], button[aria-label*="停止"]');
      const hasStopButton = !!stopButton;

      // 디버그 로그
      console.log('[Qwen v15.8] Completion check:', {
        hasActionIconsContainer,
        actionControlCount: actionControlContainers.length,
        hasGoodButton, hasBadButton, hasRegenerateButton,
        hasStopButton
      });

      // 🎯 완료 판정 로직
      if (hasStopButton) {
        // Stop 버튼이 있으면 무조건 생성 중
        result.confidence = 0;
        result.signal = 'qwen:generating (stop-button-present)';
        return result;
      }

      // 🔧 v15.8 CRITICAL: action-control-icons 컨테이너가 있으면 완료 (가장 확실한 신호)
      if (hasActionIconsContainer && hasResponseText) {
        result.isComplete = true;
        result.confidence = 98;
        result.signal = `qwen:complete (action-icons-container with ${actionControlContainers.length} buttons)`;
        console.log('[Dynamic Completion v15.8] Qwen: Complete (action-icons-container detected)');
        return result;
      }

      if (hasActionButtons && hasResponseText) {
        // 액션 버튼(좋아요/싫어요/재생성) + 응답 텍스트 = 완료 (최고 신뢰도)
        result.isComplete = true;
        result.confidence = 95;
        result.signal = `qwen:complete (action-buttons: good=${hasGoodButton}, bad=${hasBadButton}, regen=${hasRegenerateButton})`;
        console.log('[Dynamic Completion v15.8] Qwen: Complete (action buttons + response text)');
        return result;
      }

      if (copyButton && hasResponseText && !hasStopButton) {
        // 복사 버튼이 보이면 완료 상태로 간주 (신뢰도 높음)
        result.isComplete = true;
        result.confidence = 90;
        result.signal = 'qwen:complete (copy button visible)';
        return result;
      }

      if (isInputEnabled && isSendButtonDisabled && hasResponseText) {
        // 입력창 활성화 + 전송버튼 비활성화 + 응답 텍스트 = 완료 (높은 신뢰도)
        result.isComplete = true;
        result.confidence = 85;
        result.signal = 'qwen:complete (input-enabled + send-disabled + text-exists)';
        console.log('[Dynamic Completion v15.8] Qwen: Complete (fallback - input/send state)');
        return result;
      }

      // 아직 생성 중 또는 대기 + 명시적 return 추가 (v14.8)
      const actionInfo = `good=${hasGoodButton}, bad=${hasBadButton}, regen=${hasRegenerateButton}, copy=${!!copyButton}`;
      console.log(`[Qwen v14.8] actions: ${actionInfo}, input=${isInputEnabled}, sendDisabled=${isSendButtonDisabled}`);
      result.confidence = 30;
      result.signal = `qwen:uncertain (waiting for action buttons: ${actionInfo})`;
      return result;
    }

    // === Kimi 전용: 🔧 v15.0 실제 DOM 기반 완료 감지 ===
    if (hostname.includes('kimi.moonshot.cn') || hostname.includes('kimi.com')) {
      const chatList = document.querySelector('.chat-content-list');

      if (!chatList) {
        // 리스트 컨테이너를 못 찾으면 기존 방식(가장 마지막 봇 세그먼트) 사용하되 신뢰도 낮춤
        const assistants = document.querySelectorAll('.segment-assistant');
        if (assistants.length === 0) {
          result.signal = 'kimi:no-assistant-found';
          return result;
        }
      } else {
        // 리스트가 있으면 순서 검증 수행
        const lastItem = chatList.lastElementChild;
        if (!lastItem) {
          result.signal = 'kimi:empty-chat-list';
          return result;
        }

        // 마지막 항목이 사용자 메시지라면 -> 아직 봇 응답 생성 전임 (대기)
        if (lastItem.classList.contains('chat-content-item-user') || lastItem.querySelector('.segment-user')) {
          result.confidence = 0;
          result.signal = 'kimi:last-item-is-user (waiting for response creation)';
          return result;
        }

        // 마지막 항목이 봇 메시지가 아니라면? (예: 로딩 바, 에러 등)
        if (!lastItem.classList.contains('chat-content-item-assistant') && !lastItem.querySelector('.segment-assistant')) {
          result.confidence = 0;
          result.signal = 'kimi:last-item-unknown (waiting)';
          return result;
        }
      }

      // 여기까지 오면 마지막 항목이 봇 메시지임.
      const assistantSegments = document.querySelectorAll('.segment-assistant');
      const lastAssistant = assistantSegments[assistantSegments.length - 1];

      if (!lastAssistant) return result;

      // 1. "액션 버튼" 컨테이너 확인 - 🔧 v15.0: 실제 DOM 구조에 맞게 검색
      const actionContainer = lastAssistant.querySelector('.segment-assistant-actions');
      const actionContent = lastAssistant.querySelector('.segment-assistant-actions-content');

      // .icon-button 클래스를 가진 버튼들 (Copy, Refresh, Share, Like, Dislike)
      const iconButtons = actionContent
        ? actionContent.querySelectorAll('.icon-button')
        : actionContainer?.querySelectorAll('.icon-button') || [];

      // 🔧 v15.9: 일부 상태에서 actions 컨테이너가 visibility:hidden 이지만 버튼 DOM은 존재하므로 가시성 검사 완화
      const actionsVisible = isElementVisible(actionContainer) || isElementVisible(actionContent) || !!actionContainer || !!actionContent;

      // 🔧 v15.9: icon-button이 4개 이상이면 완료 후보 (Copy/Refresh/Share/Like/Dislike 중 최소 4개)
      const hasActionButtons = iconButtons.length >= 4 && actionsVisible;

      // 2. 응답 텍스트 체크 - .markdown-container .markdown 또는 .markdown
      const markdownContainer = lastAssistant.querySelector('.markdown-container');
      const markdownContent = markdownContainer?.querySelector('.markdown') || lastAssistant.querySelector('.markdown');
      const responseTextLength = markdownContent ? markdownContent.textContent?.trim().length || 0 : 0;

      // 3. 입력창 체크 - Lexical 에디터 기반
      const chatInput = document.querySelector('.chat-input-editor[data-lexical-editor="true"][contenteditable="true"]');
      const isInputEnabled = chatInput !== null && chatInput.getAttribute('contenteditable') === 'true';

      // 4. 전송 버튼 상태 체크 - 🔧 v15.0: .send-button-container.disabled 체크
      const sendButtonContainer = document.querySelector('.send-button-container');
      const isSendDisabled = sendButtonContainer?.classList.contains('disabled') ?? true;

      // 5. Stop 버튼 체크 (생성 중일 때 활성화됨)
      const hasStopButton = !isSendDisabled; // disabled가 아닐 때 = 생성 중

      // 디버그 로깅
      console.log('[Dynamic Completion v15.0] Kimi:', {
        iconButtonCount: iconButtons.length,
        hasActionButtons,
        responseTextLength,
        isInputEnabled,
        isSendDisabled,
        hasStopButton
      });

      // 완료 판정: 액션버튼 있고, 텍스트 있고, 입력가능하고, 전송버튼이 disabled(=생성 완료) 상태
      if (hasActionButtons && responseTextLength > 0 && isInputEnabled && isSendDisabled) {
        result.isComplete = true;
        result.confidence = 95;
        result.signal = 'kimi:actions-verified + text=' + responseTextLength + ' + send-disabled';
        console.log('[Dynamic Completion v15.0] Kimi: Complete (actions verified, text=' + responseTextLength + ')');
        return result;
      } else {
        if (!isSendDisabled) result.signal = 'kimi:generating (send-button-active)';
        else if (!hasActionButtons) result.signal = 'kimi:waiting-for-actions (icons=' + iconButtons.length + ')';
        else if (responseTextLength === 0) result.signal = 'kimi:waiting-for-text';
        else if (!isInputEnabled) result.signal = 'kimi:input-disabled';

        result.confidence = 0;
        return result;
      }
    }

    // === DeepSeek 전용: 🔧 v15.8 마지막 메시지 기반 완료 감지 (_43c05b5 클래스 체크 추가) ===
    if (hostname.includes('chat.deepseek.com')) {
      // 🔑 핵심 변경 v15.8: _43c05b5 클래스가 완료 신호, d7dc56a8 클래스가 진행중 신호

      // 1. 모든 메시지 컨테이너 가져오기 (ds-message 또는 _4f9bf79 클래스)
      const messageCandidates = Array.from(document.querySelectorAll('._4f9bf79, .ds-message'));
      let lastMessage = null;
      for (let i = messageCandidates.length - 1; i >= 0; i -= 1) {
        const candidate = messageCandidates[i];
        // ds-markdown 이 없는 경우(사용자 메시지 등) 건너뛰기
        if (candidate.querySelector('.ds-markdown')) {
          lastMessage = candidate;
          break;
        }
      }

      // 🔧 v15.8 CRITICAL: _43c05b5 vs d7dc56a8 클래스로 완료 여부 판단
      // 완료된 메시지: _4f9bf79 _43c05b5 클래스 조합
      // 진행중 메시지: _4f9bf79 d7dc56a8 클래스 조합
      const hasCompletedClass = lastMessage?.classList.contains('_43c05b5');
      const hasGeneratingClass = lastMessage?.classList.contains('d7dc56a8');

      if (hasGeneratingClass && !hasCompletedClass) {
        // d7dc56a8 클래스만 있고 _43c05b5 없으면 아직 생성 중
        result.confidence = 0;
        result.signal = 'deepseek:generating (d7dc56a8 class present, no _43c05b5)';
        console.log('[DeepSeek v15.8] 🔴 Still generating: d7dc56a8 class detected');
        return result;
      }

      // 2. 마지막 메시지 내에서 액션 버튼 확인 (시맨틱 클래스 우선, 해시 클래스는 폴백)
      let hasActionButtonsInLastMessage = false;
      if (lastMessage) {
        const iconButtons = lastMessage.querySelectorAll('.ds-icon-button[role="button"]');
        hasActionButtonsInLastMessage = iconButtons.length > 0;
        if (!hasActionButtonsInLastMessage) {
          const actionBarInLast = lastMessage.querySelector('._0a3d93b, ._965abe9');
          const actionButtonsInLast = actionBarInLast?.querySelectorAll('.db183363') || [];
          hasActionButtonsInLastMessage = actionButtonsInLast.length > 0;
        }
      }

      // 3. 전송 버튼 disabled 상태 확인 (완료 시 aria-disabled="true")
      const sendButton = document.querySelector('._7436101[role="button"], .bf38813a .ds-icon-button[role="button"]');
      const isSendButtonDisabled = !!(sendButton && sendButton.getAttribute('aria-disabled') === 'true');

      // 4. Stop 버튼 확인 (생성 중에만 나타남)
      const stopSelectors = [
        'div[role="button"]:has(svg[class*="stop"])',
        'button[aria-label*="Stop"]',
        'button[aria-label*="중지"]',
        '[data-testid*="stop"]',
        '[class*="stop-button"]'
      ];
      // 전송 버튼 아이콘이 정지(정사각형) 아이콘으로 변하는 케이스 대응
      const stopBtnSquare = document
        .querySelector('._7436101.ds-icon-button svg path[d^="M2 4.88"]')
        ?.closest('._7436101.ds-icon-button');
      const stopBtn =
        (stopBtnSquare && isElementVisible(stopBtnSquare) && stopBtnSquare) ||
        stopSelectors.map(s => document.querySelector(s)).find(el => el && isElementVisible(el));

      // 5. DeepThink 모드 thinking 상태 감지 (생성 중)
      const isThinking = document.querySelector('[class*="thinking"], [class*="Thinking"], .ds-typing-indicator') !== null;

      // 6. 입력창 상태 확인
      let textarea = document.querySelector('textarea[placeholder*="Message DeepSeek"], textarea[placeholder*="DeepSeek"]');
      if (!textarea) textarea = document.querySelector('textarea._27c9245, textarea.d96f2d2a');
      if (!textarea) {
        const allTextareas = Array.from(document.querySelectorAll('textarea'));
        textarea = allTextareas.find(el => el.offsetParent !== null && el.getAttribute('placeholder')?.toLowerCase().includes('deep'));
      }
      const isInputEnabled = !!(textarea && !textarea.disabled && textarea.offsetParent !== null);

      // 7. 마크다운 텍스트 확인 (마지막 메시지 기준)
      const lastMarkdown = lastMessage?.querySelector('.ds-markdown') || null;
      const textLength = lastMarkdown ? lastMarkdown.textContent?.trim().length || 0 : 0;

      // 🎯 완료 판정 로직 (우선순위 기반)

      // 생성 중 신호가 있으면 무조건 미완료
      if (stopBtn || isThinking) {
        result.confidence = 0;
        result.signal = stopBtn ? 'deepseek:generating (stop-button)' : 'deepseek:thinking (DeepThink mode)';
        return result;
      }

      // 🔧 v15.8 CRITICAL: _43c05b5 클래스가 있으면 완료 (가장 확실한 신호)
      if (hasCompletedClass && textLength > 0) {
        result.isComplete = true;
        result.confidence = 98;
        result.signal = `deepseek:complete (_43c05b5 class + text=${textLength})`;
        console.log('[Dynamic Completion v15.8] DeepSeek: Complete (_43c05b5 class detected)');
        return result;
      }

      // 🔑 최우선: 마지막 메시지 내 액션 버튼 + 텍스트 존재 = 완료 (최고 신뢰도)
      if (hasActionButtonsInLastMessage && textLength > 0) {
        result.isComplete = true;
        result.confidence = 95;
        result.signal = `deepseek:complete (last-msg-actions + text=${textLength})`;
        console.log('[Dynamic Completion v15.8] DeepSeek: Complete (action buttons in last message)');
        return result;
      }

      // 전송 버튼 disabled + 입력창 활성화 + 텍스트 존재 = 완료 (높은 신뢰도)
      if (isSendButtonDisabled && isInputEnabled && textLength > 0) {
        result.isComplete = true;
        result.confidence = 85;
        result.signal = `deepseek:complete (send-disabled + text=${textLength})`;
        console.log('[Dynamic Completion v14.11] DeepSeek: Complete (send button disabled)');
        return result;
      }

      // 입력창 활성화 + 텍스트 존재 + 생성 아님 = 완료 (fallback)
      if (isInputEnabled && !stopBtn && !isThinking && textLength > 0) {
        result.isComplete = true;
        result.confidence = 70;
        result.signal = `deepseek:complete-fallback (input-enabled, text=${textLength})`;
        console.log('[Dynamic Completion v14.11] DeepSeek: Complete (fallback)');
        return result;
      }

      // 아직 응답 대기 중 또는 불확실
      if (textLength === 0) {
        result.confidence = 0;
        result.signal = 'deepseek:waiting (no response text)';
      } else {
        result.confidence = 30;
        result.signal = `deepseek:uncertain (text=${textLength}, no last-msg actions)`;
      }
      return result;
    }

    // === OpenRouter 전용: rounded-*-none 버블 클래스 감지 (BATCH1_ANALYSIS Line 313, 328) ===
    if (hostname.includes('openrouter.ai')) {
      // assistant 버블은 rounded-tl-none, user 버블은 rounded-tr-none
      const assistantBubbles = document.querySelectorAll('[class*="rounded-tl-none"]');
      if (assistantBubbles.length > 0) {
        const lastBubble = assistantBubbles[assistantBubbles.length - 1];
        if (lastBubble.textContent && lastBubble.textContent.length > 10) {
          result.confidence = 60; // 보조 신호로 활용
          result.signal = 'openrouter:assistant-bubble detected';
        }
      }
    }

    // === LMArena 전용: 🔧 v15.1 강화된 완료 감지 ===
    if (hostname.includes('lmarena.ai')) {
      // 1. 마지막 assistant 메시지 찾기
      const assistantNodes = document.querySelectorAll('[data-message-author-role="assistant"], [class*="assistant"]');
      const lastAssistant = assistantNodes.length > 0 ? assistantNodes[assistantNodes.length - 1] : null;

      // 2. 응답 텍스트 길이 확인
      const responseTextLen = lastAssistant ? (lastAssistant.textContent || '').trim().length : 0;

      // 3. Stop 버튼 확인 (여러 셀렉터)
      const stopSelectors = [
        'button[aria-label*="Stop"]',
        'button[aria-label*="중지"]',
        'button[data-testid*="stop"]',
        'button:has(svg[class*="stop"])'
      ];
      const stopBtn = stopSelectors.map(s => document.querySelector(s)).find(el => el && isElementVisible(el));

      // 3.5 로딩/생성 인디케이터 존재 여부 확인
      const loadingNodes = Array.from(document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="typing"], [class*="generating"], .animate-spin'));
      const visibleLoading = loadingNodes.find(node => isElementVisible(node));

      // 4. 입력창 상태 확인
      const textarea = document.querySelector('textarea:not([disabled])');
      const isTextareaEnabled = textarea && !textarea.disabled;

      // 생성 중
      if (stopBtn || visibleLoading) {
        result.confidence = 0;
        result.signal = 'lmarena:generating (stop/loader visible)';
        return result;
      }

      // 완료: 입력창 활성화 + 충분한 텍스트
      if (isTextareaEnabled && responseTextLen > 50) {
        result.isComplete = true;
        result.confidence = 85;
        result.signal = `lmarena:complete (input-enabled + text=${responseTextLen}chars)`;
        console.log('[Dynamic Completion v15.1] LMArena: Complete');
        return result;
      }

      // 폴백: Stop 버튼 없음 + 텍스트 존재
      if (!stopBtn && responseTextLen > 50) {
        result.isComplete = true;
        result.confidence = 70;
        result.signal = `lmarena:complete-fallback (text=${responseTextLen}chars)`;
        return result;
      }

      // 대기 중
      result.confidence = responseTextLen > 0 ? 30 : 0;
      result.signal = responseTextLen > 0 ? `lmarena:short-text (${responseTextLen}chars)` : 'lmarena:waiting';
      return result;
    }

    // === Mistral 전용: 🔧 v15.8 완료 감지 (fade-in + inert + disabled 기반) ===
    if (hostname.includes('chat.mistral.ai')) {
      // 1. 마지막 assistant 메시지 찾기
      const assistantMessages = document.querySelectorAll('[data-message-author-role="assistant"]');
      const lastAssistant = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1] : null;

      // 2. 응답 텍스트 존재 확인
      const responseArea = lastAssistant?.querySelector('[data-message-part-type="answer"], .markdown-container-style');
      const responseText = responseArea?.textContent?.trim() || '';
      const hasResponseText = responseText.length > 0;

      // 3. 🔧 v15.9 CRITICAL: fade-in/inert 스코프를 마지막 assistant로 한정해 오탐 감소
      // 진행중 상태: .fade-in 클래스가 존재함
      const fadeInElements = lastAssistant ? lastAssistant.querySelectorAll('.fade-in') : [];
      const hasFadeInClass = fadeInElements.length > 0;

      // 4. inert 속성 체크 (생성 중에는 일부 요소에 inert 속성이 추가됨)
      const inertElements = lastAssistant ? lastAssistant.querySelectorAll('[inert]') : [];
      const hasInertAttribute = inertElements.length > 0;

      // 5. 액션 버튼 상태 확인 (완료 시: aria-disabled="false", 생성 중: aria-disabled="true")
      const actionButtons = lastAssistant?.querySelectorAll('button[aria-label="Like"], button[aria-label="Dislike"], button[aria-label="Rewrite"]') || [];
      let hasDisabledButtons = false;
      let hasEnabledActionButtons = false;

      for (const btn of actionButtons) {
        if (btn.getAttribute('aria-disabled') === 'true' || btn.disabled) {
          hasDisabledButtons = true;
        } else if (btn.getAttribute('aria-disabled') === 'false') {
          hasEnabledActionButtons = true;
        }
      }

      // 6. 입력창 상태 확인 (ProseMirror contenteditable)
      const inputField = document.querySelector('div.ProseMirror[contenteditable="true"]');
      const isInputEnabled = inputField !== null && inputField.getAttribute('contenteditable') === 'true';

      // 디버그 로그
      console.log('[Mistral v15.8] Completion check:', {
        hasFadeInClass,
        fadeInCount: fadeInElements.length,
        hasInertAttribute,
        inertCount: inertElements.length,
        hasDisabledButtons,
        hasEnabledActionButtons,
        hasResponseText,
        responseLength: responseText.length
      });

      // 🎯 완료 판정 로직

      // fade-in 클래스 또는 inert 속성이 있으면 아직 생성 중
      if (hasFadeInClass) {
        result.confidence = 0;
        result.signal = `mistral:generating (fade-in class present: ${fadeInElements.length} elements)`;
        console.log('[Mistral v15.8] 🔴 Still generating: fade-in class detected');
        return result;
      }

      if (hasInertAttribute) {
        result.confidence = 0;
        result.signal = `mistral:generating (inert attribute present: ${inertElements.length} elements)`;
        console.log('[Mistral v15.8] 🔴 Still generating: inert attribute detected');
        return result;
      }

      // 버튼이 disabled 상태면 아직 생성 중
      if (hasDisabledButtons && !hasEnabledActionButtons) {
        result.confidence = 0;
        result.signal = 'mistral:generating (action buttons disabled)';
        return result;
      }

      // 완료: fade-in 없음 + inert 없음 + 액션 버튼 enabled + 응답 텍스트 존재
      if (!hasFadeInClass && !hasInertAttribute && hasEnabledActionButtons && hasResponseText) {
        result.isComplete = true;
        result.confidence = 98;
        result.signal = `mistral:complete (no-fade-in + no-inert + enabled-buttons + text=${responseText.length}chars)`;
        console.log('[Dynamic Completion v15.8] Mistral: Complete');
        return result;
      }

      // 폴백: fade-in/inert 없음 + 충분한 텍스트
      if (!hasFadeInClass && !hasInertAttribute && hasResponseText && responseText.length > 50) {
        result.isComplete = true;
        result.confidence = 85;
        result.signal = `mistral:complete-fallback (no-generating-signals + text=${responseText.length}chars)`;
        console.log('[Dynamic Completion v15.8] Mistral: Complete (fallback)');
        return result;
      }

      // 대기 중
      result.confidence = hasResponseText ? 30 : 0;
      result.signal = hasResponseText ? `mistral:uncertain (text=${responseText.length}chars)` : 'mistral:waiting';
      return result;
    }

    // === Claude 전용: 🔧 v14.10 마지막 메시지 기반 완료 감지 (모든 케이스 명시적 return) ===
    if (hostname.includes('claude.ai')) {
      const claudeSnapshot = getClaudeLatestSnapshot({ cleanText: true });
      const { isStreaming, hasCopyButton, responseTextLength, isInputEnabled, hasStopButton } = claudeSnapshot;
      const hasResponseText = responseTextLength > 0;
      const isGenerating = isStreaming || hasStopButton;

      // 디버그 로그
      console.log(`[Claude v14.10] streaming=${isStreaming}, stop=${hasStopButton}, copy=${hasCopyButton}, input=${isInputEnabled}, text=${responseTextLength}`);

      // 🎯 완료 판정 로직 (우선순위 기반 + 명시적 return)

      // 스트리밍 중이면 무조건 미완료
      if (isGenerating) {
        result.confidence = 0;
        result.signal = hasStopButton ? 'claude:generating (stop-button)' : 'claude:streaming (data-is-streaming=true)';
        return result;
      }

      // 🔑 최우선: 스트리밍 아님 + 복사 버튼 + 응답 텍스트 = 완료 (최고 신뢰도)
      if (!isStreaming && hasCopyButton && hasResponseText) {
        result.isComplete = true;
        result.confidence = 95;
        result.signal = `claude:complete (copy-button + text=${responseTextLength})`;
        console.log('[Dynamic Completion v14.10] Claude: Complete (copy button detected)');
        return result;
      }

      // 스트리밍 아님 + 입력창 활성화 + 응답 텍스트 = 완료 (높은 신뢰도)
      if (!isStreaming && isInputEnabled && hasResponseText) {
        result.isComplete = true;
        result.confidence = 85;
        result.signal = `claude:complete (input-enabled + text=${responseTextLength})`;
        console.log('[Dynamic Completion v14.10] Claude: Complete (input enabled)');
        return result;
      }

      // 스트리밍 아님 + 응답 텍스트만 존재 (fallback - 일정 시간 후 완료로 간주)
      if (!isStreaming && hasResponseText && responseTextLength > 50) {
        result.isComplete = true;
        result.confidence = 70;
        result.signal = `claude:complete-fallback (text=${responseTextLength}, no buttons yet)`;
        console.log('[Dynamic Completion v14.10] Claude: Complete (fallback - text only)');
        return result;
      }

      // 아직 응답 대기 중 또는 생성 시작 전
      result.confidence = hasResponseText ? 30 : 0;
      result.signal = hasResponseText ? `claude:uncertain (text=${responseTextLength})` : 'claude:waiting-for-response';
      return result;
    }

    // === Grok 전용: 🔧 v15.7 완료 감지 (animate-gaussian 클래스 체크 추가) ===
    if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
      // 1. 모든 응답 컨테이너에서 마지막 응답 찾기
      const allResponses = document.querySelectorAll('[id^="response-"]');
      const lastResponseContainer = allResponses.length > 0 ? allResponses[allResponses.length - 1] : null;

      // 2. 마지막 응답 내의 텍스트 확인 (.response-content-markdown 또는 .message-bubble)
      const responseMarkdown = lastResponseContainer?.querySelector('.response-content-markdown') ||
        lastResponseContainer?.querySelector('.message-bubble') ||
        document.querySelector('.response-content-markdown:last-of-type');
      const responseText = responseMarkdown?.textContent?.trim() || '';
      const hasResponseText = responseText.length > 0;

      // 3. 🔧 v15.7 CRITICAL: animate-gaussian 클래스 체크 (생성 중 가장 확실한 신호)
      // Grok은 응답 생성 중 텍스트에 animate-gaussian 클래스를 추가함
      const animateGaussianElements = document.querySelectorAll('.animate-gaussian');
      const hasAnimateGaussian = animateGaussianElements.length > 0;

      // 4. 🔧 v15.2: 마지막 응답에만 있는 .last-response 클래스 활용
      // action-buttons.last-response는 완료 시에만 나타남 (이전 메시지 버튼 혼동 방지)
      const lastResponseActions = document.querySelector('.action-buttons.last-response');

      // 5. 마지막 응답에서만 액션 버튼 확인 (완료 시에만 나타남)
      // 복사, 좋아요, 싫어요, 재생성 버튼이 .last-response 내에 있으면 완료
      const copyButton = lastResponseActions?.querySelector('button[aria-label="복사"], button[aria-label="Copy"]');
      const likeButton = lastResponseActions?.querySelector('button[aria-label="Like"]');
      const dislikeButton = lastResponseActions?.querySelector('button[aria-label="Dislike"]');
      const regenerateButton = lastResponseActions?.querySelector('button[aria-label="Regenerate"]');
      const readAloudButton = lastResponseActions?.querySelector('button[aria-label="Read Aloud"]');

      const hasActionButtons = copyButton !== null || likeButton !== null ||
        dislikeButton !== null || regenerateButton !== null ||
        readAloudButton !== null;

      // 6. 입력창 상태 확인 (contenteditable="true")
      const inputField = document.querySelector('.tiptap.ProseMirror[contenteditable="true"]');
      const isInputEnabled = inputField !== null;

      // 7. 제출 버튼 상태 확인 (disabled면 입력 없음, enabled면 전송 가능)
      const submitButton = document.querySelector('button[type="submit"][aria-label="제출"], button[type="submit"][aria-label="Submit"]');
      const isSubmitDisabled = submitButton?.disabled || false;

      // 8. 생성 중 신호: 로딩 스피너 또는 sonner-spinner 확인
      const spinnerVisible = document.querySelector('.sonner-spinner:not([data-visible="false"])');
      const hasSpinner = spinnerVisible !== null;

      // 9. 🔧 v15.7: 종합적 생성 중 판단 (animate-gaussian이 가장 확실한 신호)
      const isGenerating = hasAnimateGaussian || hasSpinner;

      // 디버그 로그
      console.log(`[Grok v15.7] responses=${allResponses.length}, text=${responseText.length}, animate-gaussian=${hasAnimateGaussian}, last-actions=${!!lastResponseActions}, actions=${hasActionButtons} (copy=${!!copyButton}, like=${!!likeButton}, regen=${!!regenerateButton}), input=${isInputEnabled}, submitDisabled=${isSubmitDisabled}, spinner=${hasSpinner}, generating=${isGenerating}`);

      // 🎯 완료 판정 로직 (우선순위 기반 + 명시적 return)

      // 🔧 v15.7 CRITICAL: animate-gaussian이 있으면 무조건 생성 중 (가장 확실한 신호)
      if (hasAnimateGaussian) {
        result.confidence = 0;
        result.signal = `grok:generating (animate-gaussian=${animateGaussianElements.length} elements)`;
        console.log('[Grok v15.7] 🔴 Generating: animate-gaussian class detected');
        return result;
      }

      // 스피너가 보이면 생성 중
      if (hasSpinner) {
        result.confidence = 0;
        result.signal = 'grok:generating (spinner visible)';
        return result;
      }

      // 🔑 최우선: animate-gaussian 없음 + 텍스트 존재 = 완료 (즉시 판정)
      if (!hasAnimateGaussian && hasResponseText && responseText.length > 50) {
        result.isComplete = true;
        result.confidence = 95;
        result.signal = `grok:streaming-stopped (no-animate-gaussian + text=${responseText.length}chars)`;
        console.log('[Dynamic Completion v15.7] 🎯 Grok: STREAMING STOPPED - Immediate completion');
        return result;
      }

      // .last-response 내 액션 버튼 존재 + 응답 텍스트 = 완료 (최고 신뢰도)
      if (lastResponseActions && hasActionButtons && hasResponseText) {
        result.isComplete = true;
        result.confidence = 98;
        result.signal = `grok:complete (last-response-actions + text=${responseText.length}chars)`;
        console.log('[Dynamic Completion v15.7] Grok: Complete (last-response action buttons detected)');
        return result;
      }

      // 입력창 활성화 + 제출 버튼 비활성화 + 응답 텍스트 = 완료
      if (isInputEnabled && isSubmitDisabled && hasResponseText) {
        result.isComplete = true;
        result.confidence = 85;
        result.signal = `grok:complete (input-enabled + submit-disabled + text=${responseText.length}chars)`;
        console.log('[Dynamic Completion v15.7] Grok: Complete (submit disabled)');
        return result;
      }

      // 입력창 활성화 + 충분한 응답 텍스트 (fallback)
      if (isInputEnabled && hasResponseText && responseText.length > 100) {
        result.isComplete = true;
        result.confidence = 75;
        result.signal = `grok:complete-fallback (input-enabled + text=${responseText.length}chars)`;
        console.log('[Dynamic Completion v15.7] Grok: Complete (fallback)');
        return result;
      }

      // 아직 대기중 또는 불확실
      result.confidence = hasResponseText ? 30 : 0;
      result.signal = hasResponseText ? `grok:uncertain (text=${responseText.length}chars, waiting for last-response)` : 'grok:waiting-for-response';
      return result;
    }

    // === OpenRouter 전용: 🔧 v14.8 완료 감지 (새 HTML 분석 기반) ===
    if (hostname.includes('openrouter.ai')) {
      // 1. 메시지 컨테이너에서 마지막 메시지 확인 (data-message-id 기반)
      const messageList = document.querySelector('[data-testid="message-list-content"]');
      const allMessages = messageList?.querySelectorAll('[data-message-id]') || [];
      const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;

      // 2. 마지막 메시지가 AI 응답인지 확인 (왼쪽 정렬 = AI, 오른쪽 정렬 = 사용자)
      const isAssistantMessage = lastMessage?.querySelector('.slide-in-from-left-12, .items-start') !== null;

      // 3. AI 응답 텍스트 존재 확인 (rounded-tl-none 클래스 사용)
      const assistantBubbles = document.querySelectorAll('[class*="rounded-tl-none"]');
      const lastBubble = assistantBubbles.length > 0 ? assistantBubbles[assistantBubbles.length - 1] : null;
      const responseText = lastBubble?.textContent?.trim() || '';
      const hasResponseText = responseText.length > 0;

      // 4. 🔑 전송 버튼 상태 확인 (완료 시: disabled + opacity-40)
      const sendButton = document.querySelector('[data-testid="playground-composer"] button.bg-primary');
      const isSendButtonDisabled = sendButton && (sendButton.disabled || sendButton.classList.contains('opacity-40'));

      // 5. 입력창 상태 확인
      const textarea = document.querySelector('[data-testid="playground-composer"] textarea');
      const isTextareaEnabled = textarea && !textarea.disabled && !textarea.readOnly;

      // 6. 생성 중 신호: 전송버튼이 Stop 아이콘으로 변경되었는지 (disabled가 아니고 활성 상태)
      const isGenerating = sendButton && !sendButton.disabled && !sendButton.classList.contains('opacity-40');

      // 🎯 완료 판정 로직
      if (isGenerating) {
        // 전송 버튼이 활성화되어 있으면 생성 중
        result.confidence = 0;
        result.signal = 'openrouter:generating (send-button-active)';
        return result;
      }

      if (isSendButtonDisabled && hasResponseText && isAssistantMessage) {
        // 전송 버튼 비활성화 + AI 응답 텍스트 존재 = 완료 (최고 신뢰도)
        result.isComplete = true;
        result.confidence = 95;
        result.signal = `openrouter:complete (send-disabled + response=${responseText.length}chars)`;
        console.log('[Dynamic Completion v14.8] OpenRouter: Complete');
        return result;
      }

      if (isTextareaEnabled && hasResponseText && !isGenerating) {
        // 입력창 활성화 + 응답 텍스트 + 생성 아님 = 완료 (높은 신뢰도)
        result.isComplete = true;
        result.confidence = 85;
        result.signal = `openrouter:complete-fallback (textarea-enabled + response=${responseText.length}chars)`;
        console.log('[Dynamic Completion v14.8] OpenRouter: Complete (fallback)');
        return result;
      }

      // 아직 대기중 또는 불확실
      if (!hasResponseText) {
        result.confidence = 0;
        result.signal = 'openrouter:waiting (no-response-text)';
      } else {
        result.confidence = 30;
        result.signal = 'openrouter:uncertain';
      }
      return result;
    }

    return result;
  }

  /**
   * 동적 안정화 시간 계산 (🔧 v14.1: 조기 종료 방지 강화)
   * @param {string} hostname - window.location.hostname  
   * @param {number} avgChunkInterval - 평균 청크 간격 (ms)
   * @param {Object} completionSignal - detectDynamicCompletionSignal 결과
   * @param {Object} manifest - Model manifest configuration
   * @returns {number} 동적 안정화 시간 (ms)
   */
  function calculateDynamicStabilizationTime(hostname, avgChunkInterval, completionSignal, manifest) {
    // 🔧 v14.1: 완료 신호 신뢰도 임계값 상향 (80→95)
    // 높은 신뢰도에서만 최소 대기 적용
    if (completionSignal.isComplete && completionSignal.confidence >= 95) {
      return Math.max(1500, avgChunkInterval * 2);
    }

    // 기본값 설정 (Base calculation)
    let baseline = Math.max(3000, avgChunkInterval * 4);
    let multiplier = 1.0;

    // 🎯 Use Manifest Configuration if available (Priority)
    if (manifest && manifest.completion) {
      const { minWaitMs, adaptiveMultiplier } = manifest.completion;

      // Calculate based on manifest parameters
      // waitTime = minWaitMs + (averageChunk * multiplier)
      const manifestWaitTime = (minWaitMs || 2000) + (avgChunkInterval * (adaptiveMultiplier || 1.0));

      console.log(`[Dynamic Stabilization] Using manifest config: minWait=${minWaitMs}, mult=${adaptiveMultiplier} -> ${manifestWaitTime.toFixed(0)}fs`);

      // Ensure safety bounds
      return Math.min(Math.max(manifestWaitTime, 2000), 90000);
    }

    // Fallback: Hardcoded Host Heuristics (Legacy)
    if (hostname.includes('claude.ai')) {
      multiplier = 1.0; // Claude: 비교적 빠름
    } else if (hostname.includes('chatgpt.com')) {
      multiplier = 1.5; // 🔧 1.0→1.5 ChatGPT: 표준
    } else if (hostname.includes('grok.com') || hostname.includes('x.com')) {
      multiplier = 2.0; // 🆕 Grok: 긴 응답
    } else if (hostname.includes('chat.deepseek.com')) {
      multiplier = 2.0; // 🆕 DeepSeek: R1 모드 대비
    }

    const dynamicTime = Math.min(baseline * multiplier, 90000); // 🔧 최대 60→90초
    console.log(`[Dynamic Stabilization v14.1] ${hostname}: baseline = ${baseline} ms, multiplier = ${multiplier}, result = ${dynamicTime} ms`);

    return dynamicTime;
  }

  // ============================================================================
  // UI STATE SNAPSHOT SYSTEM (v11.0) - 모델별 분기 처리
  // 각 AI 모델 회사마다 다른 UI 구조에 맞춘 개별 감지 로직
  // ============================================================================

  function manifestToUIConfig(manifest) {
    if (!manifest || !manifest.selectors) return null;
    const selectors = manifest.selectors;

    const stopButton = selectorListFromManifest(selectors.stop_button);
    const loadingIndicators = selectorListFromManifest(selectors.loading_indicator);
    const inputSelector = selectorListFromManifest(selectors.input_field).join(', ');
    const submitButton = selectorListFromManifest(selectors.submit_button).join(', ');
    const disabledDetection = selectors.input_field?.disabled_detection;
    const inferredType = (selectors.input_field?.type || '').toLowerCase();

    const inputDisabledCheck = (input) => {
      if (!input) return true;

      if (disabledDetection) {
        try {
          if (input.matches(disabledDetection)) return true;
          if (typeof input.closest === 'function' && input.closest(disabledDetection)) return true;
        } catch (e) { /* ignore invalid selectors */ }
      }

      if (inferredType === 'contenteditable' || input.isContentEditable || input.getAttribute('contenteditable') !== null) {
        const attr = (input.getAttribute('contenteditable') || '').toLowerCase();
        if (attr === 'false') return true;
      }

      return input.disabled || input.getAttribute('aria-disabled') === 'true';
    };

    return {
      hosts: [parseHostnameSafe(manifest.url) || ''],
      modelId: manifest.id || parseHostnameSafe(manifest.url) || 'manifest-model',
      stopButton,
      inputSelector,
      inputDisabledCheck,
      loadingIndicators,
      submitButton
    };
  }

  /**
   * 🎯 모델별 UI 상태 감지 설정
   * 각 회사의 실제 DOM 구조에 맞춘 개별 감지 전략
   */
  const MODEL_UI_CONFIGS = {
    // ========== OpenAI (ChatGPT) ==========
    chatgpt: {
      hosts: ['chatgpt.com', 'chat.openai.com'],
      stopButton: [
        'button[aria-label="Stop generating"]',
        'button[data-testid="stop-button"]',
        'button[aria-label="중지"]'
      ],
      inputSelector: '#prompt-textarea, textarea[data-id="root"]',
      inputDisabledCheck: (input) => input.disabled || input.getAttribute('disabled') !== null,
      // 🔧 v15.2: streaming-animation 클래스를 최우선으로 체크
      loadingIndicators: ['.streaming-animation', '[data-testid="stop-button"]', '[class*="streaming-animation"]', '.result-streaming'],
      submitButton: 'button[data-testid="send-button"], button[data-testid="composer-send-button"], button[aria-label="Send prompt"]'
    },

    // ========== Anthropic (Claude) ==========
    claude: {
      hosts: ['claude.ai'],
      stopButton: [
        'button[aria-label="Stop generating"]',
        'button[aria-label="Stop Response"]',
        'button[aria-label="중지"]'
      ],
      inputSelector: 'div[contenteditable="true"].ProseMirror, div[contenteditable="true"]',
      inputDisabledCheck: (input) => input.getAttribute('contenteditable') === 'false',
      loadingIndicators: ['[class*="is-generating"]', '[class*="streaming"]'],
      submitButton: 'button[aria-label*="Send"], button[type="submit"]'
    },

    // ========== Google (Gemini) ==========
    gemini: {
      hosts: ['gemini.google.com', 'aistudio.google.com'],
      stopButton: [
        '.stop-button',
        'button[aria-label="Stop"]',
        'button[aria-label="중지"]'
      ],
      inputSelector: 'rich-textarea, textarea',
      inputDisabledCheck: (input) => input.disabled || input.getAttribute('aria-disabled') === 'true',
      loadingIndicators: ['.loading-indicator', '[aria-busy="true"]'],
      submitButton: 'button[aria-label="Send message"], button.send-button'
    },

    // ========== xAI (Grok) ==========
    grok: {
      hosts: ['grok.com', 'x.ai'],
      stopButton: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="stop"]',  // 소문자도 체크
        'button[aria-label*="중지"]',
        '[data-testid="stop-button"]',
        '[data-testid="stopButton"]',
        'button[class*="stop"]',
        'button[class*="Stop"]',
        // Grok은 SVG 아이콘 기반일 수 있음
        'button:has(svg[class*="stop"])',
        'button:has(svg[data-testid*="stop"])'
      ],
      inputSelector: 'div.tiptap.ProseMirror[contenteditable="true"], textarea, div[contenteditable="true"]',
      inputDisabledCheck: (input) => {
        // Grok: ProseMirror contenteditable 상태 체크
        if (input.isContentEditable !== undefined) {
          return !input.isContentEditable || input.getAttribute('contenteditable') === 'false';
        }
        // Textarea: placeholder가 바뀌면 비활성화 상태
        const placeholder = input.getAttribute('placeholder') || '';
        const isDisabled = input.disabled ||
          input.getAttribute('contenteditable') === 'false' ||
          placeholder.toLowerCase().includes('wait') ||
          placeholder.toLowerCase().includes('generating');
        return isDisabled;
      },
      loadingIndicators: [
        '.sonner-spinner:not([data-visible="false"])',
        '[data-testid="loading"]',
        '[class*="LoadingDots"]',
        '.animate-pulse',
        '[class*="loading"]',
        '[class*="generating"]',
        '[class*="typing"]',
        // Grok 특유의 "생각 중" 애니메이션
        '[class*="thinking"]',
        '.cursor-blink',
        '.text-cursor'
      ],
      submitButton: 'button[aria-label="제출"], button[aria-label="Submit"], button[data-testid="send-button"], button[type="submit"]'
    },

    // ========== DeepSeek ==========
    deepseek: {
      hosts: ['chat.deepseek.com'],
      stopButton: [
        'div[role="button"]:has(svg[class*="stop"])',
        'button[aria-label*="Stop"]',
        'button[aria-label*="중지"]'
      ],
      inputSelector: 'textarea',
      inputDisabledCheck: (input) => input.disabled,
      loadingIndicators: ['[class*="loading"]', '[class*="generating"]'],
      submitButton: 'button[type="submit"], div[role="button"]:has(svg[class*="send"])'
    },

    // ========== Alibaba (Qwen) ==========
    qwen: {
      hosts: ['chat.qwen.ai', 'qwen.ai'],
      stopButton: [], // Qwen은 텍스트로 감지
      stopButtonTextMatch: ['stop', '중지', '정지', '停止'],
      inputSelector: 'textarea',
      inputDisabledCheck: (input) => input.disabled,
      loadingIndicators: ['[class*="loading"]', '[class*="generating"]', '[class*="thinking"]'],
      submitButton: 'button[type="submit"]',
      // Qwen 전용: 복사 버튼이 아직 없으면 생성 중
      customCheck: () => {
        const responseContainers = document.querySelectorAll('.response-meesage-container');
        if (responseContainers.length > 0) {
          const lastContainer = responseContainers[responseContainers.length - 1];
          return !lastContainer.querySelector('.copy-response-button');
        }
        return false;
      }
    },

    // ========== LMArena ==========
    lmarena: {
      hosts: ['lmarena.ai', 'chat.lmsys.org'],
      stopButton: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="stop"]',
        'button:has(svg[class*="lucide-square"])',
        '[data-testid*="stop"]',
        'button:has(svg[data-icon="stop"])'
      ],
      inputSelector: 'textarea[placeholder*="Enter your message"], textarea[aria-label*="message"], div[contenteditable="true"][role="textbox"], textarea.chat-input, textarea',
      inputDisabledCheck: (input) =>
        input.disabled ||
        input.getAttribute('contenteditable') === 'false' ||
        input.getAttribute('aria-disabled') === 'true',
      loadingIndicators: ['[data-testid*="loading"]', '[aria-busy="true"]', '[class*="loading"]', '[class*="generating"]', '.animate-spin'],
      submitButton: 'button[type="submit"][aria-label*="Send"], button:has(svg[class*="send"]), button[aria-label*="Send"], button.primary'
    },

    // ========== OpenRouter (🔧 v14.8 새 HTML 분석 기반) ==========
    openrouter: {
      hosts: ['openrouter.ai'],
      stopButton: [
        // OpenRouter는 aria-label 없이 동일 버튼이 Send↔Stop 전환
        // 생성 중에는 버튼이 활성화(disabled 없음)되어 있음
        '[data-testid="playground-composer"] button.bg-primary:not([disabled]):not(.opacity-40)'
      ],
      inputSelector: '[data-testid="playground-composer"] textarea',
      inputDisabledCheck: (input) => input.disabled || input.readOnly,
      loadingIndicators: ['[class*="loading"]', '.bprogress'],
      // 🔑 전송 버튼: bg-primary 클래스 + disabled 시 opacity-40
      submitButton: '[data-testid="playground-composer"] button.bg-primary'
    },

    // ========== Perplexity (iframe 내부용) ==========
    perplexity: {
      hosts: ['perplexity.ai'],
      stopButton: [
        'button[aria-label*="Stop"]',
        'button:has(svg[data-icon="pause"])'
      ],
      inputSelector: 'textarea',
      inputDisabledCheck: (input) => input.disabled,
      loadingIndicators: ['[class*="loading"]', '[class*="searching"]'],
      submitButton: 'button[aria-label*="Submit"]'
    },

    // ========== GitHub Copilot ==========
    copilot: {
      hosts: ['github.com/copilot', 'copilot.github.com'],
      stopButton: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Cancel"]',
        'button[data-testid="stop-button"]'
      ],
      inputSelector: 'textarea',
      inputDisabledCheck: (input) => input.disabled,
      loadingIndicators: ['[class*="loading"]'],
      submitButton: 'button[type="submit"]'
    }
  };

  /**
   * 현재 호스트에 맞는 모델 UI 설정 반환
   * @returns {Object|null} 모델 설정 또는 null (알 수 없는 모델)
   */
  function getModelUIConfig(manifest) {
    const manifestUI = manifestToUIConfig(manifest);
    if (manifestUI) return manifestUI;

    const hostname = window.location.hostname;
    const fullPath = hostname + window.location.pathname;

    for (const [modelId, config] of Object.entries(MODEL_UI_CONFIGS)) {
      if (config.hosts.some(h => fullPath.includes(h) || hostname.includes(h))) {
        return { modelId, ...config };
      }
    }
    return null;
  }

  /**
   * 🎯 모델별 UI 상태 스냅샷 캡처 (v11.0)
   * 각 모델의 실제 DOM 구조에 맞춘 정밀 캡처
   * @param {Object} config - getResponseConfig()에서 반환된 설정
   * @returns {Object} UI 상태 스냅샷
   */
  function captureUIStateSnapshot(config, manifest) {
    const modelConfig = getModelUIConfig(manifest);
    const hostname = window.location.hostname;

    const snapshot = {
      timestamp: Date.now(),
      modelId: modelConfig?.modelId || 'unknown',
      isGenerating: false,
      input: { found: false, enabled: false },
      submitButton: { found: false, enabled: false },
      stopButton: { found: false, visible: false },
      loadingIndicator: { found: false, visible: false }
    };

    // 모델 설정이 없으면 기본 범용 로직 사용
    if (!modelConfig) {
      console.log(`[UI Snapshot v11] ⚠️ Unknown model: ${hostname}, using fallback`);
      return captureUIStateSnapshotFallback(config, snapshot);
    }

    console.log(`[UI Snapshot v11] 📸 Capturing for: ${modelConfig.modelId} `);

    // 1. Stop 버튼 감지 (모델별 셀렉터)
    for (const sel of modelConfig.stopButton) {
      const btn = document.querySelector(sel) || queryShadow(document.body, sel);
      if (btn && isElementVisible(btn)) {
        snapshot.stopButton.found = true;
        snapshot.stopButton.visible = true;
        snapshot.isGenerating = true;
        console.log(`[UI Snapshot v11] 🔴 Stop button found: ${sel} `);
        break;
      }
    }

    // Qwen 전용: 텍스트 기반 Stop 버튼 감지
    if (modelConfig.stopButtonTextMatch && !snapshot.stopButton.visible) {
      const buttons = Array.from(document.querySelectorAll('button'));
      const stopBtn = buttons.find(btn => {
        const text = (btn.innerText || '').toLowerCase();
        return modelConfig.stopButtonTextMatch.some(t => text.includes(t.toLowerCase()));
      });
      if (stopBtn && isElementVisible(stopBtn)) {
        snapshot.stopButton.found = true;
        snapshot.stopButton.visible = true;
        snapshot.isGenerating = true;
        console.log(`[UI Snapshot v11] 🔴 Stop button found(text match)`);
      }
    }

    // Qwen 전용: 커스텀 체크 (복사 버튼 없으면 생성 중)
    if (modelConfig.customCheck && modelConfig.customCheck()) {
      snapshot.isGenerating = true;
      console.log(`[UI Snapshot v11] 🔴 Custom check: still generating`);
    }

    // 2. 로딩 인디케이터 감지
    if (modelConfig.loadingIndicators) {
      for (const sel of modelConfig.loadingIndicators) {
        const el = document.querySelector(sel) || queryShadow(document.body, sel);
        if (el && isElementVisible(el)) {
          snapshot.loadingIndicator.found = true;
          snapshot.loadingIndicator.visible = true;
          snapshot.isGenerating = true;
          console.log(`[UI Snapshot v11] ⏳ Loading indicator found: ${sel} `);
          break;
        }
      }
    }

    // 3. 입력창 상태 감지
    if (modelConfig.inputSelector) {
      const inputSelectors = modelConfig.inputSelector.split(',').map(s => s.trim());
      for (const sel of inputSelectors) {
        const input = document.querySelector(sel) || queryShadow(document.body, sel);
        if (input) {
          snapshot.input.found = true;
          const isDisabled = modelConfig.inputDisabledCheck
            ? modelConfig.inputDisabledCheck(input)
            : (input.disabled || input.getAttribute('contenteditable') === 'false');
          snapshot.input.enabled = !isDisabled;

          if (isDisabled) {
            snapshot.isGenerating = true;
            console.log(`[UI Snapshot v11] 🔒 Input disabled`);
          }
          break;
        }
      }
    }

    // 4. Submit 버튼 상태 감지
    if (modelConfig.submitButton) {
      const submitSelectors = modelConfig.submitButton.split(',').map(s => s.trim());
      for (const sel of submitSelectors) {
        const btn = document.querySelector(sel) || queryShadow(document.body, sel);
        if (btn && isElementVisible(btn)) {
          snapshot.submitButton.found = true;
          snapshot.submitButton.enabled = !btn.disabled && btn.getAttribute('aria-disabled') !== 'true';
          break;
        }
      }
    }

    // 5. Thinking 텍스트 감지 (추론 모델 공통)
    const thinkingTexts = ['Thinking...', 'Generating...', 'Reasoning...', '생성 중...', '생각 중...', '답변 생성 중', '搜索中'];
    const bodyText = document.body.innerText || '';
    const recentText = bodyText.slice(-1000);
    if (thinkingTexts.some(t => recentText.includes(t))) {
      snapshot.isGenerating = true;
      console.log(`[UI Snapshot v11] 💭 Thinking text detected`);
    }

    return snapshot;
  }

  /**
   * 알 수 없는 모델용 범용 스냅샷 캡처 (fallback)
   */
  function captureUIStateSnapshotFallback(config, snapshot) {
    // 범용 Stop 버튼 셀렉터
    const universalStopSelectors = [
      'button[aria-label*="Stop"]', 'button[aria-label*="stop"]',
      'button[aria-label*="Cancel"]', 'button[aria-label*="중지"]',
      '[data-testid="stop-button"]', '.stop-button'
    ];

    for (const sel of universalStopSelectors) {
      const btn = document.querySelector(sel) || queryShadow(document.body, sel);
      if (btn && isElementVisible(btn)) {
        snapshot.stopButton.found = true;
        snapshot.stopButton.visible = true;
        snapshot.isGenerating = true;
        break;
      }
    }

    // 범용 로딩 인디케이터
    const universalLoadingSelectors = [
      '[class*="loading"]', '[class*="generating"]', '[class*="thinking"]',
      '[aria-busy="true"]', '.animate-pulse', '.animate-spin'
    ];

    for (const sel of universalLoadingSelectors) {
      const el = document.querySelector(sel) || queryShadow(document.body, sel);
      if (el && isElementVisible(el)) {
        snapshot.loadingIndicator.found = true;
        snapshot.loadingIndicator.visible = true;
        snapshot.isGenerating = true;
        break;
      }
    }

    // 범용 입력창 감지
    const universalInputSelectors = ['textarea', 'div[contenteditable="true"]', '[role="textbox"]'];
    for (const sel of universalInputSelectors) {
      const input = document.querySelector(sel);
      if (input && isElementVisible(input)) {
        snapshot.input.found = true;
        const isDisabled = input.disabled ||
          input.getAttribute('contenteditable') === 'false' ||
          input.getAttribute('aria-disabled') === 'true';
        snapshot.input.enabled = !isDisabled;
        if (isDisabled) snapshot.isGenerating = true;
        break;
      }
    }

    return snapshot;
  }

  /**
   * 🎯 UI 상태가 "응답 가능 상태"로 복귀했는지 판단 (v11.0)
   * 모델별 특성을 고려한 복귀 판정
   * @param {Object} initialSnapshot - 프롬프트 전송 전 스냅샷
   * @param {Object} currentSnapshot - 현재 스냅샷
   * @returns {Object} { restored: boolean, reason: string, confidence: number }
   */
  function isUIStateRestored(initialSnapshot, currentSnapshot) {
    const result = { restored: false, reason: '', confidence: 0 };

    // 핵심 판정: isGenerating 플래그
    if (currentSnapshot.isGenerating) {
      // 어떤 요소가 생성 중인지 상세히 기록
      const reasons = [];
      if (currentSnapshot.stopButton.visible) reasons.push('Stop 버튼');
      if (currentSnapshot.loadingIndicator.visible) reasons.push('로딩 인디케이터');
      if (currentSnapshot.input.found && !currentSnapshot.input.enabled) reasons.push('입력창 비활성화');

      result.reason = `응답 생성 중: ${reasons.join(', ') || '기타 신호'} `;
      result.confidence = 0;
      return result;
    }

    // 생성 완료 판정
    let score = 0;
    const reasons = [];

    // Stop 버튼 없음 (+40)
    if (!currentSnapshot.stopButton.visible) {
      score += 40;
      reasons.push('Stop 버튼 없음');
    }

    // 로딩 인디케이터 없음 (+20)
    if (!currentSnapshot.loadingIndicator.visible) {
      score += 20;
      reasons.push('로딩 없음');
    }

    // 입력창 활성화 (+30)
    if (currentSnapshot.input.found && currentSnapshot.input.enabled) {
      score += 30;
      reasons.push('입력창 활성화');
    }

    // Submit 버튼 활성화 (+10)
    if (currentSnapshot.submitButton.found && currentSnapshot.submitButton.enabled) {
      score += 10;
      reasons.push('Submit 활성화');
    }

    result.confidence = score;

    // 60점 이상이면 복귀로 판정 (기준 완화)
    if (score >= 60) {
      result.restored = true;
      result.reason = `[${currentSnapshot.modelId}] ${reasons.join(' + ')} `;
    } else {
      result.reason = `점수 부족(${score} / 60): ${reasons.join(', ')} `;
    }

    return result;
  }

  // ============================================================================
  // END OF ADAPTIVE RESPONSE MONITOR SYSTEM
  // ============================================================================

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'MODEL_DOCK_START_MONITORING') {
      startResponseMonitoring(event.data.requestId).catch((err) => {
        console.error('[ModelDock] Response monitor failed', err);
      });
    }
  });

  async function startResponseMonitoring(requestId) {
    console.log('[ModelDock] Starting response monitoring for', requestId);
    const manifest = await getManifestForHost(window.location.hostname);
    // ============================================================
    // 🧪 Phase 2 실험: MonitorFactory 병렬 테스트
    // ============================================================
    const testNewMonitor = async () => {
      try {
        const monitor = await MonitorFactory.createMonitor(window.location.hostname, requestId);
        if (monitor) {
          console.log('[Phase 2 Test] Running new monitor...');
          const result = await monitor.run();
          console.log('[Phase 2 Test] Monitor result:', result);
        }
      } catch (error) {
        console.error('[Phase 2 Test] Monitor error:', error);
      }
    };

    // 기존 시스템과 병렬로 실행 (테스트)
    testNewMonitor();

    const config = await getResponseConfig(manifest);
    const hostname = window.location.hostname;

    // 🎯 UI State Snapshot System (v10.0)
    // 프롬프트 전송 전 UI 상태 캡처 - "응답 가능 상태로 복귀" 감지용
    const initialUISnapshot = captureUIStateSnapshot(config, manifest);
    console.log('[ModelDock] 📸 Initial UI Snapshot captured:', {
      input: initialUISnapshot.input.enabled ? '✅ enabled' : '❌ disabled',
      submit: initialUISnapshot.submitButton.enabled ? '✅ enabled' : '❌ disabled',
      stop: initialUISnapshot.stopButton.visible ? '🔴 visible' : '⚪ hidden',
      loading: initialUISnapshot.loadingIndicator.visible ? '⏳ loading' : '✅ idle'
    });

    // 🧠 ARMS (B안): Functional Approach
    let chunkIntervals = [];
    let lastChunkTime = Date.now();
    console.log(`[ModelDock] 🎯 Using UI State Snapshot + ARMS for ${hostname}`);

    // 🎯 v14.0: 동적 완료 감지 시스템 사용 (하드코딩 제거)
    // [DEPRECATED] const STABILIZATION_TIME = config.stabilizationTime || 15000;
    // stabilizationTime은 더 이상 사용하지 않음 → calculateDynamicStabilizationTime() 사용

    // === getResponseText 함수를 먼저 정의 (호이스팅 문제 해결) ===
    const getResponseText = () => {
      // 🔧 [Architecture] Custom Parser Strategy (World Class Refactoring)
      if (config.customParser) {
        try {
          const customText = config.customParser();
          if (customText && customText.length > 0) {
            console.log(`[ModelDock] 🎯 Custom Parser Success: ${customText.length} chars`);
            return customText;
          }
        } catch (e) {
          console.warn(`[ModelDock] Custom parser failed: `, e);
        }
      }

      // 🔧 CRITICAL FIX: 셀렉터 테스트 로그 추가
      let selectorsTried = 0;
      let elementsFound = 0;

      for (const selector of config.responseSelectors) {
        selectorsTried++;

        // Try normal query
        let elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          // Try Shadow DOM
          elements = queryShadowAll(document.body, selector);
        }

        if (elements.length > 0) {
          elementsFound = elements.length;

          // 🔧 CRITICAL FIX: Iterate backwards to find the last valid assistant message
          // Previously only checked the absolute last element
          for (let i = elements.length - 1; i >= 0; i--) {
            const currentElement = elements[i];

            if (config.excludeUserMessage) {
              const elementClasses = (currentElement.className || '').toLowerCase();
              const elementDataRole = (currentElement.getAttribute('data-role') || '').toLowerCase();
              const elementDataAuthor = (currentElement.getAttribute('data-message-author-role') || '').toLowerCase();
              const elementDataTestId = (currentElement.getAttribute('data-testid') || '').toLowerCase();

              // 1. 요소 자체에 user 마커가 있으면 스킵
              if (elementClasses.includes('user') || elementClasses.includes('human') ||
                elementDataRole === 'user' || elementDataAuthor === 'user' ||
                elementDataTestId.includes('user-message') || elementDataTestId.includes('human-message')) {
                continue;
              }

              // 2. 조상 요소를 재귀적으로 확인 (최대 10단계)
              let ancestor = currentElement.parentElement;
              let hasUserAncestor = false;
              let hasAssistantAncestor = false;

              for (let j = 0; j < 10 && ancestor && ancestor !== document.body; j++) {
                const ancestorClasses = (ancestor.className || '').toLowerCase();
                const ancestorDataRole = (ancestor.getAttribute('data-role') || '').toLowerCase();
                const ancestorDataAuthor = (ancestor.getAttribute('data-message-author-role') || '').toLowerCase();
                const ancestorDataTestId = (ancestor.getAttribute('data-testid') || '').toLowerCase();

                if (ancestorClasses.includes('user-message') || ancestorClasses.includes('human-message') ||
                  ancestorDataRole === 'user' || ancestorDataAuthor === 'user' ||
                  ancestorDataTestId.includes('user-message')) {
                  hasUserAncestor = true;
                  break;
                }

                if (ancestorClasses.includes('assistant') || ancestorClasses.includes('bot') ||
                  ancestorDataRole === 'assistant' || ancestorDataAuthor === 'assistant' ||
                  ancestorDataTestId.includes('assistant') || ancestorDataTestId.includes('bot-message')) {
                  hasAssistantAncestor = true;
                }

                ancestor = ancestor.parentElement;
              }

              if (hasUserAncestor) continue;

              // 🔧 Strict Assistant Check
              if (config.strictAssistantCheck) {
                const isAssistant = hasAssistantAncestor ||
                  selector.includes('assistant') ||
                  selector.includes('bot') ||
                  selector.includes('response');
                if (!isAssistant) continue;
              }
            }

            // Enhanced text extraction using ParserUtils for cleaner text
            let text = ParserUtils.cleanText(currentElement);

            // Fallback to naive extraction if cleanText fails
            if (!text || text.trim().length === 0) {
              text = currentElement.innerText || currentElement.textContent || '';
            }
            if (!text || text.trim().length === 0) {
              text = extractAllTextNodes(currentElement);
            }

            // Must have some content to be valid
            if (text.trim().length > 0) {
              return text.trim();
            }
          }
        }
      }

      return '';
    };

    // Recursive text extraction from all text nodes (ultimate fallback)
    const extractAllTextNodes = (element) => {
      let text = '';
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
      let node;
      while (node = walker.nextNode()) {
        text += node.textContent;
      }
      return text;
    };

    // 🔧 v14.0: Baseline 캡쳐 - getResponseText 정의 후 호출
    const baselineText = getResponseText() || '';
    console.log(`[ModelDock] 📊 Baseline captured: ${baselineText.length} chars`);

    let lastText = baselineText;
    let lastChangeTime = Date.now();
    let monitorStartTime = Date.now();
    let isComplete = false;
    let hasReceivedNewResponse = false;
    let newResponseStartTime = 0;
    let heartbeatInterval;
    let stableIdleCount = 0;

    // 🔧 v14.0 CRITICAL FIX: "모델 생성 시작" 감지 플래그
    let modelStartedGenerating = false;
    let generatingStartTime = 0;
    const MIN_GENERATION_DURATION = 5000; // 최소 5초 (3초→5초 증가)

    // === HYBRID MONITORING SYSTEM ===
    // 1. MutationObserver: Immediate text change detection (real-time)
    // 2. heartbeatInterval: Periodic checks + UI State Snapshot (every 2s)
    // 3. Safety timeout: Prevent infinite wait (max 3 minutes)
    // Note: checkIsRunning() 함수 제거됨 - UI State Snapshot 시스템(v10.0)으로 대체

    const observer = new MutationObserver(() => {
      if (isComplete) return;

      const currentText = getResponseText();

      // 🔧 CRITICAL FIX: DOM 변화가 있으면 lastChunkTime 갱신 (Custom Parser 빈 값 대응)
      const now = Date.now();
      const hadDOMChange = true; // MutationObserver가 호출됨 = DOM 변화 있음

      if (currentText && currentText !== lastText) {
        // 🔧 CRITICAL FIX: Baseline 대비 실질적 증가 확인
        // 이전 대화의 응답과 구분하기 위해 최소 증가분 체크
        const textIncrease = currentText.length - baselineText.length;

        if (textIncrease > 10 && !hasReceivedNewResponse) {
          // 🔧 "새로운" 응답 시작 감지!
          hasReceivedNewResponse = true;
          newResponseStartTime = now;
          console.log(`[ModelDock] 🆕 NEW RESPONSE DETECTED! Increase: ${textIncrease} chars`);
        }

        lastText = currentText;
        lastChangeTime = Date.now();

        // 🧠 ARMS: Track chunk activity
        const interval = now - lastChunkTime;
        lastChunkTime = now;
        if (interval < 10000 && interval > 10) {
          chunkIntervals.push(interval);
          if (chunkIntervals.length > 10) chunkIntervals.shift();
        }

        // 새 응답이 있을 때만 청크 전송
        if (hasReceivedNewResponse) {
          window.parent.postMessage({
            type: 'MODEL_DOCK_RESPONSE_CHUNK',
            payload: { requestId, text: currentText, host: window.location.host }
          }, '*');
        }
      } else if (hadDOMChange && hasReceivedNewResponse) {
        // 🔧 NEW: 텍스트는 변화 없지만 DOM이 변화 → 여전히 생성 중
        // Custom Parser가 중간에 빈 값을 반환하는 경우 대응
        const interval = now - lastChunkTime;
        if (interval > 2000) { // 2초 이상 지났으면 갱신 (너무 자주 갱신 방지)
          console.log(`[ModelDock] DOM changed but text unchanged(${interval}ms) - keeping alive`);
          lastChunkTime = now; // 활동 시간 갱신
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    // Periodic check + heartbeat (every 2s)
    heartbeatInterval = setInterval(() => {
      if (isComplete) { clearInterval(heartbeatInterval); return; }

      const currentText = getResponseText();
      const now = Date.now();

      // Update if MutationObserver missed anything
      if (currentText && currentText !== lastText) {
        // 🔧 CRITICAL FIX: Baseline 대비 새 응답 감지
        const textIncrease = currentText.length - baselineText.length;

        if (textIncrease > 10 && !hasReceivedNewResponse) {
          hasReceivedNewResponse = true;
          newResponseStartTime = now;
          console.log(`[ModelDock] 🆕 NEW RESPONSE DETECTED(heartbeat)! Increase: ${textIncrease} chars`);
        }

        lastText = currentText;
        lastChangeTime = now;

        // 🧠 ARMS: Track chunk activity
        const interval = now - lastChunkTime;
        lastChunkTime = now;
        if (interval < 10000 && interval > 10) {
          chunkIntervals.push(interval);
          if (chunkIntervals.length > 10) chunkIntervals.shift();
        }

        // 새 응답이 있을 때만 청크 전송
        if (hasReceivedNewResponse) {
          window.parent.postMessage({
            type: 'MODEL_DOCK_RESPONSE_CHUNK',
            payload: { requestId, text: currentText, host: window.location.host }
          }, '*');
        }
      }

      // === 🎯 UI State Snapshot 기반 완료 감지 (v14.0) ===
      // 핵심 변경: 동적 완료 신호 시스템 통합

      const currentUISnapshot = captureUIStateSnapshot(config, manifest);
      const uiStateResult = isUIStateRestored(initialUISnapshot, currentUISnapshot);
      const currentNewResponseLength = lastText.length > baselineText.length
        ? lastText.length - baselineText.length
        : 0;

      // 🔧 v15.6 CRITICAL: ChatGPT streaming-animation 직접 체크 (최우선)
      // heartbeat에서 streaming-animation이 없으면 즉시 완료 처리
      const streamingAnimationEl = document.querySelector('.streaming-animation');
      const isStreamingNow = streamingAnimationEl && isElementVisible(streamingAnimationEl);

      // 디버깅 로그 추가
      if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
        console.log(`[UI State v15.6] ChatGPT Check:`, {
          hasReceivedNewResponse,
          currentNewResponseLength,
          streamingEl: !!streamingAnimationEl,
          isStreamingNow,
          elapsed: `${((now - monitorStartTime) / 1000).toFixed(1)}s`
        });
      }

      if ((hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) &&
        hasReceivedNewResponse && currentNewResponseLength > 50 && !isStreamingNow) {
        console.log(`[UI State v15.6] 🎯 ChatGPT STREAMING STOPPED! Immediate completion`, {
          responseLength: currentNewResponseLength,
          hasStreaming: !!streamingAnimationEl,
          isVisible: isStreamingNow
        });
        completionReason = `CHATGPT_STREAMING_STOPPED(text=${currentNewResponseLength})`;
        finish();
        return;
      }

      // 🔧 v15.6: hasReceivedNewResponse가 false인 경우에도 텍스트가 있으면 완료 처리
      // ChatGPT에서 getResponseText()가 baseline과 동일하게 시작해서 hasReceivedNewResponse가 false일 수 있음
      if ((hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) &&
        !hasReceivedNewResponse && lastText && lastText.length > 100 && !isStreamingNow) {
        console.log(`[UI State v15.6] 🎯 ChatGPT STREAMING STOPPED (baseline fallback)!`, {
          lastTextLength: lastText.length,
          baseline: baselineText.length
        });
        hasReceivedNewResponse = true;
        completionReason = `CHATGPT_STREAMING_STOPPED_FALLBACK(text=${lastText.length})`;
        finish();
        return;
      }

      // 🔧 v15.7 CRITICAL: Grok animate-gaussian 직접 체크 (최우선)
      // heartbeat에서 animate-gaussian이 없으면 즉시 완료 처리
      if (hostname.includes('grok.com') || hostname.includes('x.ai')) {
        const grokAnimateGaussian = document.querySelectorAll('.animate-gaussian');
        const hasGrokStreaming = grokAnimateGaussian.length > 0;

        console.log(`[UI State v15.7] Grok Check:`, {
          hasReceivedNewResponse,
          currentNewResponseLength,
          animateGaussianCount: grokAnimateGaussian.length,
          hasGrokStreaming,
          elapsed: `${((now - monitorStartTime) / 1000).toFixed(1)}s`
        });

        if (hasReceivedNewResponse && currentNewResponseLength > 50 && !hasGrokStreaming) {
          console.log(`[UI State v15.7] 🎯 Grok STREAMING STOPPED! Immediate completion`, {
            responseLength: currentNewResponseLength,
            animateGaussianCount: 0
          });
          completionReason = `GROK_STREAMING_STOPPED(text=${currentNewResponseLength})`;
          finish();
          return;
        }
      }

      // 🔧 v15.7 -> v15.8 CRITICAL: Gemini 체크 강화
      // heartbeat에서 aria-busy가 false/없고 bard-avatar.thinking도 없으면 완료
      if (hostname.includes('gemini.google.com')) {
        const geminiMessageContents = document.querySelectorAll('message-content');
        const lastGeminiContent = geminiMessageContents.length > 0 ? geminiMessageContents[geminiMessageContents.length - 1] : null;
        const geminiAriaBusy = lastGeminiContent?.getAttribute('aria-busy');
        const isGeminiStreaming = geminiAriaBusy === 'true';

        // 🔧 v15.8: bard-avatar.thinking 클래스 체크 추가
        const bardAvatarThinking = document.querySelector('.bard-avatar.thinking');
        const isGeminiThinking = bardAvatarThinking !== null;

        console.log(`[UI State v15.8] Gemini Check:`, {
          hasReceivedNewResponse,
          currentNewResponseLength,
          ariaBusy: geminiAriaBusy,
          isGeminiStreaming,
          isGeminiThinking,
          elapsed: `${((now - monitorStartTime) / 1000).toFixed(1)}s`
        });

        // aria-busy=true 또는 bard-avatar.thinking이 있으면 아직 진행 중
        if (isGeminiStreaming || isGeminiThinking) {
          // 아직 진행 중, 완료 처리하지 않음
        } else if (hasReceivedNewResponse && currentNewResponseLength > 50) {
          console.log(`[UI State v15.8] 🎯 Gemini STREAMING STOPPED! Immediate completion`, {
            responseLength: currentNewResponseLength,
            ariaBusy: geminiAriaBusy,
            isGeminiThinking
          });
          completionReason = `GEMINI_STREAMING_STOPPED(text=${currentNewResponseLength})`;
          finish();
          return;
        }
      }

      // 🔧 v15.7 CRITICAL: Claude data-is-streaming 직접 체크 (최우선)
      // heartbeat에서 data-is-streaming이 false/없으면 즉시 완료 처리
      if (hostname.includes('claude.ai')) {
        const claudeStreamingNodes = document.querySelectorAll('[data-is-streaming]');
        const lastClaudeStreamingNode = claudeStreamingNodes.length > 0 ? claudeStreamingNodes[claudeStreamingNodes.length - 1] : null;
        const isClaudeStreaming = lastClaudeStreamingNode?.getAttribute('data-is-streaming') === 'true';
        const claudeStopBtn = document.querySelector('button[aria-label="Stop generating"], button[aria-label*="Stop"], button[aria-label*="중지"]');
        const hasClaudeStop = claudeStopBtn && isElementVisible(claudeStopBtn);

        console.log(`[UI State v15.7] Claude Check:`, {
          hasReceivedNewResponse,
          currentNewResponseLength,
          dataIsStreaming: lastClaudeStreamingNode?.getAttribute('data-is-streaming'),
          hasStopButton: hasClaudeStop,
          elapsed: `${((now - monitorStartTime) / 1000).toFixed(1)}s`
        });

        if (hasReceivedNewResponse && currentNewResponseLength > 50 && !isClaudeStreaming && !hasClaudeStop) {
          console.log(`[UI State v15.7] 🎯 Claude STREAMING STOPPED! Immediate completion`, {
            responseLength: currentNewResponseLength,
            dataIsStreaming: 'false'
          });
          completionReason = `CLAUDE_STREAMING_STOPPED(text=${currentNewResponseLength})`;
          finish();
          return;
        }
      }

      // 🔧 v15.7 CRITICAL: DeepSeek Stop 버튼 직접 체크 (최우선)
      // heartbeat에서 Stop 버튼이 없고 액션 버튼이 있으면 즉시 완료 처리
      if (hostname.includes('chat.deepseek.com')) {
        // Stop 버튼 아이콘이 정사각형(정지)인지 체크
        const deepseekStopSquare = document.querySelector('._7436101.ds-icon-button svg path[d^="M2 4.88"]')?.closest('._7436101.ds-icon-button');
        const hasDeepSeekStop = deepseekStopSquare && isElementVisible(deepseekStopSquare);

        // 마지막 메시지에서 액션 버튼 확인
        const deepseekMessages = Array.from(document.querySelectorAll('._4f9bf79, .ds-message'));
        let deepseekLastMsg = null;
        for (let i = deepseekMessages.length - 1; i >= 0; i--) {
          if (deepseekMessages[i].querySelector('.ds-markdown')) {
            deepseekLastMsg = deepseekMessages[i];
            break;
          }
        }
        const deepseekActionBtns = deepseekLastMsg?.querySelectorAll('.ds-icon-button[role="button"]') || [];
        const hasDeepSeekActions = deepseekActionBtns.length > 0;

        console.log(`[UI State v15.7] DeepSeek Check:`, {
          hasReceivedNewResponse,
          currentNewResponseLength,
          hasStopButton: hasDeepSeekStop,
          hasActionButtons: hasDeepSeekActions,
          actionCount: deepseekActionBtns.length,
          elapsed: `${((now - monitorStartTime) / 1000).toFixed(1)}s`
        });

        if (hasReceivedNewResponse && currentNewResponseLength > 50 && !hasDeepSeekStop && hasDeepSeekActions) {
          console.log(`[UI State v15.7] 🎯 DeepSeek STREAMING STOPPED! Immediate completion`, {
            responseLength: currentNewResponseLength,
            hasStop: false,
            actionCount: deepseekActionBtns.length
          });
          completionReason = `DEEPSEEK_STREAMING_STOPPED(text=${currentNewResponseLength})`;
          finish();
          return;
        }
      }

      // 🔧 v15.7 CRITICAL: LMArena Stop 버튼 직접 체크 (최우선)
      if (hostname.includes('lmarena.ai')) {
        const lmarenaStopSelectors = [
          'button[aria-label*="Stop"]',
          'button[aria-label*="중지"]',
          'button[data-testid*="stop"]'
        ];
        const lmarenaStopBtn = lmarenaStopSelectors.map(s => document.querySelector(s)).find(el => el && isElementVisible(el));
        const hasLmarenaStop = !!lmarenaStopBtn;

        console.log(`[UI State v15.7] LMArena Check:`, {
          hasReceivedNewResponse,
          currentNewResponseLength,
          hasStopButton: hasLmarenaStop,
          elapsed: `${((now - monitorStartTime) / 1000).toFixed(1)}s`
        });

        if (hasReceivedNewResponse && currentNewResponseLength > 50 && !hasLmarenaStop) {
          console.log(`[UI State v15.7] 🎯 LMArena STREAMING STOPPED! Immediate completion`, {
            responseLength: currentNewResponseLength
          });
          completionReason = `LMARENA_STREAMING_STOPPED(text=${currentNewResponseLength})`;
          finish();
          return;
        }
      }

      // 🔧 v14.2: 모델 생성 시작 감지를 먼저 수행 (동적 완료 신호 전에)
      // Stop 버튼, 로딩 인디케이터, 또는 입력창 비활성화 = 생성 중
      if (currentUISnapshot.isGenerating && !modelStartedGenerating) {
        modelStartedGenerating = true;
        generatingStartTime = now;
        console.log(`[UI State v14.2] 🚀 MODEL STARTED GENERATING!`, {
          stopButton: currentUISnapshot.stopButton.visible,
          loadingIndicator: currentUISnapshot.loadingIndicator.visible,
          inputDisabled: currentUISnapshot.input.found && !currentUISnapshot.input.enabled
        });
      }

      // 🎯 v14.2: 동적 완료 신호 감지 (생성 시작 여부 + 응답 길이 전달)
      const avgChunkInterval = chunkIntervals.length > 0
        ? chunkIntervals.reduce((a, b) => a + b, 0) / chunkIntervals.length
        : 3000;
      const dynamicCompletionSignal = detectDynamicCompletionSignal(
        hostname,
        modelStartedGenerating,
        currentNewResponseLength
      );

      // 동적 신호가 높은 신뢰도로 완료를 감지하면 빠르게 처리
      if (dynamicCompletionSignal.isComplete && dynamicCompletionSignal.confidence >= 80) {
        console.log(`[Dynamic Completion v14.2] 🎯 High confidence signal: ${dynamicCompletionSignal.signal} `);
      }

      // 상태 로그 (v14.2)
      console.log(`[UI State v14.2] 🔍 Snapshot Check: `, {
        modelStarted: modelStartedGenerating,
        isGenerating: currentUISnapshot.isGenerating,
        dynamicSignal: dynamicCompletionSignal.signal,
        restored: uiStateResult.restored,
        hasNewResponse: hasReceivedNewResponse,
        newResponseLen: currentNewResponseLength,
        elapsed: `${((now - monitorStartTime) / 1000).toFixed(1)} s`
      });

      // === 완료 조건 (v14.0 강화) ===
      // 1. 🆕 모델이 생성을 "시작"했어야 함 (Stop 버튼이 한번이라도 보임)
      // 2. UI가 "응답 가능 상태"로 복귀 (isUIStateRestored)
      // 3. 새 응답이 감지됨
      // 4. 최소 텍스트 길이 충족
      // 5. 최소 생성 시간 경과

      // 🔧 v15.0 CRITICAL FIX: 최소 응답 길이 대폭 증가
      // 기존: 1 → 변경: 50 (최소 50자는 있어야 완료 판정)
      // 이유: 응답이 1자만 있어도 완료로 판정되어 조기 종료되는 문제 해결
      const minRequiredLength = 50;
      const hasMinimumResponse = currentNewResponseLength >= minRequiredLength;
      const generationDuration = modelStartedGenerating ? (now - generatingStartTime) : 0;
      const hasMinGenerationTime = generationDuration >= MIN_GENERATION_DURATION;

      // 🔧 v14.0 CRITICAL: 모델이 아직 생성 시작 안 함
      if (!modelStartedGenerating) {
        const waitTime = now - monitorStartTime;

        // 🔧 v14.0: 텍스트가 있으면 즉시 modelStarted로 간주
        // Grok 등 일부 모델은 Stop 버튼이 감지 안 됨
        if (hasReceivedNewResponse && currentNewResponseLength > 0) {
          console.log(`[UI State v14] 🔶 Text - based start detection: ${currentNewResponseLength} chars found`);
          modelStartedGenerating = true;
          generatingStartTime = newResponseStartTime || monitorStartTime;
        }
        // 15초 후에도 UI 신호 없으면 텍스트 기반으로 전환
        else if (waitTime > 15000 && hasReceivedNewResponse && hasMinimumResponse) {
          console.warn('[UI State v14] 🔶 Fallback after 15s: Using text-based detection');
          modelStartedGenerating = true;
          generatingStartTime = monitorStartTime;
        }

        // 모델이 시작 안 했으면 완료 불가
        if (!modelStartedGenerating) {
          if (waitTime > 30000) {
            console.warn(`[UI State v14] ⚠️ Still waiting for model to start(${(waitTime / 1000).toFixed(0)}s)`);
          }
          return;
        }
      }

      // 🔧 v14.0: 동적 완료 감지 시스템 (하드코딩 제거)
      // 각 모델의 특성에 맞는 완료 조건을 동적으로 계산
      const timeSinceLastChange = now - lastChangeTime;

      // === 🎯 동적 안정화 시간 계산 ===
      // 동적 완료 신호 + 평균 청크 간격 기반
      // 동적 완료 신호 + 평균 청크 간격 기반 + Manifest Config
      const dynamicStabilizationTime = calculateDynamicStabilizationTime(
        hostname,
        avgChunkInterval,
        dynamicCompletionSignal,
        manifest
      );

      // 동적 임계값 설정 (짧은 응답 지원을 위해 완화)
      // 🔧 v15.0: 최소 응답 길이 증가 (1 → 30), 안정화 시간 강화
      let textStableThreshold = Math.max(2000, dynamicStabilizationTime * 0.6);
      let minResponseLength = 30;
      let finalStableThreshold = Math.max(3500, dynamicStabilizationTime);

      if (dynamicCompletionSignal.isComplete && dynamicCompletionSignal.confidence >= 95) {
        // 🔧 v15.5: ChatGPT streaming-animation 완료 시 즉시 처리
        if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
          textStableThreshold = 500; // ← 500ms로 대폭 단축
          minResponseLength = 50;
          finalStableThreshold = 1000; // ← 1초로 단축
          console.log(`[Dynamic v15.5] ChatGPT streaming stopped - FAST COMPLETION mode: ${textStableThreshold}ms`);
        } else {
          textStableThreshold = Math.max(1000, avgChunkInterval * 2);
          minResponseLength = 1;
          finalStableThreshold = Math.max(2000, avgChunkInterval * 3);
          console.log(`[Dynamic v14.x] Very high confidence(${dynamicCompletionSignal.confidence}%) - thresholds: ${textStableThreshold}ms, minLen: ${minResponseLength}`);
        }
      } else if (dynamicCompletionSignal.isComplete && dynamicCompletionSignal.confidence >= 80) {
        textStableThreshold = Math.max(1500, avgChunkInterval * 3);
        minResponseLength = 1;
        finalStableThreshold = Math.max(3000, avgChunkInterval * 4);
        console.log(`[Dynamic v14.x] High confidence(${dynamicCompletionSignal.confidence}%) - thresholds: ${textStableThreshold}ms, minLen: ${minResponseLength}`);
      } else if (dynamicCompletionSignal.confidence >= 50) {
        textStableThreshold = Math.max(2000, dynamicStabilizationTime * 0.8);
        finalStableThreshold = Math.max(3000, dynamicStabilizationTime);
        console.log(`[Dynamic v14.x] Medium confidence(${dynamicCompletionSignal.confidence}%) - thresholds: ${textStableThreshold}ms`);
      }

      // 🧩 Host-specific tightening: ChatGPT는 짧은 답변 조기 종료 방지
      if (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')) {
        minResponseLength = Math.max(minResponseLength, 50);
        textStableThreshold = Math.max(textStableThreshold, 2500);
        finalStableThreshold = Math.max(finalStableThreshold, 4000);
      }

      const textStable = timeSinceLastChange > textStableThreshold;
      const hasSubstantialResponse = currentNewResponseLength >= minResponseLength;

      // 🔧 v14.0: 텍스트 기반 완료는 별도 카운터 사용 (중복 방지)
      // UI 기반과 텍스트 기반을 독립적으로 처리
      if (textStable && hasSubstantialResponse && hasReceivedNewResponse && hasMinGenerationTime) {
        console.log(`[UI State v15.5] 📝 Text stable for ${(timeSinceLastChange / 1000).toFixed(1)}s with ${currentNewResponseLength} chars (threshold: ${textStableThreshold}ms)`);

        // UI가 idle이거나, finalStableThreshold 이상 텍스트가 안정화되었으면 완료
        if (uiStateResult.restored || timeSinceLastChange > finalStableThreshold) {
          stableIdleCount++;

          // 🔧 v15.5: ChatGPT streaming-animation 완료 시 즉시 처리 (1회 검증으로 단축)
          const requireVerifications = (dynamicCompletionSignal.confidence >= 95 &&
            (hostname.includes('chatgpt.com') || hostname.includes('chat.openai.com')))
            ? 1 : 3;

          if (stableIdleCount >= requireVerifications) {
            console.log(`[UI State v15.5] ✅ TEXT-BASED COMPLETION (${requireVerifications} verification${requireVerifications > 1 ? 's' : ''}):`, {
              model: hostname,
              textStableFor: `${(timeSinceLastChange / 1000).toFixed(1)}s`,
              responseLength: currentNewResponseLength,
              uiRestored: uiStateResult.restored,
              generationDuration: `${(generationDuration / 1000).toFixed(1)}s`,
              dynamicSignal: dynamicCompletionSignal.signal,
              confidence: dynamicCompletionSignal.confidence,
              thresholds: { textStable: textStableThreshold, minLength: minResponseLength, finalStable: finalStableThreshold }
            });
            completionReason = `TEXT_STABLE(${(timeSinceLastChange / 1000).toFixed(1)}s) + ${dynamicCompletionSignal.signal}`;
            finish();
            return;  // 🔧 CRITICAL: 여기서 반드시 return
          } else {
            console.log(`[UI State v15.5] Text-based verification ${stableIdleCount}/${requireVerifications} (confidence: ${dynamicCompletionSignal.confidence}%)`);
          }
        }
        return;  // 🔧 텍스트 기반 체크를 했으면 UI 기반 체크 스킵 (중복 방지)
      }

      // UI 상태가 아직 "응답 중"이면 대기
      if (!uiStateResult.restored) {
        stableIdleCount = 0;
        return;
      }

      // 새 응답이 아직 없으면 대기
      if (!hasReceivedNewResponse) {
        if (now - monitorStartTime > 45000) {
          console.warn('[UI State v14] ⚠️ No response detected after 45s');
        }
        return;
      }

      // 최소 응답 길이 체크
      if (!hasMinimumResponse) {
        console.log(`[UI State v14] Response too short: ${currentNewResponseLength}/${minResponseLength} chars`);
        return;
      }

      // 🔧 v14.0: 최소 생성 시간 체크
      if (!hasMinGenerationTime) {
        console.log(`[UI State v14] ⏳ Too fast: ${(generationDuration / 1000).toFixed(1)}s < ${MIN_GENERATION_DURATION / 1000}s minimum`);
        return;
      }

      // === 모든 조건 충족 → 완료 판정 ===
      stableIdleCount++;

      if (stableIdleCount >= 3) {
        console.log(`[UI State v14] ✅ UI-BASED COMPLETION:`, {
          reason: uiStateResult.reason,
          confidence: uiStateResult.confidence,
          responseLength: currentNewResponseLength,
          generationDuration: `${(generationDuration / 1000).toFixed(1)}s`,
          dynamicSignal: dynamicCompletionSignal.signal,
          verifications: stableIdleCount
        });
        completionReason = `UI_RESTORED(${uiStateResult.reason}) + ${dynamicCompletionSignal.signal}`;
        finish();
        return;
      } else {
        console.log(`[UI State v15.0] Verification ${stableIdleCount}/3 - waiting for stable state...`);
      }

      // 안전 타임아웃 (3분)
      if (now - monitorStartTime > 180000) {
        console.warn('[UI State v14] ⏰ Timeout: 3 minutes elapsed, forcing completion');
        completionReason = 'TIMEOUT(180s)';
        finish();
        return;
      }

      // 하트비트 전송
      window.parent.postMessage({
        type: 'MODEL_DOCK_HEARTBEAT',
        payload: {
          requestId,
          status: uiStateResult.restored ? 'idle' : 'running',
          modelStarted: modelStartedGenerating,
          uiConfidence: uiStateResult.confidence,
          textLength: lastText.length,
          newResponseLength: currentNewResponseLength,
          host: window.location.host
        }
      }, '*');
    }, 2000);

    // 🔧 v14.1: 종료 이유 추적을 위한 변수
    let completionReason = 'unknown';

    function finish() {
      if (isComplete) return;
      isComplete = true;
      observer.disconnect();
      clearInterval(heartbeatInterval);

      // 🔧 CRITICAL FIX: 새 응답 텍스트만 추출하여 전송
      // baseline 이후에 추가된 텍스트만 실제 응답으로 간주
      const newResponseText = lastText.length > baselineText.length
        ? lastText.substring(baselineText.length).trim()
        : lastText;  // fallback: 전체 텍스트

      // 🔧 v14.1: 핵심 디버깅 로그 (응답 미리보기 + 종료 이유)
      const previewLength = 100;
      const textPreview = newResponseText.length > previewLength
        ? newResponseText.substring(0, previewLength) + '...'
        : newResponseText;
      const textEnding = newResponseText.length > 50
        ? '...' + newResponseText.substring(newResponseText.length - 50)
        : '';

      console.log(`%c[ModelDock] 🏁 RESPONSE COMPLETE`, 'color: green; font-weight: bold;');
      console.log(`  📍 Model: ${window.location.hostname}`);
      console.log(`  📐 Length: ${newResponseText.length} chars (baseline: ${baselineText.length})`);
      console.log(`  🔚 Reason: ${completionReason}`);
      console.log(`  📝 Preview: "${textPreview}"`);
      if (textEnding) console.log(`  📝 Ending: "${textEnding}"`);

      window.parent.postMessage({
        type: 'MODEL_DOCK_RESPONSE_COMPLETE',
        payload: {
          requestId,
          text: newResponseText,  // 🔧 새 응답만 전송
          fullText: lastText,     // 전체 텍스트 (디버깅용)
          baselineLength: baselineText.length,
          host: window.location.host,
          completionReason  // 🆕 종료 이유 추가
        }
      }, '*');
    }
  }

  console.log('[ModelDock] Content Script Loaded (v15.8 - Multi-Model Completion Detection Fix)');
})();
