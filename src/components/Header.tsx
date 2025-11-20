import React from 'react';
import { Command } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="h-10 bg-white border-b border-slate-200 flex items-center justify-center relative select-none draggable-region">
      {/* Title */}
      <div className="flex items-center gap-2 text-slate-600 font-medium text-sm opacity-90">
        <Command size={14} />
        <span>modeldock</span>
      </div>
      
      {/* Window Controls Placeholder (Visual Only - macOS handles real ones) */}
      <div className="absolute left-0 top-0 h-full flex items-center px-4 gap-2">
        {/* These are invisible spacers to push content if we rendered custom controls, 
            but mainly here to respect the draggable region */}
      </div>
    </header>
  );
};