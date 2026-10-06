import { defineConfig, mergeConfig } from 'vitest/config';
import { workspaceProjects } from '@giveaway/vitest-config/workspace';
import coverageConfig from './vitest.coverage.config';

export default mergeConfig(
  coverageConfig,
  defineConfig({
    test: {
      silent: 'passed-only',
      projects: workspaceProjects(__dirname, ['apps/web', 'packages', 'tools'])
    }
  })
);
