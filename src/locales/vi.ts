export default {
    common: {
        loading: 'Đang tải...',
        save: 'Lưu',
        cancel: 'Hủy',
        delete: 'Xóa',
        confirm: 'Xác nhận',
        close: 'Đóng',
        search: 'Tìm kiếm',
        copy: 'Sao chép',
        copied: 'Đã sao chép!',
        error: 'Lỗi',
        success: 'Thành công',
        warning: 'Cảnh báo',
        info: 'Thông tin',
        retry: 'Thử lại',
        back: 'Quay lại',
        next: 'Tiếp theo',
        finish: 'Hoàn tất',
        ok: 'OK',
        yes: 'Có',
        no: 'Không',
    },
    sidebar: {
        chats: 'Trò chuyện',
        models: 'Mô hình',
        settings: 'Cài đặt',
        noActiveChats: 'Không có cuộc trò chuyện nào.',
        createNewChat: 'Tạo cuộc trò chuyện mới',
        availableModels: 'Mô hình khả dụng',
        maxInstancesHint: 'Tối đa 3 / mô hình',
        proUser: 'Người dùng Pro',
        versionLabel: 'ModelDock V1',
    },
    modelGrid: {
        allInMainBrain: 'Tất cả các mô hình đang hoạt động đều ở chế độ xem chính',
        noModels: 'Không có mô hình nào khả dụng',
    },
    chatInput: {
        manualMode: 'Thủ công',
        autoMode: 'Tự động',
        placeholder: 'Nhập tin nhắn của bạn...',
        send: 'Gửi',
        copyToClipboard: 'Sao chép vào bảng nhớ tạm',
        dispatchToAll: 'Gửi đến tất cả mô hình',
        consentTitle: '⚡️ Đồng ý định tuyến tự động (Cảnh báo rủi ro)',
        consentMessage: 'ModelDock sẽ tự động gửi tin nhắn của bạn đến các mô hình đang hoạt động trong trình duyệt của bạn. ⚠️ Cảnh báo: Một số dịch vụ AI (ChatGPT, Claude, v.v.) có thể coi truy cập tự động là vi phạm Điều khoản Dịch vụ, có thể dẫn đến cảnh báo tài khoản, chặn tạm thời hoặc tạm ngưng vĩnh viễn. Bạn chịu hoàn toàn trách nhiệm về việc sử dụng tính năng này.',
        iUnderstand: 'Tôi hiểu',
        sentSuccess: 'Đã gửi!',
        errorNoTargets: 'Không tìm thấy mục tiêu hợp lệ',
        errorSystemError: 'Lỗi hệ thống',
    },
    promptLibrary: {
        title: 'Thư viện Prompt',
        outputLanguage: 'Ngôn ngữ đầu ra',
        searchPlaceholder: 'Tìm kiếm prompt (tiêu đề, mô tả, nội dung)...',
        promptsCount_one: '{{count}} prompt',
        promptsCount_other: '{{count}} prompts',
        allCategories: 'Xem tất cả',
        addPrompt: 'Thêm Prompt',
        backToList: 'Quay lại danh sách',
        createNewPrompt: 'Tạo Prompt mới',
        tips: {
            title: 'Mẹo viết',
            content: 'LLM hiểu hướng dẫn tiếng Anh chính xác hơn. Viết nội dung prompt bằng tiếng Anh và sử dụng ngôn ngữ mẹ đẻ của bạn cho tiêu đề.',
        },
        form: {
            titleLabel: 'Tiêu đề (ngôn ngữ của bạn)',
            titlePlaceholder: 'vd: Tái cấu trúc mã chuyên gia',
            categoryLabel: 'Danh mục',
            descriptionLabel: 'Mô tả (tùy chọn)',
            descriptionPlaceholder: 'Mô tả ngắn gọn mục đích của prompt này.',
            contentLabel: 'Nội dung Prompt (khuyên dùng tiếng Anh)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Thêm yêu cầu trả lời bằng tiếng Việt',
            saveButton: 'Lưu',
            cancelButton: 'Hủy',
        },
        systemBadge: 'Hệ thống',
        optimizedPrompt: 'Prompt tiếng Anh được tối ưu hóa',
        responseLanguage: 'Trả lời bằng tiếng Việt',
        deleteConfirm: 'Bạn có chắc chắn muốn xóa prompt này không?',
        noResults: 'Không tìm thấy kết quả.',
        copyOriginal: 'Sao chép bản gốc',
    },
    settings: {
        title: 'Cài đặt',
        appearance: 'Giao diện',
        theme: 'Chủ đề',
        themeLight: 'Sáng',
        themeDark: 'Tối',
        themeAuto: 'Tự động',
        storage: 'Lưu trữ',
        clearLocalData: 'Xóa dữ liệu cục bộ',
        clearDataDescription: 'Đặt lại tất cả cài đặt và dữ liệu đã lưu',
        clearButton: 'Xóa dữ liệu',
        about: 'Giới thiệu',
        version: 'Phiên bản',
        documentation: 'Tài liệu',
        viewDocs: 'Xem tài liệu',
        privacy: 'Quyền riêng tư',
        privacyNote: 'Tất cả dữ liệu được lưu trữ cục bộ trong trình duyệt của bạn.',
        language: 'Ngôn ngữ',
    },
    perplexity: {
        error: {
            404: 'Không tìm thấy tài nguyên. Hạn ngạch tìm kiếm hàng ngày có thể đã vượt quá hoặc điểm cuối API đã thay đổi.',
            403: 'Truy cập bị từ chối. Vui lòng kiểm tra trạng thái đăng nhập của bạn hoặc vượt qua kiểm tra bảo mật trên perplexity.ai.',
            429: 'Quá nhiều yêu cầu. Bạn đã vượt quá giới hạn. Vui lòng thử lại sau.',
            500: 'Lỗi máy chủ. Perplexity đang gặp sự cố. Vui lòng thử lại sau.',
            quotaExceeded: 'Hạn ngạch Deep Research đã vượt quá cho cấp {{tier}}. Chuyển sang Tìm kiếm nhanh hoặc nâng cấp gói của bạn.',
            generic: 'Đã xảy ra lỗi: {{message}}',
        },
        tier: {
            free: 'Miễn phí',
            pro: 'Pro',
        },
        login: {
            required: 'Yêu cầu đăng nhập',
            message: 'Vui lòng đăng nhập vào Perplexity để sử dụng các tính năng nâng cao như Deep Research và tệp đính kèm.',
            actionButton: 'Mở Perplexity & Đăng nhập',
            featureLimited: 'Một số tính năng bị hạn chế nếu không đăng nhập',
            tabOpened: 'Tab đăng nhập Perplexity đã mở. Vui lòng hoàn tất xác thực.',
            alreadyLoggedIn: 'Đã đăng nhập vào Perplexity',
        },
        quota: {
            left: 'còn lại',
            selectTier: 'Chọn cấp độ đăng ký',
            freePlan: 'Gói Miễn phí',
            proPlan: 'Gói Pro',
        },
        chat: {
            placeholder: 'Hỏi bất cứ điều gì...',
            deepResearchPlaceholder: 'Đặt câu hỏi nghiên cứu sâu...',
            emptyTitle: 'Nơi kiến thức bắt đầu',
            emptyDescription: 'Hỏi bất cứ điều gì. Perplexity tìm kiếm trên internet để cung cấp cho bạn câu trả lời có trích dẫn.',
            thinking: 'Perplexity đang suy nghĩ...',
            proSearch: 'Tìm kiếm Pro',
            quickSearch: 'Tìm kiếm Nhanh',
            proSearchInfo: 'Tìm kiếm Pro sử dụng các mô hình nâng cao. Còn lại {{remaining}} truy vấn.',
            quickSearchInfo: 'Tìm kiếm Nhanh không giới hạn và nhanh chóng.',
            attachment: 'Tệp đính kèm',
        },
    },
    notifications: {
        loginRequired: 'Yêu cầu đăng nhập',
        loginToPerplexity: 'Vui lòng đăng nhập vào Perplexity để tiếp tục',
        featureRestricted: 'Tính năng này bị hạn chế',
        networkError: 'Lỗi mạng. Vui lòng kiểm tra kết nối của bạn.',
        unknownError: 'Đã xảy ra lỗi không xác định',
    },
    categories: {
        general: 'Chung',
        coding: 'Lập trình',
        writing: 'Viết lách',
        analysis: 'Phân tích',
        creative: 'Sáng tạo',
        business: 'Kinh doanh',
        academic: 'Học thuật',
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'Main Brain nhẹ nhàng điều phối {{count}} bot hỗ trợ',
        goalLabel: 'Nhập mục tiêu của bạn',
        goalPlaceholder: 'vd: Phân tích dữ liệu này, rút insight và lập kế hoạch hành động...',
        tip: 'Mẹo: mục tiêu càng rõ, kết quả càng mềm mại và hữu ích.',
        previewButton: 'Xem trước & chỉnh nhẹ prompt chính',
        previewShow: 'mở',
        previewHide: 'đóng',
        previewTitle: 'Xem trước prompt Main Brain (mục tiêu/bot được điền tự động)',
        previewFilledLabel: 'Xem trước với mục tiêu hiện tại',
        warningKeepBlocks: 'Giữ nguyên [SLAVE:…], {{slaves}}, {{goal}} — chỉ chỉnh lời văn xung quanh thật nhẹ.',
        persistNote: 'Đã lưu. Chúng tôi sẽ dùng prompt đã chỉnh này cho các lần Brain Flow tiếp theo.',
        previewGoalPlaceholder: 'Hãy nói điều bạn muốn đạt được, tôi sẽ dẫn dắt cả đội…',
        synthesisPreviewButton: 'Xem trước & chỉnh nhẹ prompt tổng hợp',
        synthesisPreviewTitle: 'Xem trước prompt tổng hợp (mục tiêu/phản hồi được điền tự động)',
        synthesisPreviewFilledLabel: 'Xem trước với phản hồi mẫu',
        synthesisWarningKeepBlocks: 'Giữ nguyên {{goal}} và {{responses}} — prompt này điều khiển bước tổng hợp cuối.',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# VAI TRÒ
Bạn là "Bộ não chính" - người điều phối phân bổ các nhiệm vụ chuyên biệt cho các mô hình AI cấp dưới.
Bạn KHÔNG trực tiếp trả lời câu hỏi của người dùng. Nhiệm vụ DUY NHẤT của bạn là tạo prompt tối ưu cho từng cấp dưới.

# CÁC MÔ HÌNH CẤP DƯỚI
{{slaves}}

# MỤC TIÊU CỦA NGƯỜI DÙNG
{{goal}}

# QUY TẮC BẮT BUỘC (KHÔNG ĐƯỢC VI PHẠM)
1. Tạo MỘT khối [SLAVE:id] cho MỖI cấp dưới trong danh sách - không có ngoại lệ
2. Các cấp dưới hoạt động ĐỒNG THỜI và KHÔNG THỂ thấy kết quả của nhau
3. KHÔNG BAO GIỜ viết bất kỳ văn bản nào bên ngoài các khối [SLAVE:...][/SLAVE]
4. Sử dụng CHÍNH XÁC các ID cấp dưới được cung cấp (ví dụ: [SLAVE:gemini-1], [SLAVE:grok-2])

# ĐỊNH DẠNG ĐẦU RA
[SLAVE:model-id]
Prompt nhiệm vụ cụ thể của bạn ở đây...
[/SLAVE]

# CHIẾN LƯỢC THIẾT KẾ PROMPT
Với mỗi cấp dưới, gán một vai trò KHÁC NHAU dựa trên mục tiêu:
- Nhà phân tích: Phân tích dữ liệu, nhận dạng mẫu, thống kê
- Nhà phê bình: Đánh giá rủi ro, phản biện, các trường hợp đặc biệt
- Nhà sáng tạo: Giải pháp, ý tưởng, kế hoạch triển khai
- Người xác minh: Kiểm tra sự thật, xác nhận nguồn, đánh giá logic
- Nhà tổng hợp: Tóm tắt, thông tin quan trọng, danh sách hành động

# MẪU PROMPT CHO CẤP DƯỚI
Mỗi prompt nên bao gồm:
1. VAI TRÒ: "Bạn là [vai trò chuyên gia cụ thể]..."
2. NHIỆM VỤ: Hướng dẫn rõ ràng, thực thi được với động từ cụ thể
3. TRỌNG TÂM: Khía cạnh nào cần phân tích (tránh trùng lặp với cấp dưới khác)
4. ĐỊNH DẠNG: Cấu trúc đầu ra mong muốn (gạch đầu dòng, danh sách đánh số, danh mục)
5. NGÔN NGỮ: Trả lời bằng ngôn ngữ giống với mục tiêu của người dùng

# NHỮNG ĐIỀU KHÔNG ĐƯỢC LÀM
❌ Hỏi cùng một câu hỏi cho nhiều cấp dưới
❌ Tạo phụ thuộc giữa các cấp dưới (ví dụ: "Dựa trên kết quả của model A...")
❌ Viết bình luận hoặc giải thích bên ngoài các khối
❌ Bỏ qua bất kỳ cấp dưới nào trong danh sách
❌ Sử dụng prompt chung chung - hãy cụ thể với thế mạnh của từng cấp dưới`,
        phase3: `# VAI TRÒ
Bạn là người tổng hợp "Bộ não chính". Nhiệm vụ của bạn là kết hợp nhiều phản hồi AI thành MỘT câu trả lời tốt nhất duy nhất.

# MỤC TIÊU BAN ĐẦU CỦA NGƯỜI DÙNG
{{goal}}

# CÁC PHẢN HỒI TỪ CẤP DƯỚI
{{responses}}

# PHƯƠNG PHÁP TỔNG HỢP (4 BƯỚC)

## Bước 1: TRÍCH XUẤT
- Xác định các điểm chính từ mỗi phản hồi
- Ghi nhận những hiểu biết độc đáo từ một mô hình duy nhất
- Đánh dấu những kết luận thống nhất (đồng thuận)

## Bước 2: XÁC THỰC
- Kiểm tra chéo các sự kiện được đề cập bởi nhiều nguồn
- Đánh dấu các mâu thuẫn giữa các phản hồi
- Đánh giá độ tin cậy: Cao (3+ mô hình đồng ý) / Trung bình (2 đồng ý) / Thấp (chỉ 1)

## Bước 3: GIẢI QUYẾT MÂU THUẪN
Khi các mô hình không đồng ý:
- Ưu tiên phản hồi có bằng chứng/dữ liệu cụ thể hơn ý kiến
- Xem xét chuyên môn của từng mô hình
- Nếu không thể giải quyết, trình bày cả hai quan điểm với ưu/nhược điểm

## Bước 4: TỔNG HỢP
Tạo một phản hồi thống nhất mà:
- Trả lời TRỰC TIẾP mục tiêu ban đầu của người dùng
- Tích hợp phần tốt nhất từ tất cả các phản hồi
- Loại bỏ sự trùng lặp và mâu thuẫn
- Duy trì tính mạch lạc và nhất quán

# ĐỊNH DẠNG ĐẦU RA
Cấu trúc phản hồi như sau:

### 📋 Tóm tắt điều hành
[2-3 câu tóm tắt câu trả lời tổng hợp]

### 🔍 Phát hiện chính
[Gạch đầu dòng các kết luận chính với mức độ tin cậy]

### ⚠️ Lưu ý quan trọng
[Rủi ro, cảnh báo, hoặc ý kiến thiểu số đáng chú ý]

### ✅ Hành động đề xuất / Câu trả lời
[Kết luận rõ ràng, có thể thực hiện được, đáp ứng mục tiêu của người dùng]

# NGÔN NGỮ
Trả lời bằng CÙNG ngôn ngữ với mục tiêu ban đầu của người dùng`,
    },

    modelCard: {
        refresh: 'Làm mới',
        openInNewTab: 'Mở trong tab mới',
        removeMainBrain: 'Xóa Main Brain',
        setAsMainBrain: 'Đặt làm Main Brain',
        syncing: 'Đang đồng bộ phiên...',
        synced: 'Đã đồng bộ!',
        syncFailed: 'Đồng bộ thất bại',
        syncSession: 'Đồng bộ phiên',
        mainBrain: 'Main Brain',
    },

    byok: {
        title: 'Cấu hình BYOK',
        subtitle: 'Sử dụng khóa API của riêng bạn với các mô hình AI',
        systemActive: 'Hệ thống hoạt động',
        systemDisabled: 'Hệ thống tắt',
        refreshAll: 'Làm mới tất cả',
        refreshing: 'Đang làm mới...',
        saveChanges: 'Lưu thay đổi',
        saving: 'Đang lưu...',
        providerName: 'Nhà cung cấp',
        modelsCount: '{{count}} mô hình',
        getApiKey: 'Lấy khóa API',
        documentation: 'Tài liệu',
        apiCredentials: 'Thông tin xác thực API',
        validate: 'Xác thực',
        validating: 'Đang xác thực...',
        valid: 'Hợp lệ',
        invalid: 'Không hợp lệ',
        modelSelection: 'Chọn mô hình',
        available: 'Có sẵn',
        searchModels: 'Tìm kiếm mô hình...',
        sortBy: 'Sắp xếp theo',
        sortPopular: 'Phổ biến',
        sortLatest: 'Mới nhất',
        allModels: 'Tất cả mô hình',
        reasoning: 'Suy luận',
        coding: 'Lập trình',
        vision: 'Thị giác',
        realtime: 'Thời gian thực',
        contextWindow: 'Cửa sổ ngữ cảnh',
        pricing: 'Giá cả',
        pricingVaries: 'Giá thay đổi',
        noModelsFound: 'Không tìm thấy mô hình phù hợp.',
        refreshSuccess: 'Làm mới danh sách mô hình thành công.',
        refreshError: 'Không thể làm mới danh sách mô hình.',
        validationSuccess: 'Khóa API hợp lệ.',
        validationError: 'Xác thực khóa API thất bại.',
        saveSuccess: 'Đã lưu cấu hình.',
        validation: {
            title: 'Cần xác minh khóa API',
            unverifiedProvidersMessage: 'Các nhà cung cấp sau chưa được xác minh:',
            autoVerifyPrompt: 'Bạn có muốn xác minh tự động ngay bây giờ?',
            cancelNote: '(Hủy để quay lại mà không lưu)',
            unavailableTitle: 'Không thể lưu',
            unavailableMessage: 'Khóa API hoặc mô hình của các nhà cung cấp sau không khả dụng:',
            modelLabel: 'Mô hình',
            reasonLabel: 'Lý do',
            reasonInvalidKey: 'Khóa API không hợp lệ hoặc không thể truy cập mô hình.',
            solutionsTitle: 'Giải pháp:',
            solution1: '1. Kiểm tra lại khóa API của bạn',
            solution2: '2. Thử chọn mô hình khác',
            solution3: '3. Kiểm tra quyền trên trang web của nhà cung cấp',
            uncertainTitle: 'Cảnh báo: Xác minh không chắc chắn',
            uncertainMessage: 'Một số nhà cung cấp không thể xác minh:',
            uncertainReason: 'Xác minh không chắc chắn (lỗi mạng hoặc giới hạn tốc độ)',
            proceedQuestion: 'Vẫn muốn lưu?',
            recommendation: 'Khuyến nghị: Nhấn "Hủy" và thử lại với nút "Xác minh".',
        },
        cacheAge: 'Cập nhật {{minutes}} phút trước',
        cached: 'Đã lưu cache',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Cấu hình cơ sở hạ tầng AI của bạn',
        openRouterNote: '※Thông tin mô hình dựa trên OpenRouter. Tính khả dụng thực tế có thể khác nhau tùy thuộc vào khóa của nhà cung cấp.',
        aiProviders: 'Nhà cung cấp AI',
        selectProvider: 'Chọn nhà cung cấp để cấu hình',
        allSystemsOperational: 'Tất cả hệ thống hoạt động',
        lastUpdated: 'Cập nhật lần cuối: {{time}}',
        notYetRefreshed: 'Chưa làm mới',
        refreshModels: 'Làm mới mô hình',
        variants: {
            default: 'Cấu hình mặc định',
            free: 'Phiên bản miễn phí ($0, có giới hạn)',
            extended: 'Cửa sổ ngữ cảnh mở rộng',
            thinking: 'Suy luận mở rộng (Chain-of-Thought)',
            online: 'Tìm kiếm web thời gian thực (Exa.ai)',
            nitro: 'Ưu tiên nhà cung cấp nhanh nhất',
            floor: 'Ưu tiên nhà cung cấp rẻ nhất',
        },
        status: {
            available: 'Có sẵn',
            unavailable: 'Không có sẵn',
            uncertain: 'Đã xác minh (bỏ qua kiểm tra mô hình)',
            notVerified: 'Chưa xác minh',
            checking: 'Đang kiểm tra...',
            verified: 'Đã xác minh',
        },
        advanced: {
            title: 'Cài đặt nâng cao',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Phạt tần suất',
            presencePenalty: 'Phạt hiện diện',
            seed: 'Seed',
            random: 'Ngẫu nhiên',
            responseFormat: 'Định dạng phản hồi',
            text: 'Văn bản',
            jsonObject: 'Đối tượng JSON',
        },
        modelCard: {
            settings: 'Cài đặt',
            customSettings: 'Cài đặt tùy chỉnh',
            ctx: 'ctx',
            free: 'Miễn phí',
        },
        tooltips: {
            modelAvailable: '✅ Mô hình khả dụng cho khóa API này',
            modelUnavailable: '❌ Mô hình không khả dụng (kiểm tra khóa API hoặc quyền truy cập mô hình)',
            modelUncertain: 'Khóa API hợp lệ, nhưng không thể xác nhận tính khả dụng của mô hình. Có thể hoạt động.',
            clickToVerify: 'Nhấp để xác minh tính khả dụng của mô hình',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'Không có tin nhắn',
        startConversation: 'Bắt đầu cuộc trò chuyện với mô hình BYOK này',
        attachImage: 'Đính kèm hình ảnh',
        imageTooLarge: 'Hình ảnh "{{name}}" quá lớn (tối đa 20MB)',
        sending: 'Đang gửi...',
        receiving: 'Đang nhận...',
        imagesSelected: 'Đã chọn {{count}} hình ảnh',
        pressEnterToSend: 'Nhấn Enter để gửi',
        sendMessage: 'Gửi tin nhắn đến mô hình này...',
        attachedImage: 'Hình ảnh đính kèm',
        preview: 'Xem trước {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Giai đoạn lập kế hoạch',
        phase2Title: 'Giai đoạn thực thi',
        phase3Title: 'Giai đoạn tích hợp',
        waiting: 'Đang chờ',
        done: 'Hoàn thành',
        processing: 'Đang xử lý...',
        skipWaiting: 'Bỏ qua chờ đợi',
    },

    // === History Popover ===
    historyPopover: {
        title: 'Lịch sử',
        modelHistory: 'Lịch sử mô hình',
        newChat: 'Trò chuyện mới',
        searchPlaceholder: 'Tìm kiếm cuộc trò chuyện...',
        loading: 'Đang tải...',
        noConversations: 'Không tìm thấy cuộc trò chuyện',
        startNewChat: 'Bắt đầu trò chuyện mới và nó sẽ xuất hiện ở đây',
        untitledConversation: 'Cuộc trò chuyện không có tiêu đề',
        noPreview: 'Không có xem trước',
        deleteConversation: 'Xóa cuộc trò chuyện',
        conversationsStored: '{{count}} cuộc trò chuyện đã lưu',
        daysAgo: '{{days}} ngày trước',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Cài đặt mô hình',
        useDefaultSettings: 'Sử dụng cài đặt mặc định',
        applyGlobalSettings: 'Áp dụng cài đặt BYOK toàn cục',
        unsaved: 'Chưa lưu',
        resetToDefaults: 'Đặt lại về mặc định',
        modelVariant: 'Biến thể mô hình',
        enableThinking: 'Bật thinking',
        noCustomSettings: 'Mô hình này không có cài đặt tùy chỉnh.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'Cài đặt khóa API',
        byokDescription: 'Sử dụng OpenAI, Claude, Gemini trực tiếp',
        openSettings: 'Mở cài đặt',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 Thêm mô hình {{name}}?\n\nBắt đầu cuộc trò chuyện mới và\ntham khảo hoặc yêu cầu trợ giúp từ {{name}}.',
        deleteModel: '❌ Xóa mô hình "{{name}}"?',
        newChat: '💬 Bắt đầu cuộc trò chuyện mới?\n\nCuộc trò chuyện hiện tại sẽ được lưu tự động,\nbạn có thể khôi phục từ lịch sử bất cứ lúc nào.',
        apiKeyNotSet: 'Khóa API chưa được cấu hình. Kích hoạt và lưu khóa trong Cài đặt → BYOK.',
        modelNotSelected: 'Chưa chọn mô hình. Chọn một mô hình trong cấu hình BYOK.',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: 'Quá trình suy nghĩ',
        showProcess: 'Hiển thị quá trình suy nghĩ',
        hideProcess: 'Ẩn quá trình suy nghĩ',
        summary: 'Tóm tắt',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Lịch sử cuộc trò chuyện',
    },
};
