import { WorkOrderService } from '../services/work-order.service';
import { CreateWorkOrderSchema, UpdateOrderingProgressSchema } from '../dtos/work-order.dto';

export class WorkOrderController {
  private workOrderService: WorkOrderService;

  constructor() {
    this.workOrderService = new WorkOrderService();
  }

  create = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = CreateWorkOrderSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
      }

      const wo = await this.workOrderService.createWorkOrder(req.user, parseResult.data as any);
      return res.status(201).json({
        status: 'success',
        data: { workOrder: wo },
      });
    } catch (error: any) {
      if (error.message.includes('outside their Site & Section')) {
        return res.status(403).json({ status: 'fail', message: error.message });
      }
      if (
        error.message.includes('not found') ||
        error.message.includes('status must be APPROVED') ||
        error.message.includes('already exists')
      ) {
        return res.status(400).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  updateOrdering = async (req: any, res: any): Promise<void> => {
    try {
      const parseResult = UpdateOrderingProgressSchema.safeParse(req.body);
      if (!parseResult.success) {
        const errors = parseResult.error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({ status: 'fail', message: 'Validation error', errors });
      }

      const wo = await this.workOrderService.updateOrderingProgress(
        req.user,
        req.params.id,
        parseResult.data.orderingProgress
      );
      return res.status(200).json({
        status: 'success',
        data: { workOrder: wo },
      });
    } catch (error: any) {
      if (error.message.includes('outside their Site & Section')) {
        return res.status(403).json({ status: 'fail', message: error.message });
      }
      if (error.message.includes('not found') || error.message.includes('between 0 and 100')) {
        return res.status(400).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  setFullSupply = async (req: any, res: any): Promise<void> => {
    try {
      const wo = await this.workOrderService.setFullSupply(req.user, req.params.id);
      return res.status(200).json({
        status: 'success',
        data: { workOrder: wo },
      });
    } catch (error: any) {
      if (error.message.includes('outside their Site & Section')) {
        return res.status(403).json({ status: 'fail', message: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(400).json({ status: 'fail', message: error.message });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  getById = async (req: any, res: any): Promise<void> => {
    try {
      const wo = await this.workOrderService.getWorkOrderById(req.params.id);
      if (!wo) {
        return res.status(404).json({ status: 'fail', message: 'Work Order not found' });
      }
      return res.status(200).json({
        status: 'success',
        data: { workOrder: wo },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  list = async (req: any, res: any): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
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
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
