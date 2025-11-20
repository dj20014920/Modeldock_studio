
import { ModelConfig, ModelId } from './types';
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

// For the sidebar visual construction
export const NAV_ITEMS = [
  { icon: MessageSquare, label: 'Chats' },
  { icon: Bot, label: 'Models' },
  { icon: Sparkles, label: 'Prompts' },
  { icon: Cpu, label: 'Settings' },
];
