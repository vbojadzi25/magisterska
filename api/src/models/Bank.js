const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bank = sequelize.define('Bank', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  swiftCode: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [8, 11]
    }
  },
  nbrCode: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'National Bank of Republic of Macedonia code'
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'MK'
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  supportedCurrencies: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['MKD']
  },
  apiConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Banking API configuration'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  supportsPSD2: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  supportsSEPA: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  maxTransactionAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  dailyTransactionLimit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  monthlyTransactionLimit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  },
  transactionFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  interBankFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  processingTime: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Typical processing time (e.g., "instant", "1-2 hours", "1 business day")'
  }
}, {
  tableName: 'banks',
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['country']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Bank;