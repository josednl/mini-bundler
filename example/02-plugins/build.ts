import { Bundler } from '../../src/core/Bundler.js';
import { aliasPlugin, replacePlugin, virtualPlugin } from '../../src/plugins/index.js';
import { resolve } from 'node:path';

const __dirname = new URL('.', import.meta.url).pathname.substring(1); // Basic windows path fix

const bundler = new Bundler([
  aliasPlugin({
    '@utils': resolve(__dirname, './src/utils')
  }),
  replacePlugin({
    '__VERSION__': '1.0.0'
  }),
  virtualPlugin({
    'virtual:config': 'export const theme = "dark";'
  })
]);

await bundler.bundle({
  entry: resolve(__dirname, 'src/main.ts'),
  outDir: resolve(__dirname, 'dist')
});

console.log('Plugin example bundled successfully!');
