import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CreateBacklogSchema = z.object({
  backlogNo: z.string({ message: 'Backlog Number is required' }).trim().min(1, 'Backlog Number cannot be empty'),
  unitId: z.string({ message: 'Unit ID is required' }).regex(objectIdRegex, 'Invalid Unit ID format'),
  site: z.string({ message: 'Site is required' }).trim().min(1, 'Site cannot be empty'),
  section: z.string({ message: 'Section is required' }).trim().min(1, 'Section cannot be empty'),
  hourmeter: z.number({ message: 'Hourmeter is required' }).nonnegative('Hourmeter cannot be negative'),
  objectDown: z.enum(['SCHEDULE INSPECTION', 'SERVICE', 'BREAKDOWN'], {
    message: 'Object Down must be SCHEDULE INSPECTION, SERVICE, or BREAKDOWN',
  }),
  priority: z.enum(['P1', 'P2', 'P3', 'P4'], {
    message: 'Priority must be P1, P2, P3, or P4',
  }),
  damageType: z.string({ message: 'Damage Type is required' }).trim().min(1, 'Damage Type cannot be empty'),
  description: z.string({ message: 'Description is required' }).trim().min(1, 'Description cannot be empty'),
  parts: z.array(z.object({
    partName: z.string().trim().min(1),
    partNumber: z.string().trim().min(1),
    qty: z.number().positive(),
  })).optional(),
  photoUrl: z.string().optional(),
});

export const UpdateBacklogSchema = CreateBacklogSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateBacklogDto = z.infer<typeof CreateBacklogSchema>;
export type UpdateBacklogDto = z.infer<typeof UpdateBacklogSchema>;
