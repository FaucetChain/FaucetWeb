import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function viteBase(): string {
  const path = process.env.BASE_PATH || "";
  if (!path || path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

export default defineConfig({
  base: viteBase(),
  plugins: [react()],
});
