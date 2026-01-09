# Privacy Policy — ModelDock Studio

Last updated: 2025-12-16

## 1) Overview
ModelDock Studio is a Chrome Extension intended for developers and researchers to test and compare AI web interfaces side-by-side. The product is designed as a client-side (serverless) application.

## 2) No Server / No Collection by Us
ModelDock Studio does not operate any backend servers for this product.

Accordingly, **we do not collect, store, sell, share, or transmit any user data to our servers because we do not have servers that receive such data**.

## 3) Data the Extension May Store Locally
The extension may store the following data **locally on your device** (for example, in `chrome.storage.local` and/or browser local storage) to provide the product’s functionality:

- Extension settings and UI preferences (layout, enabled models, feature toggles)
- Local conversation metadata (e.g., links to the active conversation pages) to support history and routing features
- Prompt text and testing configurations you explicitly create inside the extension UI
- BYOK (Bring Your Own Key) settings if you choose to use optional API-based providers (stored locally; used only to send requests directly from your browser to the selected provider)
- Session-sync configuration (the list of supported domains you enable for embedded session consistency)

You can remove locally stored data by uninstalling the extension. Some features may also provide in-product “clear history/reset” actions depending on your configuration.

## 4) Screen Capture Usage
The extension uses the `tabCapture` and `offscreen` API solely to provide the "Screenshot" and "Area Capture" features requested by the user. Captured images are processed entirely within your browser's local memory and are not transmitted to us or any third parties.

## 5) Cookies and Session Consistency (Optional)
If enabled, the extension may use Chrome’s cookies APIs to support embedded session consistency (e.g., ensuring that an AI website loaded inside an iframe can use your authenticated session).

The extension does not transmit cookie values to us. Cookie handling is performed locally within your browser and is limited to websites for which the extension has been granted host permissions.

## 6) Network Access and Third-Party Websites
When you use ModelDock Studio, you may load third-party AI websites (such as ChatGPT, Claude, Gemini, and others) inside iframes. Your browser connects **directly** to those websites.

Those third-party services may collect and process data under their own privacy policies and terms. ModelDock Studio is not responsible for the data practices of those third parties.

## 7) Security Header Modification
To enable iframe-based local testing, the extension may remove certain anti-framing response headers (e.g., `X-Frame-Options` and `Content-Security-Policy`) for embedded subframes on permitted sites using Chrome’s `declarativeNetRequest`.

This can reduce browser security protections for embedded pages. Use the extension only in a controlled testing environment and avoid sensitive data.

## 8) Sharing / Selling
We do not sell user data. We do not share user data with third parties for purposes unrelated to the extension’s core functionality.

## 9) Contact
If you have questions about this Privacy Policy:

- Email: vinny4920@gmail.com
- Project repository: https://github.com/dj20014920/modeldock_studio
