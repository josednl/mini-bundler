# Project Context: Mini Bundler

This document serves as the foundational mandate for Gemini CLI when working on this project.

## Technical Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript
- **Runner**: tsx (preferred over ts-node)
- **Testing**: Vitest
- **CLI Exportable**: The project should work both as a CLI tool and as a programmatic API.
- **Module Formats**: ESM and CommonJS support.
- **Git**: Conventional Commits
- **Package Manager**: pnpm

## Project Goals

- **Educational First**: The main objective is learning how modern bundlers work internally.
- **Minimalist Design**: Keep the implementation understandable, modular, and easy to reason about.
- **Incremental Complexity**: Features should be implemented progressively without sacrificing readability.
- **Developer Experience**: Provide clear logs, predictable behavior, and maintainable architecture.

## Architecture

- **Object-Oriented Design**: Structure the project around core classes such as:
  - `Bundler`
  - `ModuleGraph`
  - `PluginContainer`
  - `Resolver`
  - `Transformer`
  - `Emitter`

- **Plugin System**: Implement a hook-based plugin system inspired by Rollup/Vite:
  - `resolveId`
  - `load`
  - `transform`
  - `generateBundle`

- **Dependency Graph**: Build and maintain a module graph to track imports and bundle relationships.

- **Bundling Pipeline**:
  1. Resolve modules
  2. Load source files
  3. Transform TypeScript/JavaScript
  4. Build dependency graph
  5. Generate output bundles

- **Output Formats**:
  - ESM
  - CommonJS
  - Future support for IIFE/UMD

- **CLI Entry Point**:
  - `src/index.ts`
  - Example usage:

    ```bash
    mini-bundler src/index.ts
    ```

## Module Resolution

The bundler should support:

- Relative imports
- `node_modules` resolution
- TypeScript path aliases
- JSON imports
- CSS imports
- Static asset handling
- Extension resolution (`.ts`, `.js`, `.json`, etc.)

## Coding Standards

- **Imports**: Always include the `.js` extension in local imports (ESM requirement).
- **Types**: Use `import type` for type-only imports to satisfy `verbatimModuleSyntax`.
- **Naming**:
  - PascalCase for classes
  - camelCase for methods and variables
  - UPPER_SNAKE_CASE for constants
- **Small Classes & Single Responsibility**:
  - Each core class should have a focused and isolated responsibility.
- **Atomic Commits**:
  - Each commit must represent a single logical and functional change.
  - Ensure all tests pass before committing.
- **Language**:
  - Source code in English
  - Documentation in English
  - CLI messages in English
  - Comments in English

## Key Workflows

- **PowerShell Commands**: Do not use `&&` as it is not supported in all PowerShell versions. To simulate `&&`, use the pattern `command1; if ($?) { command2 }`.
  
- **Pre-commit**: Always run pnpm run precommit before any commit. This ensures:
    1. No TypeScript errors (tsc --noEmit).  
    2. All tests pass (vitest --run).  
- **Documentation**: Always update GEMINI.md and README.md after significant changes or when new patterns are established.

## Testing

- Use **Vitest** for unit and integration tests.
- Test the full bundling pipeline end-to-end.
- Validate generated bundles using snapshot testing when appropriate.
- Cover edge cases for:
- circular dependencies
- mixed module systems
- plugin behavior
- invalid imports
- asset resolution

## Plugin System Principles

- Plugins should be composable and isolated.
- Hooks should be async-friendly.  
- Internal APIs should remain stable and predictable.
- Avoid excessive abstraction early in development.
- Prefer clarity over flexibility in the first iterations.

## Performance Principles

- Prioritize readability over micro-optimizations.
- Implement only the performance improvements necessary for educational scalability.
- Optimize progressively as complexity grows.

## Potential future optimizations

- Module caching
- Incremental builds
- Smarter dependency invalidation
- Parallel transformations  

## Skills & Principles

- **Compiler & Bundler Fundamentals**:Understand parsing, module graphs, dependency resolution, and code generation.
- **TypeScript Compiler APIs**:Use TypeScript tooling responsibly and keep transformations understandable.
- **Plugin Architecture**:Design predictable lifecycle hooks with low coupling.
- **Node.js Best Practices**:Follow modular architecture and async patterns where appropriate.
- **DX First**:Error messages should be descriptive and actionable.

## Roadmap

- [x] **Project Bootstrap**: Configure TypeScript, Vitest, ESM, and CLI structure.
- [x] **Core Bundler**: Build the basic dependency graph and single-file bundling pipeline.
- [x] **TypeScript Transpilation**: Transpile TypeScript source files into JavaScript.
- [x] **ESM & CommonJS Support**: Parse and bundle both module systems (via TS API).
- [x] **Plugin System**: Implement lifecycle hooks and plugin container.
- [x] **Output Formats**: Add ESM and CommonJS emitters (Basic CJS runtime).
- [x] **Asset Handling**: Support JSON, CSS, and static assets.
- [ ] **Tree Shaking**: Remove unused exports/imports.
- [ ] **Source Maps**: Generate source maps for debugging.
- [ ] **Watch Mode**: Rebuild automatically on file changes.
- [ ] **Plugin Ecosystem**: Create official example plugins.
- [x] **Documentation & Examples**: Create educational examples explaining bundler internals.

## Evolution Notes

- [2026-05-13]: Asset Handling Implemented
-> Reason: Added support for JSON, CSS, and static assets (images, etc.) via dedicated plugins (jsonPlugin, cssPlugin, assetPlugin).
-> Implication: The bundler can now handle a wider variety of file types, transforming them into executable JavaScript modules within the bundle.

- [2026-05-12]: Bundle Generation (Emitter) Implemented
-> Reason: Added an Emitter with a CJS-style runtime to generate functional single-file bundles.
-> Implication: The project is now a working bundler capable of producing executable output from TypeScript sources.

- [2026-05-12]: Plugin System Integrated
-> Reason: Implemented a hook-based plugin system (resolveId, load, transform) to allow extensibility.
-> Implication: The bundling pipeline is now customizable via external plugins, following Rollup/Vite patterns.

- [2026-05-12]: Core Architecture Implemented
-> Reason: Completed the Module Graph, Resolver, and Transformer using the TypeScript Compiler API.
-> Implication: The bundler can now recursively discover and transpile dependencies.

- [2026-05-12]: Initial Project Definition
-> Reason: Established the architectural foundations and educational goals for the mini bundler
-> Implication: Future development should prioritize clarity, modularity, and incremental learning over production-level complexity.
