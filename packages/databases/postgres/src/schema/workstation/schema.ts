// packages/databases/src/schema/workstation/schema.ts
import { sql } from 'drizzle-orm';
import {
  pgTable, bigint, integer, text, varchar, timestamp, uuid as uuidCol,
  jsonb, primaryKey, pgEnum, check, unique, serial, real, boolean,
} from 'drizzle-orm/pg-core';
import { v7 as uuidv7 } from 'uuid';

// ---------- Tenants (workspaces) ----------
export const wsTenants = pgTable('ws_tenants', {
  id: uuidCol('id').primaryKey().$defaultFn(() => uuidv7()),
  code: varchar('code', { length: 80 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  externalRef: varchar('external_ref', { length: 120 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Membership status ───────────────────────────────────────────────────────
export const wsMemberStatus = pgEnum('ws_member_status', [
  'pending', 'active', 'disabled', 'removed',
]);

// ─── Tenant members (organization roster) ───────────────────────────────────
export const wsTenantMembers = pgTable('ws_tenant_members', {
  memberId: uuidCol('member_id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuidCol('tenant_id').notNull().references(() => wsTenants.id, { onDelete: 'cascade' }),
  userUuid: uuidCol('user_uuid').notNull(),

  // Option B semantics:
  // Who added this user to THIS tenant (can be different from platform invite issuer)
  addedBy: uuidCol('added_by'), // nullable on purpose

  // If the addition came from a platform invite, keep a soft link for traceability
  inviteToken: varchar('invite_token', { length: 120 }), // nullable

  status: wsMemberStatus('status').notNull().default('pending'),

  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
}, (t) => ({
  // One row per (tenant, user)
  ukTenantUser: unique('uk_ws_member_tenant_user').on(t.tenantId, t.userUuid),
}));

// ---------- Media classification ----------
export const mediaClass = pgTable('media_class', {
  id: integer('id').primaryKey(),
  classCode: varchar('class_code', { length: 20 }).notNull().unique(),
});

export const mediaKind = pgTable('media_kind', {
  id: serial('id').primaryKey(),
  mediaClassId: integer('media_class_id').notNull().references(() => mediaClass.id),
  kindCode: varchar('kind_code', { length: 40 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
});

// ---------- Content tree + closure ----------
export const contentNodeType = pgEnum('content_node_type', ['group', 'content', 'bonus_content']);

// Note: Titles do NOT need to be unique - allows duplicate names in same parent
// Note: Partial unique index for root slugs created in migration
// CREATE UNIQUE INDEX ux_root_slug ON content_nodes(tenant_id, slug) WHERE parent_id IS NULL AND slug IS NOT NULL
export const contentNodes = pgTable('content_nodes', {
  nodeId: uuidCol('node_id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuidCol('tenant_id').notNull().references(() => wsTenants.id, { onDelete: 'cascade' }),
  parentId: uuidCol('parent_id'),
  nodeType: contentNodeType('node_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  synopsis: text('synopsis'),
  slug: varchar('slug', { length: 160 }),
  position: integer('position').default(0),
  mediaKindId: integer('media_kind_id').references(() => mediaKind.id),
  datalakePath: varchar('datalake_path', { length: 600 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const contentClosure = pgTable('content_closure', {
  ancestorId: uuidCol('ancestor_id').notNull()
    .references(() => contentNodes.nodeId, { onDelete: 'cascade' }),
  descendantId: uuidCol('descendant_id').notNull()
    .references(() => contentNodes.nodeId, { onDelete: 'cascade' }),
  depth: integer('depth').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.ancestorId, t.descendantId] }),
}));

// ---------- Media Assets ----------
export const mediaAssetStatus = pgEnum('media_asset_status', ['uploaded', 'processing', 'ready', 'failed']);
export const storageProvider = pgEnum('storage_provider', ['local', 'azure-blob']);

export const mediaAssets = pgTable('media_assets', {
  mediaAssetId: uuidCol('media_asset_id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuidCol('tenant_id').notNull().references(() => wsTenants.id, { onDelete: 'cascade' }),
  nodeId: uuidCol('node_id').notNull().references(() => contentNodes.nodeId, { onDelete: 'cascade' }),

  filename: varchar('filename', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),

  storageProvider: storageProvider('storage_provider').notNull().default('local'),
  storagePath: varchar('storage_path', { length: 600 }).notNull(),

  status: mediaAssetStatus('status').notNull().default('uploaded'),

  // Media type flags
  hasVideo: boolean('has_video'),
  hasAudio: boolean('has_audio'),

  // Common metadata (video/audio/image)
  durationMs: bigint('duration_ms', { mode: 'number' }), // milliseconds for frame precision
  width: integer('width'),
  height: integer('height'),

  // Video-specific metadata
  frameRate: real('frame_rate'), // frames per second (e.g., 29.97, 60)
  videoCodec: varchar('video_codec', { length: 50 }),

  // Audio-specific metadata
  audioCodec: varchar('audio_codec', { length: 50 }),
  audioChannels: integer('audio_channels'),
  audioSampleRate: integer('audio_sample_rate'), // Hz (e.g., 44100, 48000)

  // Image-specific metadata
  format: varchar('format', { length: 50 }), // e.g., 'jpeg', 'png', 'webp'
  colorSpace: varchar('color_space', { length: 50 }), // e.g., 'srgb', 'cmyk'
  dpi: integer('dpi'),
  orientation: integer('orientation'), // EXIF orientation (1-8)
  exifData: jsonb('exif_data').$type<Record<string, unknown>>(), // Full EXIF metadata

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  // One media asset per node (enforced in application logic)
  // Index for fast lookup by node
  idxNodeId: unique('ux_media_asset_node').on(t.nodeId),
}));

export const mediaVariantType = pgEnum('media_variant_type', ['thumbnail', 'poster', 'hls', 'dash']);

export const mediaVariants = pgTable('media_variants', {
  variantId: uuidCol('variant_id').primaryKey().$defaultFn(() => uuidv7()),
  assetId: uuidCol('asset_id').notNull().references(() => mediaAssets.mediaAssetId, { onDelete: 'cascade' }),

  variantType: mediaVariantType('variant_type').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  storagePath: varchar('storage_path', { length: 600 }).notNull(),

  // Optional metadata
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  width: integer('width'),
  height: integer('height'),
  bitrate: integer('bitrate'),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ---------- RBAC ----------
export const wsPermissionsCatalog = pgTable('ws_permissions_catalog', {
  permissionCode: varchar('permission_code', { length: 60 }).primaryKey(),
  description: varchar('description', { length: 255 }),
});

export const wsRoleScope = pgEnum('ws_role_scope', ['platform', 'node']);

export const wsRoles = pgTable('ws_roles', {
  roleId: uuidCol('role_id').primaryKey().$defaultFn(() => uuidv7()),
  name: varchar('name', { length: 60 }).notNull(),
  tenantId: uuidCol('tenant_id').references(() => wsTenants.id, { onDelete: 'cascade' }),
  scopeLevel: wsRoleScope('scope_level').notNull(),
  defaultPerms: jsonb('default_perms').notNull(),
}, (t) => ({
  uk: unique('uk_role_tenant_name').on(t.tenantId, t.name),
}));

export const wsUserMemberships = pgTable('ws_user_memberships', {
  membershipId: uuidCol('membership_id').primaryKey().$defaultFn(() => uuidv7()),
  userUuid: uuidCol('user_uuid').notNull(),
  tenantId: uuidCol('tenant_id').references(() => wsTenants.id, { onDelete: 'cascade' }),
  nodeId: uuidCol('node_id').references(() => contentNodes.nodeId, { onDelete: 'cascade' }),
  roleId: uuidCol('role_id').notNull().references(() => wsRoles.roleId),
  customPerms: jsonb('custom_perms'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  xorScope: check('ck_membership_scope',
    sql`( (CASE WHEN ${t.tenantId} IS NULL THEN 0 ELSE 1 END) + (CASE WHEN ${t.nodeId} IS NULL THEN 0 ELSE 1 END) ) = 1`,
  ),
}));

// ---------- Tasks MVP ----------
export const taskStatus = pgTable('task_status', {
  id: integer('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
});

export const taskPriority = pgTable('task_priority', {
  id: integer('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  weight: integer('weight').notNull(),
});

export const taskType = pgTable('task_type', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 40 }).notNull().unique(),
  description: varchar('description', { length: 255 }),
  defaultDeadlineHours: integer('default_deadline_hours').notNull(),
});

export const tasks = pgTable('tasks', {
  taskId: uuidCol('task_id').primaryKey().$defaultFn(() => uuidv7()),
  tenantId: uuidCol('tenant_id').notNull().references(() => wsTenants.id, { onDelete: 'cascade' }),
  nodeId: uuidCol('node_id').references(() => contentNodes.nodeId, { onDelete: 'cascade' }),
  subjectId: bigint('subject_id', { mode: 'number' }),
  taskTypeId: integer('task_type_id').notNull().references(() => taskType.id),
  statusId: integer('status_id').notNull().references(() => taskStatus.id),
  priorityId: integer('priority_id').notNull().references(() => taskPriority.id),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  assignedToUser: uuidCol('assigned_to_user'),
  assignedToRole: uuidCol('assigned_to_role').references(() => wsRoles.roleId),
  dueAt: timestamp('due_at', { withTimezone: true }),
  createdBy: uuidCol('created_by'),
  commentThread: jsonb('comment_thread').default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  ckAssign: check('ck_task_assign', sql`NOT( ${t.assignedToUser} IS NOT NULL AND ${t.assignedToRole} IS NOT NULL )`),
}));

export const taskActivityAction = pgEnum('task_activity_action', [
  'CREATE', 'ASSIGN_ROLE', 'ASSIGN_USER', 'START', 'CONTENT_EDIT', 'COMPLETE', 'REOPEN',
]);

export const taskActivity = pgTable('task_activity', {
  activityId: uuidCol('activity_id').primaryKey().$defaultFn(() => uuidv7()),
  taskId: uuidCol('task_id').notNull().references(() => tasks.taskId, { onDelete: 'cascade' }),
  actorUuid: uuidCol('actor_uuid').notNull(),
  actionCode: taskActivityAction('action_code').notNull(),
  fieldChanged: varchar('field_changed', { length: 40 }),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  ts: timestamp('ts', { withTimezone: true }).defaultNow(),
});

export const taskContributor = pgTable('task_contributor', {
  taskId: uuidCol('task_id').notNull().references(() => tasks.taskId, { onDelete: 'cascade' }),
  userUuid: uuidCol('user_uuid').notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.userUuid] }),
}));

// ---------- Closure trigger SQL (kept in migrations in practice) ----------
export const trgContentAfterInsert = sql`
CREATE OR REPLACE FUNCTION fill_content_closure_on_insert() RETURNS trigger AS $$
BEGIN
  INSERT INTO content_closure(ancestor_id, descendant_id, depth)
  VALUES (NEW.node_id, NEW.node_id, 0);
  IF NEW.parent_id IS NOT NULL THEN
    INSERT INTO content_closure(ancestor_id, descendant_id, depth)
    SELECT ancestor_id, NEW.node_id, depth + 1
    FROM content_closure
    WHERE descendant_id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_after_insert ON content_nodes;
CREATE TRIGGER trg_content_after_insert
AFTER INSERT ON content_nodes
FOR EACH ROW EXECUTE FUNCTION fill_content_closure_on_insert();
`;
