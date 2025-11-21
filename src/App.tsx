
import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelGrid } from './components/ModelGrid';
import { MainBrainPanel } from './components/MainBrainPanel';
import { Header } from './components/Header';
import { ChatMessageInput } from './components/ChatMessageInput';
import { PromptLibrary } from './components/PromptLibrary';
import { SettingsModal } from './components/SettingsModal';
import { ModelId, ActiveModel, SidebarView } from './types';
import { usePersistentState } from './hooks/usePersistentState';

const App: React.FC = () => {
  // --- Persistence Layer (Refactored) ---
  // Automatically handles loading, saving, and error recovery
  const [activeModels, setActiveModels] = usePersistentState<ActiveModel[]>('saved_workspace', [
    { modelId: 'gemini', instanceId: `gemini-${Date.now()}-1` },
    { modelId: 'claude', instanceId: `claude-${Date.now()}-2` }
  ]);

  const [mainBrainInstanceId, setMainBrainInstanceId] = usePersistentState<string | null>('saved_main_brain', null);
  const [sidebarView, setSidebarView] = usePersistentState<SidebarView>('saved_view', 'models');

  // --- UI State (Transient) ---
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [injectedPromptText, setInjectedPromptText] = useState<string | null>(null);

  // --- Resizable Layout State ---
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [gridWidthPercent, setGridWidthPercent] = usePersistentState<number>('grid_width_percent', 35);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = e.clientX - containerRect.left;
        const totalWidth = containerRect.width;
        let newPercent = (newWidth / totalWidth) * 100;

        // Constraints (Min 20%, Max 80%)
        if (newPercent < 20) newPercent = 20;
        if (newPercent > 80) newPercent = 80;

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
  }, [isResizing, setGridWidthPercent]);

  // --- Business Logic ---

  const handleAddModel = useCallback((id: ModelId) => {
    setActiveModels(prev => {
      const currentCount = prev.filter(m => m.modelId === id).length;
      if (currentCount >= 3) return prev; // Max limit per model

      const newInstance: ActiveModel = {
        modelId: id,
        instanceId: `${id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };



      return [...prev, newInstance];
    });
  }, [setActiveModels, setSidebarView]);

  const handleRemoveLastInstance = useCallback((id: ModelId) => {
    setActiveModels(prev => {
      const targets = prev.filter(m => m.modelId === id);
      if (targets.length === 0) return prev;

      const lastInstance = targets[targets.length - 1];

      // If we are removing the Main Brain, reset that state
      if (mainBrainInstanceId === lastInstance.instanceId) {
        setMainBrainInstanceId(null);
      }

      return prev.filter(m => m.instanceId !== lastInstance.instanceId);
    });
  }, [mainBrainInstanceId, setActiveModels, setMainBrainInstanceId]);

  const handleCloseSpecificInstance = useCallback((instanceId: string) => {
    if (mainBrainInstanceId === instanceId) {
      setMainBrainInstanceId(null);
    }
    setActiveModels(prev => prev.filter(m => m.instanceId !== instanceId));
  }, [mainBrainInstanceId, setMainBrainInstanceId, setActiveModels]);

  const handleSetMainBrain = (instanceId: string) => {
    setMainBrainInstanceId(instanceId);
  };

  const handleRemoveMainBrain = () => {
    setMainBrainInstanceId(null);
  };

  // Computed properties
  const activeModelTypes = Array.from(new Set(activeModels.map(m => m.modelId)));
  const mainBrainModel = activeModels.find(m => m.instanceId === mainBrainInstanceId);

  return (
    <div className="flex flex-col h-screen w-full bg-white text-slate-800 font-sans overflow-hidden selection:bg-indigo-100">
      <Header />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar
          activeModels={activeModels}
          currentView={sidebarView}
          onViewChange={setSidebarView}
          onTriggerPrompt={() => setIsPromptLibraryOpen(true)}
          onTriggerSettings={() => setIsSettingsOpen(true)}
          onAddModel={handleAddModel}
          onRemoveLastInstance={handleRemoveLastInstance}
          onActivateInstance={handleSetMainBrain}
          mainBrainInstanceId={mainBrainInstanceId}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-100">

          {/* Model Viewport (Grid + Main Brain) */}
          <div ref={containerRef} className="flex-1 flex overflow-hidden relative">
            {activeModels.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-full text-slate-400 flex-col gap-4 select-none">
                <div className="w-20 h-20 rounded-3xl bg-slate-200 animate-pulse flex items-center justify-center">
                  <span className="text-4xl">🤖</span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-600">No Active Models</h3>
                  <p className="text-sm mt-1">Select a model from the sidebar to launch your workspace.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Grid Area - Resizable */}
                <div
                  className={`transition-none relative z-10 ${mainBrainInstanceId ? 'border-r border-slate-200 shadow-sm' : 'w-full'}`}
                  style={{
                    width: mainBrainInstanceId ? `${gridWidthPercent}%` : '100%',
                    minWidth: mainBrainInstanceId ? '300px' : '100%'
                  }}
                >
                  <ModelGrid
                    activeModels={activeModels}
                    mainBrainInstanceId={mainBrainInstanceId}
                    onSetMainBrain={handleSetMainBrain}
                    onCloseInstance={handleCloseSpecificInstance}
                  />

                  {/* Overlay during resizing to prevent iframe capturing mouse events */}
                  {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}
                </div>

                {/* Resizer Handle */}
                {mainBrainInstanceId && (
                  <div
                    className={`w-1.5 hover:w-2 -ml-0.5 z-50 cursor-col-resize flex items-center justify-center hover:bg-indigo-500/50 transition-colors group select-none ${isResizing ? 'bg-indigo-600 w-2' : 'bg-transparent'}`}
                    onMouseDown={startResizing}
                  >
                    {/* Visual Handle Indicator */}
                    <div className={`h-8 w-1 rounded-full bg-slate-300 group-hover:bg-white transition-colors ${isResizing ? 'bg-white' : ''}`} />
                  </div>
                )}

                {/* Main Brain Area - Takes remaining space */}
                {mainBrainInstanceId && mainBrainModel && (
                  <div className="flex-1 min-w-[300px] relative">
                    {/* Overlay during resizing */}
                    {isResizing && <div className="absolute inset-0 z-50 bg-transparent" />}

                    <MainBrainPanel
                      modelId={mainBrainModel.modelId}
                      instanceId={mainBrainInstanceId}
                      onRemoveMainBrain={handleRemoveMainBrain}
                      onClose={() => handleCloseSpecificInstance(mainBrainInstanceId)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Global Chat Input Footer */}
          {activeModels.length > 0 && (
            <ChatMessageInput
              activeModelIds={activeModelTypes}
              mainBrainId={mainBrainModel?.modelId || null}
              forcedInputText={injectedPromptText}
              onInputHandled={() => setInjectedPromptText(null)}
            />
          )}

        </main>

        {/* Modals Layer (Portals conceptually) */}
        <PromptLibrary
          isOpen={isPromptLibraryOpen}
          onClose={() => setIsPromptLibraryOpen(false)}
          onSelectPrompt={(content) => setInjectedPromptText(content)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />

      </div>
    </div>
  );
};

export default App;
