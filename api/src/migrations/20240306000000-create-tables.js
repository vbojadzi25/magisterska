module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'MK'
      },
      profilePicture: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      kycStatus: {
        type: Sequelize.ENUM('pending', 'in_progress', 'approved', 'rejected', 'expired'),
        defaultValue: 'pending'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      emailVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      phoneVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      twoFactorEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      twoFactorSecret: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Banks table
    await queryInterface.createTable('banks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      code: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      swiftCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      nbrCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'MK'
      },
      logoUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      supportedCurrencies: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: ['MKD']
      },
      apiConfig: {
        type: Sequelize.JSON,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      supportsPSD2: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      supportsSEPA: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      maxTransactionAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      dailyTransactionLimit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      monthlyTransactionLimit: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      transactionFee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      interBankFee: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      processingTime: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create BankAccounts table
    await queryInterface.createTable('bank_accounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      bankId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'banks',
          key: 'id'
        }
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      iban: {
        type: Sequelize.STRING,
        allowNull: true
      },
      accountName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      accountType: {
        type: Sequelize.ENUM('checking', 'savings', 'business'),
        allowNull: false,
        defaultValue: 'checking'
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'MKD'
      },
      balance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      availableBalance: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true
      },
      lastBalanceUpdate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      consentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      consentExpiresAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      encryptedDetails: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      verificationMethod: {
        type: Sequelize.ENUM('micro_deposit', 'instant_verification', 'manual_verification'),
        allowNull: true
      },
      verificationStatus: {
        type: Sequelize.ENUM('pending', 'in_progress', 'verified', 'failed'),
        defaultValue: 'pending'
      },
      verificationAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastVerificationAttempt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create Transactions table
    await queryInterface.createTable('transactions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      reference: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      fromUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      toUserId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      fromBankAccountId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'bank_accounts',
          key: 'id'
        }
      },
      toBankAccountId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'bank_accounts',
          key: 'id'
        }
      },
      toAccountNumber: {
        type: Sequelize.STRING,
        allowNull: true
      },
      toBankCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      toAccountName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: 'MKD'
      },
      fee: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(10, 6),
        allowNull: true,
        defaultValue: 1.000000
      },
      totalAmount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      memo: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      type: {
        type: Sequelize.ENUM('p2p_transfer', 'bank_transfer', 'merchant_payment', 'top_up', 'withdrawal'),
        allowNull: false,
        defaultValue: 'p2p_transfer'
      },
      externalReference: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paymentId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      initiatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      failedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      errorCode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        defaultValue: 3
      },
      riskScore: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      complianceChecked: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      complianceNotes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['phoneNumber']);
    await queryInterface.addIndex('users', ['kycStatus']);

    await queryInterface.addIndex('banks', ['code']);
    await queryInterface.addIndex('banks', ['isActive']);

    await queryInterface.addIndex('bank_accounts', ['userId']);
    await queryInterface.addIndex('bank_accounts', ['bankId']);
    await queryInterface.addIndex('bank_accounts', ['accountNumber', 'bankId'], { unique: true });
    await queryInterface.addIndex('bank_accounts', ['isDefault']);

    await queryInterface.addIndex('transactions', ['reference'], { unique: true });
    await queryInterface.addIndex('transactions', ['fromUserId']);
    await queryInterface.addIndex('transactions', ['toUserId']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('bank_accounts');
    await queryInterface.dropTable('banks');
    await queryInterface.dropTable('users');
  }
};