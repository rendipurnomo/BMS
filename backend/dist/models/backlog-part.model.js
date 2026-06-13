"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklogPart = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class BacklogPart extends sequelize_1.Model {
}
exports.BacklogPart = BacklogPart;
BacklogPart.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    backlogId: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
    partNumber: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    partName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    qty: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    supplyQty: {
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
    modelName: 'BacklogPart',
    tableName: 'backlog_parts',
    timestamps: true,
});
