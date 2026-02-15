# Syncstation API Documentation
### Eliminating waiting time for frontend development by providing a mock API server overview with realistic data and behavior. This allows frontend developers to work in parallel with backend development, ensuring faster iteration and delivery.

**Version:** 1.1
**Last updated:** 2026-02-11

  ---

## Overview

### Base URL

| Environment | URL                      |
|-------------|--------------------------|
| Local dev   | `http://localhost:3333`   |

The default port is `3333` and can be changed via the `PORT` environment variable.

### Authentication

- The API uses **JWT** for authentication.

Specific details might be subject to change, but the general flow is:

- Login via `POST /auth/login` to receive an `accessToken` and a refresh cookie.
- Include the access token in all authenticated requests:

  ```
  Authorization: Bearer <accessToken>
  ```

- Access tokens expire after **15 minutes** by default.
- Use `POST /auth/refresh` to get a new access token (uses httpOnly cookie automatically).

### Tenant Header

Most endpoints require a **tenant ID** header to scope data:

  ```
  x-ws-tenant: <tenant-uuid>
  ```

If missing, the API returns a `400` error.

### Standard Response Format

All responses follow this structure:

**Success:**

  ```json
  {
    "ok": true,
    "entry": { ... }
  }
  ```

**Error:**

  ```json
  {
    "ok": false,
    "code": "ERROR_CODE",
    "message": "Human-readable description"
  }
  ```

### Error Codes

| Code                     | HTTP Status | Description                              |
|--------------------------|-------------|------------------------------------------|
| `VALIDATION_ERROR`       | 400         | Request body/params fail Zod validation  |
| `TENANT_HEADER_MISSING`  | 400         | Missing `x-ws-tenant` header             |
| `BAD_REQUEST`            | 400         | Generic bad request                      |
| `INVALID_CREDENTIALS`    | 401         | Wrong email or password                  |
| `UNAUTHORIZED`           | 401         | Missing or invalid auth token            |
| `NO_REFRESH_COOKIE`      | 401         | Refresh cookie is missing                |
| `INVALID_REFRESH`        | 401         | Refresh token is invalid or expired      |
| `INVALID_ACCESS_TOKEN`   | 401         | Access token is missing or invalid       |
| `PERMISSION_DENIED`      | 403         | User lacks required permission           |
| `NOT_FOUND`              | 404         | Resource does not exist                  |
| `CONFLICT`               | 409         | Duplicate entry or sync conflict         |
| `INTERNAL_ERROR`         | 500         | Unexpected server error                  |

  ---

## Auth Endpoints

All auth endpoints are prefixed with `/auth`.

Specific details might be subject to change, but the general flow is:

  ---

# POST /auth/login

Authenticates a user and returns an access token. A refresh token is set as an httpOnly cookie.

  ---

# GET /auth/me

Returns the current authenticated user's profile, access, memberships, and effective permissions.

  ---

# POST /auth/refresh

Rotates the refresh token and returns a new access token. Also available as `GET /auth/refresh`.

  ---

# GET /ws/projects

Lists all projects for the current tenant.

  ---

# GET /ws/projects/:projectId/tree

Returns a flat list of all content nodes in a project, representing the tree structure.

  ---

# GET /syncstation/log-entries

Lists log entries for the current tenant. Supports optional filtering.

  ---

# GET /syncstation/log-entries/:logEntryId

Returns a single log entry with full details including attachments.

  ---

## POST /syncstation/log-entries

Creates a new log entry. Supports client-generated UUIDs for idempotent sync.

**Auth:** Required (Bearer token)

**Headers:**

| Header          | Required | Description            |
|-----------------|----------|------------------------|
| Authorization   | Yes      | Bearer `<accessToken>` |
| x-ws-tenant     | Yes      | Tenant UUID            |

**Request Body:**

| Field       | Type          | Required | Description                          |
|-------------|---------------|----------|--------------------------------------|
| id          | string (UUID) | No       | Client-generated UUID for idempotent sync. If omitted, server generates one. |
| nodeId      | string (UUID) | Yes      | Content node to attach the log to    |
| title       | string        | Yes      | Log title (1-255 characters)         |
| description | string        | No       | Optional description text            |

**Idempotent Sync Behavior:**

If `id` is provided and a log entry with that ID already exists for the tenant, the existing entry is returned with status `200` instead of creating a duplicate. New entries return `201`.

**Success Response (201 — created / 200 — already exists):**

```json
{
  "ok": true,
  "entry": {
    "id": "uuid",
    "tenantId": "uuid",
    "userId": "uuid",
    "nodeId": "uuid",
    "title": "Watch on left wrist",
    "description": "Scene 4, continuity note",
    "status": "local",
    "lastSyncError": null,
    "createdAt": "2026-02-11T12:00:00.000Z",
    "updatedAt": "2026-02-11T12:00:00.000Z",
    "syncedAt": null
  }
}
```

**Error Responses:**

| Status | Error                    | When                              |
|--------|--------------------------|-----------------------------------|
| 400    | TENANT_HEADER_MISSING    | Missing x-ws-tenant header        |
| 400    | Content node not found   | nodeId doesn't exist              |
| 500    | Failed to create         | Unexpected error                  |

  ---

# PATCH /syncstation/log-entries/:logEntryId

Updates an existing log entry. All body fields are optional — only include fields you want to change.

  ---

# DELETE /syncstation/log-entries/:logEntryId

Deletes a log entry.

  ---

# GET /syncstation/sync-status

Returns the sync queue status for the authenticated user within the current tenant.

  ---

## POST /syncstation/log-entries/:logEntryId/attachments

Uploads a file and attaches it to a log entry.

**Auth:** Required (Bearer token)

**Headers:**

| Header          | Required | Description            |
|-----------------|----------|------------------------|
| Authorization   | Yes      | Bearer `<accessToken>` |
| x-ws-tenant     | Yes      | Tenant UUID            |
| Content-Type    | Yes      | multipart/form-data    |

**URL Params:**

| Param      | Type         | Required | Description               |
|------------|--------------|----------|---------------------------|
| logEntryId | string (UUID)| Yes      | ID of the log entry       |

**Request Body:**

Multipart form-data with a single file field. Max file size: 500 MB.

**Success Response (201):**

```json
{
  "ok": true,
  "attachment": {
    "id": "uuid",
    "logEntryId": "uuid",
    "filename": "photo.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 245000,
    "storagePath": "tenant-uuid/2026/02/unique-uuid.jpg",
    "attachmentType": "image",
    "createdAt": "2026-02-11T12:00:00.000Z"
  }
}
```

**Attachment type is determined automatically from MIME type:**

| MIME type pattern | attachmentType |
|-------------------|----------------|
| image/*           | `image`        |
| video/*           | `video`        |
| everything else   | `document`     |

**Error Responses:**

| Status | Error                    | When                              |
|--------|--------------------------|-----------------------------------|
| 400    | TENANT_HEADER_MISSING    | Missing x-ws-tenant header        |
| 400    | No file uploaded         | Request has no file field          |
| 404    | Log entry not found      | logEntryId doesn't exist or wrong tenant |
| 500    | Failed to upload         | File save or DB error             |

  ---

## GET /syncstation/attachments/:attachmentId/download

Downloads a previously uploaded attachment. Returns the file as a binary stream.

**Auth:** Required (Bearer token)

**Headers:**

| Header          | Required | Description            |
|-----------------|----------|------------------------|
| Authorization   | Yes      | Bearer `<accessToken>` |
| x-ws-tenant     | Yes      | Tenant UUID            |

**URL Params:**

| Param        | Type         | Required | Description               |
|--------------|--------------|----------|---------------------------|
| attachmentId | string (UUID)| Yes      | ID of the attachment      |

**Success Response (200):**

Returns the raw file as a binary stream.

| Response Header      | Value                                       |
|----------------------|---------------------------------------------|
| Content-Type         | Original MIME type (e.g. `image/jpeg`)       |
| Content-Disposition  | `attachment; filename="original-filename.ext"` |

**Error Responses:**

| Status | Error                      | When                                    |
|--------|----------------------------|-----------------------------------------|
| 400    | TENANT_HEADER_MISSING      | Missing x-ws-tenant header              |
| 404    | Attachment not found       | ID doesn't exist or wrong tenant        |
| 404    | File not found on filesystem | DB record exists but file is missing   |

  ---

## DELETE /syncstation/attachments/:attachmentId

Deletes an attachment (both the database record and the file from the filesystem).

**Auth:** Required (Bearer token)

**Headers:**

| Header          | Required | Description            |
|-----------------|----------|------------------------|
| Authorization   | Yes      | Bearer `<accessToken>` |
| x-ws-tenant     | Yes      | Tenant UUID            |

**URL Params:**

| Param        | Type         | Required | Description               |
|--------------|--------------|----------|---------------------------|
| attachmentId | string (UUID)| Yes      | ID of the attachment      |

**Success Response (200):**

```json
{
  "ok": true
}
```

**Note:** Succeeds even if the file is already missing from the filesystem (idempotent).

**Error Responses:**

| Status | Error                    | When                              |
|--------|--------------------------|-----------------------------------|
| 400    | TENANT_HEADER_MISSING    | Missing x-ws-tenant header        |
| 404    | Attachment not found     | ID doesn't exist or wrong tenant  |
| 500    | Failed to delete         | Unexpected error during deletion  |

 ---

# Schema Reference

All shared Zod schemas are in `packages/schema/src/` and imported via `@hk26/schema`.

### Syncstation Schemas (`@hk26/schema`)

| Schema                     | Description                          |
  |----------------------------|--------------------------------------|
| `LogEntrySchema`           | Full log entry object                |
| `LogEntrySummarySchema`    | Lightweight log entry for lists      |
| `LogAttachmentSchema`      | Attachment object                    |
| `CreateLogEntryRequest`    | Create log entry request body        |
| `UpdateLogEntryRequest`    | Update log entry request body        |
| `LogEntryResponse`         | Single log entry response            |
| `LogEntriesListResponse`   | List log entries response            |
| `AttachmentUploadResponse` | Attachment upload response           |
| `SyncStatusResponse`       | Sync status response                 |
| `SyncStatus`               | Enum: `local`, `pending`, `synced`, `failed` |
| `AttachmentType`           | Enum: `image`, `video`, `document`   |
| `ErrorResponse`            | Standard error response              |
| `SuccessResponse`          | Generic `{ ok: true }` response      |

### Auth Schemas (`@hk26/schema`)

| Schema                  | Description                    |
  |-------------------------|--------------------------------|
| `LoginRequest`          | Login request body             |
| `LoginResponse`         | Login success response         |
| `RegisterRequest`       | Register request body          |
| `RegisterResponse`      | Register success response      |
| `RefreshResponse`       | Token refresh response         |
| `MeResponse`            | Current user profile response  |
| `CanResponse`           | Permission check response      |
| `InvitePreviewResponse` | Invite token preview response  |

  ---
