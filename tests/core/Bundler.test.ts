import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Bundler } from '../../src/core/Bundler.js';
import { normalizePath } from '../../src/utils/path.js';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('Bundler & ModuleGraph', () => {
  const testDir = normalizePath(resolve(process.cwd(), 'temp-test-bundler'));
  const entryFile = normalizePath(join(testDir, 'main.ts'));
  const utilsFile = normalizePath(join(testDir, 'utils.ts'));

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(entryFile, "import { foo } from './utils.js'; console.log(foo);");
    writeFileSync(utilsFile, "export const foo = 'bar';");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should build a complete module graph', async () => {
    const bundler = new Bundler();
    await bundler.bundle({ entry: entryFile });
    const graph = bundler.getGraph();

    expect(graph.hasModule(entryFile)).toBe(true);
    expect(graph.hasModule(utilsFile)).toBe(true);

    const mainModule = graph.getModule(entryFile);
    expect(mainModule?.dependencies.has(utilsFile)).toBe(true);
    expect(mainModule?.transformedCode).toContain('console.log');
  });

  it('should handle circular dependencies without infinite loops', async () => {
    const a = normalizePath(join(testDir, 'a.ts'));
    const b = normalizePath(join(testDir, 'b.ts'));
    writeFileSync(a, "import './b.js';");
    writeFileSync(b, "import './a.js';");

    const bundler = new Bundler();
    await bundler.bundle({ entry: a });
    const graph = bundler.getGraph();

    expect(graph.hasModule(a)).toBe(true);
    expect(graph.hasModule(b)).toBe(true);
  });
});
