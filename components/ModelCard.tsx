
import React, { useState, useCallback } from 'react';
import { ModelConfig } from '../types';
import { ModelFrame } from './ModelFrame';
import { Crown, X, Minimize2, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
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
  // State for Frame Controls
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.1, 1.5)); // Max 150%
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); // Min 50%
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Formatter for zoom percentage
  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <div className={clsx(
      "bg-white relative overflow-hidden flex flex-col h-full transition-all duration-300",
      isMainBrain ? "border-2 border-amber-400 shadow-lg z-20" : "border-r border-b border-slate-200"
    )}>
      {/* Model Header Bar */}
      <div className={clsx(
        "h-11 flex items-center px-3 justify-between z-10 transition-colors select-none shrink-0",
        isMainBrain ? "bg-amber-50 border-b border-amber-200" : "bg-white border-b border-slate-100"
      )}>
        {/* Left: Identity */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div className={clsx("w-2.5 h-2.5 rounded-full shrink-0 shadow-sm", model.iconColor)} />
          <span className={clsx(
            "font-semibold text-sm tracking-tight truncate",
            isMainBrain ? "text-amber-900" : "text-slate-700"
          )}>
            {model.name}
            {isMainBrain && <span className="ml-2 text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-bold uppercase hidden sm:inline-block">Main Brain</span>}
          </span>
        </div>
        
        {/* Right: Controls */}
        <div className="flex items-center gap-1 ml-2">
          
          {/* Zoom Controls Group */}
          <div className="hidden sm:flex items-center bg-slate-50 rounded-md mr-2 border border-slate-200 shadow-sm">
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-l-md transition-colors disabled:opacity-30"
              disabled={zoomLevel <= 0.5}
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-medium text-slate-600 w-9 text-center font-mono tabular-nums">
              {zoomPercent}%
            </span>
            <button 
              onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-r-md transition-colors disabled:opacity-30"
              disabled={zoomLevel >= 1.5}
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
          </div>

          {/* Refresh */}
          <button 
            onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
            title="Refresh"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
          >
            <RotateCw size={15} />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

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

      {/* Iframe Container */}
      <div className="flex-1 relative bg-slate-50 overflow-hidden">
        <ModelFrame 
          modelId={model.id} 
          url={model.url} 
          title={model.name} 
          zoomLevel={zoomLevel}
          refreshKey={refreshKey}
        />
      </div>
    </div>
  );
};
