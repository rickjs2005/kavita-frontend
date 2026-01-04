import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    coverage: {
      // Mantém a mesma intenção do seu arquivo: cobrir TS/TSX e excluir áreas não-testáveis/irrelevantes
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/app/**", "src/**/__tests__/**"],
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),

      // ESSENCIAL: Next "server-only" é um módulo virtual e o Vite não resolve sem alias.
      // Isso evita quebrar qualquer teste que importe arquivos do /src/server.
      "server-only": path.resolve(__dirname, "src/__tests__/mocks/server-only.ts"),
    },
  },
});
