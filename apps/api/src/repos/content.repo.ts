// apps/api/src/repos/content.repo.ts
import { ContentNodeSchema, ProjectSummary, type NodeTypeT, type ContentNode } from '@hk26/schema';
import { and, eq, isNull, sql, desc, asc, inArray } from 'drizzle-orm';
import { dbWs, schema } from '../db.js';

/* ========================================
   HELPER: Map DB row to Schema
   ======================================== */

type ContentNodeRow = {
  node_id: string;
  tenant_id: string;
  parent_id: string | null;
  node_type: NodeTypeT;
  title: string;
  synopsis: string | null;
  slug: string | null;
  position: number | null;
  media_kind_code?: string | null;
  media_class_code?: string | null;
  datalake_path?: string | null;
  created_at: Date | null;
  updated_at: Date | null;
};

function mapRowToDto(row: ContentNodeRow): ContentNode {
  return ContentNodeSchema.parse({
    nodeId: row.node_id,
    tenantId: row.tenant_id,
    parentId: row.parent_id,
    nodeType: row.node_type,
    title: row.title,
    synopsis: row.synopsis ?? undefined,
    slug: row.slug ?? undefined,
    position: row.position,
    mediaKindCode: row.media_kind_code ?? undefined,
    mediaClass: row.media_class_code ?? undefined, // media_class_code is the enum value
    datalakePath: row.datalake_path ?? undefined,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  });
}

/* ========================================
   PROJECTS (root nodes with parent_id = NULL)
   ======================================== */

/**
 * List all projects (roots) for a tenant.
 */
export async function listProjects(tenantId: string) {
  const rows = await dbWs
    .select({
      node_id: schema.contentNodes.nodeId,
      tenant_id: schema.contentNodes.tenantId,
      parent_id: schema.contentNodes.parentId,
      node_type: schema.contentNodes.nodeType,
      title: schema.contentNodes.title,
      synopsis: schema.contentNodes.synopsis,
      slug: schema.contentNodes.slug,
      position: schema.contentNodes.position,
      created_at: schema.contentNodes.createdAt,
      updated_at: schema.contentNodes.updatedAt,
      // Count all descendants (excluding self) using closure table
      children_count: sql<number>`(
        SELECT COUNT(*)::int 
        FROM ${schema.contentClosure} cc
        WHERE cc.ancestor_id = ${schema.contentNodes.nodeId}
          AND cc.descendant_id != ${schema.contentNodes.nodeId}
      )`.as('children_count'),
    })
    .from(schema.contentNodes)
    .where(and(eq(schema.contentNodes.tenantId, tenantId), isNull(schema.contentNodes.parentId)))
    .orderBy(desc(schema.contentNodes.createdAt));

  return rows.map((row) =>
    ProjectSummary.parse({
      nodeId: row.node_id,
      title: row.title,
      synopsis: row.synopsis ?? undefined, // Convert null to undefined for optional field
      slug: row.slug,
      childrenCount: row.children_count,
      createdAt: row.created_at?.toISOString(),
    }),
  );
}

/**
 * Create a new project (root node).
 */
export async function createProject(input: {
  tenantId: string;
  title: string;
  synopsis?: string;
  slug: string;
}): Promise<ContentNode> {
  // Use transaction to ensure node and closure are created together
  const inserted = await dbWs.transaction(async (tx) => {
    const [row] = await tx
      .insert(schema.contentNodes)
      .values({
        tenantId: input.tenantId,
        parentId: null,
        nodeType: 'group',
        title: input.title,
        synopsis: input.synopsis,
        slug: input.slug,
        position: 0,
      })
      .returning({ nodeId: schema.contentNodes.nodeId });

    // CRITICAL: Insert self-closure row (root points to itself with depth=0)
    // This allows GET /ws/projects/:id/tree to find the project itself
    await tx.insert(schema.contentClosure).values({
      ancestorId: row.nodeId,
      descendantId: row.nodeId,
      depth: 0,
    });

    return row;
  });

  // Fetch the complete project with all fields
  const project = await getProjectById(input.tenantId, inserted.nodeId);
  if (!project) {
    throw new Error('Failed to retrieve created project');
  }

  return project;
}

/**
 * Get a single project by ID.
 */
export async function getProjectById(
  tenantId: string,
  nodeId: string,
): Promise<ContentNode | null> {
  const [row] = await dbWs
    .select({
      node_id: schema.contentNodes.nodeId,
      tenant_id: schema.contentNodes.tenantId,
      parent_id: schema.contentNodes.parentId,
      node_type: schema.contentNodes.nodeType,
      title: schema.contentNodes.title,
      synopsis: schema.contentNodes.synopsis,
      slug: schema.contentNodes.slug,
      position: schema.contentNodes.position,
      media_kind_code: schema.mediaKind.kindCode,
      media_class_code: schema.mediaClass.classCode,
      datalake_path: schema.contentNodes.datalakePath,
      created_at: schema.contentNodes.createdAt,
      updated_at: schema.contentNodes.updatedAt,
    })
    .from(schema.contentNodes)
    .leftJoin(schema.mediaKind, eq(schema.contentNodes.mediaKindId, schema.mediaKind.id))
    .leftJoin(schema.mediaClass, eq(schema.mediaKind.mediaClassId, schema.mediaClass.id))
    .where(
      and(
        eq(schema.contentNodes.nodeId, nodeId),
        eq(schema.contentNodes.tenantId, tenantId),
        isNull(schema.contentNodes.parentId),
      ),
    );

  if (!row) return null;
  return mapRowToDto(row);
}

/**
 * Update a project (root node).
 */
export async function updateProject(
  tenantId: string,
  nodeId: string,
  updates: { title?: string; synopsis?: string; slug?: string },
): Promise<ContentNode | null> {
  const result = await dbWs
    .update(schema.contentNodes)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.contentNodes.nodeId, nodeId),
        eq(schema.contentNodes.tenantId, tenantId),
        isNull(schema.contentNodes.parentId),
      ),
    )
    .returning({ nodeId: schema.contentNodes.nodeId });

  if (!result.length) return null;

  // Fetch the complete updated project
  return getProjectById(tenantId, nodeId);
}

/**
 * Delete a project and all descendants (cascade handled by DB).
 */
export async function deleteProject(tenantId: string, nodeId: string): Promise<boolean> {
  const result = await dbWs
    .delete(schema.contentNodes)
    .where(
      and(
        eq(schema.contentNodes.nodeId, nodeId),
        eq(schema.contentNodes.tenantId, tenantId),
        isNull(schema.contentNodes.parentId),
      ),
    );

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Get a single node by ID (any node, not just projects).
 */
export async function getNodeById(tenantId: string, nodeId: string): Promise<ContentNode | null> {
  const [row] = await dbWs
    .select({
      node_id: schema.contentNodes.nodeId,
      tenant_id: schema.contentNodes.tenantId,
      parent_id: schema.contentNodes.parentId,
      node_type: schema.contentNodes.nodeType,
      title: schema.contentNodes.title,
      synopsis: schema.contentNodes.synopsis,
      slug: schema.contentNodes.slug,
      position: schema.contentNodes.position,
      media_kind_code: schema.mediaKind.kindCode,
      media_class_code: schema.mediaClass.classCode,
      datalake_path: schema.contentNodes.datalakePath,
      created_at: schema.contentNodes.createdAt,
      updated_at: schema.contentNodes.updatedAt,
    })
    .from(schema.contentNodes)
    .leftJoin(schema.mediaKind, eq(schema.contentNodes.mediaKindId, schema.mediaKind.id))
    .leftJoin(schema.mediaClass, eq(schema.mediaKind.mediaClassId, schema.mediaClass.id))
    .where(and(eq(schema.contentNodes.nodeId, nodeId), eq(schema.contentNodes.tenantId, tenantId)));

  if (!row) return null;
  return mapRowToDto(row);
}

/* ========================================
   TREE OPERATIONS
   ======================================== */

/**
 * Get all descendants of a project (flat list).
 * Uses closure table for efficient tree traversal.
 */
export async function getProjectTreeFlat(tenantId: string, projectId: string) {
  const rows = await dbWs
    .select({
      node_id: schema.contentNodes.nodeId,
      tenant_id: schema.contentNodes.tenantId,
      parent_id: schema.contentNodes.parentId,
      node_type: schema.contentNodes.nodeType,
      title: schema.contentNodes.title,
      synopsis: schema.contentNodes.synopsis,
      slug: schema.contentNodes.slug,
      position: schema.contentNodes.position,
      media_kind_code: schema.mediaKind.kindCode,
      media_class_code: schema.mediaClass.classCode,
      datalake_path: schema.contentNodes.datalakePath,
      created_at: schema.contentNodes.createdAt,
      updated_at: schema.contentNodes.updatedAt,
      depth: schema.contentClosure.depth,
    })
    .from(schema.contentClosure)
    .innerJoin(
      schema.contentNodes,
      eq(schema.contentClosure.descendantId, schema.contentNodes.nodeId),
    )
    .leftJoin(schema.mediaKind, eq(schema.contentNodes.mediaKindId, schema.mediaKind.id))
    .leftJoin(schema.mediaClass, eq(schema.mediaKind.mediaClassId, schema.mediaClass.id))
    .where(
      and(
        eq(schema.contentClosure.ancestorId, projectId),
        eq(schema.contentNodes.tenantId, tenantId),
      ),
    )
    .orderBy(
      asc(schema.contentClosure.depth),
      asc(schema.contentNodes.parentId),
      asc(schema.contentNodes.position),
      asc(schema.contentNodes.createdAt),
    );

  return rows.map(mapRowToDto);
}

/* ========================================
   NODE CRUD
   ======================================== */

/**
 * Create a child node under a parent.
 */
export async function createNode(input: {
  tenantId: string;
  parentId: string;
  nodeType: NodeTypeT;
  title: string;
  synopsis?: string;
  mediaKindCode?: string;
  position?: number;
}): Promise<ContentNode> {
  // Get media_kind_id if provided
  let mediaKindId: number | undefined;
  if (input.mediaKindCode) {
    const [mk] = await dbWs
      .select({ id: schema.mediaKind.id })
      .from(schema.mediaKind)
      .where(eq(schema.mediaKind.kindCode, input.mediaKindCode));
    mediaKindId = mk?.id;
  }

  // Use transaction to ensure node and closure are created together
  const nodeId = await dbWs.transaction(async (tx) => {
    // Calculate position if not provided
    let { position } = input;
    if (position === undefined) {
      const [result] = await tx
        .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)` })
        .from(schema.contentNodes)
        .where(
          and(
            eq(schema.contentNodes.tenantId, input.tenantId),
            eq(schema.contentNodes.parentId, input.parentId),
          ),
        );
      position = (result?.maxPos ?? -1) + 1;
    }

    // 1) Insert the node
    const [ins] = await tx
      .insert(schema.contentNodes)
      .values({
        tenantId: input.tenantId,
        parentId: input.parentId,
        nodeType: input.nodeType,
        title: input.title,
        synopsis: input.synopsis,
        mediaKindId,
        position,
      })
      .returning({ nodeId: schema.contentNodes.nodeId });

    const newId = ins.nodeId;

    // 2) Insert self-closure row (node points to itself with depth=0)
    await tx.insert(schema.contentClosure).values({
      ancestorId: newId,
      descendantId: newId,
      depth: 0,
    });

    // 3) Inherit all ancestors from parent (including parent itself)
    // For each ancestor A of parent P, add (A, newId, depth+1)
    const parentAncestors = await tx
      .select({
        ancestorId: schema.contentClosure.ancestorId,
        depth: schema.contentClosure.depth,
      })
      .from(schema.contentClosure)
      .where(eq(schema.contentClosure.descendantId, input.parentId));

    if (parentAncestors.length > 0) {
      const rows = parentAncestors.map((a) => ({
        ancestorId: a.ancestorId,
        descendantId: newId,
        depth: a.depth + 1,
      }));
      await tx.insert(schema.contentClosure).values(rows);
    }

    return newId;
  });

  // Fetch the complete node with all joins
  const node = await getNodeById(input.tenantId, nodeId);
  if (!node) {
    throw new Error('Failed to retrieve created node');
  }

  return node;
}

/**
 * Update an existing node.
 */
export async function updateNode(
  tenantId: string,
  nodeId: string,
  updates: { title?: string; synopsis?: string; mediaKindCode?: string },
): Promise<ContentNode | null> {
  let mediaKindId: number | undefined | null;
  if (updates.mediaKindCode !== undefined) {
    if (updates.mediaKindCode) {
      const [mk] = await dbWs
        .select({ id: schema.mediaKind.id })
        .from(schema.mediaKind)
        .where(eq(schema.mediaKind.kindCode, updates.mediaKindCode));
      mediaKindId = mk?.id;
    } else {
      mediaKindId = null;
    }
  }

  const result = await dbWs
    .update(schema.contentNodes)
    .set({
      title: updates.title,
      synopsis: updates.synopsis,
      mediaKindId,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.contentNodes.nodeId, nodeId), eq(schema.contentNodes.tenantId, tenantId)))
    .returning({ nodeId: schema.contentNodes.nodeId });

  if (!result.length) return null;

  // Fetch the complete updated node
  return getNodeById(tenantId, nodeId);
}

/**
 * Delete a node (cascade via DB).
 */
export async function deleteNode(tenantId: string, nodeId: string): Promise<boolean> {
  // Use closure table to find all descendants (including the node itself)
  const descendants = await dbWs
    .select({ descendantId: schema.contentClosure.descendantId })
    .from(schema.contentClosure)
    .where(eq(schema.contentClosure.ancestorId, nodeId));

  const idsToDelete = descendants.map((d) => d.descendantId);

  if (idsToDelete.length === 0) {
    return false;
  }

  // Delete all descendants (closure table will cascade automatically)
  const result = await dbWs
    .delete(schema.contentNodes)
    .where(
      and(
        inArray(schema.contentNodes.nodeId, idsToDelete),
        eq(schema.contentNodes.tenantId, tenantId),
      ),
    );

  return result.rowCount !== null && result.rowCount > 0;
}

/* ========================================
   REORDER SIBLINGS
   ======================================== */

/**
 * Reorder siblings under a parent (or roots if parentId is null).
 *
 * @param items Array of { nodeId, position } to set
 */
export async function reorderSiblings(
  tenantId: string,
  parentId: string | null,
  items: Array<{ nodeId: string; position: number }>,
): Promise<void> {
  await dbWs.transaction(async (tx) => {
    for (const item of items) {
      await tx
        .update(schema.contentNodes)
        .set({ position: item.position, updatedAt: new Date() })
        .where(
          and(
            eq(schema.contentNodes.nodeId, item.nodeId),
            eq(schema.contentNodes.tenantId, tenantId),
            parentId === null
              ? isNull(schema.contentNodes.parentId)
              : eq(schema.contentNodes.parentId, parentId),
          ),
        );
    }
  });
}

/* ========================================
   MOVE NODE (Strategy A: Delete + Rebuild Closure)
   ======================================== */

/**
 * Move a node to a new parent.
 *
 * Strategy: Proper closure table rebuild using Cartesian product
 * Validations:
 * - Prevent cycles (can't move node into its own subtree)
 * - Verify same tenant for both nodes
 * - Verify target is a group
 *
 * Steps:
 * 1. Validate source and target nodes
 * 2. Check for cycles
 * 3. Find all descendants in subtree with relative depths from nodeId
 * 4. Delete all closure paths for these descendants
 * 5. Update parent_id and position on the moving node
 * 6. Insert self-closure for all descendants (depth=0)
 * 7. Find all ancestors of newParentId with their depths
 * 8. Build complete paths: newAncestor × subtreeDescendant with correct depths
 */
export async function moveNode(
  tenantId: string,
  nodeId: string,
  newParentId: string,
  position?: number,
): Promise<void> {
  await dbWs.transaction(async (tx) => {
    // 1. Validate source and target nodes exist and belong to same tenant
    const [srcRows, dstRows] = await Promise.all([
      tx
        .select({
          tenantId: schema.contentNodes.tenantId,
          nodeType: schema.contentNodes.nodeType,
        })
        .from(schema.contentNodes)
        .where(eq(schema.contentNodes.nodeId, nodeId)),
      tx
        .select({
          tenantId: schema.contentNodes.tenantId,
          nodeType: schema.contentNodes.nodeType,
        })
        .from(schema.contentNodes)
        .where(eq(schema.contentNodes.nodeId, newParentId)),
    ]);

    if (!srcRows.length) throw new Error('NODE_NOT_FOUND');
    if (!dstRows.length) throw new Error('TARGET_NOT_FOUND');

    const src = srcRows[0];
    const dst = dstRows[0];

    if (src.tenantId !== tenantId || dst.tenantId !== tenantId) {
      throw new Error('TENANT_MISMATCH');
    }

    if (src.tenantId !== dst.tenantId) {
      throw new Error('CROSS_TENANT_FORBIDDEN');
    }

    if (dst.nodeType !== 'group') {
      throw new Error('INVALID_PARENT');
    }

    // 2. Cycle prevention: check if newParentId is a descendant of nodeId
    const cycleCheck = await tx
      .select({ cnt: sql<number>`COUNT(*)::int` })
      .from(schema.contentClosure)
      .where(
        and(
          eq(schema.contentClosure.ancestorId, nodeId),
          eq(schema.contentClosure.descendantId, newParentId),
        ),
      );

    if ((cycleCheck[0]?.cnt ?? 0) > 0) {
      throw new Error('CYCLE_FORBIDDEN');
    }

    // 3. Find all descendants in subtree with their relative depth from nodeId
    const subtree = await tx
      .select({
        descId: schema.contentClosure.descendantId,
        relDepth: schema.contentClosure.depth, // depth from nodeId to this descendant
      })
      .from(schema.contentClosure)
      .where(eq(schema.contentClosure.ancestorId, nodeId));

    const descendantIds = subtree.map((s) => s.descId);

    // 4. Delete all closure entries for these descendants
    if (descendantIds.length > 0) {
      await tx
        .delete(schema.contentClosure)
        .where(inArray(schema.contentClosure.descendantId, descendantIds));
    }

    // 5. Calculate position if not provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const [result] = await tx
        .select({ maxPos: sql<number>`COALESCE(MAX(position), -1)::int` })
        .from(schema.contentNodes)
        .where(
          and(
            eq(schema.contentNodes.tenantId, tenantId),
            eq(schema.contentNodes.parentId, newParentId),
          ),
        );
      finalPosition = (result?.maxPos ?? -1) + 1;
    }

    // 6. Update the moving node's parent and position
    await tx
      .update(schema.contentNodes)
      .set({
        parentId: newParentId,
        position: finalPosition,
        updatedAt: new Date(),
      })
      .where(
        and(eq(schema.contentNodes.nodeId, nodeId), eq(schema.contentNodes.tenantId, tenantId)),
      );

    // 7. Insert self-closure for all descendants in subtree (depth=0)
    if (subtree.length > 0) {
      await tx.insert(schema.contentClosure).values(
        subtree.map((s) => ({
          ancestorId: s.descId,
          descendantId: s.descId,
          depth: 0,
        })),
      );
    }

    // 8. Find all ancestors of newParentId (including newParentId itself)
    const newAncestors = await tx
      .select({
        ancId: schema.contentClosure.ancestorId,
        ancDepth: schema.contentClosure.depth,
      })
      .from(schema.contentClosure)
      .where(eq(schema.contentClosure.descendantId, newParentId));

    // 9. Build complete closure paths: Cartesian product of newAncestors × subtree
    //    For each ancestor A and each descendant D in subtree:
    //    depth = A.depth + D.relDepth + 1
    if (newAncestors.length > 0 && subtree.length > 0) {
      const closurePaths = newAncestors.flatMap((a) =>
        subtree.map((s) => ({
          ancestorId: a.ancId,
          descendantId: s.descId,
          depth: a.ancDepth + s.relDepth + 1,
        })),
      );

      await tx.insert(schema.contentClosure).values(closurePaths);
    }
  });
}
