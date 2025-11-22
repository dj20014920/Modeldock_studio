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
    },

    // === サイドバー ===
    sidebar: {
        chats: 'チャット',
        models: 'モデル',
        settings: '設定',
        noActiveChats: 'アクティブなチャットがありません。',
        createNewChat: '新しいチャットを作成',
        availableModels: '利用可能なモデル',
        maxInstancesHint: 'モデルごとに最大3つ',
        proUser: 'Pro ユーザー',
        versionLabel: 'ModelDock V1',
    },

    // === モデルグリッド ===
    modelGrid: {
        allInMainBrain: 'すべてのアクティブモデルがメインブレインビューにあります',
        noModels: '利用可能なモデルがありません',
    },

    // === チャット入力 ===
    chatInput: {
        manualMode: '手動',
        autoMode: '自動',
        placeholder: 'メッセージを入力...',
        send: '送信',
        copyToClipboard: 'クリップボードにコピー',
        dispatchToAll: 'すべてのモデルに送信',
        consentTitle: '⚡️ 自動ルーティング同意',
        consentMessage: 'ModelDockは、アクティブなモデルiframeにメッセージを自動的に挿入し、送信をシミュレートします。これは安全で、ブラウザ内でローカルに動作します。',
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
};
