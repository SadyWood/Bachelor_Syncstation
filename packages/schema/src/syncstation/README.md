# Syncstation Schemas

API contracts (Zod schemas and TypeScript types) for the Syncstation on-set logging app.

## Overview

This directory contains **shared API contracts** that are used by both:
- The mobile app (`apps/syncstation-app`)
- The backend API (`apps/api`)

**IMPORTANT**: Read [.claude/skills/type-safety-schema/SKILL.md](../../../../.claude/skills/type-safety-schema/SKILL.md) to understand the type safety rules for this monorepo.

## Files

### `log-entry.ts`

Core schemas for log entries and attachments:

**Enums:**
- `SyncStatus` - Sync state: `local`, `pending`, `synced`, `failed`
- `AttachmentType` - Media type: `image`, `video`, `document`

**DTOs (Data Transfer Objects):**
- `LogEntrySchema` - Full log entry with all fields
- `LogEntrySummarySchema` - Lightweight version for lists
- `LogAttachmentSchema` - File attachment metadata

**API Requests:**
- `CreateLogEntryRequest` - Create new log entry
- `UpdateLogEntryRequest` - Update existing log entry
- `UploadAttachmentRequest` - Upload media/file

**API Responses:**
- `LogEntryResponse` - Single log entry
- `LogEntriesListResponse` - List of log entries
- `AttachmentUploadResponse` - Upload confirmation
- `SyncStatusResponse` - Sync queue status
- `ErrorResponse` - Generic error

## Usage

### In the Mobile App

```typescript
// ✅ Correct: Import types from @hk26/schema
import type {
  LogEntry,
  CreateLogEntryRequestBody,
  SyncStatusT,
} from '@hk26/schema';

// Use in API calls
const data: CreateLogEntryRequestBody = {
  nodeId: selectedNodeId,
  title: 'Costume note',
  description: 'Main actor needs backup jacket',
};

const entry: LogEntry = await createLogEntry(data);
```

### In the API

```typescript
// ✅ Correct: Import and validate with Zod schemas
import {
  CreateLogEntryRequest,
  LogEntryResponse,
  type LogEntry,
} from '@hk26/schema';

app.post('/syncstation/log-entries', async (req, reply) => {
  // Validate request body
  const { body } = CreateLogEntryRequest.parse({ body: req.body });

  // ... business logic

  // Validate and return response
  return LogEntryResponse.parse({
    ok: true,
    entry: logEntryData,
  });
});
```

## Extending the Schema

When you need to add new fields or endpoints:

1. **Add the field to the Zod schema** (this file)
   ```typescript
   export const LogEntrySchema = z.object({
     // ... existing fields
     myNewField: z.string().optional(),
   });
   ```

2. **Update the database schema** in `packages/databases/postgres/src/schema/syncstation/schema.ts`
   ```typescript
   export const logEntries = pgTable('log_entries', {
     // ... existing columns
     myNewField: varchar('my_new_field', { length: 255 }),
   });
   ```

3. **Generate and run migration**
   ```bash
   pnpm db:generate:syncstation
   pnpm db:migrate:syncstation
   ```

4. **Types are automatically available** in both app and API
   ```typescript
   import type { LogEntry } from '@hk26/schema';
   // LogEntry now includes myNewField
   ```

## Type Safety Rules

### ✅ DO

- Import all API types from `@hk26/schema`
- Use Zod schemas for runtime validation
- Export both schema and inferred type
- Keep API contracts DRY (define once, use everywhere)

### ❌ DON'T

- Duplicate types in app code
- Use `any` or `unknown` to bypass typing
- Define request/response types locally
- Import from `apps/api` in frontend code

## Examples

See [apps/syncstation-app/src/api/log-entries.example.ts](../../../../apps/syncstation-app/src/api/log-entries.example.ts) for full working examples.

## Related Files

- **Database schema**: `packages/databases/postgres/src/schema/syncstation/schema.ts`
- **API implementation**: `apps/api/src/routes/syncstation/*.ts` (to be created)
- **Mobile app usage**: `apps/syncstation-app/src/api/*.ts`
- **Type safety guide**: `.claude/skills/type-safety-schema/SKILL.md`
