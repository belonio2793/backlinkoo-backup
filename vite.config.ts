import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      external: ['**/test-*.html', '**/debug-*.html', '**/emergency-*.html', '**/fix-*.html', '**/investigate-*.html'],
      output: {
        manualChunks: {
          // Core React chunks
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          
          // Database and external services
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          
          // UI components (chunked by usage)
          'radix-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-popover'
          ],
          'radix-form': [
            '@radix-ui/react-label',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-select',
            '@radix-ui/react-switch'
          ],
          'radix-data': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-scroll-area'
          ],
          
          // Form handling
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Charts and data visualization
          charts: ['recharts'],
          
          // Date handling
          dates: ['date-fns', 'react-day-picker'],
          
          // Icons
          icons: ['lucide-react'],
          
          // Utilities
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority']
        },
      },
    },
    minify: 'esbuild',
    reportCompressedSize: false, // Disable during dev for faster builds
  },
  define: {
    __DEV__: mode === 'development',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query'
    ]
  }
}));
