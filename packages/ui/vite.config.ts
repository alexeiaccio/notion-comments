import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

export default defineConfig(() => {
  return {
    server: { hmr: true },
    plugins: [react(), checker({ typescript: true })],
    test: {
      globals: true,
      environment: "jsdom",
      coverage: {
        reporter: ["text", "json", "html"],
      },
    },
  };
});
