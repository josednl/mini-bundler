import type { ModuleGraph } from './ModuleGraph.js';
import { normalizePath } from '../utils/path.js';

export class Emitter {
  /**
   * Generates a single-file bundle from the module graph.
   * Currently implements a simple CommonJS-style runtime wrapper.
   */
  emit(graph: ModuleGraph, entryId: string): string {
    const modules = graph.getallModules();
    const normalizedEntryId = normalizePath(entryId);

    let bundle = `(function(modules) {
  const cache = {};

  function __mini_require__(id) {
    if (cache[id]) return cache[id].exports;

    const module = { exports: {} };
    cache[id] = module;

    modules[id](__mini_require__, module, module.exports);

    return module.exports;
  }

  return __mini_require__("${normalizedEntryId}");
})({
`;

    for (const module of modules) {
      // For the simple runtime to work, the transformed code should be in CommonJS format.
      // We will ensure the Transformer outputs CJS for this purpose.
      bundle += `  "${module.id}": function(require, module, exports) {\n`;
      bundle += module.transformedCode;
      bundle += `\n  },\n`;
    }

    bundle += '});';

    return bundle;
  }
}
