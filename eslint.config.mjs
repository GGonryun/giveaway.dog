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
  globalIgnores(['apps/web/app/.well-known/**'])
]);
