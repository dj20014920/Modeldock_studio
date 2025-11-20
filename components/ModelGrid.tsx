import React from 'react';
import { ModelId } from '../types';
import { SUPPORTED_MODELS } from '../constants';
import { ModelFrame } from './ModelFrame';

interface ModelGridProps {
  activeModelIds: ModelId[];
}

export const ModelGrid: React.FC<ModelGridProps> = ({ activeModelIds }) => {
  // Determine grid columns based on active count
  // 1 model = full width
  // 2 models = 2 cols
  // 3+ models = auto-fit (simplified for this demo to max 2 cols for aesthetics)
  const gridStyle = {
    gridTemplateColumns: `repeat(${Math.min(activeModelIds.length, 2)}, 1fr)`,
  };

  return (
    <div className="w-full h-full grid gap-px bg-slate-200" style={gridStyle}>
      {activeModelIds.map((id) => {
        const model = SUPPORTED_MODELS[id];
        return (
          <div key={id} className="bg-white relative overflow-hidden flex flex-col h-full">
            {/* Model Header Bar */}
            <div className="h-12 border-b border-slate-100 flex items-center px-4 justify-between bg-white z-10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${model.iconColor}`} />
                <span className="font-semibold text-sm text-slate-700 tracking-tight">{model.name}</span>
              </div>
              <button className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 relative">
              <ModelFrame url={model.url} title={model.name} />
              
              {/* Visual Overlay (Optional: To mimic the screenshot's clean look before login) 
                  In a real app, we might show this only if not logged in. 
                  For now, we render the iframe directly. 
              */}
            </div>
          </div>
        );
      })}
    </div>
  );
};