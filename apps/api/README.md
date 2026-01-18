# @workstation/api

Backend API for Hoolsy Workstation - a Fastify-based REST API with JWT authentication, multi-tenancy, and role-based access control (RBAC).

## Overview

The Workstation API provides:

- **Authentication** - JWT-based auth with refresh tokens stored in httpOnly cookies
- **Multi-tenancy** - Tenant isolation with `x-ws-tenant` header
- **RBAC** - Fine-grained permission system with roles (allow/deny lists)
- **Content Management** - Hierarchical content tree (projects → folders → content nodes)
- **Media Management** - Upload, store, and stream video/audio/image files with metadata extraction
- **User Management** - User invitations, memberships, and tenant access control

## Tech Stack

- **Fastify** - High-performance web framework
- **TypeScript** - Type-safe API development
- **Zod** - Runtime type validation with `fastify-type-provider-zod`
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Multi-database setup (users, workstation, marketplace)
- **JWT** - Access tokens (short-lived) + refresh tokens (long-lived)
- **ffprobe** - Automatic media metadata extraction (duration, codecs, dimensions)

## Project Structure

```
apps/api/
├── src/
│   ├── config/          # Environment configuration
│   ├── lib/             # Utilities (media metadata extraction)
│   ├── plugins/         # Fastify plugins
│   ├── repos/           # Database repositories (data access layer)
│   ├── routes/          # API route handlers
│   │   ├── auth.ts      # /auth/* - Login, register, refresh, invite
│   │   ├── ws.ts        # /ws - Workstation base routes
│   │   ├── ws.content.ts    # /ws/projects, /ws/nodes
│   │   ├── ws.media.ts      # /ws/media/* - Upload & streaming
│   │   ├── ws.members.ts    # /ws/members - Tenant members
│   │   ├── ws.roles.ts      # /ws/roles - RBAC roles
│   │   └── ...
│   ├── services/        # Business logic
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── db.ts            # Database connection pools
│   └── server.ts        # Fastify app entry point
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker Desktop (for databases)
- PostgreSQL (via Docker or local)

### Installation

From the **monorepo root**:

```bash
# Install dependencies
pnpm install

# Start databases
pnpm docker:up

# Run migrations
pnpm --filter @hoolsy/databases migrate:workstation
pnpm --filter @hoolsy/databases migrate:users

# Seed setup data (permissions, default roles)
pnpm --filter @hoolsy/databases seed:setup
```

### Development

```bash
# Start dev server with hot reload
pnpm --filter @workstation/api dev

# Or from this directory
cd apps/api
pnpm dev
```

The API will be available at `http://localhost:3333`.

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database connections
USERS_DB_URL=postgres://svc_users:password@localhost:5432/users
WORKSTATION_DB_URL=postgres://svc_workstation:password@localhost:5432/workstation
MARKETPLACE_DB_URL=postgres://svc_marketplace:password@localhost:5432/marketplace

# Auth secrets
JWT_SECRET=<your-secret-32-chars-minimum>
COOKIE_SECRET=<your-secret-32-chars-minimum>

# Runtime
NODE_ENV=development
PORT=3333
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
```

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login with email/password, returns access token + refresh cookie |
| POST | `/auth/register` | Register new user from invite token |
| POST | `/auth/refresh` | Refresh access token using httpOnly cookie |
| GET | `/auth/me` | Get current user info and permissions |
| GET | `/auth/invite/:token` | Preview invite details |

### Workstation (`/ws/*`)

All `/ws/*` routes require:
- **Authorization**: `Bearer <accessToken>`
- **x-ws-tenant**: `<tenantId>` header

#### Content Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ws/projects` | List all projects |
| POST | `/ws/projects` | Create new project |
| GET | `/ws/projects/:id` | Get project details |
| PATCH | `/ws/projects/:id` | Update project |
| DELETE | `/ws/projects/:id` | Delete project |
| GET | `/ws/projects/:id/tree` | Get full project tree |
| POST | `/ws/nodes` | Create content node |
| GET | `/ws/nodes/:id` | Get node details |
| PATCH | `/ws/nodes/:id` | Update node |
| DELETE | `/ws/nodes/:id` | Delete node |
| POST | `/ws/nodes/:id/move` | Move node to new parent |
| POST | `/ws/nodes/reorder` | Reorder siblings |

#### Media Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ws/nodes/:nodeId/media/init` | Initialize upload session |
| POST | `/ws/media/:uploadId/upload` | Upload file (multipart/form-data) |
| POST | `/ws/media/:uploadId/complete` | Finalize upload, extract metadata |
| GET | `/ws/nodes/:nodeId/media` | Get media for node |
| GET | `/ws/media/:assetId/stream` | Stream media (supports Range requests) |
| DELETE | `/ws/media/:assetId` | Delete media asset |

**Media Upload Flow:**

```bash
# 1. Init upload
POST /ws/nodes/{nodeId}/media/init
{
  "filename": "video.mp4",
  "mimeType": "video/mp4",
  "sizeBytes": 5242880
}
# Returns: { uploadId: "..." }

# 2. Upload file
POST /ws/media/{uploadId}/upload
Content-Type: multipart/form-data
Body: file=<binary>

# 3. Complete (extracts metadata automatically)
POST /ws/media/{uploadId}/complete
{}
# Returns: { asset: { mediaAssetId, durationMs, width, height, frameRate, ... } }
```

#### RBAC & Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ws/members` | List tenant members |
| POST | `/ws/invite` | Invite user to tenant |
| POST | `/ws/members/:userId/deactivate` | Deactivate member |
| GET | `/ws/roles` | List roles |
| POST | `/ws/roles` | Create role |
| GET | `/ws/roles/:id` | Get role details |
| PATCH | `/ws/roles/:id` | Update role permissions |
| DELETE | `/ws/roles/:id` | Delete role |
| GET | `/ws/permissions/catalog` | Get all available permissions |

## Permission System

The API uses a fine-grained RBAC system with wildcard support:

### Permission Format

```
domain.resource.action
```

Examples:
- `content.view` - View content
- `content.create` - Create content
- `content.media.upload` - Upload media
- `admin.roles.*` - All role management actions
- `admin.*` - All admin actions

### Role Structure

```json
{
  "roleId": "uuid",
  "name": "Editor",
  "scope": "tenant",
  "allow": ["content.*", "content.media.upload"],
  "deny": ["content.delete"]
}
```

Deny rules override allow rules.

### Global Roles

- **owner** - Full access to everything
- **admin** - Administrative access (manage users, roles, permissions)
- **member** - Basic content access

## Media Metadata Extraction

When media is uploaded, the API automatically extracts:

**Video:**
- Duration (milliseconds)
- Dimensions (width × height)
- Frame rate
- Video codec
- Audio codec, channels, sample rate
- Flags: `hasVideo`, `hasAudio`

**Audio:**
- Duration, codec, channels, sample rate
- Bit rate

**Images:**
- Dimensions, format, color space
- DPI, orientation, EXIF data

Metadata is extracted using **ffprobe** during the `/complete` step.

## Streaming

The `/ws/media/:assetId/stream` endpoint supports:

- **Range requests** - For video seeking (HTTP 206 Partial Content)
- **Query-based auth** - `?token=<jwt>&tenant=<id>` for HTML5 `<video>` elements (can't send headers)
- **Download mode** - `?download=true` sets `Content-Disposition: attachment`

Example:
```html
<video src="/ws/media/{assetId}/stream?token={jwt}&tenant={tenantId}" controls></video>
```

## Database Schema

The API uses 3 PostgreSQL databases:

1. **users** - User accounts, credentials, refresh tokens
2. **workstation** - Tenants, content, media, roles, memberships
3. **marketplace** - (Future) Marketplace functionality

See [packages/databases/postgres/](../../packages/databases/postgres/) for schema details.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "ok": false,
  "code": "ERROR_CODE",
  "message": "Human-readable error message"
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `TENANT_HEADER_MISSING` - x-ws-tenant header required
- `TENANT_MISMATCH` - User doesn't have access to tenant
- `NODE_NOT_FOUND` - Content node doesn't exist
- `MEDIA_ALREADY_EXISTS` - Node already has media

## Testing

Use the Postman collection in [postman/](../../postman/) for API testing.

```bash
# Import collection
postman/Hoolsy-Workstation-API.postman_collection.json

# Import environment
postman/Hoolsy-Local.postman_environment.json
```

See [postman/README.md](../../postman/README.md) for usage instructions.

## Commands

```bash
# Development
pnpm dev              # Start with hot reload

# Build & Type Checking
pnpm build            # Compile TypeScript
pnpm typecheck        # Run TypeScript compiler

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
```

## Related Documentation

- [Database Schema](../../packages/databases/postgres/README.md)
- [Shared Schemas](../../packages/schema/README.md)
- [Logger Package](../../packages/logger/README.md)
- [Postman Collection](../../postman/README.md)
- [Docker Setup](../../docker/README.md)
