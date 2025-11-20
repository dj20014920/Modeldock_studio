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

const PRELOAD_PATH = path.join(__dirname, 'preload.js');

// 🛡️ Stealth Mode: Remove "webdriver" property
try {
  if (navigator.webdriver) {
    const newProto = (navigator as any).__proto__;
    delete newProto.webdriver;
    (navigator as any).__proto__ = newProto;
  }
  // @ts-ignore
  delete navigator.webdriver;
} catch (e) {
  // Ignore errors
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  
  getPreloadPath: () => {
    return `file://${PRELOAD_PATH}`;
  },
  
  // 메인 프로세스의 USER_AGENT와 일치시킴 (Chrome 122 on Mac)
  getUserAgent: () => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36`
});