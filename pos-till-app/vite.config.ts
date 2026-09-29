import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5178,
    // Reachable from a till on the same network
    host: true,
    proxy: {
      "/pos-api": { target: "http://localhost:3005", changeOrigin: true },
    },
  },
});
