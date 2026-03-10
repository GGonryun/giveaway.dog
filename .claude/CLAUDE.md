## Agent Roster

| Agent              | Role                                      | Invoke when...                                                                                   |
| ------------------ | ----------------------------------------- | ------------------------------------------------------------------------------------------------ |
| team-orchestrator  | Coordinate multi-agent workflows          | "team plan: [feature]", any multi-agent task, or when you need a dependency-aware execution plan |
| ux-researcher      | User journey, friction, a11y              | Designing or evaluating any user-facing feature                                                  |
| tech-architect     | System design, data modeling, trade-offs  | Before major implementation decisions                                                            |
| devil-advocate     | Stress-test ideas, surface risks          | After a direction is proposed, before committing                                                 |
| pattern-scout      | Find prior art, libraries, conventions    | Evaluating build vs. buy, or unfamiliar patterns                                                 |
| task-planner       | Break work into executable task briefs    | After exploration phase, before implementation                                                   |
| frontend-agent     | React, Next.js UI, Tailwind, shadcn/ui    | Any component, page, or client-side work                                                         |
| backend-agent      | Server actions, API routes, Prisma, auth  | Any server-side logic or database work                                                           |
| code-reviewer      | Review diffs for bugs, security, quality  | After any implementation, before merge                                                           |
| test-writer        | Write Vitest + RTL tests                  | After implementation is complete                                                                 |
| style-reviewer     | Enforce STYLE.md conventions              | After any implementation, alongside code-reviewer                                                |
| tool-runner        | Run yarn scripts, read package.json       | Whenever a CLI command needs to be executed                                                      |
| content-writer     | UI copy, errors, emails, microcopy        | Any user-facing text needs writing or reviewing                                                  |
| typescript-expert  | Generics, type inference, type design     | Complex type errors or non-trivial type design                                                   |
| security-auditor   | Vulnerability audits, auth, data exposure | Before deploy, after auth/API/input handling work                                                |
| debugger-detective | Root cause analysis for broken things     | Something is broken and the cause isn't obvious                                                  |
| zero-defect        | 3-pass superset of all reviewers          | Triggered by "make no mistakes" — replaces individual reviewers when stakes are highest          |

## Sub-Agent Routing Rules

**Parallel dispatch** (ALL conditions must be met):

- 3+ unrelated tasks or independent domains
- No shared state between tasks
- Clear file boundaries with no overlap

**Sequential dispatch** (ANY condition triggers):

- Tasks have dependencies (B needs output from A)
- Shared files or state (merge conflict risk)
- Unclear scope (understand before proceeding)

**Background dispatch**:

- Research or analysis tasks (not file modifications)
- Results aren't blocking current work

## Invocation Quality Standard

Every agent invocation must include:

1. **Specific context** — file paths, existing patterns, relevant constraints
2. **Explicit scope** — what to build, not just what area to work in
3. **Success criteria** — what "done" looks like
4. **Reference files** — point to existing code that demonstrates the pattern to follow

Bad: "Fix the auth flow"
Good: "Fix the OAuth redirect loop in src/lib/auth.ts where successful login redirects to /login instead of /dashboard. The session is set correctly (verified in logs) but the middleware at src/middleware.ts redirects authenticated users away from /dashboard. Expected: authenticated users land on /dashboard after OAuth callback."

## Standard Exploration Workflow

For any new feature or significant decision, run this sequence:

```
Phase 1 (Parallel):
  - ux-researcher     → user journey + friction analysis
  - tech-architect    → architecture options + trade-offs
  - pattern-scout     → existing solutions + prior art

Phase 2 (Sequential, after Phase 1):
  - devil-advocate    → stress-test the leading direction

Phase 3 (Sequential, after Phase 2):
  - task-planner      → execution plan with task briefs

Phase 4 (Parallel, from task-planner output):
  - frontend-agent    → UI tasks
  - backend-agent     → server/data tasks

Phase 5 (Sequential, after Phase 4):
  - code-reviewer     → review all changes
  - style-reviewer    → check STYLE.md conformance
  - test-writer       → write tests for new code
  - tool-runner       → run yarn :lint, yarn :eslint, yarn :test
```

## Invocation Quality Standard

Every agent invocation must include:

1. **Specific context** — file paths, existing patterns, relevant constraints
2. **Explicit scope** — what to build, not just what area to work in
3. **Success criteria** — what "done" looks like
4. **Reference files** — point to existing code that demonstrates the pattern to follow

Bad: "Fix the auth flow"
Good: "Fix the OAuth redirect loop in src/lib/auth.ts where successful login redirects to /login instead of /dashboard. The session is set correctly (verified in logs) but the middleware at src/middleware.ts redirects authenticated users away from /dashboard. Expected: authenticated users land on /dashboard after OAuth callback."
