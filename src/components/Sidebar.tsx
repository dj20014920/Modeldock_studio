
import React, { useState, useEffect } from 'react';
import { ModelId, ActiveModel, SidebarView, ConversationMetadata } from '../types';
import { SUPPORTED_MODELS, NAV_ITEMS } from '../constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Plus, Minus, MessageSquare, ArrowRight, Crown, Trash2, Edit2, Check, X } from 'lucide-react';

import { useTranslation } from 'react-i18next';
import { loadBYOKSettings } from '../services/byokService';
import { HistoryService } from '../services/historyService';

interface SidebarProps {
  activeModels: ActiveModel[];
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  onTriggerPrompt: () => void;
  onTriggerSettings: () => void;
  onAddModel: (id: ModelId) => void;
  onRemoveLastInstance: (id: ModelId) => void;
  onActivateInstance: (instanceId: string) => void;
  mainBrainInstanceId: string | null;
  onLoadHistory: (id: string) => void; // New Prop
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModels,
  currentView,
  onViewChange,
  onTriggerPrompt,
  onTriggerSettings,
  onAddModel,
  onRemoveLastInstance,
  onActivateInstance,
  mainBrainInstanceId,
  onLoadHistory
}) => {
  const { t } = useTranslation();
  const [byokModels, setByokModels] = useState<{ id: string; name: string; providerId: string; variantId?: string; iconColor: string }[]>([]);

  // History State
  const [historyList, setHistoryList] = useState<ConversationMetadata[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Load BYOK Settings
  useEffect(() => {
    const loadBYOK = async () => {
      const settings = await loadBYOKSettings();
      if (!settings.enabled) {
        setByokModels([]);
        return;
      }

      // ✅ 멀티 선택: selectedVariants 배열을 펼쳐서 각각 표시
      const models = Object.entries(settings.providers)
        .filter(([_, config]) => {
          // 하위 호환성: selectedVariant(구) 또는 selectedVariants(신) 둘 다 지원
          const hasVariants = config.selectedVariants && config.selectedVariants.length > 0;
          const hasLegacyVariant = (config as any).selectedVariant;
          return config.apiKey && (hasVariants || hasLegacyVariant);
        })
        .flatMap(([providerId, config]) => {
          console.log(`[Sidebar] Processing provider: ${providerId}`);
          console.log(`[Sidebar] - selectedVariants:`, config.selectedVariants);
          console.log(`[Sidebar] - legacy selectedVariant:`, (config as any).selectedVariant);

          // 하위 호환성: 기존 selectedVariant를 selectedVariants로 변환
          let variants = config.selectedVariants || [];
          if (variants.length === 0 && (config as any).selectedVariant) {
            variants = [(config as any).selectedVariant];
          }

          console.log(`[Sidebar] - Final variants array (length: ${variants.length}):`, variants);

          // 각 variant를 별도 항목으로 펼침
          const mappedModels = variants.map(variantId => {
            // ✅ 모델명 추출: 'openai/gpt-4o' → 'gpt-4o', 'gpt-4o' → 'gpt-4o'
            const modelName = variantId.includes('/') ? variantId.split('/').pop()! : variantId;

            const modelItem = {
              id: `byok-${providerId}-${variantId}`,  // 고유 ID
              name: modelName,  // ✅ 모델명만 (회사명 제외)
              providerId,
              variantId,
              iconColor: 'bg-purple-500'
            };

            console.log(`[Sidebar] - Mapped model:`, modelItem);
            return modelItem;
          });

          console.log(`[Sidebar] - Total mapped models for ${providerId}:`, mappedModels.length);
          return mappedModels;
        });

      console.log(`[Sidebar] ===== FINAL BYOK MODELS (${models.length}) =====`);
      console.log(models);
      setByokModels(models);
    };
    loadBYOK();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.byokSettings) {
        console.log('[Sidebar] BYOK settings changed, reloading...');
        loadBYOK();
      }
      // Reload history if metadata changes
      if (changes.md_history_metadata) {
        loadHistory();
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Load History
  const loadHistory = async () => {
    const list = await HistoryService.getInstance().getHistoryList();
    // Sort by updatedAt desc
    setHistoryList(list.sort((a, b) => b.updatedAt - a.updatedAt));
  };

  useEffect(() => {
    if (currentView === 'history') {
      loadHistory();
    }
  }, [currentView]);

  const handleDeleteHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm(t('common.confirmDelete', 'Are you sure you want to delete this conversation?'))) {
      await HistoryService.getInstance().deleteConversation(id);
      loadHistory();
    }
  };

  const handleRenameHistory = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    await HistoryService.getInstance().renameConversation(id, editTitle);
    setEditingId(null);
    loadHistory();
  };

  const startEditing = (e: React.MouseEvent, item: ConversationMetadata) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditTitle(item.title);
  };

  // Group History by Date
  const groupHistory = () => {
    const groups: { [key: string]: ConversationMetadata[] } = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const lastWeek = today - 86400000 * 7;

    historyList.forEach(item => {
      if (item.updatedAt >= today) {
        groups['Today'].push(item);
      } else if (item.updatedAt >= yesterday) {
        groups['Yesterday'].push(item);
      } else if (item.updatedAt >= lastWeek) {
        groups['Previous 7 Days'].push(item);
      } else {
        groups['Older'].push(item);
      }
    });

    return groups;
  };

  // Helper to get count of instances per model
  const getModelCount = (id: string) => activeModels.filter(m => m.modelId === id).length;

  // Render Logic based on View
  const renderContent = () => {
    if (currentView === 'history') {
      const groups = groupHistory();
      const hasHistory = historyList.length > 0;

      if (!hasHistory) {
        return (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageSquare size={24} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">No conversation history</p>
          </div>
        );
      }

      return (
        <div className="space-y-6 px-4 pb-4">
          {Object.entries(groups).map(([label, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={label} className="space-y-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                  {label}
                </div>
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onLoadHistory(item.id)}
                    className="group relative flex flex-col gap-1 p-3 rounded-lg border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm cursor-pointer transition-all"
                  >
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="flex-1 text-sm border rounded px-1 py-0.5"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameHistory(e as any, item.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button onClick={e => handleRenameHistory(e as any, item.id)} className="text-green-600 hover:bg-green-50 p-1 rounded">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-700 truncate">
                            {item.title}
                          </span>
                          {item.mode && (
                            <span className={clsx(
                              "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide",
                              item.mode === 'brainflow'
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : item.mode === 'auto-routing'
                                  ? "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                  : item.mode === 'byok'
                                    ? "bg-purple-50 text-purple-600 border border-purple-100"
                                    : "bg-slate-50 text-slate-500 border border-slate-100"
                            )}>
                              {item.mode === 'brainflow' ? 'Brain Flow' :
                                item.mode === 'auto-routing' ? 'Auto Routing' :
                                  item.mode === 'byok' ? 'BYOK' : 'Manual'}
                            </span>
                          )}
                          {item.linkCount ? (
                            <span className="px-1 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-semibold rounded border border-blue-100">
                              Link
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => startEditing(e, item)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={e => handleDeleteHistory(e, item.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[120px]">{item.preview}</span>
                      <span>{new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      );
    }

    if (currentView === 'chats') {
      // --- CHATS VIEW (Active Instances) ---
      if (activeModels.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageSquare size={24} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">{t('sidebar.noActiveChats')}</p>
            <button
              onClick={() => onViewChange('models')}
              className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
            >
              {t('sidebar.createNewChat')}
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-1 px-4">
          {activeModels.map((instance) => {
            const modelConfig = SUPPORTED_MODELS[instance.modelId] || {
              name: instance.modelId.replace('byok-', ''),
              iconColor: 'bg-purple-500'
            };
            const isMain = instance.instanceId === mainBrainInstanceId;

            // BYOK 모델 이름 처리
            let displayName = modelConfig.name;
            if (instance.modelId.startsWith('byok-')) {
              const providerId = instance.modelId.replace('byok-', '');
              displayName = providerId.charAt(0).toUpperCase() + providerId.slice(1);
            }

            return (
              <div
                key={instance.instanceId}
                onClick={() => onActivateInstance(instance.instanceId)}
                className={clsx(
                  "group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                  isMain
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-slate-100 hover:border-indigo-200"
                )}
              >
                <div className={clsx("w-2 h-2 rounded-full shrink-0", modelConfig.iconColor)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {displayName}
                    </span>
                    {isMain && <Crown size={12} className="text-amber-500" />}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate font-mono">
                    #{instance.instanceId.split('-').pop()}
                  </p>
                </div>
                <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
              </div>
            );
          })}
        </div>
      );
    }

    // --- MODELS VIEW (Add New) ---
    return (
      <div className="px-4 space-y-4 pb-4">
        {/* BYOK Models Section */}
        {byokModels.length > 0 && (
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>BYOK Models</span>
              <span className="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded text-[9px]">API</span>
            </div>
            {byokModels.map((model) => {
              const count = getModelCount(model.id);
              const isActive = count > 0;
              const isMaxed = count >= 3;

              return (
                <div
                  key={model.id}
                  className={twMerge(
                    "group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent select-none",
                    isActive
                      ? "bg-purple-50 border-purple-200 shadow-sm"
                      : "hover:bg-purple-50/50 opacity-80 hover:opacity-100 cursor-pointer"
                  )}
                  onClick={() => {
                    if (!isActive) {
                      // BYOK 모델 추가 시 확인 대화상자
                      const confirmed = confirm(
                        `🚀 ${model.name} 모델을 추가하시겠습니까 ?\n\n` +
                        `새 대화를 시작하고 자유롭게, \n` +
                        `${model.name}에서 상담받거나 뭔가를 요청하자.`
                      );
                      if (confirmed) {
                        onAddModel(model.id as ModelId);
                      }
                    }
                  }}
                >
                  {/* Left: Icon & Name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={clsx(
                      "w-2.5 h-2.5 rounded-full shadow-sm transition-colors shrink-0",
                      isActive ? "bg-purple-500" : "bg-slate-300 group-hover:bg-purple-400"
                    )} />
                    <span className={clsx("text-sm font-medium truncate", isActive ? "text-purple-900" : "text-slate-600")}>
                      {model.name}
                    </span>
                  </div>

                  {/* Right: X Button (always visible) or Counter */}
                  {isActive ? (
                    <div className="flex items-center bg-white rounded-md border border-purple-100 shadow-sm overflow-hidden ml-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onRemoveLastInstance(model.id as ModelId)}
                        className="p-1.5 hover:bg-purple-50 text-slate-500 hover:text-red-500 transition-colors border-r border-purple-100"
                      >
                        <Minus size={12} />
                      </button>

                      <div className="w-6 text-center text-xs font-semibold text-purple-700 tabular-nums">
                        {count}
                      </div>

                      <button
                        onClick={() => {
                          if (!isMaxed) {
                            const confirmed = confirm(
                              `🚀 ${model.name} 모델을 추가하시겠습니까 ?\n\n` +
                              `새 대화를 시작하고 자유롭게, \n` +
                              `${model.name}에서 상담받거나 뭔가를 요청하자.`
                            );
                            if (confirmed) {
                              onAddModel(model.id as ModelId);
                            }
                          }
                        }}
                        disabled={isMaxed}
                        className={clsx(
                          "p-1.5 transition-colors border-l border-purple-100",
                          isMaxed
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                            : "hover:bg-purple-50 text-slate-500 hover:text-purple-600"
                        )}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ) : (
                    // ✅ Inactive: X 버튼 (설정에서 삭제)
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const confirmed = confirm(`❌ "${model.name}" 모델을 삭제하시겠습니까 ? `);
                          if (confirmed) {
                            const { removeBYOKVariant } = await import('../services/byokService');
                            await removeBYOKVariant(model.providerId as any, model.variantId as string);
                            // Reload to reflect changes
                            window.location.reload();
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="삭제"
                      >
                        <X size={14} />
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={14} className="text-purple-400" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Standard Models Section */}
        <div className="space-y-1">
          {byokModels.length > 0 && (
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">
              <span>Standard Models</span>
            </div>
          )}
          {Object.values(SUPPORTED_MODELS).map((model) => {
            const count = getModelCount(model.id);
            const isActive = count > 0;
            const isMaxed = count >= 3;

            return (
              <div
                key={model.id}
                className={twMerge(
                  "group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent select-none",
                  isActive
                    ? "bg-slate-50 border-slate-200 shadow-sm"
                    : "hover:bg-slate-50 opacity-70 hover:opacity-100 cursor-pointer"
                )}
                onClick={() => !isActive && onAddModel(model.id)}
              >
                {/* Left: Icon & Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={clsx(
                    "w-2.5 h-2.5 rounded-full shadow-sm transition-colors shrink-0",
                    isActive ? model.iconColor : "bg-slate-300 group-hover:bg-slate-400"
                  )} />
                  <span className={clsx("text-sm font-medium truncate", isActive ? "text-slate-800" : "text-slate-500")}>
                    {model.name}
                  </span>
                </div>

                {/* Right: Counter Controls */}
                {isActive ? (
                  <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onRemoveLastInstance(model.id)}
                      className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors border-r border-slate-100"
                    >
                      <Minus size={12} />
                    </button>

                    <div className="w-6 text-center text-xs font-semibold text-slate-700 tabular-nums">
                      {count}
                    </div>

                    <button
                      onClick={() => !isMaxed && onAddModel(model.id)}
                      disabled={isMaxed}
                      className={clsx(
                        "p-1.5 transition-colors border-l border-slate-100",
                        isMaxed
                          ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                          : "hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                      )}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                ) : (
                  // Inactive State Hover Indicator
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={14} className="text-slate-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col pt-4 shrink-0 z-30 relative">
      {/* Primary Navigation */}
      <div className="px-4 mb-6">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.id === currentView || (item.id === 'chats' && currentView === 'chats');

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'chats' || item.id === 'models' || item.id === 'history') {
                    onViewChange(item.id as SidebarView);
                  } else if (item.id === 'prompts') {
                    onTriggerPrompt();
                  } else if (item.id === 'settings') {
                    onTriggerSettings();
                  }
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-slate-100 text-slate-900 shadow-sm"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Content Header */}
      <div className="px-7 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
        <span>
          {currentView === 'chats' ? t('sidebar.activeSessions') :
            currentView === 'history' ? 'Conversation History' :
              t('sidebar.availableModels')}
        </span>
        {currentView === 'models' && (
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{t('sidebar.maxInstancesHint')}</span>
        )}
      </div>

      {/* Dynamic List Content */}
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
        {renderContent()}
      </div>

      {/* Bottom User Profile Skeleton */}
      <div className="p-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-inner ring-2 ring-white" />
          <div className="flex flex-col">
            <div className="text-xs font-bold text-slate-700">{t('sidebar.proUser')}</div>
            <div className="text-[10px] text-slate-500">{t('sidebar.versionLabel')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
