# HK26 Syncstation App

A mobile application for on-set logging and data capture during video production. Built with React Native and Expo.

---

## What is Syncstation?

Syncstation is an **offline-first companion app** for production teams on set. It allows crew members to:
- Log events, actions, and observations while filming
- Capture media (photos, videos, audio) linked to specific scenes
- Organize data by project, episode, scene hierarchy
- Sync data to the cloud when connectivity is available
- Work completely offline during production

This repository is part of the HK26 student project series.

---

## Tech Stack

### Mobile App
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **React Navigation** - Screen navigation
- **TanStack Query** - Data fetching and caching
- **Offline-first architecture** - Local storage with background sync

### Backend API
- **Fastify** - Fast HTTP server
- **Drizzle ORM** - Type-safe database access
- **JWT** - Token-based authentication
- **PostgreSQL** - Database (3 separate databases)

### Shared
- **Zod** - Runtime validation and TypeScript type inference
- **pnpm** - Monorepo package management
- **Docker** - PostgreSQL containerization

---

## Quick Start

**For detailed setup instructions, see [SETUP.md](./SETUP.md).**

**Prerequisites:**
- Node.js 20+
- pnpm 8+
- Docker Desktop
- Expo Go on your phone

**Setup:**

```bash
# Clone and enter the project
git clone <repository-url>
cd hk26-syncstation-app

# Copy environment file
cp .env.example .env

# Install, start Docker, and initialize databases
pnpm install
pnpm docker:up
pnpm db:reset
```

**Development:**

```bash
# Start API (Terminal 1)
pnpm dev:api

# Start mobile app (Terminal 2)
pnpm dev:app
```

Then scan the QR code with Expo Go.

---

## Project Structure

```
hk26-syncstation-app/
├── apps/
│   ├── api/                      # Backend API (Fastify)
│   └── syncstation-app/          # Mobile app (React Native + Expo)
├── packages/
│   ├── databases/postgres/       # Database schemas, migrations, seed data
│   └── schema/                   # Shared Zod schemas (API contracts)
├── docker/                       # Docker Compose for PostgreSQL
├── postman/                      # API testing collection
└── documents/                    # Guides and documentation
```

---

## Databases

The app uses **three PostgreSQL databases**:

| Database | Purpose | Source |
|----------|---------|--------|
| `user` | Multi-tenant authentication, users, tenants, roles | Hoolsy-platforms (read-only) |
| `workstation` | Content nodes, project hierarchy (root → group → episode → scene) | Hoolsy-platforms (read-only) |
| `syncstation` | App-specific data: log entries, media URLs, sync status | This repo (full access) |

**Important:**
- `user` and `workstation` databases are **read-only** copies from hoolsy-platforms
- Only `syncstation` database can be modified by this app
- Multi-tenant architecture: all data isolated per tenant (production company)

---

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API and mobile app together |
| `pnpm dev:api` | Start only the API |
| `pnpm dev:app` | Start only the mobile app |
| `pnpm docker:up` | Start PostgreSQL container |
| `pnpm docker:down` | Stop PostgreSQL container |
| `pnpm db:reset` | Reset databases and re-seed |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm typecheck` | Check TypeScript types |
| `pnpm lint` | Run ESLint |

---

## Demo Data

After running `pnpm db:seed`, the database contains:

**Users (multi-tenant):**
- Production companies (tenants)
- Users with different roles (admin, editor, viewer)

**Content Hierarchy:**
- Projects (root nodes)
- Groups (seasons, collections)
- Episodes
- Scenes

**Syncstation Log Data:**
- Example log entries
- Media references (photos, videos)
- Sync status examples (local, pending, synced, failed)

See [packages/databases/postgres/src/seed-data/README.md](packages/databases/postgres/src/seed-data/README.md) for details.

---

## Documentation

### Setup & Guides

| Document | Description |
|----------|-------------|
| [SETUP.md](./SETUP.md) | Step-by-step setup guide with tool explanations |
| [documents/guides/type-safety-from-database-to-frontend.md](documents/guides/type-safety-from-database-to-frontend.md) | How to extend the database and maintain type safety |
| [packages/databases/postgres/src/seed-data/README.md](packages/databases/postgres/src/seed-data/README.md) | How to add demo data |

### Hoolsy Platform Documentation

| Document | Description |
|----------|-------------|
| [documents/hoolsy-platforms/README.md](documents/hoolsy-platforms/README.md) | Overview of all Hoolsy platforms and their relationships |
| [documents/hoolsy-platforms/consumer-app.md](documents/hoolsy-platforms/consumer-app.md) | Consumer App platform specification |
| [documents/hoolsy-platforms/marketplace.md](documents/hoolsy-platforms/marketplace.md) | Marketplace platform overview |
| [documents/hoolsy-platforms/marketplace-storefront.md](documents/hoolsy-platforms/marketplace-storefront.md) | Marketplace Storefront specification |
| [documents/hoolsy-platforms/marketplace-vendors.md](documents/hoolsy-platforms/marketplace-vendors.md) | Marketplace Vendors specification |
| [documents/hoolsy-platforms/nexus.md](documents/hoolsy-platforms/nexus.md) | Nexus platform specification |
| [documents/hoolsy-platforms/syncstation.md](documents/hoolsy-platforms/syncstation.md) | Syncstation platform specification |
| [documents/hoolsy-platforms/workstation.md](documents/hoolsy-platforms/workstation.md) | Workstation platform specification |

### Claude Code Skills

This project includes custom Claude Code skills for common tasks:

| Skill | Command | Description |
|-------|---------|-------------|
| Code Quality Check | `/code-quality-check` | Run typecheck + eslint, enforces fixing issues |
| Hoolsy Context | `/hoolsy-context` | Understand Hoolsy's platform ecosystem and architecture |
| Postman Update | `/postman-update` | Update Postman collections after adding new API endpoints |
| Skill Writer | `/skill-writer` | Guide for creating new Agent Skills |
| Type Safety Schema | `/type-safety-schema` | Enforce type safety and schema centralization |
| useEffect vs useSWR | `/useeffect-vs-useswr` | Guide for choosing between useEffect and useSWR |

See [.claude/skills/index.md](.claude/skills/index.md) for full documentation.

### GitHub Copilot Instructions

If you use GitHub Copilot, install the Hoolsy coding standards:

1. Open VS Code settings (Ctrl+,)
2. Search for "GitHub Copilot: Prompt Instructions"
3. Copy contents from [.github/instructions/hoolsy.instructions.md](.github/instructions/hoolsy.instructions.md)
4. Paste into the prompt instructions field

This ensures Copilot follows Hoolsy's coding conventions, architecture patterns, and best practices.

---

## API Testing

Import the Postman collection from `postman/` folder:

1. Open Postman
2. Click **Import** → **Folder** → Select `postman/`
3. Set environment to **Syncstation-Local**
4. Start with **Health Check** to verify the API is running

For detailed Postman usage and authentication flow, see [postman/README.md](postman/README.md).

---

## Support

**Contact:** Mathias Haslien ([mathias@hoolsy.com](mailto:mathias@hoolsy.com))

---

## License

Private repository for Hoolsy student teams.
