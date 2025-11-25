export default {
    // === Common UI ===
    common: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        confirm: 'Confirm',
        close: 'Close',
        search: 'Search',
        copy: 'Copy',
        copied: 'Copied!',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
        retry: 'Retry',
        back: 'Back',
        next: 'Next',
        finish: 'Finish',
        ok: 'OK',
        yes: 'Yes',
        no: 'No',
    },

    // === Sidebar ===
    sidebar: {
        chats: 'Chats',
        models: 'Models',
        settings: 'Settings',
        noActiveChats: 'Start a new conversation.',
        createNewChat: 'Create new chat',
        availableModels: 'Available Models',
        maxInstancesHint: 'Max 3 / model',
        proUser: 'Pro User',
        versionLabel: 'ModelDock V1',
    },

    // === Model Grid ===
    modelGrid: {
        allInMainBrain: 'No active models. Please select a model from the sidebar to add.',
        noModels: 'No models available',
    },

    // === Chat Input ===
    chatInput: {
        manualMode: 'Manual',
        autoMode: 'Auto',
        placeholder: 'Ask anything to AI models...',
        send: 'Send',
        copyToClipboard: 'Copy to Clipboard',
        dispatchToAll: 'Send to All Models',
        consentTitle: '⚡️ Auto-Routing Consent',
        consentMessage: 'ModelDock will automatically inject your message into active model iframes and simulate submission. This is safe and works locally in your browser.',
        iUnderstand: 'I Understand',
        sentSuccess: 'Sent!',
        errorNoTargets: 'No valid targets found',
        errorSystemError: 'System Error',
    },

    // === Prompt Library ===
    promptLibrary: {
        title: 'Prompt Library',
        outputLanguage: 'Output',
        searchPlaceholder: 'Search prompts (title, description, content)...',
        promptsCount_one: '{{count}} prompt',
        promptsCount_other: '{{count}} prompts',
        allCategories: 'View All',
        addPrompt: 'Add Prompt',
        backToList: 'Back to List',
        createNewPrompt: 'Create New Prompt',
        tips: {
            title: 'Writing Tips',
            content: 'LLMs understand English instructions more accurately. Write prompt content in English, and use your native language for UI labels.',
        },
        form: {
            titleLabel: 'Title (in your language)',
            titlePlaceholder: 'e.g., Expert Code Refactoring',
            categoryLabel: 'Category',
            descriptionLabel: 'Description (optional)',
            descriptionPlaceholder: 'Briefly describe the purpose of this prompt.',
            contentLabel: 'Prompt Content (English recommended)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Add language response request',
            saveButton: 'Save',
            cancelButton: 'Cancel',
        },
        systemBadge: 'System',
        optimizedPrompt: 'Optimized English Prompt',
        responseLanguage: 'Response',
        deleteConfirm: 'Are you sure you want to delete this prompt?',
        noResults: 'No search results found.',
        copyOriginal: 'Copy original',
    },

    // === Settings Modal ===
    settings: {
        title: 'Settings',
        appearance: 'Appearance',
        theme: 'Theme',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeAuto: 'Auto',
        storage: 'Storage',
        clearLocalData: 'Clear Local Data',
        clearDataDescription: 'Reset all settings and saved data',
        clearButton: 'Clear Data',
        about: 'About',
        version: 'Version',
        documentation: 'Documentation',
        viewDocs: 'View Docs',
        privacy: 'Privacy',
        privacyNote: 'All data is stored locally in your browser.',
    },

    // === Perplexity ===
    perplexity: {
        error: {
            404: 'Resource not found. Daily search quota may be exceeded or API endpoint has changed.',
            403: 'Access forbidden. Please check your login status or pass security check on perplexity.ai.',
            429: 'Too many requests. You have exceeded your rate limit. Please try again later.',
            500: 'Server error. Perplexity is experiencing issues. Please try again later.',
            quotaExceeded: 'Deep Research quota exceeded for {{tier}} tier. Switch to Quick Search or upgrade your plan.',
            generic: 'An error occurred: {{message}}',
        },
        tier: {
            free: 'Free',
            pro: 'Pro',
        },
        login: {
            required: 'Login Required',
            message: 'Please log in to Perplexity to use advanced features like Deep Research and file attachments.',
            actionButton: 'Open Perplexity & Login',
            featureLimited: 'Some features are limited without login',
            tabOpened: 'Perplexity login tab opened. Please complete authentication.',
            alreadyLoggedIn: 'Already logged in to Perplexity',
        },
        quota: {
            left: 'left',
            selectTier: 'Select Subscription Tier',
            freePlan: 'Free Plan',
            proPlan: 'Pro Plan',
        },
        chat: {
            placeholder: 'Ask anything...',
            deepResearchPlaceholder: 'Ask a deep research question...',
            emptyTitle: 'Where knowledge begins',
            emptyDescription: 'Ask anything. Perplexity searches the internet to give you an answer with citations.',
            thinking: 'Perplexity is thinking...',
            proSearch: 'Pro Search',
            quickSearch: 'Quick Search',
            proSearchInfo: 'Pro Search uses advanced models. {{remaining}} queries remaining.',
            quickSearchInfo: 'Quick Search is unlimited and fast.',
            attachment: 'Attachment',
        },
    },

    // === Notifications ===
    notifications: {
        loginRequired: 'Login Required',
        loginToPerplexity: 'Please log in to Perplexity to continue',
        featureRestricted: 'This feature is restricted',
        networkError: 'Network error. Please check your connection.',
        unknownError: 'An unknown error occurred',
    },

    // === Model Categories (for Prompt Library) ===
    categories: {
        general: 'General',
        coding: 'Coding',
        writing: 'Writing',
        analysis: 'Analysis',
        creative: 'Creative',
        business: 'Business',
        academic: 'Academic',
    },

    // === Model Card ===
    modelCard: {
        refresh: 'Refresh',
        openInNewTab: 'Open in New Tab',
        removeMainBrain: 'Remove Main Brain',
        setAsMainBrain: 'Set as Main Brain',
        syncing: 'Syncing session...',
        synced: 'Session synced!',
        syncFailed: 'Sync failed',
        syncSession: 'Sync Session',
        mainBrain: 'Main Brain',
    },

    // === System Prompts (Partial) ===
    prompts: {
        'sys-1': {
            title: 'Expert Code Refactoring',
            description: 'Refactor code professionally for readability, performance, and SOLID principles.',
        },
        'sys-2': {
            title: 'Business Email Polish',
            description: 'Transform rough drafts into polite, professional business emails.',
        },
        'sys-3': {
            title: 'Explain Like I\'m 5 (ELI5)',
            description: 'Explain complex topics simply, avoiding jargon.',
        },
        'sys-4': {
            title: 'Unit Test Generator',
            description: 'Generate comprehensive unit test cases for provided code.',
        },
        'sys-5': {
            title: 'Meeting Minutes Summary',
            description: 'Extract key points, decisions, and action items from meeting notes.',
        },
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `You are the "Main Brain" managing and directing slave bots. Slaves do not communicate with each other; conversation proceeds 1:N between you and the slaves.
Slave Bot List:
{{slaves}}

[Goal]
{{goal}}

[Role]
Considering the characteristics and strengths of each slave bot, design optimal prompts, synthesize subsequent responses to perform fact-checking/verification/problem analysis, and present the optimal solution to achieve the user's goal.

[Output Format Rules - MUST FOLLOW]
1) Exactly one block per slave, maintain list order.
2) Header: [SLAVE:{{modelId}}] or [SLAVE:{{modelId-instanceId}}]
3) Inside block: Only the prompt to execute (No explanations/meta text).
4) Close: [/SLAVE]
5) No text outside SLAVE blocks.
6) No chain/sequential dependency: No slave refers to another slave's output. Assume all execute independently at the same time.
7) Must write blocks for ALL items in the slave list. Missing any will significantly degrade quality.

[Slave Instruction Guide]
0. Persona: Specify the model's exact role.
1. Instruction: Instruct clearly with specific verbs.
2. Context: Provide sufficient background info.
3. Input Data: Provide data to process accurately.
4. Output Format: Specify desired result format concretely.
- Specify role/goal/output format/constraints per model characteristics.
- No duplicate questions, distribute different perspectives/strategies.
- Configure to respond in the user's primary language.`,
        phase3: `Below are the responses from the slave bots according to your instructions.
Format: [Model Name(ID) Response: Content...]

[User's Original Goal] - Recall carefully
{{goal}}

[Slave Response Data]
{{responses}}

[Final Instruction]
Parse and synthesize the above responses, perform fact-checking, verification, and problem analysis, then present the optimal solution that meets the user's original goal.`,
    },

    // === Brain Flow Modal ===
    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'Main Brain orchestrates {{count}} slave bots',
        goalLabel: 'Enter your goal',
        goalPlaceholder: 'e.g., Analyze this data, derive insights, and create an execution plan...',
        tip: 'Tip: Press Ctrl+Enter (or ⌘+Enter) to execute immediately',
        startButton: 'Start Brain Flow',
        errorNoMainBrain: 'Please designate a Main Brain first.',
        errorNoSlaves: 'No slave bots. Please add at least one model.',
    },
};
