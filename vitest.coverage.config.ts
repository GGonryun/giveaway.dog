import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: [
        'apps/web/app/**/*.{ts,tsx}',
        'packages/**/src/**/*.{ts,tsx}',
        'tools/**/src/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/__tests__/**',
        '**/src/testing/**',
        '**/*.d.ts',
        'apps/web/app/.well-known/**',
        'packages/tooling/**'
      ]
    }
  }
});
