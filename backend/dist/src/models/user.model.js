"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class User extends sequelize_1.Model {
}
exports.User = User;
User.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    nrp: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('ADMIN', 'PLANNER', 'GL', 'MEKANIK'),
        allowNull: false,
    },
    site: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    section: {
        type: sequelize_1.DataTypes.ENUM('WHEEL', 'TRACK', 'SUPPORT'),
        allowNull: false,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
});
