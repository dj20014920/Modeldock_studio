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
    // === ChatGPT ===
    {
      hosts: ['chatgpt.com', 'chat.openai.com'],
      responseSelectors: [
        // 봇 응답만 선택 (data-message-author-role="assistant")
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
      stabilizationTime: 12000
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
        // AI Studio/Gemini 전용 (Shadow DOM 포함)
        'message-content:last-of-type',
        'model-response:last-of-type',
        'div[data-testid="model-response"]:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        // 구조 기반
        'div[data-role="user"]:last-of-type ~ div[data-role="assistant"]',
        'div[class*="user-message"]:last-of-type ~ div[class*="model-message"]',
        // 클래스 기반
        'div[class*="response-container"]:last-of-type',
        'div[class*="model-response"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        '.ms-text-chunk:last-of-type',
        // Markdown 영역 (부모 확인)
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
        // 🔧 Grok 전용: 더 정밀한 봇 응답 셀렉터
        // Strategy 1: 봇 메시지에만 붙는 data 속성 활용
        'div[data-testid="conversation-turn"]:has(div[data-message-author-role="assistant"]):last-of-type',
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-testid="grok-response"]:last-of-type',
        // Strategy 2: 구조 기반 - 사용자 메시지 이후의 다음 div
        'div[data-message-author-role="user"]:last-of-type ~ div',
        // Strategy 3: 클래스 기반
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="grok-message"]:last-of-type',
        // Fallback: prose 영역 중 봇 것만 (부모 요소 확인 강화)
        'div[data-message-author-role="assistant"] div.prose:last-of-type',
        'div[class*="assistant"] div.prose:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="stop"]',
        'button:has(svg[data-icon="stop"])',
        'div[role="button"][aria-label*="Stop"]',
        // Grok 전용 스톱 버튼
        'button[data-testid="stop-generation"]'
      ],
      inputSelector: 'div[role="textbox"][contenteditable="true"]',
      submitSelector: 'button[aria-label="Send"]',
      // 🔧 Grok 전용 설정: 사용자 메시지 제외 검증 활성화
      excludeUserMessage: true,
      stabilizationTime: 18000
    },
    // === Qwen ===
    // 🔧 핵심 수정: stabilizationTime 대폭 증가 (토큰 간격이 긴 경우 대응)
    {
      hosts: ['chat.qwen.ai'],
      responseSelectors: [
        'div[class*="ChatItem_content"]:last-of-type',
        'div[class*="markdown"]:last-of-type',
        'div.markdown-body:last-of-type',
        // 봇 응답 전용
        'div[class*="assistant"]:last-of-type',
        'div[class*="bot"]:last-of-type',
        // Qwen 특유의 응답 영역
        'div[class*="message-content"]:last-of-type'
      ],
      stopSelectors: [
        'button[class*="stop-btn"]',
        'button:has(svg[class*="stop"])',
        'button[aria-label*="Stop"]',
        // Qwen 전용: 생성 중지 버튼
        'div[class*="stop-generating"]'
      ],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      // 🔧 Qwen 전용: 토큰 간격이 매우 긴 경우를 위해 40초로 증가
      stabilizationTime: 40000,
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
    // 🔧 핵심 수정: 봇 응답만 선택
    {
      hosts: ['lmarena.ai'],
      responseSelectors: [
        // 🔧 LM Arena 전용: 더 정밀한 봇 응답 셀렉터
        // Strategy 1: data 속성 기반
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-testid="model-response"]:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        // Strategy 2: 구조 기반 - 사용자 메시지 이후의 다음 형제
        'div[data-message-author-role="user"]:last-of-type ~ div[data-message-author-role="assistant"]',
        'div[data-role="user"]:last-of-type ~ div[data-role="assistant"]',
        // Strategy 3: 클래스 기반
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="bot-message"]:last-of-type',
        'div[class*="model-response"]:last-of-type',
        // Fallback: prose/markdown 영역 (부모 확인 강화)
        'div[data-message-author-role="assistant"] div.prose:last-of-type',
        'div[data-role="assistant"] div[class*="content"]:last-of-type',
        'div[class*="assistant"] div[class*="response-content"]:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Cancel"]',
        'button[data-testid="stop-button"]'
      ],
      inputSelector: 'textarea, #chat-input',
      submitSelector: 'button.send-button, button[id="send-message-button"]',
      // 🔧 사용자 메시지 제외 검증 활성화
      excludeUserMessage: true,
      stabilizationTime: 20000
    },
    // === Kimi ===
    {
      hosts: ['kimi.moonshot.cn'],
      responseSelectors: [
        'div[class*="markdown"]:last-of-type',
        'div[class*="message"]:last-of-type',
        'div[class*="assistant"]:last-of-type'
      ],
      stopSelectors: [
        'button[class*="stop"]',
        'div[class*="stop"]'
      ],
      inputSelector: 'div[contenteditable="true"], textarea',
      submitSelector: 'button[class*="sendButton"], div[class*="sendButton"]',
      stabilizationTime: 18000
    },
    // === OpenRouter ===
    // 🔧 수정: 더 정밀한 셀렉터
    {
      hosts: ['openrouter.ai'],
      responseSelectors: [
        // OpenRouter 전용 (data 속성 우선)
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        'div[data-role="assistant"]:last-of-type',
        // 구조 기반
        'div[data-message-author-role="user"]:last-of-type ~ div',
        // 클래스 기반
        'div[class*="assistant-response"]:last-of-type',
        'div[class*="model-response"]:last-of-type',
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
      inputSelector: 'textarea, input[type="text"]',
      submitSelector: 'button[aria-label="Send"], button[type="submit"]',
      excludeUserMessage: true,
      stabilizationTime: 20000
    },
    // === Genspark / Vooster ===
    {
      hosts: ['genspark.ai', 'app.vooster.ai'],
      responseSelectors: [
        'div.prose:last-of-type',
        'div[class*="markdown"]:last-of-type',
        'div[class*="assistant"]:last-of-type'
      ],
      stopSelectors: [
        'button[aria-label*="Stop"]',
        'button[aria-label*="Cancel"]'
      ],
      inputSelector: 'textarea',
      submitSelector: 'button[type="submit"]',
      stabilizationTime: 18000
    },
    // === Codex (OpenAI) ===
    // 🔧 수정: 더 정밀한 셀렉터
    {
      hosts: ['chatgpt.com/codex', 'codex.openai.com'],
      responseSelectors: [
        // Codex 전용 (data 속성 우선)
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="codex-output"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        // 구조 기반
        'div[data-message-author-role="user"]:last-of-type ~ div',
        // 클래스 기반
        'div[class*="codex-response"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        'div[class*="code-output"]:last-of-type',
        // Prose/markdown 영역 (부모 확인)
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
    // 🔧 수정: 더 정밀한 셀렉터
    {
      hosts: ['claude.ai/code', 'code.anthropic.com'],
      responseSelectors: [
        // Claude Code 전용 (data 속성 우선)
        'div[data-testid="message-content"]:last-of-type',
        'div[data-message-author-role="assistant"]:last-of-type',
        'div[data-testid="assistant-message"]:last-of-type',
        // 구조 기반
        'div[data-message-author-role="user"]:last-of-type ~ div',
        // 클래스 기반
        'div.font-claude-message:last-of-type',
        'div[class*="code-response"]:last-of-type',
        'div[class*="assistant-message"]:last-of-type',
        // Prose 영역 (부모 확인)
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
    const specificConfig = RESPONSE_CONFIGS.find(c => c.hosts.some(h => host.includes(h)));

    if (specificConfig) {
      // Merge specific with universal for maximum robustness
      return {
        responseSelectors: [...specificConfig.responseSelectors, ...UNIVERSAL_RESPONSE_SELECTORS],
        stopSelectors: [...(specificConfig.stopSelectors || []), ...UNIVERSAL_STOP_SELECTORS],
        inputSelector: specificConfig.inputSelector,
        submitSelector: specificConfig.submitSelector,
        // 🔧 FIX: 모델별 안정화 시간 (기본값: 18초로 증가)
        stabilizationTime: specificConfig.stabilizationTime || 18000,
        // 사용자 메시지 제외 여부
        excludeUserMessage: specificConfig.excludeUserMessage || false
      };
    }

    // 🔧 FIX: 알 수 없는 모델에 대한 기본 설정도 18초로
    return {
      responseSelectors: UNIVERSAL_RESPONSE_SELECTORS,
      stopSelectors: UNIVERSAL_STOP_SELECTORS,
      stabilizationTime: 18000,
      excludeUserMessage: false
    };
  }

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'MODEL_DOCK_START_MONITORING') {
      startResponseMonitoring(event.data.requestId);
    }
  });

  function startResponseMonitoring(requestId) {
    console.log('[ModelDock] Starting response monitoring for', requestId);
    const config = getResponseConfig();
    let lastText = '';
    let lastChangeTime = Date.now();
    let monitorStartTime = Date.now();
    let isComplete = false;
    let hasReceivedFirstResponse = false;
    let heartbeatInterval;
    let fallbackCheckCount = 0;
    
    // 모델별 안정화 시간 적용 (기본값: 15초)
    const STABILIZATION_TIME = config.stabilizationTime || 15000;
    console.log(`[ModelDock] Using stabilization time: ${STABILIZATION_TIME}ms for ${window.location.hostname}`);

    const getResponseText = () => {
      for (const selector of config.responseSelectors) {
        // Try normal query
        let elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          // Try Shadow DOM
          elements = queryShadowAll(document.body, selector);
        }

        if (elements.length > 0) {
          const lastElement = elements[elements.length - 1];
          
          // 🔧 FIX: excludeUserMessage 옵션 - 사용자 메시지 제외 검증 강화
          if (config.excludeUserMessage) {
            // 요소 자체와 조상 요소에서 user/human 관련 표시 확인
            const parentClasses = (lastElement.className || '').toLowerCase();
            const parentDataRole = (lastElement.getAttribute('data-role') || '').toLowerCase();
            const parentDataAuthor = (lastElement.getAttribute('data-message-author-role') || '').toLowerCase();
            const parentDataTestId = (lastElement.getAttribute('data-testid') || '').toLowerCase();
            
            // 조상 요소 확인 (최대 5단계)
            let ancestor = lastElement.parentElement;
            let ancestorHasUserMarker = false;
            for (let i = 0; i < 5 && ancestor; i++) {
              const ancestorClasses = (ancestor.className || '').toLowerCase();
              const ancestorDataRole = (ancestor.getAttribute('data-role') || '').toLowerCase();
              const ancestorDataAuthor = (ancestor.getAttribute('data-message-author-role') || '').toLowerCase();
              
              if (ancestorClasses.includes('user') || ancestorClasses.includes('human') ||
                  ancestorDataRole === 'user' || ancestorDataAuthor === 'user' ||
                  ancestorClasses.includes('user-message') || ancestorClasses.includes('human-message')) {
                ancestorHasUserMarker = true;
                break;
              }
              ancestor = ancestor.parentElement;
            }
            
            if (parentClasses.includes('user') || parentClasses.includes('human') ||
                parentDataRole === 'user' || parentDataAuthor === 'user' ||
                parentDataTestId.includes('user-message') || ancestorHasUserMarker) {
              console.log('[ModelDock] Skipping user message element');
              continue; // 다음 셀렉터 시도
            }
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
          return text.trim();
        }
      }
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
        return input && (
          input.disabled ||
          input.getAttribute('disabled') !== null ||
          input.getAttribute('aria-disabled') === 'true' ||
          input.hasAttribute('readonly')
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
      if (currentText && currentText !== lastText) {
        lastText = currentText;
        lastChangeTime = Date.now();
        hasReceivedFirstResponse = true;

        window.parent.postMessage({
          type: 'MODEL_DOCK_RESPONSE_CHUNK',
          payload: { requestId, text: currentText, host: window.location.host }
        }, '*');
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

        window.parent.postMessage({
          type: 'MODEL_DOCK_RESPONSE_CHUNK',
          payload: { requestId, text: currentText, host: window.location.host }
        }, '*');
      }

      // Reset timer if actively running
      if (isRunning) {
        lastChangeTime = Date.now();
      }

      // TWO-PHASE COMPLETION DETECTION
      // Phase 1: Wait for text stability (모델별 STABILIZATION_TIME)
      // Phase 2: Verify UI signals (stop button + input state)

      // Must satisfy ALL conditions:
      // 1. Model has sent at least one response chunk
      // 2. Text stable for STABILIZATION_TIME (no new chunks)
      // 3. THEN verify: NOT running (no stop button AND input/submit enabled)
      // 4. Has actual content

      const isStable = timeSinceChange > STABILIZATION_TIME;

      if (hasReceivedFirstResponse &&
        isStable &&
        lastText.length > 0) {

        // 🔧 FIX: Triple-check UI state before completing (더 엄격한 검증)
        // 3회 연속 확인 (2초 간격)으로 false positive 방지
        if (!isRunning) {
          fallbackCheckCount++;

          // v0/Claude 같이 민감한 모델은 3회 연속 확인
          const requiredChecks = (window.location.hostname.includes('v0.') ||
                                  window.location.hostname.includes('claude.ai')) ? 3 : 2;

          if (fallbackCheckCount >= requiredChecks) {
            console.log(`[ModelDock] Completion verified (${STABILIZATION_TIME/1000}s stable + ${fallbackCheckCount}x UI ready):`, requestId);
            finish();
            return;
          } else {
            console.log(`[ModelDock] UI ready check ${fallbackCheckCount}/${requiredChecks}, waiting...`);
          }
        } else {
          // Still running despite stability - reset timer AND counter
          console.log(`[ModelDock] ${STABILIZATION_TIME/1000}s stable but still running, continuing...:`, requestId);
          lastChangeTime = Date.now();
          fallbackCheckCount = 0; // 실행 중이면 카운터 리셋
        }
      } else {
        // 안정화 전이거나 조건 불만족 - 카운터 리셋
        fallbackCheckCount = 0;
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
