import React, { useState, useEffect, useRef } from 'react';
import { webViewRegistry } from '../utils/webview-registry';
import { ModelId } from '../types';

interface ModelFrameProps {
  modelId: ModelId;
  url: string;
  title: string;
}

export const ModelFrame: React.FC<ModelFrameProps> = ({ modelId, url, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isElectron, setIsElectron] = useState(false);
  
  // Config for Electron mode
  const [preloadPath, setPreloadPath] = useState<string>('');
  const [userAgent, setUserAgent] = useState<string>('');
  
  const viewRef = useRef<any>(null);

  // 1. Environment Detection & Config Loading
  useEffect(() => {
    // Check if we are in Electron environment
    const api = (window as any).electronAPI;
    const hasElectron = !!api;
    setIsElectron(hasElectron);

    if (hasElectron) {
      // Electron Mode: Fetch stealth configs
      try {
        if (api.getPreloadPath) setPreloadPath(api.getPreloadPath());
        if (api.getUserAgent) setUserAgent(api.getUserAgent());
      } catch (e) {
        console.error("Error fetching electron config:", e);
      }
    } else {
      // Web/Iframe Mode: No config needed, but we stop loading immediately 
      // or wait for iframe onLoad.
      console.log("Running in Web/Preview mode. Switching to Iframe fallback.");
    }
  }, []);

  // 2. Registry & Event Listeners
  useEffect(() => {
    const element = viewRef.current;
    if (!element) return;

    // Register to registry (stores either <webview> or <iframe>)
    webViewRegistry.register(modelId, element);

    const handleLoadStart = () => setIsLoading(true);
    const handleLoadStop = () => setIsLoading(false);

    if (isElectron) {
      // --- Electron <webview> Events ---
      const handleDomReady = () => setIsLoading(false);
      
      // Safe check for isLoading method
      if (typeof element.isLoading === 'function' && !element.isLoading()) {
        setIsLoading(false);
      }

      element.addEventListener('dom-ready', handleDomReady);
      element.addEventListener('did-start-loading', handleLoadStart);
      element.addEventListener('did-stop-loading', handleLoadStop);
      element.addEventListener('did-finish-load', handleLoadStop);
      element.addEventListener('did-fail-load', handleLoadStop); // Safety

      return () => {
        webViewRegistry.unregister(modelId);
        element.removeEventListener('dom-ready', handleDomReady);
        element.removeEventListener('did-start-loading', handleLoadStart);
        element.removeEventListener('did-stop-loading', handleLoadStop);
        element.removeEventListener('did-finish-load', handleLoadStop);
        element.removeEventListener('did-fail-load', handleLoadStop);
      };
    } else {
      // --- Web <iframe> Events ---
      // For iframes, we rely mainly on the onLoad synthetic event in React,
      // but we can add a native listener just in case.
      element.addEventListener('load', handleLoadStop);
      
      // Fallback: Iframes don't always fire load if cached or blocked, 
      // so we force loading to false after a timeout to show the frame.
      const timer = setTimeout(() => setIsLoading(false), 2000);

      return () => {
        clearTimeout(timer);
        webViewRegistry.unregister(modelId);
        element.removeEventListener('load', handleLoadStop);
      };
    }
  }, [modelId, isElectron]);

  return (
    <div className="w-full h-full relative bg-white">
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
            </div>
            <span className="text-sm font-medium text-slate-500 animate-pulse">
              Loading {title}...
            </span>
          </div>
        </div>
      )}

      {/* Hybrid Rendering: Webview for Electron, Iframe for Web */}
      {isElectron ? (
        <webview
          ref={viewRef}
          src={url}
          partition={`persist:${modelId}`}
          preload={preloadPath}
          useragent={userAgent}
          allowpopups={true}
          className="w-full h-full flex"
          style={{ display: 'flex', height: '100%', width: '100%' }}
        />
      ) : (
        <iframe
          ref={viewRef}
          src={url}
          className="w-full h-full border-none"
          title={title}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  );
};