import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Bundler } from '../../src/core/Bundler.js';
import { normalizePath } from '../../src/utils/path.js';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import type { Plugin } from '../../src/types/index.js';

describe('Plugin System', () => {
  const testDir = normalizePath(resolve(process.cwd(), 'temp-test-plugins'));
  const entryFile = normalizePath(join(testDir, 'main.ts'));

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
    writeFileSync(entryFile, "import { foo } from './virtual.js'; console.log(foo);");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should allow plugins to resolve and load virtual modules', async () => {
    const virtualPlugin: Plugin = {
      name: 'virtual',
      resolveId(source) {
        if (source === './virtual.js') {
          return 'virtual:foo';
        }
        return null;
      },
      load(id) {
        if (id === 'virtual:foo') {
          return "export const foo = 'virtual-bar';";
        }
        return null;
      }
    };

    const bundler = new Bundler([virtualPlugin]);
    const graph = await bundler.bundle({ entry: entryFile });

    expect(graph.hasModule('virtual:foo')).toBe(true);
    const virtualModule = graph.getModule('virtual:foo');
    expect(virtualModule?.originalCode).toContain('virtual-bar');
  });

  it('should allow plugins to transform code', async () => {
    const replacePlugin: Plugin = {
      name: 'replace',
      transform(code) {
        return code.replace('__VERSION__', '1.0.0');
      }
    };

    writeFileSync(entryFile, "export const version = '__VERSION__';");

    const bundler = new Bundler([replacePlugin]);
    const graph = await bundler.bundle({ entry: entryFile });

    const mainModule = graph.getModule(entryFile);
    expect(mainModule?.transformedCode).toContain('1.0.0');
    expect(mainModule?.transformedCode).not.toContain('__VERSION__');
  });
});
