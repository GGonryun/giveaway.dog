# Claude Development Guidelines for Giveaway.dog

## Project Overview

This is a Next.js 15 application for hosting and participating in giveaways and raffles. Users can either host giveaways or participate in them.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.7.2
- **Styling**: Tailwind CSS 4.1.11
- **Database**: Prisma with PostgreSQL
- **Authentication**: NextAuth.js 5.0.0-beta.25
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Package Manager**: pnpm (preferred over npm)

## Development Guidelines

### Code Quality & Testing

- **Always run linting**: Use `pnpm run lint` before committing changes
- **Type checking**: Use `pnpm run type-check` to verify TypeScript compilation
- **Unit tests**: Use `pnpm run test:run` before committing changes
- **Never run builds for testing**: Builds are slow and not necessary for verification
- **Prefer linting/type-check over builds** for quick verification

### File Structure & Conventions

- **App location**: The Next.js app is in `apps/web`. Paths in this file are relative to `apps/web` unless they start with `apps/`, `.github/` or name a root file
- **Environment files**: Put `.env.local` and `.env.prod` in `apps/web`. Next.js, Prisma and the `prisma:*` scripts read them from there
- **Workspace packages**: Shared code goes in pnpm workspace packages under `packages/` (see Workspace Packages). Today the tooling packages are in `packages/tooling/`, and the first shared utilities are in `packages/shared/`
- **Auth pages**: Located in `app/(auth)/` directory
- **Shared components**: Place reusable components in `components/` directory
- **UI components**: Use existing shadcn/ui components in `components/ui/`
- **Auth components**: Create shared auth components in `components/auth/`

### Authentication

- **Providers**: Supports X (Twitter), Google, Discord, and email (Inbound.new)
- **Login vs Signup**: Keep separate action files for login and signup
- **Redirects**:
  - Host users → `/app`
  - Participants → `/browse`

### Component Guidelines

- **Use existing patterns**: Look at existing components before creating new ones
- **Shared components**: Extract common UI patterns (like provider buttons, error handling)
- **Styling**: Use Tailwind utility classes, follow existing patterns
- **Accessibility**: Ensure proper ARIA labels and semantic HTML

### Form Handling

- **Multi-step forms**: Use state management for step navigation
- **Validation**: Implement client-side validation before submission
- **Error handling**: Use consistent error display patterns
- **Loading states**: Always show loading spinners during async operations

### Code Style & Formatting

- **No comments**: Don't add code comments unless explicitly requested
- **Consistent naming**: Follow existing naming conventions
- **TypeScript**: Use proper typing, avoid `any`
- **Server actions**: Use `'use server'` directive for server-side functions
- **Always format code**: Ensure proper formatting when creating or modifying files

### UI/UX Patterns

- **Cards**: Use shadcn/ui Card components for form containers
- **Buttons**:
  - Primary actions: default variant
  - Secondary actions: outline variant
  - Destructive actions: destructive variant (especially for back buttons on hover)
- **Forms**: Multi-step forms should show progress with stepper components
- **Spacing**: Use consistent gap and padding patterns

### Directory Structure

```
apps/
├── web/ (the Next.js app, Vercel Root Directory)
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── logout/
│   │   ├── (marketing)/
│   │   │   ├── browse/ (for participants)
│   │   │   └── other public pages
│   │   └── app/ (main app for hosts)
│   ├── components/
│   │   ├── auth/ (shared auth components)
│   │   ├── ui/ (shadcn/ui components)
│   │   └── patterns/ (reusable patterns)
│   ├── lib/
│   ├── prisma/
│   ├── package.json (app dependencies and scripts)
│   ├── tsconfig.json
│   ├── vercel.json
│   └── vitest.config.ts
└── web-e2e/ (Playwright tests)
    ├── src/
    └── playwright.config.ts
packages/
├── shared/
│   ├── util-errors/ (@giveaway/util-errors: ApplicationError and assertNever)
│   ├── util-strings/ (@giveaway/util-strings: string and email helpers)
│   └── util-types/ (@giveaway/util-types: utility types and widetype)
└── tooling/
    ├── tsconfig/ (@giveaway/tsconfig: tsconfig presets)
    ├── eslint-config/ (@giveaway/eslint-config: ESLint presets)
    ├── vitest-config/ (@giveaway/vitest-config: Vitest projects)
    ├── testing-server/ (@giveaway/testing-server: Vitest setup and mocks)
    ├── testing-dom/ (@giveaway/testing-dom: jsdom setup)
    └── testing-visual/ (@giveaway/testing-visual: visual test setup and helpers)
tools/
└── codemods/ (@giveaway/codemods: the move codemod)
package.json (workspace tooling: Nx, ESLint, Prettier, Vitest)
eslint.config.mjs
eslint-suppressions.json
nx.json
tsconfig.base.json (read by the Nx lint rules to resolve imports)
pnpm-workspace.yaml (workspace packages and the pnpm catalog)
vitest.config.ts (lists the Vitest projects of every package)
```

### Common Patterns to Follow

1. **Always use TodoWrite** for task planning and tracking
2. **Read existing code** before implementing new features
3. **Extract shared components** when you see duplication
4. **Use Suspense boundaries** for components that use useSearchParams
5. **Set dynamic = 'force-dynamic'** for auth pages
6. **Handle form submission** only on final steps in multi-step forms

### Testing & Verification

- Run these commands from the repository root. The root scripts call the scripts in `apps/web/package.json` and `apps/web-e2e/package.json`
- Use `pnpm run lint` for code linting (ESLint). It runs the `lint` target of every project through Nx, then `pnpm run lint:root` for the files outside the projects (the root configs, `docs/` and `.github/`)
- Use `pnpm run type-check` for TypeScript verification
- Use `pnpm run test:run` to run all the tests one time (Vitest): server tests, component tests and snapshot tests of every package. The root `vitest.config.ts` lists them (see Workspace Packages)
- Use `pnpm run test:unit` to run only the server and component tests, `pnpm run test:server` to run only the server tests, `pnpm run test:frontend` to run only the component tests, and `pnpm run test:snapshot` to run only the snapshot tests
- Use `pnpm run test:coverage` to run the server and component tests and measure the code coverage
- Use `pnpm run test:visual:docker` to run the visual tests in the Playwright Docker image that CI uses, and `pnpm run test:visual:docker:update` to update their reference screenshots (see Visual Tests)
- Use `pnpm run test:e2e` to run the Playwright end-to-end tests against a running app (see E2E Tests)
- Use `pnpm --filter web exec vitest run --project <name>` to run one project of the app: `server`, `frontend` or `snapshot`. From the root, the project names start with the package name, for example `pnpm exec vitest run --project 'web:server'`
- Use `pnpm --filter web exec vitest run -u <path>` to update snapshots (the path is relative to `apps/web`) after an intended UI change. Review the snapshot diff before you commit it
- Use `pnpm run move-packages <package>...` to move packages out of `apps/web` (see Workspace Packages)
- Use `pnpm run format` to automatically format all files
- Use `pnpm run format:check` to check if files need formatting
- Use `pnpm run verify` to run lint, format check, type check, and all the tests in sequence
- Never use `pnpm run build` for testing changes
- Check IDE diagnostics for immediate feedback

### Nx

- **Projects**: pnpm workspace packages under `apps/` and `packages/`. `web` is the app in `apps/web`, `web-e2e` is the Playwright tests in `apps/web-e2e`, and the `@giveaway/*` packages are in `packages/`. Their targets are the scripts in their `package.json`. `nx.json` sets the cache and the inputs
- **Cached targets**: `lint`, `type-check`, `test:unit`, `test:server`, `test:frontend` and `test:snapshot`, for example `pnpm nx run web:lint`. A second run with no changed inputs reads the result from the cache. `lint` is defined in each `package.json` under `nx.targets` and runs ESLint from the root on the project's folder. It uses the root `eslint-suppressions.json`, or the package's own `eslint-suppressions.json` when its `lint` command passes `--suppressions-location` (see Continuous Integration)
- **Inputs**: Each cached target hashes the files of its project, the non-test files of the workspace packages it depends on (`^production`), the versions of all the npm packages in `pnpm-lock.yaml`, and the `sharedGlobals` files in `nx.json` (`.nvmrc`, the root `package.json`, `tsconfig.base.json`, the root ESLint config and the CI files). A change to a `sharedGlobals` file affects every project. `lint` also hashes `docs/monorepo/package-map.json`, because the boundary rules come from it
- **Affected projects**: `pnpm nx affected -t <target>` runs a target only for the projects that changed since `main`, and the projects that depend on them. `web-e2e` depends on `web`. A change to `pnpm-lock.yaml` affects only the projects that use the changed packages (`projectsAffectedByDependencyUpdates` is `auto`). A package that only the root tooling uses, such as ESLint or Prettier, is in no project, so a lockfile-only update of it affects no project. The full run on `main` still runs it
- **Dependencies**: Each npm version is written once, in the `catalog` of `pnpm-workspace.yaml`. A `package.json` writes `"<name>": "catalog:"`. Add an app dependency with `pnpm --filter web add --save-catalog <name>`. Add workspace tooling (Nx, ESLint, Prettier, Vitest and its plugins) to the root `package.json` with `pnpm add -D -w --save-catalog <name>`. A workspace package depends on another one with `"workspace:*"`. Vitest runs from the root, so its peer dependencies (`@types/node`, `jsdom`, `playwright`) stay in the root `package.json` with the same versions the app uses. Otherwise pnpm installs a second copy of Vitest, and the visual tests stop with no output
- **Other commands**: `pnpm nx show projects` lists the projects, `pnpm nx show project web` shows the targets and `pnpm nx reset` clears the cache
- **Build**: `nx.json` defines a `build` target default that is never cached, so a build always uses the current environment variables. Vercel finds this target and builds the app with `cd ../.. && npx nx build web`
- **CI**: CI runs the targets through Nx. See Continuous Integration

### Workspace Packages

- **Location and names**: A package is in `packages/<group>/<name>` and is named `@giveaway/<name>`. `pnpm-workspace.yaml` lists `apps/*`, `packages/**` and `tools/*`
- **Shape**: A package ships TypeScript source, with no build step. `exports` in its `package.json` lists each module, for example `"./button": "./src/button.tsx"`. Do not add barrel `index.ts` files. Its tags go in `"nx": { "tags": [...] }`, with the tags from `docs/monorepo/package-map.json`
- **Tooling packages**: `packages/tooling/` has the packages that configure the others:
  - `@giveaway/tsconfig`: the `base`, `library`, `react-library` and `nextjs` presets. A `tsconfig.json` extends one of them, for example `"extends": "@giveaway/tsconfig/library.json"`
  - `@giveaway/eslint-config`: `base` has the rules and the snapshot-assertion rule. `boundaries` has `@nx/enforce-module-boundaries` (a warning for now), with the `depConstraints` that `dependencyRules` in `docs/monorepo/package-map.json` defines, and `@nx/dependency-checks` for each `package.json` under `packages/`. Tests and package config files (`vitest.config.ts`, `eslint.config.mjs`) may also import `type:config` packages. The root `eslint.config.mjs` uses both. The rules need the Nx project graph, which `pnpm run lint` builds when it runs the targets through Nx
  - `@giveaway/vitest-config`: `projects` defines the `server`, `frontend` and `snapshot` projects of a package (`packageTestConfig`). It also sets `TZ=UTC` and replaces `server-only` with an empty module. `workspace` finds the `vitest.config.ts` of each package for the root config
  - `@giveaway/testing-server`: the setup file of every project (the Prisma, session and `next/cache` mocks) and the helpers that tests import: `@giveaway/testing-server/prisma`, `/session`, `/result` and `/next-cache`
  - `@giveaway/testing-dom`: the jsdom setup of the `frontend` and `snapshot` projects
  - `@giveaway/testing-visual`: the browser setup (`/setup`) and the `renderVisual` helpers (`/render`) of the visual tests, and `visual-docker`, which runs the visual tests of the package it is called from in the Playwright Docker image
- **Shared packages**: `packages/shared/` has the `util` packages that moved out of the app. Import them by package name, for example `@giveaway/util-errors` or `@giveaway/util-types/widetype`, never with a path into `packages/`. Each one is in `transpilePackages` in `apps/web/next.config.ts` and is a `workspace:*` dependency in `apps/web/package.json`. `apps/web/app/globals.css` has `@source '../../../packages'`, so Tailwind finds the classes that packages use. The migration plan in `docs/monorepo/migration-plan.md` lists what a move changes
- **Moving a package**: Run `pnpm run move-packages <package>...` from the root, with the package names from `docs/monorepo/package-map.json`. The codemod in `tools/codemods` moves the package's `sources` with `git mv` into `packages/<path>/src/` and writes the package files. It rewrites every import of a moved file, puts the package in `transpilePackages` and the app's dependencies, moves its ESLint suppressions, empties its `sources` in the map and runs Prettier and `pnpm install`. It changes nothing when it finds a problem, for example two sources with the same module name (pass `--rename <source>=<name>`) or an import of a file that stays in the app. Run it with `--dry-run` first. To fix a conflict with `main`, run it again on the new `main` instead of merging by hand. See "The move codemod" in `docs/monorepo/migration-plan.md`
- **Vitest config of a package**: `vitest.config.ts` exports `defineConfig(packageTestConfig())`. The root `vitest.config.ts` adds the three projects of each package that has one, named `<package>:server`, `<package>:frontend` and `<package>:snapshot`. A package with tests has `test:*` scripts for the projects it uses, so Nx and CI run them

### Frontend Tests

- **Location**: Put component and hook tests in a `__tests__/` folder next to the code, named `<name>.test.tsx`. Put snapshot tests in a separate file in the same folder, named `<name>.snapshot.test.tsx`
- **Projects**: Files that end in `.snapshot.test.tsx` run in jsdom (the `snapshot` project). Other files that end in `.test.tsx` run in jsdom (the `frontend` project). Files that end in `.test.ts` run in Node (the `server` project)
- **Setup**: `@giveaway/testing-dom/setup` (`packages/tooling/testing-dom/src/setup.ts`) loads the jest-dom matchers, cleans up after each test and stubs `matchMedia`, `ResizeObserver`, `IntersectionObserver` and `scrollIntoView`. `@giveaway/testing-server/setup` mocks Prisma, the session and `next/cache` in every project
- **Libraries**: Use `@testing-library/react` with role queries (`screen.getByRole`) and `@testing-library/user-event` for interactions. Use `renderHook` for hooks
- **Snapshots**: Use `toMatchSnapshot()` for representative states, only in `.snapshot.test.tsx` files. ESLint rejects snapshot assertions in other test files. Keep snapshots deterministic: freeze time with `vi.setSystemTime`, mock `Math.random` and id generators, and do not snapshot Radix-generated ids
- **Mocks**: Mock `next/navigation`, `next/link`, `next/image`, `next-auth/react` and server actions with `vi.mock` in the test file
- **Pattern**: See `components/ui/__tests__/button.test.tsx` and `components/ui/__tests__/button.snapshot.test.tsx`

### Continuous Integration

- **Workflow**: `.github/workflows/ci.yml` runs on each pull request and on each push to `main`
- **Checks**: `Lint` (ESLint and the package map checker), `Type check` (TypeScript), `Server tests` (Vitest server tests, with coverage), `Frontend tests` (Vitest component tests, with coverage), `Snapshot tests` (Vitest snapshot tests), `Visual tests` (screenshots in Chromium) and `Coverage` (merges the server and frontend coverage). Merge a pull request only when all the checks pass
- **Nx in CI**: On a pull request, each job runs `pnpm nx affected -t <target>`, so a pull request that changes no project (for example, only Markdown files at the root) runs no tests. `nrwl/nx-set-shas` sets the base commit. On a push to `main` and on a manual run, each job runs `pnpm nx run-many -t <target>` for all the projects, so the `Coverage badge` job always has the full coverage
- **Nx cache in CI**: `.github/actions/nx-cache` starts a small server (`server.mjs`) that gives the cache to Nx through the Nx remote cache API (`NX_SELF_HOSTED_REMOTE_CACHE_SERVER`). `actions/cache` keeps the files of the server in `.nx/ci-cache`, for each job and branch, with a fallback to `main`. The server deletes the entries that no run used for 7 days. Nx cannot use a copy of its own local cache folder, because its cache database is tied to the machine. A re-run on the same commit reads `lint`, `type-check` and the tests from the cache
- **Paths in CI**: Each project writes its Vitest reports to `.vitest-reports` in its folder. `.github/scripts/collect-vitest-reports.mjs` copies them to `.vitest-reports` at the root, and the `Coverage` job merges them with the root `vitest.config.ts` into `coverage/coverage-summary.json` at the root. The merge uses only the coverage in the reports. It cannot match the test files to the root projects, because each package runs its tests under the project names `server` and `frontend` and the root config names them `<package>:server` and `<package>:frontend`, so it runs with `--passWithNoTests`. The `Server tests` and `Frontend tests` jobs report the test results. The visual test attachments are in `apps/web/.vitest-attachments`. The Playwright report is in `apps/web-e2e/playwright-report`
- **Coverage badge**: After each push to `main`, the `Coverage badge` job puts the merged line coverage in `coverage.svg` on the `badges` branch. The README shows this image. Do not edit the `badges` branch by hand
- **Package manager in CI**: pnpm 10 with `--frozen-lockfile`, the same as the Vercel build. After a dependency change, commit `pnpm-lock.yaml`
- **ESLint baseline**: `eslint-suppressions.json` (at the root, with paths relative to the root) records the errors that existed when ESLint was added. A package that moved with recorded errors has its own `eslint-suppressions.json`, also with paths relative to the root, and its `lint` command passes it with `--suppressions-location`. ESLint fails when that file does not exist, so pass the option only for a package that has the file. New errors fail the check. Do not add entries to these files to hide new errors
- **After you fix a recorded error**: Run `pnpm run lint:prune` from the root and commit the changed `eslint-suppressions.json` files. It runs every `lint` target through Nx with `--prune-suppressions`, one at a time, because several projects share the root file. If you do not, ESLint stops with exit code 2
- **Package map**: `docs/monorepo/package-map.json` assigns each source file to a package of the planned Nx package graph (see `docs/monorepo/package-graph.md`). The `Lint` job runs `node docs/monorepo/check-package-map.mjs` from the root. It fails on a file that no package owns, a dependency cycle between packages, an import that breaks a package boundary or a `'use client'` module that imports, directly or through other modules, a module of a `runtime:server` package. The walk skips type-only imports and stops at `'use server'` modules. To fix it, move the shared constant or schema to a `model` package or use `import type`. It also reports the open refactors and the dead files, but they do not fail it. When you add a file to a folder that two packages share, add the file to the `sources` of its package in `package-map.json`. Add `--verbose` to see every item of each report

### Visual Tests

- **What they do**: Each visual test renders a component in a real Chromium browser (Vitest browser mode with Playwright), takes a screenshot and compares it with a reference PNG pixel by pixel. A change to a component, a Tailwind class or a theme token that changes how it looks fails the `Visual tests` check
- **Location**: Put visual tests in a `__tests__/` folder next to the code, named `<name>.visual.test.tsx`. The references go in `__tests__/__screenshots__/<name>.visual.test.tsx/`. The config is `vitest.visual.config.ts`. `pnpm run test:run` does not run visual tests
- **Writing a test**: Use `renderVisual` and `THEMES` from `@giveaway/testing-visual/render`. Render each test in the light and the dark theme. Then call `await expect.element(root).toMatchScreenshot()`. For a component in a portal (a dialog, a popover), take the screenshot of the portal element, for example `page.getByRole('dialog')`. See `components/ui/__tests__/button.visual.test.tsx`
- **Keep them deterministic**: Use fixed data. Do not use the current date, random values or images from the network. `@giveaway/testing-visual/setup` loads the Figtree font and turns off animations and transitions. The visual config also loads `app/globals.css` as a setup file, for the theme
- **The references come from the Playwright Docker image**: The pixels depend on the browser version and the fonts of the operating system, so a screenshot from your own browser does not match. The `Visual tests` job runs in `mcr.microsoft.com/playwright` for the Playwright version in `pnpm-lock.yaml`. Only commit references that were made in that image, in one of these ways:
  - `pnpm run test:visual:docker:update` runs the tests in the same image on your machine and writes the new references. Use `pnpm run test:visual:docker` to only compare. These scripts need Docker on Linux, because they use your `node_modules`. In a Claude Code cloud session, start Docker first with `dockerd > /tmp/dockerd.log 2>&1 &`
  - The **Update visual references** workflow (Actions tab, or `workflow_dispatch` through the GitHub API, on your branch, not on `main`) takes new references in the same image, commits them to the branch and starts CI again on that commit
- **When `Visual tests` fails**: The job log and the job summary list each screenshot that changed, with the number of pixels that differ. The `visual-changes` artifact has the actual screenshot and a diff image (changed pixels in red) for each one. To see them in a session, run `pnpm run test:visual:docker` and open the files in `apps/web/.vitest-attachments/`. Then decide if each change is intended:
  - Intended (you changed how the component looks on purpose, or you added a visual test): update the references (see above). Open the new PNG files and the old ones (`git show HEAD:<path>`) and confirm that they show only what you meant to change
  - Not intended (for example, a change to a shared component or a theme token changed a component you did not mean to change): fix the code. Do not update the references to make the check pass
- **Run without Docker**: `pnpm run test:visual` uses the Chromium of your Playwright install. It is useful while you write a test, but expect small text differences against the committed references. When Chromium is not where Playwright expects it, set `VISUAL_CHROMIUM_PATH` to the Chromium binary (in Claude Code cloud sessions: `VISUAL_CHROMIUM_PATH=/opt/pw-browsers/chromium`)

### E2E Tests

- **Location**: Put Playwright tests in `apps/web-e2e/src/`, named `<name>.spec.ts`. They run in Chromium. Vitest does not run them
- **Run locally**: Start the app with `pnpm dev`, then run `pnpm run test:e2e:local`. It reads `apps/web/.env.local`. Run `pnpm --filter web-e2e exec playwright install chromium` one time first. The tests use `http://localhost:3000`. Set `E2E_BASE_URL` to test another deployment
- **Login**: The login test signs in through the `e2e` credentials provider in `lib/auth/providers/e2e.ts`. The app adds this provider only when `E2E_LOGIN_SECRET` has at least 32 characters, and only on Vercel preview deployments (`VERCEL_ENV=preview`) and the local development server (`next dev`). The provider signs in one host user, `e2e-host@example.com`. Without `E2E_LOGIN_SECRET`, the login test is skipped
- **Protected deployments**: `apps/web-e2e/src/vercel.setup.ts` sends `VERCEL_AUTOMATION_BYPASS_SECRET` one time to get the Vercel bypass cookie. The other tests use that cookie, so the secret goes only to the deployment
- **CI**: `.github/workflows/e2e.yml` runs after each successful Vercel preview deployment (the `vercel.deployment.success` repository dispatch event). It tests the commit of the deployment against the preview URL and sets the `E2E tests` status on that commit. To test a deployment by hand, run the workflow from the Actions tab with the deployment URL
- **Secrets**: The workflow needs the `VERCEL_AUTOMATION_BYPASS_SECRET` and `E2E_LOGIN_SECRET` GitHub Actions secrets. Set the same `E2E_LOGIN_SECRET` in Vercel for the Preview environment only. Never set it for Production

### Authentication Flow

- **Login**: Direct sign-in with provider selection
- **Signup**: Multi-step process (name → user type → provider)
- **User types**: "host" (goes to /app) or "participate" (goes to /browse)
- **No "both" option**: Users choose one path during signup

## Important Notes

- Always prioritize user experience and accessibility
- Keep components simple and focused on single responsibilities
- Follow existing patterns rather than creating new ones unless necessary
