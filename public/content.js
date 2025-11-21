// ModelDock Content Script v4.0 (Deep Search & Multi-Selector)
// Handles complex DOM structures, Shadow DOM, and dynamic selectors

(() => {
  if (window.hasModelDockListener) return;
  window.hasModelDockListener = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type !== 'INJECT_INPUT') return;

    const { text, targets } = request.payload;
    handleInjection(text, targets).then((result) => {
      sendResponse(result);
    });

    return true; // Keep channel open for async response
  });

  async function handleInjection(text, targets) {
    // 1. Identify the correct target for this frame using Deep Search
    let matchedTarget = null;
    let foundInput = null;

    for (const target of targets) {
      // Split selectors by comma to try multiple variations
      const selectors = target.inputSelector.split(',').map(s => s.trim());

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el) {
          matchedTarget = target;
          foundInput = el;
          break;
        }
      }
      if (foundInput) break;
    }

    if (!foundInput || !matchedTarget) {
      return { status: 'no_target_match', host: window.location.host };
    }

    const { submitSelector, modelId } = matchedTarget;

    try {
      // 2. Inject Text based on Model/Element Type
      const injectionSuccess = await robustInject(foundInput, text, modelId);

      if (injectionSuccess) {
        // 3. Smart Submit (Wait for button enablement)
        if (submitSelector) {
          await trySubmit(submitSelector);
        } else {
          // Fallback: Enter key
          dispatchEnter(foundInput);
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

    // --- Model Specific Handling ---

    // Claude & Gemini (ContentEditable)
    if (modelId === 'claude' || modelId === 'gemini' || modelId === 'kimi') {
      // Use execCommand for best compatibility
      const success = document.execCommand('insertText', false, text);

      // Fallback if execCommand fails or is blocked
      if (!success) {
        element.textContent = text;
      }

      // Crucial: Trigger input events
      element.dispatchEvent(new Event('input', { bubbles: true }));

      // Gemini sometimes needs a specific keyup to unlock the button
      if (modelId === 'gemini') {
        element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' })); // Dummy key
        element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
        element.dispatchEvent(new Event('input', { bubbles: true }));
      }

      return true;
    }

    // Standard Inputs (Textarea/Input)
    if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
      const proto = window.HTMLTextAreaElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;

      if (nativeSetter) {
        nativeSetter.call(element, text);
      } else {
        element.value = text;
      }

      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      // DeepSeek specific: adjust height to trigger internal state
      if (modelId === 'deepseek') {
        element.style.height = 'auto';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        // Simulate typing for DeepSeek
        element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
        element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
      }

      return true;
    }

    // Fallback for unknown types
    if (element.isContentEditable) {
      element.innerText = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  }

  async function trySubmit(selectorString) {
    // Split selectors by comma
    const selectors = selectorString.split(',').map(s => s.trim());

    // Poll for the button to become enabled (max 2.5 seconds)
    const startTime = Date.now();

    while (Date.now() - startTime < 2500) {

      for (const selector of selectors) {
        const btn = document.querySelector(selector);

        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
          // Found and enabled!

          // Full Click Sequence
          btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          btn.click();
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

          console.log('[ModelDock] Submitted via button click:', selector);
          return;
        }
      }

      // Wait 100ms before next check
      await new Promise(r => setTimeout(r, 100));
    }

    console.warn('[ModelDock] Submit button not found or remained disabled');
  }

  function dispatchEnter(element) {
    const event = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13
    });
    element.dispatchEvent(event);
  }

  console.log('[ModelDock] Content Script Loaded (v4.0)');
})();
