import ts from 'typescript';

export interface AnalysisResult {
  dependencies: string[];
  exports: Set<string>;
  imports: Map<string, Set<string>>; // specifier -> Set of symbols
  reExports: Map<string, { source: string, local: string }>;
}

export interface TransformResult {
  transformedCode: string;
  sourceMap?: any;
}

export class Transformer {
  private compilerOptions: ts.CompilerOptions;

  constructor(compilerOptions: ts.CompilerOptions = {}) {
    this.compilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.CommonJS,
      ...compilerOptions,
    };
  }

  /**
   * Analyzes the code to extract dependencies, exports, and imports.
   */
  analyze(code: string, fileName: string): AnalysisResult {
    const dependencies: string[] = [];
    const exports = new Set<string>();
    const imports = new Map<string, Set<string>>();
    const reExports = new Map<string, { source: string, local: string }>();

    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      this.compilerOptions.target || ts.ScriptTarget.ESNext,
      true
    );

    const visit = (node: ts.Node) => {
      // Extract imports
      if (ts.isImportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          const specifier = node.moduleSpecifier.text;
          dependencies.push(specifier);

          if (!imports.has(specifier)) {
            imports.set(specifier, new Set());
          }

          if (node.importClause) {
            if (node.importClause.name) {
              // import defaultExport from '...'
              imports.get(specifier)!.add('default');
            }
            if (node.importClause.namedBindings) {
              if (ts.isNamedImports(node.importClause.namedBindings)) {
                // import { a, b as c } from '...'
                node.importClause.namedBindings.elements.forEach(el => {
                  imports.get(specifier)!.add(el.propertyName?.text || el.name.text);
                });
              } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
                // import * as ns from '...'
                imports.get(specifier)!.add('*');
              }
            }
          }
        }
      } 
      // Extract exports
      else if (ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          // export { x } from './y'
          const specifier = node.moduleSpecifier.text;
          dependencies.push(specifier);
          
          if (node.exportClause && ts.isNamedExports(node.exportClause)) {
            node.exportClause.elements.forEach(el => {
              const exportedName = el.name.text;
              const localName = el.propertyName?.text || el.name.text;
              exports.add(exportedName);
              reExports.set(exportedName, { source: specifier, local: localName });

              // Also track as an import from that specifier
              if (!imports.has(specifier)) {
                imports.set(specifier, new Set());
              }
              imports.get(specifier)!.add(localName);
            });
          } else {
            // export * from './y'
            if (!imports.has(specifier)) {
              imports.set(specifier, new Set());
            }
            imports.get(specifier)!.add('*');
          }
        } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
          // export { a, b as c }
          node.exportClause.elements.forEach(el => {
            exports.add(el.name.text);
          });
        }
      } else if (ts.isExportAssignment(node)) {
        // export default ...
        exports.add('default');
      } else if (this.isExported(node)) {
        if (ts.isFunctionDeclaration(node) && node.name) {
          exports.add(node.name.text);
        } else if (ts.isClassDeclaration(node) && node.name) {
          exports.add(node.name.text);
        } else if (ts.isVariableStatement(node)) {
          node.declarationList.declarations.forEach(decl => {
            if (ts.isIdentifier(decl.name)) {
              exports.add(decl.name.text);
            }
          });
        }
      }
      
      // Dynamic import()
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length > 0 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        dependencies.push((node.arguments[0] as ts.StringLiteral).text);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return { dependencies, exports, imports, reExports };
  }

  /**
   * Transpiles code and removes unused exports.
   */
  transform(
    code: string, 
    fileName: string, 
    usedExports: Set<string>,
    pathOverrides?: Map<string, string>
  ): TransformResult {
    const virtualFileName = fileName.match(/\.(ts|js|tsx|jsx)$/) 
      ? fileName 
      : `${fileName}.ts`;

    const treeShakingTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (sourceFile) => {
        const visitor = (node: ts.Node): ts.Node | undefined => {
          if (this.isExported(node)) {
            let names: string[] = [];
            if (ts.isFunctionDeclaration(node) && node.name) {
              names = [node.name.text];
            } else if (ts.isClassDeclaration(node) && node.name) {
              names = [node.name.text];
            } else if (ts.isVariableStatement(node)) {
              names = node.declarationList.declarations
                .filter(decl => ts.isIdentifier(decl.name))
                .map(decl => (decl.name as ts.Identifier).text);
            }

            const isAnyNameUsed = names.some(name => usedExports.has(name));
            
            if (!isAnyNameUsed && names.length > 0) {
              return undefined;
            }
          }

          if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
            const usedElements = node.exportClause.elements.filter(el => usedExports.has(el.name.text));
            if (usedElements.length === 0) return undefined;
            return ts.factory.updateExportDeclaration(
              node,
              node.modifiers,
              node.isTypeOnly,
              ts.factory.createNamedExports(usedElements),
              node.moduleSpecifier,
              node.attributes
            );
          }

          if (ts.isExportAssignment(node)) {
            if (!usedExports.has('default')) return undefined;
          }

          return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
      };
    };

    const pathRemappingTransformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
      return (sourceFile) => {
        const visitor = (node: ts.Node): ts.Node => {
          if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
            if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
              const specifier = node.moduleSpecifier.text;
              const resolvedPath = pathOverrides?.get(specifier);
              if (resolvedPath) {
                const newSpecifier = ts.factory.createStringLiteral(resolvedPath);
                if (ts.isImportDeclaration(node)) {
                  return ts.factory.updateImportDeclaration(
                    node,
                    node.modifiers,
                    node.importClause,
                    newSpecifier,
                    node.attributes
                  );
                } else {
                  return ts.factory.updateExportDeclaration(
                    node,
                    node.modifiers,
                    node.isTypeOnly,
                    node.exportClause,
                    newSpecifier,
                    node.attributes
                  );
                }
              }
            }
          }
          
          // Dynamic import()
          if (
            ts.isCallExpression(node) &&
            node.expression.kind === ts.SyntaxKind.ImportKeyword &&
            node.arguments.length > 0 &&
            ts.isStringLiteral(node.arguments[0])
          ) {
            const specifier = (node.arguments[0] as ts.StringLiteral).text;
            const resolvedPath = pathOverrides?.get(specifier);
            if (resolvedPath) {
              return ts.factory.updateCallExpression(
                node,
                node.expression,
                node.typeArguments,
                [ts.factory.createStringLiteral(resolvedPath)]
              );
            }
          }

          return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitNode(sourceFile, visitor) as ts.SourceFile;
      };
    };

    const result = ts.transpileModule(code, {
      compilerOptions: {
        ...this.compilerOptions,
        sourceMap: true,
        inlineSources: true,
      },
      fileName: virtualFileName,
      transformers: {
        before: [treeShakingTransformer, pathRemappingTransformer]
      }
    });

    return {
      transformedCode: result.outputText,
      sourceMap: result.sourceMapText ? JSON.parse(result.sourceMapText) : undefined,
    };
  }

  private isExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
      (!!node.parent && ts.isExportAssignment(node.parent))
    );
  }
}
