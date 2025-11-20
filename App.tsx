
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelGrid } from './components/ModelGrid';
import { MainBrainPanel } from './components/MainBrainPanel';
import { Header } from './components/Header';
import { ChatMessageInput } from './components/ChatMessageInput'; // Import
import { ModelId } from './types';

const App: React.FC = () => {
  const [activeModels, setActiveModels] = useState<ModelId[]>(['gemini', 'claude']);
  const [mainBrainId, setMainBrainId] = useState<ModelId | null>(null);

  const toggleModel = (id: ModelId) => {
    if (activeModels.includes(id)) {
      // If removing the main brain, reset main brain state
      if (mainBrainId === id) {
        setMainBrainId(null);
      }
      setActiveModels(activeModels.filter((m) => m !== id));
    } else {
      setActiveModels([...activeModels, id]);
    }
  };

  const handleSetMainBrain = (id: ModelId) => {
    setMainBrainId(id);
  };

  const handleRemoveMainBrain = () => {
    setMainBrainId(null);
  };

  const handleCloseModel = (id: ModelId) => {
    toggleModel(id);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white text-slate-800 font-sans overflow-hidden selection:bg-blue-100">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeModels={activeModels} 
          onToggleModel={toggleModel} 
        />

        {/* Main Content Area - Flex Column to hold Viewport + Input */}
        <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-100">
          
          {/* Model Viewport (Grid + Main Brain) */}
          <div className="flex-1 flex overflow-hidden">
            {activeModels.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-200 animate-pulse" />
                <p>Select a model from the sidebar to get started</p>
              </div>
            ) : (
              <>
                {/* Grid Area */}
                <div className={`transition-all duration-300 ease-in-out ${mainBrainId ? 'w-1/3 min-w-[350px] border-r border-slate-200' : 'w-full'}`}>
                  <ModelGrid 
                    activeModelIds={activeModels} 
                    mainBrainId={mainBrainId}
                    onSetMainBrain={handleSetMainBrain}
                    onCloseModel={handleCloseModel}
                  />
                </div>

                {/* Main Brain Area */}
                {mainBrainId && (
                  <MainBrainPanel 
                    modelId={mainBrainId} 
                    onRemoveMainBrain={handleRemoveMainBrain}
                    onClose={() => handleCloseModel(mainBrainId)}
                  />
                )}
              </>
            )}
          </div>

          {/* Global Chat Input Footer */}
          {activeModels.length > 0 && (
             <ChatMessageInput activeModelIds={activeModels} mainBrainId={mainBrainId} />
          )}
          
        </main>
      </div>
    </div>
  );
};

export default App;
