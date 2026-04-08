const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 100]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 50]
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      is: /^\+389[0-9]{8}$/ // Macedonian phone number format
    }
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      isBefore: new Date().toISOString() // Must be before today
    }
  },
  nationality: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'MK'
  },
  profilePicture: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  kycStatus: {
    type: DataTypes.ENUM('pending', 'in_progress', 'approved', 'rejected', 'expired'),
    defaultValue: 'pending'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  emailVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phoneVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  twoFactorEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFactorSecret: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  phoneVerificationCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phoneVerificationCodeExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  profileImageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notificationSettings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      pushNotifications: true,
      emailNotifications: true,
      paymentRequests: true,
      friendRequests: true
    }
  },
  pushToken: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;
  delete values.twoFactorSecret;
  delete values.phoneVerificationCode;

  delete values.phoneVerificationCodeExpiresAt;

  // Add computed name field
  values.name = `${this.firstName} ${this.lastName}`;

  return values;
};

module.exports = User;