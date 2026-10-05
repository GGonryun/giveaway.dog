import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    silent: 'passed-only',
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['**/*.test.ts'],
          exclude: ['**/node_modules/**']
        }
      }
    ]
  }
});
