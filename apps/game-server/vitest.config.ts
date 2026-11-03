import { defineConfig } from "vitest/config";

// Disable pmx/pm2 metrics in Colyseus during tests to prevent IPC interference
process.env.COLYSEUS_DISABLE_PMX = "true";

export default defineConfig({
  test: {
    pool: "threads",
    environment: "node"
  }
});
