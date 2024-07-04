/* eslint-disable @typescript-eslint/no-unused-vars */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import responses from '../response';
import User from './Userr';

type PasswordHistoryAttributes = {
  id: number;
  userId: number;
  remarks?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type PasswordHistoryCreationAttributes = Omit<PasswordHistoryAttributes, 'id'>;

export interface PasswordHistoryInstance extends Model<PasswordHistoryAttributes, PasswordHistoryCreationAttributes>, PasswordHistoryAttributes {}

const PasswordHistory = sequelize.define<PasswordHistoryInstance>('passwordHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userid',
    references: {
      model: User,
      key: 'id',
    },
  },
  remarks: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'createdat',
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'updatedat',
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'password_history',
});
 
PasswordHistory.belongsTo(User, { foreignKey: 'userId' });
 
export default PasswordHistory;