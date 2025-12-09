/**
 * useBYOKModels Hook
 * 
 * BYOK (Bring Your Own Key) 모델 목록을 로드하는 공통 훅.
 * Sidebar와 SidePanelApp 모두에서 재사용 가능.
 * 
 * DRY 원칙: 중복 로직 제거
 */
import { useState, useEffect } from 'react';
import { loadBYOKSettings } from '../services/byokService';

export interface BYOKModelItem {
  id: string;
  name: string;
  providerId: string;
  variantId?: string;
  iconColor: string;
}

/**
 * BYOK 모델 목록을 로드하고 설정 변경을 감지하는 훅
 */
export function useBYOKModels() {
  const [byokModels, setByokModels] = useState<BYOKModelItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadBYOK = async () => {
      setIsLoading(true);
      try {
        const settings = await loadBYOKSettings();
        if (!settings.enabled) {
          setByokModels([]);
          return;
        }

        const models = Object.entries(settings.providers)
          .filter(([_, config]) => {
            const hasVariants = config.selectedVariants && config.selectedVariants.length > 0;
            const hasLegacyVariant = (config as any).selectedVariant;
            return config.apiKey && (hasVariants || hasLegacyVariant);
          })
          .flatMap(([providerId, config]) => {
            // 하위 호환성: 기존 selectedVariant를 selectedVariants로 변환
            let variants = config.selectedVariants || [];
            if (variants.length === 0 && (config as any).selectedVariant) {
              variants = [(config as any).selectedVariant];
            }

            // 각 variant를 별도 항목으로 펼침
            return variants.map(variantId => {
              // 모델명 추출: 'openai/gpt-4o' → 'gpt-4o'
              const modelName = variantId.includes('/') ? variantId.split('/').pop()! : variantId;

              return {
                id: `byok-${providerId}-${variantId}`,
                name: modelName,
                providerId,
                variantId,
                iconColor: 'bg-purple-500'
              };
            });
          });

        setByokModels(models);
      } catch (error) {
        console.error('[useBYOKModels] Failed to load BYOK settings:', error);
        setByokModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBYOK();

    // chrome.storage 변경 감지
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.byokSettings) {
        loadBYOK();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  return { byokModels, isLoading };
}

export default useBYOKModels;
