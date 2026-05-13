#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Bundler } from './core/Bundler.js';
import { jsonPlugin, cssPlugin, assetPlugin } from './plugins/index.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
mini-bundler - An educational, minimalist bundler.

Usage:
  mini-bundler <entry-file> [options]

Options:
  -h, --help           Show this help message
  -v, --version        Show version information
  -o, --outDir <dir>   Output directory (default: dist)
    `);
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log('mini-bundler v0.1.0');
    process.exit(0);
  }

  const entryFile = args[0];
  if (!entryFile) {
    console.error('Error: No entry file provided.');
    process.exit(1);
  }

  const absoluteEntryPath = resolve(process.cwd(), entryFile);

  if (!existsSync(absoluteEntryPath)) {
    console.error(`Error: Entry file not found: ${absoluteEntryPath}`);
    process.exit(1);
  }

  const outDirIndex = args.indexOf('--outDir') !== -1 ? args.indexOf('--outDir') : args.indexOf('-o');
  const outDir = outDirIndex !== -1 ? args[outDirIndex + 1] : 'dist';

  console.log(`Bundling starting from: ${absoluteEntryPath}`);
  
  try {
    const bundler = new Bundler([
      jsonPlugin(),
      cssPlugin(),
      assetPlugin()
    ]);
    await bundler.bundle({
      entry: absoluteEntryPath,
      outDir: resolve(process.cwd(), outDir)
    });
    console.log(`Bundle generated successfully in ${outDir}/bundle.js`);
  } catch (error) {
    console.error('Bundling failed:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
