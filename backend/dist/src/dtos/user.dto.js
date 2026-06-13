"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
exports.CreateUserSchema = zod_1.z.object({
    nrp: zod_1.z.string({ message: 'NRP is required' }).trim().min(1, 'NRP cannot be empty'),
    name: zod_1.z.string({ message: 'Name is required' }).trim().min(1, 'Name cannot be empty'),
    password: zod_1.z.string({ message: 'Password is required' }).min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['ADMIN', 'PLANNER', 'GL', 'MEKANIK'], {
        message: 'Role must be ADMIN, PLANNER, GL, or MEKANIK',
    }),
    site: zod_1.z.string({ message: 'Site is required' }).trim().min(1, 'Site cannot be empty'),
    section: zod_1.z.enum(['WHEEL', 'TRACK', 'SUPPORT'], {
        message: 'Section must be WHEEL, TRACK, or SUPPORT',
    }),
});
exports.UpdateUserSchema = exports.CreateUserSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
