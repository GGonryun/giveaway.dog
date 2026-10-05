import { defineConfig } from 'vitest/config';
import { packageTestConfig } from '@giveaway/vitest-config/projects';

export default defineConfig(
  packageTestConfig({
    setupFiles: ['@giveaway/testing-mocks/setup', './src/testing/setup.ts']
  })
);
