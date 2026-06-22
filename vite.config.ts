import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd());
    return {
      define: {
        // Keep backward-compatible mappings for any code that still reads process.env.GEMINI_API_KEY
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        // Expose the Vite-prefixed variable in case it's read elsewhere via import.meta.env
        'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
          // Two entry points: the public landing page at "/" and the React
          // app at "/app". Both become real files in dist (index.html and
          // app/index.html), so no fragile rewrite is needed for "/".
          input: {
            main: path.resolve(__dirname, 'index.html'),
            app: path.resolve(__dirname, 'app/index.html'),
          },
          output: {
            manualChunks: undefined
          }
        }
      },
      server: {
        port: 5173,
        host: true
      }
    };
});
