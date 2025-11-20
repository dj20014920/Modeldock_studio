import React from 'react';
import { ModelId } from '../types';
import { SUPPORTED_MODELS, NAV_ITEMS } from '../constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  activeModels: ModelId[];
  onToggleModel: (id: ModelId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeModels, onToggleModel }) => {
  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col pt-4">
      {/* Primary Navigation */}
      <div className="px-4 mb-8">
        <div className="space-y-1">
          {NAV_ITEMS.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-lg cursor-pointer transition-colors text-sm font-medium">
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model List Title */}
      <div className="px-7 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Active Models
      </div>

      {/* Model Selection List */}
      <div className="flex-1 px-4 space-y-1 overflow-y-auto">
        {Object.values(SUPPORTED_MODELS).map((model) => {
          const isActive = activeModels.includes(model.id);
          return (
            <div
              key={model.id}
              onClick={() => onToggleModel(model.id)}
              className={twMerge(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent",
                isActive 
                  ? "bg-slate-50 border-slate-200 shadow-sm" 
                  : "hover:bg-slate-50 opacity-70 hover:opacity-100"
              )}
            >
              <div className={clsx("w-2.5 h-2.5 rounded-full shadow-sm transition-colors", isActive ? model.iconColor : "bg-slate-300 group-hover:bg-slate-400")} />
              <span className={clsx("text-sm font-medium", isActive ? "text-slate-800" : "text-slate-500")}>
                {model.name}
              </span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-slate-800 rounded-full" />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom User Profile Skeleton */}
      <div className="p-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-inner" />
          <div className="flex flex-col">
            <div className="h-3 w-20 bg-slate-200 rounded mb-1" />
            <div className="h-2 w-12 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    </aside>
  );
};