// src/widgets/index.ts

// Start page widgets (uendret)
export { SubjectEditor } from './Dummy/SubjectEditor';
export { Timeline } from './Dummy/Timeline';
export { QuickActions } from './Dummy/QuickActions';
export { AnalyticsDashboard } from './Dummy/AnalyticsDashboard';
export { PerformanceMetrics } from './Dummy/PerformanceMetrics';

// Legacy/demo (gi dem nye navn så vi ikke kolliderer)
export { default as LegacyProjectList } from './Dummy/ProjectList';
export { default as NotificationsFeed } from './Dummy/NotificationsFeed';
export { default as MessageComposer } from './Dummy/MessageComposer';

// Content dashboard (legacy/dummy)
export { default as ImportPanel } from './Dummy/ImportPanel';
export { default as SubjectInfoPanel } from './Dummy/SubjectInfoPanel';
export { default as MediaPreview } from './Dummy/MediaPreview';
export { default as TimelineInstances } from './Dummy/TimelineInstances';
export { default as GlobalTimeline } from './Dummy/GlobalTimeline';

// Shared types - re-export from centralized types
export type { WidgetProps, GridLayoutItem, WidgetType, WidgetConfig } from '../types';

// Project Structure widgets (aktive widgets for produksjon)
export { default as ProjectList } from './ProjectStructure/ProjectList';
export { default as ContentTree } from './ProjectStructure/ContentTree';
export { default as ProjectMeta } from './ProjectStructure/ProjectMeta';
export { default as ProjectTemplates } from './ProjectStructure/ProjectTemplates';
export { default as NodeInspector } from './ProjectStructure/NodeInspector';

// Content Dashboard widgets (real implementations for media & timeline)
export { default as ProjectBrowser } from './ContentDashboard/ProjectBrowser';
export { default as MediaPlayer } from './ContentDashboard/MediaPreview';
export { TimelineWidget } from './ContentDashboard/Timeline';
