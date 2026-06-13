import { z } from 'zod';

export const CreateUnitSchema = z.object({
  unitCode: z.string({ message: 'Unit Code is required' }).trim().min(1, 'Unit Code cannot be empty'),
  unitModel: z.string({ message: 'Unit Model is required' }).trim().min(1, 'Unit Model cannot be empty'),
  site: z.string({ message: 'Site is required' }).trim().min(1, 'Site cannot be empty'),
  section: z.string({ message: 'Section is required' }).trim().min(1, 'Section cannot be empty'),
});

export const UpdateUnitSchema = CreateUnitSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateUnitDto = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitDto = z.infer<typeof UpdateUnitSchema>;
