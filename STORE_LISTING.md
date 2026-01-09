# ModelDock Studio - Multi-AI Testing Platform

## Short Description (≤132 chars)
Testing platform for AI developers to compare ChatGPT, Claude, Gemini & 11+ models side-by-side locally.

## Long Description

⚠️ **FOR DEVELOPMENT, TESTING, AND RESEARCH PURPOSES ONLY**

ModelDock Studio is a powerful local testing workspace designed for AI developers, researchers, and power users who need to compare multiple AI models simultaneously using their existing accounts.

### 🧪 Multi-Model Testing
- **Test 11+ AI models side-by-side**: Compare responses from ChatGPT, Claude, Gemini, DeepSeek, Grok, and more in real-time.
- **BrainFlow™ Orchestration**: Chain AI responses together for complex testing scenarios.
- **Unified Interface**: One consistent UI for all your AI interactions.

### 🔧 Developer-Focused Features
- **BYOK (Bring Your Own Key)**: Support for API keys where available.
- **Iframe-based Architecture**: Uses your actual logged-in web sessions for authentic model behavior testing.
- **Prompt Library**: Manage and test prompts across different models.
- **Local-First**: No remote backend. All configuration and history are stored locally on your machine.

---

### ⚠️ Security Notice & Permissions

**This extension modifies browser security headers (`X-Frame-Options` and `Content-Security-Policy`) for specific AI domains.**

This is **REQUIRED** to allow these websites to be embedded within the ModelDock Studio interface for side-by-side comparison. By design, this disables certain browser security mechanisms for the embedded pages.

*   **Intended Use**: Only use this extension in a **controlled development or research environment**.
*   **Data Safety**: Do not use with highly sensitive or production data.
*   **User Responsibility**: You are responsible for ensuring you have legitimate access to the AI services you use. This extension does **not** bypass login screens or paywalls.

---

### 🔒 Privacy Policy
**We value your privacy.**
- **No Remote Server**: ModelDock Studio does not operate a backend server.
- **No Data Transmission**: Your prompts, chat history, and API keys are stored **locally** in your browser (`chrome.storage.local`). We cannot see your data.
- **Direct Connection**: All network requests are made directly from your browser to the AI providers (OpenAI, Anthropic, etc.).

### ⚖️ Legal Disclaimer
ModelDock Studio is an independent open-source project and is not affiliated with, endorsed by, or sponsored by OpenAI, Anthropic, Google, X Corp, Perplexity AI, or any other AI service providers. All trademarks are the property of their respective owners.
