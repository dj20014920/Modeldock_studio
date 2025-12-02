export default {
    common: {
        loading: '加载中...',
        save: '保存',
        cancel: '取消',
        delete: '删除',
        confirm: '确认',
        close: '关闭',
        search: '搜索',
        copy: '复制',
        copied: '已复制！',
        error: '错误',
        success: '成功',
        warning: '警告',
        info: '信息',
        retry: '重试',
        back: '返回',
        next: '下一步',
        finish: '完成',
        ok: '确定',
        yes: '是',
        no: '否',
        confirmDelete: '确定要删除这个对话吗？',
        deleteConfirm: '确定要删除吗？',
    },
    sidebar: {
        chats: '对话',
        history: '历史',
        models: '模型',
        prompts: '提示词',
        settings: '设置',
        noActiveChats: '开始一段新对话吧。',
        createNewChat: '新建对话',
        activeSessions: '活跃会话',
        availableModels: '可用模型',
        maxInstancesHint: '每个模型限3个',
        proUser: '专业版用户',
        versionLabel: 'ModelDock V1',
        byokModels: 'BYOK模型',
        standardModels: '标准模型',
        conversationHistory: '对话历史',
        today: '今天',
        yesterday: '昨天',
        previous7Days: '过去7天',
        older: '更早',
        noHistory: '暂无对话历史',
        brainFlow: 'Brain Flow',
        autoRouting: '自动路由',
        manual: '手动',
        link: '链接',
    },
    modelGrid: {
        allInMainBrain: '暂无活跃模型。请从侧边栏选择模型添加。',
        noModels: '暂无可用模型',
    },
    chatInput: {
        manualMode: '手动',
        autoMode: '自动',
        placeholder: '向AI模型提问...',
        send: '发送',
        copyToClipboard: '复制到剪贴板',
        dispatchToAll: '发送给所有模型',
        consentTitle: '⚡️ 自动路由同意（风险提示）',
        consentMessage: 'ModelDock会在您的浏览器中自动向活跃的模型发送消息。⚠️ 警告：部分AI服务（ChatGPT、Claude等）可能将自动化访问视为违反服务条款，这可能导致账户警告、临时封禁或永久停用。使用此功能的所有责任由用户自行承担。',
        iUnderstand: '我明白了',
        sentSuccess: '发送成功！',
        errorNoTargets: '未找到有效目标',
        errorSystemError: '系统错误',
    },
    promptLibrary: {
        title: '提示词库',
        outputLanguage: '输出语言',
        searchPlaceholder: '搜索提示词 (标题, 描述, 内容)...',
        promptsCount_one: '{{count}} 个提示词',
        promptsCount_other: '{{count}} 个提示词',
        allCategories: '查看全部',
        addPrompt: '添加提示词',
        backToList: '返回列表',
        createNewPrompt: '创建新提示词',
        tips: {
            title: '写作技巧',
            content: 'LLM对英语指令的理解更准确。建议提示词内容使用英语编写，标题使用您的母语。',
        },
        form: {
            titleLabel: '标题 (建议使用中文)',
            titlePlaceholder: '例如：专家代码重构',
            categoryLabel: '分类',
            descriptionLabel: '描述 (可选)',
            descriptionPlaceholder: '简要描述此提示词的用途。',
            contentLabel: '提示词内容 (建议使用英语)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ 添加中文回复请求',
            saveButton: '保存',
            cancelButton: '取消',
        },
        systemBadge: '系统',
        optimizedPrompt: '优化后的英语提示词',
        responseLanguage: '中文回复',
        deleteConfirm: '确定要删除这个提示词吗？',
        noResults: '未找到搜索结果。',
        copyOriginal: '复制原文',
    },
    settings: {
        title: '设置',
        appearance: '外观',
        theme: '主题',
        themeLight: '浅色',
        themeDark: '深色',
        themeAuto: '自动',
        storage: '存储',
        clearLocalData: '清除本地数据',
        clearDataDescription: '重置所有设置和保存的数据',
        clearButton: '清除数据',
        about: '关于',
        version: '版本',
        documentation: '文档',
        viewDocs: '查看文档',
        privacy: '隐私',
        privacyNote: '所有数据都存储在您的浏览器本地。',
        language: '语言',
    },
    perplexity: {
        error: {
            404: '未找到资源。每日搜索配额可能已用完或API端点已更改。',
            403: '访问被拒绝。请检查您的登录状态或在perplexity.ai上通过安全检查。',
            429: '请求过多。您已超过速率限制。请稍后再试。',
            500: '服务器错误。Perplexity遇到问题。请稍后再试。',
            quotaExceeded: '{{tier}} 层的深度研究配额已用完。请切换到快速搜索或升级您的计划。',
            generic: '发生错误：{{message}}',
        },
        tier: {
            free: '免费',
            pro: '专业',
        },
        login: {
            required: '需要登录',
            message: '请登录Perplexity以使用深度研究和文件附件等高级功能。',
            actionButton: '打开Perplexity并登录',
            featureLimited: '未登录时部分功能受限',
            tabOpened: 'Perplexity登录标签页已打开。请完成验证。',
            alreadyLoggedIn: '已登录Perplexity',
        },
        quota: {
            left: '剩余',
            selectTier: '选择订阅层级',
            freePlan: '免费计划',
            proPlan: '专业计划',
        },
        chat: {
            placeholder: '问任何问题...',
            deepResearchPlaceholder: '提出深度研究问题...',
            emptyTitle: '知识的起点',
            emptyDescription: '问任何问题。Perplexity将搜索互联网并提供带有引用的答案。',
            thinking: 'Perplexity正在思考...',
            proSearch: '专业搜索',
            quickSearch: '快速搜索',
            proSearchInfo: '专业搜索使用高级模型。剩余 {{remaining}} 次查询。',
            quickSearchInfo: '快速搜索无限且快速。',
            attachment: '附件',
        },
    },
    notifications: {
        loginRequired: '需要登录',
        loginToPerplexity: '请登录Perplexity以继续',
        featureRestricted: '此功能受限',
        networkError: '网络错误。请检查您的连接。',
        unknownError: '发生未知错误',
    },
    categories: {
        general: '通用',
        coding: '编程',
        writing: '写作',
        analysis: '分析',
        creative: '创意',
        business: '商业',
        academic: '学术',
    },

    // === 模型卡片 ===
    modelCard: {
        refresh: '刷新',
        openInNewTab: '在新标签页打开',
        removeMainBrain: '取消主脑',
        setAsMainBrain: '设为主脑',
        syncing: '会话同步中...',
        synced: '同步完成！',
        syncFailed: '同步失败',
        syncSession: '会话同步',
        mainBrain: '主脑',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# 角色
你是"主脑" - 一个将专业子任务分配给从属AI模型的任务协调者。
你不直接回答用户的问题。你唯一的工作是为每个从属创建最优提示词。

# 从属模型列表
{{slaves}}

# 用户目标
{{goal}}

# 必须遵守的规则（MUST）
1. 为上述列表中的每个从属创建恰好一个[SLAVE:id]块 - 无例外
2. 从属并行运行，无法看到彼此的输出
3. 不要在[SLAVE:...][/SLAVE]块外包含任何文本
4. 使用列表中提供的确切从属ID（例如：[SLAVE:gemini-1]、[SLAVE:grok-2]）

# 输出格式
[SLAVE:model-id]
此从属的具体任务提示词...
[/SLAVE]

# 提示词设计策略
根据目标为每个从属分配不同的角色：
- 分析师：数据分析、模式识别、统计
- 批评家：风险评估、反驳论点、边缘案例
- 创作者：解决方案、创意、执行计划
- 验证者：事实核查、来源验证、逻辑审查
- 综合者：摘要、关键洞察、行动项目

# 从属提示词模板
每个提示词应包含：
1. 角色："你是[具体专家角色]..."
2. 任务：使用具体动词的清晰可执行指令
3. 焦点：要分析的具体方面（避免与其他从属重叠）
4. 格式：期望的输出结构（要点、编号列表、章节）
5. 语言：使用与用户目标相同的语言回复

# 反模式（禁止）
❌ 向多个从属提出相同问题
❌ 创建从属间的依赖关系（如："基于模型A的输出..."）
❌ 在块外写元评论或解释
❌ 遗漏列表中的任何从属
❌ 使用通用提示词 - 针对每个从属的优势定制`,
        phase3: `# 角色
你是"主脑"综合者。你的工作是将多个AI回复合并成一个最优答案。

# 用户的原始目标
{{goal}}

# 从属回复
{{responses}}

# 综合方法论（4步）

## 第1步：提取（EXTRACT）
- 列出每个回复的关键点
- 记录只有一个模型提供的独特见解
- 识别重叠的结论（共识）

## 第2步：验证（VALIDATE）
- 交叉核查多个来源提到的事实
- 标记回复之间的矛盾
- 评估置信度：高（3+模型同意）/ 中（2个同意）/ 低（仅1个）

## 第3步：解决冲突（RESOLVE）
当模型意见不一致时：
- 优先选择有具体证据/数据的回复而非观点
- 考虑每个模型的专业领域
- 如无法解决，同时呈现两种观点及其优缺点

## 第4步：综合（SYNTHESIZE）
创建统一答案：
- 直接回应用户的原始目标
- 结合所有回复的最佳元素
- 消除冗余和矛盾
- 保持逻辑流畅和连贯

# 输出格式
按以下结构回复：

### 📋 执行摘要
[2-3句话概述综合答案]

### 🔍 关键发现
[带置信度的主要结论要点]

### ⚠️ 重要注意事项
[风险、警告或值得注意的少数意见]

### ✅ 建议行动/答案
[满足用户目标的清晰可执行结论]

# 语言
使用与用户原始目标相同的语言回复。`,
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: '主脑协调 {{count}} 个辅助Bot',
        goalLabel: '请输入你的目标',
        goalPlaceholder: '例：请分析这些数据，提炼洞察，并制定执行计划……',
        tip: '提示：目标越清晰，结果越精准。',
        startButton: '开始Brain Flow',
        errorNoMainBrain: '请先指定一个主脑。',
        errorNoSlaves: '需要至少一个其他模型才能运行Brain Flow。',
        errorNotSupported: '选中的主脑（{modelName}）不支持Brain Flow。（如Vibe Coding工具）',
        warningExcludedModels: '部分模型因不支持Brain Flow而被排除。',
        excludedMessage: '以下模型将从Brain Flow中排除: {{models}}',
        previewButton: '预览并调整主提示词',
        previewShow: '展开',
        previewHide: '收起',
        previewTitle: '主脑提示词预览',
        previewFilledLabel: '使用当前目标的预览',
        warningKeepBlocks: '请保留 [SLAVE:…]、{{slaves}}、{{goal}} 不变。',
        persistNote: '已保存。后续 Brain Flow 将继续使用这个提示词。',
        previewGoalPlaceholder: '告诉我你想达成的目标...',
        synthesisPreviewButton: '预览并调整汇总提示词',
        synthesisPreviewTitle: '汇总提示词预览',
        synthesisPreviewFilledLabel: '使用示例回复的预览',
        synthesisWarningKeepBlocks: '请保留 {{goal}} 和 {{responses}} 不变。',
    },

    // === BYOK ===
    byok: {
        title: 'BYOK设置',
        subtitle: '使用自己的API密钥访问AI模型',
        systemActive: '系统活跃',
        systemDisabled: '系统禁用',
        refreshAll: '全部刷新',
        refreshing: '刷新中...',
        saveChanges: '保存更改',
        saving: '保存中...',
        providerName: '提供商',
        modelsCount: '{{count}}个模型',
        getApiKey: '获取API密钥',
        documentation: '文档',
        apiCredentials: 'API凭证',
        validate: '验证',
        validating: '验证中...',
        valid: '有效',
        invalid: '无效',
        modelSelection: '模型选择',
        available: '可用',
        searchModels: '搜索模型...',
        sortBy: '排序',
        sortPopular: '按热门',
        sortLatest: '按最新',
        allModels: '全部模型',
        reasoning: '推理',
        coding: '编程',
        vision: '视觉',
        realtime: '实时',
        contextWindow: '上下文窗口',
        pricing: '价格',
        pricingVaries: '价格变动',
        noModelsFound: '未找到匹配的模型。',
        refreshSuccess: '模型列表已成功刷新。',
        refreshError: '刷新模型列表失败。',
        validationSuccess: 'API密钥有效。',
        validationError: 'API密钥验证失败。',
        saveSuccess: '设置已保存。',
        validation: {
            title: '需要API密钥验证',
            unverifiedProvidersMessage: '以下提供商尚未验证:',
            autoVerifyPrompt: '是否立即自动验证?',
            cancelNote: '(取消将不保存并返回)',
            unavailableTitle: '无法保存',
            unavailableMessage: '以下提供商的API密钥或模型不可用:',
            modelLabel: '模型',
            reasonLabel: '原因',
            reasonInvalidKey: 'API密钥无效或无法访问模型。',
            solutionsTitle: '解决方法:',
            solution1: '1. 重新检查您的API密钥',
            solution2: '2. 尝试选择其他模型',
            solution3: '3. 在提供商网站验证权限',
            uncertainTitle: '警告: 验证不确定',
            uncertainMessage: '部分提供商无法验证:',
            uncertainReason: '验证不确定 (网络错误或速率限制)',
            proceedQuestion: '仍要保存吗?',
            recommendation: '建议: 按「取消」并使用「验证」按钮重试。',
        },
        cacheAge: '{{minutes}}分钟前更新',
        cached: '已缓存',
        studioTitle: 'BYOK Studio',
        studioSubtitle: '配置您的AI基础设施',
        openRouterNote: '※模型信息基于OpenRouter。实际可用性可能因提供商密钥而异。',
        aiProviders: 'AI提供商',
        selectProvider: '选择要配置的提供商',
        allSystemsOperational: '所有系统运行正常',
        lastUpdated: '最后更新: {{time}}',
        notYetRefreshed: '尚未刷新',
        refreshModels: '刷新模型',
        variants: {
            default: '默认配置',
            free: '免费版（$0，有速率限制）',
            extended: '扩展上下文窗口',
            thinking: '扩展推理（Chain-of-Thought）',
            online: '实时网络搜索（Exa.ai）',
            nitro: '最快提供商优先',
            floor: '最便宜提供商优先',
        },
        status: {
            available: '可用',
            unavailable: '不可用',
            uncertain: '已验证（跳过模型检查）',
            notVerified: '未验证',
            checking: '检查中...',
            verified: '已验证',
        },
        advanced: {
            title: '高级设置',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: '频率惩罚',
            presencePenalty: '存在惩罚',
            seed: '随机种子',
            random: '随机',
            responseFormat: '响应格式',
            text: '文本',
            jsonObject: 'JSON对象',
        },
        modelCard: {
            settings: '设置',
            customSettings: '自定义设置',
            ctx: 'ctx',
            free: '免费',
        },
        tooltips: {
            modelAvailable: '✅ 模型可用于此API密钥',
            modelUnavailable: '❌ 模型不可用（请检查API密钥或模型访问权限）',
            modelUncertain: 'API密钥有效，但无法确认具体模型可用性。可能可用。',
            clickToVerify: '点击验证模型可用性',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: '暂无消息',
        startConversation: '开始与此BYOK模型对话',
        attachImage: '附加图片',
        imageTooLarge: '图片「{{name}}」太大（最大20MB）',
        sending: '发送中...',
        receiving: '接收中...',
        imagesSelected: '已选择{{count}}张图片',
        pressEnterToSend: '按Enter发送',
        sendMessage: '向此模型发送消息...',
        attachedImage: '附加图片',
        preview: '预览 {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: '规划阶段',
        phase2Title: '执行阶段',
        phase3Title: '整合阶段',
        waiting: '等待中',
        done: '完成',
        processing: '处理中...',
        skipWaiting: '跳过等待',
    },

    // === History Popover ===
    historyPopover: {
        title: '历史',
        modelHistory: '模型历史',
        newChat: '新对话',
        searchPlaceholder: '搜索对话...',
        loading: '加载中...',
        noConversations: '未找到对话',
        startNewChat: '开始新对话后将在此显示',
        untitledConversation: '无标题对话',
        noPreview: '无预览',
        deleteConversation: '删除对话',
        conversationsStored: '已存储{{count}}个对话',
        daysAgo: '{{days}}天前',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: '模型设置',
        useDefaultSettings: '使用默认设置',
        applyGlobalSettings: '应用全局BYOK设置',
        unsaved: '未保存',
        resetToDefaults: '重置为默认',
        modelVariant: '模型变体',
        enableThinking: '启用思考',
        noCustomSettings: '此模型没有自定义设置。',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'API密钥设置',
        byokDescription: '直接使用OpenAI、Claude、Gemini',
        openSettings: '打开设置',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 要添加 {{name}} 模型吗？\n\n开始新对话，\n向 {{name}} 咨询或请求帮助。',
        deleteModel: '❌ 要删除「{{name}}」模型吗？',
        newChat: '💬 要开始新对话吗？\n\n当前对话将自动保存，\n可随时从历史记录恢复。',
        apiKeyNotSet: 'API密钥未设置。请在设置→BYOK中启用并保存密钥。',
        modelNotSelected: '未选择模型。请在BYOK设置中选择模型。',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: '思考过程',
        showProcess: '显示思考过程',
        hideProcess: '隐藏思考过程',
        summary: '摘要',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: '对话历史',
    },
};
