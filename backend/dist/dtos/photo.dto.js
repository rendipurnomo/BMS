"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadPhotoSchema = void 0;
const zod_1 = require("zod");
exports.UploadPhotoSchema = zod_1.z.object({
    photoType: zod_1.z.string({ message: 'Photo Type is required' }).trim().min(1, 'Photo Type cannot be empty'),
    photoUrl: zod_1.z.string({ message: 'Photo URL is required' }).min(1, 'Photo URL cannot be empty'),
});
