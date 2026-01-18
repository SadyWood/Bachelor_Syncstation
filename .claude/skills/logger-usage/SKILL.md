---
name: logger-usage
description: Use @hoolsy/logger for environment-aware structured logging in Hoolsy Platforms. Use when writing code that needs logging, debugging, error handling, or replacing console.log calls. Includes createLogger for module-specific loggers with auto-prefixing.
---

# Logger Usage

Use `@hoolsy/logger` for structured, environment-aware logging across Hoolsy Platforms. This package replaces `console.log` with context-rich, filterable logging that's automatically stripped in production.

## Quick start

```ts
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('MyComponent');

logger.debug('Component mounted', { userId: 123 });
logger.error('Failed to fetch data', error);
```

## When to use this logger

**ALWAYS use `@hoolsy/logger` in:**
- React components
- API route handlers
- Service modules
- Utility functions
- Business logic
- Event handlers

**NEVER use `@hoolsy/logger` in:**
- CLI scripts (`**/scripts/**/*.ts`) - use `console.log` for user-facing output
- Database migrations/seeds (`**/seed/**/*.ts`) - use `console.log` for progress
- Test files (`**/*.test.ts`) - use `console.log` or test framework logging

These exceptions are already configured in ESLint.

## Instructions

### Step 1: Import and create a module-specific logger

At the top of every file that needs logging, create a logger with the module name:

```ts
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('ModuleName');
```

**Module naming:**
- React components: Use component name (e.g., `'ProjectBrowser'`, `'MediaPreview'`)
- API routes: Use route identifier (e.g., `'ContentRoutes'`, `'AuthRoutes'`)
- Services: Use service name (e.g., `'MediaService'`, `'API'`)
- Utilities: Use utility name (e.g., `'VideoProcessor'`, `'S3Client'`)

### Step 2: Choose the correct log level

| Level | When to use | Development | Production |
|-------|-------------|-------------|------------|
| `debug` | Detailed debugging info, trace execution flow | ✅ Shows | ❌ Hidden |
| `info` | General informational messages | ✅ Shows | ❌ Hidden |
| `warn` | Warnings that should be investigated | ✅ Shows | ✅ Shows |
| `error` | Errors that must be handled | ✅ Shows | ✅ Shows |

**Guidelines:**
- **`debug`** - Use for:
  - Function entry/exit
  - State changes
  - API requests/responses
  - Data transformations
  - "What is happening right now?"

- **`info`** - Use for:
  - Application lifecycle events
  - Configuration loaded
  - Services started
  - "What major thing just happened?"

- **`warn`** - Use for:
  - Deprecated API usage
  - Non-OK HTTP responses
  - Fallback behavior triggered
  - "Something unexpected but handled"

- **`error`** - Use for:
  - Exceptions caught
  - Failed operations
  - Data validation failures
  - "Something went wrong and needs attention"

### Step 3: Use structured logging

**Always pass data as the second parameter, not in the message string:**

✅ **Good:**
```ts
logger.debug('User fetched', { userId, name: user.name });
logger.error('Upload failed', error);
logger.warn('Retrying request', { attempt, maxRetries });
```

❌ **Bad:**
```ts
logger.debug(`User ${userId} fetched with name ${user.name}`);
logger.error('Upload failed: ' + error.message);
logger.warn(`Retrying request (${attempt}/${maxRetries})`);
```

**Benefits:**
- Easier to filter and search logs
- Better for log aggregation services (DataDog, Sentry)
- Consistent format across codebase

### Step 4: Replace console.log calls

When you encounter `console.log` in application code (not scripts/tests):

**Before:**
```ts
console.log('[MyComponent] Loading data...');
console.log('[MyComponent] Loaded', data.length, 'items');
console.error('[MyComponent] Failed:', error);
```

**After:**
```ts
import { createLogger } from '@hoolsy/logger';
const logger = createLogger('MyComponent');

logger.debug('Loading data...');
logger.debug('Loaded items', { count: data.length });
logger.error('Failed to load', error);
```

## Examples

### React Component

```tsx
import { createLogger } from '@hoolsy/logger';
import { useState, useEffect } from 'react';

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

### API Route Handler (Fastify)

```ts
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('ProjectRoutes');

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

### Service Module

```ts
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('MediaService');

export async function uploadMedia(file: File, metadata: Metadata) {
  logger.debug('Starting upload', { filename: file.name, size: file.size });

  try {
    const result = await s3.upload(file);
    logger.debug('Upload successful', { key: result.key });
    return result;
  } catch (error) {
    logger.error('Upload failed', error);
    throw error;
  }
}
```

### Event Handler with State Updates

```tsx
import { createLogger } from '@hoolsy/logger';

const logger = createLogger('ProjectBrowser');

function handleNodeClick(node: TreeNode) {
  logger.debug('Node clicked', {
    nodeId: node.nodeId,
    title: node.title,
    nodeType: node.nodeType,
    hasChildren: !!(node.children && node.children.length > 0),
  });

  setSelectedNodeId(node.nodeId);
  dispatchNodeSelected({ nodeId: node.nodeId, title: node.title });
}
```

## Best practices

1. **One logger per file** - Create the logger at the top of the file, use throughout
2. **Module-specific naming** - Use descriptive, specific module names for easy filtering
3. **Structured data** - Always pass objects/data as second parameter, not in string
4. **Don't log sensitive data** - Avoid logging passwords, tokens, or PII
5. **Use debug liberally** - It's free in production, helps debugging in development
6. **Errors with context** - Pass the Error object AND additional context:
   ```ts
   logger.error('Failed to process', error, { userId, fileId });
   ```

## Common patterns

### Loading data with SWR

```tsx
const logger = createLogger('ProjectBrowser');

const { data: projects, error } = useSWR('/api/projects', listProjects);

useEffect(() => {
  if (error) {
    logger.error('Failed to load projects', error);
  }
  if (projects) {
    logger.debug('Projects loaded', { count: projects.length });
  }
}, [projects, error]);
```

### Async operations with multiple steps

```ts
const logger = createLogger('MediaProcessor');

async function processVideo(nodeId: string) {
  logger.debug('Starting video processing', { nodeId });

  try {
    const metadata = await extractMetadata(nodeId);
    logger.debug('Metadata extracted', { duration: metadata.duration });

    const thumbnail = await generateThumbnail(nodeId);
    logger.debug('Thumbnail generated', { path: thumbnail.path });

    return { metadata, thumbnail };
  } catch (error) {
    logger.error('Video processing failed', error, { nodeId });
    throw error;
  }
}
```

### Race condition debugging

```ts
const logger = createLogger('ContentDashboard');

useEffect(() => {
  if (isMountedRef.current && urlNodeId) {
    logger.debug('URL changed, dispatching SELECT_NODE_BY_ID', {
      urlNodeId,
      isMounted: isMountedRef.current
    });

    dispatchSelectNodeById({ nodeId: urlNodeId });
  }
}, [urlNodeId]);
```

## Environment behavior

The logger automatically adjusts based on environment:

| Environment | `debug/info` | `warn/error` |
|-------------|--------------|--------------|
| Development (`MODE=development`) | ✅ Shows | ✅ Shows |
| Production (`MODE=production`) | ❌ Hidden | ✅ Shows |
| Test (`MODE=test`) | ❌ Hidden | ✅ Shows |

No configuration needed - it just works.

## Migration checklist

When replacing `console.log` with `@hoolsy/logger`:

- [ ] Add import: `import { createLogger } from '@hoolsy/logger';`
- [ ] Create logger: `const logger = createLogger('ModuleName');`
- [ ] Replace `console.log` → `logger.debug`
- [ ] Replace `console.info` → `logger.info`
- [ ] Replace `console.warn` → `logger.warn`
- [ ] Replace `console.error` → `logger.error`
- [ ] Convert string concatenation to structured data
- [ ] Verify ESLint no longer complains

## Future integration

This logger is designed for easy integration with:
- **DataDog** - Production log aggregation
- **LogRocket** - Session replay with logs
- **Sentry** - Error reporting with context

The consistent format makes it trivial to pipe logs to external services when needed.
