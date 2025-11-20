
import { ModelId } from '../types';

/**
 * DEPRECATED: Electron webview registry is no longer used in the Chrome Extension architecture.
 * Kept for compatibility during migration, but methods are no-ops.
 */
class WebViewRegistry {
  private static instance: WebViewRegistry;

  private constructor() {}

  public static getInstance(): WebViewRegistry {
    if (!WebViewRegistry.instance) {
      WebViewRegistry.instance = new WebViewRegistry();
    }
    return WebViewRegistry.instance;
  }

  public register(id: ModelId, webview: any) {
    // No-op
  }

  public unregister(id: ModelId) {
    // No-op
  }

  public get(id: ModelId): any | undefined {
    return undefined;
  }
}

export const webViewRegistry = WebViewRegistry.getInstance();
