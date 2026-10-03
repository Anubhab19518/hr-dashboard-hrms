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
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 2,
        minForks: 1,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**/*.ts',
        'src/components/**/*.tsx',
        'src/components/**/*.ts',
        'src/features/**/services/**/*.ts',
        'src/features/**/utils/**/*.ts',
        'src/features/**/hooks/**/*.ts',
        'src/app/api/**/*.ts',
      ],
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
        'src/providers/**',
        // Shell navigation and map dialog organisms are validated via Playwright E2E suites
        'src/components/organisms/sidebar.tsx',
        'src/components/organisms/topbar.tsx',
        'src/components/organisms/workspace-switcher.tsx',
        'src/components/organisms/manual-attendance-dialog.tsx',
        'src/components/organisms/location-picker-inner.tsx',
        'src/components/organisms/location-map-picker.tsx',
        'src/components/organisms/location-map-picker-inner.tsx',
        'src/components/organisms/create-workspace-dialog.tsx',
      ],
      thresholds: {
        statements: 85,
        branches: 70,
        functions: 85,
        lines: 85,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
