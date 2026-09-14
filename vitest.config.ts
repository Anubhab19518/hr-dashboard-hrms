import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/test/**',
        'src/types/**',
        'src/**/*.d.ts',
        'src/**/*.schema.ts',
        'src/config/**',
        'src/lib/env/**',
        'src/features/**/index.ts',
        'src/features/**/server.ts',
        'src/components/**/index.ts',
        // App router pages, layouts and routes are validated via Playwright E2E smoke suite (Rule 46)
        'src/app/**/page.tsx',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/error.tsx',
        'src/app/**/global-error.tsx',
        'src/app/**/not-found.tsx',
        'src/app/dashboard/dashboard-actions.tsx',
        'src/features/**/components/create-order-dialog.tsx',
        'src/features/**/components/login-form.tsx',
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
