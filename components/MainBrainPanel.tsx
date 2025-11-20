
import React from 'react';
import { ModelId } from '../types';
import { SUPPORTED_MODELS } from '../constants';
import { ModelCard } from './ModelCard';

interface MainBrainPanelProps {
  modelId: ModelId;
  instanceId: string;
  onRemoveMainBrain: () => void;
  onClose: () => void;
}

export const MainBrainPanel: React.FC<MainBrainPanelProps> = ({ 
  modelId, 
  instanceId,
  onRemoveMainBrain,
  onClose 
}) => {
  const model = SUPPORTED_MODELS[modelId];

  if (!model) return null;

  return (
    <div className="flex-1 h-full flex flex-col min-w-[400px] shadow-xl z-20">
      <ModelCard 
        key={instanceId}
        model={model}
        isMainBrain={true}
        onRemoveMainBrain={onRemoveMainBrain}
        onClose={onClose}
      />
    </div>
  );
};
