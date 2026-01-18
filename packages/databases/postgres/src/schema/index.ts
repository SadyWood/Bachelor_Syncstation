// packages/databases/src/schema/index.ts
// Top-level exports of tables for backward compatibility (API expects schema.<table>)
export { users, platforms, userAccessToPlatform, invites, refreshTokens } from './users/schema.js';
export {
  wsTenants,
  // NEW exports:
  wsTenantMembers,
  wsMemberStatus,
  // existing:
  mediaClass, mediaKind, contentNodeType, contentNodes, contentClosure,
  // media assets:
  mediaAssetStatus, storageProvider, mediaAssets, mediaVariantType, mediaVariants,
  wsPermissionsCatalog, wsRoleScope, wsRoles, wsUserMemberships,
  taskStatus, taskPriority, taskType, tasks, taskActivityAction, taskActivity, taskContributor,
} from './workstation/schema.js';

// Export API response schemas and request schemas
export {
  NodeType,
  TemplateType,
  ContentNodeDto,
  ProjectSummary,
  ProjectsList,
  NodesResponse,
  NodeResponse,
  ContentNodeNested,
  ProjectTreeNested,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateNodeRequest,
  UpdateNodeRequest,
  MoveNodeRequest,
  ReorderSiblingsRequest,
  ApplyTemplateRequest,
  type NodeTypeT,
  type TemplateTypeT,
  type ContentNode,
} from './workstation/content.js';

// Syncstation tables
export {
  syncStatusEnum,
  attachmentTypeEnum,
  logEntries,
  logAttachments,
} from './syncstation/schema.js';

// Namespaced optional exports
export * as usersSchema from './users/schema.js';
export * as workstationSchema from './workstation/schema.js';
export * as marketplaceSchema from './marketplace/schema.js';
export * as syncstationSchema from './syncstation/schema.js';
