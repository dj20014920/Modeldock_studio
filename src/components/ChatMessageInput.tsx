
import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Send, Copy, Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { DispatchMode, ModelId } from '../types';
import { INPUT_SELECTORS } from '../constants';
import { clsx } from 'clsx';

interface ChatMessageInputProps {
  activeModelIds: ModelId[];
  mainBrainId: ModelId | null;
  forcedInputText?: string | null;
  onInputHandled?: () => void;
}

type ActionStatus = 'idle' | 'copied' | 'sent' | 'error';

export const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  activeModelIds,
  forcedInputText,
  onInputHandled
}) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<DispatchMode>('manual');
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<ActionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Handle external text injection (e.g., from Prompt Library)
  useEffect(() => {
    if (forcedInputText) {
      setInput(forcedInputText);

      // Focus the textarea
      const textarea = document.querySelector('textarea#main-chat-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }

      if (onInputHandled) {
        onInputHandled();
      }
    }
  }, [forcedInputText, onInputHandled]);

  const handleSend = () => {
    if (!input.trim()) return;

    if (mode === 'manual') {
      // Manual Mode: Copy to clipboard
      navigator.clipboard.writeText(input);
      setLastActionStatus('copied');
      setTimeout(() => setLastActionStatus('idle'), 2000);
    } else {
      // Auto Mode: Check consent
      if (!hasConsented) {
        setShowConsent(true);
        return;
      }
      performAutoInjection();
    }
  };

  const performAutoInjection = async () => {
    setLastActionStatus('idle');
    setErrorMessage('');

    try {
      // Chrome Extension Logic: Broadcast to all frames in the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setErrorMessage('No active tab found');
        setLastActionStatus('error');
        return;
      }

      // We send the message to the tab. Since we want to reach iframes, we rely on content scripts.
      // However, chrome.tabs.sendMessage sends to the top frame by default unless frameId is specified.
      // To reach all frames, we need to know their IDs or use a broadcast pattern if supported.
      // Chrome doesn't support "broadcast to all frames" directly in sendMessage without frameId.
      // But we can use chrome.webNavigation.getAllFrames if we have permission.

      // Fallback: We iterate over all frames if possible.
      let frames: chrome.webNavigation.GetAllFrameResultDetails[] = [];
      try {
        const result = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
        if (result) {
          frames = result;
        }
      } catch (e) {
        console.warn('webNavigation permission might be missing or error:', e);
        // If we can't get frames, we can't inject into iframes reliably from here 
        // without a background script relay or similar. 
        // But assuming we added the permission:
      }

      if (frames.length === 0) {
        // Fallback for when webNavigation is not available or fails: 
        // Try sending to top frame and hope for the best? No, models are in iframes.
        // We can try a brute force approach if we knew the frame IDs, but we don't.
        setErrorMessage('Cannot detect frames');
        setLastActionStatus('error');
        return;
      }

      let successCount = 0;

      // Prepare payload with all possible selectors. 
      // The content script will decide which one to use based on its own URL.
      // We only send selectors for ACTIVE models to minimize risk.
      const activeSelectors = activeModelIds.map(id => ({
        modelId: id,
        ...INPUT_SELECTORS[id]
      })).filter(s => s.inputSelector); // Ensure valid config

      const payload = {
        text: input,
        targets: activeSelectors
      };

      for (const frame of frames) {
        // Skip top frame if models are only in iframes (usually frameId 0 is top)
        if (frame.frameId === 0) continue;

        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'INJECT_INPUT',
            payload
          }, { frameId: frame.frameId });
          successCount++;
        } catch (e) {
          // It's normal for some frames to not respond (e.g. cross-origin restrictions or no content script)
          // console.debug('Frame injection skipped/failed', frame.frameId, e);
        }
      }

      if (successCount > 0) {
        setLastActionStatus('sent');
        setInput('');
      } else {
        setErrorMessage('No targets found');
        setLastActionStatus('error');
      }
    } catch (error: any) {
      console.error('Auto-injection failed:', error);
      setErrorMessage('System Error');
      setLastActionStatus('error');
    }

    setTimeout(() => {
      setLastActionStatus('idle');
      setErrorMessage('');
    }, 3000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleMode = () => {
    if (mode === 'manual') {
      if (!hasConsented) {
        setShowConsent(true);
      } else {
        setMode('auto');
      }
    } else {
      setMode('manual');
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white p-4 relative z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {/* Risk Consent Modal */}
      {showConsent && (
        <div className="absolute bottom-full left-0 w-full p-4 bg-amber-50 border-t border-amber-200 shadow-lg animate-in slide-in-from-bottom-2">
          <div className="max-w-3xl mx-auto flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">자동 전송 기능을 활성화하시겠습니까?</h3>
              <p className="text-sm text-amber-800 mt-1">
                자동 전송은 모든 활성 AI 모델의 입력창에 직접 텍스트를 입력하고 전송 버튼을 누릅니다.
              </p>
              <p className="text-sm text-amber-800 mt-2 font-medium">
                민감한 계정에서는 수동 모드(Manual Mode) 사용을 권장합니다.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowConsent(false)}
                  className="px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded hover:bg-amber-100 text-sm font-medium"
                >
                  취소
                </button>
                <button
                  onClick={() => { setHasConsented(true); setShowConsent(false); setMode('auto'); }}
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm font-medium shadow-sm"
                >
                  네, 활성화합니다
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Mode Toggle & Status */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMode}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all border",
                mode === 'manual'
                  ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                  : "bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-200"
              )}
            >
              {mode === 'manual' ? <Copy size={12} /> : <Zap size={12} />}
              {mode} Mode
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              {mode === 'manual' ? '클립보드에 복사합니다' : '모든 모델에 동시 전송합니다'}
            </span>
          </div>

          {/* Feedback Toast */}
          <div className={clsx(
            "text-xs font-medium flex items-center gap-1.5 transition-all duration-300",
            lastActionStatus === 'idle' ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
            lastActionStatus === 'copied' && "text-green-600",
            lastActionStatus === 'sent' && "text-indigo-600",
            lastActionStatus === 'error' && "text-red-500"
          )}>
            {lastActionStatus === 'copied' && <><CheckCircle2 size={14} /> 복사 완료!</>}
            {lastActionStatus === 'sent' && <><CheckCircle2 size={14} /> 전송 완료!</>}
            {lastActionStatus === 'error' && <><XCircle size={14} /> {errorMessage || '오류 발생'}</>}
          </div>
        </div>

        {/* Input Area */}
        <div className={clsx(
          "relative flex items-end gap-2 bg-slate-50 border rounded-xl p-2 transition-all shadow-sm",
          lastActionStatus === 'error'
            ? "border-red-300 focus-within:ring-2 focus-within:ring-red-500/20"
            : "border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500"
        )}>
          <textarea
            id="main-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'manual' ? "내용을 입력하고 전송 버튼을 누르면 복사됩니다..." : "내용을 입력하면 모든 활성 모델에 자동 전송됩니다..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-sm text-slate-800 placeholder:text-slate-400 font-sans"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className={clsx(
              "p-2.5 rounded-lg transition-all mb-0.5",
              input.trim()
                ? mode === 'manual' ? "bg-slate-800 text-white hover:bg-slate-700 shadow-md" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            {mode === 'manual' ? <Copy size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
