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
    },

    // === 사이드바 ===
    sidebar: {
        chats: '대화',
        models: '모델',
        settings: '설정',
        noActiveChats: '새로운 대화를 시작해보세요.',
        createNewChat: '새 대화 만들기',
        availableModels: '사용 가능한 모델',
        maxInstancesHint: '모델당 최대 3개',
        proUser: 'Pro 사용자',
        versionLabel: 'ModelDock V1',
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
        consentTitle: '⚡️ 자동 전송 동의',
        consentMessage: 'ModelDock은 활성 모델 iframe에 자동으로 메시지를 주입하고 전송을 시뮬레이션합니다. 이 기능은 안전하며 브라우저 내에서 로컬로 작동합니다.',
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

    // === 알림 ===
    notifications: {
        loginRequired: '로그인 필요',
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
        phase1: `당신은 슬레이브 봇들을 총괄 관리하고 지시하는 "메인 브레인"입니다. 각 슬레이브 끼리는 소통하지 않으며 당신과 슬레이브 봇들의 1:다 식으로 대화가 진행됩니다.
슬레이브 봇 목록:
{{slaves}}

[목적]
{{goal}}

[역할]
각 슬레이브 봇들의 특성과 장점을 고려하여 최적 프롬프트를 설계하고, 후속 응답을 종합해 팩트 체크/검증/문제점 분석 후 사용자의 목적에 도달할 수 있도록 최적 솔루션을 제시해야 합니다.

[출력 형식 규칙 - 반드시 준수]
1) 슬레이브마다 정확히 1개 블록, 목록 순서 유지
2) 헤더: [SLAVE:모델ID-번호] (예: [SLAVE:gemini-1], [SLAVE:grok-2])
   ※ 중요: 위 목록에 제공된 ID를 정확히 사용하세요!
3) 블록 내부엔 실행할 프롬프트만 (설명/메타 텍스트 금지)
4) 닫기: [/SLAVE]
5) SLAVE 블록 외 텍스트 금지
6) 체인/순차 의존 금지: 어떤 슬레이브도 다른 슬레이브 출력을 참조하지 않는다. 모두 독립적으로 같은 시점에 실행된다고 가정한다.
7) 슬레이브 목록의 모든 항목에 대해 블록을 빠짐없이 작성해야 한다. 하나라도 누락되면 작업 품질이 크게 저하된다.

[슬레이브 지시 작성 가이드]
0. 페르소나: 모델의 정확한 역할을 지정하라
1. 명령(Instruction): 구체적 동사로 명확히 지시하라
2. 맥락(Context): 필요한 배경 정보를 충분히 제공하라
3. 입력 데이터(Input Data): 처리할 데이터를 정확히 제공하라
4. 출력 형식(Output Format): 원하는 결과물 형식을 구체적으로 지정하라
- 모델 특성별 역할/목표/출력형식/제약사항 명시
- 중복 질문 금지, 서로 다른 관점/전략 분배
- 사용자의 주 언어에 맞춰 응답하도록 구성하라

[예시 형식]
[SLAVE:gemini-1]
페르소나: 당신은 시장 분석 전문가입니다.
명령: 다음 질문에 대해 데이터 기반으로 답변하세요...
[/SLAVE]

[SLAVE:claude]
페르소나: 당신은 기술 분석 전문가입니다.
명령: 다음 항목을 분석하세요...
[/SLAVE]`,
        phase3: `아래는 당신의 지시에 따른 슬레이브 봇들의 응답입니다.
형식: [모델명(ID) 응답: 내용...]

[사용자의 원래 목적] - 잘다시 상기하세요
{{goal}}
[슬레이브 응답 데이터]
{{responses}}

[최종 지시]
위 응답들을 파싱하고 종합하여 팩트 체크, 검증, 문제점 분석을 수행한 뒤, 사용자의 원래 목적에 부합하는 최적의 솔루션을 제시하세요.`,
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
    },
};
