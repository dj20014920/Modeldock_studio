const SESSION_STORAGE_KEY = 'modeldockSessionSyncModels';
const registeredModels = new Map();
const EXTENSION_TOP_LEVEL_SITE = `chrome-extension://${chrome.runtime.id}`;
const PARTITION_KEY = { topLevelSite: EXTENSION_TOP_LEVEL_SITE };

// === Offscreen Document Management ===
let creatingOffscreen = null; // Singleton promise to prevent race conditions

/**
 * Ensure offscreen document exists
 * Offscreen Document는 동시에 하나만 존재할 수 있음
 */
async function ensureOffscreenDocument() {
  // Check if already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')]
  });

  if (existingContexts.length > 0) {
    return; // Already exists
  }

  // Prevent race condition when multiple calls happen simultaneously
  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Tab capture for screenshot functionality'
  });

  await creatingOffscreen;
  creatingOffscreen = null;
}

/**
 * Capture screenshot using tabCapture API + Offscreen Document
 * This approach works reliably from Side Panel context
 * @returns {Promise<string>} Base64 data URL of the screenshot
 */
async function handleTabCaptureScreenshot() {
  // 1. Get active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    throw new Error('No active tab found');
  }

  // 2. Get stream ID for the tab
  // tabCapture.getMediaStreamId works from Service Worker (Chrome 116+)
  const streamId = await new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: activeTab.id }, (streamId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!streamId) {
        reject(new Error('Failed to get stream ID'));
        return;
      }
      resolve(streamId);
    });
  });

  // 3. Create offscreen document if needed
  await ensureOffscreenDocument();

  // 4. Send stream ID to offscreen document for capture
  const response = await chrome.runtime.sendMessage({
    type: 'OFFSCREEN_CAPTURE_TAB',
    streamId: streamId
  });

  if (!response?.success) {
    throw new Error(response?.error || 'Offscreen capture failed');
  }

  return response.dataUrl;
}

bootstrapSessionRegistry();

// === Action Icon & Context Menu Setup ===
// 설치 시 초기화
chrome.runtime.onInstalled.addListener(() => {
  // 사이드 패널 동작: 아이콘 클릭으로는 열리지 않음 (우클릭 메뉴로만)
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
    .catch((error) => console.error('[ModelDock] Failed to set panel behavior:', error));

  // 컨텍스트 메뉴 생성 (우클릭 메뉴)
  chrome.contextMenus.create({
    id: 'open-sidepanel',
    title: '사이드 패널에서 열기',
    contexts: ['action'] // 확장 프로그램 아이콘 우클릭 시에만 표시
  });
});

// 컨텍스트 메뉴 클릭 핸들러
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-sidepanel' && tab?.id) {
    chrome.sidePanel.open({ tabId: tab.id })
      .catch((error) => console.error('[ModelDock] Failed to open side panel:', error));
  }
});

// 아이콘 클릭 시 전체 웹사이트 열기 (기본 동작)
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'index.html' });
});

// === Message Handler (통합) ===
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  // Session Sync 메시지
  if (message.type === 'REGISTER_SESSION_SYNC_MODELS') {
    const models = Array.isArray(message.payload) ? message.payload : [];
    registerSessionModels(models)
      .then((count) => sendResponse({ ok: true, count }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === 'SYNC_MODEL_SESSION') {
    const { modelId } = message.payload || {};
    syncModelSession(modelId)
      .then((mirrored) => sendResponse({ ok: true, mirrored }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  // Screenshot 메시지 (Silent Capture via <all_urls>)
  if (message.type === 'CAPTURE_TAB_SILENT') {
    const { windowId } = message.payload || {};

    // Fallback: If no windowId, try to find the "last focused" regular window
    const targetInternal = async () => {
      let targetWindowId = windowId;
      if (!targetWindowId) {
        const windows = await chrome.windows.getAll({ type: 'normal' });
        // The last focused window usually leads the side panel
        const lastFocused = windows.find(w => w.focused) || windows[0];
        if (lastFocused) targetWindowId = lastFocused.id;
      }

      return new Promise((resolve, reject) => {
        chrome.tabs.captureVisibleTab(targetWindowId, { format: 'png' }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(dataUrl);
          }
        });
      });
    };

    targetInternal()
      .then(dataUrl => sendResponse({ success: true, dataUrl }))
      .catch(error => {
        console.error('[ModelDock] Silent capture failed:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }

  // Screenshot 메시지 (tabCapture + Offscreen Document 방식)
  if (message.type === 'CAPTURE_FULL_SCREENSHOT') {
    handleTabCaptureScreenshot()
      .then((dataUrl) => {
        sendResponse({ success: true, dataUrl });
      })
      .catch((error) => {
        console.error('[ModelDock] Screenshot failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  }

  if (message.type === 'CAPTURE_AREA_START') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        sendResponse({ success: false, error: 'No active tab' });
        return;
      }

      // 🔍 Restricted Page Check (Chrome Policy)
      // Extensions cannot execute scripts on chrome://, edge://, file://, or Web Store pages
      const restrictedProtocols = ['chrome:', 'edge:', 'about:', 'view-source:'];
      const isRestrictedUrl = restrictedProtocols.some(proto => activeTab.url?.startsWith(proto)) ||
        activeTab.url?.includes('chrome.google.com/webstore');

      if (isRestrictedUrl) {
        sendResponse({
          success: false,
          error: '보안상 Chrome 시스템 페이지(설정, 확장프로그램 등)에서는 캡처가 차단됩니다. 일반 웹사이트에서 시도해주세요.'
        });
        return;
      }

      // Inject content script for area selection
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['screenshot-content.js']
      }).then(() => {
        sendResponse({ success: true });
      }).catch((error) => {
        // Fallback for other restriction errors
        if (error.message.includes('Cannot access contents')) {
          sendResponse({
            success: false,
            error: '이 페이지는 브라우저 보안 정책에 의해 캡처할 수 없습니다.'
          });
        } else {
          sendResponse({ success: false, error: error.message });
        }
      });
    });
    return true;
  }

  if (message.type === 'CAPTURE_AREA_DONE') {
    const { x, y, width, height } = message.coords;

    const windowId = sender.tab ? sender.tab.windowId : null;

    // 1. Capture Full Tab
    chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (fullDataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('Capture failed:', chrome.runtime.lastError);
        return;
      }

      // 2. Crop using OffscreenCanvas
      fetch(fullDataUrl)
        .then(res => res.blob())
        .then(blob => createImageBitmap(blob))
        .then(imageBitmap => {
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, x, y, width, height, 0, 0, width, height);
          return canvas.convertToBlob({ type: 'image/png' });
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const croppedDataUrl = reader.result;

            // 3. Broadcast to Side Panel
            chrome.runtime.sendMessage({
              type: 'AREA_CAPTURE_COMPLETED',
              dataUrl: croppedDataUrl
            });
          };
          reader.readAsDataURL(blob);
        })
        .catch(error => {
          console.error('[ModelDock] Crop failed:', error);
        });
    });

    // content script expects a response to close connection, though it cleans up immediately
    sendResponse({ success: true });
    return true;
  }
});

chrome.cookies.onChanged.addListener((changeInfo) => {
  const cookie = changeInfo.cookie;
  if (!cookie) return;

  const target = findModelForDomain(cookie.domain);
  if (!target) return;

  const isPartitionedForExtension = Boolean(
    cookie.partitionKey &&
    cookie.partitionKey.topLevelSite === EXTENSION_TOP_LEVEL_SITE
  );

  if (isPartitionedForExtension) {
    if (changeInfo.removed) {
      return; // Partition cookie removed from iframe context; nothing to mirror
    }

    ensurePartitionCookieCompatibility(cookie).catch((error) => {
      console.warn('[ModelDock] Failed to update partition cookie', error);
    });
    return;
  }

  if (changeInfo.removed) {
    removePartitionCookie(cookie).catch((error) => {
      console.warn('[ModelDock] Failed to remove partition cookie', error);
    });
    return;
  }

  mirrorCookieIntoPartition(cookie).catch((error) => {
    console.warn('[ModelDock] Failed to mirror cookie', error);
  });
});

async function bootstrapSessionRegistry() {
  try {
    const stored = await storageGet(SESSION_STORAGE_KEY);
    if (Array.isArray(stored)) {
      stored.forEach((entry) => {
        if (entry?.modelId && Array.isArray(entry.domains)) {
          registeredModels.set(entry.modelId, {
            modelId: entry.modelId,
            domains: entry.domains
          });
        }
      });
    }
  } catch (error) {
    console.warn('[ModelDock] Failed to bootstrap session registry', error);
  }
}

async function registerSessionModels(models) {
  if (!models.length) return 0;

  let registeredCount = 0;
  models.forEach((model) => {
    if (!model?.modelId || !Array.isArray(model.domains)) return;

    const normalizedDomains = model.domains
      .map(normalizeDomain)
      .filter(Boolean);

    if (!normalizedDomains.length) return;

    registeredModels.set(model.modelId, {
      modelId: model.modelId,
      domains: normalizedDomains
    });
    registeredCount += 1;
  });

  await storageSet(SESSION_STORAGE_KEY, Array.from(registeredModels.values()));
  return registeredCount;
}

async function syncModelSession(modelId) {
  if (!modelId) throw new Error('modelId is required');

  const config = registeredModels.get(modelId);
  if (!config || !config.domains?.length) {
    throw new Error(`No session sync config for ${modelId}`);
  }

  let mirroredCount = 0;

  for (const domain of config.domains) {
    const cookies = await getCookies({ domain });
    for (const cookie of cookies) {
      const mirrored = await mirrorCookieIntoPartition(cookie);
      if (mirrored) {
        mirroredCount += 1;
      }
    }
  }

  return mirroredCount;
}

function findModelForDomain(domain = '') {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;

  for (const [modelId, config] of registeredModels.entries()) {
    const matches = config.domains.some((targetDomain) => {
      return (
        normalized === targetDomain ||
        normalized.endsWith(`.${targetDomain}`)
      );
    });

    if (matches) {
      return { modelId, config };
    }
  }

  return null;
}

async function mirrorCookieIntoPartition(cookie) {
  if (!cookie || cookie.partitionKey) return false;

  const url = buildCookieUrl(cookie);
  if (!url) return false;

  const cookieDetails = {
    url,
    name: cookie.name,
    value: cookie.value,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: true,
    sameSite: 'no_restriction',
    storeId: cookie.storeId,
    partitionKey: PARTITION_KEY,
    partitioned: true
  };

  if (cookie.expirationDate) {
    cookieDetails.expirationDate = cookie.expirationDate;
  }

  await setCookie(cookieDetails);
  return true;
}

async function ensurePartitionCookieCompatibility(cookie) {
  if (!cookie.partitionKey) return false;

  const needsUpdate = cookie.sameSite !== 'no_restriction' || !cookie.secure;
  if (!needsUpdate) return false;

  const url = buildCookieUrl({ ...cookie, secure: true });
  if (!url) return false;

  const cookieDetails = {
    url,
    name: cookie.name,
    value: cookie.value,
    path: cookie.path,
    httpOnly: cookie.httpOnly,
    secure: true,
    sameSite: 'no_restriction',
    storeId: cookie.storeId,
    partitionKey: cookie.partitionKey,
    partitioned: true
  };

  if (cookie.expirationDate) {
    cookieDetails.expirationDate = cookie.expirationDate;
  }

  await setCookie(cookieDetails);
  return true;
}

async function removePartitionCookie(cookie) {
  const url = buildCookieUrl(cookie);
  if (!url) return false;

  await removeCookie({
    url,
    name: cookie.name,
    storeId: cookie.storeId,
    partitionKey: PARTITION_KEY
  });

  return true;
}

function buildCookieUrl(cookie) {
  if (!cookie?.domain) return null;
  const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
  const protocol = cookie.secure ? 'https' : 'http';
  const path = cookie.path || '/';
  return `${protocol}://${domain}${path}`;
}

function normalizeDomain(domain = '') {
  return domain.replace(/^\./, '').toLowerCase();
}

function getCookies(filter) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll(filter, (cookies) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(cookies || []);
      }
    });
  });
}

function setCookie(details) {
  return new Promise((resolve, reject) => {
    chrome.cookies.set(details, (cookie) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(cookie);
      }
    });
  });
}

function removeCookie(details) {
  return new Promise((resolve, reject) => {
    chrome.cookies.remove(details, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

function storageGet(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

function storageSet(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}
