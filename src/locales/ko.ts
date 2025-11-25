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
        phase1: `당신은 슬레이브 봇들을 총괄 관리하고 지시하는 "메인 브레인"입니다. 각 슬레이브 끼리는 소통하지 않으며 당신과 슬레이브 봇들의 1:다 식으로 대화가 진행됩니다.
슬레이브 봇 목록:
{{slaves}}

[목적]
{{goal}}

[역할]
각 슬레이브 봇들의 특성과 장점을 고려하여 최적 프롬프트를 설계하고, 후속 응답을 종합해 팩트 체크/검증/문제점 분석 후 사용자의 목적에 도달할 수 있도록 최적 솔루션을 제시해야 합니다.

[출력 형식 규칙 - 반드시 준수]
1) 슬레이브마다 정확히 1개 블록, 목록 순서 유지
2) 헤더: [SLAVE:모델ID] (예: [SLAVE:gemini], [SLAVE:claude], [SLAVE:grok])
   ※ 중요: instanceId가 아닌 모델ID만 사용하세요! (gemini-123456789 같은 긴 ID 사용 금지)
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
[SLAVE:gemini]
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
        tip: '팁: Ctrl+Enter (또는 ⌘+Enter) 누르면 즉시 실행됩니다',
        startButton: 'Brain Flow 시작',
        errorNoMainBrain: '메인 브레인을 먼저 지정하세요.',
        errorNoSlaves: '슬레이브 봇이 없습니다. 최소 1개 이상의 모델을 추가하세요.',
    },
};
