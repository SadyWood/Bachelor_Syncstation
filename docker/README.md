# Docker Development Stack

PostgreSQL development environment for Syncstation - powered by Docker Compose.

## Overview

The Docker stack provides a local PostgreSQL database for development with three databases:

- **PostgreSQL** - Primary relational database (users, workstation, syncstation)

## Quick Start

### Prerequisites

- **Docker Desktop** installed and running
- **pnpm** package manager

### Start Database

```bash
# From monorepo root
pnpm docker:up

# Or directly with Docker Compose
cd docker
docker compose up -d
```

### Stop Database

```bash
pnpm docker:down

# Or
docker compose down
```

### Reset (Wipe All Data)

```bash
# WARNING: Destroys all database data!
pnpm docker:reset

# Or
docker compose down -v
```

### View Logs

```bash
# View logs
pnpm docker:logs

# Or
docker compose logs sync-postgres

# Follow logs
docker compose logs -f sync-postgres
```

## Database Service

### PostgreSQL (port 5432)

**Primary relational database** for structured data.

**Databases:**
- `users` - User accounts, authentication, tenants, roles
- `workstation` - Content nodes, project hierarchy
- `syncstation` - Log entries, media, sync status, offline queue

**Access:**
- **Host**: `localhost:5432`
- **User**: `postgres` (admin), `svc_users`, `svc_workstation`, `svc_syncstation` (services)
- **Password**: Set via `.env` (`POSTGRES_PASSWORD`)

**Connection strings:**
```bash
# Admin (for migrations)
postgres://postgres:password@localhost:5432

# Service connections (API runtime)
postgres://svc_users:password@localhost:5432/users
postgres://svc_workstation:password@localhost:5432/workstation
postgres://svc_syncstation:password@localhost:5432/syncstation
```

**GUI clients:**
- DBeaver
- pgAdmin
- Postico (Mac)
- TablePlus

## Configuration

### Environment Variables

All database credentials are configured via `.env` in the **monorepo root**.

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**PostgreSQL:**
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me_password

ADMIN_DATABASE_CONNECTION=postgres://postgres:postgres@localhost:5432
USERS_DB_URL=postgres://svc_users:change-this-svc-users@localhost:5432/users
WORKSTATION_DB_URL=postgres://svc_workstation:change-this-svc-workstation@localhost:5432/workstation
SYNCSTATION_DB_URL=postgres://svc_syncstation:change-this-svc-syncstation@localhost:5432/syncstation
```

## Data Persistence

All database data is stored in Docker volumes for persistence across restarts:

- `sync_postgres_data` - PostgreSQL data

**Inspect volumes:**
```bash
docker volume ls | grep syncstation
```

**Remove all volumes (destroy data):**
```bash
docker compose down -v
```

## Initialization

### PostgreSQL Bootstrap

On first run, PostgreSQL executes scripts from `docker/postgres/init/`:

1. `00-run-bootstrap.sh` - Wrapper script that executes SQL files from `packages/databases/postgres/bootstrap/`:
   - `00_cluster_bootstrap.sql` - Creates databases and service roles
   - `10_users_db.sql` - Users database schema
   - `10_workstation_db.sql` - Workstation database schema
   - `10_syncstation_db.sql` - Syncstation database schema

After bootstrap, run migrations:
```bash
pnpm db:migrate
pnpm db:seed
```

## Health Checks

PostgreSQL includes a healthcheck:

```bash
docker compose ps
```

Output shows health status:
```
NAME                IMAGE                  STATUS
sync-postgres       postgres:16-alpine     Up (healthy)
```

## Commands Reference

```bash
# Start service
pnpm docker:up              # Start PostgreSQL
docker compose up -d        # Alternative

# Stop service
pnpm docker:down            # Stop PostgreSQL
docker compose down         # Alternative

# Restart service
docker compose restart sync-postgres

# View logs
pnpm docker:logs                          # View logs
docker compose logs -f sync-postgres      # Follow PostgreSQL logs

# Reset (destroy data)
pnpm docker:reset           # Stop and remove all volumes

# Inspect
docker compose ps           # Service status
docker compose top          # Running processes
docker volume ls            # List volumes

# Execute commands in container
docker compose exec sync-postgres psql -U postgres
```

## Troubleshooting

### Port Already in Use

If port 5432 is already occupied:

```bash
# Find process using port
lsof -i :5432  # Mac/Linux
netstat -ano | findstr :5432  # Windows

# Kill process or change port in .env
POSTGRES_PORT=5433
```

### Container Won't Start

```bash
# Check logs
docker compose logs sync-postgres

# Remove and recreate
docker compose down
docker compose up -d

# Nuclear option: remove volumes
docker compose down -v
pnpm docker:up
```

### Connection Refused

Ensure:
1. Docker Desktop is running
2. Container is healthy: `docker compose ps`
3. Port is not blocked by firewall
4. Correct credentials in `.env`

### Data Disappeared

Data persists in Docker volumes. If volumes were deleted:

```bash
# Check if volumes exist
docker volume ls | grep syncstation

# If missing, reset and re-seed
pnpm docker:up
pnpm db:migrate
pnpm db:seed
```

## Development Workflow

### Typical Daily Workflow

```bash
# Morning: Start database
pnpm docker:up

# Start API and apps
pnpm dev:api
# ... start other apps as needed

# Work on features...

# Evening: Stop database (data persists)
pnpm docker:down
```

### After Schema Changes

```bash
# 1. Update Drizzle schema
# Edit packages/databases/postgres/src/schema/syncstation/schema.ts

# 2. Generate migration
pnpm db:generate:syncstation

# 3. Run migration
pnpm db:migrate:syncstation

# 4. Restart API to pick up schema changes
pnpm dev:api
```

### Clean Slate

```bash
# Nuclear option: destroy everything and rebuild
pnpm docker:reset
pnpm docker:up
pnpm db:migrate
pnpm db:seed
```

## Architecture

PostgreSQL database hosts three separate databases optimized for different concerns:

**users** - Multi-tenant user management:
- User accounts, authentication
- Tenants (production companies)
- Roles and permissions (RBAC)

**workstation** - Content hierarchy:
- Content nodes (root, group, episode, scene)
- Project structure and organization
- Metadata for production assets

**syncstation** - On-set logging:
- Log entries from field
- Media attachments (images, videos, files)
- Sync status tracking
- Offline queue management

## Related Documentation

- [Database Schemas](../packages/databases/postgres/README.md)
- [API Backend](../apps/api/README.md)
- [Environment Configuration](../.env.example)
