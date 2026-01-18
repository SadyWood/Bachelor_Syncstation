How to use this structure index

Use this as the single source of context when navigating or editing the Hoolsy monorepo.
Scope: This index covers the meaningful folders only. Ignore build artifacts and node_modules.
Truth: Contracts live in packages/schema (Zod). Infer types from schemas. Do not hand craft parallel TS types.
Layers: Keep routes thin, put domain logic in services, and database access in repos.
Frontend: Prefer shared schemas from packages/schema. Use local src/types only when a web-specific wrapper or UI-only type is needed. Do not scatter types inside components.
HTTP: Use the typed HTTP helper in apps/workstation-web/src/lib to serialize JSON and validate responses.
Naming: Schemas use PascalCase with the suffix Schema. Files use kebab case. Variables and functions use camelCase.
Auth: Access token stays in memory. Refresh via httpOnly cookie through the API. Do not store tokens in localStorage.
Permissions: Rely on the seeded wildcard catalog. Check permissions in routes and reflect them in the UI.
Migrations and seeds: Use the provided pnpm scripts. After generating new tables, re run the bootstrap script to refresh grants.
Changes: Respect the existing folder layout. Only propose structural changes if explicitly requested.

Repo root (monorepo)
.
├─ apps/
│  ├─ api/
│  ├─ workstation-web/
│  └─ marketplace-web/      (optional)
├─ packages/
│  ├─ databases/
│  ├─ schema/
│  └─ timeline/
├─ .env-example
├─ pnpm-workspace.yaml
├─ package.json
├─ SETUP.md
└─ README.md


What this means

apps/ holds runnable applications like the API and web clients.

packages/ holds shared packages for schemas and database.

Root files control workspace boundaries, scripts, and setup instructions.

apps/api
apps/api/
└─ src/
   ├─ routes/
   ├─ services/
   ├─ repos/
   ├─ schema/
   ├─ types/
   ├─ utils/
   ├─ middleware/
   └─ config/


Purpose and contents

routes/ contains HTTP handlers. They validate input, check auth or permissions, and delegate. No domain logic here.

services/ contains domain logic that orchestrates repositories and helpers.

repos/ encapsulates database access via Drizzle. Outgoing data is validated before returning.

schema/ contains API-specific Zod schemas for runtime validation (e.g., route parameters). Shared request/response schemas live in packages/schema. Use this for API-only validation needs like ProjectIdParamsSchema.

types/ contains API-specific TypeScript compile-time types without runtime validation (e.g., TenantHeader). These are pure TS types that exist only during development.

utils/ contains pure helpers such as formatting, ID generation, slug utilities, and tenant extraction. Example: requireTenant(), generateUniqueSlug().

middleware/ contains cross cutting concerns like auth, permission checks, and request logging.

config/ centralizes environment reading and runtime constants.

Key concepts

Auth uses an in memory access token and an httpOnly refresh cookie.

Permissions are wildcard based and seeded for each tenant.

schema/ vs types/: schema/ holds Zod schemas for runtime validation at boundaries. types/ holds pure TypeScript types for compile-time only (no runtime checking).

HTTP patterns: Use httpTyped with Zod validation. It automatically handles JSON.stringify, Content-Type headers, and response validation.

apps/workstation-web
apps/workstation-web/
└─ src/
   ├─ routes/               (or pages/views)
   ├─ components/
   ├─ widgets/
   ├─ state/
   ├─ types/
   ├─ lib/
   └─ styles/


Purpose and contents

routes/ or pages/ contains screen level views wired to the router.

components/ contains reusable UI building blocks.

widgets/ contains grid based modules for dashboards and project views.

state/ contains lightweight application state such as authentication context.

types/ holds all frontend-specific TypeScript types and Zod schemas. Shared API contracts are imported from packages/schema. Use this folder for web-specific extensions, form validation, and UI-only types. Contains response schemas like SuccessResponseSchema that wrap shared contracts.

lib/ contains client utilities such as httpTyped (typed HTTP client with automatic JSON.stringify and Zod validation), auth-client.ts, ws-client.ts, content-client.ts, and token refresh logic.

styles/ contains Tailwind related style setup and any small design system primitives.

Key concepts

The web app keeps the access token in memory and handles refresh through the API.

Widgets are laid out using a grid system for flexible dashboards.

HTTP client: All API calls use httpTyped from lib/http.ts. This helper automatically handles JSON.stringify(body), sets Content-Type headers, validates responses with Zod, and throws typed errors. Never use manual JSON.stringify or httpJson.

Frontend types: Import shared schemas from packages/schema first. Only create local types in src/types for web-specific wrappers or UI-only types.

packages/databases
packages/databases/
├─ src/
│  ├─ schema/
│  │  ├─ users/
│  │  ├─ workstation/
│  │  └─ marketplace/
│  └─ scripts/
│     ├─ bootstrap/
│     ├─ seed/
│     └─ maintenance/
└─ migrations/
   ├─ users/
   ├─ workstation/
   └─ marketplace/


Purpose and contents

src/schema/ contains Drizzle table definitions for each database. This is the source of truth for DB structure.

src/scripts/ contains bootstrap, seed, test, and maintenance scripts for local development and demos.

migrations/ holds generated migration files per database, managed by drizzle kit.

Key concepts

Multi DB approach: users, workstation, and marketplace.

Bootstrap sets up roles, grants, and database options. Seeding provides core data and optional demo tenants and invites.

packages/schema
packages/schema/
└─ src/
   ├─ primitives.ts         # Common schemas: SuccessResponse, ErrorResponse
   ├─ auth/
   ├─ workstation/
   ├─ common/
   ├─ marketplace/
   └─ index.ts              # Barrel exports


Purpose and contents

Shared Zod schemas and inferred types consumed by both API and web.

primitives.ts contains common response schemas like SuccessResponse and ErrorResponse used across all domains.

Organized by domain folders (auth/, workstation/, marketplace/) with a shared common/ area for cross domain contracts.

index.ts provides barrel exports for easy importing.

Scripts and workflow (root)

Install dependencies, then bootstrap and migrate databases.

Seed core data or demo data when needed.

Start API and web dev servers with dedicated scripts.

Diagnostic scripts exist for quick connectivity checks and for nuking and rebuilding local databases.

Architecture principles captured by the file

Zod centric contracts: packages/schema is the canonical source for request and response contracts. API and web validate against the same definitions.

Thin routes, clean layers: Routes only parse, check, and delegate. Services hold domain logic. Repos handle DB access and validate outgoing shapes.

Auth and permissions: Access token in memory and refresh via httpOnly cookie. Wildcard based permission catalog seeded per tenant.

schema/ vs types/ separation: 
  - schema/ = Zod schemas for runtime validation (API boundaries, user input)
  - types/ = Pure TypeScript types for compile-time only (internal structures, headers)
  - packages/schema = Shared schemas used by both API and frontend

HTTP best practices:
  - Frontend: Always use httpTyped, never manual JSON.stringify
  - httpTyped automatically handles: body serialization, Content-Type headers, response validation, error handling
  - Example: httpTyped('/api/endpoint', { method: 'POST', body: { data }, schema: { res: ResponseSchema } })

Naming conventions:
  - Schemas: PascalCase with "Schema" suffix (ProjectIdParamsSchema, SuccessResponse)
  - Types: Inferred via z.infer, PascalCase without suffix (type Project = z.infer<typeof ProjectSchema>)
  - Files: kebab-case (content-client.ts, routes.schema.ts)
  - Functions/variables: camelCase (getUserById, tenantId)

If you want, I can produce a deeper “tree + index” for a single app, for example a focused breakdown of apps/workstation-web/src explaining how routes, widgets, state, and lib collaborate at runtime.