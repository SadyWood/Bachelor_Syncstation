// packages/databases/src/schema/workstation/content.ts
import { z } from 'zod';

export const NodeType = z.enum(['group', 'content', 'bonus_content']);
export type NodeTypeT = z.infer<typeof NodeType>;

export const TemplateType = z.enum(['series', 'movie', 'podcast', 'audiobook', 'empty']);
export type TemplateTypeT = z.infer<typeof TemplateType>;

export const ContentNodeDto = z.object({
  nodeId: z.string().uuid(),
  tenantId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  nodeType: NodeType,
  title: z.string(),
  synopsis: z.string().nullable().optional(),
  slug: z.string().min(1).max(160).optional(), // Only for root nodes (projects)
  position: z.number().int(),
  mediaKindCode: z.string().optional(),     // fra media_kind.kind_code
  mediaClassCode: z.string().optional(),    // fra media_class.class_code
  datalakePath: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ContentNode = z.infer<typeof ContentNodeDto>;

export const ProjectSummary = z.object({
  nodeId: z.string().uuid(),
  title: z.string(),
  synopsis: z.string().optional(),
  slug: z.string().optional(),
  childrenCount: z.number().int(),
  createdAt: z.string().datetime().optional(),
});

export const ProjectsList = z.object({
  ok: z.literal(true),
  items: z.array(ProjectSummary),
});

export const NodesResponse = z.object({
  ok: z.literal(true),
  items: z.array(ContentNodeDto),
});

export const NodeResponse = z.object({
  ok: z.literal(true),
  node: ContentNodeDto,
});

/* --- Nested tree structure (optional for GET /projects/:id/tree?shape=nested) --- */
type ContentNodeNestedT = z.infer<typeof ContentNodeDto> & {
  children: ContentNodeNestedT[];
};

export const ContentNodeNested: z.ZodType<ContentNodeNestedT> = ContentNodeDto.extend({
  children: z.lazy(() => z.array(ContentNodeNested)),
});

export const ProjectTreeNested = z.object({
  ok: z.literal(true),
  root: ContentNodeNested,
});

/* --- Requests --- */
export const CreateProjectRequest = z.object({
  body: z.object({
    title: z.string().min(1),
    synopsis: z.string().optional(),
    slug: z.string().min(1).max(160), // Auto-generated from title in FE
    template: TemplateType.optional(),
  }),
});

export const UpdateProjectRequest = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    synopsis: z.string().optional(),
    slug: z.string().min(1).max(160).optional(), // Only for root nodes
  }),
});

export const CreateNodeRequest = z.object({
  body: z.object({
    parentId: z.string().uuid(),
    nodeType: NodeType,
    title: z.string().min(1),
    synopsis: z.string().optional(),
    mediaKindCode: z.string().optional(), // eks: 'episode_video'
    position: z.number().int().optional(), // default = sist
  }),
});

export const UpdateNodeRequest = z.object({
  body: z.object({
    title: z.string().min(1).optional(),
    synopsis: z.string().optional(),
    mediaKindCode: z.string().optional(),
  }),
});

export const MoveNodeRequest = z.object({
  body: z.object({
    newParentId: z.string().uuid(),
    position: z.number().int().optional(),
  }),
});

export const ReorderSiblingsRequest = z.object({
  body: z.object({
    parentId: z.string().uuid().nullable(), // null = røtter
    items: z.array(z.object({
      nodeId: z.string().uuid(),
      position: z.number().int(),
    })),
  }),
});

export const ApplyTemplateRequest = z.object({
  body: z.object({
    template: TemplateType,
  }),
});
