# Quality Gate Checklist

Before marking a type migration as complete, verify:

- [ ] No duplicated API request/response types outside `packages/schema`
- [ ] No `any`, `unknown`, or `as any` used to silence errors
- [ ] `packages/schema` is the single source of truth for API contracts (Zod schemas)
- [ ] App-specific types live in `apps/*/src/types/`
- [ ] Frontend apps do not import from `apps/api` (use `packages/schema` instead)
- [ ] DB row/Drizzle types are not exported from services
- [ ] All imports updated across backend and frontend
- [ ] TypeScript compilation passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Runtime validation added at API boundaries (request/response validation)
