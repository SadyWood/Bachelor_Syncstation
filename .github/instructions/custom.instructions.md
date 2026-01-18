---
applyTo: '**'
---

You are assisting on the Hoolsy monorepo. Your job is to propose, write, and improve code that is robust, secure, and maintainable. Follow the rules below. Do not introduce patterns that conflict with the repo's current architecture.

## INTRODUCTION

Keep code small, focused, and readable.

Terminology: Do not use "DTO". Use Zod schemas as contracts and infer types from them. This is TypeScript/Zod convention, not Java.

Naming:
- **Schemas**: PascalCase with "Schema" suffix, one schema per file when possible.
  - Example: `LoginRequestSchema`, `UserRowSchema`
- **Types**: PascalCase names derived via `z.infer` from schemas, no suffix/prefix.
  - Example: `type ContentNode = z.infer<typeof ContentNodeSchema>;`
- **Files**: kebab-case (`content-node.schema.ts`, `users.repo.ts`)
- **Functions and variables**: camelCase

## MONOREPO REALITY CHECK

Respect the existing structure. Do not suggest new folder layouts unless explicitly asked.

Current layout of interest:
- `apps/api`
- `apps/workstation-web`
- `apps/marketplace-web` (optional)
- `packages/databases`
- `packages/schema`

Work with the existing dev scripts and multi-DB setup as described in README and SETUP.md.

## FILE HEADER RULE

Every source file starts with a single line comment showing its relative path.

Example:
```typescript
// apps/api/src/repos/users.repo.ts
```

## GENERAL CONVENTIONS

- No quick fixes that reduce quality, safety, or type safety.
- Avoid all "as any" in TypeScript. Prefer precise types, `unknown` plus type guards, Zod parsing, or generics.
- All code comments must be in English.
- Keep code small, focused, and readable.

## ZOD AS THE SINGLE SOURCE OF TRUTH

Use Zod schemas at all boundaries.

Derive TypeScript types via `z.infer`. Do not duplicate types manually.

Validate at:
- API boundaries: body, params, headers
- DB or repo boundaries
- External integrations and webhooks

Example:
```typescript
// schema/auth/login.schema.ts
import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.object({
  ok: z.literal(true),
  accessToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email()
  })
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// route handler
const input = LoginRequestSchema.parse(req.body);
```

## DATA ACCESS AND LAYERING

- Only repos talk to the database. Routes and services must not import Drizzle or query builders.
- Repos validate outgoing shapes with Zod before returning.
- Services contain domain logic and call repos and helpers.
- Routes stay thin. See section below.

Example:
```typescript
// repos/users.repo.ts
import { z } from "zod";

export const UserRowSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});
export type UserRow = z.infer<typeof UserRowSchema>;

export async function getUserById(id: string): Promise<UserRow | null> {
  // drizzle here
  // parse rows with UserRowSchema before returning
}
```

## TYPESCRIPT SAFETY

No "as any". Prefer:
- Generics, `ReturnType<typeof ...>`, `satisfies`
- Discriminated unions and type guards
- `unknown` parsed with Zod

Suggested tsconfig flags:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noImplicitAny: true`
- `exactOptionalPropertyTypes: true`

## ROUTES MUST BE THIN

A route's job: parse input with Zod, check auth or permissions, call a service, return a response that matches the response schema.

Do not implement business logic in routes.

Do not place helpers like `slugify` directly in routes. Put them in `utils` and call them from services if needed.

Example:
```typescript
// routes/content/create-node.route.ts
import { CreateNodeRequestSchema, CreateNodeResponseSchema } from "@/schema/content/create-node.schema";
import { createNode } from "@/services/content.service";

app.post("/ws/nodes", async (req, reply) => {
  const input = CreateNodeRequestSchema.parse(req.body);
  app.needsPerm(req, "content.create");

  const result = await createNode(input);
  const body = CreateNodeResponseSchema.parse(result);
  return reply.code(201).send(body);
});
```

## FRONTEND TYPES AND SCHEMAS

Shared runtime schemas and types live in `packages/schema`. Treat these as canonical.

In `apps/workstation-web`, do not scatter ad hoc types inside components.

Runtime validated shapes that mirror API contracts should either import from `packages/schema` or be defined under `src/types` if a local wrapper is truly needed.

UI-only TS types without runtime validation may live under `src/types` if that folder already exists or is established in the app. Do not create new top-level folders unless asked.

Recommended frontend structure:
```
src/
  types/       # All frontend-specific types and schemas (prefer importing from packages/schema for API contracts)
  lib/
    http.ts           # httpTyped with automatic JSON.stringify and Zod validation
    auth-client.ts    # Authentication API calls
    ws-client.ts      # Workstation API calls
    content-client.ts # Content management API calls
```

**Rule**: Import from `packages/schema` first. Only create local `src/types` files for web-specific extensions or UI-only types.

## API STRUCTURE

Backend follows the same pattern for consistency:

```
apps/api/src/
  schema/      # API-specific Zod schemas (e.g., route params like ProjectIdParamsSchema)
  types/       # API-specific TypeScript compile-time types (e.g., TenantHeader)
  utils/       # Helper functions (e.g., requireTenant, generateUniqueSlug)
  repos/       # Database access layer
  services/    # Business logic layer
  routes/      # Thin HTTP handlers
```

**Rule**: `schema/` for runtime validation with Zod, `types/` for compile-time TypeScript types.

## TYPED HTTP CLIENT FOR FRONTEND

`apps/workstation-web` uses `src/lib/http.ts` with the `httpTyped` helper.

`httpTyped` automatically handles:
- `JSON.stringify(body)` - **never do this manually!**
- `Content-Type: application/json` header
- Zod validation of request body (optional)
- Zod validation of response body (required)
- Error handling and typed exceptions

**NEVER** use manual `JSON.stringify` or the old `httpJson` pattern.

Example implementation:
```typescript
// src/lib/http.ts
import { z } from "zod";

export async function httpTyped<
  TReq extends z.ZodTypeAny | undefined,
  TRes extends z.ZodTypeAny
>(
  input: RequestInfo,
  init: Omit<RequestInit, "body"> & {
    body?: TReq extends z.ZodTypeAny ? z.infer<TReq> : undefined;
    schema: { res: TRes; req?: TReq };
  }
): Promise<z.infer<TRes>> {
  const { body, schema, ...rest } = init;

  let reqBody: BodyInit | undefined;
  if (body !== undefined) {
    if (schema.req) schema.req.parse(body);
    reqBody = JSON.stringify(body);  // Automatic stringify!
  }

  const res = await http(String(input), {
    headers: { "Content-Type": "application/json", ...(rest.headers || {}) },
    ...rest,
    body: reqBody,
  });

  const json = await res.json().catch(() => ({}));
  return schema.res.parse(json);  // Automatic validation!
}
```

Correct usage:
```typescript
// ✅ Good - httpTyped with plain object
await httpTyped('/ws/invite', {
  method: 'POST',
  body: { email },  // Plain object, no stringify needed!
  schema: { res: SuccessResponse },
});

// ❌ Bad - manual JSON.stringify
await httpJson('/ws/invite', {
  method: 'POST',
  body: JSON.stringify({ email }),  // Don't do this!
});
```

Common response schemas from `packages/schema`:
- `SuccessResponse`: `z.object({ ok: z.literal(true) })`
- `ErrorResponse`: `z.object({ ok: z.literal(false), code: z.string(), message: z.string() })`
- `ProjectResponse`, `NodeResponse`, etc.: Domain-specific responses

## API PRACTICES

- Validate input with Zod in routes.
- Responses must match declared Zod response schemas.
- Error shape: `{ ok: false, code, message }` with correct HTTP status codes.
- Auth: httpOnly refresh cookie and a signed JWT access token. Expose only schema-approved fields.

## SECURITY

- Never commit secrets or passwords to the repo.
- Cookies: `httpOnly`, `sameSite=lax` or stricter when possible, `secure` outside dev.
- Sanitize input strictly via Zod. Whitelist mappings to DB fields.
- Do not log sensitive values.

## DEMO AND PLACEHOLDER VALUES

All demo variables, credentials, tokens, and secrets must be obviously fake placeholders.

Never commit real or plausible credentials. Prefer angle brackets and imperative wording.

**Wrong**:
```
"password": "hunter2!"
"JWT_SECRET": "my-super-secret"
```

**Right**:
```
"password": "<change-password>"
"JWT_SECRET": "<set-a-strong-secret>"
"USERS_DB_URL": "<postgres-users-url>"
```

Recommended dummy data:
- Emails: `demo.user@example.test`, `admin@example.test`
- UUIDs: `00000000-0000-0000-0000-000000000000`
- Tokens: `<paste-token-here>`
- IDs: `<tenant-id>`, `<role-id>`, `<user-id>`

## JSDOC GUIDELINES

Use JSDoc **only** when it adds value beyond TypeScript types. Keep it concise.

Use:
- `@param` short parameter description
- `@returns` what is returned
- `@throws` important error conditions
- `@example` one short usage example for public functions

Avoid:
- Over-documenting what TypeScript already guarantees

Example:
```typescript
/**
 * Authenticates a user.
 * @param email User email
 * @param password Plain text password
 * @returns Access and refresh tokens, plus a public user snapshot
 * @throws If credentials are invalid or the user is inactive
 */
export async function login(email: string, password: string): Promise<LoginResponse> { ... }
```

## PULL REQUEST AND REVIEW CHECKLIST

- [ ] File begins with the relative path comment
- [ ] Zod used at every boundary
- [ ] No "as any"
- [ ] JSDoc added only where it adds value
- [ ] No Drizzle usage outside `repos/*`
- [ ] Response schemas match runtime shapes
- [ ] No sensitive data exposed or logged
- [ ] No business logic in routes
- [ ] Helpers like `slugify` live in `utils` and are called from services
- [ ] Frontend types centralized in `packages/schema` or `src/types` (not scattered in components)
- [ ] No "DTO" naming. Use `Schema` with `z.infer` for types
- [ ] `httpTyped` used for all HTTP calls (no manual `JSON.stringify` or `httpJson`)
- [ ] API has `schema/` for Zod runtime validation and `types/` for compile-time types
- [ ] Shared schemas in `packages/schema`, API-specific in `apps/api/src/schema/`

## PRIMARY RULE

**Write smaller, safer, and clearer code. Use Zod aggressively, avoid "as any", keep comments in English, keep routes thin, use typed HTTP with `httpTyped` (never manual `JSON.stringify`), and add JSDoc only when it helps.**
