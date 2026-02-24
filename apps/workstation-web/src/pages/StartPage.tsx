// src/pages/StartPage/StartPage.tsx - Working version
import { BookOpen, Clock, Zap, BarChart3, LineChart } from 'lucide-react';
import React from 'react';
import PageShell from '../components/Layout/PageShell';
import SideNav from '../components/Layout/SideNav';
import { WidgetGrid } from '../components/WidgetBase/WidgetGrid';
import {
  AnalyticsDashboard,
  PerformanceMetrics,
  QuickActions,
  SubjectEditor,
  Timeline,
} from '../widgets';
import type { GridItemMeta, WidgetRegistry } from '../types';

const registry: WidgetRegistry = {
  SubjectEditor,
  Timeline,
  QuickActions,
  AnalyticsDashboard,
  PerformanceMetrics,
};

const items: GridItemMeta[] = [
  {
    i: 'w0',
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    minW: 2,
    minH: 3,
    widget: 'SubjectEditor',
    title: 'Subject Editor',
    icon: BookOpen,
  },
  {
    i: 'w1',
    x: 6,
    y: 0,
    w: 6,
    h: 4,
    minW: 2,
    minH: 3,
    widget: 'AnalyticsDashboard',
    title: 'Analytics Dashboard',
    icon: BarChart3,
  },
  {
    i: 'w2',
    x: 0,
    y: 4,
    w: 4,
    h: 5,
    minW: 2,
    minH: 4,
    widget: 'Timeline',
    title: "Today's Timeline",
    icon: Clock,
  },
  {
    i: 'w3',
    x: 4,
    y: 4,
    w: 4,
    h: 3,
    minW: 2,
    minH: 3,
    widget: 'QuickActions',
    title: 'Quick Actions',
    icon: Zap,
  },
  {
    i: 'w4',
    x: 8,
    y: 4,
    w: 4,
    h: 3,
    minW: 2,
    minH: 3,
    widget: 'PerformanceMetrics',
    title: 'Performance Metrics',
    icon: LineChart,
  },
];

export default function StartPage() {
  return (
    <div className="h-screen flex bg-[var(--ws-page-bg)]">
      <SideNav />
      <PageShell>
        <WidgetGrid
          className="h-full w-full"
          items={items}
          registry={registry}
          persistKey="start-working"
        />
      </PageShell>
    </div>
  );
}
