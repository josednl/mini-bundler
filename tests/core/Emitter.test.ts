import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Bundler } from '../../src/core/Bundler.js';
import { normalizePath } from '../../src/utils/path.js';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('Emitter & E2E Bundle', () => {
  const testDir = normalizePath(resolve(process.cwd(), 'temp-test-emitter'));
  const entryFile = join(testDir, 'main.ts');
  const utilsFile = join(testDir, 'utils.ts');

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(entryFile, `
      import { foo } from './utils.js';
      globalThis.testResult = foo;
    `);
    writeFileSync(utilsFile, "export const foo = 'bundle-works';");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    // @ts-ignore
    delete globalThis.testResult;
  });

  it('should generate a functional bundle', async () => {
    const bundler = new Bundler();
    const bundle = await bundler.bundle({ entry: entryFile });

    expect(bundle).toContain('bundle-works');
    expect(bundle).toContain('__mini_require__');

    // Execute the bundle
    // We use a safe way to evaluate the bundle in the current context
    new Function(bundle)();

    // @ts-ignore
    expect(globalThis.testResult).toBe('bundle-works');
  });

  it('should support plugins in the final bundle', async () => {
    const bundler = new Bundler([{
      name: 'banner',
      generateBundle(code) {
        return `// MY BANNER\n${code}`;
      }
    }]);

    const bundle = await bundler.bundle({ entry: entryFile });
    expect(bundle.startsWith('// MY BANNER')).toBe(true);
  });
});
