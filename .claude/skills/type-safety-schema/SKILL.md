---
name: type-safety-schema
description: Enforce type safety and schema centralization in this monorepo. Use when reviewing PRs, adding API endpoints, moving types, or when there is a risk of duplicated API contracts between apps and packages/schema.
---

# Type Safety and Schema Centralization

## Mission

Keep API contracts defined exactly once in `packages/schema` and reused everywhere.
Prevent duplicated request/response types in app code.
Maintain a strict boundary between shared contracts and app-specific types.

## Non-negotiable rules

1. Never introduce `any`, `unknown`, or `as any` to bypass typing.
2. Shared API contracts must live in `packages/schema` as Zod schemas + inferred TS types.
3. App-specific types must live in a `types/` directory (e.g., `apps/*/src/types/`).
4. DB row types from Drizzle are NOT exported (implementation detail, stay in repo/service files).
5. Frontend must never import from `apps/api` (only from `packages/schema`).

## Decision tree

For any type/interface:

- **Does the backend care about this shape (API input/output, shared domain object)?**
  - **Yes**: Move to `packages/schema` and define a Zod schema.
  - **No**: Continue to next question.

- **Is it a DB row type or Drizzle query result?**
  - **Yes**: Keep it in the service/repo file. **DO NOT export it**.
  - **No**: Continue to next question.

- **Is it app-specific (UI state, component props, form state)?**
  - **Yes**: Move to `apps/*/src/types/` and organize by domain:
    - `common.ts` - Shared types across the app
    - `components.ts` - Component props
    - `forms.ts` - Form state
    - `navigation.ts` - Routing, navigation
    - Domain-specific files as needed
  - **No**: If unsure, ask for clarification.

## How to work (always)

1. **Detect duplicates:**
   - Look for local type files or repeated Response/Request shapes in apps.

2. **Classify each type:**
   - Shared contract vs UI-only vs internal implementation.

3. **Migrate shared contracts:**
   - Create/update Zod schemas in `packages/schema`.
   - Export schema and inferred types (`z.infer`).
   - Update imports across backend and frontend.

4. **Add runtime validation:**
   - Validate API requests/responses with Zod schemas.

5. **Remove dead code:**
   - Delete old duplicated types after migration.

## Examples

### ✅ Correct: Shared contract in packages/schema

**packages/schema/src/auth/login.ts**
```typescript
import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    tenantId: z.string().uuid(),
  }),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
```

**Used in API:**
```typescript
import { loginRequestSchema, loginResponseSchema } from '@hk26/schema';

app.post('/auth/login', async (req, reply) => {
  const body = loginRequestSchema.parse(req.body); // Validates + types
  // ... auth logic
  return loginResponseSchema.parse(result);
});
```

**Used in frontend:**
```typescript
import { type LoginRequest, type LoginResponse } from '@hk26/schema';

const response = await fetch('/auth/login', {
  method: 'POST',
  body: JSON.stringify(loginData satisfies LoginRequest),
});
const data: LoginResponse = await response.json();
```

### ✅ Correct: App-specific UI types

**apps/web/src/types/forms.ts**
```typescript
// Form state - frontend only
export interface LoginFormState {
  email: string;
  password: string;
  errors: Record<string, string>;
  isSubmitting: boolean;
}
```

**apps/mobile/src/types/navigation.ts**
```typescript
// Navigation types - mobile only
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: { userId: string };
};
```

### ❌ Incorrect: Duplicated types

**DON'T DO THIS** in `apps/web/src/lib/api-types.ts`:
```typescript
// ❌ This duplicates backend types
export interface User {
  id: string;
  email: string;
  name: string | null;
  tenantId: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
```

**Fix:** Import from `@hk26/schema` instead.

### ✅ Correct: Internal DB types

**apps/api/src/services/user.service.ts**
```typescript
import { users } from '@hk26/postgres';

// Internal: Drizzle query result type
type UserRow = typeof users.$inferSelect;

// Map DB row to API contract
function mapUserToDto(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    tenantId: row.tenantId,
  };
}
```

## Package strategy

Packages control their API through re-exports:

1. **Export from package:**
   ```typescript
   // packages/schema/src/index.ts
   export * from './auth/login';
   export * from './user/user';
   ```

2. **Consumers import from package root:**
   ```typescript
   import { loginRequestSchema, type LoginRequest } from '@hk26/schema';
   ```

## Output format for PR reviews

When reviewing code, check:

- List duplicated contracts found
- For each: where it should live (schema vs app types vs internal)
- Exact file moves and import changes needed
- Checklist to confirm completion

See [checklist.md](checklist.md) for the quality gate and [examples.md](examples.md) for more examples.
