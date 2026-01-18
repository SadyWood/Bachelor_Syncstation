# Base Repository Strategy for Student Teams

## Overview

This document outlines the strategy for creating a reusable base repository that can be copied and customized for four student teams:

1. **hk26-consumer-app** (React Native/Expo) - Mobile app for consuming Hoolsy content
2. **hk26-syncstation-app** (React Native/Expo) - On-set logging companion app
3. **hk26-marketplace-storefront** (React + Vite) - Desktop storefront for Marketplace
4. **hk26-marketplace-vendor-onboarding** (React + Vite) - Vendor onboarding flow

The base repository will be a **pnpm monorepo** with shared tooling, API, database setup, and Docker configuration. Each team will start with this base and then customize it by enabling either the **mobile** app (Expo) or **web** app (React + Vite).

**Critical Design Principle:** All teams must use **identical Zod schemas and data structures** to ensure seamless integration with the broader Hoolsy platform (Workstation, Marketplace core, etc.). This is not about collaboration between teams—it's about ensuring data contracts are consistent across the entire ecosystem.

---

## Architecture Philosophy

### Why a Monorepo?

- **Shared contracts**: Zod schemas and TypeScript types used by both API and frontend
- **Consistent tooling**: ESLint, TypeScript, Prettier configs shared across packages
- **Single source of truth**: Database schemas and migrations in one place
- **Easy development**: Run API + frontend together with single commands
- **Type safety**: Changes to API contracts immediately reflected in frontend types

### Why pnpm?

- Fast, efficient package manager with excellent monorepo support
- Workspaces allow packages to reference each other easily
- Strict dependency management prevents phantom dependencies

### Shared Database Architecture

The base repository includes **three PostgreSQL databases** that reflect the Hoolsy platform structure:

1. **`user_db`** - Shared user authentication, tenants, and access control (multi-tenant architecture)
2. **`workstation_db`** - Content nodes, hierarchies, and project structure
3. **`app_db`** - Application-specific data (customizable per team)

**Why separate databases?**
- **Isolation:** Clear separation of concerns (auth vs. content vs. app-specific)
- **Reusability:** USER and Workstation databases mirror the production Hoolsy platform
- **Multi-tenancy:** Enforces tenant isolation at the database level
- **Future-proofing:** Teams can extend their app database without affecting shared schemas

**Important:** The `user_db` and `workstation_db` schemas are **pre-defined** and include dummy/seed data. Teams should **not** modify these schemas—they represent the shared platform foundation.

---

## Base Repository Structure

```
hk26-base-repo/
├─ apps/
│  ├─ api/                      # Node.js + TypeScript API (Fastify)
│  ├─ mobile/                   # React Native + Expo app (optional)
│  └─ web/                      # React + Vite app (optional)
│
├─ packages/
│  ├─ databases/                # Database layer packages
│  │  └─ postgres/              # PostgreSQL schemas, migrations, seeding
│  │     ├─ src/
│  │     │  ├─ schema/          # Database schemas (users, app-specific)
│  │     │  ├─ scripts/         # Seed scripts, bootstrap, test-db
│  │     │  └─ index.ts         # Drizzle client exports
│  │     ├─ migrations/         # Generated migration files
│  │     └─ package.json
│  │
│  ├─ schema/                   # Shared Zod schemas + TypeScript types
│  │  ├─ src/
│  │  │  ├─ auth/               # Auth-related schemas
│  │  │  ├─ api/                # API request/response schemas
│  │  │  └─ index.ts            # Re-exports all schemas
│  │  └─ package.json
│  │
│  ├─ eslint-config/            # Shared ESLint configuration
│  │  ├─ base.js                # Base config for all packages
│  │  ├─ react.js               # React-specific config
│  │  ├─ react-native.js        # React Native config
│  │  └─ package.json
│  │
│  └─ tsconfig/                 # Shared TypeScript configs
│     ├─ base.json              # Base TS config
│     ├─ react.json             # React app config
│     ├─ react-native.json      # React Native config
│     └─ package.json
│
├─ docker/
│  ├─ docker-compose.yml        # PostgreSQL + optional Redis
│  └─ postgres/
│     └─ init/
│        └─ 01-init.sql         # Database initialization
│
├─ .env.example                 # Template environment variables
├─ .gitignore
├─ pnpm-workspace.yaml          # pnpm workspace configuration
├─ package.json                 # Root scripts (dev, build, db:*)
├─ turbo.json                   # (Optional) Turborepo config for caching
├─ SETUP.md                     # Setup instructions for students
└─ README.md                    # Repository overview
```

---

## Package Breakdown

### `apps/api/` - Node.js API

**Purpose:** Shared backend API with authentication, basic CRUD, and placeholder endpoints.

**Stack:**
- Node.js + TypeScript
- Fastify (fast, type-safe HTTP server)
- Drizzle ORM (type-safe database access)
- Zod validation (shared with frontend via `packages/schema`)

**Key Files:**
```
apps/api/
├─ src/
│  ├─ routes/
│  │  ├─ auth.ts           # Login, register, logout, refresh
│  │  └─ health.ts         # Health check endpoint
│  ├─ middleware/
│  │  └─ auth.ts           # JWT verification middleware
│  ├─ lib/
│  │  ├─ db.ts             # Drizzle client setup
│  │  └─ jwt.ts            # Token generation/verification
│  ├─ app.ts               # Fastify app setup
│  └─ server.ts            # Entry point
├─ .env.example
├─ package.json
└─ tsconfig.json
```

**Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db

# JWT
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Server
PORT=3333
NODE_ENV=development
```

**Scripts:**
```json
{
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js"
}
```

---

### `apps/mobile/` - React Native + Expo

**Purpose:** Mobile app skeleton for React Native teams (Consumer App, Syncstation).

**Stack:**
- React Native + Expo (Expo Go for easy testing)
- React Navigation (routing)
- TanStack Query (API data fetching)
- Zod validation (shared schemas from `packages/schema`)

**Key Files:**
```
apps/mobile/
├─ src/
│  ├─ screens/
│  │  ├─ LoginScreen.tsx
│  │  ├─ HomeScreen.tsx
│  │  └─ index.ts
│  ├─ components/
│  │  ├─ Button.tsx
│  │  ├─ Input.tsx
│  │  └─ index.ts
│  ├─ navigation/
│  │  └─ AppNavigator.tsx
│  ├─ api/
│  │  ├─ client.ts         # Axios/fetch wrapper
│  │  └─ auth.ts           # Auth API calls
│  ├─ hooks/
│  │  └─ useAuth.ts
│  ├─ context/
│  │  └─ AuthContext.tsx
│  └─ App.tsx
├─ app.json                # Expo configuration
├─ babel.config.js
├─ metro.config.js
├─ package.json
└─ tsconfig.json
```

**Key Dependencies:**
```json
{
  "dependencies": {
    "expo": "~51.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "@react-navigation/native": "^6.1.0",
    "@react-navigation/stack": "^6.3.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "@hk26/schema": "workspace:*"
  }
}
```

**Scripts:**
```json
{
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web"
}
```

---

### `apps/web/` - React + Vite

**Purpose:** Web app skeleton for frontend teams (Marketplace Storefront, Vendor Onboarding).

**Stack:**
- React 19 + Vite
- React Router (routing)
- TanStack Query (API data fetching)
- TailwindCSS (styling)
- Zod validation (shared schemas)

**Key Files:**
```
apps/web/
├─ src/
│  ├─ pages/
│  │  ├─ LoginPage.tsx
│  │  ├─ HomePage.tsx
│  │  └─ index.ts
│  ├─ components/
│  │  ├─ Button.tsx
│  │  ├─ Input.tsx
│  │  └─ ui/               # UI component library
│  ├─ api/
│  │  ├─ client.ts         # Fetch wrapper with auth
│  │  └─ auth.ts
│  ├─ hooks/
│  │  └─ useAuth.ts
│  ├─ context/
│  │  └─ AuthContext.tsx
│  ├─ router.tsx           # React Router setup
│  ├─ App.tsx
│  └─ main.tsx
├─ public/
├─ index.html
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.js
├─ package.json
└─ tsconfig.json
```

**Key Dependencies:**
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "axios": "^1.6.0",
    "zod": "^3.22.0",
    "@hk26/schema": "workspace:*"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

**Scripts:**
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

### `packages/databases/postgres/` - PostgreSQL Database Layer

**Purpose:** Centralized database schemas, migrations, and seeding scripts for all three databases.

**Stack:**
- PostgreSQL (via Docker)
- Drizzle ORM (type-safe schema definitions)
- Drizzle Kit (migration generation)

**Structure:**
```
packages/databases/postgres/
├─ src/
│  ├─ schema/
│  │  ├─ user/                    # USER database schemas
│  │  │  ├─ users.ts              # User accounts
│  │  │  ├─ tenants.ts            # Multi-tenant structure
│  │  │  ├─ roles.ts              # Roles and permissions
│  │  │  └─ index.ts              # Export user schemas
│  │  ├─ workstation/             # WORKSTATION database schemas
│  │  │  ├─ content_nodes.ts      # Content hierarchy (projects, groups, episodes)
│  │  │  ├─ node_metadata.ts      # Metadata for content nodes
│  │  │  └─ index.ts              # Export workstation schemas
│  │  ├─ app/                     # APP database schemas (team-specific)
│  │  │  ├─ placeholder.ts        # Example app-specific table
│  │  │  └─ index.ts              # Export app schemas
│  │  └─ index.ts                 # Export all schemas
│  ├─ scripts/
│  │  ├─ bootstrap-db.ts          # Create all databases and roles
│  │  ├─ seed-user.ts             # Seed USER db with dummy users, tenants, roles
│  │  ├─ seed-workstation.ts      # Seed Workstation db with dummy projects, nodes
│  │  ├─ seed-app.ts              # Seed app-specific dummy data
│  │  ├─ test-db.ts               # Test connectivity to all databases
│  │  └─ reset-db.ts              # Drop, recreate, migrate, and seed all databases
│  ├─ clients/
│  │  ├─ user-db.ts               # Drizzle client for user_db
│  │  ├─ workstation-db.ts        # Drizzle client for workstation_db
│  │  ├─ app-db.ts                # Drizzle client for app_db
│  │  └─ index.ts                 # Export all clients
│  └─ index.ts                    # Main export
├─ migrations/
│  ├─ user/                       # USER database migrations
│  ├─ workstation/                # Workstation database migrations
│  └─ app/                        # App database migrations
├─ drizzle.config.ts              # Drizzle Kit configuration (multi-database)
├─ package.json
└─ tsconfig.json
```

**Example Schema (`src/schema/user/users.ts`):**
```typescript
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Example Schema (`src/schema/workstation/content_nodes.ts`):**
```typescript
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const contentNodes = pgTable('content_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // 'root', 'group', 'episode', etc.
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id'), // Self-referencing hierarchy
  tenantId: uuid('tenant_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Dummy Data Strategy:**

Each seeding script creates realistic, usable dummy data:

**`seed-user.ts`:**
- 2-3 demo tenants (e.g., "Demo Production Company", "Test Studio")
- 5-10 demo users across different tenants
- Basic role assignments (admin, editor, viewer)
- Pre-hashed passwords (e.g., `demo@example.com` / `demopassword`)

**`seed-workstation.ts`:**
- Root nodes (projects) for each tenant
- Group nodes (folders/collections)
- Content nodes (episodes, scenes) in a realistic hierarchy
- Metadata examples

**`seed-app.ts`:**
- Team-specific dummy data (customizable per team)
- Example: For Syncstation, this might include sample log entries
- Example: For Marketplace, this might include sample products/vendors

**Scripts:**
```json
{
  "db:bootstrap": "tsx src/scripts/bootstrap-db.ts",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "tsx src/scripts/migrate.ts",
  "db:seed": "tsx src/scripts/seed-user.ts && tsx src/scripts/seed-workstation.ts && tsx src/scripts/seed-app.ts",
  "db:reset": "tsx src/scripts/reset-db.ts",
  "db:test": "tsx src/scripts/test-db.ts"
}
```

**Usage:**
```typescript
// In API code
import { userDb, workstationDb, appDb } from '@hk26/postgres';

// Query USER database
const user = await userDb.query.users.findFirst({
  where: eq(users.email, 'demo@example.com'),
});

// Query Workstation database
const nodes = await workstationDb.query.contentNodes.findMany({
  where: eq(contentNodes.tenantId, user.tenantId),
});
```

---

### `packages/schema/` - Shared Zod Schemas

**Purpose:** Single source of truth for API request/response types and validation. **CRITICAL** for ensuring data consistency across all Hoolsy systems.

**Why This Matters:**
- All teams **must** use identical Zod schemas for shared entities (users, content nodes, products, vendors, subjects)
- Field names, ID formats, and data structures **must match exactly** across systems
- Example: If Marketplace core uses `tenant_id`, **do not** use `companyId` or `organizationId`
- Example: If a product has `title`, **do not** use `productName` or `name`
- This is a **data contract** — deviations will break integration between systems

**Stack:**
- Zod (runtime validation + TypeScript inference)

**Structure:**
```
packages/schema/
├─ src/
│  ├─ auth/
│  │  ├─ login.ts              # Login request/response schemas
│  │  ├─ register.ts           # Registration schemas
│  │  └─ index.ts
│  ├─ user/
│  │  ├─ user.ts               # User entity schema
│  │  ├─ tenant.ts             # Tenant entity schema
│  │  └─ index.ts
│  ├─ workstation/
│  │  ├─ content-node.ts       # Content node hierarchy schemas
│  │  └─ index.ts
│  ├─ marketplace/             # Marketplace-specific schemas
│  │  ├─ product.ts            # Product entity (SHARED with Marketplace core)
│  │  ├─ vendor.ts             # Vendor entity (SHARED with Marketplace core)
│  │  ├─ category.ts           # Category/taxonomy
│  │  └─ index.ts
│  ├─ syncstation/             # Syncstation-specific schemas
│  │  ├─ log-entry.ts          # On-set log entry
│  │  ├─ sync-status.ts        # Sync state
│  │  └─ index.ts
│  ├─ subject/                 # Subject/entity schemas (Consumer app)
│  │  ├─ subject.ts            # Subject entity
│  │  ├─ subject-list.ts       # Subject list response
│  │  └─ index.ts
│  ├─ api/
│  │  ├─ common.ts             # Common API types (pagination, errors)
│  │  ├─ response.ts           # Standard API response wrappers
│  │  └─ index.ts
│  └─ index.ts                 # Re-export all schemas
├─ package.json
└─ tsconfig.json
```

**Example Schema (`src/auth/login.ts`):**
```typescript
import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().nullable(),
    tenantId: z.string().uuid(), // Critical: matches database schema
  }),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
```

**Example Schema (`src/marketplace/product.ts`):**
```typescript
import { z } from 'zod';

// CRITICAL: This schema MUST match Marketplace core exactly
export const productSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),                    // NOT "productName" or "name"
  brand: z.string().nullable(),
  image: z.string().url().nullable(),
  category: z.string(),
  availability: z.enum(['in_stock', 'out_of_stock', 'preorder']),
  price: z.number().positive(),
  currency: z.string().length(3),       // ISO 4217 (e.g., "USD", "NOK")
  tenantId: z.string().uuid(),          // NOT "vendorId" or "companyId"
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof productSchema>;
```

**Example Schema (`src/syncstation/log-entry.ts`):**
```typescript
import { z } from 'zod';

export const logEntrySchema = z.object({
  id: z.string().uuid(),
  contentNodeId: z.string().uuid(),     // References Workstation content_nodes
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
  notes: z.string().nullable(),
  mediaUrls: z.array(z.string().url()), // Attached images/videos
  fileUrls: z.array(z.string().url()),  // Attached documents
  syncStatus: z.enum(['local', 'pending', 'synced', 'failed']),
  createdAt: z.string().datetime(),
  syncedAt: z.string().datetime().nullable(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;
```

**Usage in API:**
```typescript
import { loginRequestSchema, loginResponseSchema } from '@hk26/schema';

app.post('/auth/login', async (req, reply) => {
  const body = loginRequestSchema.parse(req.body); // Validates + types
  // ... auth logic
  return loginResponseSchema.parse(result); // Validates response
});
```

**Usage in Frontend:**
```typescript
import { loginRequestSchema, type LoginResponse } from '@hk26/schema';

const handleLogin = async (data: unknown) => {
  const validated = loginRequestSchema.parse(data); // Validate form data
  const response = await api.post<LoginResponse>('/auth/login', validated);
  return response.data;
};
```

**Data Contract Enforcement:**

All teams working on related systems (Marketplace Storefront, Marketplace Vendor Onboarding, Consumer App, Syncstation) **must**:

1. Import schemas from `@hk26/schema` — never create duplicate schemas
2. Use **exact** field names as defined in the shared schemas
3. Never add custom fields that deviate from the shared contract
4. If new fields are needed, discuss with other teams and add to shared schema
5. Run schema validation on **both** client and server side

**Example of INCORRECT usage:**
```typescript
// ❌ WRONG - Custom schema with different field names
const myProductSchema = z.object({
  productId: z.string(),        // Should be "id"
  productName: z.string(),      // Should be "title"
  companyId: z.string(),        // Should be "tenantId"
});
```

**Example of CORRECT usage:**
```typescript
// ✅ CORRECT - Import and use shared schema
import { productSchema, type Product } from '@hk26/schema';

const product: Product = {
  id: '...',
  title: '...',
  tenantId: '...',
  // ... other fields matching the shared schema
};
```

---

### `packages/eslint-config/` - Shared ESLint Config

**Purpose:** Consistent linting rules across all packages.

**Structure:**
```
packages/eslint-config/
├─ base.js                 # Base config for all TypeScript
├─ react.js                # React web config
├─ react-native.js         # React Native config
└─ package.json
```

**Example (`base.js`):**
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
  },
};
```

**Usage in packages:**
```json
{
  "eslintConfig": {
    "extends": ["@hk26/eslint-config/base"]
  }
}
```

---

### `packages/tsconfig/` - Shared TypeScript Configs

**Purpose:** Consistent TypeScript compiler settings.

**Structure:**
```
packages/tsconfig/
├─ base.json               # Base TS config
├─ react.json              # React web extension
├─ react-native.json       # React Native extension
└─ package.json
```

**Example (`base.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

**Usage in packages:**
```json
{
  "extends": "@hk26/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist"
  }
}
```

---

## Docker Setup

### `docker/docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: hk26-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: hk26-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
  redis-data:
```

### `docker/postgres/init/01-init.sql`

```sql
-- ============================================
-- Initialize Hoolsy Student Base Repository
-- ============================================
-- This script sets up three databases:
-- 1. user_db - User authentication and multi-tenant access control
-- 2. workstation_db - Content hierarchy and project structure
-- 3. app_db - Application-specific data (customizable per team)

-- Create users
CREATE USER user_service WITH PASSWORD 'user_password';
CREATE USER workstation_service WITH PASSWORD 'workstation_password';
CREATE USER app_user WITH PASSWORD 'app_password';

-- ============================================
-- USER Database
-- ============================================
CREATE DATABASE user_db OWNER user_service;
\c user_db

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL ON SCHEMA public TO user_service;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE user_service IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE user_service IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- ============================================
-- WORKSTATION Database
-- ============================================
\c postgres
CREATE DATABASE workstation_db OWNER workstation_service;
\c workstation_db

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant privileges
GRANT ALL ON SCHEMA public TO workstation_service;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES FOR ROLE workstation_service IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES FOR ROLE workstation_service IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO app_user;

-- ============================================
-- APP Database (customizable per team)
-- ============================================
\c postgres
CREATE DATABASE app_db OWNER app_user;
\c app_db

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant full privileges to app_user
GRANT ALL ON SCHEMA public TO app_user;

-- ============================================
-- Summary
-- ============================================
-- Three databases created:
-- - user_db (for authentication, tenants, roles)
-- - workstation_db (for content nodes, hierarchy)
-- - app_db (for team-specific data)
--
-- Run migrations and seeding via:
-- pnpm db:reset
```

**Database Connection Strings:**

```env
# USER database (read-only for apps)
USER_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/user_db

# WORKSTATION database (read-only for apps)
WORKSTATION_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/workstation_db

# APP database (full access)
APP_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db

# Admin access for migrations
USER_DATABASE_URL_ADMIN=postgresql://user_service:user_password@localhost:5432/user_db
WORKSTATION_DATABASE_URL_ADMIN=postgresql://workstation_service:workstation_password@localhost:5432/workstation_db
APP_DATABASE_URL_ADMIN=postgresql://app_user:app_password@localhost:5432/app_db
```

---

## Root Configuration Files

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

### Root `package.json`

```json
{
  "name": "hk26-base-repo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev:api": "pnpm --filter @hk26/api dev",
    "dev:web": "pnpm --filter @hk26/web dev",
    "dev:mobile": "pnpm --filter @hk26/mobile start",

    "build": "pnpm --recursive build",
    "build:api": "pnpm --filter @hk26/api build",
    "build:web": "pnpm --filter @hk26/web build",

    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down",
    "docker:logs": "docker compose -f docker/docker-compose.yml logs -f",
    "docker:reset": "docker compose -f docker/docker-compose.yml down -v && pnpm docker:up",

    "db:bootstrap": "pnpm --filter @hk26/postgres db:bootstrap",
    "db:generate": "pnpm --filter @hk26/postgres db:generate",
    "db:migrate": "pnpm --filter @hk26/postgres db:migrate",
    "db:seed": "pnpm --filter @hk26/postgres db:seed",
    "db:reset": "pnpm --filter @hk26/postgres db:reset",
    "db:test": "pnpm --filter @hk26/postgres db:test",

    "setup": "pnpm install && pnpm docker:up && pnpm db:reset",

    "lint": "pnpm --recursive lint",
    "lint:fix": "pnpm --recursive lint:fix",
    "typecheck": "pnpm --recursive typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "clean": "pnpm --recursive clean"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "prettier": "^3.1.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

**Key Scripts Explained:**

- **`pnpm setup`** - Complete setup: install dependencies, start Docker, reset databases (ideal for first-time setup)
- **`pnpm dev:api`** - Start API server in watch mode
- **`pnpm dev:web`** - Start web app (React + Vite)
- **`pnpm dev:mobile`** - Start mobile app (Expo Go)
- **`pnpm docker:up`** - Start PostgreSQL and Redis in Docker
- **`pnpm docker:reset`** - Destroy and recreate Docker volumes (fresh database)
- **`pnpm db:reset`** - Drop all databases, run migrations, seed with dummy data
- **`pnpm db:test`** - Test connectivity to all three databases
- **`pnpm lint`** - Run ESLint across all packages
- **`pnpm typecheck`** - Run TypeScript compiler across all packages

---

### `.env.example`

```env
# ============================================
# API Configuration
# ============================================
PORT=3333
NODE_ENV=development

# ============================================
# Database Configuration
# ============================================
# USER database (authentication, tenants, roles)
USER_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/user_db

# WORKSTATION database (content nodes, hierarchy)
WORKSTATION_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/workstation_db

# APP database (team-specific data)
APP_DATABASE_URL=postgresql://app_user:app_password@localhost:5432/app_db

# Admin URLs for running migrations (DO NOT use in API code)
USER_DATABASE_URL_ADMIN=postgresql://user_service:user_password@localhost:5432/user_db
WORKSTATION_DATABASE_URL_ADMIN=postgresql://workstation_service:workstation_password@localhost:5432/workstation_db
APP_DATABASE_URL_ADMIN=postgresql://app_user:app_password@localhost:5432/app_db

# ============================================
# JWT Secrets
# ============================================
# Generate with: openssl rand -base64 32
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Access token expiry (e.g., 15m, 1h, 7d)
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ============================================
# Redis (Optional - for caching, sessions)
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# CORS Configuration
# ============================================
# Web dev server
CORS_ORIGIN=http://localhost:5173
# For mobile (Expo Go), add your local IP
# CORS_ORIGIN=http://localhost:5173,exp://192.168.1.100:8081

# ============================================
# File Upload (Optional)
# ============================================
# Max file size in bytes (e.g., 10MB)
MAX_FILE_SIZE=10485760
# Allowed file types (comma-separated)
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf

# ============================================
# Logging
# ============================================
LOG_LEVEL=debug
```

---

## Setup Documentation

### `SETUP.md`

```markdown
# Setup Guide

Follow these steps to get the project running locally.

## Prerequisites

- **Node.js 20+** (LTS recommended)
- **pnpm 8+** (install with `npm install -g pnpm`)
- **Docker Desktop** (running and configured)

Check versions:
\`\`\`bash
node --version   # Should be 20.x or higher
pnpm --version   # Should be 8.x or higher
docker --version # Should be installed and running
\`\`\`

---

## Quick Start (Automated Setup)

For first-time setup, run:

\`\`\`bash
git clone <your-repo>
cd <your-repo>

# Copy environment variables
cp .env.example .env

# Generate JWT secrets (macOS/Linux)
sed -i '' "s/your-access-secret-here/$(openssl rand -base64 32)/" .env
sed -i '' "s/your-refresh-secret-here/$(openssl rand -base64 32)/" .env

# Run automated setup (install deps + Docker + databases)
pnpm setup
\`\`\`

This will:
1. Install all dependencies
2. Start Docker services (PostgreSQL, Redis)
3. Create three databases: `user_db`, `workstation_db`, `app_db`
4. Run migrations
5. Seed dummy data

**Once complete, skip to Step 5 to start the dev servers.**

---

## Manual Setup (Step-by-Step)

If the automated setup fails, or you prefer manual control, follow these steps:

### 1. Clone and Install Dependencies

\`\`\`bash
git clone <your-repo>
cd <your-repo>
pnpm install
\`\`\`

### 2. Environment Variables

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and update:
- **`JWT_ACCESS_SECRET`** - Generate with: `openssl rand -base64 32`
- **`JWT_REFRESH_SECRET`** - Generate with: `openssl rand -base64 32`
- (Optional) Update `CORS_ORIGIN` if using Expo Go on a physical device

### 3. Start Docker Services

\`\`\`bash
pnpm docker:up
\`\`\`

Wait for PostgreSQL to be healthy:
\`\`\`bash
docker ps
\`\`\`

You should see `hk26-postgres` with status "Up" and "healthy".

If you see any errors, check Docker Desktop is running and ports 5432 (Postgres) and 6379 (Redis) are available.

### 4. Database Setup

\`\`\`bash
# Reset all databases (drop, create, migrate, seed)
pnpm db:reset
\`\`\`

This will:
1. Drop existing databases (if any)
2. Create `user_db`, `workstation_db`, `app_db`
3. Run Drizzle migrations
4. Seed dummy data:
   - **user_db**: 2-3 demo tenants, 5-10 demo users
   - **workstation_db**: Project hierarchies with content nodes
   - **app_db**: Team-specific dummy data

**Test database connectivity:**
\`\`\`bash
pnpm db:test
\`\`\`

You should see successful connections to all three databases.

---

### 5. Start Development Servers

**API:**
\`\`\`bash
pnpm dev:api
\`\`\`
API runs on [http://localhost:3333](http://localhost:3333)

**Web (React + Vite):**
\`\`\`bash
pnpm dev:web
\`\`\`
Web app runs on [http://localhost:5173](http://localhost:5173)

**Mobile (React Native + Expo):**
\`\`\`bash
pnpm dev:mobile
\`\`\`
Expo DevTools opens in browser. Use **Expo Go** app on your phone to scan the QR code.

**Note:** For mobile development, ensure your phone and computer are on the **same Wi-Fi network**.

---

## Testing the Setup

### Health Check

\`\`\`bash
curl http://localhost:3333/health
\`\`\`

Expected response:
\`\`\`json
{"status":"ok","timestamp":"2026-01-16T..."}
\`\`\`

### Database Connectivity

\`\`\`bash
pnpm db:test
\`\`\`

Expected output:
\`\`\`
✅ USER database connected
✅ WORKSTATION database connected
✅ APP database connected
\`\`\`

### Login with Demo User

\`\`\`bash
curl -X POST http://localhost:3333/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"demo@example.com","password":"demopassword"}'
\`\`\`

Expected response:
\`\`\`json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "demo@example.com",
    "name": "Demo User",
    "tenantId": "..."
  }
}
\`\`\`

---

## Database Overview

This project uses **three separate PostgreSQL databases**:

| Database | Purpose | Access Level |
|----------|---------|--------------|
| **user_db** | User authentication, tenants, roles | Read-only (apps), Full (migrations) |
| **workstation_db** | Content nodes, project hierarchy | Read-only (apps), Full (migrations) |
| **app_db** | Team-specific application data | Full access |

**Why three databases?**
- **Isolation:** Clear separation of concerns
- **Reusability:** USER and Workstation match production Hoolsy platform
- **Multi-tenancy:** Enforces tenant isolation
- **Security:** Apps have read-only access to shared databases

**Important:** Do **not** modify `user_db` or `workstation_db` schemas. These are pre-defined and shared across teams.

---

## Dummy Data

The database seeding creates realistic dummy data for testing:

**USER database:**
- **Tenants:** "Demo Production Company", "Test Studio"
- **Users:** `demo@example.com` / `demopassword` (and 4-9 more users)
- **Roles:** Admin, Editor, Viewer

**WORKSTATION database:**
- **Root nodes:** Projects for each tenant
- **Group nodes:** Folders/collections
- **Content nodes:** Episodes, scenes in realistic hierarchy

**APP database:**
- Team-specific data (varies by team)
- Example: Log entries (Syncstation), Products (Marketplace)

---

## Common Issues

### Port Already in Use

**Symptoms:** `Error: listen EADDRINUSE: address already in use :::3333`

**Solution:**
- **API:** Change `PORT` in `.env` (e.g., `PORT=3334`)
- **Web:** Vite will auto-increment if 5173 is taken
- **PostgreSQL:** Stop other Postgres instances or change port in `docker-compose.yml`

### Database Connection Failed

**Symptoms:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
1. Check Docker: `docker ps` (postgres should show "healthy")
2. Check `.env`: Database URLs should match Docker credentials
3. Restart Docker: `pnpm docker:reset && pnpm db:reset`
4. Check Docker Desktop is running

### Docker Not Starting

**Symptoms:** `Cannot connect to the Docker daemon`

**Solution:**
- Ensure **Docker Desktop** is running
- On macOS: Check Docker Desktop in Applications
- On Windows: Check Docker Desktop is running in system tray
- Restart Docker Desktop and try again

### Expo Go Not Connecting

**Symptoms:** Mobile app can't reach API or shows network error

**Solution:**
1. Ensure phone and computer are on **same Wi-Fi network**
2. Find your local IP: `ifconfig` (macOS/Linux) or `ipconfig` (Windows)
3. Update `CORS_ORIGIN` in `.env`:
   \`\`\`env
   CORS_ORIGIN=http://localhost:5173,exp://192.168.1.100:8081
   \`\`\`
   Replace `192.168.1.100` with your actual local IP
4. Restart API: `pnpm dev:api`

### Migration Errors

**Symptoms:** `Error: relation "users" already exists`

**Solution:**
\`\`\`bash
# Drop all databases and start fresh
pnpm docker:reset
pnpm db:reset
\`\`\`

### TypeScript Errors in IDE

**Symptoms:** IDE shows type errors but code compiles fine

**Solution:**
1. Restart TypeScript server in IDE
2. Run: `pnpm typecheck` to verify types are correct
3. Ensure `node_modules` is fully installed: `pnpm install`

---

## Useful Commands

### Docker Commands

\`\`\`bash
# Start Docker services
pnpm docker:up

# Stop Docker services
pnpm docker:down

# View Docker logs
pnpm docker:logs

# Reset Docker (destroy volumes, fresh start)
pnpm docker:reset
\`\`\`

### Database Commands

\`\`\`bash
# Test database connectivity
pnpm db:test

# Generate new migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed databases
pnpm db:seed

# Full reset (drop, migrate, seed)
pnpm db:reset
\`\`\`

### Development Commands

\`\`\`bash
# Start API
pnpm dev:api

# Start web app
pnpm dev:web

# Start mobile app
pnpm dev:mobile

# Run all builds
pnpm build

# Run linting
pnpm lint

# Fix linting issues
pnpm lint:fix

# Run type checking
pnpm typecheck

# Format code with Prettier
pnpm format

# Clean build artifacts
pnpm clean
\`\`\`

---

## Getting Help

If you encounter issues not covered here:

1. Check Docker Desktop is running
2. Verify Node.js and pnpm versions meet requirements
3. Try `pnpm docker:reset && pnpm db:reset`
4. Check the project README for team-specific notes
5. Ask your supervisor or Mathias Haslien ([mathias@hoolsy.com](mailto:mathias@hoolsy.com))

---

## Next Steps

Once setup is complete:

1. Explore the API endpoints in `apps/api/src/routes/`
2. Review the database schemas in `packages/databases/postgres/src/schema/`
3. Understand the Zod schemas in `packages/schema/src/`
4. Start building your team's specific features
5. Refer to your team's task documentation for requirements

**Happy coding!** 🚀
\`\`\`

---

## Customization Strategy

### For Each Team Repo

When copying the base repo for a specific team, follow this process:

#### **Step 1: Copy Base Repo**
```bash
# Clone base repo
git clone <base-repo-url> hk26-consumer-app
cd hk26-consumer-app

# Remove git history (start fresh)
rm -rf .git
git init
```

#### **Step 2: Choose App Type**

**For Mobile Teams (Consumer App, Syncstation):**
1. Keep `apps/mobile/`
2. Delete `apps/web/`
3. Update root `package.json` scripts (remove `dev:web`, `build:web`)

**For Web Teams (Marketplace Storefront, Vendor Onboarding):**
1. Keep `apps/web/`
2. Delete `apps/mobile/`
3. Update root `package.json` scripts (remove `dev:mobile`)

#### **Step 3: Customize Naming**

Update `package.json` files to match team name:

**Root `package.json`:**
```json
{
  "name": "hk26-consumer-app",
  ...
}
```

**All workspace packages:**
- `@hk26/api` → Keep as is (or rename to `@consumer-app/api`)
- `@hk26/mobile` → `@consumer-app/mobile`
- `@hk26/schema` → `@consumer-app/schema`
- etc.

#### **Step 4: Update Documentation**

**README.md:**
- Change title to team name
- Update description for team's specific project
- Remove references to unused app type

**SETUP.md:**
- Update repo name
- Remove setup steps for unused app type

#### **Step 5: Commit Initial State**

```bash
git add .
git commit -m "Initial setup from base template"
git remote add origin <team-repo-url>
git push -u origin main
```

---

## Relationship to hoolsy-platforms

The base repository is designed to be a **simplified, student-friendly version** of the production `hoolsy-platforms` monorepo:

### What's Shared

- **Database structure:** USER and Workstation databases mirror the production schemas
- **Zod schemas:** Data contracts match production for seamless future integration
- **Architecture patterns:** Multi-tenant design, content node hierarchy, role-based access
- **Tooling:** Drizzle ORM, TypeScript, Fastify, pnpm workspaces

### What's Different

| Aspect | hoolsy-platforms (Production) | hk26-base-repo (Student) |
|--------|------------------------------|--------------------------|
| **Databases** | PostgreSQL, Neo4j, MongoDB, TimescaleDB | PostgreSQL only |
| **Auth** | Multi-tenant RBAC with wildcard permissions | Simple JWT with basic roles |
| **Frontend** | Complex widget system, timeline editor | Basic routing, forms, and components |
| **API** | Complex domain logic, media handling, integrations | Simple CRUD + auth |
| **Seeding** | Production-ready demo data | Minimal dummy/test data |
| **Scope** | Full production platform | Learning skeleton |

### References to hoolsy-platforms

Students are provided with links to:

1. **User database documentation** - [PR #1](https://github.com/Hoolsy-com/hoolsy-platforms/pull/1) showing how USER database was implemented
2. **Content nodes documentation** - [PR #3](https://github.com/Hoolsy-com/hoolsy-platforms/pull/3) showing Workstation database implementation

These are for **context only**, not as requirements to understand or replicate. The goal is to give students a sense of the broader platform architecture without overwhelming them.

**Key Principle:** Students build on a **clean foundation** that matches production patterns, so their work can integrate with the real platform later without major rewrites.

---

## Implementation Checklist

### Phase 1: Create Base Repo Structure
- [ ] Create root directory and pnpm workspace config
- [ ] Set up Docker Compose with PostgreSQL (3 databases)
- [ ] Create `packages/database/` with USER, Workstation, and APP schemas
- [ ] Create `packages/schema/` with auth, user, workstation, marketplace, syncstation schemas
- [ ] Create `packages/eslint-config/` and `packages/tsconfig/`
- [ ] Set up Docker init script (`01-init.sql`) for three databases

### Phase 2: Build Database Layer
- [ ] Implement USER database schema (users, tenants, roles)
- [ ] Implement Workstation database schema (content_nodes, metadata)
- [ ] Implement APP database schema (placeholder for team customization)
- [ ] Create database clients for each database (userDb, workstationDb, appDb)
- [ ] Implement migration scripts for all databases
- [ ] Implement seeding scripts with realistic dummy data
- [ ] Test database connectivity and seeding

### Phase 3: Build API
- [ ] Create `apps/api/` with Fastify setup
- [ ] Implement health check endpoint
- [ ] Implement auth endpoints (login, register, refresh, logout)
- [ ] Add JWT middleware with multi-tenant support
- [ ] Add basic user CRUD endpoints
- [ ] Test with Postman/curl
- [ ] Ensure proper error handling and Zod validation

### Phase 4: Build Mobile App
- [ ] Create `apps/mobile/` with Expo
- [ ] Set up React Navigation
- [ ] Implement login screen
- [ ] Implement home screen
- [ ] Implement basic offline-first data persistence (for Syncstation guidance)
- [ ] Connect to API with TanStack Query
- [ ] Test on physical device with Expo Go

### Phase 5: Build Web App
- [ ] Create `apps/web/` with React + Vite
- [ ] Set up React Router
- [ ] Set up TailwindCSS
- [ ] Implement login page
- [ ] Implement home page
- [ ] Connect to API with TanStack Query
- [ ] Test in browser

### Phase 6: Documentation
- [ ] Write comprehensive README.md
- [ ] Write step-by-step SETUP.md with troubleshooting
- [ ] Document API endpoints with example requests/responses
- [ ] Add inline code comments explaining multi-tenant patterns
- [ ] Create `.env.example` with all variables and detailed comments
- [ ] Document database architecture and relationships
- [ ] Explain Zod schema importance and data contract enforcement

### Phase 7: Testing & Polish
- [ ] Test full setup flow on clean machine
- [ ] Verify all scripts work (`dev:*`, `build:*`, `db:*`, `docker:*`)
- [ ] Ensure ESLint passes across all packages
- [ ] Ensure TypeScript compiles without errors
- [ ] Add basic error handling in API and frontends
- [ ] Test dummy data login flow end-to-end
- [ ] Verify mobile app works on both iOS and Android (Expo Go)

### Phase 8: Deploy to GitHub
- [ ] Create `hk26-base-repo` in Hoolsy-Students org
- [ ] Push initial commit
- [ ] Set repo to private
- [ ] Add comprehensive README for students
- [ ] Tag initial version (v1.0.0)

### Phase 9: Copy to Team Repos
- [ ] Copy base to `hk26-consumer-app` (remove web, keep mobile)
  - [ ] Customize README for Consumer App team
  - [ ] Customize APP database schema for subject/preferences
- [ ] Copy base to `hk26-syncstation-app` (remove web, keep mobile)
  - [ ] Customize README for Syncstation team
  - [ ] Customize APP database schema for log entries, sync status
- [ ] Copy base to `hk26-marketplace-storefront` (remove mobile, keep web)
  - [ ] Customize README for Marketplace Storefront team
  - [ ] Customize APP database schema for products (or keep as reference)
- [ ] Copy base to `hk26-marketplace-vendor-onboarding` (remove mobile, keep web)
  - [ ] Customize README for Vendor Onboarding team
  - [ ] Customize APP database schema for vendor onboarding flow

---

## Key Differences from hoolsy-platforms

The student base repo will be **simpler** than the full hoolsy-platforms monorepo:

| Feature | hoolsy-platforms | Student Base |
|---------|-----------------|--------------|
| Databases | PostgreSQL, Neo4j, MongoDB, TimescaleDB | PostgreSQL only |
| Auth | Multi-tenant RBAC with wildcard permissions | Simple JWT auth |
| Frontend | Complex widget system, timeline editor | Basic routing and forms |
| API | Complex domain logic, media handling | Simple CRUD + auth |
| Seeding | Production-ready demo data | Minimal test data |
| Scope | Production platform | Learning skeleton |

**Goal:** Students get a **clean, working foundation** they can build on without being overwhelmed by production complexity.

---

## Timeline Estimate

**Total Time: ~2-3 days**

- Day 1: Monorepo structure + packages + Docker setup (4-6 hours)
- Day 2: API + database + mobile app (4-6 hours)
- Day 3: Web app + documentation + testing (4-6 hours)

**Parallelization:** Mobile and web apps can be built in parallel once API is done.

---

## Success Criteria

The base repo is ready when:

✅ A new developer can clone, run `pnpm install && pnpm docker:up && pnpm db:rebuild && pnpm dev:api`, and have a working API in under 5 minutes

✅ Both mobile and web apps can authenticate with the API and display a home screen

✅ All TypeScript types are shared via `@hk26/schema`, and changes to API contracts immediately reflect in frontends

✅ ESLint and TypeScript pass with zero errors

✅ Documentation is clear enough that students can get started without external help

✅ The repo can be copied and customized for a specific team in under 30 minutes

---

## Next Steps

1. **Create the base repo** following Phase 1-7 of the implementation checklist
2. **Test thoroughly** on a clean machine to ensure setup is smooth
3. **Deploy to Hoolsy-Students** as `hk26-base-repo` (optional, can be kept local)
4. **Copy to team repos** and customize per team (Phase 8)
5. **Invite students** to their respective repos and send them the SETUP.md link

---

## Document Updates

**Last Updated:** 2026-01-16

**Major Changes:**

This document has been updated to reflect the full scope of shared infrastructure and data contracts across all student teams:

### Key Updates:

1. **Three-Database Architecture**
   - Added `user_db`, `workstation_db`, and `app_db` structure
   - Documented database privileges and access patterns
   - Added comprehensive seeding strategy with dummy data

2. **Shared Zod Schemas**
   - Emphasized critical importance of data contracts
   - Added team-specific schema examples (marketplace, syncstation, subject)
   - Documented field naming conventions and contract enforcement
   - Added examples of correct vs. incorrect schema usage

3. **Enhanced Database Package**
   - Multi-database Drizzle setup with separate clients
   - Separate migration folders per database
   - Comprehensive seeding scripts (user, workstation, app)
   - Database bootstrap and reset scripts

4. **Docker Configuration**
   - Updated init script to create three databases
   - Added proper user permissions per database
   - Documented connection strings for apps vs. migrations

5. **Environment Variables**
   - Expanded `.env.example` with all three database URLs
   - Added JWT expiry configuration
   - Added CORS, file upload, and logging settings

6. **Setup Documentation**
   - Comprehensive SETUP.md with troubleshooting
   - Quick start vs. manual setup paths
   - Database overview and dummy data documentation
   - Common issues and solutions

7. **Implementation Checklist**
   - Updated phases to reflect three-database structure
   - Added database layer as separate phase
   - Expanded testing requirements
   - Added team-specific customization steps

8. **hoolsy-platforms Relationship**
   - Added section explaining relationship to production repo
   - Documented what's shared vs. what's different
   - Referenced PRs for context (not as requirements)

### Why These Changes?

Based on the student task requirements:

- **Syncstation** needs USER and Workstation databases for multi-tenant logging
- **Consumer App** needs subject/user data matching production schemas
- **Marketplace teams** need identical product/vendor schemas for integration
- All teams need realistic dummy data for development and testing

### Next Steps:

1. Implement the base repository following the updated checklist
2. Create realistic dummy data for all three databases
3. Test setup process on clean machine
4. Copy and customize for each team
5. Document any additional team-specific requirements

---

**Questions or feedback?** Contact [mathias@hoolsy.com](mailto:mathias@hoolsy.com)
