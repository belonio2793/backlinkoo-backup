import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    port: 3001,
    host: "0.0.0.0",
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    entries: ["./src/main.tsx"],
    include: ["react", "react-dom", "@radix-ui/react-slot", "lucide-react"],
    force: false,
  },
  build: {
    sourcemap: false,
    minify: "esbuild",
  },
});
