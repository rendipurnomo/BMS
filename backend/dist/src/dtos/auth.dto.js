"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginRequestSchema = void 0;
const zod_1 = require("zod");
exports.LoginRequestSchema = zod_1.z.object({
    nrp: zod_1.z.string({ message: 'NRP is required' }).trim().min(1, 'NRP cannot be empty'),
    password: zod_1.z.string({ message: 'Password is required' }).min(1, 'Password cannot be empty'),
});
