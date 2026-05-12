import { sep } from 'node:path';

/**
 * Normalizes a path to use forward slashes.
 */
export function normalizePath(path: string): string {
  return path.split(sep).join('/');
}
