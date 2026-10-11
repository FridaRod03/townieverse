import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) =>
          id.includes('/src/data/library/') ||
          id.includes('/src/data/starter.ts')
            ? 'content-library'
            : undefined,
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    maxWorkers: 2,
    testTimeout: 15000,
  },
});
