module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',
  setupFilesAfterFramework: ['./tests/setup.js'],
  testTimeout: 20000,
  verbose: true,
};
