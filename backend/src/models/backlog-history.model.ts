import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';
import { BacklogStatus } from './backlog.model';

export interface IBacklogHistory {
  _id: string;
  backlogId: string;
  fromStatus: BacklogStatus | null;
  toStatus: BacklogStatus;
  actionBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BacklogHistory extends Model<IBacklogHistory, Partial<IBacklogHistory>> implements IBacklogHistory {
  declare _id: string;
  declare backlogId: string;
  declare fromStatus: BacklogStatus | null;
  declare toStatus: BacklogStatus;
  declare actionBy: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BacklogHistory.init(
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
    fromStatus: {
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
      allowNull: true,
      defaultValue: null,
    },
    toStatus: {
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
    },
    actionBy: {
      type: DataTypes.STRING(24),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'BacklogHistory',
    tableName: 'backlog_histories',
    timestamps: true,
  }
);
