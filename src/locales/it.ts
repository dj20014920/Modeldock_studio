export default {
    common: {
        loading: 'Caricamento...',
        save: 'Salva',
        cancel: 'Annulla',
        delete: 'Elimina',
        confirm: 'Conferma',
        close: 'Chiudi',
        search: 'Cerca',
        copy: 'Copia',
        copied: 'Copiato!',
        error: 'Errore',
        success: 'Successo',
        warning: 'Avviso',
        info: 'Info',
        retry: 'Riprova',
        back: 'Indietro',
        next: 'Avanti',
        finish: 'Fine',
        ok: 'OK',
        yes: 'Sì',
        no: 'No',
    },
    sidebar: {
        chats: 'Chat',
        models: 'Modelli',
        settings: 'Impostazioni',
        noActiveChats: 'Nessuna chat attiva.',
        createNewChat: 'Crea nuova chat',
        availableModels: 'Modelli disponibili',
        maxInstancesHint: 'Max 3 / modello',
        proUser: 'Utente Pro',
        versionLabel: 'ModelDock V1',
    },
    modelGrid: {
        allInMainBrain: 'Tutti i modelli attivi sono nella vista principale',
        noModels: 'Nessun modello disponibile',
    },
    chatInput: {
        manualMode: 'Manuale',
        autoMode: 'Auto',
        placeholder: 'Scrivi un messaggio...',
        send: 'Invia',
        copyToClipboard: 'Copia negli appunti',
        dispatchToAll: 'Invia a tutti i modelli',
        consentTitle: '⚡️ Consenso Routing Automatico (Avviso di Rischio)',
        consentMessage: 'ModelDock invierà automaticamente il tuo messaggio ai modelli attivi nel tuo browser. ⚠️ Attenzione: Alcuni servizi AI (ChatGPT, Claude, ecc.) potrebbero considerare l\'accesso automatizzato una violazione dei loro Termini di Servizio, che potrebbe comportare avvisi sull\'account, blocchi temporanei o sospensione permanente. Ti assumi tutta la responsabilità per l\'utilizzo di questa funzionalità.',
        iUnderstand: 'Capisco',
        sentSuccess: 'Inviato!',
        errorNoTargets: 'Nessun obiettivo valido trovato',
        errorSystemError: 'Errore di sistema',
    },
    promptLibrary: {
        title: 'Libreria Prompt',
        outputLanguage: 'Lingua di output',
        searchPlaceholder: 'Cerca prompt (titolo, descrizione, contenuto)...',
        promptsCount_one: '{{count}} prompt',
        promptsCount_other: '{{count}} prompt',
        allCategories: 'Vedi tutto',
        addPrompt: 'Aggiungi Prompt',
        backToList: 'Torna alla lista',
        createNewPrompt: 'Crea nuovo prompt',
        tips: {
            title: 'Consigli di scrittura',
            content: 'Gli LLM comprendono le istruzioni in inglese in modo più accurato. Scrivi il contenuto del prompt in inglese e usa la tua lingua madre per i titoli.',
        },
        form: {
            titleLabel: 'Titolo (nella tua lingua)',
            titlePlaceholder: 'es: Refactoring codice esperto',
            categoryLabel: 'Categoria',
            descriptionLabel: 'Descrizione (opzionale)',
            descriptionPlaceholder: 'Descrivi brevemente lo scopo di questo prompt.',
            contentLabel: 'Contenuto del prompt (inglese consigliato)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Aggiungi richiesta di risposta in italiano',
            saveButton: 'Salva',
            cancelButton: 'Annulla',
        },
        systemBadge: 'Sistema',
        optimizedPrompt: 'Prompt ottimizzato in inglese',
        responseLanguage: 'Risposta in italiano',
        deleteConfirm: 'Sei sicuro di voler eliminare questo prompt?',
        noResults: 'Nessun risultato trovato.',
        copyOriginal: 'Copia originale',
    },
    settings: {
        title: 'Impostazioni',
        appearance: 'Aspetto',
        theme: 'Tema',
        themeLight: 'Chiaro',
        themeDark: 'Scuro',
        themeAuto: 'Auto',
        storage: 'Archiviazione',
        clearLocalData: 'Cancella dati locali',
        clearDataDescription: 'Reimposta tutte le impostazioni e i dati salvati',
        clearButton: 'Cancella dati',
        about: 'Informazioni',
        version: 'Versione',
        documentation: 'Documentazione',
        viewDocs: 'Vedi doc',
        privacy: 'Privacy',
        privacyNote: 'Tutti i dati sono archiviati localmente nel tuo browser.',
        language: 'Lingua',
    },
    perplexity: {
        error: {
            404: 'Risorsa non trovata. La quota di ricerca giornaliera potrebbe essere superata o l\'endpoint API è cambiato.',
            403: 'Accesso negato. Verifica il tuo stato di accesso o supera il controllo di sicurezza su perplexity.ai.',
            429: 'Troppe richieste. Hai superato il limite. Riprova più tardi.',
            500: 'Errore del server. Perplexity sta riscontrando problemi. Riprova più tardi.',
            quotaExceeded: 'Quota Deep Research superata per il livello {{tier}}. Passa alla Ricerca Rapida o aggiorna il tuo piano.',
            generic: 'Si è verificato un errore: {{message}}',
        },
        tier: {
            free: 'Gratuito',
            pro: 'Pro',
        },
        login: {
            required: 'Accesso richiesto',
            message: 'Accedi a Perplexity per utilizzare funzionalità avanzate come Deep Research e allegati file.',
            actionButton: 'Apri Perplexity e accedi',
            featureLimited: 'Alcune funzionalità sono limitate senza accesso',
            tabOpened: 'Scheda di accesso Perplexity aperta. Completa l\'autenticazione.',
            alreadyLoggedIn: 'Già connesso a Perplexity',
        },
        quota: {
            left: 'rimanenti',
            selectTier: 'Seleziona livello abbonamento',
            freePlan: 'Piano Gratuito',
            proPlan: 'Piano Pro',
        },
        chat: {
            placeholder: 'Chiedi qualsiasi cosa...',
            deepResearchPlaceholder: 'Fai una domanda di ricerca approfondita...',
            emptyTitle: 'Dove inizia la conoscenza',
            emptyDescription: 'Chiedi qualsiasi cosa. Perplexity cerca su internet per darti una risposta con citazioni.',
            thinking: 'Perplexity sta pensando...',
            proSearch: 'Ricerca Pro',
            quickSearch: 'Ricerca Rapida',
            proSearchInfo: 'La Ricerca Pro utilizza modelli avanzati. {{remaining}} query rimanenti.',
            quickSearchInfo: 'La Ricerca Rapida è illimitata e veloce.',
            attachment: 'Allegato',
        },
    },
    notifications: {
        loginRequired: 'Accesso richiesto',
        loginToPerplexity: 'Accedi a Perplexity per continuare',
        featureRestricted: 'Questa funzionalità è limitata',
        networkError: 'Errore di rete. Controlla la tua connessione.',
        unknownError: 'Si è verificato un errore sconosciuto',
    },
    categories: {
        general: 'Generale',
        coding: 'Programmazione',
        writing: 'Scrittura',
        analysis: 'Analisi',
        creative: 'Creativo',
        business: 'Affari',
        academic: 'Accademico',
    },

    modelCard: {
        refresh: 'Aggiorna',
        openInNewTab: 'Apri in nuova scheda',
        removeMainBrain: 'Rimuovi Main Brain',
        setAsMainBrain: 'Imposta come Main Brain',
        syncing: 'Sincronizzazione sessione...',
        synced: 'Sincronizzato!',
        syncFailed: 'Sincronizzazione fallita',
        syncSession: 'Sincronizza sessione',
        mainBrain: 'Main Brain',
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'Il Main Brain coordina {{count}} bot slave',
        goalLabel: 'Inserisci il tuo obiettivo',
        goalPlaceholder: 'es: Analizza questi dati, estrai insight e crea un piano di esecuzione...',
        tip: 'Suggerimento: più chiaro è l\'obiettivo, più morbida e utile sarà la risposta.',
        previewButton: 'Anteprima e ritocco delicato del prompt principale',
        previewShow: 'apri',
        previewHide: 'chiudi',
        previewTitle: 'Anteprima del prompt Main Brain (obiettivo/bot si compilano automaticamente)',
        previewFilledLabel: 'Anteprima con il tuo obiettivo attuale',
        warningKeepBlocks: 'Lascia intatti i blocchi [SLAVE:…], {{slaves}} e {{goal}} — ritocca solo il resto con delicatezza.',
        persistNote: 'Salvato. Useremo questo prompt affinato anche nelle prossime esecuzioni di Brain Flow.',
        previewGoalPlaceholder: 'Raccontami il tuo obiettivo, guiderò tutto il team…',
        synthesisPreviewButton: 'Anteprima e ritocco delicato del prompt di sintesi',
        synthesisPreviewTitle: 'Anteprima del prompt di sintesi (obiettivo/risposte si compilano automaticamente)',
        synthesisPreviewFilledLabel: 'Anteprima con risposte di esempio',
        synthesisWarningKeepBlocks: 'Lascia {{goal}} e {{responses}} al loro posto — questo prompt guida la sintesi finale.',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# RUOLO
Sei il "Main Brain" - un orchestratore di attività che distribuisce sotto-attività specializzate ai modelli IA slave.
NON rispondi direttamente alla domanda dell'utente. Il tuo UNICO compito è creare prompt ottimali per ogni slave.

# MODELLI SLAVE
{{slaves}}

# OBIETTIVO DELL'UTENTE
{{goal}}

# REGOLE CRITICHE (OBBLIGATORIO)
1. Crea ESATTAMENTE UN blocco [SLAVE:id] per OGNI slave elencato sopra - nessuna eccezione
2. Gli slave vengono eseguiti IN PARALLELO e NON POSSONO vedere le uscite degli altri
3. NON includere alcun testo al di fuori dei blocchi [SLAVE:...][/SLAVE]
4. Usa l'ID ESATTO dello slave dalla lista (es: [SLAVE:gemini-1], [SLAVE:grok-2])

# FORMATO DI OUTPUT
[SLAVE:model-id]
Il tuo prompt di attività specifico qui...
[/SLAVE]

# STRATEGIA DI PROGETTAZIONE DEI PROMPT
Per ogni slave, assegna un ruolo DISTINTO basato sull'obiettivo:
- Analista: Analisi dati, riconoscimento pattern, statistiche
- Critico: Valutazione rischi, controargomentazioni, casi limite
- Creatore: Soluzioni, idee, piani di implementazione
- Validatore: Verifica fatti, verifica fonti, revisione logica
- Sintetizzatore: Riassunti, insight chiave, punti d'azione

# TEMPLATE PROMPT SLAVE
Ogni prompt dovrebbe includere:
1. RUOLO: "Sei un [ruolo esperto specifico]..."
2. ATTIVITÀ: Istruzione chiara e attuabile con verbi specifici
3. FOCUS: Quale aspetto specifico analizzare (evitare sovrapposizioni con altri slave)
4. FORMATO: Struttura di output desiderata (elenchi puntati, lista numerata, sezioni)
5. LINGUA: Rispondi nella stessa lingua dell'obiettivo dell'utente

# ANTI-PATTERN (DA NON FARE)
❌ Fare la stessa domanda a più slave
❌ Creare dipendenze tra slave (es: "basato sull'output del Modello A...")
❌ Scrivere meta-commenti o spiegazioni fuori dai blocchi
❌ Saltare qualsiasi slave dalla lista
❌ Usare prompt generici - sii specifico per i punti di forza di ogni slave`,
        phase3: `# RUOLO
Sei il sintetizzatore "Main Brain". Il tuo compito è unire più risposte IA in UNA risposta ottimale.

# OBIETTIVO ORIGINALE DELL'UTENTE
{{goal}}

# RISPOSTE DEGLI SLAVE
{{responses}}

# METODOLOGIA DI SINTESI
Segui questo processo:

## Passo 1: ESTRARRE
- Elenca i punti chiave da ogni risposta
- Nota gli insight unici forniti da un solo modello
- Identifica le conclusioni sovrapposte (consenso)

## Passo 2: VALIDARE
- Verifica incrociata dei fatti menzionati da più fonti
- Segnala qualsiasi contraddizione tra le risposte
- Valuta la fiducia: Alta (3+ modelli concordano) / Media (2 concordano) / Bassa (solo 1)

## Passo 3: RISOLVERE I CONFLITTI
Quando i modelli non concordano:
- Preferisci risposte con prove/dati specifici rispetto alle opinioni
- Considera l'expertise di dominio di ogni modello
- Se non risolvibile, presenta entrambe le viste con pro/contro

## Passo 4: SINTETIZZARE
Crea una risposta unificata che:
- Risponda direttamente all'obiettivo originale dell'utente
- Combini i migliori elementi da tutte le risposte
- Elimini ridondanza e contraddizioni
- Mantenga flusso logico e coerenza

# FORMATO DI OUTPUT
Struttura la tua risposta così:

### 📋 Sommario Esecutivo
[Panoramica di 2-3 frasi della risposta sintetizzata]

### 🔍 Risultati Chiave
[Punti elenco delle conclusioni principali con livelli di fiducia]

### ⚠️ Considerazioni Importanti
[Rischi, avvertenze o opinioni minoritarie da notare]

### ✅ Azione Raccomandata / Risposta
[Conclusione chiara e attuabile che soddisfa l'obiettivo dell'utente]

# LINGUA
Rispondi nella stessa lingua dell'obiettivo originale dell'utente.`,
    },

    byok: {
        title: 'Configurazione BYOK',
        subtitle: 'Usa le tue chiavi API con i modelli IA',
        systemActive: 'Sistema attivo',
        systemDisabled: 'Sistema disattivato',
        refreshAll: 'Aggiorna tutto',
        refreshing: 'Aggiornamento...',
        saveChanges: 'Salva modifiche',
        saving: 'Salvataggio...',
        providerName: 'Provider',
        modelsCount: '{{count}} modelli',
        getApiKey: 'Ottieni chiave API',
        documentation: 'Documentazione',
        apiCredentials: 'Credenziali API',
        validate: 'Valida',
        validating: 'Validazione...',
        valid: 'Valida',
        invalid: 'Non valida',
        modelSelection: 'Selezione modello',
        available: 'Disponibile',
        searchModels: 'Cerca modelli...',
        sortBy: 'Ordina per',
        sortPopular: 'Popolare',
        sortLatest: 'Più recente',
        allModels: 'Tutti i modelli',
        reasoning: 'Ragionamento',
        coding: 'Programmazione',
        vision: 'Visione',
        realtime: 'Tempo reale',
        contextWindow: 'Finestra di contesto',
        pricing: 'Prezzi',
        pricingVaries: 'Prezzo variabile',
        noModelsFound: 'Nessun modello corrispondente trovato.',
        refreshSuccess: 'Lista modelli aggiornata con successo.',
        refreshError: 'Impossibile aggiornare la lista modelli.',
        validationSuccess: 'Chiave API valida.',
        validationError: 'Validazione chiave API fallita.',
        saveSuccess: 'Configurazione salvata.',
        validation: {
            title: 'Verifica chiave API richiesta',
            unverifiedProvidersMessage: 'I seguenti provider non sono stati verificati:',
            autoVerifyPrompt: 'Vuoi verificarli automaticamente ora?',
            cancelNote: '(Annulla per tornare senza salvare)',
            unavailableTitle: 'Impossibile salvare',
            unavailableMessage: 'Le chiavi API o i modelli dei seguenti provider non sono disponibili:',
            modelLabel: 'Modello',
            reasonLabel: 'Motivo',
            reasonInvalidKey: 'La chiave API non è valida o il modello non è accessibile.',
            solutionsTitle: 'Soluzioni:',
            solution1: '1. Ricontrolla la tua chiave API',
            solution2: '2. Prova a selezionare un modello diverso',
            solution3: '3. Verifica le autorizzazioni sul sito del provider',
            uncertainTitle: 'Avviso: Verifica incerta',
            uncertainMessage: 'Alcuni provider non sono stati verificati:',
            uncertainReason: 'Verifica incerta (errore di rete o limite di velocità)',
            proceedQuestion: 'Vuoi salvare comunque?',
            recommendation: 'Raccomandazione: Premi "Annulla" e riprova con il pulsante "Verifica".',
        },
        cacheAge: 'Aggiornato {{minutes}} min fa',
        cached: 'In cache',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Configura la tua infrastruttura IA',
        openRouterNote: '※Le informazioni del modello sono basate su OpenRouter. La disponibilità effettiva può variare in base alla chiave del provider.',
        aiProviders: 'Provider IA',
        selectProvider: 'Seleziona un provider da configurare',
        allSystemsOperational: 'Tutti i sistemi operativi',
        lastUpdated: 'Ultimo aggiornamento: {{time}}',
        notYetRefreshed: 'Non ancora aggiornato',
        refreshModels: 'Aggiorna modelli',
        variants: {
            default: 'Configurazione predefinita',
            free: 'Versione gratuita (\$0, con limiti)',
            extended: 'Finestra di contesto estesa',
            thinking: 'Ragionamento esteso (Chain-of-Thought)',
            online: 'Ricerca web in tempo reale (Exa.ai)',
            nitro: 'Priorità al provider più veloce',
            floor: 'Priorità al provider più economico',
        },
        status: {
            available: 'Disponibile',
            unavailable: 'Non disponibile',
            uncertain: 'Verificato (verifica modello saltata)',
            notVerified: 'Non verificato',
            checking: 'Verifica...',
            verified: 'Verificato',
        },
        advanced: {
            title: 'Impostazioni avanzate',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Penalità frequenza',
            presencePenalty: 'Penalità presenza',
            seed: 'Seed',
            random: 'Casuale',
            responseFormat: 'Formato risposta',
            text: 'Testo',
            jsonObject: 'Oggetto JSON',
        },
        modelCard: {
            settings: 'Impostazioni',
            customSettings: 'Impostazioni personalizzate',
            ctx: 'ctx',
            free: 'Gratis',
        },
        tooltips: {
            modelAvailable: '✅ Modello disponibile per questa chiave API',
            modelUnavailable: '❌ Modello non disponibile (verifica chiave API o accesso al modello)',
            modelUncertain: 'Chiave API valida, ma impossibile confermare la disponibilità del modello. Probabilmente funziona.',
            clickToVerify: 'Clicca per verificare la disponibilità del modello',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'Nessun messaggio',
        startConversation: 'Inizia una conversazione con questo modello BYOK',
        attachImage: 'Allega immagine',
        imageTooLarge: 'L\'immagine "{{name}}" è troppo grande (max 20MB)',
        sending: 'Invio...',
        receiving: 'Ricezione...',
        imagesSelected: '{{count}} immagini selezionate',
        pressEnterToSend: 'Premi Invio per inviare',
        sendMessage: 'Invia un messaggio a questo modello...',
        attachedImage: 'Immagine allegata',
        preview: 'Anteprima {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Fase di pianificazione',
        phase2Title: 'Fase di esecuzione',
        phase3Title: 'Fase di integrazione',
        waiting: 'In attesa',
        done: 'Completato',
        processing: 'Elaborazione...',
        skipWaiting: 'Salta attesa',
    },

    // === History Popover ===
    historyPopover: {
        title: 'Cronologia',
        modelHistory: 'Cronologia modello',
        newChat: 'Nuova chat',
        searchPlaceholder: 'Cerca conversazioni...',
        loading: 'Caricamento...',
        noConversations: 'Nessuna conversazione trovata',
        startNewChat: 'Inizia una nuova chat e apparirà qui',
        untitledConversation: 'Conversazione senza titolo',
        noPreview: 'Nessuna anteprima',
        deleteConversation: 'Elimina conversazione',
        conversationsStored: '{{count}} conversazioni memorizzate',
        daysAgo: '{{days}} giorni fa',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Impostazioni modello',
        useDefaultSettings: 'Usa impostazioni predefinite',
        applyGlobalSettings: 'Applica impostazioni BYOK globali',
        unsaved: 'Non salvato',
        resetToDefaults: 'Ripristina predefiniti',
        modelVariant: 'Variante modello',
        enableThinking: 'Attiva thinking',
        noCustomSettings: 'Questo modello non ha impostazioni personalizzate.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'Impostazioni chiavi API',
        byokDescription: 'Usa OpenAI, Claude, Gemini direttamente',
        openSettings: 'Apri impostazioni',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 Aggiungere modello {{name}}?\n\nInizia una nuova conversazione e\nconsulta o chiedi aiuto a {{name}}.',
        deleteModel: '❌ Eliminare modello "{{name}}"?',
        newChat: '💬 Iniziare nuova conversazione?\n\nLa conversazione attuale verrà salvata automaticamente,\npuoi recuperarla dalla cronologia in qualsiasi momento.',
        apiKeyNotSet: 'Chiave API non configurata. Attiva e salva la chiave in Impostazioni → BYOK.',
        modelNotSelected: 'Modello non selezionato. Seleziona un modello nella configurazione BYOK.',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: 'Processo di pensiero',
        showProcess: 'Mostra processo di pensiero',
        hideProcess: 'Nascondi processo di pensiero',
        summary: 'Riepilogo',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Cronologia conversazioni',
    },
};
