import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => {
          // Route function calls to our mock endpoints in development
          if (path.includes('check-ai-provider')) {
            return '/api/mock-check-ai-provider';
          }
          if (path.includes('generate-content')) {
            return '/api/mock-generate-content';
          }
          return path;
        }
      }
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    target: 'es2015',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
    minify: 'esbuild',
  },
  define: {
    __DEV__: mode === 'development',
  },
}));
