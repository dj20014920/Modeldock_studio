## 🔍 BYOK 재부팅 후 상태 복원 플로우 완전 분석

### 📋 전체 호출 체인

```
사용자 재부팅 → BYOKModal 열기
  ↓
useEffect (isOpen=true)
  ↓
loadSettings() 실행
  ↓
Step 1: loadBYOKSettings()
  - chrome.storage.local.get(['byokSettings'])
  - 반환: { enabled, providers: { openai: { apiKey: "sk-...", selectedVariant: "gpt-4o" }}, dynamicModels, lastRefreshTimestamp }
  ↓
Step 2: provider 순회
  - configuredProviders = ['openai']  (apiKey가 있는 것들)
  ↓  
Step 3: getStoredVerificationStatus('openai', apiKey)
  ↓
Step 4: getVerificationCache('openai', 'key_validation', apiKey)
  ↓
Step 5: hashKey(apiKey)
  - trimmedKey = apiKey.trim()
  - SHA-256 해시
  - 반환: "a1b2c3d4..."
  ↓
Step 6: chrome.storage.local.get('verification_openai_key_validation_[hash]')
  - 캐시 키 확인
  - TTL 체크 (24시간)
  - 반환: 'available' | 'unavailable' | null
  ↓
Step 7: 상태 복원
  - restoredStatus['openai'] = keyStatus
  - setValidationStatus({ openai: keyStatus })
  ↓
Step 8: UI 렌더링
  - validationStatus['openai'] === 'available' → ✅ 초록
  - validationStatus['openai'] === 'unavailable' → ❌ 빨강
  - validationStatus['openai'] === 'uncertain' → ⚠️ 노랑
  - validationStatus['openai'] === null → 표시 안 함
```

### 🐛 문제 가능성 체크리스트

1. **새 빌드 미적용?**
   - dist/ 폴더가 업데이트 되었는가?
   - Chrome에서 Extension Reload 했는가?

2. **캐시 키 불일치?**
   - hashKey가 일관되게 생성되는가?
   - API 키에 공백이 있는가?

3. **loadSettings 미실행?**
   - useEffect가 제대로 실행되는가?
   - getStoredVerificationStatus가 호출되는가?

4. **TTL 만료?**
   - 마지막 검증 후 24시간이 지났는가?

5. **캐시 저장 실패?**
   - setVerificationCache가 제대로 호출되었는가?
   - chrome.storage.local.set이 성공했는가?

### 🔧 디버깅 체크포인트

각 단계에서 콘솔 로그 출력:

```typescript
// loadSettings
console.log('[BYOK DEBUG] 1. loadSettings started');
console.log('[BYOK DEBUG] 2. loaded settings:', loaded);
console.log('[BYOK DEBUG] 3. configured providers:', configuredProviders);

// getStoredVerificationStatus
console.log('[BYOK DEBUG] 4. checking provider:', id);
console.log('[BYOK DEBUG] 5. apiKey (trimmed):', apiKey.substring(0, 10) + '...');
console.log('[BYOK DEBUG] 6. keyStatus from cache:', keyStatus);

// 상태 복원
console.log('[BYOK DEBUG] 7. restoredStatus:', restoredStatus);
```

### ⚠️ 확인해야 할 것

1. Chrome DevTools Console에 `[BYOK DEBUG]` 로그가 보이는가?
2. `apiKey`가 실제로 trim되고 있는가?
3. `getVerificationCache`가 반환하는 값은 무엇인가?
4. `chrome.storage.local`에 실제로 데이터가 있는가?
