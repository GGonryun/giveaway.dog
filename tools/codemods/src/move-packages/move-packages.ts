import { applyPlan } from './apply.ts';
import { planMove } from './plan.ts';
import type { Plan } from './plan.ts';
import { loadWorkspace } from './workspace.ts';

export type MoveOptions = {
  root: string;
  packages: string[];
  renames?: Record<string, string>;
  install?: boolean;
  dryRun?: boolean;
};

export type MoveResult = {
  plan: Plan;
  changed: string[];
};

export const movePackages = async (
  options: MoveOptions
): Promise<MoveResult> => {
  const ws = loadWorkspace(options.root);
  const plan = planMove(ws, {
    packages: options.packages,
    renames: options.renames
  });
  if (options.dryRun) return { plan, changed: [] };
  const changed = await applyPlan(ws, plan, {
    install: options.install ?? true
  });
  return { plan, changed };
};

export const summarize = (plan: Plan) => {
  const lines = plan.packages.map(
    (pkg) =>
      `${pkg.entry.name}: ${pkg.moves.length} file(s) to ${pkg.entry.path}/src`
  );
  lines.push(
    `${plan.rewrites} edit(s) in ${plan.contents.size} file(s), including import rewrites and server-only imports`
  );
  return lines.join('\n');
};
