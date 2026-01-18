---
name: code-quality-check
description: Run quality checks (typecheck + eslint) after code changes. Enforces fixing issues rather than weakening rules. Use after significant code changes, before commits, or when reviewing PRs.
---

# Code Quality Check

This skill ensures code quality by running TypeScript and ESLint checks after code changes.

## When to use this skill

Use this skill:
- After making significant code changes (3+ files modified)
- Before committing code
- When reviewing PRs
- After refactoring
- When adding new features or fixing bugs

## Core Principle: Fix Issues, Don't Weaken Rules

**NEVER weaken ESLint rules to make errors go away.**

Instead:
1. Understand why the rule exists
2. Fix the code to comply with the rule
3. If the rule is truly inappropriate, discuss with the team first

## How to Run Quality Checks

### Step 1: Run TypeCheck

```bash
pnpm typecheck
```

**What it does:** Runs TypeScript compiler in all workspaces to catch type errors.

**If errors occur:**
1. Read the error messages carefully
2. Fix type issues (don't use `any` or `as any` to bypass)
3. Ensure imports are correct
4. Check that schemas match actual data structures

### Step 2: Run ESLint

```bash
pnpm lint
```

**What it does:** Runs ESLint across the codebase to enforce code style and catch bugs.

**If errors occur:**
1. Fix the issues according to the rule
2. Use auto-fix where possible: `pnpm lint --fix`
3. Never disable rules with `// eslint-disable` without team approval

### Step 3: Review Warnings

Both typecheck and lint may produce **warnings** in addition to errors.

**Treat warnings seriously:**
- Warnings often indicate code smells or future bugs
- Address warnings before committing when possible
- Don't accumulate warning debt

## Common Issues and How to Fix Them

### Issue: `no-console` warning

**Error:**
```
Unexpected console statement (no-console)
```

**Why this rule exists:**
- `console.log` should not be in production code
- Production apps should use structured logging libraries

**How to fix:**

❌ **Don't do this:**
```typescript
// eslint-disable-next-line no-console
console.log('User loaded', user);
```

✅ **Do this (if you have a logging library):**
```typescript
import { logger } from './utils/logger';

logger.debug('User loaded', { user });
```

**For student projects (acceptable in development):**
During development and prototyping, `console.log` is acceptable:
1. Leave `console.log` with the warning during active development
2. Add a comment: `// TODO: Remove or replace with proper logging`
3. Remove before production deployment

**Remember:** The warning exists to remind you - it's not a blocker during development.

### Issue: `no-alert` warning

**Error:**
```
Unexpected alert (no-alert)
```

**Why this rule exists:**
- `alert()`, `confirm()`, `prompt()` are disruptive and not user-friendly
- Should use proper UI components (modals, toasts)

**How to fix:**

❌ **Don't do this:**
```typescript
alert('User saved!');
```

✅ **Do this:**
```typescript
// Use a toast notification library
toast.success('User saved!');
```

**Temporary exception (prototyping):**
During early development, `alert()` is acceptable for quick testing:
1. Leave with warning
2. Add comment: `// TODO: Replace with toast notification`
3. Replace before production deployment

### Issue: `@typescript-eslint/no-explicit-any`

**Error:**
```
Unexpected any. Specify a different type (no-explicit-any)
```

**Why this rule exists:**
- `any` defeats TypeScript's type safety
- Leads to runtime errors that could be caught at compile time

**How to fix:**

❌ **Don't do this:**
```typescript
function processData(data: any) {
  return data.items.map((item: any) => item.id);
}
```

✅ **Do this:**
```typescript
import type { DataResponse } from '@hk26/schema';

function processData(data: DataResponse) {
  return data.items.map(item => item.id);
}
```

**If you truly don't know the type:**
```typescript
// Use unknown instead of any
function processData(data: unknown) {
  // Must validate before use
  if (isDataResponse(data)) {
    return data.items.map(item => item.id);
  }
  throw new Error('Invalid data format');
}
```

### Issue: `no-unused-vars` warning

**Error:**
```
'user' is defined but never used (@typescript-eslint/no-unused-vars)
```

**How to fix:**

Option 1 - Remove it:
```typescript
// Before
const { id, name, email } = user;
console.log(id, name);

// After
const { id, name } = user;
console.log(id, name);
```

Option 2 - Prefix with underscore (intentionally unused):
```typescript
// Destructuring but only need some props
const { id, name, _email } = user; // _email ignored by linter
```

### Issue: `react-hooks/exhaustive-deps`

**Error:**
```
React Hook useEffect has a missing dependency: 'fetchUser'
```

**Why this rule exists:**
- Prevents stale closures and bugs
- Ensures effects re-run when dependencies change

**How to fix:**

❌ **Don't do this:**
```typescript
useEffect(() => {
  fetchUser(userId);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

✅ **Do this:**
```typescript
useEffect(() => {
  fetchUser(userId);
}, [userId, fetchUser]); // Include all dependencies
```

Or wrap function in useCallback:
```typescript
const fetchUser = useCallback((id: string) => {
  // fetch logic
}, []);

useEffect(() => {
  fetchUser(userId);
}, [userId, fetchUser]);
```

### Issue: Import order

**Error:**
```
`react` import should occur before import of `./Button` (import/order)
```

**How to fix:**
Use auto-fix:
```bash
pnpm lint --fix
```

ESLint will automatically reorder imports according to the configured style.

### Issue: Type imports

**Error:**
```
All imports in the declaration are only used as types. Use `import type` (consistent-type-imports)
```

**How to fix:**

❌ **Don't do this:**
```typescript
import { User, Project } from '@hk26/schema';
```

✅ **Do this:**
```typescript
import type { User, Project } from '@hk26/schema';
```

Or inline:
```typescript
import { type User, type Project } from '@hk26/schema';
```

## When Can Rules Be Relaxed?

**Only in specific file contexts**, already configured in `eslint.config.js`:

### Test files
```javascript
// **/*.test.{js,ts,tsx}
'no-console': 'off',
'@typescript-eslint/no-explicit-any': 'off',
```

### Logger and debug utilities
```javascript
// packages/logger/**, **/debug.ts, **/scripts/**
'no-console': 'off',
```

### Config files
```javascript
// **/*.config.{js,ts}
'import/no-default-export': 'off',
```

**Outside these contexts, rules must be followed.**

## Workflow After Code Changes

### After writing code:

1. **Save all files**

2. **Run typecheck:**
   ```bash
   pnpm typecheck
   ```
   Fix any type errors before proceeding.

3. **Run lint:**
   ```bash
   pnpm lint
   ```
   Fix errors. Address warnings where reasonable.

4. **Auto-fix formatting issues:**
   ```bash
   pnpm lint --fix
   ```

5. **Review changes:**
   - Check that auto-fixes didn't break logic
   - Ensure imports are clean
   - Verify no `console.log` or `alert` in production code

6. **Commit clean code:**
   ```bash
   git add .
   git commit -m "feat: implement user profile feature"
   ```

## Output Format

When reporting quality check results:

### If checks pass:
```
✅ TypeCheck: Passed
✅ ESLint: Passed
```

### If checks fail:
```
❌ TypeCheck: 3 errors found

Error in apps/web/src/components/UserProfile.tsx:
  - Line 42: Property 'email' does not exist on type 'User'
  - Line 58: Type 'string | undefined' is not assignable to type 'string'

Recommendation: Add email to User type in packages/schema or handle undefined case.

❌ ESLint: 5 errors, 8 warnings

Errors:
  - apps/web/src/api/users.ts:23 - Unexpected any (no-explicit-any)
  - apps/api/src/routes/auth.ts:45 - Missing return type (explicit-function-return-type)

Warnings:
  - apps/web/src/pages/Dashboard.tsx:12 - Unexpected console statement (no-console)

Next steps:
1. Fix type errors in UserProfile.tsx
2. Replace 'any' with proper types
3. Replace console.log with logger.debug
```

## Quality Gates

### Before PR review:
- [ ] `pnpm typecheck` passes with 0 errors
- [ ] `pnpm lint` passes with 0 errors
- [ ] Warnings reduced or justified

### Before production deployment:
- [ ] Zero `console.log` statements outside test/debug files
- [ ] Zero `alert()` statements
- [ ] All type errors resolved
- [ ] No use of `any` without justification

## References

- ESLint config: [eslint.config.js](../../eslint.config.js)
- Type safety skill: [.claude/skills/type-safety-schema/SKILL.md](../type-safety-schema/SKILL.md)

## Remember

**Code quality is non-negotiable.**

If the linter complains, it's usually for a good reason. Invest time in understanding the rule and fixing the issue properly rather than bypassing it.

Clean code today saves debugging time tomorrow.
