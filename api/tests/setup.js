/**
 * Runs in each test worker (setupFilesAfterFramework).
 * Sets env vars and wires up beforeEach / afterAll hooks.
 */

'use strict';

// Ensure env vars are set before any module is loaded
process.env.NODE_ENV = 'test';
process.env.PAYMENT_MODE = 'tpp';
process.env.TPP_BASE_URL = 'http://localhost:3001';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';

const {
  sequelize,
  User,
  BankAccount,
  Transaction,
  Friend,
  Contact,
  ActivityFeed,
} = require('../src/models');

// Truncate all user-data tables before each test (Banks are preserved)
beforeEach(async () => {
  // Delete in reverse-dependency order to respect FK constraints
  await ActivityFeed.destroy({ where: {} });
  await Transaction.destroy({ where: {} });
  await Friend.destroy({ where: {} });
  await Contact.destroy({ where: {} });
  await BankAccount.destroy({ where: {} });
  await User.destroy({ where: {} });
});

// Close the Sequelize connection pool after all tests in this file
afterAll(async () => {
  await sequelize.close();
});
