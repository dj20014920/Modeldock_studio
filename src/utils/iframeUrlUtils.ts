/**
 * iframe URL utilities for Brain Flow and Auto-Routing history tracking
 * 
 * 핵심 원칙:
 * - 실제 대화 세션 URL을 캡처하기 위해 iframe 내부 location 조회
 * - URL 변경이 완료될 때까지 재시도 (타이밍 문제 해결)
 * - 모든 플랫폼(Claude, ChatGPT, Grok 등)의 URL 패턴 지원
 * 
 * 보안:
 * - Origin 검증을 통한 메시지 위조 방지
 * - iframe null 체크 및 early return
 * - UUID 패턴 기반 URL 유효성 검증
 * 
 * @version 2.0.0
 * @security Enhanced with 2024 postMessage best practices
 */

// ========== Constants ==========

/** Timeout for initial URL request (ms) */
const DEFAULT_TIMEOUT = 2000;

/** Timeout for retry attempts (ms) - shorter to improve responsiveness */
const RETRY_TIMEOUT = 1000;

/** Delay between retry attempts (ms) */
const DEFAULT_RETRY_DELAY = 500;

/** Default max retry count for Brain Flow (longer processes) */
const DEFAULT_MAX_RETRIES = 5;

/** Minimum path length to consider as conversation URL */
const MIN_CONVERSATION_PATH_LENGTH = 10;

/** Trusted origins for receiving postMessage responses */
const TRUSTED_ORIGINS = [
    'https://chatgpt.com',
    'https://chat.openai.com',
    'https://claude.ai',
    'https://grok.com',
    'https://x.com',
    'https://gemini.google.com',
    'https://aistudio.google.com',
    'https://chat.deepseek.com',
    'https://chat.mistral.ai',
    'https://chat.qwen.ai',
    'https://kimi.moonshot.cn',
    'https://perplexity.ai',
    'https://www.perplexity.ai',
    'https://www.kimi.com',
    'https://kimi.com',
    'https://lmarena.ai',
    'https://chat.lmsys.org',
];

/** Conversation URL patterns used by various platforms */
const CONVERSATION_PATTERNS = [
    '/c/',           // ChatGPT, Grok
    '/chat/',        // Claude, 기타
    '/conversation/', // 일부 플랫폼
    '/share/',       // 공유 링크
];

/** UUID pattern for conversation ID validation */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// ========== Helper Functions ==========

/**
 * Check if the origin is trusted for receiving postMessage
 * 
 * @param origin - Origin to validate
 * @returns true if origin is in the trusted list
 */
function isTrustedOrigin(origin: string): boolean {
    // Exact match or subdomain match
    return TRUSTED_ORIGINS.some(trusted =>
        origin === trusted || origin.endsWith('.' + new URL(trusted).hostname)
    );
}

/**
 * Sanitize URL to prevent injection attacks
 * 
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if invalid
 */
function sanitizeUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') return null;

    try {
        // Validate URL format
        const urlObj = new URL(url);

        // Only allow http/https protocols
        if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
            console.warn('[IframeUrlUtils] Rejected non-HTTP(S) URL:', url);
            return null;
        }

        // Return validated URL
        return urlObj.href;
    } catch (e) {
        console.warn('[IframeUrlUtils] Invalid URL format:', url);
        return null;
    }
}

// ========== Main Functions ==========

/**
 * iframe의 현재 실제 URL을 가져옵니다
 * content.js에 메시지를 보내 window.location.href를 요청
 * 
 * @param iframe - 대상 iframe 엘리먼트
 * @param timeout - 응답 대기 시간 (ms, 기본 2000)
 * @returns 실제 URL 또는 null (timeout 시)
 * 
 * @security
 * - Origin validation to prevent message forgery
 * - URL sanitization before returning
 * - iframe.contentWindow null check
 */
export async function getIframeActualUrl(
    iframe: HTMLIFrameElement,
    timeout: number = DEFAULT_TIMEOUT
): Promise<string | null> {
    return new Promise((resolve) => {
        // 🔒 SECURITY: Check iframe.contentWindow exists
        if (!iframe.contentWindow) {
            console.warn('[IframeUrlUtils] iframe.contentWindow is null, cannot retrieve URL');
            resolve(null);
            return;
        }

        const requestId = `url-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let isResolved = false;

        // Safe resolve to prevent race conditions
        const safeResolve = (value: string | null) => {
            if (isResolved) return;
            isResolved = true;
            clearTimeout(timeoutHandle);
            window.removeEventListener('message', listener);
            resolve(value);
        };

        const timeoutHandle = setTimeout(() => {
            console.warn('[IframeUrlUtils] URL request timeout after', timeout, 'ms');
            safeResolve(null);
        }, timeout);

        const listener = (event: MessageEvent) => {
            const data = event.data;

            // 🔒 SECURITY: Ignore non-ModelDock messages early
            if (!data?.type?.startsWith('MODEL_DOCK_')) return;

            // 🔒 SECURITY: Validate origin
            if (!isTrustedOrigin(event.origin)) {
                console.warn('[IframeUrlUtils] Rejected message from untrusted origin:', event.origin);
                return;
            }

            if (
                data.type === 'MODEL_DOCK_CURRENT_URL_RESPONSE' &&
                data.payload?.requestId === requestId
            ) {
                // 🔒 SECURITY: Sanitize URL before resolving
                const sanitizedUrl = sanitizeUrl(data.payload.url);
                safeResolve(sanitizedUrl);
            }
        };

        window.addEventListener('message', listener);

        // content.js로 URL 요청 전송
        try {
            iframe.contentWindow.postMessage(
                {
                    type: 'MODEL_DOCK_GET_CURRENT_URL',
                    payload: { requestId }
                },
                '*' // Note: We validate response origin instead
            );
        } catch (error) {
            console.error('[IframeUrlUtils] Failed to send postMessage:', error);
            safeResolve(null);
        }
    });
}

/**
 * URL 변경을 감지하며 재시도하는 버전
 * 
 * 각 플랫폼(Claude, ChatGPT, Grok 등)은 메시지 전송 후 새 대화 세션 URL로
 * 네비게이션하는데, 이 과정이 즉시 일어나지 않을 수 있습니다.
 * 이 함수는 URL이 초기 URL에서 변경될 때까지 재시도합니다.
 * 
 * @param iframe - 대상 iframe 엘리먼트  
 * @param initialUrl - 비교 기준 URL (보통 model.url 또는 iframe.src)
 * @param maxRetries - 최대 재시도 횟수 (기본 5회)
 * @param retryDelay - 재시도 간격 (ms, 기본 500)
 * @returns 유효한 대화 세션 URL 또는 마지막 시도에서 얻은 URL
 * 
 * @performance
 * - First attempt: 2s timeout
 * - Subsequent attempts: 1s timeout for faster response
 */
export async function getIframeActualUrlWithRetry(
    iframe: HTMLIFrameElement,
    initialUrl: string,
    maxRetries: number = DEFAULT_MAX_RETRIES,
    retryDelay: number = DEFAULT_RETRY_DELAY
): Promise<string | null> {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[IframeUrlUtils] Starting URL capture with retry (initial: ${initialUrl})`);
    }

    let lastUrl: string | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        // 🚀 PERFORMANCE: First attempt uses longer timeout, retries use shorter
        const timeout = attempt === 1 ? DEFAULT_TIMEOUT : RETRY_TIMEOUT;

        const url = await getIframeActualUrl(iframe, timeout);
        lastUrl = url;

        // URL 유효성 검증
        if (url && isValidConversationUrl(url, initialUrl)) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[IframeUrlUtils] ✅ Valid conversation URL captured on attempt ${attempt}: ${url}`);
            }
            return url;
        }

        // 마지막 시도가 아니면 대기
        if (attempt < maxRetries) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[IframeUrlUtils] Attempt ${attempt}: URL not changed yet, retrying in ${retryDelay}ms...`);
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }

    // 최대 재시도 도달 시 마지막 URL 반환 (또는 null)
    if (process.env.NODE_ENV === 'development') {
        console.log(`[IframeUrlUtils] ⚠️ Max retries reached. Returning last URL: ${lastUrl || 'null'}`);
    }
    return lastUrl;
}

/**
 * URL이 유효한 대화 세션 URL인지 검증
 * 
 * 검증 조건:
 * 1. null이 아님 (timeout이 아님)
 * 2. initialUrl과 다름 (새 세션으로 변경됨)
 * 3. 홈페이지가 아님 ('/'로만 끝나지 않음)
 * 4. 대화 패턴 포함 (/c/, /chat/, /conversation/ 등) 또는
 * 5. UUID 패턴 포함 또는 충분히 긴 경로
 * 
 * @param url - 검증할 URL
 * @param initialUrl - 비교 기준 URL
 * @returns 유효한 대화 URL이면 true
 */
function isValidConversationUrl(url: string, initialUrl: string): boolean {
    // null 체크
    if (!url) return false;

    // 초기 URL과 동일하면 아직 변경되지 않은 것
    if (url === initialUrl) return false;

    // 홈페이지 체크 (단순히 '/'로 끝나는 경우 제외)
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;

        // 홈페이지인 경우
        if (pathname === '/' || pathname === '') return false;

        // 대화 세션 패턴 체크
        const hasConversationPattern = CONVERSATION_PATTERNS.some(pattern =>
            pathname.includes(pattern)
        );

        // UUID 패턴 체크 (대부분의 플랫폼이 UUID 사용)
        const hasUUID = UUID_PATTERN.test(pathname);

        // 충분히 복잡한 경로인지 체크 (최소 3개의 세그먼트와 10자 이상)
        const pathSegments = pathname.split('/').filter(s => s.length > 0);
        const isComplexPath = pathname.length > MIN_CONVERSATION_PATH_LENGTH &&
            pathSegments.length >= 2;

        // 패턴, UUID, 또는 복잡한 경로 중 하나라도 만족하면 유효
        return hasConversationPattern || hasUUID || isComplexPath;

    } catch (e) {
        // URL 파싱 실패 시 보수적으로 false 반환
        console.warn('[IframeUrlUtils] URL parsing failed:', e);
        return false;
    }
}
