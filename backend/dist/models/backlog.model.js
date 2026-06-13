"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Backlog = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class Backlog extends sequelize_1.Model {
}
exports.Backlog = Backlog;
Backlog.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    backlogNo: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    unitId: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
    site: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    section: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    hourmeter: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    objectDown: {
        type: sequelize_1.DataTypes.ENUM('SCHEDULE INSPECTION', 'SERVICE', 'BREAKDOWN'),
        allowNull: false,
    },
    priority: {
        type: sequelize_1.DataTypes.ENUM('P1', 'P2', 'P3', 'P4'),
        allowNull: false,
    },
    damageType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('WAITING_APPROVAL', 'APPROVED', 'REJECTED', 'PLANNING', 'ORDERING_PART', 'PARTIAL_SUPPLY', 'FULL_SUPPLY', 'INSTALLATION', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'WAITING_APPROVAL',
    },
    createdBy: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'Backlog',
    tableName: 'backlogs',
    timestamps: true,
});
