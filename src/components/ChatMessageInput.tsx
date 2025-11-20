
import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Send, Copy, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DispatchMode, ModelId } from '../types';
import { INPUT_SELECTORS } from '../constants';
import { clsx } from 'clsx';

declare const chrome: any;

interface ChatMessageInputProps {
  activeModelIds: ModelId[];
  mainBrainId: ModelId | null;
  forcedInputText?: string | null;
  onInputHandled?: () => void;
}

export const ChatMessageInput: React.FC<ChatMessageInputProps> = ({ 
  activeModelIds, 
  forcedInputText,
  onInputHandled
}) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<DispatchMode>('manual');
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<'idle' | 'copied' | 'sent' | 'sending'>('idle');

  // Handle External Input (e.g. from Prompt Library)
  useEffect(() => {
    if (forcedInputText) {
      setInput(forcedInputText);
      // Focus logic to ensure user sees the change
      const textarea = document.querySelector('textarea#main-chat-input') as HTMLTextAreaElement;
      if (textarea) textarea.focus();
      
      if (onInputHandled) onInputHandled();
    }
  }, [forcedInputText, onInputHandled]);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (mode === 'manual') {
      navigator.clipboard.writeText(input);
      setLastActionStatus('copied');
      setTimeout(() => setLastActionStatus('idle'), 2000);
    } else {
      if (!hasConsented) {
        setShowConsent(true);
        return;
      }
      await performAutoInjection();
    }
  };

  const performAutoInjection = async () => {
    setLastActionStatus('sending');
    
    const payload = {
      text: input,
      timestamp: Date.now()
    };

    let successCount = 0;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab && tab.id) {
        // Using Promise.all to make sending faster
        const injectionPromises = activeModelIds.map(async (modelId) => {
          const selectorConfig = INPUT_SELECTORS[modelId];
          if (!selectorConfig) return;

          const message = {
            type: 'INJECT_INPUT',
            payload: {
              ...payload,
              inputSelector: selectorConfig.inputSelector,
              submitSelector: selectorConfig.submitSelector
            }
          };

          try {
            await chrome.tabs.sendMessage(tab.id, message);
            successCount++;
          } catch (err) {
            // Ignore errors for frames that don't match
          }
        });

        await Promise.all(injectionPromises);
      }
    } catch (error) {
      console.error('Broadcasting failed', error);
    }

    if (successCount >= 0) { // Even if 0, we clear input to prevent frustration, user can see if it worked
      setLastActionStatus('sent');
      setInput('');
      setTimeout(() => setLastActionStatus('idle'), 2000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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
    <div className="border-t border-slate-200 bg-white p-4 relative z-50 transition-all">
      {/* Consent Modal */}
      {showConsent && (
        <div className="absolute bottom-full left-0 w-full p-4 bg-amber-50 border-t border-amber-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-2">
          <div className="max-w-3xl mx-auto flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">자동 전송 모드 활성화</h3>
              <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                이 기능은 모든 활성 모델의 입력창에 텍스트를 직접 주입하고 전송 버튼을 클릭합니다.
                <br/>
                <span className="text-xs opacity-80">* 일부 사이트에서는 봇 방지로 인해 작동하지 않을 수 있습니다.</span>
              </p>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={() => setShowConsent(false)}
                  className="px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded hover:bg-amber-100 text-sm font-medium transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={() => { setHasConsented(true); setShowConsent(false); setMode('auto'); }}
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm font-medium shadow-sm transition-colors"
                >
                  동의 및 활성화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMode}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border select-none",
                mode === 'manual' 
                  ? "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 hover:border-slate-300" 
                  : "bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-200 hover:border-indigo-300 shadow-sm"
              )}
            >
              {mode === 'manual' ? <Copy size={12} /> : <Zap size={12} fill={mode === 'auto' ? "currentColor" : "none"} />}
              {mode} Mode
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline-block animate-in fade-in">
              {mode === 'manual' ? '작성 후 복사하여 각 창에 붙여넣으세요.' : '모든 활성 모델에 동시 전송합니다.'}
            </span>
          </div>
          
          {/* Status Indicator */}
          <div className={clsx(
            "text-xs font-medium flex items-center gap-1.5 transition-all duration-500 transform",
            lastActionStatus === 'idle' ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0",
            lastActionStatus === 'copied' ? "text-green-600" : "text-indigo-600"
          )}>
            {lastActionStatus === 'sending' ? (
               <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
               <CheckCircle2 size={14} />
            )}
            {lastActionStatus === 'copied' && '클립보드 복사 완료'}
            {lastActionStatus === 'sent' && '전송 완료'}
            {lastActionStatus === 'sending' && '전송 중...'}
          </div>
        </div>

        {/* Input Field */}
        <div className={clsx(
           "relative flex items-end gap-2 bg-slate-50 border rounded-xl p-2 transition-all duration-200 shadow-sm",
           "focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500",
           lastActionStatus === 'sending' ? "bg-indigo-50/30 border-indigo-200" : "border-slate-300"
        )}>
          <textarea
            id="main-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'manual' ? "메시지를 입력하세요..." : "모든 AI에게 보낼 메시지를 입력하세요..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-40 min-h-[44px] py-2.5 px-2 text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed scrollbar-hide"
            rows={1}
            style={{ height: 'auto' }}
            onInput={(e) => {
               const target = e.target as HTMLTextAreaElement;
               target.style.height = 'auto';
               target.style.height = Math.min(target.scrollHeight, 160) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || lastActionStatus === 'sending'}
            className={clsx(
              "p-2.5 rounded-lg transition-all mb-0.5 active:scale-95",
              input.trim() && lastActionStatus !== 'sending'
                ? mode === 'manual' 
                  ? "bg-slate-800 text-white hover:bg-slate-700 shadow-md hover:shadow-lg" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg hover:shadow-indigo-500/30"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
            title={mode === 'manual' ? "복사하기 (Enter)" : "전송하기 (Enter)"}
          >
            {mode === 'manual' ? <Copy size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};
