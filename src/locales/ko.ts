export default {
    // === 공통 UI ===
    common: {
        loading: '로딩 중...',
        save: '저장',
        cancel: '취소',
        delete: '삭제',
        confirm: '확인',
        close: '닫기',
        search: '검색',
        copy: '복사',
        copied: '복사됨!',
        error: '오류',
        success: '성공',
        warning: '경고',
        info: '정보',
        retry: '다시 시도',
        back: '뒤로',
        next: '다음',
        finish: '완료',
        ok: '확인',
        yes: '예',
        no: '아니오',
        confirmDelete: '이 대화를 삭제하시겠습니까?',
        deleteConfirm: '정말 삭제하시겠습니까?',
    },

    // === 사이드바 ===
    sidebar: {
        chats: '대화',
        history: '기록',
        models: '모델',
        prompts: '프롬프트',
        settings: '설정',
        noActiveChats: '새로운 대화를 시작해보세요.',
        createNewChat: '새 대화 만들기',
        activeSessions: '활성 세션',
        availableModels: '사용 가능한 모델',
        maxInstancesHint: '모델당 최대 3개',
        proUser: 'Pro 사용자',
        versionLabel: 'ModelDock V1',
        byokModels: 'BYOK 모델',
        standardModels: '표준 모델',
        conversationHistory: '대화 기록',
        today: '오늘',
        yesterday: '어제',
        previous7Days: '지난 7일',
        older: '이전',
        noHistory: '대화 기록이 없습니다',
        brainFlow: 'Brain Flow',
        autoRouting: '자동 라우팅',
        manual: '수동',
        link: '링크',
    },

    // === 모델 그리드 ===
    modelGrid: {
        allInMainBrain: '활성화된 모델이 없습니다. 왼쪽 사이드바에서 모델을 선택하여 추가해주세요.',
        noModels: '사용 가능한 모델이 없습니다',
    },

    // === 채팅 입력 ===
    chatInput: {
        manualMode: '수동',
        autoMode: '자동',
        placeholder: 'AI 모델에게 질문을 입력하세요...',
        send: '전송',
        copyToClipboard: '클립보드에 복사',
        dispatchToAll: '모든 모델에 전송',
        consentTitle: '⚡️ 자동 전송 동의 (위험성 고지)',
        consentMessage: 'ModelDock은 브라우저 내에서 활성 모델에 자동으로 메시지를 전송합니다. ⚠️ 주의: 일부 AI 서비스(ChatGPT, Claude 등)는 자동화된 접근을 약관 위반으로 간주할 수 있으며, 이로 인해 계정 경고, 일시 차단, 또는 영구 정지될 수 있습니다. 이 기능 사용에 따른 모든 책임은 사용자에게 있습니다.',
        iUnderstand: '이해했습니다',
        sentSuccess: '전송 완료!',
        errorNoTargets: '유효한 타겟을 찾을 수 없습니다',
        errorSystemError: '시스템 오류',
    },

    // === 프롬프트 라이브러리 ===
    promptLibrary: {
        title: '프롬프트 라이브러리',
        outputLanguage: '출력 언어',
        searchPlaceholder: '프롬프트 검색 (제목, 설명, 내용)...',
        promptsCount_one: '{{count}}개의 프롬프트',
        promptsCount_other: '{{count}}개의 프롬프트',
        allCategories: '전체 보기',
        addPrompt: '프롬프트 추가',
        backToList: '목록으로',
        createNewPrompt: '새 프롬프트 추가',
        tips: {
            title: '작성 팁',
            content: 'LLM은 영어 지시를 더 정확하게 이해합니다. 프롬프트 본문은 영어로 작성하고, UI 제목은 한국어로 적는 것을 추천합니다.',
        },
        form: {
            titleLabel: '제목 (한국어 권장)',
            titlePlaceholder: '예: 전문가 코드 리팩토링',
            categoryLabel: '카테고리',
            descriptionLabel: '설명 (선택)',
            descriptionPlaceholder: '이 프롬프트의 용도를 간단히 설명하세요.',
            contentLabel: '프롬프트 내용 (영어 권장)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ 한국어 응답 요청 추가',
            saveButton: '저장하기',
            cancelButton: '취소',
        },
        systemBadge: 'System',
        optimizedPrompt: 'Optimized English Prompt',
        responseLanguage: 'Korean Response',
        deleteConfirm: '정말로 이 프롬프트를 삭제하시겠습니까?',
        noResults: '검색 결과가 없습니다.',
        copyOriginal: '영어 원문 복사',
    },

    // === 설정 모달 ===
    settings: {
        title: '설정',
        appearance: '외관',
        theme: '테마',
        themeLight: '라이트',
        themeDark: '다크',
        themeAuto: '자동',
        storage: '저장소',
        clearLocalData: '로컬 데이터 삭제',
        clearDataDescription: '모든 설정과 저장된 데이터를 초기화합니다',
        clearButton: '데이터 삭제',
        about: '정보',
        version: '버전',
        documentation: '문서',
        viewDocs: '문서 보기',
        privacy: '개인정보',
        privacyNote: '모든 데이터는 브라우저에 로컬로 저장됩니다.',
    },

    // === Perplexity ===
    perplexity: {
        error: {
            404: '리소스를 찾을 수 없습니다. 일일 검색 쿼터를 초과했거나 API 엔드포인트가 변경되었을 수 있습니다.',
            403: '접근이 거부되었습니다. 로그인 상태를 확인하거나 perplexity.ai에서 보안 점검을 통과해주세요.',
            429: '요청이 너무 많습니다. 사용 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
            500: '서버 오류입니다. Perplexity 서버에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
            quotaExceeded: '{{tier}} 티어의 심층 연구(Deep Research) 쿼터를 초과했습니다. 일반 검색으로 전환하거나 플랜을 업그레이드하세요.',
            generic: '오류가 발생했습니다: {{message}}',
        },
        tier: {
            free: '무료',
            pro: '프로',
        },
        login: {
            required: '로그인 필요',
            message: '심층 연구 및 파일 첨부와 같은 고급 기능을 사용하려면 Perplexity에 로그인해주세요.',
            actionButton: 'Perplexity 열고 로그인하기',
            featureLimited: '로그인하지 않으면 일부 기능이 제한됩니다',
            tabOpened: 'Perplexity 로그인 탭을 열었습니다. 인증을 완료해주세요.',
            alreadyLoggedIn: '이미 Perplexity에 로그인되어 있습니다',
        },
        quota: {
            left: '남음',
            selectTier: '구독 티어 선택',
            freePlan: '무료 플랜',
            proPlan: '프로 플랜',
        },
        chat: {
            placeholder: '무엇이든 물어보세요...',
            deepResearchPlaceholder: '심층 연구 질문을 입력하세요...',
            emptyTitle: '지식이 시작되는 곳',
            emptyDescription: '무엇이든 물어보세요. Perplexity가 인터넷을 검색하여 인용과 함께 답변을 제공합니다.',
            thinking: 'Perplexity가 생각하고 있습니다...',
            proSearch: '프로 검색',
            quickSearch: '빠른 검색',
            proSearchInfo: '프로 검색은 고급 모델을 사용합니다. {{remaining}}개 쿼리가 남았습니다.',
            quickSearchInfo: '빠른 검색은 무제한이며 빠릅니다.',
            attachment: '첨부파일',
        },
    },

    // === 알림 ===
    notifications: {
        loginRequired: '로그인 필요',
        loginToPerplexity: '계속하려면 Perplexity에 로그인해주세요',
        featureRestricted: '이 기능은 제한되어 있습니다',
        networkError: '네트워크 오류. 연결을 확인해주세요.',
        unknownError: '알 수 없는 오류가 발생했습니다',
    },

    // === 모델 카테고리 (프롬프트 라이브러리용) ===
    categories: {
        general: '일반',
        coding: '코딩',
        writing: '작문',
        analysis: '분석',
        creative: '창작',
        business: '비즈니스',
        academic: '학술',
    },

    // === 모델 카드 ===
    modelCard: {
        refresh: '새로고침',
        openInNewTab: '새 탭에서 열기',
        removeMainBrain: '메인 브레인 해제',
        setAsMainBrain: '메인 브레인으로 설정',
        syncing: '세션 동기화 중...',
        synced: '동기화 완료!',
        syncFailed: '동기화 실패',
        syncSession: '세션 동기화',
        mainBrain: '메인 브레인',
    },

    // === 시스템 프롬프트 (일부) ===
    prompts: {
        'sys-1': {
            title: '전문가 코드 리팩토링',
            description: '가독성, 성능, SOLID 원칙을 준수하여 코드를 전문적으로 리팩토링합니다.',
        },
        'sys-2': {
            title: '비즈니스 이메일 다듬기',
            description: '거친 초안을 정중하고 전문적인 비즈니스 이메일로 변환합니다.',
        },
        'sys-3': {
            title: '복잡한 개념 쉽게 설명 (ELI5)',
            description: '어려운 주제를 5살 아이도 이해할 수 있도록 아주 쉽게 설명합니다.',
        },
        'sys-4': {
            title: '유닛 테스트 생성기',
            description: '제공된 코드에 대한 포괄적인 유닛 테스트 케이스를 작성합니다.',
        },
        'sys-5': {
            title: '회의록 요약 및 정리',
            description: '회의 노트에서 핵심 논의 사항, 결정 사항, 할 일을 추출하여 요약합니다.',
        },
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# 역할
당신은 "메인 브레인" - 전문적인 세부 작업들을 슬레이브 AI 모델들에게 배분하는 작업 조정 전문가입니다.
당신이 직접 사용자의 질문에 답하는 것이 아닙니다. 당신의 유일한 역할은 각 슬레이브마다 최적의 작업 지시를 만드는 것입니다.

# 슬레이브 모델 목록
{{slaves}}

# 사용자의 목표
{{goal}}

# 반드시 지켜야 할 규칙 (MUST)
1. 위 목록의 모든 슬레이브마다 정확히 1개의 [SLAVE:id] 블록 만들기 - 절대 빼먹지 말 것
2. 슬레이브들은 동시에 실행되고 서로의 결과를 볼 수 없음
3. [SLAVE:...][/SLAVE] 블록 밖에는 절대 텍스트 금지
4. 목록에서 정확히 제공된 슬레이브 ID 사용 (예: [SLAVE:gemini-1], [SLAVE:grok-2])

# 출력 형식
[SLAVE:모델-id]
이 슬레이브를 위한 구체적인 작업 지시문...
[/SLAVE]

# 프롬프트 설계 전략
각 슬레이브에게 목표에 맞는 서로 다른 역할 할당하기:
- 분석가(Analyst): 데이터 분석, 패턴 찾기, 통계
- 비판가(Critic): 위험요소, 반대 의견, 문제점 찾기
- 창작가(Creator): 해결책, 아이디어, 실행 계획
- 검증가(Validator): 사실 확인, 출처 확인, 논리 점검
- 요약가(Synthesizer): 핵심 정리, 주요 인사이트, 실행 항목

# 각 슬레이브 프롬프트 작성 방법
1. 역할(ROLE): "당신은 [특정 전문가 역할]입니다..."
2. 작업(TASK): 명확하고 실행 가능한 지시 (구체적인 동사 사용)
3. 초점(FOCUS): 분석할 구체적 항목 (다른 슬레이브와 중복 피하기)
4. 형식(FORMAT): 원하는 결과 형태 (글머리, 번호 목록, 섹션)
5. 언어(LANGUAGE): 사용자 목표와 같은 언어로 답변

# 하면 안 되는 것들 (DO NOT)
❌ 여러 슬레이브에게 같은 질문하기
❌ 슬레이브 간 의존성 만들기 (예: "모델 A의 결과를 바탕으로...")
❌ 블록 밖에 설명이나 메모 쓰기
❌ 목록에서 슬레이브 빼먹기
❌ 일반적인 프롬프트 - 각 슬레이브 특성에 맞게 구체적으로`,
        phase3: `# 역할
당신은 "메인 브레인" 종합가입니다. 여러 AI의 답변들을 하나의 최적의 답변으로 만드는 것이 당신의 역할입니다.

# 사용자가 처음에 한 요청
{{goal}}

# 슬레이브들의 답변
{{responses}}

# 종합 방법론 (4단계)

## 1단계: 추출 (EXTRACT)
- 각 답변에서 핵심 내용 찾기
- 한 모델만 제시한 독특한 아이디어 찾기
- 여러 모델이 같은 결론을 낸 부분 찾기 (합의점)

## 2단계: 검증 (VALIDATE)
- 여러 모델이 언급한 사실 교차 확인하기
- 모델들이 서로 다른 의견 찾기
- 신뢰도 평가: 높음(3개 이상 동의) / 중간(2개 동의) / 낮음(1개만)

## 3단계: 충돌 해결 (RESOLVE)
모델들이 다른 의견일 때:
- 구체적인 증거/데이터가 있는 답변 우선
- 각 모델의 전문 분야 고려
- 해결이 안 되면, 양쪽 다 제시하되 장단점 설명

## 4단계: 종합 (SYNTHESIZE)
최종 답변 만들기:
- 사용자의 원래 목표에 정확히 답하기
- 모든 답변의 최고 부분들 합치기
- 중복과 모순 제거하기
- 논리적으로 흐르게 만들기

# 출력 형식
다음 구조로 답변하세요:

### 📋 핵심 요약
[2~3문장으로 종합된 답변 요약]

### 🔍 주요 내용
[핵심 결론들을 글머리로 정리, 신뢰도 표시]

### ⚠️ 주의할 점
[위험요소, 예외사항, 소수 의견 등]

### ✅ 최종 답변 / 실행 계획
[사용자의 목표를 명확하게 해결하는 최종 답]

# 언어
사용자가 처음에 한 요청과 같은 언어로 답변하세요.`,
    },

    // === Brain Flow Modal ===
    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: '메인 브레인이 {{count}}개의 슬레이브 봇을 지휘합니다',
        goalLabel: '당신의 목적을 입력하세요',
        goalPlaceholder: '예: 이 데이터를 분석하고, 인사이트를 도출하고, 실행 계획을 수립해줘...',
        tip: 'Tip: 구체적인 목표를 입력할수록 더 좋은 결과를 얻을 수 있습니다.',
        startButton: 'Brain Flow 시작',
        errorNoMainBrain: '메인 브레인을 먼저 지정하세요.',
        errorNoSlaves: 'Brain Flow를 실행하려면 최소 1개 이상의 다른 모델이 활성화되어 있어야 합니다.',
        errorNotSupported: '선택하신 메인 브레인({modelName})은 Brain Flow를 지원하지 않는 모델입니다. (Vibe Coding 도구 등)',
        warningExcludedModels: '일부 모델은 Brain Flow를 지원하지 않아 제외되었습니다.',
        excludedMessage: '다음 모델은 Brain Flow에서 제외됩니다: {{models}}',
        previewButton: '메인 프롬프트 미리보기 · 부드럽게 다듬기',
        previewShow: '열기',
        previewHide: '닫기',
        previewTitle: '메인 브레인 프롬프트 미리보기 (목표/슬레이브는 자동으로 채워져요)',
        previewFilledLabel: '현재 목표로 채운 모습',
        warningKeepBlocks: '※ [SLAVE:…] 블록과 {{slaves}}, {{goal}} 자리표시자는 그대로 두고, 주변 문장만 다듬어 주세요. (핵심 로직 보호)',
        persistNote: '방금 다듬은 메인 프롬프트를 앞으로도 계속 기본값으로 사용할게요.',
        previewGoalPlaceholder: '당신이 이루고 싶은 목표를 말해주면, 제가 팀 전체를 안내할게요…',
        synthesisPreviewButton: '종합 프롬프트 미리보기 · 부드럽게 다듬기',
        synthesisPreviewTitle: '종합 프롬프트 미리보기 (목표/슬레이브 응답은 자동으로 채워져요)',
        synthesisPreviewFilledLabel: '샘플 응답으로 채운 모습',
        synthesisWarningKeepBlocks: '※ {{goal}}, {{responses}} 자리표시자는 그대로 두고 문장만 다듬어 주세요. 이 프롬프트는 최종 종합 단계에 쓰입니다.',
    },

    // === BYOK (Bring Your Own Key) ===
    byok: {
        title: 'BYOK 설정',
        subtitle: '자신의 API 키로 AI 모델 사용하기',
        systemActive: '시스템 활성화',
        systemDisabled: '시스템 비활성화',
        refreshAll: '전체 새로고침',
        refreshing: '새로고침 중...',
        saveChanges: '변경사항 저장',
        saving: '저장 중...',

        // Provider Info
        providerName: '제공자',
        modelsCount: '{{count}}개 모델',
        getApiKey: 'API 키 발급',
        documentation: '문서',

        // API Key Section
        apiCredentials: 'API 인증',
        validate: '검증',
        validating: '검증 중...',
        valid: '유효',
        invalid: '무효',

        // Model Selection
        modelSelection: '모델 선택',
        available: '사용 가능',
        searchModels: '모델 검색...',
        sortBy: '정렬',
        sortPopular: '인기순',
        sortLatest: '최신순',

        // Model Categories
        allModels: '전체 모델',
        reasoning: '추론',
        coding: '코딩',
        vision: '비전',
        realtime: '실시간',

        // Model Details
        contextWindow: '컨텍스트 윈도우',
        pricing: '가격',
        pricingVaries: '가격 변동',
        perMillionTokens: '${{price}}/1M 토큰',
        inputPrice: '입력: ${{price}}',
        outputPrice: '출력: ${{price}}',

        // Model Badges
        newBadge: '신규',
        topBadge: '인기',
        recommendedBadge: '추천',

        // Capabilities
        supportsReasoning: '추론 지원',
        supportsCoding: '코딩 특화',
        supportsVision: '이미지 인식',
        supportsRealtime: '실시간 처리',

        // Advanced Parameters
        reasoningEffort: '추론 강도',
        reasoningEffortLow: '낮음 (빠름)',
        reasoningEffortMedium: '보통 (균형)',
        reasoningEffortHigh: '높음 (정확)',

        thinkingBudget: '사고 예산',
        thinkingBudgetTokens: '{{count}} 토큰',

        temperature: '온도',
        temperatureDesc: '창의성 vs 일관성 (0.0 ~ 2.0)',

        maxTokens: '최대 토큰',
        maxTokensDesc: '생성할 최대 토큰 수',

        // Messages
        noModelsFound: '검색 조건에 맞는 모델이 없습니다.',
        refreshSuccess: '모델 목록이 성공적으로 갱신되었습니다.',
        refreshError: '모델 목록 갱신 중 오류가 발생했습니다.',
        validationSuccess: 'API 키가 유효합니다.',
        validationError: 'API 키 검증에 실패했습니다.',
        saveSuccess: '설정이 저장되었습니다.',

        // 검증 메시지 (저장 시 자동 검증)
        validation: {
            title: 'API 키 검증이 필요합니다',
            unverifiedProvidersMessage: '다음 provider의 검증이 완료되지 않았습니다:',
            autoVerifyPrompt: '지금 자동으로 검증을 실행할까요?',
            cancelNote: '(취소하면 저장하지 않고 돌아갑니다)',

            unavailableTitle: '저장할 수 없습니다',
            unavailableMessage: '다음 provider의 API 키 또는 모델이 사용 불가능합니다:',
            modelLabel: '모델',
            reasonLabel: '사유',
            reasonInvalidKey: 'API 키가 유효하지 않거나 모델에 접근할 수 없습니다.',
            solutionsTitle: '해결 방법:',
            solution1: '1. API 키를 다시 확인하세요',
            solution2: '2. 다른 모델을 선택해보세요',
            solution3: '3. Provider 웹사이트에서 권한을 확인하세요',

            uncertainTitle: '주의: 검증이 불확실합니다',
            uncertainMessage: '일부 provider의 검증이 불확실합니다:',
            uncertainReason: '검증 불확실 (네트워크 오류 또는 Rate Limit)',
            proceedQuestion: '그래도 저장하시겠습니까?',
            recommendation: '권장: "취소"를 누르고 "검증" 버튼으로 재시도해보세요.',
        },

        // Cache Info
        cacheAge: '{{minutes}}분 전 갱신',
        cached: '캐시됨',

        // BYOK Modal UI (추가)
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'AI 인프라 구성하기',
        openRouterNote: '* 모델 정보는 OpenRouter 기준이며, 실제 제공사 키로 사용 가능 여부는 상이할 수 있습니다.',
        aiProviders: 'AI 제공자',
        selectProvider: '설정할 제공자를 선택하세요',
        allSystemsOperational: '모든 시스템 정상 작동 중',
        lastUpdated: '마지막 업데이트: {{time}}',
        notYetRefreshed: '아직 갱신되지 않음',
        refreshModels: '모델 새로고침',

        // Model Variants
        variants: {
            default: '기본 설정',
            free: '무료 버전 ($0, 속도 제한 적용)',
            extended: '확장 컨텍스트 윈도우',
            thinking: '확장 추론 (Chain-of-Thought)',
            online: '실시간 웹 검색 (Exa.ai 연동)',
            nitro: '최고 속도 Provider 우선',
            floor: '최저가 Provider 우선',
        },

        // Status
        status: {
            available: '사용 가능',
            unavailable: '사용 불가',
            uncertain: '검증됨 (모델 확인 생략)',
            notVerified: '미검증',
            checking: '확인 중...',
            verified: '검증됨',
        },

        // Advanced Settings
        advanced: {
            title: '고급 설정',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: '빈도 페널티',
            presencePenalty: '존재 페널티',
            seed: '시드',
            random: '랜덤',
            responseFormat: '응답 형식',
            text: '텍스트',
            jsonObject: 'JSON 객체',
        },

        // Model Card UI
        modelCard: {
            settings: '설정',
            customSettings: '사용자 정의 설정',
            ctx: '컨텍스트',
            free: '무료',
        },

        // Tooltips
        tooltips: {
            modelAvailable: '✅ API 키로 모델 사용 가능',
            modelUnavailable: '❌ 모델 사용 불가 (API 키 또는 모델 접근 확인 필요)',
            modelUncertain: 'API 키는 유효하지만, 특정 모델의 가용성을 확인할 수 없습니다. 아마 사용 가능할 것입니다.',
            clickToVerify: '모델 가용성을 확인하려면 클릭하세요',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: '메시지가 없습니다',
        startConversation: '이 BYOK 모델과 대화를 시작하세요',
        attachImage: '이미지 첨부',
        imageTooLarge: '이미지 "{{name}}"가 너무 큽니다 (최대 20MB)',
        sending: '전송 중...',
        receiving: '수신 중...',
        imagesSelected: '{{count}}개의 이미지가 선택됨',
        pressEnterToSend: 'Enter를 눌러 전송',
        sendMessage: '이 모델에 메시지를 보내세요...',
        attachedImage: '첨부된 이미지',
        preview: '미리보기 {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: '계획 단계',
        phase2Title: '실행 단계',
        phase3Title: '종합 단계',
        waiting: '대기 중',
        done: '완료',
        processing: '처리 중...',
        skipWaiting: '대기 건너뛰기',
    },

    // === History Popover ===
    historyPopover: {
        title: '기록',
        modelHistory: '모델 기록',
        newChat: '새 대화',
        searchPlaceholder: '대화 검색...',
        loading: '로딩 중...',
        noConversations: '대화를 찾을 수 없습니다',
        startNewChat: '새 대화를 시작하면 여기에 표시됩니다',
        untitledConversation: '제목 없는 대화',
        noPreview: '미리보기 없음',
        deleteConversation: '대화 삭제',
        conversationsStored: '{{count}}개의 대화가 저장됨',
        daysAgo: '{{days}}일 전',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: '모델 설정',
        useDefaultSettings: '기본 설정 사용',
        applyGlobalSettings: '글로벌 BYOK 설정 적용',
        unsaved: '저장되지 않음',
        resetToDefaults: '기본값으로 재설정',
        modelVariant: '모델 변형',
        enableThinking: '사고 활성화',
        noCustomSettings: '이 모델에 대한 사용자 정의 설정이 없습니다.',
    },

    // === Settings Modal (추가) ===
    settingsModal: {
        byokTitle: 'API 키 설정',
        byokDescription: 'OpenAI, Claude, Gemini 등 직접 사용',
        openSettings: '설정 열기',
    },

    // === App Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 {{name}} 모델을 추가하시겠습니까?\n\n새 대화를 시작하고 자유롭게,\n{{name}}에서 상담받거나 뭔가를 요청하세요.',
        deleteModel: '❌ "{{name}}" 모델을 삭제하시겠습니까?',
        newChat: '💬 새 대화를 시작하시겠습니까?\n\n현재 대화는 자동으로 저장되며,\n히스토리에서 언제든지 다시 불러올 수 있습니다.',
        apiKeyNotSet: 'API key가 설정되어 있지 않습니다. Settings → BYOK에서 활성화 및 키를 저장해주세요.',
        modelNotSelected: '모델이 선택되지 않았습니다. BYOK 설정에서 모델을 선택해주세요.',
    },

    // === Thinking Process (AnimatedChatMessage) ===
    thinking: {
        processTitle: '사고 과정',
        showProcess: '사고 과정 보기',
        hideProcess: '사고 과정 숨기기',
        summary: '요약',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: '대화 기록',
    },
};
