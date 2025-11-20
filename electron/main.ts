import { app, BrowserWindow, session, shell, Session, WebContents } from 'electron';
import path from 'node:path';
import process from 'node:process';
import fs from 'node:fs';

// Shim for TypeScript to recognize __dirname in CommonJS environment
declare const __dirname: string;

const DIST_PATH = path.join(__dirname, '../dist');

// 1. 봇 탐지 방지 플래그 (가장 중요)
// Google이 Electron을 '자동화 도구'로 인식하지 못하게 합니다.
app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
app.commandLine.appendSwitch('disable-features', 'CrossOriginOpenerPolicy,SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure');

let win: BrowserWindow | null;

// Chrome 122 (Electron 29 기반)에 맞춘 깨끗한 User Agent
// 특정 버전을 명시하는 것보다 일반적인 형태가 로그인 성공률이 높습니다.
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

// 앱 전체에 기본 UserAgent 적용
app.userAgentFallback = USER_AGENT;

const configureSession = (ses: Session) => {
  ses.setUserAgent(USER_AGENT);

  const filter = { urls: ['*://*/*'] };
  
  // 2. 요청 헤더 세탁
  ses.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
    const requestHeaders = details.requestHeaders;
    
    requestHeaders['User-Agent'] = USER_AGENT;

    // Electron 관련 헤더 제거
    delete requestHeaders['Sec-Electron-Version'];
    delete requestHeaders['X-Electron-Version'];

    callback({ requestHeaders });
  });

  // 3. 응답 헤더 수정 (X-Frame-Options 제거 등)
  ses.webRequest.onHeadersReceived(filter, (details, callback) => {
    const responseHeaders = details.responseHeaders || {};

    const headersToDelete = [
      'x-frame-options',
      'content-security-policy',
      'cross-origin-opener-policy', 
      'cross-origin-embedder-policy',
    ];

    Object.keys(responseHeaders).forEach((header) => {
      if (headersToDelete.includes(header.toLowerCase())) {
        delete responseHeaders[header];
      }
    });

    callback({
      cancel: false,
      responseHeaders,
    });
  });

  // 4. 권한 자동 허용
  ses.setPermissionRequestHandler((webContents, permission, callback) => {
    const allowedPermissions = [
      'media', 'geolocation', 'notifications', 
      'clipboard-read', 'clipboard-sanitized-write',
      'audio-capture', 'video-capture'
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
      webviewTag: true,
      sandbox: false,
      webSecurity: true 
    },
    backgroundColor: '#ffffff',
    show: false 
  });

  configureSession(session.defaultSession);

  // 🔧 개발/프로덕션 모드 자동 감지 (Robust Development Mode Detection)
  // 1순위: 환경변수로 명시적 지정
  // 2순위: dist/index.html 존재 여부로 자동 판단 (프로덕션 빌드 완료 여부)
  const DEV_SERVER_URL = 'http://localhost:5173';
  const indexPath = path.join(DIST_PATH, 'index.html');
  const isDevMode = process.env.VITE_DEV_SERVER_URL || !fs.existsSync(indexPath);

  if (isDevMode) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || DEV_SERVER_URL;
    console.log(`[Electron] 🚀 개발 모드: Vite dev server 로드 (${devUrl})`);
    win.loadURL(devUrl);
  } else {
    console.log(`[Electron] 📦 프로덕션 모드: 빌드된 파일 로드 (${indexPath})`);
    win.loadFile(indexPath);
  }

  // 개발 모드에서 DevTools 자동 오픈
  if (isDevMode) {
    win.webContents.openDevTools({ mode: 'detach' });
  }

  win.once('ready-to-show', () => {
    win?.show();
  });

  // 로드 실패 시 상세 에러 로그
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`[Electron] ❌ 페이지 로드 실패:`, {
      errorCode,
      errorDescription,
      validatedURL
    });
  });

  // 메인 윈도우의 새 창 처리 (사실상 거의 발생 안 함, webview에서 발생)
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

// ⚡️ 중요: Webview 내부에서 발생하는 팝업(로그인 창) 처리
app.on('web-contents-created', (_event, contents) => {
  // 1. 모든 webview contents에 대해 세션 설정 적용
  if (contents.getType() === 'webview') {
    // webview가 세션을 가질 때 설정 (이벤트 루프 다음 틱에 실행)
    setImmediate(() => {
        if(!contents.isDestroyed() && contents.session) {
          configureSession(contents.session);
        }
    });

    // 2. Google 로그인 팝업 처리 (contents가 파괴되지 않았을 때만)
    if (!contents.isDestroyed()) {
      contents.setWindowOpenHandler(({ url }) => {
      // Google 로그인 관련 URL은 앱 내부 팝업으로 허용
      // 이렇게 해야 세션(쿠키)이 앱 내부 스토리지에 저장됨
      if (url.includes('accounts.google.com') || url.includes('google.com/signin')) {
        return { 
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 500,
            height: 600,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
            }
          }
        };
      }
      
      // 그 외 일반 링크는 외부 브라우저로
      if (url.startsWith('http')) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
      
      return { action: 'allow' };
      });
    }
  }
});

// 파티션 세션 처리
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