import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5175,
    proxy: {
      // Same-origin in the browser, so the service needs no CORS in development
      "/inventory-api": { target: "http://localhost:3002", changeOrigin: true },
    },
  },
});
