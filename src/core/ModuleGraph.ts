import type { Module } from '../types/index.js';

export class ModuleGraph {
  private modules = new Map<string, Module>();

  addModule(module: Module): void {
    this.modules.set(module.id, module);
  }

  getModule(id: string): Module | undefined {
    return this.modules.get(id);
  }

  hasModule(id: string): boolean {
    return this.modules.has(id);
  }

  getallModules(): Module[] {
    return Array.from(this.modules.values());
  }

  getDependencies(id: string): string[] {
    const module = this.getModule(id);
    return module ? Array.from(module.dependencies) : [];
  }
}
