import { z } from 'zod';

export const CreatePartSchema = z.object({
  _id: z.string().optional(),
  partNumber: z.string({ message: 'Part Number is required' }).trim().min(1, 'Part Number cannot be empty'),
  partName: z.string({ message: 'Part Name is required' }).trim().min(1, 'Part Name cannot be empty'),
  qty: z.number({ message: 'Quantity is required' }).positive('Quantity must be greater than 0'),
  supplyQty: z.number().nonnegative('Supply quantity cannot be negative').optional(),
});

export const UpdatePartSchema = CreatePartSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreatePartDto = z.infer<typeof CreatePartSchema>;
export type UpdatePartDto = z.infer<typeof UpdatePartSchema>;
