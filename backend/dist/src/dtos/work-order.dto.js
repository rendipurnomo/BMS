"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOrderingProgressSchema = exports.CreateWorkOrderSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.CreateWorkOrderSchema = zod_1.z.object({
    backlogId: zod_1.z.string({ message: 'Backlog ID is required' }).regex(objectIdRegex, 'Invalid Backlog ID format'),
    woNumber: zod_1.z.string({ message: 'WO Number is required' }).trim().min(1, 'WO Number cannot be empty'),
    targetDate: zod_1.z.coerce.date({
        message: 'Invalid target date format',
    }),
    installationPlan: zod_1.z.string({ message: 'Installation Plan is required' }).trim().min(1, 'Installation Plan cannot be empty'),
    estimatedFullSupply: zod_1.z.coerce.date({
        message: 'Invalid estimated full supply date format',
    }),
    orderingProgress: zod_1.z.number().min(0).max(100).optional(),
});
exports.UpdateOrderingProgressSchema = zod_1.z.object({
    orderingProgress: zod_1.z.number({ message: 'Ordering progress is required' })
        .min(0, 'Progress cannot be less than 0')
        .max(100, 'Progress cannot exceed 100'),
});
