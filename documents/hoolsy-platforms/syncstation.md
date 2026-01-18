# Syncstation Platform
## On-set field logging for the Hoolsy ecosystem

> ⚠️ **AI-Generated Documentation**
>
> This document was generated using AI based on a curated collection of source materials. While it aims to provide a comprehensive overview, information may be inaccurate, outdated, or incomplete. These documents help form a holistic understanding of the Hoolsy platform, but may contain errors or inconsistencies. Always verify critical information with the Hoolsy team before making implementation decisions.

Syncstation is Hoolsy's **mobile field logging application** that enables production crews (costume, props, makeup, script supervisors) to capture notes, photos, and files on set and sync them to Workstation for post-production use.

> ⚠️ **MVP vs Long-Term Vision**
>
> This document describes both what Syncstation **is today (MVP)** and where it **could evolve in the future**. The MVP is a focused field logging tool. The long-term vision includes production management features like budgeting, script modules, crew management, and AI workflows—but these are not yet finalized or prioritized.
>
> When reading this document:
> - **MVP sections** describe what is being built now
> - **Future Vision sections** describe possible future directions, not committed roadmap

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [MVP Scope](#mvp-scope)
3. [System Architecture](#system-architecture)
4. [Authentication & Multi-Tenant Access](#authentication--multi-tenant-access)
5. [Core Features (MVP)](#core-features-mvp)
6. [Offline-First Architecture](#offline-first-architecture)
7. [Data Model](#data-model)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Sync Strategy](#sync-strategy)
10. [API Surface](#api-surface)
11. [Syncstation in the Hoolsy Ecosystem](#syncstation-in-the-hoolsy-ecosystem)
12. [Future Vision (Not MVP)](#future-vision-not-mvp)

---

## Platform Overview

### What Hoolsy is building
Hoolsy is building an ecosystem that connects media production workflows with structured data capture and commerce capabilities. Syncstation brings this into the physical production environment.

### What Syncstation MVP is
Syncstation MVP is a **mobile field logging tool** for on-set crews. It solves one problem extremely well: **capturing and syncing contextual notes and media from the field to Workstation**.

**The core use case:**
- Costume designer on set takes photo of actor's costume
- Adds quick note: "Blood stain on shirt, continuity from previous scene"
- Entry saves locally (works offline)
- When WiFi available, syncs to Workstation
- Post-production team sees the note and photo in Workstation

**MVP capabilities:**
- **Rapid logging**: Capture note + photo in under 30 seconds
- **Context binding**: Link entries to specific episodes/scenes from Workstation
- **Offline-first**: Works without network, syncs when available
- **Multi-format attachments**: Images, video, PDFs, documents
- **Sync status tracking**: Clear visibility of what's synced vs local
- **Simple roles**: Viewer, Logger, Admin

### What Syncstation MVP is NOT
- **Not a production management platform** (no budgeting, crew management, logistics in MVP)
- **Not a script tool** (no script module, scene breakdowns in MVP)
- **Not AI-powered** (no AI tagging, continuity checking in MVP)
- **Not a replacement for Movie Magic, Celtx, or StudioBinder**

Syncstation MVP is **intentionally narrow**: it's a field logger that feeds Workstation, nothing more.

### Why this narrow scope?
The MVP validates the core value proposition:
- **Solves real pain**: Lost notes, unorganized photos, missing continuity info
- **Simple to use**: Fast enough to use in chaotic on-set environments
- **Technical de-risking**: Proves offline sync, file uploads, mobile UX work
- **Clear value**: Production teams immediately understand "digital logbook for set"

### Who uses Syncstation MVP
**Primary users:**
- **Costume department**: Document costume details, continuity, changes per scene
- **Props department**: Track props usage, placement, availability per scene
- **Makeup & hair**: Log makeup looks, prosthetics, continuity per take
- **Script supervisor**: Capture continuity notes, scene coverage, take details
- **Production coordinators**: General on-set logging and documentation

**Potential future users** (post-MVP, not finalized):
- Producer, Director, DOP, Camera crew, Grips, Lighting, Sound, SFX/VFX, Location manager, Data wrangler, DIT

### Example MVP workflow
1. Costume designer opens Syncstation on set
2. Selects current project: "Breaking Bad, Season 1, Episode 3"
3. Takes photo of Walter White's costume
4. Adds quick note: "Blood stain on shirt, continuity from previous scene"
5. Logs entry (saved locally if offline)
6. Later, when WiFi available, entry syncs to Workstation
7. Post-production team sees costume note linked to Episode 3 in Workstation

---

## MVP Scope

This section clearly defines what **is** and **is not** included in the first version of Syncstation.

### What's included in MVP

**Core functionality:**
- Authentication (shared with Workstation)
- Context selection (project, episode, scene)
- Log entry creation (note + media attachments)
- Media attachments (images, video, PDF, DOCX, XLSX)
- Offline-first operation with local SQLite storage
- Sync with status tracking (local, pending, syncing, synced, failed)
- View log entries for selected content node

**User management:**
- Basic roles: Viewer, Logger, Admin
- Multi-tenant scoping (users see only their tenant's content)
- Platform access grants via Workstation

**Technology:**
- Mobile app: React Native + Expo
- REST API: Node.js + TypeScript (Fastify)
- Database: PostgreSQL (Syncstation DB + Users DB + reads from Workstation DB)
- Object storage: S3 or equivalent for media files
- Schema validation: Zod (shared between client and server)

### What's NOT in MVP

**Explicitly excluded from first version:**
- ❌ Script module (no script import, scene breakdown, or script tagging)
- ❌ Budget tracking (no cost tracking, funding schemes, accounting exports)
- ❌ Research & references (no moodboards, visual references, research organization)
- ❌ Logistics & planning (no call sheets, transport, accommodation, safety checklists)
- ❌ Cast & crew management (no crew lists, timesheets, availability calendars)
- ❌ Advanced subject tagging (no Subject Registry integration, no bounding boxes)
- ❌ AI-assisted workflows (no image analysis, tag suggestions, continuity checking)
- ❌ External tool integrations (no Final Draft, Shopify, accounting systems)
- ❌ Expanded role-based workflows (no department-specific interfaces beyond basic RBAC)

### Success criteria for MVP

The MVP is successful if:
- On-set crew can log entries (note + photo) in **under 30 seconds**
- Sync works reliably **offline → online with no data loss**
- Logs are **visible in Workstation** for post-production use
- **Zero duplicates** from retry logic (idempotent sync works)
- **Positive feedback** from test users (costume, props, script supervisor)
- Technical validation: offline-first architecture, file uploads, mobile UX all work as designed

### Why this scope is intentionally narrow

**Focus on one problem:**
- Production crews lose notes, photos get disorganized, continuity info disappears
- Syncstation MVP solves this specific pain point

**Technical validation:**
- Offline sync is hard—prove it works before adding complexity
- File uploads from mobile need to be robust and fast
- Mobile UX in chaotic environments needs iteration

**User validation:**
- Does the core workflow (log + sync) provide value?
- Will crews actually use this tool on set?
- What features do they ask for next?

**Strategic positioning:**
- Syncstation positions Hoolsy as "production-aware" platform
- Early adoption by production teams builds trust and network effects
- Proves Syncstation can integrate with existing Workstation infrastructure

---

## System Architecture

> **Note**: This architecture is intentionally simplified for MVP. Many components are pared-down versions of Workstation patterns. Advanced features like full RBAC integration, analytics pipelines, and AI modules are explicitly deferred.

### Three-Database Architecture (MVP-scoped)
Syncstation operates within Hoolsy's multi-database ecosystem, sharing infrastructure with Workstation:

**1. Users Database** (shared, read-only from Syncstation)
- Authenticates users across all Hoolsy platforms
- Validates platform access (Syncstation access grant required)
- Provides user profile and membership data

**2. Workstation Database** (read-only from Syncstation)
- Source of content hierarchy (projects, content nodes)
- Provides context for log entries (which episode, which scene)
- Syncstation queries this to build context selectors

**3. Syncstation Database** (read/write from Syncstation)
- Stores log entries created on set
- Manages sync queue and status tracking
- Stores attachments metadata (actual files in object storage)

### Mobile-First Stack

**Client (React Native):**
- Built with React Native + Expo
- Tested via Expo Go on physical devices
- Offline-capable with local SQLite storage
- File handling: images, video, PDFs, documents

**API (Node.js + TypeScript):**
- Fastify-based REST API
- Drizzle ORM for database access
- Zod schema validation (shared with client)
- Multi-tenant aware (tenant scoping on all endpoints)

**Databases (PostgreSQL):**
- Three separate databases (Users, Workstation, Syncstation)
- Docker Compose setup for local development
- Connection pooling for mobile client requests

**Object Storage (S3 or equivalent):**
- Images, videos, and files uploaded to cloud storage
- Pre-signed URLs for secure upload/download
- Syncstation database stores references to files, not files themselves

### Data Flow

**Log entry creation:**
1. User creates log entry in mobile app
2. Entry saved to local SQLite database
3. Media files saved to device file system
4. Entry marked as "pending sync"
5. When network available, entry synced to API
6. API validates, stores in Syncstation database
7. Media files uploaded to S3 with pre-signed URLs
8. Entry marked as "synced" in mobile app

**Context binding flow:**
1. User logs into Syncstation
2. App fetches available projects from Workstation database
3. User selects project (e.g., "Breaking Bad Season 1")
4. App fetches content tree for that project
5. User selects content node (e.g., "Episode 3")
6. All subsequent log entries default to Episode 3 context
7. User can switch context at any time

---

## Authentication & Multi-Tenant Access

### Shared Authentication
Syncstation uses the **same authentication system** as Workstation:

**Login flow:**
1. User opens Syncstation mobile app
2. Enters email and password
3. API validates credentials against Users database
4. Returns JWT access token + httpOnly refresh cookie
5. User gains access to Syncstation

**Platform access validation:**
- User must have `user_access_to_platform` grant for "Syncstation" platform
- Users without Syncstation access see error: "No access to Syncstation"
- Access grants managed via Workstation Admin Console

### Multi-Tenant Scoping
Like Workstation, Syncstation is **multi-tenant**:

**Tenant context resolution:**
1. User logs in
2. API fetches user's tenant memberships from Workstation database
3. If user has multiple tenants, app prompts for tenant selection
4. Selected tenant stored in app state
5. All API requests include tenant context (via header or session)
6. Users can only log entries within their tenant's content nodes

**Example:**
- User is member of "Netflix Productions" tenant
- User can only log entries linked to content nodes within Netflix Productions
- Cannot see or log entries for "HBO Productions" tenant

### Permissions (Simplified for MVP)
MVP uses **basic role-based permissions**:

**Read/Write permissions:**
- **Viewer**: Can view log entries but cannot create new ones
- **Logger**: Can create and view log entries (default for on-set crew)
- **Admin**: Can create, view, edit, and delete log entries

**Permission enforcement:**
- Checked at API level on all endpoints
- Mobile app hides create/edit UI for users without write permission
- Future: Integration with Workstation's full wildcard RBAC system

---

## Core Features (MVP)

### 1. Context Selection

**Content Node Binding:**
Every log entry must be linked to a content node in Workstation. Users select context via hierarchical picker:

**Context selector UI:**
- Displays user's projects from Workstation
- Drill down: Project → Season → Episode (or other hierarchy)
- Can also select group nodes (e.g., "Season 1") or root node (project)
- Selected context displayed prominently in app (e.g., "Current: Breaking Bad S01E03")

**Context persistence:**
- Last selected context saved in app state
- Persists across app restarts
- User can change context at any time

**Example context hierarchy:**
```
Breaking Bad (Project / Root Node)
  └─ Season 1 (Group Node)
      ├─ Episode 1: Pilot (Content Node)
      ├─ Episode 2: Cat's in the Bag (Content Node)
      └─ Episode 3: ...and the Bag's in the River (Content Node)
```

User can log to any of these nodes.

### 2. Log Entry Creation

**Rapid logging interface:**
- Single "New Entry" button always visible
- Quick capture flow optimized for speed

**Log entry fields:**
- **Text/Note** (required): Brief description (e.g., "Walter's costume for courtroom scene")
- **Media attachments** (optional):
  - Photos (camera or gallery)
  - Videos (camera or gallery)
  - Files (PDF, DOCX, XLSX, etc. via file picker)
- **Context** (auto-filled): Currently selected content node
- **Timestamp** (auto-filled): When entry was created
- **Creator** (auto-filled): Logged-in user

**Entry creation flow:**
1. User taps "New Entry"
2. Writes quick note (e.g., "Blood on shirt")
3. Optionally taps "Add Photo" → takes picture
4. Taps "Save"
5. Entry saved locally with status "Pending Sync"
6. User sees confirmation: "Saved locally, will sync when online"

**Target time**: Under 30 seconds for simple entry (note + photo).

### 3. Media Attachments

**Supported media types:**
- **Images**: JPG, PNG, HEIC
- **Videos**: MP4, MOV
- **Documents**: PDF, DOCX, XLSX

**Attachment handling:**
- Files saved to device file system initially
- Metadata (filename, size, type) saved to local SQLite
- On sync, files uploaded to S3 with pre-signed URLs
- Syncstation database stores S3 file references

**File size limits:**
- Images: Up to 20 MB
- Videos: Up to 500 MB
- Documents: Up to 50 MB

**Preview capabilities (MVP):**
- Images: Thumbnail and full-screen preview in app
- Videos: Play inline with native player
- Documents: Open with device's default viewer (e.g., PDF reader)

**Future**: Built-in PDF/DOCX viewer within app.

### 4. Viewing Log Entries

**Log entry list:**
- Default view: All entries for currently selected content node
- Sorted by creation date (newest first)
- Each entry shows:
  - Note preview (first 100 characters)
  - Attached media count (e.g., "2 photos, 1 file")
  - Creator name
  - Timestamp
  - Sync status icon (local, syncing, synced, failed)

**Log entry detail view:**
- Full note text
- All attached media displayed (images, video thumbnails, file icons)
- Creator info and timestamp
- Sync status
- Actions: Edit (if unsynced), Delete (if unsynced)

**Filtering (Optional for MVP):**
- Filter by sync status: Local only, Synced, Failed
- Filter by media type: Has images, Has videos, Has files
- Filter by creator: Show only my entries

### 5. Offline-First Operation

**Core principle**: App must work perfectly without network connectivity.

**Offline capabilities:**
- Create log entries
- Attach media files
- View previously synced entries (cached locally)
- View local unsynced entries
- See clear status for each entry (local vs. synced)

**Network-required operations:**
- Fetching new entries created by other users
- Syncing local entries to server
- Downloading media files not cached locally

**Offline UX:**
- Status indicator in app header: "Offline" or "Online"
- When offline, user sees banner: "Working offline - entries will sync when connected"
- Sync button shows pending count: "Sync 3 entries"

### 6. Sync Status Tracking

**Per-entry status:**
- **Local**: Entry exists only on device
- **Pending Sync**: Entry queued for upload (waiting for network)
- **Syncing**: Upload in progress
- **Synced**: Successfully uploaded to server
- **Failed**: Upload failed (with retry option)

**Status indicators:**
- Color-coded badges on entry list
- Sync icon in entry detail view
- Overall sync status in app header

**User controls:**
- "Sync Now" button (manually trigger sync)
- "Retry Failed" button (retry entries that failed)
- Clear indication: "3 entries pending sync"

---

## Offline-First Architecture

### Local Storage (SQLite)

**Why SQLite:**
- Embedded database on mobile device
- Works offline
- Fast querying and indexing
- Reliable for mobile apps

**Local database schema:**
```
log_entries (local):
  - local_id (UUID, primary key)
  - node_id (UUID, content node reference)
  - user_id (UUID)
  - note (TEXT)
  - created_at (TIMESTAMP)
  - sync_status (ENUM: local, pending, syncing, synced, failed)
  - server_id (UUID, nullable - populated after sync)

attachments (local):
  - local_id (UUID)
  - entry_local_id (FK to log_entries)
  - file_path (TEXT, local file system path)
  - file_type (TEXT: image, video, document)
  - file_name (TEXT)
  - file_size (INTEGER)
  - sync_status (ENUM)
  - server_url (TEXT, nullable - S3 URL after sync)
```

### Sync Queue

**How sync works:**
1. When network available, app checks for entries with `sync_status: pending`
2. For each entry:
   - Upload metadata (note, node_id, user_id, created_at) to API
   - API returns server-side entry ID
   - Upload each attachment file to S3 (pre-signed URL)
   - Update local entry: `sync_status: synced`, `server_id: <id>`
3. If upload fails, mark entry as `failed` with error message
4. Provide "Retry" button for failed entries

**Idempotent sync:**
- If sync interrupted, same entry can be sent multiple times
- API checks for duplicate entries using client-side UUID
- If entry already exists, API returns existing ID (no duplicate created)

**Conflict resolution:**
- MVP: No editing of synced entries (read-only once synced)
- Future: Implement optimistic locking or last-write-wins strategy

### Background Sync

**Auto-sync triggers:**
- App comes to foreground
- Network connection restored
- Periodic background checks (every 5 minutes if app active)

**User-initiated sync:**
- "Sync Now" button in app
- Manually trigger sync even if auto-sync hasn't run

**Battery and data considerations:**
- Option to sync only on WiFi (not cellular)
- Option to defer video uploads until WiFi available

---

## Data Model

### Log Entry (Server-Side)

**Syncstation database schema:**

```
log_entries:
  - entry_id (UUID, primary key)
  - tenant_id (UUID, FK to workstation.ws_tenants)
  - node_id (UUID, FK to workstation.content_nodes)
  - user_id (UUID, FK to users.users)
  - note (TEXT)
  - created_at (TIMESTAMP)
  - synced_at (TIMESTAMP, when it arrived at server)
  - client_id (UUID, from mobile app - for idempotent sync)

attachments:
  - attachment_id (UUID)
  - entry_id (FK to log_entries)
  - file_name (TEXT)
  - file_type (ENUM: image, video, document)
  - file_size (INTEGER, bytes)
  - s3_url (TEXT, full S3 path)
  - uploaded_at (TIMESTAMP)
```

**Relationships:**
- `log_entries.tenant_id` → `workstation.ws_tenants.tenant_id`
- `log_entries.node_id` → `workstation.content_nodes.node_id`
- `log_entries.user_id` → `users.users.user_id`

### Zod Schema Validation

**Shared schema layer:**
Both mobile app and API use **identical Zod schemas** for validation:

```typescript
// packages/schema/src/syncstation/logEntry.ts
import { z } from 'zod';

export const LogEntrySchema = z.object({
  entry_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  node_id: z.string().uuid(),
  user_id: z.string().uuid(),
  note: z.string().min(1).max(5000),
  created_at: z.string().datetime(),
  synced_at: z.string().datetime().optional(),
  client_id: z.string().uuid(),
});

export const AttachmentSchema = z.object({
  attachment_id: z.string().uuid(),
  entry_id: z.string().uuid(),
  file_name: z.string().min(1).max(255),
  file_type: z.enum(['image', 'video', 'document']),
  file_size: z.number().int().positive().max(500 * 1024 * 1024), // 500 MB
  s3_url: z.string().url().optional(),
  uploaded_at: z.string().datetime().optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
```

**Benefits:**
- No type mismatches between client and server
- Single source of truth for data structure
- API automatically validates incoming data
- Mobile app has TypeScript types from schema

---

## User Roles & Permissions

### MVP Roles (Simplified)

**Three basic roles:**

**1. Viewer**
- Can view log entries within their tenant
- Cannot create, edit, or delete entries
- Use case: Producers, directors reviewing on-set logs

**2. Logger** (default for crew)
- Can create log entries
- Can view log entries
- Can edit/delete their own unsynced entries
- Use case: Costume, props, makeup, script supervisor

**3. Admin**
- All Logger permissions
- Can delete any entry (synced or unsynced)
- Can manage Syncstation settings for tenant
- Use case: Production coordinators, Syncstation administrators

**Permission enforcement:**
- Enforced at API level on all endpoints
- Mobile app UI adapts to user role (hides unavailable actions)

### Future Roles (Not in MVP)

> **Note**: These are illustrative examples of how roles could expand post-MVP, not finalized designs.

As Syncstation evolves, role-based permissions could become more sophisticated to match production department structures:

**Possible expanded roles:**
- **Department-specific access**: Costume dept sees only costume logs, props sees only props logs
- **Production leadership**: Producers and directors with cross-department visibility
- **Technical roles**: Camera, lighting, sound teams with specialized interfaces
- **Post-production access**: Read-only access for editors and post supervisors
- **External collaborators**: Limited shared-link access for specific entries

The MVP uses simple Viewer/Logger/Admin roles to validate the core workflow before adding complexity.

---

## Sync Strategy

### Sync Flow (Detailed)

**Step 1: Entry Creation (Offline)**
```
User creates entry:
  - note: "Blood on shirt"
  - photo: blood-shirt.jpg
  - node_id: breaking-bad-s01e03

Saved to local SQLite:
  - local_id: abc-123
  - sync_status: pending
  - created_at: 2026-01-08 14:30:00

Photo saved to device:
  - /storage/syncstation/attachments/abc-123-blood-shirt.jpg
```

**Step 2: Sync Trigger (Network Available)**
```
App detects WiFi connection
Checks local database for entries with sync_status: pending
Finds entry abc-123
```

**Step 3: Metadata Upload**
```
POST /api/syncstation/entries
Body:
{
  "client_id": "abc-123",
  "tenant_id": "tenant-xyz",
  "node_id": "breaking-bad-s01e03",
  "user_id": "user-456",
  "note": "Blood on shirt",
  "created_at": "2026-01-08T14:30:00Z"
}

API response:
{
  "entry_id": "server-789",
  "presigned_urls": [
    {
      "attachment_id": "attach-001",
      "upload_url": "https://s3.../upload?token=..."
    }
  ]
}
```

**Step 4: File Upload**
```
For each attachment:
  PUT https://s3.../upload?token=...
  Body: [file binary]

S3 returns 200 OK
```

**Step 5: Local Update**
```
Update local SQLite:
  - sync_status: synced
  - server_id: server-789

Update attachment:
  - sync_status: synced
  - server_url: https://s3.../blood-shirt.jpg
```

**Step 6: Confirmation**
```
App shows notification: "1 entry synced"
Entry in list now shows green "Synced" badge
```

### Idempotent Sync (Preventing Duplicates)

**Problem**: Network failures can cause retry loops, potentially creating duplicate entries.

**Solution**: Use client-side UUID as idempotency key.

**How it works:**
1. Mobile app generates UUID for each entry (client_id)
2. When syncing, app sends client_id with entry
3. API checks: Does entry with this client_id already exist?
   - If yes: Return existing entry ID (no duplicate created)
   - If no: Create new entry
4. Mobile app receives server ID, marks entry as synced

**Example:**
```
First attempt (fails mid-upload):
POST /api/syncstation/entries
{ "client_id": "abc-123", ... }
→ Server creates entry, returns { "entry_id": "server-789" }
→ Network drops before app receives response

Second attempt (retry):
POST /api/syncstation/entries
{ "client_id": "abc-123", ... }
→ Server sees client_id abc-123 already exists
→ Returns { "entry_id": "server-789", "already_exists": true }
→ App marks as synced, no duplicate created
```

### Conflict Resolution

**MVP approach**: No conflicts (no editing after sync)

**Future approach (if editing enabled):**
- **Optimistic locking**: Server stores version number, rejects stale edits
- **Last-write-wins**: Most recent edit overwrites previous
- **Manual merge**: User resolves conflicts via UI

---

## API Surface

### Authentication Endpoints

**POST /auth/login**
- Authenticate user with email and password
- Returns access token and refresh token
- Public (no auth required)

**POST /auth/refresh**
- Rotate refresh token, get new access token
- Public (requires valid refresh cookie)

**POST /auth/logout**
- Revoke refresh tokens
- Requires authentication

### Context Endpoints

**GET /api/syncstation/projects**
- List all projects (root nodes) in user's tenant
- Requires authentication
- Returns array of projects with basic metadata

**GET /api/syncstation/projects/:id/tree**
- Fetch content tree for specific project
- Returns hierarchical structure (groups, content nodes)
- Requires authentication

### Log Entry Endpoints

**POST /api/syncstation/entries**
- Create new log entry (sync from mobile)
- Input: client_id, tenant_id, node_id, user_id, note, created_at
- Returns: entry_id, presigned_urls for file uploads
- Idempotent via client_id
- Requires authentication, Logger role

**GET /api/syncstation/entries**
- List log entries for specific content node
- Query params: node_id, limit, offset
- Returns: Array of entries with attachment metadata
- Requires authentication, Viewer role

**GET /api/syncstation/entries/:id**
- Fetch single entry with full details
- Returns: Entry object with attachment URLs
- Requires authentication, Viewer role

**DELETE /api/syncstation/entries/:id**
- Delete log entry (admin only, or creator if unsynced)
- Requires authentication, Admin role or ownership

### File Upload Endpoints

**POST /api/syncstation/entries/:id/presigned-url**
- Request pre-signed S3 URL for file upload
- Input: file_name, file_type, file_size
- Returns: { upload_url, attachment_id }
- Requires authentication

**POST /api/syncstation/entries/:id/attachments/:attachment_id/confirm**
- Confirm file upload completed successfully
- Updates attachment record with uploaded_at timestamp
- Requires authentication

### Sync Endpoints

**POST /api/syncstation/sync/batch**
- Batch upload multiple entries at once
- Input: Array of entries
- Returns: Array of results (entry_id per entry)
- Optimized for bulk sync after extended offline period
- Requires authentication

---

## Syncstation in the Hoolsy Ecosystem

### The Four (Now Five) Platforms

**1. Workstation**
- Internal platform for content preparation and subject verification
- **Relationship to Syncstation**: Syncstation logs entries linked to Workstation's content nodes; logs visible in Workstation for post-production teams

**2. Marketplace**
- Commerce platform for vendors and consumers
- **Relationship to Syncstation**: No direct integration in MVP; future potential for on-set product placement logging

**3. Consumer App**
- Mobile companion app for ultrasound-synced shopping
- **Relationship to Syncstation**: No direct integration; separate user base (consumers vs. production crew)

**4. Nexus**
- Internal oversight and administration
- **Relationship to Syncstation**: Nexus monitors Syncstation usage, sync metrics, user activity

**5. Syncstation** (this document)
- On-set companion app for production crews
- **Relationship to other platforms**: Feeds data into Workstation, shares authentication with all platforms

### Data Flow: On-Set to Post-Production

**End-to-end workflow:**

1. **Pre-Production (Workstation)**
   - Producer creates project: "Breaking Bad Season 1"
   - Content manager builds content tree: Series → Season → Episodes
   - Episodes 1-10 created as content nodes in Workstation

2. **Production Starts**
   - Costume designer downloads Syncstation app
   - Logs in with Hoolsy account (same as Workstation)
   - Selects context: "Breaking Bad S01E03"

3. **On Set (Syncstation)**
   - Shooting Episode 3, Scene 24B
   - Costume designer logs: "Walter's hat, blood stain continuity from 24A"
   - Takes photo of hat
   - Entry saved locally (no WiFi on set)

4. **Wrap, Back at Basecamp**
   - Costume designer connects to WiFi
   - Syncstation syncs: 15 entries uploaded to server
   - All entries now visible in Workstation

5. **Post-Production (Workstation)**
   - Editor opens Episode 3 in Workstation
   - Sees "15 on-set logs" for Episode 3
   - Opens costume log: "Walter's hat, blood stain..."
   - Uses photo for continuity reference during edit

6. **Analytics (Nexus)**
   - Nexus tracks: 200 log entries created during production
   - Tracks: Average sync delay (2.5 hours from creation to sync)
   - Tracks: Most active users (costume dept logged 80% of entries)

### Shared Infrastructure

**Users Database:**
- Syncstation uses same user accounts as Workstation, Marketplace, Nexus
- Users must have "Syncstation" platform access grant
- Single sign-on across all platforms

**Workstation Database:**
- Syncstation queries content nodes from Workstation
- Ensures all log entries link to valid, existing nodes
- Read-only access from Syncstation

**Syncstation Database:**
- Separate database for log entries and attachments
- Not shared with other platforms
- Workstation reads from this database to display on-set logs

---

## Future Vision (Not MVP)

> **Important**: This section describes **possible future directions**, not a committed roadmap. Many of these ideas are exploratory and not yet validated with users or prioritized for development. The MVP intentionally excludes all of these to focus on core field logging.

Beyond the MVP, Syncstation could potentially evolve in several directions. These are illustrative possibilities, not concrete plans:

### Possible Direction: Script Awareness

One possible future direction is deeper script awareness, where Syncstation could potentially:
- Import scripts and link log entries to specific script pages or scenes
- Track script revisions and changes over time
- Enable script supervisors to log take details directly against script content

This would position Syncstation closer to tools like Final Draft or Celtx, but with tighter integration into Hoolsy's ecosystem.

### Possible Direction: Production Management Features

Another potential evolution could involve production management capabilities like:
- Budgeting and cost tracking per department or scene
- Logistics coordination (transport, accommodation, call sheets)
- Cast and crew management (roles, availability, timesheets)
- Equipment tracking (camera, lighting, props inventory)

This would make Syncstation more competitive with tools like Movie Magic Budgeting or StudioBinder.

### Possible Direction: AI-Assisted Workflows

AI could potentially reduce manual work in several ways:
- Image analysis to detect costumes, props, locations in photos
- Tag suggestions based on image content
- Voice-to-text for hands-free note-taking on set
- Continuity checking by comparing images across scenes

This would require significant AI infrastructure and validation with users to ensure it's actually helpful.

### Possible Direction: Subject Registry Integration

Syncstation could integrate more deeply with Hoolsy's Subject Registry:
- Tag specific subjects (from Subject Registry) directly in on-set logs
- Link log entries to subject IDs (e.g., "Walter White's Hat")
- Enable bounding box tagging in images
- Support Hoolsy's content-to-commerce flow by capturing subject data at the source

This would strengthen Syncstation's role in the broader Hoolsy ecosystem and differentiate it from generic logging tools.

### Possible Direction: Research and References

Syncstation could become a place for visual research and references:
- Moodboards for costume, set design, lighting
- Reference image libraries tagged to characters or scenes
- Shared visual inspiration across departments

This would appeal to creative roles like costume designers, production designers, and DOPs.

### Possible Direction: External Integrations

Integrating with industry-standard tools could make Syncstation more appealing:
- Script software (Final Draft, Celtx, Fountain)
- Cloud storage (Google Drive, Dropbox)
- Accounting systems (Tripletex, Fiken, QuickBooks)
- Post-production tools (Avid, Premiere, DaVinci Resolve)

However, each integration adds complexity and maintenance burden, so these would need to be carefully prioritized based on user demand.

### Possible Direction: Expanded Role-Based Workflows

Different production roles could have specialized interfaces:
- **Producers**: Budget dashboards, funding application support
- **Directors**: Script annotations, shot lists, performance notes
- **DOPs**: Lookbooks, technical camera logs, lighting plans
- **Camera/Sound/Lighting**: Equipment logs, technical bibles
- **Stunt coordinators**: Safety checklists, choreography notes
- **DITs**: Footage offload tracking, LUT management
- **Post supervisors**: Metadata validation, handoff reports

This would require significant UX work to tailor interfaces per role without making the app overly complex.

### What Drives Future Direction?

Any of these directions would be informed by:
- **User feedback from MVP**: What do crews actually ask for?
- **Market positioning**: How does Syncstation differentiate from competitors?
- **Strategic fit**: Which features strengthen Hoolsy's broader ecosystem?
- **Technical feasibility**: What can be built with available resources?
- **Business model**: Which features drive adoption and retention?

The MVP is deliberately narrow to **learn** which direction makes the most sense.

---

## Syncstation's Role in Content-to-Commerce

Syncstation extends Hoolsy's content-to-commerce vision into the **production phase**:

1. **Pre-Production (Workstation)**: Content structure created (projects, episodes)
2. **Production (Syncstation)**: On-set logs capture costumes, props, locations, subjects as they're filmed
3. **Post-Production (Workstation)**: Editors use on-set logs for continuity, subject verification
4. **Subject Verification (Workstation)**: Verified subjects linked to Subject Registry
5. **Product Linking (Marketplace)**: Vendors link products to verified subjects (e.g., "Walter White's Hat")
6. **Publishing (Consumer App)**: Products become shoppable via ultrasound sync
7. **Analytics (Nexus)**: Track which on-set logs led to verified subjects, which subjects drove sales

**Syncstation's value**: Captures metadata **while it's happening**, reducing post-production guesswork and improving subject verification accuracy.

**Example end-to-end:**
1. Costume designer logs "Walter White's Hat" on set (Syncstation)
2. Photo of hat synced to Workstation, linked to Episode 3
3. Subject enrichment specialist in Workstation verifies "Walter White's Hat" as subject
4. Vendor links "Pork Pie Hat" product to subject (Marketplace)
5. Consumer watches Breaking Bad on Netflix, syncs via ultrasound (Consumer App)
6. "Pork Pie Hat" appears as shoppable product
7. Consumer purchases hat
8. Nexus tracks: On-set log → Subject → Product → Sale (full content-to-commerce loop)

Without Syncstation, step 1 would be manual post-production work (reviewing footage, guessing context, reconstructing continuity). Syncstation captures it in real-time.

---

## Summary: MVP First, Vision Later

### What Syncstation MVP Is
A **mobile field logging tool** for production crews that:
- Captures notes and media (photos, videos, files) on set
- Links entries to specific episodes/scenes in Workstation
- Works offline and syncs when network available
- Provides simple, fast logging (under 30 seconds per entry)

**Target users**: Costume, props, makeup, script supervisors
**Core value**: Solves the problem of lost notes, disorganized photos, and missing continuity info

### What Syncstation Could Become
A **comprehensive production companion platform** with:
- Script management and scene breakdowns
- Budgeting and cost tracking
- Logistics and crew management
- AI-assisted workflows and subject tagging
- Research and reference libraries
- External tool integrations

**But**: These are **possible future directions**, not committed features. The MVP intentionally excludes all of this complexity to focus on validating the core field logging workflow first.

### Why This Matters
**For students and developers reading this documentation:**

This document mixes MVP (what's being built) with vision (what could be built). When working on Syncstation:
- Focus on the **MVP sections** for current implementation
- Treat **Future Vision sections** as exploratory ideas, not requirements
- Ask your team which features are actually prioritized
- Don't assume everything in this document will be built

**The MVP is intentionally narrow to prove one thing works extremely well before adding complexity.**
