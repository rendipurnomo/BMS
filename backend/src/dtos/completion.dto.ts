import { z } from 'zod';

export const CompleteBacklogSchema = z.object({
  completionHourmeter: z.number({ message: 'Completion Hourmeter is required' })
    .nonnegative('Completion Hourmeter cannot be negative'),
  manpower: z.string({ message: 'Manpower details are required' }).trim().min(1, 'Manpower details cannot be empty'),
  remarks: z.string({ message: 'Remarks are required' }).trim().min(1, 'Remarks cannot be empty'),
  photoUrl: z.string().optional(),
});

export type CompleteBacklogDto = z.infer<typeof CompleteBacklogSchema>;
