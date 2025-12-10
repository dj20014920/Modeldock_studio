/**
 * offscreen.js
 * 
 * Offscreen Document Script for Tab Capture Screenshot
 * 
 * Manifest V3에서 Service Worker는 DOM이 없으므로,
 * MediaStream을 처리하려면 Offscreen Document가 필요합니다.
 * 
 * 이 파일은 streamId를 받아 실제 스크린샷을 캡처합니다.
 */

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'OFFSCREEN_CAPTURE_TAB') {
        captureTabScreenshot(message.streamId)
            .then(dataUrl => {
                sendResponse({ success: true, dataUrl });
            })
            .catch(error => {
                console.error('[Offscreen] Capture failed:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep channel open for async response
    }
});

/**
 * Capture a screenshot from the given stream ID
 * @param {string} streamId - Stream ID from chrome.tabCapture.getMediaStreamId
 * @returns {Promise<string>} Base64 data URL of the screenshot
 */
async function captureTabScreenshot(streamId) {
    // Get the media stream using the stream ID
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'tab',
                chromeMediaSourceId: streamId
            }
        }
    });

    // Get video element and canvas
    const video = document.getElementById('capture-video');
    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');

    // Attach stream to video
    video.srcObject = stream;

    // Wait for video to be ready
    await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
            video.play();
            resolve();
        };
        video.onerror = reject;
        // Timeout safety
        setTimeout(() => reject(new Error('Video load timeout')), 5000);
    });

    // Small delay to ensure frame is rendered
    await new Promise(r => setTimeout(r, 100));

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);

    // Stop the stream
    stream.getTracks().forEach(track => track.stop());

    // Convert canvas to data URL (PNG format)
    const dataUrl = canvas.toDataURL('image/png');

    return dataUrl;
}

console.log('[Offscreen] Tab capture document ready');
