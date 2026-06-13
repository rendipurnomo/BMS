"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const notification_model_1 = require("../models/notification.model");
class NotificationRepository {
    async create(notificationData) {
        return notification_model_1.Notification.create(notificationData);
    }
    async findByUserId(userId) {
        return notification_model_1.Notification.findAll({
            where: { userId, isActive: true },
            order: [['createdAt', 'DESC']],
        });
    }
    async findById(id) {
        return notification_model_1.Notification.findOne({ where: { _id: id, isActive: true } });
    }
    async markAsRead(id, userId) {
        const notification = await notification_model_1.Notification.findOne({ where: { _id: id, userId, isActive: true } });
        if (!notification)
            return null;
        await notification.update({ isRead: true });
        return notification;
    }
    async softDelete(id, userId) {
        const notification = await notification_model_1.Notification.findOne({ where: { _id: id, userId, isActive: true } });
        if (!notification)
            return null;
        await notification.update({ isActive: false });
        return notification;
    }
}
exports.NotificationRepository = NotificationRepository;
