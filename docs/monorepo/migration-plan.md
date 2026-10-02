# Migration plan: from one Next.js app to an Nx workspace

This plan moves giveaway.dog to the package graph in [package-graph.md](./package-graph.md). It is built so that `main` stays deployable after every pull request and feature work never has to stop.

The work is tracked in [GGonryun/giveaway.dog#137](https://github.com/GGonryun/giveaway.dog/issues/137). Its sub-issues set the order, which differs from the phases below in three ways:

- **Nx first.** Introducing Nx, with no code moves, is the first issue.
- **Packages move a few at a time.** The pilot moves 3 packages, then 23 batches of up to 10 packages each.
- **CI switches earlier.** The switch to `nx affected` comes right after the move codemod.

## Goals

- CI runs lint, type check and tests only for the packages a change affects (`nx affected`), and reuses cached results for everything else.
- Each package declares its own dependencies, so a job can install only what it needs.
- Package boundaries are enforced by lint, not by convention.
- The Vercel build, the preview deployments and the E2E workflow keep working at every step.

## How the plan stays safe

- **Small, revertible pull requests.** Each step is one pull request, or a few. Reverting one step does not undo the others.
- **Untangle before moving.** All the refactors land while the code is still one package (Phase 1). File moves (Phase 3) then change no logic.
- **Codemods, not hand edits.** A script moves files with `git mv` and rewrites the imports. To resolve a conflict with feature work, re-run the codemod on the new `main` instead of merging by hand.
- **Bottom-up order.** A package moves only after every package it depends on has moved. The `layer` field in `package-map.json` gives this order, so a moved package never imports code that is still in the root app.
- **The checker is the progress bar.** `node docs/monorepo/check-package-map.mjs` reports unmapped files, cycles, boundary violations and the refactors still to do.

## Phase 0: Preparation

No files move in this phase.

1. **Cache `node_modules` in CI** ([GGonryun/giveaway.dog#123](https://github.com/GGonryun/giveaway.dog/issues/123)). This helps today and every phase after it.
2. **Run the checker in CI.** Add a step that runs `node docs/monorepo/check-package-map.mjs`. Make it blocking: it fails only on unmapped files, cycles or boundary violations, and the code has none today. From then on, a new file in a folder that two packages share must be added to `package-map.json`, and a new import cannot create a cycle.
3. **Delete dead code.** `package-map.json` lists 76 dead source files under `deadFiles`, and 67 test files test only them. Confirm the list with the code owners, then delete the files in two or three pull requests. The analysis follows static imports, dynamic imports and `require`, but a file reached only through a string path would look dead.
4. **Spike the toolchain** (2 to 3 days, on a branch that is thrown away afterwards). Move 3 packages by hand and answer these questions:
   - **Next.js 16 and workspace packages.** Do `'use client'`, `'use server'`, `'use cache'` and `server-only` work in TypeScript-source packages listed in `transpilePackages`? Test with `next dev` and `next build`, both of which use Turbopack.
   - **Workflow DevKit.** Does `withWorkflow` find `'use workflow'` and `'use step'` functions in `@giveaway/discord-bot` and `@giveaway/x-picker-workflow`? If it does not, keep the workflow entry files in the app and import the steps from the packages.
   - **Prisma.** Generate the client from `packages/infra/db-schema` and confirm that `@giveaway/db-client` and `@giveaway/db-model` resolve the same generated client. The fallback is the `prisma-client` generator with an explicit `output`.
   - **Vitest.** Run a package's tests with the shared preset, the global Prisma mock (`vi.mock('@giveaway/db-client')`) and a `server-only` alias to an empty module.
   - **TypeScript.** Compare type-check time for project references (`tsc --build`) against `tsc --noEmit` per package.
   - **Vercel.** Make a preview build from the branch with pnpm workspaces and `--frozen-lockfile`.

   **Exit criterion:** a short write-up of the answers and a go or no-go decision.

## Phase 1: Untangle in place

Make the changes from [Refactors that make the graph valid](./package-graph.md#refactors-that-make-the-graph-valid) as small pull requests, while the code is still one package. Each one is an ordinary change that the current CI tests.

| Pull request | Change                                                                                              |
| ------------ | --------------------------------------------------------------------------------------------------- |
| 1            | R1 and R2: move the constants in `lib/settings.ts` and `DEFAULT_SWEEPSTAKES_NAME`                   |
| 2            | R3: move `ValidateTaskInput` to `lib/task/validation/types.ts`                                      |
| 3            | R4: move the ScrapeBadger credit limiter to `lib/scrapebadger/`                                     |
| 4            | R5: move icon and variant maps out of six model files                                               |
| 5            | R6 and R7: move `getSweepstakesTimingDescription` and `isNextRedirect`                              |
| 6            | R8: make the auth runtime config a factory, and replace `'server only'` with `import 'server-only'` |
| 7            | D1: invert the task-entry dependency on the participation context                                   |
| 8            | Split the two shared fixture files that create cycles in tests                                      |
| 9            | Move `findUserTeam` to the team procedures and delete the unused `procedures/teams/shared.ts`       |

**Exit criterion:** the checker reports no imports under "Imports that a listed refactor removes" and no "Cycles that only tests create". Then remove the `refactors` entries from `package-map.json`.

## Phase 2: Workspace and tooling

The Next.js app stays at the repository root in this phase. Nx treats it as the root project, and Vercel needs no change yet.

1. **pnpm workspace.**
   - Add `apps/*`, `packages/**` and `tools/*` to `pnpm-workspace.yaml`. Keep the existing `overrides` and build settings.
   - Use [pnpm catalogs](https://pnpm.io/catalogs) so each npm version is written once: a package writes `"react": "catalog:"`.
   - Keep pnpm 10 and `--frozen-lockfile`, the same as the Vercel build.
2. **Nx.**
   - Run `nx init`.
   - Add the plugins that infer the targets: `@nx/js/typescript` (`typecheck`), `@nx/vite` or `@nx/vitest` (`test`), `@nx/eslint` (`lint`) and `@nx/next` (the app).
   - In `nx.json`:
     - Define `namedInputs`: `production` excludes tests and snapshots, and `sharedGlobals` lists the root config files.
     - Turn on caching for `lint`, `typecheck`, `test` and `test-snapshot`.
     - Set `pluginsConfig["@nx/js"].projectsAffectedByDependencyUpdates` to `"auto"`.
3. **Tooling packages.** Create `@giveaway/tsconfig`, `@giveaway/eslint-config`, `@giveaway/vitest-config`, `@giveaway/testing-server` and `@giveaway/testing-dom`.
   - **ESLint preset.** Keep today's rules and the snapshot-assertion rule. Add `@nx/enforce-module-boundaries`, with the `depConstraints` that `dependencyRules` in `package-map.json` defines, and `@nx/dependency-checks`, so each `package.json` lists what the package imports.
   - **Vitest preset.** Keep the three projects from today's `vitest.config.ts`:
     - `server`: `*.test.ts`, Node
     - `frontend`: `*.test.tsx`, jsdom
     - `snapshot`: `*.snapshot.test.tsx`, jsdom

     It also sets `TZ=UTC` and aliases `server-only` to an empty module.

4. **Package shape.** Packages ship TypeScript source; there is no build step per package.
   - `package.json` lists each module under `exports`, for example `"./button": "./src/button.tsx"`. The codemod generates this list.
   - There are no barrel `index.ts` files. Imports map 1:1 (`@/components/ui/button` becomes `@giveaway/ui-primitives/button`), so the codemod stays mechanical and the client bundles avoid barrel imports.
   - Each package has `"nx": { "tags": [...] }` with the tags from `package-map.json`, a `tsconfig.json` that extends the preset, a `vitest.config.ts` and an `eslint.config.mjs`.
5. **The move codemod** (`tools/codemods`, built with ts-morph). For one package, or a list of packages, it does the following:
   - Moves the package's sources with `git mv` into `packages/<path>/src/`, including data files such as `lib/countries.json`. The `__tests__` and `__snapshots__` folders move with them.
   - Writes `package.json`, `tsconfig.json`, `vitest.config.ts` and `eslint.config.mjs`. The internal dependencies use `workspace:*` and the npm dependencies use `catalog:`.
   - Rewrites, across the repository, every import that points at a moved file. This covers `import`, `export ... from`, `import()`, `vi.mock`, `vi.doMock` and `vi.importActual`, for `@/` aliases and relative paths alike.
   - Moves the package's entries in `eslint-suppressions.json` to a suppressions file in the package, with the new paths. This moves existing records; it does not add new ones.
   - Adds `import 'server-only'` to each module of a `server` package that is not a server action (`'use server'`) module. A client component that imports server code then fails the build instead of shipping that code to the browser.
   - Adds the package to `transpilePackages` in `next.config.ts`.
   - Runs Prettier on the changed files.

   Give the codemod its own tests: it is the riskiest tool in the plan.

6. **Root scripts.** `pnpm run lint`, `type-check` and `test:run` still cover the whole repository: the root Vitest config lists every package's config under `test.projects`. `pnpm run verify` keeps working throughout.

**Exit criterion:** an empty workspace with the tooling packages, the codemod and its tests merged, and CI unchanged and green.

## Phase 3: Move the packages, bottom-up

Run the codemod one wave at a time. Within a wave, group packages by scope into pull requests of 5 to 20 packages.

| Wave | Layers   | Packages | Source files | Test files | Mostly                                                                       |
| ---- | -------- | -------: | -----------: | ---------: | ---------------------------------------------------------------------------- |
| 1    | 0 to 1   |       57 |          155 |        205 | Tooling, shared utilities, server infrastructure, base models, ui-primitives |
| 2    | 2 to 4   |       47 |          220 |        214 | Remaining models, auth, rpc, platform APIs, design system                    |
| 3    | 5 to 7   |       67 |          304 |        272 | Server procedures, platform plugins, first feature packages                  |
| 4    | 8 to 11  |       54 |          262 |        164 | Task registries, sweepstakes details and editor sections, team UI            |
| 5    | 12 to 17 |       12 |           78 |         57 | Participation, editor shell, templates, marketing home, browse item          |

Every wave pull request must meet these checks:

- The checker passes.
- `pnpm run verify` passes: lint, format check, type check and all tests.
- The Vercel preview builds and the E2E tests pass.
- No new entries in any ESLint suppressions file. Snapshot files only change location.

Within a wave, pull requests for different scopes can run in parallel, because packages in different scopes do not share files. A package still waits for every package it depends on.

## Phase 4: Switch CI to `nx affected`

1. Compute the base and head commits with `nrwl/nx-set-shas`.
2. Keep the three check names, so that the merge rule in `CLAUDE.md` and any branch protection rules still apply:

   | Check            | Command                        |
   | ---------------- | ------------------------------ |
   | `Lint`           | `nx affected -t lint`          |
   | `Unit tests`     | `nx affected -t test`          |
   | `Snapshot tests` | `nx affected -t test-snapshot` |

3. Add a `Type check` job (`nx affected -t typecheck`). Today only the Vercel build type-checks; CI does not. Making it a required check is a repository setting.
4. **Coverage badge.** On pushes to `main`, keep running the full suite with coverage from the root Vitest config, as today, so the `coverage.svg` job does not change.
5. **Remote cache.** Decide between Nx Cloud, a self-hosted cache and no remote cache (see [Decisions](#decisions-for-the-team)). Without one, the local cache still helps re-runs on the same runner.
6. **Measure before optimizing further.**
   - **Per-package installs.** With #123, a full install restores in seconds. Try `pnpm install --filter "<package>..."` only if installs still show up in the timings.
   - **Startup overhead.** If starting one Vitest process per package dominates a run, run one Vitest process with a `--project` filter built from `nx show projects --affected`.
   - **Runner image.** [GGonryun/giveaway.dog#124](https://github.com/GGonryun/giveaway.dog/issues/124) stays optional.

**Exit criterion:** CI time and affected share measured on 20 pull requests and compared with the numbers in [package-graph.md](./package-graph.md#summary).

## Phase 5: Move the app shell

1. Move the remaining root app files to `apps/web` with `git mv`: `app/`, `public/`, `next.config.ts`, `middleware.ts`, `postcss.config.js`, `vercel.json` and `components.json`. Move `e2e/` and `playwright.config.ts` to `apps/web-e2e`, and `prisma/seed.ts` to `tools/db-seed`.
2. In `apps/web/app/globals.css`, add `@source "../../../packages";`, so Tailwind still scans the packages for class names.
3. In Vercel, set the Root Directory to `apps/web`. The paths in `vercel.json` (`crons` and `functions`) stay the same, because they are relative to the app.
4. Set the Ignored Build Step to `npx nx-ignore web`, so a change that does not affect the app does not deploy it.
5. Remove the `@/` path aliases from the root `tsconfig.json`. The checker should then report every file under a package path.

**Exit criterion:** a production deploy from `apps/web`, and the E2E tests green on its preview.

## Phase 6: Lock it in

- **Make boundary violations errors** in `@nx/enforce-module-boundaries`. Retire the checker: Nx's project graph and the lint rule do its job now.
- **Add generators** for the common package kinds: `model`, `server`, `ui`, `feature` and a platform plugin slot. A new package then starts with the right tags, configs and test projects.
- **Update `CLAUDE.md`:**
  - the directory structure
  - where tests live
  - the `nx` commands
  - how to add a package
  - the rule that features never import other features' internals

## Effort

These are rough estimates for one engineer who knows the codebase. The pull requests within a wave can be split between people.

| Phase                | Estimate       |
| -------------------- | -------------- |
| 0: Preparation       | 1 week         |
| 1: Untangle in place | 1 week         |
| 2: Workspace         | 1 to 1.5 weeks |
| 3: Move packages     | 2 to 3 weeks   |
| 4: CI switch         | 3 to 5 days    |
| 5: App shell         | 2 to 3 days    |
| 6: Lock in           | 2 days         |

## Risks

| Risk                                                                                | Mitigation                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A Next.js, Workflow DevKit or Prisma feature does not work from a workspace package | The Phase 0 spike tests each one before any real move. Each has a fallback: keep that code in the app.                                                                                           |
| 237 packages add overhead: configs, process startup, slower `next dev` cold starts  | Generators and presets keep the configs to a few lines. Measure in the spike and in Phase 4. The 63 single-file packages can merge into a neighbor in the same scope later; it is a codemod run. |
| Feature work conflicts with wave pull requests                                      | Re-run the codemod on the new `main` instead of merging by hand. Keep waves short.                                                                                                               |
| A wave breaks production                                                            | Every wave needs a green Vercel preview and E2E run. Waves are separate pull requests, so one can be reverted alone.                                                                             |
| The map drifts as code changes during the migration                                 | The blocking checker step from Phase 0 fails on unmapped files and new cycles.                                                                                                                   |
| Lockfile and shared-config changes still affect everything                          | `projectsAffectedByDependencyUpdates: "auto"`. Keep `sharedGlobals` short.                                                                                                                       |

## Decisions for the team

1. **Remote cache:** Nx Cloud, a self-hosted cache, or none for now.
2. **Granularity:** keep all 237 packages, or merge some of the 63 single-file packages now. The graph supports both.
3. **Type check in CI:** add `Type check` as a required check.
4. **Platform task schemas:** do the fan-out follow-up from [Fan-out hotspots](./package-graph.md#fan-out-hotspots) during the migration or after it.
