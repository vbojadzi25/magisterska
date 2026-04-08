const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BankAccount = sequelize.define('BankAccount', {
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
    },
    onDelete: 'CASCADE'
  },
  bankId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'banks',
      key: 'id'
    }
  },
  accountNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  iban: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [15, 34] // IBAN length varies by country
    }
  },
  accountName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountType: {
    type: DataTypes.ENUM('checking', 'savings', 'business'),
    allowNull: false,
    defaultValue: 'checking'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'MKD'
  },
  balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    comment: 'Current balance from last sync'
  },
  availableBalance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  lastBalanceUpdate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Open Banking fields
  consentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Open Banking consent ID'
  },
  consentExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  // Encrypted sensitive data
  encryptedDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Encrypted account details and credentials'
  },
  // Account linking verification
  verificationMethod: {
    type: DataTypes.ENUM('micro_deposit', 'instant_verification', 'manual_verification'),
    allowNull: true
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'in_progress', 'verified', 'failed'),
    defaultValue: 'pending'
  },
  verificationAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastVerificationAttempt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'bank_accounts',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['bankId']
    },
    {
      fields: ['accountNumber', 'bankId'],
      unique: true
    },
    {
      fields: ['isDefault']
    },
    {
      fields: ['isVerified']
    }
  ],
  hooks: {
    beforeCreate: async (bankAccount) => {
      // Ensure only one default account per user
      if (bankAccount.isDefault) {
        await BankAccount.update(
          { isDefault: false },
          { where: { userId: bankAccount.userId } }
        );
      }
    },
    beforeUpdate: async (bankAccount) => {
      if (bankAccount.changed('isDefault') && bankAccount.isDefault) {
        await BankAccount.update(
          { isDefault: false },
          {
            where: {
              userId: bankAccount.userId,
              id: { [sequelize.Sequelize.Op.ne]: bankAccount.id }
            }
          }
        );
      }
    }
  }
});

module.exports = BankAccount;