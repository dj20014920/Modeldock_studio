const SESSION_STORAGE_KEY = 'modeldockSessionSyncModels';
const registeredModels = new Map();
const EXTENSION_TOP_LEVEL_SITE = `chrome-extension://${chrome.runtime.id}`;
const PARTITION_KEY = { topLevelSite: EXTENSION_TOP_LEVEL_SITE };

bootstrapSessionRegistry();

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'index.html' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

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
