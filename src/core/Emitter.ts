import MagicString, { Bundle } from 'magic-string';
import remapping from '@ampproject/remapping';
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
    const bundle = new Bundle();

    const prefix = `(function(modules) {
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
    bundle.addSource(new MagicString(prefix));

    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      const isLast = i === modules.length - 1;

      const modulePrefix = `  "${module.id}": function(require, module, exports) {\n`;
      bundle.addSource(new MagicString(modulePrefix));

      // We add the transformed code to the bundle.
      // We use a suffix '?bundled' to distinguish the transformed version from the original
      // source, which helps avoid infinite loops during source map remapping.
      bundle.addSource({
        filename: module.id + '?bundled',
        content: new MagicString(module.transformedCode)
      });

      const moduleSuffix = `\n  }${isLast ? '' : ','}\n`;
      bundle.addSource(new MagicString(moduleSuffix));
    }

    bundle.addSource(new MagicString('});'));

    // 1. Generate the initial map (Transformed Code -> Bundle)
    const bundleMap = bundle.generateMap({
      file: 'bundle.js',
      includeContent: true,
      hires: true
    });

    // 2. Chain with the TS maps (Original Source -> Transformed Code -> Bundle)
    const mergedMap = remapping(
      bundleMap as any,
      (file) => {
        if (file.endsWith('?bundled')) {
          const originalId = file.slice(0, -8);
          const module = graph.getModule(originalId);
          return module?.sourceMap || null;
        }
        return null;
      }
    );

    const mapBase64 = Buffer.from(mergedMap.toString()).toString('base64');
    return bundle.toString() + `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${mapBase64}`;
  }
}
