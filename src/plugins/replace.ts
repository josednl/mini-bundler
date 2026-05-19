import type { Plugin } from '../types/index.js';

export interface ReplaceOptions {
  values: Record<string, string>;
  delimiters?: [string, string];
}

/**
 * A plugin to replace strings in the source code.
 * Useful for replacing process.env.NODE_ENV or other build-time constants.
 */
export function replacePlugin(options: ReplaceOptions): Plugin {
  const { values, delimiters = ['', ''] } = options;
  const [start, end] = delimiters;

  const replacements = Object.entries(values).map(([key, value]) => {
    return {
      pattern: new RegExp(`${escapeRegExp(start)}${escapeRegExp(key)}${escapeRegExp(end)}`, 'g'),
      replacement: value,
    };
  });

  return {
    name: 'replace',
    transform(code) {
      let transformed = code;
      let hasChanged = false;

      for (const { pattern, replacement } of replacements) {
        if (pattern.test(transformed)) {
          transformed = transformed.replace(pattern, replacement);
          hasChanged = true;
        }
      }

      return hasChanged ? transformed : null;
    },
  };
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
