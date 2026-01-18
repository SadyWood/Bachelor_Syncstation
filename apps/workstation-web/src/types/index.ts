// src/types/index.ts

/**
 * Central barrel export for all frontend types.
 * Import from '@/types' or '../../types' etc.
 */

// Common types (icons, sorting)
export type {
  IconProps,
  IconComp,
  SortKey,
  SortDir,
} from './common';

// UI component types (buttons, modals)
export type {
  Appearance,
  Tone,
  Size,
  ButtonProps,
  ModalSize,
  ModalAction,
  ModalProps,
} from './components';

// Layout types (navigation, sidenav)
export type {
  SideNavProps,
  MenuItem,
} from './layout';

// Widget system types
export type {
  WidgetProps,
  GridLayoutItem,
  GridItemMeta,
  WidgetRegistry,
  WidgetType,
  WidgetConfig,
} from './widgets';

// Admin-specific types
export type {
  CatalogItem,
} from './admin';

// Content/project types
export type {
  TemplateType,
  DropPosition,
} from './content';

// Permissions types
export type {
  Membership,
  RolePerms,
  EffectivePerms,
  RoleDetail,
} from './permissions';

// Event types
export type {
  VideoTimeUpdateDetail,
  NodeSelectedDetail,
  SelectNodeByIdDetail,
  TimelineSeekDetail,
  VideoTimeUpdateEvent,
  NodeSelectedEvent,
  SelectNodeByIdEvent,
  TimelineSeekEvent,
} from './events';
