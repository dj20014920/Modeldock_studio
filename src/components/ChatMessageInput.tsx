
import React, { useState, KeyboardEvent, useEffect } from 'react';
import { Send, Copy, Zap, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ActiveModel, DispatchMode, ModelId } from '../types';
import { INPUT_SELECTORS, SUPPORTED_MODELS } from '../constants';
import { clsx } from 'clsx';
import { usePersistentState } from '../hooks/usePersistentState';
import { useTranslation } from 'react-i18next';

interface ChatMessageInputProps {
  activeModels: ActiveModel[];
  mainBrainId: ModelId | null;
  forcedInputText?: string | null;
  onInputHandled?: () => void;
  onStatusUpdate?: (modelId: ModelId, status: 'idle' | 'sending' | 'success' | 'error') => void;
}

type ActionStatus = 'idle' | 'copied' | 'sent' | 'error';

export const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  activeModels,
  mainBrainId,
  forcedInputText,
  onInputHandled,
  onStatusUpdate
}) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [mode, setMode] = usePersistentState<DispatchMode>('md_dispatch_mode', 'manual');
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = usePersistentState<boolean>('md_auto_consent', false);
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
      // Perplexity는 별도 서비스로 병렬 전송
      const isPerplexityActive = activeModels.some(m => m.modelId === 'perplexity');
      if (isPerplexityActive) {
        import('../services/perplexity-service').then(({ perplexityService }) => {
          perplexityService.sendMessage(input);
        });
      }

      const requestIdBase = `md - ${Date.now()} -${Math.random().toString(16).slice(2)} `;
      const allIframes = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[data-md-frame="true"]'));
      const visibleIframes = allIframes.filter((iframe) => {
        const rect = iframe.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      const activeSelectorEntries = activeModels
        .map((m) => ({
          instanceId: m.instanceId,
          modelId: m.modelId,
          selector: INPUT_SELECTORS[m.modelId]
        }))
        .filter((entry) => entry.selector && entry.selector.inputSelector);

      if (activeSelectorEntries.length === 0) {
        setErrorMessage(t('chatInput.errorNoTargets'));
        setLastActionStatus('error');
        return;
      }

      const updateStatusFor = (modelId: ModelId, status: 'sending' | 'success' | 'error' | 'idle') => {
        onStatusUpdate?.(modelId, status);
      };

      let anySuccess = false;
      const frameCache = new Map<string, HTMLIFrameElement>();
      const claimedFrames = new Set<HTMLIFrameElement>();

      const findFrameForInstance = (instanceId: string, modelId: ModelId) => {
        if (frameCache.has(instanceId)) return frameCache.get(instanceId)!;
        const byInstance = visibleIframes.find(f => f.dataset.instanceId === instanceId);
        if (byInstance) {
          frameCache.set(instanceId, byInstance);
          return byInstance;
        }
        const byModel = visibleIframes.find(f => f.dataset.modelId === modelId);
        if (byModel) {
          frameCache.set(instanceId, byModel);
          return byModel;
        }
        const host = (() => { try { return new URL(SUPPORTED_MODELS[modelId].url).host; } catch { return ''; } })();
        const byHost = visibleIframes.find((iframe) => {
          const src = iframe.getAttribute('src') || '';
          try { return new URL(src).host.includes(host); } catch { return false; }
        });
        if (byHost) frameCache.set(instanceId, byHost);
        return byHost || null;
      };

      for (const { modelId, instanceId, selector } of activeSelectorEntries) {
        const primaryFrame = findFrameForInstance(instanceId, modelId);
        const fallbackAllowed = modelId === 'codex' || modelId === 'claudecode' || modelId === 'claude';
        const framesForModel: HTMLIFrameElement[] = [];

        if (primaryFrame) {
          framesForModel.push(primaryFrame);
        } else if (fallbackAllowed) {
          const host = (() => { try { return new URL(SUPPORTED_MODELS[modelId].url).host; } catch { return ''; } })();
          const hostMatches = visibleIframes.filter((iframe) => {
            const src = iframe.getAttribute('src') || '';
            try { return new URL(src).host.includes(host); } catch { return false; }
          }).filter(f => !claimedFrames.has(f));

          if (hostMatches.length > 0) {
            framesForModel.push(hostMatches[0]);
          } else {
            const anyVisible = visibleIframes.find(f => !claimedFrames.has(f));
            if (anyVisible) framesForModel.push(anyVisible);
          }
        }

        if (framesForModel.length === 0) {
          updateStatusFor(modelId, 'error');
          continue;
        }

        if (!selector?.inputSelector) {
          updateStatusFor(modelId, 'error');
          continue;
        }

        for (const targetFrame of framesForModel) {
          if (claimedFrames.has(targetFrame)) continue;
          claimedFrames.add(targetFrame);

          const payloadBase = {
            text: input,
            targets: [{ modelId, ...selector }],
            requestId: `${requestIdBase}-${instanceId}-${claimedFrames.size}`,
            modelId
          };
          const responses: any[] = [];

          const responseHandler = (event: MessageEvent) => {
            const data = event.data;
            if (!data || data.type !== 'MODEL_DOCK_INJECT_RESPONSE') return;
            const resp = data.payload || {};
            if (resp.requestId !== payloadBase.requestId) return;
            responses.push(resp);
          };

          const sendToFrame = (payload: any) => {
            try {
              targetFrame.contentWindow?.postMessage(payload, '*');
            } catch (err) {
              console.warn('iframe postMessage 실패', err);
            }
          };

          updateStatusFor(modelId, 'sending');
          window.addEventListener('message', responseHandler);

          // 1-pass: 주입
          sendToFrame({ type: 'MODEL_DOCK_INJECT_TEXT', payload: { ...payloadBase, submit: false, skipInject: false } });
          await new Promise(r => setTimeout(r, 800));

          // 2-pass: 전송 (주입 생략)
          sendToFrame({ type: 'MODEL_DOCK_INJECT_TEXT', payload: { ...payloadBase, submit: true, forceKey: true, skipInject: true } });

          const success = await new Promise<boolean>((resolve) => {
            const start = Date.now();
            const timer = setTimeout(() => {
              resolve(responses.some(r => r.success));
            }, 8000);
            const interval = setInterval(() => {
              if (responses.some(r => r.success)) {
                clearInterval(interval);
                clearTimeout(timer);
                resolve(true);
              }
              if (Date.now() - start > 7500) {
                clearInterval(interval);
                clearTimeout(timer);
                resolve(responses.some(r => r.success));
              }
            }, 150);
          });

          window.removeEventListener('message', responseHandler);

          if (success || (modelId === 'perplexity' && isPerplexityActive)) {
            anySuccess = true;
            updateStatusFor(modelId, 'success');
            setTimeout(() => updateStatusFor(modelId, 'idle'), 1200);
            break;
          } else {
            updateStatusFor(modelId, 'error');
            setTimeout(() => updateStatusFor(modelId, 'idle'), 1200);
          }
        }

        // 모델 간 딜레이(브라우저 부하 완화)
        await new Promise(r => setTimeout(r, 200));
      }

      if (anySuccess) {
        setLastActionStatus('sent');
        setInput('');
      } else {
        setErrorMessage(t('chatInput.errorSystemError'));
        setLastActionStatus('error');
      }
    } catch (error: any) {
      console.error('Auto-injection failed:', error);
      setErrorMessage(t('chatInput.errorSystemError'));
      setLastActionStatus('error');
      const fallbackTarget = mainBrainId ?? activeModels[0]?.modelId;
      if (fallbackTarget) onStatusUpdate?.(fallbackTarget, 'error');
      setTimeout(() => {
        const fallback = mainBrainId ?? activeModels[0]?.modelId;
        if (fallback) onStatusUpdate?.(fallback, 'idle');
      }, 1500);
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
              <h3 className="font-bold text-amber-900">{t('chatInput.consentTitle')}</h3>
              <p className="text-sm text-amber-800 mt-1">
                {t('chatInput.consentMessage')}
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowConsent(false)}
                  className="px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded hover:bg-amber-100 text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => { setHasConsented(true); setShowConsent(false); setMode('auto'); }}
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm font-medium shadow-sm"
                >
                  {t('chatInput.iUnderstand')}
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
              {mode === 'manual' ? t('chatInput.manualMode') : t('chatInput.autoMode')}
            </button>
            <span className="text-xs text-slate-400 hidden sm:inline-block">
              {mode === 'manual' ? t('chatInput.copyToClipboard') : t('chatInput.dispatchToAll')}
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
            {lastActionStatus === 'copied' && <><CheckCircle2 size={14} /> {t('common.copied')}</>}
            {lastActionStatus === 'sent' && <><CheckCircle2 size={14} /> {t('chatInput.sentSuccess')}</>}
            {lastActionStatus === 'error' && <><XCircle size={14} /> {errorMessage || t('common.error')}</>}
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
            placeholder={t('chatInput.placeholder')}
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
