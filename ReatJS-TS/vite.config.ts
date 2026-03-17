import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
  build: {
    // Tắt source maps ở production — ẩn source code khỏi DevTools
    sourcemap: false,
    // Minify bằng esbuild (nhanh hơn terser, đã có sẵn với Vite)
    minify: "esbuild",
  },
  esbuild: {
    // Tự động xóa console.log và debugger khỏi bundle production
    drop: ["console", "debugger"],
  },
});
