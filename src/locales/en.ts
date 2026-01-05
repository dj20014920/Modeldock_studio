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

    // === Notifications ===
    notifications: {
        loginRequired: 'Login Required',
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
2) Header: [SLAVE:modelId-number] (e.g., [SLAVE:gemini-1], [SLAVE:grok-2])
   ※ IMPORTANT: Use the exact ID provided in the list above!
3) Inside block: Prompt content only (no meta text)
4) Close: [/SLAVE]
5) No text outside SLAVE blocks
6) No chain dependencies: Slaves run in parallel.
7) Do not miss any slave from the list.

[Slave Instruction Guide]
0. Persona: Define role clearly
1. Instruction: Use specific verbs
2. Context: Provide background info
3. Input Data: Provide data to process
4. Output Format: Specify desired format
- Specify role/goal/format/constraints per model
- Avoid duplicate questions, distribute perspectives
- Ensure response is in user's language

[Example Format]
[SLAVE:gemini-1]
Persona: You are a market analyst.
Instruction: Answer the following based on data...
[/SLAVE]`,
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
        errorNoSlaves: 'At least one other model must be active to run Brain Flow.',
        errorNotSupported: 'The selected Main Brain ({modelName}) does not support Brain Flow. (e.g., Vibe Coding tools)',
        warningExcludedModels: 'Some models were excluded as they do not support Brain Flow.',
        excludedMessage: 'The following models are excluded from Brain Flow: {{models}}',
        previewButton: 'Preview & gently edit the main prompt',
        previewShow: 'open',
        previewHide: 'close',
        previewTitle: 'Main Brain prompt preview (goal/slaves will auto-fill below)',
        previewFilledLabel: 'Preview with your current goal',
        warningKeepBlocks: 'Please keep the [SLAVE:...] blocks, {{slaves}}, and {{goal}} placeholders intact — adjust the wording around them only.',
        persistNote: 'Saved. We will keep using this tailored main prompt for future Brain Flow runs.',
        previewGoalPlaceholder: 'Tell me what you want to achieve, and I will guide the whole team…',
        synthesisPreviewButton: 'Preview & gently edit the synthesis prompt',
        synthesisPreviewTitle: 'Synthesis prompt preview (goal/responses will auto-fill below)',
        synthesisPreviewFilledLabel: 'Preview with sample responses',
        synthesisWarningKeepBlocks: 'Keep {{goal}} and {{responses}} placeholders intact — you can rephrase around them. This prompt guides the final synthesis, not the slave blocks.',
    },

    // === BYOK (Bring Your Own Key) ===
    byok: {
        title: 'BYOK Settings',
        subtitle: 'Use AI models with your own API keys',
        systemActive: 'System Active',
        systemDisabled: 'System Disabled',
        refreshAll: 'Refresh All',
        refreshing: 'Refreshing...',
        saveChanges: 'Save Changes',
        saving: 'Saving...',

        // Provider Info
        providerName: 'Provider',
        modelsCount: '{{count}} Models',
        getApiKey: 'Get API Key',
        documentation: 'Documentation',

        // API Key Section
        apiCredentials: 'API Credentials',
        validate: 'Validate',
        validating: 'Validating...',
        valid: 'Valid',
        invalid: 'Invalid',

        // Model Selection
        modelSelection: 'Model Selection',
        available: 'Available',
        searchModels: 'Search models...',
        sortBy: 'Sort by',
        sortPopular: 'Popular',
        sortLatest: 'Latest',

        // Model Categories
        allModels: 'All Models',
        reasoning: 'Reasoning',
        coding: 'Coding',
        vision: 'Vision',
        realtime: 'Realtime',

        // Model Details
        contextWindow: 'Context Window',
        pricing: 'Pricing',
        pricingVaries: 'Pricing varies',
        perMillionTokens: '${{price}}/1M tokens',
        inputPrice: 'Input: ${{price}}',
        outputPrice: 'Output: ${{price}}',

        // Model Badges
        newBadge: 'NEW',
        topBadge: 'TOP',
        recommendedBadge: 'RECOMMENDED',

        // Capabilities
        supportsReasoning: 'Reasoning',
        supportsCoding: 'Coding',
        supportsVision: 'Vision',
        supportsRealtime: 'Realtime',

        // Advanced Parameters
        reasoningEffort: 'Reasoning Effort',
        reasoningEffortLow: 'Low (Fast)',
        reasoningEffortMedium: 'Medium (Balanced)',
        reasoningEffortHigh: 'High (Accurate)',

        thinkingBudget: 'Thinking Budget',
        thinkingBudgetTokens: '{{count}} tokens',

        temperature: 'Temperature',
        temperatureDesc: 'Creativity vs Consistency (0.0 ~ 2.0)',

        maxTokens: 'Max Tokens',
        maxTokensDesc: 'Maximum tokens to generate',

        // Messages
        noModelsFound: 'No models found matching your criteria.',
        refreshSuccess: 'Model list refreshed successfully.',
        refreshError: 'Failed to refresh model list.',
        validationSuccess: 'API key is valid.',
        validationError: 'API key validation failed.',
        saveSuccess: 'Settings saved successfully.',

        // Validation Messages (Auto-verification on Save)
        validation: {
            title: 'API Key Verification Required',
            unverifiedProvidersMessage: 'The following providers have not been verified:',
            autoVerifyPrompt: 'Would you like to automatically verify them now?',
            cancelNote: '(Cancel to return without saving)',

            unavailableTitle: 'Cannot Save',
            unavailableMessage: 'The following providers have invalid API keys or inaccessible models:',
            modelLabel: 'Model',
            reasonLabel: 'Reason',
            reasonInvalidKey: 'API key is invalid or model is inaccessible.',
            solutionsTitle: 'Solutions:',
            solution1: '1. Double-check your API key',
            solution2: '2. Try selecting a different model',
            solution3: '3. Verify permissions on the provider website',

            uncertainTitle: 'Warning: Verification Uncertain',
            uncertainMessage: 'Some providers could not be verified:',
            uncertainReason: 'Verification uncertain (network error or rate limit)',
            proceedQuestion: 'Do you still want to save?',
            recommendation: 'Recommendation: Press "Cancel" and retry with the "Verify" button.',
        },

        // Cache Info
        cacheAge: 'Updated {{minutes}} min ago',
        cached: 'Cached',
    },
};
