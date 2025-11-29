import React, { useState, KeyboardEvent } from 'react';
import { X, Sparkles, BrainCircuit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { usePersistentState } from '../hooks/usePersistentState';

interface BrainFlowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (goal: string, mainPromptTemplate: string, synthesisPromptTemplate: string) => void;
    slaveCount: number;
    excludedModels?: string[];
}

export const BrainFlowModal: React.FC<BrainFlowModalProps> = ({ isOpen, onClose, onStart, slaveCount, excludedModels = [] }) => {
    const { t } = useTranslation();
    const [goal, setGoal] = useState('');
    const [showPreview1, setShowPreview1] = useState(false);
    const [showPreview3, setShowPreview3] = useState(false);
    const [mainPromptTemplate, setMainPromptTemplate] = usePersistentState<string>('md_brainflow_phase1_prompt', t('brainFlow.phase1'));
    const [synthesisPromptTemplate, setSynthesisPromptTemplate] = usePersistentState<string>('md_brainflow_phase3_prompt', t('brainFlow.phase3'));

    if (!isOpen) return null;

    const handleStart = () => {
        if (!goal.trim()) return;
        onStart(goal, mainPromptTemplate, synthesisPromptTemplate);
        onClose();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleStart();
        }
    };

    const sampleSlaves = Array.from({ length: Math.max(1, Math.min(3, slaveCount || 1)) }, (_, i) => `- [SLAVE:sample-${i + 1}] ...`).join('\n');
    const extraCount = Math.max(0, slaveCount - 3);
    const previewText1 = mainPromptTemplate
        .replace('{{slaves}}', extraCount > 0 ? `${sampleSlaves}\n... (+${extraCount} more will be auto-filled)` : sampleSlaves)
        .replace('{{goal}}', goal.trim() || t('brainFlowModal.previewGoalPlaceholder'));

    const sampleResponses = [
        '[grok-1 Response]\n요약/핵심 bullet...',
        '[claude-2 Response]\n리스크/검증...',
        '[gemini-1 Response]\n실행 계획...'
    ].join('\n\n');
    const previewText3 = synthesisPromptTemplate
        .replace('{{goal}}', goal.trim() || t('brainFlowModal.previewGoalPlaceholder'))
        .replace('{{responses}}', sampleResponses);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-[900px] max-w-[96%] max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col">

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
                            {excludedModels.length > 0 && (
                                <p className="text-xs text-amber-600 mt-1 font-medium flex items-center gap-1">
                                    ⚠️ {t('brainFlowModal.excludedMessage', { models: excludedModels.join(', ') })}
                                </p>
                            )}
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
                <div className="p-6 space-y-5 flex-1 overflow-hidden">
                    <div className="space-y-4 max-h-[75vh] overflow-y-auto">
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

                        <div className="mt-2 space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowPreview1(v => !v)}
                                className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center justify-between"
                            >
                                <span>{t('brainFlowModal.previewButton')}</span>
                                <span className="text-xs text-indigo-500">{showPreview1 ? t('brainFlowModal.previewHide') : t('brainFlowModal.previewShow')}</span>
                            </button>

                            {showPreview1 && (
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid lg:grid-cols-2 lg:gap-4">
                                    <div className="space-y-3">
                                        <div className="text-sm text-slate-700 font-semibold">
                                            {t('brainFlowModal.previewTitle')}
                                        </div>
                                        <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-3 leading-relaxed">
                                            {t('brainFlowModal.warningKeepBlocks')}
                                        </p>
                                        <textarea
                                            value={mainPromptTemplate}
                                            onChange={(e) => setMainPromptTemplate(e.target.value)}
                                            className="w-full min-h-[180px] max-h-[260px] overflow-auto p-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                                        />
                                        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                                            {t('brainFlowModal.persistNote')}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-slate-600">
                                            {t('brainFlowModal.previewFilledLabel')}
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-white p-3 max-h-[320px] overflow-auto">
                                            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                                                {previewText1}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowPreview3(v => !v)}
                                className="w-full px-4 py-3 text-sm font-semibold rounded-xl border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all flex items-center justify-between"
                            >
                                <span>{t('brainFlowModal.synthesisPreviewButton')}</span>
                                <span className="text-xs text-indigo-500">{showPreview3 ? t('brainFlowModal.previewHide') : t('brainFlowModal.previewShow')}</span>
                            </button>

                            {showPreview3 && (
                                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid lg:grid-cols-2 lg:gap-4">
                                    <div className="space-y-3">
                                        <div className="text-sm text-slate-700 font-semibold">
                                            {t('brainFlowModal.synthesisPreviewTitle')}
                                        </div>
                                        <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg p-3 leading-relaxed">
                                            {t('brainFlowModal.synthesisWarningKeepBlocks')}
                                        </p>
                                        <textarea
                                            value={synthesisPromptTemplate}
                                            onChange={(e) => setSynthesisPromptTemplate(e.target.value)}
                                            className="w-full min-h-[180px] max-h-[260px] overflow-auto p-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all leading-relaxed"
                                        />
                                        <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                                            {t('brainFlowModal.persistNote')}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-slate-600">
                                            {t('brainFlowModal.synthesisPreviewFilledLabel')}
                                        </div>
                                        <div className="rounded-lg border border-slate-200 bg-white p-3 max-h-[320px] overflow-auto">
                                            <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words leading-relaxed">
                                                {previewText3}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
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
