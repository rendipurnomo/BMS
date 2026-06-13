"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUnitSchema = exports.CreateUnitSchema = void 0;
const zod_1 = require("zod");
exports.CreateUnitSchema = zod_1.z.object({
    unitCode: zod_1.z.string({ message: 'Unit Code is required' }).trim().min(1, 'Unit Code cannot be empty'),
    unitModel: zod_1.z.string({ message: 'Unit Model is required' }).trim().min(1, 'Unit Model cannot be empty'),
    site: zod_1.z.string({ message: 'Site is required' }).trim().min(1, 'Site cannot be empty'),
    section: zod_1.z.string({ message: 'Section is required' }).trim().min(1, 'Section cannot be empty'),
});
exports.UpdateUnitSchema = exports.CreateUnitSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
