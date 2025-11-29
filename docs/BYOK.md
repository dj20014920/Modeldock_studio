# BYOK (Bring Your Own Key) 시스템

## 📌 개요

BYOK(Bring Your Own Key) 시스템을 통해 사용자는 자신의 API 키를 사용하여 OpenAI, Anthropic, Google Gemini 등 세계 최고의 AI 모델들을 직접 활용할 수 있습니다. **2025년 11월 27일 기준** 최신 모델과 고급 추론 기능들을 완벽하게 지원하며, **동적 모델 조회(Dynamic Model Fetching)** 기능을 통해 실시간으로 최신 모델을 사용할 수 있습니다.

## 🎯 지원 제공자 및 모델 (2025-11-27 기준)

### 1. OpenAI (Flagship & Reasoning)
- **GPT-5.1**: 코딩과 에이전트 작업에 최적화된 최신 플래그십 모델. `Reasoning Effort` 조절 가능.
- **GPT-5.1 Codex**: Codex 기반의 에이전트 코딩 특화 모델.
- **o3 / o3-pro**: 차세대 추론 모델. 복잡한 문제 해결에 탁월.
- **Sora 2 Pro**: 오디오 싱크가 포함된 최고급 비디오 생성 모델.
- **GPT Realtime**: 실시간 음성 및 텍스트 처리 모델.

### 2. Anthropic (Extended Thinking)
- **Claude Sonnet 4**: 2025년 5월 출시된 최신 Sonnet 모델.
- **Claude 3.5 Sonnet**: `Extended Thinking` 모드 지원 (Thinking Budget 설정 가능).
- **Claude 3.5 Haiku**: 가장 빠르고 비용 효율적인 모델.

### 3. Google Gemini (Next-Gen Multimodal)
- **Gemini 3 Pro**: 세계 최고의 멀티모달 모델. `Deep Think` 및 이미지 생성 지원.
- **Gemini 2.5 Pro**: 100만 토큰 컨텍스트, 안정적인 고성능 모델.
- **Gemini 2.5 Flash**: 압도적인 속도와 멀티모달 처리 능력.

### 4. DeepSeek (Reasoning & Efficiency)
- **DeepSeek V3.2**: Dynamic Sparse Attention 기술이 적용된 최신 모델.
- **DeepSeek R2 Preview**: 차세대 추론 모델 미리보기.

### 5. xAI (Real-time & Vision)
- **Grok 4.1 Fast Reasoning**: 200만 토큰 컨텍스트, 초고속 추론.
- **Grok 3**: 128k 컨텍스트를 지원하는 지구상에서 가장 똑똑한 AI.

### 6. Mistral AI (Open Weight Power)
- **Mistral Large 2.1**: 123B 파라미터의 최상급 추론 및 코딩 모델 (24.11 버전).
- **Magistral Medium 1.2**: 멀티모달 추론 모델.
- **Codestral**: 80개 이상의 언어를 지원하는 코딩 특화 모델.

## 💡 주요 기능 및 UI 혁신

### 1. 동적 모델 조회 (Dynamic Model Fetching) 🆕
- **Refresh Models 버튼**: API 키를 입력하고 이 버튼을 누르면, 해당 제공자의 API를 실시간으로 호출하여 현재 사용 가능한 모든 모델 목록을 가져옵니다.
- **자동 업데이트**: 새로 출시된 모델이 아직 시스템에 등록되지 않았더라도, 이 기능을 통해 즉시 사용할 수 있습니다.

### 2. 프리미엄 UI/UX (AI Command Center)
- **카테고리 탭**: Reasoning, Coding, Vision, Realtime 등 목적에 따라 모델을 쉽게 찾을 수 있습니다.
- **스마트 검색**: 모델 이름이나 설명으로 즉시 검색 가능합니다.
- **기능 뱃지**: `NEW`, `TOP`, `VISION`, `AUDIO` 등 모델의 특징을 한눈에 파악할 수 있습니다.

### 3. 고급 파라미터 제어
- **Reasoning Effort (OpenAI o1/o3/GPT-5)**: 추론의 깊이를 Low, Medium, High로 조절.
- **Thinking Budget (Anthropic)**: 모델이 내부적으로 생각하는 데 사용할 토큰 양을 직접 설정 (Extended Thinking).
- **Temperature**: 창의성(Creative)과 정확성(Precise)을 슬라이더로 정밀하게 조절.

## 🚀 사용 방법

### 1. BYOK 설정 열기
1. **Settings**(⚙️) 버튼 클릭
2. **BYOK (Bring Your Own Key)** 섹션에서 "설정 열기" 클릭

### 2. API 키 등록 및 검증
1. 왼쪽 사이드바에서 원하는 제공자 선택 (예: OpenAI)
2. API 키 입력 (눈 아이콘으로 표시/숨김 전환 가능)
3. "Verify" 버튼으로 키 유효성 확인

### 3. 모델 목록 갱신 (선택 사항)
1. "Refresh Models" 버튼 클릭 (오른쪽 상단)
2. 최신 모델 목록이 자동으로 로드되어 목록에 표시됩니다.

### 4. 모델 및 옵션 선택
1. **카테고리 선택**: 상단 탭에서 원하는 작업 유형(Coding, Reasoning 등) 선택.
2. **모델 선택**: 카드 형태의 목록에서 원하는 모델 선택.
3. **고급 설정**:
   - **Reasoning Effort**: 지원 모델 선택 시 나타남.
   - **Thinking Budget**: Claude 3.5 Sonnet 등 지원 모델 선택 시 나타남.
   - **Temperature**: 일반 모델 선택 시 나타남.

### 5. 저장 및 활성화
1. "Save Changes" 버튼 클릭
2. 상단의 "System Active" 토글을 켜서 BYOK 모드 활성화

## 📊 가격 정보 (2025-11-27 기준)

### 가장 경제적인 옵션
| 제공자 | 모델 | 입력 | 출력 |
|--------|------|------|------|
| Google | Gemini 2.5 Flash | $0.075/M | $0.30/M |
| xAI | Grok 4.1 Fast | $0.20/M | $0.50/M |
| DeepSeek | DeepSeek V3.2 | $0.20/M | $0.80/M |

### 최고 성능 옵션 (Reasoning & Agentic)
| 제공자 | 모델 | 입력 | 출력 |
|--------|------|------|------|
| OpenAI | GPT-5.1 | $5.00/M | $20.00/M |
| OpenAI | o3 Deep Research | $20.00/M | $80.00/M |
| Anthropic | Claude Sonnet 4 | $3.00/M | $15.00/M |

## 🛡️ 보안 및 개인정보

- **로컬 저장**: 모든 API 키는 사용자의 브라우저(Chrome Storage)에 암호화되어 저장됩니다.
- **직접 통신**: API 키는 중계 서버를 거치지 않고, 사용자의 브라우저에서 AI 제공자의 API 서버로 직접 전송됩니다.

## 💬 문의 및 지원

새로운 모델 추가 요청이나 버그 제보는 GitHub Issues를 이용해 주세요.
