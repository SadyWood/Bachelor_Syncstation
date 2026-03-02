// apps/workstation-web/src/widgets/ProjectStructure/ProjectTemplates.tsx
import React, { useEffect, useState } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { useContentStore } from '../../lib/use-content-store';
import type { WidgetProps, TemplateType } from '../../types';
import type { ContentNodeSchema } from '@hk26/schema';
import type { z } from 'zod';

type ContentNode = z.infer<typeof ContentNodeSchema>;

const TEMPLATES: Array<{ value: TemplateType; label: string; description: string }> = [
  {
    value: 'series',
    label: 'TV Series',
    description: '2 Seasons (5 episodes each) + Extra folder with trailers',
  },
  { value: 'movie', label: 'Movie', description: '1 Movie + Trailers folder (3 trailers)' },
  { value: 'podcast', label: 'Podcast', description: '2 Seasons with 5 audio episodes each' },
  { value: 'audiobook', label: 'Audiobook', description: '10 audio chapters' },
  { value: 'empty', label: 'Empty', description: 'Start from scratch' },
];

export default function ProjectTemplates({
  title,
  onClose,
  titleIcon,
}: WidgetProps & { titleIcon?: React.ComponentType<{ size?: number; className?: string }> }) {
  const { currentProject, applyTemplate, loadProjectTree } = useContentStore();
  const [project, setProject] = useState<ContentNode | null>(null);
  const [tpl, setTpl] = useState<TemplateType>('series');

  // Track which project we've synced to (state-based pattern)
  const [syncedToId, setSyncedToId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as ContentNode | null;
      setProject(p);
    };
    window.addEventListener('project:selected', handler);
    return () => window.removeEventListener('project:selected', handler);
  }, []);

  // Sync with store (derived state pattern)
  const currentProjectId = currentProject?.nodeId ?? null;
  if (syncedToId !== currentProjectId && currentProject) {
    setSyncedToId(currentProjectId);
    setProject(currentProject);
  }

  const apply = async () => {
    if (!project) {
      // eslint-disable-next-line no-alert -- User notification for missing project
      alert('No project selected');
      return;
    }

    // Don't confirm for empty template

    if (
      tpl !== 'empty' &&
      !confirm(`Apply "${tpl}" template? This will add nodes to the project.`)
    ) {
      return;
    }

    try {
      await applyTemplate(project.nodeId, tpl);
      // Reload tree to show changes
      await loadProjectTree(project.nodeId);
      // eslint-disable-next-line no-alert -- User notification for success
      alert('Template applied successfully!');
    } catch (error) {
      // eslint-disable-next-line no-alert -- User notification for error
      alert(`Failed to apply template: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <BaseWidget title={title || 'Templates'} onClose={onClose} titleIcon={titleIcon}>
      <div className="p-3 space-y-2">
        {/* ... */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {/* kortene: p-2, text-xs */}
          {TEMPLATES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTpl(t.value)}
              className={`p-2 border rounded-lg text-left text-xs ${tpl === t.value ? 'border-blue-500 bg-blue-50' : 'border-[var(--ws-border-light)] hover:border-[var(--ws-border-medium)] bg-white'}`}
            >
              <div className="font-semibold">{t.label}</div>
              <div className="ws-muted">{t.description}</div>
            </button>
          ))}
        </div>
        <button className="ws-btn ws-btn-xs ws-btn-solid w-full" onClick={apply}>
          Apply Template
        </button>
      </div>
    </BaseWidget>
  );
}
