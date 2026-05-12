# Mini Bundler

An educational, minimalist JavaScript/TypeScript bundler built from scratch.

## Features

- **TypeScript Native**: Resolves and transpiles TypeScript out of the box using the TypeScript Compiler API.
- **ESM Support**: Handles modern `import/export` syntax.
- **Module Graph**: Builds a complete dependency graph, including support for circular dependencies.
- **Plugin System**: Hook-based architecture (`resolveId`, `load`, `transform`, `generateBundle`) inspired by Rollup and Vite.
- **CJS Runtime**: Generates a single-file bundle with a lightweight CommonJS-style runtime.

## Installation

This project uses `pnpm`.

\`\`\`bash
pnpm install
\`\`\`

## Usage

### CLI

Bundle a TypeScript entry point:

\`\`\`bash
pnpm start example/main.ts
\`\`\`

Options:
- \`-h, --help\`: Show help.
- \`-v, --version\`: Show version.
- \`-o, --outDir \`: Specify output directory (default: \`dist\`).

### Programmatic API

\`\`\`typescript
import { Bundler } from './src/core/Bundler.js';

const bundler = new Bundler();
const bundle = await bundler.bundle({
  entry: './src/index.ts',
  outDir: './dist'
});

console.log(bundle); // The generated bundle code
\`\`\`

## Functional Example

A working example is provided in the \`example/\` directory. To bundle and run it:

1. **Bundle the example**:
   \`\`\`bash
   pnpm start example/main.ts
   \`\`\`

2. **Run the generated bundle**:
   \`\`\`bash
   node dist/bundle.js
   \`\`\`

You should see: \`Hello, World from Mini Bundler!\`

## Development

- **Build**: \`pnpm run build\`
- **Test**: \`pnpm run test\`
- **Type Check**: \`tsc --noEmit\`

## License

MIT
