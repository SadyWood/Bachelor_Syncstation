# Examples

## ✅ Correct: Shared Contracts in packages/schema

### Authentication Contract

**Location**: `packages/schema/src/auth/login.ts`

```typescript
import { z } from 'zod';

// Define Zod schema (single source of truth)
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

// Export inferred TypeScript types
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
```

**Usage in backend** (`apps/api/src/routes/auth.ts`):

```typescript
import { loginRequestSchema, loginResponseSchema } from '@hk26/schema';

app.post('/auth/login', async (req, reply) => {
  // Validates and provides types automatically
  const { email, password } = loginRequestSchema.parse(req.body);

  // ... authentication logic

  const result = {
    accessToken: 'jwt-token',
    refreshToken: 'refresh-token',
    user: { id, email, name, tenantId },
  };

  // Validates response before sending
  return loginResponseSchema.parse(result);
});
```

**Usage in web frontend** (`apps/web/src/api/auth.ts`):

```typescript
import { type LoginRequest, type LoginResponse } from '@hk26/schema';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
}
```

**Usage in mobile frontend** (`apps/mobile/src/api/auth.ts`):

```typescript
import { type LoginRequest, type LoginResponse } from '@hk26/schema';

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>('/auth/login', data);
  return response.data;
}
```

---

### Content Node Contract

**Location**: `packages/schema/src/content/node.ts`

```typescript
import { z } from 'zod';

export const contentNodeSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['root', 'group', 'episode', 'scene']),
  title: z.string(),
  description: z.string().nullable(),
  parentId: z.string().uuid().nullable(),
  tenantId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const contentNodeListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(contentNodeSchema),
});

export type ContentNode = z.infer<typeof contentNodeSchema>;
export type ContentNodeListResponse = z.infer<typeof contentNodeListResponseSchema>;
```

**Used by:**
- `apps/api/src/routes/content.ts` (backend)
- `apps/web/src/api/content.ts` (web frontend)
- `apps/mobile/src/api/content.ts` (mobile frontend)

---

## ✅ Correct: Internal Implementation Types

### DB Mapping Type (stays in service)

**Location**: `apps/api/src/services/user.service.ts`

```typescript
import { users } from '@hk26/postgres';

// Internal type - Drizzle inferred type from schema
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

**Why this stays local:**
- Specific to Drizzle ORM implementation
- Not part of API contract
- Frontend never sees this type
- Internal implementation detail

---

### Service-Specific Types (stays in service file)

**Location**: `apps/api/src/services/upload.service.ts`

```typescript
// Internal: tracks upload progress
interface UploadSession {
  uploadId: string;
  nodeId: string;
  tenantId: string;
  filename: string;
  totalChunks: number;
  uploadedChunks: number;
}

const uploadSessions = new Map<string, UploadSession>();
```

**Why this stays local:**
- Implementation detail of upload flow
- Not exposed via API
- No other module needs this type

---

## ✅ Correct: UI-Only Types

**Location**: `apps/web/src/types/forms.ts`

```typescript
// Form state - frontend-only
export interface LoginFormState {
  email: string;
  password: string;
  rememberMe: boolean;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

// Generic form field props
export interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
}
```

**Location**: `apps/mobile/src/types/navigation.ts`

```typescript
// React Navigation types - mobile-only
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: { userId: string };
  ContentDetail: { nodeId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;
```

**Why this stays in frontend:**
- Backend doesn't care about form state or navigation
- Pure UI state
- Framework-specific types (React Navigation, React Hook Form)

---

## ❌ Incorrect: Duplicated Contracts

### Bad Example 1: Duplicated Response Types

**DON'T DO THIS** (`apps/web/src/lib/api-types.ts`):

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

**Problem:**
- Duplicates schemas from `packages/schema`
- If backend changes schema, frontend breaks silently
- No single source of truth
- No runtime validation

**Fix:**

```typescript
// ✅ Import from shared schema
import type { LoginResponse, User } from '@hk26/schema';
```

---

### Bad Example 2: Types in lib/ That Should Be Shared

**DON'T DO THIS** (`apps/api/src/lib/content-types.ts`):

```typescript
// ❌ This should be in packages/schema
export interface ContentNode {
  id: string;
  type: string;
  title: string;
  // ...
}
```

**Problem:**
- Frontend might need this type too
- Creates coupling between lib and other modules
- Can't be imported by frontend (would violate rule #6)

**Fix:**

Move to `packages/schema/src/content/node.ts` as Zod schema.

---

### Bad Example 3: Frontend Importing from API

**DON'T DO THIS** (`apps/web/src/pages/LoginPage.tsx`):

```typescript
// ❌ Frontend importing from API
import type { LoginRequest } from '../../../api/src/lib/auth-types';
```

**Problem:**
- Violates separation of concerns
- Frontend depends directly on API internals
- Breaks if API restructures
- Can't be validated at runtime

**Fix:**

```typescript
// ✅ Import from shared schema
import type { LoginRequest } from '@hk26/schema';
```

---

## Decision Examples

### Example 1: New API Endpoint

**Scenario**: Adding `GET /api/projects/:id/summary`

**Response shape:**

```typescript
{
  ok: true,
  summary: {
    id: string,
    title: string,
    totalNodes: number,
    createdAt: string,
  }
}
```

**Decision**: Shared contract → `packages/schema/src/content/project.ts`

**Why:**
- Backend returns it
- Frontend (web/mobile) consumes it
- Part of API contract

**Implementation:**

```typescript
// packages/schema/src/content/project.ts
import { z } from 'zod';

export const projectSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  totalNodes: z.number().int(),
  createdAt: z.string().datetime(),
});

export const projectSummaryResponseSchema = z.object({
  ok: z.literal(true),
  summary: projectSummarySchema,
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type ProjectSummaryResponse = z.infer<typeof projectSummaryResponseSchema>;
```

---

### Example 2: Form State

**Scenario**: React form for creating a user

**State shape:**

```typescript
{
  email: string,
  password: string,
  name: string,
  errors: Record<string, string>,
  isSubmitting: boolean,
}
```

**Decision**: UI-only → `apps/web/src/types/forms.ts`

**Why:**
- Backend doesn't care about form state
- React-specific (errors, isSubmitting)
- Not part of API contract

---

### Example 3: Drizzle Query Result

**Scenario**: Complex join query result

```typescript
const result = await db
  .select({
    id: users.id,
    email: users.email,
    tenantName: tenants.name,
  })
  .from(users)
  .leftJoin(tenants, eq(users.tenantId, tenants.id));
```

**Decision**: Internal type in service file

**Why:**
- Query-specific shape
- Not exposed via API
- Drizzle implementation detail

**Implementation:**

```typescript
// apps/api/src/services/user.service.ts
type UserWithTenant = {
  id: string;
  email: string;
  tenantName: string | null;
};
```

---

## Summary Table

| Type | Location | Exported? | Example |
|------|----------|-----------|---------|
| **Shared API Contract** | `packages/schema/src/**` | ✅ Yes | `LoginRequest`, `ContentNode`, `ProjectSummary` |
| **App-Specific Types** | `apps/*/src/types/**` | ✅ Yes | `LoginFormState`, `RootStackParamList` |
| **DB Types** | `apps/api/src/services/*.ts` | ❌ No (internal only) | `UserRow`, Query result types |
| **Service State** | `apps/api/src/services/*.ts` | ❌ No (internal only) | `UploadSession`, Service state |
| **Component Props** | Component file | ❌ No (inline only) | `interface Props { ... }` in component files |

**Key Rule:** Types can ONLY be exported from `packages/schema/src/**` or `apps/*/src/types/**`.
