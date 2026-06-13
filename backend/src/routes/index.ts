import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/rbac.middleware';

// Import Controllers
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { UnitController } from '../controllers/unit.controller';
import { BacklogController } from '../controllers/backlog.controller';
import { WorkOrderController } from '../controllers/work-order.controller';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

// Instantiate Controllers
const authController = new AuthController();
const userController = new UserController();
const unitController = new UnitController();
const backlogController = new BacklogController();
const woController = new WorkOrderController();
const notificationController = new NotificationController();

// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);

// --- User Management Routes (Admin Only for Mutations) ---
router.get('/users', authenticate, authorize('backlog:view'), userController.list);
router.get('/users/:id', authenticate, authorize('backlog:view'), userController.getById);
router.post('/users', authenticate, authorize('user:create'), userController.create);
router.put('/users/:id', authenticate, authorize('user:update'), userController.update);
router.delete('/users/:id', authenticate, authorize('user:delete'), userController.delete);

// --- Unit Management Routes (Admin Only for Mutations) ---
router.get('/units', authenticate, authorize('backlog:view'), unitController.list);
router.get('/units/:id', authenticate, authorize('backlog:view'), unitController.getById);
router.post('/units', authenticate, authorize('unit:create'), unitController.create);
router.put('/units/:id', authenticate, authorize('unit:update'), unitController.update);
router.delete('/units/:id', authenticate, authorize('unit:delete'), unitController.delete);

// --- Backlog Routes ---
router.get('/backlogs', authenticate, authorize('backlog:view'), backlogController.list);
router.get('/backlogs/:id', authenticate, authorize('backlog:view'), backlogController.getById);
router.post('/backlogs', authenticate, authorize('backlog:create'), backlogController.create);

// --- Backlog State Machine Transitions (RBAC Protected) ---
router.post('/backlogs/:id/approve', authenticate, authorize('backlog:approve'), backlogController.approve);
router.post('/backlogs/:id/reject', authenticate, authorize('backlog:reject'), backlogController.reject);
router.post('/backlogs/:id/installation', authenticate, authorize('installation:update'), backlogController.startInstallation);
router.post('/backlogs/:id/complete', authenticate, authorize('backlog:complete'), backlogController.complete);

// --- Backlog Sub-Entities (Parts & Photos & History) ---
router.post('/backlogs/:id/parts', authenticate, authorize('backlog:create', 'ordering:update'), backlogController.addPart);
router.get('/backlogs/:id/parts', authenticate, authorize('backlog:view'), backlogController.getParts);
router.post('/backlogs/:id/photos', authenticate, authorize('backlog:create'), backlogController.addPhoto);
router.get('/backlogs/:id/photos', authenticate, authorize('backlog:view'), backlogController.getPhotos);
router.get('/backlogs/:id/history', authenticate, authorize('backlog:view'), backlogController.getHistory);
router.get('/backlogs/:id/completion', authenticate, authorize('backlog:view'), backlogController.getCompletion);

// --- Work Order Routes ---
router.get('/work-orders', authenticate, authorize('backlog:view'), woController.list);
router.get('/work-orders/:id', authenticate, authorize('backlog:view'), woController.getById);
router.post('/work-orders', authenticate, authorize('wo:create'), woController.create);
router.put('/work-orders/:id/ordering', authenticate, authorize('ordering:update'), woController.updateOrdering);
router.post('/work-orders/:id/full-supply', authenticate, authorize('fullsupply:update'), woController.setFullSupply);

// --- Notification Routes ---
router.get('/notifications', authenticate, notificationController.list);
router.patch('/notifications/:id/read', authenticate, notificationController.markAsRead);

export default router;
