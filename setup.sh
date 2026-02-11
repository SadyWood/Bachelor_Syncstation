#!/bin/bash
# setup.sh
# Syncstation - One-command project setup
# Usage: ./setup.sh           (normal setup)
#        ./setup.sh --fresh   (nuke DB and start clean)
#        ./setup.sh --reset   (back to fresh clone state — removes all generated files)

set -e

FRESH=false
RESET=false
if [ "$1" = "--fresh" ]; then FRESH=true; fi
if [ "$1" = "--reset" ]; then RESET=true; fi

step()  { printf "\n\033[36m==> %s\033[0m\n" "$1"; }
ok()    { printf "  \033[32mOK\033[0m %s\n" "$1"; }
warn()  { printf "  \033[33m!!\033[0m %s\n" "$1"; }
fail()  { printf "  \033[31mFAIL\033[0m %s\n" "$1"; exit 1; }

# ── Reset mode ─────────────────────────────────────────────────────
# Strips everything back to a fresh git clone. Does NOT run setup after.
if [ "$RESET" = true ]; then
    echo ""
    echo "========================================"
    echo "  Syncstation - Reset to clean state"
    echo "========================================"

    # Stop and remove Docker containers + volumes
    step "Stopping Docker containers..."
    docker compose --env-file .env -f docker/docker-compose.yml down 2>/dev/null || true
    docker volume rm syncstation_sync_postgres_data 2>/dev/null || true
    ok "Docker cleaned"

    # Remove node_modules
    step "Removing node_modules..."
    rm -rf node_modules
    find apps packages -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
    ok "node_modules removed"

    # Remove dist/ build output
    step "Removing build artifacts..."
    rm -rf apps/api/dist
    rm -rf apps/marketplace-web/dist
    rm -rf apps/workstation-web/dist
    rm -rf packages/databases/postgres/dist
    rm -rf packages/logger/dist
    rm -rf packages/schema/dist
    rm -rf packages/timeline/dist
    find . -name "*.tsbuildinfo" -delete 2>/dev/null || true
    ok "Build artifacts removed"

    # Remove caches and IDE config
    step "Removing caches..."
    rm -rf .turbo .cache .vite coverage .nyc_output .idea
    find apps packages -type d \( -name ".turbo" -o -name ".cache" -o -name ".vite" -o -name "coverage" \) -exec rm -rf {} + 2>/dev/null || true
    ok "Caches removed"

    # Remove uploads
    step "Removing uploads..."
    rm -rf apps/api/uploads
    ok "Uploads removed"

    # Remove .env
    step "Removing .env..."
    rm -f .env
    ok ".env removed"

    echo ""
    echo "========================================"
    echo "  Reset complete — fresh clone state"
    echo "========================================"
    echo ""
    echo "  To set up again:  ./setup.sh"
    echo ""
    exit 0
fi

# ── Normal setup continues below ──────────────────────────────────

echo ""
echo "========================================"
echo "  Syncstation - Project Setup"
echo "========================================"

# ── Pre-flight checks ──────────────────────────────────────────────
step "Checking prerequisites..."

command -v node >/dev/null 2>&1 && ok "Node.js $(node -v)" || fail "Node.js not found"
command -v pnpm >/dev/null 2>&1 && ok "pnpm $(pnpm -v)" || fail "pnpm not found"
command -v docker >/dev/null 2>&1 && ok "Docker found" || fail "Docker not found"

docker info >/dev/null 2>&1 && ok "Docker is running" || fail "Docker Desktop is not running"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        ok "Created .env from .env.example"
    else
        fail "No .env or .env.example found"
    fi
else
    ok ".env exists"
fi

# ── Fresh start? ───────────────────────────────────────────────────
if [ "$FRESH" = true ]; then
    step "FRESH START - Nuking everything..."
    docker compose --env-file .env -f docker/docker-compose.yml down 2>/dev/null || true
    docker volume rm syncstation_sync_postgres_data 2>/dev/null || true
    ok "Clean slate ready"
fi

# ── Install dependencies ──────────────────────────────────────────
step "Installing dependencies..."
pnpm install || fail "pnpm install failed"
ok "Dependencies installed"

# ── Build packages ────────────────────────────────────────────────
step "Building packages..."
pnpm build || fail "Build failed. Fix TypeScript errors before setup."
ok "All packages built"

# ── Docker ────────────────────────────────────────────────────────
step "Starting database container..."
docker compose --env-file .env -f docker/docker-compose.yml up -d || fail "Docker failed to start"
ok "Container started"

# Wait for healthy
step "Waiting for PostgreSQL to be healthy..."
ATTEMPTS=0
MAX=30
while [ $ATTEMPTS -lt $MAX ]; do
    HEALTH=$(docker inspect --format='{{.State.Health.Status}}' sync-postgres 2>/dev/null || echo "unknown")
    if [ "$HEALTH" = "healthy" ]; then break; fi
    ATTEMPTS=$((ATTEMPTS + 1))
    printf "  Waiting... (%d/%d)\r" "$ATTEMPTS" "$MAX"
    sleep 1
done

if [ "$HEALTH" != "healthy" ]; then
    fail "PostgreSQL did not become healthy. Check: docker logs sync-postgres"
fi
ok "PostgreSQL is healthy"

# ── Check databases exist ─────────────────────────────────────────
step "Verifying databases..."
DBS=$(docker exec sync-postgres psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname IN ('users','workstation','syncstation');" 2>/dev/null)

if echo "$DBS" | grep -q "users" && echo "$DBS" | grep -q "workstation" && echo "$DBS" | grep -q "syncstation"; then
    ok "All databases exist"
else
    warn "Missing databases. Waiting 5 seconds for init scripts..."
    sleep 5
    DBS=$(docker exec sync-postgres psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname IN ('users','workstation','syncstation');" 2>/dev/null)
    if echo "$DBS" | grep -q "users" && echo "$DBS" | grep -q "workstation" && echo "$DBS" | grep -q "syncstation"; then
        ok "All databases exist"
    else
        fail "Databases missing. The Docker init script may have CRLF line endings. Run: ./setup.sh --fresh"
    fi
fi

# ── Migrations ────────────────────────────────────────────────────
step "Running database migrations..."
pnpm db:migrate || fail "Migrations failed. Try: ./setup.sh --fresh"
ok "Migrations applied"

# ── Grants ────────────────────────────────────────────────────────
step "Applying database permissions..."
cat packages/databases/postgres/bootstrap/10_users_db.sql | docker exec -i sync-postgres psql -U postgres >/dev/null 2>&1
cat packages/databases/postgres/bootstrap/10_workstation_db.sql | docker exec -i sync-postgres psql -U postgres >/dev/null 2>&1
cat packages/databases/postgres/bootstrap/10_syncstation_db.sql | docker exec -i sync-postgres psql -U postgres >/dev/null 2>&1
ok "Service account permissions granted"

# ── Seeds ─────────────────────────────────────────────────────────
step "Seeding foundational data..."
pnpm db:seed || fail "Seed failed"
ok "Foundational data seeded"

step "Seeding demo data..."
SEED_DEMO_OK=true pnpm db:seed:demo || fail "Demo seed failed"
ok "Demo data seeded"

# ── Verify ────────────────────────────────────────────────────────
step "Verifying setup..."
TABLE_CHECK=$(docker exec sync-postgres psql -U postgres -d syncstation -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'log_entries';" 2>/dev/null)
if echo "$TABLE_CHECK" | grep -q "content_node_id"; then
    ok "Syncstation schema is correct"
else
    warn "Schema may have old columns. Run: ./setup.sh --fresh"
fi

echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "  Start the API:    pnpm dev:api"
echo "  Start mobile:     pnpm dev:sync"
echo "  Start web:        pnpm dev:ws"
echo ""
echo "  Login:            admin@hoolsy.com / demopassword"
echo ""
