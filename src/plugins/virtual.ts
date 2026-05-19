import type { Plugin } from '../types/index.js';
import { normalizePath } from '../utils/path.js';

export interface VirtualOptions {
  modules: Record<string, string>;
}

/**
 * A plugin to load modules from a virtual map.
 * Useful for providing global configuration or dynamic modules.
 */
export function virtualPlugin(options: VirtualOptions): Plugin {
  const modules = new Map<string, string>();
  for (const [id, code] of Object.entries(options.modules)) {
    modules.set(normalizePath(id), code);
  }

  return {
    name: 'virtual',
    resolveId(id) {
      if (modules.has(normalizePath(id))) {
        return normalizePath(id);
      }
      return null;
    },
    load(id) {
      const normalizedId = normalizePath(id);
      if (modules.has(normalizedId)) {
        return modules.get(normalizedId);
      }
      return null;
    },
  };
}
