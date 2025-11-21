// Perplexity Proxy Script
// Injected into https://www.perplexity.ai/ to act as a fetch proxy
// This allows us to make authenticated requests from the extension using the user's session

(() => {
    if (window.hasPerplexityProxy) return;
    window.hasPerplexityProxy = true;

    console.log('[ModelDock] Perplexity Proxy Loaded');

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type !== 'PERPLEXITY_PROXY_REQUEST') return;

        const { url, options, messageId } = request.payload;

        handleProxyRequest(url, options, messageId);
        sendResponse({ status: 'accepted' });
        return true;
    });

    async function handleProxyRequest(url, options, messageId) {
        try {
            // Add required headers for Perplexity
            const headers = new Headers(options.headers || {});
            headers.set('Content-Type', 'application/json');

            // Execute Fetch
            const response = await fetch(url, {
                ...options,
                headers,
                mode: 'cors',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${response.statusText}`);
            }

            if (!response.body) {
                throw new Error('No response body');
            }

            // Stream handling
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    chrome.runtime.sendMessage({
                        type: 'PERPLEXITY_PROXY_DONE',
                        payload: { messageId }
                    });
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                chrome.runtime.sendMessage({
                    type: 'PERPLEXITY_PROXY_CHUNK',
                    payload: { messageId, chunk }
                });
            }

        } catch (error) {
            console.error('[ModelDock] Proxy Request Failed:', error);
            chrome.runtime.sendMessage({
                type: 'PERPLEXITY_PROXY_ERROR',
                payload: { messageId, error: error.toString() }
            });
        }
    }
})();
