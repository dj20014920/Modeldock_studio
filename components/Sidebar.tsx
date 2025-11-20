
import React from 'react';
import { ModelId, ActiveModel, SidebarView } from '../types';
import { SUPPORTED_MODELS, NAV_ITEMS } from '../constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Plus, Minus, MessageSquare, ArrowRight, Crown } from 'lucide-react';

interface SidebarProps {
  activeModels: ActiveModel[];
  currentView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  onTriggerPrompt: () => void;
  onTriggerSettings: () => void;
  onAddModel: (id: ModelId) => void;
  onRemoveLastInstance: (id: ModelId) => void;
  onActivateInstance: (instanceId: string) => void;
  mainBrainInstanceId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeModels, 
  currentView,
  onViewChange,
  onTriggerPrompt,
  onTriggerSettings,
  onAddModel, 
  onRemoveLastInstance,
  onActivateInstance,
  mainBrainInstanceId
}) => {
  
  // Helper to get count of instances per model
  const getModelCount = (id: ModelId) => activeModels.filter(m => m.modelId === id).length;

  // Render Logic based on View
  const renderContent = () => {
    if (currentView === 'chats') {
      // --- CHATS VIEW (Active Instances) ---
      if (activeModels.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <MessageSquare size={24} className="text-slate-300 mb-2" />
            <p className="text-xs text-slate-400">No active chats.</p>
            <button 
              onClick={() => onViewChange('models')}
              className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
            >
              Start a new chat
            </button>
          </div>
        );
      }

      return (
        <div className="space-y-1 px-4">
           {activeModels.map((instance, idx) => {
             const modelConfig = SUPPORTED_MODELS[instance.modelId];
             const isMain = instance.instanceId === mainBrainInstanceId;
             
             return (
               <div 
                 key={instance.instanceId}
                 onClick={() => onActivateInstance(instance.instanceId)}
                 className={clsx(
                   "group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                   isMain 
                    ? "bg-amber-50 border-amber-200" 
                    : "bg-white border-slate-100 hover:border-indigo-200"
                 )}
               >
                 <div className={clsx("w-2 h-2 rounded-full shrink-0", modelConfig.iconColor)} />
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 truncate">
                        {modelConfig.name}
                      </span>
                      {isMain && <Crown size={12} className="text-amber-500" />}
                   </div>
                   <p className="text-[10px] text-slate-400 truncate font-mono">
                     #{instance.instanceId.split('-').pop()}
                   </p>
                 </div>
                 <ArrowRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
               </div>
             );
           })}
        </div>
      );
    }

    // --- MODELS VIEW (Add New) ---
    return (
      <div className="px-4 space-y-1">
        {Object.values(SUPPORTED_MODELS).map((model) => {
          const count = getModelCount(model.id);
          const isActive = count > 0;
          const isMaxed = count >= 3;

          return (
            <div
              key={model.id}
              className={twMerge(
                "group flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent select-none",
                isActive 
                  ? "bg-slate-50 border-slate-200 shadow-sm" 
                  : "hover:bg-slate-50 opacity-70 hover:opacity-100 cursor-pointer"
              )}
              onClick={() => !isActive && onAddModel(model.id)}
            >
              {/* Left: Icon & Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className={clsx(
                  "w-2.5 h-2.5 rounded-full shadow-sm transition-colors shrink-0", 
                  isActive ? model.iconColor : "bg-slate-300 group-hover:bg-slate-400"
                )} />
                <span className={clsx("text-sm font-medium truncate", isActive ? "text-slate-800" : "text-slate-500")}>
                  {model.name}
                </span>
              </div>

              {/* Right: Counter Controls */}
              {isActive ? (
                <div className="flex items-center bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden ml-2" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => onRemoveLastInstance(model.id)}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors border-r border-slate-100"
                  >
                    <Minus size={12} />
                  </button>
                  
                  <div className="w-6 text-center text-xs font-semibold text-slate-700 tabular-nums">
                    {count}
                  </div>
                  
                  <button 
                    onClick={() => !isMaxed && onAddModel(model.id)}
                    disabled={isMaxed}
                    className={clsx(
                      "p-1.5 transition-colors border-l border-slate-100",
                      isMaxed 
                        ? "bg-slate-50 text-slate-300 cursor-not-allowed" 
                        : "hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                    )}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                // Inactive State Hover Indicator
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus size={14} className="text-slate-400" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col pt-4 shrink-0 z-30 relative">
      {/* Primary Navigation */}
      <div className="px-4 mb-6">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => {
             const isActive = (item.id === 'chats' || item.id === 'models') ? currentView === item.id : false;
             
             return (
              <button 
                key={item.id} 
                onClick={() => {
                  if (item.id === 'chats' || item.id === 'models') {
                    onViewChange(item.id);
                  } else if (item.id === 'prompts') {
                    onTriggerPrompt();
                  } else if (item.id === 'settings') {
                    onTriggerSettings();
                  }
                }}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive 
                    ? "bg-slate-100 text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon size={18} className={isActive ? "text-indigo-600" : "text-slate-400"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Content Header */}
      <div className="px-7 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
        <span>
          {currentView === 'chats' ? 'Active Sessions' : 'Available Models'}
        </span>
        {currentView === 'models' && (
           <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">Max 3</span>
        )}
      </div>

      {/* Dynamic List Content */}
      <div className="flex-1 overflow-y-auto pb-4 scrollbar-hide">
        {renderContent()}
      </div>

      {/* Bottom User Profile Skeleton */}
      <div className="p-4 border-t border-slate-100 mt-auto">
        <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-inner ring-2 ring-white" />
          <div className="flex flex-col">
            <div className="text-xs font-bold text-slate-700">Pro User</div>
            <div className="text-[10px] text-slate-500">ModelDock V1</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
