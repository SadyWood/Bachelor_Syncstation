# HK26 Syncstation Monorepo

Welcome to the **HK26 project repository**. This monorepo contains the full Hoolsy Platforms stack, including:

- **Syncstation** - Mobile-first field logging system (React Native + Expo)
- **Workstation** - Web-based content management and timeline editor (React + Vite)
- **API Backend** - Fastify server with multi-database architecture
- **Shared Packages** - Type-safe schemas, database ORM, logging, and components

This repo is a copy of the original `hoolsy-platforms` repository where Workstation was developed. Students can work on **Syncstation** (mobile app), **Workstation** (web app), or both - the choice is yours.

If you're setting up the project for the first time, **start with [SETUP.md](./SETUP.md)**. It explains database bootstrap, seeding, and how to run the API + apps locally.
---

## What is Hoolsy?

Hoolsy is building a **"media-to-commerce" engine** that makes content shoppable in real-time. When users watch films, series, podcasts, or livestreams, the system identifies relevant subjects (people, products, places) and makes them explorable and purchasable. This requires AI-detected subjects to be verified, structured, and quality-controlled before reaching end users.

### Workstation: The Editorial Control Center

**Workstation** is where raw AI results become clean, verified, production-ready data. Think of it as the newsroom and quality control hub combined.

**What Workstation does:**

- **Verify AI detections** - AI tags subjects in media, but humans verify, correct, and approve before data goes live
- **Timeline precision** - Link subjects to exact moments in content ("jacket appears 12:03-12:27 in this scene")
- **Collaborative workflow** - Tasks, comments, status tracking, and role-based access control for team collaboration
- **Hierarchical permissions** - Grant access at series, season, episode, or project level for secure multi-team workflows

**The Workstation flow (3 steps):**

1. **Ingest** - Import media + reference data (with pointers to AI training materials in data lake via Subject Registry)
2. **Enrich & verify** - Human review and approval of AI-detected subjects
3. **Export** - Push clean datasets to optimized subject databases (document, graph, time-series) for end-user applications

**Analogy:** Workstation is like an editing suite + fact-checking desk + logistics hub before final publication.

### Marketplace: The Commerce Platform

**Marketplace** (development not yet started) will be the seller-facing platform where brands and vendors:

- Manage product catalogs, descriptions, and pricing
- Run campaigns and control inventory status
- Link products to subjects, so they appear when users discover relevant content

**How they work together:**

- **Workstation** ensures "what's in the scene" is accurate (subjects, timeline, relationships, metadata)
- **Marketplace** ensures "what can be purchased" is available (products, sellers, pricing)
- Both share a unified subject identity system (via Subject Registry) and polyglot storage for subject data

---

## Tech Stack

- **TypeScript** (workspace-wide)
- **Mobile (Syncstation)**: React Native + Expo
- **Web (Workstation)**: React 19 + Vite + TailwindCSS
- **API**: Node.js (Fastify), TypeScript, Zod validation
- **Database**: PostgreSQL + Drizzle ORM (migrations + seeding)
- **Package manager**: pnpm (workspaces/monorepo)

### Databases (multi-DB architecture)

- `users` – User accounts, authentication, platform access (shared)
- `workstation` – Projects, content nodes, media (Workstation team, read-only for Syncstation)
- `syncstation` – Log entries and attachments (Syncstation team)

> **Important**: Each team has their own database but shares access to `users` for authentication and `workstation` for content references. The repo includes scripts to bootstrap roles/DBs and refresh grants. Always read **SETUP.md** for the authoritative steps.

---

## Repository Structure

```
.
├─ apps/
│  ├─ api/                  # API server (Fastify + Zod validation)
│  │                        # - Auth endpoints (/auth/*)
│  │                        # - Workstation endpoints (/ws/*)
│  │                        # - Syncstation endpoints (/syncstation/*)
│  ├─ syncstation-app/      # React Native mobile app (Expo)
│  ├─ workstation-web/      # React web app for Workstation (Vite + Tailwind)
│  └─ marketplace-web/      # (Future) Marketplace web app
│
├─ packages/
│  ├─ databases/postgres/   # PostgreSQL schemas and migrations
│  │  ├─ src/
│  │  │  ├─ schema/         # Drizzle ORM schemas
│  │  │  │  ├─ users/       # Users database schema
│  │  │  │  ├─ workstation/ # Workstation database schema
│  │  │  │  └─ syncstation/ # Syncstation database schema
│  │  │  └─ scripts/        # Seed and bootstrap scripts
│  │  ├─ migrations/        # Generated migration files per database
│  │  └─ bootstrap/         # SQL scripts for database initialization
│  ├─ schema/               # Shared Zod schemas & TypeScript types (@hk26/schema)
│  │  ├─ src/
│  │  │  ├─ auth/           # Auth request/response schemas
│  │  │  ├─ workstation/    # Workstation API schemas
│  │  │  └─ syncstation/    # Syncstation API schemas
│  ├─ logger/               # Environment-aware structured logging (@hoolsy/logger)
│  └─ timeline/             # Custom timeline component (@hoolsy/timeline)
│
├─ docker/                  # Docker Compose setup
│  ├─ docker-compose.yml    # PostgreSQL container definition
│  └─ README.md             # Docker setup instructions
│
├─ postman/                 # Postman API collection
│  ├─ HK26-API.postman_collection.json
│  └─ HK26-Local.postman_environment.json
│
├─ .env.example             # Template env file; copy to .env and edit
├─ pnpm-workspace.yaml      # Monorepo workspace configuration
├─ package.json             # Root scripts (db:*, dev:*, docker:* helpers)
├─ SETUP.md                 # **Start here** for local setup
└─ README.md                # This file
```

### `apps/syncstation-app/` (React Native + Expo)
- **Mobile-first field logging** - Record observations, tasks, and notes in the field
- **Offline support** - Local SQLite storage with background sync
- **Media capture** - Take photos/videos and attach to log entries
- **Content linking** - Link logs to specific content nodes from Workstation
- **Expo Router** - File-based routing for React Native

### `apps/workstation-web/` (React)
- **Content management** - Projects, seasons, episodes, media
- **Timeline editor** - Frame-accurate video editing and subject tagging
- **Team collaboration** - Tasks, permissions, role-based access
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing
- **Widget system** - Customizable dashboard with `react-grid-layout`

### `apps/api/` (Fastify + TypeScript)
- **Multi-database architecture** - Separate connections to users, workstation, syncstation DBs
- **Type-safe validation** - Zod schemas for all requests/responses
- **JWT authentication** - Access tokens + httpOnly refresh cookies
- **Multi-tenancy** - Tenant isolation via `x-ws-tenant` header
- **Permission system** - Role-based access control (RBAC)

### `packages/databases/`
- **Drizzle ORM** - Type-safe database schemas and queries
- **Multi-DB migrations** - Separate migration folders for each database
- **Bootstrap scripts** - SQL scripts to create databases, roles, and grants
- **Seed scripts** - Foundational data (platforms, permissions) and demo data

### `packages/schema/` (@hk26/schema)
- **Single source of truth** - All API contracts defined here
- **Zod validation** - Runtime type checking and validation
- **Type inference** - TypeScript types derived from Zod schemas
- **Shared across API + apps** - Ensures consistency

---

## Scripts (root)

```bash
# Install dependencies
pnpm install

# Docker (recommended)
pnpm docker:up      # Start PostgreSQL container
pnpm docker:down    # Stop container
pnpm docker:reset   # Wipe data and restart
pnpm docker:ps      # Show container status
pnpm docker:logs    # View container logs

# Database lifecycle
pnpm db:bootstrap   # Create DBs + roles + grants (local PostgreSQL only)
pnpm db:generate    # Generate migrations for all databases
pnpm db:migrate     # Apply migrations to all databases
pnpm db:rebuild     # Generate + migrate (one command)
pnpm db:seed        # Seed foundational data (platforms, permissions, etc.)
pnpm db:seed:demo   # Seed demo data (admin user, Breaking Bad project)
pnpm db:test        # Test database connectivity
pnpm db:nuke        # **DANGER**: Drop all databases and roles

# Generate/migrate specific databases
pnpm db:generate:users        # Generate users DB migrations
pnpm db:generate:workstation  # Generate workstation DB migrations
pnpm db:generate:syncstation  # Generate syncstation DB migrations
pnpm db:migrate:users         # Migrate users DB
pnpm db:migrate:workstation   # Migrate workstation DB
pnpm db:migrate:syncstation   # Migrate syncstation DB

# Run services
pnpm dev:api        # API server → http://localhost:3333
pnpm dev:ws         # Workstation web → http://localhost:5173
pnpm dev:sync       # Syncstation mobile app → Expo dev server

# Build & validation
pnpm build          # Build all packages
pnpm typecheck      # Type-check all packages
pnpm lint           # Lint all packages
```

> **Quick start:** `pnpm install` → follow [SETUP.md](./SETUP.md) → `pnpm dev:api` + `pnpm dev:sync`

---

## Conventions & Best Practices

### Type Safety (type-safety-schema skill)
- **All API contracts live in `@hk26/schema`** - Never duplicate schemas between frontend and backend
- **Zod schemas are the source of truth** - TypeScript types are inferred from Zod
- **Request/response validation** - All endpoints validate with Zod schemas
- **Import from @hk26/schema** - Both API and apps import the same schemas

### Multi-Database Architecture
- **Each team owns their database** - Syncstation owns `syncstation`, Workstation owns `workstation`
- **Shared authentication** - All teams authenticate via `users` database
- **Read cross-database** - Syncstation can read from `workstation` (e.g., content_nodes)
- **Database clients in API** - `dbUsers`, `dbWs`, `dbSync` for each database

### Authentication & Multi-Tenancy
- **JWT tokens** - Access token in memory, refresh token in httpOnly cookie
- **Tenant header** - `x-ws-tenant` header required for tenant-specific operations
- **User context** - `req.jwtVerify()` returns decoded token with `sub` (userId)

### Permissions
- **Role-based access control (RBAC)** - Roles defined per tenant
- **Permission catalog** - 200+ permissions seeded in database
- **Permission decorators** - `app.needsPerm('permission.name')` for route protection

---

## Getting Started

This repository supports both **Syncstation** (mobile) and **Workstation** (web) development. Follow the path that matches your project:

### Option A: Syncstation (Mobile App Development)

Developing the mobile-first field logging system:

1. **Read and follow [SETUP.md](./SETUP.md)** to set up databases
2. Run the API server: `pnpm dev:api`
3. Run the mobile app: `pnpm dev:sync`
4. **Log in with demo user** - `admin@hoolsy.com` / `demopassword`
5. **Test API endpoints** - Use Postman collection in `postman/` folder
6. **Your API endpoints are ready:**
   - `GET /syncstation/log-entries?nodeId=xxx` - List log entries for a content node
   - `POST /syncstation/log-entries` - Create new log entry
   - `PATCH /syncstation/log-entries/:id` - Update log entry
   - `GET /syncstation/sync-status` - Get sync queue status

### Option B: Workstation (Web Development)

Developing the web-based content management system:

1. **Read and follow [SETUP.md](./SETUP.md)** to set up databases
2. Run the API server: `pnpm dev:api`
3. Run the web app: `pnpm dev:ws`
4. **Log in with admin user** - `admin@hoolsy.com` / `demopassword`
5. **Explore the features:**
   - Content Dashboard - Browse projects and episodes
   - Timeline Editor - Breaking Bad → SEASON 1 → Pilot S1.E1
   - Admin Panel - Manage team members, roles, and permissions
   - Task Management - Create and track content tasks

### Option C: Both (Full Stack)

You can run both apps simultaneously to test integration:

```bash
# Terminal 1 - API
pnpm dev:api

# Terminal 2 - Workstation web
pnpm dev:ws

# Terminal 3 - Syncstation mobile
pnpm dev:sync
```

If anything fails, check the troubleshooting section in [SETUP.md](./SETUP.md).

### Demo Video

When you run `pnpm db:seed:demo`, it creates a Breaking Bad project with seasons and episodes. Only the **Pilot episode (S1.E1)** includes actual video content - a short clip from Breaking Bad Season 1, Episode 1.

**Use this to test:**
- Video streaming with range request support
- Timeline editor with frame-accurate scrubbing
- Media playback controls
- Content preview in the dashboard

**Without the demo seed**, you'll have an empty content tree and won't be able to test media functionality.

---

## Workstation Pages & Workflow

The Workstation web app is currently under active development. Here's what's functional and how to use the system:

### Functional Pages

#### 1. **Authentication (Login/Register)**
- **Login page** - Log in with email and password (`admin@hoolsy.com` / `demopassword` for admin access)
- **Registration page** - Register new users via invite tokens (supports role-based access control)
- Token-based auth with automatic refresh and session management

#### 2. **Admin Page**
- **Member management** - View all members in your workspace, see their roles and permissions
- **Role management** - Create custom roles, assign granular permissions, and manage the permissions catalog
- **User invitations** - Invite new team members with specific roles and expiration dates
- **Multi-role support** - Users can have multiple roles simultaneously (like Discord)

**Purpose:** This is your team management hub. Use it to control who has access to what in your workspace.

#### 3. **Content Dashboard**
- **Content tree navigation** - Browse projects, series, seasons, and episodes in a hierarchical tree
- **Media preview** - Preview video content with thumbnail generation
- **Node management** - View metadata, status, and relationships for content nodes
- **Timeline integration** - Click on episodes to open the timeline editor

**Purpose:** Your content overview and navigation center. See all media in your workspace at a glance.

#### 4. **Project Structure**
- **Create projects** - Set up new content projects (films, series, podcasts)
- **Hierarchical organization** - Build season/episode structures or custom content hierarchies
- **Media ingestion** - Upload and link media files to content nodes
- **Metadata management** - Add titles, descriptions, slugs, and custom metadata

**Purpose:** Structure your content before enrichment. Think of this as your content library setup.

### The Workstation Workflow

Here's the recommended workflow for using Workstation:

**1. Team Setup (Admin Page)**
- Start by creating roles for your team (e.g., "Editor", "Reviewer", "Content Manager")
- Invite team members and assign appropriate roles
- Configure permissions to control who can do what

**2. Content Setup (Project Structure)**
- Create a new project (e.g., a TV series or film)
- Build the content hierarchy (seasons, episodes, or custom structure)
- Upload media files or link to external media storage
- Add metadata (titles, descriptions, air dates, etc.)

**3. Content Enrichment (Content Dashboard)**
- Navigate the content tree to find episodes or media nodes
- Click on a content node to open it
- Use the timeline editor to add subjects, annotations, and timecodes
- Review and verify AI-detected subjects
- Mark content as reviewed/approved when ready

**4. Quality Control & Export**
- Review enriched content in the dashboard
- Verify all subjects are correctly tagged and timed
- Export clean data to production databases when ready

### Pages Under Development

The following pages have **placeholder widgets** and are not yet fully functional:

- **Dashboard** - Will show workspace analytics and overview metrics
- **Tasks** - Task management and workflow tracking (coming soon)
- **Subjects** - Subject registry and verification interface (coming soon)
- **Media Library** - Advanced media management and search (coming soon)

These pages exist in the navigation but contain dummy widgets to demonstrate the widget system architecture. They will be fully implemented in future iterations.

### Current Limitations

- **Timeline editor** - Currently only works with the demo Breaking Bad video
- **Media upload** - Backend upload API exists but frontend integration is incomplete
- **Search** - Global search not yet implemented
- **Batch operations** - Bulk actions on content nodes coming soon
- **AI integration** - Subject detection and auto-tagging not yet connected

Despite these limitations, you can explore the core workflow: team setup → content structure → manual enrichment → export.

---

## Documentation

Detailed documentation is available for each component:

### Applications

- **[API Backend](apps/api/README.md)** - Fastify REST API with multi-database support, authentication, and RBAC
- **[Syncstation App](apps/syncstation-app/README.md)** - React Native mobile app with offline-first architecture
- **[Workstation Web](apps/workstation-web/README.md)** - React web app with timeline editor and content management
- **[Marketplace Web](apps/marketplace-web/README.md)** - Future marketplace application (scaffolding only)

### Packages

- **[Schema (@hk26/schema)](packages/schema/README.md)** - Shared Zod schemas for type-safe API contracts
- **[Databases (@hoolsy/databases)](packages/databases/postgres/README.md)** - PostgreSQL schemas, migrations, and seeding
- **[Logger (@hoolsy/logger)](packages/logger/README.md)** - Environment-aware structured logging
- **[Timeline (@hoolsy/timeline)](packages/timeline/README.md)** - Timeline editor component for video editing

### Infrastructure

- **[Docker Setup](docker/README.md)** - PostgreSQL Docker container setup

### Tools & Guides

- **[Postman Collection](postman/README.md)** - HK26 API testing collection with environment variables
- **[Setup Guide](SETUP.md)** - Complete setup instructions for first-time developers
- **[Getting Started](GETTING-STARTED.md)** - Comprehensive guide for students to understand the architecture and start coding

---

Happy hacking! 🚀
