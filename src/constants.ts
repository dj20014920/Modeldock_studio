
import { ModelConfig, ModelId, InjectionSelector, PromptData } from './types';
import { Bot, Cpu, MessageSquare, Sparkles } from 'lucide-react';

export const SUPPORTED_MODELS: Record<ModelId, ModelConfig> = {
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    url: 'https://gemini.google.com/app',
    iconColor: 'bg-blue-500',
    themeColor: 'border-blue-200'
  },
  claude: {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/chats',
    iconColor: 'bg-orange-500',
    themeColor: 'border-orange-200'
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com',
    iconColor: 'bg-green-500',
    themeColor: 'border-green-200'
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    url: 'https://grok.com',
    iconColor: 'bg-neutral-900',
    themeColor: 'border-neutral-300'
  },
  perplexity: {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai',
    iconColor: 'bg-teal-500',
    themeColor: 'border-teal-200'
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    url: 'https://chat.deepseek.com',
    iconColor: 'bg-indigo-500',
    themeColor: 'border-indigo-200'
  },
  qwen: {
    id: 'qwen',
    name: 'Qwen',
    url: 'https://chat.qwen.ai',
    iconColor: 'bg-violet-500',
    themeColor: 'border-violet-200'
  },
  lmarena: {
    id: 'lmarena',
    name: 'LM Arena',
    url: 'https://lmarena.ai/c/new?chat-modality=chat&mode=direct',
    iconColor: 'bg-rose-500',
    themeColor: 'border-rose-200'
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    url: 'https://kimi.moonshot.cn',
    iconColor: 'bg-sky-500',
    themeColor: 'border-sky-200'
  },
  mistral: {
    id: 'mistral',
    name: 'Mistral',
    url: 'https://chat.mistral.ai',
    iconColor: 'bg-yellow-500',
    themeColor: 'border-yellow-200'
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    url: 'https://openrouter.ai/chat',
    iconColor: 'bg-emerald-500',
    themeColor: 'border-emerald-200'
  },
  aistudio: {
    id: 'aistudio',
    name: 'Google AI Studio',
    url: 'https://aistudio.google.com/apps?source=',
    iconColor: 'bg-blue-600',
    themeColor: 'border-blue-300',
    excludeFromBrainFlow: true // Vibe Coding Tool
  },
  codex: {
    id: 'codex',
    name: 'Codex Cloud',
    url: 'https://chatgpt.com/codex',
    iconColor: 'bg-green-600',
    themeColor: 'border-green-300',
    excludeFromBrainFlow: true // Vibe Coding Tool
  },
  claudecode: {
    id: 'claudecode',
    name: 'Claude Code',
    url: 'https://claude.ai/code',
    iconColor: 'bg-orange-600',
    themeColor: 'border-orange-300',
    excludeFromBrainFlow: true // Vibe Coding Tool
  },
  githubcopilot: {
    id: 'githubcopilot',
    name: 'GitHub Copilot',
    url: 'https://github.com/copilot',
    iconColor: 'bg-slate-800',
    themeColor: 'border-slate-300'
  },
  replit: {
    id: 'replit',
    name: 'Replit',
    url: 'https://replit.com',
    iconColor: 'bg-orange-600',
    themeColor: 'border-orange-300',
    excludeFromBrainFlow: true // Vibe Coding Tool
  },
  genspark: {
    id: 'genspark',
    name: 'Genspark',
    url: 'https://www.genspark.ai',
    iconColor: 'bg-indigo-600',
    themeColor: 'border-indigo-300'
  },
  lovable: {
    id: 'lovable',
    name: 'Lovable',
    url: 'https://lovable.dev',
    iconColor: 'bg-pink-500',
    themeColor: 'border-pink-200',
    excludeFromBrainFlow: true // Vibe Coding Tool
  },
  v0: {
    id: 'v0',
    name: 'v0',
    url: 'https://v0.dev',
    iconColor: 'bg-neutral-900',
    themeColor: 'border-neutral-300',
    excludeFromBrainFlow: true // Vibe Coding Tool
  },
  vooster: {
    id: 'vooster',
    name: 'Vooster',
    url: 'https://app.vooster.ai',
    iconColor: 'bg-cyan-500',
    themeColor: 'border-cyan-200',
    excludeFromBrainFlow: true, // Vibe Coding Tool
    sessionSync: {
      method: 'cookiePartition',
      domains: ['vooster.ai', 'app.vooster.ai']
    }
  }
};

// For the sidebar visual construction
export const NAV_ITEMS = [
  { id: 'chats', icon: MessageSquare, label: 'Chats' },
  { id: 'models', icon: Bot, label: 'Models' },
  { id: 'prompts', icon: Sparkles, label: 'Prompts' },
  { id: 'settings', icon: Cpu, label: 'Settings' },
] as const;

// Selectors for Auto-Injection
// Selectors for Auto-Injection
export const INPUT_SELECTORS: Partial<Record<ModelId, InjectionSelector>> = {
  chatgpt: {
    inputSelector: 'div.ProseMirror[contenteditable="true"]#prompt-textarea, textarea.wcDTda_fallbackTextarea[name="prompt-textarea"], #prompt-textarea, textarea[id="prompt-textarea"], textarea[placeholder*="Message ChatGPT"], textarea[data-id="root"], div[data-testid="prompt-textarea"] textarea, textarea[data-testid="prompt-textarea"], textarea[aria-label*="Message"], textarea[data-id="conversation-input"]',
    submitSelector: 'button.composer-submit-button-color, button[data-testid="send-button"], button[data-testid="composer-send-button"], button[aria-label*="Send message" i], button[aria-label*="Send prompt" i]',
    inputType: 'contenteditable',
    delayBeforeSubmit: 300
  },
  claude: {
    inputSelector: 'div[data-testid="message-composer"] [contenteditable="true"], div[contenteditable="true"][data-placeholder*="Reply" i], div[role="textbox"][contenteditable="true"], div[contenteditable="plaintext-only"], div.ProseMirror[contenteditable="true"], div.tiptap.ProseMirror[contenteditable="true"], textarea[aria-label*="Message" i], textarea[placeholder*="Reply" i], textarea',
    submitSelector: [
      'button[aria-label*="메시지 보내기"]',
      'button[data-testid*="send" i]',
      'button.Button_claude__tTMUm',
      'button[aria-label*="Send message" i]:not([aria-label*="Stop" i])',
      'button[aria-label*="Send" i]:not([aria-label*="Stop" i])',
      'button[type="submit"]'
    ].join(', '),
    inputType: 'contenteditable',
    delayBeforeSubmit: 1000,
    forceEnter: true
  },
  gemini: {
    inputSelector: 'div[contenteditable="true"][role="textbox"], rich-textarea > div',
    submitSelector: 'button[aria-label="Send message"], button[aria-label="보내기"], button[data-test-id="send-button"], button[aria-label*="Send"]',
    inputType: 'contenteditable',
    forceEnter: true,
    delayBeforeSubmit: 800
  },
  grok: {
    inputSelector: 'div[role="textbox"][contenteditable="true"], textarea, div[contenteditable="true"]',
    submitSelector: 'button[aria-label="Send"], button[type="submit"], button:has(svg path[d*="M"])',
    inputType: 'contenteditable', // Changed to contenteditable priority
    forceEnter: true,
    delayBeforeSubmit: 1000
  },
  perplexity: {
    inputSelector: 'textarea[placeholder*="Ask"], textarea',
    submitSelector: 'button[aria-label="Submit"], button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true
  },
  deepseek: {
    inputSelector: 'textarea, #chat-input',
    submitSelector: 'div[role="button"][aria-label="Send"], button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true,
    delayBeforeSubmit: 500
  },
  mistral: {
    inputSelector: 'textarea, div[contenteditable="true"], input[type="text"]',
    submitSelector: 'button[type="submit"], button[aria-label="Send"], button[aria-label="Chat"]',
    inputType: 'textarea',
    forceEnter: true,
    delayBeforeSubmit: 500
  },
  qwen: {
    inputSelector: 'textarea, div[contenteditable="true"]',
    submitSelector: 'button[class*="send-btn"], button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true
  },
  lmarena: {
    inputSelector: 'textarea, #chat-input',
    submitSelector: 'button.send-button, button[id="send-message-button"]',
    inputType: 'textarea'
  },
  kimi: {
    inputSelector: 'div[contenteditable="true"], textarea',
    submitSelector: 'button[class*="sendButton"], div[class*="sendButton"]',
    inputType: 'contenteditable',
    forceEnter: true,
    delayBeforeSubmit: 700
  },
  openrouter: {
    inputSelector: 'textarea[placeholder*="Message"], textarea, div[contenteditable="true"]',
    submitSelector: 'button[aria-label="Send"], button[type="submit"], button[aria-label*="Send"]',
    inputType: 'textarea',
    forceEnter: true,
    delayBeforeSubmit: 500
  },
  aistudio: {
    inputSelector: 'textarea[aria-label*="Message"], textarea[data-testid*="prompt"], div[role="textbox"][contenteditable="true"], textarea[aria-label*="Describe" i], div[contenteditable="true"][data-placeholder*="Describe" i], textarea[aria-label="Prompt"], textarea, .input-area',
    submitSelector: [
      'button.ms-button-primary[aria-label*="build" i]:not([aria-disabled="true"])',
      'button[aria-label="Build"]:not([aria-disabled="true"])',
      'button.ms-button:has(span.ms-button-icon-symbol):not([aria-disabled="true"])',
      'button.mat-mdc-tooltip-trigger.ms-button-primary:not([aria-disabled="true"])',
      'button[tooltip*="Run prompt" i]',
      'button[aria-label="Run"]',
      'button[aria-label*="Run" i]',
      'button[aria-label="Send message"]',
      'button[aria-label="Submit"]',
      'button[type="submit"]',
      'button[data-testid*="run" i]',
      'button.ms-button-primary',
      'button.ms-button',
      'button[aria-label*="Build" i]',
      'button[aria-label="Build"]',
    ].join(', '),
    inputType: 'textarea',
    forceEnter: true,
    delayBeforeSubmit: 1800,
    submitKey: { key: 'Enter', ctrlKey: true, metaKey: true }
  },
  codex: {
    inputSelector: 'div[data-testid="codex-input"] textarea, div[data-testid="codex-input"] [contenteditable="true"], div[role="textbox"][contenteditable="true"], textarea#prompt-textarea, .monaco-editor, .monaco-editor textarea, .cm-content, div.ProseMirror[contenteditable="true"], div.tiptap.ProseMirror[contenteditable="true"]',
    submitSelector: 'button[data-testid="composer-send-button"], button[aria-label*="Generate" i], button[aria-label*="Run" i], button:has(svg[aria-label*="Run" i]), button:has(svg[aria-label*="Generate" i]), div[role="button"][aria-label*="Run" i], div[role="button"][aria-label*="Generate" i]',
    inputType: 'textarea',
    forceEnter: true,
    delayBeforeSubmit: 800,
    submitKey: { key: 'Enter', metaKey: true }
  },
  claudecode: {
    inputSelector: 'div[data-testid*="composer"] [contenteditable="true"], div[role="textbox"][contenteditable="true"], div[contenteditable="plaintext-only"], div.ProseMirror[contenteditable="true"], div.tiptap.ProseMirror[contenteditable="true"], textarea[aria-label*="Message" i], textarea',
    submitSelector: 'button[data-testid*="send" i], button[aria-label*="Send" i], button[aria-label*="Run" i], button[type="submit"], button:has(svg[aria-label*="Run" i])',
    inputType: 'contenteditable',
    forceEnter: true,
    delayBeforeSubmit: 900,
    submitKey: { key: 'Enter', metaKey: true }
  },
  githubcopilot: {
    inputSelector: 'textarea[class*="ChatInput"], textarea, div[contenteditable="true"]',
    submitSelector: 'button[aria-label="Send"], button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true
  },
  replit: {
    inputSelector: 'textarea, .cm-content',
    submitSelector: 'button[aria-label="Send"], button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true
  },
  genspark: {
    inputSelector: 'textarea, div[contenteditable="true"]',
    submitSelector: 'button[aria-label="Send"], button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true
  },
  lovable: {
    inputSelector: 'textarea, div[contenteditable="true"]',
    submitSelector: 'button[aria-label="Send"], button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true
  },
  v0: {
    inputSelector: 'div.tiptap.ProseMirror[contenteditable="true"], div[data-editor="true"] div[contenteditable="true"], textarea',
    submitSelector: 'button[data-testid="prompt-form-send-button"], button[aria-label="Send"], button[type="submit"]',
    inputType: 'contenteditable',
    forceEnter: true,
    delayBeforeSubmit: 800
  },
  vooster: {
    inputSelector: 'textarea',
    submitSelector: 'button[type="submit"]',
    inputType: 'textarea',
    forceEnter: true
  }
};

// --- System Prompts (Optimized: Korean UI, English Instruction, Korean Output) ---
export const SYSTEM_PROMPTS: PromptData[] = [
  {
    id: 'sys-1',
    category: 'Coding',
    title: '전문가 코드 리팩토링',
    description: '가독성, 성능, SOLID 원칙을 준수하여 코드를 전문적으로 리팩토링합니다.',
    content: 'You are an expert Senior Software Engineer. Review the following code. Refactor it to improve readability, maintainability, and performance. Ensure it adheres to SOLID principles and modern best practices. Explain your changes step-by-step.',
    isSystem: true
  },
  {
    id: 'sys-2',
    category: 'Writing',
    title: '비즈니스 이메일 다듬기',
    description: '거친 초안을 정중하고 전문적인 비즈니스 이메일로 변환합니다.',
    content: 'You are a professional business communication assistant. Rewrite the following draft into a polite, concise, and professional email. Fix any grammar issues and improve the tone to be respectful yet assertive where necessary.',
    isSystem: true
  },
  {
    id: 'sys-3',
    category: 'Analysis',
    title: '복잡한 개념 쉽게 설명 (ELI5)',
    description: '어려운 주제를 5살 아이도 이해할 수 있도록 아주 쉽게 설명합니다.',
    content: 'Explain the following concept in simple terms, as if you were teaching a 5-year-old. Use analogies and simple language to break down complex ideas into understandable parts. Avoid jargon.',
    isSystem: true
  },
  {
    id: 'sys-4',
    category: 'Coding',
    title: '유닛 테스트 생성기',
    description: '제공된 코드에 대한 포괄적인 유닛 테스트 케이스를 작성합니다.',
    content: 'You are a QA Automation Engineer. Generate a comprehensive set of unit tests for the following code. Cover edge cases, happy paths, and potential error states. Use the most standard testing framework for the language provided.',
    isSystem: true
  },
  {
    id: 'sys-5',
    category: 'Business',
    title: '회의록 요약 및 정리',
    description: '회의 노트에서 핵심 논의 사항, 결정 사항, 할 일을 추출하여 요약합니다.',
    content: 'Analyze the following meeting transcript/notes. Produce a structured summary containing: 1) Key Discussion Points, 2) Decisions Made, and 3) Action Items with assignees (if mentioned). Keep it concise.',
    isSystem: true
  },
  {
    id: 'sys-6',
    category: 'Creative',
    title: '브레인스토밍 파트너',
    description: '주제에 대해 창의적이고 독창적인 아이디어를 10가지 제안합니다.',
    content: 'Act as a creative consultant. I need to brainstorm ideas for the following topic. Provide 10 unique, diverse, and out-of-the-box ideas. For each idea, provide a brief explanation of why it works.',
    isSystem: true
  },
  {
    id: 'sys-7',
    category: 'Analysis',
    title: '소크라테스식 튜터',
    description: '직접적인 답 대신 질문을 던져 스스로 답을 찾도록 유도합니다.',
    content: 'Act as a Socratic Tutor. I want to learn about the topic below. Do not give me the answer directly. Instead, ask me a series of guiding questions that help me derive the answer and understand the fundamental concepts myself.',
    isSystem: true
  },
  {
    id: 'sys-8',
    category: 'General',
    title: '문법 및 스타일 교정',
    description: '의미를 유지하면서 문법 오류를 수정하고 문장 흐름을 자연스럽게 개선합니다.',
    content: 'Proofread the following text. Correct any grammar, spelling, and punctuation errors. Improve the flow and clarity of the sentences without altering the original meaning or tone.',
    isSystem: true
  },
  {
    id: 'sys-9',
    category: 'Analysis',
    title: '심층 추론 모드 (Deep Thinking)',
    description: '문제를 다각도로 분석하고 검증하여 가장 논리적이고 완벽한 해결책을 도출합니다.',
    content: 'Activate Ultra Deep Thinking Mode. Your task is to solve the user\'s problem with maximum rigor and attention to detail.\n\n1. **Break Down**: Outline the task and break it into subtasks.\n2. **Multi-Perspective**: Explore multiple perspectives, even unlikely ones.\n3. **Challenge Assumptions**: Purposefully attempt to disprove your own assumptions.\n4. **Verify**: Cross-check every fact and inference. Use logic frameworks.\n5. **Synthesis**: Synthesize the findings into a robust conclusion.\n\nPlease document your reasoning steps clearly and then provide the final answer.',
    isSystem: true
  },
  {
    id: 'sys-10',
    category: 'Coding',
    title: 'React/Tailwind 컴포넌트 생성',
    description: '모던한 디자인의 React 컴포넌트를 Tailwind CSS를 사용하여 생성합니다.',
    content: 'Create a modern, responsive React component using Tailwind CSS based on the description provided. \n- Use functional components with TypeScript.\n- Use Lucide React for icons if needed.\n- Ensure accessibility (a11y) best practices.\n- Focus on a clean, "Apple-esque" or "Stripe-esque" aesthetic.',
    isSystem: true
  },
  {
    id: 'sys-11',
    category: 'Coding',
    title: '코드 버그 분석 및 수정',
    description: '코드의 잠재적 버그를 찾아내고, 원인 분석과 함께 수정 코드를 제안합니다.',
    content: 'Analyze the following code for bugs, logical errors, and potential edge cases. \n1. Identify the specific issues.\n2. Explain *why* they are issues.\n3. Provide the corrected code.\n4. Suggest prevention strategies for the future.',
    isSystem: true
  },
  {
    id: 'sys-12',
    category: 'Business',
    title: 'SWOT 분석 전문가',
    description: '특정 비즈니스나 아이디어에 대한 강점, 약점, 기회, 위협을 전문적으로 분석합니다.',
    content: 'Conduct a comprehensive SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats) for the following business idea or topic. Be realistic, critical, and strategic. After the analysis, suggest 3 key strategic initiatives based on the findings.',
    isSystem: true
  },
  {
    id: 'sys-13',
    category: 'Writing',
    title: 'SEO 블로그 포스트 작성',
    description: '검색 엔진 최적화(SEO)가 적용된 매력적인 블로그 포스트를 작성합니다.',
    content: 'Write a high-quality, SEO-optimized blog post about the topic provided. \n- Include a catchy title.\n- Use proper H2/H3 heading structures.\n- Include bullet points for readability.\n- Target a professional yet engaging tone.\n- Suggest meta description and keywords.',
    isSystem: true
  },
  {
    id: 'sys-14',
    category: 'Creative',
    title: '유튜브 스크립트 작가',
    description: '시청 지속 시간을 극대화할 수 있는 매력적인 유튜브 영상 스크립트를 작성합니다.',
    content: 'Write a compelling YouTube video script for the given topic. \n- Hook: Grab attention in the first 5 seconds.\n- Intro: Briefly state what the viewer will gain.\n- Body: Deliver value in an entertaining way.\n- CTA: Encourage likes and subscribes naturally.\n- Outro: Memorable closing.',
    isSystem: true
  },
  {
    id: 'sys-15',
    category: 'Academic',
    title: '논문/기사 핵심 요약',
    description: '긴 텍스트나 논문을 입력받아 핵심 주장, 근거, 결론을 구조화하여 요약합니다.',
    content: 'Summarize the following academic paper or article. Structure the summary as follows:\n1. **Core Thesis**: The main argument.\n2. **Key Evidence**: The data or logic supporting the thesis.\n3. **Methodology**: How the study was conducted (if applicable).\n4. **Conclusion**: The final takeaway.',
    isSystem: true
  },
  {
    id: 'sys-16',
    category: 'Coding',
    title: '정규표현식(Regex) 생성기',
    description: '복잡한 패턴 매칭을 위한 정규표현식을 생성하고 설명을 제공합니다.',
    content: 'Create a Regular Expression (Regex) for the following requirement. \n- Explain how the regex works part-by-part.\n- Provide examples of strings that match and strings that do not match.\n- Mention any specific flags needed.',
    isSystem: true
  },
  {
    id: 'sys-17',
    category: 'General',
    title: '영어 회화 롤플레잉',
    description: '특정 상황(여행, 비즈니스 등)을 설정하여 AI와 영어로 대화를 연습합니다.',
    content: 'Let\'s roleplay a conversation. I want to practice English for the situation described below. You will play the other role. \n- Correct my mistakes gently at the end of each turn if necessary.\n- Keep the conversation natural.\n- Start by greeting me in character.\n\n(Note: Please maintain the roleplay in English, but provide corrections/feedback in the user\'s language).',
    isSystem: true
  },
  {
    id: 'sys-18',
    category: 'Business',
    title: '콜드 메일 작성',
    description: '제안이나 영업을 위한 매력적이고 응답률 높은 콜드 메일을 작성합니다.',
    content: 'Draft a cold email for the following purpose. \n- Subject line needs to be high-converting.\n- Keep the body concise and value-focused.\n- Include a clear Call to Action (CTA).\n- Tone: Professional, persuasive, but not spammy.',
    isSystem: true
  },
  {
    id: 'sys-19',
    category: 'Analysis',
    title: '데이터 인사이트 추출',
    description: '제공된 데이터(텍스트 형식)에서 주요 패턴, 추세, 특이점을 분석합니다.',
    content: 'Analyze the provided data/statistics. \n1. Identify key trends and patterns.\n2. Highlight any anomalies or outliers.\n3. Draw 3 major conclusions/insights from this data.',
    isSystem: true
  },
  {
    id: 'sys-20',
    category: 'Analysis',
    title: 'Perplexity: 심층 리서치',
    description: 'Perplexity의 검색 능력을 활용하여 출처가 명시된 심층 리포트를 작성합니다.',
    content: 'Perform a deep research on [Topic]. \n- Use multiple reliable sources.\n- Provide inline citations.\n- Structure the answer as a comprehensive report with an Executive Summary, Detailed Findings, and Conclusion.\n- Focus on recent developments and factual accuracy.',
    isSystem: true
  },
  {
    id: 'sys-21',
    category: 'Coding',
    title: 'Claude 3: XML 구조화 템플릿',
    description: 'Claude 3 모델의 성능을 극대화하는 XML 태그 기반의 구조화된 프롬프트입니다.',
    content: '<system>\nYou are an expert [Role/Field].\n</system>\n\n<context>\n[Insert Background Information or Data Here]\n</context>\n\n<instructions>\nYour task is to [Insert Specific Task].\n1. Analyze the context provided in <context> tags.\n2. [Step 2]\n3. [Step 3]\n</instructions>\n\n<formatting>\nPlease format your response as [Desired Format, e.g., Markdown, JSON].\n</formatting>',
    isSystem: true
  },
  {
    id: 'sys-22',
    category: 'Business',
    title: 'Gemini: SI-RI-QI 구조화 템플릿',
    description: 'Gemini가 가장 잘 이해하는 System-Role-Query 구조의 프롬프트입니다.',
    content: '***System Instruction***\nYou are a world-class expert in [Field]. Your goal is to provide a comprehensive and accurate solution.\n\n***Role Instruction***\nAct as a [Specific Persona, e.g., Senior Data Analyst]. Tone should be [Tone, e.g., Professional and Analytical].\n\n***Query Instruction***\nTask: [Insert Main Task]\nContext: [Insert Relevant Context]\nConstraints:\n- [Constraint 1]\n- [Constraint 2]',
    isSystem: true
  },
  {
    id: 'sys-23',
    category: 'General',
    title: 'GPT-4: CoT(연쇄 추론) 템플릿',
    description: 'GPT-4의 추론 능력을 극대화하기 위한 단계별 사고(Chain of Thought) 템플릿입니다.',
    content: '### Role\nYou are an advanced AI assistant specializing in [Field].\n\n### Objective\n[Insert Clear Objective]\n\n### Context\n"""\n[Insert Context/Text to Analyze]\n"""\n\n### Instructions\nLet\'s think step by step.\n1. First, analyze the [Context].\n2. Second, [Next Step].\n3. Finally, generate the output.\n\n### Output Format\n[Desired Format]',
    isSystem: true
  },
  {
    id: 'sys-24',
    category: 'Coding',
    title: 'DeepSeek: R1 코딩/논리 최적화',
    description: 'DeepSeek R1/Coder 모델에 최적화된 간결하고 명확한 코딩 요청 템플릿입니다.',
    content: '(Note: DeepSeek R1 performs best with direct instructions and no system prompt overhead.)\n\nProblem Description:\n[Insert Specific Coding Problem or Logic Puzzle]\n\nTechnical Specifications:\n- Language: [e.g., Python, TypeScript]\n- Libraries: [e.g., React, Pandas]\n\nRequirements:\n1. [Requirement 1]\n2. [Requirement 2]\n\nOutput Format:\nProvide only the code and a brief explanation of the logic.',
    isSystem: true
  },
  {
    id: 'sys-25',
    category: 'Analysis',
    title: '프롬프트 최적화 (Meta-Prompt)',
    description: '작성한 프롬프트를 특정 모델(Claude, GPT 등)에 맞게 전문가 수준으로 업그레이드해줍니다.',
    content: 'I have a draft prompt:\n"[Insert Your Rough Prompt Here]"\n\nPlease analyze this prompt and rewrite it to be highly optimized for [Target Model, e.g., Claude 3.5, GPT-4].\n- Apply best practices for that specific model (e.g., XML tags for Claude, Chain of Thought for GPT).\n- Improve clarity and specificity.\n- Add necessary constraints.',
    isSystem: true
  },
  {
    id: 'sys-26',
    category: 'Analysis',
    title: 'Grok: 실시간 정보 & 위트',
    description: 'Grok의 특징인 실시간 정보 접근과 위트 있는 톤을 활용합니다.',
    content: 'Act as Grok. \n1. Use real-time information to answer the following question about [Topic].\n2. Maintain a witty, slightly rebellious, and "fun" tone.\n3. Don\'t be afraid to be direct and roast bad ideas if necessary.\n\nQuestion: [Insert Question]',
    isSystem: true
  },
  {
    id: 'sys-27',
    category: 'General',
    title: 'Mistral: 간결하고 명확한 답변',
    description: 'Mistral 모델의 강점인 간결함과 효율성을 극대화합니다.',
    content: 'Answer the following request concisely and efficiently. Avoid unnecessary fluff or filler words. Get straight to the point.\n\nRequest: [Insert Request]',
    isSystem: true
  },
  {
    id: 'sys-28',
    category: 'General',
    title: '범용: 핵심 요약 (TL;DR)',
    description: '긴 텍스트의 핵심 내용을 빠르고 간결하게 요약합니다.',
    content: 'Provide a "Too Long; Didn\'t Read" (TL;DR) summary of the following text. \n- Bullet points for key takeaways.\n- Maximum 3-5 points.\n- Capture the essence without losing important details.',
    isSystem: true
  }
];
