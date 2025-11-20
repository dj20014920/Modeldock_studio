import React, { useState } from 'react';

interface ModelFrameProps {
  url: string;
  title: string;
}

export const ModelFrame: React.FC<ModelFrameProps> = ({ url, title }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading {title}...</p>
          </div>
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full border-none"
        title={title}
        onLoad={() => setIsLoading(false)}
        // Essential permissions for AI functionality (microphone for voice, etc.)
        allow="microphone; camera; clipboard-read; clipboard-write"
      />
    </div>
  );
};