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

- **App location**: The Next.js app is in `apps/web`. Paths in this file are relative to `apps/web` unless they start with `apps/`, `packages/`, `tools/`, `docs/`, `.github/` or name a root file
- **Environment files**: Put `.env.local` and `.env.prod` in `apps/web`. Next.js, Prisma and the `prisma:*` scripts read them from there
- **Workspace packages**: All code other than the routes goes in pnpm workspace packages under `packages/` (see Workspace Packages). The tooling packages are in `packages/tooling/`, and the domain packages are in the other folders of `packages/` (see Directory Structure). Create a package with a generator (see Workspace Packages). The app keeps only the route files in `app/`, `middleware.ts`, `public/`, `prisma/seed.ts` and its configs
- **Auth pages**: Located in `app/(auth)/` directory
- **Shared components**: Put a reusable component in the package of its feature, or in a design system package in `packages/ui/`. `docs/monorepo/package-graph.md` describes what each package holds
- **UI components**: Use existing shadcn/ui components from `@giveaway/ui-primitives` (`packages/ui/ui-primitives/src/`)
- **Auth components**: Put shared auth components in `packages/auth/`: `@giveaway/auth-login-ui` has the login and logout screens and the provider buttons, and `@giveaway/auth-session-ui` has the session provider and the logout button

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
│   ├── middleware.ts
│   ├── prisma/ (seed.ts)
│   ├── public/
│   ├── package.json (app dependencies and scripts)
│   ├── tsconfig.json
│   ├── vercel.json
│   └── vitest.config.ts
└── web-e2e/ (Playwright tests)
    ├── src/
    └── playwright.config.ts
packages/ (each folder is a package named @giveaway/<folder>; docs/monorepo/package-graph.md describes them)
├── account/ (account-context, account-email, account-history, account-profile, account-server, account-settings, onboarding, user-model)
├── audience/ (audience-server, audience-table, audience-user-details)
├── auth/ (auth-actions, auth-core, auth-login-ui, auth-model, auth-provider-e2e, auth-provider-inbound, auth-server, auth-session-ui)
├── automation/ (automation-model, automation-server, automation-ui)
├── browse/ (browse-item, browse-list, browse-server)
├── infra/ (app-config, cache, content-moderation, db-client, db-model, db-schema, email, feature-flags, jobs, ratelimit, request-context-model, request-context-server, rpc-client, rpc-model, rpc-server, turnstile-model, turnstile-server, turnstile-ui)
├── integrations/
│   ├── bluesky/ (bluesky-api, bluesky-connect, bluesky-connect-ui, bluesky-import, bluesky-model, bluesky-task-editor, bluesky-task-entry, bluesky-task-jobs, bluesky-task-validation)
│   ├── core/ (integration-icons, integration-model, integration-server, integration-ui, platform-catalog)
│   ├── discord/ (discord-api, discord-bot, discord-connect, discord-connect-ui, discord-model, discord-task-editor, discord-task-entry, discord-task-validation)
│   ├── kick/ (kick-auth, kick-task-editor, kick-task-entry)
│   ├── linkedin/ (linkedin-task-editor, linkedin-task-entry)
│   ├── meta/ (meta-connect-ui, meta-model, meta-task-editor, meta-task-entry)
│   ├── steam/ (steam-auth, steam-task-editor, steam-task-entry, steam-task-validation)
│   ├── tiktok/ (tiktok-task-editor, tiktok-task-entry)
│   ├── twitch/ (twitch-api, twitch-bot, twitch-connect, twitch-connect-ui, twitch-model, twitch-task-editor, twitch-task-entry, twitch-task-validation)
│   ├── velora/ (velora-api, velora-auth, velora-task-editor, velora-task-entry, velora-task-validation)
│   ├── x/ (x-api, x-connect, x-import, x-model, x-scraper, x-task-editor, x-task-entry, x-task-jobs)
│   └── youtube/ (youtube-model, youtube-task-editor, youtube-task-entry)
├── marketing/ (marketing-animations, marketing-home, marketing-learn, marketing-model, marketing-server, marketing-ui)
├── participants/ (allocation-model, allocation-server, custom-fields-model, custom-fields-server, custom-fields-ui, loyalty-model, participant-model, participant-server, participation-history-model, participation-history-server, participation-server, referrals-model, referrals-server, scoring-model, scoring-server, scoring-ui, user-quality-model, user-quality-ui, user-source-model, user-source-ui)
├── pickers/ (picker-model, picker-ui, x-picker-dashboard, x-picker-editor, x-picker-model, x-picker-public, x-picker-results, x-picker-server, x-picker-workflow)
├── shared/ (util-browser, util-collections, util-errors, util-geo, util-html, util-media, util-random, util-strings, util-time, util-types)
├── shell/ (shell-footer, shell-metrics, shell-navigation, shell-sidebar)
├── sweepstakes/ (sweepstakes-access, sweepstakes-actions-ui, sweepstakes-dashboard, sweepstakes-demo, sweepstakes-details-analytics, sweepstakes-details-entries, sweepstakes-details-participants, sweepstakes-details-preview, sweepstakes-details-promotion, sweepstakes-details-shell, sweepstakes-details-winners, sweepstakes-editor, sweepstakes-editor-audience, sweepstakes-editor-core, sweepstakes-editor-design, sweepstakes-editor-preview, sweepstakes-editor-prizes, sweepstakes-editor-selection, sweepstakes-editor-server, sweepstakes-editor-setup, sweepstakes-insights-server, sweepstakes-jobs, sweepstakes-model, sweepstakes-moderation-server, sweepstakes-participation, sweepstakes-participation-core, sweepstakes-participation-states, sweepstakes-routes, sweepstakes-ui, sweepstakes-ui-testing)
├── tasks/ (task-actions, task-editor, task-editor-fields, task-entry, task-entry-core, task-entry-form, task-entry-referral, task-entry-website, task-jobs, task-jobs-core, task-model, task-ui, task-validation, task-validation-core)
├── team/ (team-context, team-invite-acceptance, team-invites-server, team-members-server, team-members-ui, team-model, team-permissions, team-picker, team-server, team-settings-integrations, team-settings-profile, team-settings-shell, team-settings-socials, team-testing)
├── templates/ (templates-editor, templates-gallery, templates-model, templates-server)
├── ui/ (theme-model, theme-server, ui-brand, ui-carousel, ui-charts, ui-command, ui-date, ui-file-upload, ui-hooks, ui-layouts, ui-primitives, ui-qr, ui-rich-text, ui-theme, ui-utils)
├── winners/ (leaderboard-model, leaderboard-server, leaderboard-ui, winners-model, winners-server)
└── tooling/
    ├── tsconfig/ (@giveaway/tsconfig: tsconfig presets and shared type declarations)
    ├── eslint-config/ (@giveaway/eslint-config: ESLint presets)
    ├── vitest-config/ (@giveaway/vitest-config: Vitest projects)
    ├── testing-mocks/ (@giveaway/testing-mocks: the Prisma, session and next/cache mocks)
    ├── testing-server/ (@giveaway/testing-server: the global Vitest setup and the shared fixtures)
    ├── testing-dom/ (@giveaway/testing-dom: jsdom setup)
    └── testing-visual/ (@giveaway/testing-visual: visual test setup and helpers)
tools/
├── generators/ (@giveaway/generators: the Nx generators for new packages)
└── vercel/ (ignore-build.sh: the Vercel ignore step, see Continuous Integration)
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
- Use `pnpm nx g @giveaway/generators:<generator>` to create a package (see Workspace Packages)
- Use `pnpm run format` to automatically format all files
- Use `pnpm run format:check` to check if files need formatting
- Use `pnpm run verify` to run lint, format check, type check, and all the tests in sequence
- Never use `pnpm run build` for testing changes
- Check IDE diagnostics for immediate feedback

### Nx

- **Projects**: pnpm workspace packages under `apps/` and `packages/`. `web` is the app in `apps/web`, `web-e2e` is the Playwright tests in `apps/web-e2e`, and the `@giveaway/*` packages are in `packages/`. Their targets are the scripts in their `package.json`. `nx.json` sets the cache and the inputs
- **Cached targets**: `lint`, `type-check`, `test:unit`, `test:server`, `test:frontend` and `test:snapshot`, for example `pnpm nx run web:lint`. A second run with no changed inputs reads the result from the cache. `lint` is defined in each `package.json` under `nx.targets` and runs ESLint from the root on the project's folder. It uses the root `eslint-suppressions.json`, or the package's own `eslint-suppressions.json` when its `lint` command passes `--suppressions-location` (see Continuous Integration)
- **Inputs**: Each cached target hashes the files of its project, the non-test files of the workspace packages it depends on, the versions of the npm packages that they use, and the `sharedGlobals` files in `nx.json` (`.nvmrc`, the root `package.json` and `.github/actions/setup`). The named inputs in `nx.json` keep each tool out of the targets that do not use it:
  - `lint` hashes `default`, `^lintable`, `eslint` (the root `eslint.config.mjs`, `eslint-suppressions.json` and `tsconfig.base.json`, and the source of `@giveaway/eslint-config`) and `ci` (`ci.yml`, `.github/actions/nx-cache` and `.github/scripts`). `@giveaway/vitest-config` sets `lintable` to its `package.json` only, so a change to its source does not re-run `lint`
  - `type-check` and the `test:*` targets hash `source` (the files of the project without its `eslint-suppressions.json`) and `^runtime`. `@giveaway/eslint-config` sets `runtime` to nothing, so a change to it, to the ESLint files at the root, to an `eslint-suppressions.json` or to the CI files re-runs only `lint`. These changes still affect every project, and the other targets of those projects read their results from the cache
  - A package overrides a named input in `"nx": { "namedInputs": { ... } }` in its `package.json`. Check the inputs of a target with `pnpm nx show target inputs <project>:<target> --check <file>`
- **Affected projects**: `pnpm nx affected -t <target>` runs a target only for the projects that changed since `main`, and the projects that depend on them. `web-e2e` depends on `web`. A change to `pnpm-lock.yaml` affects only the projects that use the changed packages (`projectsAffectedByDependencyUpdates` is `auto`). A package that only the root tooling uses, such as ESLint or Prettier, is in no project, so a lockfile-only update of it affects no project. The full run on `main` still runs it
- **Dependencies**: Each npm version is written once, in the `catalog` of `pnpm-workspace.yaml`. A `package.json` writes `"<name>": "catalog:"`. Add an app dependency with `pnpm --filter web add --save-catalog <name>`. Add workspace tooling (Nx, ESLint, Prettier, Vitest and its plugins) to the root `package.json` with `pnpm add -D -w --save-catalog <name>`. A workspace package depends on another one with `"workspace:*"`. Vitest runs from the root, so its peer dependencies (`@types/node`, `jsdom`, `playwright`) stay in the root `package.json` with the same versions the app uses. Otherwise pnpm installs a second copy of Vitest, and the visual tests stop with no output
- **Other commands**:
  - `pnpm nx show projects` lists the projects, and `pnpm nx show project web` shows the targets of one
  - `pnpm nx run <project>:<target>` runs one target, for example `pnpm nx run @giveaway/team-model:test:unit`
  - `pnpm nx run-many -t <target> --projects=tag:<tag>` runs a target for the projects with a tag, for example `--projects=tag:platform:x` or `--projects=tag:scope:sweepstakes`
  - `pnpm nx affected -t <target>` runs a target for the projects that changed since `main` and their dependents
  - `pnpm nx graph` opens the project graph, and `pnpm nx graph --file=graph.json` writes it to a file
  - `pnpm nx g @giveaway/generators:<generator>` creates a package (see Workspace Packages)
  - `pnpm nx reset` clears the cache and the project graph. Run it when `@nx/dependency-checks` or the boundary rules report a dependency that a package no longer has
- **Build**: `nx.json` defines a `build` target default that is never cached, so a build always uses the current environment variables. Vercel finds this target and builds the app with `cd ../.. && npx nx build web`
- **CI**: CI runs the targets through Nx. See Continuous Integration

### Workspace Packages

- **Location and names**: A package is in `packages/<group>/<name>` and is named `@giveaway/<name>`. `pnpm-workspace.yaml` lists `apps/*`, `packages/**` and `tools/*`
- **Shape**: A package ships TypeScript source, with no build step. `exports` in its `package.json` lists each module, for example `"./button": "./src/button.tsx"`. Do not add barrel `index.ts` files. Its tags go in `"nx": { "tags": [...] }`: a `type:` tag, a `runtime:` tag and a `scope:` tag (the first folder under `packages/`), plus `platform:<name>` for a platform plugin. See Package Types and Dependency Rules
- **Tooling packages**: `packages/tooling/` has the packages that configure the others:
  - `@giveaway/tsconfig`: the `base`, `library`, `react-library` and `nextjs` presets. A `tsconfig.json` extends one of them, for example `"extends": "@giveaway/tsconfig/library.json"`. The presets list shared type declarations in `files`, so every project that extends them sees them: `react.d.ts` (`React.PC`, in `react-library` and `nextjs`) and `scrapebadger.d.ts` (the types of the scrapebadger package, whose `package.json` points to a file it does not ship, in `library`, `react-library` and `nextjs`)
  - `@giveaway/eslint-config`: `base` has the rules and the snapshot-assertion rule. `boundaries` has `@nx/enforce-module-boundaries` as an error, with the `depConstraints` that `dependencyRules` in the same file defines, the `@giveaway/no-server-in-client` rule (`src/rules/`, see Package Types and Dependency Rules) and `@nx/dependency-checks` for each `package.json` under `packages/`. Tests, the shared test fixtures in a package's `src/testing/` and package config files (`vitest.config.ts`, `eslint.config.mjs`) may also import `type:config` packages, and `@nx/dependency-checks` ignores their imports. The root `eslint.config.mjs` uses both. The rules need the Nx project graph, which `pnpm run lint` builds when it runs the targets through Nx
  - `@giveaway/vitest-config`: `projects` defines the `server`, `frontend` and `snapshot` projects of a package (`packageTestConfig`). It also sets `TZ=UTC` and replaces `server-only` with an empty module. Its `setupFiles` option replaces the default setup, `@giveaway/testing-server/setup`; the `frontend` and `snapshot` projects add `@giveaway/testing-dom/setup` after it. `workspace` finds the `vitest.config.ts` of each package for the root config
  - `@giveaway/testing-mocks`: the Prisma, session and `next/cache` mocks, and `/setup`, which mocks `next/cache` and resets the mocks before each test. It depends on no workspace package
  - `@giveaway/testing-server`: the default setup file of every project, which loads `@giveaway/testing-mocks/setup` and mocks `@giveaway/db-client/prisma` and `@giveaway/auth-core/config-no-providers`, the helpers that tests import (`@giveaway/testing-server/prisma`, `/session` and `/next-cache` re-export `@giveaway/testing-mocks`, `/result`, and `/property` for property tests) and the fixtures that tests of several packages share (`/fixtures-*`). Because it depends on `db-client` and `auth-core`, the packages that they depend on (`auth-core`, `db-client`, `db-model`, `db-schema`, `integration-model`, `util-collections`, `util-errors` and `util-types`) cannot use it: their `vitest.config.ts` passes `setupFiles`, and `auth-core` mocks Prisma in `src/testing/setup.ts` with `@giveaway/testing-mocks`. The cycle check of the boundary rules fails when one of them depends on it
  - `@giveaway/testing-dom`: the jsdom setup of the `frontend` and `snapshot` projects, and the `/test-utils` and `/stable-dom` helpers
  - `@giveaway/testing-visual`: the Vitest config (`/config`), the browser setup (`/setup`) and the `renderVisual` helpers (`/render`) of the visual tests, and `visual-docker`, which runs the visual tests of the package it is called from in the Playwright Docker image
- **Domain packages**: The folders of `packages/` other than `tooling/` have the domain packages. Import them by package name, for example `@giveaway/util-errors` or `@giveaway/db-client/prisma`, never with a path into `packages/`. Each one is in `transpilePackages` in `apps/web/next.config.ts` and is a `workspace:*` dependency in `apps/web/package.json`. `apps/web/app/globals.css` has `@source '../../../packages'`, so Tailwind finds the classes that packages use. `docs/monorepo/migration-plan.md` records how the code moved out of `apps/web`
- **Prisma**: `@giveaway/db-schema` has `schema.prisma` and the migrations in `packages/infra/db-schema/src/`. Its `postinstall` runs `prisma generate`, and `pnpm --filter @giveaway/db-schema run generate` runs it again. The `prisma:*` scripts in `apps/web/package.json` find the schema through `prisma.schema` in that file, and read the env files in `apps/web`. Import the Prisma client from `@giveaway/db-client/prisma`. In a package, import the Prisma enums and types from `@giveaway/db-model`, not from `@prisma/client` (the app still imports `@prisma/client`). `@giveaway/db-model` re-exports every type of `@prisma/client`, and the enums and `Prisma` as named values, because Vite cannot re-export the values of a CommonJS module with `export *` and the visual tests run in Vite. When you add an enum to the schema, add it to `packages/infra/db-model/src/index.ts`. Its test fails until you do. `@giveaway/db-client` and `@giveaway/db-model` have an implicit Nx dependency on `@giveaway/db-schema`, so a schema change affects every project that uses the generated client
- **Adding a package**: Run a generator from the root. It writes `package.json` (tags, `lint` target, `exports`, scripts and dependencies), `tsconfig.json`, `vitest.config.ts`, a first module in `src/` with a test in `src/__tests__/`, adds the package to `transpilePackages` in `apps/web/next.config.ts`, formats the files and runs `pnpm install`. The new package passes lint, type check and tests as it is. Pass `--module <name>` to name the first module (the package name by default), and `--dry-run` to see the files first:
  - `pnpm nx g @giveaway/generators:model <name> --directory <folder>`, and the same with `util`, `server`, `ui` and `feature`. `<name>` has no `@giveaway/` scope, for example `referrals-model`, and `<folder>` is a folder of `packages/`, for example `participants`. Its first segment is the `scope:` tag
  - `pnpm nx g @giveaway/generators:platform-slot <platform> <slot>` creates `@giveaway/<platform>-<slot>` in `packages/integrations/<platform>/`, with the type of the slot and a `platform:<platform>` tag. The slots are in "Platform plugins" in `docs/monorepo/package-graph.md`. For a `task-*` slot, add the package to the registry package of the same name in `packages/tasks/`
  - Then add the package to the `dependencies` of each package that imports it (`workspace:*`), and to `apps/web/package.json` when a route imports it, and run `pnpm install`
- **Vitest config of a package**: `vitest.config.ts` exports `defineConfig(packageTestConfig())`, or passes `setupFiles` (see `@giveaway/testing-server`). The root `vitest.config.ts` adds the three projects of each package that has one, named `<package>:server`, `<package>:frontend` and `<package>:snapshot`. A package with tests has `test:*` scripts for the projects it uses, so Nx and CI run them

### Package Types and Dependency Rules

- **Types**: Each package has one `type:` tag. `@nx/enforce-module-boundaries` fails on an import of a package whose type the importer may not import:

  | Type      | Contents                                                     | May import                                 |
  | --------- | ------------------------------------------------------------ | ------------------------------------------ |
  | `util`    | Helpers with no React and no server code                     | `util`                                     |
  | `model`   | Zod schemas, types, constants and pure functions             | `model`, `util`                            |
  | `server`  | Server actions, queries, API clients, jobs and webhooks      | `server`, `model`, `util`                  |
  | `ui`      | Presentational components and hooks that call no server code | `ui`, `model`, `util`                      |
  | `feature` | Pages and components that call server actions                | `feature`, `ui`, `server`, `model`, `util` |
  | `config`  | tsconfig, ESLint and Vitest presets, test setup and fixtures | `config`, `model`, `util`                  |
  | `app`     | `apps/web` and `apps/web-e2e`                                | everything                                 |
  | `tool`    | `tools/generators`                                           | `server`, `model`, `util`                  |

  `dependencyRules` in `packages/tooling/eslint-config/src/boundaries.mjs` defines this table. `ui` never imports `server`, and `server` never imports `ui`

- **Tests may import `type:config` packages**: tests, the fixtures in `src/testing/` and the `vitest.config.ts`, `vitest.visual.config.ts` and `eslint.config.mjs` of a package may also import `type:config` packages, such as `@giveaway/testing-server`. Runtime code may not
- **No cycles**: the rule also fails on a dependency cycle between packages. The project graph counts `devDependencies`, so a test dependency can close a cycle too (see `@giveaway/testing-server`)
- **Only the exports**: a package imports another package by name, and only the modules in its `exports`. The rule fails on a relative import into another package, so a feature never reaches into the internals of another feature. To share a module, add it to the `exports` of its package, or move it to a `model` package
- **Runtime tags**: `runtime:server` (every `server` package; each module that is not a server action imports `server-only`), `runtime:react` (`ui` and `feature`) or `runtime:isomorphic` (`util`, `model`, `config`, `tool`). A `model` or `util` package does not depend on React
- **Client and server code**: the `@giveaway/no-server-in-client` ESLint rule follows the imports of each module that begins with `'use client'`, and of the modules it reaches, and fails when it reaches a module of a `runtime:server` package. It skips `import type` and imports whose names all have `type`, and stops at a `'use server'` module, because a client bundle gets only a reference to a server action. It also fails on a `'use client'` module in a `runtime:server` package. It works on files, not packages: a `feature` package may still import a server action or render a Server Component. To fix a report, move the constant or schema to a `model` package or use `import type`
- **Dynamic imports**: `checkDynamicDependenciesExceptions: ['@giveaway/**']` turns off the rule's check for static imports of lazy-loaded packages. Tests import packages with `await import()` after `vi.resetModules()`, and one such import makes the whole project edge dynamic. No code uses `next/dynamic` with a package

### Frontend Tests

- **Location**: Put tests in the package of the code they test, in a `__tests__/` folder next to the code: server and model tests named `<name>.test.ts`, component and hook tests named `<name>.test.tsx`, and snapshot tests in a separate file named `<name>.snapshot.test.tsx`. Put fixtures that tests of other packages share in `src/testing/<name>.ts` and export them as `./testing/<name>` (for example `@giveaway/util-errors/testing/application-error`)
- **Projects**: Files that end in `.snapshot.test.tsx` run in jsdom (the `snapshot` project). Other files that end in `.test.tsx` run in jsdom (the `frontend` project). Files that end in `.test.ts` run in Node (the `server` project)
- **Setup**: `@giveaway/testing-dom/setup` (`packages/tooling/testing-dom/src/setup.ts`) loads the jest-dom matchers, cleans up after each test and stubs `matchMedia`, `ResizeObserver`, `IntersectionObserver` and `scrollIntoView`. `@giveaway/testing-server/setup` mocks Prisma, the session and `next/cache` in every project that uses the default setup
- **Libraries**: Use `@testing-library/react` with role queries (`screen.getByRole`) and `@testing-library/user-event` for interactions. Use `renderHook` for hooks
- **Snapshots**: Use `toMatchSnapshot()` for representative states, only in `.snapshot.test.tsx` files. ESLint rejects snapshot assertions in other test files. Keep snapshots deterministic: freeze time with `vi.setSystemTime`, mock `Math.random` and id generators, and do not snapshot Radix-generated ids
- **Mocks**: Mock `next/navigation`, `next/link`, `next/image`, `next-auth/react` and server actions with `vi.mock` in the test file
- **Pattern**: See `packages/ui/ui-primitives/src/__tests__/button.test.tsx` and `packages/ui/ui-primitives/src/__tests__/button.snapshot.test.tsx`

### Continuous Integration

- **Workflow**: `.github/workflows/ci.yml` runs on each pull request and on each push to `main`
- **Checks**: `Lint` (ESLint, with the boundary rules, on the projects and on the files outside them: the root configs, `docs/` and `.github/`, then `pnpm run format:check` on the whole repository), `Type check` (TypeScript), `Server tests` (Vitest server tests, with coverage), `Frontend tests` (Vitest component tests, with coverage), `Snapshot tests` (Vitest snapshot tests), `Visual tests` (screenshots in Chromium) and `Coverage` (merges the server and frontend coverage). Merge a pull request only when all the checks pass
- **Nx in CI**: On a pull request, each job runs `pnpm nx affected -t <target>`: the target of each project that the pull request changes and of each project that depends on it. A pull request that changes a package that only `web` depends on runs the targets of that package, `web` and `web-e2e`, and a pull request that changes no project (for example, only Markdown files at the root) runs no tests. A change to a file that only `lint` uses (see Inputs in Nx) affects every project, but the other targets read their results from the Nx cache. The `Lint` job also runs `pnpm run lint:root` on every run, because the files outside the projects belong to no project and `nx affected` cannot select them. `nrwl/nx-set-shas` sets the base commit. On a push to `main` and on a manual run, each job runs `pnpm nx run-many -t <target>` for all the projects, so the `Coverage badge` job always has the full coverage. The tasks whose inputs did not change since the last run on `main` read their results from the Nx cache
- **Nx cache in CI**: `.github/actions/nx-cache` starts a small server (`server.mjs`) that gives the cache to Nx through the Nx remote cache API (`NX_SELF_HOSTED_REMOTE_CACHE_SERVER`). `actions/cache` keeps the files of the server in `.nx/ci-cache`, for each job and branch, with a fallback to `main`. The server deletes the entries that no run used for 7 days. Nx cannot use a copy of its own local cache folder, because its cache database is tied to the machine. A re-run on the same commit reads `lint`, `type-check` and the tests from the cache
- **Paths in CI**: Each project writes its Vitest reports to `.vitest-reports` in its folder. `.github/scripts/collect-vitest-reports.mjs` copies them to `.vitest-reports` at the root, and the `Coverage` job merges them with the root `vitest.config.ts` into `coverage/coverage-summary.json` at the root. The merge uses only the coverage in the reports. It cannot match the test files to the root projects, because each package runs its tests under the project names `server` and `frontend` and the root config names them `<package>:server` and `<package>:frontend`, so it runs with `--passWithNoTests`. The `Server tests` and `Frontend tests` jobs report the test results. The visual test attachments are in `.vitest-attachments` in the folder of each project that has visual tests. The Playwright report is in `apps/web-e2e/playwright-report`
- **Coverage badge**: After each push to `main`, the `Coverage badge` job puts the merged line coverage in `coverage.svg` on the `badges` branch. The README shows this image. Do not edit the `badges` branch by hand
- **Vercel previews**: The `ignoreCommand` in `apps/web/vercel.json` runs `tools/vercel/ignore-build.sh`. It skips a preview build when every file that changed since the last deployment of the branch (`VERCEL_GIT_PREVIOUS_SHA`) is a Markdown file at the root, a file in `docs/`, `.github/` or `.claude/`, a test, a snapshot, a screenshot or a Vitest config. It always builds production, the first deployment of a branch, and a change to `apps/web-e2e`. A skipped preview does not start `e2e.yml`
- **Package manager in CI**: pnpm 10 with `--frozen-lockfile`, the same as the Vercel build. After a dependency change, commit `pnpm-lock.yaml`
- **ESLint baseline**: `eslint-suppressions.json` (at the root, with paths relative to the root) records the errors that existed when ESLint was added. A package that moved with recorded errors has its own `eslint-suppressions.json`, also with paths relative to the root, and its `lint` command passes it with `--suppressions-location`. ESLint fails when that file does not exist, so pass the option only for a package that has the file. New errors fail the check. Do not add entries to these files to hide new errors
- **After you fix a recorded error**: Run `pnpm run lint:prune` from the root and commit the changed `eslint-suppressions.json` files. It runs every `lint` target through Nx with `--prune-suppressions`, one at a time, because several projects share the root file. If you do not, ESLint stops with exit code 2
- **Formatting**: The `Prettier` step of the `Lint` job runs `pnpm run format:check` (`prettier --check .`) on the whole repository, not only the affected projects, because Prettier also checks the files that belong to no project (the root files, `docs/` and `.github/`). It runs even when an ESLint step fails, so one run reports both. The log names each file that is not formatted. Run `pnpm run format` and commit the result
- **Package boundaries**: The `Lint` job enforces the package types, the cycles and the client and server rule (see Package Types and Dependency Rules). Fix a report in the code. Do not add suppressions for these rules

### Property Tests

- **What they are**: A property test states a rule that must hold for every input, and [fast-check](https://fast-check.dev) generates the inputs (100 runs per property by default). Use them for rules about draws, eligibility, entry values and other logic where one wrong result costs trust. Write the property from the product rule, not from the current code
- **Location**: Put them in the `__tests__/` folder next to the code, named `<name>.property.test.ts`. The `server` project runs them with the other tests, so `pnpm run test:run` and CI run them. Add `"fast-check": "catalog:"` to the `devDependencies` of the package
- **Writing a test**: Run the property with `assertProperty` (or `assertAsyncProperty` for `fc.asyncProperty`) from `@giveaway/testing-server/property`, not with `fc.assert`, so the environment variables below work. Put the ID of the rule in the test title, for example `it('[DRAW-002] toUniquePrizeDraw never picks the same user twice', ...)`. When the code under test uses `Math.random`, generate a seed with `randomSeed` and stub `Math.random` with `seededRandom(seed)`, so the seed of the run reproduces the whole failure. See `packages/winners/winners-server/src/__tests__/selection.property.test.ts`
- **A known bug**: When a property fails because of an open bug, mark it with `it.fails` and name the issue in the title, for example `(fails until #134 is fixed)`. Change it to `it` in the pull request that fixes the bug
- **CI**: The seed is not pinned, so each run tries new inputs. A failure prints the seed, the path and the shrunk counterexample, for example `{ seed: -311437948, path: "0:0:0:0", endOnFailure: true }` and `Counterexample: [...]`
- **Reproduce a failure**: Pass the seed and the path from the failure, and select the test with `-t`: `FC_SEED=-311437948 FC_PATH=0:0:0:0 pnpm exec vitest run --project '@giveaway/winners-model:server' weighted-rolls.property -t 'DRAW-001'`. `FC_NUM_RUNS=10000` runs more inputs, to search for a rare failure locally

### Visual Tests

- **What they do**: Each visual test renders a component in a real Chromium browser (Vitest browser mode with Playwright), takes a screenshot and compares it with a reference PNG pixel by pixel. A change to a component, a Tailwind class or a theme token that changes how it looks fails the `Visual tests` check
- **Location**: Put visual tests in a `__tests__/` folder next to the code, named `<name>.visual.test.tsx`. The references go in `__tests__/__screenshots__/<name>.visual.test.tsx/`. Each project with visual tests has a `vitest.visual.config.ts` that uses `visualTestConfig` from `@giveaway/testing-visual/config`, and `test:visual` scripts. The root `test:visual*` scripts run them in every project. `pnpm run test:run` does not run visual tests
- **Writing a test**: Use `renderVisual` and `THEMES` from `@giveaway/testing-visual/render`. Render each test in the light and the dark theme. Then call `await expect.element(root).toMatchScreenshot()`. For a component in a portal (a dialog, a popover), take the screenshot of the portal element, for example `page.getByRole('dialog')`. See `packages/ui/ui-primitives/src/__tests__/button.visual.test.tsx`
- **Keep them deterministic**: Use fixed data. Do not use the current date, random values or images from the network. `@giveaway/testing-visual/setup` loads the Figtree font and turns off animations and transitions. `visualTestConfig` also loads `apps/web/app/globals.css` as a setup file, for the theme, and runs Tailwind with `apps/web` as its base, so every project gets the CSS of the app. The Nx project graph cannot see this link, so the `test:visual` target default in `nx.json` names `apps/web/app/globals.css` as an input: a change to `globals.css` runs the visual tests of every package that has them, on a pull request too. When `visualTestConfig` reads another file from `apps/web`, add it to the same `inputs` list. `test:visual` is not cached
- **The references come from the Playwright Docker image**: The pixels depend on the browser version and the fonts of the operating system, so a screenshot from your own browser does not match. The `Visual tests` job runs in `mcr.microsoft.com/playwright` for the Playwright version in `pnpm-lock.yaml`. Only commit references that were made in that image, in one of these ways:
  - `pnpm run test:visual:docker:update` runs the tests in the same image on your machine and writes the new references. Use `pnpm run test:visual:docker` to only compare. These scripts need Docker on Linux, because they use your `node_modules`. In a Claude Code cloud session, start Docker first with `dockerd > /tmp/dockerd.log 2>&1 &`
  - The **Update visual references** workflow (Actions tab, or `workflow_dispatch` through the GitHub API, on your branch, not on `main`) takes new references in the same image, commits them to the branch and starts CI again on that commit
- **When `Visual tests` fails**: The job log and the job summary list each screenshot that changed, with the number of pixels that differ. The `visual-changes` artifact has the actual screenshot and a diff image (changed pixels in red) for each one. To see them in a session, run `pnpm run test:visual:docker` and open the files in the `.vitest-attachments/` folder of the project. Then decide if each change is intended:
  - Intended (you changed how the component looks on purpose, or you added a visual test): update the references (see above). Open the new PNG files and the old ones (`git show HEAD:<path>`) and confirm that they show only what you meant to change
  - Not intended (for example, a change to a shared component or a theme token changed a component you did not mean to change): fix the code. Do not update the references to make the check pass
- **Run without Docker**: `pnpm run test:visual` uses the Chromium of your Playwright install. It is useful while you write a test, but expect small text differences against the committed references. When Chromium is not where Playwright expects it, set `VISUAL_CHROMIUM_PATH` to the Chromium binary (in Claude Code cloud sessions: `VISUAL_CHROMIUM_PATH=/opt/pw-browsers/chromium`)

### E2E Tests

- **Location**: Put Playwright tests in `apps/web-e2e/src/`, named `<name>.spec.ts`. They run in Chromium. Vitest does not run them
- **Run locally**: Start the app with `pnpm dev`, then run `pnpm run test:e2e:local`. It reads `apps/web/.env.local`. Run `pnpm --filter web-e2e exec playwright install chromium` one time first. The tests use `http://localhost:3000`. Set `E2E_BASE_URL` to test another deployment
- **Login**: The login test signs in through the `e2e` credentials provider in `packages/auth/auth-provider-e2e/src/e2e.ts`. The app adds this provider only when `E2E_LOGIN_SECRET` has at least 32 characters, and only on Vercel preview deployments (`VERCEL_ENV=preview`) and the local development server (`next dev`). The provider signs in one host user, `e2e-host@example.com`. Without `E2E_LOGIN_SECRET`, the login test is skipped
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
