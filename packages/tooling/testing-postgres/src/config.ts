import { fileURLToPath } from 'node:url';
import type { ViteUserConfig } from 'vitest/config';
import { EMPTY_MODULE } from '@giveaway/vitest-config/projects';

export const INTEGRATION_SETUP = '@giveaway/testing-integration/setup';

const GLOBAL_SETUP = fileURLToPath(
  new URL('./global-setup.ts', import.meta.url)
);

export type IntegrationTestOptions = {
  setupFiles?: string[];
};

export const integrationTestConfig = ({
  setupFiles = [INTEGRATION_SETUP]
}: IntegrationTestOptions = {}): ViteUserConfig => {
  process.env.TZ = 'UTC';
  return {
    resolve: {
      alias: { 'server-only': EMPTY_MODULE }
    },
    test: {
      name: 'integration',
      environment: 'node',
      include: ['**/*.integration.test.ts'],
      exclude: ['**/node_modules/**', '**/.next/**'],
      globalSetup: [GLOBAL_SETUP],
      setupFiles,
      pool: 'forks',
      silent: 'passed-only',
      testTimeout: 30_000,
      hookTimeout: 60_000
    }
  };
};
