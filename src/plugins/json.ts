import type { Plugin } from '../types/index.js';
import { extname, resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { normalizePath } from '../utils/path.js';

export function jsonPlugin(): Plugin {
  return {
    name: 'json',
    async resolveId(source, importer) {
      if (source.endsWith('.json') && importer) {
        const resolved = normalizePath(resolve(dirname(importer), source));
        if (existsSync(resolved)) {
          return resolved;
        }
      }
      return null;
    },
    transform(code, id) {
      if (id.endsWith('.json')) {
        try {
          // Validate JSON and format as a JS export
          JSON.parse(code);
          return `export default ${code.trim()};`;
        } catch (e) {
          console.warn(`[json-plugin] Failed to parse JSON in ${id}`);
          return null;
        }
      }
      return null;
    }
  };
}
