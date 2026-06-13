import { WorkOrder, IWorkOrder } from '../models/work-order.model';

export class WorkOrderRepository {
  async create(woData: Partial<IWorkOrder>): Promise<IWorkOrder> {
    return WorkOrder.create(woData);
  }

  async findById(id: string): Promise<IWorkOrder | null> {
    return WorkOrder.findOne({ where: { _id: id, isActive: true } });
  }

  async findByBacklogId(backlogId: string): Promise<IWorkOrder | null> {
    return WorkOrder.findOne({ where: { backlogId, isActive: true } });
  }

  async update(id: string, updateData: Partial<IWorkOrder>): Promise<IWorkOrder | null> {
    const wo = await WorkOrder.findByPk(id);
    if (!wo) return null;
    await wo.update(updateData);
    return wo;
  }

  async softDelete(id: string): Promise<IWorkOrder | null> {
    const wo = await WorkOrder.findByPk(id);
    if (!wo) return null;
    await wo.update({ isActive: false });
    return wo;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ workOrders: IWorkOrder[]; total: number }> {
    const offset = (page - 1) * limit;
    const { rows, count } = await WorkOrder.findAndCountAll({
      where: { isActive: true },
      limit,
      offset,
    });
    return { workOrders: rows, total: count };
  }
}
