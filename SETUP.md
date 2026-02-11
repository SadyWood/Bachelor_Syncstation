# Setup Guide

How to get the project running locally. Start with the automated setup — fall back to manual steps if needed.

---

## Prerequisites

- **Node.js 20+** and **pnpm 9+**
- **Docker Desktop** — [Download here](https://www.docker.com/products/docker-desktop/)

Make sure Docker Desktop is running before you start (check the system tray / menu bar icon).

### Port requirements

| Port | Service |
|------|---------|
| 5432 | PostgreSQL |
| 3333 | API server |
| 5173 | Workstation web (if running) |
| 8081 | Syncstation mobile (Expo dev server) |

---

## Quick Start (Recommended)

One command handles everything: dependencies, build, Docker, migrations, permissions, and seeding.

### Windows (PowerShell)

```powershell
.\setup.ps1
```

### Mac / Linux

```bash
chmod +x setup.sh   # only needed once
./setup.sh
```

### What the script does

1. Checks prerequisites (Node, pnpm, Docker running)
2. Creates `.env` from `.env.example` if missing
3. Installs dependencies (`pnpm install`)
4. Builds shared packages (`pnpm build`)
5. Starts the PostgreSQL container
6. Waits for PostgreSQL to be healthy
7. Verifies all three databases exist (`users`, `workstation`, `syncstation`)
8. Runs Drizzle migrations
9. Applies service account permissions (grants)
10. Seeds foundational data and demo data
11. Verifies the syncstation schema has correct columns

### Fresh start

If something breaks, or you want to nuke the database and start clean:

```powershell
# Windows
.\setup.ps1 -Fresh

# Mac / Linux
./setup.sh --fresh
```

This stops Docker, deletes the database volume, and re-runs everything from scratch.

### Reset (back to fresh clone)

Strips the project back to a clean `git clone` state. Removes node_modules, dist folders, Docker containers/volumes, caches, uploads, and .env. Does **not** run setup after — just cleans.

```powershell
# Windows
.\setup.ps1 -Reset

# Mac / Linux
./setup.sh --reset
```

Useful when you want to start completely over, hand the project to someone else, or reduce disk usage.

### After setup

Start the API and your app in separate terminals:

```bash
# Terminal 1 (required)
pnpm dev:api        # API → http://localhost:3333

# Terminal 2 (pick one)
pnpm dev:sync       # Syncstation mobile app (Expo)
pnpm dev:ws         # Workstation web → http://localhost:5173
```

**Login:** `admin@hoolsy.com` / `demopassword`

### Setup script troubleshooting

**"Databases still missing" error:**
The Docker init script probably has Windows line endings (CRLF). Open `docker/postgres/init/00-run-bootstrap.sh` in VS Code, click "CRLF" in the bottom status bar, select "LF", save, then run the setup with `-Fresh` / `--fresh`.

**"Migrations failed" error:**
An older migration is conflicting. Run with `-Fresh` / `--fresh` to get a clean slate.

**PowerShell execution policy error:**
Run once: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

---

## Manual Docker Setup

If you prefer step-by-step control, or the setup script doesn't work on your machine.

### 1) Install dependencies and build

```bash
pnpm install
pnpm build
```

### 2) Create .env

```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

The default values work with Docker. No edits needed.

### 3) Start databases

```bash
pnpm docker:up
```

Verify the container is running:

```bash
pnpm docker:ps
# Should show: sync-postgres  postgres:16-alpine  Up (healthy)
```

### 4) Run migrations

```bash
pnpm db:migrate
```

Creates tables in all three databases based on the Drizzle schemas in `packages/databases/postgres/src/schema/`.

### 5) Apply service account permissions

After migrations create new tables, the service accounts need grants on those tables. Pipe the bootstrap SQL files into the running container:

```powershell
# Windows (PowerShell)
Get-Content packages/databases/postgres/bootstrap/10_users_db.sql | docker exec -i sync-postgres psql -U postgres
Get-Content packages/databases/postgres/bootstrap/10_workstation_db.sql | docker exec -i sync-postgres psql -U postgres
Get-Content packages/databases/postgres/bootstrap/10_syncstation_db.sql | docker exec -i sync-postgres psql -U postgres
```

```bash
# Mac / Linux
cat packages/databases/postgres/bootstrap/10_users_db.sql | docker exec -i sync-postgres psql -U postgres
cat packages/databases/postgres/bootstrap/10_workstation_db.sql | docker exec -i sync-postgres psql -U postgres
cat packages/databases/postgres/bootstrap/10_syncstation_db.sql | docker exec -i sync-postgres psql -U postgres
```

### 6) Seed data

```bash
pnpm db:seed          # Foundational data (platforms, permissions, roles)
pnpm db:seed:demo     # Demo data (admin user, Breaking Bad project)
```

For demo seed to work, set `SEED_DEMO_OK=true` in your `.env` file first.

### 7) Start API and app

```bash
pnpm dev:api    # Terminal 1
pnpm dev:sync   # Terminal 2
```

---

## Local PostgreSQL Setup (Advanced)

For running PostgreSQL directly on your machine without Docker.

### 1) Setup

```bash
pnpm install
pnpm build
```

### 2) Configure .env

Copy `.env.example` to `.env` and update the connection strings to match your local PostgreSQL:

```env
ADMIN_DATABASE_CONNECTION=postgres://postgres:your-password@localhost:5432
USERS_DB_URL=postgres://svc_users:change-this-svc-users@localhost:5432/users
WORKSTATION_DB_URL=postgres://svc_workstation:change-this-svc-workstation@localhost:5432/workstation
SYNCSTATION_DB_URL=postgres://svc_syncstation:change-this-svc-syncstation@localhost:5432/syncstation
```

### 3) Bootstrap, migrate, and seed

```bash
pnpm db:bootstrap          # Creates databases, roles, grants
pnpm db:migrate            # Applies migrations
pnpm db:bootstrap          # Re-run to grant on new tables
pnpm db:seed               # Foundational data
pnpm db:seed:demo          # Demo data (set SEED_DEMO_OK=true in .env)
```

### 4) Start

```bash
pnpm dev:api
pnpm dev:sync
```

---

## Accessing Databases Directly

Connect with any PostgreSQL client (psql, pgAdmin, DBeaver):

```bash
# Users database
psql postgres://svc_users:change-this-svc-users@localhost:5432/users

# Workstation database
psql postgres://svc_workstation:change-this-svc-workstation@localhost:5432/workstation

# Syncstation database
psql postgres://svc_syncstation:change-this-svc-syncstation@localhost:5432/syncstation
```

Admin access: `postgres:hoolsy_dev`

---

## All Available Scripts

### Setup

| Script | Description |
|--------|-------------|
| `.\setup.ps1` | One-command setup (Windows) |
| `.\setup.ps1 -Fresh` | Nuke DB and start clean (Windows) |
| `.\setup.ps1 -Reset` | Back to fresh clone state (Windows) |
| `./setup.sh` | One-command setup (Mac/Linux) |
| `./setup.sh --fresh` | Nuke DB and start clean (Mac/Linux) |
| `./setup.sh --reset` | Back to fresh clone state (Mac/Linux) |

### Docker

| Script | Description |
|--------|-------------|
| `pnpm docker:up` | Start database container |
| `pnpm docker:down` | Stop container |
| `pnpm docker:reset` | Stop, wipe all data, restart |
| `pnpm docker:logs` | View container logs |
| `pnpm docker:ps` | Show container status |

### Database

| Script | Description |
|--------|-------------|
| `pnpm db:bootstrap` | Create DBs, roles, grants (local PG only) |
| `pnpm db:migrate` | Run all migrations |
| `pnpm db:generate` | Generate migrations for all databases |
| `pnpm db:generate:syncstation` | Generate syncstation migrations only |
| `pnpm db:generate:users` | Generate users migrations only |
| `pnpm db:generate:workstation` | Generate workstation migrations only |
| `pnpm db:rebuild` | Generate + migrate |
| `pnpm db:seed` | Seed foundational data |
| `pnpm db:seed:demo` | Seed demo data (needs SEED_DEMO_OK=true) |
| `pnpm db:test` | Test database connectivity |
| `pnpm db:nuke` | Drop all DBs and roles (**destructive**) |
| `pnpm db:wipe` | Wipe all rows (**destructive**) |

### Development

| Script | Description |
|--------|-------------|
| `pnpm dev:api` | API server → http://localhost:3333 |
| `pnpm dev:sync` | Syncstation mobile app (Expo) |
| `pnpm dev:ws` | Workstation web → http://localhost:5173 |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm lint` | Lint all files |
| `pnpm format` | Format all files (Prettier) |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage |

---

## Troubleshooting

### Docker containers won't start
Ensure Docker Desktop is running. Check if ports are in use: `pnpm docker:logs`. Try `pnpm docker:reset`.

### "Cannot find module '@hoolsy/databases'"
Run `pnpm install` to link workspace packages, then `pnpm build`.

### "Failed to fetch" on login
Ensure API is running on http://localhost:3333. Check `.env` has correct database URLs.

### "Permission denied for table log_entries"
Service account grants are missing. Re-run the bootstrap SQL files (step 5 of manual setup), or run the setup script with `-Fresh` / `--fresh`.

### Hard reset everything

```bash
# Docker setup
pnpm docker:reset
pnpm db:migrate
pnpm db:seed
pnpm db:seed:demo

# Local PostgreSQL
pnpm db:nuke
pnpm db:bootstrap
pnpm db:migrate
pnpm db:seed
pnpm db:seed:demo
```
