"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkOrder = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class WorkOrder extends sequelize_1.Model {
}
exports.WorkOrder = WorkOrder;
WorkOrder.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    backlogId: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
        unique: true,
    },
    woNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    targetDate: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    installationPlan: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    estimatedFullSupply: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    orderingProgress: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'WorkOrder',
    tableName: 'work_orders',
    timestamps: true,
});
