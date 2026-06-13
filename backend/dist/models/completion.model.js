"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Completion = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class Completion extends sequelize_1.Model {
}
exports.Completion = Completion;
Completion.init({
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
    completionHourmeter: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    manpower: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    remarks: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'Completion',
    tableName: 'completions',
    timestamps: true,
});
