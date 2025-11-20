# ModelDock Studio - Electron 개발 환경 설정

## 🚨 AI Studio Pull 후 에러 해결 방법

AI Studio에서 코드를 pull하면 로컬 Electron 설정이 초기화됩니다.
다음 명령어로 **즉시 복원**할 수 있습니다:

```bash
./restore-electron-config.sh
```

또는 수동으로 아래 단계를 따르세요.

---

## 📋 수동 설정 가이드

### 1. `electron/tsconfig.json` 수정

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "outDir": "../dist-electron",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "electron"]
  },
  "include": ["main.ts", "preload.ts"]
}
```

**추가된 항목:**
- `"lib": [..., "DOM", "DOM.Iterable"]` - DOM 타입 지원
- `"skipLibCheck": true` - electron.d.ts 에러 무시
- `"types": ["node", "electron"]` - 명시적 타입 선언

---

### 2. `electron/preload.ts` 상단에 추가

```typescript
// Augment global Navigator type to include `webdriver` (used defensively below).
declare global {
  interface Navigator {
    webdriver?: boolean;
  }
}
```

이 선언이 **import 직후, __dirname 선언 전**에 와야 합니다.

---

### 3. `package.json` dev 스크립트 수정

**기존:**
```json
"dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && tsc -p electron/tsconfig.json && electron .\""
```

**수정:**
```json
"dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && tsc -p electron/tsconfig.json && VITE_DEV_SERVER_URL=http://localhost:5173 electron .\""
```

**핵심:** `electron .` 앞에 `VITE_DEV_SERVER_URL=http://localhost:5173` 추가

---

### 4. `electron/main.ts` import 확인

파일 상단에 다음이 있는지 확인:

```typescript
import fs from 'node:fs';
```

없으면 다른 import문들 아래에 추가하세요.

---

### 5. `components/ModelFrame.tsx` 수정

**문제:** React가 boolean 값을 webview 속성에 직접 전달하면 경고 발생

**수정:**
```tsx
// 기존 (잘못됨)
<webview allowpopups={true} />

// 수정 (올바름)
<webview allowpopups="true" />
```

**주의:** `isLoading()` 같은 webview 메서드는 DOM attach 후에만 호출 가능합니다.

---

## 🔄 AI Studio 작업 플로우 (권장)

### 방법 1: 브랜치 분리 전략
```bash
# 1. Electron 설정을 별도 브랜치로 관리
git checkout -b electron-config
git add electron/ package.json
git commit -m "chore: Electron 로컬 설정"

# 2. AI Studio 작업은 main 브랜치에서
git checkout main
# ... AI Studio에서 작업 및 pull ...

# 3. 작업 후 Electron 설정 병합
git merge electron-config --no-commit
# 충돌 해결 후
git commit
```

### 방법 2: 스태시 활용
```bash
# AI Studio pull 전에 로컬 설정 저장
git stash push -m "Electron configs" electron/ package.json

# AI Studio에서 pull
git pull

# 로컬 설정 복원
git stash pop
```

### 방법 3: 복원 스크립트 사용 (가장 간단)
```bash
# AI Studio pull 후
git pull

# 즉시 복원
./restore-electron-config.sh

# 실행
yarn electron
```

---

## ⚠️ 자주 발생하는 에러

### 에러 1: `Property 'webdriver' does not exist on type 'Navigator'`
**원인:** `electron/preload.ts`에 Navigator 타입 선언 누락  
**해결:** 위의 2번 항목 적용

### 에러 2: `Cannot find name 'HTMLElementEventMap'`
**원인:** `electron/tsconfig.json`에 DOM lib 누락  
**해결:** 위의 1번 항목 적용

### 에러 3: `Failed to load URL: file:///...dist/index.html`
**원인:** 환경변수가 electron 프로세스에 전달 안 됨  
**해결:** 위의 3번 항목 적용

### 에러 4: `Object has been destroyed`
**원인:** webview contents가 파괴된 후 접근  
**해결:** 이미 main.ts에 `contents.isDestroyed()` 체크가 추가되어 있음

### 에러 5: `The WebView must be attached to the DOM`
**원인:** useEffect에서 webview의 `isLoading()` 메서드를 DOM attach 전에 호출  
**해결:** 해당 메서드 호출 제거, 이벤트 리스너로만 상태 관리

### 에러 6: `Warning: Received true for a non-boolean attribute allowpopups`
**원인:** React가 webview의 boolean 속성을 인식 못함  
**해결:** `allowpopups={true}` → `allowpopups="true"` (문자열로 변경)

---

## 🎯 빠른 시작

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn electron

# 빌드
yarn build
```

---

## 📌 주의사항

1. **AI Studio에서 `electron/` 폴더 수정 금지**
   - Electron 설정은 로컬에서만 관리
   - AI Studio는 React UI 컴포넌트만 수정

2. **Pull 후 항상 설정 확인**
   - `./restore-electron-config.sh` 실행
   - 또는 수동으로 4가지 항목 체크

3. **`.gitignore` 확인**
   - `dist-electron/`이 ignore되는지 확인
   - 빌드 아티팩트는 커밋하지 않음

---

## 🛠️ 문제 해결

문제가 계속되면:

```bash
# 1. 캐시 완전 삭제
rm -rf node_modules dist dist-electron

# 2. 재설치
yarn install

# 3. 설정 복원
./restore-electron-config.sh

# 4. 실행
yarn electron
```

---

생성일: 2025-11-20  
마지막 업데이트: 2025-11-20
