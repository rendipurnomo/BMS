"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class Notification extends sequelize_1.Model {
}
exports.Notification = Notification;
Notification.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    userId: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    isRead: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
});
