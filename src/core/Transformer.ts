import ts from 'typescript';

export interface TransformResult {
  transformedCode: string;
  dependencies: string[];
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
   * Transpiles code and extracts module dependencies.
   */
  transform(code: string, fileName: string): TransformResult {
    const dependencies: string[] = [];

    // Use TS to parse the file and find imports
    const sourceFile = ts.createSourceFile(
      fileName,
      code,
      this.compilerOptions.target || ts.ScriptTarget.ESNext,
      true
    );

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          dependencies.push(node.moduleSpecifier.text);
        }
      } else if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments.length > 0 &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        // Dynamic import()
        dependencies.push((node.arguments[0] as ts.StringLiteral).text);
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    // Transpile the code
    const result = ts.transpileModule(code, {
      compilerOptions: this.compilerOptions,
      fileName,
    });

    return {
      transformedCode: result.outputText,
      dependencies,
    };
  }
}
