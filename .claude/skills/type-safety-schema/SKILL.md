---
name: type-safety-schema
description: Enforce type safety and schema centralization in this monorepo. Use when reviewing PRs, adding API endpoints, moving types, or when there is a risk of duplicated API contracts between apps and packages/schema.
---

# Type Safety and Schema Centralization

## Mission

Keep API contracts defined exactly once in `packages/schema` and reused everywhere.
Prevent duplicated request/response types in app code.
Maintain a strict boundary between shared contracts and UI-only types.

## Non-negotiable rules

1. Never introduce `any`, `unknown`, or `as any` to bypass typing.
2. Shared API contracts must live in `packages/schema` as Zod schemas + inferred TS types.
3. App-specific types must live in a `types/` directory (e.g., `apps/*/src/types/`).
4. Types may ONLY be exported from approved locations:
   - **Apps**: `apps/*/src/types/**` (enforced by ESLint)
   - **Packages**: Anywhere (API surface controlled by re-exports from `index.ts` and `internal.ts`)
5. DB mapping and Drizzle row types are NOT exported (implementation detail, stay in repo files).
6. Frontend must never import from `apps/api` (only from `packages/schema`).

## Decision tree

For any type/interface:

- **Does the backend care about this shape (API input/output, shared domain object)?**
  - **Yes**: Move to `packages/schema` and define a Zod schema.
  - **No**: Continue to next question.

- **Is it a DB row type or ORM mapping type?**
  - **Yes**: Keep it in the repo file (e.g., `MediaAssetRow` in `media.repo.ts`). **DO NOT export it**.
  - **No**: Continue to next question.

- **Is it a shared UI component type (used across multiple apps)?**
  - **Yes**: Move to a shared UI package (e.g., `packages/timeline`).
  - Export ONLY from `src/index.ts` (public) or `src/internal.ts` (unstable/testing).
  - **No**: Continue to next question.

- **Is it app-specific (UI state, component props, local types)?**
  - **Yes**: Move to `apps/*/src/types/` and organize by domain:
    - `common.ts` - Shared types (icons, sorting)
    - `components.ts` - UI component props
    - `layout.ts` - Navigation, layout
    - `widgets.ts` - Widget system
    - `permissions.ts`, `events.ts`, etc. - Domain-specific
  - **No**: If unsure, ask for clarification.

## How to work (always)

1. **Detect duplicates:**
   - Look for local `api-types` files or repeated Response/Request shapes in apps.

2. **Classify each type:**
   - Shared contract vs UI-only vs internal implementation.

3. **Migrate shared contracts:**
   - Create/update Zod schemas in `packages/schema`.
   - Export schema and inferred types (`z.infer`).
   - Update imports across backend and frontend.

4. **Add runtime validation on boundaries:**
   - Validate API responses in clients with the Zod schema when feasible.

5. **Remove dead code:**
   - Delete old duplicated types after migration.

## Output format for PR reviews

- List duplicated contracts found
- For each: where it should live (schema vs UI vs internal)
- Exact file moves and import changes
- A short checklist to confirm completion

See `checklist.md` for the quality gate and `examples.md` for examples.

## Package strategy

### For shared UI packages (e.g., `packages/timeline`)

Packages are meant to be reused, so they MUST export types. The API surface is controlled by re-exports, not ESLint rules:

1. **Create clear entry points:**
   - `src/index.ts` - Public, stable API
   - `src/internal.ts` - Internal API for testing/advanced use

2. **Components and hooks:**
   - Export types directly from component files: `export interface ButtonProps`
   - Re-export from `index.ts` (public) or `internal.ts` (internal): `export type { ButtonProps } from './components/Button';`
   - Component files can freely export types

3. **No ESLint restrictions:**
   - Packages DON'T need ESLint rules restricting type exports
   - The API surface is controlled by what you re-export from entry points
   - Consumers import from the package root (e.g., `@hoolsy/timeline`), which resolves to `index.ts`
   - The package.json `exports` field further controls what's accessible

4. **Example structure:**
   ```
   packages/timeline/
   ├── src/
   │   ├── index.ts              ✅ Re-exports public API
   │   ├── internal.ts           ✅ Re-exports internal API
   │   ├── components/
   │   │   └── Timeline.tsx      ✅ Exports Timeline + TimelineProps
   │   └── hooks/
   │       └── useTimeline.ts    ✅ Exports hook + return type
   └── package.json              ✅ "exports": { ".": "./src/index.ts" }
   ```

5. **Benefits:**
   - Simple and maintainable
   - Clear public API surface through re-exports
   - Easy to refactor internals without breaking consumers
   - Consumers know what's stable (index.ts) vs unstable (internal.ts)
   - No need for complex ESLint configurations
