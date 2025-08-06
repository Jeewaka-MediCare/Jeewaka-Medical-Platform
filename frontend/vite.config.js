import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  preview: {
    port: 3000,
    strictPort: true,
    host: true,
    origin: "http://0.0.0.0:3000",
  },
  // For development server (npm run dev)
  server: {
    port: 3000,
    strictPort: true,
    host: true,  // Same as host: "0.0.0.0"
    origin: "http://0.0.0.0:3000",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
