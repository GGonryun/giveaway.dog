import type { LineRange } from './changed-lines.ts';

export type PackageTarget = {
  packageDir: string;
  files: Map<string, LineRange[]>;
};

const MUTABLE_FILE = /^packages\/(?!tooling\/).+\/src\/.+\.ts$/;

const EXCLUDED_FOLDER = /\/(__tests__|src\/testing)\//;

export const isMutableFile = (file: string): boolean =>
  MUTABLE_FILE.test(file) &&
  !EXCLUDED_FOLDER.test(file) &&
  !file.endsWith('.d.ts');

export const packageDirOf = (file: string): string =>
  file.slice(0, file.lastIndexOf('/src/'));

export const toPackageTargets = (
  changed: Map<string, LineRange[]>
): PackageTarget[] => {
  const targets = new Map<string, PackageTarget>();

  for (const [file, ranges] of changed) {
    if (!isMutableFile(file)) {
      continue;
    }
    const packageDir = packageDirOf(file);
    const target = targets.get(packageDir) ?? {
      packageDir,
      files: new Map()
    };
    target.files.set(file.slice(packageDir.length + 1), ranges);
    targets.set(packageDir, target);
  }

  return [...targets.values()].sort((a, b) =>
    a.packageDir.localeCompare(b.packageDir)
  );
};

export const toMutatePatterns = (files: Map<string, LineRange[]>): string[] =>
  [...files].flatMap(([file, ranges]) =>
    ranges.map((range) => `${file}:${range.start}-${range.end}`)
  );
