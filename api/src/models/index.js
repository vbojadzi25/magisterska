const { sequelize } = require('../config/database');
const User = require('./User');
const Bank = require('./Bank');
const BankAccount = require('./BankAccount');
const Transaction = require('./Transaction');
const Friend = require('./Friend');
const Contact = require('./Contact');
const ActivityFeed = require('./ActivityFeed');

// Define associations
User.hasMany(BankAccount, {
  foreignKey: 'userId',
  as: 'bankAccounts',
  onDelete: 'CASCADE'
});

BankAccount.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Bank.hasMany(BankAccount, {
  foreignKey: 'bankId',
  as: 'bankAccounts'
});

BankAccount.belongsTo(Bank, {
  foreignKey: 'bankId',
  as: 'bank'
});

// Transaction associations
User.hasMany(Transaction, {
  foreignKey: 'fromUserId',
  as: 'sentTransactions'
});

User.hasMany(Transaction, {
  foreignKey: 'toUserId',
  as: 'receivedTransactions'
});

Transaction.belongsTo(User, {
  foreignKey: 'fromUserId',
  as: 'fromUser'
});

Transaction.belongsTo(User, {
  foreignKey: 'toUserId',
  as: 'toUser'
});

BankAccount.hasMany(Transaction, {
  foreignKey: 'fromBankAccountId',
  as: 'outgoingTransactions'
});

BankAccount.hasMany(Transaction, {
  foreignKey: 'toBankAccountId',
  as: 'incomingTransactions'
});

Transaction.belongsTo(BankAccount, {
  foreignKey: 'fromBankAccountId',
  as: 'fromBankAccount'
});

Transaction.belongsTo(BankAccount, {
  foreignKey: 'toBankAccountId',
  as: 'toBankAccount'
});

// Friend associations
User.hasMany(Friend, {
  foreignKey: 'userId',
  as: 'sentFriendRequests'
});

User.hasMany(Friend, {
  foreignKey: 'friendUserId',
  as: 'receivedFriendRequests'
});

Friend.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Friend.belongsTo(User, {
  foreignKey: 'friendUserId',
  as: 'friendUser'
});

// Contact associations
User.hasMany(Contact, {
  foreignKey: 'userId',
  as: 'contacts'
});

Contact.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Contact.belongsTo(User, {
  foreignKey: 'matchedUserId',
  as: 'matchedUser'
});

// ActivityFeed associations
User.hasMany(ActivityFeed, {
  foreignKey: 'userId',
  as: 'activityFeed'
});

User.hasMany(ActivityFeed, {
  foreignKey: 'actorUserId',
  as: 'actorActivities'
});

ActivityFeed.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

ActivityFeed.belongsTo(User, {
  foreignKey: 'actorUserId',
  as: 'actor'
});

ActivityFeed.belongsTo(User, {
  foreignKey: 'targetUserId',
  as: 'target'
});

ActivityFeed.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  as: 'transaction'
});

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Bank,
  BankAccount,
  Transaction,
  Friend,
  Contact,
  ActivityFeed
};