import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface INotification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Notification extends Model<INotification, Partial<INotification>> implements INotification {
  declare _id: string;
  declare userId: string;
  declare title: string;
  declare message: string;
  declare isRead: boolean;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => generateObjectId(),
    },
    userId: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
  }
);
