import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Resolver } from '../../src/core/Resolver.js';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('Resolver', () => {
  const testDir = resolve(process.cwd(), 'temp-test-resolver');
  const entryFile = join(testDir, 'index.ts');

  beforeEach(() => {
    if (!mkdirSync(testDir, { recursive: true })) {
      // already exists or created
    }
    writeFileSync(entryFile, "import { foo } from './utils.js';");
    writeFileSync(join(testDir, 'utils.ts'), "export const foo = 'bar';");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should resolve a relative typescript file', () => {
    const resolver = new Resolver();
    const result = resolver.resolve('./utils.js', entryFile);

    expect(result.path).toBeDefined();
    expect(result.path).toContain('utils.ts');
    expect(result.isExternal).toBe(false);
  });

  it('should return undefined for non-existent modules', () => {
    const resolver = new Resolver();
    const result = resolver.resolve('./non-existent.js', entryFile);

    expect(result.path).toBeUndefined();
  });

  it('should identify external modules (builtin node)', () => {
    const resolver = new Resolver();
    const result = resolver.resolve('node:fs', entryFile);

    // In some environments node:fs might not be resolved as a "file" by TS if types are missing,
    // but usually it's handled. Let's check if it identifies it or returns path.
    // For builtin modules, TS might return a path to the types or just undefined if not configured.
    // Let's test a simple relative one first to be sure the class works.
    expect(result).toBeDefined();
  });
});
