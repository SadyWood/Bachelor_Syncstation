# Setting Up Packages with Clear API Boundaries

This guide shows how to structure packages in the monorepo with clear public APIs.

## Package Structure

This monorepo uses a simple package structure:

```
packages/
├── database/          # Drizzle schemas and DB clients
├── schema/            # Zod schemas for API contracts
├── eslint-config/     # Shared ESLint configuration
└── tsconfig/          # Shared TypeScript configs
```

## packages/schema Structure

The schema package is the single source of truth for all API contracts:

```
packages/schema/
├── src/
│   ├── index.ts              # Main export - re-exports all schemas
│   ├── auth/
│   │   ├── login.ts          # Login request/response schemas
│   │   ├── register.ts       # Registration schemas
│   │   └── index.ts          # Re-exports auth schemas
│   ├── user/
│   │   ├── user.ts           # User entity schema
│   │   └── index.ts
│   ├── content/
│   │   ├── node.ts           # Content node schemas
│   │   └── index.ts
│   └── common/
│       ├── response.ts       # Common response wrappers
│       └── index.ts
├── package.json
└── tsconfig.json
```

## Creating New Schemas

### 1. Create the schema file

**Example**: `packages/schema/src/content/project.ts`

```typescript
import { z } from 'zod';

// Entity schema
export const projectSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  tenantId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// List response schema
export const projectListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(projectSchema),
});

// Detail response schema
export const projectDetailResponseSchema = z.object({
  ok: z.literal(true),
  project: projectSchema,
});

// Export inferred types
export type Project = z.infer<typeof projectSchema>;
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>;
export type ProjectDetailResponse = z.infer<typeof projectDetailResponseSchema>;
```

### 2. Re-export from domain index

**packages/schema/src/content/index.ts**

```typescript
export * from './node';
export * from './project';
```

### 3. Re-export from main index

**packages/schema/src/index.ts**

```typescript
export * from './auth';
export * from './user';
export * from './content';
export * from './common';
```

### 4. Use in API

**apps/api/src/routes/projects.ts**

```typescript
import {
  projectSchema,
  projectListResponseSchema,
  type Project
} from '@hk26/schema';

app.get('/api/projects', async (req, reply) => {
  const projects = await db.query.projects.findMany();

  // Validate response
  return projectListResponseSchema.parse({
    ok: true,
    items: projects,
  });
});
```

### 5. Use in Frontend

**apps/web/src/api/projects.ts**

```typescript
import { type Project, type ProjectListResponse } from '@hk26/schema';

export async function fetchProjects(): Promise<ProjectListResponse> {
  const response = await fetch('/api/projects');
  return response.json();
}
```

**apps/mobile/src/api/projects.ts**

```typescript
import { type Project, type ProjectListResponse } from '@hk26/schema';

export async function fetchProjects(): Promise<ProjectListResponse> {
  const response = await axios.get<ProjectListResponse>('/api/projects');
  return response.data;
}
```

## Common Schema Patterns

### Request/Response Pair

```typescript
// Request schema
export const createProjectRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

// Response schema
export const createProjectResponseSchema = z.object({
  ok: z.literal(true),
  project: projectSchema,
});

// Types
export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>;
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>;
```

### Error Response

**packages/schema/src/common/response.ts**

```typescript
export const errorResponseSchema = z.object({
  ok: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
```

### Paginated Response

```typescript
export const paginatedResponseSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    ok: z.literal(true),
    items: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int(),
      perPage: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  });

// Usage
export const paginatedProjectsResponseSchema = paginatedResponseSchema(projectSchema);
export type PaginatedProjectsResponse = z.infer<typeof paginatedProjectsResponseSchema>;
```

## Benefits

✅ **Single source of truth** - All API contracts in one place
✅ **Runtime validation** - Catch errors at API boundaries
✅ **Type safety** - TypeScript types inferred from schemas
✅ **Shared across apps** - Web, mobile, and API use same types
✅ **Refactor safety** - Changing schema updates all consumers
✅ **Documentation** - Schemas serve as API documentation

## What NOT to Put in packages/schema

❌ **DB row types** - These stay in service files
❌ **UI state** - These go in `apps/*/src/types/`
❌ **Component props** - These stay in component files
❌ **Internal implementation** - These stay in service/route files
❌ **Framework-specific types** - These go in `apps/*/src/types/`

## Quick Reference

| Need to add... | Location | Export? |
|---------------|----------|---------|
| New API endpoint type | `packages/schema/src/` | ✅ Yes |
| Form state | `apps/*/src/types/forms.ts` | ✅ Yes (within app) |
| DB query result | Service file | ❌ No |
| Component props | Component file | ❌ No |
| Navigation types | `apps/*/src/types/navigation.ts` | ✅ Yes (within app) |
