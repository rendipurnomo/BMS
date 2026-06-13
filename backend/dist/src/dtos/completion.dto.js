"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteBacklogSchema = void 0;
const zod_1 = require("zod");
exports.CompleteBacklogSchema = zod_1.z.object({
    completionHourmeter: zod_1.z.number({ message: 'Completion Hourmeter is required' })
        .nonnegative('Completion Hourmeter cannot be negative'),
    manpower: zod_1.z.string({ message: 'Manpower details are required' }).trim().min(1, 'Manpower details cannot be empty'),
    remarks: zod_1.z.string({ message: 'Remarks are required' }).trim().min(1, 'Remarks cannot be empty'),
    photoUrl: zod_1.z.string().optional(),
});
