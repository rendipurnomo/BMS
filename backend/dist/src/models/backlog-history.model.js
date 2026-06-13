"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklogHistory = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class BacklogHistory extends sequelize_1.Model {
}
exports.BacklogHistory = BacklogHistory;
BacklogHistory.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    backlogId: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
    fromStatus: {
        type: sequelize_1.DataTypes.ENUM('WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'PLANNING', 'ORDERING_PART', 'PARTIAL_SUPPLY', 'FULL_SUPPLY', 'INSTALLATION', 'COMPLETED'),
        allowNull: true,
        defaultValue: null,
    },
    toStatus: {
        type: sequelize_1.DataTypes.ENUM('WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'PLANNING', 'ORDERING_PART', 'PARTIAL_SUPPLY', 'FULL_SUPPLY', 'INSTALLATION', 'COMPLETED'),
        allowNull: false,
    },
    actionBy: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'BacklogHistory',
    tableName: 'backlog_histories',
    timestamps: true,
});
