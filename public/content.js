// ModelDock Content Script v6.0 (Deep Search & Enhanced Event Simulation)
// Handles complex DOM structures, Shadow DOM, dynamic selectors, and robust event simulation

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

  // --- Deep Search Helper ---
  function queryShadow(root, selector) {
    if (!root) return null;

    // 1. Try direct query in current root
    try {
      const el = root.querySelector(selector);
      if (el) return el;
    } catch (e) {
      // Ignore invalid selectors
    }

    // 2. Traverse children with shadowRoot
    const elements = root.querySelectorAll('*');
    for (const element of elements) {
      if (element.shadowRoot) {
        const found = queryShadow(element.shadowRoot, selector);
        if (found) return found;
      }
    }
    return null;
  }

  async function handleInjection(text, targets) {
    // 1. Identify the correct target for this frame using Deep Search
    let matchedTarget = null;
    let foundInput = null;

    for (const target of targets) {
      // Split selectors by comma to try multiple variations
      const selectors = target.inputSelector.split(',').map(s => s.trim());

      for (const selector of selectors) {
        // Use Deep Search (Shadow DOM support)
        const el = queryShadow(document.body, selector);
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

    const { submitSelector, modelId, forceEnter, delayBeforeSubmit } = matchedTarget;

    try {
      // 2. Inject Text based on Model/Element Type
      const injectionSuccess = await robustInject(foundInput, text, modelId);

      if (injectionSuccess) {
        // Wait for UI to update (React state sync)
        await new Promise(r => setTimeout(r, delayBeforeSubmit || 200));

        // 3. Smart Submit
        let submitted = false;

        // Priority 1: Click Button (if selector exists and not forceEnter-only)
        if (submitSelector) {
          submitted = await trySubmit(submitSelector);
        }

        // Priority 2: Force Enter (if configured or button failed)
        if ((forceEnter || !submitted) && !submitted) {
          console.log('[ModelDock] Attempting Enter key fallback...');
          dispatchEnter(foundInput);
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

    // --- Model Specific Handling ---

    // Claude & Gemini & Kimi (ContentEditable)
    if (modelId === 'claude' || modelId === 'gemini' || modelId === 'kimi' || modelId === 'claudecode') {
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
        element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
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

      // Dispatch comprehensive event suite to wake up React/Vue
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));

      // Simulate a keypress to trigger "dirty" state
      element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Process' }));
      element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Process' }));

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

    // Fallback for unknown types (e.g. div contenteditable without specific ID)
    if (element.isContentEditable) {
      element.innerText = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    // CodeMirror (Replit)
    if (element.classList.contains('cm-content')) {
      // CodeMirror is hard to inject directly via DOM.
      // Try clipboard paste
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);
      element.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true,
        clipboardData: dataTransfer
      }));
      return true;
    }

    return false;
  }

  async function trySubmit(selectorString) {
    // Split selectors by comma
    const selectors = selectorString.split(',').map(s => s.trim());

    // Poll for the button to become enabled (max 2.0 seconds)
    const startTime = Date.now();

    while (Date.now() - startTime < 2000) {

      for (const selector of selectors) {
        // Use Deep Search for button too
        const btn = queryShadow(document.body, selector);

        if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
          // Found and enabled!

          // Full Click Sequence
          btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
          btn.click();
          btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

          console.log('[ModelDock] Submitted via button click:', selector);
          return true;
        }
      }

      // Wait 100ms before next check
      await new Promise(r => setTimeout(r, 100));
    }

    console.warn('[ModelDock] Submit button not found or remained disabled');
    return false;
  }

  function dispatchEnter(element) {
    // Simulate a realistic Enter key press sequence
    const keyEvents = [
      { type: 'keydown', code: 'Enter', key: 'Enter', keyCode: 13, which: 13 },
      { type: 'keypress', code: 'Enter', key: 'Enter', keyCode: 13, which: 13 },
      { type: 'keyup', code: 'Enter', key: 'Enter', keyCode: 13, which: 13 }
    ];

    keyEvents.forEach(evt => {
      element.dispatchEvent(new KeyboardEvent(evt.type, {
        bubbles: true,
        cancelable: true,
        key: evt.key,
        code: evt.code,
        keyCode: evt.keyCode,
        which: evt.which,
        shiftKey: false,
        ctrlKey: false,
        metaKey: false
      }));
    });
  }

  console.log('[ModelDock] Content Script Loaded (v6.0 - Enhanced Events)');
})();
