import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowObjectTypes: 'always' }
      ],
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'warn'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    ignores: ['**/*.snapshot.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'CallExpression[callee.property.name=/Snapshot$/]',
          message:
            'Put snapshot assertions in a .snapshot.test.tsx file. Those files run in the Snapshot tests job.'
        }
      ]
    }
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'app/.well-known/**',
    'next-env.d.ts'
  ])
]);
