"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const node_process_1 = __importDefault(require("node:process"));
const node_fs_1 = __importDefault(require("node:fs"));
// Fix: Remove import.meta.url (ESM) causing crash in CommonJS build
// In CommonJS (Electron default), __dirname is globally available.
const DIST_PATH = node_path_1.default.join(__dirname, '../dist');
const PUBLIC_PATH = electron_1.app.isPackaged ? DIST_PATH : node_path_1.default.join(__dirname, '../public');
let win;
// 🚀 Ultra-Critical: Exact Chrome Match Configuration (Updated to Chrome 130)
// Matching current stable Chrome version to pass stringent bot checks.
const CHROME_MAJOR = '130';
const CHROME_FULL_VERSION = '130.0.6723.58';
const USER_AGENT = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROME_FULL_VERSION} Safari/537.36`;
// 🛡️ Security & Stealth Configuration
const configureSession = (ses) => {
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
            'x-content-type-options' // Strict MIME checks
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
    win = new electron_1.BrowserWindow({
        width: 1200,
        height: 900,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 12, y: 12 },
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js'),
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
    configureSession(electron_1.session.defaultSession);
    // 🔧 개발/프로덕션 모드 자동 감지 (Robust Development Mode Detection)
    // 1순위: 환경변수로 명시적 지정
    // 2순위: dist/index.html 존재 여부로 자동 판단 (프로덕션 빌드 완료 여부)
    const DEV_SERVER_URL = 'http://localhost:5173';
    const indexPath = node_path_1.default.join(DIST_PATH, 'index.html');
    const isDevMode = node_process_1.default.env.VITE_DEV_SERVER_URL || !node_fs_1.default.existsSync(indexPath);
    if (isDevMode) {
        const devUrl = node_process_1.default.env.VITE_DEV_SERVER_URL || DEV_SERVER_URL;
        console.log(`[Electron] 🚀 개발 모드: Vite dev server 로드 (${devUrl})`);
        win.loadURL(devUrl);
        // 개발 모드: DevTools 자동 오픈으로 에러 확인 용이하게
        win.webContents.openDevTools();
    }
    else {
        console.log(`[Electron] 📦 프로덕션 모드: 빌드된 파일 로드 (${indexPath})`);
        win.loadFile(indexPath);
    }
    // 🔍 로드 실패 감지 및 디버깅 로그
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error(`[Electron] ❌ 로드 실패:`);
        console.error(`   URL: ${validatedURL}`);
        console.error(`   Error Code: ${errorCode}`);
        console.error(`   Description: ${errorDescription}`);
    });
    // 콘솔 메시지 캡처 (React/Vite 에러 확인용)
    win.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levelMap = ['VERBOSE', 'INFO', 'WARNING', 'ERROR'];
        console.log(`[Renderer ${levelMap[level]}] ${message}`);
    });
    // Smooth showing
    win.once('ready-to-show', () => {
        win?.show();
    });
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            electron_1.shell.openExternal(url);
        }
        return { action: 'deny' };
    });
}
// ⚡️ SUPER CRITICAL: Handle ALL Partitions (The "Stealth Mode" Hook)
// Any time a <webview partition="persist:xxx"> is created, this hook fires.
// We apply the exact same header stripping and UA spoofing to that isolated session.
electron_1.app.on('session-created', (ses) => {
    configureSession(ses);
});
electron_1.app.on('window-all-closed', () => {
    if (node_process_1.default.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.app.whenReady().then(createWindow);
