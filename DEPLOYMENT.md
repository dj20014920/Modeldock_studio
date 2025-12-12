# ModelDock Studio 배포 가이드

## 새 버전 릴리스 방법

### 1. 버전 업데이트

```bash
# manifest.json 버전 수정
vi public/manifest.json
# "version": "1.2.0" 으로 변경

# package.json 버전 수정 (선택사항)
vi package.json
# "version": "1.2.0" 으로 변경
```

### 2. CHANGELOG 작성

```bash
# CHANGELOG.md 업데이트
vi CHANGELOG.md
```

예시:
```markdown
## [1.2.0] - 2025-12-10

### Added
- 새로운 AI 모델 지원: Mistral Large 3
- BrainFlow 성능 개선

### Fixed
- Perplexity 로그인 이슈 수정
- 메모리 누수 문제 해결

### Changed
- UI 개선
```

### 3. Git 태그 생성 및 푸시

```bash
# 변경사항 커밋
git add .
git commit -m "chore: bump version to 1.2.0"

# 태그 생성
git tag -a v1.2.0 -m "Release v1.2.0"

# GitHub에 푸시 (자동으로 빌드 & 릴리스 트리거)
git push origin main
git push origin v1.2.0
```

### 4. GitHub Actions 자동 실행

태그를 푸시하면 `.github/workflows/release.yml`이 자동으로:
1. 코드 체크아웃
2. 의존성 설치
3. 프로덕션 빌드
4. ZIP 파일 생성
5. GitHub Releases 페이지에 업로드

### 5. 릴리스 노트 확인

GitHub Releases 페이지에서:
- https://github.com/dj20014920/Modeldock_studio/releases

릴리스 노트 확인 및 필요시 수정

---

## 수동 빌드 (테스트용)

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# ZIP 생성
cd dist
zip -r ../modeldock-studio-manual.zip .
cd ..

# SHA256 체크섬
sha256sum modeldock-studio-manual.zip > modeldock-studio-manual.zip.sha256
```

---

## 배포 체크리스트

릴리스 전 확인사항:

- [ ] 모든 테스트 통과
- [ ] manifest.json 버전 업데이트
- [ ] CHANGELOG.md 작성
- [ ] README.md 스크린샷 최신화
- [ ] INSTALL.md 검증
- [ ] Cloudflare Worker 배포 (별도)
- [ ] 로컬에서 빌드 테스트
- [ ] 개발자 모드로 설치 테스트
- [ ] 주요 기능 동작 확인

---

## Cloudflare Worker 배포

```bash
cd cloudflare-worker

# 배포
npx wrangler deploy

# 또는
npm run deploy
```

---

## 롤백 (문제 발생 시)

```bash
# 태그 삭제
git tag -d v1.2.0
git push origin :refs/tags/v1.2.0

# GitHub Releases에서 수동 삭제
# https://github.com/dj20014920/Modeldock_studio/releases
```

---

## 자주 묻는 질문

### Q: GitHub Actions가 실패하면?

A: Actions 탭에서 로그 확인
```
https://github.com/dj20014920/Modeldock_studio/actions
```

### Q: 빌드 시간이 너무 오래 걸리면?

A: GitHub Actions 캐시 설정 확인
```yaml
- uses: actions/setup-node@v4
  with:
    cache: 'npm'  # 이 부분 확인
```

### Q: ZIP 파일이 너무 크면?

A: 불필요한 파일 제외
```bash
# .gitignore 확인
node_modules/
.git/
*.log
```
