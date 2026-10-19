# Spec

The rules that the app must follow, one sentence each, with a stable ID. The tests name the IDs, so each rule shows which tests check it, and a test that changes the behavior of a rule cannot go unnoticed.

## Files

One file for each domain. Each rule is a list item that starts with its ID in backticks:

```markdown
- `DRAW-001` An entry with a weight of 0 or less never wins.
```

| File                               | Rules                                                                                           |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`draws.md`](draws.md)             | `DRAW`: how the winners are picked, `SLOT`: prize quotas, `RNG`: randomness                     |
| [`eligibility.md`](eligibility.md) | `ELIG`: which participants can win                                                              |
| [`entries.md`](entries.md)         | `ENTRY`: task completions, the entries they are worth and the rules the server enforces on them |
| [`security.md`](security.md)       | `CRON`, `DISCORD`, `TWITCH`, `UPLOAD`, `HTML`: requests and input not trusted                   |
| [`inputs.md`](inputs.md)           | `TWEET`, `USERS`: values that people type or paste                                              |
| [`auth.md`](auth.md)               | `AUTH`: sign-in and sign-out, `ROUTE`: route protection, `LINK`: account linking                |
| [`teams.md`](teams.md)             | `TEAM`: isolation between teams, `ROLE`: what each team role may do, `INVITE`: team invites     |
| [`public-data.md`](public-data.md) | `LEAK`: what a public page may send, `VIS`: giveaway visibility, `TRACK`: visitor tracking      |

- **IDs**: a prefix of capital letters, a dash and three digits. An ID never changes and is never used again for another rule. To remove a rule, delete its line and its ID with it
- **A rule**: one sentence about what the product does, written from the product rule and not from the current code. It names no function or file
- **A new domain**: add a file and a row to the table above

## Tests

- **The ID in the title**: each test of a rule names its ID in brackets in its title, for example `it('[DRAW-001] a zero-weight item never wins', ...)`. A test can name several IDs. Property tests are the preferred form, because one property covers the whole rule (see Property Tests in `CLAUDE.md`). Server, integration and E2E tests can name IDs too
- **A pending rule**: a rule that the app does not follow yet has an `it.todo('[ID] ...')` test (or `test.fixme` in Playwright). The check lists it as pending
- **A known bug**: a test of a rule that fails because of an open bug uses `it.fails` and names the issue (see A known bug in `CLAUDE.md`), or `knownBug(<issue>)` in Playwright (see Known bugs in E2E Tests in `CLAUDE.md`). The check lists it as a known bug
- **A test that contradicts the spec** is a bug in the code or in the test, never a reason to change the spec. Fix the code, or mark the test `it.fails` and open a bug issue

## The check

`pnpm run spec:check` (`.github/scripts/spec-check.mjs`) reads the IDs of the rules from these files and the IDs from the titles of the tests in `apps/` and `packages/`. It fails when:

- a rule has no test (an `it.todo` test is enough)
- a test names an ID that no rule has
- two rules have the same ID, or a list item starts with an ID that is not well formed

`pnpm run verify` runs it, and so does `Lint 1/3` in CI.

## Spec changes and code changes

A pull request that changes these files does not change the application code, and a pull request that changes the application code does not change these files. `.github/scripts/spec-separation.mjs` enforces it in `Lint 1/3` from the files that the pull request changes. The application code is every file in `apps/web/` and in `packages/` (except `packages/tooling/`) that is not a test: not in a `__tests__/`, `__snapshots__/`, `__screenshots__/` or `src/testing/` folder, and not named `*.test.ts` or `*.test.tsx`. Both kinds of pull request can change tests.

To change a rule:

1. A spec pull request changes the rule and the tests that name it. When the code does not follow the new rule yet, the tests that check it use `it.fails` with an issue, or `it.todo`. A person reviews it
2. A code pull request then changes the code, and turns those tests into `it`

Run the separation check locally with `pnpm run spec:separation`, which compares your branch with `origin/main`.
