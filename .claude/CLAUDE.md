# Rules for programming

- Avoid using `as any` or casting to `any`, always find a defined type or create one if necessary
- Avoid using `// @ts-ignore` comments, instead address the underlying type issue
- Use `yarn :format` to ensure code is consistently formatted

## Team Plan Generation

When I say "team plan: [feature]", generate a task structure:

For each component:

1. TaskCreate a builder task with specific files and acceptance criteria
2. TaskCreate a validator task scoped to read-only verification
3. TaskUpdate to chain validator behind its builder

After all component pairs, add one integration validator blocked by ALL builders.

Format each task description with:

- **Files**: exact paths to create or read
- **Criteria**: measurable acceptance conditions
- **Constraints**: what this agent must NOT do

## Parallel Feature Implementation Workflows

When implementing features, consider if tasks can be done in parallel by spawning multiple Task agents. Use the following patterns to determine when and how to parallelize work:

### Research Coordination

Parallelize research tasks across multiple agents to quickly gather information on:

1. **Technical**: Best practices for implementing a specific feature or integration
2. **Design**: Modern UX trends for data visualization
3. **Performance**: User-friendly data loading and caching strategies
4. **Accessibility**: Best practices for accessible dashboards

### Role Based Task Delegation

Analyze this codebase using parallel Task agents with these roles:

- Senior engineer: Architecture and performance
- Security expert: Vulnerability assessment
- QA tester: Edge cases and validation
- Frontend specialist: UI/UX optimization
- DevOps engineer: Deployment considerations

### Domain-Specific Distribution

Implement user authentication system using parallel Task agents:

1. Database schema and migrations
2. Auth middleware and JWT handling
3. User model and validation
4. API routes and controllers
5. Integration tests
6. Documentation updates

### The 7-Agent Feature Pattern

When implementing features, spawn 7 parallel Task agents:

1. **Component**: Create main component file
2. **Styles**: Create component styles/CSS
3. **Tests**: Create test files
4. **Types**: Create type definitions
5. **Hooks**: Create custom hooks/utilities
6. **Integration**: Update routing, imports, exports
7. **Remaining**: Update package.json, docs, config files

### Context Optimization Rules

- Strip comments when reading code files for analysis
- Each Task handles ONLY specified files or file types
- Task 7 combines small config/doc updates to avoid over-fragmentation

## Sub-Agent Routing Rules

**Parallel dispatch** (ALL conditions must be met):

- 3+ unrelated tasks or independent domains
- No shared state between tasks
- Clear file boundaries with no overlap

**Sequential dispatch** (ANY condition triggers):

- Tasks have dependencies (B needs output from A)
- Shared files or state (merge conflict risk)
- Unclear scope (need to understand before proceeding)

**Background dispatch**:

- Research or analysis tasks (not file modifications)
- Results aren't blocking your current work

## Domain Parallel Patterns

When implementing features across domains, spawn parallel agents:

- **Frontend agent**: React components, UI state, forms
- **Backend agent**: API routes, server actions, business logic
- **Database agent**: Schema, migrations, queries

Each agent owns their domain. No file overlap.

## Background Execution Rules

Run in background automatically:

- Web research and documentation lookups
- Codebase exploration and analysis
- Security audits and performance profiling
- Any task where results aren't immediately needed

## Agent Roster

| Agent              | Role                                      | Invoke when...                                    |
| ------------------ | ----------------------------------------- | ------------------------------------------------- |
| ux-researcher      | User journey, friction, a11y              | Designing or evaluating any user-facing feature   |
| tech-architect     | System design, data modeling, trade-offs  | Before major implementation decisions             |
| devil-advocate     | Stress-test ideas, surface risks          | After a direction is proposed, before committing  |
| pattern-scout      | Find prior art, libraries, conventions    | Evaluating build vs. buy, or unfamiliar patterns  |
| task-planner       | Break work into executable task briefs    | After exploration phase, before implementation    |
| frontend-agent     | React, Next.js UI, Tailwind, shadcn/ui    | Any component, page, or client-side work          |
| backend-agent      | Server actions, API routes, Prisma, auth  | Any server-side logic or database work            |
| code-reviewer      | Review diffs for bugs, security, quality  | After any implementation, before merge            |
| test-writer        | Write Vitest + RTL tests                  | After implementation is complete                  |
| style-reviewer     | Enforce STYLE.md conventions              | After any implementation, alongside code-reviewer |
| tool-runner        | Run yarn scripts, read package.json       | Whenever a CLI command needs to be executed       |
| content-writer     | UI copy, errors, emails, microcopy        | Any user-facing text needs writing or reviewing   |
| typescript-expert  | Generics, type inference, type design     | Complex type errors or non-trivial type design    |
| security-auditor   | Vulnerability audits, auth, data exposure | Before deploy, after auth/API/input handling work |
| debugger-detective | Root cause analysis for broken things     | Something is broken and the cause isn't obvious   |

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

## Haiku Tasks (routine, < $0.01 each)

- `mcp__ide__getDiagnostics` for any file
- Glob searches (finding files by pattern)
- Grep searches (finding code patterns)
- Reading and summarizing fewer than 5 files
- Running bash commands and parsing output
- Test execution and result checking

## Sonnet Tasks (complex, keep in main agent)

- Editing code files
- Architectural decisions
- Complex debugging requiring inference
- Multi-file refactoring
- User-facing responses requiring nuance

---

**Pattern:** Use the Task tool with `model="haiku"` for reads and checks. Keep writes and decisions in the main agent.
