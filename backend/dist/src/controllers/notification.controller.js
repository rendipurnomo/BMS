"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
class NotificationController {
    notificationService;
    constructor() {
        this.notificationService = new notification_service_1.NotificationService();
    }
    list = async (req, res) => {
        try {
            const userId = req.user._id.toString();
            const notifications = await this.notificationService.getNotificationsForUser(userId);
            return res.status(200).json({
                status: 'success',
                data: { notifications },
            });
        }
        catch (error) {
            return res.status(500).json({ status: 'error', message: error.message });
        }
    };
    markAsRead = async (req, res) => {
        try {
            const userId = req.user._id.toString();
            const notificationId = req.params.id;
            const notification = await this.notificationService.markNotificationAsRead(userId, notificationId);
            return res.status(200).json({
                status: 'success',
                data: { notification },
            });
        }
        catch (error) {
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
exports.NotificationController = NotificationController;
