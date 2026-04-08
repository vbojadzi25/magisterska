module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add phone verification fields to users table
    await queryInterface.addColumn('users', 'phoneVerificationCode', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'phoneVerificationCodeExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'profileImageUrl', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'notificationSettings', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        pushNotifications: true,
        emailNotifications: true,
        paymentRequests: true,
        friendRequests: true
      }
    });

    // Create Friends table
    await queryInterface.createTable('friends', {
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
      friendUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'accepted', 'blocked'),
        allowNull: false,
        defaultValue: 'pending'
      },
      requestedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      acceptedAt: {
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

    // Create Contacts table for synced contacts
    await queryInterface.createTable('contacts', {
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
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contactName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      matchedUserId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      invitedAt: {
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

    // Update transactions table for social features
    await queryInterface.addColumn('transactions', 'privacy', {
      type: Sequelize.ENUM('public', 'friends', 'private'),
      allowNull: false,
      defaultValue: 'friends'
    });

    await queryInterface.addColumn('transactions', 'emoji', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('transactions', 'isRequest', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('transactions', 'requestMessage', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('transactions', 'requestExpiresAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Create Activity Feed table
    await queryInterface.createTable('activity_feed', {
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
        }
      },
      actorUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      targetUserId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      transactionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'transactions',
          key: 'id'
        }
      },
      type: {
        type: Sequelize.ENUM('payment', 'request', 'friend_request', 'friend_accepted', 'payment_completed'),
        allowNull: false
      },
      privacy: {
        type: Sequelize.ENUM('public', 'friends', 'private'),
        allowNull: false,
        defaultValue: 'friends'
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

    // Add indexes
    await queryInterface.addIndex('friends', ['userId']);
    await queryInterface.addIndex('friends', ['friendUserId']);
    await queryInterface.addIndex('friends', ['userId', 'friendUserId'], { unique: true });
    await queryInterface.addIndex('friends', ['status']);

    await queryInterface.addIndex('contacts', ['userId']);
    await queryInterface.addIndex('contacts', ['phoneNumber']);
    await queryInterface.addIndex('contacts', ['matchedUserId']);

    await queryInterface.addIndex('activity_feed', ['userId']);
    await queryInterface.addIndex('activity_feed', ['actorUserId']);
    await queryInterface.addIndex('activity_feed', ['createdAt']);
    await queryInterface.addIndex('activity_feed', ['type']);
    await queryInterface.addIndex('activity_feed', ['privacy']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('users', 'phoneVerificationCode');
    await queryInterface.removeColumn('users', 'phoneVerificationCodeExpiresAt');
    await queryInterface.removeColumn('users', 'profileImageUrl');
    await queryInterface.removeColumn('users', 'bio');
    await queryInterface.removeColumn('users', 'notificationSettings');

    await queryInterface.removeColumn('transactions', 'privacy');
    await queryInterface.removeColumn('transactions', 'emoji');
    await queryInterface.removeColumn('transactions', 'isRequest');
    await queryInterface.removeColumn('transactions', 'requestMessage');
    await queryInterface.removeColumn('transactions', 'requestExpiresAt');

    // Drop tables
    await queryInterface.dropTable('activity_feed');
    await queryInterface.dropTable('contacts');
    await queryInterface.dropTable('friends');
  }
};