export default {
    // === 共通UI ===
    common: {
        loading: '読み込み中...',
        save: '保存',
        cancel: 'キャンセル',
        delete: '削除',
        confirm: '確認',
        close: '閉じる',
        search: '検索',
        copy: 'コピー',
        copied: 'コピーしました!',
        error: 'エラー',
        success: '成功',
        warning: '警告',
        info: '情報',
        retry: '再試行',
        back: '戻る',
        next: '次へ',
        finish: '完了',
        ok: 'OK',
        yes: 'はい',
        no: 'いいえ',
        confirmDelete: 'この会話を削除してもよろしいですか？',
        deleteConfirm: '削除してもよろしいですか？',
    },

    // === サイドバー ===
    sidebar: {
        chats: 'チャット',
        history: '履歴',
        models: 'モデル',
        prompts: 'プロンプト',
        settings: '設定',
        noActiveChats: '新しい会話を始めましょう。',
        createNewChat: '新しいチャットを作成',
        activeSessions: 'アクティブセッション',
        availableModels: '利用可能なモデル',
        maxInstancesHint: 'モデルごとに最大3つ',
        proUser: 'Pro ユーザー',
        versionLabel: 'ModelDock V1',
        byokModels: 'BYOKモデル',
        standardModels: '標準モデル',
        conversationHistory: '会話履歴',
        today: '今日',
        yesterday: '昨日',
        previous7Days: '過去7日間',
        older: 'それ以前',
        noHistory: '会話履歴がありません',
        brainFlow: 'Brain Flow',
        autoRouting: '自動ルーティング',
        manual: '手動',
        link: 'リンク',
    },

    // === モデルグリッド ===
    modelGrid: {
        allInMainBrain: 'アクティブなモデルがありません。サイドバーからモデルを選択して追加してください。',
        noModels: '利用可能なモデルがありません',
    },

    // === チャット入力 ===
    chatInput: {
        manualMode: '手動',
        autoMode: '自動',
        placeholder: 'AIモデルに質問を入力...',
        send: '送信',
        copyToClipboard: 'クリップボードにコピー',
        dispatchToAll: 'すべてのモデルに送信',
        consentTitle: '⚡️ 自動ルーティング同意（リスク開示）',
        consentMessage: 'ModelDockはブラウザ内でアクティブなモデルに自動的にメッセージを送信します。⚠️ 注意：一部のAIサービス（ChatGPT、Claude等）は自動化されたアクセスを利用規約違反とみなす可能性があり、アカウントの警告、一時的なブロック、または永久停止につながる可能性があります。この機能の使用に伴うすべての責任はユーザーにあります。',
        iUnderstand: '理解しました',
        sentSuccess: '送信完了!',
        errorNoTargets: '有効なターゲットが見つかりません',
        errorSystemError: 'システムエラー',
    },

    // === プロンプトライブラリ ===
    promptLibrary: {
        title: 'プロンプトライブラリ',
        outputLanguage: '出力言語',
        searchPlaceholder: 'プロンプトを検索（タイトル、説明、内容）...',
        promptsCount_one: '{{count}}個のプロンプト',
        promptsCount_other: '{{count}}個のプロンプト',
        allCategories: 'すべて表示',
        addPrompt: 'プロンプトを追加',
        backToList: 'リストに戻る',
        createNewPrompt: '新しいプロンプトを作成',
        tips: {
            title: '作成のヒント',
            content: 'LLMは英語の指示をより正確に理解します。プロンプト本文は英語で書き、UIラベルは母国語を使用することをお勧めします。',
        },
        form: {
            titleLabel: 'タイトル（日本語推奨）',
            titlePlaceholder: '例: エキスパートコードリファクタリング',
            categoryLabel: 'カテゴリ',
            descriptionLabel: '説明（オプション）',
            descriptionPlaceholder: 'このプロンプトの目的を簡単に説明してください。',
            contentLabel: 'プロンプト内容（英語推奨）',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ 日本語応答リクエストを追加',
            saveButton: '保存',
            cancelButton: 'キャンセル',
        },
        systemBadge: 'System',
        optimizedPrompt: 'Optimized English Prompt',
        responseLanguage: 'Japanese Response',
        deleteConfirm: 'このプロンプトを削除してもよろしいですか？',
        noResults: '検索結果が見つかりません。',
        copyOriginal: '英語原文をコピー',
    },

    // === 設定モーダル ===
    settings: {
        title: '設定',
        appearance: '外観',
        theme: 'テーマ',
        themeLight: 'ライト',
        themeDark: 'ダーク',
        themeAuto: '自動',
        storage: 'ストレージ',
        clearLocalData: 'ローカルデータを削除',
        clearDataDescription: 'すべての設定と保存されたデータをリセット',
        clearButton: 'データを削除',
        about: '情報',
        version: 'バージョン',
        documentation: 'ドキュメント',
        viewDocs: 'ドキュメントを見る',
        privacy: 'プライバシー',
        privacyNote: 'すべてのデータはブラウザにローカルに保存されます。',
        language: '言語',
    },

    // === Perplexity ===
    perplexity: {
        error: {
            404: 'リソースが見つかりません。1日の検索クォータを超過したか、APIエンドポイントが変更された可能性があります。',
            403: 'アクセスが拒否されました。ログイン状態を確認するか、perplexity.aiでセキュリティチェックを通過してください。',
            429: 'リクエストが多すぎます。利用制限を超えました。しばらくしてから再試行してください。',
            500: 'サーバーエラーです。Perplexityサーバーで問題が発生しました。しばらくしてから再試行してください。',
            quotaExceeded: '{{tier}}ティアのDeep Researchクォータを超過しました。クイック検索に切り替えるか、プランをアップグレードしてください。',
            generic: 'エラーが発生しました: {{message}}',
        },
        tier: {
            free: '無料',
            pro: 'プロ',
        },
        login: {
            required: 'ログインが必要',
            message: 'Deep Researchやファイル添付などの高度な機能を使用するには、Perplexityにログインしてください。',
            actionButton: 'Perplexityを開いてログイン',
            featureLimited: 'ログインしないと一部の機能が制限されます',
            tabOpened: 'Perplexityログインタブを開きました。認証を完了してください。',
            alreadyLoggedIn: 'すでにPerplexityにログインしています',
        },
        quota: {
            left: '残り',
            selectTier: 'サブスクリプションティアを選択',
            freePlan: '無料プラン',
            proPlan: 'プロプラン',
        },
        chat: {
            placeholder: '何でも聞いてください...',
            deepResearchPlaceholder: 'Deep Research質問を入力してください...',
            emptyTitle: '知識が始まる場所',
            emptyDescription: '何でも聞いてください。Perplexityがインターネットを検索して引用付きの回答を提供します。',
            thinking: 'Perplexityが考えています...',
            proSearch: 'プロ検索',
            quickSearch: 'クイック検索',
            proSearchInfo: 'プロ検索は高度なモデルを使用します。残り{{remaining}}件のクエリ。',
            quickSearchInfo: 'クイック検索は無制限で高速です。',
            attachment: '添付ファイル',
        },
    },

    // === 通知 ===
    notifications: {
        loginRequired: 'ログインが必要',
        loginToPerplexity: '続行するにはPerplexityにログインしてください',
        featureRestricted: 'この機能は制限されています',
        networkError: 'ネットワークエラー。接続を確認してください。',
        unknownError: '不明なエラーが発生しました',
    },

    // === モデルカテゴリ（プロンプトライブラリ用） ===
    categories: {
        general: '一般',
        coding: 'コーディング',
        writing: 'ライティング',
        analysis: '分析',
        creative: 'クリエイティブ',
        business: 'ビジネス',
        academic: '学術',
    },

    // === モデルカード ===
    modelCard: {
        refresh: '更新',
        openInNewTab: '新しいタブで開く',
        removeMainBrain: 'メインブレインを解除',
        setAsMainBrain: 'メインブレインに設定',
        syncing: 'セッション同期中...',
        synced: '同期完了!',
        syncFailed: '同期失敗',
        syncSession: 'セッション同期',
        mainBrain: 'メインブレイン',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# 役割
あなたは「メインブレイン」 - スレーブAIモデルに専門的なサブタスクを配分するタスクオーケストレーターです。
ユーザーの質問に直接答えるのではありません。あなたの唯一の仕事は、各スレーブに最適なプロンプトを作成することです。

# スレーブモデル一覧
{{slaves}}

# ユーザーの目標
{{goal}}

# 必須ルール（MUST）
1. 上記リストのすべてのスレーブに対して、正確に1つの[SLAVE:id]ブロックを作成 - 例外なし
2. スレーブは並列実行され、互いの出力を見ることができない
3. [SLAVE:...][/SLAVE]ブロック外にテキストを含めない
4. リストの正確なスレーブIDを使用（例：[SLAVE:gemini-1]、[SLAVE:grok-2]）

# 出力形式
[SLAVE:model-id]
このスレーブへの具体的なタスクプロンプト...
[/SLAVE]

# プロンプト設計戦略
各スレーブに目標に応じた異なる役割を割り当てる：
- アナリスト：データ分析、パターン認識、統計
- クリティック：リスク評価、反論、エッジケース
- クリエイター：解決策、アイデア、実行計画
- バリデーター：事実確認、出典検証、論理レビュー
- シンセサイザー：要約、重要な洞察、アクション項目

# スレーブプロンプトテンプレート
各プロンプトには以下を含める：
1. 役割：「あなたは[特定の専門家の役割]です...」
2. タスク：具体的な動詞を使った明確で実行可能な指示
3. フォーカス：分析する具体的な側面（他のスレーブとの重複を避ける）
4. 形式：希望する出力構造（箇条書き、番号リスト、セクション）
5. 言語：ユーザーの目標と同じ言語で回答

# アンチパターン（DO NOT）
❌ 複数のスレーブに同じ質問をする
❌ スレーブ間の依存関係を作る（例：「モデルAの出力に基づいて...」）
❌ ブロック外にメタコメントや説明を書く
❌ リストからスレーブを省略する
❌ 汎用的なプロンプト - 各スレーブの強みに特化させる`,
        phase3: `# 役割
あなたは「メインブレイン」シンセサイザーです。複数のAI回答を1つの最適な回答にまとめることがあなたの仕事です。

# ユーザーの元の目標
{{goal}}

# スレーブの回答
{{responses}}

# 統合方法論（4ステップ）

## ステップ1：抽出（EXTRACT）
- 各回答からキーポイントをリスト化
- 1つのモデルだけが提供したユニークな洞察を記録
- 重複する結論（合意点）を特定

## ステップ2：検証（VALIDATE）
- 複数のソースが言及した事実をクロスチェック
- 回答間の矛盾をフラグ付け
- 信頼度評価：高（3+モデルが同意）/ 中（2が同意）/ 低（1のみ）

## ステップ3：競合解決（RESOLVE）
モデルが異なる意見の場合：
- 意見より具体的な証拠/データを持つ回答を優先
- 各モデルの専門領域を考慮
- 解決不能な場合、両方の見解を長所/短所と共に提示

## ステップ4：統合（SYNTHESIZE）
統一された回答を作成：
- ユーザーの元の目標に直接対応
- すべての回答の最良の要素を組み合わせる
- 冗長性と矛盾を排除
- 論理的な流れと一貫性を維持

# 出力形式
以下の構造で回答：

### 📋 エグゼクティブサマリー
[統合された回答の2-3文の概要]

### 🔍 主要な発見
[信頼度レベル付きの主要結論の箇条書き]

### ⚠️ 重要な考慮事項
[リスク、注意点、または注目すべき少数意見]

### ✅ 推奨アクション / 回答
[ユーザーの目標を達成する明確で実行可能な結論]

# 言語
ユーザーの元の目標と同じ言語で回答してください。`,
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'メインブレインが {{count}} 件のスレーブボットを指揮します',
        goalLabel: 'あなたの目的を入力してください',
        goalPlaceholder: '例: このデータを分析して、インサイトを出し、実行計画を立てて…',
        tip: 'ヒント: 具体的な目標を入力するほど、より良い結果が得られます。',
        startButton: 'Brain Flowを開始',
        errorNoMainBrain: 'まずメインブレインを指定してください。',
        errorNoSlaves: 'Brain Flowを実行するには、少なくとも1つの他のモデルがアクティブである必要があります。',
        errorNotSupported: '選択されたメインブレイン（{modelName}）はBrain Flowをサポートしていません。（Vibe Codingツールなど）',
        warningExcludedModels: '一部のモデルはBrain Flowをサポートしていないため除外されました。',
        excludedMessage: '以下のモデルはBrain Flowから除外されます: {{models}}',
        previewButton: 'メインプロンプトをプレビュー・調整',
        previewShow: '開く',
        previewHide: '閉じる',
        previewTitle: 'メインブレインプロンプトのプレビュー',
        previewFilledLabel: '現在の目的でのプレビュー',
        warningKeepBlocks: '[SLAVE:…] ブロックと {{slaves}}, {{goal}} はそのまま残してください。',
        persistNote: '保存しました。今後のBrain Flowでもこのプロンプトを使用します。',
        previewGoalPlaceholder: '達成したい目標を教えてください...',
        synthesisPreviewButton: '統合プロンプトをプレビュー・調整',
        synthesisPreviewTitle: '統合プロンプトのプレビュー',
        synthesisPreviewFilledLabel: 'サンプル応答でのプレビュー',
        synthesisWarningKeepBlocks: '{{goal}} と {{responses}} はそのままにしてください。',
    },

    // === BYOK ===
    byok: {
        title: 'BYOK設定',
        subtitle: '自分のAPIキーでAIモデルを使用',
        systemActive: 'システムアクティブ',
        systemDisabled: 'システム無効',
        refreshAll: 'すべて更新',
        refreshing: '更新中...',
        saveChanges: '変更を保存',
        saving: '保存中...',
        providerName: 'プロバイダー',
        modelsCount: '{{count}}モデル',
        getApiKey: 'APIキーを取得',
        documentation: 'ドキュメント',
        apiCredentials: 'API認証情報',
        validate: '検証',
        validating: '検証中...',
        valid: '有効',
        invalid: '無効',
        modelSelection: 'モデル選択',
        available: '利用可能',
        searchModels: 'モデルを検索...',
        sortBy: '並び替え',
        sortPopular: '人気順',
        sortLatest: '最新順',
        allModels: 'すべてのモデル',
        reasoning: '推論',
        coding: 'コーディング',
        vision: 'ビジョン',
        realtime: 'リアルタイム',
        contextWindow: 'コンテキストウィンドウ',
        pricing: '価格',
        pricingVaries: '価格変動あり',
        noModelsFound: '条件に一致するモデルが見つかりません。',
        refreshSuccess: 'モデルリストが正常に更新されました。',
        refreshError: 'モデルリストの更新に失敗しました。',
        validationSuccess: 'APIキーは有効です。',
        validationError: 'APIキーの検証に失敗しました。',
        saveSuccess: '設定が保存されました。',
        validation: {
            title: 'APIキー検証が必要',
            unverifiedProvidersMessage: '次のプロバイダーは検証されていません:',
            autoVerifyPrompt: '今すぐ自動的に検証しますか？',
            cancelNote: '(キャンセルすると保存せずに戻ります)',
            unavailableTitle: '保存できません',
            unavailableMessage: '次のプロバイダーのAPIキーまたはモデルが利用できません:',
            modelLabel: 'モデル',
            reasonLabel: '理由',
            reasonInvalidKey: 'APIキーが無効か、モデルにアクセスできません。',
            solutionsTitle: '解決方法:',
            solution1: '1. APIキーを再確認してください',
            solution2: '2. 別のモデルを選択してみてください',
            solution3: '3. プロバイダーのウェブサイトで権限を確認してください',
            uncertainTitle: '警告: 検証が不確実',
            uncertainMessage: '一部のプロバイダーを検証できませんでした:',
            uncertainReason: '検証不確実（ネットワークエラーまたはレート制限）',
            proceedQuestion: 'それでも保存しますか？',
            recommendation: '推奨: "キャンセル"を押して"検証"ボタンで再試行してください。',
        },
        cacheAge: '{{minutes}}分前に更新',
        cached: 'キャッシュ済み',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'AIインフラを構成',
        openRouterNote: '※モデル情報はOpenRouter基準です。実際のプロバイダーキーでの利用可否は異なる場合があります。',
        aiProviders: 'AIプロバイダー',
        selectProvider: '設定するプロバイダーを選択',
        allSystemsOperational: 'すべてのシステムが正常に動作中',
        lastUpdated: '最終更新: {{time}}',
        notYetRefreshed: 'まだ更新されていません',
        refreshModels: 'モデルを更新',
        variants: {
            default: 'デフォルト設定',
            free: '無料版（$0、レート制限あり）',
            extended: '拡張コンテキストウィンドウ',
            thinking: '拡張推論（Chain-of-Thought）',
            online: 'リアルタイムウェブ検索（Exa.ai）',
            nitro: '最速プロバイダー優先',
            floor: '最安プロバイダー優先',
        },
        status: {
            available: '利用可能',
            unavailable: '利用不可',
            uncertain: '検証済み（モデル確認スキップ）',
            notVerified: '未検証',
            checking: '確認中...',
            verified: '検証済み',
        },
        advanced: {
            title: '詳細設定',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: '頻度ペナルティ',
            presencePenalty: '存在ペナルティ',
            seed: 'シード',
            random: 'ランダム',
            responseFormat: '応答形式',
            text: 'テキスト',
            jsonObject: 'JSONオブジェクト',
        },
        modelCard: {
            settings: '設定',
            customSettings: 'カスタム設定',
            ctx: 'ctx',
            free: '無料',
        },
        tooltips: {
            modelAvailable: '✅ APIキーでモデルが利用可能',
            modelUnavailable: '❌ モデル利用不可（APIキーまたはモデルアクセスを確認）',
            modelUncertain: 'APIキーは有効ですが、特定モデルの可用性を確認できませんでした。おそらく使用できます。',
            clickToVerify: 'モデルの可用性を確認するにはクリック',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'メッセージがありません',
        startConversation: 'このBYOKモデルとの会話を始めましょう',
        attachImage: '画像を添付',
        imageTooLarge: '画像「{{name}}」が大きすぎます（最大20MB）',
        sending: '送信中...',
        receiving: '受信中...',
        imagesSelected: '{{count}}枚の画像が選択されました',
        pressEnterToSend: 'Enterキーで送信',
        sendMessage: 'このモデルにメッセージを送信...',
        attachedImage: '添付画像',
        preview: 'プレビュー {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: '計画フェーズ',
        phase2Title: '実行フェーズ',
        phase3Title: '統合フェーズ',
        waiting: '待機中',
        done: '完了',
        processing: '処理中...',
        skipWaiting: '待機をスキップ',
    },

    // === History Popover ===
    historyPopover: {
        title: '履歴',
        modelHistory: 'モデル履歴',
        newChat: '新しいチャット',
        searchPlaceholder: '会話を検索...',
        loading: '読み込み中...',
        noConversations: '会話が見つかりません',
        startNewChat: '新しいチャットを始めるとここに表示されます',
        untitledConversation: '無題の会話',
        noPreview: 'プレビューなし',
        deleteConversation: '会話を削除',
        conversationsStored: '{{count}}件の会話が保存されています',
        daysAgo: '{{days}}日前',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'モデル設定',
        useDefaultSettings: 'デフォルト設定を使用',
        applyGlobalSettings: 'グローバルBYOK設定を適用',
        unsaved: '未保存',
        resetToDefaults: 'デフォルトにリセット',
        modelVariant: 'モデルバリアント',
        enableThinking: '思考を有効化',
        noCustomSettings: 'このモデルのカスタム設定はありません。',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'APIキー設定',
        byokDescription: 'OpenAI、Claude、Geminiを直接使用',
        openSettings: '設定を開く',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 {{name}}モデルを追加しますか？\n\n新しい会話を始めて、\n{{name}}に相談や依頼をしましょう。',
        deleteModel: '❌「{{name}}」モデルを削除しますか？',
        newChat: '💬 新しい会話を始めますか？\n\n現在の会話は自動的に保存され、\n履歴からいつでも復元できます。',
        apiKeyNotSet: 'APIキーが設定されていません。設定→BYOKでキーを有効にして保存してください。',
        modelNotSelected: 'モデルが選択されていません。BYOK設定でモデルを選択してください。',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: '思考プロセス',
        showProcess: '思考プロセスを表示',
        hideProcess: '思考プロセスを非表示',
        summary: '要約',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: '会話履歴',
    },
};
