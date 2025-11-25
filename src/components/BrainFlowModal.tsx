import React, { useState, KeyboardEvent } from 'react';
import { X, Sparkles, BrainCircuit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

interface BrainFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (goal: string) => void;
    slaveCount: number;
}

export const BrainFlowModal: React.FC<BrainFlowModalProps> = ({ isOpen, onClose, onStart, slaveCount }) => {
    const { t } = useTranslation();
    const [goal, setGoal] = useState('');

    if (!isOpen) return null;

    const handleStart = () => {
        if (!goal.trim()) return;
        onStart(goal);
        onClose();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleStart();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-[600px] max-w-[90%] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                            <BrainCircuit size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                                {t('brainFlowModal.title')}
                            </h2>
                            <p className="text-sm text-slate-500 mt-0.5">
                                {t('brainFlowModal.subtitle', { count: slaveCount })}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block">
                            {t('brainFlowModal.goalLabel')}
                        </label>
                        <div className="relative">
                            <textarea
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={t('brainFlowModal.goalPlaceholder')}
                                className="w-full min-h-[120px] p-4 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all placeholder:text-slate-400 text-base leading-relaxed"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 px-1">
                            <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                            {t('brainFlowModal.tip')}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium transition-all shadow-sm"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleStart}
                        disabled={!goal.trim()}
                        className={clsx(
                            "px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md transition-all",
                            goal.trim()
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg hover:scale-[1.02]"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        <Sparkles size={18} />
                        {t('brainFlowModal.startButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};
