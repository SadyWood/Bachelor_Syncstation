# Quality Gate Checklist

Before marking a type migration as complete, verify:

- [ ] No duplicated API request/response types outside `packages/schema`
- [ ] No `any`, `unknown`, or `as any` used to silence errors
- [ ] `packages/schema` is the single source of truth for contracts (Zod schemas)
- [ ] `apps/workstation-web` UI-only types live in `src/types`
- [ ] `apps/*` do not import from `apps/api` (frontend uses `packages/schema`)
- [ ] DB row/mapping types are not leaking into shared contracts
- [ ] All imports updated across backend and frontend
- [ ] TypeScript compilation passes (`pnpm typecheck`)
- [ ] ESLint passes (`pnpm -r run lint`)
- [ ] Runtime validation added where appropriate (API boundaries)
