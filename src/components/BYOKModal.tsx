
import { useState, useEffect, useMemo } from 'react';
import {
    X, Check, AlertCircle, ExternalLink, Eye, EyeOff, Loader,
    Sparkles, Zap, Brain, Cpu, Search, Code,
    MessageSquare, Layers, Activity, RefreshCw,
    ChevronDown, ChevronUp, Sliders, CheckCircle2, XCircle
} from 'lucide-react';
import { ProviderSettingsPanel } from './ProviderSettingsPanel';
import { BYOKProviderId, BYOKSettings, ReasoningEffort, BYOKModelVariant, VerificationResult, ModelOverrideSettings } from '../types';
import { BYOK_PROVIDERS, REASONING_EFFORT_LABELS } from '../byokProviders';
import {
    loadBYOKSettings,
    saveBYOKSettings,
    BYOKAPIService,
    shouldAutoRefresh,
} from '../services/byokService';
import { useTranslation } from 'react-i18next';

interface BYOKModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Category = 'all' | 'free' | 'reasoning' | 'coding' | 'vision' | 'realtime';

export function BYOKModal({ isOpen, onClose }: BYOKModalProps) {
    const { t } = useTranslation();

    const [settings, setSettings] = useState<BYOKSettings>({
        enabled: false,
        providers: {},
    });
    const [selectedProvider, setSelectedProvider] = useState<BYOKProviderId | null>(null);
    const [showApiKey, setShowApiKey] = useState<Record<BYOKProviderId, boolean>>({} as any);
    const [validating, setValidating] = useState<BYOKProviderId | null>(null);
    const [validationStatus, setValidationStatus] = useState<Record<BYOKProviderId, VerificationResult | null>>({} as any);
    const [isSaving, setIsSaving] = useState(false);
    const [animateIn, setAnimateIn] = useState(false);

    // UI States
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<Category>('all');

    const [fetchedModels, setFetchedModels] = useState<Record<BYOKProviderId, BYOKModelVariant[]>>({} as any);
    const [isRefreshing, setIsRefreshing] = useState<Record<BYOKProviderId, boolean>>({} as any);

    const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number | null>(null);

    const apiService = BYOKAPIService.getInstance();

    useEffect(() => {
        if (isOpen) {
            loadSettings();
            checkAndAutoRefresh(); // 6시간 TTL 체크 및 자동 갱신
            setTimeout(() => setAnimateIn(true), 50);
        } else {
            setAnimateIn(false);
            setSearchQuery('');
            setActiveCategory('all');
        }
    }, [isOpen]);

    const loadSettings = async () => {
        console.log('[BYOK DEBUG] 🔄 loadSettings started');
        const loaded = await loadBYOKSettings();
        console.log('[BYOK DEBUG] 📦 Loaded settings:', {
            enabled: loaded.enabled,
            providerCount: Object.keys(loaded.providers).length,
            providers: Object.keys(loaded.providers),
            hasDynamicModels: !!loaded.dynamicModels,
            lastRefresh: loaded.lastRefreshTimestamp
        });

        setSettings(loaded);

        if (loaded.dynamicModels) {
            setFetchedModels(loaded.dynamicModels as Record<BYOKProviderId, BYOKModelVariant[]>);
        }

        // 마지막 갱신 타임스탬프 저장
        if (loaded.lastRefreshTimestamp) {
            setLastRefreshTimestamp(loaded.lastRefreshTimestamp);
        }

        const firstConfigured = (Object.keys(loaded.providers) as BYOKProviderId[]).find(k => loaded.providers[k]?.apiKey);
        setSelectedProvider(firstConfigured || 'openai');

        // 🆕 저장된 검증 상태 복원 (캐시만 사용, 네트워크 호출 X)
        const restoredStatus: Record<BYOKProviderId, VerificationResult | null> = {} as any;
        const configuredProviders = (Object.keys(loaded.providers) as BYOKProviderId[])
            .filter(id => loaded.providers[id]?.apiKey);

        console.log('[BYOK DEBUG] ✅ Configured providers:', configuredProviders);

        await Promise.all(configuredProviders.map(async (id) => {
            const apiKey = loaded.providers[id]?.apiKey?.trim(); // ✅ trim 추가
            if (!apiKey) {
                console.log(`[BYOK DEBUG] ⚠️ ${id}: No API key found`);
                return;
            }

            console.log(`[BYOK DEBUG] 🔍 ${id}: Checking cache for key: ${apiKey.substring(0, 15)}...`);

            // 1. 키 검증 캐시만 확인 (네트워크 호출 X)
            const keyStatus = await apiService.getStoredVerificationStatus(id, apiKey);
            console.log(`[BYOK DEBUG] 📋 ${id}: Cache result = ${keyStatus}`);

            if (keyStatus === 'available') {
                // 키가 유효하면 'available'로 표시
                // 모델 검증은 사용자가 Verify 버튼을 눌렀을 때만 수행
                restoredStatus[id] = 'available';
                console.log(`[BYOK DEBUG] ✅ ${id}: Restored as 'available'`);
            } else if (keyStatus === 'unavailable') {
                restoredStatus[id] = 'unavailable';
                console.log(`[BYOK DEBUG] ❌ ${id}: Restored as 'unavailable'`);
            } else {
                // 캐시 없음 → null (미검증 상태)
                restoredStatus[id] = null;
                console.log(`[BYOK DEBUG] ℹ️ ${id}: No cached status (will show as unverified)`);
            }
        }));

        console.log('[BYOK DEBUG] 🏁 Final restored status:', restoredStatus);
        setValidationStatus(prev => ({ ...prev, ...restoredStatus }));
    };

    /**
     * 6시간 TTL 체크 및 자동 갱신
     */
    const checkAndAutoRefresh = async () => {
        const needsRefresh = await shouldAutoRefresh();
        if (needsRefresh) {
            console.log('[BYOK Modal] Auto-refresh triggered (6-hour cache expired)');
            const success = await apiService.refreshAllModelsFromProxy();
            if (success) {
                await loadSettings();
            }
        }
    };

    const handleSave = async () => {
        // 1️⃣ API 키가 있고 && 모델이 선택된 provider만 검증 대상
        const configuredProviders = (Object.keys(settings.providers) as BYOKProviderId[])
            .filter(id => {
                const config = settings.providers[id];
                // ✅ 멀티 선택: selectedVariants 배열에 1개 이상 있어야 함
                return config?.apiKey && config?.selectedVariants && config.selectedVariants.length > 0;
            });

        if (configuredProviders.length === 0) {
            // 사용하려는 provider가 없으면 그냥 저장
            setIsSaving(true);
            const settingsToSave: BYOKSettings = {
                ...settings,
                dynamicModels: fetchedModels,
            };
            await saveBYOKSettings(settingsToSave);
            await new Promise(resolve => setTimeout(resolve, 600));
            setIsSaving(false);
            onClose();
            return;
        }

        // 2️⃣ 검증되지 않은 provider 찾기
        const unverifiedProviders = configuredProviders.filter(
            id => !validationStatus[id] || validationStatus[id] === null
        );

        // 3️⃣ 검증 결과를 저장할 로컬 맵 (React state 비동기 문제 해결)
        const verificationResults = new Map<BYOKProviderId, VerificationResult>();

        // 4️⃣ 검증되지 않은 provider가 있으면 자동 검증 실행
        if (unverifiedProviders.length > 0) {
            const providerNames = unverifiedProviders.map(id => `  • ${BYOK_PROVIDERS[id].name} `).join('\n');

            const shouldVerify = confirm(
                `⚠️ ${t('byok.validation.title')} !\n\n` +
                `${t('byok.validation.unverifiedProvidersMessage')} \n` +
                providerNames +
                `\n\n${t('byok.validation.autoVerifyPrompt')} \n\n` +
                `${t('byok.validation.cancelNote')} `
            );

            if (!shouldVerify) {
                return; // 사용자가 취소
            }

            // ✅ 자동 검증 실행 (병렬 처리 + 로컬 결과 저장)
            setIsSaving(true);

            const verificationPromises = unverifiedProviders.map(async (providerId) => {
                const apiKey = settings.providers[providerId]?.apiKey?.trim(); // ✅ trim 추가
                if (!apiKey) return;

                const isValid = await apiService.validateAPIKey(providerId, apiKey);

                let modelVerification: VerificationResult = 'uncertain';
                if (isValid) {
                    // ✅ 멀티 선택: 첫 번째 모델로 검증 (대표 모델)
                    const selectedVariants = settings.providers[providerId]?.selectedVariants;
                    if (selectedVariants && selectedVariants.length > 0) {
                        modelVerification = await apiService.verifyModelAvailability(providerId, apiKey, selectedVariants[0]);
                    } else {
                        // 선택된 모델이 없으면 'uncertain' (검증 불가)
                        modelVerification = 'uncertain';
                    }
                } else {
                    // API 키가 유효하지 않으면 'unavailable'
                    modelVerification = 'unavailable';
                }

                // 로컬 맵에 저장
                verificationResults.set(providerId, modelVerification);

                // State도 업데이트 (UI 반영용)
                setValidationStatus((prev) => ({ ...prev, [providerId]: modelVerification }));
            });

            await Promise.all(verificationPromises);
            setIsSaving(false);
        } else {
            // 이미 검증된 provider들의 결과를 로컬 맵에 복사
            configuredProviders.forEach(id => {
                if (validationStatus[id]) {
                    verificationResults.set(id, validationStatus[id]!);
                }
            });
        }

        // 5️⃣ 검증 결과 분류 (로컬 맵 사용)
        const availableProviders = configuredProviders.filter(
            id => verificationResults.get(id) === 'available' || validationStatus[id] === 'available'
        );
        const unavailableProviders = configuredProviders.filter(
            id => verificationResults.get(id) === 'unavailable' || validationStatus[id] === 'unavailable'
        );
        const uncertainProviders = configuredProviders.filter(
            id => verificationResults.get(id) === 'uncertain' || validationStatus[id] === 'uncertain'
        );

        // 6️⃣ 결과 요약 생성
        let summaryMessage = '';

        if (availableProviders.length > 0) {
            summaryMessage += `✅ ${t('common.success')} (${availableProviders.length}): \n`;
            availableProviders.forEach(id => {
                const provider = BYOK_PROVIDERS[id];
                const variants = settings.providers[id]?.selectedVariants || [];
                summaryMessage += `  • ${provider.name} - ${variants.join(', ')} \n`;
            });
            summaryMessage += '\n';
        }

        if (unavailableProviders.length > 0) {
            summaryMessage += `❌ ${t('byok.validation.unavailableTitle')} (${unavailableProviders.length}): \n`;
            unavailableProviders.forEach(id => {
                const provider = BYOK_PROVIDERS[id];
                const variants = settings.providers[id]?.selectedVariants || [];
                summaryMessage += `  • ${provider.name} - ${variants.join(', ')} \n`;
                summaryMessage += `    ${t('byok.validation.reasonLabel')}: ${t('byok.validation.reasonInvalidKey')} \n`;
            });
            summaryMessage += '\n';
        }

        if (uncertainProviders.length > 0) {
            summaryMessage += `⚠️ ${t('byok.validation.uncertainTitle')} (${uncertainProviders.length}): \n`;
            uncertainProviders.forEach(id => {
                const provider = BYOK_PROVIDERS[id];
                const variants = settings.providers[id]?.selectedVariants || [];
                summaryMessage += `  • ${provider.name} - ${variants.join(', ')} \n`;
                summaryMessage += `    ${t('byok.validation.reasonLabel')}: ${t('byok.validation.uncertainReason')} \n`;
            });
            summaryMessage += '\n';
        }

        // 7️⃣ Unavailable이 있으면 저장 차단 (상세 결과와 함께)
        if (unavailableProviders.length > 0) {
            alert(
                `📊 ${t('byok.validation.title')} \n\n` +
                summaryMessage +
                `${t('byok.validation.solutionsTitle')} \n` +
                `${t('byok.validation.solution1')} \n` +
                `${t('byok.validation.solution2')} \n` +
                `${t('byok.validation.solution3')} \n\n` +
                `💡 Tip: ${t('byok.validation.modelLabel')}을 해제하거나 다른 모델을 선택하세요.`
            );
            return; // 저장 차단, 모달 유지
        }

        // 8️⃣ Uncertain이 있으면 경고 후 사용자 선택 (상세 결과와 함께)
        if (uncertainProviders.length > 0) {
            const shouldProceed = confirm(
                `📊 ${t('byok.validation.title')} \n\n` +
                summaryMessage +
                `${t('byok.validation.proceedQuestion')} \n\n` +
                `${t('byok.validation.recommendation')} `
            );

            if (!shouldProceed) {
                return; // 사용자가 취소, 모달 유지
            }
        }

        // 9️⃣ 모든 검증 통과 또는 사용자 동의 - 저장 진행
        console.log(`[BYOK] ✅ Saving ${configuredProviders.length} provider(s)...`);
        console.log(`[BYOK] Summary: \n${summaryMessage} `);

        setIsSaving(true);

        // ✅ 저장 직전에 모든 API 키 trim 처리 (이중 안전장치)
        const sanitizedProviders: BYOKSettings['providers'] = {};
        for (const [id, config] of Object.entries(settings.providers)) {
            if (config) {
                sanitizedProviders[id as BYOKProviderId] = {
                    ...config,
                    apiKey: config.apiKey?.trim() || '',
                };
            }
        }

        const settingsToSave: BYOKSettings = {
            ...settings,
            providers: sanitizedProviders,
            dynamicModels: fetchedModels,
        };
        await saveBYOKSettings(settingsToSave);
        await new Promise(resolve => setTimeout(resolve, 600));
        setIsSaving(false);
        onClose();
    };

    const handleToggleEnabled = () => {
        setSettings((prev) => ({ ...prev, enabled: !prev.enabled }));
    };

    const updateProviderSettings = (providerId: BYOKProviderId, updates: Partial<NonNullable<BYOKSettings['providers'][BYOKProviderId]>>) => {
        // API 키 업데이트 시 trim 처리
        const trimmedUpdates = { ...updates };
        if ('apiKey' in trimmedUpdates && typeof trimmedUpdates.apiKey === 'string') {
            trimmedUpdates.apiKey = trimmedUpdates.apiKey.trim();

            // ✅ Edge Case: API 키 길이 제한 (chrome.storage.local 한계 방지)
            const MAX_API_KEY_LENGTH = 1000;
            if (trimmedUpdates.apiKey.length > MAX_API_KEY_LENGTH) {
                alert(`⚠️ API Key is too long!\\n\\nMaximum allowed: ${MAX_API_KEY_LENGTH} characters\\nYour key: ${trimmedUpdates.apiKey.length} characters\\n\\nPlease check if you copied the correct key.`);
                return;
            }
        }

        setSettings((prev) => ({
            ...prev,
            providers: {
                ...prev.providers,
                [providerId]: {
                    ...prev.providers[providerId] || { apiKey: '', selectedVariants: [] },
                    ...trimmedUpdates,
                },
            },
        }));

        // ✅ API 키가 변경되면 검증 상태 초기화
        if ('apiKey' in updates) {
            setValidationStatus((prev) => ({ ...prev, [providerId]: null }));
        }

        // ✅ 모델이 변경되면 검증 상태 초기화
        if ('selectedVariants' in updates) {
            setValidationStatus((prev) => ({ ...prev, [providerId]: null }));
        }
    };

    const handleValidateAPIKey = async (providerId: BYOKProviderId) => {
        const apiKey = settings.providers[providerId]?.apiKey?.trim();
        if (!apiKey) return;

        setValidating(providerId);
        const isValid = await apiService.validateAPIKey(providerId, apiKey);

        // 모델 가용성 검증 (3가지 상태: available, unavailable, uncertain)
        let modelVerification: VerificationResult = 'uncertain';
        if (isValid) {
            // ✅ 멀티 선택: 첫 번째 모델로 검증
            const selectedVariants = settings.providers[providerId]?.selectedVariants;
            if (selectedVariants && selectedVariants.length > 0) {
                modelVerification = await apiService.verifyModelAvailability(providerId, apiKey, selectedVariants[0]);
            } else {
                // 선택된 모델이 없으면 'uncertain' (검증 불가)
                modelVerification = 'uncertain';
            }
        } else {
            // API 키가 유효하지 않으면 'unavailable'
            modelVerification = 'unavailable';
        }

        setValidationStatus((prev) => ({ ...prev, [providerId]: modelVerification }));

        // 🆕 검증 성공 시 동적 모델 리스트 갱신 시도
        // 🆕 API 키가 유효하면 동적 모델 리스트 갱신 시도 (모델 검증 결과와 무관하게)
        if (isValid) {
            console.log(`[BYOK] API Key valid for ${providerId}.Refreshing user models...`);
            try {
                const updatedModels = await apiService.refreshUserModels(providerId, apiKey);
                if (updatedModels) {
                    setFetchedModels(prev => ({
                        ...prev,
                        [providerId]: updatedModels
                    }));
                    console.log(`[BYOK] UI updated with ${updatedModels.length} user - specific models for ${providerId}`);
                }
            } catch (e) {
                console.warn(`[BYOK] Failed to auto - refresh user models for ${providerId}`, e);
            }
        }

        setValidating(null);
    };

    const handleRefreshModels = async (providerId: BYOKProviderId) => {
        const apiKey = settings.providers[providerId]?.apiKey?.trim();

        console.log('[BYOK] Refreshing models for', providerId);
        setIsRefreshing(prev => ({ ...prev, [providerId]: true }));

        try {
            if (apiKey) {
                // 1. API 키가 있는 경우: 사용자 키로 직접 갱신
                const updatedModels = await apiService.refreshUserModels(providerId, apiKey);
                if (updatedModels && updatedModels.length > 0) {
                    setFetchedModels(prev => ({ ...prev, [providerId]: updatedModels }));

                    // refreshUserModels 내부에서 settings에 타임스탬프를 저장하므로, 다시 로드해야 UI에 반영됨
                    const loaded = await loadBYOKSettings();
                    if (loaded.lastRefreshTimestamp) {
                        setLastRefreshTimestamp(loaded.lastRefreshTimestamp);
                    }

                    console.log(`[BYOK] ✅ Successfully refreshed ${updatedModels.length} models for ${providerId}`);
                } else {
                    console.warn(`[BYOK] ⚠️ No models returned for ${providerId}. This may be normal if the provider doesn't support listing models.`);
                }
            } else {
                // 2. API 키가 없는 경우: 서버(프록시)에서 받아오기
                console.log('[BYOK] No API key, fetching from server (proxy)...');
                const success = await apiService.refreshAllModelsFromProxy();
                if (success) {
                    // 설정 다시 로드하여 모델 리스트 업데이트
                    const loaded = await loadBYOKSettings();
                    if (loaded.dynamicModels) {
                        setFetchedModels(loaded.dynamicModels as Record<BYOKProviderId, BYOKModelVariant[]>);
                    }
                    if (loaded.lastRefreshTimestamp) {
                        setLastRefreshTimestamp(loaded.lastRefreshTimestamp);
                    }
                    console.log('[BYOK] ✅ Successfully refreshed all models from proxy');
                } else {
                    console.error('[BYOK] ❌ Failed to refresh models from proxy');
                }
            }
        } catch (error) {
            console.error('[BYOK] Failed to refresh models:', error);
        } finally {
            setIsRefreshing(prev => ({ ...prev, [providerId]: false }));
        }
    };



    if (!isOpen) return null;

    const providerIds = Object.keys(BYOK_PROVIDERS) as BYOKProviderId[];

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${animateIn ? 'bg-black/70 backdrop-blur-md' : 'bg-black/0 backdrop-blur-none'} `}>
            <div
                className={`bg-white w-full max-w-7xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${animateIn ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'} `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/90 backdrop-blur-xl sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                                BYOK Studio
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wide border border-indigo-100">Pro</span>
                            </h2>
                            <p className="text-sm text-gray-500 font-medium">Configure your AI infrastructure</p>
                            <p className="text-[11px] text-amber-600 font-semibold mt-1">
                                * 모델 정보는 OpenRouter 기준이며, 실제 제공사 키로 사용 가능 여부는 상이할 수 있습니다.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">


                        <div className="flex items-center gap-3 bg-gray-50 px-5 py-2.5 rounded-full border border-gray-200 shadow-sm">
                            <div className={`w-2 h-2 rounded-full ${settings.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'} `} />
                            <span className={`text-sm font-semibold transition-colors ${settings.enabled ? 'text-gray-900' : 'text-gray-500'} `}>
                                {settings.enabled ? 'System Active' : 'System Disabled'}
                            </span>
                            <button
                                onClick={handleToggleEnabled}
                                className={`relative w-11 h-6 rounded-full transition-all duration-300 ml-2 ${settings.enabled ? 'bg-indigo-600' : 'bg-gray-300'} `}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${settings.enabled ? 'translate-x-5' : 'translate-x-0'} `} />
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-2.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden bg-gray-50/50">
                    {/* Sidebar (Providers) */}
                    <div className="w-72 bg-white border-r border-gray-200 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="p-6 pb-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">AI Providers</h3>
                            <div className="space-y-2">
                                {providerIds.map((providerId) => {
                                    const provider = BYOK_PROVIDERS[providerId];
                                    const isConfigured = Boolean(settings.providers[providerId]?.apiKey);
                                    const isSelected = selectedProvider === providerId;
                                    const isValid = validationStatus[providerId];

                                    return (
                                        <button
                                            key={providerId}
                                            onClick={() => setSelectedProvider(providerId)}
                                            className={`w-full group relative px-4 py-3.5 rounded-xl transition-all duration-200 border text-left ${isSelected
                                                ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                                : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                                } `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors shadow-sm ${isSelected ? 'bg-white text-indigo-600' : 'bg-gray-100 text-gray-500 group-hover:bg-white'
                                                        } `}>
                                                        {provider.name[0]}
                                                    </div>
                                                    <div>
                                                        <p className={`font-bold text-sm transition-colors ${isSelected ? 'text-indigo-900' : 'text-gray-700'} `}>
                                                            {provider.name}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                                                                {fetchedModels[providerId]?.length || 0} Models
                                                            </span>
                                                            {validationStatus[providerId] === 'available' ? (
                                                                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-400/10 px-2 py-1 rounded">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span>Available</span>
                                                                </div>
                                                            ) : validationStatus[providerId] === 'unavailable' ? (
                                                                <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium bg-red-400/10 px-2 py-1 rounded">
                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                    <span>Unavailable</span>
                                                                </div>
                                                            ) : validationStatus[providerId] === 'uncertain' ? (
                                                                <div className="flex items-center gap-1.5 text-amber-500 text-xs font-medium bg-amber-500/10 px-2 py-1 rounded" title="API Key is valid, but we couldn't verify the specific model's availability. You can likely use it.">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    <span>Verified (Model Check Skipped)</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                {isConfigured && (
                                                    <div
                                                        className={`w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${isValid === 'available' ? 'bg-green-500' :
                                                            isValid === 'unavailable' ? 'bg-red-500' :
                                                                isValid === 'uncertain' ? 'bg-amber-400' :
                                                                    'bg-gray-300'
                                                            } `}
                                                        title={
                                                            isValid === 'available' ? '✅ Model available' :
                                                                isValid === 'unavailable' ? '❌ Model unavailable' :
                                                                    isValid === 'uncertain' ? 'Key is valid, but model access could not be fully verified.' :
                                                                        'Not verified'
                                                        }
                                                    />
                                                )}
                                            </div>
                                            {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                        {selectedProvider ? (
                            <ProviderConfig
                                providerId={selectedProvider}
                                settings={settings}
                                onUpdate={updateProviderSettings}
                                onSettingsChange={setSettings}
                                onValidate={handleValidateAPIKey}
                                showApiKey={showApiKey[selectedProvider]}
                                toggleShowApiKey={() => setShowApiKey(prev => ({ ...prev, [selectedProvider]: !prev[selectedProvider] }))}
                                validating={validating === selectedProvider}
                                validationStatus={validationStatus[selectedProvider]}
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                activeCategory={activeCategory}
                                setActiveCategory={setActiveCategory}
                                onRefreshModels={() => handleRefreshModels(selectedProvider)}
                                isRefreshing={isRefreshing[selectedProvider]}
                                dynamicModels={fetchedModels[selectedProvider]}
                                lastRefreshTimestamp={lastRefreshTimestamp}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center rotate-12">
                                    <Sparkles className="w-10 h-10 text-gray-300 -rotate-12" />
                                </div>
                                <p className="text-xl font-medium text-gray-500">Select a provider to configure</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-white border-t border-gray-200 flex items-center justify-between z-20">
                    <div className="text-sm text-gray-500 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="font-medium">All systems operational</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-xs">
                            {lastRefreshTimestamp
                                ? `Last Updated: ${new Date(lastRefreshTimestamp).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                } `
                                : 'Not yet refreshed'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-8 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center gap-2 shadow-gray-900/20"
                        >
                            {isSaving ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Sub Components ---

interface ProviderConfigProps {
    providerId: BYOKProviderId;
    settings: BYOKSettings;
    onUpdate: (providerId: BYOKProviderId, updates: any) => void;
    onSettingsChange: (newSettings: BYOKSettings) => void; // ✅ 추가
    onValidate: (providerId: BYOKProviderId) => void;
    showApiKey: boolean;
    toggleShowApiKey: () => void;
    validating: boolean;
    validationStatus: VerificationResult | null;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    activeCategory: Category;
    setActiveCategory: (c: Category) => void;
    onRefreshModels: () => void;
    isRefreshing: boolean;
    dynamicModels?: BYOKModelVariant[];
    lastRefreshTimestamp: number | null;
}

function ProviderConfig({
    providerId,
    settings,
    onUpdate,
    onSettingsChange,
    onValidate,
    showApiKey,
    toggleShowApiKey,
    validating,
    validationStatus,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    onRefreshModels,
    isRefreshing,
    dynamicModels,
    lastRefreshTimestamp,
}: ProviderConfigProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [sortBy, setSortBy] = useState<'popular' | 'latest'>('latest');
    const provider = BYOK_PROVIDERS[providerId];
    const config = settings.providers[providerId];

    // 동적 모델이 있으면 그것을 사용, 없으면 정적 모델 사용
    let availableVariants = dynamicModels && dynamicModels.length > 0 ? dynamicModels : provider.variants;

    // 무료(OpenRouter 전용) 모델은 OpenRouter 탭에서만 노출
    // 🆕 수정: 동적 모델(사용자 로드)인 경우는 필터링하지 않음 (가격 정보가 없을 수 있으므로)
    if (providerId !== 'openrouter' && (!dynamicModels || dynamicModels.length === 0)) {
        availableVariants = availableVariants.filter(
            (v) => (v.costPer1MInput ?? 0) > 0 || (v.costPer1MOutput ?? 0) > 0
        );
    }

    console.log('[BYOK] ProviderConfig - dynamicModels:', dynamicModels);
    console.log('[BYOK] ProviderConfig - availableVariants:', availableVariants);

    // 🔍 디버깅: 첫 3개 모델의 created/popularity 확인
    if (availableVariants.length > 0) {
        console.log('[BYOK] 📊 First 3 models (checking created/popularity):');
        availableVariants.slice(0, 3).forEach((model, idx) => {
            console.log(`  [${idx}] ${model.name} `);
            console.log(`      created: ${model.created} `);
            console.log(`      popularity: ${model.popularity} `);
            console.log(`      isNew: ${model.isNew} `);
        });
    }

    // ✅ 멀티 선택: selectedVariants 배열 사용
    const selectedVariants = config?.selectedVariants || [];
    const isVariantSelected = (variantId: string) => selectedVariants.includes(variantId);
    // 대표 variant (파라미터 표시용): 첫 번째 선택된 모델 또는 기본값
    const primaryVariant = availableVariants.find(v => selectedVariants.includes(v.id)) || availableVariants[0];

    // Filter and sort variants based on search, category, and sort order
    const filteredVariants = useMemo(() => {
        const filtered = availableVariants.filter(variant => {
            const matchesSearch = variant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                variant.description.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (activeCategory === 'all') return true;
            if (activeCategory === 'free') return variant.isFree === true;
            if (activeCategory === 'reasoning') return variant.capabilities?.includes('reasoning');
            if (activeCategory === 'coding') return variant.capabilities?.includes('coding');
            if (activeCategory === 'vision') return variant.capabilities?.includes('vision');
            if (activeCategory === 'realtime') return variant.capabilities?.includes('realtime');

            return true;
        });

        // 정렬 적용
        return filtered.sort((a, b) => {
            if (sortBy === 'latest') {
                // 최신순: created 내림차순 (높은 timestamp가 더 최근)
                // Fallback: isNew가 있으면 우선순위, 없으면 0
                const aScore = a.created || (a.isNew ? 9999999999 : 0);
                const bScore = b.created || (b.isNew ? 9999999999 : 0);
                return bScore - aScore;
            } else {
                // 인기순: popularity 내림차순 (높은 ranking이 더 인기)
                // Fallback: isRecommended가 있으면 우선순위, 없으면 0
                const aScore = a.popularity || (a.isRecommended ? 1000 : 0);
                const bScore = b.popularity || (b.isRecommended ? 1000 : 0);
                return bScore - aScore;
            }
        });
    }, [availableVariants, searchQuery, activeCategory, sortBy]);

    // OpenRouter 탭에서만 Free 카테고리 표시
    const categories = useMemo(() => {
        const baseCategories: { id: Category; label: string; icon: any }[] = [
            { id: 'all', label: 'All Models', icon: Layers },
        ];

        // Free 버튼은 OpenRouter에서만 표시
        if (providerId === 'openrouter') {
            baseCategories.push({ id: 'free', label: 'Free', icon: Sparkles });
        }

        baseCategories.push(
            { id: 'reasoning', label: 'Reasoning', icon: Brain },
            { id: 'coding', label: 'Coding', icon: Code },
            { id: 'vision', label: 'Vision', icon: Eye },
            { id: 'realtime', label: 'Realtime', icon: Zap }
        );

        return baseCategories;
    }, [providerId]);

    return (
        <div className="p-8 pb-20 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        {provider.name}
                        <a href={provider.websiteUrl} target="_blank" rel="noopener" className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                        <a href={provider.apiKeyUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
                            Get API Key
                        </a>
                        <span className="text-gray-300">|</span>
                        <a href={provider.apiDocsUrl} target="_blank" rel="noopener" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                            Documentation
                        </a>
                    </div>
                </div>

                {/* Refresh Button */}
                <div className="flex flex-col items-end gap-1">
                    <button
                        onClick={onRefreshModels}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''} `} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh Models'}
                    </button>
                    {lastRefreshTimestamp && (
                        <span className="text-[10px] text-gray-400 font-medium">
                            Updated: {new Date(lastRefreshTimestamp).toLocaleString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </span>
                    )}
                </div>
            </div>

            {/* API Key Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <label className="block text-sm font-bold text-gray-900">API Credentials</label>
                <div className="flex gap-3">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400 font-mono text-xs">KEY</span>
                        </div>
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            value={config?.apiKey || ''}
                            onChange={(e) => onUpdate(providerId, { apiKey: e.target.value })}
                            onBlur={() => config?.apiKey && onValidate(providerId)}
                            placeholder={`sk -...`}
                            className="w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all font-mono text-sm"
                        />
                        <button
                            onClick={toggleShowApiKey}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <button
                        onClick={() => onValidate(providerId)}
                        disabled={!config?.apiKey || validating}
                        className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${validationStatus === 'available' ? 'bg-green-100 text-green-700 border border-green-200' :
                            validationStatus === 'unavailable' ? 'bg-red-100 text-red-700 border border-red-200' :
                                validationStatus === 'uncertain' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                    'bg-gray-900 text-white hover:bg-black hover:shadow-lg'
                            } disabled: opacity - 50 disabled: shadow - none`}
                        title={
                            validationStatus === 'available' ? '✅ Model is available with your API key' :
                                validationStatus === 'unavailable' ? '❌ Model is not available (check API key or model access)' :
                                    validationStatus === 'uncertain' ? 'API Key is valid, but we couldn\'t verify the specific model\'s availability. You can likely use it.' :
                                        'Click to verify model availability'
                        }
                    >
                        {validating ? <Loader className="w-4 h-4 animate-spin" /> :
                            validationStatus === 'available' ? <Check className="w-4 h-4" /> :
                                validationStatus === 'unavailable' ? <AlertCircle className="w-4 h-4" /> :
                                    validationStatus === 'uncertain' ? <CheckCircle2 className="w-4 h-4" /> :
                                        <Zap className="w-4 h-4" />}
                        {validating ? 'Checking...' :
                            validationStatus === 'available' ? '✅ Available' :
                                validationStatus === 'unavailable' ? '❌ Unavailable' :
                                    validationStatus === 'uncertain' ? 'Verified (Check Skipped)' :
                                        'Verify'}
                    </button>
                </div>
            </div>

            {/* Model Configuration */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-900">
                            Model Selection
                            <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                {availableVariants.length} Available
                            </span>
                        </h3>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search models..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-48"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <Sliders className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'popular' | 'latest')}
                                className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer appearance-none"
                            >
                                <option value="popular">인기순 (Popular)</option>
                                <option value="latest">최신순 (Latest)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeCategory === cat.id
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                } `}
                        >
                            <cat.icon className="w-4 h-4" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Variant Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {filteredVariants.map((variant) => (
                        <ModelVariantCard
                            key={variant.id}
                            variant={variant}
                            providerId={providerId}
                            isSelected={isVariantSelected(variant.id)}
                            onToggleSelect={() => {
                                const currentSelected = config?.selectedVariants || [];
                                const newSelected = currentSelected.includes(variant.id)
                                    ? currentSelected.filter(id => id !== variant.id)
                                    : [...currentSelected, variant.id];
                                onUpdate(providerId, { selectedVariants: newSelected });
                            }}
                            settings={settings}
                            onUpdateSettings={async (newSettings) => {
                                // modelOverrides 업데이트
                                const modelKey = `${providerId}-${variant.id}`;
                                const updatedOverrides = {
                                    ...settings.modelOverrides,
                                    [modelKey]: newSettings,
                                };
                                const updatedSettings = { ...settings, modelOverrides: updatedOverrides };

                                // ✅ 로컬 상태 먼저 업데이트 (즉시 UI 반영)
                                onSettingsChange(updatedSettings);

                                // Storage에 저장
                                await saveBYOKSettings(updatedSettings);
                            }}
                        />
                    ))}
                    {filteredVariants.length === 0 && (
                        <div className="col-span-2 py-8 text-center text-gray-400 text-sm">
                            No models found matching your criteria.
                        </div>
                    )}
                </div>

                {/* Advanced Parameters */}
                <div className="space-y-6 pt-4 border-t border-gray-100">
                    {/* Reasoning Effort (OpenAI o1/o3/GPT-5) */}
                    {(primaryVariant?.supportsReasoningEffort || primaryVariant?.capabilities?.includes('reasoning')) && providerId === 'openai' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-purple-500" />
                                    Reasoning Effort
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded-full font-bold">SMART</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {(['low', 'medium', 'high'] as ReasoningEffort[]).map((effort) => (
                                    <button
                                        key={effort}
                                        onClick={() => onUpdate(providerId, { reasoningEffort: effort })}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${(config?.reasoningEffort || 'medium') === effort
                                            ? 'bg-purple-600 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            } `}
                                    >
                                        {REASONING_EFFORT_LABELS[effort].label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">
                                {REASONING_EFFORT_LABELS[config?.reasoningEffort || 'medium'].description}
                            </p>
                        </div>
                    )}

                    {/* Thinking Budget (Anthropic) */}
                    {(primaryVariant?.supportsThinkingBudget || (providerId === 'anthropic' && primaryVariant?.capabilities?.includes('reasoning'))) && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-amber-500" />
                                    Thinking Budget
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">EXTENDED</span>
                                </label>
                                <span className="text-sm font-mono font-bold text-amber-600">
                                    {(config?.thinkingBudget || 0).toLocaleString()} tokens
                                </span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={Math.min(32000, (primaryVariant.maxOutputTokens || 8192) - 1000)}
                                step={1024}
                                value={config?.thinkingBudget || 0}
                                onChange={(e) => onUpdate(providerId, { thinkingBudget: parseInt(e.target.value) })}
                                className="w-full accent-amber-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-gray-500">
                                Allocates tokens for internal reasoning. Set to 0 to disable.
                            </p>
                        </div>
                    )}

                    {/* Temperature (Standard) */}
                    {provider.supportsTemperature && !primaryVariant?.id.startsWith('o1') && !primaryVariant?.id.startsWith('o3') && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    Temperature
                                </label>
                                <span className="text-sm font-mono font-bold text-blue-600">
                                    {(config?.customTemperature ?? provider.defaultTemperature ?? 1.0).toFixed(1)}
                                </span>
                            </div>
                            <input
                                type="range"
                                min={provider.temperatureRange?.[0] || 0}
                                max={provider.temperatureRange?.[1] || 2}
                                step={0.1}
                                value={config?.customTemperature ?? provider.defaultTemperature ?? 1.0}
                                onChange={(e) => onUpdate(providerId, { customTemperature: parseFloat(e.target.value) })}
                                className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                                <span>Precise</span>
                                <span>Balanced</span>
                                <span>Creative</span>
                            </div>
                        </div>
                    )}

                    {/* Advanced Settings Toggle */}
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors w-full pt-4 border-t border-gray-100"
                    >
                        <Sliders className="w-4 h-4" />
                        Advanced Settings
                        {showAdvanced ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
                    </button>

                    {/* Advanced Settings Panel */}
                    {showAdvanced && (
                        <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2">
                            {/* Top P & Top K */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700">Top P</label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={1}
                                        step={0.05}
                                        value={config?.topP ?? 1.0}
                                        onChange={(e) => onUpdate(providerId, { topP: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700">Top K</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={config?.topK ?? 0}
                                        onChange={(e) => onUpdate(providerId, { topK: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                            </div>

                            {/* Penalties */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-bold text-gray-700">Frequency Penalty</label>
                                        <span className="text-xs text-gray-500">{config?.frequencyPenalty ?? 0}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-2}
                                        max={2}
                                        step={0.1}
                                        value={config?.frequencyPenalty ?? 0}
                                        onChange={(e) => onUpdate(providerId, { frequencyPenalty: parseFloat(e.target.value) })}
                                        className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-xs font-bold text-gray-700">Presence Penalty</label>
                                        <span className="text-xs text-gray-500">{config?.presencePenalty ?? 0}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={-2}
                                        max={2}
                                        step={0.1}
                                        value={config?.presencePenalty ?? 0}
                                        onChange={(e) => onUpdate(providerId, { presencePenalty: parseFloat(e.target.value) })}
                                        className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Seed & Format */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700">Seed</label>
                                    <input
                                        type="number"
                                        placeholder="Random"
                                        value={config?.seed ?? ''}
                                        onChange={(e) => onUpdate(providerId, { seed: e.target.value ? parseInt(e.target.value) : undefined })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700">Response Format</label>
                                    <select
                                        value={config?.responseFormat ?? 'text'}
                                        onChange={(e) => onUpdate(providerId, { responseFormat: e.target.value as any })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                                    >
                                        <option value="text">Text</option>
                                        <option value="json_object">JSON Object</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ✨ 모델 카드 컴포넌트 (Settings 드롭다운 포함)
// OpenRouter Variants는 이제 src/config/providerSettingsConfig.ts에서 관리됩니다
interface ModelVariantCardProps {
    variant: BYOKModelVariant;
    providerId: BYOKProviderId;
    isSelected: boolean;
    onToggleSelect: () => void;
    settings: BYOKSettings;
    onUpdateSettings: (newSettings: ModelOverrideSettings) => Promise<void>;
}

function ModelVariantCard({ variant, providerId, isSelected, onToggleSelect, settings, onUpdateSettings }: ModelVariantCardProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const modelKey = `${providerId}-${variant.id}`;
    const modelOverride = settings.modelOverrides?.[modelKey] || { useDefaults: true };
    const defaultConfig = settings.providers?.[providerId];

    const hasCustomSettings = modelOverride && !modelOverride.useDefaults;

    const handleSettingChange = async <K extends keyof ModelOverrideSettings>(key: K, value: ModelOverrideSettings[K]) => {
        const newSettings = { ...modelOverride, [key]: value };
        await onUpdateSettings(newSettings);
    };

    return (
        <div className={`relative rounded-xl border-2 transition-all duration-200 group ${isSelected
                ? 'border-indigo-500 bg-indigo-50/50 shadow-md'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
            }`}>
            {/* 메인 카드 영역 (클릭 시 선택/해제) */}
            <button
                onClick={onToggleSelect}
                className="w-full p-4 text-left"
            >
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <span className="font-bold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                            {variant.name}
                        </span>
                        {providerId === 'openrouter' && (
                            <a
                                href={`https://openrouter.ai/${variant.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0 p-0.5 hover:bg-indigo-50 rounded"
                                title="View on OpenRouter"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                        {variant.isNew && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded-full tracking-wide">NEW</span>
                        )}
                        {(variant as any).isRecommended && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase rounded-full tracking-wide">TOP</span>
                        )}
                    </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 h-8 mb-3">{variant.description}</p>

                {/* Capabilities Badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                    {variant.capabilities?.map(cap => (
                        <span key={cap} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded uppercase font-medium border border-gray-200">
                            {cap}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">
                        {variant.contextWindow.toLocaleString()} ctx
                    </span>
                    {variant.isFree ? (
                        <span className="text-green-600 font-bold">Free</span>
                    ) : variant.costPer1MInput > 0 || variant.costPer1MOutput > 0 ? (
                        <span>
                            ${variant.costPer1MInput.toFixed(2)}/${variant.costPer1MOutput.toFixed(2)}
                        </span>
                    ) : (
                        <span className="text-gray-400 italic">Pricing varies</span>
                    )}
                </div>
            </button>

            {/* Settings 버튼 (카드 하단) */}
            <div className="px-4 pb-3 pt-0">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsSettingsOpen(!isSettingsOpen);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${isSettingsOpen || hasCustomSettings
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                        }`}
                >
                    <Sliders className="w-3.5 h-3.5" />
                    {hasCustomSettings ? 'Custom Settings' : 'Settings'}
                    {isSettingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {/* Settings 드롭다운 */}
                {isSettingsOpen && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3" onClick={(e) => e.stopPropagation()}>
                        {/* Use Defaults Toggle - ON이면 기본값 사용, OFF면 커스텀 설정 사용 */}
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-700">Use Default Settings</span>
                            <button
                                onClick={() => handleSettingChange('useDefaults', !modelOverride.useDefaults)}
                                className={`w-9 h-5 rounded-full transition-colors relative ${modelOverride.useDefaults ? 'bg-purple-500' : 'bg-gray-300'
                                    }`}
                            >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${modelOverride.useDefaults ? 'translate-x-4' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>

                        {/* Custom Settings (useDefaults가 OFF일 때 = 커스텀 설정 모드) */}
                        {/* ProviderSettingsPanel로 회사별 동적 UI 렌더링 */}
                        {modelOverride.useDefaults === false && (
                            <ProviderSettingsPanel
                                providerId={providerId}
                                modelId={variant.id}
                                capabilities={variant.capabilities}
                                settings={modelOverride}
                                defaultSettings={defaultConfig}
                                onSettingChange={handleSettingChange}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
