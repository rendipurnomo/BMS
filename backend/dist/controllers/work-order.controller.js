"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderController = void 0;
const work_order_service_1 = require("../services/work-order.service");
const work_order_dto_1 = require("../dtos/work-order.dto");
class WorkOrderController {
    workOrderService;
    constructor() {
        this.workOrderService = new work_order_service_1.WorkOrderService();
    }
    create = async (req, res) => {
        try {
            const parseResult = work_order_dto_1.CreateWorkOrderSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const wo = await this.workOrderService.createWorkOrder(req.user, parseResult.data);
            return res.status(201).json({
                status: 'success',
                data: { workOrder: wo },
            });
        }
        catch (error) {
            if (error.message.includes('outside their Site & Section')) {
                return res.status(403).json({ status: 'fail', message: error.message });
            }
            if (error.message.includes('not found') ||
                error.message.includes('status must be APPROVED') ||
                error.message.includes('already exists')) {
                return res.status(400).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    updateOrdering = async (req, res) => {
        try {
            const parseResult = work_order_dto_1.UpdateOrderingProgressSchema.safeParse(req.body);
            if (!parseResult.success) {
                const errors = parseResult.error.issues.map((err) => ({
                    field: err.path.join('.'),
                    message: err.message,
                }));
                return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
            }
            const wo = await this.workOrderService.updateOrderingProgress(req.user, req.params.id, parseResult.data.orderingProgress);
            return res.status(200).json({
                status: 'success',
                data: { workOrder: wo },
            });
        }
        catch (error) {
            if (error.message.includes('outside their Site & Section')) {
                return res.status(403).json({ status: 'fail', message: error.message });
            }
            if (error.message.includes('not found') || error.message.includes('between 0 and 100')) {
                return res.status(400).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    setFullSupply = async (req, res) => {
        try {
            const wo = await this.workOrderService.setFullSupply(req.user, req.params.id);
            return res.status(200).json({
                status: 'success',
                data: { workOrder: wo },
            });
        }
        catch (error) {
            if (error.message.includes('outside their Site & Section')) {
                return res.status(403).json({ status: 'fail', message: error.message });
            }
            if (error.message.includes('not found')) {
                return res.status(400).json({ status: 'fail', message: error.message });
            }
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    getById = async (req, res) => {
        try {
            const wo = await this.workOrderService.getWorkOrderById(req.params.id);
            if (!wo) {
                return res.status(404).json({ status: 'fail', message: 'Work Order not found' });
            }
            return res.status(200).json({
                status: 'success',
                data: { workOrder: wo },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    list = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.workOrderService.getWorkOrders(page, limit);
            return res.status(200).json({
                status: 'success',
                data: {
                    workOrders: result.workOrders,
                    total: result.total,
                    page,
                    limit,
                },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
}
exports.WorkOrderController = WorkOrderController;
