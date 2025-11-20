import { contextBridge, ipcRenderer } from 'electron';
import path from 'node:path';

// Augment global Navigator type to include `webdriver` (used defensively below).
declare global {
  interface Navigator {
    webdriver?: boolean;
  }
}

// Shim for TypeScript to recognize __dirname in CommonJS environment
declare const __dirname: string;

// Fix: Remove import.meta.url (ESM) causing crash in CommonJS build
// We use standard Node.js __dirname which is available in Electron preload scripts
const PRELOAD_PATH = path.join(__dirname, 'preload.js');

// 🛡️ Stealth Mode: Remove "webdriver" property
// This runs in the renderer process before any other script.
try {
  // Attempt to delete from proto
  if (navigator.webdriver) {
    const newProto = (navigator as any).__proto__;
    delete newProto.webdriver;
    (navigator as any).__proto__ = newProto;
  }
  
  // Force delete just in case
  // @ts-ignore
  delete navigator.webdriver;
} catch (e) {
  // Ignore errors, best effort
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  // 🔑 Key for ModelFrame:
  // Returns the absolute path to this file so it can be injected into <webview>
  getPreloadPath: () => {
    // Return file:// protocol path for use in 'preload' attribute
    return `file://${PRELOAD_PATH}`;
  },
  
  // Sync UA with Main Process
  getUserAgent: () => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.58 Safari/537.36`
});