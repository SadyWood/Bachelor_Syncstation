// apps/workstation-web/src/widgets/ProjectStructure/ProjectMeta.tsx
import { Save, Trash2, FolderTree } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { useContentStore } from '../../lib/use-content-store';
import { slugify } from '../../utils/slugify';
import type { WidgetProps } from '../../types';
import type { ContentNodeSchema } from '@workstation/schema';
import type { z } from 'zod';

type ContentNode = z.infer<typeof ContentNodeSchema>;

export default function ProjectMeta({ title, onClose, titleIcon }: WidgetProps & { titleIcon?: React.ComponentType<{ size?: number; className?: string }> }) {
  const { currentProject, updateProject, deleteProject, loadProjects } = useContentStore();
  const [project, setProject] = useState<ContentNode | null>(null);
  const [name, setName] = useState('');
  const [synopsis, setSynopsis] = useState('');
  // Track which project we've synced to (state-based pattern)
  const [syncedToId, setSyncedToId] = useState<string | null>(null);

  // Listen for custom event from other parts of the app
  useEffect(() => {
    const handler = (e: Event) => {
      const p = (e as CustomEvent).detail as ContentNode | null;
      setProject(p);
      setName(p?.title ?? '');
      setSynopsis(p?.synopsis ?? '');
    };
    window.addEventListener('project:selected', handler);
    return () => window.removeEventListener('project:selected', handler);
  }, []);

  // Sync with current project from store (derived state pattern)
  const currentProjectId = currentProject?.nodeId ?? null;
  if (syncedToId !== currentProjectId && currentProject) {
    setSyncedToId(currentProjectId);
    setProject(currentProject);
    setName(currentProject.title);
    setSynopsis(currentProject.synopsis ?? '');
  }

  const save = async () => {
    if (!project) return;
    await updateProject(project.nodeId, {
      title: name.trim() || project.title,
      synopsis: synopsis || undefined,
    });
    await loadProjects();
  };

  const remove = async () => {
    if (!project) return;
    // eslint-disable-next-line no-alert -- User confirmation required for destructive action
    if (!confirm(`Delete project "${project.title}"?`)) return;
    await deleteProject(project.nodeId);
    setProject(null);
    window.dispatchEvent(new CustomEvent('project:selected', { detail: null }));
  };

  return (
    <BaseWidget title={title || 'Project Info'} onClose={onClose} titleIcon={titleIcon || FolderTree}>
      <div className="p-4 space-y-3">
        {!project ? (
          <div className="ws-empty">
            <FolderTree size={24} className="opacity-60" />
            <div className="text-sm font-medium">No project selected</div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Title</label>
              <input
                className="ws-input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Slug: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  {slugify(name || '') || 'project-slug'}
                </span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Synopsis</label>
              <textarea
                className="ws-input w-full min-h-[90px]"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Brief description..."
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button className="ws-btn ws-btn-sm ws-btn-solid" onClick={save}>
                <Save size={14} />
                <span>Save</span>
              </button>
              <button className="ws-btn ws-btn-sm ws-btn-soft ws-danger" onClick={remove}>
                <Trash2 size={14} />
                <span>Delete Project</span>
              </button>
            </div>
          </>
        )}
      </div>
    </BaseWidget>
  );
}
