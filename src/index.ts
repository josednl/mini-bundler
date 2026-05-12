#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
mini-bundler - An educational, minimalist bundler.

Usage:
  mini-bundler <entry-file> [options]

Options:
  -h, --help     Show this help message
  -v, --version  Show version information
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

  console.log(`Bundling starting from: ${absoluteEntryPath}`);
  
  // TODO: Initialize Bundler and start process
}

main();
