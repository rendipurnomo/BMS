"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePartSchema = exports.CreatePartSchema = void 0;
const zod_1 = require("zod");
exports.CreatePartSchema = zod_1.z.object({
    _id: zod_1.z.string().optional(),
    partNumber: zod_1.z.string({ message: 'Part Number is required' }).trim().min(1, 'Part Number cannot be empty'),
    partName: zod_1.z.string({ message: 'Part Name is required' }).trim().min(1, 'Part Name cannot be empty'),
    qty: zod_1.z.number({ message: 'Quantity is required' }).positive('Quantity must be greater than 0'),
    supplyQty: zod_1.z.number().nonnegative('Supply quantity cannot be negative').optional(),
});
exports.UpdatePartSchema = exports.CreatePartSchema.partial().extend({
    isActive: zod_1.z.boolean().optional(),
});
