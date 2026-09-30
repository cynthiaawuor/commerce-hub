import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5177,
    // Reachable from a phone or tablet on the same network, since this is used on the floor
    host: true,
    proxy: {
      "/warehouse-api": { target: "http://localhost:3004", changeOrigin: true },
    },
  },
});
