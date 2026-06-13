"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BacklogPhoto = void 0;
const sequelize_1 = require("sequelize");
const db_1 = require("../db");
class BacklogPhoto extends sequelize_1.Model {
}
exports.BacklogPhoto = BacklogPhoto;
BacklogPhoto.init({
    _id: {
        type: sequelize_1.DataTypes.STRING(24),
        primaryKey: true,
        defaultValue: () => (0, db_1.generateObjectId)(),
    },
    backlogId: {
        type: sequelize_1.DataTypes.STRING(24),
        allowNull: false,
    },
    photoType: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    photoUrl: {
        type: sequelize_1.DataTypes.TEXT('long'),
        allowNull: false,
    },
    isActive: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    sequelize: db_1.sequelize,
    modelName: 'BacklogPhoto',
    tableName: 'backlog_photos',
    timestamps: true,
});
