import { app, BrowserWindow, session, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public');

let win: BrowserWindow | null;

// 🚀 Critical: Header Stripping for iframe compatibility
// This replaces the 'declarativeNetRequest' from Chrome Extensions.
// It removes X-Frame-Options and CSP to allow Gemini/Claude in iframes.
const setupHeaderStripping = () => {
  const filter = {
    urls: ['*://*.google.com/*', '*://*.anthropic.com/*', '*://*.openai.com/*']
  };

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    // Remove headers that block iframe embedding
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['Content-Security-Policy'];
    
    // Adjust cookie settings if necessary for cross-origin (simplified)
    // In a production app, we might need granular cookie handling here.

    callback({
      cancel: false,
      responseHeaders,
    });
  });
};

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset', // macOS traffic light integration
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Enable webview/iframe capabilities
    },
    backgroundColor: '#ffffff',
  });

  setupHeaderStripping();

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    // win.webContents.openDevTools(); // Uncomment for debugging
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // Open external links in system browser, not inside the app
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.on('window-all-closed', () => {
  if ((process as any).platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);