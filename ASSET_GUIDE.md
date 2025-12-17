# Asset Guide — Screenshots & Promo Tile (Chrome Web Store)

This document describes how to capture review-friendly screenshots and create a compliant 1280×800 promo tile for ModelDock Studio.

## General Rules (Reviewer-Friendly)
- Do not show real personal data, private chats, emails, API keys, account IDs, or billing pages.
- Use test accounts and synthetic prompts (e.g., “Explain a binary search tree in 3 bullets.”).
- Keep the UI clearly “developer/testing” oriented (labels like “Test”, “Compare”, “Debug”, “Evaluation”).
- Avoid marketing language that implies “productivity”, “automation”, or “bypassing restrictions”.
- Ensure any header-modification warning is visible in at least one screenshot (or the extension UI).

## Recommended Screenshot Set (1280×800)
### Screenshot 1 — Side-by-side Comparison (Primary)
- Show 2–4 AI panes in the extension UI.
- Use the same test prompt in each pane.
- Include visible differences in responses (formatting/length/tone) to demonstrate “comparison”.

### Screenshot 2 — Developer Context + Extension
- Split screen: IDE (or a local test spec) on the left + ModelDock Studio on the right.
- The prompt should look like a test case (e.g., “TC-014: summarize JSON schema errors”).

### Screenshot 3 — Security Warning / Responsible Use
- Capture any modal/settings text that indicates:
  - header modification is for local testing only
  - security implications are acknowledged
  - use in controlled environments

### Screenshot 4 — Testing Controls / Debug Signals
- Show any “auto-inject”, “brainflow”, “signals”, “status”, or “completion detection” UI.
- The framing should communicate debugging and evaluation rather than “workflow productivity”.

### Screenshot 5 — Privacy / Local-Only Messaging
- Show settings/about/help area where “No remote server” and “data stays in your browser” is visible.

## Composition Notes (What Reviewers Typically Prefer)
- Clear product purpose in the first screenshot (comparison/testing).
- No “surprise” behavior: avoid screenshots of hidden background processes.
- Explicit warnings for security-sensitive functionality (header modifications, iframe embedding).
- Consistent terminology: “testing”, “debugging”, “comparison”, “evaluation”.

## 1280×800 Promo Tile (One Sentence, Technical)
Use one of the following short messages (avoid “productivity” wording):
- “Developer LLM Comparison Lab (Local-Only)”
- “Multi‑AI Testing Workspace for Developers”
- “Compare AI Web UIs Side‑by‑Side (Local Testing)”
- “Iframe‑Based AI Testing Utility (Developer Tools)”

## Quick Checklist Before Upload
- [ ] First screenshot shows side-by-side comparison clearly.
- [ ] At least one asset includes the LOCAL TESTING header-modification warning.
- [ ] No private or identifiable user data is visible.
- [ ] Terminology is “testing/debugging/comparison”, not “productivity”.

