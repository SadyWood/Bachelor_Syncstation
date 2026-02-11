# Setup Guide

## Quick Start

### One-command setup

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

This handles everything: dependencies, build, Docker, migrations, seeds, and permissions. If something goes wrong or you want a completely clean slate:

**Windows:** `.\setup.ps1 -Fresh`
**Mac/Linux:** `./setup.sh --fresh`

### After setup

| Command | Description |
|---|---|
| `pnpm dev:api` | Start API server (http://localhost:3333) |
| `pnpm dev:sync` | Start Syncstation mobile app |
| `pnpm dev:ws` | Start Workstation web app |

**Login:** `admin@hoolsy.com` / `demopassword`

## MANUAL STARTUP/TROUBLESHOOTING PAST THIS POINT - ONLY DO THIS IF THE SCRIPT FAILS OR FOR TROUBLESHOOTING ##

This guide walks you through first-time setup of the HK26 project repository.

**What you'll set up:**
- PostgreSQL database with 3 databases (users, workstation, syncstation)
- API server with all endpoints
- Your choice of: Syncstation mobile app, Workstation web app, or both

This repository supports development for both **Syncstation** (mobile) and **Workstation** (web) teams. The setup process is the same regardless of which app you're working on.

## Prerequisites

### Required Software

- **Node.js 20+** and **pnpm 9+**
- **Docker Desktop** (recommended) - [Download here](https://www.docker.com/products/docker-desktop/)
  - OR PostgreSQL installed locally (advanced)

### What is Docker Desktop?

**Docker Desktop** is a containerization platform that packages applications and their dependencies into isolated containers. For our project, it provides:

- **PostgreSQL pre-configured** - All three databases (users, workstation, syncstation) in one container
- **Consistent environment** - Works identically on Windows, Mac, and Linux
- **Zero database installation** - No need to manually install and configure PostgreSQL
- **Easy reset** - Wipe and rebuild databases with a single command
- **Isolated from your system** - Database runs in a container without affecting your local machine

Think of it as a virtual machine, but much lighter and faster. When you run `pnpm docker:up`, Docker Desktop starts the PostgreSQL container automatically.

### Common Docker Desktop Installation Issues

#### Windows

**Issue 1: Virtualization not enabled in BIOS**

Docker Desktop requires hardware virtualization (Hyper-V or WSL 2). If you see an error about virtualization:

1. **Restart your computer** and enter BIOS/UEFI settings (usually by pressing F2, F10, F12, or Del during boot)
2. **Enable virtualization**:
   - Intel CPUs: Look for "Intel VT-x" or "Intel Virtualization Technology"
   - AMD CPUs: Look for "AMD-V" or "SVM Mode"
3. **Save and exit BIOS**
4. **In Windows**, ensure WSL 2 is installed:
   ```bash
   wsl --install
   wsl --set-default-version 2
   ```

**Issue 2: Hyper-V conflicts**

If you have other virtualization software (VMware, VirtualBox):
- Docker Desktop uses Hyper-V or WSL 2 backend
- May conflict with other hypervisors
- Solution: Use WSL 2 backend instead of Hyper-V (Docker Desktop Settings → General → Use WSL 2)

**Issue 3: "Docker Desktop requires a newer WSL kernel"**

Update WSL:
```bash
wsl --update
wsl --shutdown
```

#### macOS

**Issue 1: Apple Silicon (M1/M2/M3) compatibility**

Docker Desktop runs natively on Apple Silicon, but some images may need Rosetta 2:

```bash
softwareupdate --install-rosetta
```

**Issue 2: Resource allocation**

Docker Desktop may be slow if RAM/CPU allocation is too low:
1. Open Docker Desktop → Settings → Resources
2. Increase RAM to at least **4 GB**
3. Increase CPUs to at least **2 cores**

**Issue 3: File sharing permissions**

If containers can't access project files:
1. Docker Desktop → Settings → Resources → File Sharing
2. Add your project directory
3. Restart Docker Desktop

#### All Platforms

**Issue: Port conflicts**

If ports 5432, 7474, 7687, 27017, or 5433 are already in use:

```bash
# Windows: Find process using port
netstat -ano | findstr :5432

# macOS/Linux: Find process using port
lsof -i :5432

# Kill the process or change ports in .env and docker-compose.yml
```

**Issue: Docker daemon not running**

Ensure Docker Desktop is actually running:
- Windows: Check system tray for Docker icon
- macOS: Check menu bar for Docker icon
- Should say "Docker Desktop is running"

### Port Requirements

- **5432** - PostgreSQL (users, workstation, syncstation databases)
- **3333** - API server
- **5173** - Workstation web (if running)
- **8081** - Syncstation mobile app (Expo dev server)

---

## Option A: Docker Setup (Recommended)

Docker provides all databases in containers - no local installation needed.

### 1) Install Docker Desktop

1. **Download and install** - [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Start Docker Desktop** - Open the application
3. **Verify it's running**:
   - Windows: Look for Docker icon in system tray
   - macOS: Look for Docker icon in menu bar
   - Should show "Docker Desktop is running"

**First time setup?** See [Common Docker Desktop Installation Issues](#common-docker-desktop-installation-issues) above if you encounter problems.

### 2) Install dependencies

```bash
pnpm install
```

### 3) Build packages

Build all workspace packages (logger, schema, etc.):

```bash
pnpm build
```

This compiles TypeScript packages in `packages/` that the API and apps depend on.

### 4) Create `.env`

Copy `.env.example` → `.env`. The default values work with Docker:

```bash
# Windows (PowerShell or Command Prompt)
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

### 5) Start databases

```bash
pnpm docker:up
```

This starts the **PostgreSQL container** with three databases:
- **users** - User accounts, authentication, platform access
- **workstation** - Content nodes, projects, media (for Workstation team)
- **syncstation** - Log entries and attachments (for Syncstation team)

**Verify container is running:**
```bash
pnpm docker:ps
```

Expected output:
```
NAME              IMAGE               STATUS
sync-postgres     postgres:16-alpine  Up
```

### 6) Run migrations

Apply database schema migrations:

```bash
pnpm db:migrate
```

**What this does:**
- Reads schema definitions from `packages/databases/postgres/src/schema/`
- Creates tables, indexes, and constraints in each PostgreSQL database:
  - `users` database - User accounts, sessions, permissions
  - `workstation` database - Projects, content nodes, media
  - `syncstation` database - Log entries and attachments for sync tracking

The migration files are stored in `packages/databases/postgres/migrations/`.

### 7) Seed foundational data

```bash
pnpm db:seed
```

**What this does:**
- Seeds reference data that the application needs to function
- Platform codes (workstation, marketplace, nexus)
- Permissions catalog (200+ permissions)
- Global roles (owner, admin, member)
- Media kinds taxonomy
- Demo tenant ("Demo Workspace")

### 8) Seed demo data (recommended)

To test the application with realistic data, you need to enable demo seeding.

**Step 1: Enable demo seeding in `.env`**

Open your `.env` file and change:
```env
SEED_DEMO_OK=false
```
to:
```env
SEED_DEMO_OK=true
```

> **Why is this required?** Demo seeding is disabled by default as a safety measure to prevent accidentally creating test data in production environments.

**Step 2: Run the demo seed**

```bash
pnpm db:seed:demo
```

**What this creates:**
- **Admin user** - `admin@hoolsy.com` with password `demopassword` (ready to log in immediately)
- **User invitations** - For additional test users (mathias@hoolsy.com, espen@hoolsy.com, ew@hoolsy.com)
- **"Streamwave Inc" tenant** - Demo workspace
- **Breaking Bad project** - Full season/episode structure
- **Pilot episode (S1.E1) with video** - A short clip from Breaking Bad for testing timeline and streaming

**Note:** The admin user (`admin@hoolsy.com`) has full admin access and won't be restricted in the frontend. The invited users have limited permissions (Manage or Viewer roles) and require registration via invite token.

### 9) Start API and apps

The API server is required for both Syncstation and Workstation. Choose which app(s) to run:

**Terminal 1 - API server (required):**
```bash
pnpm dev:api
```

Wait for:
```
✅ API server running on http://localhost:3333
```

**Terminal 2 - Choose your app:**

**Option A: Syncstation mobile app**
```bash
pnpm dev:sync
```
Opens Expo dev server. Scan QR code with Expo Go app to run on your device.

**Option B: Workstation web app**
```bash
pnpm dev:ws
```
Opens web app at `http://localhost:5173`

**Option C: Both (use a third terminal)**
```bash
# Terminal 2
pnpm dev:ws

# Terminal 3
pnpm dev:sync
```

### 10) Log in and test

**Admin user (recommended for testing)**

The demo seed creates an admin user with full access - no registration needed:

**Email:** `admin@hoolsy.com`
**Password:** `demopassword`

**For Workstation web:**
1. Open `http://localhost:5173`
2. Log in with admin credentials
3. Explore Content Dashboard, Timeline Editor, and Admin Panel

**For Syncstation mobile:**
1. Open the Expo app on your device
2. Scan the QR code from the terminal
3. Log in with admin credentials
4. Test creating log entries and syncing

**Option B: Register with invite token (limited permissions)**

If you want to test with limited permissions (Manage or Viewer role):

1. **Copy the registration URL** from step 7 (demo seed output) for one of the invited users
2. **Open it in your browser** - `http://localhost:5173/register?invite=...`
3. **Create your account** with the invited email
4. **You're logged in!** Explore the Workstation with role-based restrictions

### 11) Test the Timeline Editor with Demo Video

The demo seed includes a **Breaking Bad Season 1, Episode 1 (Pilot)** video clip that you can use to test the timeline editor and media streaming.

**To access the demo video:**

1. **Navigate to Content Dashboard** - Click "Content" in the sidebar
2. **Browse to Breaking Bad project**:
   - Breaking Bad → SEASON 1 → Pilot S1.E1
3. **Open the Pilot episode** - Click on "Pilot S1.E1"
4. **Timeline editor will load** with the video

**Or use direct link format:**
```
http://localhost:5173/content/{NODE_ID}
```

The node ID is generated during seeding and will be different each time. To get the direct link:
- Navigate to the Pilot episode via Content Dashboard, then copy the URL from your browser
- Example: `http://localhost:5175/content/019b0d52-e786-7889-a4b9-88e71daa1c42`

**Note:** The port may vary (5173, 5174, 5175) depending on which ports are available. Check your Vite dev server output for the actual port.

**What you can test:**
- ✅ **Video streaming** - The video streams from the API with range request support
- ✅ **Timeline scrubbing** - Drag the playhead to seek through the video
- ✅ **Frame-accurate editing** - Timeline shows frames at different zoom levels
- ✅ **Playback controls** - Play, pause, and navigate the video

**Without demo seed**, the timeline will be empty and you won't be able to test media playback.

### Quick verification checklist

- [ ] Docker Desktop is running
- [ ] `pnpm docker:ps` shows sync-postgres container as "Up"
- [ ] API server responds: `curl http://localhost:3333/healthz`
- [ ] You can log in with admin@hoolsy.com / demopassword
- [ ] Breaking Bad project appears in Content Dashboard (if using Workstation web)
- [ ] Syncstation API endpoints respond: `curl http://localhost:3333/syncstation/sync-status` (requires auth)

### Docker Commands

| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start all database containers |
| `pnpm docker:down` | Stop all containers |
| `pnpm docker:reset` | Stop, wipe all data, and restart |
| `pnpm docker:logs` | View container logs |
| `pnpm docker:ps` | Show container status |

---

## Option B: Local PostgreSQL Setup

If you prefer running PostgreSQL locally without Docker.

### 1) Install dependencies

```bash
pnpm install
```

### 2) Build packages

```bash
pnpm build
```

### 3) Create `.env`

Copy `.env.example` → `.env` and update the PostgreSQL connection to match your local setup:

```env
ADMIN_DATABASE_CONNECTION=postgres://postgres:your-password@localhost:5432
USERS_DB_URL=postgres://svc_users:change-this-svc-users@localhost:5432/users
WORKSTATION_DB_URL=postgres://svc_workstation:change-this-svc-workstation@localhost:5432/workstation
SYNCSTATION_DB_URL=postgres://svc_syncstation:change-this-svc-syncstation@localhost:5432/syncstation
```

### 4) Bootstrap databases & roles

Creates databases (**users**, **workstation**, **syncstation**), roles, and grants:

```bash
pnpm db:bootstrap
```

> If you want custom passwords, edit `packages/databases/postgres/bootstrap/00_cluster_bootstrap.sql` first.

### 5) Run migrations

```bash
pnpm db:migrate
```

### 6) Re-run bootstrap for grants

After migrations, run bootstrap again to grant permissions on new tables:

```bash
pnpm db:bootstrap
```

### 7) Seed data

```bash
pnpm db:seed
```

### 8) Seed demo data (optional)

Enable demo seeding in `.env`:
```env
SEED_DEMO_OK=true
```

Then run:
```bash
pnpm db:seed:demo
```

### 9) Start API and web

```bash
pnpm dev:api   # API → http://localhost:3333
pnpm dev:ws    # Web → http://localhost:5173
```

---

## Seed Demo Data (Optional but Recommended)

The demo seed creates a test user invitation so you can register and log in immediately. **This is the easiest way to get started.**

### What does `pnpm db:seed:demo` do?

Creates:
- **Demo invite** - A user invitation token
- **Demo tenant** - "Streamwave Inc" tenant
- **Breaking Bad project** - Complete season/episode structure with 2 seasons
- **Pilot episode video** - Breaking Bad S1.E1 (Pilot) with actual video content for testing
- **Default email** - `admin@hoolsy.com` (customizable)
- **7-day expiration** - Invite expires after 7 days
- **Platform access** - Workstation platform

**Note:** Only the Pilot episode includes video. All other episodes are metadata-only (no media files).

### Running the demo seed

```bash
# Enable demo seeding (required for safety)
# Windows (PowerShell):
$env:SEED_DEMO_OK="true"

# Windows (Command Prompt):
set SEED_DEMO_OK=true

# macOS/Linux:
export SEED_DEMO_OK=true

# Run the seed
pnpm db:seed:demo
```

**Output example:**
```
✅ Demo seed complete!

📧 Email: demo@hoolsy.test
🎫 Invite token: 1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6
🔗 Registration URL: http://localhost:5173/register?invite=1a2b3c4d-5e6f-7g8h-9i0j-k1l2m3n4o5p6
⏰ Expires: 2025-12-21T12:00:00Z

Use this invite to create your first user account.
```

### Logging in

**Option 1: Admin user (recommended)**

The fastest way to start exploring is using the pre-created admin user:

1. **Open the web app** - `http://localhost:5173`
2. **Log in**:
   - Email: `admin@hoolsy.com`
   - Password: `demopassword`
3. **Done!** You have full admin access to all features

**Option 2: Register with invite token**

If you want to test role-based permissions:

1. **Copy the registration URL** from the seed output
2. **Open it in your browser** - Should show the registration form
3. **Fill in your details**:
   - Email: Use one of the invited emails (mathias@hoolsy.com, espen@hoolsy.com, ew@hoolsy.com)
   - First name: Your first name
   - Last name: Your last name
   - Display name: How you want to appear in the app
   - Password: Your password (min 8 characters)
4. **Submit** - You'll be logged in automatically with limited permissions

### Customizing the demo invite

You can customize the demo invite with environment variables:

```bash
# .env file
SEED_DEMO_OK=true
DEMO_INVITE_EMAIL=yourname@example.test
DEMO_INVITE_TOKEN=custom-token-here  # Optional: auto-generated if not set
DEMO_INVITE_PLATFORM_ID=1             # 1 = workstation (default)
```

### Troubleshooting demo seed

**Issue: "Demo seeding is disabled"**
- Ensure `SEED_DEMO_OK=true` is set
- This is a safety measure to prevent accidental demo data in production

**Issue: "Invite already exists"**
- The demo seed is idempotent - safe to run multiple times
- If invite exists, it will use the existing one

**Issue: "Platform not found"**
- Run foundational seed first: `pnpm db:seed`
- The foundational seed creates the platform codes

**Issue: Invite has expired**
- Run `pnpm db:seed:demo` again to create a new invite
- Invites expire after 7 days

---

## Accessing Databases

### PostgreSQL

Connect with any PostgreSQL client (psql, pgAdmin, DBeaver, etc.):

```bash
# Users database
psql postgres://svc_users:change-this-svc-users@localhost:5432/users

# Workstation database
psql postgres://svc_workstation:change-this-svc-workstation@localhost:5432/workstation

# Syncstation database
psql postgres://svc_syncstation:change-this-svc-syncstation@localhost:5432/syncstation
```

**Note:** These are service account credentials. The admin user is `postgres:hoolsy_dev`.

### Database Architecture for Teams

This repository supports multiple student teams working on different components:

**For Syncstation team:**
- **Primary database:** `syncstation` - Your log entries and attachments live here
- **Shared access:** `workstation` - You'll read `content_nodes` to link logs to specific content
- **Shared access:** `users` - Authentication happens here (login, JWT tokens)

**For Workstation team:**
- **Primary database:** `workstation` - Projects, content nodes, media, tasks
- **Shared access:** `users` - Authentication

**Key principle:**
- Each team owns their own database for writes
- Teams share read access to `users` (for auth) and `workstation` (for content references)
- The API handles connections to all databases automatically

**Example (Syncstation):**
```typescript
// Your team writes to syncstation DB
await dbSync.insert(schema.logEntries).values({...});

// But you read content nodes from workstation DB
const contentNode = await dbWs.query.contentNodes.findFirst({
  where: eq(schema.contentNodes.id, nodeId)
});

// And authentication uses users DB (handled by API)
const user = await req.jwtVerify(); // Token validated against users DB
```

---

## Troubleshooting

### Docker containers won't start
- Ensure Docker Desktop is running
- Check if ports are already in use: `pnpm docker:logs`
- Try resetting: `pnpm docker:reset`

### "Cannot find module '@hoolsy/databases'"
Run `pnpm install` to link workspace packages.

### "Failed to fetch" on login
- Ensure API is running on `http://localhost:3333`
- Check your `.env` has correct database URLs

### "No schema changes" during generate
- Edits must be in `packages/databases/src/schema/...`
- Save the file before running generate

### Hard reset everything
```bash
# Docker setup
pnpm docker:reset
pnpm db:migrate
pnpm db:seed

# Local PostgreSQL
pnpm db:nuke        # Drops all DBs (requires confirmation)
pnpm db:bootstrap
pnpm db:migrate
pnpm db:seed
```

---

## Useful Scripts

### Database
| Script | Description |
|--------|-------------|
| `pnpm db:bootstrap` | Create DBs, roles, grants (local PG only) |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:rebuild` | Generate + migrate |
| `pnpm db:seed` | Seed foundational data |
| `pnpm db:seed:demo` | Seed demo invite/membership |
| `pnpm db:test` | Verify connections |
| `pnpm db:nuke` | Drop all DBs & roles (danger!) |
| `pnpm db:wipe` | Wipe all rows (danger!) |

### Development
| Script | Description |
|--------|-------------|
| `pnpm dev:api` | Run API server |
| `pnpm dev:ws` | Run Workstation web |
| `pnpm dev:market` | Run Marketplace web |
| `pnpm dev:timeline` | Run Timeline demo |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | Type-check all packages |

---

Happy hacking! 🚀
