import type { Plugin } from '../types/index.js';
import { resolve, isAbsolute, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { normalizePath } from '../utils/path.js';

export interface AliasOptions {
  entries: Record<string, string>;
}

/**
 * A plugin to resolve aliases in import statements.
 */
export function aliasPlugin(options: AliasOptions): Plugin {
  const entries = Object.entries(options.entries).map(([find, replacement]) => ({
    find,
    replacement: normalizePath(replacement),
  }));

  const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];

  return {
    name: 'alias',
    async resolveId(source) {
      for (const { find, replacement } of entries) {
        if (source === find || source.startsWith(`${find}/`)) {
          let resolved = source.replace(find, replacement);
          if (!isAbsolute(resolved)) {
            resolved = resolve(process.cwd(), resolved);
          }

          resolved = normalizePath(resolved);

          // If it has an extension, try to resolve it directly
          if (existsSync(resolved)) {
            return resolved;
          }

          // Try removing .js extension and replacing with .ts etc (common in ESM/TS)
          if (resolved.endsWith('.js')) {
            const base = resolved.slice(0, -3);
            for (const ext of extensions) {
              if (existsSync(base + ext)) {
                return normalizePath(base + ext);
              }
            }
          }

          // Try adding extensions
          for (const ext of extensions) {
            if (existsSync(resolved + ext)) {
              return normalizePath(resolved + ext);
            }
          }

          // Try index files
          for (const ext of extensions) {
            const indexFile = resolve(resolved, `index${ext}`);
            if (existsSync(indexFile)) {
              return normalizePath(indexFile);
            }
          }

          return resolved;
        }
      }
      return null;
    },
  };
}
