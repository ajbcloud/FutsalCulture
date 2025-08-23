import { z } from 'zod';

export const range = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const pagedRange = range.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(25),
});

export const idParam = z.object({ id: z.string() });