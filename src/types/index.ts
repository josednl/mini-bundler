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
}
