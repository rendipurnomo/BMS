import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface ICompletion {
  _id: string;
  backlogId: string;
  completionHourmeter: number;
  manpower: string;
  remarks: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Completion extends Model<ICompletion, Partial<ICompletion>> implements ICompletion {
  declare _id: string;
  declare backlogId: string;
  declare completionHourmeter: number;
  declare manpower: string;
  declare remarks: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Completion.init(
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
    completionHourmeter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    manpower: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: 'Completion',
    tableName: 'completions',
    timestamps: true,
  }
);
