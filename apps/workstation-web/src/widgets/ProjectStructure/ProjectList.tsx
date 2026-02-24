// apps/workstation-web/src/widgets/ProjectStructure/ProjectList.tsx
import { FolderTree, Search, Plus, Folder as FolderIcon } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { useContentStore } from '../../lib/use-content-store';
import { slugify } from '../../utils/slugify';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';

export default function ProjectList({
  title,
  onClose,
  titleIcon,
}: WidgetProps & { titleIcon?: React.ComponentType<{ size?: number; className?: string }> }) {
  const { projects, isLoading, error, loadProjects, createProject } = useContentStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filtered = useMemo(
    () =>
      projects.filter(
        (r) => !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [projects, searchQuery],
  );

  const handleCreateNew = async () => {
    const projectTitle = 'Untitled Project';
    const projectSlug = slugify(projectTitle);
    await createProject(projectTitle, undefined, projectSlug, 'empty');
    // Reload to get the new project
    await loadProjects();
  };

  const handleSelect = (project: (typeof projects)[0]) => {
    window.dispatchEvent(new CustomEvent('project:selected', { detail: project }));
  };

  return (
    <BaseWidget title={title || 'Projects'} onClose={onClose} titleIcon={titleIcon || FolderTree}>
      <div className="p-3 h-full flex flex-col gap-3">
        {/* Error display */}
        {error && <div className="ws-alert ws-alert-danger text-xs">{error}</div>}

        {/* Search + New button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              className="ws-input w-full pl-8 text-sm"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="ws-btn ws-btn-sm ws-btn-solid"
            onClick={handleCreateNew}
            title="Create new project"
            disabled={isLoading}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Project count */}
        <div className="text-xs ws-muted">
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto ws-scroll-y space-y-2">
          {filtered.length === 0 ? (
            <div className="ws-empty" style={{ minHeight: 200 }}>
              <FolderIcon size={24} className="opacity-60" />
              <div className="text-sm font-medium">
                {searchQuery ? 'No matches' : 'No projects yet'}
              </div>
              <button className="ws-btn ws-btn-sm ws-btn-solid mt-2" onClick={handleCreateNew}>
                <Plus size={14} />
                Create Project
              </button>
            </div>
          ) : (
            filtered.map((p) => (
              <div
                key={p.nodeId}
                className="ws-block ws-block-interactive p-3 cursor-pointer"
                onClick={() => handleSelect(p)}
              >
                <div className="flex items-center gap-2">
                  <FolderIcon size={16} className="text-yellow-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-xs ws-muted">
                      {p.childrenCount} node{p.childrenCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="ws-alert ws-alert-info text-xs">Click a project to edit its structure</div>
      </div>
    </BaseWidget>
  );
}
