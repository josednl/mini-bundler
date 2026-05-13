import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Bundler } from '../src/core/Bundler.js';
import { normalizePath } from '../src/utils/path.js';
import { jsonPlugin } from '../src/plugins/json.js';
import { cssPlugin } from '../src/plugins/css.js';
import { assetPlugin } from '../src/plugins/asset.js';
import { resolve, join } from 'node:path';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';

describe('Asset Handling', () => {
  const testDir = normalizePath(resolve(process.cwd(), 'temp-test-assets'));
  const entryFile = normalizePath(join(testDir, 'main.ts'));

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should bundle a JSON file using a plugin', async () => {
    const jsonFile = normalizePath(join(testDir, 'data.json'));
    writeFileSync(entryFile, "import data from './data.json'; console.log(data.foo);");
    writeFileSync(jsonFile, '{"foo": "bar"}');

    const bundler = new Bundler([jsonPlugin()]);
    const bundle = await bundler.bundle({ entry: entryFile });
    
    expect(bundle).toContain('"foo": "bar"');
    
    const graph = bundler.getGraph();
    expect(graph.hasModule(jsonFile)).toBe(true);
  });

  it('should bundle a CSS file using a plugin', async () => {
    const cssFile = normalizePath(join(testDir, 'style.css'));
    writeFileSync(entryFile, "import './style.css';");
    writeFileSync(cssFile, 'body { color: red; }');

    const bundler = new Bundler([cssPlugin()]);
    const bundle = await bundler.bundle({ entry: entryFile });
    
    expect(bundle).toContain('body { color: red; }');
    expect(bundle).toContain('document.createElement(\'style\')');
    
    const graph = bundler.getGraph();
    expect(graph.hasModule(cssFile)).toBe(true);
  });

  it('should bundle a static asset as base64 using a plugin', async () => {
    const assetFile = normalizePath(join(testDir, 'image.png'));
    writeFileSync(entryFile, "import logo from './image.png'; console.log(logo);");
    // Write a dummy PNG header
    writeFileSync(assetFile, Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]));

    const bundler = new Bundler([assetPlugin()]);
    const bundle = await bundler.bundle({ entry: entryFile });
    
    expect(bundle).toContain('data:image/png;base64,');
    expect(bundle).toContain('iVBORw0KGgo='); // Base64 of the dummy header
    
    const graph = bundler.getGraph();
    expect(graph.hasModule(assetFile)).toBe(true);
  });
});
