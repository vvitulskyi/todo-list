import { z } from 'zod';

export const SuggestPlanSchema = z.array(
  z.object({
    taskId: z.string(),
    reason: z.string(),
  }),
);

export type SuggestPlanValidated = z.infer<typeof SuggestPlanSchema>;
