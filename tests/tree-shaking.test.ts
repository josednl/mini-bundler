import { describe, it, expect } from 'vitest';
import { Bundler } from '../src/core/Bundler.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Tree Shaking', () => {
  it('should remove unused exports', async () => {
    const testDir = join(tmpdir(), 'mini-bundler-tree-shaking-' + Date.now());
    mkdirSync(testDir, { recursive: true });

    const entryFile = join(testDir, 'main.ts');
    const mathFile = join(testDir, 'math.ts');

    writeFileSync(mathFile, `
      export const add = (a: number, b: number) => a + b;
      export const sub = (a: number, b: number) => a - b;
    `);

    writeFileSync(entryFile, `
      import { add } from './math.js';
      console.log(add(1, 2));
    `);

    const bundler = new Bundler();
    const bundle = await bundler.bundle({ entry: entryFile });

    // Expect 'add' to be present
    expect(bundle).toContain('add');
    
    // Expect 'sub' to NOT be present if tree shaking is working
    // (Currently it WILL be present because tree shaking is not implemented)
    expect(bundle).not.toContain('sub');

    rmSync(testDir, { recursive: true, force: true });
  });

  it('should handle namespace imports', async () => {
    const testDir = join(tmpdir(), 'mini-bundler-ts-ns-' + Date.now());
    mkdirSync(testDir, { recursive: true });

    const entryFile = join(testDir, 'main.ts');
    const mathFile = join(testDir, 'math.ts');

    writeFileSync(mathFile, `
      export const add = (a: number, b: number) => a + b;
      export const sub = (a: number, b: number) => a - b;
    `);

    writeFileSync(entryFile, `
      import * as math from './math.js';
      console.log(math.add(1, 2));
    `);

    const bundler = new Bundler();
    const bundle = await bundler.bundle({ entry: entryFile });

    expect(bundle).toContain('add');
    expect(bundle).toContain('sub'); // Namespace import keeps everything

    rmSync(testDir, { recursive: true, force: true });
  });

  it('should handle re-exports', async () => {
    const testDir = join(tmpdir(), 'mini-bundler-ts-reexport-' + Date.now());
    mkdirSync(testDir, { recursive: true });

    const entryFile = join(testDir, 'main.ts');
    const indexFile = join(testDir, 'index.ts');
    const utilsFile = join(testDir, 'utils.ts');

    writeFileSync(utilsFile, `
      export const used = () => "used";
      export const unused = () => "unused";
    `);

    writeFileSync(indexFile, `
      export { used, unused } from './utils.js';
    `);

    writeFileSync(entryFile, `
      import { used } from './index.js';
      console.log(used());
    `);

    const bundler = new Bundler();
    const bundle = await bundler.bundle({ entry: entryFile });

    expect(bundle).toContain('used');
    expect(bundle).not.toContain('unused');

    rmSync(testDir, { recursive: true, force: true });
  });
});
