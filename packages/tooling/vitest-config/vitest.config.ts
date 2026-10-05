import { defineConfig } from 'vitest/config';
import { packageTestConfig } from './src/projects.ts';

export default defineConfig(
  packageTestConfig({ coverageInclude: [], setupFiles: [] })
);
