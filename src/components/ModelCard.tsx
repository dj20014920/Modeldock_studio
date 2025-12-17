import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Maximize2, Minimize2, RotateCw, ZoomIn, ZoomOut, ExternalLink, Link2, Clock } from 'lucide-react';
import { ModelConfig, ChatMessage, BYOKProviderId } from '../types';
import { clsx } from 'clsx';
import { ModelFrame } from './ModelFrame';
import { BYOKChat } from './BYOKChat';
import { HistoryPopover } from './HistoryPopover';
import { ModelSettingsDropdown } from './ModelSettingsDropdown';

// Zoom 상태 영속화를 위한 localStorage 키
const ZOOM_STORAGE_KEY = 'modeldock_zoom_levels_v2';

interface ModelCardProps {
  model: ModelConfig;
  instanceId?: string;
  isMainBrain?: boolean;
  conversationUrl?: string;
  onSetMainBrain?: () => void;
  onRemoveMainBrain?: () => void;
  onClose?: () => void;
  status?: 'idle' | 'sending' | 'success' | 'error';
  messages?: ChatMessage[]; // Added for BYOK
  onSendMessage?: (message: string) => Promise<void>; // Added for BYOK individual sending
  onLoadHistory?: (id: string) => void; // Added for Global History
  onNewChat?: () => void; // Added for History
  currentConversationId?: string | null; // Added for History
  onLoadBYOKHistory?: (id: string) => void; // Added for BYOK History
  byokHistoryId?: string; // Added for BYOK History
}

export const ModelCard: React.FC<ModelCardProps> = ({
  model,
  instanceId,
  isMainBrain = false,
  conversationUrl,
  onSetMainBrain,
  onRemoveMainBrain,
  onClose,
  status = 'idle',
  messages = [],
  onSendMessage,
  onLoadHistory,
  onNewChat,
  currentConversationId,
  onLoadBYOKHistory,
  byokHistoryId
}) => {
  const { t } = useTranslation();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // History Popover State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // ✨ Settings Dropdown State

  // modelId 기반으로 zoom 저장
  const getZoomKey = useCallback(() => model.id, [model.id]);

  const [zoomLevel, setZoomLevel] = useState(() => {
    try {
      const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
      if (stored) {
        const zoomLevels = JSON.parse(stored);
        return zoomLevels[getZoomKey()] ?? 0.75;
      }
    } catch (e) {
      console.warn('[ModelCard] Failed to load zoom level:', e);
    }
    return 0.75;
  });

  // Zoom 변경 시 localStorage에 저장
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ZOOM_STORAGE_KEY);
      const zoomLevels = stored ? JSON.parse(stored) : {};
      zoomLevels[getZoomKey()] = zoomLevel;
      localStorage.setItem(ZOOM_STORAGE_KEY, JSON.stringify(zoomLevels));
    } catch (e) {
      console.warn('[ModelCard] Failed to save zoom level:', e);
    }
  }, [zoomLevel, getZoomKey]);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleZoomIn = () => setZoomLevel((prev: number) => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel((prev: number) => Math.max(prev - 0.1, 0.25));
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  // Session Sync Logic
  const supportsSessionSync = !!model.sessionSync;
  const [sessionSyncState, setSessionSyncState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSessionSync = async () => {
    if (!model.sessionSync) return;
    setSessionSyncState('loading');
    try {
      // Simulate sync (placeholder for actual logic)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSessionSyncState('success');
      setTimeout(() => setSessionSyncState('idle'), 2000);
    } catch (e) {
      setSessionSyncState('error');
      setTimeout(() => setSessionSyncState('idle'), 2000);
    }
  };

  const sessionSyncTooltip = (() => {
    if (sessionSyncState === 'loading') return t('modelCard.syncing');
    if (sessionSyncState === 'success') return t('modelCard.synced');
    if (sessionSyncState === 'error') return t('modelCard.syncFailed');
    return t('modelCard.syncSession');
  })();

  const handleOpenInNewTab = () => {
    window.open(model.url, '_blank');
  };

  const isBYOK = model.id.startsWith('byok-');
  // byokProviderId: 'byok-openrouter-model/name' → 'openrouter' (첫 번째 부분만)
  const byokProviderId = isBYOK
    ? model.id.replace('byok-', '').split('-')[0]
    : undefined;

  // ✨ 모델별 설정 키: "openrouter-meta-llama/llama-3.2-3b-instruct" 형식
  const byokModelKey = isBYOK
    ? model.id.replace('byok-', '')
    : undefined;

  return (
    <div className={clsx(
      "w-full h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col border transition-all duration-500",
      status === 'idle' && (isMainBrain ? "border-indigo-500 shadow-md ring-1 ring-indigo-100" : "border-slate-200 hover:shadow-md"),
      status === 'sending' && "border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-100",
      status === 'success' && "border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]",
      status === 'error' && "border-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.2)] animate-shake"
    )}>
      {/* Status Indicator Line (Top) - Fixed: Now part of flex flow to respect border-radius */}
      {status === 'sending' && (
        <div className="w-full h-0.5 shrink-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x" />
      )}

      {/* Header Bar */}
      <div className={clsx(
        "h-10 px-3 flex items-center justify-between border-b shrink-0 z-10",
        isMainBrain ? "bg-indigo-50/80 border-indigo-100" : "bg-white border-slate-100"
      )}>
        {/* Left: Model Info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className={clsx(
            "w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white text-[10px] font-bold",
            model.iconColor
          )}>
            {model.name[0]}
          </div>
          <span className="text-xs font-semibold text-slate-700 truncate">
            {model.name}
          </span>
          {isMainBrain && (
            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[9px] font-bold rounded uppercase tracking-wide">
              {t('modelCard.mainBrain')}
            </span>
          )}
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1">
          {/* Zoom Controls (Hide for BYOK) */}
          {!isBYOK && (
            <div className="flex items-center bg-slate-100 rounded-md p-0.5 mr-1">
              <button onClick={handleZoomOut} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-700 transition-colors">
                <ZoomOut size={12} />
              </button>
              <span className="text-[9px] font-medium text-slate-500 w-8 text-center tabular-nums">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button onClick={handleZoomIn} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-700 transition-colors">
                <ZoomIn size={12} />
              </button>
            </div>
          )}

          {!isBYOK && (
            <button onClick={handleRefresh} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors" title={t('modelCard.refresh')}>
              <RotateCw size={13} />
            </button>
          )}

          {/* Open in New Tab (Hide for BYOK if no URL) */}
          {!isBYOK && (
            <button
              onClick={handleOpenInNewTab}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title={t('modelCard.openInNewTab')}
            >
              <ExternalLink size={13} />
            </button>
          )}

          {/* Session Sync (Hide for BYOK) */}
          {supportsSessionSync && !isBYOK && (
            <button
              onClick={handleSessionSync}
              title={sessionSyncTooltip}
              className={clsx(
                'p-1.5 rounded-md transition-all',
                sessionSyncState === 'loading' && 'text-indigo-600 bg-indigo-50 animate-pulse',
                sessionSyncState === 'success' && 'text-emerald-600 bg-emerald-50',
                sessionSyncState === 'error' && 'text-red-500 bg-red-50',
                sessionSyncState === 'idle' && 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              )}
            >
              <Link2 size={13} className={clsx(sessionSyncState === 'loading' && 'animate-spin')} />
            </button>
          )}

          {/* BYOK History Button */}
          {isBYOK && (
            <div className="relative">
              <button
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className={clsx(
                  "p-1.5 rounded-md transition-colors",
                  isHistoryOpen ? "bg-indigo-100 text-indigo-600" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                )}
                title="Conversation History"
              >
                <Clock size={14} />
              </button>
              {/* History Popover */}
              {isHistoryOpen && (
                <div className="absolute top-full right-0 mt-2 z-50">
                  <HistoryPopover
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    onLoadHistory={(id) => {
                      if (isBYOK && onLoadBYOKHistory) {
                        onLoadBYOKHistory(id);
                      } else {
                        onLoadHistory?.(id);
                      }
                      setIsHistoryOpen(false);
                    }}
                    onNewChat={() => {
                      onNewChat?.();
                      setIsHistoryOpen(false);
                    }}
                    currentConversationId={isBYOK ? (byokHistoryId || null) : (currentConversationId || null)}
                    mode={isBYOK ? 'byok' : 'global'}
                    providerId={byokProviderId as any}
                  />
                </div>
              )}
            </div>
          )}

          {/* ✨ BYOK Settings Button */}
          {isBYOK && byokModelKey && byokProviderId && (
            <div className="relative">
              <ModelSettingsDropdown
                modelId={byokModelKey}
                providerId={byokProviderId as BYOKProviderId}
                isOpen={isSettingsOpen}
                onToggle={() => setIsSettingsOpen(!isSettingsOpen)}
                onClose={() => setIsSettingsOpen(false)}
              />
            </div>
          )}

          <div className="w-px h-4 bg-slate-200 mx-1" />

          {/* Main Brain Toggle */}
          {isMainBrain ? (
            <button
              onClick={onRemoveMainBrain}
              className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors"
              title={t('modelCard.removeMainBrain')}
            >
              <Minimize2 size={13} />
            </button>
          ) : (
            <button
              onClick={onSetMainBrain}
              className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
              title={t('modelCard.setAsMainBrain')}
            >
              <Maximize2 size={13} />
            </button>
          )}

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors ml-0.5" title={t('common.close')}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="flex-1 relative bg-slate-50 w-full h-full overflow-hidden group">
        {isBYOK ? (
          <BYOKChat messages={messages} isStreaming={status === 'sending'} onSendMessage={onSendMessage} />
        ) : (
          <ModelFrame
            modelId={model.id}
            instanceId={instanceId}
            url={conversationUrl || model.url}
            title={model.name}
            zoomLevel={zoomLevel}
            refreshKey={refreshKey}
          />
        )}

        {/* Overlay for drag/interaction protection if needed */}
        {status === 'sending' && !isBYOK && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] z-10 pointer-events-none animate-pulse" />
        )}
      </div>
    </div>
  );
};
