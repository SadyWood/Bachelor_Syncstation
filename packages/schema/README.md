# @workstation/schema

Shared TypeScript schemas and types for Hoolsy Platforms - a centralized package using Zod for runtime type validation and TypeScript type generation.

## Overview

This package serves as the **single source of truth** for data types shared between:

- **API** (`apps/api`) - Server-side validation and type safety
- **Frontend** (`apps/workstation-web`, `apps/marketplace-web`) - Client-side validation and type safety
- **Database** (`packages/databases`) - Schema alignment

All API request/response types, database models, and UI data structures are defined here.

## Why Centralize Schemas?

**Before:**
```
apps/workstation-web/src/lib/api-types.ts  (duplicated types)
apps/api/src/types/request-types.ts        (duplicated types)
packages/databases/src/schema/types.ts     (duplicated types)
```

**Problem:** Manual synchronization, drift between API and frontend, no runtime validation.

**After:**
```
packages/schema/  (single source of truth)
  ↓
  ├─→ API: validates requests/responses
  ├─→ Frontend: validates API responses
  └─→ Database: ensures alignment with DB schema
```

**Benefits:**
- ✅ Changes to types immediately surface errors in API and frontend
- ✅ Runtime validation with Zod catches invalid data
- ✅ Auto-generated TypeScript types from Zod schemas
- ✅ Reusable across multiple apps (workstation, marketplace, mobile, CLI)

## Project Structure

```
packages/schema/
├── src/
│   ├── auth.ts              # Authentication (login, register, tokens)
│   ├── primitives.ts        # Common primitives (UUID, email, timestamps)
│   ├── users/               # Users domain
│   │   ├── common.ts        # User models
│   │   ├── access.ts        # Access control
│   │   └── index.ts
│   ├── workstation/         # Workstation domain
│   │   ├── content.ts       # Projects, nodes, content tree
│   │   ├── media.ts         # Media assets, uploads, metadata
│   │   ├── membership.ts    # Tenant members
│   │   ├── rbac.ts          # Roles, permissions
│   │   ├── subject.schema.ts # Subject system (future)
│   │   └── index.ts
│   ├── marketplace/         # Marketplace domain (future)
│   │   └── index.ts
│   └── index.ts             # Re-exports all schemas
├── package.json
└── tsconfig.json
```

## Usage

### Installation

```bash
pnpm add @workstation/schema
```

Already included in:
- `apps/api` - API validation
- `apps/workstation-web` - Frontend types
- `packages/databases` - Database schema alignment

### Importing Schemas

```ts
import {
  LoginRequest, LoginResponse,
  ProjectSchema, NodeSchema,
  MediaAssetSchema,
  RoleSchema, PermissionSchema
} from '@workstation/schema';
```

### API Validation (Backend)

```ts
import { LoginRequest, LoginResponse } from '@workstation/schema';

app.post<{ Body: LoginBody; Reply: LoginReply }>(
  '/login',
  {
    schema: {
      body: LoginRequest,           // Validates request body
      response: { 200: LoginResponse } // Validates response
    }
  },
  async (req, reply) => {
    const { email, password } = req.body; // TypeScript knows these exist!
    // ... login logic
    return reply.send({ ok: true, accessToken, currentTenant });
  }
);
```

### Frontend Validation (Client)

```ts
import { ProjectListResponseSchema } from '@workstation/schema';

async function fetchProjects(tenantId: string) {
  const res = await fetch(`/api/tenants/${tenantId}/projects`);
  const data = await res.json();

  // Runtime validation + type narrowing
  const validated = ProjectListResponseSchema.parse(data);
  return validated.items; // TypeScript knows this is Project[]
}
```

### Type Extraction

```ts
import { z } from 'zod';
import { ProjectSchema } from '@workstation/schema';

// Extract TypeScript type from Zod schema
type Project = z.infer<typeof ProjectSchema>;

// Now use it anywhere
function renderProject(project: Project) {
  console.log(project.title, project.synopsis);
}
```

## Schema Examples

### Authentication

```ts
// auth.ts
export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const LoginResponse = z.object({
  ok: z.literal(true),
  accessToken: z.string(),
  currentTenant: z.string().uuid().nullable(),
  currentTenantInfo: TenantInfoSchema.nullable(),
});

export type LoginBody = z.infer<typeof LoginRequest>;
export type LoginReply = z.infer<typeof LoginResponse>;
```

### Content Management

```ts
// workstation/content.ts
export const NodeSchema = z.object({
  nodeId: z.string().uuid(),
  tenantId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  nodeType: z.enum(['project', 'group', 'content']),
  title: z.string(),
  synopsis: z.string().nullable(),
  slug: z.string().nullable(),
  mediaKindCode: MediaKindCodeSchema.nullable(),
  position: z.number().int(),
  createdAt: TimestampSchema.nullable(),
  updatedAt: TimestampSchema.nullable(),
});

export type Node = z.infer<typeof NodeSchema>;
```

### Media Management

```ts
// workstation/media.ts
export const MediaAssetSchema = z.object({
  mediaAssetId: z.string().uuid(),
  tenantId: z.string().uuid(),
  nodeId: z.string().uuid(),
  filename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),

  // Metadata (extracted by ffprobe)
  durationMs: z.number().int().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  frameRate: z.number().nullable(),
  videoCodec: z.string().nullable(),
  audioCodec: z.string().nullable(),
  audioChannels: z.number().int().nullable(),
  audioSampleRate: z.number().int().nullable(),

  // Flags
  hasVideo: z.boolean().nullable(),
  hasAudio: z.boolean().nullable(),

  createdAt: TimestampSchema.nullable(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
```

### RBAC

```ts
// workstation/rbac.ts
export const RoleSchema = z.object({
  roleId: z.string().uuid(),
  tenantId: z.string().uuid().nullable(),
  name: z.string(),
  scope: z.enum(['global', 'tenant']),
  allow: z.array(z.string()),  // Permission wildcards
  deny: z.array(z.string()),   // Override allow rules
  createdAt: TimestampSchema.nullable(),
  updatedAt: TimestampSchema.nullable(),
});

export type Role = z.infer<typeof RoleSchema>;
```

## Primitives

Reusable building blocks:

```ts
// primitives.ts
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const TimestampSchema = z.string().datetime(); // ISO 8601
export const SlugSchema = z.string().regex(/^[a-z0-9-]+$/);

export const MediaKindCodeSchema = z.enum([
  'video', 'audio', 'image',
  'episode', 'lesson', 'clip',
  'podcast', 'audiobook', 'music',
]);
```

## Domain Structure

### Users Domain (`users/`)

- **common.ts** - User accounts, credentials
- **access.ts** - Access tokens, permissions, platform codes

### Workstation Domain (`workstation/`)

- **content.ts** - Projects, nodes, content tree
- **media.ts** - Media assets, uploads, streaming
- **membership.ts** - Tenant members, invitations
- **rbac.ts** - Roles, permissions, access control
- **subject.schema.ts** - Subject system (future feature)

### Marketplace Domain (`marketplace/`)

- Placeholder for future marketplace functionality

## Commands

```bash
# Build
pnpm build            # Compile TypeScript

# Type Checking
pnpm typecheck        # Run TypeScript compiler

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix ESLint errors
```

## Best Practices

### 1. Always Export Both Schema and Type

```ts
export const MySchema = z.object({ ... });
export type MyType = z.infer<typeof MySchema>;
```

### 2. Use Composition

```ts
// Base schema
const BaseNodeSchema = z.object({
  nodeId: UuidSchema,
  tenantId: UuidSchema,
  title: z.string(),
});

// Extended schema
const ProjectSchema = BaseNodeSchema.extend({
  nodeType: z.literal('project'),
  synopsis: z.string(),
});
```

### 3. Nullable vs Optional

```ts
// Nullable - field exists but value can be null
synopsis: z.string().nullable()  // synopsis: string | null

// Optional - field may not exist at all
synopsis: z.string().optional()  // synopsis?: string | undefined

// Both - field may not exist OR be null
synopsis: z.string().nullable().optional()  // synopsis?: string | null | undefined
```

### 4. Request vs Response Schemas

```ts
// Request - what API accepts
export const CreateProjectRequest = z.object({
  title: z.string(),
  synopsis: z.string(),
  template: z.enum(['empty', 'series']).default('empty'),
});

// Response - what API returns
export const CreateProjectResponse = z.object({
  ok: z.literal(true),
  project: ProjectSchema,  // Full project object with IDs, timestamps
});
```

## Migration Guide

If you have duplicated types in your app, migrate them here:

1. **Identify shared types** - Does the backend care about this type? If yes, it's shared.
2. **Create schema** - Add to appropriate domain directory (`users/`, `workstation/`, etc.)
3. **Export from index** - Add re-export to domain `index.ts` and root `index.ts`
4. **Update imports** - Change imports to `@workstation/schema`
5. **Remove old types** - Delete duplicated definitions

## Related Documentation

- [API Backend](../../apps/api/README.md)
- [Workstation Web](../../apps/workstation-web/README.md)
- [Database Schema](../databases/postgres/README.md)
