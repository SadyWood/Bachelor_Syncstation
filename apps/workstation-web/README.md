# workstation-web

Frontend application for Hoolsy Workstation - a React-based content management interface with widget system, timeline editor, and media management.

## Overview

Workstation Web provides:

- **Dashboard** - Customizable widget-based interface
- **Content Management** - Hierarchical project/folder/content organization with drag-and-drop
- **Media Management** - Upload and preview video/audio/image files
- **Timeline Editor** - Visual editing interface for media content (using `@hoolsy/timeline`)
- **Admin Panel** - User management, roles, permissions (RBAC)
- **Multi-tenancy** - Switch between different workspace tenants

## Tech Stack

- **React 19** - UI framework with modern hooks
- **TypeScript** - Type-safe frontend development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **React Router** - Client-side routing
- **SWR** - Data fetching with automatic caching and revalidation
- **Zustand** - Lightweight state management
- **React DnD** - Drag-and-drop for content tree
- **React Grid Layout** - Dashboard widget system
- **Lucide React** - Icon library

## Project Structure

```
apps/workstation-web/
├── src/
│   ├── components/      # Reusable UI components
│   │   └── WidgetBase/  # Base widget component for dashboard
│   ├── lib/             # API client and utilities
│   │   └── ws-client.ts # Workstation API client
│   ├── pages/           # Route pages
│   │   ├── DashboardPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── TimelineEditorPage.tsx
│   │   └── ...
│   ├── state/           # State management
│   │   ├── AuthContext.tsx     # Auth state (JWT, current user, tenant)
│   │   ├── DashboardStore.ts   # Dashboard layout state (Zustand)
│   │   └── ...
│   ├── types/           # TypeScript type definitions
│   ├── widgets/         # Dashboard widgets
│   │   ├── Admin/       # MembersList, RolesList, PermissionsCatalog
│   │   ├── ContentDashboard/  # ProjectBrowser, MediaPreview
│   │   └── ...
│   ├── App.tsx          # Root component with routing
│   ├── main.tsx         # Vite entry point
│   └── index.css        # Tailwind imports
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Running API server (see [apps/api/](../api/))

### Installation

From the **monorepo root**:

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start dev server
pnpm --filter workstation-web dev

# Or from this directory
cd apps/workstation-web
pnpm dev
```

The app will be available at `http://localhost:5173`.

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Configuration

### Environment Variables

Create `.env` file (or use Vite defaults):

```bash
# API endpoint (proxied by Vite)
VITE_API_URL=http://localhost:3333
```

### Vite Proxy

The dev server proxies `/api/*` and `/auth/*` to the backend API:

```ts
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3333',
      '/auth': 'http://localhost:3333',
    },
  },
});
```

## Key Features

### Authentication

- JWT-based auth with httpOnly refresh cookies
- Login/register flow with invite tokens
- Automatic token refresh on 401
- Auth context provides `currentUser`, `currentTenantInfo`, `logout()`

```tsx
import { useAuth } from './state/AuthContext';

function MyComponent() {
  const { currentUser, currentTenantInfo, logout } = useAuth();

  if (!currentUser) return <LoginPage />;

  return <div>Welcome {currentUser.displayName}</div>;
}
```

### Widget System

Dashboard uses `react-grid-layout` for draggable/resizable widgets:

```tsx
// widgets/MyWidget.tsx
import { BaseWidget } from '../components/WidgetBase/BaseWidget';

export default function MyWidget({ title, onClose, ...props }: WidgetProps) {
  return (
    <BaseWidget title={title} onClose={onClose} {...props}>
      <div className="p-4">Widget content here</div>
    </BaseWidget>
  );
}
```

**Available Widgets:**

- **ProjectBrowser** - Content tree with drag-and-drop
- **MediaPreview** - Video/audio/image player
- **MembersList** - Tenant members management
- **RolesList** - RBAC roles management
- **PermissionsCatalog** - Permission editor for roles

### Data Fetching with SWR

Modern components use `useSWR` for automatic caching and revalidation:

```tsx
import useSWR from 'swr';
import { listRoles } from '../lib/ws-client';

function RolesList() {
  const {
    data: roles = [],
    error,
    isLoading,
    mutate,
  } = useSWR(tenantId ? `/api/tenants/${tenantId}/roles` : null, () => listRoles(tenantId), {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      {roles.map((role) => (
        <RoleCard key={role.roleId} role={role} />
      ))}
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  );
}
```

### Content Tree with Drag & Drop

`ProjectBrowser` widget uses `react-dnd` for moving content nodes:

```tsx
import { useDrag, useDrop } from 'react-dnd';

const [{ isDragging }, drag] = useDrag({
  type: 'CONTENT_NODE',
  item: { nodeId: node.nodeId },
});

const [{ isOver }, drop] = useDrop({
  accept: 'CONTENT_NODE',
  drop: (item) => moveNode(item.nodeId, node.nodeId),
});
```

### Timeline Editor

Integration with `@hoolsy/timeline` package for visual media editing:

```tsx
import { Timeline } from '@hoolsy/timeline';

function TimelineEditorPage() {
  return (
    <Timeline
      tracks={tracks}
      duration={durationMs}
      onClipMove={handleClipMove}
      onClipResize={handleClipResize}
    />
  );
}
```

See [@hoolsy/timeline](../../packages/timeline/) for timeline component details.

## Styling

Uses **Tailwind CSS** with custom design system:

### Utility Classes

```css
/* Component classes */
.ws-btn             /* Base button */
.ws-btn-solid       /* Primary button */
.ws-btn-outline     /* Secondary button */
.ws-btn-sm          /* Small button */
.ws-input           /* Input field */
.ws-table           /* Table styling */
.ws-alert           /* Alert box */
.ws-chip            /* Chip/badge */
.ws-skeleton        /* Loading skeleton */

/* State classes */
.ws-row-active      /* Active table row */
.ws-muted           /* Muted text */
```

### Custom Colors

```js
// tailwind.config.js
colors: {
  primary: { /* Blue shades */ },
  secondary: { /* Gray shades */ },
  success: { /* Green */ },
  danger: { /* Red */ },
}
```

## API Client

The `ws-client.ts` module provides typed API functions:

```ts
import { login, listProjects, createProject, uploadMedia } from './lib/ws-client';

// Auth
const { accessToken, currentTenant } = await login(email, password);

// Content
const projects = await listProjects(tenantId);
const project = await createProject(tenantId, { title, synopsis });

// Media
const { uploadId } = await initUpload(tenantId, nodeId, { filename, mimeType, sizeBytes });
await uploadFile(uploadId, file);
const { asset } = await completeUpload(uploadId);
```

All functions:

- Include `Authorization: Bearer <token>` header
- Include `x-ws-tenant: <tenantId>` header
- Handle errors consistently
- Return typed responses (using `@workstation/schema`)

## State Management

### AuthContext

Global auth state using React Context:

```tsx
const authContext = {
  currentUser: User | null,
  currentTenantInfo: Tenant | null,
  accessToken: string | null,
  permissions: string[],
  login: (email, password) => Promise<void>,
  logout: () => void,
};
```

### DashboardStore (Zustand)

Widget layout state:

```ts
const useDashboardStore = create<DashboardState>((set) => ({
  widgets: [],
  addWidget: (widget) => set(/* ... */),
  removeWidget: (id) => set(/* ... */),
  updateLayout: (layout) => set(/* ... */),
}));
```

## Commands

```bash
# Development
pnpm dev              # Start Vite dev server (port 5173)

# Build & Type Checking
pnpm build            # TypeScript compile + Vite build
pnpm typecheck        # Run TypeScript compiler
pnpm preview          # Preview production build

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
```

## Testing

Manual testing workflow:

1. Start API server: `pnpm --filter @workstation/api dev`
2. Start frontend: `pnpm --filter workstation-web dev`
3. Navigate to `http://localhost:5173`
4. Login with seeded user credentials

## Deployment

```bash
# Build production bundle
pnpm build

# Output in dist/
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
```

Serve with any static file server (Nginx, Vercel, Netlify, etc.).

## Related Documentation

- [API Backend](../api/README.md)
- [Timeline Package](../../packages/timeline/README.md)
- [Shared Schemas](../../packages/schema/README.md)
- [Logger Package](../../packages/logger/README.md)
