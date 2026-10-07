import { defineConfig, devices } from '@playwright/test';
import { BASE_URL, BYPASS_STATE } from './src/env';

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    { name: 'setup', testMatch: /vercel\.setup\.ts$/ },
    {
      name: 'personas',
      testMatch: /personas\.setup\.ts$/,
      use: { storageState: BYPASS_STATE },
      dependencies: ['setup']
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: BYPASS_STATE },
      dependencies: ['personas']
    }
  ]
});
