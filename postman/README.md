# Postman Collection - HK26 API

API testing collection for HK26 backend - comprehensive request suite for authentication, content management, media uploads, and RBAC.

## Overview

This directory contains a complete Postman collection for testing the HK26 API:

- **Collection**: `HK26-API.postman_collection.json` - 40+ API requests
- **Environment**: `HK26-Local.postman_environment.json` - Local development variables

**Features:**
- ✅ Auto-populating variables (tokens, IDs)
- ✅ Pre-configured test scripts
- ✅ Request chaining (login → create project → upload media)
- ✅ Multi-tenant support with `x-ws-tenant` header
- ✅ Complete API coverage (auth, content, media, RBAC)

## Quick Start

### Prerequisites

- **Postman** - Desktop app or web version
- **API running locally** - See [apps/api/README.md](../apps/api/README.md)
- **Database seeded** - Run `pnpm db:seed`

### Import Collection

1. **Open Postman**
2. **Import Collection**:
   - Click **Import** button
   - Select `HK26-API.postman_collection.json`
   - Click **Import**
3. **Import Environment**:
   - Click **Import** button
   - Select `HK26-Local.postman_environment.json`
   - Click **Import**
4. **Activate Environment**:
   - Select **HK26 Local** from environment dropdown (top right)

### Configure Variables

Before testing, set your credentials in the **collection variables** or **environment**:

**Collection Variables** (recommended):
1. Right-click collection → **Edit**
2. Go to **Variables** tab
3. Update:
   - `email`: Your test user email
   - `password`: Your test user password
   - `inviteToken`: (Optional) Demo invite token

**Or use Environment Variables**:
1. Click environment dropdown → Manage Environments
2. Select **HK26 Local**
3. Update the same variables

## Getting Started Workflow

### 1. Register a New User (One-Time Setup)

If you don't have a user account yet:

1. **Get demo invite token** (from database or API logs)
2. **Preview invite** - `GET /auth/invite/:token`
3. **Register** - `POST /auth/register`
   - Automatically populates `accessToken` and `tenantId`

### 2. Login (Daily Workflow)

```
Auth → Login
```

**Auto-populated on success:**
- `accessToken` - JWT for authentication
- `tenantId` - Your current tenant ID

**Request body:**
```json
{
  "email": "{{email}}",
  "password": "{{password}}"
}
```

**Response:**
```json
{
  "ok": true,
  "accessToken": "eyJhbGc...",
  "currentTenant": "uuid-here",
  "currentTenantInfo": {
    "tenantId": "uuid-here",
    "name": "Demo Workspace"
  }
}
```

### 3. Verify Authentication

```
Auth → Me
```

Returns your user profile and current tenant.

### 4. Create Content

```
Content API → Create project
```

**Auto-populated on success:**
- `projectId` - Created project's node ID

**Request body:**
```json
{
  "title": "My New Project",
  "synopsis": "A test project",
  "slug": "",
  "template": "empty"
}
```

### 5. Upload Media

**Three-step upload flow:**

**Step 1: Init upload**
```
Media API → Init upload
```

Auto-populates `uploadId`.

**Step 2: Upload file**
```
Media API → Upload file (multipart)
```

Attach a video/audio/image file.

**Step 3: Complete upload**
```
Media API → Complete upload
```

Auto-populates `mediaAssetId`. Metadata (duration, dimensions, codecs) is automatically extracted.

### 6. Stream Media

```
Media API → Stream media
```

Supports:
- Range requests for video seeking
- Query-based auth (`?token=...&tenant=...`) for HTML5 video elements
- Download mode (`?download=true`)

## Collection Structure

### Health

- **Health** - `GET /healthz` - Server health check

### Auth

- **Login** - `POST /auth/login` - Authenticate with email/password
- **Me** - `GET /auth/me` - Get current user profile
- **Refresh (cookie)** - `POST /auth/refresh` - Refresh access token
- **Invite Preview** - `GET /auth/invite/:token` - Preview invitation
- **Register (from invite)** - `POST /auth/register` - Create account from invite

**Auto-populated variables:**
- `accessToken` (from Login, Refresh, Register)
- `tenantId` (from Login, Me, Register)

### Workstation API (/ws/*)

**Members:**
- **List members** - `GET /ws/members`
- **Invite member** - `POST /ws/invite`
- **Deactivate member** - `POST /ws/members/:userId/deactivate`

**Permissions & Roles:**
- **Permissions catalog** - `GET /ws/permissions/catalog` - List all available permissions
- **Roles list** - `GET /ws/roles` - List tenant roles
- **Roles create** - `POST /ws/roles` - Create new role
- **Roles patch** - `PATCH /ws/roles/:roleId` - Update role permissions
- **Roles get** - `GET /ws/roles/:roleId` - Get single role
- **Roles delete** - `DELETE /ws/roles/:roleId` - Delete role

**Auto-populated variables:**
- `lastRoleId` (from Roles create)

### Content API (/ws/projects, /ws/nodes)

**Projects:**
- **List projects** - `GET /ws/projects`
- **Create project** - `POST /ws/projects`
- **Get project** - `GET /ws/projects/:projectId`
- **Update project** - `PATCH /ws/projects/:projectId`
- **Delete project** - `DELETE /ws/projects/:projectId`
- **Apply template** - `POST /ws/projects/:projectId/template`
- **Get project tree** - `GET /ws/projects/:projectId/tree`

**Nodes:**
- **Create node** - `POST /ws/nodes` - Create group or content node
- **Get node** - `GET /ws/nodes/:nodeId`
- **Update node** - `PATCH /ws/nodes/:nodeId`
- **Delete node** - `DELETE /ws/nodes/:nodeId`
- **Move node** - `POST /ws/nodes/:nodeId/move` - Change parent
- **Reorder siblings** - `POST /ws/nodes/reorder` - Bulk position updates

**Auto-populated variables:**
- `projectId` (from List/Create project)
- `nodeId` (from Create node)

### Media API (/ws/media)

**Upload Flow:**
- **Init upload** - `POST /ws/nodes/:nodeId/media/init` - Start upload session
- **Upload file (multipart)** - `POST /ws/media/:uploadId/upload` - Upload binary
- **Complete upload** - `POST /ws/media/:uploadId/complete` - Finalize & extract metadata

**Management:**
- **Get media for node** - `GET /ws/nodes/:nodeId/media` - List node's media assets
- **Delete media asset** - `DELETE /ws/media/:mediaAssetId`
- **Stream media** - `GET /ws/media/:mediaAssetId/stream` - Stream or download

**Auto-populated variables:**
- `uploadId` (from Init upload)
- `mediaAssetId` (from Complete upload)

### Syncstation API (/syncstation/*)

*Coming soon: Syncstation on-set logging endpoints*

## Auto-Populated Variables

Variables are automatically set by test scripts:

| Variable | Populated By | Usage |
|----------|-------------|-------|
| `accessToken` | Login, Register, Refresh | Authorization header |
| `tenantId` | Login, Me, Register | x-ws-tenant header |
| `projectId` | List/Create project | Project endpoints |
| `nodeId` | Create node | Node endpoints |
| `uploadId` | Init upload | Upload flow |
| `mediaAssetId` | Complete upload | Media endpoints |
| `lastRoleId` | Roles create | Role endpoints |

**You configure once:**
- `email` - Your test user email
- `password` - Your test user password
- `inviteToken` - (Optional) Invite token for registration
- `baseUrl` - API base URL (default: `http://localhost:3333`)

## Example Workflows

### Complete Content Creation Flow

1. **Login** - Get access token
2. **Create project** - Creates project (auto-saves projectId)
3. **Create node** - Creates episode under project (auto-saves nodeId)
4. **Init upload** - Start media upload (auto-saves uploadId)
5. **Upload file** - Upload video/audio file
6. **Complete upload** - Finalize and extract metadata (auto-saves mediaAssetId)
7. **Stream media** - Test playback

### RBAC Management Flow

1. **Login** - Authenticate
2. **Permissions catalog** - List all available permissions
3. **Roles create** - Create "Editors" role with `content.*` permission (auto-saves lastRoleId)
4. **Roles patch** - Update permissions to `["content.view"]` deny `["content.delete"]`
5. **Roles get** - Verify changes
6. **Roles delete** - Clean up

### Multi-Tenant Testing

1. **Login as User A** - Get tenantId for Workspace A
2. **Create project** - Project belongs to Workspace A
3. **Login as User B** - Get tenantId for Workspace B
4. **List projects** - Should NOT see User A's project (tenant isolation)

## Headers

### Required Headers (Authenticated Endpoints)

```
Authorization: Bearer {{accessToken}}
x-ws-tenant: {{tenantId}}
Content-Type: application/json
```

**Notes:**
- `Authorization` header is required for all endpoints except `/healthz` and registration
- `x-ws-tenant` header is required for all `/ws/*` endpoints
- Variables are automatically populated after login

### Media Streaming Headers

```
GET /ws/media/:mediaAssetId/stream
```

**Option 1: Headers (recommended for Postman)**
```
Authorization: Bearer {{accessToken}}
x-ws-tenant: {{tenantId}}
```

**Option 2: Query params (for HTML5 video elements)**
```
?token={{accessToken}}&tenant={{tenantId}}
```

## Testing

### Built-in Test Scripts

Requests include Postman test scripts that:
- Verify status codes
- Validate response structure
- Auto-populate variables

**Example: Login test script**
```js
pm.test('Status is 200', () => pm.response.to.have.status(200));

let json = pm.response.json();

if (json && json.accessToken) {
  pm.collectionVariables.set('accessToken', json.accessToken);
}

if (json && json.currentTenant) {
  pm.collectionVariables.set('tenantId', json.currentTenant);
}

pm.test('ok=true', () => pm.expect(json.ok).to.eql(true));
```

### Run Collection

**Run all requests:**
1. Right-click collection → **Run collection**
2. Select requests to run
3. Click **Run**

**Chain requests:**
- Run in order: Login → Create project → Create node → Init upload → etc.
- Variables flow automatically between requests

## Troubleshooting

### 401 Unauthorized

**Cause:** Missing or expired access token

**Fix:**
1. Run **Login** request
2. Verify `accessToken` is populated (check collection variables)
3. Ensure Authorization header is enabled

### 403 Forbidden

**Cause:** Missing tenant header or insufficient permissions

**Fix:**
1. Verify `x-ws-tenant` header is enabled
2. Check `tenantId` variable is populated
3. Ensure your user has permission for the operation

### 404 Not Found (Project/Node)

**Cause:** Invalid `projectId` or `nodeId`

**Fix:**
1. Run **List projects** to get a valid projectId
2. Check collection variables to see current IDs
3. Create a new project if needed

### Upload Fails

**Cause:** Missing uploadId or file path

**Fix:**
1. Ensure **Init upload** ran successfully
2. Check `uploadId` variable is populated
3. Select a valid file in **Upload file** request body
4. Verify file size matches what you declared in Init upload

### Variables Not Populating

**Cause:** Environment not selected or test scripts failed

**Fix:**
1. Ensure **HK26 Local** environment is selected (top right)
2. Check **Console** tab for test script errors
3. Manually set variables if needed:
   - Right-click collection → Edit → Variables tab

### Connection Refused

**Cause:** API server not running

**Fix:**
```bash
# Start API server
pnpm dev:api

# Verify server is running
curl http://localhost:3333/healthz
```

## Environment Configuration

### Local Development (default)

```json
{
  "baseUrl": "http://localhost:3333",
  "email": "your-email@example.test",
  "password": "your-password"
}
```

### Custom Environment

Create additional environments for:
- **Staging**: `baseUrl: https://staging.hk26.com`
- **Production**: `baseUrl: https://api.hk26.com`

**Steps:**
1. Duplicate **HK26 Local** environment
2. Rename to **HK26 Staging**
3. Update `baseUrl` to staging URL
4. Switch environment dropdown to use different servers

## API Documentation

For detailed API documentation, see:
- [API Backend README](../apps/api/README.md)
- [Database Schemas](../packages/databases/postgres/README.md)
- [Shared Schemas](../packages/schema/README.md)

## Related Documentation

- [Docker Setup](../docker/README.md) - Database infrastructure
- [Database Schema](../packages/databases/postgres/README.md) - Data models
- [API Backend](../apps/api/README.md) - API implementation
- [Shared Schemas](../packages/schema/README.md) - Type definitions
