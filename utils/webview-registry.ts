
import { ModelId } from '../types';

/**
 * A singleton registry to manage references to Electron <webview> elements.
 * This allows global components (like the Chat Input) to communicate with
 * deeply nested webviews.
 */
class WebViewRegistry {
  private static instance: WebViewRegistry;
  private webviews: Map<string, any> = new Map(); // Key: instanceId (not just ModelId, to support multiple instances)

  private constructor() {}

  public static getInstance(): WebViewRegistry {
    if (!WebViewRegistry.instance) {
      WebViewRegistry.instance = new WebViewRegistry();
    }
    return WebViewRegistry.instance;
  }

  public register(instanceId: string, webview: any) {
    this.webviews.set(instanceId, webview);
    // console.debug(`[WebViewRegistry] Registered: ${instanceId}`);
  }

  public unregister(instanceId: string) {
    if (this.webviews.has(instanceId)) {
      this.webviews.delete(instanceId);
      // console.debug(`[WebViewRegistry] Unregistered: ${instanceId}`);
    }
  }

  public get(instanceId: string): any | undefined {
    return this.webviews.get(instanceId);
  }

  public getAll(): any[] {
    return Array.from(this.webviews.values());
  }
}

export const webViewRegistry = WebViewRegistry.getInstance();
