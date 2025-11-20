
import React from 'react';
import { ModelConfig } from '../types';
import { ModelFrame } from './ModelFrame';
import { Crown, X, Maximize2, Minimize2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ModelCardProps {
  model: ModelConfig;
  isMainBrain?: boolean;
  onSetMainBrain?: () => void;
  onRemoveMainBrain?: () => void;
  onClose?: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ 
  model, 
  isMainBrain = false, 
  onSetMainBrain, 
  onRemoveMainBrain,
  onClose 
}) => {
  return (
    <div className={clsx(
      "bg-white relative overflow-hidden flex flex-col h-full transition-all duration-300",
      isMainBrain ? "border-2 border-amber-400 shadow-lg z-20" : "border-r border-b border-slate-200"
    )}>
      {/* Model Header Bar */}
      <div className={clsx(
        "h-10 flex items-center px-3 justify-between z-10 transition-colors select-none",
        isMainBrain ? "bg-amber-50 border-b border-amber-200" : "bg-white border-b border-slate-100"
      )}>
        <div className="flex items-center gap-2">
          <div className={clsx("w-2 h-2 rounded-full", model.iconColor)} />
          <span className={clsx(
            "font-semibold text-sm tracking-tight",
            isMainBrain ? "text-amber-900" : "text-slate-700"
          )}>
            {model.name}
            {isMainBrain && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold uppercase">Main Brain</span>}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Main Brain Toggle */}
          {!isMainBrain && onSetMainBrain && (
            <button 
              onClick={(e) => { e.stopPropagation(); onSetMainBrain(); }}
              title="Set as Main Brain"
              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-all"
            >
              <Crown size={15} />
            </button>
          )}

          {/* Demote Main Brain */}
          {isMainBrain && onRemoveMainBrain && (
            <button 
              onClick={(e) => { e.stopPropagation(); onRemoveMainBrain(); }}
              title="Return to Grid"
              className="p-1.5 text-amber-600 hover:text-slate-600 hover:bg-amber-100 rounded-md transition-all"
            >
              <Minimize2 size={15} />
            </button>
          )}

          {/* Close Model */}
          {onClose && (
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              title="Close Model"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Iframe/Webview Container */}
      <div className="flex-1 relative bg-slate-50">
        {/* Pass model.id so ModelFrame can register with registry */}
        <ModelFrame modelId={model.id} url={model.url} title={model.name} />
      </div>
    </div>
  );
};
