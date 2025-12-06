import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FastForward, Loader2, CheckCircle2, BrainCircuit, StopCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { usePersistentState } from '../hooks/usePersistentState';

interface BrainFlowProgressProps {
    phase: 0 | 1 | 2 | 3;
    waitingModels: string[];
    completedModels: string[];
    onSkip: () => void;
    onCancel: () => void;
}

export const BrainFlowProgress: React.FC<BrainFlowProgressProps> = ({
    phase,
    waitingModels,
    completedModels,
    onSkip,
    onCancel
}) => {
    const { t } = useTranslation();

    // Draggable Logic
    const [savedPos, setSavedPos] = usePersistentState<{ x: number, y: number } | null>('md_brainflow_progress_pos', null);
    const [position, setPosition] = useState<{ x: number, y: number } | null>(savedPos);
    const [isDragging, setIsDragging] = useState(false);
    const nodeRef = useRef<HTMLDivElement>(null);
    const latestPosRef = useRef<{ x: number, y: number } | null>(position);

    useEffect(() => {
        if (!isDragging && savedPos) {
            setPosition(savedPos);
            latestPosRef.current = savedPos;
        }
    }, [savedPos, isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        // Prevent drag if clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;

        if (nodeRef.current) {
            setIsDragging(true);

            // Immediately center the window on the mouse cursor
            const rect = nodeRef.current.getBoundingClientRect();
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const newPos = {
                x: e.clientX - centerX,
                y: e.clientY - centerY
            };

            setPosition(newPos);
            latestPosRef.current = newPos;
        }
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (nodeRef.current) {
                const rect = nodeRef.current.getBoundingClientRect();
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const newPos = {
                    x: e.clientX - centerX,
                    y: e.clientY - centerY
                };
                setPosition(newPos);
                latestPosRef.current = newPos;
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (latestPosRef.current) {
                setSavedPos(latestPosRef.current);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, setSavedPos]);

    if (phase === 0) return null;

    return (
        <div
            ref={nodeRef}
            onMouseDown={handleMouseDown}
            style={position ? { left: position.x, top: position.y, transform: 'none' } : undefined}
            className={clsx(
                "fixed z-50 animate-in fade-in duration-300 cursor-move",
                !position && "bottom-24 left-1/2 -translate-x-1/2 slide-in-from-bottom-4"
            )}
        >
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl p-4 min-w-[420px] flex items-center gap-4 ring-1 ring-black/5 select-none">

                {/* Icon & Status */}
                <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-md opacity-20 rounded-full animate-pulse" />
                        <div className="relative w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <BrainCircuit size={20} className={phase === 2 ? "animate-pulse" : ""} />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <Loader2 size={10} className="animate-spin text-indigo-600" />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Brain Flow</span>
                        <span className="font-semibold text-slate-800 text-sm w-24">
                            {phase === 1 && t('brainFlow.phase1Title', 'Planning')}
                            {phase === 2 && t('brainFlow.phase2Title', 'Executing')}
                            {phase === 3 && t('brainFlow.phase3Title', 'Synthesizing')}
                        </span>
                    </div>
                </div>

                {/* Progress Steps */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        {[1, 2, 3].map(step => (
                            <div key={step} className="flex flex-col items-center gap-1">
                                <div
                                    className={clsx(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                        phase === step ? "bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-100" :
                                            phase > step ? "bg-emerald-500 text-white" :
                                                "bg-slate-100 text-slate-400"
                                    )}
                                >
                                    {phase > step ? <CheckCircle2 size={14} /> : step}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress Bar Background */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                        {/* Animated Progress Fill */}
                        <div
                            className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500 ease-out rounded-full"
                            style={{
                                width: phase === 1 ? '33%' : phase === 2 ? '66%' : '100%'
                            }}
                        />
                        {/* Indeterminate Loading Bar for current phase */}
                        <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
                    </div>

                    {/* Phase 2 Details */}
                    {phase === 2 && (
                        <div className="flex items-center justify-between text-[10px] font-medium text-slate-500 px-1">
                            <span>{completedModels.length} Done</span>
                            <span>{waitingModels.length} Waiting</span>
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                    {phase === 2 && (
                        <button
                            onClick={onSkip}
                            className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors group relative"
                            title="Skip current phase"
                        >
                            <FastForward size={18} />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Skip Phase
                            </span>
                        </button>
                    )}

                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors group relative"
                        title="Stop Brain Flow"
                    >
                        <StopCircle size={18} />
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Stop Process
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
