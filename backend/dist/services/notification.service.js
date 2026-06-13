"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_repository_1 = require("../repositories/notification.repository");
const user_repository_1 = require("../repositories/user.repository");
class NotificationService {
    notificationRepository;
    userRepository;
    constructor() {
        this.notificationRepository = new notification_repository_1.NotificationRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
    /**
     * Send a notification to a specific user.
     */
    async sendNotificationToUser(userId, title, message) {
        return this.notificationRepository.create({
            userId: userId,
            title,
            message,
            isRead: false,
            isActive: true,
        });
    }
    /**
     * Dispatches notifications to all active users matching the role, site, and optional section criteria.
     */
    async sendNotificationToRole(role, criteria, title, message) {
        // 1. Fetch all active users
        const allUsers = await this.userRepository.findAll();
        // 2. Filter based on role, site, and section
        const targetUsers = allUsers.filter((user) => {
            if (user.role !== role)
                return false;
            if (criteria.site && user.site !== criteria.site)
                return false;
            if (criteria.section && user.section !== criteria.section)
                return false;
            return true;
        });
        // 3. Create a notification document for each user
        const notifications = await Promise.all(targetUsers.map((user) => this.notificationRepository.create({
            userId: user._id,
            title,
            message,
            isRead: false,
            isActive: true,
        })));
        return notifications;
    }
    /**
     * Retrieve all notifications for a specific user.
     */
    async getNotificationsForUser(userId) {
        return this.notificationRepository.findByUserId(userId);
    }
    /**
     * Mark a notification as read, ensuring it belongs to the requesting user.
     */
    async markNotificationAsRead(userId, notificationId) {
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
exports.NotificationService = NotificationService;
