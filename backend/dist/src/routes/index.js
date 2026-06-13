"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
// Import Controllers
const auth_controller_1 = require("../controllers/auth.controller");
const user_controller_1 = require("../controllers/user.controller");
const unit_controller_1 = require("../controllers/unit.controller");
const backlog_controller_1 = require("../controllers/backlog.controller");
const work_order_controller_1 = require("../controllers/work-order.controller");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// Instantiate Controllers
const authController = new auth_controller_1.AuthController();
const userController = new user_controller_1.UserController();
const unitController = new unit_controller_1.UnitController();
const backlogController = new backlog_controller_1.BacklogController();
const woController = new work_order_controller_1.WorkOrderController();
const notificationController = new notification_controller_1.NotificationController();
// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.get('/auth/me', auth_middleware_1.authenticate, authController.me);
// --- User Management Routes (Admin Only for Mutations) ---
router.get('/users', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), userController.list);
router.get('/users/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), userController.getById);
router.post('/users', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('user:create'), userController.create);
router.put('/users/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('user:update'), userController.update);
router.delete('/users/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('user:delete'), userController.delete);
// --- Unit Management Routes (Admin Only for Mutations) ---
router.get('/units', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), unitController.list);
router.get('/units/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), unitController.getById);
router.post('/units', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('unit:create'), unitController.create);
router.put('/units/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('unit:update'), unitController.update);
router.delete('/units/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('unit:delete'), unitController.delete);
// --- Backlog Routes ---
router.get('/backlogs', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), backlogController.list);
router.get('/backlogs/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), backlogController.getById);
router.post('/backlogs', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:create'), backlogController.create);
// --- Backlog State Machine Transitions (RBAC Protected) ---
router.post('/backlogs/:id/approve', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:approve'), backlogController.approve);
router.post('/backlogs/:id/reject', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:reject'), backlogController.reject);
router.post('/backlogs/:id/installation', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('installation:update'), backlogController.startInstallation);
router.post('/backlogs/:id/complete', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:complete'), backlogController.complete);
// --- Backlog Sub-Entities (Parts & Photos & History) ---
router.post('/backlogs/:id/parts', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:create', 'ordering:update'), backlogController.addPart);
router.get('/backlogs/:id/parts', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), backlogController.getParts);
router.post('/backlogs/:id/photos', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:create'), backlogController.addPhoto);
router.get('/backlogs/:id/photos', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), backlogController.getPhotos);
router.get('/backlogs/:id/history', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), backlogController.getHistory);
router.get('/backlogs/:id/completion', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), backlogController.getCompletion);
// --- Work Order Routes ---
router.get('/work-orders', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), woController.list);
router.get('/work-orders/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('backlog:view'), woController.getById);
router.post('/work-orders', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('wo:create'), woController.create);
router.put('/work-orders/:id/ordering', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('ordering:update'), woController.updateOrdering);
router.post('/work-orders/:id/full-supply', auth_middleware_1.authenticate, (0, rbac_middleware_1.authorize)('fullsupply:update'), woController.setFullSupply);
// --- Notification Routes ---
router.get('/notifications', auth_middleware_1.authenticate, notificationController.list);
router.patch('/notifications/:id/read', auth_middleware_1.authenticate, notificationController.markAsRead);
exports.default = router;
