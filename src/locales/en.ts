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
        confirmDelete: 'Are you sure you want to delete this conversation?',
        deleteConfirm: 'Are you sure you want to delete?',
    },

    // === Sidebar ===
    sidebar: {
        chats: 'Chats',
        history: 'History',
        models: 'Models',
        prompts: 'Prompts',
        settings: 'Settings',
        noActiveChats: 'Start a new conversation.',
        createNewChat: 'Create new chat',
        activeSessions: 'Active Sessions',
        availableModels: 'Available Models',
        maxInstancesHint: 'Max 3 / model',
        proUser: 'Pro User',
        versionLabel: 'ModelDock V1',
        byokModels: 'BYOK Models',
        standardModels: 'Standard Models',
        conversationHistory: 'Conversation History',
        today: 'Today',
        yesterday: 'Yesterday',
        previous7Days: 'Previous 7 Days',
        older: 'Older',
        noHistory: 'No conversation history',
        brainFlow: 'Brain Flow',
        autoRouting: 'Auto Routing',
        manual: 'Manual',
        link: 'Link',
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
        consentTitle: '⚡️ Auto-Routing Consent (Risk Disclosure)',
        consentMessage: 'ModelDock automatically sends messages to active models within your browser. ⚠️ Warning: Some AI services (ChatGPT, Claude, etc.) may consider automated access a violation of their Terms of Service, which could result in account warnings, temporary blocks, or permanent suspension. You assume all responsibility for using this feature.',
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
        phase1: `# ROLE
You are the "Main Brain" - a task orchestrator who distributes specialized subtasks to slave AI models.
You do NOT answer the user's question directly. Your ONLY job is to create optimal prompts for each slave.

# SLAVE MODELS
{{slaves}}

# USER'S GOAL
{{goal}}

# CRITICAL RULES (MUST FOLLOW)
1. Create EXACTLY ONE [SLAVE:id] block for EVERY slave listed above - no exceptions
2. Slaves run IN PARALLEL and CANNOT see each other's outputs
3. Do NOT include any text outside [SLAVE:...][/SLAVE] blocks
4. Use the EXACT slave ID from the list (e.g., [SLAVE:gemini-1], [SLAVE:grok-2])

# OUTPUT FORMAT
[SLAVE:model-id]
Your specific task prompt here...
[/SLAVE]

# PROMPT DESIGN STRATEGY
For each slave, assign a DISTINCT role based on the goal:
- Analyst: Data analysis, pattern recognition, statistics
- Critic: Risk assessment, counterarguments, edge cases
- Creator: Solutions, ideas, implementation plans
- Validator: Fact-checking, source verification, logic review
- Synthesizer: Summaries, key insights, action items

# SLAVE PROMPT TEMPLATE
Each prompt should include:
1. ROLE: "You are a [specific expert role]..."
2. TASK: Clear, actionable instruction with specific verbs
3. FOCUS: What specific aspect to analyze (avoid overlap with other slaves)
4. FORMAT: Desired output structure (bullets, numbered list, sections)
5. LANGUAGE: Respond in the same language as the user's goal

# ANTI-PATTERNS (DO NOT)
❌ Ask the same question to multiple slaves
❌ Create dependency between slaves (e.g., "based on Model A's output...")
❌ Write meta-commentary or explanations outside blocks
❌ Skip any slave from the list
❌ Use generic prompts - be specific to each slave's strengths`,
        phase3: `# ROLE
You are the "Main Brain" synthesizer. Your job is to merge multiple AI responses into ONE optimal answer.

# USER'S ORIGINAL GOAL
{{goal}}

# SLAVE RESPONSES
{{responses}}

# SYNTHESIS METHODOLOGY
Follow this process:

## Step 1: EXTRACT
- List key points from each response
- Note unique insights that only one model provided
- Identify overlapping conclusions (consensus)

## Step 2: VALIDATE
- Cross-check facts mentioned by multiple sources
- Flag any contradictions between responses
- Assess confidence: High (3+ models agree) / Medium (2 agree) / Low (1 only)

## Step 3: RESOLVE CONFLICTS
When models disagree:
- Prefer responses with specific evidence/data over opinions
- Consider each model's domain expertise
- If unresolvable, present both views with pros/cons

## Step 4: SYNTHESIZE
Create a unified answer that:
- Directly addresses the user's original goal
- Combines the best elements from all responses
- Eliminates redundancy and contradictions
- Maintains logical flow and coherence

# OUTPUT FORMAT
Structure your response as:

### 📋 Executive Summary
[2-3 sentence overview of the synthesized answer]

### 🔍 Key Findings
[Bullet points of main conclusions with confidence levels]

### ⚠️ Important Considerations
[Risks, caveats, or minority opinions worth noting]

### ✅ Recommended Action / Answer
[Clear, actionable conclusion that fulfills the user's goal]

# LANGUAGE
Respond in the same language as the user's original goal.`,
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

        // BYOK Modal UI (additional)
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Configure your AI infrastructure',
        openRouterNote: '* Model info is based on OpenRouter. Availability may vary with actual provider keys.',
        aiProviders: 'AI Providers',
        selectProvider: 'Select a provider to configure',
        allSystemsOperational: 'All systems operational',
        lastUpdated: 'Last Updated: {{time}}',
        notYetRefreshed: 'Not yet refreshed',
        refreshModels: 'Refresh Models',

        // Model Variants
        variants: {
            default: 'Default settings',
            free: 'Free version ($0, rate limit applied)',
            extended: 'Extended context window',
            thinking: 'Extended reasoning (Chain-of-Thought)',
            online: 'Real-time web search (Exa.ai)',
            nitro: 'Fastest provider priority',
            floor: 'Cheapest provider priority',
        },

        // Status
        status: {
            available: 'Available',
            unavailable: 'Unavailable',
            uncertain: 'Verified (Model Check Skipped)',
            notVerified: 'Not verified',
            checking: 'Checking...',
            verified: 'Verified',
        },

        // Advanced Settings
        advanced: {
            title: 'Advanced Settings',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Frequency Penalty',
            presencePenalty: 'Presence Penalty',
            seed: 'Seed',
            random: 'Random',
            responseFormat: 'Response Format',
            text: 'Text',
            jsonObject: 'JSON Object',
        },

        // Model Card UI
        modelCard: {
            settings: 'Settings',
            customSettings: 'Custom Settings',
            ctx: 'ctx',
            free: 'Free',
        },

        // Tooltips
        tooltips: {
            modelAvailable: '✅ Model available with your API key',
            modelUnavailable: '❌ Model unavailable (check API key or model access)',
            modelUncertain: 'API Key is valid, but we couldn\'t verify the specific model\'s availability. You can likely use it.',
            clickToVerify: 'Click to verify model availability',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'No messages yet',
        startConversation: 'Start a conversation with this BYOK model',
        attachImage: 'Attach image',
        imageTooLarge: 'Image "{{name}}" is too large (max 20MB)',
        sending: 'Sending...',
        receiving: 'Receiving...',
        imagesSelected: '{{count}} image(s) selected',
        pressEnterToSend: 'Press Enter to send',
        sendMessage: 'Send a message to this model...',
        attachedImage: 'Attached image',
        preview: 'Preview {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Planning Phase',
        phase2Title: 'Execution Phase',
        phase3Title: 'Synthesis Phase',
        waiting: 'Waiting',
        done: 'Done',
        processing: 'Processing...',
        skipWaiting: 'Skip Waiting',
    },

    // === History Popover ===
    historyPopover: {
        title: 'History',
        modelHistory: 'Model History',
        newChat: 'New Chat',
        searchPlaceholder: 'Search conversations...',
        loading: 'Loading...',
        noConversations: 'No conversations found',
        startNewChat: 'Start a new chat to see it here',
        untitledConversation: 'Untitled Conversation',
        noPreview: 'No preview available',
        deleteConversation: 'Delete conversation',
        conversationsStored: '{{count}} conversations stored',
        daysAgo: '{{days}}d ago',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Model Settings',
        useDefaultSettings: 'Use Default Settings',
        applyGlobalSettings: 'Apply global BYOK settings',
        unsaved: 'Unsaved',
        resetToDefaults: 'Reset to defaults',
        modelVariant: 'Model Variant',
        enableThinking: 'Enable Thinking',
        noCustomSettings: 'No custom settings for this model.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'API Key Settings',
        byokDescription: 'Use OpenAI, Claude, Gemini directly',
        openSettings: 'Open Settings',
    },

    // === App Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 Would you like to add {{name}} model?\n\nStart a new conversation and freely\nconsult or request something from {{name}}.',
        deleteModel: '❌ Delete "{{name}}" model?',
        newChat: '💬 Start a new conversation?\n\nCurrent conversation will be saved automatically,\nand can be retrieved from history anytime.',
        apiKeyNotSet: 'API key is not set. Please enable and save the key in Settings → BYOK.',
        modelNotSelected: 'No model selected. Please select a model in BYOK settings.',
    },

    // === Thinking Process (AnimatedChatMessage) ===
    thinking: {
        processTitle: 'Thinking Process',
        showProcess: 'Show thinking process',
        hideProcess: 'Hide thinking process',
        summary: 'Summary',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Conversation History',
    },
};
