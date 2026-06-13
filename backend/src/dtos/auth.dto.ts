import { z } from 'zod';

export const LoginRequestSchema = z.object({
  nrp: z.string({ message: 'NRP is required' }).trim().min(1, 'NRP cannot be empty'),
  password: z.string({ message: 'Password is required' }).min(1, 'Password cannot be empty'),
});

export type LoginRequestDto = z.infer<typeof LoginRequestSchema>;
