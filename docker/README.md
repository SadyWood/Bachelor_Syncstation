# Docker Development Stack

Multi-database development environment for Hoolsy Platforms - powered by Docker Compose.

## Overview

The Docker stack provides a complete local development environment with 4 databases:

- **PostgreSQL** - Primary relational database (users, workstation, marketplace)
- **Neo4j** - Graph database for subject relationships
- **MongoDB** - Document store for subject metadata
- **TimescaleDB** - Time-series database for subject timeline tracking

## Quick Start

### Prerequisites

- **Docker Desktop** installed and running
- **pnpm** package manager

### Start All Services

```bash
# From monorepo root
pnpm docker:up

# Or directly with Docker Compose
cd docker
docker compose up -d
```

### Stop All Services

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
# All services
pnpm docker:logs

# Specific service
docker compose logs postgres
docker compose logs neo4j
docker compose logs mongo
docker compose logs timescaledb

# Follow logs
docker compose logs -f postgres
```

## Database Services

### PostgreSQL (port 5432)

**Primary relational database** for structured data.

**Databases:**
- `users` - User accounts, authentication, invites
- `workstation` - Tenants, content, media, RBAC
- `marketplace` - (Future) Marketplace data

**Access:**
- **Host**: `localhost:5432`
- **User**: `postgres` (admin), `svc_users`, `svc_workstation`, `svc_marketplace` (services)
- **Password**: Set via `.env` (`POSTGRES_PASSWORD`)

**Connection strings:**
```bash
# Admin (for migrations)
postgres://postgres:password@localhost:5432

# Service connections (API runtime)
postgres://svc_users:password@localhost:5432/users
postgres://svc_workstation:password@localhost:5432/workstation
postgres://svc_marketplace:password@localhost:5432/marketplace
```

**GUI clients:**
- DBeaver
- pgAdmin
- Postico (Mac)
- TablePlus

### Neo4j (ports 7474, 7687)

**Graph database** for subject relationships (experimental).

**Use cases:**
- Subject relationship graph (Actor → Character, Product → Category)
- Recommendation engine
- Content discovery
- Relationship queries ("Which products appear with this actor?")

**Access:**
- **Browser UI**: `http://localhost:7474`
- **Bolt protocol**: `bolt://localhost:7687`
- **User**: `neo4j`
- **Password**: Set via `.env` (`NEO4J_PASSWORD`, default: `hoolsy_dev`)

**Example Cypher query:**
```cypher
// Find all products worn by a character
MATCH (character:Character {name: "Walter White"})-[:WORE]->(product:Product)
RETURN product.name, product.brand
```

**Plugins:**
- **APOC** (Awesome Procedures on Cypher) - Pre-installed for advanced graph algorithms

### MongoDB (port 27017)

**Document store** for flexible subject metadata.

**Use cases:**
- Subject metadata (name, aliases, images, trivia, awards)
- Flexible schema for editorial enrichment
- Full-text search on subject descriptions

**Access:**
- **Host**: `localhost:27017`
- **User**: `hoolsy`
- **Password**: Set via `.env` (`MONGO_PASSWORD`, default: `hoolsy_dev`)
- **Database**: `hoolsy_subjects`

**Connection string:**
```
mongodb://hoolsy:hoolsy_dev@localhost:27017/hoolsy_subjects?authSource=admin
```

**GUI clients:**
- MongoDB Compass
- Studio 3T
- Robo 3T

**Example document:**
```json
{
  "_id": "subject_bryan_cranston",
  "type": "person",
  "name": "Bryan Cranston",
  "aliases": ["Heisenberg"],
  "images": {
    "thumbnail": "https://...",
    "poster": "https://..."
  },
  "bio": "American actor and producer...",
  "awards": ["Emmy", "Tony", "SAG"],
  "trivia": [
    "Voiced characters in Family Guy",
    "Originally a voice actor"
  ]
}
```

### TimescaleDB (port 5433)

**Time-series database** for tracking when subjects appear in media.

**Use cases:**
- Subject timeline ("Bryan Cranston appears at 5:25, disappears at 6:28")
- "What's visible now?" queries
- Subject appearance analytics
- Timeline scrubbing in video player

**Access:**
- **Host**: `localhost:5433` (note: different port to avoid conflict with main PostgreSQL)
- **User**: `hoolsy`
- **Password**: Set via `.env` (`TIMESCALE_PASSWORD`, default: `hoolsy_dev`)
- **Database**: `hoolsy_subjects`

**Connection string:**
```
postgres://hoolsy:hoolsy_dev@localhost:5433/hoolsy_subjects
```

**Example table:**
```sql
CREATE TABLE subject_appearances (
  time TIMESTAMPTZ NOT NULL,
  content_id UUID NOT NULL,
  subject_id TEXT NOT NULL,
  start_time_ms INTEGER NOT NULL,
  end_time_ms INTEGER NOT NULL,
  confidence REAL,
  source TEXT -- 'ai' | 'manual'
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('subject_appearances', 'time');
```

**Example query:**
```sql
-- What subjects are visible at 4:23 in episode XYZ?
SELECT subject_id, start_time_ms, end_time_ms
FROM subject_appearances
WHERE content_id = 'episode-xyz'
  AND start_time_ms <= 263000  -- 4:23 = 263 seconds
  AND end_time_ms >= 263000
ORDER BY start_time_ms;
```

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

ADMIN_DATABASE_CONNECTION=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}
USERS_DB_URL=postgres://svc_users:change-this-svc-users@${POSTGRES_HOST}:${POSTGRES_PORT}/users
WORKSTATION_DB_URL=postgres://svc_workstation:change-this-svc-workstation@${POSTGRES_HOST}:${POSTGRES_PORT}/workstation
MARKETPLACE_DB_URL=postgres://svc_marketplace:change-this-svc-marketplace@${POSTGRES_HOST}:${POSTGRES_PORT}/marketplace
```

**Neo4j:**
```env
NEO4J_HOST=localhost
NEO4J_BOLT_PORT=7687
NEO4J_HTTP_PORT=7474
NEO4J_USER=neo4j
NEO4J_PASSWORD=change_me_password
NEO4J_URI=bolt://${NEO4J_HOST}:${NEO4J_BOLT_PORT}
```

**MongoDB:**
```env
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_USER=hoolsy
MONGO_PASSWORD=change_me_password
MONGO_DB=hoolsy_subjects
MONGO_URI=mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}?authSource=admin
```

**TimescaleDB:**
```env
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5433
TIMESCALE_USER=hoolsy
TIMESCALE_PASSWORD=change_me_password
TIMESCALE_DB=hoolsy_subjects
TIMESCALE_URL=postgres://${TIMESCALE_USER}:${TIMESCALE_PASSWORD}@${TIMESCALE_HOST}:${TIMESCALE_PORT}/${TIMESCALE_DB}
```

## Data Persistence

All database data is stored in Docker volumes for persistence across restarts:

- `postgres_data` - PostgreSQL data
- `neo4j_data` - Neo4j graph data
- `neo4j_logs` - Neo4j logs
- `mongo_data` - MongoDB data
- `timescale_data` - TimescaleDB data

**Inspect volumes:**
```bash
docker volume ls | grep hoolsy
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
   - `10_marketplace_db.sql` - Marketplace database schema

After bootstrap, run migrations:
```bash
pnpm --filter @hoolsy/databases migrate:all
pnpm --filter @hoolsy/databases seed:setup
```

### Neo4j, MongoDB, TimescaleDB

Custom initialization scripts can be added to:
- `docker/neo4j/init/`
- `docker/mongo/init/`
- `docker/timescale/init/`

## Health Checks

PostgreSQL includes a healthcheck:

```bash
docker compose ps
```

Output shows health status:
```
NAME                IMAGE                         STATUS
hoolsy-mongodb      mongo:7                       Up
hoolsy-neo4j        neo4j:5-community             Up
hoolsy-postgres     postgres:16-alpine            Up (healthy)
hoolsy-timescaledb  timescale/timescaledb:...     Up
```

## Commands Reference

```bash
# Start services
pnpm docker:up              # Start all services
pnpm docker:up postgres     # Start only PostgreSQL

# Stop services
pnpm docker:down            # Stop all services
pnpm docker:down postgres   # Stop only PostgreSQL

# Restart services
docker compose restart      # Restart all
docker compose restart postgres

# View logs
pnpm docker:logs            # All services
docker compose logs -f postgres  # Follow PostgreSQL logs

# Reset (destroy data)
pnpm docker:reset           # Stop and remove all volumes

# Inspect
docker compose ps           # Service status
docker compose top          # Running processes
docker volume ls            # List volumes

# Execute commands in containers
docker compose exec postgres psql -U postgres
docker compose exec neo4j cypher-shell -u neo4j -p hoolsy_dev
docker compose exec mongo mongosh -u hoolsy -p hoolsy_dev
docker compose exec timescaledb psql -U hoolsy -d hoolsy_subjects
```

## Troubleshooting

### Port Already in Use

If a port is already occupied:

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
docker compose logs postgres

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
2. Containers are healthy: `docker compose ps`
3. Ports are not blocked by firewall
4. Correct credentials in `.env`

### Data Disappeared

Data persists in Docker volumes. If volumes were deleted:

```bash
# Check if volumes exist
docker volume ls | grep hoolsy

# If missing, reset and re-seed
pnpm docker:up
pnpm --filter @hoolsy/databases migrate:all
pnpm --filter @hoolsy/databases seed:setup
```

## Development Workflow

### Typical Daily Workflow

```bash
# Morning: Start databases
pnpm docker:up

# Start API and frontend
pnpm --filter @workstation/api dev
pnpm --filter workstation-web dev

# Work on features...

# Evening: Stop databases (data persists)
pnpm docker:down
```

### After Schema Changes

```bash
# 1. Update Drizzle schema
# Edit packages/databases/postgres/src/schema/workstation/schema.ts

# 2. Generate migration
pnpm --filter @hoolsy/databases gen:workstation

# 3. Run migration
pnpm --filter @hoolsy/databases migrate:workstation

# 4. Restart API to pick up schema changes
pnpm --filter @workstation/api dev
```

### Clean Slate

```bash
# Nuclear option: destroy everything and rebuild
pnpm docker:reset
pnpm docker:up
pnpm --filter @hoolsy/databases migrate:all
pnpm --filter @hoolsy/databases seed:setup
pnpm --filter @hoolsy/databases seed:demo  # Optional
```

## Architecture: Why 4 Databases?

Each database is optimized for different data patterns:

**PostgreSQL** - Structured relational data with ACID guarantees:
- User accounts, authentication
- Content tree hierarchy
- Media assets with metadata
- RBAC (roles, permissions, grants)

**Neo4j** - Graph relationships:
- Subject → Subject relationships (e.g., Actor → Character → Product)
- Recommendation queries ("show similar subjects")
- Path finding ("how are these two subjects connected?")

**MongoDB** - Flexible document store:
- Subject metadata that evolves over time
- Editorial content (trivia, awards, bios)
- Search-optimized subject information

**TimescaleDB** - Time-series data:
- Subject appearance timeline (start/end times in media)
- "What's visible now?" queries for video scrubbing
- Analytics on subject screen time

## Related Documentation

- [Database Schemas](../packages/databases/postgres/README.md)
- [API Backend](../apps/api/README.md)
- [Environment Configuration](../.env.example)
