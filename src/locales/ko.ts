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
};
