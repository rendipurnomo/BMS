"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLog = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class AuditLog extends sequelize_1.Model {
}
exports.AuditLog = AuditLog;
AuditLog.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    action: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    resource: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    resourceId: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: true,
        defaultValue: null,
    },
    actionBy: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
    details: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
});
