
export type ModelId = 
  | 'gemini' 
  | 'claude' 
  | 'chatgpt' 
  | 'perplexity' 
  | 'deepseek' 
  | 'grok'
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

// New interface for managing multiple instances of the same model
export interface ActiveModel {
  modelId: ModelId;
  instanceId: string; // Unique ID (e.g., 'gemini-1715234...')
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

// --- Prompt Library Types ---

export type PromptCategory = 'General' | 'Coding' | 'Writing' | 'Analysis' | 'Creative' | 'Business' | 'Academic';

export interface PromptData {
  id: string;
  title: string;       // Shown in UI (Localized ideally)
  description: string; // Shown in UI (Localized ideally)
  content: string;     // The actual text sent to the LLM (Usually English)
  category: PromptCategory;
  tags?: string[];
  isSystem?: boolean;  // Built-in prompts vs User prompts
}

export type SidebarView = 'chats' | 'models';

// --- Electron WebView Type Augmentation ---
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        partition?: string;
        allowpopups?: boolean;
        preload?: string;
      }, HTMLElement>;
    }
  }
}
