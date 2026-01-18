# Type Safety: From Database to Frontend

**A comprehensive guide for students working on Consumer App**

This document explains how data flows through the system, from database to frontend, and how we use TypeScript types to ensure everything works together seamlessly.

## 📚 Table of Contents

1. [Overview: The Red Thread](#overview-the-red-thread)
   - MySQL vs PostgreSQL
   - What is Drizzle?
   - UUIDv7 vs Auto Increment IDs
2. [Level 1: Database Schema (Drizzle)](#level-1-database-schema-drizzle)
3. [Level 2: Validation and Contracts (Zod)](#level-2-validation-and-contracts-zod)
4. [Level 3: API Routes](#level-3-api-routes)
5. [Level 4: Frontend](#level-4-frontend)
6. [Quality Checks: ESLint and TypeCheck](#quality-checks-eslint-and-typecheck)
7. [Practical Example: Adding a New Field](#practical-example-adding-a-new-field)
8. [Practical Example: Creating a New Table](#practical-example-creating-a-new-table)
9. [Troubleshooting](#troubleshooting)

---

## Overview: The Red Thread

In Consumer App, we use **type safety** all the way from database to frontend. This means TypeScript can tell us if we're trying to use data incorrectly, BEFORE we run the code.

### What's the difference between MySQL and PostgreSQL?

If you're coming from MySQL, PostgreSQL is quite similar, but with some advantages:
- Better support for JSON data
- Stricter typing (more precise with data types)
- Better handling of UUIDs (unique IDs)
- More advanced SQL features

### What is Drizzle?

**Drizzle** is an ORM (Object-Relational Mapping) tool. Instead of writing SQL directly:

```sql
-- Old way (SQL)
SELECT * FROM users WHERE email = 'test@example.com';
```

We can write TypeScript:

```typescript
// New way (Drizzle)
const user = await db.query.users.findFirst({
  where: eq(users.email, 'test@example.com')
});
```

**Benefits of Drizzle:**
- TypeScript autocomplete (you get suggestions while typing)
- Type safety (errors caught before runtime)
- Easier to refactor code
- Database schema defined in TypeScript
- Type inference - TypeScript knows what shape your data has

### UUIDv7 vs Auto Increment IDs

**Important:** Consumer App uses **UUIDv7** for IDs, not auto-increment integers.

#### Traditional Auto Increment (What you might be used to)

```sql
-- MySQL/PostgreSQL with auto-increment
CREATE TABLE users (
  id SERIAL PRIMARY KEY,  -- 1, 2, 3, 4, ...
  email VARCHAR(255)
);

INSERT INTO users (email) VALUES ('test@example.com');
-- id is automatically set to 1, then 2, then 3, etc.
```

**Problems with auto-increment:**
1. **Not globally unique** - Different databases might have the same IDs
2. **Sequential** - Easy to guess how many records exist
3. **Security risk** - Exposes business information (user count, order volume)
4. **Distributed systems** - Requires coordination between servers
5. **Migration issues** - Conflicts when merging databases

#### UUIDv7 (What we use)

```typescript
// Consumer App approach
import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../lib/uuidv7.js';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  // Generates: "018e5c7a-8c3e-7890-1234-56789abcdef0"
});
```

**Benefits of UUIDv7:**
1. **Globally unique** - Can merge databases without ID conflicts
2. **Time-ordered** - Sorted by creation time (like auto-increment)
3. **Secure** - Can't guess total number of records
4. **Distributed-friendly** - Multiple servers can generate IDs independently
5. **URL-safe** - Can use in API endpoints: `/api/users/018e5c7a-8c3e-7890-1234-56789abcdef0`

#### UUIDv7 Structure

```
018e5c7a-8c3e-7890-1234-56789abcdef0
│      │ │  │ │  │ │              │
│      │ │  │ │  │ └──────────────┴─ Random bits (uniqueness)
│      │ │  │ │  └──────────────────── Version (7)
│      │ │  │ └──────────────────────── Variant bits
│      │ └──┴────────────────────────── Sub-second precision
└──────┴──────────────────────────────── Unix timestamp (48 bits)
```

**Time-ordered:** Records with UUIDv7 can be sorted by ID to get chronological order!

```typescript
// This works because UUIDv7 includes timestamp
const users = await db.query.users.findMany({
  orderBy: (users, { desc }) => [desc(users.id)], // ✅ Newest first!
});
```

#### Practical Comparison

**Auto Increment:**
```typescript
const userId = 12345; // Easy to guess the next user is 12346
const apiUrl = `/api/users/${userId}`; // Reveals you have ~12,345 users
```

**UUIDv7:**
```typescript
const userId = '018e5c7a-8c3e-7890-1234-56789abcdef0'; // Impossible to guess
const apiUrl = `/api/users/${userId}`; // Reveals nothing about your data
```

#### How we generate UUIDv7

```typescript
// packages/databases/postgres/src/lib/uuidv7.ts
export function uuidv7(): string {
  const timestamp = BigInt(Date.now()); // Current time in milliseconds
  // ... encoding logic to create UUID format
  return '018e5c7a-8c3e-7890-1234-56789abcdef0';
}
```

The function is automatically called when inserting new records:

```typescript
// When you insert a user, ID is generated automatically
const [newUser] = await db.insert(users).values({
  email: 'test@example.com',
  fullName: 'John Doe',
  // No need to specify ID - uuidv7() is called automatically!
}).returning();

console.log(newUser.id); // "018e5c7a-8c3e-7890-1234-56789abcdef0"
```

#### Why Time-Ordering Matters

With UUIDv7, you can use IDs for sorting:

```typescript
// ✅ Get latest orders by ID (works because UUIDv7 is time-ordered)
const orders = await db.query.orders.findMany({
  orderBy: (orders, { desc }) => [desc(orders.id)],
  limit: 10,
});

// Traditional UUID (v4) would require a separate createdAt field for this!
```

#### Migration from Auto Increment

If you're used to auto-increment and want to convert:

**Before (Auto Increment):**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255)
);
```

**After (UUIDv7):**
```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: varchar('email', { length: 255 }),
});
```

**Key changes:**
- `SERIAL` → `uuid('id')`
- `1, 2, 3, ...` → `018e5c7a-...`, `018e5c7b-...`, `018e5c7c-...`
- Still sortable by ID!
- No more ID conflicts when merging data

### The Red Thread: How Types Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    TYPE FLOW IN CONSUMER APP                     │
└─────────────────────────────────────────────────────────────────┘

1. DATABASE SCHEMA (Drizzle)
   ↓
   packages/databases/postgres/src/schema/users-public/users.ts

   export const users = pgTable('users', {
     id: uuid('id').primaryKey(),
     email: varchar('email', { length: 255 }).notNull(),
     fullName: varchar('full_name', { length: 255 }).notNull(),
   });

   ↓ Drizzle infers types automatically

   type User = typeof users.$inferSelect;
   // { id: string; email: string; fullName: string; ... }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

2. ZOD SCHEMA (Validation + API Contract)
   ↓
   packages/schema/src/user/user.ts

   export const userSchema = z.object({
     id: z.string().uuid(),
     email: z.string().email(),
     fullName: z.string(),
   });

   export type User = z.infer<typeof userSchema>;

   ↓ Exported from @hk26/schema package

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

3. API ROUTE (Backend)
   ↓
   apps/api/src/routes/users.ts

   import { userSchema } from '@hk26/schema';

   fastify.get('/api/users/:id', async (request, reply) => {
     const dbUser = await usersPublicDb.query.users.findFirst(...);

     // Validate + transform
     const user = userSchema.parse(dbUser);

     return reply.send({ ok: true, user });
   });

   ✅ TypeCheck validates this at compile time
   ✅ ESLint enforces code quality

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4. FRONTEND (React Native)
   ↓
   apps/consumer-app/src/hooks/useUser.ts

   import { type User } from '@hk26/schema';

   const { data } = useQuery({
     queryKey: ['user', userId],
     queryFn: async () => {
       const response = await apiClient.get(`/api/users/${userId}`);
       return response.data.user as User;
     }
   });

   // data is now typed as User ✅
   // TypeScript knows that data.fullName exists!
   ✅ TypeCheck validates frontend code too
```

**Key Points:**
- Drizzle schema = How data is stored in the database
- Zod schema = How data looks in the API (contract between backend and frontend)
- Frontend uses the Zod type to know what to expect
- TypeCheck ensures all types are correct throughout
- ESLint enforces code quality and catches bugs

---

## Level 1: Database Schema (Drizzle)

### Where do I find database schemas?

```
packages/databases/postgres/src/schema/
├── users-public/          ← User data, favorites, orders
│   ├── users.ts
│   ├── favorites.ts
│   ├── carts.ts
│   ├── orders.ts
│   └── addresses.ts
└── catalog-demo/          ← Content data, products, subjects
    ├── subjects.ts
    ├── products.ts
    ├── content.ts
    └── ...
```

### Why two databases?

Consumer App has two separate databases:

1. **users_public** - User data (accounts, orders, favorites)
2. **catalog_demo** - Catalog data (products, subjects, content)

**Why?** In production, catalog data can be shared between multiple apps, while user data is specific to Consumer App. This separation also helps with:
- Data isolation
- Different scaling strategies
- Security boundaries

### Example: User Schema

```typescript
// packages/databases/postgres/src/schema/users-public/users.ts

import { pgTable, uuid, varchar, boolean, timestamp, date } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../lib/uuidv7.js';

export const users = pgTable('users', {
  // Primary key - unique ID for each user
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),

  // Email must be unique and not-null
  email: varchar('email', { length: 255 }).notNull().unique(),

  // Password hash (we NEVER store passwords in plain text!)
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),

  // User info
  fullName: varchar('full_name', { length: 255 }).notNull(),
  birthdate: date('birthdate').notNull(),
  isVerified: boolean('is_verified').notNull().default(false),

  // Timestamps - when was the user created?
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Important concepts:**

- `pgTable('users', ...)` - Table name in the database
- `uuid('id')` - UUID type in database (better than auto-increment for distributed systems)
- `.notNull()` - Field MUST have a value
- `.unique()` - Value must be unique in the table
- `.default(false)` - If not set, use false
- `.$defaultFn(() => uuidv7())` - Automatically generate UUIDv7

**TypeScript Integration:**
Drizzle generates TypeScript types from your schema automatically. This means when you query the database, TypeScript knows exactly what fields are available.

### Relations Between Tables

```typescript
// packages/databases/postgres/src/schema/users-public/favorites.ts

import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { subjects } from '../catalog-demo/subjects.js';

export const favorites = pgTable(
  'favorites',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),

    // Foreign key to users table
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Foreign key to subjects table (in another database!)
    subjectId: uuid('subject_id').notNull(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Index for faster lookups on userId
    userIdx: index('idx_favorites_user').on(table.userId),
  })
);
```

**Important:**
- `.references(() => users.id)` - Foreign key constraint
- `{ onDelete: 'cascade' }` - If user is deleted, delete favorites too
- `subjectId` has NO `.references()` because it refers to another database
- Indexes speed up queries - crucial for performance

### Type Inference from Drizzle

Drizzle can automatically create TypeScript types from schema:

```typescript
// Don't do this in your code - this is just to show the concept
type UserRow = typeof users.$inferSelect;
// Result:
// {
//   id: string;
//   email: string;
//   passwordHash: string;
//   fullName: string;
//   birthdate: string;
//   isVerified: boolean;
//   createdAt: Date;
//   updatedAt: Date;
// }
```

**But:** We DON'T use these types directly in the API! Read on to see why...

### TypeCheck catches database type errors

When you run `pnpm typecheck`, TypeScript validates that:
- Your queries match the schema
- You're using correct field names
- Types are compatible

```typescript
// ❌ This will fail typecheck
const user = await db.query.users.findFirst({
  where: eq(users.invalidField, 'test') // Error: Property 'invalidField' does not exist
});

// ✅ This passes typecheck
const user = await db.query.users.findFirst({
  where: eq(users.email, 'test@example.com')
});
```

---

## Level 2: Validation and Contracts (Zod)

### Why do we need Zod when we have Drizzle?

**Problem:** Drizzle types describe the database, but:
1. The API shouldn't expose `passwordHash`
2. Dates can be formatted differently (`Date` vs `string`)
3. We need runtime validation (check that data is actually correct)
4. We want a shared contract between backend and frontend

**Solution:** Zod schemas in `packages/schema`

### What is Zod?

Zod is a validation library that lets us:
1. Define what data SHOULD look like
2. Validate data at runtime (when the program runs)
3. Automatically get TypeScript types

```typescript
import { z } from 'zod';

// Define schema
const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
});

// Validate data
const data = { id: 'abc', email: 'invalid', fullName: 'John' };
const result = userSchema.safeParse(data);

if (!result.success) {
  console.log(result.error);
  // ZodError: [
  //   { path: ['id'], message: 'Invalid uuid' },
  //   { path: ['email'], message: 'Invalid email' }
  // ]
}
```

**Runtime validation is crucial:** Even with TypeScript, you can't trust data from external sources (users, APIs, databases). Zod validates at runtime to catch issues TypeScript can't detect.

### Example: User Schema (Zod)

```typescript
// packages/schema/src/user/user.ts

import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  birthdate: z.string(), // 'YYYY-MM-DD' format
  isVerified: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Automatic type inference
export type User = z.infer<typeof userSchema>;

// Result:
// type User = {
//   id: string;
//   email: string;
//   fullName: string;
//   birthdate: string;
//   isVerified: boolean;
//   createdAt: string;
//   updatedAt: string;
// }
```

**Notice:**
- No `passwordHash` - should NEVER be sent to frontend
- Dates are `string`, not `Date` (easier over HTTP)
- We can use `.email()` and `.uuid()` for validation
- The schema serves as documentation

### API Request/Response Schemas

```typescript
// packages/schema/src/auth/register.ts

import { z } from 'zod';

// What the user sends to /auth/register
export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

// What the API responds with
export const registerResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    fullName: z.string(),
    birthdate: z.string(),
    isVerified: z.boolean(),
  }),
});

// Types
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
```

**This is your API contract!** Both backend and frontend agree on this shape.

### Where are Zod schemas placed?

```
packages/schema/src/
├── auth/
│   ├── login.ts          ← Login request/response
│   ├── register.ts       ← Register request/response
│   └── types.ts          ← TokenPayload (shared type)
├── user/
│   └── user.ts           ← User schema
├── cart/
│   └── cart.ts           ← Cart and CartItem schemas
├── order/
│   └── order.ts          ← Order schemas
├── product/
│   └── product.ts        ← Product schemas
└── index.ts              ← Export everything
```

**Important:** Everything in `packages/schema` can be used by both backend and frontend!

```typescript
// Backend
import { userSchema } from '@hk26/schema';

// Frontend
import { type User } from '@hk26/schema';
```

### ESLint enforces schema placement

Our ESLint config has a special rule:

```typescript
// ❌ This will fail ESLint in apps/api/src/routes/
export interface User {  // Error: Types must be in packages/schema
  id: string;
  email: string;
}

// ✅ This passes - types are in packages/schema
import { type User } from '@hk26/schema';
```

**Why?** To prevent duplicate type definitions. If backend and frontend each define their own `User` type, they can drift apart and cause bugs.

See `.claude/skills/type-safety-schema/SKILL.md` for the full rules.

---

## Level 3: API Routes

### How the API uses Drizzle and Zod

```typescript
// apps/api/src/routes/users.ts

import { FastifyInstance } from 'fastify';
import { usersPublicDb } from '@hk26/postgres';
import { users } from '@hk26/postgres';
import { userSchema } from '@hk26/schema';
import { eq } from 'drizzle-orm';

export default async function usersRoutes(fastify: FastifyInstance) {
  // Get user by ID
  fastify.get<{ Params: { id: string } }>('/api/users/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // 1. Fetch from database (Drizzle)
      const dbUser = await usersPublicDb.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!dbUser) {
        return reply.status(404).send({
          ok: false,
          error: 'User not found',
        });
      }

      // 2. Remove sensitive fields
      const { passwordHash, ...userWithoutPassword } = dbUser;

      // 3. Validate output (Zod)
      const user = userSchema.parse({
        ...userWithoutPassword,
        birthdate: userWithoutPassword.birthdate.toISOString().split('T')[0],
        createdAt: userWithoutPassword.createdAt.toISOString(),
        updatedAt: userWithoutPassword.updatedAt.toISOString(),
      });

      // 4. Send to frontend
      return reply.send({
        ok: true,
        user, // TypeScript knows this matches userSchema!
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        ok: false,
        error: 'Failed to fetch user',
      });
    }
  });
}
```

**Step by step:**

1. **Fetch data from database** with Drizzle
2. **Remove sensitive fields** (passwordHash)
3. **Transform data** (Date → string)
4. **Validate with Zod** (ensure everything is correct)
5. **Send to frontend**

### Why validate output?

```typescript
// If someone changes the database without updating Zod schema:
const user = userSchema.parse(dbUser);
// Zod will throw an error if anything is missing or wrong type!
```

This protects the frontend from receiving invalid data.

### TypeCheck and ESLint in API routes

```bash
# TypeCheck ensures:
pnpm typecheck
# ✅ Query types match Drizzle schema
# ✅ Response types match Zod schema
# ✅ No undefined fields accessed

# ESLint ensures:
pnpm lint
# ✅ No unused variables
# ✅ Proper error handling
# ✅ No type definitions in route files (must be in packages/schema)
# ✅ Consistent code style
```

**Example of TypeCheck catching errors:**

```typescript
// ❌ TypeCheck error: Property 'invalidField' does not exist
const user = await usersPublicDb.query.users.findFirst({
  where: eq(users.invalidField, 'test')
});

// ❌ TypeCheck error: Type 'number' is not assignable to type 'string'
return reply.send({
  ok: true,
  user: {
    id: 123, // Should be string!
    email: 'test@test.com'
  }
});
```

---

## Level 4: Frontend

### How the frontend uses types

```typescript
// apps/consumer-app/src/hooks/useUser.ts

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type User } from '@hk26/schema';

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/users/${userId}`);

      // TypeScript knows that response.data.user is User type
      const user: User = response.data.user;

      return user;
    },
  });
}
```

### Using the hook in a component

```typescript
// apps/consumer-app/src/screens/ProfileScreen.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { useUser } from '../hooks/useUser';

export function ProfileScreen({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;
  if (!user) return <Text>User not found</Text>;

  return (
    <View>
      <Text>{user.fullName}</Text>
      <Text>{user.email}</Text>
      {/* TypeScript autocomplete works here! ✅ */}
      {/* If you try to use user.passwordHash, you get an error! ✅ */}
    </View>
  );
}
```

**Benefits:**
- Autocomplete: TypeScript suggests `user.fullName`, `user.email`, etc.
- Type safety: Can't use `user.invalidField`
- Refactoring: If you rename `fullName` to `name`, you get errors everywhere it's used

### TypeCheck in Frontend

```bash
# Check frontend types
pnpm --filter @hk26/consumer-app typecheck

# ✅ All imports from @hk26/schema work
# ✅ Component props are correct
# ✅ No accessing undefined fields
# ✅ TanStack Query types are correct
```

**Example of TypeCheck catching frontend errors:**

```typescript
// ❌ TypeCheck error: Property 'invalidField' does not exist on type 'User'
<Text>{user.invalidField}</Text>

// ❌ TypeCheck error: Type 'User | undefined' cannot be used
<Text>{user.fullName}</Text> // Need to check if user exists first!

// ✅ Correct
{user && <Text>{user.fullName}</Text>}
```

---

## Quality Checks: ESLint and TypeCheck

### What is TypeCheck?

**TypeCheck** runs the TypeScript compiler to verify all types are correct WITHOUT actually running the code.

```bash
# Check types across all packages
pnpm typecheck

# Check specific package
pnpm --filter @hk26/api typecheck
pnpm --filter @hk26/consumer-app typecheck
```

**What TypeCheck validates:**

1. **Type compatibility**
   ```typescript
   // ❌ Error: Type 'number' is not assignable to type 'string'
   const id: string = 123;
   ```

2. **Property existence**
   ```typescript
   // ❌ Error: Property 'invalidField' does not exist
   const name = user.invalidField;
   ```

3. **Function signatures**
   ```typescript
   // ❌ Error: Expected 2 arguments, but got 1
   function createUser(email: string, password: string) { }
   createUser('test@test.com'); // Missing password!
   ```

4. **Null/undefined safety**
   ```typescript
   // ❌ Error: Object is possibly 'undefined'
   const user: User | undefined = getUser();
   console.log(user.email); // Need to check if user exists!
   ```

### What is ESLint?

**ESLint** analyzes your code for:
- Code quality issues
- Potential bugs
- Style consistency
- Best practices

```bash
# Check code quality
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

**What ESLint catches:**

1. **Type definitions in wrong place**
   ```typescript
   // ❌ ESLint error: Types must be in packages/schema
   export interface User {
     id: string;
   }
   ```

2. **Unused variables**
   ```typescript
   // ❌ ESLint error: 'tempVar' is defined but never used
   const tempVar = 'test';
   ```

3. **Missing error handling**
   ```typescript
   // ⚠️ ESLint warning: Promises should be awaited or handled
   fetchUser(id); // Forgot await!
   ```

4. **Inconsistent imports**
   ```typescript
   // ❌ ESLint error: Use type imports for types
   import { User } from '@hk26/schema'; // Should be: import { type User }
   ```

### The Quality Check Workflow

**Before committing code:**

```bash
# 1. Run typecheck
pnpm typecheck
# Fix all type errors

# 2. Run lint
pnpm lint
# Fix all ESLint errors

# 3. Auto-fix formatting
pnpm lint --fix

# 4. Commit
git add .
git commit -m "feat: add user profile"
```

### Quality Gates

**Must pass before merging:**
- ✅ `pnpm typecheck` - 0 errors
- ✅ `pnpm lint` - 0 errors
- ⚠️ Warnings should be addressed or justified

**See `.claude/skills/code-quality-check/SKILL.md` for detailed guidelines.**

### Common TypeCheck Errors and Fixes

**Error: Cannot find module '@hk26/schema'**
```bash
# Fix: Install dependencies
pnpm install
```

**Error: Type 'X' is not assignable to type 'Y'**
```typescript
// Problem: Mismatched types
const user: User = { id: 123 }; // id should be string

// Fix: Use correct type
const user: User = { id: '123', ... };
```

**Error: Property 'X' does not exist on type 'Y'**
```typescript
// Problem: Accessing non-existent field
console.log(user.invalidField);

// Fix: Use existing field or add to schema
console.log(user.fullName);
```

### Common ESLint Errors and Fixes

**Error: Type definitions must be in packages/schema**
```typescript
// ❌ Wrong: Type in API route
export interface CreateUserRequest {
  email: string;
}

// ✅ Correct: Move to packages/schema
// packages/schema/src/user/user.ts
export const createUserRequestSchema = z.object({
  email: z.string().email(),
});
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
```

**Error: No unused variables**
```typescript
// ❌ Wrong: Unused variable
const tempUser = getUser();

// ✅ Fix: Remove or prefix with underscore
const _tempUser = getUser(); // Explicitly unused
```

---

## Practical Example: Adding a New Field

Let's say we want to add a `phoneNumber` field to users.

### Step 1: Update Database Schema

```typescript
// packages/databases/postgres/src/schema/users-public/users.ts

export const users = pgTable('users', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  birthdate: date('birthdate').notNull(),
  isVerified: boolean('is_verified').notNull().default(false),

  // ✨ NEW FIELD
  phoneNumber: varchar('phone_number', { length: 20 }),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

### Step 2: Generate Migration

```bash
# Generate migration file
pnpm db:generate

# This creates a file in:
# packages/databases/postgres/drizzle/migrations/0001_add_phone_number.sql
```

**Migration file content:**
```sql
ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
```

### Step 3: Run Migration

```bash
# Run migration against database
pnpm db:migrate
```

This updates the database to have the new column!

### Step 4: Update Zod Schema

```typescript
// packages/schema/src/user/user.ts

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string(),
  birthdate: z.string(),
  isVerified: z.boolean(),

  // ✨ NEW FIELD
  phoneNumber: z.string().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
```

### Step 5: Verify with TypeCheck

```bash
pnpm typecheck
# ✅ Should pass - TypeScript knows about phoneNumber now
```

### Step 6: Update API Route (if needed)

```typescript
// apps/api/src/routes/users.ts

// No changes needed!
// Drizzle and Zod handle the new field automatically
```

### Step 7: Run ESLint

```bash
pnpm lint
# ✅ Should pass - no code quality issues
```

### Step 8: Use in Frontend

```typescript
// apps/consumer-app/src/screens/ProfileScreen.tsx

export function ProfileScreen({ userId }: { userId: string }) {
  const { data: user } = useUser(userId);

  return (
    <View>
      <Text>{user.fullName}</Text>
      <Text>{user.email}</Text>

      {/* ✨ NEW FIELD */}
      {user.phoneNumber && <Text>{user.phoneNumber}</Text>}
    </View>
  );
}
```

**TypeScript knows automatically that `phoneNumber` exists!** ✅

### Step 9: Final Quality Check

```bash
# Check everything works
pnpm typecheck  # ✅ All types correct
pnpm lint       # ✅ Code quality good
```

---

## Practical Example: Creating a New Table

Let's create a `reviews` table for product reviews.

### Step 1: Create Database Schema

```typescript
// packages/databases/postgres/src/schema/users-public/reviews.ts

import { pgTable, uuid, varchar, integer, text, timestamp, index } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../../lib/uuidv7.js';
import { users } from './users.js';

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull(), // From catalog_demo database
    rating: integer('rating').notNull(), // 1-5
    title: varchar('title', { length: 255 }),
    comment: text('comment'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index('idx_reviews_user').on(table.userId),
    productIdx: index('idx_reviews_product').on(table.productId),
  })
);
```

**Note the indexes!** They dramatically improve query performance.

### Step 2: Export from index

```typescript
// packages/databases/postgres/src/schema/users-public/index.ts

export * from './users.js';
export * from './favorites.js';
export * from './carts.js';
export * from './orders.js';
export * from './addresses.js';
export * from './reviews.js'; // ✨ NEW
```

### Step 3: Update database clients

```typescript
// packages/databases/postgres/src/clients/users-public-db.ts

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as usersPublicSchema from '../schema/users-public/index.js';

const client = postgres(process.env.USERS_PUBLIC_DATABASE_URL || '');

export const usersPublicDb = drizzle(client, {
  schema: usersPublicSchema,
});

// Re-export schema
export { users, favorites, carts, orders, addresses, reviews } from '../schema/users-public/index.js';
```

### Step 4: Generate and run migration

```bash
pnpm db:generate
pnpm db:migrate
```

### Step 5: Create Zod Schema

```typescript
// packages/schema/src/review/review.ts

import { z } from 'zod';

export const reviewSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Request schemas
export const createReviewRequestSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
});

// Types
export type Review = z.infer<typeof reviewSchema>;
export type CreateReviewRequest = z.infer<typeof createReviewRequestSchema>;
```

### Step 6: Export from packages/schema

```typescript
// packages/schema/src/index.ts

export * from './auth';
export * from './user';
export * from './marketplace';
export * from './subject';
export * from './cart';
export * from './order';
export * from './address';
export * from './favorite';
export * from './content';
export * from './review'; // ✨ NEW
```

### Step 7: Create API Route

```typescript
// apps/api/src/routes/reviews.ts

import { FastifyInstance } from 'fastify';
import { usersPublicDb, reviews } from '@hk26/postgres';
import { reviewSchema, createReviewRequestSchema } from '@hk26/schema';
import { eq } from 'drizzle-orm';
import { verifyAccessToken } from '../lib/jwt.js';

export default async function reviewsRoutes(fastify: FastifyInstance) {
  // Get reviews for a product
  fastify.get<{ Params: { productId: string } }>(
    '/api/products/:productId/reviews',
    async (request, reply) => {
      const { productId } = request.params;

      const productReviews = await usersPublicDb.query.reviews.findMany({
        where: eq(reviews.productId, productId),
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
      });

      return reply.send({
        ok: true,
        reviews: productReviews,
      });
    }
  );

  // Create review
  fastify.post<{ Body: CreateReviewRequest }>(
    '/api/reviews',
    async (request, reply) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ ok: false, error: 'Unauthorized' });
      }

      const token = authHeader.substring(7);
      const { userId } = verifyAccessToken(token);

      // Validate request (Zod catches invalid data!)
      const body = createReviewRequestSchema.parse(request.body);

      // Create review
      const [newReview] = await usersPublicDb
        .insert(reviews)
        .values({
          userId,
          productId: body.productId,
          rating: body.rating,
          title: body.title,
          comment: body.comment,
        })
        .returning();

      return reply.status(201).send({
        ok: true,
        review: newReview,
      });
    }
  );
}
```

### Step 8: Register route

```typescript
// apps/api/src/app.ts

import reviewsRoutes from './routes/reviews.js';

export async function buildApp() {
  const app = Fastify({ /* ... */ });

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(subjectsRoutes);
  // ... other routes
  await app.register(reviewsRoutes); // ✨ NEW

  return app;
}
```

### Step 9: Run Quality Checks

```bash
# Verify everything works
pnpm typecheck  # ✅ All types are correct
pnpm lint       # ✅ Code quality is good
```

**ESLint will catch:**
- If you forgot to add types to packages/schema
- Unused imports
- Inconsistent code style

**TypeCheck will catch:**
- If Zod schema doesn't match database schema
- If API route uses wrong types
- If frontend tries to access non-existent fields

### Step 10: Use in Frontend

```typescript
// apps/consumer-app/src/hooks/useReviews.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { type Review, type CreateReviewRequest } from '@hk26/schema';

export function useReviews(productId: string) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/products/${productId}/reviews`);
      return response.data.reviews as Review[];
    },
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (review: CreateReviewRequest) => {
      const response = await apiClient.post('/api/reviews', review);
      return response.data.review as Review;
    },
    onSuccess: (data) => {
      // Invalidate reviews query for this product
      queryClient.invalidateQueries({ queryKey: ['reviews', data.productId] });
    },
  });
}
```

```typescript
// apps/consumer-app/src/screens/ProductScreen.tsx

import React from 'react';
import { View, Text, TextInput, Button } from 'react-native';
import { useReviews, useCreateReview } from '../hooks/useReviews';

export function ProductScreen({ productId }: { productId: string }) {
  const { data: reviews } = useReviews(productId);
  const createReview = useCreateReview();

  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');

  const handleSubmit = () => {
    createReview.mutate({
      productId,
      rating,
      comment,
    });
  };

  return (
    <View>
      <Text>Reviews</Text>
      {reviews?.map(review => (
        <View key={review.id}>
          <Text>Rating: {review.rating}/5</Text>
          <Text>{review.comment}</Text>
        </View>
      ))}

      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Write a review..."
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
```

**Done!** You now have:
- ✅ New table in database
- ✅ Zod schema for validation
- ✅ API routes for CRUD operations
- ✅ Frontend hooks for data fetching
- ✅ Full type safety from database to UI
- ✅ All quality checks passing

---

## Troubleshooting

### Problem: "Cannot find module '@hk26/schema'"

**Cause:** Package is not installed or built.

**Solution:**
```bash
pnpm install
```

### Problem: TypeCheck fails with "Type 'X' is not assignable to type 'Y'"

**Cause:** Database schema and Zod schema are not synchronized.

**Solution:**
1. Check that Drizzle schema matches database
2. Check that Zod schema matches API output
3. Run `pnpm typecheck` to find all type errors

```bash
# Get detailed error messages
pnpm typecheck

# Example output:
# apps/api/src/routes/users.ts:42:7
#   Type 'Date' is not assignable to type 'string'
#   Fix: Convert Date to string before sending
```

### Problem: Migration fails

**Cause:** Database schema conflicts.

**Solution:**
```bash
# Reset database (WARNING: Deletes all data!)
pnpm db:reset

# Or manually:
psql -U postgres -d users_public -c "DROP TABLE reviews;"
pnpm db:migrate
```

### Problem: Zod validation error in production

**Cause:** Data in database doesn't match Zod schema.

**Solution:**
1. Check error message from Zod
2. Fix data in database or update Zod schema
3. Test with `.safeParse()` for better error handling:

```typescript
const result = userSchema.safeParse(data);
if (!result.success) {
  console.error('Validation failed:', result.error);
  // Handle error gracefully
}
```

### Problem: ESLint errors after adding new code

**Cause:** Code doesn't follow project standards.

**Solution:**
```bash
# Auto-fix what's possible
pnpm lint --fix

# Check remaining issues
pnpm lint
```

**Common fixes:**
- Move types to `packages/schema`
- Remove unused variables (or prefix with `_`)
- Add proper type imports (`import { type User }`)

### Problem: TypeCheck passes but runtime error occurs

**Cause:** Data from external source doesn't match expected type.

**Solution:** Always validate with Zod at runtime!

```typescript
// ❌ Bad: Assume data is correct
const user: User = response.data.user;

// ✅ Good: Validate with Zod
const user = userSchema.parse(response.data.user);
// Throws error if invalid!
```

---

## Summary

### The Red Thread (recap)

1. **Database (Drizzle)** - How data is stored
2. **Validation (Zod)** - Contract between backend and frontend
3. **API** - Transform and send data
4. **Frontend** - Use data with full type safety
5. **Quality Checks** - TypeCheck and ESLint ensure correctness

### Important Principles

✅ **DO:**
- Define all API contracts in `packages/schema`
- Use Zod for validation
- Transform database types to API types
- Use TypeScript types in frontend
- Run `pnpm typecheck` before committing
- Run `pnpm lint --fix` to fix style issues
- Keep types synchronized across layers
- Use UUIDv7 for all primary keys (automatically generated)

❌ **DON'T:**
- Send database types directly to frontend
- Export `passwordHash` or other sensitive fields
- Use `any` type
- Skip validation
- Define types in API routes (use packages/schema)
- Ignore TypeCheck or ESLint errors
- Use auto-increment IDs (use UUIDv7 instead)
- Manually set IDs when inserting (let `uuidv7()` handle it)

### Quality Workflow

**Before every commit:**

```bash
# 1. Type safety
pnpm typecheck  # ✅ Must pass

# 2. Code quality
pnpm lint       # ✅ Must pass
pnpm lint --fix # Auto-fix style issues

# 3. Commit
git add .
git commit -m "feat: add reviews feature"
```

### Next Steps

To learn more, see:
- `.claude/skills/type-safety-schema/SKILL.md` - Type safety rules
- `.claude/skills/code-quality-check/SKILL.md` - ESLint and quality standards
- `packages/schema/src/` - Examples of Zod schemas
- `apps/api/src/routes/` - Examples of API routes

**Good luck with Consumer App!** 🚀
