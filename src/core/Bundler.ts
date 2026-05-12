import { readFileSync } from 'node:fs';
import { Resolver } from './Resolver.js';
import { Transformer } from './Transformer.js';
import { ModuleGraph } from './ModuleGraph.js';
import { normalizePath } from '../utils/path.js';
import type { BundleOptions, Module } from '../types/index.js';

export class Bundler {
  private resolver: Resolver;
  private transformer: Transformer;
  private graph: ModuleGraph;

  constructor() {
    this.resolver = new Resolver();
    this.transformer = new Transformer();
    this.graph = new ModuleGraph();
  }

  async bundle(options: BundleOptions): Promise<ModuleGraph> {
    const entry = normalizePath(options.entry);
    await this.buildGraph(entry);
    return this.graph;
  }

  private async buildGraph(entryPath: string): Promise<void> {
    const queue = [entryPath];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      if (visited.has(currentPath)) continue;
      visited.add(currentPath);

      const code = readFileSync(currentPath, 'utf-8');
      const { transformedCode, dependencies } = this.transformer.transform(code, currentPath);

      const resolvedDependencies = new Set<string>();

      for (const depSpecifier of dependencies) {
        const resolution = this.resolver.resolve(depSpecifier, currentPath);
        
        if (resolution.path) {
          resolvedDependencies.add(resolution.path);
          if (!resolution.isExternal) {
            queue.push(resolution.path);
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
        isExternal: false, // For now, we only track internal modules in the graph
      };

      this.graph.addModule(module);
    }
  }

  getGraph(): ModuleGraph {
    return this.graph;
  }
}
