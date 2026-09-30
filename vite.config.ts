import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: /^cross-fetch$/, replacement: path.resolve(__dirname, 'src/lib/crossFetchShim.ts') },
        { find: /^cross-fetch\/.*$/, replacement: path.resolve(__dirname, 'src/lib/crossFetchShim.ts') },
        { find: /.*\/getInjectedProvider(\.js)?$/, replacement: path.resolve(__dirname, 'src/lib/getInjectedProviderShim.ts') },
        { find: /.*\/util\/provider(\.js)?$/, replacement: path.resolve(__dirname, 'src/lib/coinbaseProviderShim.ts') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
    server: {
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
