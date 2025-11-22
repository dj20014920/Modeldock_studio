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
    const { text, targets, requestId } = data.payload || {};
    if (!text || !targets) return;

    const result = await handleInjection(text, targets);
    try {
      window.parent.postMessage({
        type: 'MODEL_DOCK_INJECT_RESPONSE',
        payload: {
          requestId,
          success: result.status === 'success',
          status: result.status,
          host: window.location.host
        }
      }, '*');
    } catch (err) {
      console.warn('[ModelDock] Response postMessage failed', err);
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type !== 'INJECT_INPUT') return;
    const { text, targets } = request.payload;
    handleInjection(text, targets).then((result) => {
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

  async function handleInjection(text, targets) {
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

    const { submitSelector, modelId, forceEnter, delayBeforeSubmit, submitKey } = matchedTarget;

    try {
      // 2. Inject Text
      const injectionSuccess = await robustInject(foundInput, text, modelId);

      if (injectionSuccess) {
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
        if ((forceEnter || !submitted) && !submitted) {
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

  console.log('[ModelDock] Content Script Loaded (v8.0 - Reference Port)');
})();
