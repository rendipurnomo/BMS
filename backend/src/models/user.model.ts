import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface IUser {
  _id: string;
  nrp: string;
  name: string;
  passwordHash: string;
  role: 'ADMIN' | 'PLANNER' | 'GL' | 'MEKANIK';
  site: string;
  section: 'WHEEL' | 'TRACK' | 'SUPPORT';
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Model<IUser, Partial<IUser>> implements IUser {
  declare _id: string;
  declare nrp: string;
  declare name: string;
  declare passwordHash: string;
  declare role: 'ADMIN' | 'PLANNER' | 'GL' | 'MEKANIK';
  declare site: string;
  declare section: 'WHEEL' | 'TRACK' | 'SUPPORT';
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

User.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => generateObjectId(),
    },
    nrp: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'PLANNER', 'GL', 'MEKANIK'),
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    section: {
      type: DataTypes.ENUM('WHEEL', 'TRACK', 'SUPPORT'),
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
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  }
);
