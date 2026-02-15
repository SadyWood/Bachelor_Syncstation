# Architecture Overview

How Syncstation fits into the Hoolsy platform and how the key systems work together.

For data flow details (Drizzle → Zod → API → Frontend), see [type-safety-from-database-to-frontend.md](./type-safety-from-database-to-frontend.md).

---

## System Overview

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│              │          │              │          │              │
│  USERS DB    │◄─────────┤   API        │─────────►│ SYNCSTATION  │
│              │  Auth    │   SERVER     │  Logs    │  MOBILE APP  │
│ - users      │          │              │          │              │
│ - platforms  │          │  (Fastify)   │          │ (React       │
│ - invites    │          │              │          │  Native)     │
└──────────────┘          └──────────────┘          └──────────────┘
                                │
                                │ Content
                                ▼
                          ┌──────────────┐
                          │              │
                          │ WORKSTATION  │
                          │   DB         │
                          │              │
                          │ - content    │
                          │   nodes      │
                          │ - projects   │
                          └──────────────┘
```

The API server connects to three separate PostgreSQL databases. Each team owns their own database for writes and shares read access where needed.

| Database | Who owns it | What Syncstation does with it |
|---|---|---|
| `users` | Shared | Authenticates via JWT (read-only) |
| `workstation` | Workstation team | Reads content nodes to link logs to the right context |
| `syncstation` | Syncstation team | Writes log entries, attachments, sync status |

---

## The Syncstation Database

This is your database. The schema lives in `packages/databases/postgres/src/schema/syncstation/schema.ts`.

### log_entries

The main table. Every on-set log is a row here.

```typescript
{
  id: string (UUID)                    // Auto-generated UUIDv7
  tenantId: string (UUID)              // Which tenant (organization)
  userId: string (UUID)                // Who logged this
  contentNodeId: string (UUID)         // Which content node (DB column: content_node_id)
  title: string                        // Log entry title (required, max 255)
  description: string | null           // Optional description text
  metadata: Record<string, unknown>    // Flexible JSON data (jsonb column)
  syncStatus: 'local' | 'pending' | 'synced' | 'failed'  // DB column: sync_status
  syncAttempts: number                 // Retry counter for offline sync
  lastSyncError: string | null         // Last sync error message (DB column: last_sync_error)
  createdAt: string
  updatedAt: string
  syncedAt: string | null
}
```

### log_attachments

Files attached to log entries (images, videos, documents).

```typescript
{
  id: string (UUID)
  logEntryId: string (UUID)            // Which log entry this belongs to
  filename: string
  mimeType: string
  fileSize: number
  storagePath: string                  // Where the file lives on disk/storage
  attachmentType: 'image' | 'video' | 'document'
  createdAt: string
}
```

The API uses shorter field names in some cases (`nodeId` in API → `contentNodeId` in database). This mapping happens in the repository layer at `apps/api/src/repos/sync.log.repo.ts`.

---

## Content Nodes

Content nodes are the hierarchy that Workstation uses to organize content. Think of it like a folder structure:

```
Project Root (Breaking Bad)
├── Season 1 (Group)
│   ├── Episode 1 (Content Node)
│   └── Episode 2 (Content Node)
└── Season 2 (Group)
    ├── Episode 1 (Content Node)
    └── Episode 2 (Content Node)
```

When you log something on set, it must be linked to a content node. For example: "Costume issue on Breaking Bad S1E1" → the log entry's `contentNodeId` points to the Episode 1 node.

How to query content nodes from the API:

```typescript
import { dbWs, schema } from '../db.js';
import { eq } from 'drizzle-orm';

// Get all projects for a tenant (top-level root nodes)
const projects = await dbWs.query.contentNodes.findMany({
  where: and(
    eq(schema.contentNodes.tenantId, tenantId),
    eq(schema.contentNodes.nodeType, 'root')
  )
});

// Get children of a node (e.g., episodes in a season)
const children = await dbWs.query.contentNodes.findMany({
  where: and(
    eq(schema.contentNodes.tenantId, tenantId),
    eq(schema.contentNodes.parentId, parentNodeId)
  )
});
```

Schema: `packages/databases/postgres/src/schema/workstation/content.ts`

---

## Tenants (Multi-Tenancy)

A **tenant** is an organization or workspace. The demo seed creates "Streamwave Inc" as the default tenant.

Every API call that touches tenant-scoped data must include the `x-ws-tenant` header. The API extracts it and filters all database queries by `tenantId`, so users can only see data that belongs to their organization.

```typescript
// How it works in route handlers:
const tenantId = requireTenant(req);  // Extracts from x-ws-tenant header, returns 400 if missing

// All queries are scoped
const logs = await dbSync.query.logEntries.findMany({
  where: eq(schema.logEntries.tenantId, tenantId)
});
```

Relevant code: `apps/api/src/utils/tenant.ts`

---

## Authentication Flow

```
1. User logs in           →  POST /auth/login
2. API validates password  →  Checks against users database
3. API returns tokens      →  JWT access token + refresh cookie (httpOnly)
4. App stores access token →  In memory (not localStorage)
5. Every API call includes →  Authorization: Bearer <token>
6. Access token expires    →  After 15 minutes
7. App refreshes silently  →  POST /auth/refresh (uses cookie)
```

The `sub` claim in the JWT contains the user's UUID. Route handlers extract it with:

```typescript
const decoded = await req.jwtVerify<{ sub: string }>();
const userId = decoded.sub;
```

Auth routes: `apps/api/src/routes/auth.ts`

---

## Backend Architecture

The API follows a layered architecture without a separate controller layer:

```
Route handler (routes/)
  → validates input (Zod)
  → extracts tenant + user
  → calls service or repository
  → sends response

Service (services/)
  → business logic, orchestration
  → calls one or more repositories

Repository (repos/)
  → database queries (Drizzle ORM)
  → maps DB rows to DTOs
```

Example flow for creating a log entry:

```typescript
// Route: apps/api/src/routes/sync.log.ts
app.post('/syncstation/log-entries', { schema: { body: ... } }, async (req, reply) => {
  const tenantId = requireTenant(req);
  const decoded = await req.jwtVerify<{ sub: string }>();
  const body = CreateLogEntryRequest.shape.body.parse(req.body);

  const entry = await syncLogRepo.createLogEntry({
    tenantId,
    userId: decoded.sub,
    ...body,
  });

  return reply.code(201).send(LogEntryResponse.parse({ ok: true, entry }));
});
```

---

## Where to Start Coding

### Backend devs

1. **Database schemas:** `packages/databases/postgres/src/schema/syncstation/`
2. **Zod API contracts:** `packages/schema/src/syncstation/`
3. **Route handlers:** `apps/api/src/routes/sync.log.ts`
4. **Repository layer:** `apps/api/src/repos/sync.log.repo.ts`

### Frontend devs

1. **Shared types:** `import type { LogEntry } from '@hk26/schema'`
2. **Existing API client patterns:** `apps/syncstation-app/src/api/`
3. **Navigation structure:** `apps/syncstation-app/src/navigation/`
4. **Stores:** `apps/syncstation-app/src/stores/`

### Key patterns to study

**Repository pattern** — All database access goes through repos. Never query the DB directly from a route handler.

**Zod validation** — Request bodies are validated with `CreateLogEntryRequest.shape.body.parse(req.body)`. If the data doesn't match, Zod throws automatically.

**Tenant isolation** — Every endpoint that touches data calls `requireTenant(req)` first. All queries filter by `tenantId`.

---

## External References

These are from the original Hoolsy codebase. You don't need to implement any of this — it's already done. But they help explain why things are structured the way they are:

- **User database implementation:** https://github.com/Hoolsy-com/hoolsy-platforms/pull/1
- **Content nodes implementation:** https://github.com/Hoolsy-com/hoolsy-platforms/pull/3
