require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'denar_user',
    password: process.env.DB_PASSWORD || 'denar_password_2024',
    database: process.env.DB_NAME || 'denar_dev',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  },
  test: {
    username: process.env.DB_USER || 'denar_user',
    password: process.env.DB_PASSWORD || 'denar_password_2024',
    database: 'denar_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
};