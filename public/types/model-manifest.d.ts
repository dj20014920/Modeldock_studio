export interface ModelManifest {
  id: string;
  name: string;
  url: string;
  selectors: SelectorSet;
  completion: CompletionConfig;
  features: FeatureFlags;
  plugin?: string;
}

export interface SelectorSet {
  stop_button: {
    primary: string;
    alternatives: string[];
  };
  input: {
    selector: string;
    type: 'textarea' | 'contenteditable';
  };
  response_area: {
    container: string;
    assistant: string;
  };
  loading_indicator?: {
    primary: string;
    alternatives?: string[];
  };
  submit_button: {
    selector: string;
  };
}

export interface CompletionConfig {
  minWaitMs: number;
  adaptiveMultiplier: number;
  checks: string[];
  thinking?: {
    enabled: boolean;
    patterns: string[];
  };
}

export interface FeatureFlags {
  usesNetworkMonitor: boolean;
  disableInputOnGenerate: boolean;
  hasThinkingMode: boolean;
}
