import ts from 'typescript';
import { dirname } from 'node:path';
import { normalizePath } from '../utils/path.js';

export interface ResolveResult {
  path: string | undefined;
  isExternal: boolean;
}

export class Resolver {
  private compilerOptions: ts.CompilerOptions;
  private host: ts.ModuleResolutionHost;

  constructor(compilerOptions: ts.CompilerOptions = {}) {
    this.compilerOptions = {
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ESNext,
      ...compilerOptions,
    };

    this.host = {
      fileExists: ts.sys.fileExists,
      readFile: ts.sys.readFile,
      directoryExists: ts.sys.directoryExists,
      realpath: ts.sys.realpath,
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getDirectories: ts.sys.getDirectories,
    };
  }

  /**
   * Resolves a module specifier relative to a containing file.
   * @param moduleName The module name or path (e.g., './utils' or 'lodash')
   * @param containingFile The absolute path of the file importing the module
   */
  resolve(moduleName: string, containingFile: string): ResolveResult {
    const result = ts.resolveModuleName(
      moduleName,
      containingFile,
      this.compilerOptions,
      this.host
    );

    if (result.resolvedModule) {
      return {
        path: normalizePath(result.resolvedModule.resolvedFileName),
        isExternal: result.resolvedModule.isExternalLibraryImport ?? false,
      };
    }

    return {
      path: undefined,
      isExternal: false,
    };
  }
}
