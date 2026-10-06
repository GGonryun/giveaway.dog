import nx from '@nx/eslint-plugin';
import jsoncParser from 'jsonc-eslint-parser';
import noServerInClient from './rules/no-server-in-client.mjs';

export const dependencyRules = {
  util: ['util'],
  model: ['model', 'util'],
  server: ['server', 'model', 'util'],
  ui: ['ui', 'model', 'util'],
  feature: ['feature', 'ui', 'server', 'model', 'util'],
  app: ['app', 'feature', 'ui', 'server', 'model', 'util', 'config'],
  tool: ['server', 'model', 'util'],
  config: ['config', 'model', 'util']
};

const depConstraints = Object.entries(dependencyRules).map(
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
  '**/{vitest,vitest.visual,vitest.integration}.config.ts',
  '**/eslint.config.mjs'
];

const moduleBoundaries = (constraints) => [
  'error',
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
    plugins: {
      '@giveaway': { rules: { 'no-server-in-client': noServerInClient } }
    },
    rules: {
      '@nx/enforce-module-boundaries': moduleBoundaries(depConstraints),
      '@giveaway/no-server-in-client': 'error'
    }
  },
  {
    files: DEV_FILES,
    rules: {
      '@nx/enforce-module-boundaries': moduleBoundaries(devDepConstraints),
      '@giveaway/no-server-in-client': 'off'
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
            '{projectRoot}/vitest.integration.config.ts',
            '{projectRoot}/eslint.config.mjs'
          ]
        }
      ]
    }
  }
];

export default boundaries;
