// packages/databases/src/seed/setup/ws.permissions.ts
// Single source of truth for Workstation permissions and global role templates.
// Seeds can import this file to populate ws_permissions_catalog and ws_roles.
//
// Conventions:
// - Dot paths with segment globs supported by the auth layer:
//   "*"  = one segment, "**" = zero or more segments.
// - Capabilities are named by resource + operation, not by UI location.
//   e.g. "member.list.view" rather than "admin.members.read".

export type PermissionCatalogEntry = {
  permissionCode: string;
  description: string;
};

export type RoleTemplate = {
  /** Global role name (created with tenantId = null). */
  name: 'Admin' | 'Manage' | 'Viewer';
  /** Default permissions stored as jsonb on the DB. */
  defaultPerms: { allow: string[]; deny: string[] };
};

/**
 * Permission catalog (authoritative list).
 * Add new permissions here; avoid removing codes once shipped (prefer deprecating).
 */
export const PERMISSION_CATALOG: PermissionCatalogEntry[] = [
  // ───────────────────────── Members / Roster ─────────────────────────
  { permissionCode: 'member.list.view',     description: 'View the tenant member list' },
  { permissionCode: 'member.invite.send',   description: 'Send invitations to new members' },
  { permissionCode: 'member.access.revoke', description: 'Revoke or disable a member\'s access' },
  { permissionCode: 'member.roles.assign',  description: 'Assign or remove roles from members' },

  // ───────────────────────── Roles / RBAC ─────────────────────────────
  { permissionCode: 'role.list.view',       description: 'View roles available in this tenant' },
  { permissionCode: 'role.create',          description: 'Create tenant-scoped roles' },
  { permissionCode: 'role.delete',          description: 'Delete tenant-scoped roles' },
  { permissionCode: 'role.perms.view',      description: 'View a role\'s default permissions' },
  { permissionCode: 'role.perms.update',    description: 'Update a role\'s default permissions' },

  // ───────────────────────── Content ──────────────────────────────────
  { permissionCode: 'content.read',            description: 'Read content and metadata' },
  { permissionCode: 'content.manage',          description: 'Create, update and delete content' },
  { permissionCode: 'content.project.list',    description: 'List projects' },
  { permissionCode: 'content.project.view',    description: 'View project details and tree' },
  { permissionCode: 'content.project.create',  description: 'Create new projects' },
  { permissionCode: 'content.project.update',  description: 'Update project metadata' },
  { permissionCode: 'content.project.delete',  description: 'Delete projects' },
  { permissionCode: 'content.node.create',     description: 'Create content nodes' },
  { permissionCode: 'content.node.update',     description: 'Update content nodes' },
  { permissionCode: 'content.node.delete',     description: 'Delete content nodes' },
  { permissionCode: 'content.node.move',       description: 'Move nodes between parents' },
  { permissionCode: 'content.node.reorder',    description: 'Reorder sibling nodes' },
  { permissionCode: 'content.template.apply',  description: 'Apply templates to projects' },

  // ───────────────────────── Media ────────────────────────────────────
  { permissionCode: 'content.media.view',      description: 'View media assets linked to content' },
  { permissionCode: 'content.media.upload',    description: 'Upload media files to content nodes' },
  { permissionCode: 'content.media.delete',    description: 'Delete media assets' },
  { permissionCode: 'content.media.stream',    description: 'Stream media content' },

  // ───────────────────────── Tasks ────────────────────────────────────
  { permissionCode: 'task.read',            description: 'Read tasks' },
  { permissionCode: 'task.manage',          description: 'Create, update, delete tasks and change status' },

  // ───────────────────────── Sync Station ─────────────────────────────
  { permissionCode: 'syncstation.log.view',         description: 'View sync log entries' },
  { permissionCode: 'syncstation.log.create',       description: 'Create sync log entries' },
  { permissionCode: 'syncstation.log.update',       description: 'Update sync log entries' },
  { permissionCode: 'syncstation.log.delete',       description: 'Delete sync log entries' },
  { permissionCode: 'syncstation.attachment.upload',   description: 'Upload attachments to log entries' },
  { permissionCode: 'syncstation.attachment.download', description: 'Download log entry attachments' },
  { permissionCode: 'syncstation.attachment.delete',   description: 'Delete log entry attachments' },
  { permissionCode: 'syncstation.status.view',      description: 'View sync queue status' },
];

/**
 * Global role templates (created with tenantId = null).
 * These are sensible defaults; tenants can still create their own roles.
 */
export const GLOBAL_ROLE_TEMPLATES: RoleTemplate[] = [
  {
    name: 'Admin',
    // Full access everywhere. Deny remains empty so no overrides block Admin.
    defaultPerms: { allow: ['**'], deny: [] },
  },
  {
    name: 'Manage',
    defaultPerms: {
      allow: [
        // Members
        'member.list.view',
        'member.invite.send',
        'member.access.revoke',
        'member.roles.assign',

        // Roles
        'role.list.view',
        'role.create',
        'role.delete',
        'role.perms.view',
        'role.perms.update',

        // Content
        'content.read',
        'content.manage',
        'content.project.list',
        'content.project.view',
        'content.project.create',
        'content.project.update',
        'content.project.delete',
        'content.node.create',
        'content.node.update',
        'content.node.delete',
        'content.node.move',
        'content.node.reorder',
        'content.template.apply',

        // Media
        'content.media.view',
        'content.media.upload',
        'content.media.delete',
        'content.media.stream',

        // Tasks
        'task.read',
        'task.manage',

        // Syncstation
        'syncstation.log.view',
        'syncstation.log.create',
        'syncstation.log.update',
        'syncstation.log.delete',
        'syncstation.attachment.upload',
        'syncstation.attachment.download',
        'syncstation.attachment.delete',
        'syncstation.status.view',
      ],
      deny: [],
    },
  },
  {
    name: 'Viewer',
    defaultPerms: {
      allow: [
        // Read-only access across domains
        'member.list.view',
        'role.list.view',
        'role.perms.view',
        'content.read',
        'content.project.list',
        'content.project.view',
        'content.media.view',
        'content.media.stream',
        'task.read',
        'syncstation.log.view',
        'syncstation.attachment.download',
        'syncstation.status.view',
      ],
      deny: [],
    },
  },
];

// Handy export for consumers / seed scripts
export const PERMISSION_CODES = PERMISSION_CATALOG.map(p => p.permissionCode);

/**
 * Optional: legacy alias map for migrations (old -> new).
 * If you need to migrate existing rows in ws_permissions_catalog or role JSON,
 * you can iterate this map in a one-off script.
 */
export const LEGACY_PERMISSION_ALIASES: Record<string, string> = {
  // Old admin-centric names → new resource-centric names
  'admin.members.read': 'member.list.view',
  'admin.members.write': 'member.access.revoke', // (split previously; invite/write now explicit below)
  'admin.invite.write': 'member.invite.send',

  'admin.roles.read': 'role.list.view',       // plus 'role.perms.view'
  'admin.roles.write': 'role.perms.update',    // and/or 'role.create' / 'role.delete'

  // If some UIs checked 'admin.panel', drop it. Page access now derives
  // from having any relevant capability (e.g., member.list.view or role.list.view).
};
