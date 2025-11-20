
/**
 * Generates the JavaScript code to be executed inside the <webview>
 * to inject text and trigger sending.
 */
export const generateInjectionScript = (text: string, inputSelector: string, submitSelector: string) => {
  // Escaping the text to be safe inside a template string
  const safeText = JSON.stringify(text);

  return `
    (function() {
      try {
        const input = document.querySelector('${inputSelector}');
        if (!input) {
          console.warn('ModelDock: Input element not found for selector: ${inputSelector}');
          return;
        }

        // Focus the input
        input.focus();

        // Handle ContentEditable (e.g., Claude, Gemini, ChatGPT new UI)
        if (input.isContentEditable || input.getAttribute('contenteditable') === 'true') {
          // Method 1: execCommand (Deprecated but widely supported for rich text)
          document.execCommand('insertText', false, ${safeText});
          
          // Fallback Method 2: Direct innerHTML/Text manipulation + Event Dispatching
          // (Only if Method 1 failed to trigger reactivity in the framework)
          if (input.innerText.trim() === '') {
             input.innerText = ${safeText};
             input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } 
        // Handle Textarea / Input (e.g., Perplexity, legacy sites)
        else {
          // Native setter hack for React/Vue to detect change
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
          nativeInputValueSetter.call(input, ${safeText});
          
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Slight delay before clicking send to allow UI to update state
        setTimeout(() => {
          const submitBtn = document.querySelector('${submitSelector}');
          if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
          } else {
             console.warn('ModelDock: Submit button not found or disabled');
          }
        }, 100);

      } catch (err) {
        console.error('ModelDock Injection Error:', err);
      }
    })();
  `;
};
