# Chrome Extension Setup Guide

## 1. Load the Extension
1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the `dist` folder in this project directory:
   `/Users/dj20014920/Desktop/modeldock_studio/dist`

## 2. Usage
- Click the **ModelDock** icon in the Chrome toolbar.
- It will open the main application in a new tab.
- You can now add models (Gemini, Claude, etc.) from the sidebar.
- **Note:** You must be logged into these services in your browser for them to work within the frames.

## 3. Troubleshooting
- **Blank Screen / Refused to Connect:** Some sites may strictly block embedding even with header stripping. 
- **Login Issues:** If a service asks you to sign in repeatedly, try signing in to that service in a separate tab first.
- **Updates:** If you make code changes, run `npm run build` and then click the **Refresh** icon on the extension card in `chrome://extensions/`.

## 4. Architecture Notes
- **Manifest V3:** Uses `declarativeNetRequest` to strip `X-Frame-Options` and `CSP` headers to allow embedding AI sites.
- **Security:** Input injection is handled via `chrome.tabs.sendMessage` to content scripts running in each frame.
