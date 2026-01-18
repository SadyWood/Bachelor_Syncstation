import { z } from 'zod';
import { subjectSchema } from './subject';

export const subjectListResponseSchema = z.object({
  subjects: z.array(subjectSchema),
  total: z.number().int().min(0),
});

export type SubjectListResponse = z.infer<typeof subjectListResponseSchema>;
