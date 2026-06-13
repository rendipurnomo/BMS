import { NotificationRepository } from '../repositories/notification.repository';
import { UserRepository } from '../repositories/user.repository';
import { INotification } from '../models/notification.model';

export class NotificationService {
  private notificationRepository: NotificationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Send a notification to a specific user.
   */
  async sendNotificationToUser(userId: string, title: string, message: string): Promise<INotification> {
    return this.notificationRepository.create({
      userId: userId as any,
      title,
      message,
      isRead: false,
      isActive: true,
    });
  }

  /**
   * Dispatches notifications to all active users matching the role, site, and optional section criteria.
   */
  async sendNotificationToRole(
    role: 'ADMIN' | 'PLANNER' | 'GL' | 'MEKANIK',
    criteria: { site?: string; section?: string },
    title: string,
    message: string
  ): Promise<INotification[]> {
    // 1. Fetch all active users
    const allUsers = await this.userRepository.findAll();

    // 2. Filter based on role, site, and section
    const targetUsers = allUsers.filter((user) => {
      if (user.role !== role) return false;
      if (criteria.site && user.site !== criteria.site) return false;
      if (criteria.section && user.section !== criteria.section) return false;
      return true;
    });

    // 3. Create a notification document for each user
    const notifications = await Promise.all(
      targetUsers.map((user) =>
        this.notificationRepository.create({
          userId: user._id as any,
          title,
          message,
          isRead: false,
          isActive: true,
        })
      )
    );

    return notifications;
  }

  /**
   * Retrieve all notifications for a specific user.
   */
  async getNotificationsForUser(userId: string): Promise<INotification[]> {
    return this.notificationRepository.findByUserId(userId);
  }

  /**
   * Mark a notification as read, ensuring it belongs to the requesting user.
   */
  async markNotificationAsRead(userId: string, notificationId: string): Promise<INotification | null> {
    const notification = await this.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.userId.toString() !== userId) {
      throw new Error('Unauthorized');
    }

    return this.notificationRepository.markAsRead(notificationId, userId);
  }
}
