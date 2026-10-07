import { defineConfig, globalIgnores } from 'eslint/config';
import base from '@giveaway/eslint-config/base';
import boundaries from '@giveaway/eslint-config/boundaries';

export default defineConfig([
  ...base,
  ...boundaries,
  {
    settings: {
      next: { rootDir: 'apps/web/' }
    }
  },
  {
    files: ['apps/web-e2e/src/**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test', 'expect'],
              message:
                'Import test and expect from src/fixtures/test.ts. Its fixtures block the third-party scripts, fail on page errors and mark the known bugs.'
            }
          ]
        }
      ]
    }
  },
  globalIgnores(['apps/web/app/.well-known/**'])
]);
