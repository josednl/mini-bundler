# Mini Bundler

An educational, minimalist JavaScript/TypeScript bundler built from scratch.

## 🎓 Educational Focus

This project is designed to be readable and easy to understand. If you want to learn how bundlers work internally, check out:

- **[How it Works: Internals of Mini Bundler](./docs/HOW_IT_WORKS.md)**: A deep dive into the architecture and pipeline.

## Features

- **TypeScript Native**: Resolves and transpiles TypeScript out of the box using the TypeScript Compiler API.
- **ESM Support**: Handles modern `import/export` syntax.
- **Module Graph**: Builds a complete dependency graph, including support for circular dependencies.
- **Plugin System**: Hook-based architecture (`resolveId`, `load`, `transform`, `generateBundle`) inspired by Rollup and Vite.
- **Tree Shaking**: Automatic Dead Code Elimination for unused exports.
- **Asset Handling**: Built-in support for JSON and CSS.
- **Watch Mode**: Automatic rebuilding on file changes.
- **Source Maps**: Full support for debugging original TS source code.
- **CJS Runtime**: Generates a single-file bundle with a lightweight CommonJS-style runtime.

## Installation

This project uses `pnpm`.

```bash
pnpm install
```

## Usage

### CLI

Bundle a TypeScript entry point:

```bash
pnpm start example/01-basic/main.ts
```

Options:
- `-h, --help`: Show help.
- `-v, --version`: Show version.
- `-o, --outDir`: Specify output directory (default: `dist`).
- `-w, --watch`: Enable watch mode.

### Programmatic API

```typescript
import { Bundler } from './src/core/Bundler.js';
import { jsonPlugin, cssPlugin } from './src/plugins/index.js';

const bundler = new Bundler([
  jsonPlugin(),
  cssPlugin()
]);

const bundle = await bundler.bundle({
  entry: './src/index.ts',
  outDir: './dist'
});
```

## 🚀 Examples

The `example/` directory contains several scenarios:

1. **[01-Basic](./example/01-basic)**: Simple TypeScript modules.
2. **[02-Plugins](./example/02-plugins)**: Using Path Aliases, String Replacement, and Virtual Modules.
3. **[03-Assets](./example/03-assets)**: Importing JSON and CSS files.
4. **[04-Tree Shaking](./example/04-tree-shaking)**: Demonstrating how unused code is removed from the bundle.

To run an example (e.g., Tree Shaking):
```bash
pnpm start example/04-tree-shaking/src/main.ts
node dist/bundle.js
```

## Development

- **Build**: `pnpm run build`
- **Test**: `pnpm run test`
- **Type Check**: `tsc --noEmit`

## License

MIT
