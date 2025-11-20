
import { ModelId } from '../types';

/**
 * A singleton registry to manage references to Electron <webview> elements.
 * This allows global components (like the Chat Input) to communicate with
 * deeply nested webviews.
 */
class WebViewRegistry {
  private static instance: WebViewRegistry;
  private webviews: Map<ModelId, any> = new Map();

  private constructor() {}

  public static getInstance(): WebViewRegistry {
    if (!WebViewRegistry.instance) {
      WebViewRegistry.instance = new WebViewRegistry();
    }
    return WebViewRegistry.instance;
  }

  public register(id: ModelId, webview: any) {
    this.webviews.set(id, webview);
    console.log(`[WebViewRegistry] Registered: ${id}`);
  }

  public unregister(id: ModelId) {
    this.webviews.delete(id);
    console.log(`[WebViewRegistry] Unregistered: ${id}`);
  }

  public get(id: ModelId): any | undefined {
    return this.webviews.get(id);
  }

  public getAll(): Map<ModelId, any> {
    return this.webviews;
  }
}

export const webViewRegistry = WebViewRegistry.getInstance();
