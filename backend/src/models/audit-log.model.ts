import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface IAuditLog {
  _id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  actionBy: string;
  details: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class AuditLog extends Model<IAuditLog, Partial<IAuditLog>> implements IAuditLog {
  declare _id: string;
  declare action: string;
  declare resource: string;
  declare resourceId: string | null;
  declare actionBy: string;
  declare details: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AuditLog.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => generateObjectId(),
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    resourceId: {
      type: DataTypes.STRING(24),
      allowNull: true,
      defaultValue: null,
    },
    actionBy: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'AuditLog',
    tableName: 'audit_logs',
    timestamps: true,
  }
);
