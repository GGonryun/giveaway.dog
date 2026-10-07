import { defineConfig } from 'vitest/config';
import {
  INTEGRATION_SETUP,
  integrationTestConfig
} from '@giveaway/testing-postgres/config';

export default defineConfig(
  integrationTestConfig({
    setupFiles: [
      INTEGRATION_SETUP,
      '@giveaway/testing-integration/faults-setup'
    ]
  })
);
