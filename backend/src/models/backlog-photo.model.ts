import { Model, DataTypes } from 'sequelize';
import { sequelize, generateObjectId } from '../db';

export interface IBacklogPhoto {
  _id: string;
  backlogId: string;
  photoType: string;
  photoUrl: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BacklogPhoto extends Model<IBacklogPhoto, Partial<IBacklogPhoto>> implements IBacklogPhoto {
  declare _id: string;
  declare backlogId: string;
  declare photoType: string;
  declare photoUrl: string;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

BacklogPhoto.init(
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
    photoType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    photoUrl: {
      type: DataTypes.TEXT('long'),
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
    modelName: 'BacklogPhoto',
    tableName: 'backlog_photos',
    timestamps: true,
  }
);
