// apps/workstation-web/src/lib/content-client.ts
import {
  type ProjectSummary,
  type ContentNodeSchema,
  type ContentNodeNested,
  ProjectsListResponse,
  ProjectResponse,
  NodeResponse,
  ProjectTreeFlatResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateNodeRequest,
  UpdateNodeRequest,
  MoveNodeRequest,
  ReorderSiblingsRequest,
  type MediaClass,
  SuccessResponse,
} from '@hk26/schema';
import { httpTyped } from './http';
import type { z } from 'zod';

// Infer TypeScript types from Zod schemas
type ProjectSummaryType = z.infer<typeof ProjectSummary>;
type ContentNodeType = z.infer<typeof ContentNodeSchema>;
type ContentNodeNestedType = z.infer<typeof ContentNodeNested>;
type CreateProjectRequestType = z.infer<typeof CreateProjectRequest>;
type UpdateProjectRequestType = z.infer<typeof UpdateProjectRequest>;
type CreateNodeRequestType = z.infer<typeof CreateNodeRequest>;
type UpdateNodeRequestType = z.infer<typeof UpdateNodeRequest>;
type MoveNodeRequestType = z.infer<typeof MoveNodeRequest>;
type ReorderSiblingsRequestType = z.infer<typeof ReorderSiblingsRequest>;
type MediaClassType = z.infer<typeof MediaClass>;

// ------------------------------------------------------------------------------
// Projects
// ------------------------------------------------------------------------------

/**
 * List all projects for the current tenant.
 * @returns Array of project summaries.
 */
export async function listProjects(): Promise<ProjectSummaryType[]> {
  const response = await httpTyped('/ws/projects', {
    method: 'GET',
    schema: { res: ProjectsListResponse },
  });
  return response.items;
}

/**
 * Create a new project.
 * @param req Project creation data.
 * @returns Created project schema.
 */
export async function createProject(req: CreateProjectRequestType): Promise<ContentNodeType> {
  const response = await httpTyped('/ws/projects', {
    method: 'POST',
    body: req.body,
    schema: {
      req: CreateProjectRequest.shape.body,
      res: ProjectResponse,
    },
  });
  return response.project;
}

/**
 * Get a single project by ID.
 * @param projectId UUID of the project.
 * @returns Project schema.
 */
export async function getProject(projectId: string): Promise<ContentNodeType> {
  const response = await httpTyped(`/ws/projects/${projectId}`, {
    method: 'GET',
    schema: { res: ProjectResponse },
  });
  return response.project;
}

/**
 * Update a project.
 * @param projectId UUID of the project.
 * @param req Update data.
 * @returns Updated project schema.
 */
export async function updateProject(
  projectId: string,
  req: UpdateProjectRequestType,
): Promise<ContentNodeType> {
  const response = await httpTyped(`/ws/projects/${projectId}`, {
    method: 'PATCH',
    body: req.body,
    schema: {
      req: UpdateProjectRequest.shape.body,
      res: ProjectResponse,
    },
  });
  return response.project;
}

/**
 * Delete a project.
 * @param projectId UUID of the project.
 */
export async function deleteProject(projectId: string): Promise<void> {
  const url = `/ws/projects/${projectId}`;
  await httpTyped(url, {
    method: 'DELETE',
    schema: { res: SuccessResponse },
  });
}

/**
 * Get the full tree structure for a project (flat array with depth).
 * @param projectId UUID of the project.
 * @returns Array of nodes with depth field.
 */
/**
 * Get the project tree (flat list of all nodes).
 * @param projectId UUID of the project.
 * @returns Nested tree structure.
 */
export async function getProjectTree(projectId: string): Promise<ContentNodeNestedType[]> {
  const url = `/ws/projects/${projectId}/tree`;
  const response = await httpTyped(url, {
    method: 'GET',
    schema: { res: ProjectTreeFlatResponse },
  });

  return buildNestedTree(response.items);
}

/**
 * Build nested tree from flat node array.
 * @param flatNodes Flat array of nodes.
 * @returns Root nodes with nested children.
 */
function buildNestedTree(flatNodes: ContentNodeType[]): ContentNodeNestedType[] {
  const nodeMap = new Map<string, ContentNodeNestedType>();
  const roots: ContentNodeNestedType[] = [];

  // First pass: create all nodes with empty children arrays
  for (const node of flatNodes) {
    nodeMap.set(node.nodeId, { ...node, children: [] });
  }

  // Second pass: build parent-child relationships
  for (const node of flatNodes) {
    const nestedNode = nodeMap.get(node.nodeId);
    if (!nestedNode) continue;
    if (node.parentId === null) {
      roots.push(nestedNode);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(nestedNode);
      }
    }
  }

  return roots;
}

/**
 * Apply a template to a project.
 * @param projectId UUID of the project.
 * @param templateId Template ID (e.g., 'series', 'movie', 'podcast').
 * @returns Updated project tree.
 */
/**
 * Apply a template to a project by creating nodes client-side.
 * Templates are now handled entirely in the frontend.
 * This will DELETE all existing children before creating template nodes.
 */
export async function applyTemplate(
  projectId: string,
  templateId: string,
): Promise<ContentNodeType[]> {
  // 1. Get current tree to find all children
  const currentTree = await getProjectTree(projectId);

  // 2. Delete all children (not the project itself)
  if (currentTree.length > 0 && currentTree[0].children) {
    const rootNode = currentTree[0];

    for (const child of rootNode.children) {
      try {
        await deleteNode(child.nodeId);
      } catch {
        // Continue even if delete fails
      }
    }
  }

  // 3. Build template structure based on templateId
  const templateNodes = buildTemplateStructure(projectId, templateId);

  if (templateNodes.length === 0) {
    return [];
  }

  // 4. Create each node via API
  const createdNodes: ContentNodeType[] = [];
  for (let i = 0; i < templateNodes.length; i++) {
    const nodeData = templateNodes[i];

    try {
      const created = await createNode({
        body: {
          parentId: nodeData.parentId,
          nodeType: nodeData.nodeType,
          title: nodeData.title,
          synopsis: nodeData.synopsis,
          position: nodeData.position,
          mediaKindCode: nodeData.mediaKindCode,
        },
      });
      createdNodes.push(created);

      // If this node has children in the template, update their parentId
      if (nodeData.id) {
        for (let j = i + 1; j < templateNodes.length; j++) {
          if (templateNodes[j].parentId === nodeData.id) {
            templateNodes[j].parentId = created.nodeId;
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to create node "${nodeData.title}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return createdNodes;
}

type TemplateNode = {
  id?: string; // Temporary ID for parent reference
  parentId: string;
  nodeType: 'group' | 'content' | 'bonus_content';
  title: string;
  synopsis?: string;
  position: number;
  mediaKindCode?: string;
};

/**
 * Build template structure based on template type.
 */
function buildTemplateStructure(
  projectId: string,
  templateId: string,
): Array<TemplateNode> {
  const templates: Record<string, TemplateNode[]> = {
    series: [
      // Season 1 (group)
      { id: 'season1', parentId: projectId, nodeType: 'group', title: 'Season 1', position: 0 },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 1', position: 0, mediaKindCode: 'episode_video' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 2', position: 1, mediaKindCode: 'episode_video' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 3', position: 2, mediaKindCode: 'episode_video' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 4', position: 3, mediaKindCode: 'episode_video' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 5', position: 4, mediaKindCode: 'episode_video' },

      // Season 2 (group)
      { id: 'season2', parentId: projectId, nodeType: 'group', title: 'Season 2', position: 1 },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 1', position: 0, mediaKindCode: 'episode_video' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 2', position: 1, mediaKindCode: 'episode_video' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 3', position: 2, mediaKindCode: 'episode_video' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 4', position: 3, mediaKindCode: 'episode_video' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 5', position: 4, mediaKindCode: 'episode_video' },

      // Extra folder (group)
      { id: 'extra', parentId: projectId, nodeType: 'group', title: 'Extra', position: 2 },
      { parentId: 'extra', nodeType: 'content', title: 'Trailer 1', position: 0, mediaKindCode: 'trailer' },
      { parentId: 'extra', nodeType: 'content', title: 'Trailer 2', position: 1, mediaKindCode: 'trailer' },
      { parentId: 'extra', nodeType: 'content', title: 'Trailer 3', position: 2, mediaKindCode: 'trailer' },
    ],

    movie: [
      // Main Feature (content)
      { parentId: projectId, nodeType: 'content', title: 'Main Feature', position: 0, mediaKindCode: 'movie' },

      // Trailers folder (group)
      { id: 'trailers', parentId: projectId, nodeType: 'group', title: 'Trailers', position: 1 },
      { parentId: 'trailers', nodeType: 'content', title: 'Trailer 1', position: 0, mediaKindCode: 'trailer' },
      { parentId: 'trailers', nodeType: 'content', title: 'Trailer 2', position: 1, mediaKindCode: 'trailer' },
      { parentId: 'trailers', nodeType: 'content', title: 'Trailer 3', position: 2, mediaKindCode: 'trailer' },
    ],

    podcast: [
      // Season 1 (group)
      { id: 'season1', parentId: projectId, nodeType: 'group', title: 'Season 1', position: 0 },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 1', position: 0, mediaKindCode: 'podcast_episode' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 2', position: 1, mediaKindCode: 'podcast_episode' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 3', position: 2, mediaKindCode: 'podcast_episode' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 4', position: 3, mediaKindCode: 'podcast_episode' },
      { parentId: 'season1', nodeType: 'content', title: 'Episode 5', position: 4, mediaKindCode: 'podcast_episode' },

      // Season 2 (group)
      { id: 'season2', parentId: projectId, nodeType: 'group', title: 'Season 2', position: 1 },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 1', position: 0, mediaKindCode: 'podcast_episode' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 2', position: 1, mediaKindCode: 'podcast_episode' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 3', position: 2, mediaKindCode: 'podcast_episode' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 4', position: 3, mediaKindCode: 'podcast_episode' },
      { parentId: 'season2', nodeType: 'content', title: 'Episode 5', position: 4, mediaKindCode: 'podcast_episode' },
    ],

    audiobook: [
      // 10 chapters (all content, direct children of project)
      { parentId: projectId, nodeType: 'content', title: 'Chapter 1', position: 0, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 2', position: 1, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 3', position: 2, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 4', position: 3, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 5', position: 4, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 6', position: 5, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 7', position: 6, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 8', position: 7, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 9', position: 8, mediaKindCode: 'audiobook_chapter' },
      { parentId: projectId, nodeType: 'content', title: 'Chapter 10', position: 9, mediaKindCode: 'audiobook_chapter' },
    ],

    empty: [],
  };

  return templates[templateId] || [];
}

// ------------------------------------------------------------------------------
// Nodes
// ------------------------------------------------------------------------------

/**
 * Create a child node under a parent.
 * @param req Node creation data.
 * @returns Created node schema.
 */
export async function createNode(req: CreateNodeRequestType): Promise<ContentNodeType> {
  const response = await httpTyped('/ws/nodes', {
    method: 'POST',
    body: req.body,
    schema: {
      req: CreateNodeRequest.shape.body,
      res: NodeResponse,
    },
  });
  return response.node;
}

/**
 * Update a node.
 * @param nodeId UUID of the node.
 * @param req Update data.
 * @returns Updated node schema.
 */
export async function updateNode(nodeId: string, req: UpdateNodeRequestType): Promise<ContentNodeType> {
  const response = await httpTyped(`/ws/nodes/${nodeId}`, {
    method: 'PATCH',
    body: req.body,
    schema: {
      req: UpdateNodeRequest.shape.body,
      res: NodeResponse,
    },
  });
  return response.node;
}

/**
 * Delete a node.
 * @param nodeId UUID of the node.
 */
export async function deleteNode(nodeId: string): Promise<void> {
  const url = `/ws/nodes/${nodeId}`;
  await httpTyped(url, {
    method: 'DELETE',
    schema: { res: SuccessResponse },
  });
}

/**
 * Move a node to a new parent.
 * @param nodeId UUID of the node to move.
 * @param req Move request data.
 * @returns Updated node schema.
 */
export async function moveNode(nodeId: string, req: MoveNodeRequestType): Promise<ContentNodeType> {
  const validated = MoveNodeRequest.parse(req);
  const url = `/ws/nodes/${nodeId}/move`;
  const response = await httpTyped(url, {
    method: 'POST',
    body: validated.body,
    schema: { res: NodeResponse },
  });

  return response.node;
}

/**
 * Reorder siblings in batch.
 * @param req Reorder request with array of { nodeId, position }.
 */
export async function reorderSiblings(req: ReorderSiblingsRequestType): Promise<void> {
  const validated = ReorderSiblingsRequest.parse(req);
  await httpTyped('/ws/nodes/reorder', {
    method: 'POST',
    body: validated.body,
    schema: { res: SuccessResponse },
  });
}

// ------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------

/**
 * Get media class options (all valid values).
 * @returns Array of valid media classes.
 */
export function getMediaClassOptions(): MediaClassType[] {
  return ['video', 'audio', 'image'];
}

// ------------------------------------------------------------------------------
// Compat Aliases (PascalCase) for legacy calls
// ------------------------------------------------------------------------------

export const ListProjects     = listProjects;
export const CreateProject    = createProject;
export const GetProject       = getProject;
export const UpdateProject    = updateProject;
export const DeleteProject    = deleteProject;
export const GetProjectTree   = getProjectTree;
export const ApplyTemplate    = applyTemplate;

export const CreateNode       = createNode;
export const UpdateNode       = updateNode;
export const DeleteNode       = deleteNode;
export const MoveNode         = moveNode;
export const ReorderSiblings  = reorderSiblings;
