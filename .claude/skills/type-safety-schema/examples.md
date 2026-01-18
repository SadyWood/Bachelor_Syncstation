# Examples

## ✅ Correct: Shared Contracts in packages/schema

### Media Metadata Contract

**Location**: `packages/schema/src/workstation/media.ts`

```typescript
import { z } from 'zod';

// Define Zod schema (single source of truth)
export const MediaMetadataSchema = z.object({
  hasVideo: z.boolean().optional(),
  hasAudio: z.boolean().optional(),
  durationMs: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  frameRate: z.number().optional(),
  videoCodec: z.string().optional(),
  audioCodec: z.string().optional(),
  // ... etc
});

// Export inferred TypeScript type
export type MediaMetadata = z.infer<typeof MediaMetadataSchema>;
```

**Usage in backend** (`apps/api/src/lib/media-metadata.ts`):

```typescript
import type { MediaMetadata } from '@hoolsy/schema/workstation/media';

export async function extractMediaMetadata(filePath: string): Promise<MediaMetadata> {
  // ... implementation
}
```

**Usage in frontend** (`apps/workstation-web/src/widgets/ContentDashboard/MediaPreview.tsx`):

```typescript
import type { MediaMetadata } from '@hoolsy/schema/workstation/media';

function MediaPreview({ metadata }: { metadata: MediaMetadata }) {
  // ... component
}
```

---

### RBAC Contract

**Location**: `packages/schema/src/workstation/rbac.ts`

```typescript
export const RoleSchema = z.object({
  roleId: z.string().uuid(),
  name: z.string(),
  permissions: z.array(z.string()),
});

export type Role = z.infer<typeof RoleSchema>;

export const RolesListResponseSchema = z.object({
  ok: z.literal(true),
  items: z.array(RoleSchema),
});

export type RolesListResponse = z.infer<typeof RolesListResponseSchema>;
```

**Used by both**:
- `apps/api/src/routes/ws.roles.ts` (backend)
- `apps/workstation-web/src/widgets/Admin/Roles.tsx` (frontend)

---

## ✅ Correct: Internal Implementation Types

### DB Mapping Type (stays in repo)

**Location**: `apps/api/src/repos/media.repo.ts`

```typescript
// Internal type - maps Drizzle DB rows to API contracts
type MediaAssetRow = {
  media_asset_id: string;       // DB: snake_case
  tenant_id: string;
  node_id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  // ... etc
};

function mapAssetRowToDto(row: MediaAssetRow): MediaAsset {
  return MediaAssetSchema.parse({
    mediaAssetId: row.media_asset_id,  // Convert to camelCase
    tenantId: row.tenant_id,
    nodeId: row.node_id,
    // ... etc
  });
}
```

**Why this stays local:**
- Specific to Drizzle ORM implementation
- Not part of API contract
- Frontend never sees this type

---

### Route-Specific Types (stays in route file)

**Location**: `apps/api/src/routes/ws.media.ts`

```typescript
// Session state for chunked uploads - internal to this route
interface UploadSession {
  uploadId: string;
  nodeId: string;
  tenantId: string;
  filename: string;
  storagePath: string;
  uploadedChunks: number;
  totalChunks: number;
}

const uploadSessions = new Map<string, UploadSession>();
```

**Why this stays local:**
- Implementation detail of upload flow
- Not exposed via API
- No other module needs this type

---

## ✅ Correct: UI-Only Types

**Location**: `apps/workstation-web/src/types/widget.types.ts`

```typescript
// Widget layout configuration - frontend-only
export interface WidgetLayout {
  i: string;  // Widget ID
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// Navigation state - UI-only
export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ComponentType;
}
```

**Why this stays in frontend:**
- Backend doesn't care about widget layouts
- Pure UI state
- React-specific types

---

## ❌ Incorrect: Duplicated Contracts

### Bad Example 1: Duplicated Response Types

**DON'T DO THIS** (`apps/workstation-web/src/lib/api-types.ts`):

```typescript
// ❌ This duplicates backend types
export interface MediaAsset {
  mediaAssetId: string;
  filename: string;
  mimeType: string;
  // ...
}

export interface MediaListResponse {
  ok: true;
  asset: MediaAsset | null;
  variants: MediaVariant[];
}
```

**Problem:**
- Duplicates `MediaAssetSchema` from `packages/schema`
- If backend changes schema, frontend breaks silently
- No single source of truth

**Fix:**

```typescript
// ✅ Import from shared schema
import type {
  MediaAsset,
  MediaListResponse
} from '@hoolsy/schema/workstation/media';
```

---

### Bad Example 2: Types in lib/ That Should Be Shared

**DON'T DO THIS** (`apps/api/src/lib/media-metadata.ts`):

```typescript
// ❌ This should be in packages/schema
export interface MediaMetadata {
  hasVideo: boolean;
  hasAudio: boolean;
  durationMs?: number;
  // ...
}
```

**Problem:**
- Frontend might need this type too
- Creates coupling between lib and other modules
- Can't be imported by frontend

**Fix:**

Move to `packages/schema/src/workstation/media.ts` as Zod schema.

---

## Decision Examples

### Example 1: New API Endpoint

**Scenario**: Adding `GET /ws/projects/:id/analytics`

**Response shape:**

```typescript
{
  ok: true,
  analytics: {
    totalMedia: number,
    totalDuration: number,
    mediaByKind: Record<string, number>,
  }
}
```

**Decision**: Shared contract → `packages/schema/src/workstation/content.ts`

**Why:**
- Backend returns it
- Frontend consumes it
- Part of API contract

**Implementation:**

```typescript
// packages/schema/src/workstation/content.ts
export const ProjectAnalyticsSchema = z.object({
  totalMedia: z.number(),
  totalDuration: z.number(),
  mediaByKind: z.record(z.number()),
});

export const ProjectAnalyticsResponseSchema = z.object({
  ok: z.literal(true),
  analytics: ProjectAnalyticsSchema,
});

export type ProjectAnalytics = z.infer<typeof ProjectAnalyticsSchema>;
export type ProjectAnalyticsResponse = z.infer<typeof ProjectAnalyticsResponseSchema>;
```

---

### Example 2: Form State

**Scenario**: React form for creating a role

**State shape:**

```typescript
{
  name: string,
  description: string,
  selectedPermissions: string[],
  errors: Record<string, string>,
}
```

**Decision**: UI-only → `apps/workstation-web/src/widgets/Admin/Roles.tsx` (or `src/types/forms.ts`)

**Why:**
- Backend doesn't care about form state
- React-specific (errors, controlled inputs)
- Not part of API contract

---

### Example 3: Drizzle Query Result

**Scenario**: Complex join query result

```typescript
const result = await dbWs
  .select({
    project_id: schema.projects.projectId,
    project_title: schema.projects.title,
    media_count: count(schema.mediaAssets.mediaAssetId),
  })
  .from(schema.projects)
  .leftJoin(schema.contentNodes, ...)
  .groupBy(...);
```

**Decision**: Internal type in repo file

**Why:**
- Query-specific shape
- Not exposed via API
- Drizzle implementation detail

**Implementation:**

```typescript
// apps/api/src/repos/content.repo.ts
type ProjectWithMediaCount = {
  project_id: string;
  project_title: string;
  media_count: number;
};
```

---

## Summary Table

| Type | Location | Exported? | Example |
|------|----------|-----------|---------|
| **Shared API Contract** | `packages/schema/src/**` | ✅ Yes | `MediaMetadata`, `RoleSchema`, `ProjectAnalyticsResponse` |
| **App-Specific Types** | `apps/*/src/types/**` | ✅ Yes | `WidgetLayout`, `BreadcrumbItem`, Form state |
| **DB Mapping** | `apps/*/src/repos/*.ts` | ❌ No (internal only) | `MediaAssetRow`, Query result types |
| **Route-Specific** | `apps/*/src/routes/*.ts` | ❌ No (internal only) | `UploadSession`, Route handler state |
| **Component Props** | Component file | ❌ No (inline only) | `interface Props { ... }` in `.tsx` files |

**ESLint Rule:** Types can ONLY be exported from `packages/schema/src/**` or `**/types/**`.
