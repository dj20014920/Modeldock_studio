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
        <div className="absolute bottom-full left-0 w-full mb-2 px-4 animate-in slide-in-from-bottom-2 fade-in duration-300 z-40">
            <div className="bg-white/90 backdrop-blur-md border border-indigo-100 shadow-lg rounded-xl p-4 flex items-center justify-between gap-4">

                <div className="flex items-center gap-4 flex-1">
                    {/* Phase Indicator */}
                    <div className="flex items-center gap-2">
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            phase === 1 ? "bg-indigo-100 text-indigo-600" : "bg-indigo-600 text-white"
                        )}>
                            1
                        </div>
                        <div className="w-4 h-0.5 bg-slate-200" />
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            phase === 2 ? "bg-indigo-600 text-white animate-pulse" : phase > 2 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                        )}>
                            2
                        </div>
                        <div className="w-4 h-0.5 bg-slate-200" />
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                            phase === 3 ? "bg-indigo-600 text-white animate-pulse" : "bg-slate-100 text-slate-400"
                        )}>
                            3
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 mx-2" />

                    {/* Status Text */}
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 text-sm">
                            {phase === 1 && t('brainFlow.phase1Title', 'Planning Phase')}
                            {phase === 2 && t('brainFlow.phase2Title', 'Execution Phase')}
                            {phase === 3 && t('brainFlow.phase3Title', 'Synthesis Phase')}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                            {phase === 2 && (
                                <>
                                    <span className="flex items-center gap-1 text-amber-600">
                                        <Loader2 size={10} className="animate-spin" />
                                        Waiting: {waitingModels.join(', ')}
                                    </span>
                                    {completedModels.length > 0 && (
                                        <span className="flex items-center gap-1 text-emerald-600">
                                            <CheckCircle2 size={10} />
                                            Done: {completedModels.join(', ')}
                                        </span>
                                    )}
                                </>
                            )}
                            {phase !== 2 && t('brainFlow.processing', 'Processing...')}
                        </p>
                    </div>
                </div>

                {/* Skip Button (Only visible in Phase 2) */}
                {phase === 2 && (
                    <button
                        onClick={onSkip}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors shadow-sm hover:text-indigo-600 hover:border-indigo-200"
                        title="Force proceed with current responses"
                    >
                        <FastForward size={14} />
                        Skip Waiting
                    </button>
                )}
            </div>
        </div>
    );
};
