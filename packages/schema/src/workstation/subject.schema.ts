// packages/schema/src/workstation/subject.schema.ts
import { z } from 'zod';

/**
 * Subject type - flexible string to allow custom categorization
 * Suggested common types are provided below for UI reference, but any string is valid
 */
export type SubjectType = string;

/**
 * Suggested subject types for UI dropdowns/suggestions
 * These are recommendations only - the schema accepts any string
 */
export const SUGGESTED_SUBJECT_TYPES = [
  'character',
  'location',
  'scene',
  'physical_artifact',
  'digital_artifact',
  'clothing',
  'concept',
  'music',
  'audio',
  'dialogue',
  'action',
  'visual_effect',
] as const;

/**
 * Core subject schema
 * Represents the metadata for a subject (character, location, etc.)
 * A subject can have multiple appearances on the timeline
 */
export const SubjectSchema = z.object({
  subjectId: z.string().uuid(),
  nodeId: z.string().uuid(),
  subjectType: z.string().min(1).max(100),
  label: z.string().min(1).max(255),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be valid hex color'),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type Subject = z.infer<typeof SubjectSchema>;

/**
 * Subject appearance schema
 * Represents a single appearance/instance of a subject on the timeline
 */
export const SubjectAppearanceSchema = z.object({
  appearanceId: z.string().uuid(),
  subjectId: z.string().uuid(), // Reference to parent Subject
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});
export type SubjectAppearance = z.infer<typeof SubjectAppearanceSchema>;

/**
 * Timeline item schema
 * Format compatible with @hoolsy/timeline package
 */
export const TimelineItemSchema = z.object({
  id: z.string(),
  trackId: z.string(),
  label: z.string(),
  startMs: z.number().int().min(0),
  endMs: z.number().int().min(0),
  color: z.string(),
  subTrack: z.number().int().min(0).optional(),
});
export type TimelineItem = z.infer<typeof TimelineItemSchema>;

/**
 * Timeline track schema
 * Represents a horizontal track/lane in the timeline
 */
export const TimelineTrackSchema = z.object({
  id: z.string(),
  label: z.string(),
});
export type TimelineTrack = z.infer<typeof TimelineTrackSchema>;

/**
 * Helper to convert SubjectAppearance + Subject to TimelineItem
 */
export function appearanceToTimelineItem(
  appearance: SubjectAppearance,
  subject: Subject,
): TimelineItem {
  return {
    id: appearance.appearanceId,
    trackId: subject.subjectType,
    label: subject.label,
    startMs: appearance.startMs,
    endMs: appearance.endMs,
    color: subject.color,
  };
}

/**
 * DEPRECATED: Legacy helper for backward compatibility
 * Use appearanceToTimelineItem instead
 */
export function subjectToTimelineItem(subject: Subject & { startMs: number; endMs: number }): TimelineItem {
  return {
    id: subject.subjectId,
    trackId: subject.subjectType,
    label: subject.label,
    startMs: subject.startMs,
    endMs: subject.endMs,
    color: subject.color,
  };
}

/**
 * Default track definitions
 */
export const DEFAULT_TIMELINE_TRACKS: TimelineTrack[] = [
  { id: 'scene', label: 'Scenes' },
  { id: 'character', label: 'Characters' },
  { id: 'location', label: 'Locations' },
  { id: 'physical_artifact', label: 'Physical Artifacts' },
  { id: 'music', label: 'Music' },
  { id: 'audio', label: 'Audio' },
  { id: 'concept', label: 'Concepts' },
];
