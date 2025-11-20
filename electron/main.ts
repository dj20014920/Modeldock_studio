import { app, BrowserWindow, session, shell, Session } from 'electron';
import path from 'node:path';
import process from 'node:process';

// Shim for TypeScript to recognize __dirname in CommonJS environment
declare const __dirname: string;

// Fix: Remove import.meta.url (ESM) causing crash in CommonJS build
// In CommonJS (Electron default), __dirname is globally available.
const DIST_PATH = path.join(__dirname, '../dist');
const PUBLIC_PATH = app.isPackaged ? DIST_PATH : path.join(__dirname, '../public');

let win: BrowserWindow | null;

// 🚀 Ultra-Critical: Exact Chrome Match Configuration (Updated to Chrome 130)
// Matching current stable Chrome version to pass stringent bot checks.
const CHROME_MAJOR = '130';
const CHROME_FULL_VERSION = '130.0.6723.58';
const USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_FULL_VERSION} Safari/537.36`;

// 🛡️ Security & Stealth Configuration
const configureSession = (ses: Session) => {
  // 1. User Agent Spoofing
  ses.setUserAgent(USER_AGENT);

  // 2. Request Headers: Client Hints Injection & Anti-Detection
  const filter = { urls: ['*://*/*'] };
  
  ses.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    const requestHeaders = details.requestHeaders;
    
    // Force User-Agent
    requestHeaders['User-Agent'] = USER_AGENT;

    // ⚡️ CRITICAL: Inject correct Client Hints for macOS/Chrome 130
    // Without this, modern sites (Gemini/Claude) detect the mismatch and block the load.
    requestHeaders['sec-ch-ua'] = `"Chromium";v="${CHROME_MAJOR}", "Google Chrome";v="${CHROME_MAJOR}", "Not?A_Brand";v="99"`;
    requestHeaders['sec-ch-ua-mobile'] = '?0';
    requestHeaders['sec-ch-ua-platform'] = '"macOS"';
    requestHeaders['sec-ch-ua-platform-version'] = '"14.1.0"'; // Fake a modern macOS version
    requestHeaders['sec-ch-ua-full-version'] = `"${CHROME_FULL_VERSION}"`;
    requestHeaders['sec-ch-ua-full-version-list'] = `"Chromium";v="${CHROME_FULL_VERSION}", "Google Chrome";v="${CHROME_FULL_VERSION}", "Not?A_Brand";v="99.0.0.0"`;
    
    // Remove Electron signatures
    delete requestHeaders['Sec-Electron-Version'];
    delete requestHeaders['X-Electron-Version'];

    callback({ requestHeaders });
  });

  // 3. Response Headers: Aggressive Stripping (Like a Chrome Extension)
  // Removes CSP, Frame Options, and Isolation policies that prevent <webview> rendering.
  ses.webRequest.onHeadersReceived(filter, (details, callback) => {
    const responseHeaders = details.responseHeaders || {};

    const headersToDelete = [
      'x-frame-options',
      'content-security-policy',
      'content-security-policy-report-only',
      'cross-origin-opener-policy', // COOP: Breaks popup/redirect flows
      'cross-origin-embedder-policy', // COEP
      'cross-origin-resource-policy', // CORP
      'x-content-type-options'        // Strict MIME checks
    ];

    Object.keys(responseHeaders).forEach((header) => {
      if (headersToDelete.includes(header.toLowerCase())) {
        delete responseHeaders[header];
      }
    });

    // Optional: Fix Set-Cookie SameSite=Lax issues inside webviews
    if (responseHeaders['set-cookie']) {
      responseHeaders['set-cookie'] = responseHeaders['set-cookie'].map(cookie => {
        // Force None/Secure to allow cross-partition like behavior if needed
        return cookie; 
      });
    }

    callback({
      cancel: false,
      responseHeaders,
    });
  });

  // 4. Permissions: Auto-allow permissions for seamless AI experience
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      'media', 
      'geolocation', 
      'notifications', 
      'clipboard-read', 
      'clipboard-sanitized-write',
      'audio-capture', 
      'video-capture'
    ];
    callback(allowedPermissions.includes(permission));
  });
};

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 900,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Enable <webview>
      sandbox: false, // Often needed for complex preload scripts
      webSecurity: true // Keep true, we handle headers via webRequest
    },
    backgroundColor: '#ffffff',
    show: false // Wait until ready-to-show to prevent white flash
  });

  // Configure default session
  configureSession(session.defaultSession);

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(DIST_PATH, 'index.html'));
  }

  // Smooth showing
  win.once('ready-to-show', () => {
    win?.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// ⚡️ SUPER CRITICAL: Handle ALL Partitions (The "Stealth Mode" Hook)
// Any time a <webview partition="persist:xxx"> is created, this hook fires.
// We apply the exact same header stripping and UA spoofing to that isolated session.
app.on('session-created', (ses) => {
  configureSession(ses);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);