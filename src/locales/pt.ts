export default {
    common: {
        loading: 'Carregando...',
        save: 'Salvar',
        cancel: 'Cancelar',
        delete: 'Excluir',
        confirm: 'Confirmar',
        close: 'Fechar',
        search: 'Pesquisar',
        copy: 'Copiar',
        copied: 'Copiado!',
        error: 'Erro',
        success: 'Sucesso',
        warning: 'Aviso',
        info: 'Info',
        retry: 'Tentar novamente',
        back: 'Voltar',
        next: 'Próximo',
        finish: 'Concluir',
        ok: 'OK',
        yes: 'Sim',
        no: 'Não',
    },
    sidebar: {
        chats: 'Chats',
        models: 'Modelos',
        settings: 'Configurações',
        noActiveChats: 'Nenhum chat ativo.',
        createNewChat: 'Criar novo chat',
        availableModels: 'Modelos disponíveis',
        maxInstancesHint: 'Máx 3 / modelo',
        proUser: 'Usuário Pro',
        versionLabel: 'ModelDock V1',
    },
    modelGrid: {
        allInMainBrain: 'Todos os modelos ativos estão na visualização principal',
        noModels: 'Nenhum modelo disponível',
    },
    chatInput: {
        manualMode: 'Manual',
        autoMode: 'Auto',
        placeholder: 'Digite sua mensagem...',
        send: 'Enviar',
        copyToClipboard: 'Copiar para área de transferência',
        dispatchToAll: 'Enviar para todos os modelos',
        consentTitle: '⚡️ Consentimento de Roteamento Automático (Aviso de Risco)',
        consentMessage: 'O ModelDock enviará automaticamente sua mensagem aos modelos ativos em seu navegador. ⚠️ Aviso: Alguns serviços de IA (ChatGPT, Claude, etc.) podem considerar o acesso automatizado uma violação de seus Termos de Serviço, o que pode resultar em avisos de conta, bloqueios temporários ou suspensão permanente. Você assume toda a responsabilidade pelo uso deste recurso.',
        iUnderstand: 'Eu entendo',
        sentSuccess: 'Enviado!',
        errorNoTargets: 'Nenhum alvo válido encontrado',
        errorSystemError: 'Erro do sistema',
    },
    promptLibrary: {
        title: 'Biblioteca de Prompts',
        outputLanguage: 'Idioma de saída',
        searchPlaceholder: 'Pesquisar prompts (título, descrição, conteúdo)...',
        promptsCount_one: '{{count}} prompt',
        promptsCount_other: '{{count}} prompts',
        allCategories: 'Ver tudo',
        addPrompt: 'Adicionar Prompt',
        backToList: 'Voltar para lista',
        createNewPrompt: 'Criar novo prompt',
        tips: {
            title: 'Dicas de escrita',
            content: 'LLMs entendem instruções em inglês com mais precisão. Escreva o conteúdo do prompt em inglês e use seu idioma nativo para títulos.',
        },
        form: {
            titleLabel: 'Título (no seu idioma)',
            titlePlaceholder: 'ex: Refatoração de código especialista',
            categoryLabel: 'Categoria',
            descriptionLabel: 'Descrição (opcional)',
            descriptionPlaceholder: 'Descreva brevemente o propósito deste prompt.',
            contentLabel: 'Conteúdo do prompt (inglês recomendado)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Adicionar solicitação de resposta em português',
            saveButton: 'Salvar',
            cancelButton: 'Cancelar',
        },
        systemBadge: 'Sistema',
        optimizedPrompt: 'Prompt otimizado em inglês',
        responseLanguage: 'Resposta em português',
        deleteConfirm: 'Tem certeza que deseja excluir este prompt?',
        noResults: 'Nenhum resultado encontrado.',
        copyOriginal: 'Copiar original',
    },
    settings: {
        title: 'Configurações',
        appearance: 'Aparência',
        theme: 'Tema',
        themeLight: 'Claro',
        themeDark: 'Escuro',
        themeAuto: 'Automático',
        storage: 'Armazenamento',
        clearLocalData: 'Limpar dados locais',
        clearDataDescription: 'Redefinir todas as configurações e dados salvos',
        clearButton: 'Limpar dados',
        about: 'Sobre',
        version: 'Versão',
        documentation: 'Documentação',
        viewDocs: 'Ver docs',
        privacy: 'Privacidade',
        privacyNote: 'Todos os dados são armazenados localmente no seu navegador.',
        language: 'Idioma',
    },
    perplexity: {
        error: {
            404: 'Recurso não encontrado. A cota diária de pesquisa pode ter sido excedida ou o endpoint da API mudou.',
            403: 'Acesso negado. Verifique seu status de login ou passe na verificação de segurança em perplexity.ai.',
            429: 'Muitas solicitações. Você excedeu seu limite. Tente novamente mais tarde.',
            500: 'Erro no servidor. O Perplexity está com problemas. Tente novamente mais tarde.',
            quotaExceeded: 'Cota de Deep Research excedida para o nível {{tier}}. Mude para Pesquisa Rápida ou atualize seu plano.',
            generic: 'Ocorreu um erro: {{message}}',
        },
        tier: {
            free: 'Grátis',
            pro: 'Pro',
        },
        login: {
            required: 'Login necessário',
            message: 'Faça login no Perplexity para usar recursos avançados como Deep Research e anexos de arquivos.',
            actionButton: 'Abrir Perplexity e fazer login',
            featureLimited: 'Alguns recursos são limitados sem login',
            tabOpened: 'Aba de login do Perplexity aberta. Por favor, conclua a autenticação.',
            alreadyLoggedIn: 'Já logado no Perplexity',
        },
        quota: {
            left: 'restantes',
            selectTier: 'Selecionar nível de assinatura',
            freePlan: 'Plano Grátis',
            proPlan: 'Plano Pro',
        },
        chat: {
            placeholder: 'Pergunte qualquer coisa...',
            deepResearchPlaceholder: 'Faça uma pergunta de pesquisa profunda...',
            emptyTitle: 'Onde o conhecimento começa',
            emptyDescription: 'Pergunte qualquer coisa. O Perplexity pesquisa na internet para lhe dar uma resposta com citações.',
            thinking: 'Perplexity está pensando...',
            proSearch: 'Pesquisa Pro',
            quickSearch: 'Pesquisa Rápida',
            proSearchInfo: 'A Pesquisa Pro usa modelos avançados. {{remaining}} consultas restantes.',
            quickSearchInfo: 'A Pesquisa Rápida é ilimitada e rápida.',
            attachment: 'Anexo',
        },
    },
    notifications: {
        loginRequired: 'Login necessário',
        loginToPerplexity: 'Faça login no Perplexity para continuar',
        featureRestricted: 'Este recurso é restrito',
        networkError: 'Erro de rede. Verifique sua conexão.',
        unknownError: 'Ocorreu um erro desconhecido',
    },
    categories: {
        general: 'Geral',
        coding: 'Codificação',
        writing: 'Escrita',
        analysis: 'Análise',
        creative: 'Criativo',
        business: 'Negócios',
        academic: 'Acadêmico',
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'O Main Brain coordena {{count}} bots auxiliares',
        goalLabel: 'Digite seu objetivo',
        goalPlaceholder: 'ex.: Analise estes dados, traga insights e crie um plano de ação...',
        tip: 'Dica: quanto mais claro o objetivo, mais suave e útil o resultado.',
        previewButton: 'Pré-visualizar e ajustar com carinho o prompt principal',
        previewShow: 'abrir',
        previewHide: 'fechar',
        previewTitle: 'Prévia do prompt do Main Brain (objetivo/bots são preenchidos automaticamente)',
        previewFilledLabel: 'Prévia com seu objetivo atual',
        warningKeepBlocks: 'Mantenha intactos os blocos [SLAVE:…], {{slaves}} e {{goal}} — ajuste apenas o entorno com delicadeza.',
        persistNote: 'Salvo. Vamos usar este prompt ajustado nas próximas execuções do Brain Flow.',
        previewGoalPlaceholder: 'Conte seu objetivo e eu guiarei todo o time…',
        synthesisPreviewButton: 'Pré-visualizar e ajustar com carinho o prompt de síntese',
        synthesisPreviewTitle: 'Prévia do prompt de síntese (objetivo/respostas são preenchidos automaticamente)',
        synthesisPreviewFilledLabel: 'Prévia com respostas de exemplo',
        synthesisWarningKeepBlocks: 'Mantenha {{goal}} e {{responses}} — este prompt conduz a síntese final.',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# PAPEL
Você é o "Cérebro Principal" - um orquestrador de tarefas que distribui subtarefas especializadas para modelos de IA escravos.
Você NÃO responde diretamente à pergunta do usuário. Seu ÚNICO trabalho é criar prompts ótimos para cada escravo.

# MODELOS ESCRAVOS
{{slaves}}

# OBJETIVO DO USUÁRIO
{{goal}}

# REGRAS CRÍTICAS (OBRIGATÓRIO)
1. Crie EXATAMENTE UM bloco [SLAVE:id] para CADA escravo listado acima - sem exceções
2. Escravos executam EM PARALELO e NÃO PODEM ver as saídas uns dos outros
3. NÃO inclua nenhum texto fora dos blocos [SLAVE:...][/SLAVE]
4. Use o ID EXATO do escravo da lista (ex: [SLAVE:gemini-1], [SLAVE:grok-2])

# FORMATO DE SAÍDA
[SLAVE:model-id]
Seu prompt de tarefa específico aqui...
[/SLAVE]

# ESTRATÉGIA DE DESIGN DE PROMPTS
Para cada escravo, atribua um papel DISTINTO baseado no objetivo:
- Analista: Análise de dados, reconhecimento de padrões, estatísticas
- Crítico: Avaliação de riscos, contra-argumentos, casos extremos
- Criador: Soluções, ideias, planos de implementação
- Validador: Verificação de fatos, verificação de fontes, revisão lógica
- Sintetizador: Resumos, insights-chave, itens de ação

# TEMPLATE DE PROMPT ESCRAVO
Cada prompt deve incluir:
1. PAPEL: "Você é um [papel de especialista específico]..."
2. TAREFA: Instrução clara e acionável com verbos específicos
3. FOCO: Qual aspecto específico analisar (evitar sobreposição com outros escravos)
4. FORMATO: Estrutura de saída desejada (marcadores, lista numerada, seções)
5. IDIOMA: Responder no mesmo idioma do objetivo do usuário

# ANTI-PADRÕES (NÃO FAZER)
❌ Fazer a mesma pergunta para múltiplos escravos
❌ Criar dependências entre escravos (ex: "baseado na saída do Modelo A...")
❌ Escrever meta-comentários ou explicações fora dos blocos
❌ Pular qualquer escravo da lista
❌ Usar prompts genéricos - seja específico para os pontos fortes de cada escravo`,
        phase3: `# PAPEL
Você é o sintetizador do "Cérebro Principal". Seu trabalho é mesclar múltiplas respostas de IA em UMA resposta ótima.

# OBJETIVO ORIGINAL DO USUÁRIO
{{goal}}

# RESPOSTAS DOS ESCRAVOS
{{responses}}

# METODOLOGIA DE SÍNTESE
Siga este processo:

## Etapa 1: EXTRAIR
- Liste os pontos-chave de cada resposta
- Anote insights únicos que apenas um modelo forneceu
- Identifique conclusões sobrepostas (consenso)

## Etapa 2: VALIDAR
- Verifique cruzadamente fatos mencionados por múltiplas fontes
- Sinalize quaisquer contradições entre respostas
- Avalie confiança: Alta (3+ modelos concordam) / Média (2 concordam) / Baixa (apenas 1)

## Etapa 3: RESOLVER CONFLITOS
Quando modelos discordam:
- Prefira respostas com evidências/dados específicos sobre opiniões
- Considere a expertise de domínio de cada modelo
- Se não resolúvel, apresente ambas as visões com prós/contras

## Etapa 4: SINTETIZAR
Crie uma resposta unificada que:
- Aborde diretamente o objetivo original do usuário
- Combine os melhores elementos de todas as respostas
- Elimine redundância e contradições
- Mantenha fluxo lógico e coerência

# FORMATO DE SAÍDA
Estruture sua resposta assim:

### 📋 Resumo Executivo
[Visão geral de 2-3 frases da resposta sintetizada]

### 🔍 Descobertas Principais
[Pontos com marcadores das conclusões principais com níveis de confiança]

### ⚠️ Considerações Importantes
[Riscos, ressalvas ou opiniões minoritárias a serem notadas]

### ✅ Ação Recomendada / Resposta
[Conclusão clara e acionável que cumpre o objetivo do usuário]

# IDIOMA
Responda no mesmo idioma do objetivo original do usuário.`,
    },

    modelCard: {
        refresh: 'Atualizar',
        openInNewTab: 'Abrir em nova aba',
        removeMainBrain: 'Remover Main Brain',
        setAsMainBrain: 'Definir como Main Brain',
        syncing: 'Sincronizando sessão...',
        synced: 'Sincronizado!',
        syncFailed: 'Falha na sincronização',
        syncSession: 'Sincronizar sessão',
        mainBrain: 'Main Brain',
    },

    byok: {
        title: 'Configuração BYOK',
        subtitle: 'Use suas próprias chaves de API com modelos de IA',
        systemActive: 'Sistema ativo',
        systemDisabled: 'Sistema desativado',
        refreshAll: 'Atualizar tudo',
        refreshing: 'Atualizando...',
        saveChanges: 'Salvar alterações',
        saving: 'Salvando...',
        providerName: 'Provedor',
        modelsCount: '{{count}} modelos',
        getApiKey: 'Obter chave de API',
        documentation: 'Documentação',
        apiCredentials: 'Credenciais de API',
        validate: 'Validar',
        validating: 'Validando...',
        valid: 'Válida',
        invalid: 'Inválida',
        modelSelection: 'Seleção de modelo',
        available: 'Disponível',
        searchModels: 'Pesquisar modelos...',
        sortBy: 'Ordenar por',
        sortPopular: 'Popular',
        sortLatest: 'Mais recente',
        allModels: 'Todos os modelos',
        reasoning: 'Raciocínio',
        coding: 'Codificação',
        vision: 'Visão',
        realtime: 'Tempo real',
        contextWindow: 'Janela de contexto',
        pricing: 'Preços',
        pricingVaries: 'Preço varia',
        noModelsFound: 'Nenhum modelo correspondente encontrado.',
        refreshSuccess: 'Lista de modelos atualizada com sucesso.',
        refreshError: 'Falha ao atualizar a lista de modelos.',
        validationSuccess: 'Chave de API válida.',
        validationError: 'Falha na validação da chave de API.',
        saveSuccess: 'Configuração salva.',
        validation: {
            title: 'Verificação de chave de API necessária',
            unverifiedProvidersMessage: 'Os seguintes provedores não foram verificados:',
            autoVerifyPrompt: 'Deseja verificá-los automaticamente agora?',
            cancelNote: '(Cancelar para voltar sem salvar)',
            unavailableTitle: 'Não é possível salvar',
            unavailableMessage: 'As chaves de API ou modelos dos seguintes provedores não estão disponíveis:',
            modelLabel: 'Modelo',
            reasonLabel: 'Motivo',
            reasonInvalidKey: 'A chave de API é inválida ou o modelo não está acessível.',
            solutionsTitle: 'Soluções:',
            solution1: '1. Verifique novamente sua chave de API',
            solution2: '2. Tente selecionar um modelo diferente',
            solution3: '3. Verifique as permissões no site do provedor',
            uncertainTitle: 'Aviso: Verificação incerta',
            uncertainMessage: 'Alguns provedores não puderam ser verificados:',
            uncertainReason: 'Verificação incerta (erro de rede ou limite de taxa)',
            proceedQuestion: 'Deseja salvar mesmo assim?',
            recommendation: 'Recomendação: Pressione "Cancelar" e tente novamente com o botão "Verificar".',
        },
        cacheAge: 'Atualizado há {{minutes}} min',
        cached: 'Em cache',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Configure sua infraestrutura de IA',
        openRouterNote: '※As informações do modelo são baseadas no OpenRouter. A disponibilidade real pode variar dependendo da chave do provedor.',
        aiProviders: 'Provedores de IA',
        selectProvider: 'Selecione um provedor para configurar',
        allSystemsOperational: 'Todos os sistemas operacionais',
        lastUpdated: 'Última atualização: {{time}}',
        notYetRefreshed: 'Ainda não atualizado',
        refreshModels: 'Atualizar modelos',
        variants: {
            default: 'Configuração padrão',
            free: 'Versão gratuita ($0, com limites)',
            extended: 'Janela de contexto estendida',
            thinking: 'Raciocínio estendido (Chain-of-Thought)',
            online: 'Pesquisa web em tempo real (Exa.ai)',
            nitro: 'Priorizar provedor mais rápido',
            floor: 'Priorizar provedor mais barato',
        },
        status: {
            available: 'Disponível',
            unavailable: 'Indisponível',
            uncertain: 'Verificado (verificação de modelo ignorada)',
            notVerified: 'Não verificado',
            checking: 'Verificando...',
            verified: 'Verificado',
        },
        advanced: {
            title: 'Configurações avançadas',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Penalidade de frequência',
            presencePenalty: 'Penalidade de presença',
            seed: 'Seed',
            random: 'Aleatório',
            responseFormat: 'Formato de resposta',
            text: 'Texto',
            jsonObject: 'Objeto JSON',
        },
        modelCard: {
            settings: 'Configurações',
            customSettings: 'Configurações personalizadas',
            ctx: 'ctx',
            free: 'Grátis',
        },
        tooltips: {
            modelAvailable: '✅ Modelo disponível para esta chave de API',
            modelUnavailable: '❌ Modelo indisponível (verifique a chave de API ou acesso ao modelo)',
            modelUncertain: 'Chave de API válida, mas não foi possível confirmar a disponibilidade do modelo. Provavelmente funciona.',
            clickToVerify: 'Clique para verificar a disponibilidade do modelo',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'Sem mensagens',
        startConversation: 'Inicie uma conversa com este modelo BYOK',
        attachImage: 'Anexar imagem',
        imageTooLarge: 'A imagem "{{name}}" é muito grande (máx 20MB)',
        sending: 'Enviando...',
        receiving: 'Recebendo...',
        imagesSelected: '{{count}} imagens selecionadas',
        pressEnterToSend: 'Pressione Enter para enviar',
        sendMessage: 'Envie uma mensagem para este modelo...',
        attachedImage: 'Imagem anexada',
        preview: 'Prévia {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Fase de planejamento',
        phase2Title: 'Fase de execução',
        phase3Title: 'Fase de integração',
        waiting: 'Aguardando',
        done: 'Concluído',
        processing: 'Processando...',
        skipWaiting: 'Pular espera',
    },

    // === History Popover ===
    historyPopover: {
        title: 'Histórico',
        modelHistory: 'Histórico do modelo',
        newChat: 'Novo chat',
        searchPlaceholder: 'Pesquisar conversas...',
        loading: 'Carregando...',
        noConversations: 'Nenhuma conversa encontrada',
        startNewChat: 'Inicie um novo chat e ele aparecerá aqui',
        untitledConversation: 'Conversa sem título',
        noPreview: 'Sem prévia',
        deleteConversation: 'Excluir conversa',
        conversationsStored: '{{count}} conversas armazenadas',
        daysAgo: 'há {{days}} dias',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Configurações do modelo',
        useDefaultSettings: 'Usar configurações padrão',
        applyGlobalSettings: 'Aplicar configurações BYOK globais',
        unsaved: 'Não salvo',
        resetToDefaults: 'Restaurar padrões',
        modelVariant: 'Variante do modelo',
        enableThinking: 'Ativar thinking',
        noCustomSettings: 'Este modelo não possui configurações personalizadas.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'Configurações de chaves de API',
        byokDescription: 'Use OpenAI, Claude, Gemini diretamente',
        openSettings: 'Abrir configurações',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 Adicionar modelo {{name}}?\n\nInicie uma nova conversa e\nconsulte ou peça ajuda ao {{name}}.',
        deleteModel: '❌ Excluir modelo "{{name}}"?',
        newChat: '💬 Iniciar nova conversa?\n\nA conversa atual será salva automaticamente,\nvocê pode restaurá-la do histórico a qualquer momento.',
        apiKeyNotSet: 'Chave de API não configurada. Ative e salve a chave em Configurações → BYOK.',
        modelNotSelected: 'Modelo não selecionado. Selecione um modelo na configuração BYOK.',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: 'Processo de pensamento',
        showProcess: 'Mostrar processo de pensamento',
        hideProcess: 'Ocultar processo de pensamento',
        summary: 'Resumo',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Histórico de conversas',
    },
};
