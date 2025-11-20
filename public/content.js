
// ModelDock Content Script v2.0
// Improved robustness for modern frameworks (React, ProseMirror, Monaco, Draft.js)

(() => {
  if (window.hasModelDockListener) return;
  window.hasModelDockListener = true;

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type !== 'INJECT_INPUT') return;

    const { text, inputSelector, submitSelector } = request.payload;
    const input = document.querySelector(inputSelector);
    
    if (!input) {
      // Frame mismatch is expected as we broadcast to all frames
      return;
    }

    try {
      const success = robustInject(input, text);
      
      if (success) {
         // Smart Submit Logic
        setTimeout(() => {
          if (submitSelector) {
            const submitBtn = document.querySelector(submitSelector);
            if (submitBtn && !submitBtn.disabled) {
              submitBtn.click();
              console.log('[ModelDock] Submit triggered');
            } else {
              // Fallback: Try hitting Enter key if button not found or disabled
              // dispatchEnter(input);
            }
          }
        }, 200); // Slight delay to allow validation state to update
        
        sendResponse({ status: 'success', host: window.location.host });
      } else {
        sendResponse({ status: 'failed_injection', host: window.location.host });
      }

    } catch (err) {
      console.error('[ModelDock] Injection Error:', err);
      sendResponse({ status: 'error', message: err.toString() });
    }
    
    return true;
  });

  /**
   * Tries multiple methods to inject text and trigger framework reactivity
   */
  function robustInject(element, text) {
    element.focus();

    // Strategy 1: execCommand (Best for Rich Text Editors like Claude/Gmail)
    if (document.queryCommandSupported('insertText')) {
       // Select all content first to replace or just append? 
       // Context implies appending or replacing. Let's replace for chat inputs mostly.
       // But simpler to just insert.
       const success = document.execCommand('insertText', false, text);
       if (success) return true;
    }

    // Strategy 2: Native Value Setter (Best for React Inputs/Textareas)
    // React overrides the setter, so we must call the prototype's setter to trigger the event listeners properly.
    const tag = element.tagName.toLowerCase();
    if (tag === 'textarea' || tag === 'input') {
      const proto = window.HTMLTextAreaElement.prototype;
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
      
      if (nativeSetter) {
        nativeSetter.call(element, text);
      } else {
        element.value = text;
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // Strategy 3: ContentEditable Fallback (innerHTML/innerText)
    if (element.isContentEditable) {
      element.innerText = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      // Some editors listen to keyup
      element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: ' ' }));
      return true;
    }

    return false;
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
  
  console.log('[ModelDock] Hooked into frame:', window.location.host);
})();
