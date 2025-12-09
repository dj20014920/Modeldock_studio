/**
 * SidePanelApp.tsx
 * 
 * Chrome Extension Side Panel용 메인 애플리케이션.
 * 모바일 폰 화면처럼 컴팩트한 단일 모델 포커스 인터페이스 제공.
 * 
 * 핵심 기능:
 * - 단일 모델 선택 및 대화
 * - BYOK API 직접 연동
 * - 웹페이지 iframe 임베드 모드
 * - 대화 히스토리 관리
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ChevronDown, 
  ExternalLink, 
  Plus, 
  Settings,
  Sparkles
} from 'lucide-react';
import { clsx } from 'clsx';

import { ModelId, ChatMessage, ImageContentPart, MessageContentPart, BYOKProviderId } from './types';
import { SUPPORTED_MODELS } from './constants';
import { usePersistentState } from './hooks/usePersistentState';
import { useBYOKModels } from './hooks/useBYOKModels';
import { BYOKHistoryService } from './services/byokHistoryService';
import { BYOKAPIService as BYOKService, loadBYOKSettings } from './services/byokService';
import { BYOKChat } from './components/BYOKChat';
import { ModelFrame } from './components/ModelFrame';
import { SettingsModal } from './components/SettingsModal';

// 사이드패널에서 지원하는 모델 목록 (간결한 UI를 위해 주요 모델만 노출)
const SIDEPANEL_MODELS = [
  'gemini', 'claude', 'chatgpt', 'grok', 'perplexity', 'deepseek', 'qwen', 'mistral'
] as const;

type ViewMode = 'chat' | 'web';

export const SidePanelApp: React.FC = () => {
  // === State ===
  const [selectedModelId, setSelectedModelId] = usePersistentState<ModelId | string>('sp_selected_model', 'chatgpt');
  const [, setViewMode] = usePersistentState<ViewMode>('sp_view_mode', 'web');
  const [messages, setMessages] = usePersistentState<ChatMessage[]>('sp_messages', []);
  const [byokHistoryId, setByokHistoryId] = usePersistentState<string | null>('sp_byok_history_id', null);
  
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // BYOK 모델 목록 (공통 hook 사용 - DRY)
  const { byokModels } = useBYOKModels();
  
  const modelSelectorRef = useRef<HTMLDivElement>(null);

  // === 외부 클릭 시 드롭다운 닫기 ===
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelSelectorRef.current && !modelSelectorRef.current.contains(event.target as Node)) {
        setIsModelSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // === Helper: 현재 모델 설정 가져오기 ===
  const getModelConfig = useCallback((modelId: string) => {
    if (SUPPORTED_MODELS[modelId as ModelId]) {
      return SUPPORTED_MODELS[modelId as ModelId];
    }

    // BYOK 모델
    if (modelId.startsWith('byok-')) {
      const parts = modelId.replace('byok-', '').split('-');
      const providerId = parts[0];
      const variantId = parts.length > 1 ? parts.slice(1).join('-') : undefined;
      const displayName = variantId
        ? (variantId.includes('/') ? variantId.split('/').pop()! : variantId)
        : (providerId.charAt(0).toUpperCase() + providerId.slice(1));

      return {
        id: modelId as ModelId,
        name: displayName,
        url: '',
        iconColor: 'bg-purple-500',
        themeColor: 'border-purple-300'
      };
    }

    return {
      id: modelId as ModelId,
      name: modelId,
      url: '',
      iconColor: 'bg-gray-500',
      themeColor: 'border-gray-300'
    };
  }, []);

  const currentModelConfig = getModelConfig(selectedModelId);
  const isBYOKModel = selectedModelId.startsWith('byok-');

  // === 모델 선택 핸들러 ===
  const handleSelectModel = (modelId: string) => {
    if (modelId !== selectedModelId) {
      setSelectedModelId(modelId as ModelId);
      // 모델 변경 시 대화 초기화 (BYOK만)
      if (modelId.startsWith('byok-')) {
        setMessages([]);
        setByokHistoryId(null);
        setViewMode('chat');
      } else {
        setViewMode('web');
      }
    }
    setIsModelSelectorOpen(false);
  };

  // === BYOK 메시지 전송 ===
  const handleSendBYOKMessage = useCallback(async (message: string, images?: ImageContentPart[]) => {
    if (!selectedModelId.startsWith('byok-')) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: (() => {
        if (images && images.length > 0) {
          const parts: MessageContentPart[] = [];
          if (message.trim()) {
            parts.push({ type: 'text', text: message });
          }
          parts.push(...images);
          return parts;
        }
        return message;
      })(),
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const modelIdParts = selectedModelId.replace('byok-', '').split('-');
      const providerId = modelIdParts[0] as BYOKProviderId;

      const settings = await loadBYOKSettings();
      const config = settings.providers?.[providerId];

      if (!settings.enabled || !config?.apiKey) {
        throw new Error('API key가 설정되어 있지 않습니다. Settings에서 활성화 및 키를 저장해주세요.');
      }

      let variant: string | undefined;
      if (modelIdParts.length > 1) {
        variant = modelIdParts.slice(1).join('-');
      } else {
        variant = config.selectedVariants?.[0] || (config as any).selectedVariant;
      }

      if (!variant) {
        throw new Error('모델이 선택되지 않았습니다.');
      }

      const apiResponse = await BYOKService.getInstance().callAPI({
        providerId,
        apiKey: config.apiKey.trim(),
        variant,
        prompt: '',
        historyMessages: newMessages,
        temperature: config.customTemperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        topK: config.topK,
        reasoningEffort: config.reasoningEffort,
        thinkingBudget: config.thinkingBudget,
        thinkingLevel: config.thinkingLevel,
        enableThinking: config.enableThinking,
        frequencyPenalty: config.frequencyPenalty,
        presencePenalty: config.presencePenalty,
        stream: false,
      });

      if (!apiResponse.success) {
        throw new Error(apiResponse.error || 'API call failed');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: apiResponse.content || '',
        timestamp: Date.now(),
        reasoning: apiResponse.reasoning,
        reasoningDetails: apiResponse.reasoningDetails
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // 히스토리 저장
      const savedId = await BYOKHistoryService.getInstance().saveConversation(
        byokHistoryId,
        providerId,
        variant,
        finalMessages
      );
      setByokHistoryId(savedId);

    } catch (error) {
      console.error('[SidePanel] BYOK Send Error:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: Date.now()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, [selectedModelId, messages, byokHistoryId]);

  // === 새 대화 시작 ===
  const handleNewChat = () => {
    if (messages.length > 0) {
      const confirmed = confirm('새 대화를 시작하시겠습니까?\n현재 대화는 자동으로 저장됩니다.');
      if (!confirmed) return;
    }
    setMessages([]);
    setByokHistoryId(null);
  };

  // === 전체 화면 열기 ===
  const handleOpenFullView = () => {
    chrome.tabs.create({ url: 'index.html' });
  };

  // === 모델 아이콘 렌더링 ===
  const renderModelIcon = (modelId: string, size: 'sm' | 'md' = 'md') => {
    const config = getModelConfig(modelId);
    const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
    const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
    
    return (
      <div className={clsx(
        sizeClass,
        "rounded-lg flex items-center justify-center bg-slate-100 border border-slate-200"
      )}>
        <div className={clsx(dotSize, "rounded-full", config.iconColor)} />
      </div>
    );
  };

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* === Header === */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-3 shrink-0">
        {/* 모델 선택 드롭다운 */}
        <div ref={modelSelectorRef} className="relative">
          <button
            onClick={() => setIsModelSelectorOpen(!isModelSelectorOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {renderModelIcon(selectedModelId, 'sm')}
            <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">
              {currentModelConfig.name}
            </span>
            <ChevronDown size={16} className={clsx(
              "text-slate-400 transition-transform",
              isModelSelectorOpen && "rotate-180"
            )} />
          </button>

          {/* 드롭다운 메뉴 */}
          {isModelSelectorOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 z-50 py-2 max-h-[70vh] overflow-y-auto">
              {/* 웹 모델 섹션 */}
              <div className="px-3 py-1.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Web Models</span>
              </div>
              {SIDEPANEL_MODELS.map((modelId) => {
                const config = SUPPORTED_MODELS[modelId];
                const isSelected = selectedModelId === modelId;
                return (
                  <button
                    key={modelId}
                    onClick={() => handleSelectModel(modelId)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors",
                      isSelected && "bg-indigo-50"
                    )}
                  >
                    {renderModelIcon(modelId, 'sm')}
                    <span className={clsx(
                      "text-sm font-medium",
                      isSelected ? "text-indigo-600" : "text-slate-700"
                    )}>
                      {config.name}
                    </span>
                    {isSelected && (
                      <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                );
              })}

              {/* BYOK 모델 섹션 */}
              {byokModels.length > 0 && (
                <>
                  <div className="border-t border-slate-100 my-2" />
                  <div className="px-3 py-1.5">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">BYOK Models</span>
                  </div>
                  {byokModels.map((model) => {
                    const isSelected = selectedModelId === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => handleSelectModel(model.id)}
                        className={clsx(
                          "w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors",
                          isSelected && "bg-purple-50"
                        )}
                      >
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-purple-100 border border-purple-200">
                          <Sparkles size={12} className="text-purple-500" />
                        </div>
                        <span className={clsx(
                          "text-sm font-medium truncate",
                          isSelected ? "text-purple-600" : "text-slate-700"
                        )}>
                          {model.name}
                        </span>
                        {isSelected && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-purple-500" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-1">
          {isBYOKModel && (
            <button
              onClick={handleNewChat}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
              title="새 대화"
            >
              <Plus size={18} />
            </button>
          )}
          <button
            onClick={handleOpenFullView}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="전체 화면에서 열기"
          >
            <ExternalLink size={18} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
            title="설정"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* === Main Content === */}
      <main className="flex-1 overflow-hidden bg-white relative">
        {isBYOKModel ? (
          // BYOK 채팅 모드
          <BYOKChat
            messages={messages}
            isStreaming={isSending}
            onSendMessage={handleSendBYOKMessage}
          />
        ) : (
          // 웹 iframe 모드
          <div className="w-full h-full">
            <ModelFrame
              url={currentModelConfig.url}
              title={currentModelConfig.name}
              modelId={selectedModelId as ModelId}
            />
          </div>
        )}
      </main>

      {/* === Settings Modal === */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default SidePanelApp;
