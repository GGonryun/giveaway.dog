import fs from 'node:fs';
import path from 'node:path';
import type { TestProjectInlineConfiguration } from 'vitest/config';
import { testProjects } from './projects.ts';

const CONFIG_FILE = 'vitest.config.ts';

const SKIPPED_DIRECTORIES = new Set(['node_modules', '.next', 'coverage']);

const findConfigFiles = (directory: string): string[] => {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  if (entries.some((entry) => entry.isFile() && entry.name === CONFIG_FILE)) {
    return [path.join(directory, CONFIG_FILE)];
  }
  return entries
    .filter(
      (entry) => entry.isDirectory() && !SKIPPED_DIRECTORIES.has(entry.name)
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => findConfigFiles(path.join(directory, entry.name)));
};

const readPackageName = (directory: string): string => {
  const file = path.join(directory, 'package.json');
  const { name } = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    name?: string;
  };
  if (!name) {
    throw new Error(`${file} has no name`);
  }
  return name;
};

export const workspaceProjects = (
  root: string,
  directories: string[]
): TestProjectInlineConfiguration[] => {
  process.env.TZ = 'UTC';
  return directories
    .flatMap((directory) => findConfigFiles(path.resolve(root, directory)))
    .flatMap((configFile) => {
      const projectRoot = path.dirname(configFile);
      const name = readPackageName(projectRoot);
      return testProjects().map((project) => ({
        ...project,
        extends: configFile,
        root: projectRoot,
        test: { ...project.test, name: `${name}:${project.test.name}` }
      }));
    });
};
