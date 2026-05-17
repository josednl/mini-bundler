import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Bundler } from '../src/core/Bundler.js';

describe('Watch Mode', () => {
  const testDir = resolve(process.cwd(), 'tests/temp-watch');
  const entryPath = join(testDir, 'entry.ts');
  const outDir = join(testDir, 'dist');
  const bundlePath = join(outDir, 'bundle.js');

  let bundler: Bundler | null = null;

  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
    writeFileSync(entryPath, 'export const a = 1;');
    bundler = new Bundler();
  });

  afterEach(() => {
    if (bundler) {
      bundler.close();
    }
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should rebuild when entry file changes', async () => {
    if (!bundler) return;
    
    // We need to capture the rebuild log or use a spy
    const consoleSpy = vi.spyOn(console, 'log');

    await bundler.bundle({
      entry: entryPath,
      outDir,
      watch: true
    });

    expect(readFileSync(bundlePath, 'utf-8')).toContain('exports.a = 1;');

    // Simulate change
    writeFileSync(entryPath, 'export const a = 2;');

    // Wait for debounce and rebuild
    await new Promise(r => setTimeout(r, 500));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Change detected, rebuilding...'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Rebuild complete'));
    
    expect(readFileSync(bundlePath, 'utf-8')).toContain('exports.a = 2;');

    // Clean up watchers (important for tests)
    // Actually Bundler doesn't have a stopWatch method yet.
    // I should probably add one to close watchers.
  });
});
