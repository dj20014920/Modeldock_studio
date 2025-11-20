
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
    url: 'https://claude.ai/new',
    iconColor: 'bg-orange-500',
    themeColor: 'border-orange-200'
  },
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
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
    url: 'https://aistudio.google.com',
    iconColor: 'bg-blue-600',
    themeColor: 'border-blue-300'
  },
  codex: {
    id: 'codex',
    name: 'Codex Cloud',
    url: 'https://platform.openai.com/playground',
    iconColor: 'bg-green-600',
    themeColor: 'border-green-300'
  },
  claudecode: {
    id: 'claudecode',
    name: 'Claude Code Cloud',
    url: 'https://console.anthropic.com/workbench',
    iconColor: 'bg-orange-600',
    themeColor: 'border-orange-300'
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
    themeColor: 'border-orange-300'
  },
  genspark: {
    id: 'genspark',
    name: 'Genspark',
    url: 'https://genspark.ai',
    iconColor: 'bg-indigo-600',
    themeColor: 'border-indigo-300'
  },
  lovable: {
    id: 'lovable',
    name: 'Lovable',
    url: 'https://lovable.dev',
    iconColor: 'bg-pink-500',
    themeColor: 'border-pink-200'
  },
  v0: {
    id: 'v0',
    name: 'v0',
    url: 'https://v0.dev',
    iconColor: 'bg-neutral-900',
    themeColor: 'border-neutral-300'
  },
  vooster: {
    id: 'vooster',
    name: 'Vooster',
    url: 'https://vooster.ai',
    iconColor: 'bg-cyan-500',
    themeColor: 'border-cyan-200'
  }
};

export const NAV_ITEMS = [
  { id: 'chats', icon: MessageSquare, label: 'Chats' },
  { id: 'models', icon: Bot, label: 'Models' },
  { id: 'prompts', icon: Sparkles, label: 'Prompts' },
  { id: 'settings', icon: Cpu, label: 'Settings' },
] as const;

// --- Updated Selectors for Auto-Injection (As of May 2024) ---
export const INPUT_SELECTORS: Partial<Record<ModelId, InjectionSelector>> = {
  chatgpt: {
    // Target the ID directly, reliable fallback
    inputSelector: '#prompt-textarea', 
    submitSelector: 'button[data-testid="send-button"]',
    inputType: 'contenteditable'
  },
  claude: {
    // Claude uses ProseMirror with contenteditable
    inputSelector: 'div[contenteditable="true"].ProseMirror', 
    submitSelector: 'button[aria-label="Send Message"]',
    inputType: 'contenteditable'
  },
  gemini: {
    // Gemini uses a rich-textarea component
    inputSelector: 'div[role="textbox"][contenteditable="true"]', 
    submitSelector: 'button[aria-label="Send message"]',
    inputType: 'contenteditable'
  },
  perplexity: {
    inputSelector: 'textarea[placeholder*="Ask"]', 
    submitSelector: 'button[aria-label="Submit"]',
    inputType: 'textarea'
  },
  deepseek: {
    inputSelector: 'textarea#chat-input', 
    submitSelector: 'div[role="button"].ds-button', // Need to be generic sometimes
    inputType: 'textarea'
  },
  grok: {
    inputSelector: 'textarea',
    submitSelector: 'button[type="submit"]',
    inputType: 'textarea'
  },
  mistral: {
    inputSelector: 'textarea',
    submitSelector: 'button[type="submit"]',
    inputType: 'textarea'
  }
};

// --- System Prompts (Optimized: Korean UI, English Instruction, Korean Output) ---
export const SYSTEM_PROMPTS: PromptData[] = [
  {
    id: 'sys-1',
    category: 'Coding',
    title: '전문가 코드 리팩토링',
    description: '가독성, 성능, SOLID 원칙을 준수하여 코드를 전문적으로 리팩토링합니다.',
    content: 'You are an expert Senior Software Engineer. Review the following code. Refactor it to improve readability, maintainability, and performance. Ensure it adheres to SOLID principles and modern best practices. Explain your changes step-by-step.\n\nPlease respond in Korean.',
    isSystem: true
  },
  {
    id: 'sys-2',
    category: 'Writing',
    title: '비즈니스 이메일 다듬기',
    description: '거친 초안을 정중하고 전문적인 비즈니스 이메일로 변환합니다.',
    content: 'You are a professional business communication assistant. Rewrite the following draft into a polite, concise, and professional email. Fix any grammar issues and improve the tone to be respectful yet assertive where necessary.\n\nPlease respond in Korean.',
    isSystem: true
  },
  {
    id: 'sys-3',
    category: 'Analysis',
    title: '복잡한 개념 쉽게 설명 (ELI5)',
    description: '어려운 주제를 5살 아이도 이해할 수 있도록 아주 쉽게 설명합니다.',
    content: 'Explain the following concept in simple terms, as if you were teaching a 5-year-old. Use analogies and simple language to break down complex ideas into understandable parts. Avoid jargon.\n\nPlease respond in Korean.',
    isSystem: true
  },
  {
    id: 'sys-4',
    category: 'Coding',
    title: '유닛 테스트 생성기',
    description: '제공된 코드에 대한 포괄적인 유닛 테스트 케이스를 작성합니다.',
    content: 'You are a QA Automation Engineer. Generate a comprehensive set of unit tests for the following code. Cover edge cases, happy paths, and potential error states. Use the most standard testing framework for the language provided.\n\nPlease respond in Korean.',
    isSystem: true
  },
  {
    id: 'sys-5',
    category: 'Business',
    title: '회의록 요약 및 정리',
    description: '회의 노트에서 핵심 논의 사항, 결정 사항, 할 일을 추출하여 요약합니다.',
    content: 'Analyze the following meeting transcript/notes. Produce a structured summary containing: 1) Key Discussion Points, 2) Decisions Made, and 3) Action Items with assignees (if mentioned). Keep it concise.\n\nPlease respond in Korean.',
    isSystem: true
  },
  {
    id: 'sys-6',
    category: 'Creative',
    title: '브레인스토밍 파트너',
    description: '주제에 대해 창의적이고 독창적인 아이디어를 10가지 제안합니다.',
    content: 'Act as a creative consultant. I need to brainstorm ideas for the following topic. Provide 10 unique, diverse, and out-of-the-box ideas. For each idea, provide a brief explanation of why it works.\n\nPlease respond in Korean.',
    isSystem: true
  },
  {
    id: 'sys-7',
    category: 'Analysis',
    title: '소크라테스식 튜터',
    description: '직접적인 답 대신 질문을 던져 스스로 답을 찾도록 유도합니다.',
    content: 'Act as a Socratic Tutor. I want to learn about the topic below. Do not give me the answer directly. Instead, ask me a series of guiding questions that help me derive the answer and understand the fundamental concepts myself.\n\nPlease respond in Korean.',
    isSystem: true
  },
  {
    id: 'sys-8',
    category: 'General',
    title: '문법 및 스타일 교정',
    description: '의미를 유지하면서 문법 오류를 수정하고 문장 흐름을 자연스럽게 개선합니다.',
    content: 'Proofread the following text. Correct any grammar, spelling, and punctuation errors. Improve the flow and clarity of the sentences without altering the original meaning or tone.\n\nPlease respond in Korean.',
    isSystem: true
  }
];