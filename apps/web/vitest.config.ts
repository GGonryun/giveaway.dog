import { defineConfig, mergeConfig } from 'vitest/config';
import { packageTestConfig } from '@giveaway/vitest-config/projects';
import path from 'path';

export default mergeConfig(
  packageTestConfig({
    coverageInclude: ['app/**/*.{ts,tsx}'],
    coverageExclude: ['app/.well-known/**']
  }),
  defineConfig({
    resolve: {
      alias: { '@': path.resolve(__dirname, './') }
    }
  })
);
