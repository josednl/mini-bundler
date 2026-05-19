import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Bundler } from '../src/core/Bundler.js';
import { normalizePath } from '../src/utils/path.js';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { aliasPlugin, replacePlugin, virtualPlugin } from '../src/plugins/index.js';

describe('Official Plugins', () => {
  const testDir = normalizePath(resolve(process.cwd(), 'temp-test-official-plugins'));
  const entryFile = normalizePath(join(testDir, 'main.ts'));

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('aliasPlugin', () => {
    it('should resolve aliased paths', async () => {
      const utilsDir = normalizePath(join(testDir, 'utils'));
      mkdirSync(utilsDir);
      writeFileSync(join(utilsDir, 'math.ts'), 'export const add = (a, b) => a + b;');
      writeFileSync(entryFile, "import { add } from '@/math.js'; console.log(add(1, 2));");

      const bundler = new Bundler([
        aliasPlugin({
          entries: {
            '@': utilsDir
          }
        })
      ]);

      await bundler.bundle({ entry: entryFile });
      const graph = bundler.getGraph();

      const mathFile = normalizePath(join(utilsDir, 'math.ts'));
      expect(graph.hasModule(mathFile)).toBe(true);
    });
  });

  describe('replacePlugin', () => {
    it('should replace strings in the source code', async () => {
      writeFileSync(entryFile, "export const env = __NODE_ENV__;");

      const bundler = new Bundler([
        replacePlugin({
          values: {
            '__NODE_ENV__': "'production'"
          }
        })
      ]);

      await bundler.bundle({ entry: entryFile });
      const graph = bundler.getGraph();

      const mainModule = graph.getModule(entryFile);
      expect(mainModule?.transformedCode).toContain("'production'");
      expect(mainModule?.transformedCode).not.toContain('__NODE_ENV__');
    });

    it('should respect delimiters', async () => {
      writeFileSync(entryFile, "export const version = 'VERSION';");

      const bundler = new Bundler([
        replacePlugin({
          values: {
            'VERSION': '1.2.3'
          },
          delimiters: ['#', '#']
        })
      ]);

      // Should not replace because delimiters don't match
      await bundler.bundle({ entry: entryFile });
      let mainModule = bundler.getGraph().getModule(entryFile);
      expect(mainModule?.transformedCode).toContain('VERSION');

      // Now with correct delimiters
      writeFileSync(entryFile, "export const version = '#VERSION#';");
      await bundler.bundle({ entry: entryFile });
      mainModule = bundler.getGraph().getModule(entryFile);
      expect(mainModule?.transformedCode).toContain('1.2.3');
    });
  });

  describe('virtualPlugin', () => {
    it('should load virtual modules', async () => {
      writeFileSync(entryFile, "import config from 'virtual:config'; console.log(config.port);");

      const bundler = new Bundler([
        virtualPlugin({
          modules: {
            'virtual:config': 'export default { port: 8080 };'
          }
        })
      ]);

      await bundler.bundle({ entry: entryFile });
      const graph = bundler.getGraph();

      expect(graph.hasModule('virtual:config')).toBe(true);
      const configModule = graph.getModule('virtual:config');
      expect(configModule?.originalCode).toContain('port: 8080');
    });
  });
});
