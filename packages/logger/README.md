# @hoolsy/logger

Environment-aware structured logging for Hoolsy Platforms - replaces `console.log` with context-rich, filterable logging.

## Overview

`@hoolsy/logger` provides:

- **Environment-aware** - Debug logs in development, errors only in production
- **Structured logging** - Consistent format with module prefixes
- **Zero runtime cost in production** - Debug/info logs stripped out
- **Child loggers** - Create module-specific loggers with automatic prefixing
- **ESLint compliant** - Eliminates `no-console` violations

## Why This Package?

Before `@hoolsy/logger`:
```ts
console.log('[ProjectBrowser] Loading projects...'); // ESLint violation
console.log('[ProjectBrowser] Loaded 15 projects'); // Shows in production
console.error('[ProjectBrowser] Failed to load', error); // No context data
```

After `@hoolsy/logger`:
```ts
import { createLogger } from '@hoolsy/logger';
const logger = createLogger('ProjectBrowser');

logger.debug('Loading projects...'); // Auto-prefixed, dev-only
logger.debug('Loaded projects', { count: 15 }); // Structured data
logger.error('Failed to load', error); // Always visible, structured
```

**Benefits:**
- ✅ Eliminated 349 `console.log` calls across the codebase
- ✅ No debug logs leaking into production
- ✅ Consistent log format with module identification
- ✅ Easy to filter logs by module or level

## Installation

Already available in the monorepo:

```json
{
  "dependencies": {
    "@hoolsy/logger": "workspace:*"
  }
}
```

## Usage

### Basic Usage

```ts
import { logger } from '@hoolsy/logger';

// Only visible in development
logger.debug('Debugging info', { someData: 123 });
logger.info('Application started');

// Always visible (development + production)
logger.warn('Something might be wrong');
logger.error('An error occurred', error);
```

### Child Loggers (Recommended)

Create module-specific loggers with automatic prefixing:

```ts
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('MyComponent');

logger.debug('Component mounted');
// Output: [MyComponent] Component mounted

logger.error('Failed to fetch data', error);
// Output: [MyComponent] Failed to fetch data { ... }
```

### Log Levels

| Level | Development | Production | Use Case |
|-------|------------|------------|----------|
| `debug` | ✅ | ❌ | Detailed debugging information |
| `info` | ✅ | ❌ | General informational messages |
| `warn` | ✅ | ✅ | Warnings that should be investigated |
| `error` | ✅ | ✅ | Errors that must be handled |
| `silent` | ❌ | ❌ | Disable all logging |

### Manual Configuration

```ts
import { logger } from '@hoolsy/logger';

// Force debug logging (e.g., for testing)
logger.configure({ level: 'debug', enabled: true });

// Disable all logging
logger.configure({ enabled: false });

// Set to production mode manually
logger.configure({ level: 'warn' });
```

## Environment Detection

The logger automatically detects the environment:

| Environment | Detection | Default Level |
|-------------|-----------|---------------|
| Vite (browser) | `import.meta.env.MODE` | `development` → `debug`, `production` → `warn` |
| Node.js | `process.env.NODE_ENV` | `development` → `debug`, `production` → `warn` |
| Test | `MODE === 'test'` | `warn` |

## Examples

### React Component

```tsx
// src/components/UserProfile.tsx
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('UserProfile');

export function UserProfile({ userId }: Props) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    logger.debug('Fetching user', { userId });

    fetchUser(userId)
      .then(data => {
        logger.debug('User fetched successfully', { name: data.name });
        setUser(data);
      })
      .catch(err => {
        logger.error('Failed to fetch user', err);
      });
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

### API Service

```ts
// src/services/api.ts
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('API');

export async function fetchData(endpoint: string) {
  logger.debug('Request started', { endpoint });

  try {
    const response = await fetch(endpoint);

    if (!response.ok) {
      logger.warn('Non-OK response', { status: response.status });
    }

    return await response.json();
  } catch (error) {
    logger.error('Request failed', error);
    throw error;
  }
}
```

### Fastify Route Handler

```ts
// apps/api/src/routes/ws.content.ts
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('ContentRoutes');

app.get('/ws/projects', async (req, reply) => {
  const tenantId = requireTenant(req);
  logger.debug('Listing projects', { tenantId });

  try {
    const projects = await listProjects(tenantId);
    logger.debug('Projects loaded', { count: projects.length });
    return reply.send({ ok: true, items: projects });
  } catch (error) {
    logger.error('Failed to list projects', error);
    return reply.code(500).send({ ok: false, code: 'INTERNAL_ERROR' });
  }
});
```

### Content Tree Drag & Drop

```tsx
// src/widgets/ContentDashboard/ProjectBrowser.tsx
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('ProjectBrowser');

function handleDrop(draggedIds: string[], targetId: string) {
  logger.debug('Moving nodes', { draggedIds, targetId });

  moveNodes(draggedIds, targetId)
    .then(() => {
      logger.debug('Nodes moved successfully');
      mutate(); // Refresh tree
    })
    .catch(err => {
      logger.error('Failed to move nodes', err);
    });
}
```

## When NOT to Use This Logger

Don't use `@hoolsy/logger` for:

- **CLI scripts** - Use `console.log` directly for user-facing output
- **Database seed/migration** - Use `console.log` for progress output
- **Test files** - Use `console.log` or test framework logging

These files have ESLint exceptions via `eslint.config.js`:
- `**/scripts/**/*.ts`
- `**/seed/**/*.ts`
- `**/*.test.ts`

## Migration from console.log

Replace scattered console.log calls:

**Before:**
```ts
console.log('Uploading file:', filename);
console.log('Upload progress:', percent);
console.error('Upload failed:', error);
```

**After:**
```ts
import { createLogger } from '@hoolsy/logger';
const logger = createLogger('MediaUpload');

logger.debug('Uploading file', { filename });
logger.debug('Upload progress', { percent });
logger.error('Upload failed', error);
```

**Benefits:**
- Module identification automatic (`[MediaUpload]`)
- Structured data instead of string concatenation
- Debug logs won't leak to production

## API Reference

### `logger`

Singleton instance with default configuration.

```ts
logger.debug(message: string, data?: unknown): void
logger.info(message: string, data?: unknown): void
logger.warn(message: string, data?: unknown): void
logger.error(message: string, data?: unknown): void
logger.configure(config: Partial<LoggerConfig>): void
logger.child(prefix: string): Logger
```

### `createLogger(prefix: string)`

Creates a child logger with automatic prefixing.

```ts
const logger = createLogger('MyModule');
logger.debug('Message'); // [MyModule] Message
```

### `LoggerConfig`

```ts
interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error' | 'silent';
  prefix?: string;
  enabled: boolean;
}
```

## Future Integration

This logger is designed for easy integration with:

- **DataDog** - Ship logs to DataDog for production monitoring
- **LogRocket** - Attach logs to session recordings
- **Sentry** - Include structured logs in error reports

The consistent format makes it trivial to pipe logs to external services.

## Related Documentation

- [API Backend](../../apps/api/README.md)
- [Workstation Web](../../apps/workstation-web/README.md)
- [Shared Schemas](../schema/README.md)
