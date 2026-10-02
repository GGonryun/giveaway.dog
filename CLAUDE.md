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
app/
├── (auth)/
│   ├── login/
│   └── logout/
├── (marketing)/
│   ├── browse/ (for participants)
│   └── other public pages
├── app/ (main app for hosts)
components/
├── auth/ (shared auth components)
├── ui/ (shadcn/ui components)
└── patterns/ (reusable patterns)
lib/
├── auth.ts
├── auth.config.ts
└── utils.ts
```

### Common Patterns to Follow

1. **Always use TodoWrite** for task planning and tracking
2. **Read existing code** before implementing new features
3. **Extract shared components** when you see duplication
4. **Use Suspense boundaries** for components that use useSearchParams
5. **Set dynamic = 'force-dynamic'** for auth pages
6. **Handle form submission** only on final steps in multi-step forms

### Testing & Verification

- Use `pnpm run lint` for code linting (ESLint)
- Use `pnpm run type-check` for TypeScript verification
- Use `pnpm run test:run` to run all the tests one time (Vitest): server tests, component tests and snapshot tests
- Use `pnpm run test:unit` to run only the server and component tests, `pnpm run test:server` to run only the server tests, `pnpm run test:frontend` to run only the component tests, and `pnpm run test:snapshot` to run only the snapshot tests
- Use `pnpm run test:coverage` to run the server and component tests and measure the code coverage
- Use `pnpm run test:e2e` to run the Playwright end-to-end tests against a running app (see E2E Tests)
- Use `pnpm vitest run --project <name>` to run one project: `server`, `frontend` or `snapshot`
- Use `pnpm vitest run -u <path>` to update snapshots after an intended UI change. Review the snapshot diff before you commit it
- Use `pnpm run format` to automatically format all files
- Use `pnpm run format:check` to check if files need formatting
- Use `pnpm run verify` to run lint, format check, type check, and all the tests in sequence
- Never use `pnpm run build` for testing changes
- Check IDE diagnostics for immediate feedback

### Frontend Tests

- **Location**: Put component and hook tests in a `__tests__/` folder next to the code, named `<name>.test.tsx`. Put snapshot tests in a separate file in the same folder, named `<name>.snapshot.test.tsx`
- **Projects**: Files that end in `.snapshot.test.tsx` run in jsdom (the `snapshot` project). Other files that end in `.test.tsx` run in jsdom (the `frontend` project). Files that end in `.test.ts` run in Node (the `server` project)
- **Setup**: `test/setup-dom.ts` loads the jest-dom matchers, cleans up after each test and stubs `matchMedia`, `ResizeObserver`, `IntersectionObserver` and `scrollIntoView`
- **Libraries**: Use `@testing-library/react` with role queries (`screen.getByRole`) and `@testing-library/user-event` for interactions. Use `renderHook` for hooks
- **Snapshots**: Use `toMatchSnapshot()` for representative states, only in `.snapshot.test.tsx` files. ESLint rejects snapshot assertions in other test files. Keep snapshots deterministic: freeze time with `vi.setSystemTime`, mock `Math.random` and id generators, and do not snapshot Radix-generated ids
- **Mocks**: Mock `next/navigation`, `next/link`, `next/image`, `next-auth/react` and server actions with `vi.mock` in the test file
- **Pattern**: See `components/ui/__tests__/button.test.tsx` and `components/ui/__tests__/button.snapshot.test.tsx`

### Continuous Integration

- **Workflow**: `.github/workflows/ci.yml` runs on each pull request and on each push to `main`
- **Checks**: `Lint` (ESLint), `Server tests` (Vitest server tests, with coverage), `Frontend tests` (Vitest component tests, with coverage), `Snapshot tests` (Vitest snapshot tests) and `Coverage` (merges the server and frontend coverage). Merge a pull request only when all the checks pass
- **Coverage badge**: After each push to `main`, the `Coverage badge` job puts the merged line coverage in `coverage.svg` on the `badges` branch. The README shows this image. Do not edit the `badges` branch by hand
- **Package manager in CI**: pnpm 10 with `--frozen-lockfile`, the same as the Vercel build. After a dependency change, commit `pnpm-lock.yaml`
- **ESLint baseline**: `eslint-suppressions.json` records the errors that existed when ESLint was added. New errors fail the check. Do not add entries to this file to hide new errors
- **After you fix a recorded error**: Run `pnpm run lint:prune` and commit `eslint-suppressions.json`. If you do not, ESLint stops with exit code 2

### E2E Tests

- **Location**: Put Playwright tests in `e2e/`, named `<name>.spec.ts`. They run in Chromium. Vitest does not run them
- **Run locally**: Start the app with `pnpm dev`, then run `pnpm run test:e2e:local`. Run `pnpm exec playwright install chromium` one time first. The tests use `http://localhost:3000`. Set `E2E_BASE_URL` to test another deployment
- **Login**: The login test signs in through the `e2e` credentials provider in `lib/auth/providers/e2e.ts`. The app adds this provider only when `E2E_LOGIN_SECRET` has at least 32 characters, and only on Vercel preview deployments (`VERCEL_ENV=preview`) and the local development server (`next dev`). The provider signs in one host user, `e2e-host@example.com`. Without `E2E_LOGIN_SECRET`, the login test is skipped
- **Protected deployments**: `e2e/vercel.setup.ts` sends `VERCEL_AUTOMATION_BYPASS_SECRET` one time to get the Vercel bypass cookie. The other tests use that cookie, so the secret goes only to the deployment
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
