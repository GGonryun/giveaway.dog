import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import parser from '@typescript-eslint/parser';
import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';
import rule from '../no-server-in-client.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'no-server-in-client-'));

const write = (file: string, content: string) => {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
};

const json = (value: unknown) => JSON.stringify(value, null, 2);

const link = (from: string, name: string, target: string) => {
  const directory = path.join(root, from, 'node_modules', '@giveaway');
  fs.mkdirSync(directory, { recursive: true });
  fs.symlinkSync(path.join(root, target), path.join(directory, name), 'dir');
};

write(
  'packages/server-pkg/package.json',
  json({
    name: '@giveaway/server-pkg',
    nx: { tags: ['type:server', 'runtime:server'] },
    exports: { './query': './src/query.ts', './action': './src/action.ts' }
  })
);
write(
  'packages/server-pkg/src/query.ts',
  "import 'server-only';\n\nexport const query = 1;\n"
);
write(
  'packages/server-pkg/src/action.ts',
  "'use server';\n\nimport { query } from './query';\n\nexport const action = async () => query;\n"
);
write(
  'packages/model-pkg/package.json',
  json({
    name: '@giveaway/model-pkg',
    nx: { tags: ['type:model', 'runtime:isomorphic'] },
    exports: { './shared': './src/shared.ts' }
  })
);
write('packages/model-pkg/src/shared.ts', 'export const shared = 1;\n');
write(
  'packages/feature-pkg/package.json',
  json({
    name: '@giveaway/feature-pkg',
    nx: { tags: ['type:feature', 'runtime:react'] }
  })
);
write(
  'packages/feature-pkg/tsconfig.json',
  json({ compilerOptions: { paths: { '@/*': ['src/*'] } } })
);
write(
  'packages/feature-pkg/src/helper.ts',
  "export { query } from '@giveaway/server-pkg/query';\n"
);
write(
  'packages/feature-pkg/src/types.ts',
  "import type { query } from '@giveaway/server-pkg/query';\n\nexport type Query = typeof query;\n"
);
write(
  'packages/feature-pkg/src/__tests__/helper.ts',
  "export { query } from '@giveaway/server-pkg/query';\n"
);
link('packages/feature-pkg', 'server-pkg', 'packages/server-pkg');
link('packages/feature-pkg', 'model-pkg', 'packages/model-pkg');

afterAll(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

const client = path.join(root, 'packages/feature-pkg/src/client.tsx');

const ruleTester = new RuleTester({
  languageOptions: { parser, ecmaVersion: 'latest', sourceType: 'module' }
});

ruleTester.run('no-server-in-client', rule, {
  valid: [
    {
      name: 'a module without the directive',
      filename: client,
      code: "import { query } from '@giveaway/server-pkg/query';"
    },
    {
      name: 'a model package',
      filename: client,
      code: "'use client';\nimport { shared } from '@giveaway/model-pkg/shared';"
    },
    {
      name: 'an import type',
      filename: client,
      code: "'use client';\nimport type { query } from '@giveaway/server-pkg/query';"
    },
    {
      name: 'named imports that are all types',
      filename: client,
      code: "'use client';\nimport { type query } from '@giveaway/server-pkg/query';"
    },
    {
      name: 'a server action',
      filename: client,
      code: "'use client';\nimport { action } from '@giveaway/server-pkg/action';"
    },
    {
      name: 'a module that imports the server module as a type',
      filename: client,
      code: "'use client';\nimport './types';"
    },
    {
      name: 'a test helper',
      filename: client,
      code: "'use client';\nimport { query } from './__tests__/helper';"
    }
  ],
  invalid: [
    {
      name: 'a direct import',
      filename: client,
      code: "'use client';\nimport { query } from '@giveaway/server-pkg/query';",
      errors: [{ messageId: 'serverModule' }]
    },
    {
      name: 'an import through another module',
      filename: client,
      code: "'use client';\nimport { query } from './helper';",
      errors: [{ messageId: 'serverModule' }]
    },
    {
      name: 'an import through a path alias',
      filename: client,
      code: "'use client';\nimport { query } from '@/helper';",
      errors: [{ messageId: 'serverModule' }]
    },
    {
      name: 'a re-export',
      filename: client,
      code: "'use client';\nexport { query } from '@giveaway/server-pkg/query';",
      errors: [{ messageId: 'serverModule' }]
    },
    {
      name: 'a dynamic import',
      filename: client,
      code: "'use client';\nconst load = () => import('./helper');",
      errors: [{ messageId: 'serverModule' }]
    },
    {
      name: 'a client module in a server package',
      filename: path.join(root, 'packages/server-pkg/src/client.tsx'),
      code: "'use client';\nexport const value = 1;",
      errors: [{ messageId: 'serverPackage' }]
    }
  ]
});
