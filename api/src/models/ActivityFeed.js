const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ActivityFeed = sequelize.define('ActivityFeed', {
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
  actorUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  targetUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  transactionId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('payment', 'request', 'friend_request', 'friend_accepted', 'payment_completed'),
    allowNull: false
  },
  privacy: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'friends'
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
  tableName: 'activity_feed',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['actorUserId']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['type']
    },
    {
      fields: ['privacy']
    }
  ]
});

module.exports = ActivityFeed;