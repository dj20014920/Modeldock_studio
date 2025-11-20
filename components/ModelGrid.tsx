
import React from 'react';
import { ModelId } from '../types';
import { SUPPORTED_MODELS } from '../constants';
import { ModelCard } from './ModelCard';

interface ModelGridProps {
  activeModelIds: ModelId[];
  mainBrainId: ModelId | null;
  onSetMainBrain: (id: ModelId) => void;
  onCloseModel: (id: ModelId) => void;
}

export const ModelGrid: React.FC<ModelGridProps> = ({ 
  activeModelIds, 
  mainBrainId, 
  onSetMainBrain,
  onCloseModel 
}) => {
  // Filter out the main brain from the grid
  const gridModels = activeModelIds.filter(id => id !== mainBrainId);

  if (gridModels.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400">
        <p className="text-sm">All active models are in Main Brain view</p>
      </div>
    );
  }

  // Dynamic Grid Layout
  // If Main Brain is active, we force a single column for the side grid if strictly needed,
  // or let it auto-flow. For better UX:
  // - If Main Brain active: 1 column (sidebar style) or 2 columns depending on width.
  // - If No Main Brain: Auto fit up to 3 columns.
  
  const getGridStyle = () => {
    const count = gridModels.length;
    if (mainBrainId) {
      // Side-bar mode (when Main Brain is active)
      return {
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gridAutoRows: '1fr'
      };
    }
    // Full screen mode
    const cols = count === 1 ? 1 : count <= 4 ? 2 : 3;
    return {
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
    };
  };

  return (
    <div className="w-full h-full grid bg-slate-200 gap-px overflow-hidden" style={getGridStyle()}>
      {gridModels.map((id) => {
        const model = SUPPORTED_MODELS[id];
        return (
          <ModelCard 
            key={id}
            model={model}
            onSetMainBrain={() => onSetMainBrain(id)}
            onClose={() => onCloseModel(id)}
          />
        );
      })}
    </div>
  );
};
