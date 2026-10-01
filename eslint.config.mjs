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
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'app/.well-known/**',
    'next-env.d.ts'
  ])
]);
