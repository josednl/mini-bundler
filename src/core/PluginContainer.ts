import type { Plugin } from '../types/index.js';

export class PluginContainer {
  private plugins: Plugin[];

  constructor(plugins: Plugin[] = []) {
    this.plugins = plugins;
  }

  async resolveId(source: string, importer?: string): Promise<string | null> {
    for (const plugin of this.plugins) {
      if (plugin.resolveId) {
        const result = await plugin.resolveId(source, importer);
        if (result) return result;
      }
    }
    return null;
  }

  async load(id: string): Promise<string | null> {
    for (const plugin of this.plugins) {
      if (plugin.load) {
        const result = await plugin.load(id);
        if (result) return result;
      }
    }
    return null;
  }

  async transform(code: string, id: string): Promise<string> {
    let currentCode = code;
    for (const plugin of this.plugins) {
      if (plugin.transform) {
        const result = await plugin.transform(currentCode, id);
        if (result) currentCode = result;
      }
    }
    return currentCode;
  }
}
