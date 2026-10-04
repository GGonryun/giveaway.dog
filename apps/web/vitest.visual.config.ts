import { defineConfig, mergeConfig } from 'vitest/config';
import { visualTestConfig } from '@giveaway/testing-visual/config';
import path from 'path';

export default defineConfig(
  mergeConfig(visualTestConfig(), {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './')
      }
    }
  })
);
