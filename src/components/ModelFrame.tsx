import React, { useState } from 'react';
import { ModelId } from '../types';

interface ModelFrameProps {
  modelId: ModelId;
  instanceId?: string;
  url: string;
  title: string;
  zoomLevel?: number;
  refreshKey?: number;
}

export const ModelFrame: React.FC<ModelFrameProps> = ({
  url,
  title,
  refreshKey = 0
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden group">
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
            </div>
            <span className="text-sm font-medium text-slate-500 animate-pulse">
              Connecting to {title}...
            </span>
          </div>
        </div>
      )}

      {/* Standard Iframe for Chrome Extension */}
      <iframe
        key={refreshKey}
        src={url}
        title={title}
        className="w-full h-full border-none"
        onLoad={() => setIsLoading(false)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone; camera; geolocation"
      />
    </div>
  );
};
