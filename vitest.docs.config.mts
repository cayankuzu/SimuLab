import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Document generators (npm run docs). They run under vitest so that they share
 * the TypeScript and path-alias set-up of the test-suite and fail loudly if a
 * verification case does not pass.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["scripts/**/*.docs.ts"],
    environment: "node",
    testTimeout: 300_000,
  },
});
