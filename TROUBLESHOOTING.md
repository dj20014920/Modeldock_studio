# 🔧 ModelDock Studio 문제 해결 가이드

## 📋 목차

- [설치 관련](#설치-관련)
- [실행 오류](#실행-오류)
- [성능 문제](#성능-문제)
- [특정 AI 모델 문제](#특정-ai-모델-문제)
- [BYOK (API 키) 문제](#byok-api-키-문제)

---

## 설치 관련

### ❌ "압축해제된 확장 프로그램을 로드할 수 없습니다"

**증상:**
```
Could not load manifest
```

**원인 및 해결:**

1. **잘못된 폴더 선택**
   ```
   ❌ 압축 파일 자체를 선택함
   ✅ 압축 해제된 폴더를 선택해야 함
   ```

2. **manifest.json 손상**
   ```bash
   # 파일 존재 확인
   ls -la manifest.json
   
   # JSON 유효성 검사
   cat manifest.json | jq .
   ```

3. **권한 문제 (macOS/Linux)**
   ```bash
   chmod -R 755 modeldock-studio-v1.0.0/
   ```

---

### ⚠️ "이 확장 프로그램은 개발자 모드로 실행 중입니다"

**증상:**
Chrome 상단에 노란색 경고 배너

**해결:**

이것은 **정상**입니다. 크롬 웹스토어가 아닌 수동 설치이므로 항상 표시됩니다.

**옵션:**
1. **무시하기** - "X" 버튼으로 닫기 (매번 나타남)
2. **정책 설정** (고급 사용자용)
   ```json
   // macOS: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
   {
     "ExtensionSettings": {
       "YOUR_EXTENSION_ID": {
         "installation_mode": "allowed"
       }
     }
   }
   ```

---

### 🔄 "Chrome 재시작 시 비활성화됨"

**증상:**
브라우저를 닫았다 열면 확장 프로그램이 꺼짐

**원인:**
1. 확장 프로그램 폴더를 이동하거나 삭제함
2. 회사/학교 관리 정책

**해결:**

**1단계: 폴더 영구 위치로 이동**
```bash
# macOS
mkdir -p ~/Applications/ChromeExtensions
mv ~/Downloads/modeldock-studio-v1.0.0 ~/Applications/ChromeExtensions/

# Windows
mkdir %USERPROFILE%\ChromeExtensions
move %USERPROFILE%\Downloads\modeldock-studio-v1.0.0 %USERPROFILE%\ChromeExtensions\
```

**2단계: Chrome에서 다시 로드**
- `chrome://extensions/`
- 기존 확장 제거
- 새 위치에서 다시 로드

**3단계: 정책 확인 (회사 컴퓨터)**
```
chrome://policy/
```
→ `ExtensionInstallBlocklist` 또는 `DeveloperToolsDisabled` 확인

---

## 실행 오류

### 🚫 "Side panel이 열리지 않습니다"

**증상:**
확장 아이콘 클릭 시 아무 반응 없음

**해결:**

1. **Background script 오류 확인**
   ```
   chrome://extensions/ → ModelDock Studio → 오류 보기
   ```

2. **Chrome 버전 확인**
   ```
   chrome://version/
   ```
   - Manifest V3는 Chrome 88+ 필요
   - Side Panel API는 Chrome 114+ 필요

3. **강제 새로고침**
   ```
   chrome://extensions/ → ModelDock Studio → 새로고침 버튼
   ```

4. **Chrome 완전히 재시작**
   ```bash
   # macOS
   killall "Google Chrome"
   open -a "Google Chrome"
   
   # Windows (PowerShell)
   Stop-Process -Name chrome -Force
   Start-Process chrome
   ```

---

### 💥 "iframe이 로드되지 않습니다"

**증상:**
특정 AI 모델 창이 빈 화면

**원인:**
- 네트워크 오류
- CSP (Content Security Policy) 차단
- 쿠키 차단

**해결:**

1. **네트워크 확인**
   ```
   F12 → Console 탭 → 오류 메시지 확인
   ```

2. **쿠키 설정 확인**
   ```
   chrome://settings/cookies
   → "모든 쿠키 허용" 확인
   ```

3. **manifest.json 권한 확인**
   ```json
   {
     "host_permissions": ["<all_urls>"]
   }
   ```

4. **캐시 삭제**
   ```
   F12 → Application → Clear storage → Clear site data
   ```

---

### ⏱️ "응답 없음 (Timeout)"

**증상:**
AI 모델 응답이 너무 느리거나 멈춤

**해결:**

1. **네트워크 속도 테스트**
   ```bash
   curl -o /dev/null -s -w '%{time_total}\n' https://chatgpt.com
   ```

2. **동시 실행 모델 수 줄이기**
   - 권장: 최대 3-4개 동시 실행
   - 각 모델은 별도 메모리 사용

3. **Chrome 메모리 확인**
   ```
   chrome://system/
   ```
   - 사용 가능한 RAM 확인
   - 최소 4GB 권장

---

## 성능 문제

### 🐌 "브라우저가 느려집니다"

**증상:**
Chrome이 느리거나 팬이 돌아감

**원인:**
- 너무 많은 모델 동시 실행
- iframe 중복 로딩
- 메모리 누수

**해결:**

1. **리소스 모니터링**
   ```
   Shift + Esc → Chrome 작업 관리자
   ```

2. **사용하지 않는 모델 닫기**
   - 각 모델 창 우측 상단 X 버튼

3. **확장 프로그램 재시작**
   ```
   chrome://extensions/ → ModelDock Studio → 새로고침
   ```

4. **Chrome 플래그 최적화**
   ```
   chrome://flags/#enable-webrtc-srtp-aes-gcm
   → Enabled
   ```

---

## 특정 AI 모델 문제

### 🤖 ChatGPT

**문제: "Please log in" 반복**

**해결:**
```
1. chatgpt.com에서 수동 로그인
2. F12 → Application → Cookies 확인
3. ModelDock에서 새로고침
```

---

### 🧠 Claude

**문제: "Your session has expired"**

**해결:**
```
1. claude.ai에서 로그아웃 후 재로그인
2. 쿠키 삭제 후 재시도
3. Incognito 모드 테스트
```

---

### 💎 Gemini

**문제: "API 키 필요" 메시지**

**해결:**
```
1. ai.google.dev에서 API 키 발급
2. ModelDock 설정 → BYOK → Google → API 키 입력
3. "Test Connection" 클릭
```

---

## BYOK (API 키) 문제

### 🔑 "Invalid API Key"

**증상:**
API 키 입력 후 연결 실패

**체크리스트:**

1. **API 키 형식 확인**
   ```
   OpenAI:     sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx
   Anthropic:  sk-ant-api03-xxxxxxxxxxxxxxxx
   Google:     AIzaSyxxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **공백/줄바꿈 제거**
   ```javascript
   // 잘못됨
   "sk-proj-xxx \n"
   
   // 올바름
   "sk-proj-xxx"
   ```

3. **권한 확인**
   - OpenAI: API 크레딧 잔액 확인
   - Anthropic: Usage limits 확인
   - Google: API 활성화 확인

4. **네트워크 프록시**
   ```bash
   # 직접 테스트
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.openai.com/v1/models
   ```

---

### 💸 "Rate Limit Exceeded"

**증상:**
```
429 Too Many Requests
```

**해결:**

1. **현재 사용량 확인**
   - OpenAI: platform.openai.com/usage
   - Anthropic: console.anthropic.com/settings/usage

2. **요청 간격 조정**
   ```
   Settings → BYOK → Rate Limit → 1 request/second
   ```

3. **모델 변경**
   ```
   GPT-4 → GPT-3.5 (저렴한 모델)
   ```

---

## 🆘 추가 도움이 필요하신가요?

### GitHub Issues
문제가 해결되지 않으면 [이슈 제출](https://github.com/dj20014920/Modeldock_studio/issues/new?template=bug_report.md)

**이슈 작성 시 포함할 정보:**
```markdown
- OS: macOS Sonoma 14.5
- Chrome 버전: 120.0.6099.109
- 확장 버전: v1.1.2
- 오류 메시지: (스크린샷 또는 텍스트)
- 재현 방법: 1. ... 2. ... 3. ...
```

### 커뮤니티
- [Discord 서버](https://discord.gg/YOUR_INVITE)
- [Reddit r/ModelDock](https://reddit.com/r/modeldock)

---

## 📚 관련 문서

- [설치 가이드](INSTALL.md)
- [사용자 가이드](README.md)
- [API 문서](docs/API.md)
- [기여 가이드](CONTRIBUTING.md)
