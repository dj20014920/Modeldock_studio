# ModelDock Studio - Multi-AI Testing Platform

## Short Description (≤132 chars)
Developer's tool to test LLMs side-by-side locally.

## Long Description
[WARNING]
This tool modifies browser headers for LOCAL TESTING PURPOSES ONLY.

ModelDock Studio is a developer-focused testing utility to compare multiple AI web interfaces side-by-side in a single workspace. It is designed for debugging prompts, validating model behavior, and running repeatable comparison experiments using your own existing AI web sessions.

[Why X-Frame-Removal?]
To allow developers to embed their own AI chat sessions for comparison without API costs.

Many AI websites intentionally prevent embedding via `X-Frame-Options` and `Content-Security-Policy (frame-ancestors)`. For local testing, ModelDock Studio uses Chrome’s `declarativeNetRequest` to remove these response headers **only for subframe loads**, enabling your comparison layout inside the extension UI.

[Features]
- Side-by-side LLM response comparison for testing and evaluation
- Prompt injection simulation (auto or manual) for debugging workflows
- Response monitoring signals to help determine “generating” vs “complete”
- Repeatable test setup via local configuration (no remote backend)

[Security / Responsible Use]
- This extension disables important browser security mechanisms for embedded pages by removing anti-framing headers.
- Use only in controlled development/research environments.
- Do not use with sensitive data.
- You must have legitimate access (accounts/subscriptions) to any AI website you use. This extension does not bypass logins or paywalls.
- ModelDock Studio is not affiliated with OpenAI, Anthropic, Google, Perplexity, X Corp, or other providers. All trademarks belong to their respective owners.

[Privacy]
No remote server. All data stays in your browser.

ModelDock Studio does not operate a backend service and does not transmit your prompts, AI responses, cookies, or browsing data to any server controlled by us.

