# ModelDock - Unified AI Workspace (Chrome Extension)

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

ModelDock is a powerful Chrome Extension that allows you to multitask with multiple AI models (Gemini, Claude, ChatGPT, etc.) in a unified, side-by-side interface.

## Features

- **Unified Interface:** Run multiple AI models side-by-side.
- **Main Brain:** Designate one model as your primary focus while keeping others for reference.
- **Auto-Injection:** Type once and send prompts to all active models simultaneously.
- **Prompt Library:** Save and reuse your favorite prompts.
- **Privacy Focused:** Runs entirely in your browser. No data is sent to our servers.

## Installation

1. **Build the project:**
   ```bash
   npm install
   npm run build
   ```

2. **Load into Chrome:**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right).
   - Click **Load unpacked**.
   - Select the `dist` folder in this project directory.

## Usage

- Click the **ModelDock** icon in your Chrome toolbar to open the workspace.
- Add models from the sidebar.
- Ensure you are logged into the respective AI services in your browser.

## Development

- Run `npm run dev` to start the Vite dev server (useful for UI development, but for full extension testing, use the build & reload workflow).
- Run `npm run build` to generate the production extension in `dist/`.

## Architecture

This project was migrated from Electron to a Chrome Extension to provide better integration with browser sessions and improved security.

- **Frontend:** React, Tailwind CSS, Lucide Icons
- **Build Tool:** Vite
- **Extension Features:** Manifest V3, Declarative Net Request (for iframe embedding), Content Scripts (for input injection).
