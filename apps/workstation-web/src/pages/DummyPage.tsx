import { BarChart3, Bell, BookOpen, Clock, FileText, Image as ImageIcon, LineChart, ListChecks, ListTree, Send, Upload, Zap } from 'lucide-react';
import React from 'react';
import PageShell from '../components/Layout/PageShell';
import SideNav from '../components/Layout/SideNav';
import { WidgetGrid } from '../components/WidgetBase/WidgetGrid';
import {
  SubjectEditor,
  Timeline,
  QuickActions,
  AnalyticsDashboard,
  PerformanceMetrics,
  ProjectList,
  NotificationsFeed,
  MessageComposer,
  ImportPanel,
  SubjectInfoPanel,
  MediaPreview,
  TimelineInstances,
  GlobalTimeline,
} from '../widgets';
import type { GridItemMeta, WidgetRegistry } from '../types';

// Ikoner (bare for headeren)

const registry: WidgetRegistry = {
  SubjectEditor,
  Timeline,
  QuickActions,
  AnalyticsDashboard,
  PerformanceMetrics,
  ProjectList,
  NotificationsFeed,
  MessageComposer,
  ImportPanel,
  SubjectInfoPanel,
  MediaPreview,
  TimelineInstances,
  GlobalTimeline,
};

// Litt romslig layout – 12 kolonner
const items: GridItemMeta[] = [
  { i: 'aw0',  x: 0,  y: 0,  w: 5, h: 6, minW: 3, minH: 3, widget: 'SubjectEditor',     title: 'Subject Editor',      icon: BookOpen },
  { i: 'aw1',  x: 6,  y: 0,  w: 2, h: 6, minW: 3, minH: 3, widget: 'AnalyticsDashboard', title: 'Analytics Dashboard', icon: BarChart3 },

  { i: 'aw2',  x: 0,  y: 4,  w: 4, h: 5, minW: 2, minH: 4, widget: 'Timeline',           title: "Today's Timeline",    icon: Clock },
  { i: 'aw3',  x: 4,  y: 4,  w: 4, h: 3, minW: 2, minH: 3, widget: 'QuickActions',       title: 'Quick Actions',       icon: Zap },
  { i: 'aw4',  x: 8,  y: 4,  w: 4, h: 3, minW: 2, minH: 3, widget: 'PerformanceMetrics', title: 'Performance Metrics', icon: LineChart },

  { i: 'aw5',  x: 0,  y: 9,  w: 6, h: 8, minW: 4, minH: 6, widget: 'ProjectList',        title: 'Project Management',  icon: ListChecks },
  { i: 'aw6',  x: 6,  y: 9,  w: 6, h: 6, minW: 4, minH: 4, widget: 'NotificationsFeed',  title: 'Notifications',       icon: Bell },
  { i: 'aw7',  x: 6,  y: 15, w: 6, h: 4, minW: 4, minH: 3, widget: 'MessageComposer',    title: 'New Message',         icon: Send },

  { i: 'aw8',  x: 0,  y: 17, w: 12, h: 3, minW: 8, minH: 3, widget: 'ImportPanel',       title: 'Imports',             icon: Upload },
  { i: 'aw9',  x: 0,  y: 20, w: 4,  h: 6, minW: 3, minH: 4, widget: 'TimelineInstances', title: 'Timeline Instances',  icon: ListTree },
  { i: 'aw10', x: 4,  y: 20, w: 4,  h: 6, minW: 3, minH: 4, widget: 'SubjectInfoPanel',  title: 'Subject Editor',      icon: FileText },
  { i: 'aw11', x: 8,  y: 20, w: 4,  h: 6, minW: 3, minH: 4, widget: 'MediaPreview',      title: 'Media Preview',       icon: ImageIcon },

  { i: 'aw12', x: 0,  y: 26, w: 12, h: 4, minW: 8, minH: 3, widget: 'GlobalTimeline',    title: 'Global Timeline',     icon: ListTree },
];

const AllWidgetsPage: React.FC = () => (
  <div className="h-screen flex bg-[var(--ws-page-bg)]">
    <SideNav />
    <PageShell>
      <WidgetGrid
        className="h-full w-full"
        items={items}
        registry={registry}
        persistKey="all-widgets"
      />
    </PageShell>
  </div>
);

export default AllWidgetsPage;
