import { z } from 'zod';

export const UploadPhotoSchema = z.object({
  photoType: z.string({ message: 'Photo Type is required' }).trim().min(1, 'Photo Type cannot be empty'),
  photoUrl: z.string({ message: 'Photo URL is required' }).min(1, 'Photo URL cannot be empty'),
});

export type UploadPhotoDto = z.infer<typeof UploadPhotoSchema>;
