import React from 'react';
import { useTranslation } from 'react-i18next';
import { FastForward, Loader2, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface BrainFlowProgressProps {
    phase: 0 | 1 | 2 | 3;
    waitingModels: string[];
    completedModels: string[];
    onSkip: () => void;
}

export const BrainFlowProgress: React.FC<BrainFlowProgressProps> = ({
    phase,
    waitingModels,
    completedModels,
    onSkip
}) => {
    const { t } = useTranslation();

    if (phase === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-2 fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-md border border-indigo-200 shadow-xl rounded-xl p-3 min-w-[280px]">
                {/* Compact Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="font-semibold text-slate-800 text-sm">
                            {phase === 1 && t('brainFlow.phase1Title', 'Planning')}
                            {phase === 2 && t('brainFlow.phase2Title', 'Executing')}
                            {phase === 3 && t('brainFlow.phase3Title', 'Synthesizing')}
                        </span>
                    </div>
                    {/* Phase Steps */}
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map(step => (
                            <div
                                key={step}
                                className={clsx(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                                    phase === step ? "bg-indigo-600 text-white" :
                                    phase > step ? "bg-indigo-200 text-indigo-700" :
                                    "bg-slate-100 text-slate-400"
                                )}
                            >
                                {step}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div className="text-xs text-slate-500 mb-2">
                    {phase === 2 && (
                        <div className="space-y-1">
                            {waitingModels.length > 0 && (
                                <div className="flex items-center gap-1 text-amber-600">
                                    <Loader2 size={10} className="animate-spin" />
                                    <span>Waiting: {waitingModels.slice(0, 3).join(', ')}{waitingModels.length > 3 ? '...' : ''}</span>
                                </div>
                            )}
                            {completedModels.length > 0 && (
                                <div className="flex items-center gap-1 text-emerald-600">
                                    <CheckCircle2 size={10} />
                                    <span>Done: {completedModels.length}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {phase !== 2 && (
                        <span className="flex items-center gap-1">
                            <Loader2 size={10} className="animate-spin" />
                            {t('brainFlow.processing', 'Processing...')}
                        </span>
                    )}
                </div>

                {/* Skip Button */}
                {phase === 2 && (
                    <button
                        onClick={onSkip}
                        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 text-xs font-medium rounded-lg transition-colors"
                    >
                        <FastForward size={12} />
                        Skip & Continue
                    </button>
                )}
            </div>
        </div>
    );
};
