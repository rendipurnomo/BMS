import { NotificationService } from '../services/notification.service';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  list = async (req: any, res: any): Promise<void> => {
    try {
      const userId = req.user._id.toString();
      const notifications = await this.notificationService.getNotificationsForUser(userId);
      return res.status(200).json({
        status: 'success',
        data: { notifications },
      });
    } catch (error: any) {
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };

  markAsRead = async (req: any, res: any): Promise<void> => {
    try {
      const userId = req.user._id.toString();
      const notificationId = req.params.id;
      const notification = await this.notificationService.markNotificationAsRead(userId, notificationId);
      return res.status(200).json({
        status: 'success',
        data: { notification },
      });
    } catch (error: any) {
      if (error.message === 'Notification not found') {
        return res.status(404).json({ status: 'fail', message: error.message });
      }
      if (error.message === 'Unauthorized') {
        return res.status(403).json({ status: 'fail', message: 'Unauthorized access to notification' });
      }
      return res.status(500).json({ status: 'error', message: error.message });
    }
  };
}
