# Setup Guide

This guide will help you get the Consumer App running on your machine. Follow the steps in order.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Running the Application](#running-the-application)
4. [Testing with Postman](#testing-with-postman)
5. [Next Steps](#next-steps)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

You need to install the following tools before starting:

### 1. Node.js

**What is it?** Node.js is a JavaScript runtime that runs JavaScript outside of a web browser. The API server and build tools use Node.js.

**Required version:** 20.0.0 or higher

**Download:** https://nodejs.org/

1. Go to https://nodejs.org/
2. Download the **LTS** version (green button)
3. Run the installer
4. Verify installation:
   ```bash
   node --version
   # Should show: v20.x.x or higher
   ```

### 2. pnpm

**What is it?** pnpm is a package manager (like npm). It installs JavaScript packages and manages dependencies. We use pnpm because it's faster and handles our monorepo better than npm.

**Required version:** 8.0.0 or higher

**Installation:** After Node.js is installed, run:

```bash
npm install -g pnpm
```

Verify installation:
```bash
pnpm --version
# Should show: 8.x.x or higher
```

### 3. Docker Desktop

**What is it?** Docker lets you run applications in "containers" - isolated environments with all their dependencies. We use Docker to run the PostgreSQL database so you don't need to install PostgreSQL directly.

**Why use it?**
- No manual PostgreSQL installation needed
- Everyone uses the exact same database version
- Easy to reset if something goes wrong
- Doesn't clutter your system

**Download:** https://www.docker.com/products/docker-desktop/

**Installation:**

**macOS:**
1. Download Docker Desktop from the link above
2. Choose the correct version:
   - **Apple Silicon (M1/M2/M3/M4):** Download "Apple Chip"
   - **Intel Mac:** Download "Intel Chip"
3. Open the downloaded `.dmg` file
4. Drag Docker to Applications
5. Open Docker Desktop from Applications
6. Wait for it to start (whale icon in menu bar stops animating)

**Windows:**
1. Download Docker Desktop from the link above
2. Run the installer
3. Enable WSL 2 if prompted
4. Restart your computer if asked
5. Open Docker Desktop

**Verify installation:**
```bash
docker --version
# Should show: Docker version 24.x.x or higher
```

**Important:** Docker Desktop must be running (whale icon visible) before proceeding.

### 4. Postman

**What is it?** Postman is a tool for testing APIs. You can send requests to your backend and see the responses without writing code. Think of it as a way to "talk" to your API directly.

**Download:** https://www.postman.com/downloads/

1. Download for your operating system
2. Install and open Postman
3. Create a free account or click "Skip and go to app"

### 5. Expo Go (Mobile App)

**What is it?** Expo Go is a mobile app that lets you preview React Native apps on your phone. Scan a QR code and see your app instantly.

**Download:**
- **iOS:** Search "Expo Go" in App Store
- **Android:** Search "Expo Go" in Google Play Store

---

## Project Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd hk26-consumer-app
```

### Step 2: Create Environment File

```bash
cp .env.example .env
```

**About the .env file:**

The `.env` file contains configuration (database URLs, secrets, ports). The default values work for local development - you don't need to change anything.

**Note:** In production or cloud deployment, you would change passwords and secrets to secure values. For local development, the defaults are fine.

### Step 3: Install Dependencies

```bash
pnpm install
```

This installs all packages for the entire project.

### Step 4: Start Docker

Make sure Docker Desktop is running, then:

```bash
pnpm docker:up
```

You should see:
```
[+] Running 2/2
 ✔ Network consumer-app       Created
 ✔ Container CA-postgres      Started
```

### Step 5: Initialize the Database

```bash
pnpm db:reset
```

This creates the databases, runs migrations, and adds demo data. You should see output ending with:

```
════════════════════════════════════════
           SEEDING COMPLETE
════════════════════════════════════════
```

### Step 6: Verify Setup

```bash
pnpm db:test
```

You should see successful connection messages.

---

## Running the Application

### Start the API Server

```bash
pnpm dev:api
```

The API starts at http://localhost:3001. You'll see:
```
Server running at http://localhost:3001
```

### Start the Mobile App

In a **new terminal window**:

```bash
pnpm dev:app
```

A QR code appears in the terminal.

**To run on your phone:**
1. Download **Expo Go** from App Store (iOS) or Google Play (Android) if you haven't already
2. Open the Expo Go app
3. Scan the QR code displayed in your terminal
4. The app loads on your phone

**To run in simulator:**
- Press `i` for iOS Simulator (Mac only, needs Xcode)
- Press `a` for Android Emulator (needs Android Studio)

### Run Both Together

```bash
pnpm dev
```

---

## Testing with Postman

### Import the Collection

1. Open Postman
2. Click **Import** (top-left)
3. Select the **Folder** tab
4. Navigate to your project's `postman/` folder
5. Click **Import**

This imports:
- **Consumer-App-API** - All API endpoints
- **Consumer-App-Local** - Local environment variables

### Select the Environment

1. In the top-right dropdown, select **Consumer-App-Local**

### Test an Endpoint

1. Expand **Consumer-App-API** in the sidebar
2. Click **Health > Health Check**
3. Click **Send**
4. You should see:
   ```json
   { "ok": true, "timestamp": "..." }
   ```

### Using Authentication

1. Go to **Auth > Register** or **Auth > Login**
2. Click **Send**
3. The collection automatically saves the access token
4. Now authenticated endpoints will work

---

## Next Steps

### Understanding the Codebase

| Location | What it is |
|----------|------------|
| `apps/api/` | Backend API (Fastify) |
| `apps/consumer-app/` | Mobile app (React Native + Expo) |
| `packages/databases/postgres/` | Database schemas and migrations |
| `packages/schema/` | Shared TypeScript types (API contracts) |

### Extending the Database

If you need to add tables or columns, read:

**[documents/guides/type-safety-from-database-to-frontend.md](documents/guides/type-safety-from-database-to-frontend.md)**

This explains:
- How type safety flows through the system
- How to add new fields or tables
- How Drizzle ORM and Zod work together

### Adding Demo Data

To add more test data (new shows, products), see:

**[packages/databases/postgres/src/seed-data/README.md](packages/databases/postgres/src/seed-data/README.md)**

### Quality Checks

Before committing code, always run:

```bash
pnpm typecheck   # Check TypeScript types
pnpm lint        # Check code quality
```

---

## Troubleshooting

### Docker: "Cannot connect to the Docker daemon"

Docker Desktop is not running.

**Fix:** Open Docker Desktop and wait for it to start (whale icon stops animating).

---

### Docker: "Port 5433 is already in use"

Something else is using the database port.

**Fix:**
```bash
# Find what's using the port
lsof -i :5433

# Or change the port in .env
POSTGRES_PORT=5434

# Then restart Docker
pnpm docker:down
pnpm docker:up
```

---

### Docker: "Container name CA-postgres is already in use"

Old container exists from a previous run.

**Fix:**
```bash
docker rm -f CA-postgres
pnpm docker:up
```

---

### Database: "duplicate key value violates unique constraint"

Database already has data from a previous seed.

**Fix:**
```bash
pnpm db:reset
```

---

### Database: "relation does not exist"

Migrations haven't been run.

**Fix:**
```bash
pnpm db:migrate
```

---

### Postman: "Could not get any response"

API is not running.

**Fix:**
1. Start the API: `pnpm dev:api`
2. Verify it shows "Server running at http://localhost:3001"
3. Check Postman environment is set to "Consumer-App-Local"

---

### Postman: "401 Unauthorized"

Access token is missing or expired.

**Fix:**
1. Run "Register" or "Login" in Postman first
2. Try your request again

---

### Expo: "Network request failed"

Phone can't reach your computer.

**Fix:**
1. Ensure phone and computer are on the same WiFi
2. Find your computer's IP:
   ```bash
   # macOS
   ipconfig getifaddr en0

   # Windows
   ipconfig
   ```
3. Update `API_URL` in the app to use your IP instead of localhost

---

### General: "Command not found: pnpm"

pnpm is not installed.

**Fix:**
```bash
npm install -g pnpm
```

---

### General: TypeScript errors after pulling new code

Dependencies are out of sync.

**Fix:**
```bash
pnpm install
pnpm typecheck
```

---

## Useful Commands Reference

### Development
| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API and mobile app |
| `pnpm dev:api` | Start only API |
| `pnpm dev:app` | Start only mobile app |

### Docker
| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start database container |
| `pnpm docker:down` | Stop database container |
| `pnpm docker:logs` | View container logs |
| `pnpm docker:reset` | Reset container and data |

### Database
| Command | Description |
|---------|-------------|
| `pnpm db:reset` | Reset and re-seed databases |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:generate` | Generate migration from schema changes |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:test` | Test database connection |

### Quality
| Command | Description |
|---------|-------------|
| `pnpm typecheck` | Check TypeScript types |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Auto-fix lint issues |

---

## Getting Help

1. Check this troubleshooting section
2. Read the relevant guide in `documents/guides/`
3. Ask a team member or instructor

**Contact:** Mathias Haslien ([mathias@hoolsy.com](mailto:mathias@hoolsy.com))
