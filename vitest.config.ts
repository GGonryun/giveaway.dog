import { defineConfig } from 'vitest/config';
import path from 'path';

const alias = {
  '@': path.resolve(__dirname, './')
};

export default defineConfig({
  resolve: { alias },
  test: {
    globals: true,
    silent: 'passed-only',
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['**/*.test.ts'],
          exclude: ['**/node_modules/**', '.next/**'],
          setupFiles: ['./test/setup.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'frontend',
          environment: 'jsdom',
          include: ['**/*.test.tsx'],
          exclude: ['**/node_modules/**', '.next/**'],
          setupFiles: ['./test/setup.ts', './test/setup-dom.ts']
        }
      }
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
        'procedures/**/*.{ts,tsx}',
        'schemas/**/*.{ts,tsx}'
      ],
      exclude: ['**/__tests__/**', '**/*.d.ts', 'app/.well-known/**']
    }
  }
});
