import type { Plugin } from '../types/index.js';
import { resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { normalizePath } from '../utils/path.js';

export function cssPlugin(): Plugin {
  return {
    name: 'css',
    async resolveId(source, importer) {
      if (source.endsWith('.css') && importer) {
        const resolved = normalizePath(resolve(dirname(importer), source));
        if (existsSync(resolved)) {
          return resolved;
        }
      }
      return null;
    },
    transform(code, id) {
      if (id.endsWith('.css')) {
        const js = `
const css = ${JSON.stringify(code)};
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.setAttribute('data-id', ${JSON.stringify(id)});
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);
}
export default css;
        `;
        return js.trim();
      }
      return null;
    }
  };
}
