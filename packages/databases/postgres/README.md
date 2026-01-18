# @hoolsy/databases (PostgreSQL)

Database schemas, migrations, and seeds for Hoolsy Platforms - powered by Drizzle ORM with multi-database PostgreSQL setup.

## Overview

This package manages **three PostgreSQL databases**:

- **users** - User accounts, auth, invites, access tokens
- **workstation** - Tenants, content, media, roles, permissions, memberships
- **marketplace** - (Future) Marketplace content, purchases, licenses

All databases run via Docker Compose for consistent development environments. See [docker/](../../../docker/) for infrastructure setup.

## Architecture

### Connection Strategy

**Admin Connection** - Used by migrations and seeds (superuser privileges):
```env
ADMIN_DATABASE_CONNECTION=postgres://postgres:password@localhost:5432
```

**Service Connections** - Used by API runtime (least-privilege):
```env
USERS_DB_URL=postgres://svc_users:password@localhost:5432/users
WORKSTATION_DB_URL=postgres://svc_workstation:password@localhost:5432/workstation
MARKETPLACE_DB_URL=postgres://svc_marketplace:password@localhost:5432/marketplace
```

Drizzle (migrations/codegen/seeds) **always** uses `ADMIN_DATABASE_CONNECTION`.
Service URLs are for **API runtime only**.

## Project Structure

```
packages/databases/postgres/
├── bootstrap/                     # SQL for initial cluster setup
│   ├── 00_cluster_bootstrap.sql   # Create databases + service roles
│   ├── 10_users_db.sql            # Users DB schema
│   ├── 10_workstation_db.sql      # Workstation DB schema
│   └── 10_marketplace_db.sql      # Marketplace DB schema
├── src/
│   ├── schema/                    # Drizzle schema definitions
│   │   ├── users/schema.ts
│   │   ├── workstation/
│   │   │   ├── schema.ts
│   │   │   └── content.ts
│   │   ├── marketplace/schema.ts
│   │   └── index.ts
│   ├── seed/                      # Data seeding
│   │   ├── setup/                 # Foundational seeds (required)
│   │   │   ├── users.ts           # Platform codes
│   │   │   ├── workstation.ts     # Permissions, roles, media kinds
│   │   │   └── ws.permissions.ts  # Permission catalog
│   │   ├── demo/                  # Demo seeds (optional)
│   │   │   └── seed-demo-data.ts  # Demo invites, users
│   │   └── runners/
│   │       ├── run-setup.js       # Runs foundational seeds
│   │       └── run-demo.js        # Runs demo seeds
│   ├── scripts/                   # Management scripts
│   │   ├── bootstrap-db.ts        # Run bootstrap SQL
│   │   ├── nuke-db.ts             # Drop all databases (use with care!)
│   │   ├── test-db.ts             # Connection diagnostics
│   │   └── migrate-add-slug.ts    # One-time migration helper
│   ├── mappers.ts                 # DB-to-domain type mappers
│   └── index.ts                   # Re-exports schemas
├── migrations/                    # Generated migration files
│   ├── users/
│   │   ├── 0000_initial.sql
│   │   ├── meta/
│   │   └── _journal.json
│   ├── workstation/
│   │   ├── 0000_initial.sql
│   │   ├── 0004_add_media_metadata_fields.sql
│   │   ├── meta/
│   │   └── _journal.json
│   └── marketplace/
│       ├── 0000_initial.sql
│       ├── meta/
│       └── _journal.json
├── drizzle.config.cjs             # Drizzle Kit configuration
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- **Docker Desktop** - For PostgreSQL containers
- **pnpm** - Package manager
- **Node.js 20+**

### Installation

From the **monorepo root**:

```bash
# 1. Install dependencies
pnpm install

# 2. Start Docker databases
pnpm docker:up

# 3. Run bootstrap SQL (creates databases and roles)
pnpm --filter @hoolsy/databases bootstrap

# 4. Run migrations
pnpm --filter @hoolsy/databases migrate:users
pnpm --filter @hoolsy/databases migrate:workstation
pnpm --filter @hoolsy/databases migrate:marketplace

# OR migrate all at once:
pnpm --filter @hoolsy/databases run migrate:all

# 5. Seed foundational data
pnpm --filter @hoolsy/databases seed:setup

# 6. (Optional) Seed demo data
pnpm --filter @hoolsy/databases seed:demo
```

### Environment Variables

Copy `.env.example` to `.env` in the **monorepo root**:

```env
# PostgreSQL (Docker defaults)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_password

# Admin connection (for migrations)
ADMIN_DATABASE_CONNECTION=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}

# Service connections (for API runtime)
USERS_DB_URL=postgres://svc_users:change-this-svc-users@${POSTGRES_HOST}:${POSTGRES_PORT}/users
WORKSTATION_DB_URL=postgres://svc_workstation:change-this-svc-workstation@${POSTGRES_HOST}:${POSTGRES_PORT}/workstation
MARKETPLACE_DB_URL=postgres://svc_marketplace:change-this-svc-marketplace@${POSTGRES_HOST}:${POSTGRES_PORT}/marketplace
```

## Database Schemas

### Users Database

**Purpose:** User accounts, authentication, and platform access control.

**Tables:**
- `platforms` - Platform registry (workstation, marketplace, nexus)
- `users` - User accounts with credentials
- `user_platform_access` - Which platforms users can access
- `refresh_tokens` - JWT refresh tokens
- `invites` - User invitation tokens

**Key Concepts:**
- Users can have access to multiple platforms
- Refresh tokens support JWT authentication
- Invites have expiration dates and are single-use

### Workstation Database

**Purpose:** Content management, media, multi-tenancy, and RBAC.

**Tables:**

**Tenants & Membership:**
- `tenants` - Workspace tenants (teams/organizations)
- `ws_memberships` - User membership in tenants
- `ws_members` - Member profile data

**Content:**
- `ws_content` - Hierarchical content tree (projects, folders, content nodes)
- `ws_media_kinds` - Media type taxonomy (video, episode, audio, lesson, etc.)

**Media:**
- `ws_media_assets` - Uploaded media files with extracted metadata
  - Duration (milliseconds), dimensions, frame rate
  - Video/audio codecs, channels, sample rate
  - Image format, color space, DPI, EXIF data
  - Flags: `hasVideo`, `hasAudio`
- `ws_media_variants` - Transcoded/processed versions of media

**RBAC:**
- `ws_permissions` - Permission catalog (domain.resource.action)
- `ws_roles` - Roles with allow/deny permission lists
- `ws_role_grants` - User-role assignments

**Key Concepts:**
- Multi-tenant isolation with `tenantId` on all tables
- Hierarchical content tree with `parentId` relationships
- Wildcard permission matching (`content.*`, `admin.roles.*`)
- Role deny rules override allow rules

### Marketplace Database

**Status:** Placeholder (not yet implemented)

**Future tables:**
- Content catalog
- Purchases & licenses
- Creator profiles
- Reviews & ratings

## Migrations

### Drizzle Kit Configuration

The `drizzle.config.cjs` file uses `DB_NAME` environment variable to select which database to work with:

```js
const dbName = process.env.DB_NAME || 'workstation';

const schemaMap = {
  users: './src/schema/users/schema.ts',
  workstation: './src/schema/workstation/schema.ts',
  marketplace: './src/schema/marketplace/schema.ts',
};

const out = `./migrations/${dbName}`;
const schema = schemaMap[dbName];
```

### Generate Migrations

```bash
# Per database
pnpm gen:users            # DB_NAME=users drizzle-kit generate
pnpm gen:workstation      # DB_NAME=workstation drizzle-kit generate
pnpm gen:marketplace      # DB_NAME=marketplace drizzle-kit generate
```

This reads your Drizzle schema files and generates SQL migrations in `migrations/<db>/`.

### Run Migrations

```bash
# Per database
pnpm migrate:users        # DB_NAME=users drizzle-kit migrate
pnpm migrate:workstation
pnpm migrate:marketplace

# All databases at once
pnpm migrate:all
```

### Rebuild All (Generate + Migrate)

```bash
pnpm rebuild:all          # Generate and migrate all databases
```

## Seeding

### Foundational Seeds (Required)

Provides essential data for the platform to function:

```bash
pnpm seed:setup
```

**Users database:**
- Platform codes: `workstation`, `marketplace`, `nexus`

**Workstation database:**
- Permission catalog (200+ permissions)
- Global roles: `owner`, `admin`, `member`
- Media kinds taxonomy (video, episode, audio, lesson, etc.)
- Demo tenant: "Demo Workspace"

### Demo Seeds (Optional)

Creates demo data for testing:

```bash
# Enable demo seeding
# .env
SEED_DEMO_OK=true

pnpm seed:demo
```

**Creates:**
- Demo invite for `demo@hoolsy.test`
- Invite token (auto-generated or custom)
- 7-day expiration
- Platform target: workstation

**Optional overrides:**
```env
SEED_DEMO_OK=true
DEMO_INVITE_EMAIL=demo@hoolsy.test
DEMO_INVITE_TOKEN=customtoken123...
DEMO_INVITE_PLATFORM_ID=1
```

## Testing & Diagnostics

### Connection Test

```bash
pnpm test:db
```

Verifies:
- Admin connection to all 3 databases
- Tables exist and are accessible
- Row counts for each table

### Hard Reset

```bash
# WARNING: Destroys all databases!
pnpm nuke:db              # Drop databases, roles, and data
```

Use with care - this is a nuclear option for local development.

## Schema Examples

### Drizzle Schema Definition

```ts
// src/schema/workstation/content.ts
import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const wsContent = pgTable('ws_content', {
  nodeId: uuid('node_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  parentId: uuid('parent_id'),
  nodeType: text('node_type').notNull(), // 'project' | 'group' | 'content'
  title: text('title').notNull(),
  synopsis: text('synopsis'),
  slug: text('slug'),
  mediaKindCode: text('media_kind_code'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Media Asset with Metadata

```ts
// src/schema/workstation/schema.ts
export const wsMediaAssets = pgTable('ws_media_assets', {
  mediaAssetId: uuid('media_asset_id').primaryKey().defaultRandom(),
  nodeId: uuid('node_id').notNull(),
  tenantId: uuid('tenant_id').notNull(),

  // File info
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),

  // Storage
  storageProvider: text('storage_provider').notNull(), // 'local' | 'azure'
  storagePath: text('storage_path'),
  status: text('status').notNull(), // 'ready' | 'processing' | 'error'

  // Metadata (extracted by ffprobe)
  durationMs: integer('duration_ms'),
  width: integer('width'),
  height: integer('height'),
  frameRate: real('frame_rate'),
  videoCodec: text('video_codec'),
  audioCodec: text('audio_codec'),
  audioChannels: integer('audio_channels'),
  audioSampleRate: integer('audio_sample_rate'),

  // Flags
  hasVideo: boolean('has_video'),
  hasAudio: boolean('has_audio'),

  createdAt: timestamp('created_at').defaultNow(),
});
```

### RBAC Role

```ts
export const wsRoles = pgTable('ws_roles', {
  roleId: uuid('role_id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id'), // NULL = global role
  name: text('name').notNull(),
  scope: text('scope').notNull(), // 'global' | 'tenant'
  allow: jsonb('allow').notNull().$type<string[]>(), // ['content.*', 'admin.roles.view']
  deny: jsonb('deny').notNull().$type<string[]>(),   // ['content.delete']
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

## Commands Reference

```bash
# Bootstrap
pnpm bootstrap         # Run bootstrap SQL (first-time setup)
pnpm nuke              # Drop all databases (dangerous!)

# Migrations
pnpm gen:users         # Generate users migrations
pnpm gen:workstation   # Generate workstation migrations
pnpm gen:marketplace   # Generate marketplace migrations
pnpm migrate:users     # Run users migrations
pnpm migrate:workstation
pnpm migrate:marketplace
pnpm migrate:all       # Migrate all databases
pnpm rebuild:all       # Generate + migrate all

# Seeding
pnpm seed:setup        # Foundational data (required)
pnpm seed:demo         # Demo data (optional, needs SEED_DEMO_OK=true)

# Diagnostics
pnpm test:db           # Test connections + table counts
```

## Troubleshooting

### No Schema Changes Detected

- Verify you edited the correct schema file: `src/schema/<db>/schema.ts`
- Ensure file is saved
- Check Drizzle config points to correct schema path

### Permission Errors During Seeds

- Ensure `ADMIN_DATABASE_CONNECTION` is set
- Seeds run as admin user with superuser privileges
- Service connections (`svc_users`, etc.) don't have permission to seed

### DBeaver Shows Stale Tables

- Right-click connection → **Invalidate/Reload**
- Refresh both connection and schema
- DBeaver caches aggressively

### Migration Conflicts

- Check `migrations/<db>/meta/_journal.json` for history
- Drizzle tracks applied migrations
- Delete migration files to regenerate (only in local development!)

## Typical Local Workflow

```bash
# One-time setup
pnpm docker:up              # Start Docker databases
pnpm --filter @hoolsy/databases bootstrap
pnpm --filter @hoolsy/databases migrate:all
pnpm --filter @hoolsy/databases seed:setup
pnpm --filter @hoolsy/databases seed:demo   # Optional

# Daily development
pnpm docker:up              # Start databases if stopped
pnpm --filter @hoolsy/databases test:db     # Verify connection

# After schema changes
pnpm --filter @hoolsy/databases gen:workstation
pnpm --filter @hoolsy/databases migrate:workstation

# Hard reset (if things go wrong)
pnpm --filter @hoolsy/databases nuke
# Then repeat one-time setup
```

## Related Documentation

- [Docker Setup](../../../docker/README.md)
- [API Backend](../../../apps/api/README.md)
- [Shared Schemas](../../schema/README.md)
