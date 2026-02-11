# setup.ps1
# Syncstation - One-command project setup
# Usage: .\setup.ps1           (normal setup)
#        .\setup.ps1 -Fresh    (nuke everything and start clean)

param(
    [switch]$Fresh
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "  OK $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  !! $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "  FAIL $msg" -ForegroundColor Red }

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Syncstation - Project Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# ── Pre-flight checks ──────────────────────────────────────────────
Write-Step "Checking prerequisites..."

# Node
try { $nodeVersion = (node -v); Write-Ok "Node.js $nodeVersion" }
catch { Write-Fail "Node.js not found. Install Node.js 20+"; exit 1 }

# pnpm
try { $pnpmVersion = (pnpm -v); Write-Ok "pnpm $pnpmVersion" }
catch { Write-Fail "pnpm not found. Run: npm install -g pnpm"; exit 1 }

# Docker
try { $dockerVersion = (docker --version); Write-Ok "Docker found" }
catch { Write-Fail "Docker not found. Install Docker Desktop"; exit 1 }

# Docker running?
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Docker Desktop is not running. Start it and try again."
    exit 1
}
Write-Ok "Docker Desktop is running"

# .env file
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Ok "Created .env from .env.example"
    } else {
        Write-Fail "No .env or .env.example found"
        exit 1
    }
} else {
    Write-Ok ".env exists"
}

# ── Fresh start? ───────────────────────────────────────────────────
if ($Fresh) {
    Write-Step "FRESH START - Nuking everything..."

    $containers = docker compose --env-file .env -f docker/docker-compose.yml ps -q 2>$null
    if ($containers) {
        Write-Warn "Stopping containers..."
        $ErrorActionPreference = "Continue"
        docker compose --env-file .env -f docker/docker-compose.yml down 2>&1 | Out-Null
        $ErrorActionPreference = "Stop"
    }

    $volumeExists = docker volume ls -q --filter name=syncstation_sync_postgres_data 2>$null
    if ($volumeExists) {
        Write-Warn "Removing database volume..."
        $ErrorActionPreference = "Continue"
        docker volume rm syncstation_sync_postgres_data 2>&1 | Out-Null
        $ErrorActionPreference = "Stop"
    }

    Write-Ok "Clean slate ready"
}

# ── Install dependencies ──────────────────────────────────────────
Write-Step "Installing dependencies..."
pnpm install
if ($LASTEXITCODE -ne 0) { Write-Fail "pnpm install failed"; exit 1 }
Write-Ok "Dependencies installed"

# ── Build packages ────────────────────────────────────────────────
Write-Step "Building packages..."
pnpm build
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Build failed. Fix TypeScript errors before setup."
    exit 1
}
Write-Ok "All packages built"

# ── Docker ────────────────────────────────────────────────────────
Write-Step "Starting database container..."

# Check if already running
$ErrorActionPreference = "Continue"
docker compose --env-file .env -f docker/docker-compose.yml up -d 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) { Write-Fail "Docker failed to start"; exit 1 }
Write-Ok "Container started"

# Wait for healthy
Write-Step "Waiting for PostgreSQL to be healthy..."
$attempts = 0
$maxAttempts = 30
do {
    $attempts++
    $health = docker inspect --format='{{.State.Health.Status}}' sync-postgres 2>$null
    if ($health -eq "healthy") { break }
    Write-Host "  Waiting... ($attempts/$maxAttempts)" -NoNewline
    Write-Host "`r" -NoNewline
    Start-Sleep -Seconds 1
} while ($attempts -lt $maxAttempts)

if ($health -ne "healthy") {
    Write-Fail "PostgreSQL did not become healthy in time"
    Write-Host "  Check: docker logs sync-postgres"
    exit 1
}
Write-Ok "PostgreSQL is healthy"

# ── Check databases exist ─────────────────────────────────────────
Write-Step "Verifying databases..."
$dbs = docker exec sync-postgres psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname IN ('users','workstation','syncstation') ORDER BY datname;" 2>$null
$dbList = ($dbs -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })

$hasUsers = $dbList -contains "users"
$hasWorkstation = $dbList -contains "workstation"
$hasSyncstation = $dbList -contains "syncstation"

if ($hasUsers -and $hasWorkstation -and $hasSyncstation) {
    Write-Ok "All databases exist (users, workstation, syncstation)"
} else {
    Write-Warn "Missing databases detected. Docker init scripts may not have run."
    Write-Warn "Waiting 5 seconds and rechecking (init scripts may still be running)..."
    Start-Sleep -Seconds 5

    $dbs = docker exec sync-postgres psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname IN ('users','workstation','syncstation') ORDER BY datname;" 2>$null
    $dbList = ($dbs -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne "" })

    $hasUsers = $dbList -contains "users"
    $hasWorkstation = $dbList -contains "workstation"
    $hasSyncstation = $dbList -contains "syncstation"

    if (-not ($hasUsers -and $hasWorkstation -and $hasSyncstation)) {
        Write-Fail "Databases still missing after waiting."
        Write-Fail "This usually means the Docker init script has Windows line endings (CRLF)."
        Write-Fail "Fix: Open docker/postgres/init/00-run-bootstrap.sh in VS Code,"
        Write-Fail "     click CRLF in the bottom bar, select LF, save."
        Write-Fail "Then run: .\setup.ps1 -Fresh"
        exit 1
    }
    Write-Ok "All databases exist"
}

# ── Migrations ────────────────────────────────────────────────────
Write-Step "Running database migrations..."
pnpm db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Migrations failed"
    Write-Fail "If syncstation migration conflicts, run: .\setup.ps1 -Fresh"
    exit 1
}
Write-Ok "Migrations applied"

# ── Grants ────────────────────────────────────────────────────────
Write-Step "Applying database permissions..."
$ErrorActionPreference = "Continue"
Get-Content packages/databases/postgres/bootstrap/10_users_db.sql | docker exec -i sync-postgres psql -U postgres 2>&1 | Out-Null
Get-Content packages/databases/postgres/bootstrap/10_workstation_db.sql | docker exec -i sync-postgres psql -U postgres 2>&1 | Out-Null
Get-Content packages/databases/postgres/bootstrap/10_syncstation_db.sql | docker exec -i sync-postgres psql -U postgres 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
Write-Ok "Service account permissions granted"

# ── Seeds ─────────────────────────────────────────────────────────
Write-Step "Seeding foundational data..."
pnpm db:seed
if ($LASTEXITCODE -ne 0) { Write-Fail "Seed failed"; exit 1 }
Write-Ok "Foundational data seeded"

Write-Step "Seeding demo data..."
$env:SEED_DEMO_OK = "true"
pnpm db:seed:demo
if ($LASTEXITCODE -ne 0) { Write-Fail "Demo seed failed"; exit 1 }
Write-Ok "Demo data seeded"

# ── Verify ────────────────────────────────────────────────────────
Write-Step "Verifying setup..."

# Check syncstation table
$tableCheck = docker exec sync-postgres psql -U postgres -d syncstation -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'log_entries' ORDER BY ordinal_position;" 2>$null
if ($tableCheck -match "content_node_id") {
    Write-Ok "Syncstation schema is correct"
} else {
    Write-Warn "Syncstation schema may have old column names. Run: .\setup.ps1 -Fresh"
}

# ── Done ──────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Start the API:    pnpm dev:api" -ForegroundColor White
Write-Host "  Start mobile:     pnpm dev:sync" -ForegroundColor White
Write-Host "  Start web:        pnpm dev:ws" -ForegroundColor White
Write-Host ""
Write-Host "  Login:            admin@hoolsy.com / demopassword" -ForegroundColor White
Write-Host ""
