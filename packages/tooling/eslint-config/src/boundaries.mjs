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

const devDepConstraints = depConstraints.map((constraint) => ({
  ...constraint,
  onlyDependOnLibsWithTags: [
    ...new Set([...constraint.onlyDependOnLibsWithTags, 'type:config'])
  ]
}));

const DEV_FILES = [
  '**/__tests__/**',
  '**/src/testing/**',
  '**/*.test.{ts,tsx}',
  '**/{vitest,vitest.visual}.config.ts',
  '**/eslint.config.mjs'
];

const moduleBoundaries = (constraints) => [
  'warn',
  {
    enforceBuildableLibDependency: false,
    allow: [],
    checkDynamicDependenciesExceptions: ['@giveaway/**'],
    depConstraints: constraints
  }
];

const boundaries = [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'],
    rules: {
      '@nx/enforce-module-boundaries': moduleBoundaries(depConstraints)
    }
  },
  {
    files: DEV_FILES,
    rules: {
      '@nx/enforce-module-boundaries': moduleBoundaries(devDepConstraints)
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
            '{projectRoot}/src/testing/**',
            '{projectRoot}/**/*.test.{ts,tsx}',
            '{projectRoot}/vitest.config.ts',
            '{projectRoot}/vitest.visual.config.ts',
            '{projectRoot}/eslint.config.mjs'
          ]
        }
      ]
    }
  }
];

export default boundaries;
