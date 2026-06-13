import { ZodSchema, ZodError } from 'zod';

/**
 * Express-compatible middleware to validate request bodies against a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return async (req: any, res: any, next: any): Promise<void> => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
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
export function validateQuery(schema: ZodSchema) {
  return async (req: any, res: any, next: any): Promise<void> => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
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
