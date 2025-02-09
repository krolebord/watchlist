import { z } from 'zod';

export const itemsFilterSchema = z.object({
  sortBy: z.enum(['duration', 'rating', 'dateAdded', 'priority']).default('dateAdded'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
