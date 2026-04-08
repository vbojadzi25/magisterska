const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Friend = sequelize.define('Friend', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  friendUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'blocked'),
    allowNull: false,
    defaultValue: 'pending'
  },
  requestedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'friends',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'friendUserId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['friendUserId']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = Friend;