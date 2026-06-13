"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Unit = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class Unit extends sequelize_1.Model {
}
exports.Unit = Unit;
Unit.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    unitCode: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    unitModel: {
        type: sequelize_1.DataTypes.STRING,
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
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'Unit',
    tableName: 'units',
    timestamps: true,
});
