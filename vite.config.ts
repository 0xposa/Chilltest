import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function safeEthereumPlugin() {
  return {
    name: 'safe-ethereum-plugin',
    enforce: 'pre' as const,
    transform(code: string) {
      if (
        code.includes('top?.ethereum') ||
        code.includes('top.ethereum') ||
        code.includes('parent?.ethereum') ||
        code.includes('parent.ethereum') ||
        code.includes('_b.ethereum')
      ) {
        return {
          code: code
            .replace(/\(_b\s*=\s*window\.top\)\s*===\s*null\s*\|\|\s*_b\s*===\s*void\s*0\s*\?\s*void\s*0\s*:\s*_b\.ethereum/g, 'undefined')
            .replace(/window\.top\?\.ethereum/g, '(window.ethereum)')
            .replace(/window\.top\.ethereum/g, '(window.ethereum)')
            .replace(/window\.parent\?\.ethereum/g, '(window.ethereum)')
            .replace(/window\.parent\.ethereum/g, '(window.ethereum)')
            .replace(/top\?\.ethereum/g, '(window.ethereum)')
            .replace(/parent\?\.ethereum/g, '(window.ethereum)'),
          map: null,
        };
      }
    },
  };
}

export default defineConfig(() => {
  const root = process.cwd();

  return {
    plugins: [safeEthereumPlugin(), react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^cross-fetch$/, replacement: path.resolve(root, 'src/lib/crossFetchShim.ts') },
        { find: /^cross-fetch\/.*$/, replacement: path.resolve(root, 'src/lib/crossFetchShim.ts') },
        { find: /.*\/getInjectedProvider(\.js)?$/, replacement: path.resolve(root, 'src/lib/getInjectedProviderShim.ts') },
        { find: /.*\/util\/provider(\.js)?$/, replacement: path.resolve(root, 'src/lib/coinbaseProviderShim.ts') },
        { find: '@', replacement: path.resolve(root, '.') },
      ],
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/v3': {
          target: 'https://exchange.kuru.io',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
