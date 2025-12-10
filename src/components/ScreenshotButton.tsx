/**
 * ScreenshotButton.tsx
 * 
 * 사이드패널 전용 스크린샷 캡처 버튼
 * 
 * ⚠️ Chrome Side Panel 제한사항으로 인해 표준 Web API 사용:
 * - chrome.tabs.captureVisibleTab → Side Panel에서 activeTab 권한 미작동
 * - chrome.tabCapture → Side Panel에서 호출 불가
 * - ✅ navigator.mediaDevices.getDisplayMedia → 표준 API, 어디서나 작동
 * 
 * 보안: Base64 Data URL로 로컬 전달 (서버 불필요)
 */
import React, { useState, useEffect } from 'react';
import { Camera, Loader2, Crop } from 'lucide-react';
import { clsx } from 'clsx';

interface ScreenshotButtonProps {
  onCapture: (dataUrl: string) => Promise<void> | void;
  disabled?: boolean;
  className?: string;
}

export const ScreenshotButton: React.FC<ScreenshotButtonProps> = ({ onCapture, disabled, className }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsCapturing(false);
    };
  }, []);

  // Listen for Area Capture Completion
  useEffect(() => {
    const handleMessage = async (message: any) => {
      if (message.type === 'AREA_CAPTURE_COMPLETED') {
        const { dataUrl } = message;
        if (dataUrl) {
          await onCapture(dataUrl);
          setIsCapturing(false);
          console.log('[ScreenshotButton] ✅ Area Capture successful');
        }
      } else if (message.type === 'CAPTURE_AREA_CANCELLED') {
        setIsCapturing(false);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, [onCapture]);

  const startCapture = async (mode: 'full' | 'area') => {
    setIsCapturing(true);
    setShowMenu(false);

    try {
      if (mode === 'full') {
        // 1. Get Current Window ID
        const currentWindow = await chrome.windows.getCurrent();

        // 2. Request Silent Capture from Background
        const response = await chrome.runtime.sendMessage({
          type: 'CAPTURE_TAB_SILENT',
          payload: { windowId: currentWindow.id }
        });

        if (!response.success) {
          throw new Error(response.error || 'Silent capture failed');
        }

        await onCapture(response.dataUrl);
        setIsCapturing(false);
        console.log('[ScreenshotButton] ✅ Full Capture successful');

      } else {
        // Area Capture: Trigger Content Script Overlay
        const response = await chrome.runtime.sendMessage({ type: 'CAPTURE_AREA_START' });

        if (!response.success) {
          throw new Error(response.error || 'Failed to start area capture');
        }

        // State remains "capturing" until AREA_CAPTURE_COMPLETED message is received
      }

    } catch (error: any) {
      console.error('[ScreenshotButton] Capture error:', error);
      alert(`캡처 실패: ${error.message}`);
      setIsCapturing(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isCapturing}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
          "bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        title="스크린샷 캡처 옵션"
      >
        {isCapturing ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
        <span>스크린샷</span>
      </button>

      {/* Dropdown Menu */}
      {showMenu && !isCapturing && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[140px] z-50 overflow-hidden">
            <button
              onClick={() => startCapture('full')}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors flex items-center gap-2.5"
            >
              <Camera size={16} />
              <span>전체 화면</span>
            </button>
            <button
              onClick={() => startCapture('area')}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 text-slate-700 hover:text-purple-700 transition-colors flex items-center gap-2.5 border-t border-slate-100"
            >
              <Crop size={16} />
              <span>영역 선택</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ScreenshotButton;
