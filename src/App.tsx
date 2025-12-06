import React, { useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelGrid } from './components/ModelGrid';
import { Header } from './components/Header';
import { ChatMessageInput } from './components/ChatMessageInput';
import { PromptLibrary } from './components/PromptLibrary';
import { ModelCard } from './components/ModelCard';
import { SettingsModal } from './components/SettingsModal';
import { ModelId, ActiveModel, SidebarView, ChatMessage, ImageContentPart, MessageContentPart, BYOKProviderId } from './types';
import { SUPPORTED_MODELS } from './constants';
import { usePersistentState } from './hooks/usePersistentState';
import { HistoryService } from './services/historyService';
import { BYOKHistoryService } from './services/byokHistoryService';
import { BYOKAPIService as BYOKService, loadBYOKSettings } from './services/byokService';

export const App: React.FC = () => {
  // --- State ---
  const [activeModels, setActiveModels] = usePersistentState<ActiveModel[]>('md_active_models', []);
  const [mainBrainInstanceId, setMainBrainInstanceId] = usePersistentState<string | null>('md_main_brain', null);
  const [sidebarView, setSidebarView] = usePersistentState<SidebarView>('md_sidebar_view', 'chats');

  // History State
  const [currentConversationId, setCurrentConversationId] = usePersistentState<string | null>('md_current_conversation_id', null);

  // Modals
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = usePersistentState<boolean>('md_prompt_modal_open', false);
  const [isSettingsOpen, setIsSettingsOpen] = usePersistentState<boolean>('md_settings_modal_open', false);

  // Injected Text (from Prompt Library)
  const [injectedPromptText, setInjectedPromptText] = usePersistentState<string | null>('md_injected_prompt_text', null);

  // --- Resizable Main Brain Logic ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidthPercent, setGridWidthPercent] = usePersistentState<number>('md_grid_width_percent', 50); // Default 50%
  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    // 복원된 mainBrainInstanceId가 존재하지 않으면 정리
    if (mainBrainInstanceId && !activeModels.some(m => m.instanceId === mainBrainInstanceId)) {
      setMainBrainInstanceId(null);
    }
    // 로딩 시 모든 status를 idle로 초기화 (이전 세션의 sending 상태 남김 방지)
    if (activeModels.some(m => m.lastStatus && m.lastStatus !== 'idle')) {
      setActiveModels(prev => prev.map(m => ({ ...m, lastStatus: 'idle' })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 초기 1회만 실행

  // --- Auto-Save History Logic ---
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
  }, [activeModels, mainBrainInstanceId, currentConversationId]);

  // --- Load History Handler ---
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
      setSidebarView('chats'); // Switch back to chats view
    }
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        const totalWidth = containerRect.width;

        // Calculate max width for grid to ensure Main Brain has at least 400px
        const minMainBrainWidth = 400;
        const maxGridWidth = totalWidth - minMainBrainWidth;

        // Calculate min width (e.g., 20% or 300px)
        const minGridWidth = 300;

        let constrainedWidth = Math.max(minGridWidth, Math.min(newWidth, maxGridWidth));

        const newPercent = (constrainedWidth / totalWidth) * 100;
        setGridWidthPercent(newPercent);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- Helper: Get Model Config (supports BYOK models) ---
  const getModelConfig = useCallback((modelId: string) => {
    // Standard model check
    if (SUPPORTED_MODELS[modelId as ModelId]) {
      return SUPPORTED_MODELS[modelId as ModelId];
    }

    // BYOK model check
    // 모델 ID 형식: byok-{providerId}-{variantId} 또는 레거시: byok-{providerId}
    if (modelId.startsWith('byok-')) {
      const parts = modelId.replace('byok-', '').split('-');
      const providerId = parts[0];
      const variantId = parts.length > 1 ? parts.slice(1).join('-') : undefined;

      // 표시 이름: variantId가 있으면 모델명만 추출 (openai/gpt-4o → gpt-4o)
      const displayName = variantId
        ? (variantId.includes('/') ? variantId.split('/').pop()! : variantId)
        : (providerId.charAt(0).toUpperCase() + providerId.slice(1));

      return {
        id: modelId as ModelId,
        name: displayName,
        url: '',
        iconColor: 'bg-purple-500',
        themeColor: 'border-purple-300',
        excludeFromBrainFlow: false // BYOK 모델도 Brain Flow 사용 가능
      };
    }

    // Fallback for unknown models
    return {
      id: modelId as ModelId,
      name: modelId,
      url: '',
      iconColor: 'bg-gray-500',
      themeColor: 'border-gray-300',
      excludeFromBrainFlow: false
    };
  }, []);

  // --- Handlers ---
  const handleAddModel = (modelId: ModelId) => {
    const newInstanceId = `${modelId}-${Date.now()}`;
    setActiveModels(prev => [...prev, {
      modelId,
      instanceId: newInstanceId,
      lastStatus: 'idle',
      messages: []
    }]);
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
  }, []);

  const handleRemoveModel = (modelId: ModelId) => {
    setActiveModels(prev => {
      const modelsToRemove = prev.filter(m => m.modelId === modelId);
      // If main brain is one of them, clear it
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

    // 1. 사용자 메시지 추가 (이미지 포함 처리)
    const userMessage: ChatMessage = {
      role: 'user',
      content: (() => {
        // 이미지가 있으면 MessageContentPart[] 형태로 변환
        if (images && images.length > 0) {
          const parts: MessageContentPart[] = [];

          // 텍스트가 있으면 먼저 추가
          if (message.trim()) {
            parts.push({ type: 'text', text: message });
          }

          // 이미지들 추가
          parts.push(...images);

          return parts;
        }

        // 이미지가 없으면 단순 문자열 (하위 호환)
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
      // 2. BYOK 서비스 호출
      const modelIdParts = targetModel.modelId.replace('byok-', '').split('-');
      const providerId = modelIdParts[0] as BYOKProviderId;

      // ✅ chrome.storage.local에 저장된 최신 설정 불러오기
      const settings = await loadBYOKSettings();
      const config = settings.providers?.[providerId];

      if (!settings.enabled || !config?.apiKey) {
        throw new Error('API key가 설정되어 있지 않습니다. Settings → BYOK에서 활성화 및 키를 저장해주세요.');
      }

      const apiKey = config.apiKey.trim();

      // ✅ 모델 ID에서 variant 추출
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
        // Provider 기본 설정
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
        // 스트리밍 비활성화 (파서 이슈로 인해 보류)
        // TODO: streamUtils.ts의 addChunk 로직 수정 후 재활성화
        stream: false,
      });

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'API call failed');
      }

      // 3. 최종 메시지 구성 (스트리밍 완료 후)
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: apiResponse.content || '',
        timestamp: Date.now(),
        reasoning: apiResponse.reasoning,
        reasoningDetails: apiResponse.reasoningDetails
      };
      const finalMessages = [...newMessages, assistantMessage];

      // 4. 히스토리 저장
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
  }, [activeModels]);


  // BYOK 개별 채팅 초기화 (New Chat)
  const handleNewChat = async (instanceId: string) => {
    const targetModel = activeModels.find(m => m.instanceId === instanceId);
    if (!targetModel) return;

    // 현재 대화가 있는지 확인
    const hasMessages = targetModel.messages && targetModel.messages.length > 0;

    if (hasMessages) {
      // 확인 모달 표시
      const confirmed = confirm(
        '💬 새 대화를 시작하시겠습니까?\n\n' +
        '현재 대화는 자동으로 저장되며,\n' +
        '히스토리에서 언제든지 다시 불러올 수 있습니다.'
      );

      if (!confirmed) return;

      // 현재 대화 저장 (메시지가 있을 때만) - 저장 완료까지 대기
      try {
        // 모델 ID 형식: byok-{providerId}-{variantId}
        const modelIdParts = targetModel.modelId.replace('byok-', '').split('-');
        const providerId = modelIdParts[0] as BYOKProviderId;

        // variant 추출: 모델 ID에서 직접 추출 (설정 로드 불필요)
        const variant = modelIdParts.length > 1
          ? modelIdParts.slice(1).join('-')
          : 'default';

        const messagesToSave = targetModel.messages!; // hasMessages 검사 후이므로 안전

        console.log('[handleNewChat] Saving conversation before reset...', {
          providerId,
          variant,
          messageCount: messagesToSave.length,
          existingHistoryId: targetModel.byokHistoryId
        });

        const savedId = await BYOKHistoryService.getInstance().saveConversation(
          targetModel.byokHistoryId || null,
          providerId,
          variant,
          messagesToSave
        );

        console.log('[handleNewChat] Conversation saved successfully:', savedId);
      } catch (error) {
        console.error('[handleNewChat] Failed to save conversation:', error);
        // 저장 실패해도 새 대화 시작은 진행 (사용자 경험 우선)
      }
    }

    // 새 대화 시작 (메시지 초기화 + byokHistoryId 해제)
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

  // --- Derived State ---
  const mainBrainModel = activeModels.find(m => m.instanceId === mainBrainInstanceId);

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentView={sidebarView}
          onViewChange={setSidebarView}
          activeModels={activeModels}
          onAddModel={handleAddModel}
          onRemoveLastInstance={handleRemoveModel}
          onTriggerPrompt={() => setIsPromptLibraryOpen(true)}
          onTriggerSettings={() => setIsSettingsOpen(true)}
          onActivateInstance={setMainBrainInstanceId}
          mainBrainInstanceId={mainBrainInstanceId}
          onLoadHistory={handleLoadHistory}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-100 relative">

          {/* Model Grid / Main Brain Area */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative">
            {/* Main Brain Layout */}
            {mainBrainInstanceId && mainBrainModel ? (
              <div className="w-full h-full flex">
                {/* Resizable Main Brain Panel */}
                <div
                  className="relative h-full flex-shrink-0 transition-all duration-75 ease-out"
                  style={{ width: `${gridWidthPercent} % ` }}
                >
                  {/* Drag Handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-50 hover:bg-indigo-400/50 active:bg-indigo-500 transition-colors group flex items-center justify-center"
                    onMouseDown={startResizing}
                  >
                    <div className="w-0.5 h-8 bg-slate-300 rounded-full group-hover:bg-white/80" />
                  </div>

                  {/* Overlay during resizing */}
                  {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}

                  <div className="w-full h-full p-1">
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
                </div>

                {/* Remaining Grid (Right Side) */}
                <div className="flex-1 h-full min-w-0 bg-slate-200/50 border-l border-slate-200">
                  <ModelGrid
                    activeModels={activeModels}
                    mainBrainInstanceId={mainBrainInstanceId}
                    onSetMainBrain={setMainBrainInstanceId}
                    onCloseInstance={handleCloseSpecificInstance}
                    onSendMessage={handleSendBYOKMessage}
                    onLoadHistory={handleLoadHistory}
                    onNewChat={handleNewChat}
                    currentConversationId={currentConversationId}
                    onLoadBYOKHistory={handleLoadBYOKHistory}
                  />
                </div>
              </div>
            ) : (
              /* Standard Grid Layout */
              <div className="w-full h-full p-2">
                <ModelGrid
                  activeModels={activeModels}
                  mainBrainInstanceId={null}
                  onSetMainBrain={setMainBrainInstanceId}
                  onCloseInstance={handleCloseSpecificInstance}
                  onSendMessage={handleSendBYOKMessage}
                  onLoadHistory={handleLoadHistory}
                  onNewChat={handleNewChat}
                  currentConversationId={currentConversationId}
                  onLoadBYOKHistory={handleLoadBYOKHistory}
                />
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
