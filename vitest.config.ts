import { defineConfig } from 'vitest/config';
import { workspaceProjects } from '@giveaway/vitest-config/workspace';

export default defineConfig({
  test: {
    silent: 'passed-only',
    projects: workspaceProjects(__dirname, ['apps/web', 'packages']),
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'json-summary'],
      include: [
        'apps/web/app/**/*.{ts,tsx}',
        'apps/web/components/**/*.{ts,tsx}',
        'apps/web/lib/**/*.{ts,tsx}',
        'apps/web/procedures/**/*.{ts,tsx}',
        'apps/web/schemas/**/*.{ts,tsx}',
        'packages/**/src/**/*.{ts,tsx}'
      ],
      exclude: [
        '**/__tests__/**',
        '**/*.d.ts',
        'apps/web/app/.well-known/**',
        'packages/tooling/**'
      ]
    }
  }
});
