# Setting up Packages with Clear API Boundaries

This guide shows how to structure shared packages in the monorepo with clear public/internal APIs.

## When to use this

Apply this pattern to all shared packages:
- ✅ `packages/timeline` - Shared UI components
- ✅ `packages/schema` - API contracts
- ✅ Any new shared package you create
- ❌ Apps (different pattern - types go in `types/` directories)

## The Re-export Pattern

Packages control their API surface through **re-exports**, not ESLint rules:

1. **Component files export types freely:**
   ```tsx
   // src/components/Button.tsx
   export interface ButtonProps {
     label: string;
     onClick: () => void;
   }

   export function Button({ label, onClick }: ButtonProps) {
     return <button onClick={onClick}>{label}</button>;
   }
   ```

2. **Entry points re-export for consumers:**
   ```ts
   // src/index.ts (public API)
   export { Button } from './components/Button';
   export type { ButtonProps } from './components/Button';
   ```

3. **Consumers import from the package root:**
   ```tsx
   // In apps/workstation-web
   import { Button, type ButtonProps } from '@hoolsy/timeline';
   ```

## Package Structure

**Recommended structure:**

```
packages/your-package/
├── src/
│   ├── index.ts              ✅ Public API - stable, documented
│   ├── internal.ts           ✅ Internal API - unstable, for testing
│   ├── components/
│   │   └── Button.tsx        ✅ Exports Button + ButtonProps
│   ├── hooks/
│   │   └── useExample.ts     ✅ Exports hook + return types
│   └── core/
│       └── models/
│           └── Model.ts      ✅ Exports domain types
├── package.json              ✅ "exports": { ".": "./src/index.ts" }
└── README.md                 ✅ Documents public API
```

## Steps to Set Up a New Package

### 1. Create entry points

**src/index.ts** (public API):
```ts
/**
 * @package your-package - Brief description
 *
 * PUBLIC API - This is the stable interface.
 * Import from this file for production use.
 */

// Primary exports
export { Button } from './components/Button';
export type { ButtonProps } from './components/Button';

// ... more exports
```

**src/internal.ts** (optional, for testing):
```ts
/**
 * INTERNAL API - Unstable, for testing/advanced use only.
 * These APIs may change in minor versions.
 */

// Re-export public API
export * from './index';

// Export internal components
export { ButtonInternal } from './components/ButtonInternal';
export type { ButtonInternalProps } from './components/ButtonInternal';
```

### 2. Configure package.json exports

```json
{
  "name": "@hoolsy/your-package",
  "exports": {
    ".": "./src/index.ts",
    "./internal": "./src/internal.ts"
  }
}
```

This prevents consumers from importing from deep paths like `@hoolsy/your-package/components/Button`.

### 3. Document your public API

Add JSDoc comments to exported types in `index.ts`:

```ts
/**
 * Button component props
 * @property label - Button text to display
 * @property onClick - Handler called on click
 * @example
 * ```tsx
 * <Button label="Click me" onClick={() => alert('Clicked!')} />
 * ```
 */
export type { ButtonProps } from './components/Button';
```

### 4. No ESLint configuration needed

Packages DON'T need package-specific ESLint configs. The root [eslint.config.js](../../../eslint.config.js) handles all type safety rules:

- **Apps**: Type exports restricted to `types/` directories (enforced by ESLint)
- **Packages**: Type exports allowed anywhere (controlled by re-exports)

## Benefits

✅ **Simple and maintainable** - No complex ESLint configurations
✅ **Clear API boundaries** - Public (index.ts) vs internal (internal.ts)
✅ **Easy refactoring** - Change internals without breaking consumers
✅ **Prevents coupling** - package.json exports field blocks deep imports
✅ **Better docs** - Single place to document the public API
✅ **Versioning clarity** - Public API changes = major version, internal changes = minor

## Real-world example

See [packages/timeline/src/index.ts](../../../packages/timeline/src/index.ts) for a well-documented public API.
