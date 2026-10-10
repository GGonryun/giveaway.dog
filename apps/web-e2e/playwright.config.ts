import path from 'path';
import { defineConfig, devices, type Project } from '@playwright/test';
import {
  BASE_URL,
  BYPASS_SECRET,
  BYPASS_STATE,
  JSON_REPORT,
  RUN_ID
} from './src/env';
import { PROD_SMOKE_PROJECT, TAGS } from './src/helpers/tags';
import { userMetricsCookie } from './src/helpers/user-metrics';

const specsIn = (...folders: string[]) =>
  new RegExp(`/src/(${folders.join('|')})/.+\\.spec\\.ts$`);

const BROWSER_SPECS = specsIn('smoke', 'security', 'journeys', 'a11y');

const signedOut = { storageState: BYPASS_STATE };

const prodSmoke: Project = BYPASS_SECRET
  ? { use: signedOut, dependencies: ['setup'] }
  : { use: { storageState: { cookies: [userMetricsCookie()], origins: [] } } };

const webServer =
  process.env.E2E_WEB_SERVER === '1'
    ? {
        command: 'pnpm --filter web run dev',
        cwd: path.join(__dirname, '../..'),
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 180_000
      }
    : undefined;

export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  grepInvert: new RegExp(TAGS.quarantine),
  metadata: { runId: RUN_ID, baseURL: BASE_URL },
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never' }],
        ['json', { outputFile: JSON_REPORT }]
      ]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    launchOptions: {
      executablePath: process.env.E2E_CHROMIUM_PATH || undefined
    },
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer,
  projects: [
    {
      name: 'setup',
      testMatch: /\/src\/setup\/vercel\.setup\.ts$/,
      teardown: 'teardown'
    },
    {
      name: 'personas',
      testMatch: /\/src\/setup\/(personas|janitor)\.setup\.ts$/,
      use: signedOut,
      dependencies: ['setup']
    },
    {
      name: 'api',
      testMatch: specsIn('api'),
      use: signedOut,
      dependencies: ['personas']
    },
    {
      name: 'chromium',
      testMatch: BROWSER_SPECS,
      use: {
        ...devices['Desktop Chrome'],
        ...signedOut,
        viewport: { width: 1280, height: 800 },
        timezoneId: 'UTC'
      },
      dependencies: ['personas']
    },
    {
      name: 'mobile',
      testMatch: BROWSER_SPECS,
      grep: new RegExp(TAGS.mobile),
      use: {
        ...devices['Pixel 7'],
        ...signedOut,
        timezoneId: 'America/Los_Angeles'
      },
      dependencies: ['personas']
    },
    {
      name: PROD_SMOKE_PROJECT,
      testMatch: specsIn('prod', 'api', 'security'),
      grep: new RegExp(TAGS.prodSafe),
      ...prodSmoke
    },
    {
      name: 'teardown',
      testMatch: /\/src\/setup\/run\.teardown\.ts$/,
      use: signedOut
    }
  ]
});
