import { describe, it, expect } from 'vitest';
import { Bundler } from '../src/core/Bundler.js';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePath } from '../src/utils/path.js';

describe('Source Maps', () => {
  it('should generate a bundle with a source map', async () => {
    const testDir = normalizePath(join(process.cwd(), 'tests-tmp-sourcemaps'));
    mkdirSync(testDir, { recursive: true });

    const entryFile = join(testDir, 'index.ts');
    const utilFile = join(testDir, 'utils.ts');

    writeFileSync(entryFile, `
      import { hello } from './utils.js';
      console.log(hello('world'));
    `);
    writeFileSync(utilFile, `
      export const hello = (name: string) => \`Hello, \${name}!\`;
    `);

    const bundler = new Bundler();
    const bundle = await bundler.bundle({
      entry: entryFile,
    });

    expect(bundle).toContain('//# sourceMappingURL=data:application/json;charset=utf-8;base64,');
    
    // Extract map
    const mapBase64 = bundle.split('base64,')[1];
    const mapJson = JSON.parse(Buffer.from(mapBase64, 'base64').toString('utf-8'));

    expect(mapJson.version).toBe(3);
    expect(mapJson.file).toBe('bundle.js');
    expect(mapJson.sources).toContain(normalizePath(entryFile));
    expect(mapJson.sources).toContain(normalizePath(utilFile));

    rmSync(testDir, { recursive: true, force: true });
  });
});
