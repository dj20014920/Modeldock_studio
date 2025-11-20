#!/bin/bash
# Electron 로컬 설정 복원 스크립트
# AI Studio에서 pull 후 이 스크립트를 실행하세요

echo "🔧 Electron 개발 환경 설정 복원 중..."

# 1. electron/tsconfig.json 수정
cat > electron/tsconfig.json << 'EOF'
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
EOF

# 2. electron/preload.ts에 Navigator 타입 선언 추가 (파일 상단에 없으면 추가)
if ! grep -q "declare global" electron/preload.ts; then
  # 임시 파일 생성
  cat > /tmp/preload_header.ts << 'EOF'
import { contextBridge, ipcRenderer } from 'electron';
import path from 'node:path';

// Augment global Navigator type to include \`webdriver\` (used defensively below).
declare global {
  interface Navigator {
    webdriver?: boolean;
  }
}

EOF
  
  # 기존 파일에서 import 부분 제거하고 새 헤더와 합치기
  tail -n +3 electron/preload.ts > /tmp/preload_body.ts
  cat /tmp/preload_header.ts /tmp/preload_body.ts > electron/preload.ts
  rm /tmp/preload_header.ts /tmp/preload_body.ts
fi

# 3. package.json의 dev 스크립트 수정
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' 's|"dev": "concurrently \\"vite\\" \\"wait-on http://localhost:5173 && tsc -p electron/tsconfig.json && electron .\\"|"dev": "concurrently \\"vite\\" \\"wait-on http://localhost:5173 \&\& tsc -p electron/tsconfig.json \&\& VITE_DEV_SERVER_URL=http://localhost:5173 electron .\\"|' package.json
else
  # Linux
  sed -i 's|"dev": "concurrently \\"vite\\" \\"wait-on http://localhost:5173 && tsc -p electron/tsconfig.json && electron .\\"|"dev": "concurrently \\"vite\\" \\"wait-on http://localhost:5173 \&\& tsc -p electron/tsconfig.json \&\& VITE_DEV_SERVER_URL=http://localhost:5173 electron .\\"|' package.json
fi

# 4. electron/main.ts에 fs import 확인 및 추가
if ! grep -q "import fs from 'node:fs'" electron/main.ts; then
  # process import 다음에 fs import 추가
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "/import process from 'node:process';/a\\
import fs from 'node:fs';
" electron/main.ts
  else
    sed -i "/import process from 'node:process';/a import fs from 'node:fs';" electron/main.ts
  fi
fi

# 5. components/ModelFrame.tsx의 allowpopups 속성 수정
if grep -q 'allowpopups={true}' components/ModelFrame.tsx; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/allowpopups={true}/allowpopups="true"/g' components/ModelFrame.tsx
  else
    sed -i 's/allowpopups={true}/allowpopups="true"/g' components/ModelFrame.tsx
  fi
  echo "  ✓ ModelFrame allowpopups 수정"
fi

echo "✅ 설정 복원 완료!"
echo ""
echo "다음 명령어로 실행하세요:"
echo "  yarn electron"
