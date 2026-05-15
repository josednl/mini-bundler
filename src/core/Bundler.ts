import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Resolver } from './Resolver.js';
import { Transformer } from './Transformer.js';
import { ModuleGraph } from './ModuleGraph.js';
import { PluginContainer } from './PluginContainer.js';
import { Emitter } from './Emitter.js';
import { normalizePath } from '../utils/path.js';
import type { BundleOptions, Module, Plugin } from '../types/index.js';

export class Bundler {
  private resolver: Resolver;
  private transformer: Transformer;
  private graph: ModuleGraph;
  private pluginContainer: PluginContainer;
  private emitter: Emitter;

  constructor(plugins: Plugin[] = []) {
    this.resolver = new Resolver();
    this.transformer = new Transformer();
    this.graph = new ModuleGraph();
    this.pluginContainer = new PluginContainer(plugins);
    this.emitter = new Emitter();
  }

  async bundle(options: BundleOptions): Promise<string> {
    const entry = normalizePath(options.entry);
    
    // Initialize plugin container if plugins are provided in options
    if (options.plugins) {
      this.pluginContainer = new PluginContainer(options.plugins);
    }

    // Phase 1: Build Graph and Analyze
    await this.buildGraph(entry);
    
    // Phase 2: Optimize (Tree Shaking)
    this.optimize(entry);

    // Phase 3: Final Transformation
    await this.transformModules();

    // Phase 4: Emit
    let bundle = this.emitter.emit(this.graph, entry);
    
    // Phase 5: Generate Bundle (Plugins)
    bundle = await this.pluginContainer.generateBundle(bundle);

    if (options.outDir) {
      const distDir = normalizePath(options.outDir);
      mkdirSync(distDir, { recursive: true });
      writeFileSync(join(distDir, 'bundle.js'), bundle);
    }

    return bundle;
  }

  private async buildGraph(entryPath: string): Promise<void> {
    const queue = [entryPath];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      if (visited.has(currentPath)) continue;
      visited.add(currentPath);

      // 1. Load
      let code = await this.pluginContainer.load(currentPath);
      if (code === null) {
        code = readFileSync(currentPath, 'utf-8');
      }

      // 2. Transform (Plugins)
      code = await this.pluginContainer.transform(code, currentPath);

      // 3. Analyze (TS AST)
      const { dependencies, exports, imports, reExports } = this.transformer.analyze(code, currentPath);

      const resolvedDependencies = new Set<string>();
      const resolvedImports = new Map<string, Set<string>>();
      const resolvedReExports = new Map<string, { source: string, local: string }>();

      for (const depSpecifier of dependencies) {
        // 4. Resolve
        let resolvedPath = await this.pluginContainer.resolveId(depSpecifier, currentPath);
        let isExternal = false;

        if (!resolvedPath) {
          const resolution = this.resolver.resolve(depSpecifier, currentPath);
          resolvedPath = resolution.path ?? null;
          isExternal = resolution.isExternal;
        }

        if (resolvedPath) {
          resolvedDependencies.add(resolvedPath);
          
          // Map specifier to absolute path for imports
          const importedSymbols = imports.get(depSpecifier);
          if (importedSymbols) {
            resolvedImports.set(resolvedPath, importedSymbols);
          }

          if (!isExternal) {
            queue.push(resolvedPath);
          }
        } else {
          console.warn(`Could not resolve dependency: ${depSpecifier} from ${currentPath}`);
        }
      }

      // Resolve re-exports to absolute paths
      for (const [exportName, info] of reExports) {
        let resolvedPath = await this.pluginContainer.resolveId(info.source, currentPath);
        if (!resolvedPath) {
          resolvedPath = this.resolver.resolve(info.source, currentPath).path ?? null;
        }
        if (resolvedPath) {
          resolvedReExports.set(exportName, { source: resolvedPath, local: info.local });
        }
      }

      const module: Module = {
        id: currentPath,
        originalCode: code,
        transformedCode: '', // Will be filled in transformModules
        dependencies: resolvedDependencies,
        isExternal: false,
        exports,
        imports: resolvedImports,
        reExports: resolvedReExports,
        usedExports: new Set(),
      };

      this.graph.addModule(module);
    }
  }

  private optimize(entryPath: string): void {
    const entryModule = this.graph.getModule(entryPath);
    if (!entryModule) return;

    // Phase 1: Mark all exports of the entry module as used
    entryModule.exports.forEach(e => entryModule.usedExports.add(e));
    
    const queue = [entryPath];
    const processed = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (processed.has(currentId)) continue;
      processed.add(currentId);

      const module = this.graph.getModule(currentId);
      if (!module) continue;

      // Check all imports of the current module
      for (const [depId, symbols] of module.imports) {
        const depModule = this.graph.getModule(depId);
        if (!depModule) continue;

        let anyImportUsed = false;

        symbols.forEach(sym => {
          if (sym === '*') {
            // Namespace import: mark all as used
            depModule.exports.forEach(e => depModule.usedExports.add(e));
            anyImportUsed = true;
          } else {
            // Check if this symbol is a re-export
            // Find if any export of the current module re-exports this symbol
            let isReExportUsed = false;
            let isNormalImport = true;

            for (const [exportName, info] of module.reExports) {
              if (info.source === depId && info.local === sym) {
                isNormalImport = false;
                if (module.usedExports.has(exportName)) {
                  isReExportUsed = true;
                }
              }
            }

            if (isNormalImport || isReExportUsed) {
              depModule.usedExports.add(sym);
              anyImportUsed = true;
            }
          }
        });

        if (anyImportUsed) {
          queue.push(depId);
        }
      }
    }
  }

  private async transformModules(): Promise<void> {
    for (const module of this.graph.getallModules()) {
      // Prepare path remapping
      const pathOverrides = new Map<string, string>();
      const { dependencies } = this.transformer.analyze(module.originalCode, module.id);
      
      for (const specifier of dependencies) {
        let resolvedPath = await this.pluginContainer.resolveId(specifier, module.id);
        if (!resolvedPath) {
          resolvedPath = this.resolver.resolve(specifier, module.id).path ?? null;
        }
        if (resolvedPath) {
          pathOverrides.set(specifier, resolvedPath);
        }
      }

      // Re-transform with tree shaking info and path remapping
      const { transformedCode, sourceMap } = this.transformer.transform(
        module.originalCode, 
        module.id, 
        module.usedExports,
        pathOverrides
      );
      
      module.transformedCode = transformedCode;
      module.sourceMap = sourceMap;
    }
  }

  getGraph(): ModuleGraph {
    return this.graph;
  }
}
