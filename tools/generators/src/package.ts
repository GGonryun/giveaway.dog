import {
  formatFiles,
  getProjects,
  installPackagesTask,
  joinPathFragments,
  writeJson,
  type GeneratorCallback,
  type Tree
} from '@nx/devkit';
import { starterFiles } from './starter-files.ts';

export type PackageType = 'util' | 'model' | 'server' | 'ui' | 'feature';

export type PackageOptions = {
  name: string;
  directory: string;
  module?: string;
  skipFormat?: boolean;
  skipInstall?: boolean;
};

export type CreatePackageOptions = PackageOptions & {
  type: PackageType;
  tags?: string[];
};

const NEXT_CONFIG = 'apps/web/next.config.ts';

const NAME = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const DIRECTORY = /^[a-z][a-z0-9-]*(\/[a-z][a-z0-9-]*)*$/;

const RUNTIMES: Record<PackageType, string> = {
  util: 'isomorphic',
  model: 'isomorphic',
  server: 'server',
  ui: 'react',
  feature: 'react'
};

const DEPENDENCIES: Record<PackageType, Record<string, string>> = {
  util: {},
  model: { zod: 'catalog:' },
  server: { 'server-only': 'catalog:' },
  ui: {},
  feature: {}
};

const sortKeys = (record: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b))
  );

const assertValid = ({
  name,
  directory,
  module: moduleName
}: CreatePackageOptions) => {
  if (!NAME.test(name)) {
    throw new Error(
      `"${name}" is not a valid package name. Use lowercase words separated by dashes, without the @giveaway/ scope.`
    );
  }
  if (!DIRECTORY.test(directory)) {
    throw new Error(
      `"${directory}" is not a valid directory. Use a folder of packages/, for example "team" or "integrations/x".`
    );
  }
  if (moduleName !== undefined && !NAME.test(moduleName)) {
    throw new Error(`"${moduleName}" is not a valid module name.`);
  }
};

const packageJson = (
  options: CreatePackageOptions,
  moduleName: string,
  extension: string
) => {
  const react = options.type === 'ui' || options.type === 'feature';
  const project = react ? 'frontend' : 'server';
  const property = options.type === 'model' || options.type === 'util';
  return {
    name: `@giveaway/${options.name}`,
    private: true,
    type: 'module',
    nx: {
      tags: [
        `type:${options.type}`,
        `runtime:${RUNTIMES[options.type]}`,
        `scope:${options.directory.split('/')[0]}`,
        ...(options.tags ?? [])
      ],
      targets: {
        lint: { executor: '@giveaway/eslint-config:lint' }
      }
    },
    exports: { [`./${moduleName}`]: `./src/${moduleName}.${extension}` },
    scripts: {
      'type-check': 'tsc --noEmit',
      test: 'vitest run',
      'test:unit': `vitest run --project ${project}`,
      [`test:${project}`]: `vitest run --project ${project}`,
      ...(property && {
        'test:property': 'vitest run --project property --passWithNoTests'
      })
    },
    ...(Object.keys(DEPENDENCIES[options.type]).length > 0 && {
      dependencies: DEPENDENCIES[options.type]
    }),
    ...(react && { peerDependencies: { react: 'catalog:' } }),
    devDependencies: sortKeys({
      '@giveaway/eslint-config': 'workspace:*',
      '@giveaway/testing-server': 'workspace:*',
      '@giveaway/tsconfig': 'workspace:*',
      '@giveaway/vitest-config': 'workspace:*',
      '@types/node': 'catalog:',
      typescript: 'catalog:',
      vitest: 'catalog:',
      ...(react && {
        '@giveaway/testing-dom': 'workspace:*',
        '@testing-library/react': 'catalog:',
        '@types/react': 'catalog:'
      })
    })
  };
};

export const addTranspilePackage = (tree: Tree, name: string) => {
  const text = tree.read(NEXT_CONFIG, 'utf-8');
  if (text === null) {
    return;
  }
  const match = text.match(/transpilePackages:\s*\[([^\]]*)\]/);
  if (!match || match.index === undefined) {
    throw new Error(`${NEXT_CONFIG} has no transpilePackages array`);
  }
  const names = [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map(
    ([, value]) => value
  );
  const merged = [...new Set([...names, name])].sort();
  const replacement = `transpilePackages: [${merged.map((value) => `'${value}'`).join(', ')}]`;
  tree.write(
    NEXT_CONFIG,
    text.slice(0, match.index) +
      replacement +
      text.slice(match.index + match[0].length)
  );
};

export const createPackage = async (
  tree: Tree,
  options: CreatePackageOptions
): Promise<GeneratorCallback> => {
  assertValid(options);
  const root = joinPathFragments('packages', options.directory, options.name);
  const packageName = `@giveaway/${options.name}`;
  if (tree.exists(root)) {
    throw new Error(`${root} already exists.`);
  }
  if (getProjects(tree).has(packageName)) {
    throw new Error(`${packageName} already exists.`);
  }
  const moduleName = options.module ?? options.name;
  const react = options.type === 'ui' || options.type === 'feature';
  const extension = react ? 'tsx' : 'ts';

  writeJson(
    tree,
    joinPathFragments(root, 'package.json'),
    packageJson(options, moduleName, extension)
  );
  writeJson(tree, joinPathFragments(root, 'tsconfig.json'), {
    extends: `@giveaway/tsconfig/${react ? 'react-library' : 'library'}.json`
  });
  tree.write(
    joinPathFragments(root, 'vitest.config.ts'),
    [
      "import { defineConfig } from 'vitest/config';",
      "import { packageTestConfig } from '@giveaway/vitest-config/projects';",
      '',
      'export default defineConfig(packageTestConfig());',
      ''
    ].join('\n')
  );
  const files = starterFiles(options.type, moduleName, packageName);
  tree.write(
    joinPathFragments(root, 'src', `${moduleName}.${extension}`),
    files.source
  );
  tree.write(
    joinPathFragments(
      root,
      'src',
      '__tests__',
      `${moduleName}.test.${extension}`
    ),
    files.test
  );
  addTranspilePackage(tree, packageName);

  if (!options.skipFormat) {
    await formatFiles(tree);
  }
  return () => {
    if (!options.skipInstall) {
      installPackagesTask(tree, true);
    }
  };
};
