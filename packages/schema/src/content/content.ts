import { z } from 'zod';

export const contentSchema = z.object({
  id: z.string().uuid(),
  mediaTitle: z.string(), // e.g., "Breaking Bad"
  episodeTitle: z.string().nullable(), // e.g., "Pilot"
  season: z.number().int().positive().nullable(),
  episode: z.number().int().positive().nullable(),
  durationSeconds: z.number().int().positive(),
  thumbnailUrl: z.string().url().nullable(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const contentSubjectSchema = z.object({
  id: z.string().uuid(),
  contentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  startTime: z.number().int().nonnegative(), // Seconds from start
  endTime: z.number().int().positive(), // Seconds from start
  metadata: z.record(z.unknown()).default({}), // Confidence, prominence, etc.
  createdAt: z.string().datetime(),
});

// Request schemas
export const getContentTimelineRequestSchema = z.object({
  contentId: z.string().uuid(),
  currentTime: z.number().int().nonnegative().optional(), // Filter subjects visible at this time
});

// Response schemas
export const contentWithSubjectsSchema = z.object({
  content: contentSchema,
  subjects: z.array(
    contentSubjectSchema.extend({
      subject: z.object({
        id: z.string().uuid(),
        label: z.string(),
        type: z.enum(['person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other']),
        isSellable: z.boolean(),
        heroImageUrl: z.string().url().nullable(),
      }),
    })
  ),
});

export const timelineSubjectSchema = z.object({
  subject: z.object({
    id: z.string().uuid(),
    label: z.string(),
    type: z.enum(['person', 'character', 'product_prop', 'apparel', 'location', 'vehicle', 'other']),
    isSellable: z.boolean(),
    heroImageUrl: z.string().url().nullable(),
  }),
  startTime: z.number().int(),
  endTime: z.number().int(),
  metadata: z.record(z.unknown()),
});

export type Content = z.infer<typeof contentSchema>;
export type ContentSubject = z.infer<typeof contentSubjectSchema>;
export type GetContentTimelineRequest = z.infer<typeof getContentTimelineRequestSchema>;
export type ContentWithSubjects = z.infer<typeof contentWithSubjectsSchema>;
export type TimelineSubject = z.infer<typeof timelineSubjectSchema>;
