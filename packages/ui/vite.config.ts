import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createHtmlPlugin } from "vite-plugin-html";
import checker from "vite-plugin-checker";

import { dependencies } from "./package.json";
function renderChunks(deps) {
  let chunks = {};
  Object.keys(deps).forEach((key) => {
    if (["react", "react-dom"].includes(key)) return;
    chunks[key] = [key];
  });
  return chunks;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "env");

  return {
    server: { hmr: true },
    plugins: [
      react({
        include: ["**/*.tsx", "**/*.ts"],
        exclude: ["**/*.stories.tsx"],
      }),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            ...env,
            MODE: mode,
          },
        },
      }),
      checker({ typescript: true }),
    ],
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            ...renderChunks(dependencies),
          },
        },
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      coverage: {
        reporter: ["text", "json", "html"],
      },
    },
  };
});
