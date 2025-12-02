export default {
    common: {
        loading: 'Cargando...',
        save: 'Guardar',
        cancel: 'Cancelar',
        delete: 'Eliminar',
        confirm: 'Confirmar',
        close: 'Cerrar',
        search: 'Buscar',
        copy: 'Copiar',
        copied: '¡Copiado!',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información',
        retry: 'Reintentar',
        back: 'Atrás',
        next: 'Siguiente',
        finish: 'Finalizar',
        ok: 'Aceptar',
        yes: 'Sí',
        no: 'No',
        confirmDelete: '¿Estás seguro de que quieres eliminar esta conversación?',
        deleteConfirm: '¿Estás seguro de que quieres eliminar?',
    },
    sidebar: {
        chats: 'Chats',
        history: 'Historial',
        models: 'Modelos',
        prompts: 'Prompts',
        settings: 'Ajustes',
        noActiveChats: 'Comienza una nueva conversación.',
        createNewChat: 'Crear nuevo chat',
        activeSessions: 'Sesiones activas',
        availableModels: 'Modelos disponibles',
        maxInstancesHint: 'Máx 3 / modelo',
        proUser: 'Usuario Pro',
        versionLabel: 'ModelDock V1',
        byokModels: 'Modelos BYOK',
        standardModels: 'Modelos estándar',
        conversationHistory: 'Historial de conversaciones',
        today: 'Hoy',
        yesterday: 'Ayer',
        previous7Days: 'Últimos 7 días',
        older: 'Más antiguo',
        noHistory: 'Sin historial de conversaciones',
        brainFlow: 'Brain Flow',
        autoRouting: 'Enrutamiento automático',
        manual: 'Manual',
        link: 'Enlace',
    },
    modelGrid: {
        allInMainBrain: 'Sin modelos activos. Selecciona modelos desde la barra lateral.',
        noModels: 'No hay modelos disponibles',
    },
    chatInput: {
        manualMode: 'Manual',
        autoMode: 'Auto',
        placeholder: 'Haz una pregunta al modelo de IA...',
        send: 'Enviar',
        copyToClipboard: 'Copiar al portapapeles',
        dispatchToAll: 'Enviar a todos los modelos',
        consentTitle: '⚡️ Consentimiento de Enrutamiento Automático (Divulgación de Riesgos)',
        consentMessage: 'ModelDock enviará automáticamente tu mensaje a los modelos activos en tu navegador. ⚠️ Advertencia: Algunos servicios de IA (ChatGPT, Claude, etc.) pueden considerar el acceso automatizado como una violación de sus Términos de Servicio, lo que podría resultar en advertencias de cuenta, bloqueos temporales o suspensión permanente. Asumes toda la responsabilidad por el uso de esta función.',
        iUnderstand: 'Entiendo',
        sentSuccess: '¡Enviado!',
        errorNoTargets: 'No se encontraron objetivos válidos',
        errorSystemError: 'Error del sistema',
    },
    promptLibrary: {
        title: 'Biblioteca de Prompts',
        outputLanguage: 'Idioma de salida',
        searchPlaceholder: 'Buscar prompts (título, descripción, contenido)...',
        promptsCount_one: '{{count}} prompt',
        promptsCount_other: '{{count}} prompts',
        allCategories: 'Ver todo',
        addPrompt: 'Añadir Prompt',
        backToList: 'Volver a la lista',
        createNewPrompt: 'Crear nuevo prompt',
        tips: {
            title: 'Consejos de escritura',
            content: 'Los LLM entienden mejor las instrucciones en inglés. Escribe el contenido del prompt en inglés y usa tu idioma nativo para los títulos.',
        },
        form: {
            titleLabel: 'Título (en tu idioma)',
            titlePlaceholder: 'ej. Refactorización de código experto',
            categoryLabel: 'Categoría',
            descriptionLabel: 'Descripción (opcional)',
            descriptionPlaceholder: 'Describe brevemente el propósito de este prompt.',
            contentLabel: 'Contenido del prompt (se recomienda inglés)',
            contentPlaceholder: 'You are an expert...',
            addLanguageRequest: '+ Añadir solicitud de respuesta en español',
            saveButton: 'Guardar',
            cancelButton: 'Cancelar',
        },
        systemBadge: 'Sistema',
        optimizedPrompt: 'Prompt optimizado en inglés',
        responseLanguage: 'Respuesta en español',
        deleteConfirm: '¿Estás seguro de que quieres eliminar este prompt?',
        noResults: 'No se encontraron resultados.',
        copyOriginal: 'Copiar original',
    },
    settings: {
        title: 'Ajustes',
        appearance: 'Apariencia',
        theme: 'Tema',
        themeLight: 'Claro',
        themeDark: 'Oscuro',
        themeAuto: 'Automático',
        storage: 'Almacenamiento',
        clearLocalData: 'Borrar datos locales',
        clearDataDescription: 'Restablecer todos los ajustes y datos guardados',
        clearButton: 'Borrar datos',
        about: 'Acerca de',
        version: 'Versión',
        documentation: 'Documentación',
        viewDocs: 'Ver documentos',
        privacy: 'Privacidad',
        privacyNote: 'Todos los datos se almacenan localmente en tu navegador.',
        language: 'Idioma',
    },
    perplexity: {
        error: {
            404: 'Recurso no encontrado. Es posible que se haya excedido la cuota diaria o que el punto final de la API haya cambiado.',
            403: 'Acceso denegado. Por favor, verifica tu estado de inicio de sesión o pasa la verificación de seguridad en perplexity.ai.',
            429: 'Demasiadas solicitudes. Has excedido tu límite de velocidad. Inténtalo de nuevo más tarde.',
            500: 'Error del servidor. Perplexity tiene problemas. Inténtalo de nuevo más tarde.',
            quotaExceeded: 'Cuota de Deep Research excedida para el nivel {{tier}}. Cambia a Búsqueda Rápida o actualiza tu plan.',
            generic: 'Ocurrió un error: {{message}}',
        },
        tier: {
            free: 'Gratis',
            pro: 'Pro',
        },
        login: {
            required: 'Inicio de sesión necesario',
            message: 'Por favor, inicia sesión en Perplexity para usar funciones avanzadas como Deep Research y archivos adjuntos.',
            actionButton: 'Abrir Perplexity e iniciar sesión',
            featureLimited: 'Algunas funciones están limitadas sin iniciar sesión',
            tabOpened: 'Pestaña de inicio de sesión de Perplexity abierta. Por favor completa la autenticación.',
            alreadyLoggedIn: 'Ya has iniciado sesión en Perplexity',
        },
        quota: {
            left: 'restantes',
            selectTier: 'Seleccionar nivel de suscripción',
            freePlan: 'Plan Gratis',
            proPlan: 'Plan Pro',
        },
        chat: {
            placeholder: 'Pregunta cualquier cosa...',
            deepResearchPlaceholder: 'Haz una pregunta de investigación profunda...',
            emptyTitle: 'Donde comienza el conocimiento',
            emptyDescription: 'Pregunta cualquier cosa. Perplexity busca en internet para darte una respuesta con citas.',
            thinking: 'Perplexity está pensando...',
            proSearch: 'Búsqueda Pro',
            quickSearch: 'Búsqueda Rápida',
            proSearchInfo: 'La Búsqueda Pro utiliza modelos avanzados. {{remaining}} consultas restantes.',
            quickSearchInfo: 'La Búsqueda Rápida es ilimitada y rápida.',
            attachment: 'Adjunto',
        },
    },
    notifications: {
        loginRequired: 'Inicio de sesión necesario',
        loginToPerplexity: 'Por favor inicia sesión en Perplexity para continuar',
        featureRestricted: 'Esta función está restringida',
        networkError: 'Error de red. Por favor verifica tu conexión.',
        unknownError: 'Ocurrió un error desconocido',
    },
    categories: {
        general: 'General',
        coding: 'Programación',
        writing: 'Escritura',
        analysis: 'Análisis',
        creative: 'Creativo',
        business: 'Negocios',
        academic: 'Académico',
    },

    // === Tarjeta de Modelo ===
    modelCard: {
        refresh: 'Actualizar',
        openInNewTab: 'Abrir en nueva pestaña',
        removeMainBrain: 'Quitar Cerebro Principal',
        setAsMainBrain: 'Establecer como Cerebro Principal',
        syncing: 'Sincronizando sesión...',
        synced: '¡Sincronizado!',
        syncFailed: 'Sincronización fallida',
        syncSession: 'Sincronizar sesión',
        mainBrain: 'Cerebro Principal',
    },

    brainFlowModal: {
        title: '🧠 Brain Flow',
        subtitle: 'El Cerebro Principal coordina {{count}} bots',
        goalLabel: 'Ingresa tu objetivo',
        goalPlaceholder: 'p. ej., Analiza estos datos, obtén ideas y crea un plan de ejecución...',
        tip: 'Consejo: mientras más claro el objetivo, mejores resultados.',
        startButton: 'Iniciar Brain Flow',
        errorNoMainBrain: 'Por favor, designa un Cerebro Principal primero.',
        errorNoSlaves: 'Se necesita al menos otro modelo para ejecutar Brain Flow.',
        errorNotSupported: 'El Cerebro Principal seleccionado ({modelName}) no soporta Brain Flow. (ej. herramientas de Vibe Coding)',
        warningExcludedModels: 'Algunos modelos fueron excluidos porque no soportan Brain Flow.',
        excludedMessage: 'Los siguientes modelos serán excluidos de Brain Flow: {{models}}',
        previewButton: 'Vista previa y ajuste del prompt principal',
        previewShow: 'abrir',
        previewHide: 'cerrar',
        previewTitle: 'Vista previa del prompt del Cerebro Principal',
        previewFilledLabel: 'Vista previa con tu objetivo actual',
        warningKeepBlocks: 'Mantén intactos los bloques [SLAVE:...], {{slaves}} y {{goal}}.',
        persistNote: 'Guardado. Usaremos este prompt en futuras ejecuciones de Brain Flow.',
        previewGoalPlaceholder: 'Cuéntame tu objetivo...',
        synthesisPreviewButton: 'Vista previa y ajuste del prompt de síntesis',
        synthesisPreviewTitle: 'Vista previa del prompt de síntesis',
        synthesisPreviewFilledLabel: 'Vista previa con respuestas de ejemplo',
        synthesisWarningKeepBlocks: 'Mantén intactos {{goal}} y {{responses}}.',
    },

    // === Brain Flow ===
    brainFlow: {
        phase1: `# ROL
Eres el "Cerebro Principal" - un orquestador de tareas que distribuye subtareas especializadas a los modelos de IA esclavos.
NO respondes directamente a la pregunta del usuario. Tu ÚNICO trabajo es crear prompts óptimos para cada esclavo.

# MODELOS ESCLAVOS
{{slaves}}

# OBJETIVO DEL USUARIO
{{goal}}

# REGLAS CRÍTICAS (OBLIGATORIO)
1. Crea EXACTAMENTE UN bloque [SLAVE:id] para CADA esclavo listado arriba - sin excepciones
2. Los esclavos se ejecutan EN PARALELO y NO PUEDEN ver las salidas de los demás
3. NO incluyas ningún texto fuera de los bloques [SLAVE:...][/SLAVE]
4. Usa el ID EXACTO del esclavo de la lista (ej: [SLAVE:gemini-1], [SLAVE:grok-2])

# FORMATO DE SALIDA
[SLAVE:model-id]
Tu prompt de tarea específico aquí...
[/SLAVE]

# ESTRATEGIA DE DISEÑO DE PROMPTS
Para cada esclavo, asigna un rol DISTINTO basado en el objetivo:
- Analista: Análisis de datos, reconocimiento de patrones, estadísticas
- Crítico: Evaluación de riesgos, contraargumentos, casos límite
- Creador: Soluciones, ideas, planes de implementación
- Validador: Verificación de hechos, verificación de fuentes, revisión lógica
- Sintetizador: Resúmenes, insights clave, elementos de acción

# PLANTILLA DE PROMPT ESCLAVO
Cada prompt debe incluir:
1. ROL: "Eres un [rol de experto específico]..."
2. TAREA: Instrucción clara y accionable con verbos específicos
3. ENFOQUE: Qué aspecto específico analizar (evitar superposición con otros esclavos)
4. FORMATO: Estructura de salida deseada (viñetas, lista numerada, secciones)
5. IDIOMA: Responder en el mismo idioma que el objetivo del usuario

# ANTI-PATRONES (NO HACER)
❌ Hacer la misma pregunta a múltiples esclavos
❌ Crear dependencias entre esclavos (ej: "basado en la salida del Modelo A...")
❌ Escribir meta-comentarios o explicaciones fuera de los bloques
❌ Omitir cualquier esclavo de la lista
❌ Usar prompts genéricos - sé específico para las fortalezas de cada esclavo`,
        phase3: `# ROL
Eres el sintetizador del "Cerebro Principal". Tu trabajo es fusionar múltiples respuestas de IA en UNA respuesta óptima.

# OBJETIVO ORIGINAL DEL USUARIO
{{goal}}

# RESPUESTAS DE LOS ESCLAVOS
{{responses}}

# METODOLOGÍA DE SÍNTESIS
Sigue este proceso:

## Paso 1: EXTRAER
- Lista los puntos clave de cada respuesta
- Anota los insights únicos que solo un modelo proporcionó
- Identifica las conclusiones superpuestas (consenso)

## Paso 2: VALIDAR
- Verifica cruzadamente los hechos mencionados por múltiples fuentes
- Marca cualquier contradicción entre respuestas
- Evalúa confianza: Alta (3+ modelos de acuerdo) / Media (2 de acuerdo) / Baja (solo 1)

## Paso 3: RESOLVER CONFLICTOS
Cuando los modelos no están de acuerdo:
- Prefiere respuestas con evidencia/datos específicos sobre opiniones
- Considera la experiencia de dominio de cada modelo
- Si no es resoluble, presenta ambas vistas con pros/contras

## Paso 4: SINTETIZAR
Crea una respuesta unificada que:
- Aborde directamente el objetivo original del usuario
- Combine los mejores elementos de todas las respuestas
- Elimine la redundancia y las contradicciones
- Mantenga el flujo lógico y la coherencia

# FORMATO DE SALIDA
Estructura tu respuesta así:

### 📋 Resumen Ejecutivo
[Vista general de 2-3 oraciones de la respuesta sintetizada]

### 🔍 Hallazgos Clave
[Puntos con viñetas de las conclusiones principales con niveles de confianza]

### ⚠️ Consideraciones Importantes
[Riesgos, advertencias u opiniones minoritarias a tener en cuenta]

### ✅ Acción Recomendada / Respuesta
[Conclusión clara y accionable que cumple el objetivo del usuario]

# IDIOMA
Responde en el mismo idioma que el objetivo original del usuario.`,
    },

    byok: {
        title: 'Configuración BYOK',
        subtitle: 'Usa tus propias claves API con modelos de IA',
        systemActive: 'Sistema activo',
        systemDisabled: 'Sistema desactivado',
        refreshAll: 'Actualizar todo',
        refreshing: 'Actualizando...',
        saveChanges: 'Guardar cambios',
        saving: 'Guardando...',
        providerName: 'Proveedor',
        modelsCount: '{{count}} modelos',
        getApiKey: 'Obtener clave API',
        documentation: 'Documentación',
        apiCredentials: 'Credenciales API',
        validate: 'Validar',
        validating: 'Validando...',
        valid: 'Válida',
        invalid: 'Inválida',
        modelSelection: 'Selección de modelo',
        available: 'Disponible',
        searchModels: 'Buscar modelos...',
        sortBy: 'Ordenar por',
        sortPopular: 'Popular',
        sortLatest: 'Más reciente',
        allModels: 'Todos los modelos',
        reasoning: 'Razonamiento',
        coding: 'Programación',
        vision: 'Visión',
        realtime: 'Tiempo real',
        contextWindow: 'Ventana de contexto',
        pricing: 'Precio',
        pricingVaries: 'Precio variable',
        noModelsFound: 'No se encontraron modelos que coincidan.',
        refreshSuccess: 'Lista de modelos actualizada correctamente.',
        refreshError: 'Error al actualizar la lista de modelos.',
        validationSuccess: 'Clave API válida.',
        validationError: 'Error al validar la clave API.',
        saveSuccess: 'Configuración guardada.',
        validation: {
            title: 'Se requiere verificación de clave API',
            unverifiedProvidersMessage: 'Los siguientes proveedores no han sido verificados:',
            autoVerifyPrompt: '¿Desea verificarlos automáticamente ahora?',
            cancelNote: '(Cancelar para volver sin guardar)',
            unavailableTitle: 'No se puede guardar',
            unavailableMessage: 'Las claves API o modelos de los siguientes proveedores no están disponibles:',
            modelLabel: 'Modelo',
            reasonLabel: 'Razón',
            reasonInvalidKey: 'La clave API es inválida o el modelo no es accesible.',
            solutionsTitle: 'Soluciones:',
            solution1: '1. Verifique nuevamente su clave API',
            solution2: '2. Intente seleccionar un modelo diferente',
            solution3: '3. Verifique los permisos en el sitio web del proveedor',
            uncertainTitle: 'Advertencia: Verificación incierta',
            uncertainMessage: 'Algunos proveedores no pudieron ser verificados:',
            uncertainReason: 'Verificación incierta (error de red o límite de velocidad)',
            proceedQuestion: '¿Desea guardar de todos modos?',
            recommendation: 'Recomendación: Presione "Cancelar" y reintente con el botón "Verificar".',
        },
        cacheAge: 'Actualizado hace {{minutes}} min',
        cached: 'En caché',
        studioTitle: 'BYOK Studio',
        studioSubtitle: 'Configura tu infraestructura de IA',
        openRouterNote: '※La información del modelo se basa en OpenRouter. La disponibilidad real puede variar según la clave del proveedor.',
        aiProviders: 'Proveedores de IA',
        selectProvider: 'Selecciona un proveedor para configurar',
        allSystemsOperational: 'Todos los sistemas operativos',
        lastUpdated: 'Última actualización: {{time}}',
        notYetRefreshed: 'Aún no actualizado',
        refreshModels: 'Actualizar modelos',
        variants: {
            default: 'Configuración predeterminada',
            free: 'Versión gratuita ($0, con límites)',
            extended: 'Ventana de contexto extendida',
            thinking: 'Razonamiento extendido (Chain-of-Thought)',
            online: 'Búsqueda web en tiempo real (Exa.ai)',
            nitro: 'Priorizar proveedor más rápido',
            floor: 'Priorizar proveedor más barato',
        },
        status: {
            available: 'Disponible',
            unavailable: 'No disponible',
            uncertain: 'Verificado (verificación de modelo omitida)',
            notVerified: 'No verificado',
            checking: 'Verificando...',
            verified: 'Verificado',
        },
        advanced: {
            title: 'Configuración avanzada',
            topP: 'Top P',
            topK: 'Top K',
            frequencyPenalty: 'Penalización de frecuencia',
            presencePenalty: 'Penalización de presencia',
            seed: 'Semilla',
            random: 'Aleatorio',
            responseFormat: 'Formato de respuesta',
            text: 'Texto',
            jsonObject: 'Objeto JSON',
        },
        modelCard: {
            settings: 'Ajustes',
            customSettings: 'Configuración personalizada',
            ctx: 'ctx',
            free: 'Gratis',
        },
        tooltips: {
            modelAvailable: '✅ Modelo disponible para esta clave API',
            modelUnavailable: '❌ Modelo no disponible (verifica la clave API o el acceso al modelo)',
            modelUncertain: 'Clave API válida, pero no se pudo confirmar la disponibilidad del modelo. Probablemente funcione.',
            clickToVerify: 'Haz clic para verificar la disponibilidad del modelo',
        },
    },

    // === BYOK Chat ===
    byokChat: {
        noMessages: 'Sin mensajes',
        startConversation: 'Inicia una conversación con este modelo BYOK',
        attachImage: 'Adjuntar imagen',
        imageTooLarge: 'La imagen "{{name}}" es demasiado grande (máx 20MB)',
        sending: 'Enviando...',
        receiving: 'Recibiendo...',
        imagesSelected: '{{count}} imágenes seleccionadas',
        pressEnterToSend: 'Presiona Enter para enviar',
        sendMessage: 'Envía un mensaje a este modelo...',
        attachedImage: 'Imagen adjunta',
        preview: 'Vista previa {{index}}',
    },

    // === Brain Flow Progress ===
    brainFlowProgress: {
        phase1Title: 'Fase de planificación',
        phase2Title: 'Fase de ejecución',
        phase3Title: 'Fase de integración',
        waiting: 'Esperando',
        done: 'Completado',
        processing: 'Procesando...',
        skipWaiting: 'Omitir espera',
    },

    // === History Popover ===
    historyPopover: {
        title: 'Historial',
        modelHistory: 'Historial del modelo',
        newChat: 'Nuevo chat',
        searchPlaceholder: 'Buscar conversaciones...',
        loading: 'Cargando...',
        noConversations: 'No se encontraron conversaciones',
        startNewChat: 'Inicia un nuevo chat y aparecerá aquí',
        untitledConversation: 'Conversación sin título',
        noPreview: 'Sin vista previa',
        deleteConversation: 'Eliminar conversación',
        conversationsStored: '{{count}} conversaciones almacenadas',
        daysAgo: 'hace {{days}} días',
    },

    // === Model Settings Dropdown ===
    modelSettings: {
        title: 'Configuración del modelo',
        useDefaultSettings: 'Usar configuración predeterminada',
        applyGlobalSettings: 'Aplicar configuración BYOK global',
        unsaved: 'Sin guardar',
        resetToDefaults: 'Restablecer valores predeterminados',
        modelVariant: 'Variante del modelo',
        enableThinking: 'Habilitar pensamiento',
        noCustomSettings: 'Este modelo no tiene configuración personalizada.',
    },

    // === Settings Modal (additional) ===
    settingsModal: {
        byokTitle: 'Configuración de claves API',
        byokDescription: 'Usa OpenAI, Claude, Gemini directamente',
        openSettings: 'Abrir configuración',
    },

    // === Confirm Dialogs ===
    confirmDialogs: {
        addModel: '🚀 ¿Añadir el modelo {{name}}?\n\nInicia una nueva conversación y\nconsulta o solicita ayuda a {{name}}.',
        deleteModel: '❌ ¿Eliminar el modelo "{{name}}"?',
        newChat: '💬 ¿Iniciar nueva conversación?\n\nLa conversación actual se guardará automáticamente,\npuedes restaurarla desde el historial en cualquier momento.',
        apiKeyNotSet: 'Clave API no configurada. Habilita y guarda la clave en Ajustes → BYOK.',
        modelNotSelected: 'Modelo no seleccionado. Selecciona un modelo en la configuración BYOK.',
    },

    // === Thinking Process ===
    thinking: {
        processTitle: 'Proceso de pensamiento',
        showProcess: 'Mostrar proceso de pensamiento',
        hideProcess: 'Ocultar proceso de pensamiento',
        summary: 'Resumen',
    },

    // === Header ===
    header: {
        title: 'modeldock',
        conversationHistory: 'Historial de conversaciones',
    },
};
