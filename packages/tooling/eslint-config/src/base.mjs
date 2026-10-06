import { globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const SOURCE_FILES = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}'];

const base = [
  ...nextVitals,
  ...nextTs,
  {
    files: SOURCE_FILES,
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowObjectTypes: 'always' }
      ],
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'warn',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'date-fns',
              allowTypeImports: true,
              message:
                "Import each function from its own module, for example 'date-fns/format'. 'date-fns' loads all of its 250 modules in each test file that reaches it."
            },
            {
              name: 'date-fns/locale',
              allowTypeImports: true,
              message:
                "Import each locale from its own module, for example 'date-fns/locale/en-US'. 'date-fns/locale' loads every locale."
            }
          ]
        }
      ]
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
    '**/.next/**',
    '**/out/**',
    '**/build/**',
    '**/coverage/**',
    '.nx/**',
    '**/next-env.d.ts'
  ])
];

export default base;
