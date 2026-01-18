---
applyTo: '**'
---

# Project Guidelines

You are helping students learn this codebase. Before generating code, check `.claude/skills/index.md` for relevant skills and follow their patterns.

## Quality Checks

After making significant code changes:
1. Run `pnpm typecheck` to catch type errors
2. Run `pnpm lint` to enforce code style
3. Fix issues - never weaken rules
4. See `.claude/skills/code-quality-check/SKILL.md` for details

## Key Rules

- Never use `any` - use proper types from `@hk26/schema`
- Types belong in `packages/schema` or `apps/*/src/types/`
- Use `useSWR` for data fetching, not `useEffect`
- Avoid `console.log` in production code (see code-quality-check skill)
- Update Postman collections when adding API endpoints (see postman-update skill)
