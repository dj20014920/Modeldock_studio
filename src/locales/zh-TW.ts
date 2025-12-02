export default {
    common: {
        loading: '載入中...',
        save: '儲存',
        cancel: '取消',
        delete: '刪除',
        confirm: '確認',
        close: '關閉',
        search: '搜尋',
        copy: '複製',
        copied: '已複製！',
        error: '錯誤',
        success: '成功',
        warning: '警告',
        info: '資訊',
        retry: '重試',
        back: '返回',
        next: '下一步',
        finish: '完成',
        ok: '確定',
        yes: '是',
        no: '否',
        confirmDelete: '確定要刪除這個對話嗎？',
        deleteConfirm: '確定要刪除嗎？',
    },
    sidebar: {
        chats: '對話',
        history: '歷史',
        models: '模型',
        prompts: '提示詞',
        settings: '設定',
        noActiveChats: '開始一段新對話吧。',
        createNewChat: '建立新對話',
        activeSessions: '活躍會話',
        availableModels: '可用模型',
        maxInstancesHint: '每個模型限3個',
        proUser: '專業版使用者',
        versionLabel: 'ModelDock V1',
        byokModels: 'BYOK模型',
        standardModels: '標準模型',
        conversationHistory: '對話歷史',
        today: '今天',
        yesterday: '昨天',
        previous7Days: '過去7天',
        older: '更早',
        noHistory: '暫無對話歷史',
        brainFlow: 'Brain Flow',
        autoRouting: '自動路由',
        manual: '手動',
        link: '連結',
    },
    modelGrid: {
        allInMainBrain: '暫無活躍模型。請從側邊欄選擇模型新增。',
        noModels: '暫無可用模型',
    },
    chatInput: {
        manualMode: '手動',
        autoMode: '自動',
        placeholder: '向AI模型提問...',
        send: '傳送',
        copyToClipboard: '複製到剪貼簿',
        dispatchToAll: '傳送給所有模型',
        consentTitle: '⚡️ 自動路由同意（風險提示）',
        consentMessage: 'ModelDock會在您的瀏覽器中自動向活躍的模型發送訊息。⚠️ 警告：部分AI服務（ChatGPT、Claude等）可能將自動化存取視為違反服務條款，這可能導致帳戶警告、暫時封鎖或永久停用。使用此功能的所有責任由使用者自行承擔。',
        iUnderstand: '我明白了',
        sentSuccess: '傳送成功！',
        errorNoTargets: '未找到有效目標',
        errorSystemError: '系統錯誤',
    },
    promptLibrary: {
        title: '提示詞庫',
        outputLanguage: '輸出語言',
        searchPlaceholder: '搜尋提示詞 (標題, 描述, 內容)...',
        promptsCount_one: '{{count}} 個提示詞',
        promptsCount_other: '{{count}} 個提示詞',
        allCategories: '檢視全部',
        addPrompt: '新增提示詞',
        backToList: '返回列表',
        createNewPrompt: '建立新提示詞',
        tips: {
            title: '寫作技巧',
            content: 'LLM對英語指令的理解更準確。建議提示詞內容使用英語編寫，標題使用您的母語。',
        },
        form: {
            titleLabel: '標題 (建議使用中文)',
            titlePlaceholder: '例如：專家程式碼重構',
            categoryLabel: '分類',
            descriptionLabel: '描述 (可選)',
            descriptionPlaceholder: '簡要描述此提示詞的用途。',
            contentLabel: '提示詞內容 (建議使用英語)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ 新增中文回覆請求',
            saveButton: '儲存',
            cancelButton: '取消',
        },
        systemBadge: '系統',
        optimizedPrompt: '最佳化後的英語提示詞',
        responseLanguage: '中文回覆',
        deleteConfirm: '確定要刪除這個提示詞嗎？',
        noResults: '未找到搜尋結果。',
        copyOriginal: '複製原文',
    },
    settings: {
        title: '設定',
        appearance: '外觀',
        theme: '主題',
        themeLight: '淺色',
        themeDark: '深色',
        themeAuto: '自動',
        storage: '儲存',
        clearLocalData: '清除本地資料',
        clearDataDescription: '重置所有設定和儲存的資料',
        clearButton: '清除資料',
        about: '關於',
        version: '版本',
        documentation: '文件',
        viewDocs: '檢視文件',
        privacy: '隱私',
        privacyNote: '所有資料都儲存在您的瀏覽器本地。',
        language: '語言',
    },
    perplexity: {
        error: {
            404: '未找到資源。每日搜尋配額可能已用完或API端點已更改。',
            403: '存取被拒絕。請檢查您的登入狀態或在perplexity.ai上通過安全檢查。',
            429: '請求過多。您已超過速率限制。請稍後再試。',
            500: '伺服器錯誤。Perplexity遇到問題。請稍後再試。',
            quotaExceeded: '{{tier}} 層的深度研究配額已用完。請切換到快速搜尋或升級您的計劃。',
            generic: '發生錯誤：{{message}}',
        },
        tier: {
            free: '免費',
            pro: '專業',
        },
        login: {
            required: '需要登入',
            message: '請登入Perplexity以使用深度研究和檔案附件等高階功能。',
            actionButton: '開啟Perplexity並登入',
            featureLimited: '未登入時部分功能受限',
            tabOpened: 'Perplexity登入分頁已開啟。請完成驗證。',
            alreadyLoggedIn: '已登入Perplexity',
        },
        quota: {
            left: '剩餘',
            selectTier: '選擇訂閱層級',
            freePlan: '免費計劃',
            proPlan: '專業計劃',
        },
        chat: {
            placeholder: '問任何問題...',
            deepResearchPlaceholder: '提出深度研究問題...',
            emptyTitle: '知識的起點',
            emptyDescription: '問任何問題。Perplexity將搜尋網際網路並提供帶有引用的答案。',
            thinking: 'Perplexity正在思考...',
            proSearch: '專業搜尋',
            quickSearch: '快速搜尋',
            proSearchInfo: '專業搜尋使用高階模型。剩餘 {{remaining}} 次查詢。',
            quickSearchInfo: '快速搜尋無限且快速。',
            attachment: '附件',
        },
    },
    notifications: {
        loginRequired: '需要登入',
        loginToPerplexity: '請登入Perplexity以繼續',
        featureRestricted: '此功能受限',
        networkError: '網路錯誤。請檢查您的連線。',
        unknownError: '發生未知錯誤',
    },
    categories: {
        general: '一般',
        coding: '編程',
        writing: '寫作',
        analysis: '分析',
        creative: '創意',
        business: '商業',
        academic: '學術',
    },

    // === 模型卡片 ===
    modelCard: {
        refresh: '重新整理',
        openInNewTab: '在新分頁開啟',
        removeMainBrain: '取消主腦',
        setAsMainBrain: '設為主腦',
        syncing: '會話同步中...',
        synced: '同步完成！',
        syncFailed: '同步失敗',
        syncSession: '會話同步',
        mainBrain: '主腦',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# 角色
你是「主腦」 - 一個將專業子任務分配給從屬AI模型的任務協調者。
你不直接回答用戶的問題。你唯一的工作是為每個從屬創建最優提示詞。

# 從屬模型列表
{{slaves}}

# 用戶目標
{{goal}}

# 必須遵守的規則（MUST）
1. 為上述列表中的每個從屬創建恰好一個[SLAVE:id]區塊 - 無例外
2. 從屬並行運行，無法看到彼此的輸出
3. 不要在[SLAVE:...][/SLAVE]區塊外包含任何文字
4. 使用列表中提供的確切從屬ID（例如：[SLAVE:gemini-1]、[SLAVE:grok-2]）

# 輸出格式
[SLAVE:model-id]
此從屬的具體任務提示詞...
[/SLAVE]

# 提示詞設計策略
根據目標為每個從屬分配不同的角色：
- 分析師：數據分析、模式識別、統計
- 批評家：風險評估、反駁論點、邊緣案例
- 創作者：解決方案、創意、執行計畫
- 驗證者：事實核查、來源驗證、邏輯審查
- 綜合者：摘要、關鍵洞察、行動項目

# 從屬提示詞模板
每個提示詞應包含：
1. 角色：「你是[具體專家角色]...」
2. 任務：使用具體動詞的清晰可執行指令
3. 焦點：要分析的具體方面（避免與其他從屬重疊）
4. 格式：期望的輸出結構（要點、編號列表、章節）
5. 語言：使用與用戶目標相同的語言回覆

# 反模式（禁止）
❌ 向多個從屬提出相同問題
❌ 創建從屬間的依賴關係（如：「基於模型A的輸出...」）
❌ 在區塊外寫元評論或解釋
❌ 遺漏列表中的任何從屬
❌ 使用通用提示詞 - 針對每個從屬的優勢定制`,
        phase3: `# 角色
你是「主腦」綜合者。你的工作是將多個AI回覆合併成一個最優答案。

# 用戶的原始目標
{{goal}}

# 從屬回覆
{{responses}}

# 綜合方法論（4步）

## 第1步：提取（EXTRACT）
- 列出每個回覆的關鍵點
- 記錄只有一個模型提供的獨特見解
- 識別重疊的結論（共識）

## 第2步：驗證（VALIDATE）
- 交叉核查多個來源提到的事實
- 標記回覆之間的矛盾
- 評估置信度：高（3+模型同意）/ 中（2個同意）/ 低（僅1個）

## 第3步：解決衝突（RESOLVE）
當模型意見不一致時：
- 優先選擇有具體證據/數據的回覆而非觀點
- 考慮每個模型的專業領域
- 如無法解決，同時呈現兩種觀點及其優缺點

## 第4步：綜合（SYNTHESIZE）
創建統一答案：
- 直接回應用戶的原始目標
- 結合所有回覆的最佳元素
- 消除冗餘和矛盾
- 保持邏輯流暢和連貫

# 輸出格式
按以下結構回覆：

### 📋 執行摘要
[2-3句話概述綜合答案]

### 🔍 關鍵發現
[帶置信度的主要結論要點]

### ⚠️ 重要注意事項
[風險、警告或值得注意的少數意見]

### ✅ 建議行動/答案
[滿足用戶目標的清晰可執行結論]

# 語言
使用與用戶原始目標相同的語言回覆。`,
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: '主腦協調 {{count}} 個輔助Bot',
        goalLabel: '請輸入你的目標',
        goalPlaceholder: '例：請分析這些資料、萃取洞察並制定執行計畫……',
        tip: '提示：目標越清晰，結果越精準。',
        startButton: '開始Brain Flow',
        errorNoMainBrain: '請先指定一個主腦。',
        errorNoSlaves: '需要至少一個其他模型才能運行Brain Flow。',
        errorNotSupported: '選中的主腦（{modelName}）不支援Brain Flow。（如Vibe Coding工具）',
        warningExcludedModels: '部分模型因不支援Brain Flow而被排除。',
        excludedMessage: '以下模型將從Brain Flow中排除: {{models}}',
        previewButton: '預覽並調整主提示詞',
        previewShow: '展開',
        previewHide: '收起',
        previewTitle: '主腦提示詞預覽',
        previewFilledLabel: '以當前目標的預覽',
        warningKeepBlocks: '請保留 [SLAVE:…]、{{slaves}}、{{goal}} 不變。',
        persistNote: '已儲存。後續 Brain Flow 也會使用這個提示詞。',
        previewGoalPlaceholder: '告訴我你想達成的目標...',
        synthesisPreviewButton: '預覽並調整彙總提示詞',
        synthesisPreviewTitle: '彙總提示詞預覽',
        synthesisPreviewFilledLabel: '以示例回應的預覽',
        synthesisWarningKeepBlocks: '請保留 {{goal}} 和 {{responses}} 不變。',
    },

    // === BYOK ===
    byok: {
        title: 'BYOK設定',
        subtitle: '使用自己的API金鑰存取AI模型',
        systemActive: '系統活躍',
        systemDisabled: '系統停用',
        refreshAll: '全部重新整理',
        refreshing: '重新整理中...',
        saveChanges: '儲存變更',
        saving: '儲存中...',
        providerName: '提供商',
        modelsCount: '{{count}}個模型',
        getApiKey: '取得API金鑰',
        documentation: '文件',
        apiCredentials: 'API憑證',
        validate: '驗證',
        validating: '驗證中...',
        valid: '有效',
        invalid: '無效',
        modelSelection: '模型選擇',
        available: '可用',
        searchModels: '搜尋模型...',
        sortBy: '排序',
        sortPopular: '按熱門',
        sortLatest: '按最新',
        allModels: '全部模型',
        reasoning: '推理',
        coding: '編程',
        vision: '視覺',
        realtime: '即時',
        contextWindow: '上下文視窗',
        pricing: '價格',
        pricingVaries: '價格變動',
        noModelsFound: '未找到符合條件的模型。',
        refreshSuccess: '模型清單已成功重新整理。',
        refreshError: '重新整理模型清單失敗。',
        validationSuccess: 'API金鑰有效。',
        validationError: 'API金鑰驗證失敗。',
        saveSuccess: '設定已儲存。',
        validation: {
            title: '需要API金鑰驗證',
            unverifiedProvidersMessage: '以下提供商尚未驗證:',
            autoVerifyPrompt: '是否立即自動驗證?',
            cancelNote: '(取消將不儲存並返回)',
            unavailableTitle: '無法儲存',
            unavailableMessage: '以下提供商的API金鑰或模型不可用:',
            modelLabel: '模型',
            reasonLabel: '原因',
            reasonInvalidKey: 'API金鑰無效或無法存取模型。',
            solutionsTitle: '解決方法:',
            solution1: '1. 重新檢查您的API金鑰',
            solution2: '2. 嘗試選擇其他模型',
            solution3: '3. 在提供商網站驗證權限',
            uncertainTitle: '警告: 驗證不確定',
            uncertainMessage: '部分提供商無法驗證:',
            uncertainReason: '驗證不確定 (網路錯誤或速率限制)',
            proceedQuestion: '仍要儲存嗎?',
            recommendation: '建議: 按「取消」並使用「驗證」按鈕重試。',
        },
        cacheAge: '{{minutes}}分鐘前更新',
        cached: '已快取',
        studioTitle: 'BYOK Studio',
        studioSubtitle: '配置您的AI基礎設施',
        openRouterNote: '※模型資訊基於OpenRouter。實際可用性可能因提供商金鑰而異。',
        aiProviders: 'AI提供商',
        selectProvider: '選擇要配置的提供商',
        allSystemsOperational: '所有系統運作正常',
        lastUpdated: '最後更新: {{time}}',
        notYetRefreshed: '尚未重新整理',
        refreshModels: '重新整理模型',
        variants: {
            default: '預設配置',
            free: '免費版（$0，有速率限制）',
            extended: '擴展上下文視窗',
            thinking: '擴展推理（Chain-of-Thought）',
            online: '即時網路搜尋（Exa.ai）',
            nitro: '最快提供商優先',
            floor: '最便宜提供商優先',
        },
        status: {
            available: '可用',
            unavailable: '不可用',
            uncertain: '已驗證（跳過模型檢查）',
            notVerified: '未驗證',
            checking: '檢查中...',
            verified: '已驗證',
        },
        advanced: {
            title: '進階設定',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: '頻率懲罰',
            presencePenalty: '存在懲罰',
            seed: '隨機種子',
            random: '隨機',
            responseFormat: '回應格式',
            text: '文字',
            jsonObject: 'JSON物件',
        },
        modelCard: {
            settings: '設定',
            customSettings: '自訂設定',
            ctx: 'ctx',
            free: '免費',
        },
        tooltips: {
            modelAvailable: '✅ 模型可用於此API金鑰',
            modelUnavailable: '❌ 模型不可用（請檢查API金鑰或模型存取權限）',
            modelUncertain: 'API金鑰有效，但無法確認具體模型可用性。可能可用。',
            clickToVerify: '點擊驗證模型可用性',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: '暫無訊息',
        startConversation: '開始與此BYOK模型對話',
        attachImage: '附加圖片',
        imageTooLarge: '圖片「{{name}}」太大（最大20MB）',
        sending: '傳送中...',
        receiving: '接收中...',
        imagesSelected: '已選擇{{count}}張圖片',
        pressEnterToSend: '按Enter傳送',
        sendMessage: '向此模型傳送訊息...',
        attachedImage: '附加圖片',
        preview: '預覽 {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: '規劃階段',
        phase2Title: '執行階段',
        phase3Title: '整合階段',
        waiting: '等待中',
        done: '完成',
        processing: '處理中...',
        skipWaiting: '跳過等待',
    },

    // === History Popover ===
    historyPopover: {
        title: '歷史',
        modelHistory: '模型歷史',
        newChat: '新對話',
        searchPlaceholder: '搜尋對話...',
        loading: '載入中...',
        noConversations: '未找到對話',
        startNewChat: '開始新對話後將在此顯示',
        untitledConversation: '無標題對話',
        noPreview: '無預覽',
        deleteConversation: '刪除對話',
        conversationsStored: '已儲存{{count}}個對話',
        daysAgo: '{{days}}天前',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: '模型設定',
        useDefaultSettings: '使用預設設定',
        applyGlobalSettings: '套用全域BYOK設定',
        unsaved: '未儲存',
        resetToDefaults: '重設為預設',
        modelVariant: '模型變體',
        enableThinking: '啟用思考',
        noCustomSettings: '此模型沒有自訂設定。',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'API金鑰設定',
        byokDescription: '直接使用OpenAI、Claude、Gemini',
        openSettings: '開啟設定',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 要新增 {{name}} 模型嗎？\n\n開始新對話，\n向 {{name}} 諮詢或請求幫助。',
        deleteModel: '❌ 要刪除「{{name}}」模型嗎？',
        newChat: '💬 要開始新對話嗎？\n\n目前對話將自動儲存，\n可隨時從歷史記錄恢復。',
        apiKeyNotSet: 'API金鑰未設定。請在設定→BYOK中啟用並儲存金鑰。',
        modelNotSelected: '未選擇模型。請在BYOK設定中選擇模型。',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: '思考過程',
        showProcess: '顯示思考過程',
        hideProcess: '隱藏思考過程',
        summary: '摘要',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: '對話歷史',
    },
};
