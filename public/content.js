// ModelDock Content Script v8.0 (The "Reference Implementation" Port)
// Ported from text-injection-bridge.ts.back to solve v0, Codex, Claude, and Grok issues.

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

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type !== 'INJECT_INPUT') return;
    const { text, targets, submit = true, forceKey = false, modelId, skipInject = false } = request.payload;
    handleInjection(text, targets, { submit, forceKey, modelId, skipInject }).then((result) => {
      sendResponse(result);
    });
    return true;
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

    // AI Studio detection (Shadow DOM 깊이 탐색 필요)
    const isAIStudio = window.location.hostname.includes('aistudio.google.com');

    // 1. Find Input
    for (const target of targets) {
      const selectors = target.inputSelector.split(',').map(s => s.trim());
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
          break;
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
      return { status: 'no_target_match', host: window.location.host };
    }

    const { submitSelector, modelId: targetModelId, forceEnter, delayBeforeSubmit, submitKey } = matchedTarget;
    const effectiveModelId = modelId || targetModelId;

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

        if (submitSelector) {
          const selectors = submitSelector.split(',').map(s => s.trim());
          // Poll for button (강화된 폴링: 3초, 디버깅 로그 추가)
          const startTime = Date.now();
          const maxPollTime = 3000; // AI Studio 등을 위해 3초로 증가
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

              if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true' && isElementVisible(btn)) {
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
            console.warn(`[ModelDock] Button polling timeout after ${attemptCount} attempts (${maxPollTime}ms)`);
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

    // v0 / TipTap / ProseMirror / CodeMirror -> Paste Event
    const isTipTap = element.classList.contains('ProseMirror') || element.classList.contains('tiptap') ||
      element.classList.contains('cm-content') || element.classList.contains('monaco-editor') ||
      modelId === 'v0' || modelId === 'replit' || modelId === 'codex';

    if (isTipTap) {
      console.log('[ModelDock] TipTap/Code editor detected, using paste');
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
        console.warn('[ModelDock] Paste failed, falling back to execCommand');
      }
    }

    // ContentEditable (Claude, Gemini, etc)
    if (element.isContentEditable || modelId === 'claude' || modelId === 'gemini') {
      // Try execCommand first (best for undo history and internal state)
      const success = document.execCommand('insertText', false, text);
      if (!success) {
        element.textContent = text;
      }
      triggerInputEvents(element);
      return true;
    }

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

      // Grok specific: verify and retry with execCommand if needed
      if (modelId === 'grok') {
        if (element.value !== text) {
          document.execCommand('insertText', false, text);
        }
      }
      return true;
    }

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

  // --- Response Monitoring (Added for Brain Flow) ---
  // === RESPONSE_CONFIGS v3.0 - 정밀 셀렉터 (2025 대폭 업데이트) ===
  // 🔧 핵심 원칙: 봇 응답만 선택, 사용자 메시지 제외, 안정화 시간 증가
  const RESPONSE_CONFIGS = [
    // 🔧 PRIORITY: 경로 포함 설정을 최상단에 배치 (더 구체적인 매칭 우선)

    // === Codex (OpenAI) ===
    // 🚨 CRITICAL: chatgpt.com/codex는 경로까지 매칭되어야 함
    {
      hosts: ['chatgpt.com/codex', 'codex.openai.com'],
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

    // === ChatGPT (일반) - 2025 Enhanced v2 ===
    {
      hosts: ['chatgpt.com', 'chat.openai.com'],
      customParser: () => {
        console.log('[ChatGPT Parser v2] Starting...');

        // Strategy 1: data-message-author-role="assistant" 역추적
        const assistantMessages = Array.from(
          document.querySelectorAll('div[data-message-author-role="assistant"]')
        );
        console.log(`[ChatGPT Parser v2] Found ${assistantMessages.length} assistant messages`);

        if (assistantMessages.length > 0) {
          const lastAssistant = assistantMessages[assistantMessages.length - 1];

          // .markdown 컨테이너 우선 탐색
          const markdownContainer = lastAssistant.querySelector('.markdown') || lastAssistant;

          const clone = markdownContainer.cloneNode(true);

          // 🔧 CRITICAL: UI 요소 제거 (버튼, 툴바, SVG 등)
          const toRemove = clone.querySelectorAll(
            'button, ' +
            '[class*="button"], ' +
            '[class*="action"], ' +
            '[class*="toolbar"], ' +
            '[class*="control"], ' +
            '[class*="copy"], ' +
            '[data-state], ' +
            'svg, ' +
            '[aria-label*="Copy"], ' +
            '[aria-label="복사"], ' +
            '[aria-label*="Stop"], ' +
            '[aria-label*="중지"]'
          );
          toRemove.forEach(el => el.remove());

          const text = clone.innerText?.trim();
          if (text && text.length > 0) {
            console.log(`[ChatGPT Parser v2] Success (assistant): ${text.length} chars`);
            return text;
          }
        }

        // Strategy 2: conversation-turn 기반
        const conversationTurns = Array.from(
          document.querySelectorAll('div[data-testid*="conversation-turn"]')
        );

        for (let i = conversationTurns.length - 1; i >= 0; i--) {
          const turn = conversationTurns[i];

          // assistant role이 있는지 확인
          const hasAssistant = turn.querySelector('[data-message-author-role="assistant"]');
          if (hasAssistant) {
            const markdownEl = turn.querySelector('.markdown') || turn;
            const clone = markdownEl.cloneNode(true);

            const toRemove = clone.querySelectorAll(
              'button, [class*="button"], [class*="action"], ' +
              '[class*="toolbar"], [class*="control"], [class*="copy"], ' +
              '[data-state], svg, [aria-label*="Copy"], [aria-label="복사"]'
            );
            toRemove.forEach(el => el.remove());

            const text = clone.innerText?.trim();
            if (text && text.length > 0) {
              console.log(`[ChatGPT Parser v2] Success (conversation-turn): ${text.length} chars`);
              return text;
            }
          }
        }

        // Strategy 3: .markdown Fallback (역순)
        const markdowns = Array.from(document.querySelectorAll('.markdown'));
        for (let i = markdowns.length - 1; i >= 0; i--) {
          const md = markdowns[i];

          // 사용자 메시지 제외 (부모에 user role이 있으면 제외)
          const userParent = md.closest('[data-message-author-role="user"]');
          if (userParent) {
            console.log('[ChatGPT Parser v2] Skipping user message');
            continue;
          }

          const clone = md.cloneNode(true);

          const toRemove = clone.querySelectorAll(
            'button, [class*="button"], [class*="action"], ' +
            '[class*="toolbar"], [class*="control"], [class*="copy"], ' +
            '[data-state], svg, [aria-label*="Copy"], [aria-label="복사"]'
          );
          toRemove.forEach(el => el.remove());

          const text = clone.innerText?.trim();
          if (text && text.length > 20) {  // 최소 길이 체크
            console.log(`[ChatGPT Parser v2] Success (markdown): ${text.length} chars`);
            return text;
          }
        }

        console.log('[ChatGPT Parser v2] No response found');
        return '';
      },
      responseSelectors: [
        // Fallback selectors (Custom Parser 실패 시)
        'div[data-message-author-role="assistant"]:last-of-type .markdown',
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid*="conversation-turn"]:has([data-message-author-role="assistant"]):last-of-type .markdown'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[data-testid="stop-button"]',
        'button[aria-label*="중지"]'
      ],
      inputSelector: 'textarea[data-id="conversation-input"], textarea[data-testid="prompt-textarea"]',
      submitSelector: 'button[data-testid="send-button"]',
      stabilizationTime: 15000  // 12초 → 15초로 증가
    },
    // === Claude ===
    {
      hosts: ['claude.ai'],
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
    // 🔧 핵심 수정: 봇 응답만 선택, 프롬프트 파싱 오류 해결
    {
      hosts: ['grok.com', 'x.com'],
      responseSelectors: [
        // 🔧 Grok CRITICAL FIX: 더 엄격한 assistant 전용 셀렉터
        // ISSUE: 프롬프트 복사 문제 - user 메시지와 혼동
        // Priority 1: 가장 명확한 container + data 속성 조합
        'article[data-testid="tweet"]:has(div[data-message-author-role="assistant"]) div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="cellInnerDiv"]:has(div[data-message-author-role="assistant"]) div[data-message-author-role="assistant"]:last-of-type',
        // Priority 2: 단일 data 속성 (하지만 매우 구체적)
        'div[data-message-author-role="assistant"]:not([data-message-author-role="user"]):last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-testid="grok-response"]:last-of-type',
        // Priority 3: 클래스 기반 (assistant 명시)
        'div[class*="assistant-message"]:not([class*="user"]):last-of-type',
        'div[class*="grok-message"]:last-of-type',
        'div[class*="bot-message"]:last-of-type',
        // Priority 4: Nested prose (매우 구체적인 부모 확인)
        'div[data-message-author-role="assistant"]:not([data-message-author-role="user"]) div.prose:last-of-type',
        'div[class*="assistant"]:not([class*="user"]) div.prose:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="stop"]',
        'button:has(svg[data-icon="stop"])',
        'div[role="button"][aria-label*="Stop"]',
        'button[data-testid="stop-generation"]'
      ],
      inputSelector: 'div[role="textbox"][contenteditable="true"]',
      submitSelector: 'button[aria-label="Send"]',
      // 🔧 CRITICAL: Grok은 excludeUserMessage를 더 엄격하게 적용
      excludeUserMessage: true,
      strictAssistantCheck: true, // 🚨 Assistant 마커 필수 (프롬프트 복사 방지)
      stabilizationTime: 20000
    },
    // === Qwen ===
    // 🔧 핵심 수정: stabilizationTime 대폭 증가 (토큰 간격이 긴 경우 대응)
    {
      hosts: ['chat.qwen.ai'],
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
    // === Mistral ===
    // 🔧 수정: 더 정밀한 셀렉터
    {
      hosts: ['chat.mistral.ai'],
      responseSelectors: [
        // Mistral 전용 셀렉터 (data 속성 우선)
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        // 구조 기반
        'div[data-message-author-role="user"]:last-of-type ~ div[data-message-author-role="assistant"]',
        // 클래스 기반
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="bot-message"]:last-of-type',
        'div[class*="assistant-content"]:last-of-type',
        // Prose/markdown 영역 (부모 확인)
        'div[data-message-author-role="assistant"] div.prose:last-of-type',
        'div[class*="assistant"] div[class*="message-content"]:last-of-type',
        'div.prose:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="stop"]',
        'button:has(svg[class*="stop"])',
        'button[data-testid="stop-button"]'
      ],
      inputSelector: 'textarea[placeholder*="Message"], textarea',
      submitSelector: 'button[type="submit"], button[aria-label="Send"]',
      excludeUserMessage: true,
      stabilizationTime: 18000
    },
    // === DeepSeek ===
    {
      hosts: ['chat.deepseek.com'],
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
      stabilizationTime: 20000
    },
    // === Replit ===
    {
      hosts: ['replit.com'],
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
    // === LM Arena ===
    {
      hosts: ['lmarena.ai'],
      responseSelectors: [
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-testid="model-response"]:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="bot-message"]:last-of-type',
        'div[class*="model-response"]:last-of-type',
        'div[class*="ai-response"]:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button:has(svg[class*="stop"])'
      ],
      inputSelector: 'textarea', // LMArena often has multiple inputs, need care
      submitSelector: 'button.send-button',
      stabilizationTime: 15000,
      excludeUserMessage: true,
      strictAssistantCheck: true // 🚨 Assistant 마커 필수
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
    // === Claude (Custom Parser) - 2025 Enhanced v2 ===
    {
      hosts: ['claude.ai'],
      customParser: () => {
        console.log('[Claude Parser v2] Starting...');

        // 🔧 CRITICAL: UI 요소 제거 헬퍼 함수
        const removeUIElements = (clone) => {
          const toRemove = clone.querySelectorAll(
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
        };

        // Strategy 1: .font-claude-message 직접 탐색 - Enhanced v2
        const claudeMessages = Array.from(document.querySelectorAll('.font-claude-message'));
        console.log(`[Claude Parser v2] Found ${claudeMessages.length} claude messages`);

        if (claudeMessages.length > 0) {
          const lastMessage = claudeMessages[claudeMessages.length - 1];

          // 🔧 CRITICAL: Clone & Remove 패턴 적용
          const clone = lastMessage.cloneNode(true);
          removeUIElements(clone);

          const text = clone.innerText?.trim();
          if (text && text.length > 0) {
            console.log(`[Claude Parser v2] Success (.font-claude-message): ${text.length} chars`);
            return text;
          }
        }

        // Strategy 2: data-testid="message-content" - Enhanced v2
        const messageContents = Array.from(document.querySelectorAll('div[data-testid="message-content"]'));
        console.log(`[Claude Parser v2] Found ${messageContents.length} message-content divs`);

        if (messageContents.length > 0) {
          const lastContent = messageContents[messageContents.length - 1];

          // 🔧 CRITICAL: Clone & Remove 패턴 적용
          const clone = lastContent.cloneNode(true);
          removeUIElements(clone);

          const text = clone.innerText?.trim();
          if (text && text.length > 0) {
            console.log(`[Claude Parser v2] Success (message-content): ${text.length} chars`);
            return text;
          }
        }

        // Strategy 3: Copy 버튼 역추적 - Enhanced v2
        const copyBtns = Array.from(document.querySelectorAll('button[data-sentry-component="CopyButton"]'));
        console.log(`[Claude Parser v2] Found ${copyBtns.length} copy buttons`);

        if (copyBtns.length > 0) {
          const lastBtn = copyBtns[copyBtns.length - 1];

          // 부모 탐색 (최대 15단계)
          let parent = lastBtn.parentElement;
          for (let i = 0; i < 15 && parent; i++) {
            // .font-claude-message 또는 [data-testid="message-content"] 찾기
            const content = parent.querySelector('.font-claude-message') ||
              parent.querySelector('[data-testid="message-content"]');
            if (content) {
              // 🔧 CRITICAL: Clone & Remove 패턴 적용
              const clone = content.cloneNode(true);
              removeUIElements(clone);

              const text = clone.innerText?.trim();
              if (text && text.length > 0) {
                console.log(`[Claude Parser v2] Success (copy btn traverse): ${text.length} chars`);
                return text;
              }
            }

            // .group 클래스 확인
            if (parent.classList?.contains('group')) {
              const content = parent.querySelector('.font-claude-message');
              if (content) {
                const clone = content.cloneNode(true);
                removeUIElements(clone);

                const text = clone.innerText?.trim();
                if (text && text.length > 0) {
                  console.log(`[Claude Parser v2] Success (.group): ${text.length} chars`);
                  return text;
                }
              }
            }

            parent = parent.parentElement;
          }
        }

        // Strategy 4: prose 클래스 기반 - Enhanced v2
        const proseElements = Array.from(document.querySelectorAll('.prose'));
        console.log(`[Claude Parser v2] Found ${proseElements.length} prose elements`);

        for (let i = proseElements.length - 1; i >= 0; i--) {
          const prose = proseElements[i];

          // 🔧 CRITICAL: 강화된 사용자 메시지 필터링
          let isUserMessage = false;
          let parent = prose.parentElement;
          for (let j = 0; j < 8 && parent; j++) {  // 5 → 8로 증가
            const className = (parent.className || '').toLowerCase();
            const role = parent.getAttribute('data-message-author-role');

            if (className.includes('human') ||
              className.includes('user') ||
              role === 'user') {
              isUserMessage = true;
              console.log('[Claude Parser v2] Skipping user message');
              break;
            }
            parent = parent.parentElement;
          }

          if (!isUserMessage) {
            // 🔧 CRITICAL: Clone & Remove 패턴 적용
            const clone = prose.cloneNode(true);
            removeUIElements(clone);

            const text = clone.innerText?.trim();
            if (text && text.length > 20) {  // 최소 길이 체크
              console.log(`[Claude Parser v2] Success (prose): ${text.length} chars`);
              return text;
            }
          }
        }

        console.log('[Claude Parser v2] No response found');
        return '';
      },
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
    // === Grok (Strict Mode) ===
    {
      hosts: ['grok.com', 'x.com'],
      responseSelectors: [
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type'
      ],
      stopSelectors: ['button[aria-label*="Stop"]'],
      inputSelector: 'div[role="textbox"]',
      submitSelector: 'button[aria-label="Send"]',
      excludeUserMessage: true,
      strictAssistantCheck: true,
      stabilizationTime: 20000
    },
    // === Qwen (Custom Parser) - 2025 Enhanced v2 ===
    {
      hosts: ['chat.qwen.ai'],
      customParser: () => {
        // 🔧 2025 Enhanced v2: 사용자 제공 HTML 구조 기반 정밀 파싱
        // 실제 구조:
        // <div id="message-xxx" class="response-meesage-container svelte-1av26cy">
        //   <div class="response-button-list-item">
        //     <button class="copy-response-button ...">
        console.log('[Qwen Parser v2] Starting...');

        // Strategy 1: .copy-response-button 역추적 (가장 확실) - 강화됨
        const copyButtons = Array.from(document.querySelectorAll('.copy-response-button'));
        console.log(`[Qwen Parser v2] Found ${copyButtons.length} copy buttons`);

        if (copyButtons.length > 0) {
          // 마지막 복사 버튼 = 가장 최근 응답
          const lastCopyBtn = copyButtons[copyButtons.length - 1];

          // .response-meesage-container 찾기 (오타 포함된 실제 클래스명)
          const messageContainer =
            lastCopyBtn.closest('.response-meesage-container') ||
            lastCopyBtn.closest('.response-message-container') ||
            lastCopyBtn.closest('div[id^="message-"][class*="response"]') ||
            lastCopyBtn.closest('div[id^="message-"]');

          if (messageContainer) {
            // 사용자 메시지 제외 (강화된 체크)
            const classes = (messageContainer.className || '').toLowerCase();
            const id = (messageContainer.id || '').toLowerCase();

            if (classes.includes('user') || classes.includes('request') ||
              id.includes('user') || id.includes('request')) {
              console.log('[Qwen Parser v2] Skipping user message');
            } else {
              // 텍스트 추출 (버튼 영역 제외) - 강화된 제거 로직
              const clone = messageContainer.cloneNode(true);

              // 🔧 CRITICAL FIX: 더 포괄적인 버튼/UI 요소 제거
              const toRemove = clone.querySelectorAll(
                'button, ' +
                '.response-button-list-item, ' +
                '.copy-response-button, ' +
                '.message-footer-button-item, ' +
                '.response-message-control-item-visible, ' +
                '[class*="button"], ' +
                '[class*="action"], ' +
                '[class*="toolbar"], ' +
                '[class*="footer"], ' +
                '[class*="control"], ' +
                '[aria-label="복사"], ' +
                '[aria-label*="Copy"]'
              );
              toRemove.forEach(el => el.remove());

              // innerText 사용 (가시적 텍스트만)
              const text = clone.innerText?.trim();
              if (text && text.length > 0) {
                console.log(`[Qwen Parser v2] Success (container): ${text.length} chars`);
                return text;
              }
            }
          }
        }

        // Strategy 2: div[id^="message-"] 직접 탐색
        const messageDivs = Array.from(document.querySelectorAll('div[id^="message-"]'));
        console.log(`[Qwen Parser] Found ${messageDivs.length} message divs`);

        // 역순으로 응답 메시지 찾기
        for (let i = messageDivs.length - 1; i >= 0; i--) {
          const msgDiv = messageDivs[i];
          const classes = (msgDiv.className || '').toLowerCase();

          // 사용자 메시지 제외
          if (classes.includes('user') || classes.includes('request')) {
            continue;
          }

          // 응답 메시지 컨테이너 확인
          if (classes.includes('response') || msgDiv.querySelector('.copy-response-button')) {
            const clone = msgDiv.cloneNode(true);
            const buttons = clone.querySelectorAll('button, [class*="button"]');
            buttons.forEach(btn => btn.remove());

            const text = clone.innerText?.trim();
            if (text && text.length > 0) {
              console.log(`[Qwen Parser] Success (message div): ${text.length} chars`);
              return text;
            }
          }
        }

        // Strategy 3: Svelte 컴포넌트 클래스 기반 (svelte-xxx)
        const svelteMessages = Array.from(document.querySelectorAll('[class*="svelte-"][class*="message"], [class*="svelte-"][class*="response"]'));
        for (let i = svelteMessages.length - 1; i >= 0; i--) {
          const msg = svelteMessages[i];
          const classes = (msg.className || '').toLowerCase();

          if (!classes.includes('user')) {
            const clone = msg.cloneNode(true);
            const buttons = clone.querySelectorAll('button');
            buttons.forEach(btn => btn.remove());

            const text = clone.innerText?.trim();
            if (text && text.length > 50) {
              console.log(`[Qwen Parser] Success (svelte): ${text.length} chars`);
              return text;
            }
          }
        }

        console.log('[Qwen Parser] No response found');
        return '';
      },
      responseSelectors: [
        'div[id^="message-"].response-meesage-container:last-of-type',
        'div[class*="response-message"]:last-of-type',
        'div[class*="svelte-"]:last-of-type'
      ],
      stopSelectors: [
        'button[class*="stop"]',
        'div[class*="stop"]',
        '[class*="generating"]',
        '[class*="loading"]'
      ],
      inputSelector: 'textarea',
      submitSelector: 'button[class*="send"], button[type="submit"]',
      // 🔧 CRITICAL: Qwen은 토큰 생성 간격이 매우 길 수 있음 (60초)
      stabilizationTime: 60000
    },
    // === LMArena (Custom Parser) - 2025 Final Fix v7 (Deep Shadow Search) ===
    {
      hosts: ['lmarena.ai'],
      customParser: () => {
        console.log('[LMArena Parser v7] Starting Deep Shadow Search...');

        // 🔧 Helper: Shadow DOM까지 뚫고 들어가는 탐색기
        const deepQuerySelectorAll = (selector, root = document) => {
          const results = Array.from(root.querySelectorAll(selector));
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.shadowRoot) {
              results.push(...deepQuerySelectorAll(selector, node.shadowRoot));
            }
          }
          return results;
        };

        const cleanText = (node) => {
          if (!node) return '';
          const clone = node.cloneNode(true);
          const removable = clone.querySelectorAll('button, svg, textarea, input, [data-sentry-component="CopyButton"]');
          removable.forEach(el => el.remove());
          return (clone.innerText || clone.textContent || '').trim();
        };

        const isPromptText = (text) => {
          if (!text) return true;
          const patterns = ['페르소나:', '명령:', '[SLAVE:', '사용자가 제시한', '입력 데이터:', '출력 형식:'];
          const head = text.substring(0, 100);
          return patterns.some(p => head.includes(p));
        };

        // 1. Shadow DOM 포함 모든 .prose 요소 수집
        const allProses = deepQuerySelectorAll('.prose');
        console.log(`[LMArena Parser v7] Found ${allProses.length} .prose elements (including shadow)`);

        // 2. 뒤에서부터 탐색
        for (let i = allProses.length - 1; i >= 0; i--) {
          const prose = allProses[i];

          // 사용자 메시지 제외
          if (prose.closest('.bg-surface-secondary, [data-role="user"]')) continue;

          const text = cleanText(prose);

          // 3. 검증
          if (text.length > 30 && !isPromptText(text)) {
            console.log(`[LMArena Parser v7] Success: ${text.length} chars`);
            return text;
          }
        }

        console.log('[LMArena Parser v7] No valid text found');
        return '';
      },
      responseSelectors: [],
      stopSelectors: ['button[aria-label*="Stop"]'],
      inputSelector: 'textarea',
      submitSelector: 'button.send-button',
      stabilizationTime: 60000,
      excludeUserMessage: true
    },
    // === OpenRouter (Custom Parser) - 2025 Final Fix v7 (Deep Shadow Search) ===
    {
      hosts: ['openrouter.ai'],
      customParser: () => {
        console.log('[OpenRouter Parser v7] Starting Deep Shadow Search...');

        const deepQuerySelectorAll = (selector, root = document) => {
          const results = Array.from(root.querySelectorAll(selector));
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
          while (walker.nextNode()) {
            const node = walker.currentNode;
            if (node.shadowRoot) {
              results.push(...deepQuerySelectorAll(selector, node.shadowRoot));
            }
          }
          return results;
        };

        const cleanText = (node) => {
          if (!node) return '';
          const clone = node.cloneNode(true);
          const toRemove = clone.querySelectorAll('button, svg, textarea, [aria-label*="Copy"]');
          toRemove.forEach(el => el.remove());
          return (clone.innerText || clone.textContent || '').trim();
        };

        const isPromptText = (text) => {
          if (!text) return true;
          const patterns = ['페르소나:', '명령:', '[SLAVE:', '사용자가 제시한', '입력 데이터:', '출력 형식:'];
          const head = text.substring(0, 100);
          return patterns.some(p => head.includes(p));
        };

        // 1. Shadow DOM 포함 모든 텍스트 컨테이너 수집
        // OpenRouter는 div.rounded-tl-none, div.col-start-1 등을 사용
        const candidates = deepQuerySelectorAll('div.rounded-tl-none, div.col-start-1, div.prose, div.markdown');
        console.log(`[OpenRouter Parser v7] Found ${candidates.length} candidates (including shadow)`);

        for (let i = candidates.length - 1; i >= 0; i--) {
          const el = candidates[i];

          // 사용자 메시지 제외
          if (el.className.includes('rounded-tr-none') || el.closest('.rounded-tr-none, [data-role="user"]')) continue;

          let text = cleanText(el);
          if (!text) text = (el.innerText || el.textContent || '').trim();

          if (text.length > 30 && !isPromptText(text)) {
            console.log(`[OpenRouter Parser v7] Success: ${text.length} chars`);
            return text;
          }
        }

        // Fallback: Deep Text Scan (Shadow DOM 포함)
        // 모든 텍스트 노드를 훑어서 가장 긴 것 찾기
        const allTextNodes = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        while (walker.nextNode()) allTextNodes.push(walker.currentNode);

        // 텍스트 노드의 부모 요소들을 검사
        let bestText = '';
        for (let i = allTextNodes.length - 1; i >= 0; i--) {
          const node = allTextNodes[i];
          const text = node.nodeValue.trim();
          if (text.length > 50 && !isPromptText(text)) {
            // 부모가 사용자 메시지가 아닌지 확인
            const parent = node.parentElement;
            if (parent && !parent.closest('.rounded-tr-none, [data-role="user"]')) {
              if (text.length > bestText.length) bestText = text;
            }
          }
        }

        if (bestText) {
          console.log(`[OpenRouter Parser v7] Success (Deep Text Scan): ${bestText.length} chars`);
          return bestText;
        }

        console.log('[OpenRouter Parser v7] No valid text found');
        return '';
      },
      responseSelectors: [],
      stopSelectors: [
        'button[aria-label="Stop generating"]',
        'button[aria-label*="Stop"]'
      ],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      stabilizationTime: 60000,
      excludeUserMessage: true
    },
    // === Genspark / Vooster ===
    {
      hosts: ['genspark.ai', 'app.vooster.ai'],
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

  function getResponseConfig() {
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
   * @returns {number} threshold (ms)
   */
  function getModelAdaptiveThreshold(hostname, chunkIntervals) {
    // 평균 간격 계산
    const avgInterval = chunkIntervals.length > 0
      ? chunkIntervals.reduce((a, b) => a + b, 0) / chunkIntervals.length
      : 1000; // 초기값 1초

    // 기본: 평균 간격의 3배 + 2초 여유
    let baseThreshold = (avgInterval * 3) + 2000;

    // ====================================================================
    // Batch 1: Deep Implementation
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
  function checkModelUILocked(hostname, stopSelectors) {
    // Strategy 0: Thinking/Generating Text Check (Reasoning Models)
    // 화면에 'Thinking...' 같은 텍스트가 있으면 무조건 실행 중으로 간주
    const thinkingTexts = ['Thinking...', 'Generating...', 'Reasoning...', '생성 중...', '생각 중...', '답변 생성 중'];
    // 성능을 위해 body 텍스트의 마지막 1000자만 검사
    const bodyText = document.body.innerText || '';
    const recentText = bodyText.slice(-1000);
    if (thinkingTexts.some(t => recentText.includes(t))) {
      // console.log('[UI Lock] Thinking text detected');
      return true;
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
      // DeepSeek: role="button" 방식
      const stopBtn = document.querySelector('div[role="button"]:has(svg[class*="stop"])') ||
        document.querySelector('button[aria-label*="Stop"]');
      return stopBtn !== null;
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

      // Strategy 4: response-meesage-container가 아직 버튼 영역 없음 (생성 초기)
      const responseContainers = document.querySelectorAll('.response-meesage-container');
      if (responseContainers.length > 0) {
        const lastContainer = responseContainers[responseContainers.length - 1];
        const hasCopyButton = lastContainer.querySelector('.copy-response-button');
        if (!hasCopyButton) {
          // 복사 버튼이 아직 없음 = 아직 생성 중
          console.log('[Qwen UI Lock] Response generating (no copy button yet)');
          return true;
        }
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

      // 추가: textarea 비활성화 체크
      const textarea = document.querySelector('textarea');
      if (textarea && textarea.disabled) {
        console.log('[LMArena UI Lock] Textarea disabled');
        return true;
      }

      console.log('[LMArena UI Lock] No lock detected');
      return false;
    }

    if (hostname.includes('kimi.moonshot.cn')) {
      // Kimi: button[class*="stop"]
      return document.querySelector('button[class*="stop"]') !== null;
    }

    // ====================================================================
    // Batch 4: Quick Implementation (Explicit Branching)
    // ====================================================================

    if (hostname.includes('chat.mistral.ai')) {
      // Mistral: Stop 버튼 명확함
      const stopBtn = document.querySelector('button[aria-label*="Stop"]') ||
        document.querySelector('button[aria-label*="stop"]') ||
        document.querySelector('button[data-testid="stop-button"]');
      return stopBtn !== null;
    }

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
  // END OF ADAPTIVE RESPONSE MONITOR SYSTEM
  // ============================================================================

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'MODEL_DOCK_START_MONITORING') {
      startResponseMonitoring(event.data.requestId);
    }
  });

  function startResponseMonitoring(requestId) {
    console.log('[ModelDock] Starting response monitoring for', requestId);
    const config = getResponseConfig();
    const hostname = window.location.hostname;

    // 🧠 ARMS (B안): Functional Approach
    let chunkIntervals = [];
    let lastChunkTime = Date.now();
    console.log(`[ModelDock] 🎯 Using ARMS (Functional) for ${hostname}`);

    let lastText = '';
    let lastChangeTime = Date.now();
    let monitorStartTime = Date.now();
    let isComplete = false;
    let hasReceivedFirstResponse = false;
    let heartbeatInterval;
    let fallbackCheckCount = 0;

    // ⚠️ Legacy: 하드코딩된 안정화 시간 (참고용, 더 이상 사용 안 함)
    const STABILIZATION_TIME = config.stabilizationTime || 15000;
    console.log(`[ModelDock] Legacy stabilization time: ${STABILIZATION_TIME}ms (replaced by adaptive logic)`);

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
          console.warn(`[ModelDock] Custom parser failed:`, e);
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
          console.log(`[ModelDock] 🔍 Selector matched (${selectorsTried}/${config.responseSelectors.length}): "${selector}" → ${elementsFound} elements`);

          const lastElement = elements[elements.length - 1];

          // 🔧 CRITICAL FIX: excludeUserMessage 옵션 - 개선된 검증 로직
          if (config.excludeUserMessage) {
            // Strategy: assistant 마커가 명확히 있는지 확인 (긍정적 검증)
            // user 마커가 있으면 무조건 제외

            const elementClasses = (lastElement.className || '').toLowerCase();
            const elementDataRole = (lastElement.getAttribute('data-role') || '').toLowerCase();
            const elementDataAuthor = (lastElement.getAttribute('data-message-author-role') || '').toLowerCase();
            const elementDataTestId = (lastElement.getAttribute('data-testid') || '').toLowerCase();

            // 1. 요소 자체에 user 마커가 있으면 즉시 제외
            if (elementClasses.includes('user') || elementClasses.includes('human') ||
              elementDataRole === 'user' || elementDataAuthor === 'user' ||
              elementDataTestId.includes('user-message') || elementDataTestId.includes('human-message')) {
              console.log('[ModelDock] ❌ Skipping: Element has user marker');
              continue;
            }

            // 2. 조상 요소를 재귀적으로 확인 (최대 10단계)
            let ancestor = lastElement.parentElement;
            let hasUserAncestor = false;
            let hasAssistantAncestor = false;

            for (let i = 0; i < 10 && ancestor && ancestor !== document.body; i++) {
              const ancestorClasses = (ancestor.className || '').toLowerCase();
              const ancestorDataRole = (ancestor.getAttribute('data-role') || '').toLowerCase();
              const ancestorDataAuthor = (ancestor.getAttribute('data-message-author-role') || '').toLowerCase();
              const ancestorDataTestId = (ancestor.getAttribute('data-testid') || '').toLowerCase();

              // User 마커 체크
              if (ancestorClasses.includes('user-message') || ancestorClasses.includes('human-message') ||
                ancestorDataRole === 'user' || ancestorDataAuthor === 'user' ||
                ancestorDataTestId.includes('user-message')) {
                hasUserAncestor = true;
                break;
              }

              // Assistant 마커 체크
              if (ancestorClasses.includes('assistant') || ancestorClasses.includes('bot') ||
                ancestorDataRole === 'assistant' || ancestorDataAuthor === 'assistant' ||
                ancestorDataTestId.includes('assistant') || ancestorDataTestId.includes('bot-message')) {
                hasAssistantAncestor = true;
              }

              ancestor = ancestor.parentElement;
            }

            // 3. 최종 판정
            if (hasUserAncestor) {
              console.log('[ModelDock] ❌ Skipping: Ancestor has user marker');
              continue;
            }

            // 🔧 Strict Assistant Check (Grok, LMArena 등 프롬프트 복사 문제 해결용)
            if (config.strictAssistantCheck) {
              const isAssistant =
                hasAssistantAncestor ||
                selector.includes('assistant') ||
                selector.includes('bot') ||
                selector.includes('response'); // responseSelectors에 'response'가 포함된 경우도 인정

              if (!isAssistant) {
                console.log('[ModelDock] ❌ Skipping: No assistant marker found (Strict Mode)');
                continue;
              }
            }

            // 4. Assistant 마커가 명확히 있거나, selector가 이미 assistant를 지정한 경우만 통과
            const selectorHasAssistant = selector.includes('assistant') || selector.includes('bot');

            if (!hasAssistantAncestor && !selectorHasAssistant) {
              console.log('[ModelDock] ⚠️ Warning: No clear assistant marker, but allowing (selector-based)');
              // 셀렉터가 충분히 구체적이면 허용 (예: :last-of-type)
            }

            console.log(`[ModelDock] ✅ Passed excludeUserMessage check (hasAssistant: ${hasAssistantAncestor}, selectorBased: ${selectorHasAssistant})`);
          }


          // Enhanced text extraction with multiple fallbacks
          // Strategy 1: textContent (gets ALL text including hidden)
          let text = lastElement.textContent || '';

          // Strategy 2: If textContent failed, try innerText
          if (!text || text.trim().length === 0) {
            text = lastElement.innerText || '';
          }

          // Strategy 3: If both failed, recursively collect from all text nodes
          if (!text || text.trim().length === 0) {
            text = extractAllTextNodes(lastElement);
          }

          // Clean up excessive whitespace while preserving structure
          const trimmedText = text.trim();

          // 🔧 CRITICAL FIX: 응답 텍스트 추출 로그
          if (trimmedText.length > 0) {
            console.log(`[ModelDock] ✓ Response text extracted: ${trimmedText.length} chars (first 100): "${trimmedText.substring(0, 100)}..."`);
          } else {
            console.warn(`[ModelDock] ⚠️ Element found but text extraction failed for selector: "${selector}"`);
          }

          return trimmedText;
        }
      }

      // 🔧 CRITICAL FIX: 모든 셀렉터 실패 로그
      console.error(`[ModelDock] ❌ NO RESPONSE FOUND - Tried ${selectorsTried} selectors, none matched`);
      console.error(`[ModelDock] Host: ${window.location.hostname}`);
      console.error(`[ModelDock] Available selectors:`, config.responseSelectors.slice(0, 5));

      return '';
    };

    // Recursive text extraction from all text nodes (ultimate fallback)
    const extractAllTextNodes = (element) => {
      let text = '';
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while (node = walker.nextNode()) {
        text += node.textContent;
      }

      return text;
    };

    const checkIsRunning = () => {
      // Strategy 1: Check for visible stop button (most reliable)
      const hasStopButton = config.stopSelectors.some(sel => {
        const el = document.querySelector(sel);
        // 🔧 FIX: Shadow DOM도 탐색
        const shadowEl = !el ? queryShadow(document.body, sel) : null;
        const finalEl = el || shadowEl;
        return finalEl && isElementVisible(finalEl);
      });

      if (hasStopButton) return true;

      // Strategy 2: Check if input/submit is disabled (model still responding)
      // When model is generating, input is usually disabled
      const inputDisabled = config.inputSelector && (() => {
        const input = document.querySelector(config.inputSelector) || queryShadow(document.body, config.inputSelector);
        if (!input) return false;

        // 🔧 FIX: contenteditable 요소 처리 (Claude 등)
        if (input.getAttribute('contenteditable') === 'false') return true;

        return (
          input.disabled ||
          input.getAttribute('disabled') !== null ||
          input.getAttribute('aria-disabled') === 'true' ||
          input.hasAttribute('readonly') ||
          input.classList.contains('disabled')
        );
      })();

      const submitDisabled = config.submitSelector && (() => {
        const submit = document.querySelector(config.submitSelector) || queryShadow(document.body, config.submitSelector);
        return submit && (
          submit.disabled ||
          submit.getAttribute('disabled') !== null ||
          submit.getAttribute('aria-disabled') === 'true' ||
          submit.classList.contains('disabled')
        );
      })();

      if (inputDisabled || submitDisabled) return true;

      // Strategy 3: Check for loading indicators (추가 검증)
      const hasLoadingIndicator = [
        '[class*="loading"]',
        '[class*="generating"]',
        '[class*="thinking"]',
        '[class*="typing"]',
        '[aria-busy="true"]'
      ].some(sel => {
        const el = document.querySelector(sel) || queryShadow(document.body, sel);
        return el && isElementVisible(el);
      });

      if (hasLoadingIndicator) return true;

      return false;
    };

    // === HYBRID MONITORING SYSTEM ===
    // 1. MutationObserver: Immediate text change detection (real-time)
    // 2. heartbeatInterval: Periodic checks + heartbeat (every 2s)
    // 3. Safety timeout: Prevent infinite wait (max 3 minutes)

    const observer = new MutationObserver(() => {
      if (isComplete) return;

      const currentText = getResponseText();

      // 🔧 CRITICAL FIX: DOM 변화가 있으면 lastChunkTime 갱신 (Custom Parser 빈 값 대응)
      const now = Date.now();
      const hadDOMChange = true; // MutationObserver가 호출됨 = DOM 변화 있음

      if (currentText && currentText !== lastText) {
        lastText = currentText;
        lastChangeTime = Date.now();
        hasReceivedFirstResponse = true;

        // 🧠 ARMS: Track chunk activity
        const interval = now - lastChunkTime;
        lastChunkTime = now;
        if (interval < 10000 && interval > 10) {
          chunkIntervals.push(interval);
          if (chunkIntervals.length > 10) chunkIntervals.shift();
        }

        window.parent.postMessage({
          type: 'MODEL_DOCK_RESPONSE_CHUNK',
          payload: { requestId, text: currentText, host: window.location.host }
        }, '*');
      } else if (hadDOMChange && hasReceivedFirstResponse) {
        // 🔧 NEW: 텍스트는 변화 없지만 DOM이 변화 → 여전히 생성 중
        // Custom Parser가 중간에 빈 값을 반환하는 경우 대응
        const interval = now - lastChunkTime;
        if (interval > 2000) { // 2초 이상 지났으면 갱신 (너무 자주 갱신 방지)
          console.log(`[ModelDock] DOM changed but text unchanged (${interval}ms) - keeping alive`);
          lastChunkTime = now; // 활동 시간 갱신
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

    // Periodic check + heartbeat (every 2s)
    heartbeatInterval = setInterval(() => {
      if (isComplete) { clearInterval(heartbeatInterval); return; }

      const currentText = getResponseText();
      const isRunning = checkIsRunning();
      const timeSinceStart = Date.now() - monitorStartTime;
      const timeSinceChange = Date.now() - lastChangeTime;

      // Update if MutationObserver missed anything
      if (currentText && currentText !== lastText) {
        lastText = currentText;
        lastChangeTime = Date.now();
        hasReceivedFirstResponse = true;

        // 🧠 ARMS: Track chunk activity
        const now = Date.now();
        const interval = now - lastChunkTime;
        lastChunkTime = now;
        if (interval < 10000 && interval > 10) {
          chunkIntervals.push(interval);
          if (chunkIntervals.length > 10) chunkIntervals.shift();
        }

        window.parent.postMessage({
          type: 'MODEL_DOCK_RESPONSE_CHUNK',
          payload: { requestId, text: currentText, host: window.location.host }
        }, '*');
      }

      // 🧠 ARMS (B안): Adaptive Completion Detection
      // 함수형 if-else 분기 사용

      // 1. UI Lock Check
      const isUILockedRaw = checkModelUILocked(hostname, config.stopSelectors);

      // 2. Stream Lock Check
      const silence = Date.now() - lastChunkTime;
      const adaptiveThreshold = getModelAdaptiveThreshold(hostname, chunkIntervals);
      const isStreamLocked = silence < adaptiveThreshold;

      // 강제 언락: 응답을 받았고 침묵이 임계치보다 충분히 길면 UI Lock 오인식 해제
      const forceUnlock = hasReceivedFirstResponse && silence > adaptiveThreshold * 1.5;
      const isUILocked = forceUnlock ? false : isUILockedRaw;
      const effectiveStreamLocked = forceUnlock ? false : isStreamLocked;

      // 디버그 로그
      console.log(`[ARMS] ${isUILocked ? 'UI_ACTIVE' : effectiveStreamLocked ? 'STREAM_ACTIVE' : 'COMPLETE'} | Silence: ${(silence / 1000).toFixed(1)}s / Threshold: ${(adaptiveThreshold / 1000).toFixed(1)}s | ForceUnlock: ${forceUnlock}`);

      // 🔧 CRITICAL FIX: 최소 안전 대기 시간
      // 문제: 프롬프트 전송 직후 즉시 완료 판정되는 경우 방지
      const timeSinceMonitorStart = Date.now() - monitorStartTime;
      if (timeSinceMonitorStart < 2000) {
        // 모니터링 시작 후 최소 2초 대기 (응답 생성 시작 시간 확보)
        console.log(`[ARMS] Safety: Too early (${(timeSinceMonitorStart / 1000).toFixed(1)}s < 2s)`);
        return;
      }

      // Minimum requirements
      if (!hasReceivedFirstResponse || lastText.length === 0) {
        return; // 아직 응답 없음
      }

      // Wait if UI or Stream is locked
      if (isUILocked || effectiveStreamLocked) {
        fallbackCheckCount = 0; // Reset counter
        return;
      }

      // Complete! -> Triple-check for safety
      fallbackCheckCount++;

      const requiredChecks = 2; // 2회 연속 확인

      if (fallbackCheckCount >= requiredChecks) {
        console.log(`[ModelDock] ✅ Completion detected by ARMS (Functional) (${fallbackCheckCount}x verified):`, requestId);
        finish();
        return;
      } else {
        console.log(`[ModelDock] Verification ${fallbackCheckCount}/${requiredChecks}...`);
      }

      // 3. Error timeout (no response after 3 minutes)
      // Prevents infinite wait on errors
      if (timeSinceStart > 180000) {
        console.warn('[ModelDock] Timeout: No response after 3 minutes:', requestId);
        finish(); // Complete with whatever we have (might be empty)
        return;
      }

      // Send heartbeat
      window.parent.postMessage({
        type: 'MODEL_DOCK_HEARTBEAT',
        payload: {
          requestId,
          status: isRunning ? 'running' : 'idle',
          textLength: lastText.length,
          host: window.location.host
        }
      }, '*');
    }, 2000);

    function finish() {
      if (isComplete) return;
      isComplete = true;
      observer.disconnect();
      clearInterval(heartbeatInterval);
      console.log('[ModelDock] Response monitoring complete');
      window.parent.postMessage({
        type: 'MODEL_DOCK_RESPONSE_COMPLETE',
        payload: { requestId, text: lastText, host: window.location.host }
      }, '*');
    }
  }

  console.log('[ModelDock] Content Script Loaded (v8.0 - Reference Port)');
})();
