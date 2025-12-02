export default {
    common: {
        loading: 'Laden...',
        save: 'Speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        confirm: 'Bestätigen',
        close: 'Schließen',
        search: 'Suchen',
        copy: 'Kopieren',
        copied: 'Kopiert!',
        error: 'Fehler',
        success: 'Erfolg',
        warning: 'Warnung',
        info: 'Info',
        retry: 'Wiederholen',
        back: 'Zurück',
        next: 'Weiter',
        finish: 'Fertigstellen',
        ok: 'OK',
        yes: 'Ja',
        no: 'Nein',
    },
    sidebar: {
        chats: 'Chats',
        models: 'Modelle',
        settings: 'Einstellungen',
        noActiveChats: 'Keine aktiven Chats.',
        createNewChat: 'Neuen Chat erstellen',
        availableModels: 'Verfügbare Modelle',
        maxInstancesHint: 'Max 3 / Modell',
        proUser: 'Pro-Benutzer',
        versionLabel: 'ModelDock V1',
    },
    modelGrid: {
        allInMainBrain: 'Alle aktiven Modelle befinden sich in der Hauptansicht',
        noModels: 'Keine Modelle verfügbar',
    },
    chatInput: {
        manualMode: 'Manuell',
        autoMode: 'Auto',
        placeholder: 'Nachricht eingeben...',
        send: 'Senden',
        copyToClipboard: 'In die Zwischenablage kopieren',
        dispatchToAll: 'An alle Modelle senden',
        consentTitle: '⚡️ Zustimmung zur automatischen Weiterleitung (Risikohinweis)',
        consentMessage: 'ModelDock sendet Ihre Nachricht automatisch an aktive Modelle in Ihrem Browser. ⚠️ Warnung: Einige KI-Dienste (ChatGPT, Claude, etc.) können automatisierten Zugriff als Verstoß gegen ihre Nutzungsbedingungen betrachten, was zu Kontowarnungen, vorübergehenden Sperren oder dauerhafter Sperrung führen kann. Sie übernehmen die volle Verantwortung für die Nutzung dieser Funktion.',
        iUnderstand: 'Ich verstehe',
        sentSuccess: 'Gesendet!',
        errorNoTargets: 'Keine gültigen Ziele gefunden',
        errorSystemError: 'Systemfehler',
    },
    promptLibrary: {
        title: 'Prompt-Bibliothek',
        outputLanguage: 'Ausgabesprache',
        searchPlaceholder: 'Prompts suchen (Titel, Beschreibung, Inhalt)...',
        promptsCount_one: '{{count}} Prompt',
        promptsCount_other: '{{count}} Prompts',
        allCategories: 'Alle anzeigen',
        addPrompt: 'Prompt hinzufügen',
        backToList: 'Zurück zur Liste',
        createNewPrompt: 'Neuen Prompt erstellen',
        tips: {
            title: 'Schreibtipps',
            content: 'LLMs verstehen englische Anweisungen genauer. Schreiben Sie den Prompt-Inhalt auf Englisch und verwenden Sie Ihre Muttersprache für Titel.',
        },
        form: {
            titleLabel: 'Titel (in Ihrer Sprache)',
            titlePlaceholder: 'z.B. Experten-Code-Refactoring',
            categoryLabel: 'Kategorie',
            descriptionLabel: 'Beschreibung (optional)',
            descriptionPlaceholder: 'Beschreiben Sie kurz den Zweck dieses Prompts.',
            contentLabel: 'Prompt-Inhalt (Englisch empfohlen)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Antwortanfrage auf Deutsch hinzufügen',
            saveButton: 'Speichern',
            cancelButton: 'Abbrechen',
        },
        systemBadge: 'System',
        optimizedPrompt: 'Optimierter englischer Prompt',
        responseLanguage: 'Deutsche Antwort',
        deleteConfirm: 'Sind Sie sicher, dass Sie diesen Prompt löschen möchten?',
        noResults: 'Keine Ergebnisse gefunden.',
        copyOriginal: 'Original kopieren',
    },
    settings: {
        title: 'Einstellungen',
        appearance: 'Erscheinungsbild',
        theme: 'Thema',
        themeLight: 'Hell',
        themeDark: 'Dunkel',
        themeAuto: 'Automatisch',
        storage: 'Speicher',
        clearLocalData: 'Lokale Daten löschen',
        clearDataDescription: 'Alle Einstellungen und gespeicherten Daten zurücksetzen',
        clearButton: 'Daten löschen',
        about: 'Über',
        version: 'Version',
        documentation: 'Dokumentation',
        viewDocs: 'Doku ansehen',
        privacy: 'Datenschutz',
        privacyNote: 'Alle Daten werden lokal in Ihrem Browser gespeichert.',
        language: 'Sprache',
    },
    perplexity: {
        error: {
            404: 'Ressource nicht gefunden. Tägliches Suchkontingent möglicherweise überschritten oder API-Endpunkt geändert.',
            403: 'Zugriff verweigert. Bitte überprüfen Sie Ihren Anmeldestatus oder bestehen Sie die Sicherheitsprüfung auf perplexity.ai.',
            429: 'Zu viele Anfragen. Sie haben Ihr Limit überschritten. Bitte versuchen Sie es später erneut.',
            500: 'Serverfehler. Perplexity hat Probleme. Bitte versuchen Sie es später erneut.',
            quotaExceeded: 'Deep Research-Kontingent für Stufe {{tier}} überschritten. Wechseln Sie zur Schnellsuche oder aktualisieren Sie Ihren Plan.',
            generic: 'Ein Fehler ist aufgetreten: {{message}}',
        },
        tier: {
            free: 'Kostenlos',
            pro: 'Pro',
        },
        login: {
            required: 'Anmeldung erforderlich',
            message: 'Bitte melden Sie sich bei Perplexity an, um erweiterte Funktionen wie Deep Research und Dateianhänge zu nutzen.',
            actionButton: 'Perplexity öffnen & anmelden',
            featureLimited: 'Einige Funktionen sind ohne Anmeldung eingeschränkt',
            tabOpened: 'Perplexity-Anmeldetab geöffnet. Bitte schließen Sie die Authentifizierung ab.',
            alreadyLoggedIn: 'Bereits bei Perplexity angemeldet',
        },
        quota: {
            left: 'übrig',
            selectTier: 'Abonnementstufe wählen',
            freePlan: 'Kostenloser Plan',
            proPlan: 'Pro-Plan',
        },
        chat: {
            placeholder: 'Fragen Sie irgendetwas...',
            deepResearchPlaceholder: 'Stellen Sie eine Deep Research-Frage...',
            emptyTitle: 'Wo Wissen beginnt',
            emptyDescription: 'Fragen Sie irgendetwas. Perplexity durchsucht das Internet, um Ihnen eine Antwort mit Zitaten zu geben.',
            thinking: 'Perplexity denkt nach...',
            proSearch: 'Pro-Suche',
            quickSearch: 'Schnellsuche',
            proSearchInfo: 'Pro-Suche verwendet fortschrittliche Modelle. {{remaining}} Abfragen übrig.',
            quickSearchInfo: 'Schnellsuche ist unbegrenzt und schnell.',
            attachment: 'Anhang',
        },
    },
    notifications: {
        loginRequired: 'Anmeldung erforderlich',
        loginToPerplexity: 'Bitte melden Sie sich bei Perplexity an, um fortzufahren',
        featureRestricted: 'Diese Funktion ist eingeschränkt',
        networkError: 'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
        unknownError: 'Ein unbekannter Fehler ist aufgetreten',
    },
    categories: {
        general: 'Allgemein',
        coding: 'Programmierung',
        writing: 'Schreiben',
        analysis: 'Analyse',
        creative: 'Kreativ',
        business: 'Geschäft',
        academic: 'Akademisch',
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'Der Main Brain koordiniert {{count}} Slave-Bots',
        goalLabel: 'Dein Ziel eingeben',
        goalPlaceholder: 'z. B. Daten analysieren, Insights gewinnen, Aktionsplan entwerfen...',
        tip: 'Tipp: Je klarer dein Ziel, desto angenehmer das Ergebnis.',
        previewButton: 'Haupt-Prompt ansehen & sanft anpassen',
        previewShow: 'öffnen',
        previewHide: 'schließen',
        previewTitle: 'Main-Brain-Prompt Vorschau (Ziel/Bots füllen sich automatisch)',
        previewFilledLabel: 'Vorschau mit deinem aktuellen Ziel',
        warningKeepBlocks: 'Bitte [SLAVE:…], {{slaves}} und {{goal}} unverändert lassen – nur den Text drumherum behutsam anpassen.',
        persistNote: 'Gespeichert. Wir verwenden diesen angepassten Prompt auch künftig für Brain Flow.',
        previewGoalPlaceholder: 'Erzähl mir dein Ziel, ich führe das Team behutsam…',
        synthesisPreviewButton: 'Synthese-Prompt ansehen & sanft anpassen',
        synthesisPreviewTitle: 'Synthese-Prompt Vorschau (Ziel/Antworten füllen sich automatisch)',
        synthesisPreviewFilledLabel: 'Vorschau mit Beispielantworten',
        synthesisWarningKeepBlocks: '{{goal}} und {{responses}} bitte unverändert lassen – dieser Prompt steuert die finale Synthese.',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# ROLLE
Sie sind das "Main Brain" - ein Aufgaben-Orchestrator, der spezialisierte Teilaufgaben an Slave-KI-Modelle verteilt.
Sie beantworten NICHT direkt die Frage des Benutzers. Ihre EINZIGE Aufgabe ist es, optimale Prompts für jeden Slave zu erstellen.

# SLAVE-MODELLE
{{slaves}}

# BENUTZERZIEL
{{goal}}

# KRITISCHE REGELN (MUSS BEFOLGT WERDEN)
1. Erstellen Sie GENAU EINEN [SLAVE:id]-Block für JEDEN oben aufgelisteten Slave - keine Ausnahmen
2. Slaves laufen PARALLEL und KÖNNEN die Ausgaben der anderen NICHT sehen
3. Fügen Sie KEINEN Text außerhalb der [SLAVE:...][/SLAVE]-Blöcke ein
4. Verwenden Sie die EXAKTE Slave-ID aus der Liste (z.B. [SLAVE:gemini-1], [SLAVE:grok-2])

# AUSGABEFORMAT
[SLAVE:model-id]
Ihr spezifischer Aufgaben-Prompt hier...
[/SLAVE]

# PROMPT-DESIGN-STRATEGIE
Weisen Sie jedem Slave basierend auf dem Ziel eine UNTERSCHIEDLICHE Rolle zu:
- Analyst: Datenanalyse, Mustererkennung, Statistiken
- Kritiker: Risikobewertung, Gegenargumente, Randfälle
- Ersteller: Lösungen, Ideen, Implementierungspläne
- Validator: Faktenprüfung, Quellenverifizierung, Logikprüfung
- Synthesizer: Zusammenfassungen, Schlüsselerkenntnisse, Aktionspunkte

# SLAVE-PROMPT-VORLAGE
Jeder Prompt sollte enthalten:
1. ROLLE: "Sie sind ein [spezifische Expertenrolle]..."
2. AUFGABE: Klare, umsetzbare Anweisung mit spezifischen Verben
3. FOKUS: Welcher spezifische Aspekt analysiert werden soll (Überlappung mit anderen Slaves vermeiden)
4. FORMAT: Gewünschte Ausgabestruktur (Aufzählungen, nummerierte Liste, Abschnitte)
5. SPRACHE: Antworten in derselben Sprache wie das Benutzerziel

# ANTI-MUSTER (NICHT TUN)
❌ Die gleiche Frage an mehrere Slaves stellen
❌ Abhängigkeiten zwischen Slaves erstellen (z.B. "basierend auf der Ausgabe von Modell A...")
❌ Meta-Kommentare oder Erklärungen außerhalb der Blöcke schreiben
❌ Einen Slave aus der Liste auslassen
❌ Generische Prompts verwenden - spezifisch für die Stärken jedes Slaves sein`,
        phase3: `# ROLLE
Sie sind der "Main Brain" Synthesizer. Ihre Aufgabe ist es, mehrere KI-Antworten zu EINER optimalen Antwort zusammenzuführen.

# URSPRÜNGLICHES BENUTZERZIEL
{{goal}}

# SLAVE-ANTWORTEN
{{responses}}

# SYNTHESE-METHODIK
Folgen Sie diesem Prozess:

## Schritt 1: EXTRAHIEREN
- Listen Sie Schlüsselpunkte aus jeder Antwort auf
- Notieren Sie einzigartige Erkenntnisse, die nur ein Modell geliefert hat
- Identifizieren Sie überlappende Schlussfolgerungen (Konsens)

## Schritt 2: VALIDIEREN
- Kreuzprüfen Sie Fakten, die von mehreren Quellen erwähnt wurden
- Markieren Sie Widersprüche zwischen den Antworten
- Bewerten Sie Vertrauen: Hoch (3+ Modelle stimmen zu) / Mittel (2 stimmen zu) / Niedrig (nur 1)

## Schritt 3: KONFLIKTE LÖSEN
Wenn Modelle unterschiedlicher Meinung sind:
- Bevorzugen Sie Antworten mit spezifischen Beweisen/Daten gegenüber Meinungen
- Berücksichtigen Sie die Fachkompetenz jedes Modells
- Falls unlösbar, präsentieren Sie beide Ansichten mit Vor-/Nachteilen

## Schritt 4: SYNTHETISIEREN
Erstellen Sie eine einheitliche Antwort, die:
- Das ursprüngliche Ziel des Benutzers direkt anspricht
- Die besten Elemente aller Antworten kombiniert
- Redundanz und Widersprüche eliminiert
- Logischen Fluss und Kohärenz beibehält

# AUSGABEFORMAT
Strukturieren Sie Ihre Antwort wie folgt:

### 📋 Zusammenfassung
[2-3 Sätze Überblick der synthetisierten Antwort]

### 🔍 Wichtige Erkenntnisse
[Aufzählungspunkte der Hauptschlussfolgerungen mit Vertrauensstufen]

### ⚠️ Wichtige Überlegungen
[Risiken, Vorbehalte oder bemerkenswerte Minderheitsmeinungen]

### ✅ Empfohlene Maßnahme / Antwort
[Klare, umsetzbare Schlussfolgerung, die das Benutzerziel erfüllt]

# SPRACHE
Antworten Sie in derselben Sprache wie das ursprüngliche Benutzerziel.`,
    },

    modelCard: {
        refresh: 'Aktualisieren',
        openInNewTab: 'In neuem Tab öffnen',
        removeMainBrain: 'Main Brain entfernen',
        setAsMainBrain: 'Als Main Brain festlegen',
        syncing: 'Sitzung wird synchronisiert...',
        synced: 'Synchronisiert!',
        syncFailed: 'Synchronisierung fehlgeschlagen',
        syncSession: 'Sitzung synchronisieren',
        mainBrain: 'Main Brain',
    },

    byok: {
        title: 'BYOK-Konfiguration',
        subtitle: 'Verwenden Sie Ihre eigenen API-Schlüssel mit KI-Modellen',
        systemActive: 'System aktiv',
        systemDisabled: 'System deaktiviert',
        refreshAll: 'Alle aktualisieren',
        refreshing: 'Wird aktualisiert...',
        saveChanges: 'Änderungen speichern',
        saving: 'Wird gespeichert...',
        providerName: 'Anbieter',
        modelsCount: '{{count}} Modelle',
        getApiKey: 'API-Schlüssel holen',
        documentation: 'Dokumentation',
        apiCredentials: 'API-Zugangsdaten',
        validate: 'Validieren',
        validating: 'Wird validiert...',
        valid: 'Gültig',
        invalid: 'Ungültig',
        modelSelection: 'Modellauswahl',
        available: 'Verfügbar',
        searchModels: 'Modelle suchen...',
        sortBy: 'Sortieren nach',
        sortPopular: 'Beliebt',
        sortLatest: 'Neueste',
        allModels: 'Alle Modelle',
        reasoning: 'Reasoning',
        coding: 'Programmierung',
        vision: 'Vision',
        realtime: 'Echtzeit',
        contextWindow: 'Kontextfenster',
        pricing: 'Preisgestaltung',
        pricingVaries: 'Preis variiert',
        noModelsFound: 'Keine passenden Modelle gefunden.',
        refreshSuccess: 'Modellliste erfolgreich aktualisiert.',
        refreshError: 'Fehler beim Aktualisieren der Modellliste.',
        validationSuccess: 'API-Schlüssel ist gültig.',
        validationError: 'API-Schlüssel-Validierung fehlgeschlagen.',
        saveSuccess: 'Konfiguration gespeichert.',
        validation: {
            title: 'API-Schlüssel-Überprüfung erforderlich',
            unverifiedProvidersMessage: 'Die folgenden Anbieter wurden nicht überprüft:',
            autoVerifyPrompt: 'Möchten Sie sie jetzt automatisch überprüfen?',
            cancelNote: '(Abbrechen, um ohne Speichern zurückzukehren)',
            unavailableTitle: 'Speichern nicht möglich',
            unavailableMessage: 'Die API-Schlüssel oder Modelle der folgenden Anbieter sind nicht verfügbar:',
            modelLabel: 'Modell',
            reasonLabel: 'Grund',
            reasonInvalidKey: 'Der API-Schlüssel ist ungültig oder das Modell ist nicht zugänglich.',
            solutionsTitle: 'Lösungen:',
            solution1: '1. Überprüfen Sie Ihren API-Schlüssel erneut',
            solution2: '2. Versuchen Sie, ein anderes Modell auszuwählen',
            solution3: '3. Überprüfen Sie die Berechtigungen auf der Anbieter-Website',
            uncertainTitle: 'Warnung: Unsichere Überprüfung',
            uncertainMessage: 'Einige Anbieter konnten nicht überprüft werden:',
            uncertainReason: 'Unsichere Überprüfung (Netzwerkfehler oder Ratenbegrenzung)',
            proceedQuestion: 'Möchten Sie trotzdem speichern?',
            recommendation: 'Empfehlung: Drücken Sie "Abbrechen" und versuchen Sie es erneut mit der Schaltfläche "Überprüfen".',
        },
        cacheAge: 'Aktualisiert vor {{minutes}} Min.',
        cached: 'Zwischengespeichert',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Konfigurieren Sie Ihre KI-Infrastruktur',
        openRouterNote: '※Modellinformationen basieren auf OpenRouter. Tatsächliche Verfügbarkeit kann je nach Anbieterschlüssel variieren.',
        aiProviders: 'KI-Anbieter',
        selectProvider: 'Anbieter zur Konfiguration auswählen',
        allSystemsOperational: 'Alle Systeme betriebsbereit',
        lastUpdated: 'Zuletzt aktualisiert: {{time}}',
        notYetRefreshed: 'Noch nicht aktualisiert',
        refreshModels: 'Modelle aktualisieren',
        variants: {
            default: 'Standardkonfiguration',
            free: 'Kostenlose Version ($0, mit Limits)',
            extended: 'Erweitertes Kontextfenster',
            thinking: 'Erweitertes Reasoning (Chain-of-Thought)',
            online: 'Echtzeit-Websuche (Exa.ai)',
            nitro: 'Schnellsten Anbieter priorisieren',
            floor: 'Günstigsten Anbieter priorisieren',
        },
        status: {
            available: 'Verfügbar',
            unavailable: 'Nicht verfügbar',
            uncertain: 'Verifiziert (Modellprüfung übersprungen)',
            notVerified: 'Nicht verifiziert',
            checking: 'Wird überprüft...',
            verified: 'Verifiziert',
        },
        advanced: {
            title: 'Erweiterte Einstellungen',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Frequenzstrafe',
            presencePenalty: 'Präsenzstrafe',
            seed: 'Seed',
            random: 'Zufällig',
            responseFormat: 'Antwortformat',
            text: 'Text',
            jsonObject: 'JSON-Objekt',
        },
        modelCard: {
            settings: 'Einstellungen',
            customSettings: 'Benutzerdefinierte Einstellungen',
            ctx: 'ctx',
            free: 'Kostenlos',
        },
        tooltips: {
            modelAvailable: '✅ Modell für diesen API-Schlüssel verfügbar',
            modelUnavailable: '❌ Modell nicht verfügbar (API-Schlüssel oder Modellzugang überprüfen)',
            modelUncertain: 'API-Schlüssel gültig, aber Modellverfügbarkeit kann nicht bestätigt werden. Wahrscheinlich funktionsfähig.',
            clickToVerify: 'Klicken Sie, um die Modellverfügbarkeit zu überprüfen',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'Keine Nachrichten',
        startConversation: 'Starten Sie eine Konversation mit diesem BYOK-Modell',
        attachImage: 'Bild anhängen',
        imageTooLarge: 'Bild "{{name}}" ist zu groß (max 20MB)',
        sending: 'Wird gesendet...',
        receiving: 'Empfange...',
        imagesSelected: '{{count}} Bilder ausgewählt',
        pressEnterToSend: 'Enter drücken zum Senden',
        sendMessage: 'Nachricht an dieses Modell senden...',
        attachedImage: 'Angehängtes Bild',
        preview: 'Vorschau {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Planungsphase',
        phase2Title: 'Ausführungsphase',
        phase3Title: 'Integrationsphase',
        waiting: 'Wartend',
        done: 'Fertig',
        processing: 'Verarbeitung...',
        skipWaiting: 'Warten überspringen',
    },

    // === History Popover ===
    historyPopover: {
        title: 'Verlauf',
        modelHistory: 'Modellverlauf',
        newChat: 'Neuer Chat',
        searchPlaceholder: 'Konversationen durchsuchen...',
        loading: 'Lädt...',
        noConversations: 'Keine Konversationen gefunden',
        startNewChat: 'Starten Sie einen neuen Chat und er erscheint hier',
        untitledConversation: 'Unbenannte Konversation',
        noPreview: 'Keine Vorschau',
        deleteConversation: 'Konversation löschen',
        conversationsStored: '{{count}} gespeicherte Konversationen',
        daysAgo: 'vor {{days}} Tagen',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Modelleinstellungen',
        useDefaultSettings: 'Standardeinstellungen verwenden',
        applyGlobalSettings: 'Globale BYOK-Einstellungen anwenden',
        unsaved: 'Nicht gespeichert',
        resetToDefaults: 'Auf Standard zurücksetzen',
        modelVariant: 'Modellvariante',
        enableThinking: 'Thinking aktivieren',
        noCustomSettings: 'Dieses Modell hat keine benutzerdefinierten Einstellungen.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'API-Schlüssel Einstellungen',
        byokDescription: 'Verwenden Sie OpenAI, Claude, Gemini direkt',
        openSettings: 'Einstellungen öffnen',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 Modell {{name}} hinzufügen?\n\nStarten Sie eine neue Konversation und\nkonsultieren oder fragen Sie {{name}} um Hilfe.',
        deleteModel: '❌ Modell "{{name}}" löschen?',
        newChat: '💬 Neue Konversation starten?\n\nDie aktuelle Konversation wird automatisch gespeichert,\nSie können sie jederzeit aus dem Verlauf wiederherstellen.',
        apiKeyNotSet: 'API-Schlüssel nicht konfiguriert. Aktivieren und speichern Sie den Schlüssel unter Einstellungen → BYOK.',
        modelNotSelected: 'Kein Modell ausgewählt. Bitte wählen Sie ein Modell in der BYOK-Konfiguration aus.',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: 'Denkprozess',
        showProcess: 'Denkprozess anzeigen',
        hideProcess: 'Denkprozess ausblenden',
        summary: 'Zusammenfassung',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Konversationsverlauf',
    },
};
