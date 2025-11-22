import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelGrid } from './components/ModelGrid';
import { Header } from './components/Header';
import { ChatMessageInput } from './components/ChatMessageInput';
import { PromptLibrary } from './components/PromptLibrary';
import { ModelCard } from './components/ModelCard';
import { SettingsModal } from './components/SettingsModal';
import { ModelId, ActiveModel, SidebarView } from './types';
import { SUPPORTED_MODELS } from './constants';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  // --- State ---
  const [activeModels, setActiveModels] = useState<ActiveModel[]>([]);
  const [mainBrainInstanceId, setMainBrainInstanceId] = useState<string | null>(null);
  const [sidebarView, setSidebarView] = useState<SidebarView>('chats');

  // Modals
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Injected Text (from Prompt Library)
  const [injectedPromptText, setInjectedPromptText] = useState<string | null>(null);

  // --- Resizable Main Brain Logic ---
  const containerRef = useRef<HTMLDivElement>(null);
  const [gridWidthPercent, setGridWidthPercent] = useState(50); // Default 50%
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

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

  // --- Handlers ---
  const handleAddModel = (modelId: ModelId) => {
    const newInstanceId = `${modelId}-${Date.now()}`;
    setActiveModels(prev => [...prev, { modelId, instanceId: newInstanceId, lastStatus: 'idle' }]);
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
                      model={SUPPORTED_MODELS[mainBrainModel.modelId]}
                      isMainBrain={true}
                      onSetMainBrain={() => { }}
                      onRemoveMainBrain={() => setMainBrainInstanceId(null)}
                      onClose={() => handleCloseSpecificInstance(mainBrainModel.instanceId)}
                      status={mainBrainModel.lastStatus}
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
                />
              </div>
            )}
          </div>

          {/* Global Chat Input */}
          <ChatMessageInput
            activeModelIds={activeModels.map(m => m.modelId)}
            mainBrainId={mainBrainModel?.modelId || null}
            forcedInputText={injectedPromptText}
            onInputHandled={() => setInjectedPromptText(null)}
            onStatusUpdate={handleStatusUpdate}
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
