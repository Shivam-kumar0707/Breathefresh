import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/test/**', 'src/**/*.d.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        'src/engine/**': {
          lines: 90,
          functions: 90,
          branches: 90,
          statements: 90,
        },
      },
    },
  },
});
