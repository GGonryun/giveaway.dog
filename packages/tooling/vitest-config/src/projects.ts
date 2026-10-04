import { fileURLToPath } from 'node:url';
import type {
  TestProjectInlineConfiguration,
  ViteUserConfig
} from 'vitest/config';

export type TestProjectName = 'server' | 'frontend' | 'snapshot';

export const SERVER_SETUP = '@giveaway/testing-server/setup';

export const DOM_SETUP = '@giveaway/testing-dom/setup';

const EMPTY_MODULE = fileURLToPath(new URL('./empty.ts', import.meta.url));

const EXCLUDE = ['**/node_modules/**', '**/.next/**'];

export const testProjects = (): (TestProjectInlineConfiguration & {
  test: { name: TestProjectName };
})[] => [
  {
    extends: true,
    test: {
      name: 'server',
      environment: 'node',
      include: ['**/*.test.ts'],
      exclude: EXCLUDE,
      setupFiles: [SERVER_SETUP]
    }
  },
  {
    extends: true,
    test: {
      name: 'frontend',
      environment: 'jsdom',
      include: ['**/*.test.tsx'],
      exclude: [...EXCLUDE, '**/*.snapshot.test.tsx', '**/*.visual.test.tsx'],
      setupFiles: [SERVER_SETUP, DOM_SETUP]
    }
  },
  {
    extends: true,
    test: {
      name: 'snapshot',
      environment: 'jsdom',
      include: ['**/*.snapshot.test.tsx'],
      exclude: EXCLUDE,
      setupFiles: [SERVER_SETUP, DOM_SETUP]
    }
  }
];

export type PackageTestOptions = {
  coverageInclude?: string[];
  coverageExclude?: string[];
};

export const packageTestConfig = ({
  coverageInclude = ['src/**/*.{ts,tsx}'],
  coverageExclude = []
}: PackageTestOptions = {}): ViteUserConfig => {
  process.env.TZ = 'UTC';
  return {
    resolve: {
      alias: { 'server-only': EMPTY_MODULE }
    },
    test: {
      globals: true,
      silent: 'passed-only',
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
