# Hoolsy Platforms Monorepo

Welcome to the **Hoolsy** monorepo. This repository contains multiple apps and shared packages that together power the platform.
If you're setting up the project for the first time, **start with [SETUP.md](./SETUP.md)**. It explains database bootstrap,
seeding, and how to run the API + web locally.

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

## Tech stack

- **TypeScript** (workspace-wide)
- **Web (Workstation)**: React 19 + Vite + TailwindCSS
- **API**: Node.js (Fastify/Express-style), TypeScript
- **Database**: PostgreSQL + Drizzle ORM (migrations + seeding), Neo4j, MongoDB, TimescaleDB
- **Package manager**: pnpm (workspaces/monorepo)

### Databases (multi-DB)
- `users` – identities, invites, platforms, memberships
- `workstation` – tenant/org domain models for the Workstation app
- `marketplace` – reserved for Marketplace (not always required in dev)

> **Important**: The repo includes scripts to bootstrap roles/DBs and refresh grants. Always read **SETUP.md** for the authoritative steps.

---

## Repository structure

```
.
├─ apps/
│  ├─ api/                  # API server (auth, invites, me/refresh/logout, domain endpoints)
│  ├─ workstation-web/      # React web app for Workstation (Vite + Tailwind)
│  └─ marketplace-web/      # (Optional) Marketplace web app
│
├─ packages/
│  ├─ databases/            # Drizzle schemas, migrations, bootstrap SQL, seed/test scripts
│  │  ├─ src/
│  │  │  ├─ schema/         # Source-of-truth DB schemas (users/workstation/marketplace)
│  │  │  └─ scripts/        # seed-demo.ts, seed-db.ts, bootstrap-db.ts, test-db.ts, etc.
│  │  └─ migrations/        # Generated migration files per database
│  ├─ schema/               # Shared runtime types & Zod schemas used across API + web
│  └─ timeline/             # Custom timeline component package
│
├─ docker/                  # Docker Compose setup for databases
│  ├─ docker-compose.yml
│  ├─ postgres/init/        # PostgreSQL init scripts
│  ├─ neo4j/                # Neo4j configuration
│  ├─ mongo/init/           # MongoDB init scripts
│  └─ timescale/init/       # TimescaleDB init scripts
│
├─ .env-example             # Template env file; copy to .env and edit
├─ pnpm-workspace.yaml      # Monorepo package boundaries
├─ package.json             # Root scripts (db:* + dev:* helpers)
├─ SETUP.md                 # **Start here** for local setup (bootstrap, migrate, seed, run)
└─ README.md                # This file
```

### `apps/workstation-web/` (React)
- Routing: React Router
- Styling: TailwindCSS + a small design system (see `src/styles/ui.css`)
- Auth: `/auth/login`, `/auth/refresh`, `/auth/me` (access token in memory, refresh cookie via API)
- State: lightweight context (`src/state/AuthContext.tsx`)
- Widgets/Grid: `react-grid-layout` based widgets under `src/widgets/*`
- HTTP client: `src/lib/http.ts` (handles auth header + refresh on 401)

### `apps/api/` (TypeScript)
- Exposes auth endpoints and Workstation domain endpoints
- Uses Drizzle ORM for data access
- Reads DB URLs + JWT/cookie secrets from `.env`
- Seeds create platforms, permissions catalog, demo tenants/roles, etc.

### `packages/databases/`
- `bootstrap` SQL: creates databases/roles, grants privileges, enables pgcrypto
- Migrations generated via **drizzle-kit**
- Re-run **`pnpm db:bootstrap`** after migrations to ensure grants on new tables/sequences
- Clients for Neo4j, MongoDB, and TimescaleDB (for subject modeling)

### `packages/schema/`
- Shared `zod` schemas & TS types consumed by both API and web
- Keep these canonical; web & api import from here

---

## Scripts (root)

```bash
# Install deps
pnpm install

# Docker (recommended)
pnpm docker:up      # start all database containers
pnpm docker:down    # stop containers
pnpm docker:reset   # wipe data and restart

# Database lifecycle
pnpm db:bootstrap   # create/refresh DBs + roles + grants (local PG only)
pnpm db:generate    # generate migrations for all DBs
pnpm db:migrate     # apply migrations for all DBs
pnpm db:rebuild     # generate + migrate (recommended)
pnpm db:seed        # foundational seeds
pnpm db:seed:demo   # demo invite & membership (prints invite token)
pnpm db:test        # quick connectivity + table checks
pnpm db:nuke        # **danger**: drop DBs and roles

# Run services
pnpm dev:api        # API on http://localhost:3333
pnpm dev:ws         # Workstation web on http://localhost:5173
```

> Most developers can jump in with: `pnpm install` → follow **SETUP.md** → `pnpm dev:api` and `pnpm dev:ws`.

---

## Conventions & notes

- **Tenants/orgs**: The Workstation app shows the user name and current tenant in the side nav; the API returns `me.user` and `currentTenantInfo`.
- **Auth tokens**: Access token is stored in memory/session scope; refresh is httpOnly cookie (dev: not `secure`, prod: `secure`).
- **Permissions**: A wildcard-style permissions catalog is seeded; role bindings are per-tenant. Read the seeds for examples.
- **Type safety**: Shared Zod schemas live in `packages/schema`; both API and web parse/validate against them.

---

## Getting started

1. **Read and follow [SETUP.md](./SETUP.md).**
2. Run `pnpm dev:api` and `pnpm dev:ws`.
3. **Log in with admin user** - Use `admin@hoolsy.com` / `demopassword` for full access (or register with invite token for role-based testing).
4. **Test the timeline editor** - The demo seed includes a Breaking Bad Season 1, Episode 1 video clip. Navigate to Content Dashboard → Breaking Bad → SEASON 1 → Pilot S1.E1 to test video streaming and timeline editing.

If anything fails, check the *Common issues* section in **SETUP.md**.

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

Detailed documentation is available for each component of the monorepo:

### Applications

- **[API Backend](apps/api/README.md)** - Fastify-based REST API with authentication, multi-tenancy, content management, media handling, and RBAC
- **[Workstation Web](apps/workstation-web/README.md)** - React 19 frontend with widget system, timeline editor, and content management
- **[Marketplace Web](apps/marketplace-web/README.md)** - Future marketplace application (scaffolding only)

### Packages

- **[Schema](packages/schema/README.md)** - Shared TypeScript/Zod schemas for API and frontend type safety
- **[Databases](packages/databases/postgres/README.md)** - PostgreSQL schemas, Drizzle ORM, migrations, and seeding
- **[Logger](packages/logger/README.md)** - Environment-aware structured logging package
- **[Timeline](packages/timeline/README.md)** - Timeline editor component for video editing

### Infrastructure

- **[Docker](docker/README.md)** - Multi-database Docker Compose setup (PostgreSQL, Neo4j, MongoDB, TimescaleDB)

### Tools

- **[Postman Collection](postman/README.md)** - API testing collection with auto-populated variables and test scripts

---

Happy hacking! 🚀
