// packages/schema/src/workstation/content.ts
import { z } from 'zod';

/* ========================================
   ENUMS & PRIMITIVES
   ======================================== */

export const NodeType = z.enum(['group', 'content', 'bonus_content']);
export type NodeTypeT = z.infer<typeof NodeType>;

export const MediaClass = z.enum(['video', 'audio', 'image']);
export type MediaClassT = z.infer<typeof MediaClass>;

export const TemplateType = z.enum(['series', 'movie', 'podcast', 'audiobook', 'empty']);
export type TemplateTypeT = z.infer<typeof TemplateType>;

export const MediaKindCode = z.string().min(1).max(40);

/* ========================================
   MEDIA KIND OPTIONS - UI dropdown data
   ======================================== */

export interface MediaKindOption {
  value: string;
  label: string;
}

export interface MediaKindCategory {
  category: string;
  mediaClass: MediaClassT;
  options: MediaKindOption[];
}

export const MEDIA_KIND_OPTIONS: MediaKindCategory[] = [
  {
    category: 'Video',
    mediaClass: 'video',
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
    mediaClass: 'audio',
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
    mediaClass: 'image',
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

// Helper to get media class from kind code
export function getMediaClassFromKind(kindCode: string | null): MediaClassT {
  if (!kindCode) return 'video';
  for (const cat of MEDIA_KIND_OPTIONS) {
    if (cat.options.some(opt => opt.value === kindCode)) {
      return cat.mediaClass;
    }
  }
  return 'video';
}

/* ========================================
   SCHEMAS
   ======================================== */

/**
 * Flat schema representing a content node.
 * Maps 1:1 to content_nodes table + derived fields.
 */
export const ContentNodeSchema = z.object({
  nodeId: z.string().uuid(),
  tenantId: z.string().uuid(),
  parentId: z.string().uuid().nullable(),
  nodeType: NodeType,
  title: z.string(),
  synopsis: z.string().nullable().optional(),
  slug: z.string().min(1).max(160).optional(), // Only for root nodes (projects)
  position: z.number().int(),
  mediaKindCode: MediaKindCode.optional(), // from media_kind.kind_code
  mediaClass: MediaClass.optional(), // derived from media_kind
  datalakePath: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type ContentNode = z.infer<typeof ContentNodeSchema>;

/**
 * Project summary for list views.
 */
export const ProjectSummary = z.object({
  nodeId: z.string().uuid(),
  title: z.string(),
  synopsis: z.string().optional(),
  slug: z.string().optional(),
  childrenCount: z.number().int(),
  createdAt: z.string().datetime().optional(),
});
export type ProjectSummaryT = z.infer<typeof ProjectSummary>;

/**
 * Nested tree structure for hierarchical views.
 */
export type ContentNodeNestedT = z.infer<typeof ContentNodeSchema> & {
  children: ContentNodeNestedT[];
};

export const ContentNodeNested: z.ZodType<ContentNodeNestedT> = ContentNodeSchema.extend({
  children: z.lazy(() => z.array(ContentNodeNested)),
});

/* ========================================
   API RESPONSES
   ======================================== */

export const ProjectsListResponse = z.object({
  ok: z.literal(true),
  items: z.array(ProjectSummary),
});

export const ProjectResponse = z.object({
  ok: z.literal(true),
  project: ContentNodeSchema,
});

export const NodesListResponse = z.object({
  ok: z.literal(true),
  items: z.array(ContentNodeSchema),
});

export const NodeResponse = z.object({
  ok: z.literal(true),
  node: ContentNodeSchema,
});

export const ProjectTreeFlatResponse = z.object({
  ok: z.literal(true),
  items: z.array(ContentNodeSchema),
});

export const ProjectTreeNestedResponse = z.object({
  ok: z.literal(true),
  root: ContentNodeNested,
});

/* ========================================
   API REQUESTS
   ======================================== */

export const CreateProjectRequest = z.object({
  body: z.object({
    title: z.string().min(1).max(255),
    synopsis: z.string().optional(),
    slug: z.string().max(160).optional(),
    template: TemplateType.optional(),
  }),
});

export const UpdateProjectRequest = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    synopsis: z.string().optional(),
    slug: z.string().min(1).max(160).optional(),
  }),
});

export const CreateNodeRequest = z.object({
  body: z.object({
    parentId: z.string().uuid(),
    nodeType: NodeType,
    title: z.string().min(1).max(255),
    synopsis: z.string().optional(),
    mediaKindCode: MediaKindCode.optional(),
    position: z.number().int().optional(), // default = last
  }),
});

export const UpdateNodeRequest = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    synopsis: z.string().optional(),
    mediaKindCode: MediaKindCode.optional(),
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
    parentId: z.string().uuid().nullable(), // null = roots
    items: z.array(
      z.object({
        nodeId: z.string().uuid(),
        position: z.number().int(),
      }),
    ),
  }),
});

export const ApplyTemplateRequest = z.object({
  body: z.object({
    template: TemplateType,
  }),
});
