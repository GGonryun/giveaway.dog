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
- **Never run builds for testing**: Builds are slow and not necessary for verification
- **Prefer linting/type-check over builds** for quick verification

### File Structure & Conventions
- **Auth pages**: Located in `app/(auth)/` directory
- **Shared components**: Place reusable components in `components/` directory
- **UI components**: Use existing shadcn/ui components in `components/ui/`
- **Auth components**: Create shared auth components in `components/auth/`

### Authentication
- **Providers**: Supports X (Twitter), Google, Discord, and email (nodemailer)
- **Login vs Signup**: Keep separate action files for login and signup
- **Redirects**: 
  - Host users → `/app`
  - Participants → `/browse`
- **Query parameters**: Signup passes `signup=true&name=X&userType=X` to callback URL

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

### Code Style
- **No comments**: Don't add code comments unless explicitly requested
- **Consistent naming**: Follow existing naming conventions
- **TypeScript**: Use proper typing, avoid `any`
- **Server actions**: Use `'use server'` directive for server-side functions

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
│   ├── signup/
│   └── logout/
├── app/ (main app for hosts)
├── browse/ (for participants)
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
- Use `pnpm run lint` for code linting
- Use `pnpm run type-check` for TypeScript verification
- Never use `pnpm run build` for testing changes
- Check IDE diagnostics for immediate feedback

### Authentication Flow
- **Login**: Direct sign-in with provider selection
- **Signup**: Multi-step process (name → user type → provider)
- **User types**: "host" (goes to /app) or "participate" (goes to /browse)
- **No "both" option**: Users choose one path during signup

## Important Notes
- This is a defensive security project - only assist with legitimate development tasks
- Always prioritize user experience and accessibility
- Keep components simple and focused on single responsibilities
- Follow existing patterns rather than creating new ones unless necessary