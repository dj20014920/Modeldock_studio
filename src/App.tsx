import React, { useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelGrid } from './components/ModelGrid';
import { Header } from './components/Header';
import { ChatMessageInput } from './components/ChatMessageInput';
import { PromptLibrary } from './components/PromptLibrary';
import { ModelCard } from './components/ModelCard';
import { SettingsModal } from './components/SettingsModal';
import { ModelId, ActiveModel, SidebarView, ChatMessage } from './types';
import { SUPPORTED_MODELS } from './constants';
import { X } from 'lucide-react';
import { usePersistentState } from './hooks/usePersistentState';
import { HistoryService } from './services/historyService';

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
      // Don't save if empty or no messages
      const hasMessages = activeModels.some(m => m.messages && m.messages.length > 0);
      if (!hasMessages) return;

      const newId = await HistoryService.getInstance().saveConversation(
        currentConversationId,
        activeModels,
        mainBrainInstanceId
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
      setActiveModels(content.activeModels);
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
    if (modelId.startsWith('byok-')) {
      const providerId = modelId.replace('byok-', '');
      return {
        id: modelId as ModelId,
        name: providerId.charAt(0).toUpperCase() + providerId.slice(1), // openai -> Openai
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

  // BYOK 개별 전송 핸들러 (인스턴스별)
  const handleSendBYOKMessage = useCallback(async (instanceId: string, message: string) => {
    const model = activeModels.find(m => m.instanceId === instanceId);
    if (!model || !model.modelId.startsWith('byok-')) {
      console.error('[App] Invalid BYOK model instance:', instanceId);
      return;
    }

    // 1. User 메시지 추가
    setActiveModels(prev => prev.map(m =>
      m.instanceId === instanceId
        ? { ...m, messages: [...(m.messages || []), { role: 'user', content: message, timestamp: Date.now() }], lastStatus: 'sending' }
        : m
    ));

    try {
      // 2. ChainOrchestrator를 통해 API 호출
      const { ChainOrchestrator } = await import('./services/chain-orchestrator');
      const response = await ChainOrchestrator.getInstance().sendMessage(model, message);

      // 3. Assistant 메시지 추가
      setActiveModels(prev => prev.map(m =>
        m.instanceId === instanceId
          ? {
            ...m,
            messages: [...(m.messages || []), { role: 'assistant', content: response, timestamp: Date.now() }],
            lastStatus: 'success'
          }
          : m
      ));

      // 4. 잠시 후 상태 초기화
      setTimeout(() => {
        setActiveModels(prev => prev.map(m =>
          m.instanceId === instanceId ? { ...m, lastStatus: 'idle' } : m
        ));
      }, 2000);

    } catch (error) {
      console.error('[App] BYOK send failed:', error);

      // 에러 메시지 추가
      setActiveModels(prev => prev.map(m =>
        m.instanceId === instanceId
          ? {
            ...m,
            messages: [...(m.messages || []), {
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
                  style={{ width: `${gridWidthPercent}%` }}
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
                      onSetMainBrain={() => { }}
                      onRemoveMainBrain={() => setMainBrainInstanceId(null)}
                      onClose={() => handleCloseSpecificInstance(mainBrainModel.instanceId)}
                      status={mainBrainModel.lastStatus}
                      messages={mainBrainModel.messages}
                      onSendMessage={async (msg) => handleSendBYOKMessage(mainBrainModel.instanceId, msg)}
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
          />
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Prompt Library Modal (if needed as modal) */}
      {isPromptLibraryOpen && (
        <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-xl w-3/4 h-3/4 relative flex flex-col">
            <button
              onClick={() => setIsPromptLibraryOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full"
            >
              <X size={20} />
            </button>
            <PromptLibrary
              isOpen={true}
              onClose={() => setIsPromptLibraryOpen(false)}
              onSelectPrompt={(content) => {
                handlePromptSelect(content);
                setIsPromptLibraryOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
