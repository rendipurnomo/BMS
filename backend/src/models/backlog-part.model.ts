import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface IBacklogPart {
  _id: string;
  backlogId: string;
  partNumber: string;
  partName: string;
  qty: number;
  supplyQty: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BacklogPart extends Model<IBacklogPart, Partial<IBacklogPart>> implements IBacklogPart {
  declare _id: string;
  declare backlogId: string;
  declare partNumber: string;
  declare partName: string;
  declare qty: number;
  declare supplyQty: number;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BacklogPart.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => generateObjectId(),
    },
    backlogId: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
    partNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    partName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    supplyQty: {
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
    modelName: 'BacklogPart',
    tableName: 'backlog_parts',
    timestamps: true,
  }
);
