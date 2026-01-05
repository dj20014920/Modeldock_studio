/**
 * SidePanelApp.tsx
 * 
 * Chrome Extension Side Panel용 전체 기능 애플리케이션.
 * 좁은 폭에 최적화된 레이아웃으로 메인 앱의 모든 기능 제공.
 * 
 * 핵심 기능:
 * - 여러 모델 동시 사용 (ModelGrid)
 * - Main Brain 기능
 * - Auto-Routing / Brain Flow
 * - BYOK API 지원
 * - 대화 히스토리 관리
 * - 접을 수 있는 Sidebar (오버레이 모드)
 */
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

import { Sidebar } from './components/Sidebar';
import { ModelCard } from './components/ModelCard';
import { ChatMessageInput } from './components/ChatMessageInput';
import { PromptLibrary } from './components/PromptLibrary';
import { SettingsModal } from './components/SettingsModal';
import { ModelId, ActiveModel, SidebarView, ChatMessage, ImageContentPart, MessageContentPart, BYOKProviderId } from './types';
import { SUPPORTED_MODELS, INPUT_SELECTORS } from './constants';
import { usePersistentState } from './hooks/usePersistentState';
import { HistoryService } from './services/historyService';
import { BYOKHistoryService } from './services/byokHistoryService';
import { BYOKAPIService as BYOKService, loadBYOKSettings } from './services/byokService';

export const SidePanelApp: React.FC = () => {
  // === Side Panel Specific State ===
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // === State (App.tsx와 동일) ===
  const [activeModels, setActiveModels] = usePersistentState<ActiveModel[]>('sp_active_models', []);
  const [mainBrainInstanceId, setMainBrainInstanceId] = usePersistentState<string | null>('sp_main_brain', null);
  const [sidebarView, setSidebarView] = usePersistentState<SidebarView>('sp_sidebar_view', 'chats');

  // History State
  const [currentConversationId, setCurrentConversationId] = usePersistentState<string | null>('sp_current_conversation_id', null);

  // Modals
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = usePersistentState<boolean>('sp_prompt_modal_open', false);
  const [isSettingsOpen, setIsSettingsOpen] = usePersistentState<boolean>('sp_settings_modal_open', false);

  // Injected Text (from Prompt Library)
  const [injectedPromptText, setInjectedPromptText] = usePersistentState<string | null>('sp_injected_prompt_text', null);

  // Main Brain 리사이즈 로직은 사이드패널에서는 제거 (고정 레이아웃)
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 복원된 mainBrainInstanceId가 존재하지 않으면 정리
    if (mainBrainInstanceId && !activeModels.some(m => m.instanceId === mainBrainInstanceId)) {
      setMainBrainInstanceId(null);
    }
    // 로딩 시 모든 status를 idle로 초기화
    if (activeModels.some(m => m.lastStatus && m.lastStatus !== 'idle')) {
      setActiveModels(prev => prev.map(m => ({ ...m, lastStatus: 'idle' })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 1회만 실행

  // === Auto-Save History Logic ===
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      const hasMessages = activeModels.some(m => m.messages && m.messages.length > 0);
      if (!hasMessages) return;

      const historyMode = (() => {
        if (activeModels.some(m => m.historyMode === 'brainflow')) return 'brainflow' as const;
        if (activeModels.some(m => m.historyMode === 'auto-routing')) return 'auto-routing' as const;
        if (activeModels.some(m => m.historyMode === 'byok')) return 'byok' as const;
        if (activeModels.some(m => m.historyMode === 'manual')) return 'manual' as const;
        return undefined;
      })();

      const newId = await HistoryService.getInstance().saveConversation(
        currentConversationId,
        activeModels,
        mainBrainInstanceId,
        {
          mode: historyMode,
          force: false
        }
      );

      if (newId !== currentConversationId) {
        setCurrentConversationId(newId);
      }
    }, 2000); // Debounce 2s

    return () => clearTimeout(saveTimer);
  }, [activeModels, mainBrainInstanceId, currentConversationId, setCurrentConversationId]);

  // === Load History Handler ===
  const handleLoadHistory = async (id: string) => {
    const content = await HistoryService.getInstance().loadConversation(id);
    if (content) {
      let loadedModels = content.activeModels.map(model => ({ ...model }));

      if (content.mode) {
        loadedModels = loadedModels.map(m => m.historyMode ? m : { ...m, historyMode: content.mode! });
      }
      if (content.lastPrompt) {
        loadedModels = loadedModels.map(m => m.lastPrompt ? m : { ...m, lastPrompt: content.lastPrompt! });
      }

      setActiveModels(loadedModels);
      setMainBrainInstanceId(content.mainBrainId);
      setCurrentConversationId(content.id);
      setSidebarView('chats');
    }
  };

  // === Helper: Get Model Config ===
  const getModelConfig = useCallback((modelId: string) => {
    if (SUPPORTED_MODELS[modelId as ModelId]) {
      return SUPPORTED_MODELS[modelId as ModelId];
    }

    if (modelId.startsWith('byok-')) {
      const parts = modelId.replace('byok-', '').split('-');
      const providerId = parts[0];
      const variantId = parts.length > 1 ? parts.slice(1).join('-') : undefined;

      const displayName = variantId
        ? (variantId.includes('/') ? variantId.split('/').pop()! : variantId)
        : (providerId.charAt(0).toUpperCase() + providerId.slice(1));

      return {
        id: modelId as ModelId,
        name: displayName,
        url: '',
        iconColor: 'bg-purple-500',
        themeColor: 'border-purple-300',
        excludeFromBrainFlow: false
      };
    }

    return {
      id: modelId as ModelId,
      name: modelId,
      url: '',
      iconColor: 'bg-gray-500',
      themeColor: 'border-gray-300',
      excludeFromBrainFlow: false
    };
  }, []);

  // === Handlers (App.tsx와 동일) ===
  const handleAddModel = (modelId: ModelId) => {
    const newInstanceId = `${modelId}-${Date.now()}`;
    setActiveModels(prev => [...prev, {
      modelId,
      instanceId: newInstanceId,
      lastStatus: 'idle',
      messages: []
    }]);
    setSidebarOpen(false); // 모델 추가 후 사이드바 닫기
  };

  const handleMessageUpdate = (instanceId: string, message: ChatMessage) => {
    setActiveModels(prev => prev.map(m => {
      if (m.instanceId === instanceId) {
        return {
          ...m,
          messages: [...(m.messages || []), message]
        };
      }
      return m;
    }));
  };

  const handleModelMetadataUpdate = useCallback((instanceId: string, metadata: { conversationUrl?: string; historyMode?: 'auto-routing' | 'brainflow' | 'byok' | 'manual'; lastPrompt?: string }) => {
    setActiveModels(prev => prev.map(m => m.instanceId === instanceId ? { ...m, ...metadata } : m));
  }, [setActiveModels]);

  const handleRemoveModel = (modelId: ModelId) => {
    setActiveModels(prev => {
      const modelsToRemove = prev.filter(m => m.modelId === modelId);
      if (modelsToRemove.some(m => m.instanceId === mainBrainInstanceId)) {
        setMainBrainInstanceId(null);
      }
      return prev.filter(m => m.modelId !== modelId);
    });
  };

  const handleCloseSpecificInstance = (instanceId: string) => {
    if (mainBrainInstanceId === instanceId) {
      setMainBrainInstanceId(null);
    }
    setActiveModels(prev => prev.filter(m => m.instanceId !== instanceId));
  };

  const handleStatusUpdate = (modelId: ModelId, status: 'idle' | 'sending' | 'success' | 'error') => {
    setActiveModels(prev => prev.map(m =>
      m.modelId === modelId ? { ...m, lastStatus: status } : m
    ));
  };

  const handlePromptSelect = (content: string) => {
    setInjectedPromptText(content);
  };

  // BYOK 모델 개별 메시지 전송 핸들러
  const handleSendBYOKMessage = useCallback(async (instanceId: string, message: string, images?: ImageContentPart[]) => {
    const targetModel = activeModels.find(m => m.instanceId === instanceId);
    if (!targetModel) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: (() => {
        if (images && images.length > 0) {
          const parts: MessageContentPart[] = [];
          if (message.trim()) {
            parts.push({ type: 'text', text: message });
          }
          parts.push(...images);
          return parts;
        }
        return message;
      })(),
      timestamp: Date.now()
    };
    const newMessages = [...(targetModel.messages || []), userMessage];

    setActiveModels(prev => prev.map(m =>
      m.instanceId === instanceId
        ? { ...m, messages: newMessages, lastStatus: 'sending' }
        : m
    ));

    try {
      const modelIdParts = targetModel.modelId.replace('byok-', '').split('-');
      const providerId = modelIdParts[0] as BYOKProviderId;

      const settings = await loadBYOKSettings();
      const config = settings.providers?.[providerId];

      if (!settings.enabled || !config?.apiKey) {
        throw new Error('API key가 설정되어 있지 않습니다. Settings → BYOK에서 활성화 및 키를 저장해주세요.');
      }

      const apiKey = config.apiKey.trim();

      let variant: string | undefined;
      if (modelIdParts.length > 1) {
        variant = modelIdParts.slice(1).join('-');
      } else {
        variant = config.selectedVariants?.[0] || (config as any).selectedVariant;
      }

      if (!variant) {
        throw new Error('모델이 선택되지 않았습니다. BYOK 설정에서 모델을 선택해주세요.');
      }

      const apiResponse = await BYOKService.getInstance().callAPI({
        providerId,
        apiKey,
        variant,
        prompt: '',
        historyMessages: newMessages,
        temperature: config.customTemperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        topK: config.topK,
        reasoningEffort: config.reasoningEffort,
        thinkingBudget: config.thinkingBudget,
        thinkingLevel: config.thinkingLevel,
        enableThinking: config.enableThinking,
        frequencyPenalty: config.frequencyPenalty,
        presencePenalty: config.presencePenalty,
        stream: false,
      });

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'API call failed');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: apiResponse.content || '',
        timestamp: Date.now(),
        reasoning: apiResponse.reasoning,
        reasoningDetails: apiResponse.reasoningDetails
      };
      const finalMessages = [...newMessages, assistantMessage];

      const savedId = await BYOKHistoryService.getInstance().saveConversation(
        targetModel.byokHistoryId || null,
        providerId,
        variant,
        finalMessages
      );

      setActiveModels(prev => prev.map(m =>
        m.instanceId === instanceId
          ? { ...m, messages: finalMessages, lastStatus: 'success', byokHistoryId: savedId }
          : m
      ));

    } catch (error) {
      console.error('BYOK Send Error:', error);
      setActiveModels(prev => prev.map(m =>
        m.instanceId === instanceId
          ? {
            ...m,
            messages: [...newMessages, {
              role: 'assistant',
              content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
              timestamp: Date.now()
            }],
            lastStatus: 'error'
          }
          : m
      ));

      setTimeout(() => {
        setActiveModels(prev => prev.map(m =>
          m.instanceId === instanceId ? { ...m, lastStatus: 'idle' } : m
        ));
      }, 2000);
    }
  }, [activeModels, setActiveModels]);

  // BYOK 개별 채팅 초기화
  const handleNewChat = async (instanceId: string) => {
    const targetModel = activeModels.find(m => m.instanceId === instanceId);
    if (!targetModel) return;

    const hasMessages = targetModel.messages && targetModel.messages.length > 0;

    if (hasMessages) {
      const confirmed = confirm(
        '💬 새 대화를 시작하시겠습니까?\n\n' +
        '현재 대화는 자동으로 저장되며,\n' +
        '히스토리에서 언제든지 다시 불러올 수 있습니다.'
      );

      if (!confirmed) return;

      try {
        const modelIdParts = targetModel.modelId.replace('byok-', '').split('-');
        const providerId = modelIdParts[0] as BYOKProviderId;

        const variant = modelIdParts.length > 1
          ? modelIdParts.slice(1).join('-')
          : 'default';

        const messagesToSave = targetModel.messages!;

        await BYOKHistoryService.getInstance().saveConversation(
          targetModel.byokHistoryId || null,
          providerId,
          variant,
          messagesToSave
        );
      } catch (error) {
        console.error('[handleNewChat] Failed to save conversation:', error);
      }
    }

    setActiveModels(prev => prev.map(m =>
      m.instanceId === instanceId
        ? { ...m, messages: [], lastStatus: 'idle', byokHistoryId: undefined }
        : m
    ));
  };

  // BYOK 히스토리 로드
  const handleLoadBYOKHistory = async (historyId: string, targetInstanceId: string) => {
    try {
      const history = await BYOKHistoryService.getInstance().getConversation(historyId);
      if (history) {
        setActiveModels(prev => prev.map(m =>
          m.instanceId === targetInstanceId
            ? { ...m, messages: history.messages, byokHistoryId: history.id }
            : m
        ));
      }
    } catch (error) {
      console.error('Failed to load BYOK history:', error);
    }
  };

  // === Derived State ===
  const mainBrainModel = activeModels.find(m => m.instanceId === mainBrainInstanceId);

  // === Screenshot Handler ===
  const handleScreenshotCapture = useCallback(async (dataUrl: string) => {
    // 1. BYOK 모델(API 방식) 처리
    const byokModels = activeModels.filter(m => m.modelId.startsWith('byok-'));
    if (byokModels.length > 0) {
      const imageContent: ImageContentPart = {
        type: 'image_url',
        image_url: {
          url: dataUrl,
          detail: 'auto'
        }
      };
      const sendPromises = byokModels.map(model =>
        handleSendBYOKMessage(model.instanceId, '', [imageContent])
      );
      await Promise.all(sendPromises);
    }

    // 2. 일반 웹 모델(WebView/iframe) 처리 - 자동 붙여넣기 시도
    const webModels = activeModels.filter(m => !m.modelId.startsWith('byok-'));

    // 클립보드 복사 (백업 및 수동 붙여넣기용)
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
    } catch (error) {
      console.error('[SidePanelApp] Clipboard copy failed:', error);
    }

    if (webModels.length > 0) {
      // DataURL -> Injection Logic
      const visibleIframes = Array.from(document.querySelectorAll<HTMLIFrameElement>('iframe[data-md-frame="true"]'));

      let injectionCount = 0;
      const failedModels: string[] = [];

      for (const model of webModels) {
        // Find iframe for this model instance
        const targetFrame = visibleIframes.find(f => f.dataset.instanceId === model.instanceId);

        if (targetFrame && targetFrame.contentWindow) {
          try {
            const selectorConfig = INPUT_SELECTORS[model.modelId as keyof typeof INPUT_SELECTORS] || { inputSelector: 'textarea' };

            // Send injection message to content script
            targetFrame.contentWindow.postMessage({
              type: 'MODEL_DOCK_INJECT_IMAGE',
              payload: {
                dataUrl,
                targets: [{ modelId: model.modelId, ...selectorConfig }],
                requestId: `img-${Date.now()}-${model.instanceId}`
              }
            }, '*');

            injectionCount++;
          } catch (e) {
            console.warn(`Failed to inject image to ${model.modelId}`, e);
            failedModels.push(model.modelId);
          }
        } else {
          failedModels.push(model.modelId);
        }
      }

      // UX Feedback
      if (injectionCount > 0) {
        console.log(`[SidePanelApp] 📸 Image injected into ${injectionCount} web models`);
      }

      if (failedModels.length > 0 && injectionCount === 0) {
        // 모든 웹 모델에 실패한 경우에만 알림
        console.warn(`[SidePanelApp] Failed models: ${failedModels.join(', ')}`);
      }
    }

    // 전체 결과 로그
    const totalProcessed = byokModels.length + webModels.length;
    console.log(`[SidePanelApp] 📸 Screenshot processed. Total: ${totalProcessed} models`);
  }, [activeModels, handleSendBYOKMessage]);

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden relative">
      {/* Compact Header with Hamburger Menu */}
      <header className="h-12 bg-white border-b border-slate-200 flex items-center px-3 shrink-0 relative z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors mr-2"
          title="메뉴"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="flex items-center gap-2 text-slate-600 font-medium text-sm opacity-90">
          <span>ModelDock</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Overlay Sidebar */}
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 z-30 transition-opacity"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl z-40 transform transition-transform">
              <Sidebar
                currentView={sidebarView}
                onViewChange={setSidebarView}
                activeModels={activeModels}
                onAddModel={handleAddModel}
                onRemoveLastInstance={handleRemoveModel}
                onTriggerPrompt={() => { setIsPromptLibraryOpen(true); setSidebarOpen(false); }}
                onTriggerSettings={() => { setIsSettingsOpen(true); setSidebarOpen(false); }}
                onActivateInstance={(id) => { setMainBrainInstanceId(id); setSidebarOpen(false); }}
                mainBrainInstanceId={mainBrainInstanceId}
                onLoadHistory={(id) => { handleLoadHistory(id); setSidebarOpen(false); }}
              />
            </div>
          </>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">
          {/* Model Grid / Main Brain Area */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative">
            {/* 모델 개수에 따른 동적 레이아웃 */}
            {activeModels.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="text-slate-400 mb-4">
                  <Menu size={64} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">
                  모델을 선택해주세요
                </h2>
                <p className="text-slate-500 mb-4">
                  왼쪽 상단 메뉴를 열어<br />AI 모델을 추가하세요
                </p>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  메뉴 열기
                </button>
              </div>
            ) : activeModels.length === 1 ? (
              /* Single Model - Full Screen */
              <div className="w-full h-full">
                <ModelCard
                  model={getModelConfig(activeModels[0].modelId)}
                  instanceId={activeModels[0].instanceId}
                  isMainBrain={mainBrainInstanceId === activeModels[0].instanceId}
                  conversationUrl={activeModels[0].conversationUrl}
                  onSetMainBrain={() => setMainBrainInstanceId(activeModels[0].instanceId)}
                  onRemoveMainBrain={() => setMainBrainInstanceId(null)}
                  onClose={() => handleCloseSpecificInstance(activeModels[0].instanceId)}
                  status={activeModels[0].lastStatus}
                  messages={activeModels[0].messages}
                  onSendMessage={async (msg) => handleSendBYOKMessage(activeModels[0].instanceId, msg)}
                  onLoadHistory={handleLoadHistory}
                  onNewChat={() => handleNewChat(activeModels[0].instanceId)}
                  currentConversationId={currentConversationId}
                  onLoadBYOKHistory={(id) => handleLoadBYOKHistory(id, activeModels[0].instanceId)}
                  byokHistoryId={activeModels[0].byokHistoryId}
                />
              </div>
            ) : mainBrainInstanceId && mainBrainModel ? (
              /* Main Brain + Other Models (세로 분할) */
              <div className="w-full h-full flex flex-col">
                {/* Main Brain (상단 50%) */}
                <div className="h-1/2 border-b-2 border-slate-300">
                  <ModelCard
                    model={getModelConfig(mainBrainModel.modelId)}
                    instanceId={mainBrainModel.instanceId}
                    isMainBrain={true}
                    conversationUrl={mainBrainModel.conversationUrl}
                    onSetMainBrain={() => { }}
                    onRemoveMainBrain={() => setMainBrainInstanceId(null)}
                    onClose={() => handleCloseSpecificInstance(mainBrainModel.instanceId)}
                    status={mainBrainModel.lastStatus}
                    messages={mainBrainModel.messages}
                    onSendMessage={async (msg) => handleSendBYOKMessage(mainBrainModel.instanceId, msg)}
                    onLoadHistory={handleLoadHistory}
                    onNewChat={() => handleNewChat(mainBrainModel.instanceId)}
                    currentConversationId={currentConversationId}
                    onLoadBYOKHistory={(id) => handleLoadBYOKHistory(id, mainBrainModel.instanceId)}
                    byokHistoryId={mainBrainModel.byokHistoryId}
                  />
                </div>

                {/* Other Models (하단 50%) - 1열 스크롤 */}
                <div className="h-1/2 overflow-y-auto bg-slate-100 p-2">
                  <div className="flex flex-col gap-2">
                    {activeModels
                      .filter(m => m.instanceId !== mainBrainInstanceId)
                      .map((activeModel) => (
                        <div key={activeModel.instanceId} className="h-64 shrink-0">
                          <ModelCard
                            model={getModelConfig(activeModel.modelId)}
                            instanceId={activeModel.instanceId}
                            isMainBrain={false}
                            conversationUrl={activeModel.conversationUrl}
                            onSetMainBrain={() => setMainBrainInstanceId(activeModel.instanceId)}
                            onRemoveMainBrain={() => { }}
                            onClose={() => handleCloseSpecificInstance(activeModel.instanceId)}
                            status={activeModel.lastStatus}
                            messages={activeModel.messages}
                            onSendMessage={async (msg) => handleSendBYOKMessage(activeModel.instanceId, msg)}
                            onLoadHistory={handleLoadHistory}
                            onNewChat={() => handleNewChat(activeModel.instanceId)}
                            currentConversationId={currentConversationId}
                            onLoadBYOKHistory={(id) => handleLoadBYOKHistory(id, activeModel.instanceId)}
                            byokHistoryId={activeModel.byokHistoryId}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Multiple Models - Dynamic Grid (1 Column) */
              <div className="w-full h-full p-2 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  {activeModels.map((activeModel) => (
                    <div key={activeModel.instanceId} className="h-96 shrink-0">
                      <ModelCard
                        model={getModelConfig(activeModel.modelId)}
                        instanceId={activeModel.instanceId}
                        isMainBrain={false}
                        conversationUrl={activeModel.conversationUrl}
                        onSetMainBrain={() => setMainBrainInstanceId(activeModel.instanceId)}
                        onRemoveMainBrain={() => { }}
                        onClose={() => handleCloseSpecificInstance(activeModel.instanceId)}
                        status={activeModel.lastStatus}
                        messages={activeModel.messages}
                        onSendMessage={async (msg) => handleSendBYOKMessage(activeModel.instanceId, msg)}
                        onLoadHistory={handleLoadHistory}
                        onNewChat={() => handleNewChat(activeModel.instanceId)}
                        currentConversationId={currentConversationId}
                        onLoadBYOKHistory={(id) => handleLoadBYOKHistory(id, activeModel.instanceId)}
                        byokHistoryId={activeModel.byokHistoryId}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Global Chat Input */}
          <ChatMessageInput
            activeModels={activeModels}
            mainBrainId={mainBrainModel?.modelId || null}
            forcedInputText={injectedPromptText}
            onInputHandled={() => setInjectedPromptText(null)}
            onStatusUpdate={handleStatusUpdate}
            onMessageUpdate={handleMessageUpdate}
            onModelMetadataUpdate={handleModelMetadataUpdate}
            onScreenshotCapture={handleScreenshotCapture}
          />
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Prompt Library Modal */}
      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(content) => {
          handlePromptSelect(content);
          setIsPromptLibraryOpen(false);
        }}
      />
    </div>
  );
};

export default SidePanelApp;
