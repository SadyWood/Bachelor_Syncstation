// apps/workstation-web/src/widgets/ProjectStructure/ContentTree.tsx
import { createLogger } from '@hoolsy/logger';
import {
  GitBranch, Folder as FolderIcon, Film, Music, FileText,
  ChevronRight, ChevronDown, Pencil, Trash2, FolderTree, GripVertical,
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BaseWidget } from '../../components/WidgetBase/BaseWidget';
import { useContentStore } from '../../lib/use-content-store';
import type { WidgetProps, DropPosition } from '../../types';
import type { ContentNodeNested } from '@workstation/schema';
import type { z } from 'zod';

const logger = createLogger('ContentTree');

type ContentNode = z.infer<typeof ContentNodeNested>;

const DRAG_TYPE = 'CONTENT_NODE';

const KIND_OPTIONS: Array<{ category: string; options: Array<{ value: string; label: string }> }> = [
  {
    category: 'Video',
    options: [
      { value: 'episode_video', label: 'Episode' },
      { value: 'movie', label: 'Movie' },
      { value: 'trailer', label: 'Trailer' },
      { value: 'teaser', label: 'Teaser' },
      { value: 'clip', label: 'Clip' },
      { value: 'featurette', label: 'Featurette' },
      { value: 'behind_the_scenes', label: 'Behind the Scenes' },
      { value: 'interview', label: 'Interview' },
      { value: 'livestream', label: 'Livestream' },
      { value: 'video_other', label: 'Other' },
    ],
  },
  {
    category: 'Audio',
    options: [
      { value: 'podcast_episode', label: 'Podcast' },
      { value: 'song', label: 'Song' },
      { value: 'audiobook_chapter', label: 'Audiobook' },
      { value: 'soundtrack', label: 'Soundtrack' },
      { value: 'audio_trailer', label: 'Audio Trailer' },
      { value: 'audio_other', label: 'Other' },
    ],
  },
  {
    category: 'Image',
    options: [
      { value: 'poster', label: 'Poster' },
      { value: 'thumbnail', label: 'Thumbnail' },
      { value: 'cover', label: 'Cover' },
      { value: 'banner', label: 'Banner' },
      { value: 'still', label: 'Still' },
      { value: 'storyboard', label: 'Storyboard' },
      { value: 'image_other', label: 'Other' },
    ],
  },
];

const getNodeIcon = (node: ContentNode) => {
  if (node.nodeType === 'group') return <FolderIcon size={16} className="text-yellow-500" />;
  const mc = node.mediaClass || 'video';
  if (mc === 'audio') return <Music size={16} className="text-green-600" />;
  if (mc === 'image') return <FileText size={16} className="text-pink-500" />;
  return <Film size={16} className="text-blue-500" />;
};

const getTypeLabel = (node: ContentNode): string => {
  if (node.nodeType === 'group') return 'Group';
  if (node.nodeType === 'bonus_content') return 'Bonus Content';
  for (const cat of KIND_OPTIONS) {
    const opt = cat.options.find(o => o.value === node.mediaKindCode);
    if (opt) return opt.label;
  }
  return 'Content';
};

interface FirstChildDropZoneProps {
  firstChildId: string | null;
  onMoveBefore: (draggedIds: string[], targetId: string) => Promise<void>;
}

function FirstChildDropZone({ firstChildId, onMoveBefore }: FirstChildDropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Track previous isOverCurrent for derived state pattern
  const [wasOverCurrent, setWasOverCurrent] = useState(false);

  const [{ isOverCurrent }, drop] = useDrop(() => ({
    accept: DRAG_TYPE,
    hover: () => {
      setIsOver(true);
    },
    drop: async (item: { nodeIds: string[] }) => {
      if (firstChildId) {
        await onMoveBefore(item.nodeIds, firstChildId);
      }
    },
    collect: (monitor) => ({
      isOverCurrent: monitor.isOver({ shallow: true }),
    }),
  }), [firstChildId, onMoveBefore]);

  // Reset isOver when not hovering (derived state pattern)
  if (wasOverCurrent !== isOverCurrent) {
    setWasOverCurrent(isOverCurrent);
    if (!isOverCurrent) {
      setIsOver(false);
    }
  }

  // Connect drop to ref in effect to satisfy ESLint
  useEffect(() => {
    drop(ref);
  }, [drop]);

  if (!firstChildId) return null;

  return (
    <div
      ref={ref}
      className="relative"
      style={{ height: '12px', marginBottom: '-8px' }}
    >
      {isOver && (
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[var(--ws-brand)] z-10 shadow-lg" />
      )}
    </div>
  );
}

interface NodeRowProps {
  node: ContentNode;
  depth: number;
  expandedIds: Set<string>;
  toggleExpanded: (id: string) => void;
  selectedId: string | null;
  selectedIds: Set<string>;
  onNodeClick: (nodeId: string, event: React.MouseEvent) => void;
  updateNode: (nodeId: string, updates: { title?: string; mediaKind?: string }) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  onDeleteComplete: () => void;
  onMoveInto: (draggedIds: string[], targetId: string) => Promise<void>;
  onMoveBefore: (draggedIds: string[], targetId: string) => Promise<void>;
  onMoveAfter: (draggedIds: string[], targetId: string) => Promise<void>;
}

function NodeRow({
  node,
  depth,
  expandedIds,
  toggleExpanded,
  selectedId,
  selectedIds,
  onNodeClick,
  updateNode,
  deleteNode,
  onDeleteComplete,
  onMoveInto,
  onMoveBefore,
  onMoveAfter,
}: NodeRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(node.title);
  const [dropPosition, setDropPosition] = useState<DropPosition>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  // Track synced title for derived state pattern
  const [syncedTitle, setSyncedTitle] = useState(node.title);

  // Sync value with node.title when it changes (derived state pattern)
  if (syncedTitle !== node.title) {
    setSyncedTitle(node.title);
    setValue(node.title);
  }

  const isExpanded = expandedIds.has(node.nodeId);
  const isSelected = selectedIds.has(node.nodeId);

  // Drag source
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: DRAG_TYPE,
    item: () => {
      const dragIds = selectedIds.has(node.nodeId) && selectedIds.size > 1
        ? Array.from(selectedIds)
        : [node.nodeId];
      return { nodeIds: dragIds };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: !editing,
  }), [node.nodeId, selectedIds, editing]);

  // Drop target with hover detection
  const [{ isOver }, drop] = useDrop(() => ({
    accept: DRAG_TYPE,
    hover: (item: { nodeIds: string[] }, monitor) => {
      if (!ref.current) return;

      // Can't drop on self
      if (item.nodeIds.includes(node.nodeId)) {
        setDropPosition(null);
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) return;

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const hoverHeight = hoverBoundingRect.bottom - hoverBoundingRect.top;

      // Determine drop position based on cursor position
      if (node.nodeType === 'group') {
        // For groups: before (top 25%), inside (middle 50%), after (bottom 25%)
        if (hoverClientY < hoverHeight * 0.25) {
          setDropPosition('before');
        } else if (hoverClientY > hoverHeight * 0.75) {
          setDropPosition('after');
        } else {
          setDropPosition('inside');
        }
      } else if (hoverClientY < hoverHeight * 0.5) {
        // For content: before (top 50%), after (bottom 50%)
        setDropPosition('before');
      } else {
        setDropPosition('after');
      }
    },
    drop: async (item: { nodeIds: string[] }) => {
      if (dropPosition === 'before') {
        await onMoveBefore(item.nodeIds, node.nodeId);
      } else if (dropPosition === 'after') {
        await onMoveAfter(item.nodeIds, node.nodeId);
      } else if (dropPosition === 'inside' && node.nodeType === 'group') {
        await onMoveInto(item.nodeIds, node.nodeId);
      }
      setDropPosition(null);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
  }), [node.nodeId, node.nodeType, dropPosition, onMoveInto, onMoveBefore, onMoveAfter]);

  // Connect drag and drop refs in effect to satisfy ESLint
  useEffect(() => {
    preview(drop(ref));
    drag(dragHandleRef);
  }, [preview, drop, drag]);

  // Track previous isOver state for derived state pattern
  const [wasOver, setWasOver] = useState(false);

  // Reset drop position when not hovering (derived state pattern)
  if (wasOver !== isOver) {
    setWasOver(isOver);
    if (!isOver) {
      setDropPosition(null);
    }
  }

  const saveTitle = async () => {
    setEditing(false);
    const t = value.trim();
    if (t && t !== node.title) {
      await updateNode(node.nodeId, { title: t });
    } else {
      setValue(node.title);
    }
  };

  const onKindChange = async (kind: string) => {
    await updateNode(node.nodeId, { mediaKind: kind });
  };

  return (
    <div className="flex flex-col relative">
      {/* Drop indicator - BEFORE */}
      {dropPosition === 'before' && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-[var(--ws-brand)] z-10 shadow-lg"
          style={{ marginLeft: depth * 20 }} />
      )}

      <div
        ref={ref}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border bg-white transition-all relative
          ${isSelected ? 'border-[var(--ws-brand)] bg-[var(--ws-brand-lighter)] shadow-sm' : 'border-[var(--ws-border-light)] hover:border-[var(--ws-border-medium)]'}
          ${isDragging ? 'opacity-40' : ''}
          ${dropPosition === 'inside' ? 'ring-2 ring-[var(--ws-brand)] bg-[var(--ws-brand-lightest)]' : ''}
        `}
        style={{ marginLeft: depth * 20 }}
        onClick={(e) => onNodeClick(node.nodeId, e)}
      >
        {/* Drag handle */}
        <div
          ref={dragHandleRef}
          className="cursor-move text-gray-400 hover:text-gray-600 flex-shrink-0"
          style={{ cursor: editing ? 'default' : 'move' }}
        >
          <GripVertical size={16} />
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          {node.children && node.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.nodeId);
              }}
              className="p-0.5 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          )}

          {getNodeIcon(node)}

          {editing ? (
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={saveTitle}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') {
                  setValue(node.title);
                  setEditing(false);
                }
              }}
              className="px-2 py-0.5 border border-[var(--ws-brand)] rounded outline-none text-sm flex-1 min-w-0"
            />
          ) : (
            <div
              className="flex flex-col flex-1 min-w-0"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              <span className="font-medium truncate">{node.title}</span>
              <span className="text-xs text-gray-500">{getTypeLabel(node)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {(node.nodeType === 'content' || node.nodeType === 'bonus_content') && (
            <select
              className="text-xs px-2 py-1 border border-[var(--ws-border-medium)] rounded bg-white hover:border-[var(--ws-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--ws-brand)] transition-all shadow-sm min-w-[100px] cursor-pointer"
              value={node.mediaKindCode || 'video_other'}
              onChange={(e) => onKindChange(e.target.value)}
            >
              {KIND_OPTIONS.map((cat) => (
                <optgroup key={cat.category} label={`── ${cat.category} ──`}>
                  {cat.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          )}

          {!editing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="p-1 rounded hover:bg-gray-100 text-gray-600"
            >
              <Pencil size={14} />
            </button>
          )}

          <button
            onClick={async (e) => {
              e.stopPropagation();
              // eslint-disable-next-line no-alert -- User confirmation required for destructive action
              if (confirm(`Delete "${node.title}"?`)) {
                await deleteNode(node.nodeId);
                onDeleteComplete();
              }
            }}
            className="p-1 rounded hover:bg-red-50 text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Drop indicator - AFTER */}
      {dropPosition === 'after' && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--ws-brand)] z-10 shadow-lg"
          style={{ marginLeft: depth * 20 }} />
      )}

      {isExpanded && node.children && node.children.map((child: ContentNode) => (
        <NodeRow
          key={child.nodeId}
          node={child}
          depth={depth + 1}
          expandedIds={expandedIds}
          toggleExpanded={toggleExpanded}
          selectedId={selectedId}
          selectedIds={selectedIds}
          onNodeClick={onNodeClick}
          updateNode={updateNode}
          deleteNode={deleteNode}
          onDeleteComplete={onDeleteComplete}
          onMoveInto={onMoveInto}
          onMoveBefore={onMoveBefore}
          onMoveAfter={onMoveAfter}
        />
      ))}
    </div>
  );
}

export default function ContentTree({ title, onClose, titleIcon }: WidgetProps & { titleIcon?: React.ComponentType<{ size?: number; className?: string }> }) {
  const { currentTree, loadProjectTree, createNode, updateNode, deleteNode, moveNode, reorderSiblings, error } = useContentStore();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { nodeId: string } | null;
      setCurrentProjectId(detail?.nodeId ?? null);
      if (detail?.nodeId) {
        loadProjectTree(detail.nodeId);
      }
    };
    window.addEventListener('project:selected', handler);
    return () => window.removeEventListener('project:selected', handler);
  }, [loadProjectTree]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const findNode = (nodeId: string, nodes: ContentNode[] = currentTree): ContentNode | null => {
    for (const node of nodes) {
      if (node.nodeId === nodeId) return node;
      if (node.children) {
        const found = findNode(nodeId, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const countChildrenByPrefix = (parentNode: ContentNode | null, prefix: string): number => {
    if (!parentNode) return 0;
    return parentNode.children.filter((child: ContentNode) => child.title.startsWith(prefix)).length;
  };

  const getNextTitle = (parentNode: ContentNode | null, prefix: string): string => {
    const count = countChildrenByPrefix(parentNode, prefix);
    return `${prefix} ${count + 1}`;
  };

  // Helper to flatten tree for reordering
  const flattenTree = (nodes: ContentNode[]): ContentNode[] => {
    const result: ContentNode[] = [];
    const visit = (node: ContentNode) => {
      result.push(node);
      if (node.children) {
        node.children.forEach(visit);
      }
    };
    nodes.forEach(visit);
    return result;
  };

  const getAllNodeIds = (nodes: ContentNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (nodeList: ContentNode[]) => {
      for (const node of nodeList) {
        ids.push(node.nodeId);
        if (node.children) traverse(node.children);
      }
    };
    traverse(nodes);
    return ids;
  };

  const rootNode = currentTree.length > 0 ? currentTree[0] : null;

  const addGroup = async () => {
    if (!currentProjectId) return;

    const selectedNode = selectedId ? findNode(selectedId) : null;
    let parentId: string;
    let position: number | undefined;
    let parentNode: ContentNode | null = null;

    if (!selectedNode) {
      // No selection → add to project root
      parentId = currentProjectId;
      parentNode = rootNode;
    } else if (selectedNode.nodeType === 'group') {
      // Group selected → add inside the group
      parentId = selectedNode.nodeId;
      parentNode = selectedNode;
    } else {
      // Content selected → add as sibling (same parent, after this node)
      parentId = selectedNode.parentId || currentProjectId;
      position = selectedNode.position + 1;
      parentNode = selectedNode.parentId ? findNode(selectedNode.parentId) : rootNode;
    }

    const groupTitle = getNextTitle(parentNode, 'Group');
    await createNode(parentId, 'group', groupTitle, undefined, undefined, position);
    loadProjectTree(currentProjectId);
  };

  const addContent = async () => {
    if (!currentProjectId) return;

    const selectedNode = selectedId ? findNode(selectedId) : null;
    let parentId: string;
    let position: number | undefined;
    let parentNode: ContentNode | null = null;

    if (!selectedNode) {
      // No selection → add to project root
      parentId = currentProjectId;
      parentNode = rootNode;
    } else if (selectedNode.nodeType === 'group') {
      // Group selected → add inside the group
      parentId = selectedNode.nodeId;
      parentNode = selectedNode;
    } else {
      // Content selected → add as sibling (same parent, after this node)
      parentId = selectedNode.parentId || currentProjectId;
      position = selectedNode.position + 1;
      parentNode = selectedNode.parentId ? findNode(selectedNode.parentId) : rootNode;
    }

    const contentTitle = getNextTitle(parentNode, 'Content');
    await createNode(parentId, 'content', contentTitle, 'video', 'episode_video', position);
    loadProjectTree(currentProjectId);
  };

  // Multi-select logic
  const handleNodeClick = (nodeId: string, event: React.MouseEvent) => {
    if (event.shiftKey && lastSelectedId) {
      // Shift-click: select range
      const allNodes = getAllNodeIds(currentTree);
      const startIdx = allNodes.indexOf(lastSelectedId);
      const endIdx = allNodes.indexOf(nodeId);

      if (startIdx !== -1 && endIdx !== -1) {
        const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        const rangeIds = allNodes.slice(from, to + 1);
        setSelectedIds(new Set(rangeIds));
        setSelectedId(nodeId);
      }
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd-click: toggle selection
      const newSelected = new Set(selectedIds);
      if (newSelected.has(nodeId)) {
        newSelected.delete(nodeId);
      } else {
        newSelected.add(nodeId);
      }
      setSelectedIds(newSelected);
      setSelectedId(nodeId);
      setLastSelectedId(nodeId);
    } else {
      // Normal click: single select
      setSelectedIds(new Set([nodeId]));
      setSelectedId(nodeId);
      setLastSelectedId(nodeId);

      // Dispatch event for NodeInspector widget
      const selectedNode = findNode(nodeId);
      window.dispatchEvent(new CustomEvent('node:selected', { detail: selectedNode }));
    }
  };

  // Move nodes with react-dnd
  const handleMoveInto = async (draggedIds: string[], targetId: string) => {
    // Take snapshot before operation
    const treeSnapshot = JSON.parse(JSON.stringify(currentTree));

    for (const draggedId of draggedIds) {
      try {
        await moveNode(draggedId, targetId);
      } catch (err) {
        // eslint-disable-next-line no-alert -- Error notification for failed operation
        alert(`Failed to move node: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }
    }

    // Reload tree from server to reflect changes
    if (currentProjectId) {
      try {
        await loadProjectTree(currentProjectId);
      } catch (reloadErr) {
        // eslint-disable-next-line no-alert -- Error notification for failed reload
        alert('Failed to reload tree. The page may be out of sync with the server.');
        // Log original tree for debugging
        logger.error('Tree snapshot before failed reload:', treeSnapshot);
      }
    }
  };

  const handleMoveBefore = async (draggedIds: string[], targetId: string) => {
    const targetNode = findNode(targetId);
    if (!targetNode) {
      return;
    }

    if (!targetNode.parentId) {
      // Cannot move nodes before root-level nodes
      // eslint-disable-next-line no-alert -- User notification for invalid operation
      alert('Cannot move nodes before root projects. Please drag within a project instead.');
      return;
    }

    const { parentId } = targetNode;

    // Take snapshot before operation
    const treeSnapshot = JSON.parse(JSON.stringify(currentTree));

    // Capture current sibling order BEFORE moving
    const allNodesBefore = flattenTree(currentTree);
    const siblingsBefore = allNodesBefore.filter(n => n.parentId === parentId);

    // Move all nodes to target's parent
    for (const draggedId of draggedIds) {
      try {
        await moveNode(draggedId, parentId);
      } catch (err) {
        // eslint-disable-next-line no-alert -- Error notification for failed operation
        alert(`Failed to move node: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }
    }

    // Build new order: place draggedIds before targetId
    // Use the BEFORE state to know original positions
    const filtered = siblingsBefore
      .map(n => n.nodeId)
      .filter(id => !draggedIds.includes(id));

    // Find target index and insert dragged nodes before it
    const targetIndex = filtered.findIndex(id => id === targetId);
    if (targetIndex === -1) {
      // Fallback: just reload
      if (currentProjectId) {
        try {
          await loadProjectTree(currentProjectId);
        } catch (reloadErr) {
          // eslint-disable-next-line no-alert -- Error notification for failed reload
          alert('Failed to reload tree after partial move.');
        }
      }
      return;
    }

    const reordered = [
      ...filtered.slice(0, targetIndex),
      ...draggedIds,
      ...filtered.slice(targetIndex),
    ];

    // Apply new order
    try {
      await reorderSiblings(parentId, reordered);
    } catch (err) {
      // eslint-disable-next-line no-alert -- Error notification for failed reorder
      alert(`Failed to reorder nodes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Final reload to reflect new positions
    if (currentProjectId) {
      try {
        await loadProjectTree(currentProjectId);
      } catch (reloadErr) {
        // eslint-disable-next-line no-alert -- Error notification for failed reload
        alert('Failed to reload tree. The page may be out of sync with the server.');
        // Log original tree for debugging
        logger.error('Tree snapshot before failed reload:', treeSnapshot);
      }
    }
  };

  const handleMoveAfter = async (draggedIds: string[], targetId: string) => {
    const targetNode = findNode(targetId);
    if (!targetNode) {
      return;
    }

    if (!targetNode.parentId) {
      // Cannot move nodes after root-level nodes
      // eslint-disable-next-line no-alert -- User notification for invalid operation
      alert('Cannot move nodes after root projects. Please drag within a project instead.');
      return;
    }

    const { parentId } = targetNode;

    // Take snapshot before operation
    const treeSnapshot = JSON.parse(JSON.stringify(currentTree));

    // Capture current sibling order BEFORE moving
    const allNodesBefore = flattenTree(currentTree);
    const siblingsBefore = allNodesBefore.filter(n => n.parentId === parentId);

    // Move all nodes to target's parent
    for (const draggedId of draggedIds) {
      try {
        await moveNode(draggedId, parentId);
      } catch (err) {
        // eslint-disable-next-line no-alert -- Error notification for failed operation
        alert(`Failed to move node: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return;
      }
    }

    // Build new order: place draggedIds after targetId
    const filtered = siblingsBefore
      .map(n => n.nodeId)
      .filter(id => !draggedIds.includes(id));

    // Find target index and insert dragged nodes after it
    const targetIndex = filtered.findIndex(id => id === targetId);
    if (targetIndex === -1) {
      // Fallback: just reload
      if (currentProjectId) {
        try {
          await loadProjectTree(currentProjectId);
        } catch (reloadErr) {
          // eslint-disable-next-line no-alert -- Error notification for failed reload
          alert('Failed to reload tree after partial move.');
        }
      }
      return;
    }

    const reordered = [
      ...filtered.slice(0, targetIndex + 1),
      ...draggedIds,
      ...filtered.slice(targetIndex + 1),
    ];

    // Apply new order
    try {
      await reorderSiblings(parentId, reordered);
    } catch (err) {
      // eslint-disable-next-line no-alert -- Error notification for failed reorder
      alert(`Failed to reorder nodes: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Final reload to reflect new positions
    if (currentProjectId) {
      try {
        await loadProjectTree(currentProjectId);
      } catch (reloadErr) {
        // eslint-disable-next-line no-alert -- Error notification for failed reload
        alert('Failed to reload tree. The page may be out of sync with the server.');
        // Log original tree for debugging
        logger.error('Tree snapshot before failed reload:', treeSnapshot);
      }
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <BaseWidget title={title || 'Content Tree'} onClose={onClose} titleIcon={titleIcon || GitBranch}>
        <div className="p-4 h-full flex flex-col gap-3">
          {error && (
            <div className="ws-alert ws-alert-danger text-xs">
              {error}
            </div>
          )}

          {!currentProjectId ? (
            <div className="ws-empty flex-1">
              <FolderTree size={24} className="opacity-60" />
              <div className="text-sm font-medium">No project selected</div>
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    className="ws-btn ws-btn-sm ws-btn-outline"
                    onClick={addGroup}
                  >
                    <FolderIcon size={14} />
                    Group
                  </button>
                  <button
                    className="ws-btn ws-btn-sm ws-btn-outline"
                    onClick={addContent}
                  >
                    <Film size={14} />
                    Content
                  </button>
                </div>

                {selectedIds.size > 1 && (
                  <div className="text-xs text-[var(--ws-brand)] font-medium">
                    {selectedIds.size} selected
                  </div>
                )}
              </div>

              {/* Tree */}
              <div className="flex-1 overflow-auto ws-scroll-y space-y-1">
                {!rootNode || (rootNode.children && rootNode.children.length === 0) ? (
                  <div className="ws-empty" style={{ minHeight: 300 }}>
                    <FolderIcon size={32} className="text-gray-300" />
                    <div className="text-sm font-medium">Empty Project</div>
                    <div className="text-xs ws-muted max-w-xs">
                      Use the buttons above to add groups and content
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Drop zone before first child */}
                    <FirstChildDropZone
                      firstChildId={rootNode.children && rootNode.children.length > 0 ? rootNode.children[0].nodeId : null}
                      onMoveBefore={handleMoveBefore}
                    />
                    {rootNode.children && rootNode.children.map((child: ContentNode) => (
                      <NodeRow
                        key={child.nodeId}
                        node={child}
                        depth={0}
                        expandedIds={expandedIds}
                        toggleExpanded={toggleExpanded}
                        selectedId={selectedId}
                        selectedIds={selectedIds}
                        onNodeClick={handleNodeClick}
                        updateNode={updateNode}
                        deleteNode={deleteNode}
                        onDeleteComplete={() => {
                          if (currentProjectId) {
                            loadProjectTree(currentProjectId);
                          }
                        }}
                        onMoveInto={handleMoveInto}
                        onMoveBefore={handleMoveBefore}
                        onMoveAfter={handleMoveAfter}
                      />
                    ))}
                  </>
                )}
              </div>

              <div className="ws-alert ws-alert-info text-xs">
                <strong>Tip:</strong> Drag the grip handle to move • Shift+Click for range select • Ctrl/Cmd+Click for multi-select
              </div>
            </>
          )}
        </div>
      </BaseWidget>
    </DndProvider>
  );
}
