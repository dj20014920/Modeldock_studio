
import React, { useState, useEffect, useRef } from 'react';
import { ModelId } from '../types';
import { webViewRegistry } from '../utils/webview-registry';

interface ModelFrameProps {
  modelId: ModelId;
  instanceId?: string; // Make optional to support legacy usages, but should be passed
  url: string;
  title: string;
  zoomLevel?: number;
  refreshKey?: number;
}

export const ModelFrame: React.FC<ModelFrameProps> = ({ 
  modelId, 
  instanceId,
  url, 
  title,
  zoomLevel = 1.0,
  refreshKey = 0
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const webviewRef = useRef<any>(null);
  const uniqueKey = instanceId || modelId; // Fallback

  // Register webview with registry
  useEffect(() => {
    const currentWebview = webviewRef.current;
    if (currentWebview) {
      webViewRegistry.register(uniqueKey, currentWebview);

      // Setup event listeners
      const handleDidFinishLoad = () => setIsLoading(false);
      currentWebview.addEventListener('did-finish-load', handleDidFinishLoad);

      return () => {
        webViewRegistry.unregister(uniqueKey);
        if (currentWebview) {
          currentWebview.removeEventListener('did-finish-load', handleDidFinishLoad);
        }
      };
    }
  }, [uniqueKey, refreshKey]);

  // Handle Zoom
  useEffect(() => {
    const currentWebview = webviewRef.current;
    if (currentWebview && currentWebview.setZoomLevel) {
        // Electron Zoom Level is different from CSS scale.
        // 0 is 100%, positive is larger.
        // Approximation: Math.log2(scale)
        const electronZoom = Math.log2(zoomLevel);
        currentWebview.setZoomLevel(electronZoom);
    }
  }, [zoomLevel]);

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

      {/* Electron WebView */}
      <webview
        key={refreshKey}
        ref={webviewRef}
        src={url}
        style={{ width: '100%', height: '100%' }}
        partition={`persist:${modelId}`} // Share session cookies per model type
        allowpopups={true}
        // @ts-ignore - useragent attribute is valid in Electron
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      />
    </div>
  );
};
