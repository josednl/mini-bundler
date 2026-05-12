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

    await this.buildGraph(entry);
    
    let bundle = this.emitter.emit(this.graph, entry);
    
    // 5. Generate Bundle (Plugins)
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

      // 3. Transform (TS + Dependency Extraction)
      let { transformedCode, dependencies } = this.transformer.transform(code, currentPath);

      const resolvedDependencies = new Set<string>();

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
          
          // Remap the dependency in the transformed code to the resolved absolute path
          // This is a simple string replacement for educational purposes.
          const escapedSpecifier = depSpecifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(`(['"])${escapedSpecifier}\\1`, 'g');
          transformedCode = transformedCode.replace(regex, `$1${resolvedPath}$1`);

          if (!isExternal) {
            queue.push(resolvedPath);
          }
        } else {
          console.warn(`Could not resolve dependency: ${depSpecifier} from ${currentPath}`);
        }
      }

      const module: Module = {
        id: currentPath,
        originalCode: code,
        transformedCode,
        dependencies: resolvedDependencies,
        isExternal: false,
      };

      this.graph.addModule(module);
    }
  }

  getGraph(): ModuleGraph {
    return this.graph;
  }
}
