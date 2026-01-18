---
name: useeffect-vs-useswr
description: Guide for choosing between useEffect and useSWR in React components. Use when writing data fetching code, adding side effects, or reviewing React hooks usage. Prevents useEffect anti-patterns and ensures proper use of SWR for data fetching.
---

# useEffect vs useSWR

This skill helps you choose the right tool for React side effects and data fetching, preventing common anti-patterns.

## Quick Decision Tree

```
Are you fetching data from an API/database?
├─ YES → Use useSWR
│   └─ Benefits: caching, deduplication, revalidation, loading states
│
└─ NO → Are you doing one of these?
    ├─ Event listener (WebSocket, custom events) → Use useEffect
    ├─ DOM manipulation → Use useEffect
    ├─ Synchronization with external system → Use useEffect
    ├─ Cleanup on unmount → Use useEffect
    └─ Analytics/tracking → Use useEffect
```

## When to Use Each

### ✅ Use useSWR for Data Fetching

**Rule:** If you're calling an API or database, use useSWR, not useEffect.

**Triggers:**
- `fetch()` calls
- API requests
- Database queries
- Reading from external data sources
- Shared data across components

**Why:**
- ✅ Automatic caching (no duplicate requests)
- ✅ Request deduplication (10 components = 1 request)
- ✅ Built-in loading/error states
- ✅ Race condition handling
- ✅ Revalidation strategies
- ✅ Optimistic updates

**Pattern:**
```tsx
import useSWR from 'swr';

const { data, error, isLoading } = useSWR(key, fetcher, options);
```

### ✅ Use useEffect for Side Effects

**Rule:** If you're NOT fetching data, use useEffect.

**Valid use cases:**
1. **Event listeners** - WebSocket, custom events, browser events
2. **DOM manipulation** - Focus, scroll, third-party libraries
3. **Synchronization** - Syncing React state with external systems
4. **Subscriptions** - Real-time listeners, intervals
5. **Analytics** - Tracking page views, user actions

**Pattern:**
```tsx
useEffect(() => {
  // Setup
  const cleanup = setupSomething();

  // Cleanup
  return () => cleanup();
}, [dependencies]);
```

## Instructions

When writing or reviewing React code, follow these steps:

### Step 1: Identify the Operation

Ask yourself: **"What is this code doing?"**

- Fetching data from `/api/*`? → **Go to Step 2 (useSWR)**
- Setting up event listener? → **Go to Step 3 (useEffect)**
- DOM manipulation? → **Go to Step 3 (useEffect)**
- Synchronization? → **Go to Step 3 (useEffect)**

### Step 2: useSWR Implementation

If you're fetching data, use this pattern:

```tsx
import useSWR from 'swr';
import { fetcher } from '../lib/api';

const { data, error, isLoading, mutate } = useSWR(
  '/api/endpoint', // Key (cache identifier)
  fetcher,         // Fetcher function
  {
    // Optional config
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  }
);

// Loading state
if (isLoading) return <Spinner />;

// Error state
if (error) return <Error message={error.message} />;

// Success state
return <div>{data.map(...)}</div>;
```

**From the codebase (ProjectBrowser.tsx):**
```tsx
const {
  data: projects = [],
  error: swrError,
  isLoading,
} = useSWR<ProjectSummaryType[]>('/api/projects', listProjects, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
});
```

### Step 3: useEffect Implementation

If you're NOT fetching data, use this pattern:

```tsx
import { useEffect } from 'react';

useEffect(() => {
  // Setup code
  const listener = addListener(EVENT_NAME, handler);

  // Cleanup function (ALWAYS return cleanup!)
  return () => {
    removeListener(listener);
  };
}, [dependencies]); // ALWAYS specify dependencies
```

**From the codebase (ContentDashboardPage.tsx):**
```tsx
// ✅ Event listener - correct use of useEffect
useEffect(() => addTypedEventListener<VideoTimeUpdateEvent>(
  EVENT_NAMES.VIDEO_TIME_UPDATE,
  (e) => {
    if (e.detail.currentTime !== undefined) {
      setCurrentTime(e.detail.currentTime * 1000);
    }
  },
), [setCurrentTime]);

// ✅ Synchronization - correct use of useEffect
useEffect(() => {
  setSubjects(mockSubjects);
  setAppearances(mockAppearances);
  setMarkers(mockMarkers);
}, [setSubjects, setAppearances, setMarkers]);

// ✅ URL-based action with delay - correct use of useEffect
useEffect(() => {
  if (isMountedRef.current && urlNodeId) {
    const timeout = setTimeout(() => {
      dispatchSelectNodeById({ nodeId: urlNodeId });
    }, 500);
    return () => clearTimeout(timeout);
  }
}, [urlNodeId]);
```

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: Data Fetching with useEffect

**Bad:**
```tsx
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/data')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);
```

**Good:**
```tsx
const { data, error, isLoading } = useSWR('/api/data', fetcher);
```

**Why:** useEffect requires manual state management, has no caching, and is prone to race conditions.

### ❌ Anti-Pattern 2: Missing Cleanup

**Bad:**
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    console.log('tick');
  }, 1000);
  // ⚠️ Memory leak! Interval keeps running after unmount
}, []);
```

**Good:**
```tsx
useEffect(() => {
  const interval = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(interval); // ✅ Cleanup
}, []);
```

### ❌ Anti-Pattern 3: Missing Dependencies

**Bad:**
```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // ⚠️ Missing userId dependency!
}
```

**Good (with useSWR):**
```tsx
function UserProfile({ userId }) {
  const { data: user } = useSWR(`/api/users/${userId}`, fetchUser);
  // ✅ useSWR automatically re-fetches when userId changes
}
```

### ❌ Anti-Pattern 4: Infinite Loop

**Bad:**
```tsx
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(count + 1); // ⚠️ Infinite loop!
}, [count]); // Re-runs when count changes, which triggers setCount, which changes count...
```

**Good:**
```tsx
const [count, setCount] = useState(0);

// Only increment once on mount
useEffect(() => {
  setCount(c => c + 1);
}, []); // Empty deps = run once
```

### ❌ Anti-Pattern 5: Race Conditions

**Bad:**
```tsx
useEffect(() => {
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(setUser); // ⚠️ Race condition if userId changes fast!
}, [userId]);
```

**Good (with useSWR):**
```tsx
const { data: user } = useSWR(`/api/users/${userId}`, fetchUser);
// ✅ useSWR handles race conditions automatically
```

## Code Review Checklist

When reviewing React code, check:

### For Data Fetching:
- [ ] Is `fetch()` or API call inside useEffect? → **Suggest useSWR**
- [ ] Manual `loading` state? → **Suggest useSWR**
- [ ] Manual `error` state? → **Suggest useSWR**
- [ ] Multiple components fetch same data? → **Definitely use useSWR**

### For useEffect:
- [ ] Does it have a cleanup function? (if needed)
- [ ] Are all dependencies in the dependency array?
- [ ] Could this create an infinite loop?
- [ ] Is there a race condition?
- [ ] Is this actually data fetching in disguise? → **Use useSWR instead**

## Examples from Hoolsy Codebase

### ✅ Correct: useSWR for Projects

```tsx
// apps/workstation-web/src/widgets/ContentDashboard/ProjectBrowser.tsx
const {
  data: projects = [],
  error: swrError,
  isLoading,
} = useSWR<ProjectSummaryType[]>('/api/projects', listProjects, {
  revalidateOnFocus: false,
  dedupingInterval: 60000,
});
```

### ✅ Correct: useEffect for Event Listeners

```tsx
// apps/workstation-web/src/pages/ContentDashboardPage.tsx
useEffect(() => addTypedEventListener<VideoTimeUpdateEvent>(
  EVENT_NAMES.VIDEO_TIME_UPDATE,
  (e) => {
    if (e.detail.currentTime !== undefined) {
      setCurrentTime(e.detail.currentTime * 1000);
    }
  },
), [setCurrentTime]);
```

### ✅ Correct: useEffect for URL Synchronization

```tsx
// apps/workstation-web/src/pages/ContentDashboardPage.tsx
useEffect(() => {
  if (isMountedRef.current && urlNodeId) {
    const timeout = setTimeout(() => {
      dispatchSelectNodeById({ nodeId: urlNodeId });
    }, 500);
    return () => clearTimeout(timeout); // Cleanup
  }
}, [urlNodeId]);
```

## Common Patterns

### Pattern 1: Fetch on Mount

**❌ Bad (useEffect):**
```tsx
useEffect(() => {
  fetch('/api/data').then(res => res.json()).then(setData);
}, []);
```

**✅ Good (useSWR):**
```tsx
const { data } = useSWR('/api/data', fetcher);
```

### Pattern 2: Fetch Based on Prop

**❌ Bad (useEffect):**
```tsx
useEffect(() => {
  fetch(`/api/users/${userId}`).then(res => res.json()).then(setUser);
}, [userId]);
```

**✅ Good (useSWR):**
```tsx
const { data: user } = useSWR(`/api/users/${userId}`, fetchUser);
```

### Pattern 3: Shared Data Across Components

**❌ Bad (useEffect in each component):**
```tsx
// Component A
useEffect(() => {
  fetch('/api/user').then(res => res.json()).then(setUser);
}, []);

// Component B
useEffect(() => {
  fetch('/api/user').then(res => res.json()).then(setUser); // Duplicate!
}, []);
```

**✅ Good (useSWR with shared cache):**
```tsx
// Component A
const { data: user } = useSWR('/api/user', fetchUser);

// Component B
const { data: user } = useSWR('/api/user', fetchUser); // Uses cache!
```

### Pattern 4: Event Listener

**✅ Good (useEffect is correct):**
```tsx
useEffect(() => {
  const handler = (e) => console.log(e);
  window.addEventListener('resize', handler);

  return () => window.removeEventListener('resize', handler);
}, []);
```

## When in Doubt

Ask these questions:

1. **Am I fetching data?**
   - YES → useSWR
   - NO → Continue to question 2

2. **Do I need cleanup?**
   - YES → useEffect with cleanup function
   - NO → Continue to question 3

3. **Am I setting up a subscription or listener?**
   - YES → useEffect
   - NO → Continue to question 4

4. **Am I synchronizing with an external system?**
   - YES → useEffect
   - NO → You might not need either!

## Configuration

Global SWR config is in `apps/workstation-web/src/main.tsx`:

```tsx
<SWRConfig
  value={{
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryCount: 3,
    dedupingInterval: 2000,
  }}
>
  <App />
</SWRConfig>
```

You can override per-hook:
```tsx
useSWR('/api/data', fetcher, {
  revalidateOnFocus: true, // Override global
  dedupingInterval: 60000,  // Override global
});
```

## Summary

| Use Case | Tool | Why |
|----------|------|-----|
| API calls | useSWR | Caching, deduplication, loading states |
| Database queries | useSWR | Same as above |
| Shared data | useSWR | One request, many components |
| Event listeners | useEffect | Needs cleanup |
| DOM manipulation | useEffect | Side effect |
| Subscriptions | useEffect | Needs cleanup |
| Synchronization | useEffect | External system sync |
| Analytics | useEffect | Side effect |

**Golden Rule:** If you're fetching data → useSWR. Everything else → useEffect (if needed at all).
