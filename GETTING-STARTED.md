# Getting Started Guide for Syncstation Students

Welcome to the HK26 Syncstation project! This document helps you understand the architecture and get started with development.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Key Concepts](#key-concepts)
4. [Where to Start Coding](#where-to-start-coding)
5. [Learning Resources](#learning-resources)
6. [Common Patterns](#common-patterns)

---

## Quick Start

**Read this first!**

1. **Setup:** Follow [SETUP.md](./SETUP.md) to set up databases and run API + app
2. **Architecture:** Read [README.md](./README.md) to understand the project structure and multi-database architecture
3. **Type Safety:** Read [documents/guides/type-safety-from-database-to-frontend.md](./documents/guides/type-safety-from-database-to-frontend.md) to understand data flow

**Then you can:**
- Start the mobile app: `pnpm dev:sync`
- Test API endpoints: Use the Postman collection in `postman/`
- Explore the codebase: Start by reading the files mentioned below

---

## Understanding the Architecture

### The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNCSTATION ECOSYSTEM                     │
└─────────────────────────────────────────────────────────────┘

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
                          │   DATABASE   │
                          │              │
                          │ - content    │
                          │   nodes      │
                          │ - projects   │
                          │ - media      │
                          └──────────────┘
```

**Key points:**
- **Users database** - Authentication is shared between all apps
- **Workstation database** - Contains content_nodes that you link to
- **Syncstation database** - This is YOUR database for log entries
- **API server** - Handles everything (auth, content, logs)

### Your Database: Syncstation

> **Important: This is YOUR database to customize!**
>
> The Syncstation database schema, API endpoints, and Zod schemas are **starter examples** generated to get you started. They demonstrate the patterns and architecture, but you should:
> - **Modify** - Change field names, types, or constraints to fit your needs
> - **Remove** - Delete tables or fields you don't need
> - **Extend** - Add new tables, columns, or relationships as your project requires
>
> The same goes for the API endpoints in `apps/api/src/routes/sync.log.ts` and schemas in `packages/schema/src/syncstation/` - they're examples, not rules. Feel free to adapt everything to match your team's requirements.

You have your own database with two tables (but you can change this!):

**log_entries** - Main table for log entries
```typescript
{
  id: string (UUID)
  tenantId: string (UUID)         // Which tenant (organization)
  userId: string (UUID)           // Who logged this
  contentNodeId: string (UUID)    // Which content node (project/episode)
  title: string | null
  notes: string | null            // Description/notes (mapped to 'description' in API)
  metadata: Record<string, unknown> | null  // JSON metadata
  syncStatus: 'local' | 'pending' | 'synced' | 'failed'
  syncError: string | null        // Last sync error message
  createdAt: string
  updatedAt: string
  syncedAt: string | null
}
```

> **Note:** The API uses different field names for compatibility (e.g., `description` in API → `notes` in database, `nodeId` in API → `contentNodeId` in database). This mapping happens in the repository layer.

**log_attachments** - Attachments (images, videos, files)
```typescript
{
  id: string (UUID)
  logEntryId: string (UUID)  // Which log entry
  filename: string
  mimeType: string
  fileSize: number
  storagePath: string
  attachmentType: 'image' | 'video' | 'document'
  createdAt: string
}
```

**Where to find this:**
- Schema: [packages/databases/postgres/src/schema/syncstation/schema.ts](packages/databases/postgres/src/schema/syncstation/schema.ts)
- API contracts: [packages/schema/src/syncstation/log-entry.ts](packages/schema/src/syncstation/log-entry.ts)

---

## Key Concepts

### 1. Content Nodes - What are they?

**Content nodes** are the hierarchy that Workstation uses to organize content. Think of it like a file structure:

```
Project Root (Breaking Bad)
├── Season 1 (Group)
│   ├── Episode 1 (Content Node)
│   └── Episode 2 (Content Node)
└── Season 2 (Group)
    ├── Episode 1 (Content Node)
    └── Episode 2 (Content Node)
```

**When you log something on set**, it must be linked to a content node. For example:
- "Costume issue on Breaking Bad S1E1" → nodeId = Episode 1

**Relevant code:**
- [packages/databases/postgres/src/schema/workstation/content.ts](packages/databases/postgres/src/schema/workstation/content.ts)

**How to query content nodes:**
```typescript
import { dbWs, schema } from '../db.js';

// Get all content nodes for a tenant
const nodes = await dbWs.query.contentNodes.findMany({
  where: eq(schema.contentNodes.tenantId, tenantId)
});

// Get specific node
const node = await dbWs.query.contentNodes.findFirst({
  where: eq(schema.contentNodes.id, nodeId)
});
```

### 2. Tenants (Multi-Tenancy)

**Tenant** = An organization/workspace. For example "Streamwave Inc" is a tenant.

**Why this is important:**
- Users belong to one or more tenants
- Data is isolated per tenant
- API calls must always include the `x-ws-tenant` header

**Relevant code:**
- [packages/databases/postgres/src/schema/workstation/tenants.ts](packages/databases/postgres/src/schema/workstation/tenants.ts)
- [apps/api/src/utils/tenant.ts](apps/api/src/utils/tenant.ts)

**How tenants work in API:**
```typescript
// From request header
const tenantId = req.headers['x-ws-tenant'];

// All queries are scoped to tenant
const logs = await dbSync.query.logEntries.findMany({
  where: eq(schema.logEntries.tenantId, tenantId)
});
```

### 3. Authentication Flow

```
1. User logs in → POST /auth/login
   ↓
2. API validates credentials (users database)
   ↓
3. API returns JWT access token + refresh token
   ↓
4. App stores tokens
   ↓
5. All API calls include: Authorization: Bearer <token>
   ↓
6. API validates token on each request
```

**Relevant code:**
- Auth routes: [apps/api/src/routes/auth.ts](apps/api/src/routes/auth.ts)
- JWT verification: [apps/api/src/server.ts](apps/api/src/server.ts) (see `app.decorate('authenticate')`)

**How authentication works in your API calls:**
```typescript
// In API route
const decoded = await req.jwtVerify<{ sub: string }>();
const userId = decoded.sub;

// Now you know WHO is making the request
const logs = await dbSync.query.logEntries.findMany({
  where: and(
    eq(schema.logEntries.userId, userId),
    eq(schema.logEntries.tenantId, tenantId)
  )
});
```

### 4. Type Safety (IMPORTANT!)

**The Golden Rule:** All API contracts live in `@hk26/schema`. NEVER duplicate types!

```typescript
// ✅ CORRECT - Define in packages/schema
// packages/schema/src/syncstation/log-entry.ts
export const LogEntrySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  // ...
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

// ✅ CORRECT - Use in API
// apps/api/src/routes/sync.log.ts
import { LogEntrySchema } from '@hk26/schema';

// ✅ CORRECT - Use in mobile app
// apps/syncstation-app/src/types.ts
import { type LogEntry } from '@hk26/schema';

// ❌ WRONG - Don't define types in API or app!
export interface LogEntry { ... } // ESLint will yell at you!
```

**Read more:**
- [documents/guides/type-safety-from-database-to-frontend.md](documents/guides/type-safety-from-database-to-frontend.md)
- [.claude/skills/type-safety-schema/SKILL.md](.claude/skills/type-safety-schema/SKILL.md)

---

## Where to Start Coding

### 1. Understand What Exists (Start Here!)

**Look at the demo data to understand the system:**

```bash
# Open this file and read it
packages/databases/postgres/src/seed/demo/demo-seed.ts
```

This shows you:
- How a tenant is created
- How users are created
- How content nodes are created (Breaking Bad project)
- How data is connected

**Look at existing API endpoints:**

```bash
# Syncstation API (this is YOUR API!)
apps/api/src/routes/sync.log.ts      # Your endpoints
apps/api/src/repos/sync.log.repo.ts  # Database queries

# Auth API (how login works)
apps/api/src/routes/auth.ts

# Workstation API (how content works)
apps/api/src/routes/ws.content.ts
```

### 2. Test the API First

**Before writing app code**, test the API endpoints in Postman to understand the complete workflow.

> **Important:** The Syncstation API endpoints are **example implementations** to demonstrate patterns and get you started. Feel free to modify, extend, or completely replace them based on your team's requirements.

#### Setup Postman

1. Start API: `pnpm dev:api`
2. Open Postman
3. Import collection: `postman/HK26-API.postman_collection.json`
4. Import environment: `postman/HK26-Local.postman_environment.json`
5. Select "HK26-Local" environment (dropdown in top right)

#### How Postman Variables Work

The collection uses **collection variables** that automatically update as you test:

- `accessToken` - Saved when you login, used in all authenticated requests
- `tenantId` - Saved when you login, sent as `x-ws-tenant` header
- `nodeId` - Saved when you get projects/tree, used for testing log entries
- `logEntryId` - Saved when you create/list log entries, used for testing updates

**You don't need to manually copy/paste tokens!** The test scripts do this automatically. However, you may need to **manually set** `nodeId` if you want to test with a specific content node.

#### Complete Testing Workflow

**Step 1: Login** 🔐

1. Open: `Auth API` → `Login`
2. Verify body has:
   ```json
   {
     "email": "admin@hoolsy.com",
     "password": "demopassword"
   }
   ```
3. Click **Send**
4. Check response - should return `accessToken` and user info
5. ✅ Variables `accessToken` and `tenantId` are now saved automatically

**Step 2: Get Projects** 📁

1. Open: `Workstation API` → `List all projects`
2. Click **Send**
3. Response shows all projects, including the "Breaking Bad" demo project
4. Find the **root project** in response:
   ```json
   {
     "id": "019bd32e-c586-7223-9705-c35e0c66ae89",
     "title": "Breaking Bad",
     "nodeType": "root"
   }
   ```
5. Copy the `id` value
6. Go to: **Collections** → `HK26-API` → **Variables** tab
7. Set `nodeId` to the copied ID (or manually paste in requests)

**Step 3: Get Project Tree (Optional - Find Deeper Nodes)** 🌳

If you want to test with a **specific episode** instead of the root project:

1. Open: `Workstation API` → `Get project tree (nested)`
2. Verify `nodeId` variable is set (from step 2)
3. Click **Send**
4. Response shows the **entire tree structure**:
   ```json
   {
     "root": {
       "id": "019bd32e-c586-7223-9705-c35e0c66ae89",
       "title": "Breaking Bad",
       "children": [
         {
           "id": "019bd32e-c586-7223-9705-...",
           "title": "Season 1",
           "children": [
             {
               "id": "019bd32e-c586-7223-9705-...",
               "title": "Episode 1: Pilot",
               "nodeType": "episode"
             }
           ]
         }
       ]
     }
   }
   ```
5. Find an **episode** node and copy its `id`
6. Update the `nodeId` variable with this episode ID

**Step 4: Test Syncstation API** 🎬

The Syncstation API provides these endpoints for managing on-set log entries:
- `GET /syncstation/sync-status` - Get sync statistics (pending, failed counts)
- `GET /syncstation/log-entries` - List all log entries (with optional filters)
- `GET /syncstation/log-entries/:id` - Get a single log entry with attachments
- `POST /syncstation/log-entries` - Create a new log entry
- `PATCH /syncstation/log-entries/:id` - Update an existing log entry
- `DELETE /syncstation/log-entries/:id` - Delete a log entry

Let's test each one:

**4a. Get Sync Status**
1. Open: `Syncstation API` → `Sync status`
2. Click **Send**
3. Response shows sync statistics:
   ```json
   {
     "ok": true,
     "pendingCount": 0,
     "failedCount": 0,
     "lastSyncAt": null
   }
   ```

**4b. List All Log Entries**
1. Open: `Syncstation API` → `List log entries`
2. Notice query params are **disabled** by default (shows all entries)
3. Click **Send**
4. Response shows all log entries for your tenant

**Optional filters:**
- Enable `nodeId` query param to show only entries for a specific content node
- Enable `status` query param to filter by sync status (`local`, `pending`, `synced`, `failed`)
- You can combine both filters

**4c. Create a Log Entry**
1. Open: `Syncstation API` → `Create log entry`
2. Verify body:
   ```json
   {
     "nodeId": "{{nodeId}}",
     "title": "Test log entry from Postman",
     "description": "This is a test log entry created via Postman API"
   }
   ```
3. Click **Send**
4. Response returns the created entry
5. ✅ Variable `logEntryId` is saved automatically

**4d. Get Single Log Entry**
1. Open: `Syncstation API` → `Get single log entry`
2. URL uses `{{logEntryId}}` from previous step
3. Click **Send**
4. Response includes the entry with all attachments

**4e. Update Log Entry**
1. Open: `Syncstation API` → `Update log entry`
2. Modify the body as needed:
   ```json
   {
     "title": "Updated title",
     "description": "Updated description",
     "status": "synced"
   }
   ```
3. Click **Send**
4. Response shows updated entry

**4f. Delete Log Entry**
1. Open: `Syncstation API` → `Delete log entry`
2. Click **Send**
3. Response: `{ "ok": true }` (success)

#### Error Handling

The API returns helpful error messages to help you debug issues:

**Common Errors:**
- `401 Unauthorized` - Auth token expired, run Login again
- `400 TENANT_HEADER_MISSING` - Missing `x-ws-tenant` header, check that `tenantId` variable is set
- `400 Content node '{id}' not found` - The `nodeId` doesn't exist or doesn't belong to your tenant
- `404 Log entry '{id}' not found` - The log entry doesn't exist or doesn't belong to your tenant
- `404 ... may have already been deleted` - Trying to delete a log entry that's already gone

**Testing Tips:**
- **Auth Token Expires:** If you get `401 Unauthorized`, run Login again
- **Wrong Tenant:** Check that `tenantId` variable is set in collection variables
- **Node Not Found:** Verify `nodeId` exists by listing projects first
- **Variables Not Updating:** Check the **Tests** tab in each request - they contain scripts that save variables
- **Invalid UUIDs:** Make sure IDs are valid UUID format

#### What's Next?

Once you understand the API flow in Postman, you can:
1. Build the same flow in your React Native app
2. Use the same request/response types from `@hk26/schema`
3. Implement offline-first by saving to SQLite first, then syncing to API

### 3. Start Building the Mobile App

**Your mobile app structure:**

```
apps/syncstation-app/
├── app/                    # Expo Router (screens)
│   ├── (auth)/
│   │   ├── login.tsx      # Login screen
│   │   └── register.tsx   # Register screen
│   ├── (tabs)/
│   │   ├── index.tsx      # Home/Dashboard
│   │   ├── logs.tsx       # Log entries list
│   │   └── sync.tsx       # Sync status
│   └── _layout.tsx        # Root layout
├── src/
│   ├── api/               # API client (calls to backend)
│   │   └── client.ts      # Axios/Fetch wrapper
│   ├── components/        # Reusable components
│   ├── hooks/             # React hooks
│   ├── services/          # Business logic
│   │   ├── auth.ts        # Auth service
│   │   ├── logs.ts        # Log service
│   │   └── sync.ts        # Sync service
│   └── storage/           # Local storage
│       └── sqlite.ts      # SQLite for offline
└── package.json
```

**Example API client:**

```typescript
// apps/syncstation-app/src/api/client.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3333'; // Change for production

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to all requests
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  const tenantId = await AsyncStorage.getItem('tenantId');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    config.headers['x-ws-tenant'] = tenantId;
  }

  return config;
});
```

**Example log service:**

```typescript
// apps/syncstation-app/src/services/logs.ts
import { apiClient } from '../api/client';
import { type LogEntry, type CreateLogEntryRequest } from '@hk26/schema';

export async function createLogEntry(data: CreateLogEntryRequest['body']): Promise<LogEntry> {
  const response = await apiClient.post('/syncstation/log-entries', data);
  return response.data.entry;
}

export async function getLogEntries(nodeId: string): Promise<LogEntry[]> {
  const response = await apiClient.get('/syncstation/log-entries', {
    params: { nodeId }
  });
  return response.data.items;
}

export async function getSyncStatus() {
  const response = await apiClient.get('/syncstation/sync-status');
  return response.data;
}
```

### 4. Offline-First Pattern

**Key principle:** The app should work without internet connection.

**Architecture:**

```
┌─────────────┐
│   Mobile    │
│    App      │
└─────────────┘
       │
       ▼
┌─────────────┐
│   SQLite    │  ← Local storage
│  (Expo)     │
└─────────────┘
       │
       ▼ (when online)
┌─────────────┐
│   Sync      │  ← Background sync
│  Service    │
└─────────────┘
       │
       ▼
┌─────────────┐
│ API Server  │
└─────────────┘
       │
       ▼
┌─────────────┐
│ PostgreSQL  │
└─────────────┘
```

**Recommended libraries:**
- `expo-sqlite` - Local database
- `@tanstack/react-query` - Data fetching and caching
- `zustand` - State management

**Example offline pattern:**

```typescript
// apps/syncstation-app/src/services/sync.ts
import * as SQLite from 'expo-sqlite';
import { apiClient } from '../api/client';

const db = SQLite.openDatabase('syncstation.db');

// Save locally first
export async function createLogEntryOffline(data) {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO log_entries (title, description, nodeId, status) VALUES (?, ?, ?, ?)',
        [data.title, data.description, data.nodeId, 'local'],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
}

// Sync to server when online
export async function syncLogEntries() {
  const localEntries = await getLocalLogEntries();

  for (const entry of localEntries) {
    if (entry.status === 'local') {
      try {
        await apiClient.post('/syncstation/log-entries', entry);
        await markEntryAsSynced(entry.id);
      } catch (error) {
        await markEntryAsFailed(entry.id, error.message);
      }
    }
  }
}
```

---

## Learning Resources

### 1. Understand the Database Structure

**Read these seed files to understand data:**

```bash
# How users and tenants are created
packages/databases/postgres/src/seed/setup/seed-platforms.ts
packages/databases/postgres/src/seed/setup/seed-workstation-lookups.ts

# How demo data is created (Breaking Bad project)
packages/databases/postgres/src/seed/demo/demo-seed.ts
```

**Explore schemas:**

```bash
# Users database
packages/databases/postgres/src/schema/users/

# Workstation database (content nodes!)
packages/databases/postgres/src/schema/workstation/

# Syncstation database (YOUR tables!)
packages/databases/postgres/src/schema/syncstation/
```

### 2. Study Existing API Patterns

**Pattern 1: Repository Pattern (Data Access Layer)**

```typescript
// apps/api/src/repos/sync.log.repo.ts

// Repository handles ALL database access
export async function listLogEntries(tenantId: string, nodeId: string) {
  const rows = await dbSync
    .select()
    .from(schema.logEntries)
    .where(and(
      eq(schema.logEntries.tenantId, tenantId),
      eq(schema.logEntries.nodeId, nodeId)
    ))
    .orderBy(desc(schema.logEntries.createdAt));

  return rows.map(mapLogEntryToDto);
}
```

**Pattern 2: Route Handler (API Endpoints)**

```typescript
// apps/api/src/routes/sync.log.ts

app.get('/syncstation/log-entries', async (req, reply) => {
  const tenantId = requireTenant(req);
  const { nodeId } = req.query;

  // Call repository
  const items = await syncLogRepo.listLogEntries(tenantId, nodeId);

  // Validate and return
  return reply.send(LogEntriesListResponse.parse({ ok: true, items }));
});
```

**Pattern 3: Zod Validation**

```typescript
// packages/schema/src/syncstation/log-entry.ts

// Define request schema
export const CreateLogEntryRequest = z.object({
  body: z.object({
    nodeId: z.string().uuid(),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
  }),
});

// Use in route
const body = CreateLogEntryRequest.shape.body.parse(req.body);
// Automatically validates! Throws if invalid!
```

### 3. Read the Assignment

**Your assignment document explains:**
- What features to build
- Functional requirements (login, create logs, sync, etc.)
- Non-functional requirements (offline-first, security, etc.)
- Technical requirements (React Native, Expo, TypeScript)

**Key sections to focus on:**
- Functional requirements → What to build
- Technical requirements → How to build it
- Non-functional requirements → Quality standards

### 4. Explore Background Documents

**These documents provide context:**
- [README.md](README.md) - Project overview, repository structure, and multi-database architecture
- [documents/guides/type-safety-from-database-to-frontend.md](documents/guides/type-safety-from-database-to-frontend.md) - Type safety principles

**External references** (mentioned in your assignment):
- **User Database PR**: https://github.com/Hoolsy-com/hoolsy-platforms/pull/1
- **Content Nodes PR**: https://github.com/Hoolsy-com/hoolsy-platforms/pull/3

These PRs show how the original system was built. You don't need to implement this - it's already done! But reading them helps understand WHY things are structured this way.

---

## Common Patterns

### 1. Querying Content Nodes (for selection in app)

```typescript
// Get all projects for a tenant (top-level nodes)
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

### 2. Creating a Log Entry (backend)

```typescript
// apps/api/src/routes/sync.log.ts
app.post('/syncstation/log-entries', async (req, reply) => {
  const tenantId = requireTenant(req);

  // Get user from JWT
  const decoded = await req.jwtVerify<{ sub: string }>();
  const userId = decoded.sub;

  // Validate request
  const body = CreateLogEntryRequest.shape.body.parse(req.body);

  // Create entry
  const entry = await syncLogRepo.createLogEntry({
    tenantId,
    userId,
    nodeId: body.nodeId,
    title: body.title,
    description: body.description,
  });

  return reply.code(201).send(LogEntryResponse.parse({ ok: true, entry }));
});
```

### 3. Uploading Media (files, images, videos)

**The API already has multipart upload configured:**

```typescript
// apps/api/src/server.ts
await app.register(multipart, {
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB max
  },
});
```

**You'll need to implement upload handling:**

```typescript
// Example: POST /syncstation/attachments
app.post('/syncstation/attachments', async (req, reply) => {
  // Get file from multipart upload
  const data = await req.file();

  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  // Save file to storage (local filesystem or S3)
  const storagePath = await saveFile(data);

  // Create attachment record
  const attachment = await syncLogRepo.createAttachment({
    logEntryId: req.body.logEntryId,
    filename: data.filename,
    mimeType: data.mimetype,
    fileSize: data.file.bytesRead,
    storagePath,
    attachmentType: getAttachmentType(data.mimetype),
  });

  return reply.send({ ok: true, attachment });
});
```

**On mobile (React Native):**

```typescript
import * as ImagePicker from 'expo-image-picker';

// Pick image
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.8,
});

if (!result.canceled) {
  // Upload to API
  const formData = new FormData();
  formData.append('file', {
    uri: result.assets[0].uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  });
  formData.append('logEntryId', logEntryId);

  await apiClient.post('/syncstation/attachments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
```

### 4. Handling Sync Status

```typescript
// Update log entry status after sync
await syncLogRepo.updateLogEntry(entryId, tenantId, {
  status: 'synced',
  // syncedAt is set automatically when status = 'synced'
});

// Mark as failed
await syncLogRepo.updateLogEntry(entryId, tenantId, {
  status: 'failed',
  lastSyncError: error.message,
});
```

---

## Next Steps

1. **Complete setup** - Follow [SETUP.md](./SETUP.md)
2. **Test API** - Use Postman to understand endpoints
3. **Read seed files** - Understand how data is structured
4. **Build login screen** - Start with authentication
5. **Build content selection** - Let user choose which node to log to
6. **Build log creation** - Create form for new log entries
7. **Implement offline storage** - SQLite for local data
8. **Build sync mechanism** - Background sync when online

**Tips:**
- Start simple - don't try to build everything at once
- Test each feature thoroughly before moving to the next
- Use TypeScript types from `@hk26/schema`
- Run `pnpm typecheck` often to catch errors early
- Ask questions if you're stuck!

**Good luck!** 🚀
