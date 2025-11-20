
import React from 'react';
import { Monitor, Shield, Info, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-[500px] max-w-[90%] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-lg text-slate-800">Settings</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Section 1 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Monitor size={14} /> Appearance
            </h3>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-sm font-medium text-slate-700">Theme</span>
              <select className="text-sm bg-white border border-slate-200 rounded px-2 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option>Light</option>
                <option disabled>Dark (Coming Soon)</option>
                <option disabled>System</option>
              </select>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Shield size={14} /> Privacy & Data
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">Clear Local Data</span>
                  <span className="text-xs text-slate-400">Removes local prompts and preferences.</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Clear all local settings?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="text-xs bg-white border border-red-200 text-red-600 px-3 py-1.5 rounded hover:bg-red-50 font-medium transition-colors"
                >
                  Clear Data
                </button>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Info size={14} /> About
            </h3>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                  MD
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900 text-sm">ModelDock</h4>
                  <p className="text-xs text-indigo-700">Version 1.0.0 (Stable)</p>
                </div>
              </div>
              <p className="text-xs text-indigo-600/80 leading-relaxed">
                A unified interface for multitask AI operations. Optimized for productivity and minimal context switching.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
