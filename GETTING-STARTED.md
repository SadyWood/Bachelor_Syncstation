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

You have your own database with two tables:

**log_entries** - Main table for log entries
```typescript
{
  id: string (UUID)
  tenantId: string (UUID)    // Which tenant (organization)
  userId: string (UUID)      // Who logged this
  nodeId: string (UUID)      // Which content node (project/episode)
  title: string
  description: string | null
  status: 'local' | 'pending' | 'synced' | 'failed'
  syncAttempts: number
  lastSyncError: string | null
  createdAt: string
  updatedAt: string
  syncedAt: string | null
}
```

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

**Before writing app code**, test the API endpoints:

1. Start API: `pnpm dev:api`
2. Open Postman
3. Import: `postman/HK26-API.postman_collection.json`
4. Import environment: `postman/HK26-Local.postman_environment.json`

**Test sequence:**
```
1. POST /auth/login → Get access token
2. GET /syncstation/sync-status → Verify auth works
3. GET /ws/content-nodes → See available content
4. POST /syncstation/log-entries → Create a log entry
5. GET /syncstation/log-entries?nodeId=xxx → List entries
```

**Note:** Syncstation API endpoints are already implemented and working! You just need to build the mobile app that calls them.

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
