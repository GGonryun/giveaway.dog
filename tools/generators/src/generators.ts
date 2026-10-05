import { logger, type Tree } from '@nx/devkit';
import {
  createPackage,
  type PackageOptions,
  type PackageType
} from './package.ts';

const packageGenerator =
  (type: PackageType) => (tree: Tree, options: PackageOptions) =>
    createPackage(tree, { ...options, type });

export const utilGenerator = packageGenerator('util');

export const modelGenerator = packageGenerator('model');

export const serverGenerator = packageGenerator('server');

export const uiGenerator = packageGenerator('ui');

export const featureGenerator = packageGenerator('feature');

export const PLATFORM_SLOTS = {
  model: 'model',
  api: 'server',
  auth: 'server',
  connect: 'server',
  'connect-ui': 'feature',
  bot: 'server',
  import: 'server',
  scraper: 'server',
  'task-validation': 'server',
  'task-jobs': 'server',
  'task-entry': 'feature',
  'task-editor': 'feature'
} as const satisfies Record<string, PackageType>;

export type PlatformSlot = keyof typeof PLATFORM_SLOTS;

const TASK_REGISTRIES: PlatformSlot[] = [
  'task-validation',
  'task-jobs',
  'task-entry',
  'task-editor'
];

export type PlatformSlotOptions = {
  platform: string;
  slot: PlatformSlot;
  module?: string;
  skipFormat?: boolean;
  skipInstall?: boolean;
};

export const platformSlotGenerator = async (
  tree: Tree,
  { platform, slot, ...options }: PlatformSlotOptions
) => {
  const type = PLATFORM_SLOTS[slot];
  if (!type) {
    throw new Error(
      `"${slot}" is not a platform slot. Use one of: ${Object.keys(PLATFORM_SLOTS).join(', ')}.`
    );
  }
  const name = `${platform}-${slot}`;
  const install = await createPackage(tree, {
    ...options,
    name,
    directory: `integrations/${platform}`,
    type,
    tags: [`platform:${platform}`]
  });
  if (TASK_REGISTRIES.includes(slot)) {
    logger.info(
      `Add @giveaway/${name} to the registry in @giveaway/${slot}, so the giveaway tasks use it.`
    );
  }
  return install;
};
