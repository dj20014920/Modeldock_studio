
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ModelGrid } from './components/ModelGrid';
import { Header } from './components/Header';
import { SUPPORTED_MODELS } from './constants';
import { ModelId } from './types';

const App: React.FC = () => {
  // State to track which models are active in the grid
  // Defaulting to Gemini and Claude as per the screenshot
  const [activeModels, setActiveModels] = useState<ModelId[]>(['gemini', 'claude']);

  const toggleModel = (id: ModelId) => {
    if (activeModels.includes(id)) {
      setActiveModels(activeModels.filter((m) => m !== id));
    } else {
      setActiveModels([...activeModels, id]);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-white text-slate-800 font-sans overflow-hidden selection:bg-blue-100">
      {/* Custom Title Bar / Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar 
          activeModels={activeModels} 
          onToggleModel={toggleModel} 
        />

        {/* Main Content Area (Split Panes) */}
        <main className="flex-1 relative bg-slate-50">
          {activeModels.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-200 animate-pulse" />
              <p>Select a model from the sidebar to get started</p>
            </div>
          ) : (
            <ModelGrid activeModelIds={activeModels} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
