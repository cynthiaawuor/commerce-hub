import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5176,
    // Reachable from a tablet on the same network, since this is used on the dock
    host: true,
    proxy: {
      "/receiving-api": { target: "http://localhost:3003", changeOrigin: true },
    },
  },
});
