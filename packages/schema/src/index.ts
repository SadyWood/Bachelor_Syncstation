// Barrel file – ONLY re-exports. Use .js extensions (NodeNext/ESM).

export { SuccessResponse, ErrorResponse, type ErrorReply } from './primitives.js';

// Users
export { PublicUserSchema, type PublicUser } from './users/common.js';
export { AccessSummaryItem, AccessSummary, type AccessSummaryT } from './users/access.js';

// Workstation
export {
  WsMembership, WsMemberships, type WsMembershipT, type WsMembershipsT,
  TenantInfo, type TenantInfoT,
  WsMemberSchema, type WsMember,
  MembersListResponseSchema, type MembersListResponse,
  UserRoleSchema, type UserRole,
  UserRolesResponseSchema, type UserRolesResponse,
} from './workstation/membership.js';

export {
  WsRoleScope, type WsRoleScopeT,
  PermissionCode,
  PermissionCatalogItem as PermissionCatalogItemSchema,
  type PermissionCatalogItem,
  PermissionCatalogResponse,
  PermissionsCatalogResponseSchema,
  type PermissionsCatalogResponse,
  RoleSchema, type Role, RolesResponse,
  RoleResponseSchema, type RoleResponse,
  RolesListResponseSchema, type RolesListResponse,
  UpsertRoleRequest, UpsertRoleResponse,
  SimpleRoleSchema, type SimpleRole,
  SimpleRolesListResponseSchema, type SimpleRolesListResponse,
  CanCheckQuery, CanCheckResponse,
  EffectivePermissionsSnapshot, type EffectivePermissionsSnapshotT,
} from './workstation/rbac.js';

export {
  NodeType, type NodeTypeT,
  MediaClass, type MediaClassT,
  TemplateType, type TemplateTypeT,
  MediaKindCode,
  type MediaKindOption,
  type MediaKindCategory,
  MEDIA_KIND_OPTIONS,
  getMediaClassFromKind,
  ContentNodeSchema, type ContentNode,
  ProjectSummary, type ProjectSummaryT,
  ContentNodeNested, type ContentNodeNestedT,
  ProjectsListResponse,
  ProjectResponse,
  NodesListResponse,
  NodeResponse,
  ProjectTreeFlatResponse,
  ProjectTreeNestedResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateNodeRequest,
  UpdateNodeRequest,
  MoveNodeRequest,
  ReorderSiblingsRequest,
  ApplyTemplateRequest,
} from './workstation/content.js';

export {
  MediaStatus, type MediaStatusT,
  StorageProvider, type StorageProviderT,
  MediaVariantType, type MediaVariantTypeT,
  MediaAssetSchema, type MediaAsset,
  MediaVariantSchema, type MediaVariant,
  InitUploadRequestSchema, type InitUploadRequest,
  InitUploadResponseSchema, type InitUploadResponse,
  CompleteUploadRequestSchema, type CompleteUploadRequest,
  CompleteUploadResponseSchema, type CompleteUploadResponse,
  MediaListResponseSchema, type MediaListResponse,
  MediaStreamResponseSchema, type MediaStreamResponse,
  MediaMetadataSchema, type MediaMetadata,
} from './workstation/media.js';

export {
  type SubjectType,
  SUGGESTED_SUBJECT_TYPES,
  SubjectSchema, type Subject,
  SubjectAppearanceSchema, type SubjectAppearance,
  TimelineItemSchema, type TimelineItem,
  TimelineTrackSchema, type TimelineTrack,
  appearanceToTimelineItem,
  subjectToTimelineItem,
  DEFAULT_TIMELINE_TRACKS,
} from './workstation/subject.schema.js';

// Auth
export {
  LoginRequest, LoginResponse, type LoginBody, type LoginReply,
  RefreshResponse, type RefreshReply, MeResponse, type MeReply, CanResponse, type CanReply,
} from './auth.js';

// Register + invite (ligger i users/common)
export {
  RegisterRequest, RegisterResponse, type RegisterBody, type RegisterReply,
  InvitePreviewResponse, type InvitePreviewReply,
} from './users/common.js';

// Syncstation
export {
  SyncStatus, type SyncStatusT,
  AttachmentType, type AttachmentTypeT,
  LogAttachmentSchema, type LogAttachment,
  LogEntrySchema, type LogEntry,
  LogEntrySummarySchema, type LogEntrySummary,
  CreateLogEntryRequest, type CreateLogEntryRequestBody,
  UpdateLogEntryRequest, type UpdateLogEntryRequestBody,
  UploadAttachmentRequest, type UploadAttachmentRequestBody,
  LogEntryResponse, type LogEntryResponseData,
  LogEntriesListResponse, type LogEntriesListResponseData,
  AttachmentUploadResponse, type AttachmentUploadResponseData,
  SyncStatusResponse, type SyncStatusResponseData,
} from './syncstation/log-entry.js';
