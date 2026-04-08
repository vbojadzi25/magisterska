const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique transaction reference'
  },
  fromUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  toUserId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  fromBankAccountId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bank_accounts',
      key: 'id'
    }
  },
  toBankAccountId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bank_accounts',
      key: 'id'
    }
  },
  // External recipient (for non-Denar users)
  toAccountNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  toBankCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  toAccountName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Transaction amounts
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'MKD'
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  exchangeRate: {
    type: DataTypes.DECIMAL(10, 6),
    allowNull: true,
    defaultValue: 1.000000
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: 'amount + fee'
  },
  // Transaction details
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  memo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending'
  },
  type: {
    type: DataTypes.ENUM('p2p_transfer', 'bank_transfer', 'merchant_payment', 'top_up', 'withdrawal'),
    allowNull: false,
    defaultValue: 'p2p_transfer'
  },
  // External banking references
  externalReference: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Bank provided reference'
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Open Banking payment ID'
  },
  // Processing timestamps
  initiatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  failedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Error handling
  errorCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  retryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  maxRetries: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  // Fraud and compliance
  riskScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  },
  complianceChecked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  complianceNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Social features
  privacy: {
    type: DataTypes.ENUM('public', 'friends', 'private'),
    allowNull: false,
    defaultValue: 'friends'
  },
  emoji: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRequest: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requestMessage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  requestExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Metadata
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  indexes: [
    {
      fields: ['reference'],
      unique: true
    },
    {
      fields: ['fromUserId']
    },
    {
      fields: ['toUserId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['fromUserId', 'status', 'createdAt']
    },
    {
      fields: ['toUserId', 'status', 'createdAt']
    }
  ],
  hooks: {
    beforeValidate: (transaction) => {
      // Calculate total amount
      if (transaction.amount && transaction.fee !== undefined) {
        transaction.totalAmount = parseFloat(transaction.amount) + parseFloat(transaction.fee || 0);
      }

      // Generate reference if not provided
      if (!transaction.reference) {
        transaction.reference = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      }
    }
  }
});

module.exports = Transaction;