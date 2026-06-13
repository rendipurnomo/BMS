import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface IUnit {
  _id: string;
  unitCode: string;
  unitModel: string;
  site: string;
  section: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Unit extends Model<IUnit, Partial<IUnit>> implements IUnit {
  declare _id: string;
  declare unitCode: string;
  declare unitModel: string;
  declare site: string;
  declare section: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Unit.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => generateObjectId(),
    },
    unitCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    unitModel: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    section: {
      type: DataTypes.STRING,
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
    modelName: 'Unit',
    tableName: 'units',
    timestamps: true,
  }
);
