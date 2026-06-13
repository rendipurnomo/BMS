import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export type BacklogStatus =
  | 'WAITING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PLANNING'
  | 'ORDERING_PART'
  | 'PARTIAL_SUPPLY'
  | 'FULL_SUPPLY'
  | 'INSTALLATION'
  | 'COMPLETED';

export interface IBacklog {
  _id: string;
  backlogNo: string;
  unitId: string;
  site: string;
  section: string;
  hourmeter: number;
  objectDown: 'SCHEDULE INSPECTION' | 'SERVICE' | 'BREAKDOWN';
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  damageType: string;
  description: string;
  status: BacklogStatus;
  createdBy: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Backlog extends Model<IBacklog, Partial<IBacklog>> implements IBacklog {
  declare _id: string;
  declare backlogNo: string;
  declare unitId: string;
  declare site: string;
  declare section: string;
  declare hourmeter: number;
  declare objectDown: 'SCHEDULE INSPECTION' | 'SERVICE' | 'BREAKDOWN';
  declare priority: 'P1' | 'P2' | 'P3' | 'P4';
  declare damageType: string;
  declare description: string;
  declare status: BacklogStatus;
  declare createdBy: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Backlog.init(
  {
    _id: {
      type: DataTypes.STRING(24),
      primaryKey: true,
      defaultValue: () => generateObjectId(),
    },
    backlogNo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    unitId: {
      type: DataTypes.STRING(24),
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
    hourmeter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    objectDown: {
      type: DataTypes.ENUM('SCHEDULE INSPECTION', 'SERVICE', 'BREAKDOWN'),
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('P1', 'P2', 'P3', 'P4'),
      allowNull: false,
    },
    damageType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'WAITING_APPROVAL',
        'APPROVED',
        'REJECTED',
        'PLANNING',
        'ORDERING_PART',
        'PARTIAL_SUPPLY',
        'FULL_SUPPLY',
        'INSTALLATION',
        'COMPLETED'
      ),
      allowNull: false,
      defaultValue: 'WAITING_APPROVAL',
    },
    createdBy: {
      type: DataTypes.STRING(24),
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
    modelName: 'Backlog',
    tableName: 'backlogs',
    timestamps: true,
  }
);
