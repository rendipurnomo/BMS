import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface IWorkOrder {
  _id: string;
  backlogId: string;
  woNumber: string;
  targetDate: Date;
  installationPlan: string;
  estimatedFullSupply: Date;
  orderingProgress: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkOrder extends Model<IWorkOrder, Partial<IWorkOrder>> implements IWorkOrder {
  declare _id: string;
  declare backlogId: string;
  declare woNumber: string;
  declare targetDate: Date;
  declare installationPlan: string;
  declare estimatedFullSupply: Date;
  declare orderingProgress: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

WorkOrder.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => generateObjectId(),
    },
    backlogId: {
      type: DataTypes.STRING(24),
      allowNull: false,
      unique: true,
    },
    woNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    targetDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    installationPlan: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estimatedFullSupply: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    orderingProgress: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'WorkOrder',
    tableName: 'work_orders',
    timestamps: true,
  }
);
