import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CreateWorkOrderSchema = z.object({
  backlogId: z.string({ message: 'Backlog ID is required' }).regex(objectIdRegex, 'Invalid Backlog ID format'),
  woNumber: z.string({ message: 'WO Number is required' }).trim().min(1, 'WO Number cannot be empty'),
  targetDate: z.coerce.date({
    message: 'Invalid target date format',
  }),
  installationPlan: z.string({ message: 'Installation Plan is required' }).trim().min(1, 'Installation Plan cannot be empty'),
  estimatedFullSupply: z.coerce.date({
    message: 'Invalid estimated full supply date format',
  }),
  orderingProgress: z.number().min(0).max(100).optional(),
});

export const UpdateOrderingProgressSchema = z.object({
  orderingProgress: z.number({ message: 'Ordering progress is required' })
    .min(0, 'Progress cannot be less than 0')
    .max(100, 'Progress cannot exceed 100'),
});

export type CreateWorkOrderDto = z.infer<typeof CreateWorkOrderSchema>;
export type UpdateOrderingProgressDto = z.infer<typeof UpdateOrderingProgressSchema>;
