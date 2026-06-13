import { Notification, INotification } from '../models/notification.model';

export class NotificationRepository {
  async create(notificationData: Partial<INotification>): Promise<INotification> {
    return Notification.create(notificationData);
  }

  async findByUserId(userId: string): Promise<INotification[]> {
    return Notification.findAll({
      where: { userId, isActive: true },
      order: [['createdAt', 'DESC']],
    });
  }

  async findById(id: string): Promise<INotification | null> {
    return Notification.findOne({ where: { _id: id, isActive: true } });
  }

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    const notification = await Notification.findOne({ where: { _id: id, userId, isActive: true } });
    if (!notification) return null;
    await notification.update({ isRead: true });
    return notification;
  }

  async softDelete(id: string, userId: string): Promise<INotification | null> {
    const notification = await Notification.findOne({ where: { _id: id, userId, isActive: true } });
    if (!notification) return null;
    await notification.update({ isActive: false });
    return notification;
  }
}
