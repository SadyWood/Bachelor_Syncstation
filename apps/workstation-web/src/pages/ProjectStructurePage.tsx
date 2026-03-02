// apps/workstation-web/src/pages/ProjectStructurePage.tsx
import React from 'react';
import PageShell from '../components/Layout/PageShell';
import SideNav from '../components/Layout/SideNav';
import { WidgetGrid } from '../components/WidgetBase/WidgetGrid';
import { ProjectList, ContentTree, ProjectMeta, ProjectTemplates, NodeInspector } from '../widgets';
import type { GridItemMeta, WidgetRegistry } from '../types';

const registry: WidgetRegistry = {
  ProjectList,
  ContentTree,
  ProjectMeta,
  ProjectTemplates,
  NodeInspector,
};

// Ny layout: venstre kolonne ProjectList, midten ContentTree, høyre ProjectMeta (stor) + ProjectTemplates (liten) + NodeInspector
const items: GridItemMeta[] = [
  {
    i: 'project-list',
    x: 0,
    y: 0,
    w: 3,
    h: 12,
    minW: 2,
    minH: 6,
    widget: 'ProjectList',
    title: 'Projects',
  },
  {
    i: 'content-tree',
    x: 3,
    y: 0,
    w: 6,
    h: 12,
    minW: 4,
    minH: 8,
    widget: 'ContentTree',
    title: 'Content Tree',
  },
  {
    i: 'project-meta',
    x: 9,
    y: 0,
    w: 3,
    h: 7,
    minW: 2,
    minH: 4,
    widget: 'ProjectMeta',
    title: 'Project Details',
  },
  {
    i: 'project-templates',
    x: 9,
    y: 7,
    w: 3,
    h: 5,
    minW: 2,
    minH: 2,
    widget: 'ProjectTemplates',
    title: 'Templates',
  },
  {
    i: 'node-inspector',
    x: 0,
    y: 12,
    w: 4,
    h: 9,
    minW: 2,
    minH: 4,
    widget: 'NodeInspector',
    title: 'Node Inspector',
  },
];

export default function ProjectStructurePage() {
  return (
    <div className="h-screen flex bg-[var(--ws-page-bg)]">
      <SideNav />
      <PageShell>
        {/* Updated persistKey with NodeInspector */}
        <WidgetGrid
          className="h-full w-full"
          items={items}
          registry={registry}
          persistKey="project-structure-with-node-inspector-v1"
        />
      </PageShell>
    </div>
  );
}
