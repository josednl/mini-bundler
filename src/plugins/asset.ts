import type { Plugin } from '../types/index.js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { normalizePath } from '../utils/path.js';

const ASSET_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'];

export function assetPlugin(): Plugin {
  return {
    name: 'asset',
    async resolveId(source, importer) {
      if (ASSET_EXTENSIONS.includes(extname(source)) && importer) {
        const resolved = normalizePath(resolve(dirname(importer), source));
        if (existsSync(resolved)) {
          return resolved;
        }
      }
      return null;
    },
    async load(id) {
      if (ASSET_EXTENSIONS.includes(extname(id))) {
        const buffer = readFileSync(id);
        const base64 = buffer.toString('base64');
        const mimeType = getMimeType(id);
        // Returning a JS module that exports the Data URL
        return `export default "data:${mimeType};base64,${base64}";`;
      }
      return null;
    }
  };
}

function getMimeType(path: string): string {
  const ext = extname(path).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    case '.webp': return 'image/webp';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}
