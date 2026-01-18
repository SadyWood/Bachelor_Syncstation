// apps/workstation-web/src/widgets/ContentDashboard/ProjectBrowser.tsx
import { createLogger } from '@hoolsy/logger';
import { FolderTree, ChevronRight, ChevronDown, Folder, FileText, Film, Box } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { listProjects, getProjectTree } from '../../lib/content-client';
import {
  EVENT_NAMES,
  addTypedEventListener,
  dispatchNodeSelected,
  type SelectNodeByIdEvent,
} from '../../lib/events';
import type { WidgetProps } from '../../components/WidgetBase/WidgetTypes';
import type { ContentNode, ContentNodeNestedT, ProjectSummary } from '@workstation/schema';
import type { z } from 'zod';

const logger = createLogger('ProjectBrowser');

type ProjectSummaryType = z.infer<typeof ProjectSummary>;

interface TreeNode extends ContentNode {
  children?: TreeNode[];
}

// Pure functions moved outside component for stable references
function convertToTreeNode(node: ContentNodeNestedT): TreeNode {
  return {
    ...node,
    children: node.children ? node.children.map(convertToTreeNode) : undefined,
  };
}

/**
 * Build a flat Map of all nodes for O(1) lookups
 * Returns: { nodeMap, parentMap }
 */
function buildNodeMaps(tree: TreeNode[]): {
  nodeMap: Map<string, TreeNode>;
  parentMap: Map<string, string[]>; // nodeId -> path of parent IDs
} {
  const nodeMap = new Map<string, TreeNode>();
  const parentMap = new Map<string, string[]>();

  function traverse(nodes: TreeNode[], parentPath: string[] = []) {
    for (const node of nodes) {
      nodeMap.set(node.nodeId, node);
      parentMap.set(node.nodeId, parentPath);
      if (node.children) {
        traverse(node.children, [...parentPath, node.nodeId]);
      }
    }
  }

  traverse(tree);
  return { nodeMap, parentMap };
}

export default function ProjectBrowser({ title, onClose }: Omit<WidgetProps, 'id'>) {
  // Fetch projects with useSWR - automatic caching and revalidation
  const {
    data: projects = [],
    error: swrError,
    isLoading,
  } = useSWR<ProjectSummaryType[]>('/api/projects', listProjects, {
    revalidateOnFocus: false, // Don't refetch on window focus
    dedupingInterval: 60000, // Dedupe requests within 60s
  });

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [projectTrees, setProjectTrees] = useState<Map<string, TreeNode[]>>(new Map());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Convert SWR error to string for display
  let error: string | null = null;
  if (swrError) {
    error = swrError instanceof Error ? swrError.message : 'Failed to load projects';
  }

  const toggleProject = useCallback(async (project: ProjectSummaryType) => {
    const projectId = project.nodeId;
    const isExpanded = expandedProjects.has(projectId);

    if (isExpanded) {
      const newExpanded = new Set(expandedProjects);
      newExpanded.delete(projectId);
      setExpandedProjects(newExpanded);
    } else {
      if (!projectTrees.has(projectId)) {
        try {
          const nestedTree = await getProjectTree(projectId);
          // Convert ContentNodeNested[] to TreeNode[]
          const tree = nestedTree.map(convertToTreeNode);
          setProjectTrees(new Map(projectTrees).set(projectId, tree));
        } catch (err) {
          logger.error('Failed to load project tree', err);
          return;
        }
      }

      const newExpanded = new Set(expandedProjects);
      newExpanded.add(projectId);
      setExpandedProjects(newExpanded);
    }
  }, [expandedProjects, projectTrees]);

  // selectNodeById wrapped in useCallback for stable reference
  // Uses O(1) Map lookups instead of O(n²) tree traversal
  const selectNodeById = useCallback(async (nodeId: string) => {
    logger.debug('selectNodeById called', { nodeId, projectsCount: projects.length });

    // Wait for projects to load
    if (projects.length === 0) {
      logger.warn('selectNodeById - no projects loaded yet, waiting...');
      return;
    }

    // First, check if nodeId is a project
    const project = projects.find(p => p.nodeId === nodeId);
    if (project) {
      logger.debug(`selectNodeById - found project: ${project.title}`);
      await toggleProject(project);
      setSelectedNodeId(nodeId);
      dispatchNodeSelected({ nodeId: project.nodeId, title: project.title });
      return;
    }

    // Search through all project trees to find the node using Maps
    for (const proj of projects) {
      const projectId = proj.nodeId;

      // Load tree if not already loaded
      if (!projectTrees.has(projectId)) {
        try {
          const nestedTree = await getProjectTree(projectId);
          const tree = nestedTree.map(convertToTreeNode);
          const newTrees = new Map(projectTrees);
          newTrees.set(projectId, tree);
          setProjectTrees(newTrees);

          // Build maps for O(1) lookup
          const { nodeMap, parentMap } = buildNodeMaps(tree);
          const foundNode = nodeMap.get(nodeId);

          if (foundNode) {
            logger.debug('selectNodeById - found node in tree', {
              nodeId: foundNode.nodeId,
              title: foundNode.title,
              nodeType: foundNode.nodeType,
              projectId,
            });

            // Expand project and all parent nodes
            const newExpanded = new Set(expandedProjects);
            newExpanded.add(projectId);
            const pathToNode = parentMap.get(nodeId) || [];
            logger.debug('selectNodeById - expanding parents', { pathToNode });
            pathToNode.forEach(id => newExpanded.add(id));
            setExpandedProjects(newExpanded);

            // Select the node
            setSelectedNodeId(nodeId);
            dispatchNodeSelected({ nodeId: foundNode.nodeId, title: foundNode.title });
            logger.debug('selectNodeById - dispatched NODE_SELECTED');
            return;
          }
        } catch {
          continue;
        }
      } else {
        const tree = projectTrees.get(projectId);
        if (tree) {
          // Build maps for O(1) lookup
          const { nodeMap, parentMap } = buildNodeMaps(tree);
          const foundNode = nodeMap.get(nodeId);

          if (foundNode) {
            logger.debug('selectNodeById - found node in tree', {
              nodeId: foundNode.nodeId,
              title: foundNode.title,
              nodeType: foundNode.nodeType,
              projectId,
            });

            // Expand project and all parent nodes
            const newExpanded = new Set(expandedProjects);
            newExpanded.add(projectId);
            const pathToNode = parentMap.get(nodeId) || [];
            logger.debug('selectNodeById - expanding parents', { pathToNode });
            pathToNode.forEach(id => newExpanded.add(id));
            setExpandedProjects(newExpanded);

            // Select the node
            setSelectedNodeId(nodeId);
            dispatchNodeSelected({ nodeId: foundNode.nodeId, title: foundNode.title });
            logger.debug('selectNodeById - dispatched NODE_SELECTED');
            return;
          }
        }
      }
    }

    // Node not found in any project
    logger.warn('selectNodeById - node not found in any project', {
      nodeId,
      searchedProjects: projects.map(p => ({ id: p.nodeId, title: p.title })),
    });
  }, [projects, projectTrees, expandedProjects, toggleProject]);

  // Listen for external node selection requests (from URL)
  useEffect(() => addTypedEventListener<SelectNodeByIdEvent>(
    EVENT_NAMES.SELECT_NODE_BY_ID,
    async (e) => {
      const { nodeId } = e.detail;
      if (nodeId) {
        await selectNodeById(nodeId);
      }
    },
  ), [projects, projectTrees, selectNodeById]);

  function handleNodeClick(node: TreeNode) {
    logger.debug('handleNodeClick called', {
      nodeId: node.nodeId,
      title: node.title,
      nodeType: node.nodeType,
      hasChildren: !!(node.children && node.children.length > 0),
    });
    setSelectedNodeId(node.nodeId);
    dispatchNodeSelected({ nodeId: node.nodeId, title: node.title });
  }

  function renderNode(node: TreeNode, depth: number = 0): React.ReactNode {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedProjects.has(node.nodeId);
    const isSelected = node.nodeId === selectedNodeId;

    return (
      <div key={node.nodeId}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer rounded hover:bg-gray-100 ${isSelected ? 'bg-blue-50 text-blue-600' : ''}`}
          style={{ paddingLeft: `${(depth * 16) + 8}px` }}
          onClick={() => {
            handleNodeClick(node);
            if (hasChildren) {
              if (isExpanded) {
                const newExpanded = new Set(expandedProjects);
                newExpanded.delete(node.nodeId);
                setExpandedProjects(newExpanded);
              } else {
                const newExpanded = new Set(expandedProjects);
                newExpanded.add(node.nodeId);
                setExpandedProjects(newExpanded);
              }
            }
          }}
        >
          {hasChildren && (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
          {!hasChildren && <div style={{ width: 14 }} />}
          {getNodeIcon(node.nodeType)}
          <span className="flex-1 truncate">{node.title}</span>
        </div>
        {isExpanded && hasChildren && node.children && <div>{node.children.map(child => renderNode(child, depth + 1))}</div>}
      </div>
    );
  }

  return (
    <BaseWidget title={title || 'Content Browser'} onClose={onClose} titleIcon={FolderTree}>
      <div className="p-3 h-full flex flex-col gap-3">
        {error && <div className="ws-alert ws-alert-danger text-xs">{error}</div>}
        {isLoading && <div className="ws-alert ws-alert-info text-xs">Loading projects...</div>}
        {!isLoading && <div className="text-xs ws-muted">{projects.length} project{projects.length !== 1 ? 's' : ''}</div>}

        <div className="flex-1 overflow-auto ws-scroll-y">
          {projects.map(project => {
            const isExpanded = expandedProjects.has(project.nodeId);
            const tree = projectTrees.get(project.nodeId) || [];

            return (
              <div key={project.nodeId} className="mb-2">
                <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium cursor-pointer rounded hover:bg-gray-100" onClick={() => toggleProject(project)}>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Folder size={14} className="text-blue-500" />
                  <span className="flex-1 truncate">{project.title}</span>
                </div>
                {isExpanded && (
                  <div className="mt-1">
                    {tree.length === 0 ? <div className="px-4 py-2 text-xs ws-muted">No content</div> : tree.map(node => renderNode(node, 1))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </BaseWidget>
  );
}

function getNodeIcon(nodeType: string) {
  switch (nodeType) {
    case 'group': return <Folder size={14} className="text-amber-500" />;
    case 'content': return <FileText size={14} className="text-green-500" />;
    case 'bonus_content': return <Film size={14} className="text-purple-500" />;
    default: return <Box size={14} className="text-gray-400" />;
  }
}
