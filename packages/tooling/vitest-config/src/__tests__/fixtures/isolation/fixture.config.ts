import { defineConfig } from 'vitest/config';
import { RESET_MODULES } from '../../../projects.ts';

export default defineConfig({
  test: {
    include: ['*.fixture.ts'],
    isolate: false,
    maxWorkers: 1,
    setupFiles: [
      ...(process.env.FIXTURE_RESET_MODULES === 'true' ? [RESET_MODULES] : []),
      './setup.ts'
    ]
  }
});
