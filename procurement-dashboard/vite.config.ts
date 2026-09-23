import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      // Same-origin in the browser, so neither API needs CORS in development
      "/procurement-api": { target: "http://localhost:3001", changeOrigin: true },
      "/vendor-api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
