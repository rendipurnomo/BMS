"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBacklogSchema = exports.CreateBacklogSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.CreateBacklogSchema = zod_1.z.object({
    backlogNo: zod_1.z.string({ message: 'Backlog Number is required' }).trim().min(1, 'Backlog Number cannot be empty'),
    unitId: zod_1.z.string({ message: 'Unit ID is required' }).regex(objectIdRegex, 'Invalid Unit ID format'),
    site: zod_1.z.string({ message: 'Site is required' }).trim().min(1, 'Site cannot be empty'),
    section: zod_1.z.string({ message: 'Section is required' }).trim().min(1, 'Section cannot be empty'),
    hourmeter: zod_1.z.number({ message: 'Hourmeter is required' }).nonnegative('Hourmeter cannot be negative'),
    objectDown: zod_1.z.enum(['SCHEDULE INSPECTION', 'SERVICE', 'BREAKDOWN'], {
        message: 'Object Down must be SCHEDULE INSPECTION, SERVICE, or BREAKDOWN',
    }),
    priority: zod_1.z.enum(['P1', 'P2', 'P3', 'P4'], {
        message: 'Priority must be P1, P2, P3, or P4',
    }),
    damageType: zod_1.z.string({ message: 'Damage Type is required' }).trim().min(1, 'Damage Type cannot be empty'),
    description: zod_1.z.string({ message: 'Description is required' }).trim().min(1, 'Description cannot be empty'),
    parts: zod_1.z.array(zod_1.z.object({
        partName: zod_1.z.string().trim().min(1),
        partNumber: zod_1.z.string().trim().min(1),
        qty: zod_1.z.number().positive(),
    })).optional(),
    photoUrl: zod_1.z.string().optional(),
});
exports.UpdateBacklogSchema = exports.CreateBacklogSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
