import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

const shouldSkipCloudflare = process.env.SKIP_CLOUDFLARE === "true";

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
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
