import fs from 'node:fs';
import nx from '@nx/eslint-plugin';
import jsoncParser from 'jsonc-eslint-parser';

const packageMap = JSON.parse(
  fs.readFileSync(
    new URL('../../../../docs/monorepo/package-map.json', import.meta.url),
    'utf8'
  )
);

export const depConstraints = Object.entries(packageMap.dependencyRules).map(
  ([type, allowed]) => ({
    sourceTag: `type:${type}`,
    onlyDependOnLibsWithTags: allowed.map((target) => `type:${target}`)
  })
);

const boundaries = [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'warn',
        {
          enforceBuildableLibDependency: false,
          allow: [],
          depConstraints
        }
      ]
    }
  },
  {
    files: ['packages/**/package.json'],
    languageOptions: { parser: jsoncParser },
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          buildTargets: ['lint'],
          ignoredFiles: [
            '{projectRoot}/**/__tests__/**',
            '{projectRoot}/**/*.test.{ts,tsx}',
            '{projectRoot}/vitest.config.ts',
            '{projectRoot}/eslint.config.mjs'
          ]
        }
      ]
    }
  }
];

export default boundaries;
