import React, { useState, KeyboardEvent } from 'react';
import { Send, Copy, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DispatchMode, ModelId } from '../types';
import { INPUT_SELECTORS } from '../constants';
import { webViewRegistry } from '../utils/webview-registry';
import { generateInjectionScript } from '../utils/injection-script';
import { clsx } from 'clsx';

interface ChatMessageInputProps {
  activeModelIds: ModelId[];
  mainBrainId: ModelId | null;
}

export const ChatMessageInput: React.FC<ChatMessageInputProps> = ({ activeModelIds, mainBrainId }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<DispatchMode>('manual');
  const [showConsent, setShowConsent] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<'idle' | 'copied' | 'sent'>('idle');

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

  const performAutoInjection = () => {
    let sentCount = 0;

    activeModelIds.forEach((id) => {
      const view = webViewRegistry.get(id);
      const selectorConfig = INPUT_SELECTORS[id];

      if (view && selectorConfig) {
        // Check if it's an Electron Webview with executeJavaScript
        if (typeof view.executeJavaScript === 'function') {
          const script = generateInjectionScript(input, selectorConfig.inputSelector, selectorConfig.submitSelector);
          view.executeJavaScript(script).catch((err: any) => {
            console.error(`Failed to inject into ${id}`, err);
          });
          sentCount++;
        } else {
          // Fallback for Iframe Mode (Web Preview)
          // Direct DOM manipulation across iframes is blocked by CORS unless same-origin.
          // We just log here to prevent crash.
          console.warn(`[${id}] Auto-injection skipped: Not in Electron mode.`);
        }
      } else {
        console.warn(`Skipping ${id}: No view or selector config found.`);
      }
    });

    if (sentCount > 0) {
      setLastActionStatus('sent');
      setInput('');
      setTimeout(() => setLastActionStatus('idle'), 2000);
    } else {
      // If in iframe mode, we can't really "send", so maybe fallback to copy behavior visually?
      // For now, just clear input to simulate action if user insisted.
      console.log("Action simulated in Preview Mode");
      setInput('');
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
    <div className="border-t border-slate-200 bg-white p-4 relative z-50">
      {/* Risk Consent Modal */}
      {showConsent && (
        <div className="absolute bottom-full left-0 w-full p-4 bg-amber-50 border-t border-amber-200 shadow-lg animate-in slide-in-from-bottom-2">
          <div className="max-w-3xl mx-auto flex items-start gap-4">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Enable Auto-Routing?</h3>
              <p className="text-sm text-amber-800 mt-1">
                Auto-routing injects text directly into the AI model's web page. 
                This behaves like a user typing, but rapid automated actions can sometimes trigger bot detection mechanisms on strict platforms.
              </p>
              <p className="text-sm text-amber-800 mt-2 font-medium">
                Use responsibly. We recommend Manual Mode for sensitive accounts.
              </p>
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={() => setShowConsent(false)}
                  className="px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded hover:bg-amber-100 text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => { setHasConsented(true); setShowConsent(false); setMode('auto'); }}
                  className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-sm font-medium shadow-sm"
                >
                  I Understand, Enable Auto
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
            <span className="text-xs text-slate-400">
              {mode === 'manual' ? 'Copies to clipboard for you to paste' : 'Injects directly into chats'}
            </span>
          </div>
          
          {/* Feedback Toast */}
          <div className={clsx(
            "text-xs font-medium flex items-center gap-1.5 transition-opacity duration-300",
            lastActionStatus === 'idle' ? "opacity-0" : "opacity-100",
            lastActionStatus === 'copied' ? "text-green-600" : "text-indigo-600"
          )}>
            <CheckCircle2 size={14} />
            {lastActionStatus === 'copied' ? 'Copied to clipboard!' : 'Sent to all models!'}
          </div>
        </div>

        {/* Input Area */}
        <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'manual' ? "Type here, then send to copy..." : "Type message to auto-send to all..."}
            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-sm text-slate-800 placeholder:text-slate-400"
            rows={1}
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