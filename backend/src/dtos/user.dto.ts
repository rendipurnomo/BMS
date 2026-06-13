import { z } from 'zod';

export const CreateUserSchema = z.object({
  nrp: z.string({ message: 'NRP is required' }).trim().min(1, 'NRP cannot be empty'),
  name: z.string({ message: 'Name is required' }).trim().min(1, 'Name cannot be empty'),
  password: z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'PLANNER', 'GL', 'MEKANIK'], {
    message: 'Role must be ADMIN, PLANNER, GL, or MEKANIK',
  }),
  site: z.string({ message: 'Site is required' }).trim().min(1, 'Site cannot be empty'),
  section: z.enum(['WHEEL', 'TRACK', 'SUPPORT'], {
    message: 'Section must be WHEEL, TRACK, or SUPPORT',
  }),
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
