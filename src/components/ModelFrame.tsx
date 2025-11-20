
import React, { useState } from 'react';
import { ModelId } from '../types';

interface ModelFrameProps {
  modelId: ModelId;
  url: string;
  title: string;
  zoomLevel?: number; // Ignored in pure iframe but kept for compatibility
  refreshKey?: number;
}

export const ModelFrame: React.FC<ModelFrameProps> = ({ modelId, url, title, refreshKey }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="w-full h-full relative bg-white group">
      {/* Loading Indicator */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-none">
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

      {/* Error Hint */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50 p-6">
           <div className="text-center max-w-md">
              <h3 className="text-red-500 font-bold mb-2">Failed to load {title}</h3>
              <p className="text-sm text-slate-600 mb-4">
                Please ensure you have loaded this as an <strong>Unpacked Extension</strong> in Chrome.
                Standard web previews cannot display these sites due to security policies.
              </p>
           </div>
        </div>
      )}

      {/* 
         Standard Iframe for Chrome Extension.
         The 'net_request_rules.json' in manifest removes X-Frame-Options and CSP, 
         allowing these sites to load within the extension page.
      */}
      <iframe
        key={refreshKey}
        src={url}
        className="w-full h-full border-none"
        title={title}
        referrerPolicy="no-referrer"
        // Allow standard permissions. Note: 'allow-same-origin' is crucial for cookie sharing (Google Login).
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation allow-downloads"
        allow="microphone; camera; geolocation; clipboard-read; clipboard-write"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};
