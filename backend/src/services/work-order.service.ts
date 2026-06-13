import { WorkOrderRepository } from '../repositories/work-order.repository';
import { BacklogRepository } from '../repositories/backlog.repository';
import { NotificationService } from './notification.service';
import { IWorkOrder } from '../models/work-order.model';
import { AuditLog } from '../models/audit-log.model';
import { BacklogStatus } from '../models/backlog.model';

export class WorkOrderService {
  private workOrderRepository: WorkOrderRepository;
  private backlogRepository: BacklogRepository;
  private notificationService: NotificationService;

  constructor() {
    this.workOrderRepository = new WorkOrderRepository();
    this.backlogRepository = new BacklogRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Helper to validate state transitions and log history.
   */
  private async transitionBacklogStatus(
    backlogId: string,
    fromStatus: BacklogStatus,
    toStatus: BacklogStatus,
    actionBy: string
  ): Promise<void> {
    // 1. Update Backlog Status
    await this.backlogRepository.update(backlogId, { status: toStatus });

    // 2. Log status history
    await this.backlogRepository.logHistory({
      backlogId,
      fromStatus,
      toStatus,
      actionBy,
    });
  }

  /**
   * Create a Work Order for a backlog.
   * Transitions status APPROVED -> PLANNING.
   */
  async createWorkOrder(creatorUser: any, woData: Partial<IWorkOrder>): Promise<IWorkOrder> {
    if (!woData.backlogId) {
      throw new Error('Backlog ID is required');
    }

    const backlog = await this.backlogRepository.findById(woData.backlogId.toString());
    if (!backlog) {
      throw new Error('Backlog not found');
    }

    // Verify current status
    if (backlog.status !== 'APPROVED') {
      throw new Error(`Cannot create Work Order. Backlog status must be APPROVED, current status: ${backlog.status}`);
    }

    // Verify Planner matches backlog site/section scope
    if (creatorUser.site !== backlog.site || creatorUser.section !== backlog.section) {
      throw new Error('Planner does not have access to create Work Order for backlogs outside their Site & Section');
    }

    // Check if Work Order already exists for this backlog
    const existingWo = await this.workOrderRepository.findByBacklogId(backlog._id.toString());
    if (existingWo) {
      throw new Error('Work Order already exists for this backlog');
    }

    // Create Work Order
    const wo = await this.workOrderRepository.create({
      ...woData,
      orderingProgress: woData.orderingProgress || 0,
    });

    // State Transition: APPROVED -> PLANNING
    await this.transitionBacklogStatus(
      backlog._id.toString(),
      'APPROVED',
      'PLANNING',
      creatorUser._id.toString()
    );

    // Audit Trail
    await new AuditLog({
      action: 'CREATE_WORK_ORDER',
      resource: 'WorkOrder',
      resourceId: wo._id,
      actionBy: creatorUser._id.toString(),
      details: `Created Work Order ${wo.woNumber} for Backlog ${backlog.backlogNo}`,
    }).save();

    return wo;
  }

  /**
   * Update the ordering progress of a Work Order.
   * Drives transition PLANNING -> ORDERING_PART -> PARTIAL_SUPPLY -> FULL_SUPPLY.
   */
  async updateOrderingProgress(updaterUser: any, woId: string, progress: number): Promise<IWorkOrder | null> {
    if (progress < 0 || progress > 100) {
      throw new Error('Progress must be between 0 and 100');
    }

    const wo = await this.workOrderRepository.findById(woId);
    if (!wo) {
      throw new Error('Work Order not found');
    }

    const backlog = await this.backlogRepository.findById(wo.backlogId.toString());
    if (!backlog) {
      throw new Error('Backlog linked to Work Order not found');
    }

    // Verify Planner matches backlog site/section scope
    if (updaterUser.site !== backlog.site || updaterUser.section !== backlog.section) {
      throw new Error('Planner does not have access to update Work Orders outside their Site & Section');
    }

    const currentStatus = backlog.status;
    let nextStatus: BacklogStatus = currentStatus;

    // Transition rules based on progress
    if (progress > 0 && progress < 50) {
      if (currentStatus === 'PLANNING') {
        nextStatus = 'ORDERING_PART';
      }
    } else if (progress >= 50 && progress < 100) {
      if (currentStatus === 'PLANNING' || currentStatus === 'ORDERING_PART') {
        nextStatus = 'PARTIAL_SUPPLY';
      }
    } else if (progress === 100) {
      if (currentStatus === 'PLANNING' || currentStatus === 'ORDERING_PART' || currentStatus === 'PARTIAL_SUPPLY') {
        nextStatus = 'FULL_SUPPLY';
      }
    }

    // Update Work Order
    const updatedWo = await this.workOrderRepository.update(woId, { orderingProgress: progress });

    // Transition backlog status if changed
    if (nextStatus !== currentStatus) {
      await this.transitionBacklogStatus(
        backlog._id.toString(),
        currentStatus,
        nextStatus,
        updaterUser._id.toString()
      );

      // Trigger Full Supply Notification if status becomes FULL_SUPPLY
      if (nextStatus === 'FULL_SUPPLY') {
        await this.notificationService.sendNotificationToRole(
          'MEKANIK',
          { site: backlog.site, section: backlog.section },
          'Full Supply',
          `Spare part untuk backlog ${backlog.backlogNo} sudah lengkap (Full Supply). Silakan lakukan instalasi.`
        );
      }
    }

    // Audit Trail
    await new AuditLog({
      action: 'UPDATE_ORDERING_PROGRESS',
      resource: 'WorkOrder',
      resourceId: wo._id,
      actionBy: updaterUser._id.toString(),
      details: `Updated ordering progress for Work Order ${wo.woNumber} to ${progress}% (Backlog: ${backlog.backlogNo})`,
    }).save();

    return updatedWo;
  }

  /**
   * Explicitly set Work Order to Full Supply (progress = 100%).
   * Transitions status to FULL_SUPPLY.
   */
  async setFullSupply(updaterUser: any, woId: string): Promise<IWorkOrder | null> {
    return this.updateOrderingProgress(updaterUser, woId, 100);
  }

  async getWorkOrderById(id: string): Promise<IWorkOrder | null> {
    return this.workOrderRepository.findById(id);
  }

  async getWorkOrders(page: number = 1, limit: number = 10): Promise<{ workOrders: IWorkOrder[]; total: number }> {
    return this.workOrderRepository.findAll(page, limit);
  }
}
