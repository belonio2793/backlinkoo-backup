// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "/app/code";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    target: "es2015",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      external: ["**/test-*.html", "**/debug-*.html", "**/emergency-*.html", "**/fix-*.html", "**/investigate-*.html"],
      output: {
        manualChunks: {
          // Core React chunks
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          // Database and external services
          supabase: ["@supabase/supabase-js"],
          query: ["@tanstack/react-query"],
          // UI components (chunked by usage)
          "radix-core": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-popover"
          ],
          "radix-form": [
            "@radix-ui/react-label",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-select",
            "@radix-ui/react-switch"
          ],
          "radix-data": [
            "@radix-ui/react-tabs",
            "@radix-ui/react-accordion",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-scroll-area"
          ],
          // Form handling
          forms: ["react-hook-form", "@hookform/resolvers", "zod"],
          // Charts and data visualization
          charts: ["recharts"],
          // Date handling
          dates: ["date-fns", "react-day-picker"],
          // Icons
          icons: ["lucide-react"],
          // Utilities
          utils: ["clsx", "tailwind-merge", "class-variance-authority"]
        }
      }
    },
    minify: "esbuild",
    reportCompressedSize: false
    // Disable during dev for faster builds
  },
  define: {
    __DEV__: mode === "development"
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query"
    ]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgdGFyZ2V0OiAnZXMyMDE1JyxcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgZXh0ZXJuYWw6IFsnKiovdGVzdC0qLmh0bWwnLCAnKiovZGVidWctKi5odG1sJywgJyoqL2VtZXJnZW5jeS0qLmh0bWwnLCAnKiovZml4LSouaHRtbCcsICcqKi9pbnZlc3RpZ2F0ZS0qLmh0bWwnXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAvLyBDb3JlIFJlYWN0IGNodW5rc1xuICAgICAgICAgIHZlbmRvcjogWydyZWFjdCcsICdyZWFjdC1kb20nXSxcbiAgICAgICAgICByb3V0ZXI6IFsncmVhY3Qtcm91dGVyLWRvbSddLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIERhdGFiYXNlIGFuZCBleHRlcm5hbCBzZXJ2aWNlc1xuICAgICAgICAgIHN1cGFiYXNlOiBbJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcyddLFxuICAgICAgICAgIHF1ZXJ5OiBbJ0B0YW5zdGFjay9yZWFjdC1xdWVyeSddLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFVJIGNvbXBvbmVudHMgKGNodW5rZWQgYnkgdXNhZ2UpXG4gICAgICAgICAgJ3JhZGl4LWNvcmUnOiBbXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRpYWxvZycsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWRyb3Bkb3duLW1lbnUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1hbGVydC1kaWFsb2cnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1wb3BvdmVyJ1xuICAgICAgICAgIF0sXG4gICAgICAgICAgJ3JhZGl4LWZvcm0nOiBbXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LWxhYmVsJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY2hlY2tib3gnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1yYWRpby1ncm91cCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXNlbGVjdCcsXG4gICAgICAgICAgICAnQHJhZGl4LXVpL3JlYWN0LXN3aXRjaCdcbiAgICAgICAgICBdLFxuICAgICAgICAgICdyYWRpeC1kYXRhJzogW1xuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC10YWJzJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtYWNjb3JkaW9uJyxcbiAgICAgICAgICAgICdAcmFkaXgtdWkvcmVhY3QtY29sbGFwc2libGUnLFxuICAgICAgICAgICAgJ0ByYWRpeC11aS9yZWFjdC1zY3JvbGwtYXJlYSdcbiAgICAgICAgICBdLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIEZvcm0gaGFuZGxpbmdcbiAgICAgICAgICBmb3JtczogWydyZWFjdC1ob29rLWZvcm0nLCAnQGhvb2tmb3JtL3Jlc29sdmVycycsICd6b2QnXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBDaGFydHMgYW5kIGRhdGEgdmlzdWFsaXphdGlvblxuICAgICAgICAgIGNoYXJ0czogWydyZWNoYXJ0cyddLFxuICAgICAgICAgIFxuICAgICAgICAgIC8vIERhdGUgaGFuZGxpbmdcbiAgICAgICAgICBkYXRlczogWydkYXRlLWZucycsICdyZWFjdC1kYXktcGlja2VyJ10sXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gSWNvbnNcbiAgICAgICAgICBpY29uczogWydsdWNpZGUtcmVhY3QnXSxcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBVdGlsaXRpZXNcbiAgICAgICAgICB1dGlsczogWydjbHN4JywgJ3RhaWx3aW5kLW1lcmdlJywgJ2NsYXNzLXZhcmlhbmNlLWF1dGhvcml0eSddXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLCAvLyBEaXNhYmxlIGR1cmluZyBkZXYgZm9yIGZhc3RlciBidWlsZHNcbiAgfSxcbiAgZGVmaW5lOiB7XG4gICAgX19ERVZfXzogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3JlYWN0JyxcbiAgICAgICdyZWFjdC1kb20nLFxuICAgICAgJ3JlYWN0LXJvdXRlci1kb20nLFxuICAgICAgJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcycsXG4gICAgICAnQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5J1xuICAgIF1cbiAgfVxufSkpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2TSxTQUFTLG9CQUFvQjtBQUMxTyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxXQUFXO0FBQUEsSUFDWCxRQUFRO0FBQUEsSUFDUix1QkFBdUI7QUFBQSxJQUN2QixlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsa0JBQWtCLG1CQUFtQix1QkFBdUIsaUJBQWlCLHVCQUF1QjtBQUFBLE1BQy9HLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQTtBQUFBLFVBRVosUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLFVBQzdCLFFBQVEsQ0FBQyxrQkFBa0I7QUFBQTtBQUFBLFVBRzNCLFVBQVUsQ0FBQyx1QkFBdUI7QUFBQSxVQUNsQyxPQUFPLENBQUMsdUJBQXVCO0FBQUE7QUFBQSxVQUcvQixjQUFjO0FBQUEsWUFDWjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGNBQWM7QUFBQSxZQUNaO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLGNBQWM7QUFBQSxZQUNaO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBO0FBQUEsVUFHQSxPQUFPLENBQUMsbUJBQW1CLHVCQUF1QixLQUFLO0FBQUE7QUFBQSxVQUd2RCxRQUFRLENBQUMsVUFBVTtBQUFBO0FBQUEsVUFHbkIsT0FBTyxDQUFDLFlBQVksa0JBQWtCO0FBQUE7QUFBQSxVQUd0QyxPQUFPLENBQUMsY0FBYztBQUFBO0FBQUEsVUFHdEIsT0FBTyxDQUFDLFFBQVEsa0JBQWtCLDBCQUEwQjtBQUFBLFFBQzlEO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLHNCQUFzQjtBQUFBO0FBQUEsRUFDeEI7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLFNBQVMsU0FBUztBQUFBLEVBQ3BCO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTO0FBQUEsTUFDUDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
