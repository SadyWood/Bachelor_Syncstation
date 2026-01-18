# Code Quality & Infrastructure Improvements

## Overview

This PR represents a **major cleanup and modernization effort** that transforms the codebase foundation. We've eliminated technical debt, achieved zero ESLint/TypeScript errors, migrated to modern tooling, and established patterns that will accelerate future development.

### 🎯 Key Highlights

| Category | Achievement |
|----------|-------------|
| **Code Quality** | 271 ESLint errors → **0 errors, 0 warnings** |
| **ESLint Migration** | Migrated to modern flat config with **Airbnb style guide** + custom type safety rules |
| **Structured Logging** | New `@hoolsy/logger` package - migrated 349 console.log calls |
| **Type Safety** | Centralized schemas in `packages/schema`, shared across API/frontend |
| **Infrastructure** | Docker Compose with 4 databases (PostgreSQL, MongoDB, Neo4j, TimescaleDB) |
| **Data Fetching** | 4 components migrated from useEffect anti-patterns to useSWR |
| **Claude Code Skills** | 4 custom skills added for code quality guidance |
| **Documentation** | Comprehensive README files for all apps, packages, and infrastructure |
| **Files Changed** | 239 files modified |


---

## Detailed Changes

### 1. ESLint, Code Quality & Type Safety

The codebase had accumulated 271 ESLint errors over time, creating technical debt that slowed down development and made it harder to catch real issues. Additionally, type definitions were scattered and duplicated across the codebase. We addressed both issues comprehensively by migrating to ESLint's modern flat config format, adopting the industry-standard Airbnb style guide, and centralizing our type architecture.

**Why Airbnb style guide?** It's one of the most widely adopted JavaScript/TypeScript style guides in the industry, providing consistent patterns that new team members will recognize. This reduces onboarding time and ensures our code follows battle-tested best practices.

**Migration approach:**
- Adopted Airbnb style guide as our baseline, then customized rules where needed for our project
- Fixed all 271 errors without using a single `eslint-disable` comment - we changed the code, not the rules

**Key fixes:**
- **Type safety improvements**: Replaced unsafe `as` type assertions with proper type-safe patterns like `.flatMap()` for filtering
- **Performance optimizations**: Fixed O(n²) tree traversal algorithms by using O(1) Map-based lookups in [ProjectBrowser.tsx](apps/workstation-web/src/widgets/ContentDashboard/ProjectBrowser.tsx#L33-L56)
- **React best practices**: Eliminated anti-patterns like setState cascades and setTimeout in useEffect hooks
- **Code cleanliness**: Removed unused parameters following YAGNI (You Aren't Gonna Need It) principle

**Custom type safety rules added:**

We added strict architectural rules to prevent type definition sprawl in application code:

```javascript
{
  files: ['apps/**/*.ts', 'apps/**/*.tsx'],
  ignores: ['apps/**/types/**/*.ts', 'apps/**/types/**/*.tsx'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExportNamedDeclaration[declaration.type="TSTypeAliasDeclaration"]',
        message: 'Type definitions must be in a types/ directory or packages/schema'
      },
      {
        selector: 'ExportNamedDeclaration[declaration.type="TSInterfaceDeclaration"]',
        message: 'Interface definitions must be in a types/ directory or packages/schema'
      }
    ]
  }
}
```

**What this enforces:**
- ✅ **Shared API types**: Must live in `packages/schema/src/**` (imported by both API and frontend)
- ✅ **App-specific types**: Must live in `apps/**/types/**` directories (clear, organized structure)
- ❌ **Random type exports**: No longer allowed in random files throughout the app

**Why this matters:**
- **Prevents type sprawl**: Types scattered across files make maintenance difficult
- **Enforces architecture**: Types are either shared (in schema package) or app-specific (in types directory)
- **Improves discoverability**: New developers know exactly where to find and add types
- **Scales cleanly**: As the codebase grows, types remain organized and maintainable

#### Type Safety & Schema Centralization

With ESLint enforcing WHERE types can be defined, we also needed to address HOW those types were organized. The codebase had a duplication problem: `apps/workstation-web/src/lib/api-types.ts` contained copies of backend schemas, creating a maintenance burden where changes had to be synchronized manually across API and frontend.

**The strategy:** Separate shared types from UI-specific types, using `packages/schema/` as the single source of truth for API contracts.

**Migration approach:**
1. **Identify shared vs. UI types**: Does the backend care about this type? If yes, it's shared.
2. **Move shared types** to `packages/schema/src/workstation/`:
   - Member types → `membership.ts` (WsMemberSchema, MembersListResponseSchema)
   - Role types → `rbac.ts` (RoleSchema, RolesListResponseSchema, SimpleRoleSchema)
   - Permission types → `rbac.ts` (PermissionCatalogItem, PermissionsCatalogResponseSchema)
3. **Move UI types** to `apps/workstation-web/src/types/`:
   - Layout/navigation → `layout.ts` (SideNavProps, MenuItem)
   - UI components → `components.ts` (ButtonProps, ModalProps, Appearance, Tone, Size)
   - Widget system → `widgets.ts` (WidgetProps, GridLayoutItem, WidgetRegistry)
   - Content types → `content.ts` (TemplateType, DropPosition)
   - Event types → `events.ts` (VideoTimeUpdateEvent, NodeSelectedEvent)
   - Common utilities → `common.ts` (IconProps, SortKey, SortDir)

**The complete type safety picture:**

```
┌─────────────────────────────────────────────┐
│ ESLint Rules (WHERE types can be defined)   │
│ ✅ packages/schema/**  (shared API types)   │
│ ✅ apps/**/types/**    (app-specific types) │
│ ❌ Random files        (not allowed)        │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ Type Organization (HOW types are organized) │
│ packages/schema/  → API contracts           │
│ apps/**/types/    → UI-specific types       │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ Benefits                                     │
│ • Single source of truth                    │
│ • Type safety across the stack              │
│ • Clear boundaries                          │
│ • Reusability for future apps               │
└─────────────────────────────────────────────┘
```

**Benefits:**
- **Single source of truth**: API contracts defined once in `packages/schema`, imported by both API and frontend
- **Type safety across the stack**: Changes to API responses immediately surface type errors in frontend
- **Clear boundaries**: Shared types in `packages/schema`, UI-specific types in app directories
- **Reusability**: Other apps (future mobile app, CLI tools) can import the same schemas
- **Scalability**: This pattern scales as we add more microservices or client applications

The result is a clean, maintainable codebase where ESLint errors actually mean something. When a new error appears, we know it's a real issue that needs attention. Types are organized, discoverable, and enforce architectural boundaries automatically.

---

### 2. Structured Logging with @hoolsy/logger

Console.log statements scattered throughout the codebase (349 occurrences) made debugging difficult and created noise in production environments. We created a new `packages/logger/` package to standardize logging across the entire platform.

**Why a dedicated logger package?** As our platform grows, we need structured logs that can be filtered, searched, and analyzed. The logger provides:
- **Environment awareness**: Debug logs in development, errors only in production
- **Structured context**: Attach metadata to logs for better troubleshooting
- **Consistent formatting**: All logs follow the same format, making them easier to parse
- **Child loggers**: Create component-specific loggers that inherit parent configuration

```typescript
import { createLogger } from '@hoolsy/logger';
const logger = createLogger('ComponentName');

logger.debug('Moving node', { draggedIds, targetId });
logger.error('Failed to save', error);
```

This foundation prepares us for future integration with log aggregation services (like DataDog, LogRocket, or Sentry) when we need production monitoring.

---

### 3. Docker Infrastructure

Previously, developers had to install PostgreSQL locally on their machines. As we expand to a multi-database architecture (PostgreSQL, MongoDB, Neo4j, TimescaleDB), requiring students and developers to install and configure 3-4 different database engines becomes impractical.

**The Docker solution:** Instead of installing multiple database engines separately, developers now install Docker Desktop once and run `pnpm docker:up` to get a complete, production-like development environment.

**Current stack:**
- **PostgreSQL 16** (port 5432) - Our primary relational database for Users, Workstation, and Marketplace domains
- **Neo4j** (ports 7474/7687) - Graph database for subject relationships (experimental, preparing for future features)
- **MongoDB** (port 27017) - Document store for subject metadata (experimental)
- **TimescaleDB** (port 5433) - Time-series database for tracking subject appearances in media over time (e.g., when actors appear/disappear in videos)

**Benefits:**
- **Consistency**: Everyone runs identical database versions, eliminating "works on my machine" problems
- **Easy reset**: `pnpm docker:reset` wipes everything and starts fresh - perfect for testing migrations
- **Isolation**: Databases run in containers, not interfering with any local installations
- **Scalability**: Adding new databases is just a few lines in `docker-compose.yml`

This infrastructure change is critical for our upcoming work on the subject system, which will leverage multiple database engines for different aspects of subject data.

---

### 4. Environment Configuration

With the introduction of multiple database engines through Docker, we expanded our `.env.example` file (now 85 lines) to document all required environment variables. While we've always had an `.env.example`, it previously only covered PostgreSQL. Now it includes:

- **PostgreSQL configuration**: Admin connections (for migrations) and service connections (for runtime, following least-privilege principle)
- **Neo4j configuration**: Browser UI and Bolt protocol endpoints
- **MongoDB configuration**: Connection strings with authentication
- **TimescaleDB configuration**: Separate port (5433) to avoid conflicts with main PostgreSQL
- **Auth secrets**: JWT and cookie secrets for session management
- **Runtime configuration**: Node environment, port, token TTLs

**Why this matters:** New developers or students can copy `.env.example` to `.env` and immediately understand what configuration is needed. The file includes inline comments explaining each section and shows proper separation between admin and service database connections.

---

### 5. Database Package Refactoring

We reorganized `packages/db/` to `packages/databases/postgres/` to prepare for our multi-database architecture. The old structure assumed a single database engine (PostgreSQL), but with our expansion to Neo4j, MongoDB, and TimescaleDB, we needed a better organization.

**The problem:** The old `packages/db/` structure didn't scale to multiple database engines. Where would we put Neo4j schemas? MongoDB models? They don't belong in a package called "db" that was clearly PostgreSQL-centric.

**The solution:** Create `packages/databases/` as a parent directory that can contain subdirectories for each database engine:
- `packages/databases/postgres/` - PostgreSQL schemas and migrations using Drizzle ORM
- `packages/databases/neo4j/` - Future: Cypher queries and graph schemas
- `packages/databases/mongodb/` - Future: Mongoose models or native MongoDB schemas
- `packages/databases/timescale/` - Future: Time-series specific schemas and queries

**What stayed the same:**
- Still using **Drizzle ORM** for PostgreSQL (drizzle-orm, drizzle-kit)
- Still using Drizzle for schema definitions and migrations
- Same migration workflow: `pnpm gen:workstation`, `pnpm migrate:workstation`, etc.

**What changed:**
- **Path restructuring**: `packages/db/` → `packages/databases/postgres/`
- **Clearer separation**: Each database engine gets its own subdirectory
- **Scalability**: Easy to add new database engines as we build out the subject system

This refactoring is purely organizational - it doesn't change how we work with PostgreSQL, but it sets us up to cleanly integrate multiple database engines without mixing concerns.

---

### 6. Media Metadata Enhancement

The media upload and streaming flow was quite thin - we were storing media files but capturing minimal metadata about them. This created problems in the frontend where we needed information like video duration, codecs, aspect ratios, etc.

**The problem:** Without rich metadata, the frontend couldn't make informed decisions about playback, couldn't display accurate information to users, and couldn't optimize streaming based on media characteristics.

**Database migration:** `0004_add_media_metadata_fields.sql`

**Changes:**
- ❌ **Removed**: `duration_seconds` (integer precision is too coarse)
- ✅ **Added**: `duration_ms` (millisecond-precision for frame-accurate editing)
- ✅ **Added**: Video metadata (frame_rate, video_codec, aspect_ratio, resolution)
- ✅ **Added**: Audio metadata (audio_codec, audio_channels, audio_sample_rate, bit_rate)
- ✅ **Added**: Image metadata (format, color_space, dpi, orientation, exif_data)
- ✅ **Added**: Type flags (has_video, has_audio) for quick filtering

**Why milliseconds matter:**

| Use Case | Seconds (integer) | Milliseconds |
|----------|---------|--------------|
| Frame navigation (30fps) | Rounding errors destroy frame accuracy | Frame-perfect (33.33ms per frame) |
| Short clips | `duration: 0` for 500ms clip | `durationMs: 500` (exact) |
| Audio editing (48kHz) | Imprecise sample positioning | Sample-perfect (0.02ms resolution) |

This metadata will be populated through an upcoming ffprobe integration pipeline that extracts technical details during upload processing.

**Supported formats:**
- 🎬 Video: MP4, MOV, AVI, WebM, MKV
- 🎵 Audio: MP3, WAV, AAC, M4A, FLAC
- 🖼️ Image: JPG, PNG, WebP, GIF, TIFF

---

### 7. useSWR Migration: Eliminating useEffect Anti-Patterns

Four major components were using manual `useEffect + fetch` patterns for data fetching - a common React anti-pattern that creates maintenance burden and subtle bugs. We migrated them to useSWR, Vercel's React hooks library for data fetching.

**Components updated:**
- [Member.tsx](apps/workstation-web/src/widgets/Admin/Member.tsx) - Member details with role management (replaced 4 useEffect data fetching patterns)
- [RolePermissionsList.tsx](apps/workstation-web/src/widgets/Admin/RolePermissionsList.tsx) - Role permissions editor (replaced 2 useEffect patterns)
- [AdminWidgets/RolesList.tsx](apps/workstation-web/src/widgets/AdminWidgets/RolesList.tsx) - Admin role list (replaced manual load function)
- [Admin/RolesList.tsx](apps/workstation-web/src/widgets/Admin/RolesList.tsx) - Main role list (added optimistic updates)

#### Why useEffect for Data Fetching is an Anti-Pattern

**The problems with manual useEffect + fetch:**

1. **Race conditions**: When component unmounts or dependency changes, in-flight requests can still update state
```typescript
useEffect(() => {
  fetchData().then(data => setState(data)); // ⚠️ May update after unmount
}, [dep]);
```

2. **Manual state management**: Every data fetch requires 3+ useState declarations (data, loading, error)
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
// + manual try/catch, loading state management, error handling...
```

3. **No caching**: Same API call repeated across components = wasted network requests
```typescript
// Component A: useEffect(() => fetchRoles(), [])
// Component B: useEffect(() => fetchRoles(), [])
// Result: 2 identical requests to /api/roles
```

4. **No request deduplication**: Multiple simultaneous requests to the same endpoint all execute
```typescript
// User clicks "Refresh" 3 times quickly
// Result: 3 identical in-flight requests (instead of 1)
```

5. **Stale data**: No automatic revalidation when user returns to the page

**Before** (manual state management - 43 lines for loading roles):
```typescript
const [rows, setRows] = useState<RoleRow[]>([]);
const [loading, setLoading] = useState(true);
const [err, setErr] = useState<string | null>(null);

const load = useCallback(async () => {
  if (!tenantId) return;
  setErr(null);
  setLoading(true);
  try {
    const r = await listRoles(tenantId);
    setRows(r);
  } catch (e) {
    setErr(e instanceof Error ? e.message : 'Failed to load roles');
  } finally {
    setLoading(false);
  }
}, [tenantId]);

useEffect(() => { load(); }, [load]);

// Listen for role changes from other widgets
useEffect(() => {
  const onRolesChanged = () => load();
  window.addEventListener('ws:roles:changed', onRolesChanged);
  return () => window.removeEventListener('ws:roles:changed', onRolesChanged);
}, [load]);
```

**After** (useSWR - 17 lines with more features):
```typescript
const { data: rows = [], error: swrError, isLoading: loading, mutate } = useSWR<RoleRow[]>(
  tenantId ? `/api/tenants/${tenantId}/roles` : null,
  () => listRoles(tenantId),
  {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // Multiple requests within 30s use cached data
  },
);

const err = swrError instanceof Error ? swrError.message : swrError ? 'Failed to load roles' : null;

// Listen for role changes from other widgets
useEffect(() => {
  const onRolesChanged = () => mutate(); // Just revalidate cache
  window.addEventListener('ws:roles:changed', onRolesChanged);
  return () => window.removeEventListener('ws:roles:changed', onRolesChanged);
}, [mutate]);
```

#### What useSWR Provides

**Built-in features we get automatically:**

1. **Automatic caching with cache keys**:
   - Cache key: `/api/tenants/123/roles`
   - Multiple components using same key = 1 request, shared data
   - Cache invalidation via `mutate()`

2. **Request deduplication**:
   - If 10 components mount and request same data within `dedupingInterval`
   - Result: 1 network request, 10 components receive data

3. **Stale-While-Revalidate strategy**:
   - Show cached data immediately (fast UI)
   - Revalidate in background
   - Update UI when fresh data arrives

4. **Race condition handling**:
   - useSWR automatically cancels/ignores stale requests
   - No need for manual cleanup functions

5. **Optimistic updates** (for mutations):
```typescript
await mutate(
  async () => {
    await deleteRole(tenantId, roleId);
    return rows.filter(r => r.roleId !== roleId);
  },
  {
    optimisticData: rows.filter(r => r.roleId !== roleId), // Update UI immediately
    rollbackOnError: true, // Revert if API call fails
    revalidate: false,
  }
);
```

6. **Automatic revalidation strategies**:
   - On window focus (disabled in our config - we use events)
   - On network reconnect
   - On interval
   - Manual via `mutate()`

#### Migration Results

**Lines of code saved:** ~100 lines of repetitive boilerplate removed

**Bugs prevented:**
- Race conditions when components unmount during fetch
- Duplicate requests when multiple components need same data
- Stale data after user switches tabs and returns

**Performance improvements:**
- Request deduplication reduces API load
- Automatic caching speeds up navigation
- Optimistic updates make UI feel instant

**Integration with existing patterns:**
- Event-driven refresh (`ws:roles:changed`) still works - just call `mutate()`
- Custom loading states preserved where needed
- Error handling adapted to useSWR's error model

#### When to Use useSWR vs useEffect

**Use useSWR for:**
- ✅ GET requests (fetching data)
- ✅ Data that multiple components might need
- ✅ Data that should be cached
- ✅ Data that needs automatic revalidation

**Use useEffect for:**
- ✅ Event listener setup/cleanup
- ✅ DOM manipulation
- ✅ Non-data-fetching side effects
- ✅ Effects that depend on component lifecycle

**A new Claude Code skill** ([useeffect-vs-useswr](/.claude/skills/useeffect-vs-useswr/SKILL.md)) was added to guide future decisions on data fetching patterns.

---

### 8. Comprehensive Documentation


**New README files added:**

These README files contribute significantly to the **+3,739 lines added** in this PR. While code changes are important, documentation ensures that:
- **New team members** can understand the system architecture quickly
- **Students** can contribute without extensive hand-holding
- **Future maintainers** (including ourselves 6 months from now) can recall architectural decisions and patterns
- **External collaborators** can evaluate the codebase structure at a glance

Each README follows a consistent structure:
1. **Overview** - What this component does and why it exists
2. **Architecture** - Key patterns and design decisions
3. **Getting Started** - Quick start guide for developers
4. **Key Features** - Detailed feature documentation
5. **Development** - How to extend and modify the component

**Full documentation index:** See the "Documentation" section in [README.md](README.md#documentation) for a complete list of all available documentation.

This documentation foundation sets us up for sustainable growth as the platform scales and the team expands.


**Applications:**
- **[apps/api/README.md](apps/api/README.md)** (370+ lines) - Complete API documentation covering architecture, authentication, multi-tenancy, RBAC, content management, media handling, and database migrations
- **[apps/workstation-web/README.md](apps/workstation-web/README.md)** (280+ lines) - Frontend architecture guide covering the widget system, state management, routing, authentication flow, and component patterns
- **[apps/marketplace-web/README.md](apps/marketplace-web/README.md)** - Marketplace app structure and purpose

**Packages:**
- **[packages/schema/README.md](packages/schema/README.md)** - Explains the centralized schema pattern and how types are shared between API and frontend
- **[packages/logger/README.md](packages/logger/README.md)** (updated) - Usage guide for structured logging with environment-aware behavior

**Infrastructure:**
- **[docker/README.md](docker/README.md)** - Docker Compose setup guide covering all four database engines, initialization scripts, and troubleshooting
- **[postman/README.md](postman/README.md)** - API testing workflow with Postman collection usage

**Root documentation updates:**
- **[README.md](README.md)** (expanded) - Added "Workstation Pages & Workflow" section documenting which pages are functional, the recommended user workflow (team setup → content setup → enrichment → export), and current limitations
- **[SETUP.md](SETUP.md)** (updated) - Modernized setup instructions for Docker-based development




---

### 9. Claude Code Skills

To ensure consistent code quality and architectural patterns, we've created **4 custom Claude Code skills** that guide development decisions. These skills are markdown files that Claude Code references when writing code, effectively encoding our best practices and architectural decisions into the AI workflow.

**What are Claude Code skills?** They're structured markdown files (with YAML frontmatter) that provide context-aware guidance to Claude Code. When Claude encounters a situation covered by a skill, it automatically applies the patterns and rules defined in that skill.

**Skills added:**

1. **[logger-usage](/.claude/skills/logger-usage/SKILL.md)** - Structured logging guidelines
   - When to use `@hoolsy/logger` vs `console.log`
   - How to create module-specific loggers
   - Log level guidelines (debug/info/warn/error)
   - Environment-aware logging patterns
   - Migration from console.log to structured logging

   **Example from skill:**
   ```typescript
   const logger = createLogger('MyComponent');
   logger.debug('Component mounted', { userId: 123 });
   logger.error('Failed to fetch data', error);
   ```

2. **[useeffect-vs-useswr](/.claude/skills/useeffect-vs-useswr/SKILL.md)** - Data fetching decision tree
   - When to use useSWR (data fetching) vs useEffect (side effects)
   - Common anti-patterns to avoid
   - Quick decision tree for choosing the right tool
   - Examples from the Hoolsy codebase
   - Code review checklist

   **Key rule:** If you're calling an API or database, use useSWR, not useEffect.

3. **[type-safety-schema](/.claude/skills/type-safety-schema/SKILL.md)** - Type organization patterns
   - Where to define types (packages/schema vs apps/*/types)
   - Shared API contracts vs app-specific types
   - How to avoid type sprawl
   - Integration with ESLint type safety rules

   **Architecture enforced:**
   - Shared API types → `packages/schema/src/**`
   - App-specific types → `apps/**/types/**`
   - No random type exports in regular files

4. **[skill-writer](/.claude/skills/skill-writer/SKILL.md)** - Meta-skill for creating new skills
   - Template and structure for new skills
   - YAML frontmatter requirements
   - Best practices for skill documentation
   - Examples and anti-patterns

   This skill was used to create the other three skills, ensuring consistency.

**Why this matters:**

Traditional coding standards documents get outdated and forgotten. By encoding our standards as Claude Code skills:

- **Automatic enforcement**: Claude applies these patterns without manual reminders
- **Living documentation**: Skills stay up-to-date as they're used in daily development
- **Onboarding tool**: New developers (and AI) learn patterns from working examples
- **Consistency**: Same patterns applied across the codebase, regardless of who (or what) writes the code

These skills represent a new approach to maintaining code quality - encoding standards in a format that both humans and AI can reference during development.

---

## Testing

### Automated Validation

```bash
✅ pnpm -r typecheck  # 0 errors across all packages
✅ pnpm -r run lint   # 0 warnings, 0 errors with Airbnb config
```

### Manual Testing

- ✅ Auth flow (login, token refresh, logout)
- ✅ Content tree drag-and-drop
- ✅ Media upload (video/audio/image)
- ✅ Timeline editing (demo mode)
- ✅ Docker database initialization and migrations

---

## Breaking Changes

### Database Schema

⚠️ **Migration required**: `0004_add_media_metadata_fields.sql`

**Action needed:**
```bash
pnpm docker:up          # Start Docker containers
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed setup data
```

**Note:** Existing `duration_seconds` data will be lost. This is expected as the field was always NULL (no metadata extraction was implemented yet).

---

## Summary

### Code Quality
- ✅ Achieved 0 ESLint errors and 0 warnings across all packages
- ✅ Migrated to ESLint flat config with Airbnb style guide
- ✅ Added custom type safety rules to enforce architectural boundaries
- ✅ Removed all unsafe type assertions (`as any`, unsafe type casts)
- ✅ Fixed React anti-patterns and performance issues
- ✅ Migrated from console.log to structured logging (@hoolsy/logger)
- ✅ Migrated 4 components from useEffect anti-patterns to useSWR

### Infrastructure
- ✅ Full Docker Compose setup with 4 databases (PostgreSQL, MongoDB, Neo4j, TimescaleDB)
- ✅ Migrated `packages/db/` → `packages/databases/postgres/` for multi-database architecture
- ✅ Centralized schemas in `packages/schema` - shared across API and frontend
- ✅ Added rich media metadata support (millisecond-precision duration, codecs, technical specs)
- ✅ Expanded `.env.example` to document all configuration for new database engines

### Documentation
- ✅ Comprehensive README files for all applications (API, Workstation, Marketplace)
- ✅ Package documentation for schema, logger, and other shared packages
- ✅ Infrastructure guides for Docker, Postman, and database setup
- ✅ Workflow documentation in root README explaining functional pages and user journey
- ✅ Consistent documentation structure across all README files
- ✅ 4 Claude Code skills for automated code quality guidance

### Development Practices
- ✅ ESLint as source of truth (fix code, never disable rules)
- ✅ Automated validation workflow (typecheck + lint)
- ✅ Proper TypeScript inference instead of type assertions
- ✅ Environment-aware structured logging with @hoolsy/logger
- ✅ Modern data fetching with useSWR (automatic caching, deduplication, optimistic updates)
- ✅ Clear separation: shared types in `packages/schema`, UI types in `apps/**/types/**`
- ✅ Claude Code skills encode best practices directly into AI workflow

---

## Next Steps

With the multi-database infrastructure now in place, our next focus is implementing the **subject system** - a core feature that lets users identify and interact with "things" in media (people, products, places, categories).

**Why three databases for one subject?** Each database handles a different aspect:

- **MongoDB**: Subject metadata (name, images, description, tags) - flexible document format for presentation
- **Neo4j**: Subject relationships (Actor PORTRAYS Character, Product FEATURED_IN Episode) - graph queries for "what's connected?"
- **TimescaleDB**: Subject timeline (when does this appear in the video?) - time-series for "what's visible now at 4:23?"

A shared `subject_id` ties these together. When a user watches a video, TimescaleDB returns active subjects at the current timestamp, MongoDB provides display details, and Neo4j reveals relationships.

Upcoming work involves designing the Subject Registry (identity layer), building sync mechanisms between databases, and creating APIs that abstract this complexity from clients.

---

_Drafted by Claude Code with review and refinement by @Haslien_
