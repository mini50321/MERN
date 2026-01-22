import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

const shouldSkipCloudflare = process.env.SKIP_CLOUDFLARE === "true" || !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export default defineConfig({
  plugins: [
    ...mochaPlugins(process.env as any), 
    react(), 
    ...(shouldSkipCloudflare ? [] : [cloudflare({
      configPath: './wrangler.json'
    })])
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  esbuild: {
    target: 'es2020',
    format: 'esm',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
