import { Backlog, IBacklog, BacklogStatus } from '../models/backlog.model';
import { BacklogPart, IBacklogPart } from '../models/backlog-part.model';
import { BacklogPhoto, IBacklogPhoto } from '../models/backlog-photo.model';
import { Completion, ICompletion } from '../models/completion.model';
import { BacklogHistory, IBacklogHistory } from '../models/backlog-history.model';

export class BacklogRepository {
  async create(backlogData: Partial<IBacklog>): Promise<IBacklog> {
    return Backlog.create(backlogData);
  }

  async findById(id: string): Promise<IBacklog | null> {
    return Backlog.findOne({ where: { _id: id, isActive: true } });
  }

  async findByBacklogNo(backlogNo: string): Promise<IBacklog | null> {
    return Backlog.findOne({ where: { backlogNo, isActive: true } });
  }

  async update(id: string, updateData: Partial<IBacklog>): Promise<IBacklog | null> {
    const backlog = await Backlog.findByPk(id);
    if (!backlog) return null;
    await backlog.update(updateData);
    return backlog;
  }

  async softDelete(id: string): Promise<IBacklog | null> {
    const backlog = await Backlog.findByPk(id);
    if (!backlog) return null;
    await backlog.update({ isActive: false });
    return backlog;
  }

  async findAll(
    filter: Record<string, any> = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ backlogs: IBacklog[]; total: number }> {
    const offset = (page - 1) * limit;
    const { rows, count } = await Backlog.findAndCountAll({
      where: { ...filter, isActive: true },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return { backlogs: rows, total: count };
  }

  // --- Backlog Parts Operations ---
  async addPart(partData: Partial<IBacklogPart>): Promise<IBacklogPart> {
    if (partData._id) {
      const existing = await BacklogPart.findByPk(partData._id);
      if (existing) {
        await existing.update(partData);
        return existing;
      }
    }
    return BacklogPart.create(partData);
  }

  async findPartsByBacklogId(backlogId: string): Promise<IBacklogPart[]> {
    return BacklogPart.findAll({ where: { backlogId, isActive: true } });
  }

  async findPartById(partId: string): Promise<IBacklogPart | null> {
    return BacklogPart.findOne({ where: { _id: partId, isActive: true } });
  }

  async updatePart(partId: string, updateData: Partial<IBacklogPart>): Promise<IBacklogPart | null> {
    const part = await BacklogPart.findByPk(partId);
    if (!part) return null;
    await part.update(updateData);
    return part;
  }

  // --- Backlog Photos Operations ---
  async addPhoto(photoData: Partial<IBacklogPhoto>): Promise<IBacklogPhoto> {
    return BacklogPhoto.create(photoData);
  }

  async findPhotosByBacklogId(backlogId: string): Promise<IBacklogPhoto[]> {
    return BacklogPhoto.findAll({ where: { backlogId, isActive: true } });
  }

  // --- Completions Operations ---
  async saveCompletion(completionData: Partial<ICompletion>): Promise<ICompletion> {
    const existing = await Completion.findOne({ where: { backlogId: completionData.backlogId } });
    if (existing) {
      await existing.update(completionData);
      return existing;
    }
    return Completion.create(completionData);
  }

  async findCompletionByBacklogId(backlogId: string): Promise<ICompletion | null> {
    return Completion.findOne({ where: { backlogId, isActive: true } });
  }

  // --- History Operations ---
  async logHistory(historyData: {
    backlogId: string;
    fromStatus: BacklogStatus | null;
    toStatus: BacklogStatus;
    actionBy: string;
  }): Promise<IBacklogHistory> {
    return BacklogHistory.create(historyData);
  }

  async findHistoryByBacklogId(backlogId: string): Promise<IBacklogHistory[]> {
    return BacklogHistory.findAll({
      where: { backlogId },
      order: [['createdAt', 'ASC']],
    });
  }
}
