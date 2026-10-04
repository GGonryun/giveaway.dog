import type { PackagePlan } from './plan.ts';
import { SUPPRESSIONS } from './plan.ts';

const VITEST_CONFIG_MODULE = '@giveaway/vitest-config/projects';

const VITEST_CONFIG = [
  "import { defineConfig } from 'vitest/config';",
  `import { packageTestConfig } from '${VITEST_CONFIG_MODULE}';`,
  '',
  'export default defineConfig(packageTestConfig());',
  ''
].join('\n');

const VISUAL_CONFIG_MODULE = '@giveaway/testing-visual/config';

const VISUAL_CONFIG = [
  "import { defineConfig } from 'vitest/config';",
  `import { visualTestConfig } from '${VISUAL_CONFIG_MODULE}';`,
  '',
  'export default defineConfig(visualTestConfig());',
  ''
].join('\n');

const VISUAL_SCRIPTS = {
  'test:visual': 'vitest run --config vitest.visual.config.ts',
  'test:visual:update': 'vitest run --config vitest.visual.config.ts --update',
  'test:visual:docker': 'visual-docker',
  'test:visual:docker:update': 'visual-docker --update'
};

const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

const nonEmpty = (record: Record<string, string>) =>
  Object.keys(record).length ? record : undefined;

export const lintCommand = (plan: PackagePlan) => {
  const { path } = plan.entry;
  return Object.keys(plan.suppressions).length
    ? `eslint ${path} --suppressions-location ${path}/${SUPPRESSIONS}`
    : `eslint ${path}`;
};

const scripts = (plan: PackagePlan) => {
  const { testProjects } = plan;
  const unit = testProjects.filter((project) => project !== 'snapshot');
  const result: Record<string, string> = {
    'type-check': 'tsc --noEmit',
    test: testProjects.length ? 'vitest run' : 'vitest run --passWithNoTests'
  };
  if (unit.length) {
    result['test:unit'] =
      'vitest run ' + unit.map((project) => `--project ${project}`).join(' ');
  }
  for (const project of testProjects) {
    result[`test:${project}`] = `vitest run --project ${project}`;
  }
  if (plan.visual) Object.assign(result, VISUAL_SCRIPTS);
  return result;
};

export const packageJson = (plan: PackagePlan) =>
  json({
    name: plan.entry.name,
    private: true,
    type: 'module',
    nx: {
      tags: plan.entry.tags,
      targets: {
        lint: {
          command: lintCommand(plan),
          options: { cwd: '{workspaceRoot}' },
          cache: true
        }
      }
    },
    exports: plan.exports,
    scripts: scripts(plan),
    dependencies: nonEmpty(plan.dependencies),
    peerDependencies: nonEmpty(plan.peerDependencies),
    devDependencies: nonEmpty(plan.devDependencies)
  });

export const tsconfigJson = (plan: PackagePlan) =>
  json({
    extends: plan.react
      ? '@giveaway/tsconfig/react-library.json'
      : '@giveaway/tsconfig/library.json'
  });

export const vitestConfig = () => VITEST_CONFIG;

export const visualConfig = () => VISUAL_CONFIG;

export const suppressionsJson = (plan: PackagePlan) =>
  JSON.stringify(plan.suppressions, null, 2);

export const packageFiles = (plan: PackagePlan): Record<string, string> => {
  const files: Record<string, string> = {
    'package.json': packageJson(plan),
    'tsconfig.json': tsconfigJson(plan),
    'vitest.config.ts': vitestConfig()
  };
  if (plan.visual) files['vitest.visual.config.ts'] = visualConfig();
  if (Object.keys(plan.suppressions).length) {
    files[SUPPRESSIONS] = suppressionsJson(plan);
  }
  return files;
};
