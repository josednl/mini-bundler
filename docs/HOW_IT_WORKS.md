# How it Works: Internals of Mini Bundler

Mini Bundler is a minimalist, educational JavaScript/TypeScript bundler. This document explains the internal architecture and the bundling pipeline.

## Core Components

The bundler is structured around several specialized classes, each with a single responsibility:

1.  **`Bundler`**: The orchestrator. It manages the entire lifecycle, from building the graph to emitting the final bundle.
2.  **`ModuleGraph`**: A data structure that stores information about every module in the project (code, dependencies, exports, etc.).
3.  **`Resolver`**: Responsible for finding the absolute path of a module based on an import specifier (e.g., `./utils` -> `/path/to/project/utils.ts`).
4.  **`Transformer`**: Uses the TypeScript Compiler API to analyze source code (find imports/exports) and transpile it (TS -> JS, and applying tree shaking).
5.  **`PluginContainer`**: Manages and executes the lifecycle hooks of registered plugins.
6.  **`Emitter`**: Generates the final single-file bundle by wrapping all modules in a CommonJS-style runtime.

## The Bundling Pipeline

When you run `bundler.bundle()`, the following phases occur:

### 1. Graph Building (Discovery)
The bundler starts from the entry file and recursively discovers all dependencies.
- **Load**: Read the file from disk (or from a plugin's `load` hook).
- **Transform (Plugins)**: Apply plugin transformations (e.g., `replacePlugin`).
- **Analyze**: Use TypeScript's AST to identify `import` and `export` statements.
- **Resolve**: Find the absolute path for each dependency specifier.
- **Add to Graph**: Store the module and its metadata in the `ModuleGraph`.

### 2. Optimization (Tree Shaking)
Once the graph is complete, the bundler performs Dead Code Elimination:
- **Marking**: Starting from the entry point, it marks which exports are actually used by other modules.
- **Propagation**: If an export is used, the bundler also marks all dependencies required by that export.

### 3. Final Transformation
Each module is transpiled from TypeScript to JavaScript. During this phase:
- Unused exports (identified in phase 2) are removed.
- Import paths are normalized to absolute paths (internal representation) to ensure correct linking in the final bundle.
- Source maps are generated for each module.

### 4. Emission (Bundling)
The `Emitter` takes all transformed modules and combines them into a single string.
- It adds a minimal runtime that defines `require` and `exports`.
- Each module is wrapped in a function: `function(module, exports, require) { ... }`.
- The final bundle is optionally processed by plugins (`generateBundle` hook).

### 5. Watch Mode (Optional)
If enabled, the bundler uses `fs.watch` to monitor files in the graph. When a change is detected:
- It debounces the event to avoid multiple rebuilds for a single save.
- It re-runs the entire pipeline.
- It updates the set of watched files if dependencies changed.

## Plugin System

The plugin system is inspired by Rollup/Vite and supports the following hooks:

- **`resolveId(source, importer)`**: Customize how import specifiers are resolved.
- **`load(id)`**: Provide custom source code for a module ID (e.g., virtual modules).
- **`transform(code, id)`**: Modify the source code of a module.
- **`generateBundle(bundle)`**: Modify the final bundle string before it's written to disk.

---

This architecture prioritizes clarity and educational value, making it easy to see how modern bundlers like Vite or Rollup handle the complex task of modularizing JavaScript applications.
