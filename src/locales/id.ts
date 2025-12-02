export default {
    common: {
        loading: 'Memuat...',
        save: 'Simpan',
        cancel: 'Batal',
        delete: 'Hapus',
        confirm: 'Konfirmasi',
        close: 'Tutup',
        search: 'Cari',
        copy: 'Salin',
        copied: 'Disalin!',
        error: 'Kesalahan',
        success: 'Berhasil',
        warning: 'Peringatan',
        info: 'Info',
        retry: 'Coba lagi',
        back: 'Kembali',
        next: 'Lanjut',
        finish: 'Selesai',
        ok: 'OK',
        yes: 'Ya',
        no: 'Tidak',
    },
    sidebar: {
        chats: 'Obrolan',
        models: 'Model',
        settings: 'Pengaturan',
        noActiveChats: 'Tidak ada obrolan aktif.',
        createNewChat: 'Buat obrolan baru',
        availableModels: 'Model Tersedia',
        maxInstancesHint: 'Maks 3 / model',
        proUser: 'Pengguna Pro',
        versionLabel: 'ModelDock V1',
    },
    modelGrid: {
        allInMainBrain: 'Semua model aktif ada di tampilan utama',
        noModels: 'Tidak ada model tersedia',
    },
    chatInput: {
        manualMode: 'Manual',
        autoMode: 'Otomatis',
        placeholder: 'Ketik pesan Anda...',
        send: 'Kirim',
        copyToClipboard: 'Salin ke Papan Klip',
        dispatchToAll: 'Kirim ke Semua Model',
        consentTitle: '⚡️ Persetujuan Perutean Otomatis (Peringatan Risiko)',
        consentMessage: 'ModelDock akan secara otomatis mengirim pesan Anda ke model aktif di browser Anda. ⚠️ Peringatan: Beberapa layanan AI (ChatGPT, Claude, dll.) mungkin menganggap akses otomatis sebagai pelanggaran Ketentuan Layanan mereka, yang dapat mengakibatkan peringatan akun, pemblokiran sementara, atau penangguhan permanen. Anda menanggung semua tanggung jawab atas penggunaan fitur ini.',
        iUnderstand: 'Saya Mengerti',
        sentSuccess: 'Terkirim!',
        errorNoTargets: 'Tidak ada target valid ditemukan',
        errorSystemError: 'Kesalahan Sistem',
    },
    promptLibrary: {
        title: 'Pustaka Prompt',
        outputLanguage: 'Bahasa Keluaran',
        searchPlaceholder: 'Cari prompt (judul, deskripsi, konten)...',
        promptsCount_one: '{{count}} prompt',
        promptsCount_other: '{{count}} prompt',
        allCategories: 'Lihat Semua',
        addPrompt: 'Tambah Prompt',
        backToList: 'Kembali ke Daftar',
        createNewPrompt: 'Buat Prompt Baru',
        tips: {
            title: 'Tips Menulis',
            content: 'LLM memahami instruksi bahasa Inggris dengan lebih akurat. Tulis konten prompt dalam bahasa Inggris, dan gunakan bahasa asli Anda untuk judul.',
        },
        form: {
            titleLabel: 'Judul (dalam bahasa Anda)',
            titlePlaceholder: 'mis: Refactoring Kode Ahli',
            categoryLabel: 'Kategori',
            descriptionLabel: 'Deskripsi (opsional)',
            descriptionPlaceholder: 'Jelaskan secara singkat tujuan prompt ini.',
            contentLabel: 'Konten Prompt (disarankan bahasa Inggris)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Tambahkan permintaan respons bahasa Indonesia',
            saveButton: 'Simpan',
            cancelButton: 'Batal',
        },
        systemBadge: 'Sistem',
        optimizedPrompt: 'Prompt Bahasa Inggris Dioptimalkan',
        responseLanguage: 'Respons Bahasa Indonesia',
        deleteConfirm: 'Apakah Anda yakin ingin menghapus prompt ini?',
        noResults: 'Tidak ada hasil ditemukan.',
        copyOriginal: 'Salin asli',
    },
    settings: {
        title: 'Pengaturan',
        appearance: 'Tampilan',
        theme: 'Tema',
        themeLight: 'Terang',
        themeDark: 'Gelap',
        themeAuto: 'Otomatis',
        storage: 'Penyimpanan',
        clearLocalData: 'Hapus Data Lokal',
        clearDataDescription: 'Atur ulang semua pengaturan dan data tersimpan',
        clearButton: 'Hapus Data',
        about: 'Tentang',
        version: 'Versi',
        documentation: 'Dokumentasi',
        viewDocs: 'Lihat Dok',
        privacy: 'Privasi',
        privacyNote: 'Semua data disimpan secara lokal di browser Anda.',
        language: 'Bahasa',
    },
    perplexity: {
        error: {
            404: 'Sumber daya tidak ditemukan. Kuota pencarian harian mungkin terlampaui atau titik akhir API telah berubah.',
            403: 'Akses ditolak. Silakan periksa status login Anda atau lewati pemeriksaan keamanan di perplexity.ai.',
            429: 'Terlalu banyak permintaan. Anda telah melebihi batas. Silakan coba lagi nanti.',
            500: 'Kesalahan server. Perplexity mengalami masalah. Silakan coba lagi nanti.',
            quotaExceeded: 'Kuota Deep Research terlampaui untuk tingkat {{tier}}. Beralih ke Pencarian Cepat atau tingkatkan paket Anda.',
            generic: 'Terjadi kesalahan: {{message}}',
        },
        tier: {
            free: 'Gratis',
            pro: 'Pro',
        },
        login: {
            required: 'Login Diperlukan',
            message: 'Silakan login ke Perplexity untuk menggunakan fitur lanjutan seperti Deep Research dan lampiran file.',
            actionButton: 'Buka Perplexity & Login',
            featureLimited: 'Beberapa fitur terbatas tanpa login',
            tabOpened: 'Tab login Perplexity dibuka. Silakan selesaikan otentikasi.',
            alreadyLoggedIn: 'Sudah login ke Perplexity',
        },
        quota: {
            left: 'tersisa',
            selectTier: 'Pilih Tingkat Langganan',
            freePlan: 'Paket Gratis',
            proPlan: 'Paket Pro',
        },
        chat: {
            placeholder: 'Tanyakan apa saja...',
            deepResearchPlaceholder: 'Ajukan pertanyaan penelitian mendalam...',
            emptyTitle: 'Di mana pengetahuan dimulai',
            emptyDescription: 'Tanyakan apa saja. Perplexity mencari di internet untuk memberi Anda jawaban dengan kutipan.',
            thinking: 'Perplexity sedang berpikir...',
            proSearch: 'Pencarian Pro',
            quickSearch: 'Pencarian Cepat',
            proSearchInfo: 'Pencarian Pro menggunakan model canggih. {{remaining}} kueri tersisa.',
            quickSearchInfo: 'Pencarian Cepat tidak terbatas dan cepat.',
            attachment: 'Lampiran',
        },
    },
    notifications: {
        loginRequired: 'Login Diperlukan',
        loginToPerplexity: 'Silakan login ke Perplexity untuk melanjutkan',
        featureRestricted: 'Fitur ini dibatasi',
        networkError: 'Kesalahan jaringan. Silakan periksa koneksi Anda.',
        unknownError: 'Terjadi kesalahan yang tidak diketahui',
    },
    categories: {
        general: 'Umum',
        coding: 'Koding',
        writing: 'Menulis',
        analysis: 'Analisis',
        creative: 'Kreatif',
        business: 'Bisnis',
        academic: 'Akademik',
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'Main Brain mengarahkan {{count}} bot slave',
        goalLabel: 'Masukkan tujuanmu',
        goalPlaceholder: 'contoh: Analisis data ini, temukan insight, dan buat rencana aksi...',
        tip: 'Tips: tujuan yang jelas akan memberi hasil lebih lembut dan pas.',
        previewButton: 'Pratinjau & haluskan prompt utama',
        previewShow: 'buka',
        previewHide: 'tutup',
        previewTitle: 'Pratinjau prompt Main Brain (tujuan/bot terisi otomatis)',
        previewFilledLabel: 'Pratinjau dengan tujuanmu sekarang',
        warningKeepBlocks: 'Biarkan [SLAVE:…], {{slaves}}, dan {{goal}} tetap utuh — haluskan bagian sekitarnya saja.',
        persistNote: 'Tersimpan. Prompt yang disesuaikan ini akan dipakai lagi untuk Brain Flow berikutnya.',
        previewGoalPlaceholder: 'Ceritakan tujuanmu, aku akan membimbing seluruh tim…',
        synthesisPreviewButton: 'Pratinjau & haluskan prompt sintesis',
        synthesisPreviewTitle: 'Pratinjau prompt sintesis (tujuan/respons terisi otomatis)',
        synthesisPreviewFilledLabel: 'Pratinjau dengan contoh respons',
        synthesisWarningKeepBlocks: 'Biarkan {{goal}} dan {{responses}} tetap utuh — prompt ini mengarahkan sintesis akhir.',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# PERAN
Anda adalah "Otak Utama" - koordinator yang mendistribusikan sub-tugas khusus ke model AI bawahan.
Anda TIDAK menjawab pertanyaan pengguna secara langsung. Tugas SATU-SATUNYA Anda adalah membuat prompt optimal untuk setiap bawahan.

# MODEL BAWAHAN
{{slaves}}

# TUJUAN PENGGUNA
{{goal}}

# ATURAN WAJIB (TIDAK BOLEH DILANGGAR)
1. Buat SATU blok [SLAVE:id] untuk SETIAP bawahan dalam daftar - tanpa pengecualian
2. Bawahan bekerja SECARA BERSAMAAN dan TIDAK BISA melihat hasil satu sama lain
3. JANGAN PERNAH menulis teks apa pun di luar blok [SLAVE:...][/SLAVE]
4. Gunakan ID bawahan yang TEPAT sesuai yang diberikan (mis. [SLAVE:gemini-1], [SLAVE:grok-2])

# FORMAT OUTPUT
[SLAVE:model-id]
Prompt tugas spesifik Anda di sini...
[/SLAVE]

# STRATEGI DESAIN PROMPT
Untuk setiap bawahan, tetapkan peran BERBEDA berdasarkan tujuan:
- Analis: Analisis data, pengenalan pola, statistik
- Kritikus: Penilaian risiko, argumen tandingan, kasus khusus
- Kreator: Solusi, ide, rencana implementasi
- Verifikator: Pemeriksaan fakta, konfirmasi sumber, tinjauan logika
- Sintesis: Ringkasan, wawasan kunci, daftar tindakan

# TEMPLATE PROMPT BAWAHAN
Setiap prompt harus mencakup:
1. PERAN: "Anda adalah [peran ahli spesifik]..."
2. TUGAS: Instruksi yang jelas dan dapat ditindaklanjuti dengan kata kerja spesifik
3. FOKUS: Aspek mana yang harus dianalisis (hindari tumpang tindih dengan bawahan lain)
4. FORMAT: Struktur output yang diinginkan (poin-poin, daftar bernomor, kategori)
5. BAHASA: Jawab dalam bahasa yang sama dengan tujuan pengguna

# ANTI-POLA
❌ Mengajukan pertanyaan yang sama ke beberapa bawahan
❌ Membuat ketergantungan antar bawahan (mis. "Berdasarkan output dari model A...")
❌ Menulis komentar atau penjelasan di luar blok
❌ Melewatkan bawahan mana pun dari daftar
❌ Menggunakan prompt generik - spesifik sesuai kekuatan masing-masing bawahan`,
        phase3: `# PERAN
Anda adalah "Otak Utama" sintesis. Tugas Anda adalah menggabungkan beberapa respons AI menjadi SATU jawaban terbaik.

# TUJUAN AWAL PENGGUNA
{{goal}}

# RESPONS BAWAHAN
{{responses}}

# METODOLOGI SINTESIS (4 LANGKAH)

## Langkah 1: EKSTRAKSI
- Identifikasi poin-poin kunci dari setiap respons
- Catat wawasan unik dari satu model saja
- Tandai kesimpulan yang selaras (konsensus)

## Langkah 2: VALIDASI
- Verifikasi silang fakta yang disebutkan oleh beberapa sumber
- Tandai kontradiksi antar respons
- Nilai kepercayaan: Tinggi (3+ model setuju) / Sedang (2 setuju) / Rendah (hanya 1)

## Langkah 3: RESOLUSI KONFLIK
Ketika model tidak setuju:
- Prioritaskan respons dengan bukti/data spesifik daripada opini
- Pertimbangkan keahlian masing-masing model
- Jika tidak dapat diselesaikan, sajikan kedua pandangan dengan pro/kontra

## Langkah 4: SINTESIS
Buat respons terpadu yang:
- Menjawab LANGSUNG tujuan awal pengguna
- Mengintegrasikan bagian terbaik dari semua respons
- Menghilangkan redundansi dan kontradiksi
- Menjaga koherensi dan konsistensi

# FORMAT OUTPUT
Strukturkan respons Anda sebagai berikut:

### 📋 Ringkasan Eksekutif
[2-3 kalimat ringkasan jawaban yang disintesis]

### 🔍 Temuan Utama
[Poin-poin kesimpulan utama dengan tingkat kepercayaan]

### ⚠️ Pertimbangan Penting
[Risiko, peringatan, atau pendapat minoritas yang perlu diperhatikan]

### ✅ Tindakan yang Disarankan / Jawaban
[Kesimpulan yang jelas dan dapat ditindaklanjuti yang memenuhi tujuan pengguna]

# BAHASA
Jawab dalam bahasa yang SAMA dengan tujuan awal pengguna`,
    },

    modelCard: {
        refresh: 'Segarkan',
        openInNewTab: 'Buka di tab baru',
        removeMainBrain: 'Hapus Main Brain',
        setAsMainBrain: 'Atur sebagai Main Brain',
        syncing: 'Menyinkronkan sesi...',
        synced: 'Tersinkronkan!',
        syncFailed: 'Sinkronisasi gagal',
        syncSession: 'Sinkronkan sesi',
        mainBrain: 'Main Brain',
    },

    byok: {
        title: 'Konfigurasi BYOK',
        subtitle: 'Gunakan kunci API Anda sendiri dengan model AI',
        systemActive: 'Sistem aktif',
        systemDisabled: 'Sistem dinonaktifkan',
        refreshAll: 'Segarkan semua',
        refreshing: 'Menyegarkan...',
        saveChanges: 'Simpan perubahan',
        saving: 'Menyimpan...',
        providerName: 'Penyedia',
        modelsCount: '{{count}} model',
        getApiKey: 'Dapatkan kunci API',
        documentation: 'Dokumentasi',
        apiCredentials: 'Kredensial API',
        validate: 'Validasi',
        validating: 'Memvalidasi...',
        valid: 'Valid',
        invalid: 'Tidak valid',
        modelSelection: 'Pilihan model',
        available: 'Tersedia',
        searchModels: 'Cari model...',
        sortBy: 'Urutkan berdasarkan',
        sortPopular: 'Populer',
        sortLatest: 'Terbaru',
        allModels: 'Semua model',
        reasoning: 'Penalaran',
        coding: 'Pengkodean',
        vision: 'Penglihatan',
        realtime: 'Waktu nyata',
        contextWindow: 'Jendela konteks',
        pricing: 'Harga',
        pricingVaries: 'Harga bervariasi',
        noModelsFound: 'Tidak ada model yang cocok ditemukan.',
        refreshSuccess: 'Daftar model berhasil disegarkan.',
        refreshError: 'Gagal menyegarkan daftar model.',
        validationSuccess: 'Kunci API valid.',
        validationError: 'Validasi kunci API gagal.',
        saveSuccess: 'Konfigurasi disimpan.',
        validation: {
            title: 'Verifikasi kunci API diperlukan',
            unverifiedProvidersMessage: 'Penyedia berikut belum diverifikasi:',
            autoVerifyPrompt: 'Ingin memverifikasinya secara otomatis sekarang?',
            cancelNote: '(Batalkan untuk kembali tanpa menyimpan)',
            unavailableTitle: 'Tidak dapat menyimpan',
            unavailableMessage: 'Kunci API atau model dari penyedia berikut tidak tersedia:',
            modelLabel: 'Model',
            reasonLabel: 'Alasan',
            reasonInvalidKey: 'Kunci API tidak valid atau model tidak dapat diakses.',
            solutionsTitle: 'Solusi:',
            solution1: '1. Periksa kembali kunci API Anda',
            solution2: '2. Coba pilih model yang berbeda',
            solution3: '3. Periksa izin di situs penyedia',
            uncertainTitle: 'Peringatan: Verifikasi tidak pasti',
            uncertainMessage: 'Beberapa penyedia tidak dapat diverifikasi:',
            uncertainReason: 'Verifikasi tidak pasti (kesalahan jaringan atau batas kecepatan)',
            proceedQuestion: 'Tetap menyimpan?',
            recommendation: 'Rekomendasi: Tekan "Batal" dan coba lagi dengan tombol "Verifikasi".',
        },
        cacheAge: 'Diperbarui {{minutes}} menit lalu',
        cached: 'Dicache',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Konfigurasi infrastruktur AI Anda',
        openRouterNote: '※Informasi model berdasarkan OpenRouter. Ketersediaan aktual dapat bervariasi tergantung pada kunci penyedia.',
        aiProviders: 'Penyedia AI',
        selectProvider: 'Pilih penyedia untuk dikonfigurasi',
        allSystemsOperational: 'Semua sistem beroperasi',
        lastUpdated: 'Pembaruan terakhir: {{time}}',
        notYetRefreshed: 'Belum disegarkan',
        refreshModels: 'Segarkan model',
        variants: {
            default: 'Konfigurasi default',
            free: 'Versi gratis ($0, dengan batasan)',
            extended: 'Jendela konteks diperluas',
            thinking: 'Penalaran diperluas (Chain-of-Thought)',
            online: 'Pencarian web waktu nyata (Exa.ai)',
            nitro: 'Prioritaskan penyedia tercepat',
            floor: 'Prioritaskan penyedia termurah',
        },
        status: {
            available: 'Tersedia',
            unavailable: 'Tidak tersedia',
            uncertain: 'Terverifikasi (verifikasi model dilewati)',
            notVerified: 'Belum diverifikasi',
            checking: 'Memeriksa...',
            verified: 'Terverifikasi',
        },
        advanced: {
            title: 'Pengaturan lanjutan',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Penalti frekuensi',
            presencePenalty: 'Penalti kehadiran',
            seed: 'Seed',
            random: 'Acak',
            responseFormat: 'Format respons',
            text: 'Teks',
            jsonObject: 'Objek JSON',
        },
        modelCard: {
            settings: 'Pengaturan',
            customSettings: 'Pengaturan kustom',
            ctx: 'ctx',
            free: 'Gratis',
        },
        tooltips: {
            modelAvailable: '✅ Model tersedia untuk kunci API ini',
            modelUnavailable: '❌ Model tidak tersedia (periksa kunci API atau akses model)',
            modelUncertain: 'Kunci API valid, tetapi tidak dapat mengkonfirmasi ketersediaan model. Kemungkinan berfungsi.',
            clickToVerify: 'Klik untuk memverifikasi ketersediaan model',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'Tidak ada pesan',
        startConversation: 'Mulai percakapan dengan model BYOK ini',
        attachImage: 'Lampirkan gambar',
        imageTooLarge: 'Gambar "{{name}}" terlalu besar (maks 20MB)',
        sending: 'Mengirim...',
        receiving: 'Menerima...',
        imagesSelected: '{{count}} gambar dipilih',
        pressEnterToSend: 'Tekan Enter untuk mengirim',
        sendMessage: 'Kirim pesan ke model ini...',
        attachedImage: 'Gambar terlampir',
        preview: 'Pratinjau {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Fase perencanaan',
        phase2Title: 'Fase eksekusi',
        phase3Title: 'Fase integrasi',
        waiting: 'Menunggu',
        done: 'Selesai',
        processing: 'Memproses...',
        skipWaiting: 'Lewati penantian',
    },

    // === History Popover ===
    historyPopover: {
        title: 'Riwayat',
        modelHistory: 'Riwayat model',
        newChat: 'Obrolan baru',
        searchPlaceholder: 'Cari percakapan...',
        loading: 'Memuat...',
        noConversations: 'Tidak ada percakapan ditemukan',
        startNewChat: 'Mulai obrolan baru dan akan muncul di sini',
        untitledConversation: 'Percakapan tanpa judul',
        noPreview: 'Tidak ada pratinjau',
        deleteConversation: 'Hapus percakapan',
        conversationsStored: '{{count}} percakapan tersimpan',
        daysAgo: '{{days}} hari yang lalu',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Pengaturan model',
        useDefaultSettings: 'Gunakan pengaturan default',
        applyGlobalSettings: 'Terapkan pengaturan BYOK global',
        unsaved: 'Belum disimpan',
        resetToDefaults: 'Reset ke default',
        modelVariant: 'Varian model',
        enableThinking: 'Aktifkan thinking',
        noCustomSettings: 'Model ini tidak memiliki pengaturan kustom.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'Pengaturan kunci API',
        byokDescription: 'Gunakan OpenAI, Claude, Gemini secara langsung',
        openSettings: 'Buka pengaturan',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 Tambahkan model {{name}}?\n\nMulai percakapan baru dan\nkonsultasikan atau minta bantuan dari {{name}}.',
        deleteModel: '❌ Hapus model "{{name}}"?',
        newChat: '💬 Mulai percakapan baru?\n\nPercakapan saat ini akan disimpan secara otomatis,\nAnda dapat memulihkannya dari riwayat kapan saja.',
        apiKeyNotSet: 'Kunci API tidak dikonfigurasi. Aktifkan dan simpan kunci di Pengaturan → BYOK.',
        modelNotSelected: 'Model tidak dipilih. Pilih model dalam konfigurasi BYOK.',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: 'Proses berpikir',
        showProcess: 'Tampilkan proses berpikir',
        hideProcess: 'Sembunyikan proses berpikir',
        summary: 'Ringkasan',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Riwayat percakapan',
    },
};
