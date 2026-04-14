import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests sequentially — they share a real DB
    pool: 'forks',
    singleFork: true
  }
});
