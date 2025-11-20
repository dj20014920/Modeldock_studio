
export type ModelId = 
  | 'gemini' 
  | 'claude' 
  | 'chatgpt' 
  | 'perplexity' 
  | 'deepseek' 
  | 'qwen' 
  | 'lmarena' 
  | 'kimi' 
  | 'mistral' 
  | 'openrouter'
  | 'aistudio'
  | 'codex'
  | 'claudecode'
  | 'githubcopilot'
  | 'replit'
  | 'genspark'
  | 'lovable'
  | 'v0'
  | 'vooster';

export interface ModelConfig {
  id: ModelId;
  name: string;
  url: string;
  iconColor: string; // Tailwind class for dot indicator
  themeColor: string; // Border/Accent color
}

export interface SidebarItemProps {
  id: ModelId;
  isActive: boolean;
  onClick: () => void;
}

export type DispatchMode = 'manual' | 'auto';

export interface InjectionSelector {
  inputSelector: string;
  submitSelector: string;
  // Optional: specialized handling flags
  inputType?: 'textarea' | 'contenteditable'; 
}
