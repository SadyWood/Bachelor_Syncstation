# Workstation Platform
## Complete platform guide for the Hoolsy ecosystem

> ⚠️ **AI-Generated Documentation**
>
> This document was generated using AI based on a curated collection of source materials. While it aims to provide a comprehensive overview, information may be inaccurate, outdated, or incomplete. These documents help form a holistic understanding of the Hoolsy platform, but may contain errors or inconsistencies. Always verify critical information with the Hoolsy team before making implementation decisions.

Workstation is Hoolsy's internal web platform for organizing media content, verifying AI-generated metadata, managing content hierarchies, and coordinating editorial workflows. It serves as the "control plane" where media partners, content managers, and enrichment teams transform raw content into structured, verified data that powers the consumer experience.

---

## Table of Contents
1. [Platform Overview](#platform-overview)
2. [System Architecture](#system-architecture)
3. [Content Hierarchy System](#content-hierarchy-system)
4. [RBAC & Permission System](#rbac--permission-system)
5. [Authentication & Sessions](#authentication--sessions)
6. [Admin Console & User Management](#admin-console--user-management)
7. [Project Structure & Content Management](#project-structure--content-management)
8. [Task & Workflow System](#task--workflow-system)
9. [Media Type Classification](#media-type-classification)
10. [API Surface](#api-surface)
11. [Workstation in the Hoolsy Ecosystem](#workstation-in-the-hoolsy-ecosystem)

---

## Platform Overview

### What Hoolsy is building
Hoolsy is building an ecosystem that connects media content (films, series, music, podcasts, audiobooks, and more) with structured metadata and commerce capabilities. The platform enables audiences to discover and interact with what they see and hear, while giving the media industry better workflows, better data quality, and new revenue opportunities.

### What Workstation is
Workstation is the **internal production platform** where content preparation, verification, and enrichment happen before data reaches consumers.

**Core capabilities:**
- **Content organization**: Build hierarchical project structures (series → seasons → episodes, albums → tracks, etc.)
- **AI verification**: Review and correct AI-detected subjects, entities, and metadata
- **Access control**: Multi-tenant RBAC with tenant-level and node-scoped permissions
- **Workflow management**: Task assignment, tracking, and collaboration for editorial teams
- **Data preparation**: Structure and verify metadata before publishing downstream

### What Workstation is NOT
- **Not a consumer-facing app** (that's the Consumer App)
- **Not a commerce platform** (that's Marketplace)
- **Not an analytics dashboard** (that's Nexus)

Workstation is strictly an internal operations platform.

### Who uses Workstation
- **Media owners and producers**: Manage content catalogs and organizational structures
- **Content managers**: Set up projects, seasons, episodes, and metadata frameworks
- **Editors and enrichment teams**: Verify AI detections, enrich subject data, write synopses
- **Technical operators**: Handle ingestion pipelines, QA workflows, and data validation
- **Administrators**: Manage users, roles, permissions, and tenant configurations

---

## System Architecture

### Three-Database Architecture
Workstation operates within a three-database ecosystem designed to separate concerns and enable independent scaling:

**1. Users Database**
- Shared authentication layer across all Hoolsy platforms (Workstation, Marketplace, Nexus)
- Stores user accounts, invitations, platform access grants, and refresh tokens
- Manages the concept of "platforms" users can access
- Handles the invite-first registration flow (users can be invited before they complete registration)

**Key tables:**
- `users`: User accounts with profile, email, password (nullable to support invite-first flow)
- `invites`: Pending invitations with tokens
- `platforms`: Available platforms (Workstation, Marketplace, Nexus)
- `user_access_to_platform`: Grants users access to specific platforms
- `refresh_tokens`: Hashed refresh tokens for session management

**2. Workstation Database**
- Core operational database for Workstation-specific data
- Manages tenants, content hierarchies, RBAC, tasks, and media classifications
- All Workstation features and workflows live here

**Key functional areas:**
- **Tenant & RBAC**: `ws_tenants`, `ws_roles`, `ws_user_memberships`
- **Content tree**: `content_nodes`, `content_closure` (closure table for hierarchy)
- **Tasks**: `tasks`, `task_status`, `task_priority`, `task_type`, `task_activity`, `task_contributor`
- **Media classification**: `media_class`, `media_kind`
- **Permissions**: Catalog of available permission codes

**3. Marketplace Database**
- Handles commerce, products, vendors, pricing, and campaigns
- Completely separate from Workstation's operational concerns
- (Not covered in this document)

### Database Connection Model
Workstation uses two distinct connection patterns:

**Admin connections** (for migrations, seeds, bootstrap operations):
- Use a privileged admin user via `ADMIN_DATABASE_CONNECTION`
- Create roles, databases, grants, and schema migrations
- NOT used at runtime

**Service connections** (for runtime API operations):
- Use separate database URLs: `USERS_DB_URL`, `WORKSTATION_DB_URL`, `MARKETPLACE_DB_URL`
- Each service connects with least-privilege credentials
- Required for running the API

### Bootstrap & Permissions Flow
Setting up Workstation locally involves:

1. **Bootstrap**: Create roles, databases, enable extensions (pgcrypto), set grants and default privileges
2. **Generate migrations**: Use Drizzle Kit to generate schema migrations
3. **Run migrations**: Apply schema changes to databases
4. **Re-run bootstrap**: Refresh grants on newly created tables/sequences to avoid permission drift
5. **Seed data**: Populate foundational lookup tables (platforms, media types, permissions catalog, default roles)
6. **Demo seed (optional)**: Create demo invites, users, and sample data for testing

This flow ensures that every developer can set up a complete local environment without hidden manual steps.

---

## Content Hierarchy System

### The Content Node Model
Workstation uses a **generic hierarchical tree structure** to model all types of media content. This design allows the same system to handle TV series, movies, podcasts, audiobooks, livestreams, and future media formats without schema changes.

**Core concept**: Everything is a "content node" in a tree, with nodes differentiated by type and media classification rather than hardcoded table schemas.

### Node Types
Every content node has a `nodeType` that defines its structural role:

- **`group`**: A container node (e.g., series, season, album, podcast series)
- **`content`**: A primary media asset (e.g., episode, movie, song, audiobook chapter)
- **`bonus_content`**: Supplemental media (e.g., behind-the-scenes, extras, bonus tracks)

### The Closure Table Pattern
Workstation implements the content hierarchy using a **closure table** (`content_closure`), which precomputes every ancestor–descendant relationship in the tree.

**Why closure tables?**
- **Fast permission checks**: "Does this user have access to this episode via their Season 1 membership?" becomes a single indexed lookup instead of recursive queries
- **Efficient subtree queries**: Finding all descendants of a node (e.g., "all episodes in this series") is a simple join
- **Scalable inheritance**: Permissions, settings, and metadata can cascade down the tree with predictable performance

**How it works:**
- When a node is created, closure entries are created linking it to all its ancestors (including itself at depth 0)
- When a node is moved, old closure paths are deleted and new paths are inserted
- When a node is deleted, the closure table is used to find all descendants, which are then cascade-deleted

**Example closure table entries:**
```
Breaking Bad (series)
  └─ Season 1
      └─ Episode 1

Closure entries:
(Breaking Bad, Breaking Bad, depth=0)
(Breaking Bad, Season 1, depth=1)
(Breaking Bad, Episode 1, depth=2)
(Season 1, Season 1, depth=0)
(Season 1, Episode 1, depth=1)
(Episode 1, Episode 1, depth=0)
```

### Node Metadata
Each content node stores:
- **Identity**: UUID, tenant ownership, parent relationship
- **Type classification**: Node type, media kind (series/episode/movie/song/etc.)
- **Editorial metadata**: Title, slug, synopsis
- **Ordering**: Position field for sibling ordering within a parent
- **Asset linkage**: Future path to datalake/storage (currently nullable)

### Tree Operations
Workstation supports full CRUD operations on the content tree:

**Create**: Add new projects (root nodes) or child nodes
**Read**: Fetch individual nodes, full tree structures, or filtered views
**Update**: Edit metadata, move nodes to new parents, reorder siblings
**Delete**: Remove nodes and all descendants (cascade via closure table)

**Move operations** maintain referential integrity:
- Cycle detection prevents moving a node into its own descendants
- Target parent must be a `group` type node
- Target parent must be in the same tenant
- Closure paths are updated in a transaction (delete old paths, insert new paths)

### Why Build Structure Before Media?
Workstation is designed to enable **early collaboration**. Content managers and editors can:
- Define the project structure (series, seasons, episodes)
- Assign roles and permissions at the appropriate level
- Start enrichment workflows (write synopses, plan subject tagging, create tasks)
- Prepare organizational context **before final media files arrive**

This decouples organizational setup from asset delivery, allowing teams to work in parallel.

---

## RBAC & Permission System

Workstation implements a **wildcard-enabled, multi-tenant RBAC system** with support for both tenant-wide and node-scoped permissions (node-scoped implementation is the next iteration).

### Permission Model

**Permission codes** follow a `namespace.verb` or `namespace.scope.verb` pattern:
- `project.create`
- `content.edit`
- `member.invite.send`
- `role.perms.update`

**Wildcard support:**
- **Single wildcard (`*`)**: Matches one level within a namespace
  - `project.*` grants `project.create`, `project.edit`, `project.delete`, `project.view`
  - Does NOT grant `project.list.view` (two levels deep)

- **Double wildcard (`**`)**: Matches all nested levels within a namespace
  - `content.**` grants `content.create`, `content.edit`, `content.delete`, `content.view`, and any future nested permissions

**Allow and Deny lists:**
- Roles and memberships have both `allow` and `deny` permission sets
- Deny takes precedence over allow (useful for "grant broad access except X" patterns)

**Example**: Editor role with restricted delete
```json
{
  "allow": ["project.view", "project.edit", "content.**"],
  "deny": ["content.delete"]
}
```
This grants all content operations EXCEPT delete, and allows viewing/editing projects but not creating or deleting them.

### Roles

**Global roles** (system-wide defaults):
- Created by the system during seeding
- Available across all tenants
- Examples: Admin, Content Manager, Editor, Viewer

**Tenant-specific roles**:
- Created by tenant administrators
- Only available within that tenant
- Allows custom permission sets for specific organizational needs

Roles are compositions of permission grants and can be assigned to users via memberships.

### Memberships
A **membership** connects a user to a tenant with one or more roles. Memberships define:
- Which tenant the user belongs to
- Which roles they have in that tenant
- Their effective permission set (merged from all roles + membership-specific overrides)
- Membership status (active, inactive, pending)

### Tenant Scoping
Every API request to Workstation operates within a **tenant context**. The system resolves the active tenant via:
1. **Explicit header**: `X-WS-Tenant` header with tenant ID
2. **User preferences**: Last-used tenant stored in user settings
3. **Fallback**: Oldest membership by creation date

This ensures all operations (content, permissions, tasks) are properly isolated per tenant.

### Permission Evaluation
The system evaluates **effective permissions** for each request:

1. **Fetch user's roles** in the current tenant (via memberships)
2. **Merge allow/deny sets** from all roles
3. **Apply wildcard expansion** to match requested permission
4. **Check deny list first**, then check allow list
5. **Return authorized/unauthorized**

This evaluation happens on every protected API route using decorators like `app.needsPerm('content.edit')` or imperatively via `app.can(req, 'project.view')`.

### Permission Categories

**Project permissions:**
- `project.create`: Create new project roots
- `project.list.view`: List all projects in tenant
- `project.view`: View project metadata and tree structure
- `project.edit`: Update project title, slug, synopsis
- `project.delete`: Delete project and all descendants

**Content permissions:**
- `content.create`: Add child nodes (seasons, episodes, etc.)
- `content.view`: View node metadata
- `content.edit`: Update node metadata, move nodes, reorder siblings
- `content.delete`: Delete node and descendants

**Member management permissions:**
- `member.list.view`: List tenant members
- `member.invite.send`: Send invitations to new members
- `member.access.revoke`: Deactivate member access

**Role management permissions:**
- `role.list.view`: List available roles
- `role.create`: Create tenant-specific roles
- `role.perms.view`: View role permission details
- `role.perms.update`: Edit role permission sets
- `role.delete`: Delete roles (if not in use)

**Subject and task permissions** (future/expanded):
- `subject.edit`, `subject.verify`, `task.create`, `task.assign`, etc.

### Node-Scoped Permissions (Next Iteration)
The RBAC system is designed to support **node-scoped memberships**, where permissions can be granted on specific content nodes with automatic inheritance via the closure table.

**Example future scenario:**
```
Grant Alice "Editor" role on "Breaking Bad - Season 1"
→ Via closure table, Alice automatically inherits editor permissions
  on all episodes within Season 1
→ But NOT on Season 2 or other content
```

This enables highly granular access control (per-season editors, per-project collaborators, etc.) while maintaining performance through the closure table's precomputed relationships.

---

## Authentication & Sessions

### Authentication Flow

**Invite-first registration:**
1. Admin sends an invite via Workstation Admin console
2. Invite record created in `users.invites` with a unique token
3. Token sent to invitee (via email or shared manually)
4. Invitee visits registration URL with token: `/register?invite=<TOKEN>`
5. API validates token and creates/completes user account
6. User gains access to platforms specified in invite

**Users table supports nullable fields** to allow "half-empty" user records:
- A user row can exist with an email but no password/profile (invited but not registered)
- Registration flow completes the user record

### Token-Based Sessions

**Access tokens** (JWT):
- Short-lived (configurable TTL, typically 15 minutes)
- Stored in memory on the client (not in localStorage)
- Contains user ID, tenant info, and basic claims
- Sent in `Authorization: Bearer <token>` header

**Refresh tokens** (httpOnly cookie):
- Long-lived (configurable TTL, typically 7-30 days)
- Stored as httpOnly cookie (`ws_refresh`) to prevent XSS attacks
- Hashed before storage in `users.refresh_tokens` table
- Used to obtain new access tokens without re-authentication

### Token Rotation & Security

**Refresh token rotation:**
- Every refresh operation generates a new refresh token
- Old refresh token is invalidated
- Prevents replay attacks and token theft

**Bulk revocation:**
- Logout endpoint revokes all refresh tokens for the user
- Supports security scenarios (password change, suspected compromise)

**Secure cookie configuration:**
- `httpOnly: true` (prevents JavaScript access)
- `secure: true` in production (HTTPS-only)
- `sameSite: strict` (CSRF protection)
- Configured for local dev (`localhost:5173`) and production domains

### Session Lifecycle

**Login:**
1. User submits email + password
2. API validates credentials
3. Generates access token (JWT)
4. Generates refresh token, hashes and stores it
5. Returns access token in response body
6. Sets refresh token as httpOnly cookie

**Refresh:**
1. Client access token expires
2. Client sends request to `/auth/refresh` (includes refresh cookie automatically)
3. API validates and rotates refresh token
4. Returns new access token

**Logout:**
1. Client sends request to `/auth/logout`
2. API clears refresh cookie
3. API deletes all refresh tokens for user from database
4. Client discards access token from memory

### Multi-Platform Authentication
Authentication is **shared across all Hoolsy platforms** (Workstation, Marketplace, Nexus):
- Single `users` database for identity
- Platform access controlled via `user_access_to_platform` grants
- Tokens are platform-agnostic but API endpoints check platform access
- Users can have different roles/permissions in different platforms

---

## Admin Console & User Management

The **Admin Console** is a permission-gated page within Workstation Web that provides user, role, and permission management capabilities. It is only accessible to users with appropriate admin permissions.

### Admin Console Architecture
The Admin page uses a **widget-based architecture** where independent React components share state via props and callbacks. Widgets can:
- Update independently when their data changes
- Broadcast events to other widgets (e.g., "member selected", "role updated")
- Refresh in response to CRUD operations elsewhere in the UI

This design allows the admin interface to scale as new management features are added.

### Admin Console Widgets

**1. Members List Widget**
- **Purpose**: Browse and search all members in the current tenant
- **Features**:
  - Searchable, sortable table of members
  - Displays member name, email, roles, and status
  - Click a member to select them for detailed view
- **Permissions required**: `member.list.view`
- **Events emitted**: `admin:selectMember` when user clicks a member

**2. Member Details Widget**
- **Purpose**: View and manage a selected member's access and roles
- **Features**:
  - View member profile and metadata
  - Assign or remove roles for the member
  - Deactivate member access to the tenant
  - View current permission grants derived from roles
- **Permissions required**: `member.list.view`, `member.access.revoke` (for deactivation)
- **Updates on**: `admin:selectMember` event

**3. Invite Member Widget**
- **Purpose**: Send invitations to new users
- **Features**:
  - Input email address for invitee
  - Specify which platforms the user should access (Workstation, Marketplace, Nexus)
  - Optionally assign initial roles
  - Creates pending member record and generates invite token
- **Permissions required**: `member.invite.send`
- **Events emitted**: Refreshes member list on successful invite

**4. Roles List Widget**
- **Purpose**: Browse, create, and delete roles
- **Features**:
  - Searchable, sortable table of roles (global + tenant-specific)
  - Create new tenant-specific roles
  - Delete tenant roles (only if not currently assigned to any members)
  - Click a role to select it for editing
- **Permissions required**: `role.list.view`, `role.create`, `role.delete`
- **Events emitted**: `admin:selectRole` when user clicks a role

**5. Role Permissions Widget**
- **Purpose**: Edit a selected role's permission grants
- **Features**:
  - View current allow and deny permission sets
  - Add or remove permissions via searchable dropdown (populated from permissions catalog)
  - Supports wildcard permissions (`*`, `**`)
  - Visual indication of wildcard expansions
  - Save updates to role
- **Permissions required**: `role.perms.view`, `role.perms.update`
- **Events emitted**: `ws:roles:changed` when role is updated
- **Updates on**: `admin:selectRole` event

**6. Permissions Catalog Widget**
- **Purpose**: Reference list of all available permission codes
- **Features**:
  - Searchable table of permission codes with descriptions
  - Click to copy permission code to clipboard
  - Read-only reference for understanding the permission model
- **Permissions required**: `role.perms.view`

### User Invitation Flow
1. Admin opens Invite Member widget
2. Enters invitee email and selects platform access (Workstation, Marketplace, Nexus)
3. Optionally selects initial roles to assign
4. Submits invitation
5. System creates invite record with unique token
6. Token is displayed in UI (and could be sent via email in production)
7. Invitee receives token and visits `/register?invite=<TOKEN>`
8. Completes registration form (password, profile info)
9. User account is activated and platform access grants are applied
10. User can log in and access Workstation with assigned roles

### Role Management Workflow
1. Admin opens Roles List widget
2. Views existing roles (global system roles + tenant-specific roles)
3. Creates a new tenant role (e.g., "Season 1 Editor")
4. Selects the new role to edit
5. Opens Role Permissions widget
6. Adds permissions to allow set (e.g., `content.edit`, `content.view`, `task.**`)
7. Optionally adds permissions to deny set (e.g., `content.delete`)
8. Saves role
9. Role is now available for assignment to members

### Permission-Aware UI
The Admin Console dynamically shows/hides controls based on the current user's effective permissions:
- Buttons and actions are disabled if the user lacks the required permission
- Sensitive widgets are hidden entirely if the user has no relevant permissions
- Provides a graceful, non-confusing experience for users with limited access

---

## Project Structure & Content Management

The **ProjectStructure page** is the primary interface for organizing and managing content hierarchies in Workstation. It provides tools for creating projects, building content trees, and managing metadata.

### ProjectStructure Page Architecture
Like the Admin Console, the ProjectStructure page uses a **widget-based design** where specialized components handle different aspects of content management.

### ProjectStructure Widgets

**1. ProjectList Widget**
- **Purpose**: Browse and select projects in the current tenant
- **Features**:
  - Searchable, sortable list of projects
  - Displays project title, slug, and descendant count (via closure table)
  - Click a project to select it for viewing/editing
- **Permissions required**: `project.list.view`
- **Events emitted**: `onSelectProject` when user clicks a project

**2. ContentTree Widget**
- **Purpose**: Visualize and navigate the hierarchical content structure
- **Features**:
  - Expandable/collapsible tree view
  - Shows node type icons (group, content, bonus)
  - Displays node titles and media kinds (season, episode, movie, etc.)
  - Drag-and-drop support for moving nodes and reordering siblings
  - Click nodes to select them for editing
  - Visual hierarchy with indentation
- **Permissions required**: `project.view`, `content.view`
- **Events emitted**: `onSelectNode` when user clicks a node
- **Drag-and-drop**: Requires `content.edit` permission; updates closure table on successful move

**3. ProjectMeta Widget**
- **Purpose**: Edit metadata for the selected project
- **Features**:
  - Edit project title, slug, and synopsis
  - Delete project (and all descendants) with confirmation
  - Real-time validation (e.g., slug format: lowercase alphanumeric + hyphens)
  - Save updates trigger tree refresh
- **Permissions required**: `project.view`, `project.edit`, `project.delete`
- **Updates on**: `onSelectProject` event

**4. ProjectTemplates Widget**
- **Purpose**: Quick-start project creation from common patterns
- **Features**:
  - Template cards for common content structures:
    - TV Series (series → seasons → episodes)
    - Movie (single content node)
    - Podcast (podcast → seasons → episodes)
    - Audiobook (audiobook → chapters)
    - Empty (blank project for custom structures)
  - Click a template to scaffold the structure automatically (future implementation)
- **Permissions required**: `project.create`
- **Current status**: Displays placeholder templates; scaffolding logic is future work

### Content Tree Operations

**Create project:**
1. User clicks "Create Project" (or selects a template)
2. Enters project metadata (title, slug, synopsis)
3. Submits form
4. API creates root node with `nodeType: 'group'` and appropriate `mediaKind` (e.g., "series")
5. Project appears in ProjectList

**Add child nodes:**
1. User selects a parent node (must be `nodeType: 'group'`)
2. Clicks "Add Node"
3. Specifies node type (group, content, bonus_content) and media kind (season, episode, etc.)
4. Enters metadata (title, slug, synopsis)
5. API creates node, sets `parentId`, and generates closure table entries
6. New node appears in tree under parent

**Move node:**
1. User drags a node in ContentTree widget
2. Drops it onto a new parent (must be `nodeType: 'group'`)
3. API validates move:
   - Target parent must be in same tenant
   - Target parent must be a group type
   - Move must not create a cycle (node cannot be moved into its own descendants)
4. API updates closure table:
   - Deletes old ancestor-descendant paths
   - Inserts new paths reflecting new parent
5. Tree refreshes to show new structure

**Reorder siblings:**
1. User drags a node to a new position among its siblings
2. API updates `position` field for affected nodes
3. Tree refreshes to show new ordering

**Delete node:**
1. User selects a node and clicks delete
2. Confirmation prompt appears (warns that descendants will also be deleted)
3. API uses closure table to find all descendants
4. Deletes all descendants and the node itself in a transaction
5. Tree refreshes

### Position-Based Ordering
Every content node has a `position` field that determines its order among siblings. This allows:
- Custom ordering beyond alphabetical or chronological
- Drag-and-drop reordering in the UI
- Explicit sequence control (e.g., episode order for non-chronological series)

The API endpoint `/ws/nodes/reorder` accepts an array of node IDs in the desired order and updates positions accordingly.

### Content Metadata Fields
Each node stores:
- **title**: Display name (e.g., "Breaking Bad", "Pilot", "Season 1")
- **slug**: URL-friendly identifier (lowercase alphanumeric + hyphens, e.g., "breaking-bad", "pilot")
- **synopsis**: Editorial description (nullable, for enrichment workflows)
- **datalakePath**: Future linkage to uploaded media assets in storage (currently nullable)

### Why Templates Matter
Templates reduce cognitive load for content managers by encoding common patterns:
- "TV Series" template scaffolds series → season → episode structure
- "Movie" template creates a single content node
- "Podcast" template mirrors TV series but with podcast-appropriate media kinds

Templates ensure consistency and speed up onboarding for new projects.

---

## Task & Workflow System

Workstation includes a **task management system** that enables editorial teams to coordinate work on content enrichment, subject verification, QA, and project workflow. Tasks provide traceability, context, and collaboration capabilities integrated directly into the content management workflow.

### Task Model

Tasks in Workstation are structured entities with comprehensive metadata and relationships:

**Core task fields:**
- **Task identity**: UUID, tenant association, creator, creation timestamp
- **Task assignment**: Assigned user, due date, watchers
- **Task classification**: Type (metadata, verification, QA, etc.), priority (low, medium, high, critical), status (to_do, in_progress, completed, blocked)
- **Task context**: Multiple content node links, multiple subject links, board association
- **Task metadata**: Title, description, tags, timestamps (created, updated, completed, due)
- **Task attachments**: Files, images, documents uploaded for context
- **Task relationships**: Parent tasks, dependencies, related tasks

**Database relationships:**
- **task**: Core task entity with tenant scoping
- **task_node_link**: Many-to-many relationship between tasks and content nodes
- **task_subject_link**: Many-to-many relationship between tasks and subjects
- **task_comment**: Separate entity for task comments (not revision events)
- **task_revision**: Event-based audit trail for all task changes
- **task_attachment**: File uploads associated with tasks
- **task_board**: Organizational boards within projects

### Task Types

Tasks are classified by type to enable filtering, reporting, and workflow automation:

- **Metadata tasks**: Missing or incomplete metadata (title, synopsis, release dates)
- **Subject verification**: Verify AI-detected subjects (people, objects, locations)
- **Subject enrichment**: Add additional context, tags, or relationships to verified subjects
- **Synopsis writing**: Editorial task to write or improve synopsis
- **Translation tasks**: Translate metadata or subtitles to other languages
- **QA tasks**: Quality assurance checks before publishing
- **Ingestion tasks**: Technical tasks related to media asset processing
- **Review tasks**: Peer review of completed work
- **Bug reports**: Issues or defects discovered during content work

### Task Priorities

- **Low**: Non-urgent, backlog items, future improvements
- **Medium**: Standard workflow tasks, normal deadline
- **High**: Time-sensitive or important for upcoming publish
- **Critical**: Blockers, urgent fixes, pre-launch requirements

### Task Statuses & Board Columns

Tasks flow through statuses that correspond to board columns in Kanban views:

- **to_do**: Created but not yet started
- **in_progress**: Actively being worked on
- **completed**: Finished successfully
- **blocked**: Cannot proceed (waiting on dependency, issue encountered)

These statuses map directly to board columns, enabling visual workflow management.

### Multiple Task Creation Contexts

Tasks can be created from multiple contexts within Workstation, automatically inheriting appropriate links and tenant scope:

**1. From Project Overview (Board View)**
- User navigates to project and selects a task board
- Creates new task which is added to the board's "To Do" column
- Task automatically linked to project's tenant

**2. From Subject Detail Page**
- User views a subject (person, object, location) in Workstation
- Creates task directly from subject context (e.g., "Verify this subject's identity")
- Task automatically linked to that subject via `task_subject_link`

**3. From Content Node**
- User views an episode, season, or series in the content tree
- Creates task in context of that node (e.g., "Add synopsis for Episode 5")
- Task automatically linked to that content node via `task_node_link`

**4. From "My Tasks" Page**
- User creates task from personal task list
- Must manually specify links to subjects or content nodes

### Task Linking: Subjects & Content Nodes

Tasks support **many-to-many relationships** with both subjects and content nodes, enabling rich contextual associations:

**Subject Links:**
- A task can reference multiple subjects (e.g., "Verify these 5 characters in Scene 3")
- Subject verification tasks automatically link to detected subjects
- Links stored in `task_subject_link` table with created timestamp

**Content Node Links:**
- A task can reference multiple content nodes (e.g., "Add synopsis to Episodes 1-3")
- Tasks created from node context automatically link to that node
- Links stored in `task_node_link` table with created timestamp
- Enables task visibility from any linked node's detail page

**Example:**
- Task: "Verify product placements in coffee shop scene"
- Linked subjects: "Coffee Cup Brand X", "Laptop Brand Y", "Coffee Shop Interior"
- Linked content nodes: Episode 4, Season 1, Series "Morning Brew"

### Board Views & Kanban Structure

Workstation provides **board-based task organization** with Kanban-style columns:

**Board Hierarchy:**
- Each project (tenant) contains one or more **task boards**
- Boards organize related tasks (e.g., "Season 1 Production", "Subject Verification", "QA Pipeline")
- Users can create custom boards for different workflows

**Column Structure:**
Each board displays tasks in columns by status:
- **To Do**: Tasks pending start (`status: to_do`)
- **In Progress**: Tasks actively being worked (`status: in_progress`)
- **Completed**: Finished tasks (`status: completed`)
- Additional custom columns can be configured (e.g., "Blocked", "Review")

**Drag-and-Drop Functionality:**
- Users can drag tasks between columns to change status
- Moving a task from "To Do" to "In Progress" updates `status` field and generates revision event
- Moving to "Completed" sets `completedAt` timestamp
- All moves generate `task.status.updated` revision events

**Board View Features:**
- Filter by assignee, priority, tags, due date
- Sort by creation date, due date, priority
- Search tasks by title or description
- Color-coded priority indicators
- Assignee avatars on task cards
- Comment count and attachment indicators

### Task Detail View

Clicking a task from any view opens a **comprehensive task detail panel** displaying:

**Task Header:**
- Title (editable inline)
- Status dropdown (to_do, in_progress, completed, blocked)
- Priority selector
- Assignee selector with user search
- Due date picker
- Board association

**Task Body:**
- Description (rich text editor)
- Tags (multi-select)
- Linked content nodes (with links to node detail pages)
- Linked subjects (with links to subject detail pages)
- Attachments section (upload, preview, download)

**Task Activity:**
- **Comments section**: Chronological list of user comments (separate from revision events)
- **Revision history**: Event log showing all changes (see Revision Event System below)
- Toggle between "Comments" and "History" tabs

**Contextual Actions:**
- Add/remove subject links
- Add/remove content node links
- Upload attachments
- Delete task (with confirmation)
- Duplicate task

### Comments as Separate Entities

Comments are **distinct entities** separate from the revision event system:

**Comment Model:**
- `comment_id`: UUID
- `task_id`: Foreign key to task
- `author_id`: User who wrote comment
- `content`: Comment text (supports rich text)
- `created_at`: Timestamp
- `updated_at`: Timestamp (if edited)
- `edited`: Boolean flag

**Comment Features:**
- Markdown or rich text formatting
- @mentions to notify other users
- Edit history (tracks if comment was modified)
- Delete capability (soft delete, retained in audit)
- Threading (optional: comments can reply to other comments)

**Comments vs. Revisions:**
- **Comments**: User-generated discussion, questions, notes
- **Revisions**: System-generated events tracking structural changes

Both are displayed in task detail view but serve different purposes.

### Revision Event System

Every change to a task generates a **revision event** stored in the `task_revision` table. Revisions provide a complete audit trail of task lifecycle:

**Event Types:**
- `task.created`: Task was created
- `task.status.updated`: Status changed (to_do → in_progress)
- `task.title.updated`: Title changed
- `task.description.updated`: Description changed
- `task.priority.updated`: Priority changed
- `task.assignee.updated`: Assignee changed
- `task.due_date.updated`: Due date changed
- `task.link.added`: Subject or content node link added
- `task.link.removed`: Subject or content node link removed
- `task.attachment.added`: File attachment uploaded
- `task.attachment.removed`: Attachment deleted
- `task.tag.added`: Tag added
- `task.tag.removed`: Tag removed
- `task.comment.added`: Comment posted (reference to comment entity)
- `task.completed`: Task marked complete
- `task.reopened`: Completed task reopened

**Revision Model:**
```
task_revision:
  - revision_id (UUID)
  - task_id (FK to task)
  - event_type (enum: task.created, task.status.updated, etc.)
  - actor_id (user who made the change)
  - timestamp (when change occurred)
  - old_value (JSON: previous state if applicable)
  - new_value (JSON: new state if applicable)
  - metadata (JSON: additional context, e.g., which subject was linked)
```

**Example Revision Events:**
1. `task.created` by User A at 10:00 AM
2. `task.assignee.updated` from null to User B at 10:05 AM
3. `task.link.added` linking to Subject "Coffee Cup" at 10:10 AM
4. `task.status.updated` from to_do to in_progress at 10:15 AM
5. `task.comment.added` by User B at 10:30 AM
6. `task.status.updated` from in_progress to completed at 11:00 AM

This creates a comprehensive timeline visible in the task detail "History" tab.

### Multiple Task Views

Workstation provides several views for accessing tasks based on user context:

**1. Board View**
- Navigate to project → select board → see Kanban columns
- Drag-and-drop tasks between columns
- Filter and sort within board
- Primary workflow view for project teams

**2. "My Tasks" View**
- Personal task list showing all tasks assigned to current user
- Spans across all projects and boards
- Filter by status, priority, project
- Sort by due date, priority, creation date
- Quick access to tasks requiring attention

**3. Subject-Based Task Lists**
- View all tasks linked to a specific subject
- Accessed from subject detail page
- Shows tasks related to subject verification, enrichment, or context
- Enables tracking work on specific subjects across projects

**4. Content Node Task Lists**
- View all tasks linked to a specific content node (episode, season, series)
- Accessed from node detail page in content tree
- Shows all tasks related to that node across all boards
- Enables tracking work on specific content pieces

**5. Project Task List**
- View all tasks within a project regardless of board
- Filterable by all task attributes
- Alternative to board view for detailed task management

### Filtering & Sorting

All task views support comprehensive filtering and sorting:

**Filter Options:**
- **Status**: to_do, in_progress, completed, blocked
- **Assignee**: Filter by specific user or "Unassigned"
- **Priority**: low, medium, high, critical
- **Type**: metadata, verification, QA, etc.
- **Tags**: Filter by one or more tags
- **Due Date**: Overdue, due today, due this week, due this month, no due date
- **Linked Subjects**: Filter tasks linked to specific subjects
- **Linked Content Nodes**: Filter tasks linked to specific nodes
- **Creator**: Filter by who created the task
- **Board**: Filter by board (in project view)

**Sort Options:**
- Creation date (oldest/newest first)
- Due date (soonest/latest first)
- Priority (critical → low, or reverse)
- Title (alphabetical)
- Last updated (most/least recently updated)
- Status (custom order)

**Combined Filters:**
- Filters are combinable (e.g., "Show me high-priority tasks assigned to User A due this week")
- Filter state persists per user session
- Saved filter presets (optional feature)

### Permission Integration with RBAC

Task system integrates with Workstation's wildcard RBAC permission system:

**Task Permissions:**
- `task:create`: Create new tasks
- `task:read`: View tasks
- `task:update`: Edit task details (title, description, status)
- `task:delete`: Delete tasks
- `task:assign`: Assign tasks to users
- `task:comment`: Add comments to tasks
- `board:create`: Create new boards
- `board:manage`: Edit board settings, columns

**Permission Scope:**
- Task permissions are scoped to tenant (project)
- Users can only see tasks within projects they have access to
- Editors can create and update tasks
- Viewers can see tasks but not modify them
- Admins have all task permissions

**Wildcard Permission Examples:**
- `project:123:task:*`: All task actions within project 123
- `project:*:task:read`: Read tasks across all projects
- `project:123:**`: All actions including tasks within project 123

**Task Assignment Validation:**
- Users can only be assigned to tasks if they have `task:read` permission in that project
- Assignee selector filters to users with project access

**Link Validation:**
- Users can only link tasks to content nodes they have permission to view
- Users can only link tasks to subjects within their project scope

### Task Workflows

Typical task lifecycle in Workstation:

**Example 1: Subject Verification Task**
1. **Creation**: AI detects 10 subjects in Episode 3
2. **Auto-task**: System automatically creates task "Verify AI-detected subjects in Episode 3"
3. **Linking**: Task automatically linked to Episode 3 node and all 10 detected subjects
4. **Assignment**: Content manager assigns task to subject enrichment specialist
5. **Work**: Specialist opens task, views linked subjects, verifies each one, adds comments
6. **Status update**: Specialist drags task from "To Do" to "In Progress"
7. **Completion**: Specialist marks task complete when all subjects verified
8. **Audit**: Full revision history shows timeline from creation to completion

**Example 2: Manual Metadata Task**
1. **Creation**: Content manager viewing Season 2 creates task "Add synopsis to all episodes"
2. **Linking**: Manager links task to all 10 episode nodes in Season 2
3. **Assignment**: Manager assigns to copywriter
4. **Work**: Copywriter opens task, navigates to each linked episode, writes synopsis
5. **Comments**: Copywriter adds comment "Completed episodes 1-5, working on 6-10"
6. **Completion**: Copywriter marks complete when all episodes have synopsis
7. **Verification**: Manager reviews completed task, checks linked episodes, confirms completion

**Example 3: QA Task with Blocking**
1. **Creation**: QA reviewer creates task "Test media playback on all devices"
2. **Linking**: Task linked to Episode 7
3. **Work**: QA starts testing, discovers playback bug
4. **Blocking**: QA changes status to "blocked", adds comment describing bug
5. **Bug Task**: QA creates new task "Fix playback bug in Episode 7 encoding"
6. **Resolution**: Developer fixes bug, marks bug task complete
7. **Unblocking**: QA reopens original task, changes status to "in_progress"
8. **Completion**: QA verifies fix, marks original task complete

### Task Notifications (Optional)

Workstation may include notification features to alert users of task changes:

- Task assigned to user
- Task due date approaching
- Task status changed
- Task comment mentioning user (@mention)
- Task marked as blocked
- Task dependency completed

Notifications delivered via in-app notification center or email based on user preferences.

### Task Analytics

Workstation tracks task metrics for performance monitoring:

- **Time-to-completion**: Average time from creation to completion by task type
- **Task throughput**: Tasks completed per day/week/month
- **Bottleneck identification**: Tasks frequently marked "blocked" or overdue
- **Workload balancing**: Tasks per assignee, overdue tasks per user
- **Task type distribution**: Proportion of task types (metadata vs. verification vs. QA)

Analytics accessible to project administrators and content managers for workflow optimization.

---

## Media Type Classification

Workstation uses a **flexible, generic media classification system** that avoids hardcoding specific content types into the schema. This allows the system to handle any media format—current or future—without database migrations.

### Two-Level Classification

**Media Class** (top level):
- Broad categorization by fundamental media type
- Examples: `video`, `audio`, `image`, `text`, `interactive`
- Defines core capabilities (playback, rendering, analysis pipelines)
- Stored in `media_class` lookup table

**Media Kind** (specific type):
- Fine-grained categorization within a class
- Examples for `video` class: `series`, `season`, `episode`, `movie`, `livestream`, `clip`, `short`
- Examples for `audio` class: `podcast`, `podcast_episode`, `song`, `album`, `audiobook`, `audiobook_chapter`
- Stored in `media_kind` lookup table with foreign key to `media_class`

### Why This Design?

**Avoids schema bloat:**
- No separate `episodes`, `movies`, `songs` tables
- All content is a `content_node` with a `mediaKindId` reference

**Enables extensibility:**
- Adding a new media kind (e.g., "360-degree video", "interactive story") requires only a lookup table insert
- No schema migrations, no downtime, no code changes

**Simplifies permissions and workflows:**
- Permissions and tasks apply to nodes regardless of media kind
- Code doesn't need kind-specific branches (e.g., `if (node is episode) vs if (node is movie)`)

### Media Classification Examples

**TV Series hierarchy:**
```
Breaking Bad (group, video/series)
  └─ Season 1 (group, video/season)
      ├─ Pilot (content, video/episode)
      ├─ Cat's in the Bag... (content, video/episode)
      └─ Behind the Scenes (bonus_content, video/clip)
```

**Movie:**
```
The Shawshank Redemption (content, video/movie)
  └─ Director's Commentary (bonus_content, audio/commentary)
```

**Podcast:**
```
Radiolab (group, audio/podcast)
  └─ Season 2023 (group, audio/podcast_season)
      ├─ Space (content, audio/podcast_episode)
      └─ Time (content, audio/podcast_episode)
```

**Audiobook:**
```
Sapiens (group, audio/audiobook)
  ├─ Chapter 1 (content, audio/audiobook_chapter)
  ├─ Chapter 2 (content, audio/audiobook_chapter)
  └─ Author Interview (bonus_content, audio/interview)
```

### Media Kinds in Practice
When creating a node, the API validates that:
- The specified `mediaKindId` exists in the lookup table
- The media kind is appropriate for the node type (e.g., "episode" is usually `nodeType: content`, not `group`)
- The parent node's media kind logically fits (e.g., "season" parent for "episode" child)

Future enhancements may include validation rules for allowed parent-child media kind pairings to prevent illogical structures.

---

## API Surface

Workstation exposes a **Fastify-based REST API** organized into functional domains. All endpoints are protected by authentication and permission checks.

### API Architecture Principles
- **Layered structure**: Routes → Services → Repositories
- **Zod validation**: All inputs validated at route boundaries using shared Zod schemas
- **Consistent error handling**: Errors follow a standard shape with error codes and messages
- **Permission decorators**: Routes use `app.needsPerm('permission.code')` to enforce access control
- **Tenant scoping**: All requests operate within a tenant context (from header, prefs, or fallback)

### Authentication Endpoints

**POST /auth/login**
- **Purpose**: Authenticate user with email and password
- **Returns**: Access token (JWT) in response body, refresh token in httpOnly cookie
- **Public**: Yes (no authentication required)

**POST /auth/register**
- **Purpose**: Complete registration from an invite token
- **Input**: Invite token, password, profile information
- **Returns**: Access token and refresh token
- **Public**: Yes

**GET /auth/invite/:token**
- **Purpose**: Fetch invite details (email, platform access) for registration form
- **Public**: Yes

**POST /auth/refresh**
- **Purpose**: Rotate refresh token and obtain new access token
- **Returns**: New access token in response body, new refresh token in cookie
- **Public**: Yes (requires valid refresh cookie)

**GET /auth/me**
- **Purpose**: Fetch current user profile, platform access, memberships, and effective permissions
- **Returns**: User object with tenant memberships, current tenant, and permission grants
- **Auth required**: Yes

**POST /auth/logout**
- **Purpose**: Revoke all refresh tokens and clear cookie
- **Auth required**: Yes

**GET /auth/can?perm=<permission.code>**
- **Purpose**: Quick permission check for current user in current tenant
- **Returns**: `{ allowed: true/false }`
- **Auth required**: Yes

### Member Management Endpoints

**GET /ws/members**
- **Purpose**: List all members in the current tenant
- **Permission**: `member.list.view`
- **Returns**: Array of member objects with user info, roles, and status

**POST /ws/invite**
- **Purpose**: Send invitation to new user
- **Permission**: `member.invite.send`
- **Input**: Email, platform access grants, optional initial roles
- **Returns**: Created invite object with token

**POST /ws/members/:userId/deactivate**
- **Purpose**: Revoke a member's access to the current tenant
- **Permission**: `member.access.revoke`
- **Returns**: Success confirmation

### Role Management Endpoints

**GET /ws/roles**
- **Purpose**: List all roles (global + tenant-specific) available in current tenant
- **Permission**: `role.list.view`
- **Returns**: Array of role objects with permission sets

**POST /ws/roles**
- **Purpose**: Create a new tenant-specific role
- **Permission**: `role.create`
- **Input**: Role name, allow/deny permission sets
- **Returns**: Created role object

**GET /ws/roles/:id**
- **Purpose**: Fetch a single role with full permission details
- **Permission**: `role.perms.view`
- **Returns**: Role object

**PATCH /ws/roles/:id**
- **Purpose**: Update role name and/or permission sets
- **Permission**: `role.perms.update`
- **Input**: Updated name, allow, and/or deny sets
- **Returns**: Updated role object

**DELETE /ws/roles/:id**
- **Purpose**: Delete a tenant role (only if not currently assigned to any members)
- **Permission**: `role.delete`
- **Returns**: Success confirmation

### Permissions Catalog Endpoints

**GET /ws/permissions/catalog**
- **Purpose**: List all available permission codes with descriptions
- **Permission**: `role.perms.view`
- **Returns**: Array of permission definitions (code, description, namespace)

### Project Management Endpoints

**GET /ws/projects**
- **Purpose**: List all projects in the current tenant
- **Permission**: `project.list.view`
- **Returns**: Array of project summaries with descendant counts

**POST /ws/projects**
- **Purpose**: Create a new project root node
- **Permission**: `project.create`
- **Input**: Title, slug, synopsis, media kind
- **Returns**: Created project object

**GET /ws/projects/:id**
- **Purpose**: Fetch project metadata
- **Permission**: `project.view`
- **Returns**: Project object

**GET /ws/projects/:id/tree**
- **Purpose**: Retrieve full content tree for a project with closure relationships
- **Permission**: `project.view`
- **Returns**: Hierarchical tree structure with all descendants

**PATCH /ws/projects/:id**
- **Purpose**: Update project metadata (title, slug, synopsis)
- **Permission**: `project.edit`
- **Returns**: Updated project object

**DELETE /ws/projects/:id**
- **Purpose**: Delete project and all descendants
- **Permission**: `project.delete`
- **Returns**: Success confirmation

### Content Node Endpoints

**POST /ws/nodes**
- **Purpose**: Create a child node under a parent
- **Permission**: `content.create`
- **Input**: Parent ID, node type, media kind, title, slug, synopsis, position
- **Returns**: Created node object

**GET /ws/nodes/:id**
- **Purpose**: Fetch a single node with metadata
- **Permission**: `content.view`
- **Returns**: Node object

**PATCH /ws/nodes/:id**
- **Purpose**: Update node metadata (title, slug, synopsis)
- **Permission**: `content.edit`
- **Returns**: Updated node object

**DELETE /ws/nodes/:id**
- **Purpose**: Delete node and all descendants
- **Permission**: `content.delete`
- **Returns**: Success confirmation

**POST /ws/nodes/:id/move**
- **Purpose**: Move a node to a new parent
- **Permission**: `content.edit`
- **Input**: Target parent ID
- **Validation**: Prevents cycles, enforces target is group type, same tenant
- **Returns**: Success confirmation; closure table updated

**POST /ws/nodes/reorder**
- **Purpose**: Reorder sibling nodes
- **Permission**: `content.edit`
- **Input**: Array of node IDs in desired order
- **Returns**: Success confirmation

### Error Handling
All API errors follow a consistent shape:
```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to perform this action"
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Not authenticated
- `PERMISSION_DENIED`: Authenticated but lacking required permission
- `NOT_FOUND`: Resource does not exist
- `VALIDATION_ERROR`: Input validation failed (Zod)
- `CONFLICT`: Operation conflicts with current state (e.g., deleting role in use)
- `INTERNAL_ERROR`: Unexpected server error

---

## Workstation in the Hoolsy Ecosystem

Workstation is one of **five primary platforms** in the Hoolsy ecosystem. Understanding how they relate helps clarify Workstation's boundaries and responsibilities.

### The Five Platforms

**1. Workstation** (this document)
- **Purpose**: Internal operations platform for content preparation, verification, and editorial workflows
- **Users**: Media partners, content managers, editors, enrichment teams, technical operators
- **Core responsibilities**:
  - Organize content into hierarchical projects
  - Verify AI-detected subjects and metadata
  - Manage tasks and enrichment workflows
  - Grant granular permissions (tenant and node-scoped)
  - Prepare verified data for downstream consumption

**2. Marketplace**
- **Purpose**: Commerce platform for product catalogs, vendor management, pricing, campaigns, and storefront logic
- **Users**: Merchants, brand partners, campaign managers, commerce operators
- **Core responsibilities**:
  - Manage product catalogs and inventory
  - Define pricing, promotions, and campaigns
  - Connect products to subjects (via Subject Registry)
  - Power the consumer shopping experience
  - Handle transactions and order management

**3. Consumer App**
- **Purpose**: Mobile companion app that syncs with content via ultrasound for interactive shopping experiences
- **Users**: General public, media audiences
- **Core responsibilities**:
  - Detect ultrasound codes from TV speakers and sync with content
  - Display verified metadata from Workstation
  - Enable subject discovery ("What's that product?", "Who is that actor?")
  - Surface shoppable products from Marketplace
  - Provide personalized recommendations and search

**4. Syncstation**
- **Purpose**: On-set companion app for production crews to capture and tag metadata during filming
- **Users**: Costume designers, props departments, makeup artists, script supervisors
- **Core responsibilities**:
  - Rapid on-set logging with images, video, and notes
  - Context binding to Workstation content nodes
  - Offline-first operation with robust sync
  - Department-specific workflows for production teams

**5. Nexus**
- **Purpose**: Internal oversight, monitoring, reporting, and cross-platform administration
- **Users**: System administrators, analytics teams, executive stakeholders
- **Core responsibilities**:
  - Monitor platform health and performance
  - Generate reports and dashboards
  - Provide cross-platform admin tools
  - Track usage, compliance, and operational metrics

### Data Flow Between Platforms

**Workstation → Consumer App:**
- Verified content metadata (titles, synopses, subjects)
- Verified subject identities (linked via Subject Registry)
- Content availability and access rules

**Workstation → Marketplace:**
- Subject detections (for product-subject linkage)
- Content context (which products appear in which episodes)

**Marketplace → Consumer App:**
- Product catalogs, pricing, availability
- Shoppable product references linked to subjects

**All platforms → Nexus:**
- Operational telemetry, logs, metrics
- User activity and engagement data

**Nexus → All platforms:**
- Admin overrides, configuration updates
- Monitoring alerts and health checks

### Shared Infrastructure

**Users Database:**
- Single source of truth for user identity across all platforms
- Platform access grants determine which platforms a user can access
- Each platform has its own RBAC system for internal permissions

**Subject Registry:**
- Global identity layer for subjects (people, products, locations, etc.)
- Shared across Workstation (for verification) and Marketplace (for product linkage)
- Enables "this product in Workstation IS the same as this product in Marketplace"

**Subject Databases (Polyglot Persistence):**
- **Document store**: Flexible schema for subject metadata
- **Graph database**: Relationship mapping (person → appeared in → episode; product → used by → character)
- **Time-series store**: Temporal data (when did subject appear, for how long, at what timestamp)

### Why Separation Matters
Each platform has distinct:
- **User roles**: Content editors vs. merchants vs. consumers vs. admins
- **Performance profiles**: Workstation handles editorial workflows; Consumer App handles high-traffic synchronization requests (ultrasound detection and timestamp queries)
- **Security postures**: Internal platforms require strong auth/RBAC; Consumer App is public-facing
- **Scaling needs**: Consumer App scales with audience growth; Workstation scales with content volume

By separating platforms, Hoolsy can:
- Optimize each platform for its workload
- Evolve platforms independently
- Maintain clear boundaries and contracts
- Onboard teams (e.g., student groups) to a single platform without overwhelming complexity

### Workstation's Role in the Workflow
In the end-to-end content-to-commerce flow:

1. **Content ingestion** (Workstation): Media partner uploads content, sets up project structure
2. **AI processing** (Backend pipelines): AI detects subjects, generates metadata proposals
3. **Human verification** (Workstation): Editors review, correct, and enrich AI output
4. **Subject linking** (Workstation + Subject Registry): Verified subjects linked to global identities
5. **Product association** (Marketplace): Merchants link products to subjects
6. **Publishing** (Workstation → Export): Verified data pushed to consumer-facing data stores
7. **Discovery** (Consumer App): Audiences explore content, discover subjects, shop products
8. **Analytics** (Nexus): Track engagement, conversions, content performance

Workstation is the **quality control gate** that ensures only verified, structured data reaches the consumer experience.
