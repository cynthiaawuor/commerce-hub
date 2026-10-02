import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    // Reachable from the back-office computer or a tablet on the same network
    host: true,
    proxy: {
      "/financials-api": { target: "http://localhost:3007", changeOrigin: true },
    },
  },
});
