export default {
    common: {
        loading: 'Chargement...',
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        confirm: 'Confirmer',
        close: 'Fermer',
        search: 'Rechercher',
        copy: 'Copier',
        copied: 'Copié !',
        error: 'Erreur',
        success: 'Succès',
        warning: 'Avertissement',
        info: 'Info',
        retry: 'Réessayer',
        back: 'Retour',
        next: 'Suivant',
        finish: 'Terminer',
        ok: 'OK',
        yes: 'Oui',
        no: 'Non',
        confirmDelete: 'Êtes-vous sûr de vouloir supprimer cette conversation ?',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ?',
    },
    sidebar: {
        chats: 'Discussions',
        history: 'Historique',
        models: 'Modèles',
        prompts: 'Prompts',
        settings: 'Paramètres',
        noActiveChats: 'Commencez une nouvelle conversation.',
        createNewChat: 'Nouvelle discussion',
        activeSessions: 'Sessions actives',
        availableModels: 'Modèles disponibles',
        maxInstancesHint: 'Max 3 / modèle',
        proUser: 'Utilisateur Pro',
        versionLabel: 'ModelDock V1',
        byokModels: 'Modèles BYOK',
        standardModels: 'Modèles standard',
        conversationHistory: 'Historique des conversations',
        today: 'Aujourd\'hui',
        yesterday: 'Hier',
        previous7Days: '7 derniers jours',
        older: 'Plus ancien',
        noHistory: 'Aucun historique de conversation',
        brainFlow: 'Brain Flow',
        autoRouting: 'Routage auto',
        manual: 'Manuel',
        link: 'Lien',
    },
    modelGrid: {
        allInMainBrain: 'Aucun modèle actif. Sélectionnez des modèles depuis la barre latérale.',
        noModels: 'Aucun modèle disponible',
    },
    chatInput: {
        manualMode: 'Manuel',
        autoMode: 'Auto',
        placeholder: 'Posez une question au modèle IA...',
        send: 'Envoyer',
        copyToClipboard: 'Copier dans le presse-papiers',
        dispatchToAll: 'Envoyer à tous les modèles',
        consentTitle: '⚡️ Consentement de routage auto (Avertissement de risque)',
        consentMessage: 'ModelDock envoie automatiquement votre message aux modèles actifs dans votre navigateur. ⚠️ Attention: Certains services d\'IA (ChatGPT, Claude, etc.) peuvent considérer l\'accès automatisé comme une violation de leurs Conditions d\'Utilisation, ce qui pourrait entraîner des avertissements de compte, des blocages temporaires ou une suspension permanente. Vous assumez l\'entière responsabilité de l\'utilisation de cette fonctionnalité.',
        iUnderstand: 'Je comprends',
        sentSuccess: 'Envoyé !',
        errorNoTargets: 'Aucune cible valide trouvée',
        errorSystemError: 'Erreur système',
    },
    promptLibrary: {
        title: 'Bibliothèque de prompts',
        outputLanguage: 'Langue de sortie',
        searchPlaceholder: 'Rechercher des prompts (titre, description, contenu)...',
        promptsCount_one: '{{count}} prompt',
        promptsCount_other: '{{count}} prompts',
        allCategories: 'Tout voir',
        addPrompt: 'Ajouter un prompt',
        backToList: 'Retour à la liste',
        createNewPrompt: 'Créer un nouveau prompt',
        tips: {
            title: 'Conseils de rédaction',
            content: 'Les LLM comprennent mieux les instructions en anglais. Écrivez le contenu du prompt en anglais et utilisez votre langue maternelle pour les titres.',
        },
        form: {
            titleLabel: 'Titre (dans votre langue)',
            titlePlaceholder: 'ex: Refactoring de code expert',
            categoryLabel: 'Catégorie',
            descriptionLabel: 'Description (optionnel)',
            descriptionPlaceholder: 'Décrivez brièvement le but de ce prompt.',
            contentLabel: 'Contenu du prompt (anglais recommandé)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Ajouter une demande de réponse en français',
            saveButton: 'Enregistrer',
            cancelButton: 'Annuler',
        },
        systemBadge: 'Système',
        optimizedPrompt: 'Prompt optimisé en anglais',
        responseLanguage: 'Réponse en français',
        deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce prompt ?',
        noResults: 'Aucun résultat trouvé.',
        copyOriginal: 'Copier l\'original',
    },
    settings: {
        title: 'Paramètres',
        appearance: 'Apparence',
        theme: 'Thème',
        themeLight: 'Clair',
        themeDark: 'Sombre',
        themeAuto: 'Auto',
        storage: 'Stockage',
        clearLocalData: 'Effacer les données locales',
        clearDataDescription: 'Réinitialiser tous les paramètres et données enregistrées',
        clearButton: 'Effacer les données',
        about: 'À propos',
        version: 'Version',
        documentation: 'Documentation',
        viewDocs: 'Voir la doc',
        privacy: 'Confidentialité',
        privacyNote: 'Toutes les données sont stockées localement dans votre navigateur.',
        language: 'Langue',
    },
    perplexity: {
        error: {
            404: 'Ressource introuvable. Le quota de recherche quotidien peut être dépassé ou le point de terminaison de l\'API a changé.',
            403: 'Accès refusé. Veuillez vérifier votre statut de connexion ou passer le contrôle de sécurité sur perplexity.ai.',
            429: 'Trop de requêtes. Vous avez dépassé votre limite. Veuillez réessayer plus tard.',
            500: 'Erreur serveur. Perplexity rencontre des problèmes. Veuillez réessayer plus tard.',
            quotaExceeded: 'Quota Deep Research dépassé pour le niveau {{tier}}. Passez à la recherche rapide ou mettez à niveau votre plan.',
            generic: 'Une erreur est survenue : {{message}}',
        },
        tier: {
            free: 'Gratuit',
            pro: 'Pro',
        },
        login: {
            required: 'Connexion requise',
            message: 'Veuillez vous connecter à Perplexity pour utiliser des fonctionnalités avancées comme Deep Research et les pièces jointes.',
            actionButton: 'Ouvrir Perplexity et se connecter',
            featureLimited: 'Certaines fonctionnalités sont limitées sans connexion',
            tabOpened: 'Onglet de connexion Perplexity ouvert. Veuillez terminer l\'authentification.',
            alreadyLoggedIn: 'Déjà connecté à Perplexity',
        },
        quota: {
            left: 'restants',
            selectTier: 'Sélectionner le niveau d\'abonnement',
            freePlan: 'Plan Gratuit',
            proPlan: 'Plan Pro',
        },
        chat: {
            placeholder: 'Demandez n\'importe quoi...',
            deepResearchPlaceholder: 'Posez une question de recherche approfondie...',
            emptyTitle: 'Là où commence la connaissance',
            emptyDescription: 'Demandez n\'importe quoi. Perplexity recherche sur internet pour vous donner une réponse avec des citations.',
            thinking: 'Perplexity réfléchit...',
            proSearch: 'Recherche Pro',
            quickSearch: 'Recherche Rapide',
            proSearchInfo: 'La Recherche Pro utilise des modèles avancés. {{remaining}} requêtes restantes.',
            quickSearchInfo: 'La Recherche Rapide est illimitée et rapide.',
            attachment: 'Pièce jointe',
        },
    },
    notifications: {
        loginRequired: 'Connexion requise',
        loginToPerplexity: 'Veuillez vous connecter à Perplexity pour continuer',
        featureRestricted: 'Cette fonctionnalité est restreinte',
        networkError: 'Erreur réseau. Veuillez vérifier votre connexion.',
        unknownError: 'Une erreur inconnue est survenue',
    },
    categories: {
        general: 'Général',
        coding: 'Codage',
        writing: 'Écriture',
        analysis: 'Analyse',
        creative: 'Créatif',
        business: 'Affaires',
        academic: 'Académique',
    },

    // === Carte de Modèle ===
    modelCard: {
        refresh: 'Actualiser',
        openInNewTab: 'Ouvrir dans un nouvel onglet',
        removeMainBrain: 'Retirer le Main Brain',
        setAsMainBrain: 'Définir comme Main Brain',
        syncing: 'Synchronisation de la session...',
        synced: 'Synchronisé !',
        syncFailed: 'Échec de synchronisation',
        syncSession: 'Synchroniser la session',
        mainBrain: 'Main Brain',
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'Le Main Brain orchestre {{count}} bots esclaves',
        goalLabel: 'Indique ton objectif',
        goalPlaceholder: 'ex : Analyse ces données, trouve des insights, crée un plan d’action...',
        tip: 'Astuce : plus ton objectif est clair, plus la réponse sera douce et utile.',
        previewButton: 'Prévisualiser et ajuster en douceur le prompt principal',
        previewShow: 'ouvrir',
        previewHide: 'fermer',
        previewTitle: 'Aperçu du prompt Main Brain (objectif/bots se remplissent automatiquement)',
        previewFilledLabel: 'Aperçu avec ton objectif actuel',
        warningKeepBlocks: 'Garde intacts les blocs [SLAVE:…], {{slaves}} et {{goal}} — ajuste seulement le reste en douceur.',
        persistNote: 'Enregistré. Nous réutiliserons ce prompt ajusté pour les prochains Brain Flow.',
        previewGoalPlaceholder: "Dis-moi ton objectif, je guiderai toute l'équipe…",
        synthesisPreviewButton: 'Prévisualiser et ajuster en douceur le prompt de synthèse',
        synthesisPreviewTitle: 'Aperçu du prompt de synthèse (objectif/réponses se remplissent automatiquement)',
        synthesisPreviewFilledLabel: "Aperçu avec des réponses d'exemple",
        synthesisWarningKeepBlocks: 'Garde {{goal}} et {{responses}} tels quels — ce prompt pilote la synthèse finale.',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# RÔLE
Vous êtes le "Main Brain" - un orchestrateur de tâches qui distribue des sous-tâches spécialisées aux modèles IA esclaves.
Vous ne répondez PAS directement à la question de l'utilisateur. Votre SEUL travail est de créer des prompts optimaux pour chaque esclave.

# MODÈLES ESCLAVES
{{slaves}}

# OBJECTIF DE L'UTILISATEUR
{{goal}}

# RÈGLES CRITIQUES (À SUIVRE IMPÉRATIVEMENT)
1. Créez EXACTEMENT UN bloc [SLAVE:id] pour CHAQUE esclave listé ci-dessus - sans exception
2. Les esclaves s'exécutent EN PARALLÈLE et NE PEUVENT PAS voir les sorties des autres
3. N'incluez AUCUN texte en dehors des blocs [SLAVE:...][/SLAVE]
4. Utilisez l'ID EXACT de l'esclave de la liste (ex: [SLAVE:gemini-1], [SLAVE:grok-2])

# FORMAT DE SORTIE
[SLAVE:model-id]
Votre prompt de tâche spécifique ici...
[/SLAVE]

# STRATÉGIE DE CONCEPTION DES PROMPTS
Pour chaque esclave, attribuez un rôle DISTINCT basé sur l'objectif:
- Analyste: Analyse de données, reconnaissance de motifs, statistiques
- Critique: Évaluation des risques, contre-arguments, cas limites
- Créateur: Solutions, idées, plans d'implémentation
- Validateur: Vérification des faits, vérification des sources, revue logique
- Synthétiseur: Résumés, insights clés, points d'action

# MODÈLE DE PROMPT ESCLAVE
Chaque prompt doit inclure:
1. RÔLE: "Vous êtes un [rôle d'expert spécifique]..."
2. TÂCHE: Instruction claire et actionnable avec des verbes spécifiques
3. FOCUS: Quel aspect spécifique analyser (éviter le chevauchement avec d'autres esclaves)
4. FORMAT: Structure de sortie souhaitée (puces, liste numérotée, sections)
5. LANGUE: Répondre dans la même langue que l'objectif de l'utilisateur

# ANTI-PATTERNS (À NE PAS FAIRE)
❌ Poser la même question à plusieurs esclaves
❌ Créer des dépendances entre esclaves (ex: "basé sur la sortie du Modèle A...")
❌ Écrire des méta-commentaires ou explications en dehors des blocs
❌ Omettre un esclave de la liste
❌ Utiliser des prompts génériques - soyez spécifique aux forces de chaque esclave`,
        phase3: `# RÔLE
Vous êtes le synthétiseur "Main Brain". Votre travail est de fusionner plusieurs réponses IA en UNE réponse optimale.

# OBJECTIF ORIGINAL DE L'UTILISATEUR
{{goal}}

# RÉPONSES DES ESCLAVES
{{responses}}

# MÉTHODOLOGIE DE SYNTHÈSE
Suivez ce processus:

## Étape 1: EXTRAIRE
- Listez les points clés de chaque réponse
- Notez les insights uniques fournis par un seul modèle
- Identifiez les conclusions qui se chevauchent (consensus)

## Étape 2: VALIDER
- Vérifiez les faits mentionnés par plusieurs sources
- Signalez les contradictions entre les réponses
- Évaluez la confiance: Haute (3+ modèles d'accord) / Moyenne (2 d'accord) / Basse (1 seul)

## Étape 3: RÉSOUDRE LES CONFLITS
Quand les modèles ne sont pas d'accord:
- Préférez les réponses avec des preuves/données spécifiques aux opinions
- Considérez l'expertise de domaine de chaque modèle
- Si insoluble, présentez les deux vues avec avantages/inconvénients

## Étape 4: SYNTHÉTISER
Créez une réponse unifiée qui:
- Répond directement à l'objectif original de l'utilisateur
- Combine les meilleurs éléments de toutes les réponses
- Élimine la redondance et les contradictions
- Maintient un flux logique et une cohérence

# FORMAT DE SORTIE
Structurez votre réponse ainsi:

### 📋 Résumé Exécutif
[Aperçu en 2-3 phrases de la réponse synthétisée]

### 🔍 Conclusions Clés
[Points à puces des conclusions principales avec niveaux de confiance]

### ⚠️ Considérations Importantes
[Risques, mises en garde ou opinions minoritaires à noter]

### ✅ Action Recommandée / Réponse
[Conclusion claire et actionnable qui répond à l'objectif de l'utilisateur]

# LANGUE
Répondez dans la même langue que l'objectif original de l'utilisateur.`,
    },

    byok: {
        title: 'Configuration BYOK',
        subtitle: 'Utilisez vos propres clés API avec les modèles IA',
        systemActive: 'Système actif',
        systemDisabled: 'Système désactivé',
        refreshAll: 'Tout actualiser',
        refreshing: 'Actualisation...',
        saveChanges: 'Enregistrer les modifications',
        saving: 'Enregistrement...',
        providerName: 'Fournisseur',
        modelsCount: '{{count}} modèles',
        getApiKey: 'Obtenir une clé API',
        documentation: 'Documentation',
        apiCredentials: 'Identifiants API',
        validate: 'Valider',
        validating: 'Validation...',
        valid: 'Valide',
        invalid: 'Invalide',
        modelSelection: 'Sélection du modèle',
        available: 'Disponible',
        searchModels: 'Rechercher des modèles...',
        sortBy: 'Trier par',
        sortPopular: 'Populaire',
        sortLatest: 'Plus récent',
        allModels: 'Tous les modèles',
        reasoning: 'Raisonnement',
        coding: 'Codage',
        vision: 'Vision',
        realtime: 'Temps réel',
        contextWindow: 'Fenêtre de contexte',
        pricing: 'Tarification',
        pricingVaries: 'Prix variable',
        noModelsFound: 'Aucun modèle correspondant trouvé.',
        refreshSuccess: 'Liste des modèles actualisée avec succès.',
        refreshError: 'Échec de l\'actualisation de la liste des modèles.',
        validationSuccess: 'Clé API valide.',
        validationError: 'Échec de la validation de la clé API.',
        saveSuccess: 'Configuration enregistrée.',
        validation: {
            title: 'Vérification de la clé API requise',
            unverifiedProvidersMessage: 'Les fournisseurs suivants n\'ont pas été vérifiés:',
            autoVerifyPrompt: 'Voulez-vous les vérifier automatiquement maintenant?',
            cancelNote: '(Annuler pour revenir sans sauvegarder)',
            unavailableTitle: 'Impossible de sauvegarder',
            unavailableMessage: 'Les clés API ou les modèles des fournisseurs suivants ne sont pas disponibles:',
            modelLabel: 'Modèle',
            reasonLabel: 'Raison',
            reasonInvalidKey: 'La clé API est invalide ou le modèle n\'est pas accessible.',
            solutionsTitle: 'Solutions:',
            solution1: '1. Vérifiez à nouveau votre clé API',
            solution2: '2. Essayez de sélectionner un modèle différent',
            solution3: '3. Vérifiez les autorisations sur le site du fournisseur',
            uncertainTitle: 'Avertissement: Vérification incertaine',
            uncertainMessage: 'Certains fournisseurs n\'ont pas pu être vérifiés:',
            uncertainReason: 'Vérification incertaine (erreur réseau ou limite de débit)',
            proceedQuestion: 'Voulez-vous quand même sauvegarder?',
            recommendation: 'Recommandation: Appuyez sur "Annuler" et réessayez avec le bouton "Vérifier".',
        },
        cacheAge: 'Mis à jour il y a {{minutes}} min',
        cached: 'En cache',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Configurez votre infrastructure IA',
        openRouterNote: '※Les informations du modèle sont basées sur OpenRouter. La disponibilité réelle peut varier selon la clé du fournisseur.',
        aiProviders: 'Fournisseurs IA',
        selectProvider: 'Sélectionnez un fournisseur à configurer',
        allSystemsOperational: 'Tous les systèmes opérationnels',
        lastUpdated: 'Dernière mise à jour: {{time}}',
        notYetRefreshed: 'Pas encore actualisé',
        refreshModels: 'Actualiser les modèles',
        variants: {
            default: 'Configuration par défaut',
            free: 'Version gratuite ($0, avec limites)',
            extended: 'Fenêtre de contexte étendue',
            thinking: 'Raisonnement étendu (Chain-of-Thought)',
            online: 'Recherche web en temps réel (Exa.ai)',
            nitro: 'Prioriser le fournisseur le plus rapide',
            floor: 'Prioriser le fournisseur le moins cher',
        },
        status: {
            available: 'Disponible',
            unavailable: 'Indisponible',
            uncertain: 'Vérifié (vérification du modèle ignorée)',
            notVerified: 'Non vérifié',
            checking: 'Vérification...',
            verified: 'Vérifié',
        },
        advanced: {
            title: 'Configuration avancée',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Pénalité de fréquence',
            presencePenalty: 'Pénalité de présence',
            seed: 'Graine',
            random: 'Aléatoire',
            responseFormat: 'Format de réponse',
            text: 'Texte',
            jsonObject: 'Objet JSON',
        },
        modelCard: {
            settings: 'Paramètres',
            customSettings: 'Configuration personnalisée',
            ctx: 'ctx',
            free: 'Gratuit',
        },
        tooltips: {
            modelAvailable: '✅ Modèle disponible pour cette clé API',
            modelUnavailable: '❌ Modèle indisponible (vérifiez la clé API ou l\'accès au modèle)',
            modelUncertain: 'Clé API valide, mais impossible de confirmer la disponibilité du modèle. Probablement fonctionnel.',
            clickToVerify: 'Cliquez pour vérifier la disponibilité du modèle',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'Aucun message',
        startConversation: 'Commencez une conversation avec ce modèle BYOK',
        attachImage: 'Joindre une image',
        imageTooLarge: 'L\'image "{{name}}" est trop grande (max 20Mo)',
        sending: 'Envoi...',
        receiving: 'Réception...',
        imagesSelected: '{{count}} images sélectionnées',
        pressEnterToSend: 'Appuyez sur Entrée pour envoyer',
        sendMessage: 'Envoyez un message à ce modèle...',
        attachedImage: 'Image jointe',
        preview: 'Aperçu {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Phase de planification',
        phase2Title: 'Phase d\'exécution',
        phase3Title: 'Phase d\'intégration',
        waiting: 'En attente',
        done: 'Terminé',
        processing: 'Traitement...',
        skipWaiting: 'Passer l\'attente',
    },

    // === History Popover ===
    historyPopover: {
        title: 'Historique',
        modelHistory: 'Historique du modèle',
        newChat: 'Nouvelle discussion',
        searchPlaceholder: 'Rechercher des conversations...',
        loading: 'Chargement...',
        noConversations: 'Aucune conversation trouvée',
        startNewChat: 'Commencez une nouvelle discussion et elle apparaîtra ici',
        untitledConversation: 'Conversation sans titre',
        noPreview: 'Pas d\'aperçu',
        deleteConversation: 'Supprimer la conversation',
        conversationsStored: '{{count}} conversations stockées',
        daysAgo: 'il y a {{days}} jours',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Paramètres du modèle',
        useDefaultSettings: 'Utiliser les paramètres par défaut',
        applyGlobalSettings: 'Appliquer la configuration BYOK globale',
        unsaved: 'Non enregistré',
        resetToDefaults: 'Réinitialiser aux valeurs par défaut',
        modelVariant: 'Variante du modèle',
        enableThinking: 'Activer la réflexion',
        noCustomSettings: 'Ce modèle n\'a pas de configuration personnalisée.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'Configuration des clés API',
        byokDescription: 'Utilisez OpenAI, Claude, Gemini directement',
        openSettings: 'Ouvrir les paramètres',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 Ajouter le modèle {{name}} ?\n\nCommencez une nouvelle conversation et\nconsultez ou demandez de l\'aide à {{name}}.',
        deleteModel: '❌ Supprimer le modèle "{{name}}" ?',
        newChat: '💬 Commencer une nouvelle conversation ?\n\nLa conversation actuelle sera automatiquement enregistrée,\nvous pouvez la restaurer depuis l\'historique à tout moment.',
        apiKeyNotSet: 'Clé API non configurée. Activez et enregistrez la clé dans Paramètres → BYOK.',
        modelNotSelected: 'Modèle non sélectionné. Sélectionnez un modèle dans la configuration BYOK.',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: 'Processus de réflexion',
        showProcess: 'Afficher le processus de réflexion',
        hideProcess: 'Masquer le processus de réflexion',
        summary: 'Résumé',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Historique des conversations',
    },
};
