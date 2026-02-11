# HK26 Syncstation Monorepo

This monorepo contains the Hoolsy Platforms stack. The Syncstation bachelor project lives here alongside the existing Workstation and shared infrastructure built by Mathias.

**First time?** Run the setup script and you're good to go:

```powershell
# Windows (PowerShell)
.\setup.ps1

# Mac / Linux
chmod +x setup.sh && ./setup.sh
```

Then start developing:

```bash
pnpm dev:api    # API server → http://localhost:3333
pnpm dev:sync   # Syncstation mobile app (Expo)
```

**Login:** `admin@hoolsy.com` / `demopassword`

See [SETUP.md](./SETUP.md) for manual setup, troubleshooting, and all available scripts.

---

## What is Hoolsy?

Hoolsy builds a "media-to-commerce" engine that makes content shoppable in real-time. When users watch films, series, or livestreams, the system identifies subjects (people, products, places) and makes them explorable and purchasable. This requires AI-detected subjects to be verified, structured, and quality-controlled before reaching end users.

**Syncstation** is the mobile on-set companion app. Production crews (costume, props, makeup, script supervisors) use it to log events, attach photos/videos/files, and sync everything to Workstation so post-production teams have structured, contextualized data instead of loose fragments.

**Workstation** is the web-based editorial control center where raw AI detections become verified, production-ready data. Content nodes in Workstation form the hierarchy that Syncstation logs attach to.

For deeper platform context, see `documents/hoolsy-platforms/`.

---

## Tech Stack

- **TypeScript** — workspace-wide, strict mode
- **Mobile (Syncstation):** React Native + Expo
- **Web (Workstation):** React 19 + Vite + TailwindCSS
- **API:** Node.js + Fastify, Zod validation
- **Database:** PostgreSQL + Drizzle ORM
- **Package manager:** pnpm workspaces

### Databases (multi-DB architecture)

| Database | Owner | Purpose |
|---|---|---|
| `users` | Shared | User accounts, authentication, platform access |
| `workstation` | Workstation team | Projects, content nodes, media (read-only for Syncstation) |
| `syncstation` | Syncstation team | Log entries, attachments, sync status |

---

## Repository Structure

```
.
├─ apps/
│  ├─ api/                  # Fastify API server (auth, workstation, syncstation endpoints)
│  ├─ syncstation-app/      # React Native mobile app (Expo)
│  ├─ workstation-web/      # React web app (Vite + Tailwind)
│  └─ marketplace-web/      # (Future) Marketplace web app
│
├─ packages/
│  ├─ databases/postgres/   # Drizzle ORM schemas, migrations, bootstrap, seeds
│  ├─ schema/               # Shared Zod schemas & TypeScript types (@hk26/schema)
│  ├─ logger/               # Structured logging (@hoolsy/logger)
│  └─ timeline/             # Timeline component (@hoolsy/timeline)
│
├─ docker/                  # Docker Compose for PostgreSQL
├─ postman/                 # Postman API collection + environment
├─ documents/               # Architecture guides and API docs
│  ├─ API.md                # API endpoint documentation
│  ├─ CodeRules.md          # Coding standards (team reference)
│  ├─ guides/               # Architecture and data flow guides
│  └─ hoolsy-platforms/     # Hoolsy platform context docs
│
├─ setup.ps1                # One-command setup (Windows)
├─ setup.sh                 # One-command setup (Mac/Linux)
├─ SETUP.md                 # Setup details, manual steps, troubleshooting
└─ .env.example             # Template for .env
```

---

## Documentation

| What you need | Where to find it |
|---|---|
| **Run the project** | [SETUP.md](./SETUP.md) |
| **Understand the architecture** | [documents/guides/architecture.md](./documents/guides/architecture.md) |
| **Understand data flow (DB → API → Frontend)** | [documents/guides/type-safety-from-database-to-frontend.md](./documents/guides/type-safety-from-database-to-frontend.md) |
| **API endpoint reference** | [documents/API.md](./documents/API.md) + [Postman collection](./postman/) |
| **Coding standards** | [documents/CodeRules.md](./documents/CodeRules.md) |
| **Hoolsy platform context** | [documents/hoolsy-platforms/](./documents/hoolsy-platforms/) |
