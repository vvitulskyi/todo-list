import { z } from 'zod';

export const BreakdownSchema = z.object({
  needsClarification: z.boolean(),
  questions: z.array(z.string()),
  subtasks: z.array(z.string()),
});

export type BreakdownValidated = z.infer<typeof BreakdownSchema>;
