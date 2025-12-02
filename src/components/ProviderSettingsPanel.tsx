/**
 * ============================================================================
 *  ProviderSettingsPanel - 회사별 설정 UI 컴포넌트
 *  
 *  providerSettingsConfig.ts의 설정 구성을 기반으로 동적으로 UI를 생성합니다.
 *  각 회사의 지원 파라미터에 따라 적절한 입력 컴포넌트를 렌더링합니다.
 * ============================================================================
 */

import React, { useState, useCallback } from 'react';
import {
  Brain, Sliders, Settings, Layers,
  Sparkles, Zap, Globe, Rocket, ChevronDown, ChevronUp,
  Info, AlertTriangle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { BYOKProviderId, ModelOverrideSettings } from '../types';
import {
  SettingConfig,
  SliderSettingConfig,
  NumberSettingConfig,
  ToggleSettingConfig,
  SelectSettingConfig,
  ButtonGroupSettingConfig,
  VariantGridSettingConfig,
  getVisibleSettings,
  getProviderSettings,
} from '../config/providerSettingsConfig';

// ============================================================================
// 아이콘 매핑
// ============================================================================

const ICON_MAP: Record<string, React.ElementType> = {
  Brain,
  Sliders,
  Settings,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Rocket,
  Info,
  AlertTriangle,
};

const getIcon = (iconName?: string): React.ElementType | null => {
  if (!iconName) return null;
  return ICON_MAP[iconName] || null;
};

// ============================================================================
// Props 정의
// ============================================================================

interface ProviderSettingsPanelProps {
  providerId: BYOKProviderId;
  modelId: string;
  capabilities?: string[];
  settings: ModelOverrideSettings;
  defaultSettings?: Partial<ModelOverrideSettings>;
  onSettingChange: <K extends keyof ModelOverrideSettings>(key: K, value: ModelOverrideSettings[K]) => void;
}

// ============================================================================
// 개별 설정 컴포넌트들
// ============================================================================

/** 슬라이더 컴포넌트 */
function SliderSetting({
  config,
  value,
  onChange,
}: {
  config: SliderSettingConfig;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const currentValue = value ?? config.defaultValue;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
          {config.label}
        </label>
        <span className="text-xs font-mono text-purple-600 font-semibold">
          {currentValue.toFixed(config.step < 1 ? 1 : 0)}
        </span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={currentValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
      {config.marks && (
        <div className="flex justify-between text-[10px] text-slate-400">
          {config.marks.map((mark, idx) => (
            <span key={idx}>{mark.label}</span>
          ))}
        </div>
      )}
      {config.description && (
        <p className="text-[10px] text-slate-400">{config.description}</p>
      )}
    </div>
  );
}

/** 숫자 입력 컴포넌트 */
function NumberSetting({
  config,
  value,
  onChange,
}: {
  config: NumberSettingConfig;
  value: number | undefined;
  onChange: (value: number) => void;
}) {
  const currentValue = value ?? config.defaultValue;
  
  // 슬라이더 스타일로 변경 (더 나은 UX)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
          {config.label}
        </label>
        <span className="text-xs font-mono text-purple-600 font-semibold">
          {currentValue.toLocaleString()}
        </span>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step || 1}
        value={currentValue}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
      />
      {config.description && (
        <p className="text-[10px] text-slate-400">{config.description}</p>
      )}
    </div>
  );
}

/** 토글 컴포넌트 */
function ToggleSetting({
  config,
  value,
  onChange,
}: {
  config: ToggleSettingConfig;
  value: boolean | undefined;
  onChange: (value: boolean) => void;
}) {
  const currentValue = value ?? config.defaultValue;
  const Icon = getIcon('Brain');
  
  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={14} className="text-purple-500" />}
        <div>
          <span className="text-sm font-medium text-slate-700">{config.label}</span>
          {config.description && (
            <p className="text-[10px] text-slate-400 mt-0.5">{config.description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onChange(!currentValue)}
        className={clsx(
          "w-10 h-5 rounded-full transition-colors relative",
          currentValue ? "bg-purple-500" : "bg-slate-300"
        )}
      >
        <div className={clsx(
          "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
          currentValue ? "translate-x-5" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

/** 선택 (드롭다운) 컴포넌트 */
function SelectSetting({
  config,
  value,
  onChange,
}: {
  config: SelectSettingConfig;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const currentValue = value ?? config.defaultValue;
  
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
        {config.label}
      </label>
      <select
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
      >
        {config.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {config.description && (
        <p className="text-[10px] text-slate-400">{config.description}</p>
      )}
    </div>
  );
}

/** 버튼 그룹 컴포넌트 */
function ButtonGroupSetting({
  config,
  value,
  onChange,
}: {
  config: ButtonGroupSettingConfig;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const currentValue = value ?? config.defaultValue;
  
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
        {config.label}
      </label>
      <div className="flex gap-1">
        {config.options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={clsx(
              "flex-1 py-2 rounded-lg border transition-all text-xs font-medium",
              currentValue === option.value
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-slate-200 hover:border-purple-300 text-slate-600"
            )}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
      {config.description && (
        <p className="text-[10px] text-slate-400">{config.description}</p>
      )}
    </div>
  );
}

/** Variant 그리드 컴포넌트 (OpenRouter) */
function VariantGridSetting({
  config,
  value,
  onChange,
}: {
  config: VariantGridSettingConfig;
  value: string | undefined;
  onChange: (value: string) => void;
}) {
  const currentValue = value ?? config.defaultValue;
  const columns = config.columns || 3;
  
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
        {config.label}
      </label>
      <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {config.options.map((option) => {
          const Icon = option.icon ? getIcon(option.icon) : null;
          const isSelected = currentValue === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={clsx(
                "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                isSelected
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-slate-600"
              )}
              title={option.description}
            >
              {Icon && <Icon size={14} />}
              <span className="font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
      {config.description && (
        <p className="text-[10px] text-slate-400">{config.description}</p>
      )}
    </div>
  );
}

/** 설정 항목 렌더러 */
function SettingRenderer({
  config,
  settings,
  onSettingChange,
}: {
  config: SettingConfig;
  settings: ModelOverrideSettings;
  onSettingChange: <K extends keyof ModelOverrideSettings>(key: K, value: ModelOverrideSettings[K]) => void;
}) {
  // 설정 ID를 ModelOverrideSettings의 키로 매핑
  const settingKey = config.id as keyof ModelOverrideSettings;
  const value = settings[settingKey];
  
  switch (config.type) {
    case 'slider':
      return (
        <SliderSetting
          config={config}
          value={value as number | undefined}
          onChange={(v) => onSettingChange(settingKey, v as any)}
        />
      );
    case 'number':
      return (
        <NumberSetting
          config={config}
          value={value as number | undefined}
          onChange={(v) => onSettingChange(settingKey, v as any)}
        />
      );
    case 'toggle':
      return (
        <ToggleSetting
          config={config}
          value={value as boolean | undefined}
          onChange={(v) => onSettingChange(settingKey, v as any)}
        />
      );
    case 'select':
      return (
        <SelectSetting
          config={config}
          value={value as string | undefined}
          onChange={(v) => onSettingChange(settingKey, v as any)}
        />
      );
    case 'button-group':
      return (
        <ButtonGroupSetting
          config={config}
          value={value as string | undefined}
          onChange={(v) => onSettingChange(settingKey, v as any)}
        />
      );
    case 'variant-grid':
      return (
        <VariantGridSetting
          config={config}
          value={value as string | undefined}
          onChange={(v) => onSettingChange(settingKey, v as any)}
        />
      );
    default:
      return null;
  }
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function ProviderSettingsPanel({
  providerId,
  modelId,
  capabilities,
  settings,
  onSettingChange,
}: ProviderSettingsPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Sampling', 'Reasoning', 'Thinking', 'Model Variant', 'Extended Thinking', 'Thinking Mode', 'Deep Thinking']));
  
  // 표시할 설정 그룹 필터링
  const visibleGroups = getVisibleSettings(providerId, modelId, capabilities);
  const providerConfig = getProviderSettings(providerId);
  
  const toggleGroup = useCallback((groupTitle: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupTitle)) {
        next.delete(groupTitle);
      } else {
        next.add(groupTitle);
      }
      return next;
    });
  }, []);
  
  if (visibleGroups.length === 0) {
    return (
      <div className="p-3 text-center text-slate-400 text-xs">
        이 모델에 대한 사용자 정의 설정이 없습니다.
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {/* 설정 그룹들 */}
      {visibleGroups.map((group) => {
        const Icon = getIcon(group.icon);
        const isExpanded = expandedGroups.has(group.title);
        
        return (
          <div key={group.title} className="border border-slate-200 rounded-lg overflow-hidden">
            {/* 그룹 헤더 */}
            <button
              onClick={() => toggleGroup(group.title)}
              className="w-full flex items-center justify-between p-2 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {Icon && <Icon size={14} className="text-purple-500" />}
                <span className="text-xs font-semibold text-slate-700">{group.title}</span>
              </div>
              {isExpanded ? (
                <ChevronUp size={14} className="text-slate-400" />
              ) : (
                <ChevronDown size={14} className="text-slate-400" />
              )}
            </button>
            
            {/* 그룹 내용 */}
            {isExpanded && (
              <div className="p-3 space-y-3 bg-white">
                {group.settings.map((config) => (
                  <SettingRenderer
                    key={config.id}
                    config={config}
                    settings={settings}
                    onSettingChange={onSettingChange}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
      
      {/* 안내 메시지 */}
      {providerConfig.notes && providerConfig.notes.length > 0 && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              {providerConfig.notes.map((note, idx) => (
                <p key={idx} className="text-[10px] text-amber-700">{note}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderSettingsPanel;
