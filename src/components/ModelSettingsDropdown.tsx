/**
 * ModelSettingsDropdown - 모델 카드별 개별 설정 드롭다운
 * 
 * 기능:
 * - OpenRouter Variant 선택 (Free, Extended, Thinking, Online, Nitro)
 * - Temperature, Max Tokens 등 파라미터 조절
 * - Reasoning/Thinking 설정
 * - "기본 설정 사용" 토글
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Sparkles, Zap, Brain, 
  Globe, Rocket, RotateCcw, Check, X, Sliders, Layers
} from 'lucide-react';
import { clsx } from 'clsx';
import { 
  ModelOverrideSettings, 
  OpenRouterVariant, 
  ReasoningEffort,
  BYOKProviderId 
} from '../types';
import { loadBYOKSettings, saveBYOKSettings } from '../services/byokService';

interface ModelSettingsDropdownProps {
  modelId: string;           // 전체 모델 ID (예: "openrouter-meta-llama/llama-3.2-3b-instruct")
  providerId: BYOKProviderId;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

// OpenRouter Variant 정보
const OPENROUTER_VARIANTS: { id: OpenRouterVariant; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'default', label: 'Default', icon: Settings, description: '기본 설정' },
  { id: 'free', label: 'Free', icon: Sparkles, description: '무료 버전 ($0, rate limit 적용)' },
  { id: 'extended', label: 'Extended', icon: Layers, description: '확장 컨텍스트 윈도우' },
  { id: 'thinking', label: 'Thinking', icon: Brain, description: '확장 추론 (Chain-of-Thought)' },
  { id: 'online', label: 'Online', icon: Globe, description: '실시간 웹 검색 (Exa.ai 연동)' },
  { id: 'nitro', label: 'Nitro', icon: Rocket, description: '최고 속도 Provider 우선' },
  { id: 'floor', label: 'Floor', icon: Zap, description: '최저가 Provider 우선' },
];

// Reasoning Effort 정보
const REASONING_EFFORTS: { id: ReasoningEffort; label: string }[] = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export const ModelSettingsDropdown: React.FC<ModelSettingsDropdownProps> = ({
  modelId,
  providerId,
  isOpen,
  onToggle,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // 로컬 설정 상태
  const [settings, setSettings] = useState<ModelOverrideSettings>({
    useDefaults: true,
  });
  const [defaultSettings, setDefaultSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 설정 로드
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, modelId]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (hasChanges) {
          handleSave();
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, hasChanges, onClose]);

  const loadSettings = async () => {
    const byokSettings = await loadBYOKSettings();
    const providerConfig = byokSettings.providers?.[providerId];
    const modelOverride = byokSettings.modelOverrides?.[modelId];

    // 기본 설정 저장
    setDefaultSettings({
      temperature: providerConfig?.customTemperature ?? 1.0,
      maxTokens: providerConfig?.maxTokens,
      topP: providerConfig?.topP ?? 1,
      reasoningEffort: providerConfig?.reasoningEffort,
      thinkingBudget: providerConfig?.thinkingBudget,
      enableThinking: providerConfig?.enableThinking,
    });

    // 모델별 오버라이드 설정 로드
    if (modelOverride) {
      setSettings({
        ...modelOverride,
        useDefaults: modelOverride.useDefaults ?? true,
      });
    } else {
      setSettings({ useDefaults: true });
    }
    
    setHasChanges(false);
  };

  const handleSettingChange = <K extends keyof ModelOverrideSettings>(
    key: K,
    value: ModelOverrideSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const byokSettings = await loadBYOKSettings();
      
      // modelOverrides 업데이트
      const updatedOverrides = {
        ...byokSettings.modelOverrides,
        [modelId]: settings,
      };

      await saveBYOKSettings({
        ...byokSettings,
        modelOverrides: updatedOverrides,
      });

      setHasChanges(false);
    } catch (error) {
      console.error('[ModelSettings] Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({ useDefaults: true });
    setHasChanges(true);
  };

  const isOpenRouter = providerId === 'openrouter';

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={clsx(
          "p-1.5 rounded-md transition-colors",
          settings.useDefaults === false
            ? "text-purple-500 bg-purple-50 hover:bg-purple-100"
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        )}
        title="Model Settings"
      >
        <Sliders size={14} />
      </button>
    );
  }

  return (
    <div ref={dropdownRef} className="absolute top-full right-0 mt-2 z-50">
      <div className="w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-purple-500" />
            <span className="font-semibold text-sm text-slate-700">Model Settings</span>
          </div>
          <div className="flex items-center gap-1">
            {hasChanges && (
              <span className="text-xs text-amber-500 mr-2">Unsaved</span>
            )}
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => {
                if (hasChanges) handleSave();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* Use Defaults Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-slate-700">Use Default Settings</div>
              <div className="text-xs text-slate-500">Apply global BYOK settings</div>
            </div>
            <button
              onClick={() => handleSettingChange('useDefaults', !settings.useDefaults)}
              className={clsx(
                "w-10 h-5 rounded-full transition-colors relative",
                settings.useDefaults ? "bg-purple-500" : "bg-slate-300"
              )}
            >
              <div className={clsx(
                "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                settings.useDefaults ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>

          {/* Custom Settings (shown when useDefaults is false) */}
          {!settings.useDefaults && (
            <>
              {/* OpenRouter Variants */}
              {isOpenRouter && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Model Variant
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {OPENROUTER_VARIANTS.map(variant => {
                      const Icon = variant.icon;
                      const isSelected = settings.openRouterVariant === variant.id || 
                        (variant.id === 'default' && !settings.openRouterVariant);
                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleSettingChange('openRouterVariant', variant.id)}
                          className={clsx(
                            "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                            isSelected
                              ? "border-purple-500 bg-purple-50 text-purple-700"
                              : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-slate-600"
                          )}
                          title={variant.description}
                        >
                          <Icon size={14} />
                          <span className="font-medium">{variant.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Temperature
                  </label>
                  <span className="text-xs font-mono text-purple-600">
                    {(settings.temperature ?? defaultSettings?.temperature ?? 1.0).toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature ?? defaultSettings?.temperature ?? 1.0}
                  onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Precise</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Max Tokens
                  </label>
                  <span className="text-xs font-mono text-purple-600">
                    {settings.maxTokens ?? defaultSettings?.maxTokens ?? 4096}
                  </span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="32768"
                  step="256"
                  value={settings.maxTokens ?? defaultSettings?.maxTokens ?? 4096}
                  onChange={(e) => handleSettingChange('maxTokens', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Reasoning Effort (for thinking models) */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Reasoning Effort
                </label>
                <div className="flex gap-2">
                  {REASONING_EFFORTS.map(effort => (
                    <button
                      key={effort.id}
                      onClick={() => handleSettingChange('reasoningEffort', effort.id)}
                      className={clsx(
                        "flex-1 py-2 rounded-lg border transition-all text-xs font-medium",
                        settings.reasoningEffort === effort.id
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-slate-200 hover:border-purple-300 text-slate-600"
                      )}
                    >
                      {effort.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enable Thinking Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Brain size={14} className="text-purple-500" />
                  <span className="text-sm font-medium text-slate-700">Enable Thinking</span>
                </div>
                <button
                  onClick={() => handleSettingChange('enableThinking', !settings.enableThinking)}
                  className={clsx(
                    "w-10 h-5 rounded-full transition-colors relative",
                    settings.enableThinking ? "bg-purple-500" : "bg-slate-300"
                  )}
                >
                  <div className={clsx(
                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    settings.enableThinking ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>

              {/* Top P */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Top P
                  </label>
                  <span className="text-xs font-mono text-purple-600">
                    {(settings.topP ?? defaultSettings?.topP ?? 1).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.topP ?? defaultSettings?.topP ?? 1}
                  onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {hasChanges && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
            <button
              onClick={() => {
                loadSettings();
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={clsx(
                "px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center gap-1",
                isSaving ? "bg-purple-400" : "bg-purple-500 hover:bg-purple-600"
              )}
            >
              {isSaving ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={12} />
                  Save
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
