"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
const zod_1 = require("zod");
/**
 * Express-compatible middleware to validate request bodies against a Zod schema.
 */
function validateBody(schema) {
    return async (req, res, next) => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({
                    status: 'fail',
                    message: 'Validation error',
                    errors,
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error during validation',
            });
        }
    };
}
/**
 * Express-compatible middleware to validate query parameters against a Zod schema.
 */
function validateQuery(schema) {
    return async (req, res, next) => {
        try {
            req.query = await schema.parseAsync(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const errors = error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({
                    status: 'fail',
                    message: 'Validation error',
                    errors,
                });
            }
            return res.status(500).json({
                status: 'error',
                message: 'Internal server error during validation',
            });
        }
    };
}
