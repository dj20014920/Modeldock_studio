
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ModelConfig } from '../types';
import { ModelFrame } from './ModelFrame';
import { PerplexityChat } from './PerplexityChat';
import { Crown, X, Minimize2, RotateCw, ZoomIn, ZoomOut, Link2, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';

interface ModelCardProps {
  model: ModelConfig;
  isMainBrain?: boolean;
  onSetMainBrain?: () => void;
  onRemoveMainBrain?: () => void;
  onClose?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  isMainBrain = false,
  onSetMainBrain,
  onRemoveMainBrain,
  onClose
}) => {
  // State for Frame Controls
  const [zoomLevel, setZoomLevel] = useState(0.75);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sessionSyncState, setSessionSyncState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const syncResetTimer = useRef<number | null>(null);

  const supportsSessionSync = model.sessionSync?.method === 'cookiePartition';

  useEffect(() => {
    return () => {
      if (syncResetTimer.current) {
        window.clearTimeout(syncResetTimer.current);
      }
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5)); // Max 150%
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); // Min 50%
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    window.open(model.url, '_blank');
  }, [model.url]);

  const scheduleSyncReset = useCallback(() => {
    if (syncResetTimer.current) {
      window.clearTimeout(syncResetTimer.current);
    }
    syncResetTimer.current = window.setTimeout(() => {
      setSessionSyncState('idle');
    }, 2500);
  }, []);

  const sendRuntimeMessage = useCallback((message: unknown) => {
    return new Promise<any>((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
        reject(new Error('Chrome runtime unavailable'));
        return;
      }

      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }, []);

  const handleSessionSync = useCallback(async () => {
    if (!supportsSessionSync) return;

    setSessionSyncState('loading');
    try {
      const response = await sendRuntimeMessage({
        type: 'SYNC_MODEL_SESSION',
        payload: { modelId: model.id }
      });

      if (!response || response.ok !== true) {
        throw new Error(response?.error || 'Session sync failed');
      }

      setSessionSyncState('success');
      handleRefresh();
    } catch (error) {
      console.error('[ModelDock] Session sync failed', error);
      setSessionSyncState('error');
    } finally {
      scheduleSyncReset();
    }
  }, [handleRefresh, model.id, scheduleSyncReset, sendRuntimeMessage, supportsSessionSync]);

  const sessionSyncTooltip = (() => {
    switch (sessionSyncState) {
      case 'loading':
        return '세션 동기화 중...';
      case 'success':
        return '세션 동기화 완료';
      case 'error':
        return '세션 동기화 실패 - 다시 시도하세요';
      default:
        return '로그인 세션 동기화';
    }
  })();

  // Formatter for zoom percentage
  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <div className={clsx(
      "bg-white relative overflow-hidden flex flex-col h-full transition-all duration-300",
      isMainBrain ? "border-2 border-amber-400 shadow-lg z-20" : "border-r border-b border-slate-200"
    )}>
      {/* Model Header Bar */}
      <div className={clsx(
        "h-11 flex items-center px-3 justify-between z-10 transition-colors select-none shrink-0",
        isMainBrain ? "bg-amber-50 border-b border-amber-200" : "bg-white border-b border-slate-100"
      )}>
        {/* Left: Identity */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div className={clsx("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", model.iconColor)} />
          <span className={clsx(
            "font-semibold text-sm tracking-tight truncate",
            isMainBrain ? "text-amber-900" : "text-slate-700"
          )}>
            {model.name}
            {isMainBrain && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold uppercase hidden sm:inline-block">Main Brain</span>}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1 ml-2">

          {/* Zoom Controls Group */}
          <div className="hidden sm:flex items-center bg-slate-50 rounded-md mr-2 border border-slate-200 shadow-sm">
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-l-md transition-colors disabled:opacity-30"
              disabled={zoomLevel <= 0.5}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-medium text-slate-600 w-9 text-center font-mono tabular-nums">
              {zoomPercent}%
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-r-md transition-colors disabled:opacity-30"
              disabled={zoomLevel >= 1.5}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
            title="Refresh"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
          >
            <RotateCw size={15} />
          </button>

          {/* Open in New Tab */}
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenInNewTab(); }}
            title="Open in New Tab"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
          >
            <ExternalLink size={15} />
          </button>

          {supportsSessionSync && (
            <button
              onClick={(e) => { e.stopPropagation(); handleSessionSync(); }}
              title={sessionSyncTooltip}
              className={clsx(
                'p-1.5 rounded-md transition-all',
                sessionSyncState === 'loading' && 'text-indigo-600 bg-indigo-50',
                sessionSyncState === 'success' && 'text-emerald-600 bg-emerald-50',
                sessionSyncState === 'error' && 'text-red-500 bg-red-50',
                sessionSyncState === 'idle' && 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              )}
              disabled={sessionSyncState === 'loading'}
            >
              <Link2
                size={15}
                className={clsx(
                  sessionSyncState === 'loading' && 'animate-spin'
                )}
              />
            </button>
          )}

          <div className="w-px h-4 bg-slate-200 mx-1" />

          {/* Main Brain Toggle */}
          {!isMainBrain && onSetMainBrain && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetMainBrain(); }}
              title="Set as Main Brain"
              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-all"
            >
              <Crown size={15} />
            </button>
          )}

          {/* Demote Main Brain */}
          {isMainBrain && onRemoveMainBrain && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveMainBrain(); }}
              title="Return to Grid"
              className="p-1.5 text-amber-600 hover:text-slate-600 hover:bg-amber-100 rounded-md transition-all"
            >
              <Minimize2 size={15} />
            </button>
          )}

          {/* Close Model */}
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              title="Close Model"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Iframe Container */}
      <div className="flex-1 relative bg-slate-50 overflow-hidden">
        {model.id === 'perplexity' ? (
          <PerplexityChat />
        ) : (
          <ModelFrame
            modelId={model.id}
            url={model.url}
            title={model.name}
            zoomLevel={zoomLevel}
            refreshKey={refreshKey}
          />
        )}
      </div>
    </div>
  );
};
