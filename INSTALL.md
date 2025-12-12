# 📦 ModelDock Studio 설치 가이드

> 크롬 웹스토어가 아닌 수동 설치 방식입니다. 개발자 모드를 사용하므로 신뢰할 수 있는 출처인지 확인하세요.

## 🎯 빠른 설치 (5분 소요)

### 1단계: 파일 다운로드

**GitHub Releases에서 다운로드:**
```
https://github.com/dj20014920/Modeldock_studio/releases/latest
```

- `modeldock-studio-vX.X.X.zip` 파일 다운로드
- 다운로드 폴더에서 압축 해제

### 2단계: Chrome 확장 프로그램 페이지 열기

**방법 1: 주소창 입력**
```
chrome://extensions/
```

**방법 2: 메뉴 사용**
1. Chrome 우측 상단 ⋮ (점 3개) 클릭
2. **도구 더보기** → **확장 프로그램**

### 3단계: 개발자 모드 활성화

<img src="./docs/images/developer-mode.png" alt="개발자 모드" width="600"/>

1. 페이지 우측 상단의 **개발자 모드** 토글 ON
2. 새로운 버튼들이 나타남 (압축해제된 확장 프로그램 로드 등)

### 4단계: 확장 프로그램 로드

<img src="./docs/images/load-unpacked.png" alt="압축해제된 확장 프로그램 로드" width="600"/>

1. **압축해제된 확장 프로그램 로드** 버튼 클릭
2. 압축 해제한 `modeldock-studio-vX.X.X` 폴더 선택
3. **선택** 버튼 클릭

### 5단계: 확인 및 핀 고정

<img src="./docs/images/extension-installed.png" alt="설치 완료" width="600"/>

1. ModelDock Studio 카드가 나타나면 설치 완료
2. Chrome 툴바 우측의 퍼즐 아이콘 (🧩) 클릭
3. ModelDock Studio 옆 📌 핀 아이콘 클릭하여 고정

---

## 🎬 비디오 가이드

<a href="https://www.youtube.com/watch?v=YOUR_VIDEO_ID">
  <img src="./docs/images/video-thumbnail.jpg" alt="설치 비디오" width="600"/>
</a>

*클릭하여 YouTube에서 전체 설치 과정 보기*

---

## 🔐 보안 확인

### SHA256 체크섬 검증 (선택사항)

**macOS/Linux:**
```bash
cd ~/Downloads
sha256sum -c modeldock-studio-vX.X.X.zip.sha256
```

**Windows (PowerShell):**
```powershell
cd $HOME\Downloads
Get-FileHash modeldock-studio-vX.X.X.zip -Algorithm SHA256
# 출력된 해시를 .sha256 파일 내용과 비교
```

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1: "이 확장 프로그램은 개발자 모드로 실행 중입니다" 경고가 나타납니다

**A:** 정상입니다. 크롬 웹스토어가 아닌 수동 설치 방식이므로 이 경고가 표시됩니다.

- **안전성**: GitHub에서 소스 코드를 공개적으로 검증 가능합니다
- **숨기기**: 경고를 무시하고 "X" 버튼으로 닫을 수 있습니다

### Q2: 크롬을 재시작할 때마다 비활성화됩니다

**A:** 다음을 확인하세요:

1. 압축 해제한 폴더를 삭제하지 마세요
2. 폴더를 안전한 위치로 이동 (예: `~/Applications/ChromeExtensions/`)
3. 그룹 정책이 개발자 모드를 차단하는지 확인 (회사 컴퓨터인 경우)

### Q3: manifest.json 오류가 발생합니다

**A:** 올바른 폴더를 선택했는지 확인:

```
✅ 올바른 경로:
/Downloads/modeldock-studio-v1.0.0/
├── manifest.json
├── background.js
├── ...

❌ 잘못된 경로:
/Downloads/modeldock-studio-v1.0.0/modeldock-studio-v1.0.0/
```

### Q4: 업데이트는 어떻게 하나요?

**A:** 자동 업데이트가 되지 않으므로 수동으로 업데이트해야 합니다:

1. 새 버전 다운로드
2. 기존 확장 프로그램 **제거** (`chrome://extensions/`에서)
3. 새 버전으로 다시 설치 (위의 1-5단계 반복)

> **팁**: 설정과 데이터는 `chrome.storage.local`에 저장되므로 재설치 후에도 유지됩니다.

### Q5: 왜 크롬 웹스토어에 없나요?

**A:** 이 프로젝트는 다음 이유로 수동 배포를 선택했습니다:

- 포트폴리오 목적 (커리어용)
- 오픈소스 투명성 강조
- 웹스토어 정책 제약 회피
- 사용자 직접 빌드 가능

---

## 🛠️ 직접 빌드하기 (선택사항)

소스 코드에서 직접 빌드하고 싶다면:

```bash
# 저장소 클론
git clone https://github.com/dj20014920/Modeldock_studio.git
cd Modeldock_studio

# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# dist/ 폴더를 Chrome에 로드
```

---

## 🆘 문제 해결

여전히 문제가 있나요? [TROUBLESHOOTING.md](TROUBLESHOOTING.md)를 참조하거나 [이슈 제출](https://github.com/dj20014920/Modeldock_studio/issues/new)하세요.

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.
