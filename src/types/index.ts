export interface Module {
  id: string; // Absolute path
  originalCode: string;
  transformedCode: string;
  dependencies: Set<string>; // Set of absolute paths
  isExternal: boolean;
}

export interface BundleOptions {
  entry: string;
  outDir?: string;
  plugins?: Plugin[];
}

export interface Plugin {
  name: string;
  resolveId?(source: string, importer?: string): Promise<string | null | undefined> | string | null | undefined;
  load?(id: string): Promise<string | null | undefined> | string | null | undefined;
  transform?(code: string, id: string): Promise<string | null | undefined> | string | null | undefined;
  generateBundle?(bundle: string): Promise<string | null | undefined> | string | null | undefined;
}
