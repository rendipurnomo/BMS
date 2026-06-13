"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrderRepository = void 0;
const work_order_model_1 = require("../models/work-order.model");
class WorkOrderRepository {
    async create(woData) {
        return work_order_model_1.WorkOrder.create(woData);
    }
    async findById(id) {
        return work_order_model_1.WorkOrder.findOne({ where: { _id: id, isActive: true } });
    }
    async findByBacklogId(backlogId) {
        return work_order_model_1.WorkOrder.findOne({ where: { backlogId, isActive: true } });
    }
    async update(id, updateData) {
        const wo = await work_order_model_1.WorkOrder.findByPk(id);
        if (!wo)
            return null;
        await wo.update(updateData);
        return wo;
    }
    async softDelete(id) {
        const wo = await work_order_model_1.WorkOrder.findByPk(id);
        if (!wo)
            return null;
        await wo.update({ isActive: false });
        return wo;
    }
    async findAll(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const { rows, count } = await work_order_model_1.WorkOrder.findAndCountAll({
            where: { isActive: true },
            limit,
            offset,
        });
        return { workOrders: rows, total: count };
    }
}
exports.WorkOrderRepository = WorkOrderRepository;
