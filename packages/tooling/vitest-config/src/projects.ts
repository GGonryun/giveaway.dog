import { fileURLToPath } from 'node:url';
import type {
  TestProjectInlineConfiguration,
  ViteUserConfig
} from 'vitest/config';

export type TestProjectName = 'server' | 'frontend' | 'snapshot';

export const SERVER_SETUP = '@giveaway/testing-server/setup';

export const DOM_SETUP = '@giveaway/testing-dom/setup';

export const EMPTY_MODULE = fileURLToPath(
  new URL('./empty.ts', import.meta.url)
);

export const RESET_MODULES = fileURLToPath(
  new URL('./reset-modules.ts', import.meta.url)
);

const EXCLUDE = ['**/node_modules/**', '**/.next/**'];

export const testProjects = (): (TestProjectInlineConfiguration & {
  test: { name: TestProjectName };
})[] => [
  {
    extends: true,
    test: {
      name: 'server',
      environment: 'node',
      isolate: true,
      include: ['**/*.test.ts'],
      exclude: [...EXCLUDE, '**/*.integration.test.ts']
    }
  },
  {
    extends: true,
    test: {
      name: 'frontend',
      environment: 'jsdom',
      include: ['**/*.test.tsx'],
      exclude: [...EXCLUDE, '**/*.snapshot.test.tsx', '**/*.visual.test.tsx'],
      setupFiles: [DOM_SETUP]
    }
  },
  {
    extends: true,
    test: {
      name: 'snapshot',
      environment: 'jsdom',
      include: ['**/*.snapshot.test.tsx'],
      exclude: EXCLUDE,
      setupFiles: [DOM_SETUP]
    }
  }
];

export type PackageTestOptions = {
  coverageInclude?: string[];
  coverageExclude?: string[];
  setupFiles?: string[];
  isolate?: boolean;
};

export const packageTestConfig = ({
  coverageInclude = ['src/**/*.{ts,tsx}'],
  coverageExclude = [],
  setupFiles = [SERVER_SETUP],
  isolate = false
}: PackageTestOptions = {}): ViteUserConfig => {
  process.env.TZ = 'UTC';
  return {
    resolve: {
      alias: { 'server-only': EMPTY_MODULE }
    },
    test: {
      globals: true,
      silent: 'passed-only',
      setupFiles: [RESET_MODULES, ...setupFiles],
      isolate,
      projects: testProjects(),
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'json-summary'],
        include: coverageInclude,
        exclude: [
          '**/__tests__/**',
          '**/src/testing/**',
          '**/*.d.ts',
          ...coverageExclude
        ]
      }
    }
  };
};
