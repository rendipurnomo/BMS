/**
 * Permission Matrix based strictly on RBAC.md
 */
const PERMISSION_MATRIX: Record<string, Record<string, boolean>> = {
  'user:create': { ADMIN: true, PLANNER: false, GL: false, MEKANIK: false },
  'user:update': { ADMIN: true, PLANNER: false, GL: false, MEKANIK: false },
  'user:delete': { ADMIN: true, PLANNER: false, GL: false, MEKANIK: false },
  'unit:create': { ADMIN: true, PLANNER: false, GL: false, MEKANIK: false },
  'unit:update': { ADMIN: true, PLANNER: false, GL: false, MEKANIK: false },
  'unit:delete': { ADMIN: true, PLANNER: false, GL: false, MEKANIK: false },
  'backlog:create': { ADMIN: false, PLANNER: false, GL: false, MEKANIK: true },
  'backlog:view': { ADMIN: true, PLANNER: true, GL: true, MEKANIK: true },
  'backlog:approve': { ADMIN: false, PLANNER: false, GL: true, MEKANIK: false },
  'backlog:reject': { ADMIN: false, PLANNER: false, GL: true, MEKANIK: false },
  'wo:create': { ADMIN: false, PLANNER: true, GL: false, MEKANIK: false },
  'ordering:update': { ADMIN: false, PLANNER: true, GL: false, MEKANIK: false },
  'fullsupply:update': { ADMIN: false, PLANNER: true, GL: false, MEKANIK: false },
  'installation:update': { ADMIN: false, PLANNER: false, GL: false, MEKANIK: true },
  'backlog:complete': { ADMIN: false, PLANNER: false, GL: false, MEKANIK: true },
};

export type BMSPermission = keyof typeof PERMISSION_MATRIX;

/**
 * Express-compatible middleware to enforce Role-Based Access Control (RBAC).
 * Assumes the request has been authenticated and req.user exists.
 */
export function authorize(...permissions: BMSPermission[]) {
  return (req: any, res: any, next: any): void => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          status: 'fail',
          message: 'Unauthorized. Authentication is required.',
        });
      }

      const role = user.role;
      const hasPermission = permissions.some(p => PERMISSION_MATRIX[p]?.[role] === true);

      if (!hasPermission) {
        return res.status(403).json({
          status: 'fail',
          message: `Forbidden. You do not have permission to perform this action (${permissions.join(' or ')}).`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error during authorization.',
      });
    }
  };
}
