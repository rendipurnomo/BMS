import { BacklogRepository } from '../repositories/backlog.repository';
import { NotificationService } from './notification.service';
import { IBacklog, BacklogStatus } from '../models/backlog.model';
import { IBacklogPart } from '../models/backlog-part.model';
import { IBacklogPhoto } from '../models/backlog-photo.model';
import { ICompletion } from '../models/completion.model';
import { AuditLog } from '../models/audit-log.model';
import { uploadBase64ToBlob } from './blob.service';

export class BacklogService {
  private backlogRepository: BacklogRepository;
  private notificationService: NotificationService;

  constructor() {
    this.backlogRepository = new BacklogRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Helper to perform status transitions, write histories, and audit logs.
   */
  private async transitionStatus(
    backlogId: string,
    fromStatus: BacklogStatus | null,
    toStatus: BacklogStatus,
    actionByUser: any
  ): Promise<IBacklog> {
    const backlog = await this.backlogRepository.update(backlogId, { status: toStatus });
    if (!backlog) {
      throw new Error('Backlog status transition failed');
    }

    // 1. Log transition history
    await this.backlogRepository.logHistory({
      backlogId,
      fromStatus,
      toStatus,
      actionBy: actionByUser._id.toString(),
    });

    // 2. Log audit trail
    await new AuditLog({
      action: `TRANSITION_${toStatus}`,
      resource: 'Backlog',
      resourceId: backlog._id,
      actionBy: actionByUser._id.toString(),
      details: `Backlog ${backlog.backlogNo} transitioned from ${fromStatus || 'INIT'} to ${toStatus} by ${actionByUser.name}`,
    }).save();

    return backlog;
  }

  async createBacklog(
    creatorUser: any,
    backlogData: any
  ): Promise<IBacklog> {
    if (!backlogData.backlogNo) {
      throw new Error('Backlog number is required');
    }

    const existing = await this.backlogRepository.findByBacklogNo(backlogData.backlogNo);
    if (existing) {
      throw new Error('Backlog number already exists');
    }

    if (!backlogData.photoUrl) {
      throw new Error('At least one Photo is required');
    }

    // Force default creation status to WAITING_APPROVAL
    const backlog = await this.backlogRepository.create({
      backlogNo: backlogData.backlogNo,
      unitId: backlogData.unitId,
      status: 'WAITING_APPROVAL',
      createdBy: creatorUser._id,
      site: creatorUser.site, // Ensure unit details site matches or matches creator's site
      section: creatorUser.section,
      hourmeter: backlogData.hourmeter,
      objectDown: backlogData.objectDown,
      priority: backlogData.priority,
      damageType: backlogData.damageType,
      description: backlogData.description,
    });

    // Write initial history and audit logs
    await this.transitionStatus(backlog._id.toString(), null, 'WAITING_APPROVAL', creatorUser);

    // Save parts if provided
    if (backlogData.parts && Array.isArray(backlogData.parts)) {
      for (const part of backlogData.parts) {
        await this.backlogRepository.addPart({
          backlogId: backlog._id,
          partName: part.partName,
          partNumber: part.partNumber,
          qty: part.qty,
          supplyQty: 0,
          isActive: true,
        });
      }
    }

    // Upload to Vercel Blob if available
    let photoUrl = backlogData.photoUrl;
    if (photoUrl) {
      photoUrl = await uploadBase64ToBlob(photoUrl, backlog.backlogNo, 'BEFORE');
    }

    // Save photo
    await this.backlogRepository.addPhoto({
      backlogId: backlog._id,
      photoType: 'BEFORE',
      photoUrl: photoUrl,
      isActive: true,
    });

    // Notify GL in the same site and section
    await this.notificationService.sendNotificationToRole(
      'GL',
      { site: backlog.site, section: backlog.section },
      'Backlog Baru Menunggu Approval',
      `Mekanik ${creatorUser.name} membuat backlog baru ${backlog.backlogNo}. Menunggu approval Anda.`
    );

    return backlog;
  }

  /**
   * Approve a Backlog (GL only).
   * Transitions WAITING_APPROVAL -> APPROVED.
   */
  async approveBacklog(approverUser: any, backlogId: string): Promise<IBacklog> {
    const backlog = await this.backlogRepository.findById(backlogId);
    if (!backlog) {
      throw new Error('Backlog not found');
    }

    if (backlog.status !== 'WAITING_APPROVAL') {
      throw new Error(`Cannot approve. Backlog status must be WAITING_APPROVAL. Current: ${backlog.status}`);
    }

    // Verify GL matches backlog site/section scope
    if (approverUser.site !== backlog.site || approverUser.section !== backlog.section) {
      throw new Error('GL does not have access to approve backlogs outside their Site & Section');
    }

    const updatedBacklog = await this.transitionStatus(backlogId, 'WAITING_APPROVAL', 'APPROVED', approverUser);

    // Notify Planners in the same site and section
    await this.notificationService.sendNotificationToRole(
      'PLANNER',
      { site: backlog.site, section: backlog.section },
      'Backlog Approved',
      `Backlog ${backlog.backlogNo} telah disetujui oleh GL ${approverUser.name}. Silakan buat Work Order.`
    );

    return updatedBacklog;
  }

  /**
   * Reject a Backlog (GL only).
   * Transitions WAITING_APPROVAL -> REJECTED.
   */
  async rejectBacklog(rejecterUser: any, backlogId: string): Promise<IBacklog> {
    const backlog = await this.backlogRepository.findById(backlogId);
    if (!backlog) {
      throw new Error('Backlog not found');
    }

    if (backlog.status !== 'WAITING_APPROVAL') {
      throw new Error(`Cannot reject. Backlog status must be WAITING_APPROVAL. Current: ${backlog.status}`);
    }

    if (rejecterUser.site !== backlog.site || rejecterUser.section !== backlog.section) {
      throw new Error('GL does not have access to reject backlogs outside their Site & Section');
    }

    return this.transitionStatus(backlogId, 'WAITING_APPROVAL', 'REJECTED', rejecterUser);
  }

  /**
   * Transition FULL_SUPPLY -> INSTALLATION (Mekanik only).
   */
  async startInstallation(mekanikUser: any, backlogId: string): Promise<IBacklog> {
    const backlog = await this.backlogRepository.findById(backlogId);
    if (!backlog) {
      throw new Error('Backlog not found');
    }

    if (backlog.status !== 'FULL_SUPPLY') {
      throw new Error(`Cannot start installation. Status must be FULL_SUPPLY. Current: ${backlog.status}`);
    }

    // Verify Mekanik matches backlog site/section scope
    if (mekanikUser.site !== backlog.site || mekanikUser.section !== backlog.section) {
      throw new Error('Mekanik does not have access to start installation on backlogs outside their Site & Section');
    }

    return this.transitionStatus(backlogId, 'FULL_SUPPLY', 'INSTALLATION', mekanikUser);
  }

  async completeBacklog(
    mekanikUser: any,
    backlogId: string,
    completionData: { completionHourmeter: number; manpower: string; remarks: string; photoUrl?: string }
  ): Promise<IBacklog> {
    const backlog = await this.backlogRepository.findById(backlogId);
    if (!backlog) {
      throw new Error('Backlog not found');
    }

    if (backlog.status !== 'FULL_SUPPLY' && backlog.status !== 'INSTALLATION') {
      throw new Error(`Cannot complete backlog. Status must be FULL_SUPPLY or INSTALLATION. Current: ${backlog.status}`);
    }

    // Verify Mekanik matches backlog site/section scope
    if (mekanikUser.site !== backlog.site || mekanikUser.section !== backlog.section) {
      throw new Error('Mekanik does not have access to complete backlogs outside their Site & Section');
    }

    if (completionData.completionHourmeter < backlog.hourmeter) {
      throw new Error(`Completion Hourmeter must be greater than or equal to the backlog hourmeter (${backlog.hourmeter} Hrs)`);
    }

    if (!completionData.photoUrl) {
      throw new Error('Completion photo is required');
    }

    const currentStatus = backlog.status;

    // Upload to Vercel Blob if available
    let completionPhotoUrl = completionData.photoUrl;
    if (completionPhotoUrl) {
      completionPhotoUrl = await uploadBase64ToBlob(completionPhotoUrl, backlog.backlogNo, 'AFTER');
    }

    // Save completion photo of type AFTER first (if this fails, status is untouched)
    await this.backlogRepository.addPhoto({
      backlogId: backlogId as any,
      photoType: 'AFTER',
      photoUrl: completionPhotoUrl,
      isActive: true,
    });

    // Save completion details
    await this.backlogRepository.saveCompletion({
      backlogId: backlogId as any,
      completionHourmeter: completionData.completionHourmeter,
      manpower: completionData.manpower,
      remarks: completionData.remarks,
      isActive: true,
    });

    // If currently in FULL_SUPPLY, transition to INSTALLATION first
    if (currentStatus === 'FULL_SUPPLY') {
      await this.transitionStatus(backlogId, 'FULL_SUPPLY', 'INSTALLATION', mekanikUser);
    }

    const updatedBacklog = await this.transitionStatus(backlogId, 'INSTALLATION', 'COMPLETED', mekanikUser);

    // Notify Planners in the same site and section
    await this.notificationService.sendNotificationToRole(
      'PLANNER',
      { site: backlog.site, section: backlog.section },
      'Backlog Completed',
      `Backlog ${backlog.backlogNo} telah selesai dikerjakan oleh Mekanik ${mekanikUser.name}.`
    );

    await this.notificationService.sendNotificationToRole(
      'GL',
      { site: backlog.site, section: backlog.section },
      'Backlog Completed',
      `Backlog ${backlog.backlogNo} telah selesai dikerjakan oleh Mekanik ${mekanikUser.name}.`
    );

    return updatedBacklog;
  }

  /**
   * Retrieve list of backlogs, scoped strictly based on the user's role and site/section permissions.
   */
  async getBacklogs(
    user: any,
    page: number = 1,
    limit: number = 10
  ): Promise<{ backlogs: IBacklog[]; total: number }> {
    const filter: Record<string, any> = {};

    // Enforce role-based query scopes (GL, PLANNER, and MEKANIK are scoped to their site and section)
    if (user.role === 'GL' || user.role === 'PLANNER' || user.role === 'MEKANIK') {
      filter.site = user.site;
      filter.section = user.section;
    }

    return this.backlogRepository.findAll(filter, page, limit);
  }

  async getBacklogById(id: string): Promise<IBacklog | null> {
    return this.backlogRepository.findById(id);
  }

  // --- Parts and Photos CRUD helpers ---
  async addPartToBacklog(user: any, backlogId: string, partData: Partial<IBacklogPart>): Promise<IBacklogPart> {
    const backlog = await this.backlogRepository.findById(backlogId);
    if (!backlog) {
      throw new Error('Backlog not found');
    }

    const part = await this.backlogRepository.addPart({
      ...partData,
      backlogId: backlogId as any,
      supplyQty: partData.supplyQty !== undefined ? partData.supplyQty : 0,
      isActive: true,
    });

    await new AuditLog({
      action: 'ADD_PART_TO_BACKLOG',
      resource: 'BacklogPart',
      resourceId: part._id,
      actionBy: user._id.toString(),
      details: `Added part ${part.partName} (${part.partNumber}) to Backlog ${backlog.backlogNo}`,
    }).save();

    return part;
  }

  async addPhotoToBacklog(user: any, backlogId: string, photoData: Partial<IBacklogPhoto>): Promise<IBacklogPhoto> {
    const backlog = await this.backlogRepository.findById(backlogId);
    if (!backlog) {
      throw new Error('Backlog not found');
    }

    let photoUrl = photoData.photoUrl;
    if (photoUrl) {
      photoUrl = await uploadBase64ToBlob(photoUrl, backlog.backlogNo, photoData.photoType || 'ADDITIONAL');
    }

    const photo = await this.backlogRepository.addPhoto({
      ...photoData,
      photoUrl: photoUrl,
      backlogId: backlogId as any,
      isActive: true,
    });

    await new AuditLog({
      action: 'ADD_PHOTO_TO_BACKLOG',
      resource: 'BacklogPhoto',
      resourceId: photo._id,
      actionBy: user._id.toString(),
      details: `Uploaded photo type ${photo.photoType} for Backlog ${backlog.backlogNo}`,
    }).save();

    return photo;
  }

  async getBacklogParts(backlogId: string): Promise<IBacklogPart[]> {
    return this.backlogRepository.findPartsByBacklogId(backlogId);
  }

  async getBacklogPhotos(backlogId: string): Promise<IBacklogPhoto[]> {
    return this.backlogRepository.findPhotosByBacklogId(backlogId);
  }

  async getBacklogHistory(backlogId: string): Promise<any[]> {
    return this.backlogRepository.findHistoryByBacklogId(backlogId);
  }

  async getBacklogCompletion(backlogId: string): Promise<ICompletion | null> {
    return this.backlogRepository.findCompletionByBacklogId(backlogId);
  }
}
