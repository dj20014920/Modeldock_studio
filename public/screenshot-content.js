/**
 * screenshot-content.js
 * 
 * Content Script: 드래그로 영역 선택 오버레이
 * 사용자가 드래그한 영역 좌표를 background.js로 전달
 */

(function () {
  'use strict';

  // 중복 실행 방지
  if (window.__MODELDOCK_SCREENSHOT_ACTIVE) {
    console.log('[ModelDock] Screenshot overlay already active');
    return;
  }
  window.__MODELDOCK_SCREENSHOT_ACTIVE = true;

  // 오버레이 컨테이너
  const overlay = document.createElement('div');
  overlay.id = 'modeldock-screenshot-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    cursor: crosshair;
    z-index: 2147483647;
    user-select: none;
  `;

  // 선택 영역 표시
  const selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: absolute;
    border: 2px solid #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    display: none;
  `;
  overlay.appendChild(selectionBox);

  // 안내 텍스트
  const hint = document.createElement('div');
  hint.style.cssText = `
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    pointer-events: none;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  `;
  hint.textContent = '캡처할 영역을 드래그하세요 (ESC: 취소)';
  overlay.appendChild(hint);

  document.body.appendChild(overlay);

  let startX = 0, startY = 0;
  let isSelecting = false;

  // 드래그 시작
  overlay.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    startY = e.clientY;
    isSelecting = true;

    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  });

  // 드래그 중
  overlay.addEventListener('mousemove', (e) => {
    if (!isSelecting) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });

  // 드래그 종료
  overlay.addEventListener('mouseup', (e) => {
    if (!isSelecting) return;

    const endX = e.clientX;
    const endY = e.clientY;

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    // 최소 크기 검증 (10x10 이상)
    if (width < 10 || height < 10) {
      alert('영역이 너무 작습니다. 더 크게 선택해주세요.');
      cleanup();
      return;
    }

    // 좌표를 background.js로 전달 (devicePixelRatio 보정)
    const dpr = window.devicePixelRatio || 1;

    chrome.runtime.sendMessage({
      type: 'CAPTURE_AREA_DONE',
      coords: {
        x: x * dpr,
        y: y * dpr,
        width: width * dpr,
        height: height * dpr
      }
    });

    cleanup();
  });

  // ESC 키로 취소
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      chrome.runtime.sendMessage({ type: 'CAPTURE_AREA_CANCELLED' });
      cleanup();
    }
  };
  document.addEventListener('keydown', handleKeydown);

  // 정리 함수
  function cleanup() {
    if (overlay.parentNode) {
      document.body.removeChild(overlay);
    }
    document.removeEventListener('keydown', handleKeydown);
    window.__MODELDOCK_SCREENSHOT_ACTIVE = false;
  }

})();
